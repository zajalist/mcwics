import React, { useState } from 'react';
import { Eye, Headphones, Search, Send, Check, X } from 'lucide-react';
import socket from '../../socket';

const TYPE_META = {
  spot_difference: { icon: Eye,        label: 'Spot the Difference', placeholder: 'Describe the differences…' },
  hidden_object:   { icon: Search,     label: 'Hidden Objects',      placeholder: 'What did you find?' },
  audio_clue:      { icon: Headphones, label: 'Audio Clue',          placeholder: 'Enter your answer…' },
};

export default function PerceptionPuzzle({ puzzle, solved, attempts }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);

  const meta = TYPE_META[puzzle.type] || TYPE_META.spot_difference;
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
        <div className="solved-badge">Found!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header"><Icon size={16} /> {meta.label}</div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Spot-the-difference: two images side by side */}
      {puzzle.type === 'spot_difference' && (
        <div className="perception-images" style={{ display: 'flex', gap: 8 }}>
          {puzzle.imageUrlA && <img src={puzzle.imageUrlA} alt="Image A" style={{ maxWidth: '48%', borderRadius: 8 }} />}
          {puzzle.imageUrlB && <img src={puzzle.imageUrlB} alt="Image B" style={{ maxWidth: '48%', borderRadius: 8 }} />}
        </div>
      )}

      {/* Hidden object: single image */}
      {puzzle.type === 'hidden_object' && puzzle.imageUrl && (
        <div className="perception-image">
          <img src={puzzle.imageUrl} alt="Search this image" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}

      {/* Audio clue: audio player */}
      {puzzle.type === 'audio_clue' && puzzle.audioUrl && (
        <div className="audio-player">
          <audio controls src={puzzle.audioUrl} style={{ width: '100%' }}>
            Your browser does not support audio.
          </audio>
        </div>
      )}

      {puzzle.hint && <p className="puzzle-hint">{puzzle.hint}</p>}

      <div className="puzzle-input-row">
        <input
          className="input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={meta.placeholder}
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
