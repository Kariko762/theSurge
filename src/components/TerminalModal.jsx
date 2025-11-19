import { useEffect, useRef } from 'react'

/**
 * Terminal Modal - Popup to display action results
 * Shows DRE output and narrative text
 */

const TerminalModal = ({ isOpen, onClose, content = [] }) => {
  const terminalRef = useRef(null);
  
  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [content]);
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          width: '80%',
          maxWidth: '900px',
          height: '70%',
          background: 'rgba(0, 12, 18, 0.98)',
          border: '2px solid rgba(52, 224, 255, 0.6)',
          borderRadius: '12px',
          boxShadow: '0 0 40px rgba(52, 224, 255, 0.5), inset 0 2px 0 rgba(52, 224, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(52, 224, 255, 0.3)',
          background: 'rgba(52, 224, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#34e0ff',
            letterSpacing: '1px'
          }}>
            TERMINAL OUTPUT
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              background: 'rgba(52, 224, 255, 0.1)',
              border: '1px solid rgba(52, 224, 255, 0.4)',
              borderRadius: '4px',
              color: '#34e0ff',
              fontSize: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(52, 224, 255, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
            }}
          >
            CLOSE [ESC]
          </button>
        </div>
        
        {/* Terminal Content */}
        <div
          ref={terminalRef}
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#cfd8df'
          }}
        >
          {content.length === 0 ? (
            <div style={{ opacity: 0.5, textAlign: 'center', marginTop: '40px' }}>
              No output
            </div>
          ) : (
            content.map((line, index) => (
              <div 
                key={index}
                style={{
                  marginBottom: '8px',
                  color: line.type === 'error' ? '#ff5555' :
                         line.type === 'success' ? '#50fa7b' :
                         line.type === 'warning' ? '#f1fa8c' :
                         line.type === 'prompt' ? '#34e0ff' :
                         '#cfd8df',
                  fontWeight: line.type === 'prompt' ? 'bold' : 'normal'
                }}
              >
                {line.text}
              </div>
            ))
          )}
        </div>
        
        {/* Footer hint */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(52, 224, 255, 0.2)',
          fontSize: '9px',
          color: 'rgba(207, 216, 223, 0.5)',
          textAlign: 'center'
        }}>
          Press ESC or click outside to close
        </div>
      </div>
    </div>
  );
};

export default TerminalModal;
