import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Sparkles, Play, Loader2 } from 'lucide-react';

export const AINode = memo(({ data, selected }) => {
  const config = data.aiConfig || {};
  const enhances = config.enhances || [];
  const hasPrompt = config.prompt && config.prompt.trim().length > 0;
  const isConnected = data.targetPuzzleId && data.targetPuzzleId.trim().length > 0;
  const aiRuntime = data.aiRuntime || {};
  const isRunning = aiRuntime.status === 'running';
  const hasError = aiRuntime.status === 'error';
  const canRun = hasPrompt && isConnected && !isRunning;
  
  const enhancesText = enhances.length === 0 
    ? 'Nothing selected'
    : enhances.map(t => {
        const labels = {
          'improveText': 'Text',
          'addImages': 'Images',
          'addVideos': 'Videos'
        };
        return labels[t] || t;
      }).join(' + ');

  return (
    <div className={`editor-node ai-node ${selected ? 'selected' : ''} ${!hasPrompt ? 'invalid' : ''} ${isRunning ? 'ai-running' : ''}`}>
      <div className="node-header">
        <span className="node-type"><Sparkles size={12} /> AI Enhancer</span>
        <span className="node-id">{data.id}</span>
      </div>
      
      <div className="node-title">
        AI Enhancer
      </div>
      
      <div className="node-sub">
        Enhances: {enhancesText}
      </div>
      
      {isConnected && (
        <div className="node-sub" style={{ color: '#10b981' }}>
          ✓ Connected to {data.targetPuzzleId}
        </div>
      )}
      
      {!hasPrompt && (
        <div className="hint" style={{ marginTop: '0.3rem', fontSize: '0.7rem' }}>
          ⚠️ Configure instructions in sidebar
        </div>
      )}
      
      {!isConnected && (
        <div className="hint" style={{ marginTop: '0.3rem', fontSize: '0.7rem', color: '#f59e0b' }}>
          ⚡ Connect to a puzzle node
        </div>
      )}

      <div className="ai-play-row">
        <button
          type="button"
          className={`ai-play-btn ${isRunning ? 'running' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (canRun) data.onPlay?.(data.id);
          }}
          disabled={!canRun}
          title={
            !hasPrompt ? 'Add AI instructions in the sidebar' :
            !isConnected ? 'Connect this AI node to a puzzle node' :
            isRunning ? 'AI is enhancing content...' :
            'Run AI enhancement'
          }
        >
          {isRunning ? <Loader2 size={14} className="ai-spin" /> : <Play size={14} />}
          {isRunning ? 'Enhancing…' : 'Play'}
        </button>
        {(aiRuntime.message || hasError) && (
          <div className={`ai-status ${hasError ? 'error' : isRunning ? 'running' : 'ok'}`}>
            {aiRuntime.message || (hasError ? 'AI failed' : 'Ready')}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} style={{ background: '#f59e0b' }} />
    </div>
  );
});

AINode.displayName = 'AINode';

