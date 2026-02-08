import React from 'react';
import { Handle, Position } from 'reactflow';

/** All engine-supported puzzle types */
export const PUZZLE_TYPES = [
  { value: 'choice',          label: 'Multiple Choice' },
  { value: 'input_code',      label: 'Code / Text Input' },
  { value: 'input_numeric',   label: 'Numeric Input' },
  { value: 'multi_input',     label: 'Multi-Field Input' },
  { value: 'debug_select',    label: 'Debug Select' },
  { value: 'logic_match',     label: 'Logic Match' },
  { value: 'embed_validator', label: 'Embed Validator' },
];

export function PuzzleNode({ data }) {
  const title   = data?.story?.title || data?.location || data?.id;
  const next    = data?.nextNodeId;
  const puzzles = data?.puzzles || [];

  return (
    <div className={`editor-node puzzle-node ${!next ? 'invalid' : ''}`}>
      <div className="node-header">
        <span className="node-type">🧩 Puzzle</span>
        <span className="node-id">{data?.id}</span>
      </div>
      <div className="node-title">{title}</div>
      {puzzles.length > 0 && (
        <div className="puzzle-tags">
          {puzzles.map((p, i) => (
            <span key={i} className="puzzle-tag">{p.type || '?'}</span>
          ))}
        </div>
      )}
      {puzzles.length === 0 && <div className="node-sub dim">No puzzles yet</div>}
      <div className="node-sub">Next: {next || '— (connect)'}</div>
      <Handle type="source" position={Position.Right} />
      <Handle type="target" position={Position.Left} />
    </div>
  );
}
