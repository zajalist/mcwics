import React from 'react';
import { Handle, Position } from 'reactflow';

export function WinNode({ data }) {
  const title = data?.story?.title || 'Win — Good Ending';

  return (
    <div className="editor-node win-node">
      <div className="node-header">
        <span className="node-type">🏆 Win</span>
        <span className="node-id">{data?.id}</span>
      </div>
      <div className="node-title">{title}</div>
      <div className="node-sub">{data?.location || 'Victory Location'}</div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
