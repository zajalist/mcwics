import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Sparkles } from 'lucide-react';

export const AINode = memo(({ data, selected }) => {
  const config = data.aiConfig || {};
  const generates = config.generates || [];
  const hasPrompt = config.prompt && config.prompt.trim().length > 0;
  
  const generatesText = generates.length === 0 
    ? 'Not configured'
    : generates.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' + ');

  return (
    <div className={`editor-node ai-node ${selected ? 'selected' : ''} ${!hasPrompt ? 'invalid' : ''}`}>
      <Handle type="target" position={Position.Left} />
      
      <div className="node-header">
        <span className="node-type"><Sparkles size={12} /> AI Generator</span>
        <span className="node-id">{data.id}</span>
      </div>
      
      <div className="node-title">
        {config.prompt ? config.prompt.substring(0, 30) + (config.prompt.length > 30 ? '...' : '') : 'No prompt'}
      </div>
      
      <div className="node-sub">
        Generates: {generatesText}
      </div>
      
      {!hasPrompt && (
        <div className="hint" style={{ marginTop: '0.3rem', fontSize: '0.7rem' }}>
          ⚠️ Prompt required
        </div>
      )}
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
});

AINode.displayName = 'AINode';
