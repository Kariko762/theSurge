import { useMemo, useState, useEffect, useRef } from 'react'
import { generateSystem, exampleSeeds, calculateTotalRisk, calculateStaticExposure, calculateWakeSignature } from '../lib/systemGenerator.js'
import { calculateShipAttributes, DEFAULT_SHIP_LOADOUT, DEFAULT_POWER_ALLOCATION, COMPONENTS } from '../lib/shipComponents.js'
import { getShipState } from '../lib/shipState.js'
import { loadGalaxy } from '../lib/galaxyLoader.js'
import SettingsDropdown from './SettingsDropdown.jsx'
import ActionsPanel from './ActionsPanel.jsx'
import TerminalModal from './TerminalModal.jsx'
import RightPanelTabs from './RightPanelTabs.jsx'
import { executeDREAction } from '../lib/dre/engine.js'

/**
 * FRAME 3: Ship Command Console - Ship Run View
 * Simplified terminal output with power management and system controls
 */

const ShipCommandConsole = ({ onNavigate, initialSeed }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [lockedSelection, setLockedSelection] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({ power: true, ship: false });
  const [fullscreen, setFullscreen] = useState(true);
  const [zoom, setZoom] = useState(1.0); // Will be recalculated based on heliosphere
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panTransition, setPanTransition] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [gamePhase, setGamePhase] = useState('scanning'); // scanning mode - skip jumped/dialogue
  const [dialogueComplete, setDialogueComplete] = useState(false);
  const [showScanPrompt, setShowScanPrompt] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanProgress, setScanProgress] = useState([]);
  const [scanningActive, setScanningActive] = useState(false);
  const [terminalLog, setTerminalLog] = useState([]);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [movementProgress, setMovementProgress] = useState(0);
  const [scanPingRadius, setScanPingRadius] = useState(0); // Current ping radius in AU
  const [isPinging, setIsPinging] = useState(false); // Is ping animation active
  const [cursorWorldPos, setCursorWorldPos] = useState({ x: 0, y: 0 }); // Cursor position in AU
  const [isOutsideHeliosphere, setIsOutsideHeliosphere] = useState(false);
  const [droppedPins, setDroppedPins] = useState([]); // Array of {id, x, y, name}
  const [dropPinMode, setDropPinMode] = useState(false); // Is user in drop pin mode
  const [showPOINames, setShowPOINames] = useState(true);
  const [showScaleRings, setShowScaleRings] = useState(true); // Show distance scale rings
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.25); // Background image opacity (0-1)
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [shipRotation, setShipRotation] = useState(0); // Ship rotation angle in degrees
  const [hoveredPin, setHoveredPin] = useState(null); // Currently hovered pin for delete button
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [terminalModalContent, setTerminalModalContent] = useState([]);
  const [rightPanelTab, setRightPanelTab] = useState('pois'); // pois | ship | inventory | actions | comms
  const [openDropdown, setOpenDropdown] = useState(null); // {type: 'moveTo'|'tag'|'actions', poiId: string}
  const [poiTags, setPoiTags] = useState({}); // {poiId: ['visited', 'avoid', 'cache']}
  const [sequenceWaypointCallback, setSequenceWaypointCallback] = useState(null); // Callback for adding sequence waypoints
  const [sequenceSteps, setSequenceSteps] = useState([]); // Automation sequence waypoints
  const [showActionMenu, setShowActionMenu] = useState(null); // {x, y, worldX, worldY} for action selection menu
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

  // Load galaxy to find system name
  const galaxy = useMemo(() => loadGalaxy('helix_nebula'), []);
  const currentGalaxySystem = useMemo(() => {
    if (!galaxy || !initialSeed) return null;
    return galaxy.systems.find(s => s.seed === initialSeed);
  }, [galaxy, initialSeed]);
  
  const systemName = currentGalaxySystem?.name || 'Unknown System';
  const systemId = currentGalaxySystem?.id || null;

  // Seed + generated system
  const [seedInput, setSeedInput] = useState(initialSeed || exampleSeeds()[0]);
  const system = useMemo(() => {
    const generated = generateSystem(seedInput, { 
      sensorsPower: shipAttributes.sensorRange, 
      wake: shipAttributes.staticSignature 
    });
    console.log(`[SEED: ${seedInput}] Generated system:`, {
      star: generated.star.class,
      heliosphere: generated.heliosphere.radiusAU.toFixed(2),
      orbitCount: generated.orbits.length,
      extraCount: generated.extras.length,
      firstPlanet: generated.orbits.find(o => o.parent.type === 'planet')?.parent.name || 'none'
    });
    return generated;
  }, [seedInput, shipAttributes.sensorRange, shipAttributes.staticSignature]);
  
  // Sync ship position on mount and center view
  useEffect(() => {
    if (system) {
      const edgeAU = system.heliosphere.radiusAU * 0.95;
      const angleRad = Math.PI * 0.25;
      shipState.setPosition(edgeAU, angleRad);
      shipState.visitSystem(seedInput);
      
      // Don't auto-scan - let player initiate manually
      setScanned(false);
      setGamePhase('scanning');
      setFullscreen(true);
      
      // Calculate zoom so heliosphere fills the viewport (with 92% margin)
      // The heliosphere circle diameter should be: 0.92 * zoom * 2 * 100% = ~95% of viewport
      // Therefore: zoom = 0.95 / (0.92 * 2) = ~0.516
      const initialZoom = 0.516; // This makes heliosphere fill ~95% of viewport
      setZoom(initialZoom);
      
      setShipStateVersion(v => v + 1);
      // Center view on sun (origin) - pan offset stays at {x: 0, y: 0}
      setPanOffset({ x: 0, y: 0 });
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

  // Passive hull damage from static exposure (damage-over-time)
  useEffect(() => {
    if (!system || !shipPosition || gamePhase !== 'scanning') return;
    
    const damageInterval = setInterval(() => {
      const exposure = calculateStaticExposure(system, shipPosition.distanceAU);
      
      // Damage scales with exposure: 0 damage below 10 mSv/h, ramps up above
      if (exposure > 10) {
        const damagePerSecond = (exposure - 10) * 0.01; // 0.01% hull per mSv/h above threshold
        shipState.damageHull(damagePerSecond);
        setShipStateVersion(v => v + 1);
        
        // Log warning at dangerous levels
        if (exposure > 50 && Math.random() < 0.05) { // 5% chance per tick
          setTerminalLog(prev => [
            ...prev,
            `> WARNING: Critical static exposure (${exposure.toFixed(1)} mSv/h). Hull integrity degrading.`
          ]);
        }
      }
    }, 1000); // Tick every second
    
    return () => clearInterval(damageInterval);
  }, [system, shipPosition, gamePhase]);
  
  // Center view on ship at current zoom
  const centerOnShip = () => {
    if (!system) return;
    setPanTransition(true);
    // Get current ship state directly to avoid closure issues
    const currentShipState = shipState.getState();
    const currentPos = currentShipState.position;
    const r = (currentPos.distanceAU / system.heliosphere.radiusAU) * 0.92 * zoom;
    const offsetX = -r * Math.cos(currentPos.angleRad);
    const offsetY = -r * Math.sin(currentPos.angleRad);
    setPanOffset({ x: offsetX, y: offsetY });
    setTimeout(() => setPanTransition(false), 1000);
  };
  
  // Reset to default view (sun-centered, heliosphere fills viewport)
  const resetToDefaultView = () => {
    if (!system) return;
    setPanTransition(true);
    const initialZoom = 0.516;
    setZoom(initialZoom);
    setPanOffset({ x: 0, y: 0 });
    setTimeout(() => setPanTransition(false), 1000);
  };
  
  const handleMapMouseMove = (e, containerRect) => {
    if (!system || !containerRect) return;
    
    const canvasX = e.clientX - containerRect.left;
    const canvasY = e.clientY - containerRect.top;
    const width = containerRect.width;
    const height = containerRect.height;
    
    // Convert canvas position to normalized coordinates relative to center
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Account for pan offset
    const normalizedX = (canvasX - centerX) / width - panOffset.x;
    const normalizedY = (canvasY - centerY) / height - panOffset.y;
    
    // Distance from center in normalized viewport units
    const distFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    
    // The heliosphere circle has radius = 0.92 * zoom (diameter = 0.92 * zoom * 2)
    const heliosphereRadius = 0.92 * zoom;
    
    // Check if cursor is outside the visual heliosphere circle
    setIsOutsideHeliosphere(distFromCenter > heliosphereRadius);
    
    // Also calculate world coordinates for pin dropping
    // Reverse the toXY transformation: screen -> normalized -> world
    const screenX = (canvasX / width) - 0.5 - panOffset.x;
    const screenY = (canvasY / height) - 0.5 - panOffset.y;
    const r_normalized = Math.sqrt(screenX * screenX + screenY * screenY);
    const angle = Math.atan2(screenY, screenX);
    const distanceAU = (r_normalized / (0.92 * zoom)) * system.heliosphere.radiusAU;
    const worldX = distanceAU * Math.cos(angle);
    const worldY = distanceAU * Math.sin(angle);
    setCursorWorldPos({ x: worldX, y: worldY });
  };
  
  const handleDropPin = (e, containerRect) => {
    if (!dropPinMode || !system || isOutsideHeliosphere) return;
    
    const newPin = {
      id: `PIN_${Date.now()}`,
      x: cursorWorldPos.x,
      y: cursorWorldPos.y,
      name: `Nav Point ${droppedPins.length + 1}`,
      distanceAU: Math.sqrt(cursorWorldPos.x * cursorWorldPos.x + cursorWorldPos.y * cursorWorldPos.y),
      angleRad: Math.atan2(cursorWorldPos.y, cursorWorldPos.x)
    };
    
    setDroppedPins(prev => [...prev, newPin]);
    setDropPinMode(false);
    setTerminalLog(prev => [...prev, `> Navigation point set at (${newPin.x.toFixed(2)}, ${newPin.y.toFixed(2)}) AU`]);
  };
  
  // Center view on a POI at 150% zoom
  const centerOnPOI = (poi) => {
    if (!system) return;
    setPanTransition(true);
    const r = (poi.distanceAU / system.heliosphere.radiusAU) * 0.92 * 1.5;
    const offsetX = -r * Math.cos(poi.angleRad);
    const offsetY = -r * Math.sin(poi.angleRad);
    setZoom(1.5);
    setPanOffset({ x: offsetX, y: offsetY });
    setTimeout(() => setPanTransition(false), 1000);
  };

  const moveShipTo = (targetPOIorAU, targetAngle = null, onComplete = null) => {
    if (!system || isMoving) return;
    
    let targetX, targetY, targetName;
    
    // Check if we received coordinates (AU, angle) or POI ID
    if (typeof targetPOIorAU === 'number' && targetAngle !== null) {
      // Direct coordinates - for automation sequences
      targetX = targetPOIorAU * Math.cos(targetAngle);
      targetY = targetPOIorAU * Math.sin(targetAngle);
      targetName = `Waypoint (${targetPOIorAU.toFixed(2)} AU)`;
    } else {
      // POI ID - for manual navigation
      if (!targetPOIorAU) return;
      let target = pois.find(p => p.id === targetPOIorAU);
      if (!target) {
        target = droppedPins.find(p => p.id === targetPOIorAU);
      }
      if (!target) return;
      
      targetX = target.distanceAU * Math.cos(target.angleRad);
      targetY = target.distanceAU * Math.sin(target.angleRad);
      targetName = target.name;
    }

    const currentPos = shipPosition;
    const distance = Math.sqrt(
      Math.pow(targetX - currentPos.x, 2) + Math.pow(targetY - currentPos.y, 2)
    );
    
    // Calculate rotation angle (pointing towards target)
    const dx = targetX - currentPos.x;
    const dy = targetY - currentPos.y;
    const rotationAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90; // +90 to point up by default
    setShipRotation(rotationAngle);

    // Calculate travel time based on engine speed (AU/hour)
    const engineSpeed = shipAttributes.speed || 1.0; // AU per hour
    const travelTimeHours = distance / engineSpeed;
    const travelTimeSeconds = Math.min(travelTimeHours * 2, 10); // Cap at 10 seconds for gameplay

    // Fuel consumption (arbitrary units per AU)
    const fuelNeeded = distance * 0.5;
    
    setTerminalLog(prev => [...prev, 
      `> ARIA: Plotting course to ${targetName}...`,
      `> Distance: ${distance.toFixed(2)} AU`,
      `> Travel time: ${travelTimeHours.toFixed(1)} hours (${travelTimeSeconds.toFixed(1)}s real-time)`,
      `> Fuel required: ${fuelNeeded.toFixed(1)} units`,
      `> Engaging engines...`
    ]);

    setIsMoving(true);
    setMovementProgress(0);

    // Animate movement
    const startTime = Date.now();
    const animationInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / travelTimeSeconds, 1);
      setMovementProgress(progress);

      // Interpolate position
      const newX = currentPos.x + (targetX - currentPos.x) * progress;
      const newY = currentPos.y + (targetY - currentPos.y) * progress;
      const newDistanceAU = Math.sqrt(newX * newX + newY * newY);
      const newAngleRad = Math.atan2(newY, newX);

      shipState.setPosition(newDistanceAU, newAngleRad);
      setShipStateVersion(v => v + 1);

      if (progress >= 1) {
        clearInterval(animationInterval);
        setIsMoving(false);
        setMovementProgress(0);
        setTerminalLog(prev => [...prev, 
          `> ARIA: Arrived at ${targetName}`,
          `> Position: ${Math.sqrt(targetX * targetX + targetY * targetY).toFixed(2)} AU from sun`
        ]);
        // Don't auto-center during sequence execution - let sequence manage view
        
        // Call completion callback if provided
        if (onComplete) {
          setTimeout(() => onComplete(), 200);
        }
      }
    }, 50); // Update every 50ms for smooth animation
  };

  const startSystemScan = () => {
    if (scanningActive) return;
    setScanningActive(true);
    setIsPinging(true);
    setScanPingRadius(0);
    
    setTerminalLog(prev => [
      ...prev, 
      '> ARIA: Initiating sensor sweep...',
      `> ARIA: Sensor range: ${shipAttributes.sensorRange} AU`,
      `> ARIA: Galactic zone: ${system.galactic.zone}. Surge radiation: ${system.galactic.surgeRadiation.toFixed(1)} mSv/h baseline.`,
      `> ARIA: Star class ${system.star.class}, luminosity ${system.star.lum.toFixed(2)}. Stellar protection: ${system.galactic.stellarProtection.toFixed(2)}.`
    ]);
    
    // Animate ping expanding from ship to sensor range
    const pingDuration = 2000; // 2 seconds for ping to expand
    const startTime = Date.now();
    
    const pingInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / pingDuration, 1);
      const currentRadius = shipAttributes.sensorRange * progress;
      setScanPingRadius(currentRadius);
      
      if (progress >= 1) {
        clearInterval(pingInterval);
        setIsPinging(false);
        setScanPingRadius(0);
      }
    }, 16); // ~60fps
    
    // Filter POIs within sensor range and sort by distance from ship
    const poisWithinRange = pois.filter(p => {
      if (p.id === 'SUN') return false;
      const distFromShip = Math.sqrt(
        Math.pow(p.distanceAU * Math.cos(p.angleRad) - shipPosition.x, 2) +
        Math.pow(p.distanceAU * Math.sin(p.angleRad) - shipPosition.y, 2)
      );
      return distFromShip <= shipAttributes.sensorRange;
    }).sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.distanceAU * Math.cos(a.angleRad) - shipPosition.x, 2) + Math.pow(a.distanceAU * Math.sin(a.angleRad) - shipPosition.y, 2));
      const distB = Math.sqrt(Math.pow(b.distanceAU * Math.cos(b.angleRad) - shipPosition.x, 2) + Math.pow(b.distanceAU * Math.sin(b.angleRad) - shipPosition.y, 2));
      return distA - distB;
    });
    
    // Count POIs out of range
    const totalPois = pois.filter(p => p.id !== 'SUN').length;
    const outOfRange = totalPois - poisWithinRange.length;

    // Progressive reveal as ping reaches each POI
    poisWithinRange.forEach((poi) => {
      const distFromShip = Math.sqrt(
        Math.pow(poi.distanceAU * Math.cos(poi.angleRad) - shipPosition.x, 2) +
        Math.pow(poi.distanceAU * Math.sin(poi.angleRad) - shipPosition.y, 2)
      );
      // Calculate when ping will reach this POI
      const timeToReach = (distFromShip / shipAttributes.sensorRange) * pingDuration;
      
      setTimeout(() => {
        setScanProgress(prev => [...prev, poi.id]);
        shipState.scanPOI(poi.id);
        const x = (poi.distanceAU * Math.cos(poi.angleRad)).toFixed(2);
        const y = (poi.distanceAU * Math.sin(poi.angleRad)).toFixed(2);
        setTerminalLog(prev => [
          ...prev,
          `> ARIA: Detected ${poi.type} at (${x}, ${y}), distance ${distFromShip.toFixed(2)} AU from ship.`
        ]);
      }, timeToReach);
    });

    setTimeout(() => {
      const rangeMsg = outOfRange > 0 
        ? `> ARIA: Scan complete. ${poisWithinRange.length} contacts detected. ${outOfRange} contacts beyond sensor range.`
        : `> ARIA: Scan complete. All ${poisWithinRange.length} contacts catalogued.`;
      setTerminalLog(prev => [...prev, rangeMsg]);
      setScanningActive(false);
    }, pingDuration + 500);
  };

  const shipVitals = {
    shields: currentShipState.currentShields,
    hull: currentShipState.currentHull,
    power: Math.round((shipAttributes.totalPowerReq / shipAttributes.maxPower) * 100),
    static: shipAttributes.staticSignature,
    radiation: 28
  };

  // Calculate real-time risk based on position
  const riskData = useMemo(() => {
    if (!system || !shipPosition) return null;
    
    // Calculate wake based on movement (for now, assume static when not moving)
    const wake = isMoving ? calculateWakeSignature(1.0, shipAttributes.totalPower) : 0;
    
    // System tier (will come from galaxy later, default to 1.0 for now)
    const systemTier = 1.0;
    
    return calculateTotalRisk(system, shipPosition.distanceAU, wake, systemTier);
  }, [system, shipPosition, isMoving, shipAttributes.totalPower]);
  
  // Static exposure for display
  const staticExposure = useMemo(() => {
    if (!system || !shipPosition) return 0;
    return calculateStaticExposure(system, shipPosition.distanceAU);
  }, [system, shipPosition]);

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
    list.push({ id: 'SUN', name: 'SUN', type: 'STAR', distanceAU: 0, angleRad: 0, x: 0, y: 0 });
    system.orbits.forEach((o) => {
      const p = o.parent;
      const x = o.distanceAU * Math.cos(o.angleRad);
      const y = o.distanceAU * Math.sin(o.angleRad);
      list.push({ id: p.id, name: p.name, type: p.type.toUpperCase(), distanceAU: o.distanceAU, angleRad: o.angleRad, x, y });
    });
    (system.extras || []).forEach((e) => {
      const p = e.parent;
      const x = e.distanceAU * Math.cos(e.angleRad);
      const y = e.distanceAU * Math.sin(e.angleRad);
      list.push({ id: p.id, name: p.name, type: p.type.toUpperCase(), distanceAU: e.distanceAU, angleRad: e.angleRad, x, y });
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
      // Start the progressive scan animation
      setTimeout(() => startSystemScan(), 500);
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

  // Handle DRE action execution from ActionsPanel
  const handleActionExecute = async (actionType, targetPOI) => {
    try {
      // Build context for DRE
      const systemContext = {
        systemName,
        star: system.star,
        planets: system.planets || [],
        stations: system.stations || [],
        asteroidBelts: system.asteroidBelts || [],
        anomalies: system.anomalies || []
      };

      // Execute DRE action
      const result = executeDREAction(
        actionType,
        targetPOI,
        currentShipState,
        systemContext
      );

      // Format output for terminal modal
      const formattedContent = [
        { type: 'prompt', text: `> ${actionType.toUpperCase()} ${targetPOI ? targetPOI.name : ''}` },
        ...result.narrative.map(line => ({ type: 'normal', text: line })),
        { type: 'normal', text: '' },
        ...result.outcome.map(line => {
          if (line.includes('ERROR') || line.includes('Failed')) return { type: 'error', text: line };
          if (line.includes('SUCCESS') || line.includes('found')) return { type: 'success', text: line };
          if (line.includes('WARNING')) return { type: 'warning', text: line };
          return { type: 'normal', text: line };
        })
      ];

      // Show terminal modal with results
      setTerminalModalContent(formattedContent);
      setShowTerminalModal(true);
    } catch (error) {
      console.error('Action execution error:', error);
      setTerminalModalContent([
        { type: 'error', text: `> ERROR: ${error.message}` }
      ]);
      setShowTerminalModal(true);
    }
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
      <SettingsDropdown />

      {/* Fullscreen Solar System Map - Always visible */}
      {system && (
        <div className="map-fullscreen-overlay">
          {/* Left 2/3: Map Canvas + Terminal */}
          <div className="map-fullscreen-left">
            <div className="map-fullscreen-header" style={{ marginTop: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>SOLAR SYSTEM MAP — {systemName}</span>
              
              {/* All Status Cubes in One Row */}
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', marginRight: '16px', alignItems: 'center' }}>
                {/* Shields Cube */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0, 20, 40, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 10px rgba(52, 224, 255, 0.3)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${currentShipState.currentShields}%`,
                      background: 'linear-gradient(to top, rgba(52, 224, 255, 0.6), rgba(52, 224, 255, 0.3))',
                      transition: 'height 0.3s ease',
                      boxShadow: 'inset 0 0 10px rgba(52, 224, 255, 0.5)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#34e0ff',
                      textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                      zIndex: 1
                    }}>
                      {Math.round(currentShipState.currentShields)}
                    </div>
                  </div>
                  <div style={{ fontSize: '7px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '0.5px' }}>SHIELDS</div>
                </div>

                {/* Hull Cube */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0, 20, 40, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 10px rgba(52, 224, 255, 0.3)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${currentShipState.currentHull}%`,
                      background: 'linear-gradient(to top, rgba(52, 224, 255, 0.6), rgba(52, 224, 255, 0.3))',
                      transition: 'height 0.3s ease',
                      boxShadow: 'inset 0 0 10px rgba(52, 224, 255, 0.5)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#34e0ff',
                      textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                      zIndex: 1
                    }}>
                      {Math.round(currentShipState.currentHull)}
                    </div>
                  </div>
                  <div style={{ fontSize: '7px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '0.5px' }}>HULL</div>
                </div>

                {/* Energy Cube */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0, 20, 40, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 10px rgba(52, 224, 255, 0.3)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${currentShipState.fuel}%`,
                      background: 'linear-gradient(to top, rgba(52, 224, 255, 0.6), rgba(52, 224, 255, 0.3))',
                      transition: 'height 0.3s ease',
                      boxShadow: 'inset 0 0 10px rgba(52, 224, 255, 0.5)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#34e0ff',
                      textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                      zIndex: 1
                    }}>
                      {Math.round(currentShipState.fuel)}
                    </div>
                  </div>
                  <div style={{ fontSize: '7px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '0.5px' }}>ENERGY</div>
                </div>

                {/* Separator */}
                <div style={{
                  width: '1px',
                  height: '50px',
                  background: 'linear-gradient(to bottom, transparent, rgba(52, 224, 255, 0.6), transparent)',
                  boxShadow: '0 0 8px rgba(52, 224, 255, 0.4)',
                  margin: '0 4px'
                }} />

                {/* Radiation Cube */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0, 20, 40, 0.9)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 10px rgba(52, 224, 255, 0.3)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${calculateStaticExposure(system, shipPosition.distanceAU)}%`,
                      background: 'linear-gradient(to top, rgba(52, 224, 255, 0.6), rgba(52, 224, 255, 0.3))',
                      transition: 'height 0.3s ease',
                      boxShadow: 'inset 0 0 10px rgba(52, 224, 255, 0.5)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#34e0ff',
                      textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                      zIndex: 1
                    }}>
                      {Math.round(calculateStaticExposure(system, shipPosition.distanceAU))}
                    </div>
                  </div>
                  <div style={{ fontSize: '7px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '0.5px' }}>RADIATION</div>
                </div>

                {/* Static Cube */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'rgba(0, 20, 40, 0.9)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 0 10px rgba(52, 224, 255, 0.3)'
                  }}>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${calculateWakeSignature(shipPosition.distanceAU, 5)}%`,
                      background: 'linear-gradient(to top, rgba(52, 224, 255, 0.6), rgba(52, 224, 255, 0.3))',
                      transition: 'height 0.3s ease',
                      boxShadow: 'inset 0 0 10px rgba(52, 224, 255, 0.5)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: '#34e0ff',
                      textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                      zIndex: 1
                    }}>
                      {Math.round(calculateWakeSignature(shipPosition.distanceAU, 5))}
                    </div>
                  </div>
                  <div style={{ fontSize: '7px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '0.5px' }}>STATIC</div>
                </div>
              </div>
              
              {/* Navigation Menu */}
              <div style={{ position: 'relative', display: 'flex', gap: '8px', alignItems: 'center' }}>
                {/* Drop Pin Toggle Button */}
                <button 
                  className="small-btn" 
                  onClick={() => setDropPinMode(!dropPinMode)}
                  style={{ 
                    fontSize: '9px', 
                    padding: '1px 6px',
                    width: '26px',
                    height: '26px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: dropPinMode ? 'rgba(52, 224, 255, 0.3)' : 'rgba(52, 224, 255, 0.1)'
                  }}
                  title={dropPinMode ? 'Drop Pin Mode Active' : 'Activate Drop Pin Mode'}
                >
                  <svg width="12" height="14" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Pin head - teardrop shape */}
                    <path d="M8 2C5.8 2 4 3.8 4 6C4 8.5 8 13 8 13C8 13 12 8.5 12 6C12 3.8 10.2 2 8 2Z" 
                      stroke="#34e0ff" 
                      strokeWidth="1.2" 
                      fill="none"
                    />
                    {/* Center dot */}
                    <circle cx="8" cy="6" r="1.5" fill="#34e0ff" />
                    {/* Isometric ring at bottom */}
                    <ellipse cx="8" cy="16" rx="4" ry="1.5" 
                      stroke="#34e0ff" 
                      strokeWidth="1" 
                      fill="none"
                      opacity="0.6"
                    />
                    {/* Connection line from pin to ring */}
                    <line x1="8" y1="13" x2="8" y2="16" 
                      stroke="#34e0ff" 
                      strokeWidth="0.8" 
                      opacity="0.4"
                      strokeDasharray="1,1"
                    />
                  </svg>
                </button>
                
                <button 
                  className="small-btn" 
                  onClick={() => setShowNavMenu(!showNavMenu)}
                  style={{ fontSize: '9px', padding: '6px 12px' }}
                >
                  SETTINGS ▾
                </button>
                
                {showNavMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    background: 'rgba(0, 20, 40, 0.95)',
                    border: '1px solid #34e0ff',
                    borderRadius: '4px',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 1000,
                    boxShadow: '0 0 20px rgba(52, 224, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '10px', color: '#cfd8df', marginBottom: '8px', fontWeight: 'bold' }}>
                      SETTINGS
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer', marginBottom: '4px' }}>
                      <input 
                        type="checkbox" 
                        checked={showPOINames} 
                        onChange={(e) => setShowPOINames(e.target.checked)}
                      />
                      Show POI Names
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={showScaleRings} 
                        onChange={(e) => setShowScaleRings(e.target.checked)}
                      />
                      Show Scale Rings
                    </label>
                    <div style={{ borderTop: '1px solid rgba(52, 224, 255, 0.3)', margin: '8px 0' }} />
                    <div style={{ fontSize: '9px', color: '#cfd8df', marginBottom: '6px' }}>
                      Background Opacity
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={backgroundOpacity * 100}
                      onChange={(e) => setBackgroundOpacity(e.target.value / 100)}
                      style={{
                        width: '100%',
                        accentColor: '#34e0ff',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )}
                
                <button className="small-btn" onClick={() => onNavigate && onNavigate('homebase')}>Return to Homebase</button>
              </div>
            </div>
            <div className="map-fullscreen-canvas" style={{ 
              flex: 1,
              position: 'relative',
              backgroundImage: 'url(/src/assets/media/solar_system_bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              {/* Background overlay for opacity control */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: `rgba(0, 10, 20, ${1 - backgroundOpacity})`,
                pointerEvents: 'none',
                zIndex: 0
              }} />
              
              <div className="map-grid"></div>
              
              {/* Solar System Map - POIs revealed by scanning */}
              {(() => {
                // Zoom support (0.6x to 10x)
                const [minZoom, maxZoom] = [0.2, 10.0];
                const [zoomIn, zoomOut] = [
                  () => setZoom(z => Math.min(maxZoom, z < 2 ? Math.round((z + 0.2) * 10) / 10 : Math.round((z + 0.5) * 10) / 10)),
                  () => setZoom(z => Math.max(minZoom, z <= 2 ? Math.round((z - 0.2) * 10) / 10 : Math.round((z - 0.5) * 10) / 10))
                ];
                const toXY = (au, angle) => {
                  const centerX = 0.5; 
                  const centerY = 0.5;
                  const r = (au / system.heliosphere.radiusAU) * 0.92 * zoom;
                  const x = centerX + panOffset.x + r * Math.cos(angle);
                  const y = centerY + panOffset.y + r * Math.sin(angle);
                  return { left: `${x * 100}%`, top: `${y * 100}%` };
                };
                
                // Helper to convert world AU coordinates (x, y) to viewport position
                const worldToViewport = (worldX, worldY) => {
                  const centerX = 0.5; 
                  const centerY = 0.5;
                  const au = Math.sqrt(worldX * worldX + worldY * worldY);
                  const angle = Math.atan2(worldY, worldX);
                  const r = (au / system.heliosphere.radiusAU) * 0.92 * zoom;
                  const x = centerX + panOffset.x + r * Math.cos(angle);
                  const y = centerY + panOffset.y + r * Math.sin(angle);
                  return { x: x * 100, y: y * 100 };
                };
                
                
                // Drag handlers for panning
                const handleMouseDown = (e) => {
                  setPanTransition(false);
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
                
                // Ship marker - holographic circle with rotating ship icon
                const shipPos = toXY(shipPosition.distanceAU, shipPosition.angleRad);
                console.log('Ship render position:', shipPos, 'Ship AU:', shipPosition.distanceAU, 'Angle:', shipPosition.angleRad, 'PanOffset:', panOffset, 'Zoom:', zoom);
                const shipMarker = (
                  <div
                    style={{
                      ...shipPos,
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => { setSelectedPOI('SHIP'); setLockedSelection(true); }}
                  >
                    {/* Holographic circle */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      border: '2px solid rgba(52, 224, 255, 0.9)',
                      background: 'radial-gradient(circle at center, rgba(52, 224, 255, 0.15) 0%, rgba(52, 224, 255, 0.05) 50%, transparent 100%)',
                      boxShadow: '0 0 15px rgba(52, 224, 255, 0.6), inset 0 0 10px rgba(52, 224, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {/* Salvage Ship icon with rotation */}
                      <svg 
                        width="28" 
                        height="28" 
                        viewBox="0 0 24 24" 
                        style={{ 
                          transform: `rotate(${shipRotation}deg)`,
                          transition: 'transform 0.5s ease-out'
                        }}
                      >
                        {/* Main hull */}
                        <path d="M12 4 L16 10 L14 16 L10 16 L8 10 Z" fill="none" stroke="#34e0ff" strokeWidth="1.5" strokeLinejoin="round"/>
                        {/* Cockpit */}
                        <circle cx="12" cy="7" r="2" fill="rgba(52, 224, 255, 0.3)" stroke="#34e0ff" strokeWidth="1"/>
                        {/* Left wing */}
                        <path d="M8 10 L4 12 L6 14 L8 12" fill="none" stroke="#34e0ff" strokeWidth="1.5" strokeLinejoin="round"/>
                        {/* Right wing */}
                        <path d="M16 10 L20 12 L18 14 L16 12" fill="none" stroke="#34e0ff" strokeWidth="1.5" strokeLinejoin="round"/>
                        {/* Engine glow left */}
                        <circle cx="10" cy="16" r="1.5" fill="#34e0ff" opacity="0.6"/>
                        {/* Engine glow right */}
                        <circle cx="14" cy="16" r="1.5" fill="#34e0ff" opacity="0.6"/>
                        {/* Salvage claw left */}
                        <path d="M9 14 L7 18 M7 18 L8 19" stroke="#34e0ff" strokeWidth="1" strokeLinecap="round"/>
                        {/* Salvage claw right */}
                        <path d="M15 14 L17 18 M17 18 L16 19" stroke="#34e0ff" strokeWidth="1" strokeLinecap="round"/>
                      </svg>
                    </div>
                    {showPOINames && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontSize: '9px',
                        color: '#34e0ff',
                        textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                        marginTop: '4px',
                        pointerEvents: 'none'
                      }}>
                        SS-ARKOSE
                      </div>
                    )}
                  </div>
                );
                
                // Ping wave expanding from ship (sensor sweep visualization)
                const pingWave = isPinging ? (() => {
                  const shipPos = toXY(shipPosition.distanceAU, shipPosition.angleRad);
                  // Convert scan radius from AU to viewport percentage using same calculation as toXY
                  const radiusInViewport = (scanPingRadius / system.heliosphere.radiusAU) * 0.92 * zoom;
                  const diameter = radiusInViewport * 2;
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: shipPos.left,
                        top: shipPos.top,
                        transform: 'translate(-50%, -50%)',
                        width: `${diameter * 100}%`,
                        height: `${diameter * 100}%`,
                        border: '2px solid rgba(52, 224, 255, 0.8)',
                        borderRadius: '50%',
                        boxShadow: '0 0 20px rgba(52, 224, 255, 0.6), inset 0 0 20px rgba(52, 224, 255, 0.3)',
                        pointerEvents: 'none',
                        animation: 'pulse 0.5s ease-in-out infinite',
                        zIndex: 5
                      }}
                    />
                  );
                })() : null;
                
                // Sun marker - scales with zoom
                const sunBaseSize = 16; // Base size in pixels
                const sunSize = sunBaseSize * (0.5 + zoom * 0.5); // Scale from 50% to 100% based on zoom
                const sunMarker = (
                  <div 
                    className="map-poi sun" 
                    style={{ 
                      left: `${(0.5 + panOffset.x) * 100}%`, 
                      top: `${(0.5 + panOffset.y) * 100}%`, 
                      transform: 'translate(-50%, -50%)',
                      width: `${sunSize}px`,
                      height: `${sunSize}px`,
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out, width 0.3s ease-out, height 0.3s ease-out' : 'width 0.3s ease-out, height 0.3s ease-out'
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
                
                // Orbits as rings - only show rings for scanned planets
                const planetDistances = system.orbits
                  .filter(o => o.parent.type === 'planet' && scanProgress.includes(o.parent.id))
                  .map(o => o.distanceAU);
                const rings = planetDistances.map((distAU, idx) => {
                  const r = (distAU / system.heliosphere.radiusAU) * 0.92 * zoom; // radius in viewport units
                  const diameter = r * 2; // rings are sized by diameter (width/height)
                  return (
                    <div key={`ring-${idx}`} className="orbit-ring" style={{
                      left: `${(0.5 + panOffset.x) * 100}%`, 
                      top: `${(0.5 + panOffset.y) * 100}%`, 
                      transform: 'translate(-50%, -50%)',
                      width: `${diameter * 100}%`,
                      height: `${diameter * 100}%`,
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out, width 0.8s ease-in-out, height 0.8s ease-in-out' : 'none'
                    }} />
                  );
                });
                
                // Scale rings - dotted circles at regular AU intervals with distance labels
                const scaleRings = showScaleRings ? (() => {
                  const scaleInterval = 10; // AU between each ring
                  const maxAU = system.heliosphere.radiusAU;
                  const numRings = Math.floor(maxAU / scaleInterval);
                  
                  return Array.from({ length: numRings }, (_, idx) => {
                    const distAU = (idx + 1) * scaleInterval;
                    const r = (distAU / system.heliosphere.radiusAU) * 0.92 * zoom;
                    const diameter = r * 2;
                    const centerX = (0.5 + panOffset.x) * 100;
                    const centerY = (0.5 + panOffset.y) * 100;
                    
                    return (
                      <div key={`scale-ring-${idx}`}>
                        {/* Dotted ring */}
                        <div style={{
                          position: 'absolute',
                          left: `${centerX}%`,
                          top: `${centerY}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${diameter * 100}%`,
                          height: `${diameter * 100}%`,
                          border: '1px dotted rgba(52, 224, 255, 0.15)',
                          borderRadius: '50%',
                          pointerEvents: 'none',
                          transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out, width 0.8s ease-in-out, height 0.8s ease-in-out' : 'none',
                          zIndex: 0
                        }} />
                        
                        {/* Left label */}
                        <div style={{
                          position: 'absolute',
                          left: `${centerX - r * 100}%`,
                          top: `${centerY}%`,
                          transform: 'translate(-100%, -50%)',
                          fontSize: `${8 * zoom}px`,
                          color: 'rgba(52, 224, 255, 0.4)',
                          fontWeight: '500',
                          pointerEvents: 'none',
                          padding: '2px 4px',
                          whiteSpace: 'nowrap',
                          transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none',
                          zIndex: 0
                        }}>
                          {distAU} AU
                        </div>
                        
                        {/* Right label */}
                        <div style={{
                          position: 'absolute',
                          left: `${centerX + r * 100}%`,
                          top: `${centerY}%`,
                          transform: 'translate(0%, -50%)',
                          fontSize: `${8 * zoom}px`,
                          color: 'rgba(52, 224, 255, 0.4)',
                          fontWeight: '500',
                          pointerEvents: 'none',
                          padding: '2px 4px',
                          whiteSpace: 'nowrap',
                          transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none',
                          zIndex: 0
                        }}>
                          {distAU} AU
                        </div>
                      </div>
                    );
                  });
                })() : null;
                
                // SVG Icons for different POI types
                const getPOIIcon = (type) => {
                  const size = 24;
                  switch(type.toLowerCase()) {
                    case 'planet':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6"/></svg>;
                    case 'belt':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="8" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="2.5" fill="currentColor"/><circle cx="18" cy="16" r="1" fill="currentColor"/></svg>;
                    case 'orbital':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="8" y="4" width="8" height="16" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="2"/></svg>;
                    case 'habitat':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M 12 4 L 12 20 M 4 12 L 20 12" stroke="currentColor" strokeWidth="1"/></svg>;
                    case 'anomaly':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 12 2 L 16 10 L 24 12 L 16 14 L 12 22 L 8 14 L 0 12 L 8 10 Z" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
                    default:
                      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>;
                  }
                };
                
                const markers = parents.map(p => (
                  <div
                    key={p.id}
                    style={{
                      ...toXY(p.distanceAU, p.angleRad),
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => { if (!lockedSelection) setSelectedPOI(p.id); }}
                    onMouseLeave={() => { if (!lockedSelection) setSelectedPOI(null); }}
                    onClick={(e) => { 
                      e.stopPropagation();
                      setSelectedPOI(p.id); 
                      setLockedSelection(true); 
                    }}
                  >
                    {/* Holographic circle */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: `2px solid ${selectedPOI === p.id ? '#34e0ff' : 'rgba(52, 224, 255, 0.6)'}`,
                      background: selectedPOI === p.id 
                        ? 'radial-gradient(circle, rgba(52, 224, 255, 0.3) 0%, rgba(52, 224, 255, 0.1) 50%, transparent 100%)'
                        : 'radial-gradient(circle, rgba(52, 224, 255, 0.15) 0%, rgba(52, 224, 255, 0.05) 50%, transparent 100%)',
                      boxShadow: selectedPOI === p.id 
                        ? '0 0 20px rgba(52, 224, 255, 0.8), inset 0 0 10px rgba(52, 224, 255, 0.3)'
                        : '0 0 10px rgba(52, 224, 255, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#34e0ff',
                      position: 'relative',
                      transition: 'all 0.3s ease'
                    }}>
                      {getPOIIcon(p.type)}
                    </div>
                    {showPOINames && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontSize: '9px',
                        color: '#34e0ff',
                        textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                        marginTop: '4px',
                        pointerEvents: 'none'
                      }}>
                        {p.name}
                      </div>
                    )}
                  </div>
                ));
                
                // Dropped navigation pins - holographic circle design
                const pinMarkers = droppedPins.map(pin => (
                  <div
                    key={pin.id}
                    style={{
                      ...toXY(pin.distanceAU, pin.angleRad),
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={() => { 
                      if (!lockedSelection) setSelectedPOI(pin.id);
                      setHoveredPin(pin.id);
                    }}
                    onMouseLeave={() => { 
                      if (!lockedSelection) setSelectedPOI(null);
                      setHoveredPin(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPOI(pin.id);
                      setLockedSelection(true);
                    }}
                  >
                    {/* Holographic circle */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '2px solid rgba(52, 224, 255, 0.7)',
                      background: 'radial-gradient(circle at center, rgba(52, 224, 255, 0.2) 0%, rgba(52, 224, 255, 0.08) 50%, transparent 100%)',
                      boxShadow: '0 0 12px rgba(52, 224, 255, 0.6), inset 0 0 8px rgba(52, 224, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      {/* Pin/waypoint icon */}
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path d="M 12 2 L 16 10 L 24 12 L 16 14 L 12 22 L 8 14 L 0 12 L 8 10 Z" fill="none" stroke="rgba(52, 224, 255, 0.9)" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="3" fill="rgba(52, 224, 255, 0.6)" stroke="#34e0ff" strokeWidth="1"/>
                      </svg>
                      
                      {/* Delete button on hover */}
                      {hoveredPin === pin.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDroppedPins(prev => prev.filter(p => p.id !== pin.id));
                            if (selectedPOI === pin.id) {
                              setSelectedPOI(null);
                              setLockedSelection(false);
                            }
                            setHoveredPin(null);
                            setTerminalLog(prev => [...prev, `> Deleted waypoint: ${pin.name}`]);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: '1px solid rgba(255, 80, 80, 0.9)',
                            background: 'rgba(255, 80, 80, 0.3)',
                            color: '#ff5050',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 0 6px rgba(255, 80, 80, 0.6)',
                            zIndex: 10
                          }}
                          title="Delete waypoint"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    {showPOINames && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        whiteSpace: 'nowrap',
                        fontSize: '9px',
                        color: '#34e0ff',
                        textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                        marginTop: '4px',
                        pointerEvents: 'none'
                      }}>
                        {pin.name}
                      </div>
                    )}
                  </div>
                ));
                
                // Sequence waypoint markers
                const sequenceWaypoints = sequenceSteps.length > 0 ? (
                  <>
                    {/* Waypoint markers */}
                    {sequenceSteps.map((step, index) => {
                      const viewportPos = worldToViewport(step.x, step.y);
                      const circleSize = 80 * zoom;
                      const iconSize = 36 * zoom;
                      const numberSize = 16 * zoom;
                      
                      const color = step.status === 'executed' ? '#52ffa8' : step.status === 'in-progress' ? '#ffc864' : '#34e0ff';
                      const colorRgba = step.status === 'executed' ? 'rgba(82, 255, 168' : step.status === 'in-progress' ? 'rgba(255, 200, 100' : 'rgba(52, 224, 255';
                      
                      // Get icon based on action
                      const getIcon = () => {
                        switch(step.action) {
                          case 'Move To': return '➤';
                          case 'Scan': return '◉';
                          case 'Mine': return '⚏';
                          case 'Investigate': return '🔍';
                          default: return '•';
                        }
                      };
                      
                      return (
                        <div
                          key={`waypoint-${index}`}
                          style={{
                            left: `${viewportPos.x}%`,
                            top: `${viewportPos.y}%`,
                            position: 'absolute',
                            transform: 'translate(-50%, -50%)',
                            transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none',
                            zIndex: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: `${4 * zoom}px`
                          }}
                        >
                          {/* Sequence number on top */}
                          <div style={{
                            fontSize: `${numberSize}px`,
                            fontWeight: 'bold',
                            color: color,
                            textShadow: `0 0 8px ${colorRgba}, 0.8)`,
                            fontFamily: 'monospace'
                          }}>
                            {index + 1}
                          </div>
                          
                          {/* Waypoint circle with centered icon */}
                          <div style={{
                            width: `${circleSize}px`,
                            height: `${circleSize}px`,
                            borderRadius: '50%',
                            border: `${Math.max(2, 3 * zoom)}px solid ${color}`,
                            background: `radial-gradient(circle at center, ${colorRgba}, 0.4) 0%, ${colorRgba}, 0.2) 40%, rgba(0, 30, 50, 0.95) 100%)`,
                            boxShadow: `0 0 20px ${colorRgba}, 0.8), inset 0 0 20px ${colorRgba}, 0.3)`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: `${iconSize}px`,
                            color: color
                          }}>
                            {getIcon()}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : null;
                
                const markers_old = parents.map(p => (
                  <div
                    key={p.id}
                    className={`map-poi ${p.type} ${shapeForType(p.type)} ${selectedPOI === p.id ? 'selected' : ''}`}
                    style={{
                      ...toXY(p.distanceAU, p.angleRad),
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none'
                    }}
                    onMouseEnter={() => { if (!lockedSelection) setSelectedPOI(p.id); }}
                    onMouseLeave={() => { if (!lockedSelection) setSelectedPOI(null); }}
                    onClick={() => { setSelectedPOI(p.id); setLockedSelection(true); }}
                  >
                    <div className="poi-tooltip">{p.name} — {p.distanceAU.toFixed(2)} AU</div>
                  </div>
                ));
                // Highlight circle for selected POI or pin
                const highlightCircle = selectedPOI && selectedPOI !== 'SUN' ? (() => {
                  let poi = parents.find(p => p.id === selectedPOI);
                  if (!poi) poi = droppedPins.find(p => p.id === selectedPOI);
                  if (!poi) return null;
                  const pos = toXY(poi.distanceAU, poi.angleRad);
                  return (
                    <div
                      className="poi-highlight-circle"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        transform: 'translate(-50%, -50%)',
                        transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none'
                      }}
                    />
                  );
                })() : null;
                
                // Off-screen indicator for selected POI or pin
                const offScreenIndicator = selectedPOI && selectedPOI !== 'SUN' ? (() => {
                  let poi = parents.find(p => p.id === selectedPOI);
                  if (!poi) poi = droppedPins.find(p => p.id === selectedPOI);
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
                return (<>
                  <div 
                    onMouseDown={handleMouseDown}
                    onMouseMove={(e) => {
                      handleMouseMove(e);
                      const rect = e.currentTarget.getBoundingClientRect();
                      handleMapMouseMove(e, rect);
                    }}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      
                      // Handle sequence waypoint creation - show action menu
                      if (sequenceWaypointCallback) {
                        const clickX = e.clientX;
                        const clickY = e.clientY;
                        setShowActionMenu({
                          x: clickX,
                          y: clickY,
                          worldX: cursorWorldPos.x,
                          worldY: cursorWorldPos.y
                        });
                        return;
                      }
                      
                      // Handle drop pin mode
                      if (dropPinMode) {
                        handleDropPin(e, rect);
                      }
                    }}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      bottom: 0,
                      cursor: sequenceWaypointCallback
                        ? 'crosshair'
                        : dropPinMode 
                        ? (isOutsideHeliosphere ? 'not-allowed' : 'crosshair')
                        : (isDragging ? 'grabbing' : 'grab')
                    }}
                  >
                    {/* Cursor position and warning indicator */}
                    {(dropPinMode || sequenceWaypointCallback) && (
                      <div style={{
                        position: 'absolute',
                        left: 10,
                        bottom: 10,
                        padding: '8px 12px',
                        background: sequenceWaypointCallback 
                          ? 'rgba(52, 224, 255, 0.9)'
                          : isOutsideHeliosphere ? 'rgba(255, 50, 50, 0.9)' : 'rgba(0, 20, 40, 0.9)',
                        border: `1px solid ${sequenceWaypointCallback ? '#34e0ff' : isOutsideHeliosphere ? '#ff0000' : '#34e0ff'}`,
                        borderRadius: '4px',
                        fontSize: '10px',
                        color: '#fff',
                        zIndex: 10
                      }}>
                        {sequenceWaypointCallback
                          ? `🎯 SEQUENCE MODE - Click to add waypoint: (${cursorWorldPos.x.toFixed(2)}, ${cursorWorldPos.y.toFixed(2)}) AU`
                          : isOutsideHeliosphere 
                          ? '⚠ OUTSIDE HELIOSPHERE - CANNOT NAVIGATE'
                          : `Position: (${cursorWorldPos.x.toFixed(2)}, ${cursorWorldPos.y.toFixed(2)}) AU`
                        }
                      </div>
                    )}
                    
                    <div style={{ position: 'absolute', right: 10, top: 35, display: 'flex', gap: 6, zIndex: 2 }}>
                      <button className="small-btn" onClick={zoomOut}>-</button>
                      <span className="ui-small text-muted">{(zoom*100).toFixed(0)}%</span>
                      <button className="small-btn" onClick={zoomIn}>+</button>
                      <button className="small-btn" onClick={centerOnShip} title="Reset view to ship">⊙</button>
                    </div>
                    {/* Heliosphere background - faint glow distinguishing solar system from deep space */}
                    <div style={{
                      position: 'absolute',
                      left: `${(0.5 + panOffset.x) * 100}%`,
                      top: `${(0.5 + panOffset.y) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${(system.heliosphere.radiusAU / system.heliosphere.radiusAU) * 0.92 * zoom * 2 * 100}%`,
                      height: `${(system.heliosphere.radiusAU / system.heliosphere.radiusAU) * 0.92 * zoom * 2 * 100}%`,
                      borderRadius: '50%',
                      background: 'radial-gradient(circle at center, rgba(52, 224, 255, 0.03) 0%, rgba(52, 224, 255, 0.015) 50%, transparent 70%)',
                      border: '1px solid rgba(52, 224, 255, 0.15)',
                      boxShadow: 'inset 0 0 80px rgba(52, 224, 255, 0.08)',
                      pointerEvents: 'none',
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out, width 0.8s ease-in-out, height 0.8s ease-in-out' : 'none',
                      zIndex: 0
                    }} />
                    {scaleRings}
                    {rings}
                    {pingWave}
                    {shipMarker}
                    {sunMarker}
                    {markers}
                    {pinMarkers}
                    {sequenceWaypoints}
                    {highlightCircle}
                    {offScreenIndicator}
                  </div>
                </>);
              })()}
            </div>
          </div>

          {/* Right 1/3: Tabbed Interface */}
          <div style={{ flex: 1, marginTop: '25px' }}>
            <RightPanelTabs
              system={system}
              shipPosition={shipPosition}
              pois={pois}
              droppedPins={droppedPins}
              scanProgress={scanProgress}
              selectedPOI={selectedPOI}
              setSelectedPOI={setSelectedPOI}
              setLockedSelection={setLockedSelection}
              centerOnPOI={centerOnPOI}
              moveShipTo={moveShipTo}
              isMoving={isMoving}
              movementProgress={movementProgress}
              scanningActive={scanningActive}
              startSystemScan={startSystemScan}
              shipState={shipState}
              onSequenceWaypointAdd={(callback) => setSequenceWaypointCallback(() => callback)}
              sequenceSteps={sequenceSteps}
              setSequenceSteps={setSequenceSteps}
              resetToDefaultView={resetToDefaultView}
            />
          </div>
        </div>
      )}        {/* Actions Panel - shows when near POIs */}
        <ActionsPanel
          system={system}
          shipPosition={shipPosition}
          pois={pois}
          onActionExecute={handleActionExecute}
        />

        {/* Terminal Modal for action results */}
        {showTerminalModal && (
          <TerminalModal
            content={terminalModalContent}
            onClose={() => setShowTerminalModal(false)}
          />
        )}

        {/* Action Selection Menu for Sequence Waypoints */}
        {showActionMenu && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowActionMenu(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: showActionMenu.x,
                top: showActionMenu.y,
                background: 'rgba(0, 20, 40, 0.98)',
                border: '2px solid #34e0ff',
                borderRadius: '6px',
                padding: '12px',
                minWidth: '200px',
                boxShadow: '0 0 30px rgba(52, 224, 255, 0.6)',
                transform: 'translate(-50%, -100%) translateY(-10px)'
              }}
            >
              <div style={{
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#34e0ff',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(52, 224, 255, 0.3)',
                textAlign: 'center'
              }}>
                SELECT ACTION
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <button
                  onClick={() => {
                    if (sequenceWaypointCallback) {
                      sequenceWaypointCallback(showActionMenu.worldX, showActionMenu.worldY, 'Move To');
                    }
                    setShowActionMenu(null);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    color: '#34e0ff',
                    fontSize: '9px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                  }}
                >
                  🚀 Move To
                </button>
                
                <button
                  onClick={() => {
                    if (sequenceWaypointCallback) {
                      sequenceWaypointCallback(showActionMenu.worldX, showActionMenu.worldY, 'Scan');
                    }
                    setShowActionMenu(null);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    color: '#34e0ff',
                    fontSize: '9px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                  }}
                >
                  🔍 Scan System
                </button>

                <button
                  onClick={() => {
                    if (sequenceWaypointCallback) {
                      sequenceWaypointCallback(showActionMenu.worldX, showActionMenu.worldY, 'Mine');
                    }
                    setShowActionMenu(null);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    color: '#34e0ff',
                    fontSize: '9px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                  }}
                >
                  ⛏ Mine Resources
                </button>

                <button
                  onClick={() => {
                    if (sequenceWaypointCallback) {
                      sequenceWaypointCallback(showActionMenu.worldX, showActionMenu.worldY, 'Investigate');
                    }
                    setShowActionMenu(null);
                  }}
                  style={{
                    padding: '8px 12px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    color: '#34e0ff',
                    fontSize: '9px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                  }}
                >
                  ❓ Investigate
                </button>
                
                <div style={{
                  borderTop: '1px solid rgba(52, 224, 255, 0.3)',
                  margin: '8px 0 4px 0'
                }} />
                
                <button
                  onClick={() => setShowActionMenu(null)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(255, 80, 80, 0.1)',
                    border: '1px solid rgba(255, 80, 80, 0.4)',
                    borderRadius: '4px',
                    color: '#ff5050',
                    fontSize: '9px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 80, 80, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 80, 80, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 80, 80, 0.4)';
                  }}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ShipCommandConsole;
