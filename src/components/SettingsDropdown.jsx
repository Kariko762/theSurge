import { useState } from 'react'

/**
 * Reusable Settings Dropdown Component
 * 500px wide beveled rectangle that slides down from top center
 * Contains horizontally aligned action boxes
 */

const SettingsDropdown = ({ 
  onCreateGalaxy, 
  showAdmin = false, 
  onAdmin,
  // GUI Settings
  showShip = true,
  setShowShip,
  showPlanets = true,
  setShowPlanets,
  showOrbitals = true,
  setShowOrbitals,
  showMoons = true,
  setShowMoons,
  showAsteroidClusters = true,
  setShowAsteroidClusters,
  // Tick Rate
  tickRate = 1,
  tickRateOptions = [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8],
  tickIndex = 4,
  setTickIndex
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showGUISettings, setShowGUISettings] = useState(false);

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
      {/* GUI Settings Panel */}
      {showGUISettings && (
        <div style={{
          position: 'absolute',
          top: '75px',
          left: '0',
          width: '100%',
          background: 'rgba(0, 12, 18, 0.98)',
          border: '1px solid rgba(52, 224, 255, 0.6)',
          borderTop: '1px solid rgba(52, 224, 255, 0.3)',
          borderRadius: '0 0 15px 15px',
          boxShadow: '0 4px 20px rgba(52, 224, 255, 0.4)',
          padding: '16px',
          zIndex: 9999
        }}>
          {/* GUI Visibility Section */}
          <div style={{
            fontSize: '10px',
            color: '#34e0ff',
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginBottom: '12px',
            textTransform: 'uppercase'
          }}>
            GUI Settings
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '16px'
          }}>
            {setShowShip && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showShip} 
                  onChange={(e) => setShowShip(e.target.checked)}
                  style={{ accentColor: '#34e0ff' }}
                />
                Show Ship
              </label>
            )}
            {setShowPlanets && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showPlanets} 
                  onChange={(e) => setShowPlanets(e.target.checked)}
                  style={{ accentColor: '#34e0ff' }}
                />
                Show Planets
              </label>
            )}
            {setShowOrbitals && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showOrbitals} 
                  onChange={(e) => setShowOrbitals(e.target.checked)}
                  style={{ accentColor: '#34e0ff' }}
                />
                Show Orbitals
              </label>
            )}
            {setShowMoons && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showMoons} 
                  onChange={(e) => setShowMoons(e.target.checked)}
                  style={{ accentColor: '#34e0ff' }}
                />
                Show Moons
              </label>
            )}
            {setShowAsteroidClusters && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showAsteroidClusters} 
                  onChange={(e) => setShowAsteroidClusters(e.target.checked)}
                  style={{ accentColor: '#34e0ff' }}
                />
                Show Asteroid Clusters
              </label>
            )}
          </div>

          {/* Tick Rate Section */}
          {setTickIndex && (
            <>
              <div style={{
                borderTop: '1px solid rgba(52, 224, 255, 0.3)',
                margin: '12px 0'
              }} />
              
              <div style={{
                fontSize: '10px',
                color: '#34e0ff',
                fontWeight: 'bold',
                letterSpacing: '1px',
                marginBottom: '12px',
                textTransform: 'uppercase'
              }}>
                Game Speed
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={() => setTickIndex(i => Math.max(0, i - 1))}
                  disabled={tickIndex === 0}
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    background: tickIndex === 0 ? 'rgba(0, 12, 18, 0.3)' : 'rgba(0, 12, 18, 0.6)',
                    borderRadius: '6px',
                    color: tickIndex === 0 ? 'rgba(52, 224, 255, 0.3)' : '#34e0ff',
                    fontSize: '16px',
                    cursor: tickIndex === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    if (tickIndex > 0) {
                      e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tickIndex > 0) {
                      e.currentTarget.style.background = 'rgba(0, 12, 18, 0.6)';
                      e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                    }
                  }}
                  title="Decrease game speed"
                >
                  −
                </button>

                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    fontSize: '14px',
                    color: tickRate === 0 ? '#ff6b6b' : '#34e0ff',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    textShadow: tickRate === 0 ? '0 0 8px rgba(255, 107, 107, 0.6)' : '0 0 8px rgba(52, 224, 255, 0.6)'
                  }}>
                    {tickRate === 0 ? 'PAUSED' : `${tickRate.toFixed(2)}x`}
                  </div>
                  <div style={{
                    fontSize: '8px',
                    color: 'rgba(207, 216, 223, 0.5)',
                    marginTop: '4px'
                  }}>
                    {tickRate === 0 ? 'Game time stopped' : 'Game speed multiplier'}
                  </div>
                </div>

                <button
                  onClick={() => setTickIndex(i => Math.min(tickRateOptions.length - 1, i + 1))}
                  disabled={tickIndex === tickRateOptions.length - 1}
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    background: tickIndex === tickRateOptions.length - 1 ? 'rgba(0, 12, 18, 0.3)' : 'rgba(0, 12, 18, 0.6)',
                    borderRadius: '6px',
                    color: tickIndex === tickRateOptions.length - 1 ? 'rgba(52, 224, 255, 0.3)' : '#34e0ff',
                    fontSize: '16px',
                    cursor: tickIndex === tickRateOptions.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: 'bold'
                  }}
                  onMouseEnter={(e) => {
                    if (tickIndex < tickRateOptions.length - 1) {
                      e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tickIndex < tickRateOptions.length - 1) {
                      e.currentTarget.style.background = 'rgba(0, 12, 18, 0.6)';
                      e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                    }
                  }}
                  title="Increase game speed"
                >
                  +
                </button>
              </div>
            </>
          )}
        </div>
      )}

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
          {/* Box 1: GUI Settings */}
          <button
            onClick={() => setShowGUISettings(!showGUISettings)}
            style={{
              width: '40px',
              height: '40px',
              border: `1px solid rgba(52, 224, 255, ${showGUISettings ? '0.8' : '0.4'})`,
              background: showGUISettings ? 'rgba(52, 224, 255, 0.15)' : 'rgba(0, 12, 18, 0.6)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!showGUISettings) {
                e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showGUISettings) {
                e.currentTarget.style.background = 'rgba(0, 12, 18, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title="GUI Settings"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="3" stroke="#34e0ff" strokeWidth="1.5" />
              <path d="M12 2v3m0 14v3M5.64 5.64l2.12 2.12m8.48 8.48l2.12 2.12M2 12h3m14 0h3M5.64 18.36l2.12-2.12m8.48-8.48l2.12-2.12" 
                stroke="#34e0ff" 
                strokeWidth="1.5" 
                strokeLinecap="round"
              />
            </svg>
          </button>

          {/* Box 2: Full Screen */}
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

          {/* Box 3: Galaxy Creator */}
          {onCreateGalaxy ? (
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

          {/* Box 4: Admin (or Empty placeholder) */}
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
