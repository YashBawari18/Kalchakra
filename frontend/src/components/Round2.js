import React, { useState, useEffect } from 'react';
import { getQuestion, submitAnswer } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Round2({ onComplete }) {
  const [q, setQ] = useState(null);
  const [a1, setA1] = useState('');
  const [a2, setA2] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { updateTeam } = useAuth();

  useEffect(() => {
    getQuestion(2).then(r => setQ(r.data.question)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!a1.trim() || !a2.trim()) return;
    setLoading(true); setMsg(null);
    try {
      const res = await submitAnswer(2, { answer: a1.trim(), answer2: a2.trim() });
      if (res.data.isCorrect) {
        setMsg({ type: 'success', text: `✓ CORRECT — +${res.data.pointsAwarded.toLocaleString()} pts! Round 2 complete.` });
        updateTeam({ score: res.data.score });
        setTimeout(() => onComplete && onComplete(res.data), 1500);
      } else {
        setMsg({ type: 'error', text: res.data.message || '✗ INCORRECT — Check both answers.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Submission failed.' });
    } finally { setLoading(false); }
  };

  if (!q) return <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Loading puzzle...</div>;

  return (
    <div className="fade-in">
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '0.15em', marginBottom: '1rem', borderLeft: '2px solid var(--red-dim)', paddingLeft: '0.75rem' }}>
        💡 {q.hint}
      </div>

      {/* Pseudocode */}
      <div style={{ background: '#050000', border: '1px solid #1a0000', borderRadius: 3, padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>// PSEUDOCODE — PART 1</div>
        <pre style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(0.7rem,1.5vw,0.85rem)', color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
          {q.pseudoCode}
        </pre>
      </div>

      {/* Cipher */}
      <div style={{ background: '#050000', border: '1px solid #1a0000', borderRadius: 3, padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>// CIPHER TEXT — PART 2 (Caesar +{q.cipherShift})</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(0.85rem,2vw,1.1rem)', color: 'var(--red-glow)', letterSpacing: '0.15em' }}>
          {q.cipherText}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <label className="k-label">Part 1 — Pseudocode Output</label>
          <input className="k-input" value={a1} onChange={e => setA1(e.target.value)} placeholder="Numeric result..." />
        </div>
        <div>
          <label className="k-label">Part 2 — Decoded Cipher</label>
          <input className="k-input" value={a2} onChange={e => setA2(e.target.value)} placeholder="Decoded word..." />
        </div>
      </div>

      <button className="k-btn" onClick={submit} disabled={loading}>
        {loading ? 'CHECKING...' : 'SUBMIT BOTH ANSWERS'}
      </button>

      {msg && <div className={msg.type === 'success' ? 'k-success' : 'k-error'}>{msg.text}</div>}
    </div>
  );
}
