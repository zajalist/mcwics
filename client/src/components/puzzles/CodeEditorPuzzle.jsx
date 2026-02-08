import React, { useState } from 'react';
import { Code, Play, Check, X } from 'lucide-react';
import socket from '../../socket';

/**
 * Code Editor Puzzle — a code editing area with hidden test cases.
 * The player writes code, submits it, and the server validates against test cases.
 * Uses validation.mode = 'exact' for the answer or custom test-case logic.
 */
export default function CodeEditorPuzzle({ puzzle, solved, attempts }) {
  const [code, setCode] = useState(puzzle.boilerplate || '');
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = () => {
    if (!code.trim()) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: code.trim() }, (res) => {
      setFeedback(res);
    });
  };

  if (solved) {
    return (
      <div className="puzzle-block solved">
        <div className="puzzle-header"><Code size={16} /> Code Challenge <Check size={16} className="solved-icon" /></div>
        <p className="puzzle-prompt">{puzzle.prompt}</p>
        <div className="solved-badge">All tests passed!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header"><Code size={16} /> Code Challenge</div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Language badge */}
      {puzzle.language && (
        <div style={{ fontSize: '0.75rem', color: '#8b5cf6', marginBottom: 4 }}>
          Language: {puzzle.language}
        </div>
      )}

      {/* Code editor area */}
      <textarea
        className="input code-editor-area"
        value={code}
        onChange={e => setCode(e.target.value)}
        rows={12}
        spellCheck={false}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.85rem',
          lineHeight: 1.5,
          background: '#0a0e17',
          color: '#e2e8f0',
          border: '1px solid #1e293b',
          resize: 'vertical',
          tabSize: 2,
        }}
      />

      {/* Test case hints (visible ones) */}
      {puzzle.visibleTests && puzzle.visibleTests.length > 0 && (
        <div style={{ margin: '8px 0' }}>
          <strong style={{ fontSize: '0.8rem' }}>Sample Tests:</strong>
          {puzzle.visibleTests.map((t, i) => (
            <div key={i} style={{
              background: '#0a0e17',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: '0.8rem',
              fontFamily: "'JetBrains Mono', monospace",
              marginTop: 4,
            }}>
              Input: <code>{t.input}</code> → Expected: <code>{t.expected}</code>
            </div>
          ))}
          {puzzle.hiddenTestCount > 0 && (
            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: 4 }}>
              + {puzzle.hiddenTestCount} hidden test(s)
            </p>
          )}
        </div>
      )}

      {puzzle.hint && <p className="puzzle-hint">{puzzle.hint}</p>}

      <button className="btn btn-primary" onClick={handleSubmit} style={{ marginTop: 8 }}>
        <Play size={14} /> Run & Submit
      </button>

      {feedback && !feedback.correct && (
        <div className="puzzle-feedback wrong"><X size={14} /> {feedback.message}</div>
      )}
      {feedback && feedback.correct && (
        <div className="puzzle-feedback correct"><Check size={14} /> {feedback.message}</div>
      )}
      {attempts > 0 && <div className="puzzle-attempts">Attempts: {attempts}</div>}
    </div>
  );
}
