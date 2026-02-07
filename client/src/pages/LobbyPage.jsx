import React from 'react';
import socket from '../socket';

const ROLE_INFO = {
  builder: { emoji: '🔧', color: '#f59e0b' },
  pathfinder: { emoji: '🧭', color: '#10b981' },
  decoder: { emoji: '🔍', color: '#8b5cf6' }
};

export default function LobbyPage({ roomState, playerId, onBackToHome }) {
  if (!roomState) {
    return (
      <div className="page lobby-page">
        <div className="loading">Connecting to room...</div>
      </div>
    );
  }

  const me = roomState.players.find(p => p.id === playerId);
  const isHost = me?.isHost;
  const roles = roomState.roles || [];

  const handleSelectRole = (roleId) => {
    socket.emit('SELECT_ROLE', { roleId }, (res) => {
      if (res?.error) alert(res.error);
    });
  };

  const handleStart = () => {
    socket.emit('START_GAME', {}, (res) => {
      if (res?.error) alert(res.error);
    });
  };

  const takenRoles = new Set(
    roomState.players.filter(p => p.role).map(p => p.role)
  );

  return (
    <div className="page lobby-page">
      <div className="lobby-container">
        <h1 className="lobby-title">{roomState.scenarioTitle || 'Lobby'}</h1>

        <div className="room-code-display">
          <span className="room-code-label">ROOM CODE</span>
          <span className="room-code-value">{roomState.roomCode}</span>
          <span className="room-code-hint">Share this code with your team</span>
        </div>

        <div className="lobby-panels">
          {/* Players list */}
          <div className="panel">
            <h3>Players ({roomState.players.length})</h3>
            <ul className="player-list">
              {roomState.players.map(p => (
                <li key={p.id} className={`player-item ${!p.connected ? 'disconnected' : ''}`}>
                  <span className="player-name">
                    {p.name} {p.isHost && '⭐'} {p.id === playerId && '(you)'}
                  </span>
                  <span className="player-role">
                    {p.role ? (
                      <span style={{ color: ROLE_INFO[p.role]?.color }}>
                        {ROLE_INFO[p.role]?.emoji} {p.role}
                      </span>
                    ) : (
                      <span className="no-role">No role</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Role selection */}
          <div className="panel">
            <h3>Choose Your Role</h3>
            <div className="role-cards">
              {roles.map(role => {
                const info = ROLE_INFO[role.id] || {};
                const isTaken = takenRoles.has(role.id) &&
                  roomState.players.find(p => p.role === role.id)?.id !== playerId;
                const isSelected = me?.role === role.id;

                return (
                  <button
                    key={role.id}
                    className={`role-card ${isSelected ? 'selected' : ''} ${isTaken ? 'taken' : ''}`}
                    onClick={() => !isTaken && handleSelectRole(role.id)}
                    disabled={isTaken}
                    style={{ borderColor: isSelected ? info.color : undefined }}
                  >
                    <span className="role-emoji">{info.emoji}</span>
                    <span className="role-name">{role.name}</span>
                    <span className="role-tagline">{role.tagline}</span>
                    {isTaken && <span className="role-taken-label">Taken</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lobby-actions">
          {isHost ? (
            <button className="btn btn-primary btn-large" onClick={handleStart}>
              Start Game
            </button>
          ) : (
            <p className="waiting-text">Waiting for host to start...</p>
          )}
          <button className="btn btn-ghost" onClick={onBackToHome}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
