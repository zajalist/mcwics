// ── LockStep Server ─────────────────────────────────────────
// Express + Socket.io server for multiplayer puzzle game
// Server-authoritative: all state lives here, clients get broadcasts.

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { RoomManager } = require('./roomManager');
const { GameEngine } = require('./gameEngine');

// ── Load scenario data ────────────────────────────────────
const scenarioPath = path.join(__dirname, '..', 'scenarios', 'mvp.json');
const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, 'utf-8'));

// ── Express + Socket.io setup ─────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  maxHttpBufferSize: 5e6 // 5 MB — custom scenarios can be large
});

const roomManager = new RoomManager();
const gameEngine = new GameEngine(scenarioData);

// ── REST endpoint: list available scenarios ───────────────
app.get('/api/scenarios', (_req, res) => {
  const list = scenarioData.scenarios.map(s => ({
    scenarioId: s.scenarioId,
    title: s.title,
    description: s.description
  }));
  res.json(list);
});

// ── Helper: get engine for a room (custom or global) ──────
function getEngine(room) {
  return room?.customEngine || gameEngine;
}

// ── Helper: broadcast room state to all players ───────────
function broadcastRoomState(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  const engine = getEngine(room);
  const clientState = engine.buildClientState(room);
  io.to(roomCode).emit('ROOM_UPDATED', clientState);
}

// ── Socket.io event handling ──────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── CREATE ROOM ───────────────────────────────────────
  socket.on('CREATE_ROOM', ({ scenarioId, playerName, customScenarioJson }, cb) => {
    try {
      console.log('[CREATE_ROOM]', { scenarioId, hasCustom: !!customScenarioJson, playerName });
      let scenario;
      let customEngine = null;

      if (customScenarioJson) {
        // Client supplied a full scenario JSON blob (from Firestore / editor)
        try {
          const data = typeof customScenarioJson === 'string'
            ? JSON.parse(customScenarioJson)
            : customScenarioJson;
          scenario = data.scenarios?.[0];
          if (!scenario) return cb({ error: 'Invalid custom scenario' });
          // Create a dedicated GameEngine for this custom scenario
          customEngine = new GameEngine(data);
        } catch (err) {
          console.error('[CREATE_ROOM] Parse error:', err.message);
          return cb({ error: 'Failed to parse custom scenario' });
        }
      } else {
        scenario = scenarioData.scenarios.find(s => s.scenarioId === scenarioId);
        if (!scenario) return cb({ error: 'Unknown scenario' });
      }

      const room = roomManager.createRoom(scenario.scenarioId, scenario);
      // Attach custom engine to the room if provided
      if (customEngine) {
        room.customEngine = customEngine;
      }
      const player = roomManager.addPlayer(room.roomCode, socket.id, playerName, true);
      socket.join(room.roomCode);
      socket.data.roomCode = room.roomCode;

      cb({ roomCode: room.roomCode, playerId: player.id });
      broadcastRoomState(room.roomCode);
    } catch (err) {
      console.error('[CREATE_ROOM] Unhandled error:', err);
      try { cb({ error: 'Server error creating room' }); } catch (_) { /* ignore */ }
    }
  });

  // ── JOIN ROOM ─────────────────────────────────────────
  socket.on('JOIN_ROOM', ({ roomCode, playerName }, cb) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return cb({ error: 'Room not found' });
    if (room.phase === 'playing') return cb({ error: 'Game already in progress' });
    if (room.players.length >= 6) return cb({ error: 'Room is full' });

    const player = roomManager.addPlayer(roomCode, socket.id, playerName, false);
    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    cb({ roomCode, playerId: player.id });
    broadcastRoomState(roomCode);
  });

  // ── SELECT ROLE ───────────────────────────────────────
  socket.on('SELECT_ROLE', ({ roleId }, cb) => {
    const code = socket.data.roomCode;
    if (!code) return cb?.({ error: 'Not in a room' });

    const result = roomManager.setPlayerRole(code, socket.id, roleId);
    if (result.error) return cb?.({ error: result.error });
    cb?.({ ok: true });
    broadcastRoomState(code);
  });

  // ── START GAME ────────────────────────────────────────
  socket.on('START_GAME', (_, cb) => {
    const code = socket.data.roomCode;
    if (!code) return cb?.({ error: 'Not in a room' });

    const room = roomManager.getRoom(code);
    if (!room) return cb?.({ error: 'Room not found' });

    const player = room.players.find(p => p.id === socket.id);
    if (!player?.isHost) return cb?.({ error: 'Only host can start' });

    // Auto-assign roles to players who haven't chosen
    roomManager.autoAssignRoles(code);

    // Initialize game state from scenario
    const engine = getEngine(room);
    const scenario = engine.scenarioData.scenarios.find(s => s.scenarioId === room.scenarioId);
    engine.initGameState(room, scenario);
    room.phase = 'playing';

    // Assign puzzles to players on the first node after start (will be called again on advance)
    engine.assignPuzzlesToPlayers(room);

    cb?.({ ok: true });
    broadcastRoomState(code);

    // Start timer if scenario has one
    if (scenario.globals.timerSeconds) {
      startTimer(code, room.gameState.timeRemainingSeconds);
    }
  });

  // ── SUBMIT PUZZLE ANSWER ──────────────────────────────
  socket.on('SUBMIT_ANSWER', ({ puzzleId, answer }, cb) => {
    const code = socket.data.roomCode;
    if (!code) return cb?.({ error: 'Not in a room' });

    const room = roomManager.getRoom(code);
    if (!room || room.phase !== 'playing') return cb?.({ error: 'Game not active' });

    const engine = getEngine(room);
    const result = engine.submitAnswer(room, puzzleId, answer);
    cb?.(result);
    broadcastRoomState(code);

    // Check fail conditions
    if (engine.checkFailConditions(room)) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: room.gameState.failReason,
        won: false
      });
      stopTimer(code);
    }
  });

  // ── MAKE CHOICE (choice_node) ─────────────────────────
  socket.on('MAKE_CHOICE', ({ choiceId }, cb) => {
    const code = socket.data.roomCode;
    if (!code) return cb?.({ error: 'Not in a room' });

    const room = roomManager.getRoom(code);
    if (!room || room.phase !== 'playing') return cb?.({ error: 'Game not active' });

    const engine = getEngine(room);
    const result = engine.makeChoice(room, choiceId);
    cb?.(result);
    broadcastRoomState(code);

    // Check if choice led to a win or fail node (or endpoint_node)
    const nodeAfterChoice = engine.getCurrentNode(room);
    if (nodeAfterChoice && (nodeAfterChoice.type === 'win_node' || (nodeAfterChoice.type === 'endpoint_node' && nodeAfterChoice.outcome === 'win'))) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: nodeAfterChoice.story.text,
        won: true,
        title: nodeAfterChoice.story.title,
        mediaUrl: nodeAfterChoice.mediaUrl || '',
      });
      stopTimer(code);
      return;
    }
    if (nodeAfterChoice && (nodeAfterChoice.type === 'fail_node' || (nodeAfterChoice.type === 'endpoint_node' && nodeAfterChoice.outcome === 'fail'))) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: nodeAfterChoice.story.text || 'You failed.',
        won: false,
        title: nodeAfterChoice.story.title || 'Game Over',
        mediaUrl: nodeAfterChoice.mediaUrl || '',
      });
      stopTimer(code);
      return;
    }

    // Assign puzzles on the new node
    engine.assignPuzzlesToPlayers(room);

    // Check fail after choice effects
    if (engine.checkFailConditions(room)) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: room.gameState.failReason,
        won: false
      });
      stopTimer(code);
    }
  });

  // ── ADVANCE NODE (after solving all puzzles) ──────────
  socket.on('ADVANCE_NODE', (_, cb) => {
    const code = socket.data.roomCode;
    if (!code) return cb?.({ error: 'Not in a room' });

    const room = roomManager.getRoom(code);
    if (!room || room.phase !== 'playing') return cb?.({ error: 'Game not active' });

    const engine = getEngine(room);
    const result = engine.advanceNode(room);
    cb?.(result);
    broadcastRoomState(code);

    // Check for win
    const currentNode = engine.getCurrentNode(room);
    if (currentNode && (currentNode.type === 'win_node' || (currentNode.type === 'endpoint_node' && currentNode.outcome === 'win'))) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: currentNode.story.text,
        won: true,
        title: currentNode.story.title,
        mediaUrl: currentNode.mediaUrl || '',
      });
      stopTimer(code);
    }

    // Check for fail node
    if (currentNode && (currentNode.type === 'fail_node' || (currentNode.type === 'endpoint_node' && currentNode.outcome === 'fail'))) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: currentNode.story.text || 'You failed.',
        won: false,
        title: currentNode.story.title || 'Game Over',
        mediaUrl: currentNode.mediaUrl || '',
      });
      stopTimer(code);
    }

    // Check fail
    if (engine.checkFailConditions(room)) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: room.gameState.failReason,
        won: false
      });
      stopTimer(code);
    }
  });

  // ── QUIT GAME (player voluntarily leaves during gameplay) ──
  socket.on('QUIT_GAME', (_, cb) => {
    const code = socket.data.roomCode;
    if (!code) return cb?.({ error: 'Not in a room' });

    const room = roomManager.getRoom(code);
    if (!room) return cb?.({ error: 'Room not found' });

    const playerIdx = room.players.findIndex(p => p.id === socket.id);
    if (playerIdx === -1) return cb?.({ error: 'Player not found' });

    // Remove player
    room.players.splice(playerIdx, 1);

    // If game is playing, reassign puzzles to remaining players
    if (room.phase === 'playing' && room.players.length > 0) {
      const engine = getEngine(room);
      engine.assignPuzzlesToPlayers(room);
    }

    // Leave the socket room
    socket.leave(code);
    socket.data.roomCode = null;

    cb?.({ ok: true });
    broadcastRoomState(code);

    // If no players left, clean up
    if (room.players.length === 0) {
      stopTimer(code);
      roomManager.removeRoom(code);
    }
  });

  // ── DISCONNECT ────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const code = socket.data.roomCode;
    if (code) {
      roomManager.markDisconnected(code, socket.id);
      broadcastRoomState(code);
    }
  });
});

// ── Timer management ────────────────────────────────────
const timers = {};

function startTimer(roomCode, seconds) {
  if (timers[roomCode]) clearInterval(timers[roomCode]);

  timers[roomCode] = setInterval(() => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.phase !== 'playing') {
      stopTimer(roomCode);
      return;
    }
    room.gameState.timeRemainingSeconds -= 1;

    // Apply continuous resource increases based on resource metadata
    const engine = getEngine(room);
    const scenario = engine.scenarioData.scenarios.find(s => s.scenarioId === room.scenarioId);
    if (scenario?.globals?.resourceMetadata) {
      for (const res of scenario.globals.resourceMetadata) {
        if (res.continuousIncrease && res.continuousIncrease > 0) {
          if (room.gameState.vars[res.id] !== undefined) {
            room.gameState.vars[res.id] = Math.min(100, room.gameState.vars[res.id] + res.continuousIncrease);
          }
        }
      }
    } else {
      // Fallback: legacy water increase for old scenarios
      if (room.gameState.vars.water !== undefined) {
        room.gameState.vars.water = Math.min(100, room.gameState.vars.water + 0.15);
      }
    }

    if (room.gameState.timeRemainingSeconds <= 0) {
      room.gameState.timeRemainingSeconds = 0;
      room.gameState.failReason = 'You ran out of time.';
      room.phase = 'ended';
      io.to(roomCode).emit('GAME_OVER', {
        reason: 'You ran out of time.',
        won: false
      });
      stopTimer(roomCode);
    }
    // Broadcast timer ticks every 5 seconds to avoid flooding
    if (room.gameState.timeRemainingSeconds % 5 === 0) {
      broadcastRoomState(roomCode);
    }
  }, 1000);
}

function stopTimer(roomCode) {
  if (timers[roomCode]) {
    clearInterval(timers[roomCode]);
    delete timers[roomCode];
  }
}

// ── Start listening ─────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[LockStep] Server running on http://localhost:${PORT}`);
});
