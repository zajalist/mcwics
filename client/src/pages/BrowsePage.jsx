// ── Browse / Discover Page ──────────────────────────────────
// Shows public community scenarios + user's own scenarios.
// Users can Play (start scavenge) or Edit (load into editor).

import React, { useEffect, useState } from 'react';
import { Globe, FolderOpen, AlertTriangle, Lock, GitFork, Play, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { listPublicScenarios, listMyScenarios, deleteScenario, forkScenario } from '../services/scenarioService';

export default function BrowsePage({ onNavigate }) {
  const { user }                = useAuth();
  const [tab, setTab]           = useState('public'); // 'public' | 'mine'
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const list = tab === 'mine' && user
        ? await listMyScenarios(user.uid)
        : await listPublicScenarios();
      setScenarios(list);
    } catch (err) {
      console.error('Failed to load scenarios', err);
      setError(err.message || 'Failed to load scenarios');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab, user]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this scenario permanently?')) return;
    await deleteScenario(id);
    load();
  };

  const handlePlay = (scenario) => {
    onNavigate('play', scenario);
  };

  const handleEdit = (scenario) => {
    // Owner → direct edit
    onNavigate('edit', scenario);
  };

  const handleFork = async (scenario) => {
    if (!user) return onNavigate('auth');
    try {
      const newId = await forkScenario({
        originalDocId: scenario.id,
        uid: user.uid,
        authorName: user.displayName || user.email,
        scenarioJson: scenario.scenarioJson,
      });
      // Open the fork in the editor
      onNavigate('edit', { ...scenario, id: newId, uid: user.uid });
    } catch (err) {
      alert('Failed to fork: ' + (err.message || err));
    }
  };

  const isOwner = (s) => user && s.uid === user.uid;

  return (
    <div className="page browse-page">
      <div className="browse-container">
        <h1 className="browse-title">Discover Scavenges</h1>
        <p className="browse-subtitle">Play community-created scenarios or create your own</p>

        <div className="browse-tabs">
          <button className={`tab-btn ${tab === 'public' ? 'active' : ''}`} onClick={() => setTab('public')}>
            <Globe size={16} /> Community
          </button>
          {user && (
            <button className={`tab-btn ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
              <FolderOpen size={16} /> My Scenarios
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Loading scenarios…</div>
        ) : error ? (
          <div className="browse-empty">
            <p><AlertTriangle size={16} /> {error}</p>
            <button className="btn btn-primary" onClick={load}>Retry</button>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="browse-empty">
            <p>{tab === 'mine'
              ? "You haven't deployed any scenarios yet."
              : 'No public scenarios yet. Be the first to deploy one!'}</p>
            <button className="btn btn-primary" onClick={() => onNavigate('editor')}>
              Open Editor
            </button>
          </div>
        ) : (
          <div className="scenario-grid">
            {scenarios.map(s => (
              <div key={s.id} className="scenario-card">
                <div className="scenario-card-header">
                  <h3>{s.title}</h3>
                  <span className={`visibility-badge ${s.visibility}`}>
                    {s.visibility === 'public' ? <><Globe size={14} /> Public</> : <><Lock size={14} /> Private</>}
                  </span>
                </div>
                <p className="scenario-desc">{s.description || 'No description'}</p>
                <div className="scenario-meta">
                  <span>by {s.authorName || 'Anonymous'}</span>
                  {s.forkedFrom && <span className="forked-badge"><GitFork size={14} /> Remix</span>}
                  {s.updatedAt?.toDate && (
                    <span>{s.updatedAt.toDate().toLocaleDateString()}</span>
                  )}
                </div>
                <div className="scenario-card-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => handlePlay(s)}>
                    <Play size={14} /> Play
                  </button>
                  {isOwner(s) ? (
                    <>
                      <button className="btn btn-sm" onClick={() => handleEdit(s)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id)}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-sm" onClick={() => handleFork(s)}>
                      <GitFork size={14} /> Fork & Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
