// ── Profile Page ────────────────────────────────────────────
// Simple user profile: display name, email, sign out, link to "My Scenarios".

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { listMyScenarios } from '../services/scenarioService';

export default function ProfilePage({ onNavigate }) {
  const { user, signOut } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user) {
      listMyScenarios(user.uid).then(list => setCount(list.length)).catch(() => {});
    }
  }, [user]);

  if (!user) return null;

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <div className="page profile-page">
      <div className="profile-card">
        <div className="profile-avatar">
          {user.photoURL
            ? <img src={user.photoURL} alt="" className="avatar-img" />
            : <span className="avatar-placeholder">{(user.displayName || user.email)?.[0]?.toUpperCase() || '?'}</span>
          }
        </div>
        <h2 className="profile-name">{user.displayName || 'Player'}</h2>
        <p className="profile-email">{user.email}</p>

        <div className="profile-stats">
          <div className="stat">
            <span className="stat-value">{count}</span>
            <span className="stat-label">Scenarios</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('browse')}>
            My Scenarios
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('editor')}>
            Open Editor
          </button>
          <button className="btn btn-ghost btn-danger-text" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
