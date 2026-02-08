import React from 'react';
import { Handle, Position } from 'reactflow';

export function FailNode({ data }) {
  const title = data?.story?.title || 'Fail — Bad Ending';

  return (
    <div className="editor-node fail-node">
      <div className="node-header">
        <span className="node-type">💀 Fail</span>
        <span className="node-id">{data?.id}</span>
      </div>
      <div className="node-title">{title}</div>
      <div className="node-sub">{data?.location || 'Failure Location'}</div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
