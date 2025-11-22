import { WarningIcon, CloseIcon } from '../HoloIcons';
import '../../../styles/AdminGlass.css';

export default function ConfirmModal({ title, message, confirmText, confirmDanger, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      zIndex: 2000
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '500px',
        padding: '2rem',
        background: 'rgba(0, 20, 40, 0.95)',
        border: confirmDanger ? '1px solid #ff6b6b' : '1px solid var(--neon-cyan)',
        boxShadow: confirmDanger ? '0 0 40px rgba(255, 107, 107, 0.3)' : '0 0 40px rgba(0, 255, 255, 0.3)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {confirmDanger && (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 107, 107, 0.2)',
              border: '2px solid #ff6b6b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff6b6b'
            }}>
              <WarningIcon size={24} />
            </div>
          )}
          <h2 style={{ 
            color: confirmDanger ? '#ff6b6b' : 'var(--neon-cyan)', 
            margin: 0, 
            fontSize: '1.3rem',
            flex: 1
          }}>
            {title}
          </h2>
        </div>

        {/* Message */}
        <div style={{ 
          color: '#ccc', 
          fontSize: '0.95rem', 
          lineHeight: '1.6',
          marginBottom: '2rem'
        }}>
          {message}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            className="btn-neon"
            onClick={onCancel}
            style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
          >
            <CloseIcon size={18} /> CANCEL
          </button>
          <button
            className="btn-neon"
            onClick={onConfirm}
            style={{
              padding: '0.6rem 1.5rem',
              fontSize: '0.9rem',
              borderColor: confirmDanger ? '#ff6b6b' : 'var(--neon-cyan)',
              color: confirmDanger ? '#ff6b6b' : 'var(--neon-cyan)',
              background: confirmDanger ? 'rgba(255, 107, 107, 0.1)' : undefined
            }}
          >
            <WarningIcon size={18} /> {confirmText || 'CONFIRM'}
          </button>
        </div>
      </div>
    </div>
  );
}
