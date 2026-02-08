// ── Deploy Modal ────────────────────────────────────────────
// Shown when user clicks "Deploy" in the editor.
// Lets them set title, description, visibility, then publish to Firestore.
// Also handles AI content generation for connected AI nodes.

import React, { useState } from 'react';
import { Globe, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { deployScenario, updateScenario } from '../services/scenarioService';
import { processAndStoreAIEnhancement } from '../services/aiContentStorage';

export default function DeployModal({ scenarioJson, existingDocId, onClose, onDeployed, nodes, edges }) {
  const { user }                  = useAuth();
  const [title, setTitle]         = useState(scenarioJson?.scenarios?.[0]?.title || 'My Scenario');
  const [description, setDescription] = useState(scenarioJson?.scenarios?.[0]?.description || '');
  const [visibility, setVisibility]   = useState('public');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [aiProgress, setAiProgress] = useState('');

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

  // Find AI nodes and their connected target nodes
  const findAINodesToProcess = () => {
    if (!nodes || !edges) return [];
    
    const aiNodes = nodes.filter(n => n.type === 'ai_node');
    const aiNodeProcessingList = [];
    
    for (const aiNode of aiNodes) {
      const targetPuzzleId = aiNode.data.targetPuzzleId;
      if (targetPuzzleId) {
        const targetNode = nodes.find(n => n.id === targetPuzzleId);
        if (targetNode) {
          aiNodeProcessingList.push({ aiNode, targetNode });
        }
      }
    }
    
    return aiNodeProcessingList;
  };

  const handleDeploy = async () => {
    setError('');
    setLoading(true);
    setAiProgress('');
    
    try {
      // 1. Process AI nodes if any
      const aiNodesToProcess = findAINodesToProcess();
      const aiGeneratedContent = {};
      
      if (aiNodesToProcess.length > 0) {
        setAiProgress(`🤖 Processing ${aiNodesToProcess.length} AI enhancement(s)...`);
        
        for (let i = 0; i < aiNodesToProcess.length; i++) {
          const { aiNode, targetNode } = aiNodesToProcess[i];
          setAiProgress(`🤖 Enhancing ${aiNode.data.id} → ${targetNode.data.id} (${i + 1}/${aiNodesToProcess.length})...`);
          
          try {
            // Use existingDocId or generate temp ID for new scenarios
            const scenarioId = existingDocId || `temp_${Date.now()}`;
            
            const result = await processAndStoreAIEnhancement(
              scenarioId,
              aiNode,
              targetNode
            );
            
            aiGeneratedContent[aiNode.id] = {
              contentId: result.contentId,
              enhancedContent: result.enhancedContent,
              imageUrls: result.imageUrls || [],
              cached: result.cached
            };
            
            setAiProgress(
              `✅ Enhanced ${aiNode.data.id}${result.cached ? ' (cached)' : ''}${result.imageUrls.length > 0 ? ` + ${result.imageUrls.length} image(s)` : ''}`
            );
            
          } catch (aiError) {
            console.error('AI enhancement error:', aiError);
            setAiProgress(`⚠️ Warning: Could not enhance content for ${aiNode.data.id}`);
            // Continue with deployment even if AI fails
          }
        }
      }

      // 2. Stamp the title/desc into the JSON itself
      setAiProgress('📦 Preparing scenario data...');
      const json = { ...scenarioJson };
      if (json.scenarios && json.scenarios[0]) {
        json.scenarios[0].title       = title;
        json.scenarios[0].description = description;
        
        // Attach AI content references to the scenario
        if (Object.keys(aiGeneratedContent).length > 0) {
          json.scenarios[0].aiGeneratedContent = aiGeneratedContent;
        }
      }

      // 3. Deploy to Firebase
      setAiProgress('☁️ Uploading to database...');
      if (existingDocId) {
        await updateScenario(existingDocId, { 
          title, 
          description, 
          visibility, 
          scenarioJson: json,
          hasAIContent: Object.keys(aiGeneratedContent).length > 0
        });
        onDeployed?.(existingDocId);
      } else {
        const docId = await deployScenario({
          uid:        user.uid,
          authorName: user.displayName || user.email,
          title, 
          description, 
          visibility, 
          scenarioJson: json,
          hasAIContent: Object.keys(aiGeneratedContent).length > 0
        });
        onDeployed?.(docId);
      }
      
      setAiProgress('✅ Deployment successful!');
      setTimeout(() => onClose(), 1000);
      
    } catch (err) {
      setError(err.message || 'Deploy failed');
      setAiProgress('');
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

        {aiProgress && (
          <div className="ai-progress" style={{
            padding: '0.75rem',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '6px',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <Sparkles size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span>{aiProgress}</span>
          </div>
        )}

        {error && <div className="error-msg">{error}</div>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleDeploy} disabled={loading}>
            {loading ? 'Deploying…' : existingDocId ? 'Update' : 'Deploy'}
          </button>
        </div>
      </div>
    </div>
  );
}
