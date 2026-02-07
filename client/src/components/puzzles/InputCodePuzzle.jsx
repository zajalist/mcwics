import React, { useState } from 'react';
import socket from '../../socket';

export default function InputCodePuzzle({ puzzle, solved, attempts }) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = () => {
    if (!value.trim()) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: value.trim() }, (res) => {
      setFeedback(res);
      if (res.correct) setValue('');
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="puzzle-block">
      <p className="puzzle-prompt">{puzzle.prompt}</p>
      {puzzle.validation?.mode === 'computed' && puzzle.validation?.example && (
        <p className="puzzle-hint">Format example: {puzzle.validation.example}</p>
      )}
      {!solved ? (
        <>
          <div className="input-row">
            <input
              className="input puzzle-input"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter code..."
            />
            <button className="btn btn-primary" onClick={handleSubmit}>
              Submit
            </button>
          </div>
          {puzzle.attemptsAllowed && (
            <p className="attempts-info">
              Attempts: {attempts || 0} / {puzzle.attemptsAllowed}
            </p>
          )}
        </>
      ) : (
        <div className="feedback correct">Solved ✓</div>
      )}
      {feedback && !solved && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
