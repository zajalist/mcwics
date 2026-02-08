// ── NavBar ──────────────────────────────────────────────────
// Persistent top navigation. Shows across all pages.

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import starLogo from '../assets/star-logo.svg';

export default function NavBar({ currentPath, onNavigate }) {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <div className="nav-left">
        <button className="nav-brand" onClick={() => onNavigate('home')}>
          <img src={starLogo} alt="LockStep" className="nav-logo" />
          <span className="nav-brand-text">Lockstep</span>
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
        <button
          className={`nav-link ${currentPath === 'docs' ? 'active' : ''}`}
          onClick={() => onNavigate('docs')}
        >
          Documentation
        </button>
        <button
          className={`nav-link ${currentPath === 'contact' ? 'active' : ''}`}
          onClick={() => onNavigate('contact')}
        >
          Contact
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-sm" onClick={() => onNavigate('auth')}>
              Sign In
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => onNavigate('auth')}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
