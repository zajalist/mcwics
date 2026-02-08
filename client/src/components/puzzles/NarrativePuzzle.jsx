import React, { useState } from 'react';
import { BookOpen, FileText, Send, Check, X } from 'lucide-react';
import socket from '../../socket';

const TYPE_META = {
  narrative_clue:  { icon: BookOpen, label: 'Narrative Clue' },
  found_document:  { icon: FileText, label: 'Found Document' },
};

export default function NarrativePuzzle({ puzzle, solved, attempts }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const meta = TYPE_META[puzzle.type] || TYPE_META.narrative_clue;
  const Icon = meta.icon;

  const handleSubmit = () => {
    if (!answer.trim()) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: answer.trim() }, (res) => {
      setFeedback(res);
      if (res.correct) setAnswer('');
    });
  };

  if (solved) {
    return (
      <div className="puzzle-block solved">
        <div className="puzzle-header"><Icon size={16} /> {meta.label} <Check size={16} className="solved-icon" /></div>
        <p className="puzzle-prompt">{puzzle.prompt}</p>
        <div className="solved-badge">Discovered!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header"><Icon size={16} /> {meta.label}</div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Long-form narrative text */}
      {puzzle.narrativeText && (
        <div className="narrative-text" style={{
          background: 'rgba(13,27,42,0.5)',
          padding: 16,
          borderRadius: 8,
          borderLeft: '3px solid #e8dcc8',
          margin: '8px 0',
          fontStyle: puzzle.type === 'found_document' ? 'italic' : 'normal',
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6,
        }}>
          {puzzle.narrativeText}
        </div>
      )}

      {/* Document image */}
      {puzzle.imageUrl && (
        <div style={{ margin: '8px 0' }}>
          <img src={puzzle.imageUrl} alt="Document" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}

      {puzzle.hint && <p className="puzzle-hint">{puzzle.hint}</p>}

      <div className="puzzle-input-row">
        <input
          className="input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="What did you discover?"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
          <Send size={14} />
        </button>
      </div>

      {feedback && !feedback.correct && (
        <div className="puzzle-feedback wrong"><X size={14} /> {feedback.message}</div>
      )}
      {attempts > 0 && <div className="puzzle-attempts">Attempts: {attempts}</div>}
    </div>
  );
}
