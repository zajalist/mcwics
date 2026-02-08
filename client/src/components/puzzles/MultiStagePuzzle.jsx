import React, { useState } from 'react';
import { Layers, Send, Check, X, ChevronRight } from 'lucide-react';
import socket from '../../socket';

/**
 * Multi-Stage Chain — a puzzle with multiple sequential stages.
 * Each stage has its own prompt; the player must answer the current stage
 * before seeing the next. The server validates against validation.stages[stageIdx].
 */
export default function MultiStagePuzzle({ puzzle, solved, attempts }) {
  const stages = puzzle.stages || [];
  const [stageIdx, setStageIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const currentStage = stages[stageIdx];

  const handleSubmit = () => {
    if (!answer.trim()) return;
    // Send answer with stage index so server knows which stage
    socket.emit('SUBMIT_ANSWER', {
      puzzleId: puzzle.id,
      answer: { stage: stageIdx, value: answer.trim() }
    }, (res) => {
      setFeedback(res);
      if (res.correct) {
        setAnswer('');
        // If more stages remain, advance locally
        if (stageIdx < stages.length - 1) {
          setStageIdx(prev => prev + 1);
          setFeedback(null);
        }
      }
    });
  };

  if (solved) {
    return (
      <div className="puzzle-block solved">
        <div className="puzzle-header"><Layers size={16} /> Multi-Stage Chain <Check size={16} className="solved-icon" /></div>
        <p className="puzzle-prompt">{puzzle.prompt}</p>
        <div className="solved-badge">All stages complete!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header">
        <Layers size={16} /> Multi-Stage Chain
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', opacity: 0.7 }}>
          Stage {stageIdx + 1} / {stages.length}
        </span>
      </div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {currentStage ? (
        <>
          <div style={{
            background: 'rgba(13,27,42,0.5)',
            padding: 12,
            borderRadius: 8,
            margin: '8px 0',
            borderLeft: '3px solid #e8dcc8',
          }}>
            <strong>Stage {stageIdx + 1}:</strong> {currentStage.prompt}
          </div>

          <div className="puzzle-input-row">
            <input
              className="input"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={currentStage.placeholder || 'Enter your answer…'}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
              <Send size={14} />
            </button>
          </div>
        </>
      ) : (
        <p className="puzzle-hint">No stages configured.</p>
      )}

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
        {stages.map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i < stageIdx ? '#10b981' : i === stageIdx ? '#e8dcc8' : '#1e293b',
            border: '1px solid #334155',
          }} />
        ))}
      </div>

      {feedback && !feedback.correct && (
        <div className="puzzle-feedback wrong"><X size={14} /> {feedback.message}</div>
      )}
      {attempts > 0 && <div className="puzzle-attempts">Attempts: {attempts}</div>}
    </div>
  );
}
