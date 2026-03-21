import React, { useState, useEffect } from 'react';
import { getQuestion, submitAnswer } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Round3({ onComplete }) {
  const [q, setQ] = useState(null);
  const [answer, setAnswer] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const { team, updateTeam } = useAuth();
  const [r3Stage, setR3Stage] = useState(team?.r3Stage || 0);

  useEffect(() => {
    getQuestion(3).then(r => {
      setQ(r.data.question);
      setR3Stage(r.data.question.currentStage || team?.r3Stage || 0);
    }).catch(() => {});
  }, []);

  const submit = async () => {
    if (!answer.trim()) return;
    const stageNum = r3Stage + 1;
    setLoading(true); setMsg(null);
    try {
      const res = await submitAnswer(3, { answer: answer.trim(), stageNum });
      if (res.data.isCorrect) {
        const newStage = res.data.r3Stage;
        setR3Stage(newStage);
        updateTeam({ score: (team?.score || 0) + res.data.pointsAwarded, r3Stage: newStage });
        setAnswer('');
        if (res.data.roundComplete) {
          setMsg({ type: 'success', text: `🏆 ALL STAGES COMPLETE! +${res.data.pointsAwarded.toLocaleString()} pts. YOU ESCAPED THE TRAP!` });
          setTimeout(() => onComplete && onComplete(res.data), 2000);
        } else {
          setMsg({ type: 'success', text: `✓ STAGE ${stageNum} CLEARED! +${res.data.pointsAwarded.toLocaleString()} pts. Proceed to Stage ${newStage + 1}.` });
          setTimeout(() => setMsg(null), 2500);
        }
      } else {
        setMsg({ type: 'error', text: '✗ INCORRECT — Rethink your approach.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Submission failed.' });
    } finally { setLoading(false); }
  };

  if (!q) return <div style={{ fontFamily: 'var(--mono)', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Loading final challenge...</div>;

  const stages = q.stages || [];
  const currentStage = stages[r3Stage];
  const isComplete = r3Stage >= stages.length;

  return (
    <div className="fade-in">
      {/* Stage progress dots */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {stages.map((s, i) => (
          <div key={i} className={`stage-dot ${i < r3Stage ? 'done' : i === r3Stage ? 'current' : ''}`}>
            {i < r3Stage ? '✓' : i + 1}
          </div>
        ))}
        <span style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>
          {isComplete ? 'ALL STAGES COMPLETE' : `STAGE ${r3Stage + 1} / ${stages.length}`}
        </span>
      </div>

      {isComplete ? (
        <div className="k-success" style={{ fontSize: '1rem', textAlign: 'center', padding: '1.5rem' }}>
          🏆 YOU HAVE ESCAPED THE MAYA TRAP!
        </div>
      ) : currentStage ? (
        <>
          <div style={{ background: '#050000', border: '1px solid #1a0000', borderRadius: 3, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
              // STAGE {currentStage.stageNum}: {currentStage.stageName?.toUpperCase()}
            </div>
            <pre style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(0.75rem,1.5vw,0.9rem)', color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
              {currentStage.question}
            </pre>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="k-label">Your Answer</label>
            <input className="k-input" value={answer} onChange={e => setAnswer(e.target.value)}
              placeholder="Enter answer..." onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>

          <button className="k-btn" onClick={submit} disabled={loading}>
            {loading ? 'CHECKING...' : `SUBMIT STAGE ${r3Stage + 1}`}
          </button>
        </>
      ) : null}

      {msg && <div className={msg.type === 'success' ? 'k-success' : 'k-error'} style={{ marginTop: '0.75rem' }}>{msg.text}</div>}
    </div>
  );
}
