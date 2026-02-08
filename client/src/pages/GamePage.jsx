import React, { useState } from 'react';
import { Wrench, Compass, Search, ChevronRight, LogOut } from 'lucide-react';
import socket from '../socket';
import MeterPanel from '../components/MeterPanel';
import StoryPanel from '../components/StoryPanel';
import RoleCluePanel from '../components/RoleCluePanel';
import PuzzlePanel from '../components/PuzzlePanel';
import ChoiceNode from '../components/ChoiceNode';
import WinScreen from '../components/WinScreen';
import FailScreen from '../components/FailScreen';

export default function GamePage({ roomState, playerId, gameOver, onBackToHome }) {
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const handleQuit = () => {
    socket.emit('QUIT_GAME', {}, () => {
      onBackToHome();
    });
  };

  if (gameOver) {
    if (gameOver.won) {
      return <WinScreen gameOver={gameOver} roomState={roomState} onBackToHome={onBackToHome} />;
    }
    return <FailScreen gameOver={gameOver} roomState={roomState} onBackToHome={onBackToHome} />;
  }

  if (!roomState || !roomState.gameState || !roomState.currentNode) {
    return (
      <div className="page game-page">
        <div className="loading">Loading game...</div>
      </div>
    );
  }

  const { currentNode, gameState, scenarioId } = roomState;
  const me = roomState.players.find(p => p.id === playerId);
  const myRole = me?.role;

  // Check if current node is a win node (or endpoint with win outcome)
  if (currentNode.type === 'win_node' || (currentNode.type === 'endpoint_node' && currentNode.outcome === 'win')) {
    return (
      <WinScreen
        gameOver={{ won: true, title: currentNode.story.title, reason: currentNode.story.text, mediaUrl: currentNode.mediaUrl }}
        roomState={roomState}
        onBackToHome={onBackToHome}
      />
    );
  }

  // Check if current node is a fail node (or endpoint with fail outcome)
  if (currentNode.type === 'fail_node' || (currentNode.type === 'endpoint_node' && currentNode.outcome === 'fail')) {
    return (
      <FailScreen
        gameOver={{ won: false, title: currentNode.story.title || 'Game Over', reason: currentNode.story.text, mediaUrl: currentNode.mediaUrl }}
        roomState={roomState}
        onBackToHome={onBackToHome}
      />
    );
  }

  // Compute puzzle assignments for current player
  const puzzleAssignments = gameState.puzzleAssignments || {};
  const hasAssignments = Object.keys(puzzleAssignments).length > 0;
  const myAssignedPuzzleIds = hasAssignments
    ? Object.entries(puzzleAssignments).filter(([_, pid]) => pid === playerId).map(([puzzleId]) => puzzleId)
    : null;

  const puzzleBackgroundUrl = currentNode.type === 'puzzle_node'
    ? currentNode.backgroundImageUrl || ''
    : '';
  const puzzleBackgroundStyle = puzzleBackgroundUrl
    ? { backgroundImage: `url(${puzzleBackgroundUrl})` }
    : undefined;

  return (
    <div className="page game-page">
      <div className="game-layout">
        {/* Top bar: meters + timer */}
        <div style={{ position: 'relative' }}>
          <MeterPanel
            vars={gameState.vars}
            scenarioId={scenarioId}
            timeRemaining={gameState.timeRemainingSeconds}
          />
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowQuitConfirm(true)}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              fontSize: '0.85rem'
            }}
          >
            <LogOut size={16} />
            Quit
          </button>
        </div>

        {/* Quit Confirmation Modal */}
        {showQuitConfirm && (
          <div className="preview-modal-overlay" onClick={() => setShowQuitConfirm(false)}>
            <div className="preview-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
              <div className="palette-modal-header">
                <h3>Quit Game?</h3>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                  Are you sure you want to quit? Your assigned puzzles will be reassigned to remaining players.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowQuitConfirm(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-sm" onClick={handleQuit} style={{ background: '#d32f2f', color: '#fff' }}>
                    Quit Game
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="game-main">
          {/* Left: Story + Role Clues */}
          <div className="game-left">
            <StoryPanel story={currentNode.story} location={currentNode.location} />
            <RoleCluePanel roleClues={currentNode.roleClues} myRole={myRole} />
          </div>

          {/* Right: Puzzle / Choice area */}
          <div className={`game-right ${puzzleBackgroundUrl ? 'with-puzzle-bg' : ''}`} style={puzzleBackgroundStyle}>
            {currentNode.type === 'start_node' ? (
              <div className="start-intro">
                <h2>{currentNode.story?.title || 'Mission Briefing'}</h2>
                {currentNode.story?.text && <p className="start-text">{currentNode.story.text}</p>}
                {currentNode.story?.narrationText && <p className="start-narration">{currentNode.story.narrationText}</p>}
                <button className="btn btn-primary start-continue" onClick={() => socket.emit('ADVANCE_NODE', {}, () => {})}>
                  Begin Mission <ChevronRight size={16} style={{verticalAlign:'middle'}} />
                </button>
              </div>
            ) : currentNode.type === 'choice_node' ? (
              <ChoiceNode choices={currentNode.choices} />
            ) : currentNode.type === 'puzzle_node' ? (
              <PuzzlePanel
                puzzles={currentNode.puzzles || []}
                solvedPuzzles={gameState.solvedPuzzles}
                puzzleAttempts={gameState.puzzleAttempts}
                nodeId={currentNode.id}
                hasNextNode={!!currentNode.nextNodeId}
                myAssignedPuzzleIds={myAssignedPuzzleIds}
              />
            ) : null}
          </div>
        </div>

        {/* Players bar */}
        <div className="players-bar">
          {roomState.players.map(p => (
            <div key={p.id} className={`player-badge ${!p.connected ? 'disconnected' : ''}`}>
              <span className="badge-role">{p.role === 'builder' ? <Wrench size={14} /> : p.role === 'pathfinder' ? <Compass size={14} /> : <Search size={14} />}</span>
              <span className="badge-name">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
