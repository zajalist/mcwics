import React, { useState } from 'react';
import socket from '../../socket';

export default function InputNumericPuzzle({ puzzle, solved }) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = () => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: num }, (res) => {
      setFeedback(res);
    });
  };

  return (
    <div className="puzzle-block">
      <p className="puzzle-prompt">{puzzle.prompt}</p>
      {!solved ? (
        <>
          <div className="input-row">
            <input
              className="input puzzle-input"
              type="number"
              step="any"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter value..."
            />
            <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
          </div>
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
