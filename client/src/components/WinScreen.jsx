import React from 'react';
import { Sparkles, Wrench, Compass, Search } from 'lucide-react';

function EndMedia({ url }) {
  if (!url) return null;
  const isVideo = /\.mp4/i.test(url);
  return (
    <div className="end-media">
      {isVideo ? (
        <video src={url} autoPlay loop muted playsInline className="end-media-content" />
      ) : (
        <img src={url} alt="" className="end-media-content" />
      )}
    </div>
  );
}

export default function WinScreen({ gameOver, roomState, onBackToHome }) {
  return (
    <div className="page end-screen win-screen">
      <div className="end-container">
        <div className="end-icon"><Sparkles size={48} /></div>
        <h1 className="end-title">{gameOver.title || 'Victory!'}</h1>
        <p className="end-reason">{gameOver.reason}</p>

        <EndMedia url={gameOver.mediaUrl} />

        {roomState?.players && (
          <div className="end-players">
            <h3>Your Team</h3>
            {roomState.players.map(p => (
              <span key={p.id} className="end-player-badge">
                <span className="badge-role">{p.role === 'builder' ? <Wrench size={14} /> : p.role === 'pathfinder' ? <Compass size={14} /> : <Search size={14} />}</span> {p.name}
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
