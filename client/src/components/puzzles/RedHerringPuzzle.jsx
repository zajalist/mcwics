import React from 'react';
import { Fish, AlertTriangle } from 'lucide-react';

/**
 * Red Herring — a decoy puzzle that has no real answer.
 * The scenario designer uses autoEffects on the node to apply penalties/flavor.
 * This puzzle auto-solves (server marks it solved immediately) or is skipped.
 */
export default function RedHerringPuzzle({ puzzle, solved }) {
  return (
    <div className={`puzzle-block ${solved ? 'solved' : ''}`}>
      <div className="puzzle-header"><Fish size={16} /> Suspicious Clue</div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {puzzle.narrativeText && (
        <div className="narrative-text" style={{
          background: 'rgba(200,121,65,0.1)',
          padding: 12,
          borderRadius: 8,
          borderLeft: '3px solid #c87941',
          margin: '8px 0',
          whiteSpace: 'pre-wrap',
        }}>
          {puzzle.narrativeText}
        </div>
      )}

      <div className="puzzle-hint" style={{ color: '#c87941', display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={14} /> This clue may or may not be relevant…
      </div>
    </div>
  );
}
