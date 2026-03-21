import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../api';

export default function Login() {
  const [role, setRole] = useState('team');
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginTeam, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let parts = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5, life: Math.random()
    }));

    let raf;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.life += 0.003;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        const a = 0.15 * (0.5 + 0.5 * Math.sin(p.life * 3));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150,0,0,${a})`;
        ctx.fill();
      });
      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = parts[i].x - parts[j].x, dy = parts[i].y - parts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath();
            ctx.moveTo(parts[i].x, parts[i].y);
            ctx.lineTo(parts[j].x, parts[j].y);
            ctx.strokeStyle = `rgba(100,0,0,${0.15 * (1 - d / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'admin') {
        loginAdmin(adminKey);
        navigate('/admin');
      } else {
        const res = await login(teamId.trim(), password.trim());
        loginTeam(res.data.token, res.data.team);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'var(--horror)', fontSize: 'clamp(2.5rem,8vw,5rem)', color: 'var(--red-glow)', textShadow: '0 0 10px #ff000088,0 0 30px #ff000044', letterSpacing: '0.08em', lineHeight: 1, animation: 'flicker 4s infinite' }}>
            KALCHAKRA
          </h1>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(0.65rem,1.8vw,0.85rem)', color: 'var(--red-dim)', letterSpacing: '0.3em', marginTop: '0.4rem' }}>
            ◈ A MAYA TRAP ◈
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.65rem', color: '#440000', letterSpacing: '0.15em', marginTop: '1rem', overflow: 'hidden', whiteSpace: 'nowrap', borderRight: '2px solid var(--red-glow)', animation: 'typing 2s steps(35) 0.5s both, blink 0.8s step-end infinite', maxWidth: '320px', margin: '1rem auto 0' }}>
            INITIALIZING CONTAINMENT PROTOCOL...
          </div>
        </div>

        {/* Card */}
        <div className="k-card">
          <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--red-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '1.2rem', borderBottom: '1px solid #220000', paddingBottom: '0.6rem' }}>
            // SYSTEM ACCESS
          </div>

          {/* Role Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {['team', 'admin'].map(r => (
              <button key={r} onClick={() => { setRole(r); setError(''); }}
                style={{ flex: 1, padding: '0.5rem', background: role === r ? 'rgba(150,0,0,0.15)' : 'transparent', border: `1px solid ${role === r ? 'var(--red)' : '#330000'}`, color: role === r ? 'var(--red-glow)' : 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: '0.75rem', letterSpacing: '0.1em', cursor: 'pointer', textTransform: 'uppercase', boxShadow: role === r ? '0 0 8px rgba(200,0,0,0.3)' : 'none', transition: 'all 0.2s' }}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {role === 'team' ? (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="k-label">Team ID</label>
                  <input className="k-input" value={teamId} onChange={e => setTeamId(e.target.value)} placeholder="TEAM-001" required />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="k-label">Password</label>
                  <input className="k-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
              </>
            ) : (
              <div style={{ marginBottom: '1rem' }}>
                <label className="k-label">Admin Key</label>
                <input className="k-input" type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="ADMIN-KEY" required />
              </div>
            )}

            {error && <div className="k-error">{error}</div>}

            <button className="k-btn full" type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
              {loading ? 'AUTHENTICATING...' : 'ENTER THE TRAP →'}
            </button>
          </form>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.6rem', color: '#330000', marginTop: '1.5rem', letterSpacing: '0.15em', textAlign: 'center' }}>
          WARNING: ONCE ENTERED, THERE IS NO EXIT
        </div>
      </div>
    </div>
  );
}
