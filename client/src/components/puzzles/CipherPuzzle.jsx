import React, { useState, useMemo } from 'react';
import { Lock, Send, Check, X, HelpCircle } from 'lucide-react';
import socket from '../../socket';

const CIPHER_LABELS = {
  cipher: 'Cipher',
  emoji_cipher: 'Emoji Cipher',
  ascii_cipher: 'ASCII Cipher',
  binary_cipher: 'Binary Cipher',
  qr_code: 'QR Code',
};

/* ── Helper: Caesar shift for the decode tool ── */
function caesarShift(text, shift) {
  return text.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch >= 'a' ? 97 : 65;
    return String.fromCharCode(((ch.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

/* ── Helper: Binary decode ── */
function tryBinaryDecode(text) {
  try {
    return text.trim().split(/\s+/).map(b => {
      const n = parseInt(b, 2);
      return (n >= 32 && n <= 126) ? String.fromCharCode(n) : '?';
    }).join('');
  } catch { return '(invalid binary)'; }
}

/* ── Helper: ASCII decode ── */
function tryAsciiDecode(text) {
  try {
    return text.trim().split(/\s+/).map(c => {
      const n = parseInt(c, 10);
      return (n >= 32 && n <= 126) ? String.fromCharCode(n) : '?';
    }).join('');
  } catch { return '(invalid)'; }
}

export default function CipherPuzzle({ puzzle, solved, attempts }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showTools, setShowTools] = useState(false);
  const [cShift, setCShift] = useState(3);

  const label = CIPHER_LABELS[puzzle.type] || 'Cipher';

  const handleSubmit = () => {
    if (!answer.trim()) return;
    socket.emit('SUBMIT_ANSWER', { puzzleId: puzzle.id, answer: answer.trim() }, (res) => {
      setFeedback(res);
      if (res.correct) setAnswer('');
    });
  };

  /* ── Decode tool output ── */
  const toolOutput = useMemo(() => {
    const enc = puzzle.encodedText || '';
    if (!enc || !showTools) return '';
    if (puzzle.type === 'binary_cipher') return tryBinaryDecode(enc);
    if (puzzle.type === 'ascii_cipher') return tryAsciiDecode(enc);
    if (puzzle.type === 'cipher') return caesarShift(enc, -cShift);
    return '';
  }, [puzzle.encodedText, puzzle.type, showTools, cShift]);

  if (solved) {
    return (
      <div className="puzzle-block solved">
        <div className="puzzle-header"><Lock size={16} /> {label} <Check size={16} className="solved-icon" /></div>
        <p className="puzzle-prompt">{puzzle.prompt}</p>
        <div className="solved-badge">Decoded!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header">
        <Lock size={16} /> {label}
        {puzzle.type !== 'qr_code' && (
          <button
            className="btn btn-xs btn-ghost"
            onClick={() => setShowTools(t => !t)}
            title="Toggle decode tools"
            style={{ marginLeft: 'auto' }}
          >
            <HelpCircle size={14} /> Tools
          </button>
        )}
      </div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Display encoded content */}
      {puzzle.encodedText && (
        <div className="cipher-display">
          <pre className="cipher-text">{puzzle.encodedText}</pre>
        </div>
      )}

      {/* QR code shows an image */}
      {puzzle.type === 'qr_code' && puzzle.imageUrl && (
        <div className="cipher-display">
          <img src={puzzle.imageUrl} alt="QR Code" className="cipher-image" />
        </div>
      )}

      {/* Decode tools panel */}
      {showTools && puzzle.type !== 'qr_code' && (
        <div className="cipher-tools" style={{
          background: 'rgba(13,27,42,0.6)',
          border: '1px solid rgba(212,165,116,0.2)',
          borderRadius: 8,
          padding: '0.6rem 0.8rem',
          fontSize: '0.82rem',
        }}>
          <div style={{ color: '#e8dcc8', fontWeight: 600, marginBottom: 4 }}>Decode Workbench</div>

          {puzzle.type === 'cipher' && (
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: 4 }}>
              <label style={{ color: '#a0aec0', fontSize: '0.75rem' }}>Caesar shift:</label>
              <input
                type="range" min="1" max="25" value={cShift}
                onChange={e => setCShift(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ color: '#f5e6d3', minWidth: 20, textAlign: 'center' }}>{cShift}</span>
            </div>
          )}

          {puzzle.type === 'binary_cipher' && (
            <div style={{ color: '#a0aec0', fontSize: '0.75rem', marginBottom: 4 }}>
              Binary → ASCII character conversion
            </div>
          )}

          {puzzle.type === 'ascii_cipher' && (
            <div style={{ color: '#a0aec0', fontSize: '0.75rem', marginBottom: 4 }}>
              ASCII code → character conversion
            </div>
          )}

          {puzzle.type === 'emoji_cipher' && (
            <div style={{ color: '#a0aec0', fontSize: '0.75rem', marginBottom: 4 }}>
              Try mapping each unique emoji to a letter of the alphabet.
            </div>
          )}

          {toolOutput && (
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '0.4rem 0.6rem',
              borderRadius: 4,
              fontFamily: 'var(--font-mono)',
              color: '#f5e6d3',
              wordBreak: 'break-all',
            }}>
              {toolOutput}
            </div>
          )}
        </div>
      )}

      {/* Hint if provided */}
      {puzzle.hint && <p className="puzzle-hint">{puzzle.hint}</p>}

      <div className="puzzle-input-row">
        <input
          className="input"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Enter decoded answer…"
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button className="btn btn-primary btn-sm" onClick={handleSubmit}>
          <Send size={14} />
        </button>
      </div>

      {feedback && !feedback.correct && (
        <div className="puzzle-feedback wrong">
          <X size={14} /> {feedback.message}
        </div>
      )}
      {attempts > 0 && <div className="puzzle-attempts">Attempts: {attempts}</div>}
    </div>
  );
}
