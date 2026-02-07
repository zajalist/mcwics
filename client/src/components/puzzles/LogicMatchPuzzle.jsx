import React, { useState } from 'react';
import socket from '../../socket';

export default function LogicMatchPuzzle({ puzzle, solved }) {
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const table = puzzle.dataTable || {};

  const handleSubmit = () => {
    if (!selected) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: selected }, (res) => {
      setFeedback(res);
    });
  };

  return (
    <div className="puzzle-block">
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Data table */}
      {table.rows && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                {table.columns?.map(col => (
                  <th key={col}>{col}</th>
                ))}
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => {
                const val = typeof row === 'string' ? row : row[table.columns[0]];
                return (
                  <tr key={i} className={selected === val ? 'selected-row' : ''}>
                    <td><code>{val}</code></td>
                    <td>
                      <button
                        className={`select-btn ${selected === val ? 'active' : ''}`}
                        onClick={() => !solved && setSelected(val)}
                        disabled={solved}
                      >
                        {selected === val ? '●' : '○'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {table.note && <p className="table-note">{table.note}</p>}
        </div>
      )}

      {!solved && (
        <button className="btn btn-primary" onClick={handleSubmit} disabled={!selected}>
          Confirm Selection
        </button>
      )}
      {feedback && (
        <div className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          {feedback.message}
        </div>
      )}
      {solved && <div className="feedback correct">Key Found ✓</div>}
    </div>
  );
}
