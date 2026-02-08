import React from 'react';
import { AlertTriangle, Puzzle, ChevronRight, Clock } from 'lucide-react';
import socket from '../socket';
import ChoicePuzzle from './puzzles/ChoicePuzzle';
import InputCodePuzzle from './puzzles/InputCodePuzzle';
import InputNumericPuzzle from './puzzles/InputNumericPuzzle';
import MultiInputPuzzle from './puzzles/MultiInputPuzzle';
import DebugSelectPuzzle from './puzzles/DebugSelectPuzzle';
import LogicMatchPuzzle from './puzzles/LogicMatchPuzzle';
import EmbedValidatorPuzzle from './puzzles/EmbedValidatorPuzzle';
import CipherPuzzle from './puzzles/CipherPuzzle';
import LocationPuzzle from './puzzles/LocationPuzzle';
import PerceptionPuzzle from './puzzles/PerceptionPuzzle';
import WordPuzzle from './puzzles/WordPuzzle';
import LatexMathPuzzle from './puzzles/LatexMathPuzzle';
import NarrativePuzzle from './puzzles/NarrativePuzzle';
import RedHerringPuzzle from './puzzles/RedHerringPuzzle';
import MultiStagePuzzle from './puzzles/MultiStagePuzzle';
import CodeEditorPuzzle from './puzzles/CodeEditorPuzzle';

const PUZZLE_COMPONENTS = {
  choice: ChoicePuzzle,
  input_code: InputCodePuzzle,
  input_numeric: InputNumericPuzzle,
  multi_input: MultiInputPuzzle,
  debug_select: DebugSelectPuzzle,
  logic_match: LogicMatchPuzzle,
  embed_validator: EmbedValidatorPuzzle,
  // Ciphers
  cipher: CipherPuzzle,
  emoji_cipher: CipherPuzzle,
  ascii_cipher: CipherPuzzle,
  binary_cipher: CipherPuzzle,
  qr_code: CipherPuzzle,
  // Location
  gps_coordinate: LocationPuzzle,
  landmark_id: LocationPuzzle,
  directional_riddle: LocationPuzzle,
  // Perception
  spot_difference: PerceptionPuzzle,
  hidden_object: PerceptionPuzzle,
  audio_clue: PerceptionPuzzle,
  // Word & Language
  word_puzzle: WordPuzzle,
  // Math
  latex_math: LatexMathPuzzle,
  // Storytelling
  narrative_clue: NarrativePuzzle,
  found_document: NarrativePuzzle,
  red_herring: RedHerringPuzzle,
  multi_stage_chain: MultiStagePuzzle,
  // Code
  code_editor: CodeEditorPuzzle,
};

export default function PuzzlePanel({ puzzles, solvedPuzzles, puzzleAttempts, nodeId, hasNextNode, myAssignedPuzzleIds, waitingForOthers }) {
  if (!puzzles || puzzles.length === 0) {
    // Node with no puzzles (e.g. red herring auto-effect node) — auto advance
    return (
      <div className="puzzle-panel">
        <div className="puzzle-panel-header"><AlertTriangle size={18} /> Event</div>
        <p className="no-puzzles">No puzzles here.</p>
        {hasNextNode && (
          <button
            className="btn btn-primary"
            onClick={() => socket.emit('ADVANCE_NODE', {}, () => {})}
          >
            Continue <ChevronRight size={16} />
          </button>
        )}
      </div>
    );
  }

  // Filter puzzles to only show assigned ones (if assignment is active)
  const visiblePuzzles = myAssignedPuzzleIds
    ? puzzles.filter(p => myAssignedPuzzleIds.includes(p.id))
    : puzzles;

  const allSolved = puzzles.every(p => solvedPuzzles.includes(p.id));

  // Check if MY puzzles are solved but waiting for others
  const myPuzzlesSolved = visiblePuzzles.every(p => solvedPuzzles.includes(p.id));
  const isWaitingForTeam = myAssignedPuzzleIds && myPuzzlesSolved && !allSolved;

  return (
    <div className="puzzle-panel">
      <div className="puzzle-panel-header"><Puzzle size={18} /> Puzzles</div>

      {/* Show assigned puzzle indicator */}
      {myAssignedPuzzleIds && (
        <div className="assignment-notice" style={{
          background: 'rgba(212,165,116,0.1)',
          border: '1px solid rgba(212,165,116,0.3)',
          borderRadius: 8,
          padding: '8px 12px',
          marginBottom: 8,
          fontSize: '0.8rem',
          color: '#e8dcc8',
        }}>
          You have {visiblePuzzles.length} assigned puzzle{visiblePuzzles.length !== 1 ? 's' : ''}.
          {puzzles.length > visiblePuzzles.length && ` Your teammates are working on ${puzzles.length - visiblePuzzles.length} other puzzle${puzzles.length - visiblePuzzles.length !== 1 ? 's' : ''}.`}
        </div>
      )}

      {visiblePuzzles.map(puzzle => {
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

      {/* Waiting for teammates */}
      {isWaitingForTeam && (
        <div className="waiting-panel" style={{
          textAlign: 'center',
          padding: 24,
          background: 'rgba(13,27,42,0.5)',
          borderRadius: 12,
          border: '1px solid rgba(212,165,116,0.2)',
          marginTop: 12,
        }}>
          <Clock size={32} style={{ color: '#e8dcc8', marginBottom: 8 }} />
          <p style={{ color: '#f5e6d3', fontWeight: 600 }}>Waiting for teammates…</p>
          <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>Your puzzles are complete. Other players are still working.</p>
        </div>
      )}

      {allSolved && hasNextNode && (
        <button
          className="btn btn-primary btn-advance"
          onClick={() => socket.emit('ADVANCE_NODE', {}, () => {})}
        >
          Proceed to next room <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}
