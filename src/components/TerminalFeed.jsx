import React, { useEffect, useRef, useState } from 'react';

/**
 * TerminalFeed - Holographic terminal with chamfered corners and nested tile layout
 * Mimics a professional ship console interface with geometric precision
 */

const classify = (line) => {
  if (!line || typeof line !== 'string') return 'normal';
  if (line.includes('CRITICAL') || line.includes('FAILED')) return 'error';
  if (line.includes('WARNING')) return 'warning';
  if (line.includes('SUCCESS') || line.includes('complete')) return 'success';
  if (line.includes('ARIA:')) return 'aria';
  return 'normal';
};

const TerminalFeed = ({ events = [], legacyEntries = [], onStartMining, onCancelMining, onTransferLoot, onLeaveLoot }) => {
  const containerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const lastScrollTop = useRef(0);
  const prevEventsLengthRef = useRef(events.length);
  const prevLegacyLengthRef = useRef(legacyEntries.length);
  const hasScrolledManually = useRef(false);

  // Auto-scroll to bottom ONLY when new data is actually added
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Check if data actually changed (new items added)
    const dataChanged = events.length !== prevEventsLengthRef.current || 
                        legacyEntries.length !== prevLegacyLengthRef.current;
    
    // Update refs
    const prevEvents = prevEventsLengthRef.current;
    const prevLegacy = prevLegacyLengthRef.current;
    prevEventsLengthRef.current = events.length;
    prevLegacyLengthRef.current = legacyEntries.length;
    
    if (!dataChanged) {
      // No data change - don't touch scroll at all
      return;
    }
    
    console.log('[TERMINAL] Data changed:', prevEvents, '->', events.length, 'events;', prevLegacy, '->', legacyEntries.length, 'legacy');
    
    // Only auto-scroll if user hasn't manually scrolled up
    if (!hasScrolledManually.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
          lastScrollTop.current = containerRef.current.scrollHeight;
        }
      });
    }
  }, [events, legacyEntries]);

  // Track user scroll behavior
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 10; // 10px tolerance
    
    // If user scrolls to bottom, re-enable auto-scroll
    if (isAtBottom) {
      hasScrolledManually.current = false;
      lastScrollTop.current = scrollTop;
    } else if (scrollTop < lastScrollTop.current - 10) {
      // User scrolled up significantly - disable auto-scroll
      hasScrolledManually.current = true;
      lastScrollTop.current = scrollTop;
    }
  };

  // Chamfered corner SVG clip path
  const SquareBox = ({ children, style }) => (
    <div style={{
      position: 'relative',
      ...style
    }}>
      {children}
    </div>
  );

  // Group entries into tiles (group by type or every 3-5 entries)
  const createTiles = () => {
    if (legacyEntries.length === 0) return [];
    
    const tiles = [];
    let currentTile = [];
    
    legacyEntries.forEach((entry, idx) => {
      const type = classify(entry);
      currentTile.push({ text: entry, type, idx });
      
      // Create tile on ARIA messages or every 4 entries
      if (type === 'aria' || currentTile.length >= 4) {
        tiles.push([...currentTile]);
        currentTile = [];
      }
    });
    
    if (currentTile.length > 0) tiles.push(currentTile);
    return tiles;
  };

  // If structured events exist, render two-column panels per event; else fallback to legacy tile grouping
  const tiles = createTiles();

  return (
    <SquareBox style={{
      flex: 1,
      background: 'rgba(0, 15, 25, 0.2)',
      border: '3px solid rgba(52,224,255,0.7)',
      boxShadow: '0 0 20px rgba(52,224,255,0.4), inset 0 0 40px rgba(52,224,255,0.05)',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Stronger grid background with geometric lines */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(52,224,255,0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(52,224,255,0.05) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        pointerEvents: 'none',
        opacity: 1
      }} />
      
      {/* Gradient fade overlay - top left to bottom right */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(0,15,25,0) 0%, rgba(0,15,25,0.1) 50%, rgba(0,15,25,0.2) 100%)',
        pointerEvents: 'none'
      }} />
      
      {/* Geometric accent lines */}
      <svg style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: 0.3
      }} width="100%" height="100%">
        {/* Diagonal lines from corners */}
        <line x1="0" y1="0" x2="25%" y2="15%" stroke="rgba(52,224,255,0.6)" strokeWidth="1" />
        <line x1="100%" y1="0" x2="75%" y2="15%" stroke="rgba(52,224,255,0.6)" strokeWidth="1" />
        <line x1="0" y1="100%" x2="25%" y2="85%" stroke="rgba(52,224,255,0.6)" strokeWidth="1" />
        <line x1="100%" y1="100%" x2="75%" y2="85%" stroke="rgba(52,224,255,0.6)" strokeWidth="1" />
        
        {/* Horizontal accent lines */}
        <line x1="0" y1="30%" x2="40%" y2="30%" stroke="rgba(52,224,255,0.4)" strokeWidth="0.5" />
        <line x1="60%" y1="60%" x2="100%" y2="60%" stroke="rgba(52,224,255,0.4)" strokeWidth="0.5" />
        
        {/* Vertical accent lines */}
        <line x1="20%" y1="0" x2="20%" y2="25%" stroke="rgba(52,224,255,0.4)" strokeWidth="0.5" />
        <line x1="80%" y1="75%" x2="80%" y2="100%" stroke="rgba(52,224,255,0.4)" strokeWidth="0.5" />
      </svg>

      {/* Header */}
      <div style={{
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '2px',
        color: '#34e0ff',
        marginBottom: '12px',
        fontFamily: 'Consolas, monospace',
        textShadow: '0 0 8px rgba(52,224,255,0.6)',
        position: 'relative',
        zIndex: 1
      }}>
        TERMINAL // EVENT FEED
      </div>

      {/* Scrollable tile container */}
      <div ref={containerRef} style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        position: 'relative',
        zIndex: 1
      }}>
        {events.length > 0 ? events.map((evt) => {
          return (
            <div key={evt.id} style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              paddingBottom: '16px',
              marginBottom: '16px',
              borderBottom: '1px solid rgba(0,255,255,0.15)'
            }}>
              {/* AI MESSAGE BOX */}
              {evt.conversational && evt.conversational.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'relative',
                    padding: '12px 16px',
                    border: '2px solid rgba(0,255,255,0.7)',
                    borderRadius: '8px',
                    boxShadow: '0 0 12px rgba(0,255,255,0.35), inset 0 0 18px rgba(0,255,255,0.12)',
                    background: 'rgba(0,18,30,0.85)',
                    fontFamily: 'Consolas, monospace',
                    color: '#00ffff'
                  }}>
                    {/* Inner inset frame */}
                    <div style={{
                      position: 'absolute',
                      inset: '6px',
                      border: '1px solid rgba(0,255,255,0.4)',
                      borderRadius: '5px',
                      pointerEvents: 'none'
                    }} />
                    {/* Avatar + Name Row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{ position: 'relative', width: '38px', height: '38px' }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: '50%',
                          border: '2px solid rgba(0,255,255,0.9)',
                          boxShadow: '0 0 8px rgba(0,255,255,0.6), inset 0 0 8px rgba(0,255,255,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00ffff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
                          </svg>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        letterSpacing: '0.5px',
                        textShadow: '0 0 8px rgba(0,255,255,0.6)'
                      }}>ARIA (AI)</div>
                    </div>
                    {/* Message area frame */}
                    <div style={{
                      border: '1px solid rgba(0,255,255,0.35)',
                      borderRadius: '4px',
                      padding: '10px 12px',
                      background: 'rgba(0,25,40,0.5)',
                      boxShadow: 'inset 0 0 10px rgba(0,255,255,0.2)'
                    }}>
                      {evt.conversational.map((line,i)=>(
                        <div key={i} style={{
                          marginBottom: i < evt.conversational.length-1 ? '8px':'0',
                          fontSize: '11px',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          fontStyle: 'italic'
                        }}>"{line.replace(/^>\s*/, '')}"</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {/* EVENT / REPORT BOX */}
              {evt.stream && evt.stream.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'relative',
                    padding: '12px 16px',
                    border: '2px solid rgba(0,255,255,0.6)',
                    borderRadius: '8px',
                    boxShadow: '0 0 10px rgba(0,255,255,0.25), inset 0 0 16px rgba(0,255,255,0.1)',
                    background: 'rgba(0,15,25,0.85)',
                    fontFamily: 'Consolas, monospace',
                    color: '#00ffff'
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: '6px',
                      border: '1px solid rgba(0,255,255,0.35)',
                      borderRadius: '5px',
                      pointerEvents: 'none'
                    }} />
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      marginBottom: '10px',
                      textShadow: '0 0 6px rgba(0,255,255,0.5)'
                    }}>{(evt.meta && evt.meta.title) || evt.type.toUpperCase()}</div>
                    <div style={{
                      border: '1px solid rgba(0,255,255,0.3)',
                      borderRadius: '4px',
                      padding: '8px 10px',
                      background: 'rgba(0,22,34,0.5)',
                      boxShadow: 'inset 0 0 8px rgba(0,255,255,0.15)'
                    }}>
                      {evt.stream.map((line,i)=>(
                        <div key={i} style={{
                          marginBottom: i < evt.stream.length-1 ? '6px':'0',
                          fontSize: '11px',
                          lineHeight: '1.35',
                          opacity: 0.9,
                          whiteSpace: 'pre-wrap'
                        }}>{line}</div>
                      ))}
                    </div>
                    
                    {/* Interactive mining start confirmation */}
                    {evt.meta && evt.meta.pendingMiningStart && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        border: '1px solid rgba(0,255,255,0.4)',
                        borderRadius: '4px',
                        background: 'rgba(0,30,45,0.6)'
                      }}>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#00ffff',
                          marginBottom: '8px',
                          letterSpacing: '0.5px'
                        }}>AUTHORIZATION REQUIRED</div>
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '10px'
                        }}>
                          <button
                            onClick={() => onStartMining && onStartMining(evt.id, evt.meta.poiId)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'rgba(52, 224, 255, 0.15)',
                              border: '1px solid rgba(52, 224, 255, 0.6)',
                              borderRadius: '4px',
                              color: '#34e0ff',
                              fontSize: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                              e.currentTarget.style.boxShadow = '0 0 10px rgba(52, 224, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            START MINING
                          </button>
                          <button
                            onClick={() => onCancelMining && onCancelMining(evt.id)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'rgba(255, 80, 80, 0.1)',
                              border: '1px solid rgba(255, 80, 80, 0.5)',
                              borderRadius: '4px',
                              color: '#ff5050',
                              fontSize: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 80, 80, 0.25)';
                              e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 80, 80, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Interactive transfer buttons for mining loot */}
                    {evt.meta && evt.meta.pendingTransfer && evt.meta.loot && evt.meta.loot.length > 0 && (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        border: '1px solid rgba(0,255,255,0.4)',
                        borderRadius: '4px',
                        background: 'rgba(0,30,45,0.6)'
                      }}>
                        <div style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#00ffff',
                          marginBottom: '8px',
                          letterSpacing: '0.5px'
                        }}>TRANSFER CONFIRMATION</div>
                        {evt.meta.loot.map((item, idx) => (
                          <div key={idx} style={{
                            fontSize: '10px',
                            color: 'rgba(0,255,255,0.8)',
                            marginBottom: '4px',
                            paddingLeft: '8px'
                          }}>
                            • {item.quantity}x {item.item}
                          </div>
                        ))}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          marginTop: '10px'
                        }}>
                          <button
                            onClick={() => onTransferLoot && onTransferLoot(evt.id, evt.meta.loot)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'rgba(52, 224, 255, 0.15)',
                              border: '1px solid rgba(52, 224, 255, 0.6)',
                              borderRadius: '4px',
                              color: '#34e0ff',
                              fontSize: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                              e.currentTarget.style.boxShadow = '0 0 10px rgba(52, 224, 255, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            TRANSFER TO SHIP
                          </button>
                          <button
                            onClick={() => onLeaveLoot && onLeaveLoot(evt.id)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: 'rgba(255, 80, 80, 0.1)',
                              border: '1px solid rgba(255, 80, 80, 0.5)',
                              borderRadius: '4px',
                              color: '#ff5050',
                              fontSize: '10px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              letterSpacing: '0.5px'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 80, 80, 0.25)';
                              e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 80, 80, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            LEAVE
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        }) : tiles.map((tile, tileIdx) => {
          const isAriaTile = tile.some(e => e.type === 'aria');
          const hasSuccess = tile.some(e => e.type === 'success');
          const hasError = tile.some(e => e.type === 'error');
          
          const tileColor = hasError ? 'rgba(255,80,80,0.6)' 
            : hasSuccess ? 'rgba(80,255,160,0.6)' 
            : isAriaTile ? 'rgba(52,224,255,0.8)' 
            : 'rgba(52,224,255,0.5)';

          return (
            <div key={tileIdx} style={{
              background: 'linear-gradient(135deg, rgba(0,30,50,0.7) 0%, rgba(0,20,35,0.8) 100%)',
              border: `2px solid ${tileColor}`,
              borderRadius: '8px',
              padding: '12px',
              boxShadow: `0 0 12px ${tileColor.replace('0.', '0.2').replace('0.8', '0.3')}`,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* ARIA icon for ARIA tiles */}
              {isAriaTile && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34e0ff" strokeWidth="2">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                </div>
              )}
              
              {/* Tile content */}
              <div style={{
                paddingLeft: isAriaTile ? '40px' : '0',
                fontFamily: 'Consolas, Menlo, monospace',
                fontSize: '11px',
                lineHeight: '1.5',
                color: '#34e0ff'
              }}>
                {tile.map((entry, entryIdx) => (
                  <div key={entry.idx} style={{
                    marginBottom: entryIdx < tile.length - 1 ? '6px' : '0',
                    color: entry.type === 'error' ? '#ff5050' 
                      : entry.type === 'success' ? '#50ffa0' 
                      : entry.type === 'warning' ? '#ffb63c'
                      : '#34e0ff',
                    opacity: entry.type === 'normal' ? 0.85 : 1
                  }}>
                    {entry.text}
                  </div>
                ))}
              </div>

              {/* Corner decorations */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '24px',
                height: '24px',
                borderTop: `1px solid ${tileColor}`,
                borderRight: `1px solid ${tileColor}`,
                opacity: 0.5
              }} />
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '24px',
                height: '24px',
                borderBottom: `1px solid ${tileColor}`,
                borderLeft: `1px solid ${tileColor}`,
                opacity: 0.5
              }} />
            </div>
          );
        })}
      </div>

      {/* Scrollbar styling */}
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(0, 20, 35, 0.6);
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(52, 224, 255, 0.4);
          border-radius: 3px;
          box-shadow: 0 0 6px rgba(52, 224, 255, 0.5);
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(52, 224, 255, 0.6);
        }
      `}</style>
    </SquareBox>
  );
};

export default TerminalFeed;
