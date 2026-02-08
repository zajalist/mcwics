import React, { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AuthPage from './pages/AuthPage';
import BrowsePage from './pages/BrowsePage';
import ProfilePage from './pages/ProfilePage';
import EditorPage from './editor/EditorPage';

function AppInner() {
  const { user, loading: authLoading } = useAuth();

  // page: home | lobby | game | auth | browse | profile | editor
  const [page, setPage]         = useState('home');
  const [roomState, setRoomState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameOver, setGameOver] = useState(null);

  // Editor state: when navigating to editor with a scenario to load
  const [editorScenario, setEditorScenario] = useState(null);
  const [editorDocId, setEditorDocId]       = useState(null);

  // Custom scenario JSON passed from Browse → Play
  const [customScenarioJson, setCustomScenarioJson] = useState(null);

  useEffect(() => {
    socket.connect();

    socket.on('ROOM_UPDATED', (state) => {
      setRoomState(state);
      if (state.phase === 'playing' && (page === 'lobby' || page === 'home')) {
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
    setCustomScenarioJson(null);
    socket.disconnect();
    socket.connect();
  }, []);

  const handleNavigate = useCallback((target, data) => {
    if (target === 'play' && data?.scenarioJson) {
      // Play a Firestore scenario → go to home with custom JSON pre-loaded
      setCustomScenarioJson(data.scenarioJson);
      setPage('home');
      return;
    }
    if (target === 'edit' && data) {
      // Edit a Firestore scenario → open editor with it loaded
      setEditorScenario(data);
      setEditorDocId(data.id || null);
      setPage('editor');
      return;
    }
    // Simple navigation
    setPage(target);
    if (target === 'editor') {
      setEditorScenario(null);
      setEditorDocId(null);
    }
  }, []);

  if (authLoading) {
    return (
      <div className="page">
        <div className="loading">Loading…</div>
      </div>
    );
  }

  // Auth page — no nav bar
  if (page === 'auth' && !user) {
    return <AuthPage />;
  }
  // Redirect to home if already logged in and on auth page
  if (page === 'auth' && user) {
    setPage('home');
  }

  // Don't show navbar during active game
  const showNav = page !== 'game' && page !== 'lobby';

  return (
    <>
      {showNav && <NavBar currentPath={page} onNavigate={handleNavigate} />}

      <div className={showNav ? 'has-navbar' : ''}>
        {page === 'home' && (
          <HomePage
            onRoomJoined={handleRoomJoined}
            customScenarioJson={customScenarioJson}
            onClearCustom={() => setCustomScenarioJson(null)}
          />
        )}

        {page === 'lobby' && (
          <LobbyPage
            roomState={roomState}
            playerId={playerId}
            onBackToHome={handleBackToHome}
          />
        )}

        {page === 'game' && (
          <GamePage
            roomState={roomState}
            playerId={playerId}
            gameOver={gameOver}
            onBackToHome={handleBackToHome}
          />
        )}

        {page === 'browse' && (
          <BrowsePage onNavigate={handleNavigate} />
        )}

        {page === 'profile' && (
          <ProfilePage onNavigate={handleNavigate} />
        )}

        {page === 'editor' && (
          <EditorPage
            initialScenario={editorScenario}
            existingDocId={editorDocId}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
