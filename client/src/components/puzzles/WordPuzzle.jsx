import React, { useState, useMemo } from 'react';
import { Type, Send, Check, X, RotateCcw } from 'lucide-react';
import socket from '../../socket';

/* ── Letter Tile component ── */
function LetterTile({ letter, selected, onClick, placed }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6,
        border: selected ? '2px solid #e8dcc8' : '1px solid rgba(255,255,255,0.12)',
        background: placed ? 'rgba(16,185,129,0.15)' : selected ? 'rgba(212,165,116,0.2)' : 'rgba(38,59,85,0.5)',
        color: placed ? '#10b981' : '#f5e6d3',
        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.95rem',
        cursor: placed ? 'default' : 'pointer',
        transition: 'all 0.15s',
        opacity: placed ? 0.4 : 1,
      }}
      disabled={placed}
    >
      {letter}
    </button>
  );
}

/* ── Scrambled display with animated letters ── */
function ScrambledDisplay({ text }) {
  if (!text) return null;
  return (
    <div style={{
      display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
      padding: '0.6rem',
      background: 'rgba(13,27,42,0.5)',
      borderRadius: 8,
      border: '1px solid rgba(212,165,116,0.2)',
    }}>
      {text.split('').map((ch, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: ch === ' ' ? 16 : 32, height: 36,
          borderRadius: 4,
          background: ch === ' ' ? 'transparent' : 'rgba(212,165,116,0.1)',
          border: ch === ' ' ? 'none' : '1px solid rgba(212,165,116,0.25)',
          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem',
          color: '#e8dcc8',
          letterSpacing: '0.05em',
        }}>
          {ch === '_' ? '\u00A0' : ch}
        </span>
      ))}
    </div>
  );
}

export default function WordPuzzle({ puzzle, solved, attempts }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [selectedTiles, setSelectedTiles] = useState([]);

  const hasTiles = puzzle.tiles && Array.isArray(puzzle.tiles) && puzzle.tiles.length > 0;
  const mode = puzzle.wordMode || (hasTiles ? 'letter_tiles' : 'anagram');

  const handleSubmit = (submitAnswer) => {
    const ans = (submitAnswer || answer).trim();
    if (!ans) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: ans }, (res) => {
      setFeedback(res);
      if (res.correct) { setAnswer(''); setSelectedTiles([]); }
    });
  };

  const handleTileClick = (idx) => {
    if (selectedTiles.includes(idx)) {
      setSelectedTiles(s => s.filter(i => i !== idx));
    } else {
      setSelectedTiles(s => [...s, idx]);
    }
  };

  const tileAnswer = useMemo(() => {
    if (!hasTiles) return '';
    return selectedTiles.map(i => puzzle.tiles[i]).join('');
  }, [selectedTiles, puzzle.tiles, hasTiles]);

  const handleReset = () => {
    setSelectedTiles([]);
    setAnswer('');
    setFeedback(null);
  };

  if (solved) {
    return (
      <div className="puzzle-block solved">
        <div className="puzzle-header"><Type size={16} /> Word Puzzle <Check size={16} className="solved-icon" /></div>
        <p className="puzzle-prompt">{puzzle.prompt}</p>
        <div className="solved-badge">Solved!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header"><Type size={16} /> Word Puzzle</div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Scrambled letters or word display */}
      {puzzle.scrambledText && <ScrambledDisplay text={puzzle.scrambledText} />}

      {/* Letter tiles mode */}
      {hasTiles && (
        <div>
          <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginBottom: 4 }}>
            Tap tiles to spell the answer:
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
            {puzzle.tiles.map((letter, idx) => (
              <LetterTile
                key={idx}
                letter={letter}
                selected={selectedTiles.includes(idx)}
                placed={selectedTiles.includes(idx)}
                onClick={() => handleTileClick(idx)}
              />
            ))}
          </div>

          {/* Current selection */}
          {selectedTiles.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              padding: '0.4rem 0.6rem',
              background: 'rgba(212,165,116,0.08)',
              borderRadius: 6,
              border: '1px dashed rgba(212,165,116,0.3)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1rem', color: '#f5e6d3', letterSpacing: '0.15em', flex: 1 }}>
                {tileAnswer}
              </span>
              <button className="btn btn-xs btn-ghost" onClick={handleReset} title="Reset">
                <RotateCcw size={12} />
              </button>
            </div>
          )}

          <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(tileAnswer)} disabled={!tileAnswer}>
            <Send size={14} /> Submit
          </button>
        </div>
      )}

      {puzzle.hint && <p className="puzzle-hint">{puzzle.hint}</p>}

      {/* Text input mode (anagram, word_scramble, fill_blank) */}
      {!hasTiles && (
        <div className="puzzle-input-row">
          <input
            className="input"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Enter your answer…"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
          <button className="btn btn-primary btn-sm" onClick={() => handleSubmit()}>
            <Send size={14} />
          </button>
        </div>
      )}

      {feedback && !feedback.correct && (
        <div className="puzzle-feedback wrong"><X size={14} /> {feedback.message}</div>
      )}
      {attempts > 0 && <div className="puzzle-attempts">Attempts: {attempts}</div>}
    </div>
  );
}
