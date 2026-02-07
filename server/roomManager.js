// ── Room Manager ────────────────────────────────────────────
// Manages room lifecycle: creation, joining, role selection, state.

class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomCode → room object
  }

  // Generate unique 6-char alphanumeric code
  _generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(scenarioId, scenario) {
    const roomCode = this._generateCode();
    const room = {
      roomCode,
      scenarioId,
      phase: 'lobby', // lobby | playing | ended
      players: [],
      gameState: null,
      createdAt: Date.now()
    };
    this.rooms.set(roomCode, room);
    return room;
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase()) || null;
  }

  addPlayer(roomCode, socketId, name, isHost) {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = {
      id: socketId,
      name: name || `Player ${room.players.length + 1}`,
      role: null,
      connected: true,
      isHost
    };
    room.players.push(player);
    return player;
  }

  setPlayerRole(roomCode, socketId, roleId) {
    const room = this.rooms.get(roomCode);
    if (!room) return { error: 'Room not found' };

    // Check if role is already taken by someone else
    const taken = room.players.find(p => p.role === roleId && p.id !== socketId);
    if (taken) return { error: `Role "${roleId}" is already taken by ${taken.name}` };

    const player = room.players.find(p => p.id === socketId);
    if (!player) return { error: 'Player not found' };

    player.role = roleId;
    return { ok: true };
  }

  autoAssignRoles(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const availableRoles = ['builder', 'pathfinder', 'decoder'];
    const unassigned = room.players.filter(p => !p.role);
    const takenRoles = new Set(room.players.filter(p => p.role).map(p => p.role));
    const freeRoles = availableRoles.filter(r => !takenRoles.has(r));

    for (const player of unassigned) {
      if (freeRoles.length > 0) {
        player.role = freeRoles.shift();
      } else {
        // If more players than roles, assign round-robin
        player.role = availableRoles[room.players.indexOf(player) % availableRoles.length];
      }
    }
  }

  markDisconnected(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socketId);
    if (player) player.connected = false;

    // If all disconnected, clean up room after a delay
    const allDisconnected = room.players.every(p => !p.connected);
    if (allDisconnected) {
      setTimeout(() => {
        const r = this.rooms.get(roomCode);
        if (r && r.players.every(p => !p.connected)) {
          this.rooms.delete(roomCode);
          console.log(`[room] Cleaned up empty room ${roomCode}`);
        }
      }, 60000); // 1 minute grace period
    }
  }

  removeRoom(roomCode) {
    this.rooms.delete(roomCode);
  }
}

module.exports = { RoomManager };
