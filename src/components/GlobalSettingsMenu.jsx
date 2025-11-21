import { useState, useEffect } from 'react'
import { getGlobalSettings } from '../lib/globalSettings.js'

/**
 * Global Settings Menu - Cog icon in top-left corner
 * Available on all main screens (not login, not modals)
 */

const GlobalSettingsMenu = ({ onGalaxyEditor, devMode, onDevModeToggle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const globalSettings = getGlobalSettings();
  const [verboseLogging, setVerboseLogging] = useState(globalSettings.verboseLogging);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const menuItems = [
    {
      id: 'fullscreen',
      label: 'Fullscreen',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: toggleFullscreen,
      enabled: true
    },
    {
      id: 'galaxy-editor',
      label: 'Galaxy Editor',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
          <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
        </svg>
      ),
      onClick: onGalaxyEditor,
      enabled: !!onGalaxyEditor
    },
    {
      id: 'mission-editor',
      label: 'Mission Editor',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      onClick: null,
      enabled: false
    },
    {
      id: 'dev-phases',
      label: 'Dev Phases',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      onClick: null,
      enabled: false
    },
    {
      id: 'dev-toggle',
      label: `Dev Mode: ${devMode ? 'ON' : 'OFF'}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      onClick: onDevModeToggle,
      enabled: !!onDevModeToggle,
      special: true
    },
    {
      id: 'verbose-toggle',
      label: `Verbose Logging: ${verboseLogging ? 'ON' : 'OFF'}`,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
          <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2"/>
          <line x1="8" y1="17" x2="16" y2="17" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      onClick: () => {
        const newValue = !verboseLogging;
        globalSettings.verboseLogging = newValue;
        setVerboseLogging(newValue);
      },
      enabled: devMode, // Only show when dev mode is ON
      special: true,
      indent: true
    }
  ];

  return (
    <div style={{
      position: 'relative',
      zIndex: 1
    }}>
      {/* Cog Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '32px',
          height: '32px',
          background: isOpen ? 'rgba(52, 224, 255, 0.2)' : 'rgba(0, 12, 18, 0.9)',
          border: `1px solid ${isOpen ? 'rgba(52, 224, 255, 0.8)' : 'rgba(52, 224, 255, 0.4)'}`,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 0 12px rgba(52, 224, 255, 0.3)'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(0, 12, 18, 0.9)';
            e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
          }
        }}
        title="Settings"
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none"
          stroke="#34e0ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: '90px',
          left: '16px',
          background: 'rgba(0, 12, 18, 0.98)',
          border: '1px solid rgba(52, 224, 255, 0.6)',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(52, 224, 255, 0.4)',
          minWidth: '180px',
          overflow: 'hidden',
          zIndex: 10001
        }}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.enabled && item.onClick) {
                  item.onClick();
                  if (item.id !== 'dev-toggle' && item.id !== 'verbose-toggle') {
                    setIsOpen(false);
                  }
                }
              }}
              disabled={!item.enabled}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                paddingLeft: item.indent ? '32px' : '16px',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(52, 224, 255, 0.15)',
                color: !item.enabled ? 'rgba(52, 224, 255, 0.3)' : item.special && (item.id === 'dev-toggle' ? devMode : verboseLogging) ? '#00ff00' : '#34e0ff',
                fontSize: '10px',
                fontWeight: '600',
                letterSpacing: '0.5px',
                textAlign: 'left',
                cursor: item.enabled ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                opacity: item.enabled ? 1 : 0.4
              }}
              onMouseEnter={(e) => {
                if (item.enabled) {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ 
                width: '20px', 
                height: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: !item.enabled ? 'rgba(52, 224, 255, 0.3)' : item.special && (item.id === 'dev-toggle' ? devMode : verboseLogging) ? '#00ff00' : '#34e0ff'
              }}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalSettingsMenu;
