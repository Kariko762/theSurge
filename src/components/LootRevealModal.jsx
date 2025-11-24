import { useState, useEffect } from 'react';
import '../styles/AdminGlass.css';

/**
 * Loot Reveal Modal - Animated container opening experience
 * 
 * Shows tiered container with sequential item reveals
 */
export default function LootRevealModal({ lootData, onClose }) {
  const [revealStage, setRevealStage] = useState('container'); // 'container' | 'opening' | 'revealing' | 'complete'
  const [revealedItems, setRevealedItems] = useState([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);

  const { items = [], containerData } = lootData || {};
  
  const getTierColor = (tier) => {
    const colors = {
      common: '#888',
      uncommon: '#0f0',
      rare: '#0af',
      epic: '#c0f',
      legendary: '#fa0'
    };
    return colors[tier] || '#888';
  };

  useEffect(() => {
    if (revealStage === 'container') {
      // Show container for 1 second
      const timer = setTimeout(() => {
        setRevealStage('opening');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [revealStage]);

  useEffect(() => {
    if (revealStage === 'opening') {
      // Opening animation for 1.5 seconds
      const timer = setTimeout(() => {
        setRevealStage('revealing');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [revealStage]);

  useEffect(() => {
    if (revealStage === 'revealing' && currentRevealIndex < items.length) {
      const delay = containerData?.revealDelay || 300;
      const timer = setTimeout(() => {
        setRevealedItems(prev => [...prev, items[currentRevealIndex]]);
        setCurrentRevealIndex(prev => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else if (revealStage === 'revealing' && currentRevealIndex >= items.length) {
      // All items revealed
      setTimeout(() => {
        setRevealStage('complete');
      }, 500);
    }
  }, [revealStage, currentRevealIndex, items, containerData]);

  const skipToEnd = () => {
    setRevealedItems([...items]);
    setCurrentRevealIndex(items.length);
    setRevealStage('complete');
  };

  const getAnimationClass = () => {
    const animation = containerData?.revealAnimation || 'pulse';
    switch (animation) {
      case 'pulse':
        return 'loot-reveal-pulse';
      case 'flash':
        return 'loot-reveal-flash';
      case 'spin':
        return 'loot-reveal-spin';
      case 'shake':
        return 'loot-reveal-shake';
      default:
        return 'loot-reveal-pulse';
    }
  };

  if (!lootData) return null;

  const glowColor = containerData?.glowColor || '#0ff';
  const displayName = containerData?.displayName || 'Loot Container';
  const icon = containerData?.icon || '📦';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="glass-card" style={{
        maxWidth: '800px',
        width: '90%',
        padding: '3rem',
        background: 'rgba(0, 20, 40, 0.95)',
        border: `2px solid ${glowColor}`,
        boxShadow: `0 0 60px ${glowColor}60`,
        textAlign: 'center'
      }}>
        
        {/* Container Stage */}
        {revealStage === 'container' && (
          <div style={{ animation: 'scaleIn 0.5s ease' }}>
            <div style={{
              fontSize: '8rem',
              marginBottom: '1rem',
              filter: `drop-shadow(0 0 20px ${glowColor})`
            }}>
              {icon}
            </div>
            <h2 style={{
              color: glowColor,
              fontSize: '2rem',
              margin: 0,
              textShadow: `0 0 20px ${glowColor}`
            }}>
              {displayName}
            </h2>
          </div>
        )}

        {/* Opening Stage */}
        {revealStage === 'opening' && (
          <div className={getAnimationClass()}>
            <div style={{
              fontSize: '8rem',
              marginBottom: '1rem',
              filter: `drop-shadow(0 0 40px ${glowColor})`,
              animation: 'scaleUp 1.5s ease infinite'
            }}>
              {icon}
            </div>
            <h2 style={{
              color: glowColor,
              fontSize: '2rem',
              margin: 0,
              textShadow: `0 0 20px ${glowColor}`,
              animation: 'glow 1s ease infinite'
            }}>
              OPENING...
            </h2>
          </div>
        )}

        {/* Revealing & Complete Stages */}
        {(revealStage === 'revealing' || revealStage === 'complete') && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '0.5rem',
                filter: `drop-shadow(0 0 10px ${glowColor})`
              }}>
                {icon}
              </div>
              <h3 style={{
                color: glowColor,
                fontSize: '1.2rem',
                margin: 0,
                textShadow: `0 0 10px ${glowColor}`
              }}>
                {displayName}
              </h3>
            </div>

            {/* Items Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
              minHeight: '200px'
            }}>
              {revealedItems.map((item, index) => (
                <div
                  key={index}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: `2px solid ${getTierColor(item.tier)}`,
                    boxShadow: `0 0 20px ${getTierColor(item.tier)}40`,
                    animation: 'itemReveal 0.4s ease',
                    position: 'relative'
                  }}
                >
                  {/* Guaranteed Badge */}
                  {item.guaranteed && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      background: '#fa0',
                      color: '#000',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      boxShadow: '0 0 10px #fa0'
                    }}>
                      ⭐
                    </div>
                  )}

                  <div style={{
                    fontSize: '3rem',
                    marginBottom: '0.5rem',
                    filter: `drop-shadow(0 0 10px ${getTierColor(item.tier)})`
                  }}>
                    {item.icon || '📦'}
                  </div>
                  <div style={{
                    color: getTierColor(item.tier),
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    marginBottom: '0.25rem',
                    textShadow: `0 0 10px ${getTierColor(item.tier)}`
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    color: '#666',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase'
                  }}>
                    {item.tier}
                  </div>
                  {item.quantity > 1 && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      color: '#0ff'
                    }}>
                      x{item.quantity}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Placeholder slots for unrevealed items */}
              {revealStage === 'revealing' && Array.from({ length: items.length - revealedItems.length }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '150px',
                    animation: 'pulse 1s ease infinite'
                  }}
                >
                  <div style={{ color: '#666', fontSize: '0.85rem' }}>???</div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {revealStage === 'revealing' && (
                <button
                  className="btn-neon"
                  onClick={skipToEnd}
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.75rem 1.5rem',
                    borderColor: '#666',
                    color: '#aaa'
                  }}
                >
                  SKIP
                </button>
              )}
              
              {revealStage === 'complete' && (
                <button
                  className="btn-neon btn-neon-primary"
                  onClick={onClose}
                  style={{
                    fontSize: '1rem',
                    padding: '0.75rem 2rem',
                    animation: 'glow 1.5s ease infinite'
                  }}
                >
                  ✓ LOOT OBTAINED
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes scaleUp {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @keyframes glow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes itemReveal {
          0% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          60% {
            transform: scale(1.2) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }

        .loot-reveal-pulse {
          animation: scaleUp 0.8s ease infinite;
        }

        .loot-reveal-flash {
          animation: flash 0.5s ease infinite;
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        .loot-reveal-spin {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .loot-reveal-shake {
          animation: shake 0.5s ease infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px) rotate(-5deg); }
          75% { transform: translateX(10px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
