// ── NavBar ──────────────────────────────────────────────────
// Persistent top navigation. Shows across all pages.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar({ currentPath, onNavigate }) {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="nav-brand" onClick={() => onNavigate('home')}>
          <span className="title-lock">LOCK</span><span className="title-step">STEP</span>
        </button>
      </div>

      <div className="nav-links">
        <button
          className={`nav-link ${currentPath === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Play
        </button>
        <button
          className={`nav-link ${currentPath === 'browse' ? 'active' : ''}`}
          onClick={() => onNavigate('browse')}
        >
          Discover
        </button>
        <button
          className={`nav-link ${currentPath === 'editor' ? 'active' : ''}`}
          onClick={() => onNavigate('editor')}
        >
          Editor
        </button>
      </div>

      <div className="nav-right">
        {user ? (
          <button
            className={`nav-avatar-btn ${currentPath === 'profile' ? 'active' : ''}`}
            onClick={() => onNavigate('profile')}
            title={user.displayName || user.email}
          >
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="nav-avatar-img" />
              : <span className="nav-avatar-text">{(user.displayName || user.email)?.[0]?.toUpperCase()}</span>
            }
          </button>
        ) : (
          <button className="btn btn-sm btn-primary" onClick={() => onNavigate('auth')}>
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
