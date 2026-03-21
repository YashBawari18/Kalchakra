import React from 'react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ extraRight }) {
  const { team, role, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logout(); } catch (_) {}
    logoutUser();
    navigate('/');
  };

  return (
    <nav className="k-nav">
      <div className="k-nav-logo">
        {role === 'admin' ? '⚙ ADMIN' : '☠ KALCHAKRA'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {team && (
          <>
            <span className="k-badge">{team.teamId}</span>
            <span className="k-badge" style={{ color: '#ffaa00', borderColor: '#442200' }}>
              SCORE: {(team.score || 0).toLocaleString()}
            </span>
          </>
        )}
        {extraRight}
        <button className="k-btn sm gray" onClick={handleLogout}>EXIT</button>
      </div>
    </nav>
  );
}
