import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard, reportPenalty } from '../api';
import Navbar from '../components/Navbar';
import AlertModal from '../components/AlertModal';
import FreezeOverlay from '../components/FreezeOverlay';
import Leaderboard from '../components/Leaderboard';
import Round1 from '../components/Round1';
import Round2 from '../components/Round2';
import Round3 from '../components/Round3';

export default function Dashboard() {
  const { team, updateTeam, role } = useAuth();
  const navigate = useNavigate();
  const [activeRound, setActiveRound] = useState(1);
  const [leaderboard, setLeaderboard] = useState([]);
  const [alert, setAlert] = useState(null);
  const [frozen, setFrozen] = useState(false);
  const [freezeSecs, setFreezeSecs] = useState(15);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!team && role !== 'team') { navigate('/'); return; }
  }, [team, role, navigate]);

  // Socket events via window
  useEffect(() => {
    const handleSocket = (e) => {
      const { type, data } = e.detail || {};
      if (type === 'leaderboard_update') setLeaderboard(data);
      if (type === 'round_unlocked') {
        updateTeam({ roundsUnlocked: [...(team?.roundsUnlocked || [1]), data.round] });
        setAlert({ icon: '🔓', title: 'ROUND UNLOCKED', message: `Round ${data.round} is now accessible!` });
      }
      if (type === 'freeze') { setFreezeSecs(data.seconds); setFrozen(true); }
      if (type === 'penalty') {
        updateTeam({ score: Math.max(0, (team?.score || 0) - (data.points || 500)) });
        setAlert({ icon: '⚡', title: 'PENALTY APPLIED', message: `Admin deducted ${data.points || 500} points. Reason: ${data.reason || 'Violation detected.'}` });
      }
      if (type === 'broadcast') {
        setAlert({ icon: '📡', title: 'ADMIN BROADCAST', message: data.message });
      }
      if (type === 'lab_assistant') {
        setAlert({ icon: '🧪', title: 'LAB ASSISTANT INTERRUPT', message: `${data.question}\n\nYou have ${data.seconds} seconds. Wrong answer = penalty.` });
      }
    };
    window.addEventListener('kalchakra_socket', handleSocket);
    return () => window.removeEventListener('kalchakra_socket', handleSocket);
  }, [team, updateTeam]);

  // Timer
  useEffect(() => {
    if (!team?.gameStartTime) return;
    const iv = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(team.gameStartTime).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [team?.gameStartTime]);

  // Tab switch anti-cheat
  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        reportPenalty('tab_switch').then(res => {
          updateTeam({ score: res.data.score });
          setAlert({ icon: '⚠', title: 'TAB SWITCH DETECTED', message: `-200 points deducted. Further violations will result in screen freeze. You are being monitored.` });
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [updateTeam]);

  // Disable right-click
  useEffect(() => {
    const rc = e => e.preventDefault();
    document.addEventListener('contextmenu', rc);
    return () => document.removeEventListener('contextmenu', rc);
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    getLeaderboard().then(r => setLeaderboard(r.data.leaderboard)).catch(() => {});
    const iv = setInterval(() => {
      getLeaderboard().then(r => setLeaderboard(r.data.leaderboard)).catch(() => {});
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const pad = n => n.toString().padStart(2, '0');
  const fmtTime = s => `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
  const progress = team ? (team.roundsCompleted?.length / 3) * 100 : 0;

  const roundsUnlocked = team?.roundsUnlocked || [1];
  const roundsCompleted = team?.roundsCompleted || [];

  const rounds = [
    { num: 1, name: 'Binary Puzzle' },
    { num: 2, name: 'Logic + Cipher' },
    { num: 3, name: 'Final Challenge' }
  ];

  const getRoundState = (num) => {
    if (roundsCompleted.includes(num)) return 'completed';
    if (roundsUnlocked.includes(num)) return 'unlocked';
    return 'locked';
  };

  const handleRoundClick = (num) => {
    const state = getRoundState(num);
    if (state === 'locked') {
      setAlert({ icon: '🔒', title: 'ROUND LOCKED', message: 'This round is locked. Wait for admin to unlock it.' });
      return;
    }
    setActiveRound(num);
  };

  const handleRoundComplete = (data) => {
    const next = activeRound + 1;
    if (next <= 3) {
      if (roundsUnlocked.includes(next)) setTimeout(() => setActiveRound(next), 2000);
    }
  };

  const PuzzleComponent = activeRound === 1 ? Round1 : activeRound === 2 ? Round2 : Round3;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <FreezeOverlay show={frozen} seconds={freezeSecs} onDone={() => setFrozen(false)} />
      {alert && <AlertModal show={true} icon={alert.icon} title={alert.title} message={alert.message} onConfirm={() => setAlert(null)} />}

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 1400 }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="k-stat"><div className="k-stat-label">Elapsed Time</div><div className="k-stat-value" style={{ fontSize: '1.3rem' }}>{fmtTime(elapsed)}</div></div>
            <div className="k-stat"><div className="k-stat-label">Team</div><div className="k-stat-value" style={{ fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team?.teamName || team?.teamId}</div></div>
            <div className="k-stat"><div className="k-stat-label">Score</div><div className="k-stat-value amber">{(team?.score || 0).toLocaleString()}</div></div>
            <div className="k-stat"><div className="k-stat-label">Rank</div><div className="k-stat-value">#{(leaderboard.findIndex(t => t.teamId === team?.teamId) + 1) || '–'}</div></div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.4rem', letterSpacing: '0.1em' }}>
              <span>PROGRESS</span><span>{Math.round(progress)}%</span>
            </div>
            <div className="k-progress-bar"><div className="k-progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>

          {/* Round selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {rounds.map(r => {
              const state = getRoundState(r.num);
              const isActive = activeRound === r.num;
              return (
                <div key={r.num} onClick={() => handleRoundClick(r.num)}
                  style={{ background: 'var(--surface)', border: `1px solid ${state === 'completed' ? '#00aa44' : isActive ? 'var(--red-glow)' : state === 'locked' ? '#1a0000' : 'var(--red-dim)'}`, borderRadius: 3, padding: '0.75rem', textAlign: 'center', cursor: state === 'locked' ? 'not-allowed' : 'pointer', opacity: state === 'locked' ? 0.4 : 1, transition: 'all 0.2s', boxShadow: isActive ? '0 0 16px rgba(255,0,0,0.3)' : 'none', background: isActive ? 'rgba(150,0,0,0.12)' : state === 'completed' ? 'rgba(0,100,30,0.08)' : 'var(--surface)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.3rem' }}>ROUND {String(r.num).padStart(2, '0')}</div>
                  <div style={{ fontFamily: 'var(--sans)', fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.35rem' }}>{r.name}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: state === 'completed' ? '#00ff44' : isActive ? 'var(--red-glow)' : '#444' }}>
                    ● {state === 'completed' ? 'COMPLETE' : state === 'locked' ? 'LOCKED' : isActive ? 'ACTIVE' : 'UNLOCKED'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Puzzle + Leaderboard */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,300px)', gap: '1rem' }}>

            {/* Puzzle area */}
            <div className="k-card">
              <div style={{ fontFamily: 'var(--horror)', fontSize: '1.4rem', color: 'var(--red-glow)', textShadow: '0 0 8px rgba(255,0,0,0.4)', marginBottom: '1rem' }}>
                {rounds.find(r => r.num === activeRound)?.name}
              </div>
              {roundsCompleted.includes(activeRound) && activeRound !== 3 ? (
                <div className="k-success" style={{ textAlign: 'center', padding: '1.5rem' }}>✓ ROUND {activeRound} COMPLETE — Select next round</div>
              ) : (
                <PuzzleComponent key={activeRound} onComplete={handleRoundComplete} />
              )}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="k-card" style={{ padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem', borderBottom: '1px solid #1a0000', paddingBottom: '0.4rem' }}>// LIVE LEADERBOARD</div>
                <Leaderboard data={leaderboard} myTeamId={team?.teamId} />
              </div>

              {team?.participants?.length > 0 && (
                <div className="k-card" style={{ padding: '1rem' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem', borderBottom: '1px solid #1a0000', paddingBottom: '0.4rem' }}>// TEAM MEMBERS</div>
                  {team.participants.map((p, i) => (
                    <div key={i} style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text)', padding: '0.3rem 0', borderBottom: '1px solid #0d0000' }}>
                      <span style={{ color: 'var(--red-dim)', marginRight: '0.5rem' }}>P{i + 1}</span>{p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
