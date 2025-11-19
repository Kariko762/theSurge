import { useState } from 'react'

/**
 * Reusable Settings Dropdown Component
 * 500px wide beveled rectangle that slides down from top center
 * Contains horizontally aligned action boxes
 */

const SettingsDropdown = ({ onCreateGalaxy, showAdmin = false, onAdmin }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: isOpen ? '0px' : '-65px', // Slide down to show, slide up to hide
      left: '50%',
      transform: 'translateX(-50%)',
      width: '500px',
      height: '75px',
      zIndex: 10000,
      transition: 'top 0.4s ease-in-out'
    }}>
      {/* Main beveled rectangle */}
      <div style={{
        width: '100%',
        height: '100%',
        background: 'rgba(0, 12, 18, 0.95)',
        border: '1px solid rgba(52, 224, 255, 0.6)',
        borderTop: 'none',
        borderRadius: '0 0 15px 15px',
        boxShadow: '0 0 20px rgba(52, 224, 255, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Content area with 4 boxes */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-evenly',
          padding: '10px',
          paddingBottom: '20px' // Space for chevron
        }}>
          {/* Box 1: Full Screen */}
          <button
            onClick={toggleFullscreen}
            style={{
              width: '40px',
              height: '40px',
              border: '1px solid rgba(52, 224, 255, 0.4)',
              background: 'rgba(0, 12, 18, 0.6)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 12, 18, 0.6)';
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title="Toggle Fullscreen"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" 
                stroke="#34e0ff" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Box 2: Galaxy Creator */}
          {onCreateGalaxy && (
            <button
              onClick={onCreateGalaxy}
              style={{
                width: '40px',
                height: '40px',
                border: '1px solid rgba(52, 224, 255, 0.4)',
                background: 'rgba(0, 12, 18, 0.6)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 12, 18, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Galaxy Creator"
            >
              {/* Galaxy icon with orbits */}
              <svg width="32" height="32" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                {/* Central Sun */}
                <circle cx="20" cy="20" r="4" fill="#ffaa00" />
                {/* Inner orbit */}
                <circle cx="20" cy="20" r="10" fill="none" stroke="#34e0ff" strokeWidth="0.8" opacity="0.4" />
                <circle cx="30" cy="20" r="1.5" fill="#34e0ff" />
                {/* Outer orbit */}
                <circle cx="20" cy="20" r="16" fill="none" stroke="#34e0ff" strokeWidth="0.8" opacity="0.4" />
                <circle cx="20" cy="4" r="2" fill="#34e0ff" />
              </svg>
            </button>
          )}

          {/* Box 3: Empty placeholder */}
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '1px solid rgba(52, 224, 255, 0.2)',
              background: 'rgba(0, 12, 18, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.3
            }}
          >
            <span style={{ color: '#34e0ff', fontSize: '8px', opacity: 0.5 }}>—</span>
          </div>

          {/* Box 4: Empty placeholder (or Admin if enabled) */}
          {showAdmin && onAdmin ? (
            <button
              onClick={onAdmin}
              style={{
                width: '40px',
                height: '40px',
                border: '1px solid rgba(52, 224, 255, 0.4)',
                background: 'rgba(0, 12, 18, 0.6)',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 12, 18, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Admin"
            >
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4L26 8V16C26 21 21 25 16 28C11 25 6 21 6 16V8L16 4Z" stroke="#34e0ff" strokeWidth="1.6" />
                <rect x="12" y="13" width="8" height="6" rx="1" stroke="#34e0ff" strokeWidth="1.4" />
                <path d="M20 13V10C20 8.343 18.657 7 17 7H15C13.343 7 12 8.343 12 10V13" stroke="#34e0ff" strokeWidth="1.4" />
              </svg>
            </button>
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                border: '1px solid rgba(52, 224, 255, 0.2)',
                background: 'rgba(0, 12, 18, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.3
              }}
            >
              <span style={{ color: '#34e0ff', fontSize: '8px', opacity: 0.5 }}>—</span>
            </div>
          )}
        </div>

        {/* Chevron toggle button at bottom center */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60px',
            height: '25px',
            border: 'none',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
          title={isOpen ? "Hide menu" : "Show menu"}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.4s ease-in-out',
              opacity: 0.8
            }}
          >
            <path 
              d="M6 9l6 6 6-6" 
              stroke="#34e0ff" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SettingsDropdown;
