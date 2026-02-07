import React, { useState } from 'react';
import socket from '../../socket';

export default function MultiInputPuzzle({ puzzle, solved }) {
  const fields = puzzle.validation?.fields || [];
  const [values, setValues] = useState(() => {
    const obj = {};
    fields.forEach(f => { obj[f.id] = ''; });
    return obj;
  });
  const [feedback, setFeedback] = useState(null);

  const handleChange = (fieldId, val) => {
    setValues(prev => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = () => {
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: values }, (res) => {
      setFeedback(res);
    });
  };

  return (
    <div className="puzzle-block">
      <p className="puzzle-prompt">{puzzle.prompt}</p>
      {!solved ? (
        <>
          <div className="multi-input-fields">
            {fields.map(field => (
              <div key={field.id} className="multi-field">
                <label className="label">{field.id}</label>
                <input
                  className="input puzzle-input"
                  value={values[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  placeholder={`Enter ${field.id}...`}
                />
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleSubmit}>Submit All</button>
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
