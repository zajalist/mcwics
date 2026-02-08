import React, { useState, useEffect, useRef } from 'react';
import { Calculator, Send, Check, X } from 'lucide-react';
import socket from '../../socket';

/**
 * LaTeX Math Puzzle — renders a LaTeX question and accepts a numeric/text answer.
 * Uses KaTeX for rendering if available, falls back to raw LaTeX display.
 */
export default function LatexMathPuzzle({ puzzle, solved, attempts }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const mathRef = useRef(null);

  // Try to render LaTeX with KaTeX (loaded via CDN)
  useEffect(() => {
    if (mathRef.current && puzzle.latexExpression) {
      if (window.katex) {
        try {
          window.katex.render(puzzle.latexExpression, mathRef.current, {
            throwOnError: false,
            displayMode: true,
          });
        } catch {
          mathRef.current.textContent = puzzle.latexExpression;
        }
      } else {
        mathRef.current.textContent = puzzle.latexExpression;
      }
    }
  }, [puzzle.latexExpression]);

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
        <div className="puzzle-header"><Calculator size={16} /> Math <Check size={16} className="solved-icon" /></div>
        <p className="puzzle-prompt">{puzzle.prompt}</p>
        <div className="solved-badge">Correct!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header"><Calculator size={16} /> Math</div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* LaTeX rendered expression */}
      {puzzle.latexExpression && (
        <div className="latex-display" ref={mathRef} style={{
          background: 'rgba(13,27,42,0.6)',
          padding: '16px',
          borderRadius: 8,
          textAlign: 'center',
          fontSize: '1.2rem',
          color: '#f5e6d3',
          margin: '8px 0',
          fontFamily: 'serif',
          overflowX: 'auto',
        }}>
          {puzzle.latexExpression}
        </div>
      )}

      {puzzle.hint && <p className="puzzle-hint">{puzzle.hint}</p>}

      <div className="puzzle-input-row">
        <input
          className="input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Enter your answer…"
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
