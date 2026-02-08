import React from 'react';
import { Trophy, Skull } from 'lucide-react';
import { Handle, Position } from 'reactflow';

export function EndpointNode({ data, selected }) {
  const outcome = data?.outcome || 'win';
  const isWin = outcome === 'win';
  const title = data?.story?.title || (isWin ? 'Victory' : 'Game Over');
  const Icon = isWin ? Trophy : Skull;

  return (
    <div className={`editor-node endpoint-node ${isWin ? 'endpoint-win' : 'endpoint-fail'} ${selected ? 'selected' : ''}`}>
      <div className="node-header">
        <span className="node-type"><Icon size={14} /> Endpoint</span>
        <span className="node-id">{data?.id}</span>
      </div>
      <div className="node-title">{title}</div>
      <div className="node-sub">{isWin ? '✓ Win' : '✗ Fail'} — {data?.location || 'Terminal'}</div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
