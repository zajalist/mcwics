import React from 'react';
import { Handle, Position } from 'reactflow';

export function ChoiceNode({ data }) {
  const title = data?.story?.title || data?.location || data?.id;
  const choices = data?.choices || [];
  const invalid = choices.some(c => !c.nextNodeId);

  return (
    <div className={`editor-node choice-node ${invalid ? 'invalid' : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-header">
        <span className="node-type">⚡ Choice</span>
        <span className="node-id">{data?.id}</span>
      </div>
      <div className="node-title">{title}</div>
      <ul className="choice-list">
        {choices.map((c, idx) => {
          /* Evenly space output handles along the right edge */
          const topPercent = choices.length === 1
            ? 50
            : 30 + (idx / (choices.length - 1)) * 50;
          return (
            <li key={c.id || idx} className="choice-item">
              <span className="choice-label">{c.label}</span>
              <span className={`choice-next ${!c.nextNodeId ? 'missing' : ''}`}>→ {c.nextNodeId || '—'}</span>
              <Handle
                type="source"
                position={Position.Right}
                id={`choice-${idx}`}
                style={{ top: `${topPercent}%` }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Max choices a single choice node can have */
export const MAX_CHOICES = 6;
