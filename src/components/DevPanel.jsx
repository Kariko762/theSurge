import { useState } from 'react'
import { exampleSeeds } from '../lib/systemGenerator'

/**
 * Developer Panel - Quick access to all major areas of the app
 * Shown at homebase when Dev Mode is enabled
 */

const DevPanel = ({ onNavigate, onCreateGalaxy, onLaunch, setExpeditionSeed }) => {
  const seeds = exampleSeeds();
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [launchSeed, setLaunchSeed] = useState('');
  const [launchType, setLaunchType] = useState('default'); // 'sun5au' | 'default' | 'random'
  
  // Generate random seed in proper format: SSG1-[CLASS]:[SECTOR]:[PAYLOAD]
  const generateRandomSeed = () => {
    const starClasses = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
    const randomClass = starClasses[Math.floor(Math.random() * starClasses.length)];
    const randomSector = `SECTOR${Math.floor(Math.random() * 100)}`;
    const randomPayload = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SSG1-${randomClass}:${randomSector}:${randomPayload}`;
  };
  
  const openLaunchModal = (type) => {
    setLaunchType(type);
    setLaunchSeed(generateRandomSeed());
    setShowLaunchModal(true);
  };
  
  const handleLaunch = () => {
    if (onLaunch && launchSeed) {
      setExpeditionSeed && setExpeditionSeed(launchSeed);
      
      // Determine spawn position based on launch type
      let spawnPosition = null;
      
      if (launchType === 'sun5au') {
        // Spawn at 5AU from sun at angle 0 (right side of sun)
        spawnPosition = { distanceAU: 5, angleRad: 0 };
      } else if (launchType === 'random') {
        // Spawn at random position within heliosphere
        // Note: heliosphere size varies by star, so we use a conservative 30-50 AU range
        const randomDistance = 30 + Math.random() * 20; // 30-50 AU
        const randomAngle = Math.random() * Math.PI * 2; // 0-360 degrees
        spawnPosition = { distanceAU: randomDistance, angleRad: randomAngle };
      }
      // If 'default', spawnPosition remains null (will use default edge spawn in ShipCommandConsole)
      
      onLaunch(launchSeed, spawnPosition);
      setShowLaunchModal(false);
    }
  };

  const sections = [
    {
      title: 'HOMEBASE',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      actions: [
        { label: 'View Terminal', onClick: () => {} }, // Already at homebase
        { label: 'Reset Progress', onClick: () => { /* TODO */ } },
      ]
    },
    {
      title: 'ENCOUNTERS',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 8l-2-2M16 8l2-2M12 4V2" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      actions: [
        { 
          label: 'Trigger Hostile Encounter', 
          onClick: () => { console.log('Hostile encounter triggered!'); /* TODO */ } 
        },
        { 
          label: 'Trigger Neutral Encounter', 
          onClick: () => { console.log('Neutral encounter triggered!'); /* TODO */ } 
        },
        { 
          label: 'Trigger Positive Encounter', 
          onClick: () => { console.log('Positive encounter triggered!'); /* TODO */ } 
        },
      ]
    },
    {
      title: 'GALAXY MAP',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <circle cx="8" cy="8" r="2" fill="currentColor"/>
          <circle cx="16" cy="8" r="1.5" fill="currentColor"/>
          <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
        </svg>
      ),
      actions: [
        { label: 'Open Galaxy View', onClick: () => { /* TODO - need galaxy view component */ } },
        { label: 'Jump to System', onClick: () => { /* TODO */ } },
      ]
    },
    {
      title: 'GALAXY EDITOR',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2"/>
        </svg>
      ),
      actions: [
        { label: 'Open Editor', onClick: onCreateGalaxy },
        { label: 'Create New Galaxy', onClick: onCreateGalaxy },
      ]
    },
    {
      title: 'SHIP COMMAND',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-8-5z" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 11l3 3-3 3-3-3 3-3z" fill="currentColor"/>
        </svg>
      ),
      actions: [
        { 
          label: 'Launch → Sun @ 5AU', 
          onClick: () => openLaunchModal('sun5au')
        },
        { 
          label: 'Launch → Default Spawn', 
          onClick: () => openLaunchModal('default')
        },
        { 
          label: 'Launch → Random System', 
          onClick: () => openLaunchModal('random')
        },
      ]
    },
  ];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(0, 10, 20, 0.95) 0%, rgba(0, 20, 40, 0.95) 100%)',
      padding: '40px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Dev Mode Header */}
      <div style={{
        marginBottom: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#00ff00',
          textShadow: '0 0 20px rgba(0, 255, 0, 0.6)',
          letterSpacing: '3px',
          marginBottom: '8px'
        }}>
          DEVELOPER MODE
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(52, 224, 255, 0.7)',
          letterSpacing: '1px'
        }}>
          Quick Access Panel
        </div>
      </div>

      {/* Action Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        width: '100%'
      }}>
        {sections.map((section) => (
          <div
            key={section.title}
            style={{
              background: 'rgba(0, 12, 18, 0.8)',
              border: '1px solid rgba(52, 224, 255, 0.4)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(52, 224, 255, 0.2)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(52, 224, 255, 0.4)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(52, 224, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Section Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid rgba(52, 224, 255, 0.2)'
            }}>
              <div style={{ color: '#34e0ff' }}>
                {section.icon}
              </div>
              <div style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#34e0ff',
                letterSpacing: '1px'
              }}>
                {section.title}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {section.actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  style={{
                    padding: '10px 14px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.3)',
                    borderRadius: '6px',
                    color: '#34e0ff',
                    fontSize: '10px',
                    fontWeight: '600',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.6)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  → {action.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Exit Dev Mode Hint */}
      <div style={{
        marginTop: '40px',
        fontSize: '9px',
        color: 'rgba(52, 224, 255, 0.5)',
        letterSpacing: '0.5px'
      }}>
        Toggle Dev Mode in settings (cog icon, top-left) to return to normal homebase view
      </div>

      {/* Launch Confirmation Modal */}
      {showLaunchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(0, 12, 18, 0.98)',
            border: '2px solid rgba(52, 224, 255, 0.6)',
            borderRadius: '12px',
            padding: '32px',
            minWidth: '400px',
            boxShadow: '0 0 40px rgba(52, 224, 255, 0.5)'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#34e0ff',
              marginBottom: '8px',
              letterSpacing: '1px',
              textAlign: 'center'
            }}>
              LAUNCH CONFIRMATION
            </div>
            <div style={{
              fontSize: '9px',
              color: 'rgba(52, 224, 255, 0.6)',
              marginBottom: '4px',
              textAlign: 'center'
            }}>
              {launchType === 'sun5au' && 'Spawn: 5AU from Sun (0°)'}
              {launchType === 'default' && 'Spawn: Default (Heliosphere Edge)'}
              {launchType === 'random' && 'Spawn: Random Position (30-50 AU)'}
            </div>
            <div style={{
              fontSize: '9px',
              color: 'rgba(52, 224, 255, 0.6)',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              Enter or modify system seed
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '10px',
                color: '#34e0ff',
                marginBottom: '8px',
                letterSpacing: '0.5px'
              }}>
                SYSTEM SEED
              </label>
              <input
                type="text"
                value={launchSeed}
                onChange={(e) => setLaunchSeed(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid rgba(52, 224, 255, 0.4)',
                  borderRadius: '6px',
                  color: '#34e0ff',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                  e.target.style.boxShadow = '0 0 12px rgba(52, 224, 255, 0.3)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => setShowLaunchModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'rgba(52, 224, 255, 0.1)',
                  border: '1px solid rgba(52, 224, 255, 0.4)',
                  borderRadius: '6px',
                  color: '#34e0ff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '1px'
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
                CANCEL
              </button>
              <button
                onClick={handleLaunch}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  background: 'rgba(52, 224, 255, 0.3)',
                  border: '1px solid rgba(52, 224, 255, 0.8)',
                  borderRadius: '6px',
                  color: '#34e0ff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '1px',
                  boxShadow: '0 0 12px rgba(52, 224, 255, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.5)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(52, 224, 255, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 224, 255, 0.3)';
                }}
              >
                LAUNCH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevPanel;
