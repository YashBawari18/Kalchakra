import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import './index.css';

// Socket bridge - dispatches events to components via window
function SocketBridge() {
  const { team } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    const s = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', { reconnection: true });
    socketRef.current = s;

    const events = ['leaderboard_update','round_unlocked','freeze','penalty','broadcast','lab_assistant','game_started','game_stopped','team_created'];
    events.forEach(ev => {
      s.on(ev, (data) => {
        window.dispatchEvent(new CustomEvent('kalchakra_socket', { detail: { type: ev, data } }));
      });
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (team?.teamId && socketRef.current) {
      socketRef.current.emit('join_team', team.teamId);
    }
  }, [team?.teamId]);

  return null;
}

function ProtectedTeam({ children }) {
  const { team, role, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'var(--mono)', color: 'var(--red-dim)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>INITIALIZING...</div>;
  if (role !== 'team' || !team) return <Navigate to="/" replace />;
  return children;
}

function ProtectedAdmin({ children }) {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SocketBridge />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedTeam><Dashboard /></ProtectedTeam>} />
          <Route path="/admin" element={<ProtectedAdmin><AdminPanel /></ProtectedAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
