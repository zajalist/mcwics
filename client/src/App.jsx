import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
// Editor route (constraint: only add route here)
import EditorPage from './editor/EditorPage';

export default function App() {
  const [page, setPage] = useState('home'); // home | lobby | game
  const [roomState, setRoomState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    socket.connect();

    socket.on('ROOM_UPDATED', (state) => {
      setRoomState(state);
      if (state.phase === 'playing' && page === 'lobby') {
        setPage('game');
      }
    });

    socket.on('GAME_OVER', (data) => {
      setGameOver(data);
    });

    return () => {
      socket.off('ROOM_UPDATED');
      socket.off('GAME_OVER');
      socket.disconnect();
    };
  }, []);

  // Listen to path changes (very lightweight routing)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Update page when phase changes
  useEffect(() => {
    if (roomState?.phase === 'playing' && page === 'lobby') {
      setPage('game');
    }
  }, [roomState?.phase]);

  const handleRoomJoined = useCallback(({ roomCode, playerId: pid }) => {
    setPlayerId(pid);
    setPage('lobby');
  }, []);

  const handleBackToHome = useCallback(() => {
    setPage('home');
    setRoomState(null);
    setPlayerId(null);
    setGameOver(null);
    socket.disconnect();
    socket.connect();
  }, []);

  // Route: /editor → Scenario Editor
  if (path === '/editor') {
    return <EditorPage />;
  }

  if (page === 'home') {
    return <HomePage onRoomJoined={handleRoomJoined} />;
  }

  if (page === 'lobby') {
    return (
      <LobbyPage
        roomState={roomState}
        playerId={playerId}
        onBackToHome={handleBackToHome}
      />
    );
  }

  if (page === 'game') {
    return (
      <GamePage
        roomState={roomState}
        playerId={playerId}
        gameOver={gameOver}
        onBackToHome={handleBackToHome}
      />
    );
  }

  return null;
}
