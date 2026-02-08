import React from 'react';
import { Handle, Position } from 'reactflow';

export function StartNode({ data }) {
  const title = data?.story?.title || 'Scenario Start';
  const next  = data?.nextNodeId;

  return (
    <div className={`editor-node start-node ${!next ? 'invalid' : ''}`}>
      <div className="node-header">
        <span className="node-type">🚀 Start</span>
        <span className="node-id">{data?.id}</span>
      </div>
      <div className="node-title">{title}</div>
      <div className="node-sub">{data?.location || 'Scenario Intro'}</div>
      <div className="node-sub">Next: {next || '— (connect)'}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
