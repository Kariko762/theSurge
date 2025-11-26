import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api/client';
import { PlayIcon, RefreshIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function LootSimulator() {
  const [lootPools, setLootPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState('');
  const [lootResult, setLootResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Reveal animation states
  const [revealStage, setRevealStage] = useState('idle'); // idle, identifying, identified, revealing, complete
  const [revealedItems, setRevealedItems] = useState([]);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [animatingIndex, setAnimatingIndex] = useState(-1); // Which item is currently animating
  const [stepMode, setStepMode] = useState(false); // Default to auto mode
  const [isRunning, setIsRunning] = useState(false);
  const autoRevealTimerRef = useRef(null);
  const lootResultRef = useRef(null); // Ref to access latest loot result in callbacks
  const currentRevealIndexRef = useRef(0); // Ref to track current index in callbacks
  
  // Panel logs
  const [terminalLog, setTerminalLog] = useState([]);
  const [dreLog, setDreLog] = useState([]);
  const [backendLog, setBackendLog] = useState([]);
  
  // Auto-scroll refs
  const terminalRef = useRef(null);
  const dreRef = useRef(null);
  const backendRef = useRef(null);

  useEffect(() => {
    loadLootPools();
  }, []);

  // Auto-scroll panels
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLog]);

  useEffect(() => {
    if (dreRef.current) dreRef.current.scrollTop = dreRef.current.scrollHeight;
  }, [dreLog]);

  useEffect(() => {
    if (backendRef.current) backendRef.current.scrollTop = backendRef.current.scrollHeight;
  }, [backendLog]);

  const loadLootPools = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const config = data.config || data;
      const pools = config.lootTables?.pools || [];
      
      setLootPools(pools);
      if (pools.length > 0 && !selectedPool) {
        setSelectedPool(pools[0].id);
      }
    } catch (error) {
      console.error('Failed to load loot pools:', error);
      setError(`Failed to load loot pools: ${error.message}`);
    }
  };

  const addLog = (panel, message, type = 'info') => {
    const entry = {
      time: new Date().toLocaleTimeString(),
      message,
      type
    };

    switch (panel) {
      case 'terminal':
        setTerminalLog(prev => [...prev, entry]);
        break;
      case 'dre':
        setDreLog(prev => [...prev, entry]);
        break;
      case 'backend':
        setBackendLog(prev => [...prev, entry]);
        break;
    }
  };

  const reset = () => {
    if (autoRevealTimerRef.current) {
      clearTimeout(autoRevealTimerRef.current);
      autoRevealTimerRef.current = null;
    }
    setRevealStage('idle');
    setLootResult(null);
    lootResultRef.current = null; // Clear ref
    setRevealedItems([]);
    setCurrentRevealIndex(0);
    currentRevealIndexRef.current = 0; // Clear index ref
    setIsRunning(false);
    setTerminalLog([]);
    setDreLog([]);
    setBackendLog([]);
  };

  const rollLoot = async () => {
    if (!selectedPool) return;

    reset();
    setIsRunning(true);
    setRevealStage('identifying');

    addLog('backend', `Received loot roll request for pool: ${selectedPool}`, 'info');
    addLog('dre', 'Processing loot pool resolution request', 'info');
    addLog('terminal', 'IDENTIFYING CONTAINER...', 'system');

    try {
      addLog('backend', 'Loading pool configuration', 'info');
      addLog('backend', `Finding pool with ID: ${selectedPool}`, 'info');
      
      const response = await fetch('http://localhost:3002/api/events/resolve-loot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ poolId: selectedPool })
      });

      const data = await response.json();

      if (data.success && data.loot) {
        const { items, containerData } = data.loot;
        
        addLog('backend', `Grade selected: ${containerData.gradeId}`, 'success');
        addLog('backend', `Rolling ${items.length} items`, 'info');
        addLog('dre', `Container identified: ${containerData.displayName}`, 'success');
        addLog('dre', `Grade: ${containerData.gradeId} | Items: ${items.length}`, 'info');
        
        setLootResult(data.loot);
        lootResultRef.current = data.loot; // Store in ref for callbacks
        setRevealStage('identified');
        
        addLog('terminal', `IDENTIFIED: ${containerData.displayName}`, 'success');
        addLog('terminal', `GRADE: ${containerData.gradeId.toUpperCase()}`, 'info');
        
        // If auto mode (step mode off), automatically start revealing after a short delay
        if (!stepMode) {
          setTimeout(() => {
            setRevealStage('revealing');
            addLog('terminal', 'INITIATING SCAN SEQUENCE...', 'system');
            addLog('dre', 'Starting item reveal sequence', 'info');
            addLog('backend', 'Beginning sequential item reveal', 'info');
            
            // Start first item with PAUSE → ANIMATION → REVEAL pattern
            scheduleNextReveal();
          }, 1000); // 1 second delay before auto-starting scan
        }
      } else {
        addLog('backend', `Error: ${data.error}`, 'error');
        addLog('terminal', 'ERROR: Container identification failed', 'error');
        setError(data.error || 'No loot returned from resolution');
        setIsRunning(false);
      }
    } catch (error) {
      addLog('backend', `Exception: ${error.message}`, 'error');
      addLog('terminal', 'SYSTEM ERROR', 'error');
      setError(error.message || 'Failed to roll loot');
      setIsRunning(false);
    }
  };

  const nextStep = () => {
    if (revealStage === 'identified') {
      // Start revealing
      setRevealStage('revealing');
      addLog('terminal', 'INITIATING SCAN SEQUENCE...', 'system');
      addLog('dre', 'Starting item reveal sequence', 'info');
      addLog('backend', 'Beginning sequential item reveal', 'info');
      
      // Auto-reveal first item if not in step mode
      if (!stepMode) {
        scheduleNextReveal();
      }
    } else if (revealStage === 'revealing' && currentRevealIndex < lootResult.items.length) {
      startItemAnimation();
    }
  };

  const scheduleNextReveal = () => {
    // PAUSE: Random delay between 1000ms - 2000ms for suspense
    const pauseDelay = 1000 + Math.random() * 1000;
    autoRevealTimerRef.current = setTimeout(() => {
      // ANIMATION: Trigger the scanning animation on current index
      // Animation will run, then reveal text appears
      startItemAnimation();
    }, pauseDelay);
  };

  const startItemAnimation = () => {
    const currentIndex = currentRevealIndexRef.current;
    const currentLoot = lootResultRef.current || lootResult;
    
    if (!currentLoot || currentIndex >= currentLoot.items.length) return;
    
    // ANIMATION: Set which item is animating (triggers crackle effect)
    const item = currentLoot.items[currentIndex];
    setAnimatingIndex(currentIndex);
    
    const lightning = getLightningIntensity(item.tier);
    const animationDuration = parseFloat(lightning.duration) * 1000; // Convert to ms
    
    // Wait for animation to complete, then reveal text
    setTimeout(() => {
      revealItemText();
    }, animationDuration);
  };

  const revealItemText = () => {
    const currentLoot = lootResultRef.current || lootResult;
    const currentIndex = currentRevealIndexRef.current;
    
    if (!currentLoot || currentIndex >= currentLoot.items.length) return;
    
    const item = currentLoot.items[currentIndex];
    
    // REVEAL: Show the item text in logs and mark as revealed
    setRevealedItems(prev => [...prev, item]);
    setAnimatingIndex(-1); // Clear animation state
    
    addLog('backend', `Revealed: ${item.itemId} x${item.quantity}${item.guaranteed ? ' [GUARANTEED]' : ''}`, 'success');
    addLog('dre', `Item ${currentIndex + 1}/${currentLoot.items.length}: ${item.name || item.itemId}`, 'info');
    addLog('terminal', `> ${item.name || item.itemId} x${item.quantity}${item.guaranteed ? ' ★' : ''}`, 'loot');
    
    const newIndex = currentIndex + 1;
    setCurrentRevealIndex(newIndex);
    currentRevealIndexRef.current = newIndex;
    
    if (newIndex >= currentLoot.items.length) {
      // All items revealed - PAUSE before SCAN COMPLETE
      const finalDelay = 1000 + Math.random() * 1000;
      setTimeout(() => {
        setRevealStage('complete');
        addLog('terminal', 'SCAN COMPLETE', 'success');
        addLog('dre', 'All items revealed', 'success');
        addLog('backend', 'Loot resolution completed successfully', 'success');
      }, finalDelay);
    } else if (!stepMode) {
      // Next item: PAUSE → ANIMATION → REVEAL
      scheduleNextReveal();
    }
  };

  const skip = () => {
    if (!lootResult) return;
    
    const remainingItems = lootResult.items.slice(currentRevealIndex);
    setRevealedItems(lootResult.items);
    setCurrentRevealIndex(lootResult.items.length);
    setRevealStage('complete');
    
    remainingItems.forEach(item => {
      addLog('terminal', `> ${item.name || item.itemId} x${item.quantity}${item.guaranteed ? ' ★' : ''}`, 'loot');
    });
    
    addLog('terminal', 'SCAN COMPLETE', 'success');
    addLog('dre', 'All items revealed (skipped)', 'success');
    addLog('backend', 'Loot resolution completed (skipped)', 'success');
  };

  const getTierColor = (tier) => {
    const colors = {
      common: '#9CA3AF',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#A855F7',
      legendary: '#F59E0B'
    };
    return colors[tier] || colors.common;
  };

  const getLightningIntensity = (tier) => {
    // Returns animation config based on tier - from subtle crackle to MASSIVE ZZAP
    const configs = {
      common: {
        borderSize: '1px',
        glowSize: '6px',
        pulseScale: 1.01,
        duration: '0.5s',
        name: 'electricCrackleWeak'
      },
      uncommon: {
        borderSize: '2px',
        glowSize: '10px',
        pulseScale: 1.02,
        duration: '0.6s',
        name: 'electricCrackleModerate'
      },
      rare: {
        borderSize: '2px',
        glowSize: '15px',
        pulseScale: 1.03,
        duration: '0.7s',
        name: 'electricCrackleStrong'
      },
      epic: {
        borderSize: '3px',
        glowSize: '20px',
        pulseScale: 1.04,
        duration: '0.8s',
        name: 'electricCrackleIntense'
      },
      legendary: {
        borderSize: '4px',
        glowSize: '30px',
        pulseScale: 1.06,
        duration: '1s',
        name: 'electricCrackleMassive'
      }
    };
    return configs[tier] || configs.common;
  };

  const renderLogEntry = (entry, idx) => {
    let color = '#aaa';
    if (entry.type === 'error') color = '#f66';
    if (entry.type === 'success') color = '#0f8';
    if (entry.type === 'system') color = '#0ff';
    if (entry.type === 'loot') color = '#fa0';
    
    return (
      <div key={idx} style={{ marginBottom: '0.3rem', color, fontSize: '0.7rem' }}>
        <span style={{ color: '#666', marginRight: '0.5rem' }}>[{entry.time}]</span>
        {entry.message}
      </div>
    );
  };

  const selectedPoolData = lootPools.find(p => p.id === selectedPool);
  const containerData = lootResult?.containerData || {};

  return (
    <div>
      {/* Controls */}
      <div className="glass-card" style={{ padding: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Pool Selector */}
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem' }}>
              Loot Pool
            </label>
            <select
              value={selectedPool}
              onChange={(e) => {
                setSelectedPool(e.target.value);
                reset();
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.75rem'
              }}
            >
              <option value="">-- Select Pool --</option>
              {lootPools.map(pool => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} ({pool.grades?.length || 0} grades)
                </option>
              ))}
            </select>
          </div>

          {/* Step Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <input
              type="checkbox"
              id="stepMode"
              checked={stepMode}
              onChange={(e) => setStepMode(e.target.checked)}
              style={{ width: '14px', height: '14px' }}
            />
            <label htmlFor="stepMode" style={{ color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>
              Step Mode
            </label>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={rollLoot}
              disabled={!selectedPool || isRunning}
              className="glass-button"
              style={{
                padding: '0.5rem 1rem',
                background: selectedPool && !isRunning ? 'rgba(0, 255, 255, 0.1)' : 'rgba(100, 100, 100, 0.1)',
                border: `2px solid ${selectedPool && !isRunning ? 'var(--neon-cyan)' : '#666'}`,
                borderRadius: '4px',
                color: selectedPool && !isRunning ? 'var(--neon-cyan)' : '#666',
                cursor: selectedPool && !isRunning ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem'
              }}
            >
              <PlayIcon size={14} />
              Roll
            </button>

            {stepMode && isRunning && revealStage !== 'idle' && revealStage !== 'identifying' && (
              <>
                {revealStage !== 'complete' && (
                  <button
                    onClick={nextStep}
                    className="glass-button"
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(0, 255, 136, 0.1)',
                      border: '2px solid #0f8',
                      borderRadius: '4px',
                      color: '#0f8',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    {revealStage === 'identified' ? 'Continue' : `Next [${currentRevealIndex + 1}/${lootResult?.items.length}]`}
                  </button>
                )}
                
                {revealStage === 'revealing' && currentRevealIndex < lootResult?.items.length && (
                  <button
                    onClick={skip}
                    className="glass-button"
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(255, 100, 100, 0.1)',
                      border: '2px solid #f66',
                      borderRadius: '4px',
                      color: '#f66',
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Skip
                  </button>
                )}
              </>
            )}

            <button
              onClick={reset}
              disabled={!isRunning && revealStage === 'idle'}
              className="glass-button"
              style={{
                padding: '0.5rem 1rem',
                background: (isRunning || revealStage !== 'idle') ? 'rgba(255, 100, 100, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${(isRunning || revealStage !== 'idle') ? '#f66' : '#444'}`,
                borderRadius: '4px',
                color: (isRunning || revealStage !== 'idle') ? '#f66' : '#444',
                cursor: isRunning || revealStage !== 'idle' ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem'
              }}
            >
              <RefreshIcon size={14} />
              Reset
            </button>
          </div>
        </div>

        {/* Pool Info */}
        {selectedPoolData && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem',
            background: 'rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: '4px',
            fontSize: '0.7rem',
            color: '#aaa'
          }}>
            <strong style={{ color: '#0ff' }}>{selectedPoolData.description || 'No description'}</strong>
            <div style={{ marginTop: '0.25rem' }}>
              Grades: {selectedPoolData.grades?.length || 0} | Entries: {selectedPoolData.entries?.length || 0}
            </div>
          </div>
        )}
      </div>

      {/* Three-Panel View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
        {/* Terminal Panel - Shows the reveal grid */}
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🖥️</span> TERMINAL
          </h3>
          <div 
            ref={terminalRef}
            style={{
              height: '350px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 255, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            {/* Log section */}
            <div style={{ marginBottom: '1rem' }}>
              {terminalLog.map(renderLogEntry)}
            </div>

            {/* Holographic Grid - Only show when revealing or complete */}
            {(revealStage === 'revealing' || revealStage === 'complete') && lootResult && (
              <div style={{
                borderTop: '1px solid rgba(0, 255, 255, 0.2)',
                paddingTop: '0.75rem',
                marginTop: '0.75rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gridTemplateRows: 'repeat(2, 1fr)',
                  gap: '0.4rem'
                }}>
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const item = lootResult.items[idx];
                    const isRevealed = revealedItems.includes(item);
                    const isEmpty = !item;
                    const isAnimating = idx === animatingIndex && item; // Animation happens when animatingIndex matches
                    const hasBeenProcessed = idx < currentRevealIndex;

                    return (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1',
                          background: isEmpty ? 'rgba(0, 40, 60, 0.1)' : 
                                     (isRevealed || isAnimating || hasBeenProcessed) ? 'rgba(0, 40, 60, 0.3)' : 
                                     'rgba(0, 40, 60, 0.1)',
                          border: isEmpty ? '1px dashed rgba(0, 255, 255, 0.1)' : 
                                  isRevealed ? `1px solid ${getTierColor(item.tier)}` :
                                  (isAnimating || hasBeenProcessed) ? '1px solid rgba(0, 255, 255, 0.2)' :
                                  '1px dashed rgba(0, 255, 255, 0.1)',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: isRevealed ? `0 0 8px ${getTierColor(item.tier)}40` : 'none'
                        }}
                      >
                        {/* Empty slot */}
                        {isEmpty && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(0, 255, 255, 0.05)',
                            fontSize: '1rem'
                          }}>
                            ◇
                          </div>
                        )}

                        {/* Static overlay for unrevealed items - only show if in revealing stage and not yet processed */}
                        {item && !isRevealed && !isAnimating && hasBeenProcessed && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: `repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.02) 0px, transparent 1px, transparent 2px, rgba(0, 255, 255, 0.02) 3px)`,
                            animation: 'staticNoise 0.1s infinite'
                          }} />
                        )}

                        {/* Scan animation */}
                        {isAnimating && item && (() => {
                          const lightning = getLightningIntensity(item.tier);
                          return (
                            <div style={{
                              position: 'absolute',
                              inset: 0
                            }}>
                              {/* Electric border crackle - intensity based on tier */}
                              <div style={{
                                position: 'absolute',
                                inset: `-${lightning.borderSize}`,
                                border: `${lightning.borderSize} solid #0ff`,
                                boxShadow: `0 0 ${lightning.glowSize} #0ff, inset 0 0 ${lightning.glowSize} #0ff`,
                                animation: `${lightning.name} ${lightning.duration} ease-out`,
                                pointerEvents: 'none'
                              }} />
                              
                              {/* Scan line */}
                              <div style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                height: '3px',
                                background: 'linear-gradient(90deg, transparent, #0ff, transparent)',
                                boxShadow: `0 0 ${lightning.glowSize} #0ff, 0 0 ${parseInt(lightning.glowSize) * 2}px #0ff`,
                                animation: 'scanUp 0.5s ease-out'
                              }} />
                              
                              {/* Static clear effect */}
                              <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: `repeating-linear-gradient(0deg, rgba(0, 255, 255, 0.08) 0px, transparent 1px)`,
                                animation: `staticClear ${lightning.duration} ease-out forwards`
                              }} />
                            </div>
                          );
                        })()}

                        {/* Revealed item */}
                        {isRevealed && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.25rem'
                          }}>
                            {item.guaranteed && (
                              <div style={{
                                position: 'absolute',
                                top: '0.15rem',
                                right: '0.15rem',
                                fontSize: '0.5rem',
                                color: '#fa0',
                                textShadow: '0 0 3px #fa0'
                              }}>
                                ★
                              </div>
                            )}
                            
                            <div style={{
                              fontSize: '0.5rem',
                              color: getTierColor(item.tier),
                              letterSpacing: '0.05em',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              lineHeight: 1.1,
                              textTransform: 'uppercase',
                              marginBottom: '0.1rem'
                            }}>
                              {(item.name || item.itemId).substring(0, 8)}
                            </div>
                            
                            <div style={{
                              fontSize: '0.45rem',
                              color: '#666'
                            }}>
                              x{item.quantity}
                            </div>
                          </div>
                        )}

                        {/* Scanlines overlay */}
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: `repeating-linear-gradient(0deg, transparent 0px, rgba(0, 255, 255, 0.015) 1px, transparent 2px)`,
                          pointerEvents: 'none'
                        }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* DRE Panel */}
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <h3 style={{ color: '#f0f', marginBottom: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🎲</span> DRE
          </h3>
          <div 
            ref={dreRef}
            style={{
              height: '350px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 0, 255, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            {dreLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem', fontSize: '0.7rem' }}>
                DRE idle...
              </div>
            )}
            {dreLog.map(renderLogEntry)}
          </div>
        </div>

        {/* Backend Panel */}
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          <h3 style={{ color: '#0f8', marginBottom: '0.4rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⚙️</span> BACKEND
          </h3>
          <div 
            ref={backendRef}
            style={{
              height: '350px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.7)',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              fontFamily: 'monospace',
              fontSize: '0.7rem'
            }}
          >
            {backendLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem', fontSize: '0.7rem' }}>
                Backend ready...
              </div>
            )}
            {backendLog.map(renderLogEntry)}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes staticNoise {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        
        @keyframes scanUp {
          0% { bottom: 0; }
          100% { bottom: 100%; }
        }
        
        @keyframes staticClear {
          0% { opacity: 1; }
          70% { opacity: 0.6; }
          100% { opacity: 0; }
        }
        
        /* Weak crackle - Common items */
        @keyframes electricCrackleWeak {
          0% { opacity: 1; filter: brightness(1.2) drop-shadow(0 0 4px #0ff); }
          30% { opacity: 0.8; filter: brightness(1.5) drop-shadow(0 0 6px #0ff); }
          60% { opacity: 0.5; filter: brightness(1) drop-shadow(0 0 3px #0ff); }
          100% { opacity: 0; filter: brightness(0.5) drop-shadow(0 0 1px #0ff); }
        }
        
        /* Moderate crackle - Uncommon items */
        @keyframes electricCrackleModerate {
          0% { opacity: 1; transform: scale(1); filter: brightness(1.3) drop-shadow(0 0 6px #0ff); }
          20% { opacity: 0.9; transform: scale(1.01); filter: brightness(1.8) drop-shadow(0 0 10px #0ff); }
          45% { opacity: 0.7; transform: scale(0.99); filter: brightness(1.4) drop-shadow(0 0 7px #0ff); }
          70% { opacity: 0.4; filter: brightness(1) drop-shadow(0 0 4px #0ff); }
          100% { opacity: 0; filter: brightness(0.5) drop-shadow(0 0 2px #0ff); }
        }
        
        /* Strong crackle - Rare items */
        @keyframes electricCrackleStrong {
          0% { opacity: 1; transform: scale(1); filter: brightness(1.5) drop-shadow(0 0 10px #0ff); }
          15% { opacity: 0.9; transform: scale(1.02); filter: brightness(2) drop-shadow(0 0 15px #0ff); }
          30% { opacity: 1; transform: scale(0.98); filter: brightness(1.7) drop-shadow(0 0 12px #0ff); }
          50% { opacity: 0.8; transform: scale(1.01); filter: brightness(2.2) drop-shadow(0 0 18px #0ff); }
          70% { opacity: 0.5; filter: brightness(1.2) drop-shadow(0 0 8px #0ff); }
          100% { opacity: 0; filter: brightness(0.5) drop-shadow(0 0 2px #0ff); }
        }
        
        /* Intense crackle - Epic items */
        @keyframes electricCrackleIntense {
          0% { opacity: 1; transform: scale(1); filter: brightness(1.8) drop-shadow(0 0 15px #0ff); }
          10% { opacity: 1; transform: scale(1.03); filter: brightness(2.5) drop-shadow(0 0 22px #0ff); }
          25% { opacity: 0.95; transform: scale(0.97); filter: brightness(2) drop-shadow(0 0 18px #0ff); }
          40% { opacity: 1; transform: scale(1.02); filter: brightness(2.8) drop-shadow(0 0 25px #0ff); }
          55% { opacity: 0.9; transform: scale(0.99); filter: brightness(2.2) drop-shadow(0 0 20px #0ff); }
          75% { opacity: 0.6; filter: brightness(1.5) drop-shadow(0 0 12px #0ff); }
          100% { opacity: 0; filter: brightness(0.5) drop-shadow(0 0 3px #0ff); }
        }
        
        /* MASSIVE ZZAP - Legendary items */
        @keyframes electricCrackleMassive {
          0% { opacity: 1; transform: scale(1); filter: brightness(2) drop-shadow(0 0 20px #0ff); }
          8% { opacity: 1; transform: scale(1.05); filter: brightness(3.5) drop-shadow(0 0 35px #0ff); }
          16% { opacity: 0.9; transform: scale(0.96); filter: brightness(2.5) drop-shadow(0 0 25px #0ff); }
          24% { opacity: 1; transform: scale(1.04); filter: brightness(3.8) drop-shadow(0 0 40px #0ff); }
          32% { opacity: 0.95; transform: scale(0.98); filter: brightness(3) drop-shadow(0 0 30px #0ff); }
          42% { opacity: 1; transform: scale(1.03); filter: brightness(4) drop-shadow(0 0 45px #0ff); }
          54% { opacity: 0.85; transform: scale(1.01); filter: brightness(3.2) drop-shadow(0 0 35px #0ff); }
          68% { opacity: 0.7; transform: scale(0.99); filter: brightness(2.5) drop-shadow(0 0 25px #0ff); }
          82% { opacity: 0.4; filter: brightness(1.5) drop-shadow(0 0 15px #0ff); }
          100% { opacity: 0; filter: brightness(0.5) drop-shadow(0 0 5px #0ff); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
