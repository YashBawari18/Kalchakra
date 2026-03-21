import React from 'react';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ data, myTeamId }) {
  if (!data || data.length === 0) {
    return <div style={{ fontFamily: 'var(--mono)', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>No teams yet</div>;
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 60px 70px', gap: '0.5rem', fontFamily: 'var(--mono)', fontSize: '0.6rem', color: 'var(--text-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', paddingBottom: '0.5rem', borderBottom: '1px solid #1a0000', marginBottom: '0.25rem' }}>
        <span>#</span><span>TEAM</span><span style={{ textAlign: 'center' }}>ROUND</span><span style={{ textAlign: 'right' }}>SCORE</span>
      </div>

      {data.map((t, i) => {
        const isMe = t.teamId === myTeamId;
        const colors = ['#ffd700', '#c0c0c0', '#cd7f32'];
        return (
          <div key={t.teamId} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 60px 70px', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #0d0000', fontFamily: 'var(--mono)', fontSize: '0.8rem', background: isMe ? 'rgba(150,0,0,0.08)' : 'transparent', borderLeft: isMe ? '2px solid var(--red-dim)' : '2px solid transparent', paddingLeft: isMe ? '0.25rem' : '0' }}>
            <span style={{ color: colors[i] || 'var(--text-dim)', fontSize: '0.75rem' }}>{MEDALS[i] || `${i + 1}`}</span>
            <span style={{ color: isMe ? 'var(--red-glow)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.teamName || t.teamId}
              {isMe && <span style={{ color: 'var(--red-dim)', fontSize: '0.65rem', marginLeft: '0.4rem' }}>(you)</span>}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', textAlign: 'center' }}>R{t.currentRound || 1}</span>
            <span style={{ color: 'var(--red-glow)', fontWeight: 700, textAlign: 'right' }}>{(t.score || 0).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
