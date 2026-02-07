import React from 'react';
import socket from '../socket';
import ChoicePuzzle from './puzzles/ChoicePuzzle';
import InputCodePuzzle from './puzzles/InputCodePuzzle';
import InputNumericPuzzle from './puzzles/InputNumericPuzzle';
import MultiInputPuzzle from './puzzles/MultiInputPuzzle';
import DebugSelectPuzzle from './puzzles/DebugSelectPuzzle';
import LogicMatchPuzzle from './puzzles/LogicMatchPuzzle';
import EmbedValidatorPuzzle from './puzzles/EmbedValidatorPuzzle';

const PUZZLE_COMPONENTS = {
  choice: ChoicePuzzle,
  input_code: InputCodePuzzle,
  input_numeric: InputNumericPuzzle,
  multi_input: MultiInputPuzzle,
  debug_select: DebugSelectPuzzle,
  logic_match: LogicMatchPuzzle,
  embed_validator: EmbedValidatorPuzzle
};

export default function PuzzlePanel({ puzzles, solvedPuzzles, puzzleAttempts, nodeId, hasNextNode }) {
  if (!puzzles || puzzles.length === 0) {
    // Node with no puzzles (e.g. red herring auto-effect node) — auto advance
    return (
      <div className="puzzle-panel">
        <div className="puzzle-panel-header">⚠️ Event</div>
        <p className="no-puzzles">No puzzles here.</p>
        {hasNextNode && (
          <button
            className="btn btn-primary"
            onClick={() => socket.emit('ADVANCE_NODE', {}, () => {})}
          >
            Continue →
          </button>
        )}
      </div>
    );
  }

  const allSolved = puzzles.every(p => solvedPuzzles.includes(p.id));

  return (
    <div className="puzzle-panel">
      <div className="puzzle-panel-header">🧩 Puzzles</div>

      {puzzles.map(puzzle => {
        const Component = PUZZLE_COMPONENTS[puzzle.type];
        if (!Component) {
          return (
            <div key={puzzle.id} className="puzzle-block">
              <p>Unknown puzzle type: {puzzle.type}</p>
            </div>
          );
        }
        return (
          <Component
            key={puzzle.id}
            puzzle={puzzle}
            solved={solvedPuzzles.includes(puzzle.id)}
            attempts={puzzleAttempts[puzzle.id] || 0}
          />
        );
      })}

      {allSolved && hasNextNode && (
        <button
          className="btn btn-primary btn-advance"
          onClick={() => socket.emit('ADVANCE_NODE', {}, () => {})}
        >
          Proceed to next room →
        </button>
      )}
    </div>
  );
}
