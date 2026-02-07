import React from 'react';

export default function WinScreen({ gameOver, roomState, onBackToHome }) {
  return (
    <div className="page end-screen win-screen">
      <div className="end-container">
        <div className="end-emoji">🎉</div>
        <h1 className="end-title">{gameOver.title || 'Victory!'}</h1>
        <p className="end-reason">{gameOver.reason}</p>

        {roomState?.players && (
          <div className="end-players">
            <h3>Your Team</h3>
            {roomState.players.map(p => (
              <span key={p.id} className="end-player-badge">
                {p.role === 'builder' ? '🔧' : p.role === 'pathfinder' ? '🧭' : '🔍'} {p.name}
              </span>
            ))}
          </div>
        )}

        <button className="btn btn-primary btn-large" onClick={onBackToHome}>
          Play Again
        </button>
      </div>
    </div>
  );
}
