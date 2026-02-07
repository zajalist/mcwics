import React from 'react';
import MeterPanel from '../components/MeterPanel';
import StoryPanel from '../components/StoryPanel';
import RoleCluePanel from '../components/RoleCluePanel';
import PuzzlePanel from '../components/PuzzlePanel';
import ChoiceNode from '../components/ChoiceNode';
import WinScreen from '../components/WinScreen';
import FailScreen from '../components/FailScreen';

export default function GamePage({ roomState, playerId, gameOver, onBackToHome }) {
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

  // Check if current node is a win node
  if (currentNode.type === 'win_node') {
    return (
      <WinScreen
        gameOver={{ won: true, title: currentNode.story.title, reason: currentNode.story.text }}
        roomState={roomState}
        onBackToHome={onBackToHome}
      />
    );
  }

  return (
    <div className="page game-page">
      <div className="game-layout">
        {/* Top bar: meters + timer */}
        <MeterPanel
          vars={gameState.vars}
          scenarioId={scenarioId}
          timeRemaining={gameState.timeRemainingSeconds}
        />

        <div className="game-main">
          {/* Left: Story + Role Clues */}
          <div className="game-left">
            <StoryPanel story={currentNode.story} location={currentNode.location} />
            <RoleCluePanel roleClues={currentNode.roleClues} myRole={myRole} />
          </div>

          {/* Right: Puzzle / Choice area */}
          <div className="game-right">
            {currentNode.type === 'choice_node' ? (
              <ChoiceNode choices={currentNode.choices} />
            ) : currentNode.type === 'puzzle_node' ? (
              <PuzzlePanel
                puzzles={currentNode.puzzles || []}
                solvedPuzzles={gameState.solvedPuzzles}
                puzzleAttempts={gameState.puzzleAttempts}
                nodeId={currentNode.id}
                hasNextNode={!!currentNode.nextNodeId}
              />
            ) : null}
          </div>
        </div>

        {/* Players bar */}
        <div className="players-bar">
          {roomState.players.map(p => (
            <div key={p.id} className={`player-badge ${!p.connected ? 'disconnected' : ''}`}>
              <span className="badge-role">{p.role === 'builder' ? '🔧' : p.role === 'pathfinder' ? '🧭' : '🔍'}</span>
              <span className="badge-name">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
