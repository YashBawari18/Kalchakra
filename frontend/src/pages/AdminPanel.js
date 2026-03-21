import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AlertModal from '../components/AlertModal';
import Leaderboard from '../components/Leaderboard';
import {
  adminGetTeams, adminCreateTeam, adminStartGame, adminStopGame,
  adminUnlockRound, adminFreezeTeam, adminPenaltyTeam,
  adminBroadcast, adminLabAssistant, adminLeaderboard, adminReset
} from '../api';

export default function AdminPanel() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameRunning, setGameRunning] = useState(false);
  const [logs, setLogs] = useState(['[SYSTEM] Admin panel initialized']);
  const [alert, setAlert] = useState(null);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [labQ, setLabQ] = useState('');
  const [labA, setLabA] = useState('');
  const [newTeam, setNewTeam] = useState({ teamId: '', teamName: '', password: '', p1: '', p2: '' });
  const [tab, setTab] = useState('monitor');

  useEffect(() => {
    if (role !== 'admin') { navigate('/'); return; }
    refresh();
    const iv = setInterval(refresh, 10000);
    return () => clearInterval(iv);
  }, [role, navigate]);

  const refresh = async () => {
    try {
      const [t, lb] = await Promise.all([adminGetTeams(), adminLeaderboard()]);
      setTeams(t.data.teams || []);
      setLeaderboard(lb.data.leaderboard || []);
    } catch (_) {}
  };

  const addLog = (msg) => {
    const now = new Date();
    const ts = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    setLogs(prev => [`[${ts}] ${msg}`, ...prev.slice(0, 49)]);
  };

  const pad = n => n.toString().padStart(2, '0');

  const handleStartStop = async () => {
    try {
      if (gameRunning) { await adminStopGame(); setGameRunning(false); addLog('Game STOPPED'); }
      else { await adminStartGame(); setGameRunning(true); addLog('Game STARTED'); }
    } catch (e) { addLog('Error: ' + e.message); }
  };

  const handleUnlock = async (round) => {
    try {
      await adminUnlockRound(round);
      addLog(`Round ${round} unlocked for all teams`);
      setAlert({ icon: '🔓', title: 'UNLOCKED', message: `Round ${round} unlocked for all teams.` });
    } catch (e) { addLog('Unlock error: ' + e.message); }
  };

  const handleFreeze = async (teamId) => {
    try {
      await adminFreezeTeam(teamId, 15);
      addLog(`Freeze sent to ${teamId} (15s)`);
    } catch (e) { addLog('Freeze error: ' + e.message); }
  };

  const handlePenalty = async (teamId) => {
    try {
      await adminPenaltyTeam(teamId, 500, 'Admin penalty');
      addLog(`-500 pts penalty applied to ${teamId}`);
      refresh();
    } catch (e) { addLog('Penalty error: ' + e.message); }
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim()) return;
    try {
      await adminBroadcast(broadcastMsg.trim());
      addLog(`Broadcast: "${broadcastMsg}"`);
      setBroadcastMsg('');
    } catch (e) { addLog('Broadcast error: ' + e.message); }
  };

  const handleLabAssistant = async () => {
    if (!labQ.trim() || !labA.trim()) return;
    try {
      await adminLabAssistant(labQ, labA, 30);
      addLog(`Lab Assistant triggered: "${labQ}"`);
      setLabQ(''); setLabA('');
    } catch (e) { addLog('Lab error: ' + e.message); }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.teamId || !newTeam.teamName || !newTeam.password) return;
    try {
      await adminCreateTeam({
        teamId: newTeam.teamId, teamName: newTeam.teamName, password: newTeam.password,
        participants: [{ name: newTeam.p1 || 'Player 1' }, { name: newTeam.p2 || 'Player 2' }]
      });
      addLog(`Team created: ${newTeam.teamId} (${newTeam.teamName})`);
      setNewTeam({ teamId: '', teamName: '', password: '', p1: '', p2: '' });
      refresh();
    } catch (e) { addLog('Create error: ' + (e.response?.data?.error || e.message)); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset ALL game data? This cannot be undone.')) return;
    try {
      await adminReset();
      addLog('GAME RESET COMPLETE');
      setGameRunning(false);
      refresh();
    } catch (e) { addLog('Reset error: ' + e.message); }
  };

  const TABS = ['monitor', 'rounds', 'tools', 'teams', 'log'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar extraRight={
        <button className={`k-btn sm ${gameRunning ? 'danger' : 'success'}`} onClick={handleStartStop}>
          {gameRunning ? 'STOP GAME' : 'START GAME'}
        </button>
      } />
      {alert && <AlertModal show={true} icon={alert.icon} title={alert.title} message={alert.message} onConfirm={() => setAlert(null)} />}

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '1.5rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: 1600 }}>

          {/* Tab nav */}
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t} className={`k-btn sm ${tab === t ? '' : 'gray'}`} onClick={() => setTab(t)}
                style={{ borderColor: tab === t ? 'var(--red)' : '#333' }}>
                {t.toUpperCase()}
              </button>
            ))}
            <button className="k-btn sm danger" onClick={handleReset} style={{ marginLeft: 'auto' }}>RESET GAME</button>
          </div>

          {/* MONITOR TAB */}
          {tab === 'monitor' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1rem' }}>
              <div className="k-card" style={{ padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem', borderBottom: '1px solid #1a0000', paddingBottom: '0.4rem' }}>// TEAM MONITOR</div>
                {teams.map(t => (
                  <div key={t.teamId} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.5rem', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #0d0000', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text)' }}>{t.teamName}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>{t.teamId} · R{t.currentRound} · {t.score?.toLocaleString() || 0} pts</div>
                    </div>
                    <button className="k-btn sm danger" onClick={() => handleFreeze(t.teamId)}>FREEZE</button>
                    <button className="k-btn sm" onClick={() => handlePenalty(t.teamId)} style={{ borderColor: '#ff8800', color: '#ffaa00' }}>-500</button>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: t.isFrozen ? '#4466ff' : '#444', minWidth: 40 }}>{t.isFrozen ? '❄ FROZEN' : ''}</span>
                  </div>
                ))}
              </div>

              <div className="k-card" style={{ padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem', borderBottom: '1px solid #1a0000', paddingBottom: '0.4rem' }}>// LIVE LEADERBOARD</div>
                <Leaderboard data={leaderboard} />
              </div>
            </div>
          )}

          {/* ROUNDS TAB */}
          {tab === 'rounds' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
              {[1, 2, 3].map(r => (
                <div key={r} className="k-card" style={{ padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--horror)', fontSize: '2rem', color: 'var(--red-glow)', marginBottom: '0.5rem' }}>ROUND {r}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                    {r === 1 ? 'Binary Puzzle' : r === 2 ? 'Logic + Cipher' : 'Final Multi-Stage'}
                  </div>
                  <button className="k-btn success full" onClick={() => handleUnlock(r)}>
                    UNLOCK FOR ALL TEAMS
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TOOLS TAB */}
          {tab === 'tools' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1rem' }}>
              <div className="k-card" style={{ padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>// BROADCAST MESSAGE</div>
                <input className="k-input" value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Type message to all teams..." style={{ marginBottom: '0.75rem' }} />
                <button className="k-btn danger full" onClick={handleBroadcast}>BROADCAST →</button>
              </div>
              <div className="k-card" style={{ padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>// LAB ASSISTANT INTERRUPT</div>
                <input className="k-input" value={labQ} onChange={e => setLabQ(e.target.value)} placeholder="Question for teams..." style={{ marginBottom: '0.5rem' }} />
                <input className="k-input" value={labA} onChange={e => setLabA(e.target.value)} placeholder="Correct answer..." style={{ marginBottom: '0.75rem' }} />
                <button className="k-btn full" onClick={handleLabAssistant}>TRIGGER INTERRUPT ⚡</button>
              </div>
            </div>
          )}

          {/* TEAMS TAB */}
          {tab === 'teams' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1rem' }}>
              <div className="k-card" style={{ padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>// CREATE NEW TEAM</div>
                {[['teamId','Team ID (e.g. TEAM-007)'], ['teamName','Team Name'], ['password','Password'], ['p1','Participant 1 Name'], ['p2','Participant 2 Name']].map(([k, ph]) => (
                  <div key={k} style={{ marginBottom: '0.5rem' }}>
                    <input className="k-input" value={newTeam[k]} onChange={e => setNewTeam(p => ({ ...p, [k]: e.target.value }))} placeholder={ph} />
                  </div>
                ))}
                <button className="k-btn success full" style={{ marginTop: '0.5rem' }} onClick={handleCreateTeam}>CREATE TEAM</button>
              </div>

              <div className="k-card" style={{ padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>// ALL TEAMS ({teams.length})</div>
                {teams.map(t => (
                  <div key={t.teamId} style={{ padding: '0.5rem 0', borderBottom: '1px solid #0d0000' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text)' }}>{t.teamName}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                      {t.teamId} · Score: {(t.score || 0).toLocaleString()} · R{t.currentRound} · Completed: {t.roundsCompleted?.join(', ') || 'none'}
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: '#556688', marginTop: '0.2rem' }}>
                      Members: {t.participants?.map(p => p.name).join(', ') || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOG TAB */}
          {tab === 'log' && (
            <div className="k-card" style={{ padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>// ACTIVITY LOG</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-dim)', maxHeight: 400, overflowY: 'auto', lineHeight: 2 }}>
                {logs.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
