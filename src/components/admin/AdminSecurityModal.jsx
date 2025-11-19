import React, { useEffect, useState } from 'react';

const CYAN = '#00ffff';

export default function AdminSecurityModal({ onClose }) {
  const [anim, setAnim] = useState('enter');
  useEffect(() => {
    const t = setTimeout(() => setAnim('idle'), 200);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setAnim('exit');
    setTimeout(() => onClose && onClose(), 200);
  };

  return (
    <div
      className={`terminal-modal-overlay ${anim === 'enter' ? 'modal-anim-enter' : ''} ${anim === 'exit' ? 'modal-anim-exit' : ''}`}
      onClick={handleClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2500, background: 'rgba(0,10,20,0.7)', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 500,
          background: 'rgba(0, 10, 20, 0.96)',
          border: `2px solid ${CYAN}`,
          boxShadow: `0 0 36px ${CYAN}60, inset 0 0 30px rgba(0,255,255,0.06)`,
          margin: '10vh auto',
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="holo-text" style={{ color: CYAN, letterSpacing: 2 }}>ADMIN // HIGH SECURITY</div>
          <button onClick={handleClose} style={{ width: 28, height: 28, border: `1px solid ${CYAN}66`, background: 'transparent', color: CYAN, cursor: 'pointer' }}>✕</button>
        </div>

        <div className="data-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            title="Galaxy Editor"
            style={{
              padding: 14,
              border: `1px solid ${CYAN}77`,
              background: 'rgba(0,255,255,0.06)',
              color: CYAN,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Galaxy Editor
          </button>
          <button
            title="Mission Editor"
            disabled
            style={{
              padding: 14,
              border: `1px solid ${CYAN}33`,
              background: 'rgba(0,255,255,0.03)',
              color: 'rgba(0,255,255,0.4)',
              cursor: 'not-allowed',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Mission Editor (Soon)
          </button>
        </div>

        <div className="text-muted" style={{ fontSize: 10, color: 'rgba(200,255,255,0.6)' }}>
          Authorized access only. All actions are logged.
        </div>
      </div>
    </div>
  );
}
