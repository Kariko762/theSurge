import { useMemo, useState, useEffect, useRef } from 'react'
import { generateSystem, exampleSeeds } from '../lib/systemGenerator.js'
import { calculateShipAttributes, DEFAULT_SHIP_LOADOUT, DEFAULT_POWER_ALLOCATION, COMPONENTS } from '../lib/shipComponents.js'
import { getShipState } from '../lib/shipState.js'

/**
 * FRAME 3: Ship Command Console - Ship Run View
 * Simplified terminal output with power management and system controls
 */

const ShipCommandConsole = ({ onNavigate, initialSeed }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [lockedSelection, setLockedSelection] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ power: true, ship: false });
  const [fullscreen, setFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [gamePhase, setGamePhase] = useState('jumped'); // jumped | dialogue | scanning
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const [showScanPrompt, setShowScanPrompt] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanProgress, setScanProgress] = useState([]);
  const [scanningActive, setScanningActive] = useState(false);
  const [terminalLog, setTerminalLog] = useState([]);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const terminalRef = useRef(null);
  
  // Ship state manager (singleton)
  const shipState = getShipState();
  const [shipStateVersion, setShipStateVersion] = useState(0); // Force re-render on state changes
  
  // Get current ship state
  const currentShipState = shipState.getState();
  const installedComponents = currentShipState.installedComponents;
  const powerAllocation = currentShipState.powerAllocation;
  
  // Calculate ship attributes from components
  const shipAttributes = useMemo(() => {
    return calculateShipAttributes(installedComponents, powerAllocation);
  }, [installedComponents, powerAllocation]);

  const leftTabs = ['SETTINGS', 'ACTIONS', 'SYSTEMS', 'INVENTORY', 'ATTRIBUTES'];

  // Seed + generated system
  const [seedInput, setSeedInput] = useState(initialSeed || exampleSeeds()[0]);
  const system = useMemo(() => {
    return generateSystem(seedInput, { 
      sensorsPower: shipAttributes.sensorRange, 
      wake: shipAttributes.staticSignature 
    });
  }, [seedInput, shipAttributes.sensorRange, shipAttributes.staticSignature]);
  
  // Sync ship position on mount
  useEffect(() => {
    if (system) {
      const edgeAU = system.heliosphere.radiusAU * 0.95;
      const angleRad = Math.PI * 0.25;
      shipState.setPosition(edgeAU, angleRad);
      shipState.visitSystem(seedInput);
      setShipStateVersion(v => v + 1);
    }
  }, [system, seedInput]);
  
  // Auto-scroll terminal to bottom when new messages arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLog]);

  // Ship position from ship state
  const shipPosition = useMemo(() => {
    if (!system) return { distanceAU: 0, angleRad: 0, x: 0, y: 0 };
    return currentShipState.position;
  }, [system, currentShipState.position]);

  const startSystemScan = () => {
    if (scanningActive) return;
    setScanningActive(true);
    setTerminalLog(prev => [...prev, '> ARIA: Initiating full system scan...']);
    
    // Sort POIs by distance from ship
    const sorted = [...pois.filter(p => p.id !== 'SUN')].sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.distanceAU * Math.cos(a.angleRad) - shipPosition.x, 2) + Math.pow(a.distanceAU * Math.sin(a.angleRad) - shipPosition.y, 2));
      const distB = Math.sqrt(Math.pow(b.distanceAU * Math.cos(b.angleRad) - shipPosition.x, 2) + Math.pow(b.distanceAU * Math.sin(b.angleRad) - shipPosition.y, 2));
      return distA - distB;
    });

    // Progressive reveal
    sorted.forEach((poi, idx) => {
      setTimeout(() => {
        const distFromShip = Math.sqrt(
          Math.pow(poi.distanceAU * Math.cos(poi.angleRad) - shipPosition.x, 2) +
          Math.pow(poi.distanceAU * Math.sin(poi.angleRad) - shipPosition.y, 2)
        );
        setScanProgress(prev => [...prev, poi.id]);
        shipState.scanPOI(poi.id);
        const x = (poi.distanceAU * Math.cos(poi.angleRad)).toFixed(2);
        const y = (poi.distanceAU * Math.sin(poi.angleRad)).toFixed(2);
        setTerminalLog(prev => [
          ...prev,
          `> ARIA: Detected ${poi.type} at (${x}, ${y}), distance ${distFromShip.toFixed(2)} AU from ship.`
        ]);
      }, idx * 1500);
    });

    setTimeout(() => {
      setTerminalLog(prev => [...prev, '> ARIA: System scan complete. All contacts catalogued.']);
      setScanningActive(false);
    }, sorted.length * 1500 + 500);
  };

  const shipVitals = {
    shields: currentShipState.currentShields,
    hull: currentShipState.currentHull,
    power: Math.round((shipAttributes.totalPowerReq / shipAttributes.maxPower) * 100),
    static: shipAttributes.staticSignature,
    radiation: 28
  };

  const shapeForType = (t) => {
    switch (t) {
      case 'belt': return 'ring';
      case 'orbital': return 'shape-diamond';
      case 'habitat': return 'shape-square';
      case 'anomaly': return 'shape-triangle';
      case 'facility': return 'shape-hex';
      default: return '';
    }
  };

  // POIs derived from system (parents + extras) + SUN
  const pois = useMemo(() => {
    if (!system) return [];
    const list = [];
    list.push({ id: 'SUN', name: 'SUN', type: 'STAR', distanceAU: 0, angleRad: 0 });
    system.orbits.forEach((o) => {
      const p = o.parent;
      list.push({ id: p.id, name: p.name, type: p.type.toUpperCase(), distanceAU: o.distanceAU, angleRad: o.angleRad });
    });
    (system.extras || []).forEach((e) => {
      const p = e.parent;
      list.push({ id: p.id, name: p.name, type: p.type.toUpperCase(), distanceAU: e.distanceAU, angleRad: e.angleRad });
    });
    return list;
  }, [system]);

  const toggleTab = (tab) => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  const clearSelection = () => {
    setLockedSelection(false);
    setSelectedPOI(null);
  };

  const startDialogue = () => {
    setGamePhase('dialogue');
    // Trigger typewriter effect
    setTimeout(() => {
      setDialogueComplete(true);
      setShowScanPrompt(true);
    }, 3000); // 3s typewriter duration
  };

  const handleScanResponse = (accepted) => {
    setShowScanPrompt(false);
    if (accepted) {
      setGamePhase('scanning');
      setScanned(true);
      setFullscreen(true);
    } else {
      setGamePhase('jumped'); // remain in terminal
    }
  };

  const toggleSection = (key) => {
    setSectionsOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getPoiName = () => {
    const poi = pois.find(p => p.id === selectedPOI);
    return poi ? poi.name : 'TARGET';
  };

  const adjustPower = (system, delta) => {
    setPowerAllocation(prev => {
      const newValue = Math.max(0, Math.min(100, prev[system] + delta));
      return { ...prev, [system]: newValue };
    });
  };

  const renderLeftPanelContent = () => {
    if (activeTab === 'SYSTEMS') {
      return (
        <div>
          <div className="tab-panel-header holo-text">SYSTEMS</div>
          {/* Power Management (Collapsible) */}
          <div className="collapsible">
            <button className="collapsible-header" onClick={() => toggleSection('power')}>
              <span>Power Management</span>
              <span className={`collapsible-toggle ${sectionsOpen.power ? 'open' : ''}`}>▾</span>
            </button>
            {sectionsOpen.power && (
              <div className="collapsible-content">
                <div className="power-summary">
                  <div className="power-summary-row">
                    <span className="power-summary-label">Max Power Output</span>
                    <span className="power-summary-value">{shipAttributes.maxPower}W</span>
                  </div>
                  <div className="power-summary-row">
                    <span className="power-summary-label">Current Draw</span>
                    <span className="power-summary-value">{shipAttributes.totalPowerReq}W</span>
                  </div>
                  <div className="power-summary-row">
                    <span className="power-summary-label">Remaining</span>
                    <span className="power-summary-value">{shipAttributes.maxPower - shipAttributes.totalPowerReq}W</span>
                  </div>
                  <div className="progress-bar" style={{ marginTop: '10px' }}>
                    <div className="progress-bar-fill" style={{ width: `${shipVitals.power}%` }}></div>
                  </div>
                  {shipAttributes.totalPowerReq > shipAttributes.maxPower && (
                    <div className="power-warning">⚠ WARNING: POWER OVERLOAD</div>
                  )}
                  <div className="text-muted" style={{ fontSize: '8px', marginTop: '10px', lineHeight: '1.4' }}>
                    Note: Higher power usage increases Static signature (detection risk)
                  </div>
                </div>

                {installedComponents.map(compId => {
                  const comp = COMPONENTS[compId];
                  if (!comp || comp.type === 'power') return null;
                  const currentAlloc = powerAllocation[compId] || 100;
                  const adjustPower = (delta) => {
                    shipState.setPowerAllocation(compId, currentAlloc + delta);
                    setShipStateVersion(v => v + 1);
                  };
                  return (
                    <div key={compId} className="power-control-row">
                      <span className="power-control-label">{comp.name}</span>
                      <div className="power-control-buttons">
                        <button className="power-btn" onClick={() => adjustPower(-20)}>−</button>
                        <span className="power-value">{currentAlloc}%</span>
                        <button className="power-btn" onClick={() => adjustPower(20)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ship Management (Collapsible) */}
          <div className="collapsible mt-2">
            <button className="collapsible-header" onClick={() => toggleSection('ship')}>
              <span>Ship Management</span>
              <span className={`collapsible-toggle ${sectionsOpen.ship ? 'open' : ''}`}>▾</span>
            </button>
            {sectionsOpen.ship && (
              <div className="collapsible-content">
                <div className="data-grid">
                  {installedComponents.map(compId => {
                    const comp = COMPONENTS[compId];
                    if (!comp) return null;
                    const isActive = powerAllocation[compId] > 0;
                    return (
                      <div key={compId} className="data-cell">
                        <div className="data-cell-label">{comp.name}</div>
                        <div className="ui-small">Status: {isActive ? 'ENABLED' : 'DISABLED'}</div>
                        <div className="ui-small">Power: {comp.powerReq}W @ {powerAllocation[compId] || 100}%</div>
                        <div className="mt-1">
                          <button className="small-btn" onClick={() => {
                            shipState.setPowerAllocation(compId, isActive ? 0 : 100);
                            setShipStateVersion(v => v + 1);
                          }}>
                            {isActive ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'ACTIONS') {
      const poiName = getPoiName();
      return (
        <div>
          <div className="tab-panel-header holo-text">ACTIONS</div>
          <div className="action-list">
            <button className="action-btn" disabled={!selectedPOI}>Scan {`{${poiName}}`}</button>
            <button className="action-btn" disabled={!selectedPOI}>Scavenge {`{${poiName}}`}</button>
            <button className="action-btn" disabled={!selectedPOI}>Investigate {`{${poiName}}`}</button>
            <div className="action-sep"></div>
            <button className="action-btn">Mine Asteroids</button>
            <button className="action-btn">Launch Away Mission</button>
          </div>
          <div className="ui-small mt-2 text-muted">Hover a POI in the map/table to set target.</div>
        </div>
      );
    }

    if (activeTab === 'INVENTORY') {
      const inventory = currentShipState.inventory;
      return (
        <div>
          <div className="tab-panel-header holo-text">INVENTORY</div>
          <div className="ui-small text-muted" style={{ marginBottom: '8px' }}>
            Cargo: {currentShipState.cargoMass.toFixed(1)}t / {currentShipState.cargoCapacity} slots
          </div>
          <div className="inventory-grid">
            {inventory.map(item => (
              <div key={item.id} className="inventory-item">
                <div className="inventory-thumb"></div>
                <div className="inventory-name ui-small">{item.name}</div>
                {item.stackable && <div className="inventory-qty">{item.quantity}</div>}
                <div className="inventory-actions">
                  <button className="small-btn" onClick={() => {
                    shipState.removeInventoryItem(item.id, 1);
                    setShipStateVersion(v => v + 1);
                  }}>Jettison</button>
                  <button className="small-btn">Scrap</button>
                  <button className="small-btn">Refine</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'ATTRIBUTES') {
      return (
        <div>
          <div className="tab-panel-header holo-text">SHIP ATTRIBUTES</div>
          <div className="data-grid">
            <div className="data-cell">
              <div className="data-cell-label">Max Shields</div>
              <div className="data-cell-value">{shipAttributes.maxShields}</div>
              <div className="ui-small">From installed shield generator</div>
            </div>
            <div className="data-cell">
              <div className="data-cell-label">Max Hull</div>
              <div className="data-cell-value">{shipAttributes.maxHull}</div>
              <div className="ui-small">Base structural integrity</div>
            </div>
            <div className="data-cell">
              <div className="data-cell-label">Power Output</div>
              <div className="data-cell-value">{shipAttributes.maxPower}W</div>
              <div className="ui-small">Maximum available power</div>
            </div>
            <div className="data-cell">
              <div className="data-cell-label">Sensor Range</div>
              <div className="data-cell-value">{shipAttributes.sensorRange} AU</div>
              <div className="ui-small">Scan detection range</div>
            </div>
            <div className="data-cell">
              <div className="data-cell-label">Static Signature</div>
              <div className="data-cell-value">{shipAttributes.staticSignature}%</div>
              <div className="ui-small">Detection risk (power usage)</div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'SETTINGS') {
      return (
        <div>
          <div className="tab-panel-header holo-text">SETTINGS</div>
          <div className="ui-small text-muted">Seeded System</div>
          <div className="mt-1">
            <input className="seed-input" value={seedInput} onChange={(e) => setSeedInput(e.target.value)} />
          </div>
          <div className="action-list mt-1">
            {exampleSeeds().map((s) => (
              <button key={s} className="small-btn" onClick={() => setSeedInput(s)}>{s}</button>
            ))}
          </div>
          <div className="ui-small mt-2 text-muted">Type a seed or choose an example to regenerate the system.</div>

          <div className="data-grid mt-2">
            <div className="data-cell">
              <div className="data-cell-label">Navigation</div>
              <div className="ui-small">Switch frames</div>
              <div className="mt-1" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="small-btn" onClick={() => onNavigate && onNavigate('login')}>Go to Login</button>
                <button className="small-btn" onClick={() => onNavigate && onNavigate('homebase')}>Go to Homebase</button>
                <button className="small-btn" onClick={() => onNavigate && onNavigate('ship')}>Go to Ship</button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="tab-panel-header holo-text">
          {activeTab}
        </div>
        <div className="text-muted" style={{ fontSize: '10px' }}>
          {'> '}SYSTEM: {activeTab}
        </div>
        <div className="mt-2 text-muted" style={{ fontSize: '9px', lineHeight: '1.6' }}>
          [System controls under construction]
        </div>
      </div>
    );
  };

  return (
    <div className="terminal-frame">
      {/* Left Tab Stack */}
      <div className="tab-stack-left">
        {leftTabs.map((tab) => (
          <div
            key={tab}
            className={`tab-item ${activeTab === tab ? 'active' : ''}`}
            onClick={() => toggleTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Left Tab Panel */}
      <div className={`tab-panel left holo-border ${activeTab ? 'open' : ''}`}>
        {activeTab && (
          <div className="tab-panel-content">
            {renderLeftPanelContent()}
          </div>
        )}
      </div>

      {/* Central Terminal Display - Game Phase Output */}
      <div className="command-display holo-glow flicker fade-in">
        <div className="display-header holo-text">
          SHIP COMMAND CONSOLE // EXPEDITION RUN
        </div>
        <div className="display-content">
          <div className="terminal-output">
            {gamePhase === 'jumped' && (
              <>
                <p className="terminal-prompt">{'> '}FOLD JUMP COMPLETE</p>
                <p className="terminal-prompt">{'> '}ARRIVING AT SYSTEM: {seedInput}</p>
                <p style={{ marginTop: '20px', opacity: 0.6 }}>
                  Sublight engines engaged. Sensors initializing...
                </p>
                <button className="action-btn" style={{ marginTop: '30px' }} onClick={startDialogue}>
                  Continue
                </button>
              </>
            )}
            {gamePhase === 'dialogue' && (
              <>
                <p className="terminal-prompt">{'> '}ARIA (Navigation AI):</p>
                <p className="typewriter" style={{ marginTop: '15px', fontStyle: 'italic', opacity: 0.9, lineHeight: '1.6' }}>
                  "We've arrived at the edge of the system. Sensors are nominal, but we're running dark. 
                  You need to scan the area to see what's out there—planets, stations, hazards. 
                  Would you like me to start a full system scan?"
                </p>
                {showScanPrompt && (
                  <div style={{ marginTop: '25px', display: 'flex', gap: '12px' }}>
                    <button className="action-btn" onClick={() => handleScanResponse(true)}>Yes</button>
                    <button className="action-btn" onClick={() => handleScanResponse(false)}>No</button>
                  </div>
                )}
              </>
            )}
            {gamePhase === 'scanning' && (
              <>
                <p className="terminal-prompt">{'> '}INITIATING FULL SYSTEM SCAN...</p>
                <p style={{ marginTop: '15px', opacity: 0.7 }}>
                  Opening tactical display...
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Info Panel */}
      <div className="ship-info-panel">
        {/* Status Bars */}
        <div className="status-bars">
          <div className="status-bar-row">
            <span className="status-bar-label">Shields :</span>
            <div className="status-bar-blocks">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`status-block ${i < Math.floor(shipVitals.shields / 14.3) ? 'filled shields' : ''}`}></div>
              ))}
            </div>
          </div>
          
          <div className="status-bar-row">
            <span className="status-bar-label">Hull :</span>
            <div className="status-bar-blocks">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`status-block ${i < Math.floor(shipVitals.hull / 14.3) ? 'filled hull' : ''}`}></div>
              ))}
            </div>
          </div>
          
          <div className="status-bar-row">
            <span className="status-bar-label">Power :</span>
            <div className="status-bar-blocks">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`status-block ${i < Math.floor(shipVitals.power / 14.3) ? 'filled power' : ''}`}></div>
              ))}
            </div>
          </div>
          
          <div className="status-bar-divider">- - - - - - - - - - - - -</div>
          
          <div className="status-bar-row">
            <span className="status-bar-label">Plasma Static :</span>
            <div className="status-bar-blocks">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`status-block ${i < Math.floor(shipVitals.static / 14.3) ? 'filled wake' : ''}`}></div>
              ))}
            </div>
          </div>
          
          <div className="status-bar-row">
            <span className="status-bar-label">Surge Levels :</span>
            <div className="status-bar-blocks">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`status-block ${i < Math.floor(shipVitals.radiation / 14.3) ? 'filled radiation' : ''}`}></div>
              ))}
            </div>
          </div>
        </div>

        {/* System Map */}
        <div className="system-map">
          <div className="system-map-header">
            SYSTEM MAP <button className="small-btn" style={{ float: 'right' }} onClick={() => setFullscreen(true)}>Full</button>
          </div>
          <div className="map-container holo-border">
            <div className="map-grid"></div>
            {/* Sun */}
                <div className="map-poi sun" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                  onClick={() => { setSelectedPOI('SUN'); setLockedSelection(true); }}
                >
              <div className="poi-tooltip">SUN ({system?.star.class}-TYPE)</div>
            </div>
            {/* Parents within small view radius */}
            {(() => {
              if (!system) return null;
              const viewAU = 10; // small map radius (AU)
              const toXY = (au, angle) => {
                const centerX = 0.5; const centerY = 0.5; // normalized
                const scale = Math.min(1, au / viewAU);
                const r = scale * 0.45; // 45% of container
                const x = centerX + r * Math.cos(angle);
                const y = centerY + r * Math.sin(angle);
                return { left: `${x * 100}%`, top: `${y * 100}%` };
              };
              const parents = [
                ...system.orbits.map(o => ({ ...o.parent, distanceAU: o.distanceAU, angleRad: o.angleRad })),
                ...(system.extras || []).map(e => ({ ...e.parent, distanceAU: e.distanceAU, angleRad: e.angleRad })),
              ];
              return parents.filter(p => p.distanceAU <= viewAU && scanProgress.includes(p.id)).map(p => (
                <div key={p.id}
                  className={`map-poi ${p.type} ${shapeForType(p.type)} ${selectedPOI === p.id ? 'selected' : ''}`}
                  style={toXY(p.distanceAU, p.angleRad)}
                  onMouseEnter={() => { if (!lockedSelection) setSelectedPOI(p.id); }}
                  onMouseLeave={() => { if (!lockedSelection) setSelectedPOI(null); }}
                  onClick={() => { setSelectedPOI(p.id); setLockedSelection(true); }}
                >
                  <div className="poi-tooltip">{p.name}</div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* POI Table - Scrollable */}
        <div className="poi-table-scrollable">
          <div className="poi-table-header">
            POINTS OF INTEREST
            <button className="small-btn" style={{ float: 'right' }} onClick={clearSelection}>Clear</button>
          </div>
          <div className="poi-table-grid">
            <div className="poi-table-header-row">
              <div className="poi-table-header-cell">POI</div>
              <div className="poi-table-header-cell">TYPE</div>
              <div className="poi-table-header-cell">DISTANCE</div>
            </div>
            {pois.filter(poi => poi.id === 'SUN' || scanProgress.includes(poi.id)).map((poi) => (
              <div 
                key={poi.id}
                className={`poi-table-row ${selectedPOI === poi.id ? 'selected' : ''}`}
                onMouseEnter={() => setSelectedPOI(poi.id)}
                onMouseLeave={() => setSelectedPOI(null)}
                onClick={() => { setSelectedPOI(poi.id); setLockedSelection(true); }}
              >
                <div className="poi-table-cell poi-name">{poi.name}</div>
                <div className="poi-table-cell poi-type">{poi.type}</div>
                <div className="poi-table-cell poi-distance">{poi.distanceAU !== undefined ? `${poi.distanceAU.toFixed(2)} AU` : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Map Overlay */}
      {fullscreen && system && (
        <div className="map-fullscreen-overlay">
          {/* Left 2/3: Map Canvas + Terminal */}
          <div className="map-fullscreen-left">
            <div className="map-fullscreen-header">
              <span>SOLAR SYSTEM MAP — {seedInput}</span>
              <div className="map-legend">
                {[
                  ['planet','Planet'], ['belt','Belt'], ['orbital','Orbital'], ['habitat','Habitat'],
                  ['anomaly','Anomaly'], ['nebula','Nebula'], ['conflict','Conflict'], ['wake','Wake'], ['distress','Distress']
                ].map(([k, label]) => (
                  <div key={k} className="legend-item">
                    <span className={`legend-dot ${k}`}></span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
              <div>
                <button className="small-btn" onClick={() => { setFullscreen(false); setGamePhase('jumped'); }}>Close</button>
              </div>
            </div>
            <div className="map-fullscreen-canvas" style={{ flex: 1 }}>
              <div className="map-grid"></div>
              {!scanned && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'var(--faded-cyan)',
                  fontSize: '14px',
                  letterSpacing: '2px',
                  opacity: 0.6,
                  textAlign: 'center'
                }}>
                  SYSTEM NOT SCANNED<br/>
                  <span style={{ fontSize: '10px', opacity: 0.5 }}>Initiate scan from terminal</span>
                </div>
              )}
              {scanned && (
                <>
                  {(() => {
                // Zoom support (0.6x to 10x)
                const [minZoom, maxZoom] = [0.6, 10.0];
                const [zoomIn, zoomOut] = [
                  () => setZoom(z => Math.min(maxZoom, z < 2 ? Math.round((z + 0.2) * 10) / 10 : Math.round((z + 0.5) * 10) / 10)),
                  () => setZoom(z => Math.max(minZoom, z <= 2 ? Math.round((z - 0.2) * 10) / 10 : Math.round((z - 0.5) * 10) / 10))
                ];
                const toXY = (au, angle) => {
                  const centerX = 0.5 + panOffset.x; 
                  const centerY = 0.5 + panOffset.y;
                  const r = (au / system.heliosphere.radiusAU) * 0.46 * zoom;
                  const x = centerX + r * Math.cos(angle);
                  const y = centerY + r * Math.sin(angle);
                  return { left: `${x * 100}%`, top: `${y * 100}%` };
                };
                
                // Drag handlers for panning
                const handleMouseDown = (e) => {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX, y: e.clientY });
                };
                const handleMouseMove = (e) => {
                  if (!isDragging) return;
                  const canvas = e.currentTarget;
                  const rect = canvas.getBoundingClientRect();
                  const dx = (e.clientX - dragStart.x) / rect.width;
                  const dy = (e.clientY - dragStart.y) / rect.height;
                  setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                  setDragStart({ x: e.clientX, y: e.clientY });
                };
                const handleMouseUp = () => setIsDragging(false);
                const handleMouseLeave = () => setIsDragging(false);
                
                // Mouse wheel zoom
                const handleWheel = (e) => {
                  e.preventDefault();
                  const delta = -Math.sign(e.deltaY);
                  if (delta > 0) {
                    setZoom(z => Math.min(maxZoom, z < 2 ? Math.round((z + 0.2) * 10) / 10 : Math.round((z + 0.5) * 10) / 10));
                  } else {
                    setZoom(z => Math.max(minZoom, z <= 2 ? Math.round((z - 0.2) * 10) / 10 : Math.round((z - 0.5) * 10) / 10));
                  }
                };
                
                // Off-screen indicator for selected POI
                const offScreenIndicator = selectedPOI && selectedPOI !== 'SUN' ? (() => {
                  const poi = parents.find(p => p.id === selectedPOI);
                  if (!poi) return null;
                  const pos = toXY(poi.distanceAU, poi.angleRad);
                  const x = parseFloat(pos.left);
                  const y = parseFloat(pos.top);
                  const isOffScreen = x < 0 || x > 100 || y < 0 || y > 100;
                  if (!isOffScreen) return null;
                  
                  // Calculate edge position and angle
                  const angle = Math.atan2(y - 50, x - 50);
                  const edgeX = 50 + 45 * Math.cos(angle);
                  const edgeY = 50 + 45 * Math.sin(angle);
                  const rotation = (angle * 180 / Math.PI) + 90;
                  
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${edgeX}%`,
                        top: `${edgeY}%`,
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        width: 0,
                        height: 0,
                        borderLeft: '8px solid transparent',
                        borderRight: '8px solid transparent',
                        borderBottom: '14px solid rgba(52, 224, 255, 0.8)',
                        filter: 'drop-shadow(0 0 4px rgba(52, 224, 255, 0.6))',
                        pointerEvents: 'none',
                        zIndex: 100
                      }}
                    />
                  );
                })() : null;
                
                // Ship marker
                const shipMarker = (
                  <div
                    className="map-poi"
                    style={{
                      ...toXY(shipPosition.distanceAU, shipPosition.angleRad),
                      background: 'rgba(255, 200, 100, 0.9)',
                      borderColor: 'rgba(255, 200, 100, 1)',
                      boxShadow: '0 0 20px rgba(255, 200, 100, 0.8)',
                      width: '12px',
                      height: '12px',
                      clipPath: 'polygon(50% 0, 100% 100%, 0 100%)'
                    }}
                  >
                    <div className="poi-tooltip">SHIP (SS-ARKOSE)</div>
                  </div>
                );
                
                // Sun marker - now moves with pan
                const sunMarker = (
                  <div 
                    className="map-poi sun" 
                    style={{ 
                      left: `${(0.5 + panOffset.x) * 100}%`, 
                      top: `${(0.5 + panOffset.y) * 100}%`, 
                      transform: 'translate(-50%, -50%)' 
                    }}
                    onClick={() => { setSelectedPOI('SUN'); setLockedSelection(true); }}
                  >
                    <div className="poi-tooltip">SUN ({system.star.class}-TYPE)</div>
                  </div>
                );
                // Get scanned parents first
                const parents = [
                  ...system.orbits.map(o => ({ ...o.parent, distanceAU: o.distanceAU, angleRad: o.angleRad, orbitIndex: o.index })),
                  ...(system.extras || []).map(e => ({ ...e.parent, distanceAU: e.distanceAU, angleRad: e.angleRad, orbitIndex: -1 })),
                ].filter(p => scanProgress.includes(p.id));
                
                // Orbits as rings - only show rings for scanned POIs
                const scannedOrbitIndices = new Set(parents.filter(p => p.orbitIndex >= 0).map(p => p.orbitIndex));
                const rings = system.orbits.filter(o => scannedOrbitIndices.has(o.index)).map(o => {
                  const size = (o.distanceAU / system.heliosphere.radiusAU) * 0.92 * zoom;
                  return (
                    <div key={`ring-${o.index}`} className="orbit-ring" style={{
                      left: `${(0.5 + panOffset.x) * 100}%`, 
                      top: `${(0.5 + panOffset.y) * 100}%`, 
                      transform: 'translate(-50%, -50%)',
                      width: `${size * 100}%`,
                      height: `${size * 100}%`,
                    }} />
                  );
                });
                const markers = parents.map(p => (
                  <div
                    key={p.id}
                    className={`map-poi ${p.type} ${shapeForType(p.type)} ${selectedPOI === p.id ? 'selected' : ''}`}
                    style={toXY(p.distanceAU, p.angleRad)}
                    onMouseEnter={() => { if (!lockedSelection) setSelectedPOI(p.id); }}
                    onMouseLeave={() => { if (!lockedSelection) setSelectedPOI(null); }}
                    onClick={() => { setSelectedPOI(p.id); setLockedSelection(true); }}
                  >
                    <div className="poi-tooltip">{p.name} — {p.distanceAU.toFixed(2)} AU</div>
                  </div>
                ));
                // Highlight circle for selected POI
                const highlightCircle = selectedPOI && selectedPOI !== 'SUN' ? (() => {
                  const poi = parents.find(p => p.id === selectedPOI);
                  if (!poi) return null;
                  const pos = toXY(poi.distanceAU, poi.angleRad);
                  return (
                    <div
                      className="poi-highlight-circle"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  );
                })() : null;
                return (<>
                  <div 
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0,
                      cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                  >
                    <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 6, zIndex: 2 }}>
                      <button className="small-btn" onClick={zoomOut}>-</button>
                      <span className="ui-small text-muted">{(zoom*100).toFixed(0)}%</span>
                      <button className="small-btn" onClick={zoomIn}>+</button>
                      <button className="small-btn" onClick={() => { setZoom(1.0); setPanOffset({ x: 0, y: 0 }); }} title="Reset view">⊙</button>
                    </div>
                    {rings}
                    {shipMarker}
                    {sunMarker}
                    {markers}
                    {highlightCircle}
                    {offScreenIndicator}
                  </div>
                </>);
              })()}
                </>
              )}
            </div>
            
            {/* Terminal Output under the map - can expand as overlay */}
            <div 
              style={{ 
                position: terminalExpanded ? 'absolute' : 'relative',
                bottom: terminalExpanded ? 0 : 'auto',
                left: terminalExpanded ? 0 : 'auto',
                right: terminalExpanded ? 0 : 'auto',
                width: '100%',
                marginTop: terminalExpanded ? 0 : '12px',
                height: terminalExpanded ? '50vh' : 'auto',
                zIndex: terminalExpanded ? 10 : 1,
                background: terminalExpanded ? 'rgba(0, 0, 0, 0.95)' : 'transparent',
                padding: terminalExpanded ? '16px' : '0',
                borderTop: terminalExpanded ? '1px solid rgba(52, 224, 255, 0.5)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div className="ui-small text-muted">TERMINAL OUTPUT</div>
                <button 
                  className="small-btn" 
                  onClick={() => setTerminalExpanded(!terminalExpanded)}
                  style={{ fontSize: '10px', padding: '2px 8px' }}
                >
                  {terminalExpanded ? '▼ Collapse' : '▲ Expand'}
                </button>
              </div>
              <div 
                ref={terminalRef}
                className="map-terminal-output" 
                style={{ height: terminalExpanded ? 'calc(50vh - 60px)' : '10vh' }}
              >
                {terminalLog.map((line, idx) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>{line}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 1/3: Commands + POI Sidebar */}
          <div className="map-fullscreen-right">
            <div className="system-map-header">TACTICAL DISPLAY</div>
            
            {/* Commands Section */}
            <div className="map-commands-section">
              <div className="ui-small text-muted" style={{ marginBottom: '8px' }}>COMMANDS</div>
              <button 
                className="action-btn" 
                onClick={startSystemScan}
                disabled={scanningActive}
                style={{ width: '100%', opacity: scanningActive ? 0.5 : 1, marginBottom: '8px' }}
              >
                {scanningActive ? 'Scanning...' : 'Scan System'}
              </button>
              <button 
                className="action-btn" 
                disabled={!selectedPOI || selectedPOI === 'SUN'}
                style={{ 
                  width: '100%', 
                  opacity: (!selectedPOI || selectedPOI === 'SUN') ? 0.3 : 1,
                  background: (!selectedPOI || selectedPOI === 'SUN') ? 'rgba(100, 100, 100, 0.2)' : 'rgba(52, 224, 255, 0.15)'
                }}
                title={!selectedPOI ? 'Select a destination first' : 'Move ship to selected location'}
              >
                Move Ship to {selectedPOI && selectedPOI !== 'SUN' ? pois.find(p => p.id === selectedPOI)?.type : 'Target'}
              </button>
            </div>

            {/* POI List */}
            <div className="ui-small text-muted" style={{ marginBottom: '4px' }}>POINTS OF INTEREST</div>
            <div className="map-poi-sidebar">
              {/* SHIP */}
              <div
                className="map-poi-sidebar-item"
                style={{ background: 'rgba(255, 200, 100, 0.15)', borderColor: 'rgba(255, 200, 100, 0.6)' }}
              >
                <div className="map-poi-sidebar-name" style={{ color: 'rgba(255, 200, 100, 1)' }}>SHIP (SS-ARKOSE)</div>
                <div className="map-poi-sidebar-meta">Type: SURVEY FRIGATE • Distance: 0.00 AU</div>
                <div className="map-poi-sidebar-meta">
                  Coordinates: ({shipPosition.x.toFixed(2)}, {shipPosition.y.toFixed(2)})
                </div>
              </div>
              
              {/* SUN */}
              <div
                className={`map-poi-sidebar-item ${selectedPOI === 'SUN' ? 'active' : ''}`}
                onClick={() => { setSelectedPOI('SUN'); setLockedSelection(true); }}
              >
                <div className="map-poi-sidebar-name">SUN</div>
                <div className="map-poi-sidebar-meta">Type: {system.star.class}-CLASS STAR • Distance: {shipPosition.distanceAU.toFixed(2)} AU</div>
                <div className="map-poi-sidebar-meta">Coordinates: (0.00, 0.00)</div>
              </div>
              
              {/* Scanned POIs sorted by distance from ship */}
              {pois.filter(p => p.id !== 'SUN' && scanProgress.includes(p.id)).sort((a, b) => {
                const distA = Math.sqrt(Math.pow(a.distanceAU * Math.cos(a.angleRad) - shipPosition.x, 2) + Math.pow(a.distanceAU * Math.sin(a.angleRad) - shipPosition.y, 2));
                const distB = Math.sqrt(Math.pow(b.distanceAU * Math.cos(b.angleRad) - shipPosition.x, 2) + Math.pow(b.distanceAU * Math.sin(b.angleRad) - shipPosition.y, 2));
                return distA - distB;
              }).map(poi => {
                const x = poi.distanceAU * Math.cos(poi.angleRad);
                const y = poi.distanceAU * Math.sin(poi.angleRad);
                const distFromShip = Math.sqrt(Math.pow(x - shipPosition.x, 2) + Math.pow(y - shipPosition.y, 2));
                return (
                  <div
                    key={poi.id}
                    className={`map-poi-sidebar-item ${selectedPOI === poi.id ? 'active' : ''}`}
                    onClick={() => { setSelectedPOI(poi.id); setLockedSelection(true); }}
                  >
                    <div className="map-poi-sidebar-name">{poi.name}</div>
                    <div className="map-poi-sidebar-meta">
                      Type: {poi.type} • Distance: {distFromShip.toFixed(2)} AU from ship
                    </div>
                    <div className="map-poi-sidebar-meta">
                      Coordinates: ({x.toFixed(2)}, {y.toFixed(2)})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipCommandConsole;
