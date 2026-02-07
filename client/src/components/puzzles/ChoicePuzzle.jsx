import React, { useState } from 'react';
import socket from '../../socket';

export default function ChoicePuzzle({ puzzle, solved }) {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = () => {
    if (!selected) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: selected }, (res) => {
      setFeedback(res);
    });
  };

  return (
    <div className="puzzle-block">
      <p className="puzzle-prompt">{puzzle.prompt}</p>
      <div className="choice-options">
        {puzzle.options?.map(opt => (
          <button
            key={opt.id}
            className={`choice-btn ${selected === opt.id ? 'selected' : ''} ${solved ? 'disabled' : ''}`}
            onClick={() => !solved && setSelected(opt.id)}
            disabled={solved}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {!solved && (
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!selected}>
          Submit
        </button>
      )}
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          {feedback.message}
        </div>
      )}
      {solved && <div className="feedback correct">Solved ✓</div>}
    </div>
  );
}
