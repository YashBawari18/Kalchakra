import React, { useState, useEffect } from 'react';
import { getQuestion, submitAnswer } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Round1({ onComplete }) {
  const [q, setQ] = useState(null);
  const [answer, setAnswer] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { updateTeam } = useAuth();

  useEffect(() => {
    getQuestion(1).then(r => setQ(r.data.question)).catch(() => {});
  }, []);

  const submit = async () => {
    if (!answer.trim()) return;
    setLoading(true); setMsg(null);
    try {
      const res = await submitAnswer(1, { answer: answer.trim() });
      if (res.data.isCorrect) {
        setMsg({ type: 'success', text: `✓ CORRECT — +${res.data.pointsAwarded.toLocaleString()} pts! Round 1 complete.` });
        updateTeam({ score: res.data.score, roundsCompleted: [1] });
        setTimeout(() => onComplete && onComplete(res.data), 1500);
      } else {
        setMsg({ type: 'error', text: '✗ INCORRECT — Recalculate and try again.' });
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

      <div style={{ background: '#050000', border: '1px solid #1a0000', borderRadius: 3, padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>// BINARY STRING</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(0.65rem,1.5vw,0.85rem)', color: 'var(--red-glow)', lineHeight: 1.8, wordBreak: 'break-all' }}>
          {q.binary}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label className="k-label">Decoded Text</label>
        <input className="k-input" value={answer} onChange={e => setAnswer(e.target.value)}
          placeholder="Enter decoded text..." onKeyDown={e => e.key === 'Enter' && submit()} />
      </div>

      <button className="k-btn" onClick={submit} disabled={loading}>
        {loading ? 'CHECKING...' : 'SUBMIT ANSWER'}
      </button>

      {msg && <div className={msg.type === 'success' ? 'k-success' : 'k-error'}>{msg.text}</div>}
    </div>
  );
}
