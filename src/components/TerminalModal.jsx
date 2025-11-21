import { useEffect, useRef, useState } from 'react'
import { getGameTime } from '../lib/gameTime.js'

/**
 * Terminal Modal - Popup to display action results
 * Shows DRE output and narrative text with interactive choices
 */

const TerminalModal = ({ 
  isOpen, 
  onClose, 
  content = [],
  interactive = false,
  choices = [],
  onChoice = null,
  lootItems = [],
  onLootTransfer = null,
  showInventory = false
}) => {
  const terminalRef = useRef(null);
  const [currentTime, setCurrentTime] = useState('');
  
  // Update game time display
  useEffect(() => {
    const updateTime = () => {
      const gameTime = getGameTime();
      setCurrentTime(gameTime.formatGameTime());
    };
    
    updateTime(); // Initial update
    const interval = setInterval(updateTime, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, []);
  
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
          background: 'linear-gradient(135deg, rgba(0, 12, 18, 0.95) 0%, rgba(0, 20, 30, 0.98) 100%)',
          border: '2px solid rgba(52, 224, 255, 0.7)',
          borderRadius: '12px',
          boxShadow: '0 0 50px rgba(52, 224, 255, 0.6), 0 0 100px rgba(52, 224, 255, 0.3), inset 0 2px 0 rgba(52, 224, 255, 0.4), inset 0 -2px 20px rgba(0, 100, 150, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(10px)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 28px',
          borderBottom: '2px solid rgba(52, 224, 255, 0.4)',
          background: 'linear-gradient(180deg, rgba(52, 224, 255, 0.15) 0%, rgba(52, 224, 255, 0.05) 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 20px rgba(52, 224, 255, 0.2)',
          position: 'relative'
        }}>
          {/* Animated holographic bar */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(52, 224, 255, 0.8) 50%, transparent 100%)',
            boxShadow: '0 0 10px rgba(52, 224, 255, 0.8)',
            animation: 'shimmer 3s ease-in-out infinite'
          }} />
          
          <div style={{
            fontSize: '15px',
            fontWeight: '800',
            color: '#34e0ff',
            letterSpacing: '2px',
            textShadow: '0 0 15px rgba(52, 224, 255, 0.8), 0 0 30px rgba(52, 224, 255, 0.4)',
            textTransform: 'uppercase'
          }}>
            ▸ Terminal Output
          </div>
          
          <style>{`
            @keyframes shimmer {
              0%, 100% { opacity: 0.3; transform: translateX(-100%); }
              50% { opacity: 1; transform: translateX(100%); }
            }
          `}</style>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, rgba(52, 224, 255, 0.15) 0%, rgba(52, 224, 255, 0.08) 100%)',
              border: '1px solid rgba(52, 224, 255, 0.5)',
              borderRadius: '6px',
              color: '#34e0ff',
              fontSize: '10px',
              fontWeight: '700',
              letterSpacing: '1px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 0 10px rgba(52, 224, 255, 0.3), inset 0 1px 0 rgba(52, 224, 255, 0.3)',
              textShadow: '0 0 8px rgba(52, 224, 255, 0.8)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(52, 224, 255, 0.25) 0%, rgba(52, 224, 255, 0.15) 100%)';
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.9)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(52, 224, 255, 0.6), inset 0 1px 0 rgba(52, 224, 255, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(52, 224, 255, 0.15) 0%, rgba(52, 224, 255, 0.08) 100%)';
              e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(52, 224, 255, 0.3), inset 0 1px 0 rgba(52, 224, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            CLOSE [ESC]
          </button>
        </div>
        
        {/* Terminal Content */}
        <div
          ref={terminalRef}
          className="custom-scrollbar"
          style={{
            flex: 1,
            padding: '32px',
            overflowY: 'auto',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            color: '#cfd8df',
            background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.4) 0%, rgba(0, 30, 50, 0.6) 100%)',
            position: 'relative'
          }}
        >
          {/* Holographic scanlines effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(0deg, rgba(52, 224, 255, 0.03) 0px, rgba(52, 224, 255, 0.03) 1px, transparent 1px, transparent 2px)',
            pointerEvents: 'none',
            opacity: 0.5
          }} />
          
          {/* Glowing vignette */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 20, 40, 0.8) 100%)',
            pointerEvents: 'none'
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            {content.length === 0 ? (
              <div style={{ 
                opacity: 0.3, 
                textAlign: 'center', 
                marginTop: '60px',
                color: '#34e0ff',
                fontSize: '11px',
                letterSpacing: '2px'
              }}>
                [ NO DATA ]
              </div>
            ) : (
              content.map((line, index) => {
                const isPrompt = line.type === 'prompt';
                const isSuccess = line.type === 'success';
                const isError = line.type === 'error';
                const isWarning = line.type === 'warning';
                
                return (
                  <div 
                    key={index}
                    style={{
                      marginBottom: '6px',
                      padding: isPrompt ? '4px 0' : '1px 0',
                      color: isError ? '#ff6b9d' :
                             isSuccess ? '#52ffa8' :
                             isWarning ? '#ffc864' :
                             isPrompt ? '#34e0ff' :
                             '#c8d7e1',
                      fontWeight: isPrompt ? '700' : '400',
                      textShadow: isPrompt ? '0 0 12px rgba(52, 224, 255, 0.8), 0 0 24px rgba(52, 224, 255, 0.4)' :
                                  isSuccess ? '0 0 10px rgba(82, 255, 168, 0.6)' :
                                  isError ? '0 0 10px rgba(255, 107, 157, 0.6)' :
                                  isWarning ? '0 0 10px rgba(255, 200, 100, 0.6)' :
                                  '0 0 6px rgba(52, 224, 255, 0.2)',
                      letterSpacing: isPrompt ? '0.5px' : '0.3px',
                      borderLeft: isPrompt ? '3px solid rgba(52, 224, 255, 0.6)' : 'none',
                      paddingLeft: isPrompt ? '12px' : '0',
                      transition: 'all 0.3s ease',
                      animation: index === content.length - 1 ? 'fadeInTerminal 0.3s ease-out' : 'none'
                    }}
                  >
                    {line.text}
                  </div>
                );
              })
            )}
          </div>
          
          <style>{`
            @keyframes fadeInTerminal {
              from {
                opacity: 0;
                transform: translateX(-4px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            
            /* Custom Scrollbar Styling */
            .custom-scrollbar::-webkit-scrollbar {
              width: 12px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(0, 20, 40, 0.6);
              border-left: 1px solid rgba(52, 224, 255, 0.2);
              box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, rgba(52, 224, 255, 0.4) 0%, rgba(52, 224, 255, 0.6) 50%, rgba(52, 224, 255, 0.4) 100%);
              border-radius: 6px;
              border: 2px solid rgba(0, 20, 40, 0.6);
              box-shadow: 0 0 10px rgba(52, 224, 255, 0.5), inset 0 0 6px rgba(52, 224, 255, 0.3);
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(180deg, rgba(52, 224, 255, 0.6) 0%, rgba(52, 224, 255, 0.8) 50%, rgba(52, 224, 255, 0.6) 100%);
              box-shadow: 0 0 15px rgba(52, 224, 255, 0.8), inset 0 0 8px rgba(52, 224, 255, 0.5);
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:active {
              background: linear-gradient(180deg, rgba(52, 224, 255, 0.7) 0%, rgba(52, 224, 255, 0.9) 50%, rgba(52, 224, 255, 0.7) 100%);
            }
          `}</style>
        </div>
        
        {/* Loot Items Display */}
        {lootItems.length > 0 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(52, 224, 255, 0.3)',
            background: 'rgba(52, 224, 255, 0.05)'
          }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#34e0ff',
              marginBottom: '12px',
              letterSpacing: '0.5px'
            }}>
              {showInventory ? 'DRAG ITEMS TO INVENTORY →' : 'EXTRACTED RESOURCES'}
            </div>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              {lootItems.map((loot, idx) => (
                <div
                  key={idx}
                  draggable={showInventory}
                  onDragStart={(e) => {
                    if (showInventory && onLootTransfer) {
                      e.dataTransfer.setData('lootItem', JSON.stringify(loot));
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: '#34e0ff',
                    cursor: showInventory ? 'grab' : 'default',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (showInventory) {
                      e.currentTarget.style.background = 'rgba(52, 224, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(52, 224, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{loot.quantity}x {loot.item}</div>
                </div>
              ))}
            </div>
            {!showInventory && onLootTransfer && (
              <button
                onClick={() => onLootTransfer(lootItems)}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'rgba(52, 224, 255, 0.2)',
                  border: '1px solid rgba(52, 224, 255, 0.6)',
                  borderRadius: '4px',
                  color: '#34e0ff',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  width: '100%'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                  e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.6)';
                }}
              >
                TRANSFER ALL TO SHIP INVENTORY
              </button>
            )}
          </div>
        )}
        
        {/* Interactive Choice Buttons */}
        {interactive && choices.length > 0 && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid rgba(52, 224, 255, 0.3)',
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            background: 'rgba(52, 224, 255, 0.05)'
          }}>
            {choices.map((choice, idx) => (
              <button
                key={idx}
                disabled={choice.disabled}
                onClick={() => onChoice && onChoice(choice.value)}
                style={{
                  padding: '8px 20px',
                  background: choice.disabled 
                    ? 'rgba(100, 100, 100, 0.2)' 
                    : 'rgba(52, 224, 255, 0.2)',
                  border: `1px solid ${choice.disabled ? 'rgba(100, 100, 100, 0.4)' : 'rgba(52, 224, 255, 0.6)'}`,
                  borderRadius: '4px',
                  color: choice.disabled ? '#888' : '#34e0ff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  cursor: choice.disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!choice.disabled) {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.9)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!choice.disabled) {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.6)';
                  }
                }}
              >
                {choice.label}
              </button>
            ))}
          </div>
        )}
        
        {/* Footer hint */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(52, 224, 255, 0.2)',
          fontSize: '9px',
          color: 'rgba(207, 216, 223, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>
            {showInventory ? 'Drag items to ship inventory or click Transfer All' : 'Press ESC or click outside to close'}
          </span>
          <span style={{
            color: '#34e0ff',
            fontSize: '10px',
            fontWeight: '600',
            letterSpacing: '1px',
            textShadow: '0 0 8px rgba(52, 224, 255, 0.6)',
            fontFamily: 'monospace'
          }}>
            {currentTime}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TerminalModal;
