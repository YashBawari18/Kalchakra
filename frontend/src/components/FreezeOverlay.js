import React, { useEffect, useState } from 'react';

export default function FreezeOverlay({ show, seconds, onDone }) {
  const [count, setCount] = useState(seconds || 15);

  useEffect(() => {
    if (!show) return;
    setCount(seconds || 15);
    const iv = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(iv); onDone && onDone(); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [show, seconds]);

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,40,0.94)', zIndex: 9500, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontFamily: 'var(--horror)', fontSize: 'clamp(2rem,8vw,4rem)', color: '#4466ff', textShadow: '0 0 25px rgba(50,100,255,0.9)' }}>⚡ SCREEN FROZEN ⚡</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.9rem', color: '#8899ff' }}>PENALTY APPLIED BY ADMIN</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(2.5rem,10vw,5rem)', color: '#aabbff' }}>{count}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '0.7rem', color: '#556688', letterSpacing: '0.15em' }}>SECONDS REMAINING</div>
    </div>
  );
}
