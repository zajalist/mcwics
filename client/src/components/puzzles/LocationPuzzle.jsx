import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, Send, Check, X, Map, Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import socket from '../../socket';

const TYPE_META = {
  gps_coordinate:     { icon: MapPin,     label: 'GPS Coordinate',     placeholder: 'e.g. 45.5017, -73.5673' },
  landmark_id:        { icon: MapPin,     label: 'Landmark ID',        placeholder: 'Enter landmark name…' },
  directional_riddle: { icon: Navigation, label: 'Directional Riddle', placeholder: 'Enter your answer…' },
};

/* ── Leaflet-free map embed using OpenStreetMap iframe ── */
function MapEmbed({ lat, lng }) {
  if (!lat || !lng) return null;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.02},${lat-0.015},${lng+0.02},${lat+0.015}&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div style={{ border: '1px solid rgba(212,165,116,0.3)', borderRadius: 8, overflow: 'hidden', marginBottom: '0.5rem' }}>
      <iframe src={src} style={{ width: '100%', height: 250, border: 'none' }} title="Location Map" loading="lazy" />
    </div>
  );
}

/* ── Directional Grid Puzzle ── */
function DirectionalGrid({ puzzle, onAnswer }) {
  const gridSize = puzzle.gridSize || 5;
  const startLabel = puzzle.startLabel || 'Start';

  // Parse directions from string
  const directions = useMemo(() => {
    if (!puzzle.directions) return [];
    return puzzle.directions.split('\n').filter(Boolean).map(line => {
      const parts = line.trim().split(/\s+/);
      const dir = (parts[0] || '').toUpperCase();
      const steps = parseInt(parts[1]) || 1;
      return { dir, steps, raw: line.trim() };
    });
  }, [puzzle.directions]);

  const [playerPos, setPlayerPos] = useState({ row: Math.floor(gridSize / 2), col: Math.floor(gridSize / 2) });
  const [currentStep, setCurrentStep] = useState(0);
  const [trail, setTrail] = useState([{ row: Math.floor(gridSize / 2), col: Math.floor(gridSize / 2) }]);

  const startPos = { row: Math.floor(gridSize / 2), col: Math.floor(gridSize / 2) };

  const movePlayer = (dir) => {
    setPlayerPos(pos => {
      let { row, col } = pos;
      if (dir === 'N' && row > 0) row--;
      if (dir === 'S' && row < gridSize - 1) row++;
      if (dir === 'W' && col > 0) col--;
      if (dir === 'E' && col < gridSize - 1) col++;
      const newPos = { row, col };
      setTrail(t => [...t, newPos]);
      return newPos;
    });
  };

  const handleFollowStep = () => {
    if (currentStep >= directions.length) return;
    const d = directions[currentStep];
    let pos = { ...playerPos };
    const newTrail = [...trail];
    for (let i = 0; i < d.steps; i++) {
      if (d.dir === 'N' && pos.row > 0) pos.row--;
      else if (d.dir === 'S' && pos.row < gridSize - 1) pos.row++;
      else if (d.dir === 'W' && pos.col > 0) pos.col--;
      else if (d.dir === 'E' && pos.col < gridSize - 1) pos.col++;
      newTrail.push({ ...pos });
    }
    setPlayerPos(pos);
    setTrail(newTrail);
    setCurrentStep(s => s + 1);
  };

  const handleReset = () => {
    setPlayerPos(startPos);
    setCurrentStep(0);
    setTrail([startPos]);
  };

  const trailSet = useMemo(() => new Set(trail.map(t => `${t.row},${t.col}`)), [trail]);

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gap: 2,
        maxWidth: Math.min(gridSize * 44, 300),
        margin: '0 auto 0.5rem',
      }}>
        {Array.from({ length: gridSize * gridSize }, (_, idx) => {
          const row = Math.floor(idx / gridSize);
          const col = idx % gridSize;
          const isPlayer = row === playerPos.row && col === playerPos.col;
          const isStart = row === startPos.row && col === startPos.col;
          const isTrail = trailSet.has(`${row},${col}`);
          return (
            <div key={idx} style={{
              width: '100%', aspectRatio: '1',
              borderRadius: 3,
              background: isPlayer ? '#e8dcc8' : isTrail ? 'rgba(232,220,200,0.2)' : 'rgba(38,59,85,0.4)',
              border: isStart ? '2px solid #8b5cf6' : '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', color: isPlayer ? '#0d1b2a' : '#a0aec0',
              fontWeight: isPlayer ? 700 : 400,
              transition: 'background 0.2s',
            }}>
              {isPlayer ? '●' : isStart && !isTrail ? 'S' : ''}
            </div>
          );
        })}
      </div>

      {/* Compass controls */}
      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', marginBottom: '0.4rem' }}>
        <button className="btn btn-xs" onClick={() => movePlayer('N')} title="North"><ArrowUp size={12} /></button>
        <button className="btn btn-xs" onClick={() => movePlayer('W')} title="West"><ArrowLeft size={12} /></button>
        <button className="btn btn-xs" onClick={() => movePlayer('S')} title="South"><ArrowDown size={12} /></button>
        <button className="btn btn-xs" onClick={() => movePlayer('E')} title="East"><ArrowRight size={12} /></button>
        <button className="btn btn-xs" onClick={handleReset} style={{ marginLeft: 8 }}>Reset</button>
      </div>

      {/* Directions list */}
      {directions.length > 0 && (
        <div style={{
          background: 'rgba(13,27,42,0.5)',
          borderRadius: 6,
          padding: '0.4rem 0.6rem',
          fontSize: '0.78rem',
          marginBottom: '0.4rem',
        }}>
          <div style={{ color: '#e8dcc8', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Compass size={13} /> Directions
          </div>
          {directions.map((d, i) => (
            <div key={i} style={{
              color: i < currentStep ? '#10b981' : i === currentStep ? '#f5e6d3' : '#607080',
              textDecoration: i < currentStep ? 'line-through' : 'none',
              fontSize: '0.75rem',
              padding: '1px 0',
            }}>
              {i + 1}. {d.raw} {i < currentStep && '✓'}
            </div>
          ))}
          {currentStep < directions.length && (
            <button className="btn btn-xs" onClick={handleFollowStep} style={{ marginTop: 4 }}>
              Follow Step {currentStep + 1}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function LocationPuzzle({ puzzle, solved, attempts }) {
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showMap, setShowMap] = useState(true);

  const meta = TYPE_META[puzzle.type] || TYPE_META.gps_coordinate;
  const Icon = meta.icon;

  // Parse coordinates from puzzle config if available
  const coords = puzzle.coordinates || puzzle.mapCenter || null;
  const hasCoords = coords && coords.lat && coords.lng;

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
        <div className="solved-badge">Located!</div>
      </div>
    );
  }

  return (
    <div className="puzzle-block">
      <div className="puzzle-header">
        <Icon size={16} /> {meta.label}
        {hasCoords && (
          <button
            className="btn btn-xs btn-ghost"
            onClick={() => setShowMap(s => !s)}
            style={{ marginLeft: 'auto' }}
            title="Toggle map"
          >
            <Map size={14} /> Map
          </button>
        )}
      </div>
      <p className="puzzle-prompt">{puzzle.prompt}</p>

      {/* Directional riddle grid */}
      {puzzle.type === 'directional_riddle' && (puzzle.directions || puzzle.gridSize) && (
        <DirectionalGrid puzzle={puzzle} />
      )}

      {/* Interactive map */}
      {hasCoords && showMap && (
        <MapEmbed lat={coords.lat} lng={coords.lng} zoom={coords.zoom || 14} />
      )}

      {/* Show image (for landmark, directional) */}
      {puzzle.imageUrl && (
        <div className="location-image">
          <img src={puzzle.imageUrl} alt="Location clue" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}

      {/* Map hint */}
      {puzzle.mapHint && <p className="puzzle-hint">{puzzle.mapHint}</p>}

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
