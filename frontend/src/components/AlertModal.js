import React from 'react';

export default function AlertModal({ show, icon, title, message, onConfirm, onCancel, confirmText, cancelText }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'var(--surface2)', border: '2px solid var(--red)', borderRadius: 4, padding: '2rem', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 0 40px rgba(200,0,0,0.5)', animation: 'glitch-in 0.3s ease' }}>
        <div style={{ fontFamily: 'var(--horror)', fontSize: '3rem', color: 'var(--red-glow)', textShadow: '0 0 20px rgba(255,0,0,0.7)', marginBottom: '0.75rem' }}>{icon || '⚠'}</div>
        <div style={{ fontFamily: 'var(--horror)', fontSize: '1.5rem', color: 'var(--red-glow)', marginBottom: '0.5rem' }}>{title}</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.7, marginBottom: '1.5rem' }}>{message}</div>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="k-btn" onClick={onConfirm}>{confirmText || 'ACKNOWLEDGE'}</button>
          {cancelText && <button className="k-btn danger" onClick={onCancel}>{cancelText}</button>}
        </div>
      </div>
    </div>
  );
}
