import React, { useState, useEffect, useRef } from 'react';
import { Lock, Search, User, Rocket, Puzzle, Trophy, Diamond, MapPin, Eye, Type, Sigma, FlaskConical, BookOpen, Code, Github, ExternalLink } from 'lucide-react';
import socket from '../socket';
import './HomePage.css';

/** Wait for the socket to be connected (with timeout) */
function ensureConnected(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (socket.connected) return resolve();
    if (!socket.connected) socket.connect();
    const timer = setTimeout(() => {
      socket.off('connect', onConnect);
      reject(new Error('Could not connect to game server. Is it running?'));
    }, timeoutMs);
    function onConnect() {
      clearTimeout(timer);
      resolve();
    }
    socket.once('connect', onConnect);
  });
}

export default function HomePage({ onRoomJoined, customScenarioJson, onClearCustom }) {
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenario, setSelectedScenario] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const createTimeoutRef = useRef(null);
  const demoRef = useRef(null);
  const [demoVisible, setDemoVisible] = useState(false);

  // If a custom scenario was passed from Browse → Play, auto-open create mode
  useEffect(() => {
    if (customScenarioJson) {
      setMode('create');
    }
  }, [customScenarioJson]);

  useEffect(() => {
    fetch('/api/scenarios')
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setScenarios(data);
          if (!customScenarioJson) setSelectedScenario(data[0].scenarioId);
        }
      })
      .catch(() => {
        /* silently fail — scenarios will stay empty, which is fine if server is down */
      });
    return () => {
      if (createTimeoutRef.current) clearTimeout(createTimeoutRef.current);
    };
  }, []);

  // Intersection Observer for scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setDemoVisible(true);
        }
      },
      { 
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (demoRef.current) {
      observer.observe(demoRef.current);
    }

    return () => {
      if (demoRef.current) {
        observer.unobserve(demoRef.current);
      }
    };
  }, []);

  const handleCreate = async () => {
    if (!playerName.trim()) return setError('Enter your name');
    setLoading(true);
    setError('');

    try {
      await ensureConnected(6000);
    } catch {
      setLoading(false);
      return setError('Cannot reach game server. Make sure it is running on port 3001.');
    }

    // Safety timeout — if callback never fires, bail after 10s
    createTimeoutRef.current = setTimeout(() => {
      setLoading(false);
      setError('Server did not respond. Try again or check the server.');
    }, 10000);

    const payload = customScenarioJson
      ? { customScenarioJson, playerName: playerName.trim() }
      : { scenarioId: selectedScenario, playerName: playerName.trim() };

    socket.emit('CREATE_ROOM', payload, (res) => {
      clearTimeout(createTimeoutRef.current);
      setLoading(false);
      if (!res || res.error) return setError(res?.error || 'Unknown error from server');
      if (customScenarioJson) onClearCustom?.();
      onRoomJoined(res);
    });
  };

  const handleJoin = async () => {
    if (!playerName.trim()) return setError('Enter your name');
    if (!joinCode.trim()) return setError('Enter a room code');
    setLoading(true);
    setError('');

    try {
      await ensureConnected(6000);
    } catch {
      setLoading(false);
      return setError('Cannot reach game server. Make sure it is running on port 3001.');
    }

    const timer = setTimeout(() => {
      setLoading(false);
      setError('Server did not respond. Try again.');
    }, 10000);

    socket.emit('JOIN_ROOM', {
      roomCode: joinCode.trim().toUpperCase(),
      playerName: playerName.trim()
    }, (res) => {
      clearTimeout(timer);
      setLoading(false);
      if (!res) return setError('No response from server');
      if (res.error) {
        // Provide user-friendly error messages
        if (res.error.includes('not found') || res.error.includes('does not exist')) {
          return setError('Room not found. Check your code and try again.');
        }
        return setError(res.error);
      }
      onRoomJoined(res);
    });
  };

  return (
    <>
      <div className="page home-page">
        <div className="home-container">
        <section className="home-hero">
          {/* Scavenger Hunt Decorative SVGs */}
          <svg className="hunt-decoration compass" width="70" height="70" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="#374E44" strokeWidth="3" fill="none"/>
            <circle cx="50" cy="50" r="35" stroke="#e8dcc8" strokeWidth="2" fill="none" opacity="0.5"/>
            <path d="M50 15 L55 50 L50 50 Z" fill="#e85d52"/>
            <path d="M50 85 L45 50 L50 50 Z" fill="#4a6b54"/>
            <circle cx="50" cy="50" r="5" fill="#e8dcc8"/>
          </svg>

          <svg className="hunt-decoration treasure-chest" width="60" height="60" viewBox="0 0 100 100" fill="none">
            <rect x="20" y="40" width="60" height="45" rx="5" fill="#887C63" stroke="#e8dcc8" strokeWidth="2"/>
            <path d="M20 40 Q50 25 80 40" fill="#e8dcc8" stroke="#e8dcc8" strokeWidth="2"/>
            <circle cx="50" cy="60" r="6" fill="#e8dcc8"/>
            <rect x="47" y="60" width="6" height="15" fill="#e8dcc8"/>
          </svg>

          <svg className="hunt-decoration map-icon" width="65" height="65" viewBox="0 0 100 100" fill="none">
            <rect x="15" y="25" width="70" height="55" rx="3" fill="#e8dcc8" stroke="#887C63" strokeWidth="2"/>
            <path d="M25 40 L45 35 L45 70 L25 75 Z" fill="#e8dcc8" opacity="0.3"/>
            <path d="M45 35 L65 40 L65 75 L45 70 Z" fill="#374E44" opacity="0.3"/>
            <line x1="25" y1="40" x2="25" y2="75" stroke="#887C63" strokeWidth="1.5"/>
            <line x1="45" y1="35" x2="45" y2="70" stroke="#887C63" strokeWidth="1.5"/>
            <line x1="65" y1="40" x2="65" y2="75" stroke="#887C63" strokeWidth="1.5"/>
          </svg>

          <svg className="hunt-decoration key-icon" width="45" height="45" viewBox="0 0 100 100" fill="none">
            <circle cx="30" cy="30" r="15" stroke="#e8dcc8" strokeWidth="4" fill="none"/>
            <line x1="40" y1="40" x2="75" y2="75" stroke="#e8dcc8" strokeWidth="5" strokeLinecap="round"/>
            <rect x="60" y="68" width="8" height="5" fill="#e8dcc8"/>
            <rect x="70" y="68" width="8" height="5" fill="#e8dcc8"/>
          </svg>

          <svg className="hunt-decoration footprint-1" width="35" height="35" viewBox="0 0 50 70" fill="none">
            <ellipse cx="25" cy="45" rx="12" ry="18" fill="#374E44" opacity="0.3"/>
            <circle cx="15" cy="20" r="4" fill="#374E44" opacity="0.3"/>
            <circle cx="22" cy="15" r="4" fill="#374E44" opacity="0.3"/>
            <circle cx="28" cy="15" r="4" fill="#374E44" opacity="0.3"/>
            <circle cx="35" cy="20" r="4" fill="#374E44" opacity="0.3"/>
          </svg>

          <svg className="hunt-decoration footprint-2" width="35" height="35" viewBox="0 0 50 70" fill="none">
            <ellipse cx="25" cy="45" rx="12" ry="18" fill="#374E44" opacity="0.3"/>
            <circle cx="15" cy="20" r="4" fill="#374E44" opacity="0.3"/>
            <circle cx="22" cy="15" r="4" fill="#374E44" opacity="0.3"/>
            <circle cx="28" cy="15" r="4" fill="#374E44" opacity="0.3"/>
            <circle cx="35" cy="20" r="4" fill="#374E44" opacity="0.3"/>
          </svg>

          <svg className="hunt-decoration clue-note" width="50" height="50" viewBox="0 0 100 100" fill="none">
            <rect x="20" y="15" width="60" height="70" rx="3" fill="#e8dcc8" stroke="#887C63" strokeWidth="2"/>
            <line x1="30" y1="30" x2="70" y2="30" stroke="#374E44" strokeWidth="2" opacity="0.4"/>
            <line x1="30" y1="45" x2="65" y2="45" stroke="#374E44" strokeWidth="2" opacity="0.4"/>
            <line x1="30" y1="60" x2="70" y2="60" stroke="#374E44" strokeWidth="2" opacity="0.4"/>
            <path d="M75 10 L80 15 L75 20 Z" fill="#e85d52"/>
          </svg>

          <div className="hero-content">
            <div className="hero-eyebrow">Co-op narrative experiences</div>
            <h1 className="hero-title">
              <span className="title-lock">LOCK</span>
              <span className="title-step">STEP</span>
            </h1>
            <p className="hero-description">
              LockStep is a guided, co-op puzzle journey for teams who want meaningful, memorable
              sessions without complex setup. Build a room, assign roles, and lead participants
              through a story built for collaboration.
            </p>
            {!mode && (
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => setMode('create')}>
                  Create Room
                </button>
                <button className="btn btn-secondary" onClick={() => setMode('join')}>
                  Join Room
                </button>
              </div>
            )}
          </div>

          <div className="hero-side">
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
                  <div className="scenario-selector">
                    <label className="label">Choose a Scenario</label>
                    {scenarios.length === 0 ? (
                      <p className="scenario-desc" style={{ margin: '0.3rem 0 0.6rem' }}>
                        No template scenarios available — make sure the server is running.
                      </p>
                    ) : (
                      <div className="scenario-grid-home">
                        {scenarios.map(s => (
                          <div
                            key={s.scenarioId}
                            className={`scenario-option ${selectedScenario === s.scenarioId ? 'selected' : ''}`}
                            onClick={() => setSelectedScenario(s.scenarioId)}
                          >
                            <div className="scenario-option-title">{s.title}</div>
                            <div className="scenario-option-desc">{s.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    className="btn btn-primary"
                    onClick={handleCreate}
                    disabled={loading || (!customScenarioJson && !selectedScenario)}
                  >
                    {loading ? 'Creating...' : 'Create'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => { setMode(null); setError(''); }}>
                    Back
                  </button>
                </div>
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

            {!mode && (
              <div className="hero-panel">
                <h3>Designed for groups</h3>
                <div className="hero-stat">
                  <span className="hero-stat-title">Host-ready flows</span>
                  <span className="hero-stat-desc">Launch a session in minutes with templates or a custom story.</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-title">Guided collaboration</span>
                  <span className="hero-stat-desc">Roles, clues, and shared puzzles keep everyone engaged.</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-title">Professional polish</span>
                  <span className="hero-stat-desc">A branded, elegant interface that matches the LockStep vibe.</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {error && (
          <div className="error-msg" onClick={() => setError('')} style={{ cursor: 'pointer' }}>
            {error} <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>(click to dismiss)</span>
          </div>
        )}

        {/* Animated Demo Section */}
        <section className={`demo-section ${demoVisible ? 'visible' : ''}`} ref={demoRef}>
          <h2 className="section-title">See how it works</h2>
          <p className="section-subtitle">
            Build node-based scenarios with intuitive connections, interactive puzzles, and collaborative gameplay.
          </p>
          
          <div className="demo-container">
            {/* Node Drag & Drop Demo */}
            <div className="demo-feature">
              <div className="demo-visual">
                <div className="demo-canvas">
                  {/* Node Palette */}
                  <div className="node-palette">
                    <div className="palette-title">Add Nodes</div>
                    <div className="palette-node palette-start">
                      <Rocket size={14} />
                      <span>Start</span>
                    </div>
                    <div className="palette-node palette-puzzle">
                      <Puzzle size={14} />
                      <span>Puzzle</span>
                    </div>
                  </div>
                  
                  {/* Dropped Nodes */}
                  <div className="demo-node dropped-node-1">
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-type"><Rocket size={12} /> Start</span>
                        <span className="node-id">S1</span>
                      </div>
                      <div className="node-title">Mission Start</div>
                      <div className="node-sub">Begin journey</div>
                    </div>
                    <div className="node-handle handle-right"></div>
                  </div>
                  
                  <div className="demo-node dropped-node-2">
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-type"><Puzzle size={12} /> Puzzle</span>
                        <span className="node-id">P1</span>
                      </div>
                      <div className="node-title">First Clue</div>
                      <div className="node-sub">Location puzzle</div>
                    </div>
                    <div className="node-handle handle-left"></div>
                    <div className="node-handle handle-right"></div>
                  </div>
                  
                  {/* Dragging Node Ghost */}
                  <div className="demo-node dragging-node">
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-type"><Rocket size={12} /> Start</span>
                        <span className="node-id">S1</span>
                      </div>
                      <div className="node-title">Mission Start</div>
                      <div className="node-sub">Begin journey</div>
                    </div>
                  </div>
                  
                  <div className="demo-cursor cursor-drag"></div>
                </div>
              </div>
              <div className="demo-description">
                <h3>Drag & Drop Nodes</h3>
                <p>Pick nodes from the palette and place them on the canvas to build your story structure.</p>
              </div>
            </div>
            
            {/* Node Connection Demo */}
            <div className="demo-feature reverse">
              <div className="demo-visual">
                <div className="demo-canvas demo-canvas-connect">
                  <div className="demo-node connect-node-1">
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-type"><Rocket size={12} /> Start</span>
                        <span className="node-id">S1</span>
                      </div>
                      <div className="node-title">Mission Start</div>
                      <div className="node-sub">Begin journey</div>
                    </div>
                    <div className="node-handle handle-right connect-handle-1"></div>
                  </div>
                  
                  <div className="demo-node connect-node-2">
                    <div className="node-content">
                      <div className="node-header">
                        <span className="node-type"><Puzzle size={12} /> Puzzle</span>
                        <span className="node-id">P1</span>
                      </div>
                      <div className="node-title">First Clue</div>
                      <div className="node-sub">Location puzzle</div>
                    </div>
                    <div className="node-handle handle-left connect-handle-2"></div>
                  </div>
                  
                  {/* Connection Line */}
                  <svg className="connection-svg" width="100%" height="100%">
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" fill="#3b82f6">
                        <polygon points="0 0, 10 3, 0 6" />
                      </marker>
                    </defs>
                    <path className="connection-path" d="M 0 0 L 0 0" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5,5" />
                    <path className="final-connection" d="M 205 120 C 255 120, 285 120, 335 120" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="200" strokeDashoffset="200" marker-end="url(#arrowhead)"/>
                  </svg>
                  
                  <div className="demo-cursor cursor-connect"></div>
                </div>
              </div>
              <div className="demo-description">
                <h3>Connect Nodes</h3>
                <p>Drag from output handles to input handles to create connections and define the flow.</p>
              </div>
            </div>

            {/* Puzzle Interaction Demo */}
            <div className="demo-feature reverse">
              <div className="demo-visual">
                <div className="puzzle-demo">
                  <div className="puzzle-card">
                    <div className="puzzle-header">
                      <div className="puzzle-icon"><Lock size={32} strokeWidth={2.5} /></div>
                      <div className="puzzle-title">Crack the Code</div>
                    </div>
                    <div className="puzzle-clues">
                      <div className="clue-item"><Search size={16} className="clue-icon" /> Clue 1: The sum is 15</div>
                      <div className="clue-item"><Search size={16} className="clue-icon" /> Clue 2: All digits are odd</div>
                    </div>
                    <div className="puzzle-input">
                      <input className="code-digit" value="5" readOnly />
                      <input className="code-digit" value="5" readOnly />
                      <input className="code-digit" value="5" readOnly />
                    </div>
                    <div className="puzzle-status">✓ Solved!</div>
                  </div>
                </div>
              </div>
              <div className="demo-description">
                <h3>Interactive Puzzles</h3>
                <p>Create collaborative challenges where team members share clues and work together to unlock the next stage.</p>
              </div>
            </div>

            {/* Puzzle Types Demo */}
            <div className="demo-feature">
              <div className="demo-visual">
                <div className="puzzle-types-demo">
                  <div className="puzzle-type-card type-1">
                    <Diamond size={32} strokeWidth={2.5} />
                    <div className="type-label">Primitives</div>
                  </div>
                  <div className="puzzle-type-card type-2">
                    <Lock size={32} strokeWidth={2.5} />
                    <div className="type-label">Ciphers</div>
                  </div>
                  <div className="puzzle-type-card type-3">
                    <MapPin size={32} strokeWidth={2.5} />
                    <div className="type-label">Location</div>
                  </div>
                  <div className="puzzle-type-card type-4">
                    <Eye size={32} strokeWidth={2.5} />
                    <div className="type-label">Perception</div>
                  </div>
                  <div className="puzzle-type-card type-5">
                    <Type size={32} strokeWidth={2.5} />
                    <div className="type-label">Word & Language</div>
                  </div>
                  <div className="puzzle-type-card type-6">
                    <Sigma size={32} strokeWidth={2.5} />
                    <div className="type-label">Math</div>
                  </div>
                  <div className="puzzle-type-card type-7">
                    <FlaskConical size={32} strokeWidth={2.5} />
                    <div className="type-label">Science</div>
                  </div>
                  <div className="puzzle-type-card type-8">
                    <BookOpen size={32} strokeWidth={2.5} />
                    <div className="type-label">Storytelling</div>
                  </div>
                  <div className="puzzle-type-card type-9">
                    <Code size={32} strokeWidth={2.5} />
                    <div className="type-label">Code</div>
                  </div>
                </div>
              </div>
              <div className="demo-description">
                <h3>Diverse Puzzle Types</h3>
                <p>Choose from 9 puzzle categories with dozens of question types. Build scavenger hunts with ciphers, riddles, math challenges, and more.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-section">
          <h2 className="section-title">Use cases that fit your audience</h2>
          <p className="section-subtitle">
            LockStep adapts to learning, exploration, and team bonding—any setting where you want
            people solving problems together with purpose.
          </p>
          <div className="use-case-grid">
            <div className="use-case-card">
              <div className="use-case-title">Instructors</div>
              <div className="use-case-text">Run immersive lessons with collaborative checkpoints and role prompts.</div>
            </div>
            <div className="use-case-card">
              <div className="use-case-title">Tour guides</div>
              <div className="use-case-text">Layer narrative challenges onto real-world visits and cultural tours.</div>
            </div>
            <div className="use-case-card">
              <div className="use-case-title">Communities</div>
              <div className="use-case-text">Host story-based scavenges for festivals, meetups, and local groups.</div>
            </div>
            <div className="use-case-card">
              <div className="use-case-title">Clubs</div>
              <div className="use-case-text">Deliver episodic puzzles that keep members returning each week.</div>
            </div>
            <div className="use-case-card">
              <div className="use-case-title">Job bonding</div>
              <div className="use-case-text">Replace icebreakers with collaborative missions and meaningful debriefs.</div>
            </div>
            <div className="use-case-card">
              <div className="use-case-title">Onboarding</div>
              <div className="use-case-text">Give new teams a guided story to learn tools, roles, and culture.</div>
            </div>
          </div>
        </section>

        <section className="home-section">
          <h2 className="section-title">How it works</h2>
          <div className="how-grid">
            <div className="how-card">
              <div className="how-step">Step 01</div>
              <div className="how-title">Choose or create a scenario</div>
              <div className="how-text">Use templates or build your own in the LockStep editor.</div>
            </div>
            <div className="how-card">
              <div className="how-step">Step 02</div>
              <div className="how-title">Invite your group</div>
              <div className="how-text">Share a room code and assign roles for cooperative play.</div>
            </div>
            <div className="how-card">
              <div className="how-step">Step 03</div>
              <div className="how-title">Guide the journey</div>
              <div className="how-text">Run puzzles, reveal clues, and track progress in real time.</div>
            </div>
          </div>
        </section>

        <section className="home-cta">
          <div className="home-cta-text">Ready to host your first session?</div>
          <div className="home-cta-actions">
            <button className="btn btn-primary" onClick={() => setMode('create')}>
              Start a Room
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('join')}>
              Join a Session
            </button>
          </div>
        </section>
        </div>
      </div>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-links">
            <a href="https://github.com/yourusername/lockstep" target="_blank" rel="noopener noreferrer" className="footer-link">
              <Github size={16} /> GitHub
            </a>
            <a href="https://github.com/yourusername/lockstep/blob/main/docs/specifications.md" target="_blank" rel="noopener noreferrer" className="footer-link">
              <ExternalLink size={16} /> Documentation
            </a>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} LockStep. Built for collaborative scavenger hunts and team learning.
          </div>
        </div>
      </footer>
    </>
  );
}
