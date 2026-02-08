// ── Deploy Modal ────────────────────────────────────────────
// Shown when user clicks "Deploy" in the editor.
// Lets them set title, description, visibility, then publish to Firestore.

import React, { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { deployScenario, updateScenario } from '../services/scenarioService';

export default function DeployModal({ scenarioJson, existingDocId, onClose, onDeployed }) {
  const { user }                  = useAuth();
  const [title, setTitle]         = useState(scenarioJson?.scenarios?.[0]?.title || 'My Scenario');
  const [description, setDescription] = useState(scenarioJson?.scenarios?.[0]?.description || '');
  const [visibility, setVisibility]   = useState('public');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  if (!user) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={e => e.stopPropagation()}>
          <h2>Sign in required</h2>
          <p className="sidebar-hint">You need to be signed in to deploy a scenario.</p>
          <button className="btn btn-primary" onClick={onClose}>OK</button>
        </div>
      </div>
    );
  }

  const handleDeploy = async () => {
    setError('');
    setLoading(true);
    try {
      // Stamp the title/desc into the JSON itself
      const json = { ...scenarioJson };
      if (json.scenarios && json.scenarios[0]) {
        json.scenarios[0].title       = title;
        json.scenarios[0].description = description;
      }

      if (existingDocId) {
        await updateScenario(existingDocId, { title, description, visibility, scenarioJson: json });
        onDeployed?.(existingDocId);
      } else {
        const docId = await deployScenario({
          uid:        user.uid,
          authorName: user.displayName || user.email,
          title, description, visibility, scenarioJson: json,
        });
        onDeployed?.(docId);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Deploy failed');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2>{existingDocId ? 'Update Scenario' : 'Deploy Scenario'}</h2>

        <div className="form-group">
          <label className="label">Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} />
        </div>
        <div className="form-group">
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={description} onChange={e => setDescription(e.target.value)} maxLength={400} />
        </div>
        <div className="form-group">
          <label className="label">Visibility</label>
          <div className="visibility-toggle">
            <button className={`toggle-btn ${visibility === 'public' ? 'active' : ''}`} onClick={() => setVisibility('public')}>
              <Globe size={14} /> Public
            </button>
            <button className={`toggle-btn ${visibility === 'private' ? 'active' : ''}`} onClick={() => setVisibility('private')}>
              <Lock size={14} /> Private
            </button>
          </div>
          <p className="sidebar-hint">
            {visibility === 'public'
              ? 'Anyone can find, play, and remix this scenario.'
              : 'Only you can see and play this scenario.'}
          </p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleDeploy} disabled={loading}>
            {loading ? 'Deploying…' : existingDocId ? 'Update' : 'Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}
