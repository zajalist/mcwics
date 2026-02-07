import React, { useState } from 'react';
import socket from '../../socket';

export default function DebugSelectPuzzle({ puzzle, solved }) {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const code = puzzle.code || {};

  const handleSubmit = () => {
    if (!selected) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: selected }, (res) => {
      setFeedback(res);
    });
  };

  return (
    <div className="puzzle-block debug-puzzle">
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Code display */}
      <div className="code-block">
        <div className="code-lang">{code.language || 'code'}</div>
        <pre><code>{code.boilerplate}</code></pre>
      </div>

      {code.question && <p className="code-question">{code.question}</p>}

      {/* Fix options */}
      <div className="choice-options">
        {puzzle.options?.map(opt => (
          <button
            key={opt.id}
            className={`choice-btn ${selected === opt.id ? 'selected' : ''} ${solved ? 'disabled' : ''}`}
            onClick={() => !solved && setSelected(opt.id)}
            disabled={solved}
          >
            <code>{opt.label}</code>
          </button>
        ))}
      </div>

      {!solved && (
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!selected}>
          Apply Fix
        </button>
      )}
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          {feedback.message}
        </div>
      )}
      {solved && <div className="feedback correct">Bug Fixed ✓</div>}
    </div>
  );
}
