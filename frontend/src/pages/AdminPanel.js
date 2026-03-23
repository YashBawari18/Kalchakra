import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import AlertModal from '../components/AlertModal';
import Leaderboard from '../components/Leaderboard';
import {
  adminGetTeams, adminCreateTeam, adminStartGame, adminStopGame,
  adminUnlockRound, adminFreezeTeam, adminPenaltyTeam,
  adminBroadcast, adminLabAssistant, adminLeaderboard, adminReset,
  adminGetRegistrations, adminApproveRegistration, adminDeleteRegistration,
  adminToggleRegLock, adminLockRound, adminLockAllRounds, adminGetGameState
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
  const [registrations, setRegistrations] = useState([]);
  const [regLocked, setRegLocked] = useState(false);
  const [roundsUnlocked, setRoundsUnlocked] = useState([]);

  useEffect(() => {
    if (role !== 'admin') { navigate('/'); return; }
    refresh();
    const iv = setInterval(refresh, 10000);
    return () => clearInterval(iv);
  }, [role, navigate]);

  const refresh = async () => {
    try {
      const [t, lb, regs, gs] = await Promise.all([
        adminGetTeams(),
        adminLeaderboard(),
        adminGetRegistrations(),
        adminGetGameState()
      ]);
      setTeams(t.data.teams || []);
      setLeaderboard(lb.data.leaderboard || []);
      setRegistrations(regs.data.registrations || []);
      setRegLocked(gs.data.gameState?.registrationsLocked || false);
      setRoundsUnlocked(gs.data.gameState?.roundsGloballyUnlocked || []);
      setGameRunning(gs.data.gameState?.isRunning || false);
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
      refresh();
    } catch (e) { addLog('Unlock error: ' + e.message); }
  };

  const handleLockRound = async (round) => {
    try {
      await adminLockRound(round);
      addLog(`Round ${round} LOCKED for all teams`);
      refresh();
    } catch (e) { addLog('Lock error: ' + e.message); }
  };

  const handleLockAll = async () => {
    try {
      await adminLockAllRounds();
      addLog('ALL ROUNDS LOCKED');
      refresh();
    } catch (e) { addLog('Lock error: ' + e.message); }
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

  const handleApprove = async (id) => {
    try {
      const res = await adminApproveRegistration(id);
      addLog(`Registration approved: ID ${res.data.teamId}`);
      setAlert({ icon: '👻', title: 'TEAM CREATED', message: `Team ID: ${res.data.teamId}\nPassword: ${res.data.password}` });
      refresh();
    } catch (e) { addLog('Approve error: ' + e.message); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Delete this registration?')) return;
    try {
      await adminDeleteRegistration(id);
      addLog('Registration deleted');
      refresh();
    } catch (e) { addLog('Delete error: ' + e.message); }
  };

  const handleToggleRegLock = async () => {
    try {
      const res = await adminToggleRegLock();
      setRegLocked(res.data.registrationsLocked);
      addLog(`Registration lock: ${res.data.registrationsLocked ? 'ON' : 'OFF'}`);
    } catch (e) { addLog('Toggle lock error: ' + e.message); }
  };

  const TABS = ['monitor', 'rounds', 'registrations', 'tools', 'teams', 'log'];

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
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button className={`k-btn sm ${regLocked ? 'danger' : 'gray'}`} onClick={handleToggleRegLock} style={{ borderColor: regLocked ? 'var(--red)' : '#333' }}>
                {regLocked ? '🔒 REG CLOSED' : '🔓 REG OPEN'}
              </button>
              <button className="k-btn sm danger" onClick={handleReset}>RESET GAME</button>
            </div>
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
                <div key={r} className="k-card" style={{ padding: '1rem', textAlign: 'center', borderColor: roundsUnlocked.includes(r) ? 'var(--green)' : 'var(--red-dim)' }}>
                  <div style={{ fontFamily: 'var(--horror)', fontSize: '2rem', color: roundsUnlocked.includes(r) ? 'var(--green)' : 'var(--red-glow)', marginBottom: '0.5rem' }}>ROUND {r}</div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                    {r === 1 ? 'Binary Puzzle' : r === 2 ? 'Logic + Cipher' : 'Final Multi-Stage'}
                  </div>
                  {roundsUnlocked.includes(r) ? (
                    <button className="k-btn danger full" onClick={() => handleLockRound(r)}>LOCK ROUND</button>
                  ) : (
                    <button className="k-btn success full" onClick={() => handleUnlock(r)}>UNLOCK ROUND</button>
                  )}
                </div>
              ))}
              <div className="k-card" style={{ padding: '1rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button className="k-btn danger full" onClick={handleLockAll}>LOCK ALL ROUNDS</button>
              </div>
            </div>
          )}

          {/* REGISTRATIONS TAB */}
          {tab === 'registrations' && (
            <div className="k-card" style={{ padding: '1rem' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.2em', marginBottom: '1rem', borderBottom: '1px solid #1a0000', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>// PENDING REGISTRATIONS ({registrations.filter(r => r.status === 'pending').length})</span>
                <span style={{ color: regLocked ? 'var(--red-glow)' : 'var(--green)' }}>{regLocked ? 'SYSTEM LOCKED' : 'SYSTEM OPEN'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {registrations.map(r => (
                  <div key={r._id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto auto', gap: '1rem', alignItems: 'center', padding: '1rem', background: '#080000', borderRadius: '4px', border: `1px solid ${r.status === 'approved' ? '#004411' : '#1a0000'}` }}>
                    <div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text)' }}>{r.teamName || 'NO NAME'}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--text-dim)' }}>{new Date(r.createdAt).toLocaleString()}</div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>
                      P1: {r.participant1.name} ({r.participant1.contact})<br/>
                      P2: {r.participant2.name} ({r.participant2.contact})
                    </div>
                    <div style={{ fontSize: '0.7rem' }}>
                      <a href={`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/${r.payment.screenshotPath}`} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>VIEW RECEIPT</a>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>ID: {r.payment.transactionId}</div>
                    </div>
                    {r.status === 'pending' ? (
                      <>
                        <button className="k-btn sm success" onClick={() => handleApprove(r._id)}>APPROVE</button>
                        <button className="k-btn sm danger" onClick={() => handleReject(r._id)}>REJECT</button>
                      </>
                    ) : (
                      <span style={{ color: 'var(--green)', fontSize: '0.7rem', fontFamily: 'var(--mono)' }}>APPROVED ✓</span>
                    )}
                  </div>
                ))}
                {registrations.length === 0 && <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontFamily: 'var(--mono)' }}>NO REGISTRATIONS FOUND</div>}
              </div>
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
