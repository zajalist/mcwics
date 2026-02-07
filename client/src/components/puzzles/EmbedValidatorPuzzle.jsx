import React, { useState } from 'react';
import socket from '../../socket';

export default function EmbedValidatorPuzzle({ puzzle, solved }) {
  const embed = puzzle.embed || {};
  const validatorFields = puzzle.validator?.fields || [];
  const [values, setValues] = useState(() => {
    const obj = {};
    validatorFields.forEach(f => { obj[f.id] = ''; });
    return obj;
  });
  const [feedback, setFeedback] = useState(null);

  const handleChange = (fieldId, val) => {
    setValues(prev => ({ ...prev, [fieldId]: val }));
  };

  const handleSubmit = () => {
    // Convert to numbers
    const numericAnswers = {};
    for (const f of validatorFields) {
      numericAnswers[f.id] = parseFloat(values[f.id]);
    }
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: numericAnswers }, (res) => {
      setFeedback(res);
    });
  };

  return (
    <div className="puzzle-block embed-puzzle">
      <p className="puzzle-prompt">{embed.instructions}</p>

      {/* PHET embed */}
      {embed.url && (
        <div className="embed-frame-wrap">
          <iframe
            src={embed.url}
            className="embed-frame"
            title="Simulation"
            allow="fullscreen"
          />
          <a href={embed.url} target="_blank" rel="noopener noreferrer" className="embed-link">
            Open in new tab ↗
          </a>
        </div>
      )}

      {/* Validator inputs */}
      {!solved ? (
        <>
          <div className="validator-fields">
            {validatorFields.map(field => (
              <div key={field.id} className="validator-field">
                <label className="label">{field.label}</label>
                <input
                  className="input puzzle-input"
                  type="number"
                  step="any"
                  value={values[field.id] || ''}
                  onChange={e => handleChange(field.id, e.target.value)}
                  placeholder={`Enter ${field.label}...`}
                />
                {field.max !== undefined && (
                  <span className="field-constraint">Max: {field.max}</span>
                )}
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Validate Measurements
          </button>
        </>
      ) : (
        <div className="feedback correct">Validated ✓</div>
      )}
      {feedback && !solved && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}
