import React, { useState, useEffect } from 'react';
import HoloIcon from './HoloIcons';
import HoloStars from './HoloStars';
import { scrapItem } from '../../lib/inventory/scrap';
import ScrapProgressModal from './ScrapProgressModal';

// Unified neon palette: intensity only
const BASE_NEON = '#00ffff';
const TIER_COLORS = {
  0: BASE_NEON,
  1: BASE_NEON,
  2: BASE_NEON,
  3: BASE_NEON,
  4: BASE_NEON
};

// Tier names deprecated visually (replaced by stars); keep for aria labels if needed
const TIER_NAMES = {
  0: 'Common',
  1: 'Uncommon',
  2: 'Rare',
  3: 'Epic',
  4: 'Legendary'
};

export default function ItemDetailModal({ item, onClose, onTransferToShip, canTransfer = false, onApplyScrap }) {
  const [anim, setAnim] = useState('enter');
  const [scrapOpen, setScrapOpen] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferQuantity, setTransferQuantity] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setAnim('idle'), 300);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setAnim('exit');
    setTimeout(() => onClose && onClose(), 230);
  };

  if (!item) return null;

  const tierColor = TIER_COLORS[item.tier || 0];
  const tierName = TIER_NAMES[item.tier || 0] || 'Unknown';
  const scrapResult = scrapItem(item, { seed: 'UI-SCRAP', techLevel: 5, crewSkill: 4 });

  return (
    <>
    <div
      className={`terminal-modal-overlay ${anim === 'enter' ? 'modal-anim-enter' : ''} ${anim === 'exit' ? 'modal-anim-exit' : ''}`}
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'radial-gradient(ellipse at center, rgba(0,20,30,0.85), rgba(0,10,20,0.75))',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="terminal-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '600px',
          maxHeight: '80vh',
          background: 'rgba(0, 10, 20, 0.98)',
          border: `2px solid ${tierColor}`,
          boxShadow: `0 0 40px ${tierColor}60, inset 0 0 30px rgba(0,255,255,0.08)`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* HEADER */}
        <div style={{
          padding: '20px',
          borderBottom: `2px solid ${tierColor}50`,
          background: `linear-gradient(180deg, rgba(0,20,30,0.6), transparent)`
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginBottom: '15px'
          }}>
            {/* Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(0, 10, 20, 0.8)',
              border: `2px solid ${tierColor}`,
              boxShadow: `0 0 20px ${tierColor}40, inset 0 0 15px rgba(0,255,255,0.05)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              filter: `drop-shadow(0 0 8px ${tierColor})`
            }}>
              <HoloIcon item={item} size={64} />
            </div>

            {/* Name & Grade */}
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '22px',
                color: tierColor,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '8px',
                textShadow: `0 0 12px ${tierColor}90`,
                fontWeight: '300'
              }}>
                {item.name}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <HoloStars tier={item.tier} size={12} />
                <div style={{
                  fontSize: '10px',
                  color: 'rgba(0,255,255,0.7)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}>Level {item.tier * 3 + 1}</div>
              </div>
            </div>

            {/* Icon Buttons (Close above Transfer above Scrap) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={(e) => { e.stopPropagation(); handleClose(); }}
                title="Close"
                aria-label="Close item detail"
                style={iconButtonStyle(tierColor)}
              >
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 8L24 24" stroke={tierColor} strokeWidth="2" />
                  <path d="M24 8L8 24" stroke={tierColor} strokeWidth="2" />
                  <rect x="6" y="6" width="20" height="20" rx="2" stroke={tierColor} strokeWidth="1.2" />
                </svg>
              </button>
              {canTransfer && (
                <button
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setTransferQuantity(1); 
                    setShowTransferModal(true); 
                  }}
                  title="Transfer to Ship"
                  aria-label="Transfer item to ship inventory"
                  style={iconButtonStyle(tierColor)}
                >
                  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 22H26L22 26H10L6 22Z" stroke={tierColor} strokeWidth="1.6" />
                    <path d="M16 6V18" stroke={tierColor} strokeWidth="2" />
                    <path d="M11 12L16 18L21 12" stroke={tierColor} strokeWidth="2" />
                  </svg>
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setScrapOpen(true); }}
                title="Scrap"
                aria-label="Scrap item"
                style={iconButtonStyle(tierColor)}
              >
                {/* Recycle-like glyph */}
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 8L14 8L12 5L10 8Z" stroke={tierColor} strokeWidth="1.4" />
                  <path d="M18 24L14 24L16 27L18 24Z" stroke={tierColor} strokeWidth="1.4" />
                  <path d="M8 18L8 14L5 16L8 18Z" stroke={tierColor} strokeWidth="1.4" />
                  <path d="M24 14L24 18L27 16L24 14Z" stroke={tierColor} strokeWidth="1.4" />
                  <circle cx="16" cy="16" r="6.5" stroke={tierColor} strokeWidth="1.4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Type & Weight */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginTop: '14px'
          }}>
            <div style={{
              padding: '8px',
              background: 'rgba(0, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '8px', color: 'rgba(0, 255, 255, 0.5)', marginBottom: '3px' }}>TYPE</div>
              <div style={{ fontSize: '11px', color: '#00ffff', textTransform: 'uppercase' }}>{item.category || 'Unknown'}</div>
            </div>
            <div style={{
              padding: '8px',
              background: 'rgba(0, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '8px', color: 'rgba(0, 255, 255, 0.5)', marginBottom: '3px' }}>WEIGHT</div>
              <div style={{ fontSize: '11px', color: '#00ffff' }}>{item.weight_kg} kg</div>
            </div>
            <div style={{
              padding: '8px',
              background: 'rgba(0, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '8px', color: 'rgba(0, 255, 255, 0.5)', marginBottom: '3px' }}>VOLUME</div>
              <div style={{ fontSize: '11px', color: '#00ffff' }}>{item.size_m3} m³</div>
            </div>
            <div style={{
              padding: '8px',
              background: 'rgba(0, 255, 255, 0.05)',
              border: '1px solid rgba(0, 255, 255, 0.2)'
            }}>
              <div style={{ fontSize: '8px', color: 'rgba(0, 255, 255, 0.5)', marginBottom: '3px' }}>QUANTITY</div>
              <div style={{ fontSize: '11px', color: '#00ffff' }}>×{item.quantity || 1}</div>
            </div>
          </div>
        </div>

        {/* DETAILS (Scrollable) */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          borderBottom: `1px solid ${tierColor}30`
        }} className="holo-scroll">
          <div style={{
            fontSize: '10px',
            color: 'rgba(0, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            marginBottom: '10px',
            borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
            paddingBottom: '8px'
          }}>
            DETAILS
          </div>

          {/* Description */}
          <div style={{
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            lineHeight: '1.6',
            marginBottom: '20px',
            fontStyle: 'italic'
          }}>
            {item.description || 'No description available.'}
          </div>

          {/* Additional lore/details */}
          {item.lore && (
            <div style={{
              fontSize: '11px',
              color: 'rgba(0, 255, 255, 0.6)',
              lineHeight: '1.6',
              marginBottom: '20px',
              padding: '12px',
              background: 'rgba(0, 255, 255, 0.03)',
              border: '1px solid rgba(0, 255, 255, 0.15)',
              borderLeft: `3px solid ${tierColor}`
            }}>
              {item.lore}
            </div>
          )}

          {/* Technical Specs if available */}
          {item.slotType && (
            <div style={{
              marginBottom: '15px'
            }}>
              <div style={{
                fontSize: '9px',
                color: 'rgba(0, 255, 255, 0.6)',
                textTransform: 'uppercase',
                marginBottom: '6px'
              }}>
                INSTALLATION SLOT
              </div>
              <div style={{
                fontSize: '11px',
                color: '#00ffff',
                padding: '6px 10px',
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                display: 'inline-block',
                textTransform: 'uppercase'
              }}>
                {item.slotType}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER - Attributes & Dynamic Scrap */}
        <div style={{
          padding: '20px',
          background: 'rgba(0, 10, 20, 0.6)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '20px'
          }}>
            {/* Attributes */}
            <div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(0, 255, 255, 0.7)',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '10px'
              }}>
                ATTRIBUTES
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {item.attributes && Object.keys(item.attributes).length > 0 ? (
                  Object.entries(item.attributes).map(([key, value]) => (
                    <div key={key} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: 'rgba(255, 255, 255, 0.7)'
                    }}>
                      <span style={{ textTransform: 'uppercase', color: 'rgba(0, 255, 255, 0.6)' }}>{key}</span>
                      <span style={{ color: '#00ffff', fontWeight: 'bold' }}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)' }}>No attributes</div>
                )}

                {/* Modifiers */}
                {item.modifiers && Object.keys(item.modifiers).length > 0 && (
                  <>
                    {Object.entries(item.modifiers).map(([key, value]) => (
                      <div key={key} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: value > 0 ? '#00ff88' : '#ff4444'
                      }}>
                        <span style={{ textTransform: 'uppercase' }}>{key}</span>
                        <span style={{ fontWeight: 'bold' }}>
                          {value > 0 ? '+' : ''}{value}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Scrap Panel */}
            <div style={{
              padding: '14px',
              background: 'rgba(0, 40, 50, 0.25)',
              border: '1px solid rgba(0,255,255,0.35)',
              minWidth: '180px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                fontSize: '9px',
                color: 'rgba(0,255,255,0.85)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                marginBottom: '4px'
              }}>Scrap Analysis</div>
              <div style={{
                fontSize: '9px',
                color: 'rgba(0,255,255,0.55)'
              }}>Efficiency: <span style={{ color: '#00ffff' }}>{(scrapResult.efficiency * 100).toFixed(1)}%</span></div>
              <div style={{
                fontSize: '9px',
                color: 'rgba(0,255,255,0.55)'
              }}>Value: <span style={{ color: '#00ffff' }}>{scrapResult.scrapValue}</span> / {scrapResult.intrinsicValue}</div>
              <div style={{
                fontSize: '9px',
                color: scrapResult.economical ? '#00ffcc' : 'rgba(0,255,255,0.4)'
              }}>{scrapResult.economical ? 'ECONOMICAL' : 'NOT ECONOMICAL'}</div>
              <div style={{
                borderTop: '1px solid rgba(0,255,255,0.2)',
                marginTop: '4px',
                paddingTop: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                {scrapResult.outputs.map(o => (
                  <div key={o.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '9px',
                    color: '#00ffff'
                  }}>
                    <span style={{ opacity: 0.85 }}>{o.name}</span>
                    <span style={{ fontWeight: 'bold' }}>×{o.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {scrapOpen && (
      <ScrapProgressModal
        item={item}
        onClose={() => setScrapOpen(false)}
        onComplete={(res) => {
          setScrapOpen(false);
          if (onApplyScrap) onApplyScrap(item, res);
          handleClose();
        }}
      />
    )}
    {showTransferModal && (
      <div
        className="terminal-modal-overlay"
        onClick={() => setShowTransferModal(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3000,
          background: 'rgba(0,10,20,0.8)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 420,
            background: 'rgba(0, 10, 20, 0.98)',
            border: `2px solid ${tierColor}`,
            boxShadow: `0 0 30px ${tierColor}60, inset 0 0 30px rgba(0,255,255,0.06)`,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          <div className="holo-text" style={{ color: tierColor, fontSize: 12, letterSpacing: 1.5 }}>
            TRANSFER TO SHIP
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
            {item.name}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(0,255,255,0.7)' }}>Quantity</span>
              <span style={{ fontSize: 14, color: tierColor, fontWeight: 600 }}>×{transferQuantity}</span>
            </div>
            <input
              type="range"
              min="1"
              max={item.quantity || 1}
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: tierColor,
                cursor: 'pointer',
                height: 6
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(0,255,255,0.5)' }}>
              <span>1</span>
              <span>{item.quantity || 1}</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => setShowTransferModal(false)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${tierColor}55`,
                background: 'rgba(0,255,255,0.04)',
                color: tierColor,
                cursor: 'pointer',
                fontSize: 10
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowTransferModal(false);
                if (onTransferToShip) onTransferToShip(item.instanceId, transferQuantity);
                handleClose();
              }}
              style={{
                padding: '8px 16px',
                border: `1px solid ${tierColor}`,
                background: `rgba(0,255,255,0.12)`,
                color: tierColor,
                cursor: 'pointer',
                boxShadow: `0 0 12px ${tierColor}40`,
                fontSize: 10
              }}
            >
              Transfer
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// Reusable neon icon button style
function iconButtonStyle(color) {
  return {
    width: '32px',
    height: '32px',
    background: 'rgba(0,255,255,0.06)',
    border: `1.5px solid ${color}90`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: `0 0 10px ${color}50, inset 0 0 8px ${color}20`,
    transition: 'all 0.2s ease',
    backdropFilter: 'blur(2px)'
  };
}
