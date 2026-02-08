import React, { useState, useEffect } from 'react';
import socket from '../socket';

export default function HomePage({ onRoomJoined, customScenarioJson, onClearCustom }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If a custom scenario was passed from Browse → Play, auto-open create mode
  useEffect(() => {
    if (customScenarioJson) {
      setMode('create');
    }
  }, [customScenarioJson]);

  useEffect(() => {
    fetch('/api/scenarios')
      .then(res => res.json())
      .then(data => {
        setScenarios(data);
        if (data.length > 0 && !customScenarioJson) setSelectedScenario(data[0].scenarioId);
      })
      .catch(() => setError('Failed to load scenarios'));
  }, []);

  const handleCreate = () => {
    if (!playerName.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');

    // Ensure socket is connected
    if (!socket.connected) {
      socket.connect();
    }

    // If we have a custom scenario JSON (from Firestore), send the full JSON to the server
    if (customScenarioJson) {
      // Ensure socket is connected before emitting
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit('CREATE_ROOM', {
        customScenarioJson,
        playerName: playerName.trim()
      }, (res) => {
        setLoading(false);
        if (res.error) return setError(res.error);
        onClearCustom?.();
        onRoomJoined(res);
      });
      return;
    }

    socket.emit('CREATE_ROOM', {
      scenarioId: selectedScenario,
      playerName: playerName.trim()
    }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onRoomJoined(res);
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) return setError('Enter your name');
    if (!joinCode.trim()) return setError('Enter a room code');
    setLoading(true);
    setError('');
    socket.emit('JOIN_ROOM', {
      roomCode: joinCode.trim().toUpperCase(),
      playerName: playerName.trim()
    }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onRoomJoined(res);
    });
  };

  return (
    <div className="page home-page">
      <div className="home-container">
        <h1 className="title">
          <span className="title-lock">LOCK</span>
          <span className="title-step">STEP</span>
        </h1>
        <p className="subtitle">Co-op Narrative Puzzle Escape</p>

        {!mode && (
          <div className="home-buttons">
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              Create Room
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="form-card">
            <h2>{customScenarioJson ? 'Host a Scavenge' : 'Create a Room'}</h2>
            <input
              className="input"
              placeholder="Your Name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            {customScenarioJson ? (
              <div className="custom-scenario-info">
                <p className="scenario-desc">
                  <strong>{customScenarioJson.scenarios?.[0]?.title || 'Custom Scenario'}</strong><br />
                  {customScenarioJson.scenarios?.[0]?.description || 'A user-created scenario'}
                </p>
                <button className="btn btn-ghost btn-xs" onClick={() => { onClearCustom?.(); setMode(null); }}>
                  Choose a different scenario
                </button>
              </div>
            ) : (
              <>
                <label className="label">Scenario</label>
                <select
                  className="input"
                  value={selectedScenario}
                  onChange={e => setSelectedScenario(e.target.value)}
                >
                  {scenarios.map(s => (
                    <option key={s.scenarioId} value={s.scenarioId}>
                      {s.title}
                    </option>
                  ))}
                </select>
                {scenarios.find(s => s.scenarioId === selectedScenario) && (
                  <p className="scenario-desc">
                    {scenarios.find(s => s.scenarioId === selectedScenario).description}
                  </p>
                )}
              </>
            )}
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setMode(null); setError(''); }}>
              Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="form-card">
            <h2>Join a Room</h2>
            <input
              className="input"
              placeholder="Your Name"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
            />
            <input
              className="input code-input"
              placeholder="Room Code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button
              className="btn btn-primary"
              onClick={handleJoin}
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
            <button className="btn btn-ghost" onClick={() => { setMode(null); setError(''); }}>
              Back
            </button>
          </div>
        )}

        {error && (
          <div className="error-msg" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
            {error} <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>(click to dismiss)</span>
          </div>
        )}
      </div>
    </div>
  );
}
