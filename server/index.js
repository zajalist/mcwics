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
  cors: { origin: '*', methods: ['GET', 'POST'] }
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

// ── Helper: broadcast room state to all players ───────────
function broadcastRoomState(roomCode) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;
  // Send sanitised state (strip answers from puzzles)
  const clientState = gameEngine.buildClientState(room);
  io.to(roomCode).emit('ROOM_UPDATED', clientState);
}

// ── Socket.io event handling ──────────────────────────────
io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── CREATE ROOM ───────────────────────────────────────
  socket.on('CREATE_ROOM', ({ scenarioId, playerName }, cb) => {
    const scenario = scenarioData.scenarios.find(s => s.scenarioId === scenarioId);
    if (!scenario) return cb({ error: 'Unknown scenario' });

    const room = roomManager.createRoom(scenarioId, scenario);
    const player = roomManager.addPlayer(room.roomCode, socket.id, playerName, true);
    socket.join(room.roomCode);
    socket.data.roomCode = room.roomCode;

    cb({ roomCode: room.roomCode, playerId: player.id });
    broadcastRoomState(room.roomCode);
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
    const scenario = scenarioData.scenarios.find(s => s.scenarioId === room.scenarioId);
    gameEngine.initGameState(room, scenario);
    room.phase = 'playing';

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

    const result = gameEngine.submitAnswer(room, puzzleId, answer);
    cb?.(result);
    broadcastRoomState(code);

    // Check fail conditions
    if (gameEngine.checkFailConditions(room)) {
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

    const result = gameEngine.makeChoice(room, choiceId);
    cb?.(result);
    broadcastRoomState(code);

    // Check fail after choice effects
    if (gameEngine.checkFailConditions(room)) {
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

    const result = gameEngine.advanceNode(room);
    cb?.(result);
    broadcastRoomState(code);

    // Check for win
    const currentNode = gameEngine.getCurrentNode(room);
    if (currentNode && currentNode.type === 'win_node') {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: currentNode.story.text,
        won: true,
        title: currentNode.story.title
      });
      stopTimer(code);
    }

    // Check fail
    if (gameEngine.checkFailConditions(room)) {
      room.phase = 'ended';
      io.to(code).emit('GAME_OVER', {
        reason: room.gameState.failReason,
        won: false
      });
      stopTimer(code);
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
