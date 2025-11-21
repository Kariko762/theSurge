import { useMemo, useState, useEffect, useRef } from 'react'
import { generateSystem, exampleSeeds, calculateTotalRisk, calculateStaticExposure, calculateWakeSignature } from '../lib/systemGenerator.js'
import { generateSystemV2, flattenPOIs } from '../lib/systemGeneratorV2.js'
import { getGameTime } from '../lib/timeAdapter.js'
import { calculateShipAttributes, DEFAULT_SHIP_LOADOUT, DEFAULT_POWER_ALLOCATION, COMPONENTS } from '../lib/shipComponents.js'
import { getShipState } from '../lib/shipState.js'
import { loadGalaxy } from '../lib/galaxyLoader.js'
import { getScheduler } from '../lib/scheduler.js'
import { getUniverseTime } from '../lib/universeTime.js'
import { TIME_SCALES } from '../lib/timeScalePresets.js'
import GlobalSettingsMenu from './GlobalSettingsMenu.jsx'
import ActionsPanel from './ActionsPanel.jsx'
import TerminalModal from './TerminalModal.jsx'
import TerminalFeed from './TerminalFeed.jsx'
import { executeDREAction, executeAsteroidScan, executeAsteroidMine, executeAsteroidRecovery } from '../lib/dre/engine.js'

/**
 * TimeControlBar - Minimal time control integrated into ship console
 * Format: [pause icon] > >> >>> // DAY 00 | HH:MM:SS
 */
function TimeControlBar() {
  const [isPaused, setIsPaused] = useState(false);
  const [timeScale, setTimeScale] = useState(TIME_SCALES.FAST);
  const [currentTime, setCurrentTime] = useState('');
  const universeTime = getUniverseTime();
  const scheduler = getScheduler();
  const instanceId = useRef(`timebar_${Date.now()}_${Math.random()}`).current;
  const eventType = `timebar_update_${instanceId}`;

  // Initialize time scale on mount
  useEffect(() => {
    if (universeTime.getTimeScale() !== TIME_SCALES.FAST) {
      universeTime.setTimeScale(TIME_SCALES.FAST);
    }
  }, []);

  // Update time display - self-scheduling like LiveClock
  useEffect(() => {
    let currentEventId = null;
    let isActive = true;

    const scheduleNextUpdate = () => {
      if (!isActive) return;
      currentEventId = scheduler.schedule(eventType, 1.0, {}); // 1 universe second
    };

    const handleUpdate = () => {
      if (!isActive) return;
      setCurrentTime(getGameTime().formatGameTime());
      scheduleNextUpdate();
    };

    const unsub = scheduler.on(eventType, handleUpdate);
    
    // Initial update and schedule first event
    setCurrentTime(getGameTime().formatGameTime());
    scheduleNextUpdate();

    return () => {
      isActive = false;
      unsub();
      if (currentEventId) scheduler.cancel(currentEventId);
    };
  }, [eventType]);

  // Listen for pause/resume events
  useEffect(() => {
    const handlePause = () => setIsPaused(true);
    const handleResume = () => setIsPaused(false);
    const handleScale = ({ scale }) => setTimeScale(scale);

    const unsub1 = universeTime.on('pause', handlePause);
    const unsub2 = universeTime.on('resume', handleResume);
    const unsub3 = universeTime.on('scale', handleScale);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, []);

  // SPACE key for pause/resume
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.code === 'Space') {
        e.preventDefault();
        if (isPaused) {
          universeTime.resume();
        } else {
          universeTime.pause();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPaused]);

  const setSpeed = (scale) => {
    if (isPaused) universeTime.resume();
    universeTime.setTimeScale(scale);
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '12px',
      fontSize: '11px', 
      color: '#34e0ff', 
      fontWeight: 'bold', 
      letterSpacing: '0.5px' 
    }}>
      {/* Pause button */}
      <button
        onClick={() => isPaused ? universeTime.resume() : universeTime.pause()}
        title={isPaused ? 'Resume (SPACE)' : 'Pause (SPACE)'}
        style={{
          background: 'transparent',
          border: 'none',
          color: isPaused ? '#ff6b6b' : '#34e0ff',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '0 4px',
          opacity: isPaused ? 1 : 0.6,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = isPaused ? '1' : '0.6'}
      >
        {isPaused ? '⏸' : '▶'}
      </button>

      {/* Speed controls */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={() => setSpeed(TIME_SCALES.NORMAL)}
          title="1x Normal Speed"
          style={{
            background: 'transparent',
            border: 'none',
            color: timeScale === TIME_SCALES.NORMAL && !isPaused ? '#34e0ff' : '#666',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0',
            opacity: timeScale === TIME_SCALES.NORMAL && !isPaused ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = (timeScale === TIME_SCALES.NORMAL && !isPaused) ? '1' : '0.5'}
        >
          &gt;
        </button>
        
        <button
          onClick={() => setSpeed(TIME_SCALES.FAST)}
          title="5x Fast Speed"
          style={{
            background: 'transparent',
            border: 'none',
            color: timeScale === TIME_SCALES.FAST && !isPaused ? '#34e0ff' : '#666',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0',
            opacity: timeScale === TIME_SCALES.FAST && !isPaused ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = (timeScale === TIME_SCALES.FAST && !isPaused) ? '1' : '0.5'}
        >
          &gt;&gt;
        </button>
        
        <button
          onClick={() => setSpeed(TIME_SCALES.ULTRA_FAST)}
          title="50x Ultra Fast Speed"
          style={{
            background: 'transparent',
            border: 'none',
            color: timeScale === TIME_SCALES.ULTRA_FAST && !isPaused ? '#34e0ff' : '#666',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '0',
            opacity: timeScale === TIME_SCALES.ULTRA_FAST && !isPaused ? 1 : 0.5,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '1'}
          onMouseLeave={(e) => e.target.style.opacity = (timeScale === TIME_SCALES.ULTRA_FAST && !isPaused) ? '1' : '0.5'}
        >
          &gt;&gt;&gt;
        </button>
      </div>

      {/* Time display */}
      <div style={{ opacity: isPaused ? 0.5 : 1 }}>
        {currentTime}
      </div>
    </div>
  );
}

/**
 * FRAME 3: Ship Command Console - Ship Run View
 * Simplified terminal output with power management and system controls
 */

const ShipCommandConsole = ({ onNavigate, initialSeed, initialPosition, devMode, onDevModeToggle, onCreateGalaxy }) => {
  const [activeTab, setActiveTab] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [selectedChildPOI, setSelectedChildPOI] = useState(null); // Track selected child POI separately
  const [hoveredPOI, setHoveredPOI] = useState(null); // Track hover separately from selection
  const [hoveredChildPOI, setHoveredChildPOI] = useState(null); // Track hovered child in the orbital menu
  const [lockedSelection, setLockedSelection] = useState(false);
  const [expandedPOIs, setExpandedPOIs] = useState(new Set()); // Track which POIs show their children
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
  // Structured terminal events: each event collates conversational (AI speech) and data stream output
  // { id, type: 'scan'|'movement'|'mining'|..., timestamp, conversational:[], stream:[], meta:{} }
  const [terminalEvents, setTerminalEvents] = useState([]);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [movementProgress, setMovementProgress] = useState(0);
  const [scanPingRadius, setScanPingRadius] = useState(0); // Current ping radius in AU
  const [isPinging, setIsPinging] = useState(false); // Is ping animation active
  const [pingOpacity, setPingOpacity] = useState(1); // Ping opacity for fade-out
  const [cursorWorldPos, setCursorWorldPos] = useState({ x: 0, y: 0 }); // Cursor position in AU
  const [isOutsideHeliosphere, setIsOutsideHeliosphere] = useState(false);
  const [droppedPins, setDroppedPins] = useState([]); // Array of {id, x, y, name}
  const [dropPinMode, setDropPinMode] = useState(false); // Is user in drop pin mode
  const [showPOINames, setShowPOINames] = useState(true);
  const [showScaleRings, setShowScaleRings] = useState(false); // Show distance scale rings
  const mapCanvasRef = useRef(null); // Ref to get actual canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0, minDim: 0 });
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.25); // Background image opacity (0-1)
  const [showShip, setShowShip] = useState(true);
  const [showPlanets, setShowPlanets] = useState(true);
  const [showOrbitals, setShowOrbitals] = useState(true);
  const [showMoons, setShowMoons] = useState(true);
  const [showAsteroidClusters, setShowAsteroidClusters] = useState(true);
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [showHabitats, setShowHabitats] = useState(true);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showRadiation, setShowRadiation] = useState(false); // Radiation overlay OFF by default
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
  const [showFuelWarning, setShowFuelWarning] = useState(false); // Fuel warning modal
  const [pendingMovement, setPendingMovement] = useState(null); // {target, angle, callback, distance, fuelNeeded}
  const [miningInProgress, setMiningInProgress] = useState(null); // {clusterId, poiId, progress: 0-100, startTime}
  const [showInventoryWithTerminal, setShowInventoryWithTerminal] = useState(false); // Show inventory alongside terminal for drag-drop
  const [currentLootItems, setCurrentLootItems] = useState([]); // Loot from current mining operation
  const [terminalInteractive, setTerminalInteractive] = useState(false); // Terminal modal interactive mode
  const [terminalChoices, setTerminalChoices] = useState([]); // Interactive choices for terminal modal
  const [currentMiningPOI, setCurrentMiningPOI] = useState(null); // Current POI being mined
  const [scanningInProgress, setScanningInProgress] = useState(null); // {poiId, progress: 0-100, startTime}
  const [scanFailureNotification, setScanFailureNotification] = useState(null); // {poiId, message, roll}
  const [contextualMenu, setContextualMenu] = useState(null); // {targetId, targetType: 'poi'|'ship'|'sun'}
  const [childContextualMenu, setChildContextualMenu] = useState(null); // {targetId, targetType: 'poi'} for child POIs
  const [hoveredAction, setHoveredAction] = useState(null); // Hovered action in contextual menu
  const mapRef = useRef(null); // ref for map canvas to compute accurate pixel anchoring
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
    // Use V2 generator
    const generated = generateSystemV2(seedInput);
    console.log(`[SEED: ${seedInput}] Generated system V2:`, {
      star: generated.star.class,
      heliosphere: generated.heliosphere.radiusAU.toFixed(2),
      poiCount: generated.pois.length,
      orbitalCount: generated.metadata.orbitalCount,
      radius: generated.radius.toFixed(2)
    });
    return generated;
  }, [seedInput]);
  
  // Sync ship position on mount and center view
  useEffect(() => {
    if (system) {
      // Determine spawn position
      let spawnDistanceAU, spawnAngleRad;
      
      if (initialPosition) {
        // Use provided spawn position (from DevPanel launch options)
        spawnDistanceAU = initialPosition.distanceAU;
        spawnAngleRad = initialPosition.angleRad;
      } else {
        // Default spawn: edge of heliosphere
        const edgeAU = system.heliosphere.radiusAU * 0.95;
        spawnDistanceAU = edgeAU;
        spawnAngleRad = Math.PI * 0.25;
      }
      
      shipState.setPosition(spawnDistanceAU, spawnAngleRad);
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

  // No longer need to subscribe for time updates - the LiveClock component handles its own updates
  // Parent component only re-renders on meaningful events (user interaction, scheduled gameplay events)
  useEffect(() => {
    // Initialize scheduler and universe time
    const scheduler = getScheduler();
    const universeTime = getUniverseTime();
    
    // Initialize universe time
    universeTime.init();
    
    // Start the scheduler
    scheduler.start();
    
    // Enable verbose logging (optional - comment out to reduce console noise)
    // universeTime.setVerbose(true);
    // scheduler.setVerbose(true);
    
    console.log('[ShipCommandConsole] Scheduler and UniverseTime initialized');
  }, []);

  // Simple travel state
  const [activeTravel, setActiveTravel] = useState(null); // {startTime, targetX, targetY, targetName, distance, startPosition, onComplete, accelerationTime: 2.0}
  const [travelAnimationTick, setTravelAnimationTick] = useState(0); // Force re-render during travel

  // Travel completion scheduled event (PULL model - UI reads progress on render)
  useEffect(() => {
    if (!activeTravel) return;
    
    const scheduler = getScheduler();
    const { distance, targetX, targetY, startPosition, targetName } = activeTravel;
    const maxSpeedAUPerSec = 2; // Max speed: 2 AU/s in universe time
    const accelerationTime = activeTravel.accelerationTime || 2.0; // Time to reach max speed (universe seconds)
    const decelerationDistance = maxSpeedAUPerSec * accelerationTime * 0.5; // Distance needed to decelerate
    
    // Calculate total travel duration with acceleration/deceleration
    const accelerationDistance = maxSpeedAUPerSec * accelerationTime * 0.5; // area under triangle (0.5 * base * height)
    const cruiseDistance = Math.max(0, distance - accelerationDistance - decelerationDistance);
    const cruiseDuration = cruiseDistance / maxSpeedAUPerSec;
    const travelDuration = accelerationTime + cruiseDuration + accelerationTime; // accel + cruise + decel
    
    // Smooth animation using requestAnimationFrame (60 FPS)
    let animationFrameId;
    const animate = () => {
      setTravelAnimationTick(t => t + 1);
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    
    const completeTravel = () => {
      shipState.setPosition(Math.sqrt(targetX*targetX + targetY*targetY), Math.atan2(targetY, targetX));
      shipState.setVelocity(0);
      
      // Consume all fuel at once on arrival
      const pelletsPerAU = 2.5;
      const totalPelletsNeeded = Math.ceil(distance * pelletsPerAU);
      shipState.consumePellets(totalPelletsNeeded);
      
      setActiveTravel(null);
      setIsMoving(false);
      setMovementProgress(0);
      setShipStateVersion(v => v + 1);
      setTerminalLog(prev => [...prev, `> ARIA: Arrived at ${targetName}`]);
      if (activeTravel.onComplete) activeTravel.onComplete();
    };
    
    const completeUnsubscribe = scheduler.on('travel_complete', completeTravel);
    const eventId = scheduler.schedule('travel_complete', travelDuration);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      completeUnsubscribe();
      if (eventId) scheduler.cancel(eventId);
    };
  }, [activeTravel]);

  // Track canvas dimensions for proper aspect ratio in circles
  useEffect(() => {
    if (!mapCanvasRef.current) return;
    
    const updateDimensions = () => {
      const rect = mapCanvasRef.current.getBoundingClientRect();
      const minDim = Math.min(rect.width, rect.height);
      setCanvasDimensions({
        width: rect.width,
        height: rect.height,
        minDim: minDim
      });
    };
    
    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(mapCanvasRef.current);
    
    return () => resizeObserver.disconnect();
  }, []);

  // Ship position from ship state
  const shipPosition = useMemo(() => {
    if (!system) return { distanceAU: 0, angleRad: 0, x: 0, y: 0 };
    
    // If actively traveling, interpolate position between start and target
    if (activeTravel) {
      const maxSpeedAUPerSec = 2;
      const accelerationTime = activeTravel.accelerationTime || 2.0;
      const now = getUniverseTime().getTime();
      const elapsed = now - activeTravel.startTime;
      
      // Calculate distance traveled using velocity curve
      // Phase 1: Acceleration (0 to accelerationTime) - linearly increase from 0 to maxSpeed
      // Phase 2: Cruise (accelerationTime to totalTime - accelerationTime) - constant maxSpeed
      // Phase 3: Deceleration (totalTime - accelerationTime to totalTime) - linearly decrease to 0
      
      const accelerationDistance = maxSpeedAUPerSec * accelerationTime * 0.5; // area under triangle
      const decelerationDistance = accelerationDistance;
      const cruiseDistance = Math.max(0, activeTravel.distance - accelerationDistance - decelerationDistance);
      const cruiseDuration = cruiseDistance / maxSpeedAUPerSec;
      const totalTime = accelerationTime + cruiseDuration + accelerationTime;
      
      let distanceTraveled = 0;
      
      if (elapsed < accelerationTime) {
        // Acceleration phase: v(t) = (maxSpeed / accelTime) * t
        // distance = 0.5 * a * t^2 = 0.5 * (maxSpeed / accelTime) * t^2
        distanceTraveled = 0.5 * (maxSpeedAUPerSec / accelerationTime) * elapsed * elapsed;
      } else if (elapsed < accelerationTime + cruiseDuration) {
        // Cruise phase: constant maxSpeed
        const cruiseElapsed = elapsed - accelerationTime;
        distanceTraveled = accelerationDistance + maxSpeedAUPerSec * cruiseElapsed;
      } else if (elapsed < totalTime) {
        // Deceleration phase: mirror of acceleration
        const decelElapsed = elapsed - accelerationTime - cruiseDuration;
        const decelRemaining = accelerationTime - decelElapsed;
        const decelDistanceTraveled = decelerationDistance - (0.5 * (maxSpeedAUPerSec / accelerationTime) * decelRemaining * decelRemaining);
        distanceTraveled = accelerationDistance + cruiseDistance + decelDistanceTraveled;
      } else {
        // Travel complete
        distanceTraveled = activeTravel.distance;
      }
      
      // Lerp between start and target based on distance traveled
      const progress = Math.min(distanceTraveled / activeTravel.distance, 1);
      const currentX = activeTravel.startPosition.x + (activeTravel.targetX - activeTravel.startPosition.x) * progress;
      const currentY = activeTravel.startPosition.y + (activeTravel.targetY - activeTravel.startPosition.y) * progress;
      const distanceAU = Math.sqrt(currentX * currentX + currentY * currentY);
      const angleRad = Math.atan2(currentY, currentX);
      
      return { distanceAU, angleRad, x: currentX, y: currentY };
    }
    
    return currentShipState.position;
  }, [system, currentShipState.position, activeTravel, travelAnimationTick]);

  // Passive hull damage from static exposure (damage-over-time) - scheduled
  useEffect(() => {
    if (!system || !shipPosition || gamePhase !== 'scanning') return;
    
    const scheduler = getScheduler();
    const applyRadiationDamage = () => {
      const exposure = calculateStaticExposure(system, shipPosition.distanceAU);
      
      if (exposure > 10) {
        const damagePerSecond = (exposure - 10) * 0.01;
        shipState.damageHull(damagePerSecond);
        setShipStateVersion(v => v + 1);
        
        if (exposure > 50 && Math.random() < 0.05) {
          setTerminalLog(prev => [
            ...prev,
            `> WARNING: Critical static exposure (${exposure.toFixed(1)} mSv/h). Hull integrity degrading.`
          ]);
        }
      }
      
      // Schedule next damage tick in 1 second universe time
      scheduler.schedule('radiation_damage', 1.0);
    };
    
    const unsubscribe = scheduler.on('radiation_damage', applyRadiationDamage);
    scheduler.schedule('radiation_damage', 1.0); // Start the loop
    
    return () => {
      unsubscribe();
      // No need to cancel - unsubscribe removes handler, events will fire harmlessly
    };
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
    
    // Calculate distance from center in viewport units (same as toXY uses)
    // toXY: r = (au / heliosphereRadiusAU) * 0.92 * zoom
    // So cursor r_normalized should be compared to 0.92 * zoom (the heliosphere radius in viewport)
    const r_normalized = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
    const heliosphereRadiusViewport = 0.92 * zoom;
    
    // Check if cursor is outside the heliosphere boundary
    const isOutside = r_normalized > heliosphereRadiusViewport;
    setIsOutsideHeliosphere(prev => prev === isOutside ? prev : isOutside);
    
    // Also calculate world coordinates for pin dropping
    // Reverse the toXY transformation: distanceAU = (r / (0.92 * zoom)) * heliosphereRadiusAU
    const heliosphereRadiusAU = system?.heliosphere?.radiusAU || 50;
    const distanceFromCenterAU = (r_normalized / (0.92 * zoom)) * heliosphereRadiusAU;
    const angle = Math.atan2(normalizedY, normalizedX);
    const worldX = distanceFromCenterAU * Math.cos(angle);
    const worldY = distanceFromCenterAU * Math.sin(angle);
    setCursorWorldPos(prev => {
      // Only update if position changed significantly (avoid re-render on tiny movements)
      const dx = Math.abs(prev.x - worldX);
      const dy = Math.abs(prev.y - worldY);
      return (dx > 0.01 || dy > 0.01) ? { x: worldX, y: worldY } : prev;
    });
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
  
  // Confirm and execute pending movement (after fuel warning)
  const confirmMovement = () => {
    if (!pendingMovement) return;
    setShowFuelWarning(false);
    const { targetPOIorAU, targetAngle, onComplete } = pendingMovement;
    setPendingMovement(null);
    // Call moveShipTo again but it will skip the warning since we've consumed the pending state
    executeMovement(targetPOIorAU, targetAngle, onComplete);
  };
  
  // Cancel pending movement
  const cancelMovement = () => {
    setShowFuelWarning(false);
    setPendingMovement(null);
    setTerminalLog(prev => [...prev, '> ARIA: Navigation cancelled. Fuel reserves too low.']);
  };
  
  // Execute movement without fuel warning check (internal use only)
  const executeMovement = (targetPOIorAU, targetAngle = null, onComplete = null) => {
    if (!system || isMoving) return;
    
    let targetX, targetY, targetName;
    
    // Check if we received coordinates (AU, angle) or POI ID
    if (typeof targetPOIorAU === 'number' && targetAngle !== null) {
      targetX = targetPOIorAU * Math.cos(targetAngle);
      targetY = targetPOIorAU * Math.sin(targetAngle);
      targetName = `Waypoint (${targetPOIorAU.toFixed(2)} AU)`;
    } else {
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

    const currentPos = shipState.getState().position;
    const distance = Math.sqrt(
      Math.pow(targetX - currentPos.x, 2) + Math.pow(targetY - currentPos.y, 2)
    );
    
    const dx = targetX - currentPos.x;
    const dy = targetY - currentPos.y;
    const rotationAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
    setShipRotation(rotationAngle);
    
    // Continue with physics calculations and movement...
    const pelletsPerAU = 2.5;
    const totalPelletsNeeded = Math.ceil(distance * pelletsPerAU);
    const currentFuel = shipState.getState().fuelPellets;
    
    // Check if we have enough fuel (final check)
    if (currentFuel < totalPelletsNeeded) {
      setTerminalLog(prev => [...prev, 
        `> ARIA: Insufficient fuel for this maneuver.`,
        `> Required: ${totalPelletsNeeded} H3-Pellets`,
        `> Available: ${currentFuel} H3-Pellets`,
        `> ARIA: Course plotting aborted.`
      ]);
      return;
    }
    
    // Ship speed: 2 AU/s in universe time
    const speedAUPerSec = 2;
    const travelTimeSeconds = distance / speedAUPerSec;
    
    setTerminalLog(prev => [...prev,
      `> ARIA: Plotting course to ${targetName}...`,
      `> Distance: ${distance.toFixed(2)} AU`,
      `> Velocity: ${speedAUPerSec.toFixed(2)} AU/sec`,
      `> Estimated travel time: ${travelTimeSeconds.toFixed(1)}s (universe time)`,
      `> Fuel (est): ${totalPelletsNeeded} H3-Pellets`,
      `> Engines engaged...`]);
    setIsMoving(true);
    setMovementProgress(0);
    
    setActiveTravel({
      startTime: getUniverseTime().getTime(),
      distance,
      targetX,
      targetY,
      targetName,
      startPosition: { x: currentPos.x, y: currentPos.y },
      pelletsConsumed: 0,
      onComplete
    });
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

    // Get fresh position from shipState to avoid stale closure issues
    const currentPos = shipState.getState().position;
    const distance = Math.sqrt(
      Math.pow(targetX - currentPos.x, 2) + Math.pow(targetY - currentPos.y, 2)
    );
    
    // Calculate rotation angle (pointing towards target)
    const dx = targetX - currentPos.x;
    const dy = targetY - currentPos.y;
    const rotationAngle = (Math.atan2(dy, dx) * 180 / Math.PI) + 90; // +90 to point up by default
    setShipRotation(rotationAngle);
    
    // Calculate fuel needed before movement
    const pelletsPerAU = 2.5;
    const totalPelletsNeeded = Math.ceil(distance * pelletsPerAU);
    const currentFuel = shipState.getState().fuelPellets;
    const maxFuel = shipState.getState().maxFuelPellets;
    const fuelPercentage = (currentFuel / maxFuel) * 100;
    
    // Check if fuel is critically low (below 25%) and show warning
    if (fuelPercentage <= 25 && currentFuel >= totalPelletsNeeded) {
      setPendingMovement({ 
        targetPOIorAU, 
        targetAngle, 
        onComplete,
        targetX,
        targetY,
        targetName,
        distance, 
        fuelNeeded: totalPelletsNeeded,
        currentFuel,
        fuelPercentage 
      });
      setShowFuelWarning(true);
      return;
    }
    
    // If fuel is OK or above threshold, proceed with movement
    executeMovement(targetPOIorAU, targetAngle, onComplete);
  };
  const startSystemScan = () => {
    if (scanningActive) return;
    setScanningActive(true);
    setIsPinging(true);
    setScanPingRadius(0);
    setPingOpacity(1);
    
    // Build structured event containers
    const conversational = [];
    const stream = [];
    conversational.push(`> Initiating Sensor Sweep, current range is ${shipAttributes.sensorRange} AU`);
    stream.push('> Initializing Sensor Sweep');
    stream.push(`> Sensor Range: ${shipAttributes.sensorRange} AU`);
    stream.push(`> Zone: ${system.galactic.zone} | Surge Radiation: ${system.galactic.surgeBase.toFixed(1)} mSv/h`);
    stream.push(`> Star Class ${system.star.class} | Luminosity ${system.star.luminosity.toFixed(2)} | Stellar Protection ${system.star.stellarProtection.toFixed(2)}`);
    setTerminalLog(prev => [...prev, '> ARIA: Initiating sensor sweep...']);
    
    // Animate ping expanding from ship to sensor range
    // Total duration: 3 seconds (2.5s visible + 0.5s fade)
    const pingDuration = 2500; // 2.5 seconds for ping to expand at full opacity
    const fadeStart = 2500; // Start fade at 2.5 seconds
    const fadeDuration = 500; // 0.5 seconds for fade-out
    const totalDuration = 3000; // Total 3 seconds
    const startTime = Date.now();
    
    const pingInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / pingDuration, 1);
      const currentRadius = shipAttributes.sensorRange * progress;
      setScanPingRadius(currentRadius);
      
      // Handle fade-out after 2.5 seconds
      if (elapsed >= fadeStart) {
        const fadeProgress = (elapsed - fadeStart) / fadeDuration;
        setPingOpacity(Math.max(0, 1 - fadeProgress));
      }
      
      if (elapsed >= totalDuration) {
        clearInterval(pingInterval);
        setIsPinging(false);
        setScanPingRadius(0);
        setPingOpacity(1);
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
    const detectedSummary = { planets: 0, moons: 0, belts: 0, habitats: 0, anomalies: 0, conflicts: 0, orbitals: 0, other: 0 };

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
        // Data stream line
        stream.push(`> Detected ${poi.type} (${x}, ${y}) distance ${distFromShip.toFixed(2)} AU`);
        // Increment summary counters
        const t = poi.type.toLowerCase();
        if (t.includes('planet')) detectedSummary.planets++;
        else if (t.includes('moon')) detectedSummary.moons++;
        else if (t.includes('belt')) detectedSummary.belts++;
        else if (t.includes('habitat')) detectedSummary.habitats++;
        else if (t.includes('anomaly')) detectedSummary.anomalies++;
        else if (t.includes('conflict')) detectedSummary.conflicts++;
        else if (t.includes('orbital')) detectedSummary.orbitals++;
        else detectedSummary.other++;
      }, timeToReach);
    });

    setTimeout(() => {
      const rangeMsg = outOfRange > 0 
        ? `> ARIA: Scan complete. ${poisWithinRange.length} contacts detected. ${outOfRange} beyond range.`
        : `> ARIA: Scan complete. All ${poisWithinRange.length} contacts catalogued.`;
      setTerminalLog(prev => [...prev, rangeMsg]);
      conversational.push(`> Scan complete, we have ${detectedSummary.planets} planets, ${detectedSummary.moons} moons, ${detectedSummary.belts} asteroid clusters${detectedSummary.other ? ` and ${detectedSummary.other} anomalies` : ''}.`);
      conversational.push('> Awaiting your orders, Sir.');
      stream.push('> SCAN COMPLETE');

      setTerminalEvents(prev => [...prev, {
        id: `evt_scan_${Date.now()}`,
        type: 'scan',
        timestamp: Date.now(),
        conversational,
        stream,
        meta: { summaries: detectedSummary, title: 'SYSTEM SCAN REPORT' }
      }]);

      setScanningActive(false);
    }, pingDuration + 500);
  };
  
  // Mining handlers
  // NOTE: Belt POI scanning is now triggered from POI Actions panel (Scan Cluster)
  // Mining operations are triggered after successful scan via terminal modal
  
  const handleScanCluster = (poiId, poi) => {
    console.log('[MINING] === Scan Cluster Initiated ===');
    console.log('[MINING] POI ID:', poiId);
    console.log('[MINING] POI Name:', poi.name);
    console.log('[MINING] POI Type:', poi.type);
    console.log('[MINING] System Tier:', currentGalaxySystem?.tier || 1.0);
    console.log('[MINING] Galactic Zone:', currentGalaxySystem?.zone || 'periphery');
    
    // Add initiating message to terminal
    const conversational = [`"Initiating deep survey of ${poi.name}, analyzing cluster composition..."`];
    const stream = [`> CLUSTER SURVEY INITIATED`, `> TARGET: ${poi.name}`, `> Scanning...`];
    
    setTerminalEvents(prev => [...prev, {
      id: `evt_cluster_survey_start_${Date.now()}`,
      type: 'survey',
      timestamp: Date.now(),
      conversational,
      stream,
      meta: { poiId, title: 'SURVEY INITIATED' }
    }]);
    
    // Step 1: Pan to cluster
    setPanTransition(true);
    const r = (poi.distanceAU / system.heliosphere.radiusAU) * 0.92 * zoom;
    const offsetX = -r * Math.cos(poi.angleRad);
    const offsetY = -r * Math.sin(poi.angleRad);
    setPanOffset({ x: offsetX, y: offsetY });
    
    // Step 2: Start scanning progress after pan completes
    setTimeout(() => {
      setPanTransition(false);
      
      const scheduler = getScheduler();
      const scanStart = getUniverseTime().getTime();
      setScanningInProgress({
        poiId,
        progress: 0,
        startTime: scanStart
      });
      
      // Schedule scan completion in 3 universe seconds
      const completeScanEvent = () => {
        completeScan(poiId, poi);
        setScanningInProgress(null);
      };
      
      scheduler.on(`scan_complete_${poiId}`, completeScanEvent);
      scheduler.schedule(`scan_complete_${poiId}`, 3.0);
    }, 1000); // Wait 1s for pan to complete
  };
  
  const completeScan = (poiId, poi) => {
    console.log('[MINING] === Scan Complete - Executing DRE ===');
    
    const scanContext = {
      systemTier: currentGalaxySystem?.tier || 1.0,
      galacticZone: currentGalaxySystem?.zone || 'periphery',
      difficulty: 'easy' // Easy difficulty (DC 3) for asteroid scanning
    };
    
    console.log('[MINING] Scan Context:', scanContext);
    
    // Execute DRE scan action
    const scanResult = executeAsteroidScan(scanContext);
    
    console.log('[MINING] === DRE Scan Result ===');
    console.log('[MINING] Full Result:', scanResult);
    console.log('[MINING] Result Type:', scanResult.result);
    console.log('[MINING] Total Roll:', scanResult.totalRoll);
    console.log('[MINING] Target Difficulty:', scanResult.targetDifficulty);
    console.log('[MINING] Roll Log:', scanResult.rollLog);
    console.log('[MINING] Cluster Data:', scanResult.clusterData);
    
    // Check if scan was successful
    if (scanResult.result === 'success' && scanResult.clusterData) {
      console.log('[MINING] ✓ Scan SUCCESS!');
      const clusterData = scanResult.clusterData;
      console.log('[MINING] Cluster Data:', clusterData);
      
      // Add POI to scanned list (visual fill)
      setScanProgress(prev => [...prev, poiId]);
      shipState.scanPOI(poiId);
      
      // Register cluster to ship state
      shipState.registerCluster(poiId, {
        type: clusterData.type,
        maxAsteroids: clusterData.maxAsteroids,
        currentAsteroids: clusterData.currentAsteroids,
        compositionBonus: clusterData.compositionBonus,
        recoveryRate: clusterData.recoveryDays,
        miningRate: clusterData.miningRate,
        scannedAt: Date.now()
      });
      
      setShipStateVersion(v => v + 1);
      
      // Build conversational output
      const conversational = [
        `"Survey complete, ${poi.name} identified."`,
        `"Cluster classification: ${clusterData.type}. Composition analysis indicates +${clusterData.compositionBonus} yield potential."`,
        `"Detecting ${clusterData.currentAsteroids} asteroids in stable formation. Mining systems ready."`
      ];
      
      // Build data stream output
      const stream = [
        `> CLUSTER SURVEY COMPLETE`,
        `> TARGET: ${poi.name}`,
        `> `,
        `> CLASSIFICATION: ${clusterData.type || 'Unknown'}`,
        `> Asteroid Count: ${clusterData.currentAsteroids}/${clusterData.maxAsteroids}`,
        `> Composition Bonus: +${clusterData.compositionBonus}`,
        `> Recovery Rate: ${clusterData.recoveryDays} day(s) per asteroid`,
        `> Mining Rate: ${clusterData.miningRate}s per asteroid`,
        `> `,
        `> Cluster registered to ship database.`,
        `> Mining operations authorized.`
      ];
      
      // Add to terminal events
      setTerminalEvents(prev => [...prev, {
        id: `evt_cluster_survey_${Date.now()}`,
        type: 'survey',
        timestamp: Date.now(),
        conversational,
        stream,
        meta: { poiId, clusterData, title: 'CLUSTER SURVEY REPORT' }
      }]);
      
    } else {
      console.log('[MINING] ✗ Scan FAILED!');
      console.log('[MINING] Failure reason - Result:', scanResult.result);
      console.log('[MINING] Has clusterData?', !!scanResult.clusterData);
      console.log('[MINING] Consequences:', scanResult.consequences);
      
      // Scan failed - show notification bubble
      const failMessage = scanResult.consequences?.message || 'Sensor sweep inconclusive.';
      setScanFailureNotification({
        poiId,
        message: failMessage,
        roll: scanResult.totalRoll
      });
      
      // Build conversational output for failure
      const conversational = [
        `"Survey failed, sensor readings inconclusive."`,
        `"${failMessage}"`
      ];
      
      const stream = [
        `> CLUSTER SURVEY FAILED`,
        `> ROLL: ${scanResult.totalRoll} vs DC ${scanResult.targetDifficulty}`,
        `> ${failMessage}`
      ];
      
      setTerminalEvents(prev => [...prev, {
        id: `evt_cluster_survey_fail_${Date.now()}`,
        type: 'survey',
        timestamp: Date.now(),
        conversational,
        stream,
        meta: { poiId, failed: true, title: 'SURVEY FAILURE' }
      }]);
    }
  };
  
  const handleMiningOptions = (poiId, cluster) => {
    if (cluster.currentAsteroids === 0) {
      const conversational = [
        `"Cluster depleted. No asteroids available for extraction."`,
        `"Recovery rate: ${cluster.recoveryRate} days per asteroid. Recommend waiting or relocating."`
      ];
      
      const stream = [
        `> CLUSTER DEPLETED`,
        `> Current asteroids: 0/${cluster.maxAsteroids}`,
        `> Recovery rate: ${cluster.recoveryRate} day(s) per asteroid`,
        `> `,
        `> Recommend moving to another cluster or waiting for recovery.`
      ];
      
      setTerminalEvents(prev => [...prev, {
        id: `evt_mining_depleted_${Date.now()}`,
        type: 'mining',
        timestamp: Date.now(),
        conversational,
        stream,
        meta: { poiId, title: 'CLUSTER DEPLETED' }
      }]);
      return;
    }
    
    // Show mining prompt in terminal with interactive choice
    const conversational = [
      `"Cluster ${cluster.type} detected and ready for mining."`,
      `"Available asteroids: ${cluster.currentAsteroids}. Mining rate: ${cluster.miningRate} seconds per asteroid."`,
      `"Awaiting authorization to commence extraction..."`
    ];
    
    const stream = [
      `> MINING AUTHORIZATION REQUEST`,
      `> Cluster Type: ${cluster.type}`,
      `> Available asteroids: ${cluster.currentAsteroids}/${cluster.maxAsteroids}`,
      `> Mining rate: ${cluster.miningRate}s per asteroid`,
      `> Composition bonus: +${cluster.compositionBonus}`,
      `> `,
      `> Ready to commence mining operation?`
    ];
    
    setCurrentMiningPOI(poiId);
    
    setTerminalEvents(prev => [...prev, {
      id: `evt_mining_confirm_${Date.now()}`,
      type: 'mining',
      timestamp: Date.now(),
      conversational,
      stream,
      meta: { 
        poiId, 
        title: 'MINING AUTHORIZATION',
        pendingMiningStart: true,
        eventId: `evt_mining_confirm_${Date.now()}`
      }
    }]);
  };
  
  const startMining = (poiId) => {
    const cluster = shipState.getClusterByPOI(poiId);
    if (!cluster || cluster.currentAsteroids === 0) return;
    
    // Add mining start message to terminal
    const conversational = [`"Commencing mining operation, laser systems online."`, `"Targeting asteroid, extraction sequence initiated..."`];
    const stream = [`> MINING OPERATION COMMENCED`, `> Laser mining in progress...`];
    
    setTerminalEvents(prev => [...prev, {
      id: `evt_mining_start_${Date.now()}`,
      type: 'mining',
      timestamp: Date.now(),
      conversational,
      stream,
      meta: { poiId, title: 'MINING INITIATED' }
    }]);
    
    // Start mining operation - schedule completion
    const scheduler = getScheduler();
    const clusterId = shipState.getAllClusters().find(c => c.poiId === poiId)?.id;
    const miningStart = getUniverseTime().getTime();
    
    setMiningInProgress({
      clusterId,
      poiId,
      progress: 0,
      startTime: miningStart,
      duration: cluster.miningRate // Store duration for PULL progress calculation
    });
    
    const completeMiningEvent = () => {
      completeMining(poiId, cluster);
      setMiningInProgress(null);
    };
    
    scheduler.on(`mining_complete_${poiId}`, completeMiningEvent);
    scheduler.schedule(`mining_complete_${poiId}`, cluster.miningRate);
  };
  
  const completeMining = (poiId, cluster) => {
    console.log('[MINING] === Mining Complete - Executing DRE ===');
    console.log('[MINING] Cluster Type:', cluster.type);
    console.log('[MINING] Composition Bonus:', cluster.compositionBonus);
    
    // Execute DRE mining action
    const miningResult = executeAsteroidMine({
      clusterType: cluster.type,
      compositionBonus: cluster.compositionBonus,
      difficulty: 'normal'
    });
    
    console.log('[MINING] === DRE Mining Result ===');
    console.log('[MINING] Full Result:', miningResult);
    console.log('[MINING] Result Type:', miningResult.result);
    console.log('[MINING] Loot:', miningResult.loot);
    console.log('[MINING] Composition:', miningResult.composition);
    
    // Handle mining failure
    if (miningResult.result === 'fail') {
      const conversational = [
        `"Mining operation failed, asteroid destabilized."`,
        `"Laser extraction unsuccessful. No viable resources recovered."`
      ];
      
      const stream = [
        `> MINING OPERATION FAILED`,
        `> ROLL: ${miningResult.totalRoll} vs DC ${miningResult.targetDifficulty}`,
        `> STATUS: Insufficient yield - asteroid fragmented`,
        `> `,
        `> Asteroid destroyed: 0 resources extracted`,
        `> Recommend alternative cluster selection.`
      ];
      
      setTerminalEvents(prev => [...prev, {
        id: `evt_mining_fail_${Date.now()}`,
        type: 'mining',
        timestamp: Date.now(),
        conversational,
        stream,
        meta: { poiId, failed: true, title: 'MINING FAILURE' }
      }]);
      
      // Still decrement asteroid count (destroyed by failed mining)
      shipState.mineClusterAsteroid(shipState.getAllClusters().find(c => c.poiId === poiId)?.id);
      
      // Clear mining progress
      setMiningInProgress(null);
      setShipStateVersion(v => v + 1);
      
      return;
    }
    
    // Handle successful mining
    // Convert loot to inventory format
    const lootItems = (miningResult.loot || []).map(item => ({
      itemId: item.itemId,
      item: item.name,
      quantity: item.quantity,
      category: item.category
    }));
    
    // Build conversational output
    const conversational = [
      `"Mining operation complete, extracting resources now."`,
      `"Composition analysis: ${miningResult.composition}. Yield multiplier ${miningResult.yieldMultiplier}x."`,
      `"Resources secured and transferred to cargo hold."`
    ];
    
    // Build data stream output
    const stream = [
      `> MINING OPERATION COMPLETE`,
      `> COMPOSITION: ${miningResult.composition}`,
      `> Yield Multiplier: ${miningResult.yieldMultiplier}x`,
      `> `,
      `> === EXTRACTED RESOURCES ===`
    ];
    
    // Add loot details to stream
    (miningResult.loot || []).forEach(item => {
      stream.push(`> ${item.quantity}x ${item.name} (${item.category})`);
    });
    
    stream.push(`> `);
    stream.push(`> Awaiting transfer confirmation...`);
    
    console.log('[MINING] Terminal event created');
    
    setTerminalEvents(prev => [...prev, {
      id: `evt_mining_${Date.now()}`,
      type: 'mining',
      timestamp: Date.now(),
      conversational,
      stream,
      meta: { poiId, loot: lootItems, composition: miningResult.composition, title: 'MINING REPORT', pendingTransfer: true, eventId: `evt_mining_${Date.now()}` }
    }]);
    
    // Store loot items for user to decide
    setCurrentLootItems(lootItems);
    setCurrentMiningPOI(poiId);
    
    // Decrement cluster asteroid count
    shipState.mineClusterAsteroid(shipState.getAllClusters().find(c => c.poiId === poiId)?.id);
    
    // Clear mining progress
    setMiningInProgress(null);
    setShipStateVersion(v => v + 1);
  };
  
  const transferLootToInventory = (lootItems) => {
    // Add all loot items to ship inventory
    lootItems.forEach(loot => {
      shipState.addInventoryItem({
        itemId: loot.itemId,
        name: loot.item,
        quantity: loot.quantity,
        category: loot.category,
        addedAt: Date.now()
      });
    });
    
    setTerminalLog(prev => [
      ...prev,
      `> ARIA: Transferred ${lootItems.length} item type(s) to ship inventory.`
    ]);
    
    // Clear loot and close
    setCurrentLootItems([]);
    setShowInventoryWithTerminal(false);
    setShowTerminalModal(false);
    setShipStateVersion(v => v + 1);
  };

  // Contextual Menu Handlers
  const openContextualMenu = (targetId, targetType) => {
    setSelectedPOI(targetId);
    setContextualMenu({ targetId, targetType });
  };
  
  const closeContextualMenu = () => {
    setContextualMenu(null);
    setChildContextualMenu(null);
    setLockedSelection(false);
    // Clear both parent and child POI selections
    setSelectedPOI(null);
    setSelectedChildPOI(null);
    // Close expanded POI menus
    setExpandedPOIs(new Set());
  };
  
  const handleContextualAction = (action) => {
    if (!contextualMenu) return;
    const target = contextualMenu.targetType === 'poi' ? pois.find(p => p.id === contextualMenu.targetId) : null;

    switch(action) {
      case 'moveTo': {
        if (contextualMenu.targetType === 'poi') {
          moveShipTo(contextualMenu.targetId, null, () => {
            shipState.visitPOI(contextualMenu.targetId);
            setShipStateVersion(v => v + 1);
            const name = target?.name || contextualMenu.targetId;
            setTerminalLog(prev => [...prev, `> ARIA: ${name} marked as visited.`]);
          });
        }
        break;
      }
      case 'survey': {
        if (target) {
          if (target.type === 'BELT') {
            handleScanCluster(target.id, target);
          } else {
            shipState.scanPOI(target.id);
            setShipStateVersion(v => v + 1);
            setTerminalLog(prev => [...prev, `> ARIA: Survey initiated on ${target.name}.`]);
          }
        } else if (contextualMenu.targetType === 'sun') {
          setTerminalLog(prev => [...prev, '> ARIA: Stellar survey initiated.']);
        }
        break;
      }
      case 'mine': {
        if (target && target.type === 'BELT') {
            const cluster = shipState.getClusterByPOI(target.id);
            if (cluster) {
              handleMiningOptions(target.id, cluster);
            } else {
              setTerminalLog(prev => [...prev, `> ARIA: Cluster not registered. Survey required before mining.`]);
            }
        }
        break;
      }
      case 'inventory': {
        setTerminalLog(prev => [...prev, '> ARIA: Opening ship inventory...']);
        setRightPanelTab('inventory');
        break;
      }
      case 'surveySystem': {
        startSystemScan();
        break;
      }
      case 'tag': {
        if (target) {
          const currentTags = poiTags[contextualMenu.targetId] || [];
          const nextTag = currentTags.length === 0 ? 'marked' : currentTags.includes('marked') ? 'avoid' : currentTags.includes('avoid') ? 'cache' : null;
          if (nextTag) {
            setPoiTags(prev => ({ ...prev, [contextualMenu.targetId]: [nextTag] }));
            setTerminalLog(prev => [...prev, `> ARIA: ${target.name} tagged as '${nextTag}'.`]);
          } else {
            setPoiTags(prev => {
              const updated = { ...prev };
              delete updated[contextualMenu.targetId];
              return updated;
            });
            setTerminalLog(prev => [...prev, `> ARIA: Tags cleared from ${target.name}.`]);
          }
        }
        break;
      }
      default:
        break;
    }

    closeContextualMenu();
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

  // POIs derived from system (all POIs including orbitals)
  const pois = useMemo(() => {
    if (!system) return [];
    const list = [];
    list.push({ id: 'SUN', name: 'SUN', type: 'STAR', distanceAU: 0, angleRad: 0, x: 0, y: 0 });
    
    const allPOIs = flattenPOIs(system);
    allPOIs.forEach((p) => {
      list.push({ 
        id: p.id, 
        name: p.name, 
        type: p.type.toUpperCase(), 
        distanceAU: p.distanceAU, 
        angleRad: p.angleRad, 
        x: p.x, 
        y: p.y,
        parentId: p.parentId 
      });
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

  // Calculate zoom-responsive POI size with min/max constraints
  const getResponsivePOISize = (zoom) => {
    const minSize = 60; // Minimum size in pixels - BIGGER ICONS
    const maxSize = 140; // Maximum size in pixels - BIGGER ICONS
    const baseSize = 75; // Base size at 1x zoom - BIGGER ICONS
    const responsiveSize = baseSize * zoom;
    return Math.max(minSize, Math.min(maxSize, responsiveSize));
  };
  
  return (
    <div className="terminal-frame">
      {/* Fullscreen Solar System Map - Always visible */}
      {system && (
        <div className="map-fullscreen-overlay">
          {/* Full Width Header */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '25px 16px 16px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            borderBottom: '1px solid rgba(52, 224, 255, 0.3)',
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10
          }}>
            {/* Left Side: Admin + Title + Settings + Return */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '4px', position: 'relative' }}>
              {/* Admin Settings Icon */}
              <GlobalSettingsMenu 
                onGalaxyEditor={onCreateGalaxy}
                devMode={devMode}
                onDevModeToggle={onDevModeToggle}
              />
              
              {/* Title */}
              <span style={{ fontSize: '13px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '1px' }}>
                SOLAR SYSTEM MAP — {systemName}
              </span>
              
              {/* Settings Button with Dropdown */}
              <div style={{ position: 'relative' }}>
                <button 
                  className="small-btn" 
                  onClick={() => setShowNavMenu(!showNavMenu)}
                  style={{ fontSize: '9px', padding: '6px 12px' }}
                >
                  SETTINGS ▾
                </button>
                
                {showNavMenu && (
                  <div style={{
                    position: 'fixed',
                    top: '90px',
                    left: '335px',
                    background: 'rgba(0, 20, 40, 0.95)',
                    border: '1px solid #34e0ff',
                    borderRadius: '4px',
                    padding: '12px',
                    minWidth: '200px',
                    maxHeight: '70vh',
                    overflowY: 'auto',
                    zIndex: 10001,
                    boxShadow: '0 0 20px rgba(52, 224, 255, 0.3)'
                  }}>
                    <div style={{ fontSize: '10px', color: '#34e0ff', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                      GUI SETTINGS
                    </div>
                    
                    {/* Show All / Hide All buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <button
                        onClick={() => {
                          setShowShip(true);
                          setShowPlanets(true);
                          setShowMoons(true);
                          setShowAsteroidClusters(true);
                          setShowOrbitals(true);
                          setShowAnomalies(true);
                          setShowHabitats(true);
                          setShowConflicts(true);
                          setShowPOINames(true);
                          setShowScaleRings(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          background: 'rgba(52, 224, 255, 0.1)',
                          border: '1px solid rgba(52, 224, 255, 0.4)',
                          borderRadius: '4px',
                          color: '#34e0ff',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
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
                        SHOW ALL
                      </button>
                      <button
                        onClick={() => {
                          setShowShip(false);
                          setShowPlanets(false);
                          setShowMoons(false);
                          setShowAsteroidClusters(false);
                          setShowOrbitals(false);
                          setShowAnomalies(false);
                          setShowHabitats(false);
                          setShowConflicts(false);
                          setShowPOINames(false);
                          setShowScaleRings(false);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 12px',
                          background: 'rgba(52, 224, 255, 0.1)',
                          border: '1px solid rgba(52, 224, 255, 0.4)',
                          borderRadius: '4px',
                          color: '#34e0ff',
                          fontSize: '9px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
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
                        HIDE ALL
                      </button>
                    </div>
                    
                    {/* Visibility Toggles - Single Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showShip} 
                          onChange={(e) => setShowShip(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Ship
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showPlanets} 
                          onChange={(e) => setShowPlanets(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Planets
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showMoons} 
                          onChange={(e) => setShowMoons(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Moons
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showAsteroidClusters} 
                          onChange={(e) => setShowAsteroidClusters(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Asteroid Belts
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showOrbitals} 
                          onChange={(e) => setShowOrbitals(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Orbitals
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showAnomalies} 
                          onChange={(e) => setShowAnomalies(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Anomalies
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showHabitats} 
                          onChange={(e) => setShowHabitats(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Habitats
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showConflicts} 
                          onChange={(e) => setShowConflicts(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Conflicts
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showPOINames} 
                          onChange={(e) => setShowPOINames(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show POI Names
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: '#cfd8df', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showScaleRings} 
                          onChange={(e) => setShowScaleRings(e.target.checked)}
                          style={{ accentColor: '#34e0ff' }}
                        />
                        Show Scale Rings
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', color: 'rgba(255, 107, 107, 0.9)', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={showRadiation} 
                          onChange={(e) => setShowRadiation(e.target.checked)}
                          style={{ accentColor: '#ff6b6b' }}
                        />
                        Show Radiation Overlay
                      </label>
                    </div>
                    
                    <div style={{ borderTop: '1px solid rgba(52, 224, 255, 0.3)', margin: '10px 0' }} />
                    
                    {/* Background Opacity */}
                    <div>
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
                  </div>
                )}
              </div>
              
              {/* Return to Homebase */}
              <button 
                className="small-btn" 
                onClick={() => onNavigate && onNavigate('homebase')}
                style={{ fontSize: '9px', padding: '6px 12px' }}
              >
                Return to Homebase
              </button>
            </div>
            
            {/* Center: Ship Statistics - shifted left by 136px (2 boxes + 4/5 of static box) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginRight: '136px' }}>
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

                {/* Power Cube (Bar Chart) */}
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
                      height: `${(shipAttributes.totalPowerReq / shipAttributes.maxPower) * 100}%`,
                      background: 'linear-gradient(to top, rgba(52, 224, 255, 0.6), rgba(52, 224, 255, 0.3))',
                      transition: 'height 0.3s ease',
                      boxShadow: 'inset 0 0 10px rgba(52, 224, 255, 0.5)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#34e0ff',
                      textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                      zIndex: 1,
                      whiteSpace: 'nowrap'
                    }}>
                      {Math.round((shipAttributes.totalPowerReq / shipAttributes.maxPower) * 100)}
                    </div>
                  </div>
                  <div style={{ fontSize: '7px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '0.5px' }}>POWER</div>
                </div>

                {/* H3-Fuel Cube */}
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
                      height: `${(currentShipState.fuelPellets / currentShipState.maxFuelPellets) * 100}%`,
                      background: 'linear-gradient(to top, rgba(52, 224, 255, 0.6), rgba(52, 224, 255, 0.3))',
                      transition: 'height 0.3s ease',
                      boxShadow: 'inset 0 0 10px rgba(52, 224, 255, 0.5)'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      color: '#34e0ff',
                      textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                      zIndex: 1,
                      whiteSpace: 'nowrap'
                    }}>
                      {currentShipState.fuelPellets}
                    </div>
                  </div>
                  <div style={{ fontSize: '7px', color: '#34e0ff', fontWeight: 'bold', letterSpacing: '0.5px' }}>H3-FUEL</div>
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
            
            {/* Right Side: Time Control Bar */}
            <TimeControlBar />
          </div>
          
          {/* Left 2/3: Map Canvas */}
          <div className="map-fullscreen-left" style={{ paddingTop: '91px' }}>
            <div ref={mapCanvasRef} className="map-fullscreen-canvas" style={{ 
              flex: 1,
              position: 'relative',
              backgroundImage: 'url(/src/assets/media/solar_system_bg.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
            onClick={(e) => {
              // Deselect POI if clicking directly on the map background (not on a POI)
              if (e.target === e.currentTarget || e.target.classList.contains('map-grid')) {
                setSelectedPOI(null);
              }
            }}
            >
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
              
              {/* Radiation Overlay - Shows static radiation levels */}
              {showRadiation && system && (() => {
                const currentExposure = calculateStaticExposure(system, shipPosition.distanceAU);
                // Create radiation zones based on distance from sun
                // Radiation INCREASES with distance (galactic surge is stronger far from stellar protection)
                const zones = [
                  { distance: 0.3, intensity: 0.1, color: 'rgba(100, 255, 100, 0.08)' },  // Inner: Safe (stellar protection)
                  { distance: 0.5, intensity: 0.3, color: 'rgba(255, 255, 100, 0.1)' },   // Mid: Low radiation
                  { distance: 0.7, intensity: 0.6, color: 'rgba(255, 150, 50, 0.15)' },   // Outer: Moderate radiation
                  { distance: 0.9, intensity: 0.9, color: 'rgba(255, 50, 50, 0.25)' },    // Edge: High radiation (galactic surge)
                ];
                
                return (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    pointerEvents: 'none',
                    zIndex: 1
                  }}>
                    {zones.map((zone, idx) => {
                      const radius = zone.distance * 0.92 * zoom;
                      const diameter = radius * 2;
                      return (
                        <div key={`rad-zone-${idx}`} style={{
                          position: 'absolute',
                          left: `${(0.5 + panOffset.x) * 100}%`,
                          top: `${(0.5 + panOffset.y) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${diameter * 100}%`,
                          height: `${diameter * 100}%`,
                          borderRadius: '50%',
                          background: `radial-gradient(circle at center, transparent 40%, ${zone.color} 90%)`,
                          transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none'
                        }} />
                      );
                    })}
                    {/* Radiation level indicator */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0, 12, 18, 0.9)',
                      border: '1px solid rgba(255, 107, 107, 0.6)',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      fontSize: '9px',
                      color: '#ff6b6b',
                      fontWeight: 'bold',
                      textShadow: '0 0 4px rgba(255, 107, 107, 0.6)',
                      boxShadow: '0 0 12px rgba(255, 107, 107, 0.3)'
                    }}>
                      ☢ RADIATION: {currentExposure.toFixed(1)} mSv/hr
                    </div>
                  </div>
                );
              })()}
              
              <div className="map-grid"></div>
              
              {/* Solar System Map - POIs revealed by scanning */}
              {(() => {
                // Zoom support (0.6x to 10x)
                const [minZoom, maxZoom] = [0.2, 10.0];
                const [zoomIn, zoomOut] = [
                  () => setZoom(z => Math.min(maxZoom, z < 2 ? Math.round((z + 0.2) * 10) / 10 : Math.round((z + 0.5) * 10) / 10)),
                  () => setZoom(z => Math.max(minZoom, z <= 2 ? Math.round((z - 0.2) * 10) / 10 : Math.round((z - 0.5) * 10) / 10))
                ];
                
                // Use the smaller dimension to ensure circles stay circular
                // This makes the coordinate system based on a square within the rectangle
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
                
                // Calculate current velocity based on travel phase
                const maxSpeedAUPerSec = 2;
                let currentVelocity = 0;
                
                if (activeTravel) {
                  const accelerationTime = activeTravel.accelerationTime || 2.0;
                  const now = getUniverseTime().getTime();
                  const elapsed = now - activeTravel.startTime;
                  
                  const accelerationDistance = maxSpeedAUPerSec * accelerationTime * 0.5;
                  const decelerationDistance = accelerationDistance;
                  const cruiseDistance = Math.max(0, activeTravel.distance - accelerationDistance - decelerationDistance);
                  const cruiseDuration = cruiseDistance / maxSpeedAUPerSec;
                  const totalTime = accelerationTime + cruiseDuration + accelerationTime;
                  
                  if (elapsed < accelerationTime) {
                    // Accelerating: v(t) = (maxSpeed / accelTime) * t
                    currentVelocity = (maxSpeedAUPerSec / accelerationTime) * elapsed;
                  } else if (elapsed < accelerationTime + cruiseDuration) {
                    // Cruising at max speed
                    currentVelocity = maxSpeedAUPerSec;
                  } else if (elapsed < totalTime) {
                    // Decelerating: v(t) = maxSpeed - (maxSpeed / accelTime) * (t - cruiseEndTime)
                    const decelElapsed = elapsed - accelerationTime - cruiseDuration;
                    currentVelocity = maxSpeedAUPerSec - (maxSpeedAUPerSec / accelerationTime) * decelElapsed;
                  } else {
                    currentVelocity = 0;
                  }
                }
                
                const velocityPercent = Math.min((currentVelocity / maxSpeedAUPerSec) * 100, 100);
                
                // Determine if ship is actively traveling
                const isTraveling = !!activeTravel;
                const travelProgress = isTraveling ? (() => {
                  const speedAUPerSec = 2;
                  const now = getUniverseTime().getTime();
                  const elapsed = now - activeTravel.startTime;
                  const totalTime = activeTravel.distance / speedAUPerSec;
                  return Math.min(elapsed / totalTime, 1);
                })() : 0;
                
                // Calculate rotation angle toward target during travel
                const travelRotation = isTraveling ? (() => {
                  const dx = activeTravel.targetX - shipPosition.x;
                  const dy = activeTravel.targetY - shipPosition.y;
                  // Convert to degrees, add 90 to account for ship pointing "up" in SVG
                  return (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
                })() : shipRotation;
                
                // Apply same responsive sizing to ship as POIs
                const shipSize = getResponsivePOISize(zoom);
                const shipRadius = shipSize / 2;
                
                // Engine flicker animation (only when traveling) - use universe time
                // Base pulse (0.7-1.0) scaled by velocity percentage
                const basePulse = Math.sin(getUniverseTime().getTime() * 20) * 0.3 + 0.7;
                const velocityScale = velocityPercent / 100; // 0 to 1
                const enginePulse = isTraveling ? basePulse * velocityScale : 0;
                
                const shipMarker = showShip ? (
                  <div
                    style={{
                      ...shipPos,
                      position: 'absolute',
                      transform: 'translate(-50%, -50%)',
                      transition: isTraveling ? 'none' : (panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none'),
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openContextualMenu('SHIP', 'ship');
                    }}
                  >
                    {/* Travel trail - line from start to current position */}
                    {isTraveling && (() => {
                      const startPos = toXY(
                        Math.sqrt(activeTravel.startPosition.x ** 2 + activeTravel.startPosition.y ** 2),
                        Math.atan2(activeTravel.startPosition.y, activeTravel.startPosition.x)
                      );
                      const targetPos = toXY(
                        Math.sqrt(activeTravel.targetX ** 2 + activeTravel.targetY ** 2),
                        Math.atan2(activeTravel.targetY, activeTravel.targetX)
                      );
                      
                      // Convert percentages to actual pixels
                      const canvas = mapCanvasRef.current;
                      if (!canvas) return null;
                      const rect = canvas.getBoundingClientRect();
                      
                      const startX = (parseFloat(startPos.left) / 100) * rect.width;
                      const startY = (parseFloat(startPos.top) / 100) * rect.height;
                      const currentX = (parseFloat(shipPos.left) / 100) * rect.width;
                      const currentY = (parseFloat(shipPos.top) / 100) * rect.height;
                      const targetX = (parseFloat(targetPos.left) / 100) * rect.width;
                      const targetY = (parseFloat(targetPos.top) / 100) * rect.height;
                      
                      const svgWidth = rect.width;
                      const svgHeight = rect.height;
                      
                      return (
                        <svg
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: -1
                          }}
                          width={svgWidth}
                          height={svgHeight}
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                        >
                          {/* Planned route (dim) */}
                          <line
                            x1={startX}
                            y1={startY}
                            x2={targetX}
                            y2={targetY}
                            stroke="rgba(52, 224, 255, 0.15)"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                          {/* Traveled path (bright) */}
                          <line
                            x1={startX}
                            y1={startY}
                            x2={currentX}
                            y2={currentY}
                            stroke="rgba(52, 224, 255, 0.6)"
                            strokeWidth="2"
                            style={{
                              filter: 'drop-shadow(0 0 3px rgba(52, 224, 255, 0.8))'
                            }}
                          />
                        </svg>
                      );
                    })()}
                    {/* Velocity arc indicator (180° from 6 o'clock to 12 o'clock anti-clockwise) */}
                    {currentVelocity > 0 && (() => {
                      const r = shipRadius * 0.55;
                      const halfCircumference = Math.PI * r; // path length for 180° arc
                      const dash = (velocityPercent / 100) * halfCircumference;
                      const svgSize = shipSize * 1.36;
                      const center = svgSize / 2;
                      return (
                        <svg
                          width={svgSize}
                          height={svgSize}
                          viewBox={`0 0 ${svgSize} ${svgSize}`}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none'
                          }}
                        >
                          {/* Background half-arc (dim) */}
                          <path
                            d={`M${center} ${center + r} A${r} ${r} 0 0 0 ${center} ${center - r}`}
                            fill="none"
                            stroke="rgba(52, 224, 255, 0.15)"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          {/* Active velocity arc */}
                          <path
                            d={`M${center} ${center + r} A${r} ${r} 0 0 0 ${center} ${center - r}`}
                            fill="none"
                            stroke="rgba(52, 224, 255, 0.9)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            style={{
                              strokeDasharray: `${dash} ${halfCircumference}`,
                              filter: 'drop-shadow(0 0 4px rgba(52, 224, 255, 0.9))',
                              transition: 'stroke-dasharray 0.12s linear'
                            }}
                          />
                        </svg>
                      );
                    })()}
                    
                    {/* Holographic circle */}
                    <div style={{
                      width: `${shipSize}px`,
                      height: `${shipSize}px`,
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
                        width={shipSize * 0.64} 
                        height={shipSize * 0.64} 
                        viewBox="0 0 24 24" 
                        style={{ 
                          transform: `rotate(${travelRotation}deg)`,
                          transition: isTraveling ? 'none' : 'transform 0.5s ease-out'
                        }}
                      >
                        <defs>
                          {/* Engine glow filter */}
                          <filter id="engineGlow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Main hull */}
                        <path d="M12 4 L16 10 L14 16 L10 16 L8 10 Z" fill="none" stroke="#34e0ff" strokeWidth="1.5" strokeLinejoin="round"/>
                        {/* Cockpit */}
                        <circle cx="12" cy="7" r="2" fill="rgba(52, 224, 255, 0.3)" stroke="#34e0ff" strokeWidth="1"/>
                        {/* Left wing */}
                        <path d="M8 10 L4 12 L6 14 L8 12" fill="none" stroke="#34e0ff" strokeWidth="1.5" strokeLinejoin="round"/>
                        {/* Right wing */}
                        <path d="M16 10 L20 12 L18 14 L16 12" fill="none" stroke="#34e0ff" strokeWidth="1.5" strokeLinejoin="round"/>
                        
                        {/* Engine glow - animated when traveling */}
                        {isTraveling && (
                          <>
                            {/* Left engine glow */}
                            <circle 
                              cx="10" 
                              cy="16" 
                              r="2.5" 
                              fill="#34e0ff" 
                              opacity={enginePulse * 0.8}
                              filter="url(#engineGlow)"
                            />
                            {/* Right engine glow */}
                            <circle 
                              cx="14" 
                              cy="16" 
                              r="2.5" 
                              fill="#34e0ff" 
                              opacity={enginePulse * 0.8}
                              filter="url(#engineGlow)"
                            />
                            {/* Engine trail left */}
                            <path 
                              d="M10 17 L10 22" 
                              stroke="#34e0ff" 
                              strokeWidth="2" 
                              opacity={enginePulse * 0.5}
                              strokeLinecap="round"
                              filter="url(#engineGlow)"
                            />
                            {/* Engine trail right */}
                            <path 
                              d="M14 17 L14 22" 
                              stroke="#34e0ff" 
                              strokeWidth="2" 
                              opacity={enginePulse * 0.5}
                              strokeLinecap="round"
                              filter="url(#engineGlow)"
                            />
                          </>
                        )}
                        
                        {/* Static engine cores (always visible) */}
                        <circle cx="10" cy="16" r="1.5" fill="#34e0ff" opacity="0.6"/>
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
                    
                    {/* ETA countdown timer - show if travel time > 10 seconds */}
                    {activeTravel && (() => {
                      const speedAUPerSec = 2; // Fixed 2 AU/s in universe time
                      const totalTravelTime = activeTravel.distance / speedAUPerSec;
                      
                      if (totalTravelTime <= 10) return null;
                      
                      const now = getUniverseTime().getTime();
                      const elapsed = now - activeTravel.startTime;
                      const remaining = Math.max(0, totalTravelTime - elapsed);
                      const minutes = Math.floor(remaining / 60);
                      const seconds = Math.floor(remaining % 60);
                      
                      return (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '100%',
                          transform: 'translate(8px, -50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                          padding: '6px 10px',
                          background: 'rgba(0, 20, 40, 0.9)',
                          border: '1px solid rgba(52, 224, 255, 0.6)',
                          borderRadius: '6px',
                          boxShadow: '0 0 12px rgba(52, 224, 255, 0.4)',
                          minWidth: '60px'
                        }}>
                          <div style={{
                            fontSize: '7px',
                            color: 'rgba(52, 224, 255, 0.7)',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                          }}>
                            ETA
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#34e0ff',
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            textShadow: '0 0 6px rgba(52, 224, 255, 0.8)'
                          }}>
                            {minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`}
                          </div>
                          <div style={{
                            fontSize: '6px',
                            color: 'rgba(52, 224, 255, 0.5)',
                            fontWeight: '600',
                            letterSpacing: '0.5px'
                          }}>
                            {activeTravel.targetName}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : null;
                
                // Ping wave expanding from ship (sensor sweep visualization)
                const pingWave = isPinging ? (() => {
                  const shipPos = toXY(shipPosition.distanceAU, shipPosition.angleRad);
                  // Convert scan radius from AU to viewport percentage using same calculation as toXY
                  const radiusInViewport = (scanPingRadius / system.heliosphere.radiusAU) * 0.92 * zoom;
                  const diameterPx = radiusInViewport * 2 * canvasDimensions.minDim;
                  const shipPosX = parseFloat(shipPos.left);
                  const shipPosY = parseFloat(shipPos.top);
                  const leftPx = (shipPosX / 100) * canvasDimensions.width;
                  const topPx = (shipPosY / 100) * canvasDimensions.height;
                  return (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${leftPx}px`,
                        top: `${topPx}px`,
                        transform: 'translate(-50%, -50%)',
                        width: `${diameterPx}px`,
                        height: `${diameterPx}px`,
                        border: '2px solid rgba(52, 224, 255, 0.8)',
                        borderRadius: '50%',
                        boxShadow: '0 0 20px rgba(52, 224, 255, 0.6), inset 0 0 20px rgba(52, 224, 255, 0.3)',
                        pointerEvents: 'none',
                        animation: 'pulse 0.5s ease-in-out infinite',
                        opacity: pingOpacity,
                        transition: 'opacity 0.5s ease-out',
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
                    onClick={() => { setSelectedPOI('SUN'); }}
                  >
                    <div className="poi-tooltip">SUN ({system.star.class}-TYPE)</div>
                  </div>
                );
                // Get all POIs (flattened from parent + orbitals structure)
                const allPOIs = flattenPOIs(system);
                
                // Separate parent POIs from orbital children
                const parentPOIs = allPOIs.filter(p => {
                  if (!scanProgress.includes(p.id)) return false;
                  // Only show parent POIs (no parentId) initially
                  if (p.parentId) return false;
                  // Apply visibility filters
                  if (p.type === 'planet' && !showPlanets) return false;
                  if (p.type === 'belt' && !showAsteroidClusters) return false;
                  if (p.type === 'anomaly' && !showAnomalies) return false;
                  if (p.type === 'habitat' && !showHabitats) return false;
                  if (p.type === 'conflict' && !showConflicts) return false;
                  return true;
                });
                
                // Build parent-child groups
                const parents = parentPOIs.map(p => {
                  // Find scanned children for this parent
                  // Children can be: moon, station, distress, or any POI with parentId matching this parent
                  const scannedChildren = allPOIs.filter(child => 
                    child.parentId === p.id && 
                    scanProgress.includes(child.id)
                  );
                  return { parent: p, children: scannedChildren };
                });
                
                // Create flat list of all visible POIs for lookups (used by markers_old and highlights)
                const allVisiblePOIs = parents.flatMap(g => {
                  const pois = [g.parent];
                  if (expandedPOIs.has(g.parent.id)) {
                    pois.push(...g.children);
                  }
                  return pois;
                });
                
                // Orbits as rings - show only if planets are visible and scanned
                const planetDistances = showPlanets ? system.pois
                  .filter(p => p.type === 'planet' && scanProgress.includes(p.id))
                  .map(p => p.distanceAU) : [];
                const rings = planetDistances.map((distAU, idx) => {
                  const r = (distAU / system.heliosphere.radiusAU) * 0.92 * zoom; // radius in viewport units (0-1)
                  const diameterPx = r * 2 * canvasDimensions.minDim; // convert to pixels using min dimension
                  const leftPx = (0.5 + panOffset.x) * canvasDimensions.width;
                  const topPx = (0.5 + panOffset.y) * canvasDimensions.height;
                  return (
                    <div key={`ring-${idx}`} className="orbit-ring" style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      transform: 'translate(-50%, -50%)',
                      width: `${diameterPx}px`,
                      height: `${diameterPx}px`,
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out, width 0.8s ease-in-out, height 0.8s ease-in-out' : 'none'
                    }} />
                  );
                });
                
                // Scale rings - dotted circles at regular AU intervals with distance labels
                const scaleRings = showScaleRings ? (() => {
                  const maxAU = system.heliosphere.radiusAU;
                  let scaleInterval;
                  if (maxAU <= 80) scaleInterval = 20; // dense small systems
                  else if (maxAU <= 130) scaleInterval = 30; // medium systems
                  else scaleInterval = 40; // large systems
                  const numRings = Math.floor(maxAU / scaleInterval);
                  
                  return Array.from({ length: numRings }, (_, idx) => {
                    const distAU = (idx + 1) * scaleInterval;
                    const r = (distAU / system.heliosphere.radiusAU) * 0.92 * zoom;
                    const diameterPx = r * 2 * canvasDimensions.minDim;
                    const centerXPx = (0.5 + panOffset.x) * canvasDimensions.width;
                    const centerYPx = (0.5 + panOffset.y) * canvasDimensions.height;
                    
                    return (
                      <div key={`scale-ring-${idx}`}>
                        {/* Dotted ring */}
                        <div style={{
                          position: 'absolute',
                          left: `${centerXPx}px`,
                          top: `${centerYPx}px`,
                          transform: 'translate(-50%, -50%)',
                          width: `${diameterPx}px`,
                          height: `${diameterPx}px`,
                          border: '1px dotted rgba(52, 224, 255, 0.28)', // brighter ring
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
                    
                    case 'moon':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.4"/><circle cx="15" cy="10" r="1.5" fill="currentColor" opacity="0.3"/><circle cx="10" cy="14" r="1.2" fill="currentColor" opacity="0.35"/></svg>;
                    
                    case 'belt':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="8" cy="8" r="2" fill="currentColor"/><circle cx="16" cy="10" r="1.5" fill="currentColor"/><circle cx="12" cy="16" r="2.5" fill="currentColor"/><circle cx="18" cy="16" r="1" fill="currentColor"/></svg>;
                    
                    case 'orbital':
                    case 'station':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="7" y="6" width="10" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="7" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5"/><line x1="7" y1="14" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="20" cy="12" r="1.5" fill="currentColor"/></svg>;
                    
                    case 'habitat':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="6" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="8" y1="9" x2="8" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.6"/><line x1="12" y1="9" x2="12" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.6"/><line x1="16" y1="9" x2="16" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.6"/></svg>;
                    
                    case 'anomaly':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 12 3 L 15 9 L 21 10 L 16 15 L 17 21 L 12 18 L 7 21 L 8 15 L 3 10 L 9 9 Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.3"/></svg>;
                    
                    case 'facility':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 6 20 L 6 10 L 12 6 L 18 10 L 18 20 Z" fill="none" stroke="currentColor" strokeWidth="2"/><rect x="10" y="14" width="4" height="6" fill="currentColor" opacity="0.3"/><line x1="9" y1="11" x2="15" y2="11" stroke="currentColor" strokeWidth="1"/></svg>;
                    
                    case 'nebula':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="9" ry="6" fill="currentColor" opacity="0.15"/><path d="M 6 12 Q 9 8 12 12 T 18 12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6"/><path d="M 7 10 Q 10 14 13 10 T 17 14" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/></svg>;
                    
                    case 'conflict':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 4 12 L 8 8 L 8 11 L 16 11 L 16 8 L 20 12 L 16 16 L 16 13 L 8 13 L 8 16 Z" fill="currentColor" opacity="0.6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>;
                    
                    case 'wake':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 4 12 L 10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M 8 8 L 14 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/><path d="M 8 16 L 14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/><path d="M 12 5 L 18 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/><path d="M 12 19 L 18 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5"/></svg>;
                    
                    case 'distress':
                      return <svg width={size} height={size} viewBox="0 0 24 24"><path d="M 12 4 L 13 13 L 12 13 L 11 13 Z" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="2,2"/></svg>;
                    
                    default:
                      return <svg width={size} height={size} viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>;
                  }
                };
                
                const poiSize = getResponsivePOISize(zoom);
                const iconSize = poiSize * 0.5; // Icon always 50% of POI size
                const orbitalSize = poiSize * 0.75; // Orbitals are 75% of parent size
                const orbitalIconSize = orbitalSize * 0.5;
                
                // Use the parent-children groups from filtering above
                const poiGroups = parents;
                
                // Apply collision prevention to POI groups (position based on parent)
                const applyCollisionPrevention = (groups) => {
                  const minSeparation = poiSize * 2.5; // Minimum separation in pixels
                  const positioned = [];
                  
                  groups.forEach((group, idx) => {
                    let xy = toXY(group.parent.distanceAU, group.parent.angleRad);
                    let adjusted = { ...xy };
                    let attempts = 0;
                    const maxAttempts = 50;
                    
                    // Check collision with already positioned groups
                    while (attempts < maxAttempts) {
                      const collision = positioned.some(other => {
                        const dx = parseFloat(adjusted.left) - parseFloat(other.xy.left);
                        const dy = parseFloat(adjusted.top) - parseFloat(other.xy.top);
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        return distance < minSeparation / 100; // Convert to percentage
                      });
                      
                      if (!collision) break;
                      
                      // Spiral out from original position
                      const spiralAngle = (attempts / maxAttempts) * Math.PI * 2 * 3;
                      const spiralRadius = (attempts / maxAttempts) * 0.05; // 5% max offset
                      adjusted = {
                        left: `${parseFloat(xy.left) + Math.cos(spiralAngle) * spiralRadius}%`,
                        top: `${parseFloat(xy.top) + Math.sin(spiralAngle) * spiralRadius}%`
                      };
                      attempts++;
                    }
                    
                    positioned.push({ group, xy: adjusted });
                  });
                  
                  return positioned;
                };
                
                const positionedGroups = applyCollisionPrevention(poiGroups);

                const markers = positionedGroups.flatMap(({ group, xy }) => {
                  const p = group.parent;
                  const groupMarkers = [];
                  
                  // Overlap handling: offset POI slightly if overlapping ship position
                  const shipDist = Math.sqrt(Math.pow(p.distanceAU * Math.cos(p.angleRad) - shipPosition.x, 2) + Math.pow(p.distanceAU * Math.sin(p.angleRad) - shipPosition.y, 2));
                  let overlapTransform = '';
                  if (shipDist < 0.05) { // threshold AU
                    const offsetPx = 14; // outward offset in px
                    overlapTransform = `translate(${Math.cos(p.angleRad)*offsetPx}px, ${Math.sin(p.angleRad)*offsetPx}px)`;
                  }
                  
                  // Render parent POI and orbitals in a container
                  const renderPOICircle = (poi, size, iconSz, xOffset = 0) => (
                    <div style={{
                      position: 'relative',
                      width: `${size}px`,
                      height: `${size}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {/* Static holographic circle - always visible (hidden when names show at zoom >= 1.5) */}
                      {!(showPOINames && zoom >= 1.5) && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: '50%',
                        border: `2px solid ${shipState.getState().visitedPOIs?.includes(poi.id) ? 'rgba(52, 224, 255, 0.9)' : 'rgba(26, 95, 127, 0.7)'}`,
                        background: selectedPOI === poi.id
                          ? 'radial-gradient(circle, rgba(52, 224, 255, 0.25) 0%, rgba(52, 224, 255, 0.15) 50%, rgba(52, 224, 255, 0.05) 100%)'
                          : shipState.getState().visitedPOIs?.includes(poi.id)
                          ? 'radial-gradient(circle, rgba(52, 224, 255, 0.15) 0%, rgba(52, 224, 255, 0.05) 50%, transparent 100%)'
                          : 'radial-gradient(circle, rgba(26, 95, 127, 0.08) 0%, rgba(26, 95, 127, 0.03) 50%, transparent 100%)',
                        boxShadow: shipState.getState().visitedPOIs?.includes(poi.id)
                          ? '0 0 10px rgba(52, 224, 255, 0.4)'
                          : '0 0 5px rgba(26, 95, 127, 0.3)',
                        zIndex: 8,
                        pointerEvents: 'none'
                      }} />
                      )}
                      
                      {/* Scanning/Mining progress indicators */}
                      {(() => {
                        const isScanning = scanningInProgress?.poiId === poi.id;
                        if (!isScanning) return null;
                        
                        const now = getUniverseTime().getTime();
                        const elapsed = now - scanningInProgress.startTime;
                        const progress = Math.min((elapsed / 3.0) * 100, 100);
                        
                        return (
                          <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '50%',
                            background: `conic-gradient(
                              rgba(52, 224, 255, 0.6) 0deg,
                              rgba(52, 224, 255, 0.6) ${progress * 3.6}deg,
                              transparent ${progress * 3.6}deg,
                              transparent 360deg
                            )`,
                            zIndex: 9
                          }} />
                        );
                      })()}
                      
                      {(() => {
                        const isMining = miningInProgress?.poiId === poi.id;
                        if (!isMining) return null;
                        
                        const now = getUniverseTime().getTime();
                        const elapsed = now - miningInProgress.startTime;
                        const progress = Math.min((elapsed / miningInProgress.duration) * 100, 100);
                        
                        return (
                          <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: `${size}px`,
                            height: `${size}px`,
                            borderRadius: '50%',
                            background: `conic-gradient(
                              rgba(255, 200, 100, 0.6) 0deg,
                              rgba(255, 200, 100, 0.6) ${progress * 3.6}deg,
                              transparent ${progress * 3.6}deg,
                              transparent 360deg
                            )`,
                            zIndex: 9
                          }} />
                        );
                      })()}
                      
                      {/* POI Icon */}
                      <span style={{ 
                        position: 'relative', 
                        zIndex: 10, 
                        fontSize: `${iconSz}px`, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: shipState.getState().visitedPOIs?.includes(poi.id) ? '#34e0ff' : 'rgba(52, 224, 255, 0.7)'
                      }}>
                        {getPOIIcon(poi.type)}
                      </span>
                    </div>
                  );
                  
                  const isExpanded = expandedPOIs.has(p.id);
                  const hasChildren = group.children.length > 0;
                  
                  // Main container for parent + children (children positioned absolutely below parent)
                  groupMarkers.push(
                    <div
                      key={p.id}
                      style={{
                        ...xy,
                        position: 'absolute',
                        transform: `translate(-50%, -50%) ${overlapTransform}`,
                        transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => { setHoveredPOI(p.id); }}
                      onMouseLeave={() => { setHoveredPOI(null); }}
                      onClick={(e) => { 
                        e.stopPropagation();
                        
                        // If clicking same parent again
                        if (selectedPOI === p.id) {
                          // Close child menu and deselect child
                          setSelectedChildPOI(null);
                          setChildContextualMenu(null);
                          
                          // Toggle expansion if has children
                          if (hasChildren) {
                            setExpandedPOIs(prev => {
                              const next = new Set(prev);
                              if (next.has(p.id)) {
                                next.delete(p.id);
                              } else {
                                next.add(p.id);
                              }
                              return next;
                            });
                          }
                        } else {
                          // New parent selected - clear all previous states
                          setSelectedPOI(p.id);
                          setSelectedChildPOI(null);
                          setChildContextualMenu(null);
                          setExpandedPOIs(new Set()); // Close all expanded POIs
                          openContextualMenu(p.id, 'poi');
                          
                          // If this POI has children, expand it
                          if (hasChildren) {
                            setExpandedPOIs(new Set([p.id]));
                          }
                        }
                      }}
                      onContextMenu={(e) => {
                        // Right-click always opens menu, even if has children
                        e.preventDefault();
                        e.stopPropagation();
                        openContextualMenu(p.id, 'poi');
                      }}
                    >
                      {/* Parent POI - anchored at exact position */}
                      <div style={{ position: 'relative' }}>
                        {renderPOICircle(p, poiSize, iconSize, 0)}
                        
                        {/* POI Name - below the icon (only visible at 150% zoom or higher) */}
                        {showPOINames && zoom >= 1.5 && (
                          <div style={{
                            position: 'absolute',
                            top: `${poiSize / 2 + 16}px`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            whiteSpace: 'nowrap',
                            fontSize: `${Math.max(9, Math.min(12, poiSize * 0.13))}px`,
                            color: '#34e0ff',
                            textShadow: '0 0 4px rgba(52, 224, 255, 0.8)',
                            pointerEvents: 'none',
                            zIndex: 100
                          }}>
                            {p.name}
                          </div>
                        )}
                        
                        {/* Child indicator dots (shown when NOT expanded and has children) */}
                        {!isExpanded && hasChildren && (
                          <div style={{
                            position: 'absolute',
                            bottom: `${-8}px`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '4px',
                            pointerEvents: 'none'
                          }}>
                            {(() => {
                              // Get unique child types
                              const uniqueTypes = [...new Set(group.children.map(child => child.type))];
                              const dotColor = 'rgba(52, 224, 255, 0.9)'; // Holographic cyan for all
                              
                              return uniqueTypes.map((type, idx) => (
                                <div key={idx} style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: dotColor,
                                  boxShadow: `0 0 4px ${dotColor}`
                                }} />
                              ));
                            })()}
                          </div>
                        )}
                      </div>
                      
                      {/* Orbital POIs Menu - contextual menu style sliding from under parent */}
                      {isExpanded && group.children.length > 0 && (() => {
                        const menuWidth = poiSize * 1.2; // Match highlightSelectedCircle width (poiSize * 1.2)
                        const itemHeight = Math.max(36, poiSize * 0.7); // Smaller item height
                        const notchRadius = poiSize / 2; // Match parent circle radius exactly
                        const contentStartY = notchRadius + itemHeight; // Start content 1 button height below the top
                        const menuHeight = contentStartY + (group.children.length * itemHeight) + (group.children.length - 1) * 6 + 10; // Total height including curve space + items + 10px extra
                        const startY = poiSize / 2 - (itemHeight * 0.75); // Drop down by removing the -8 offset
                        
                        return (
                          <div
                            style={{
                              position: 'absolute',
                              top: `${startY}px`,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: `${menuWidth}px`,
                              height: `${menuHeight + 12}px`, // Total container height
                              pointerEvents: 'auto',
                              zIndex: 20000
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* SVG with concave top cutout */}
                            <svg
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none'
                              }}
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <defs>
                                <filter id="glow">
                                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                  <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                                </filter>
                              </defs>
                              <path
                                d={`
                                  M 0,${notchRadius}
                                  A ${notchRadius},${notchRadius} 0 0 0 ${menuWidth},${notchRadius}
                                  L ${menuWidth},${menuHeight}
                                  Q ${menuWidth},${menuHeight + 6} ${menuWidth - 6},${menuHeight + 6}
                                  L 6,${menuHeight + 6}
                                  Q 0,${menuHeight + 6} 0,${menuHeight}
                                  Z
                                `}
                                fill="rgba(0, 15, 25, 0.9)"
                                stroke="rgba(52, 224, 255, 0.6)"
                                strokeWidth="2"
                                filter="url(#glow)"
                              />
                            </svg>
                            
                            {/* Menu content container */}
                            <div style={{
                              position: 'absolute',
                              top: `${contentStartY}px`,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '100%',
                              padding: '8px 6px',
                              opacity: 0,
                              animation: 'slideDown 0.2s ease-out forwards'
                            }}>
                              {/* Child POI Items */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {group.children.map((orbital, idx) => {
                                const isHovered = hoveredChildPOI === orbital.id;
                                const isSelected = selectedChildPOI === orbital.id;
                                const childIconSize = Math.max(20, poiSize * 0.35); // Smaller icon size
                                
                                return (
                                  <div
                                    key={orbital.id}
                                    title={`${orbital.type.toUpperCase()} • ${orbital.name}`}
                                    style={{
                                      height: `${itemHeight}px`,
                                      padding: '4px',
                                      background: isSelected
                                        ? 'rgba(52, 224, 255, 0.35)'
                                        : isHovered 
                                        ? 'rgba(52, 224, 255, 0.25)' 
                                        : 'rgba(52, 224, 255, 0.08)',
                                      border: `1px solid ${isSelected || isHovered
                                        ? 'rgba(52, 224, 255, 0.9)' 
                                        : 'rgba(52, 224, 255, 0.3)'}`,
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s',
                                      boxShadow: isSelected
                                        ? '0 0 16px rgba(52, 224, 255, 0.8), inset 0 0 10px rgba(52, 224, 255, 0.3)'
                                        : isHovered 
                                        ? '0 0 12px rgba(52, 224, 255, 0.6)' 
                                        : 'none',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '2px',
                                      position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.stopPropagation();
                                      setHoveredChildPOI(orbital.id);
                                    }}
                                    onMouseLeave={(e) => {
                                      e.stopPropagation();
                                      setHoveredChildPOI(null);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedChildPOI(orbital.id);
                                      setChildContextualMenu({ targetId: orbital.id, targetType: 'poi' });
                                      // Parent stays selected and expanded
                                    }}
                                  >
                                    {/* Icon only - no circle */}
                                    <div style={{
                                      color: '#34e0ff',
                                      filter: isHovered ? 'drop-shadow(0 0 8px rgba(52, 224, 255, 0.8))' : 'none',
                                      transform: `scale(${childIconSize / 24})`,
                                      transformOrigin: 'center'
                                    }}>
                                      {getPOIIcon(orbital.type)}
                                    </div>
                                    
                                    {/* Orbital Name */}
                                    <div style={{
                                      fontSize: `${Math.max(7, poiSize * 0.11)}px`,
                                      color: '#34e0ff',
                                      textAlign: 'center',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      width: '90%',
                                      textShadow: isHovered ? '0 0 6px rgba(52, 224, 255, 0.8)' : 'none'
                                    }}>
                                      {orbital.name}
                                    </div>
                                  </div>
                                );
                              })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Belt cluster asteroid count - text only at 12 o'clock */}
                      {p.type === 'belt' && (() => {
                        const cluster = shipState.getClusterByPOI(p.id);
                        if (!cluster) return null; // Only show after cluster is scanned
                        
                        return (
                          <div style={{
                            position: 'absolute',
                            top: `${-poiSize * 0.7}px`,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: `${Math.max(10, Math.min(14, poiSize * 0.3))}px`,
                            fontWeight: 'bold',
                            color: cluster.currentAsteroids === 0 ? '#ff8800' : '#34e0ff',
                            textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(52, 224, 255, 0.6)',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            zIndex: 100
                          }}>
                            {cluster.currentAsteroids}/{cluster.maxAsteroids}
                          </div>
                        );
                      })()}
                      
                      {/* Tag icon overlay */}
                      {poiTags[p.id] && poiTags[p.id].length > 0 && (() => {
                        const tag = poiTags[p.id][0];
                        const tagColors = {
                          marked: { bg: 'rgba(52, 224, 255, 0.9)', shadow: 'rgba(52, 224, 255, 0.6)' },
                          avoid: { bg: 'rgba(255, 80, 80, 0.9)', shadow: 'rgba(255, 80, 80, 0.6)' },
                          cache: { bg: 'rgba(255, 200, 100, 0.9)', shadow: 'rgba(255, 200, 100, 0.6)' }
                        };
                        const colors = tagColors[tag] || tagColors.marked;
                        
                        return (
                          <svg 
                            style={{
                              position: 'absolute',
                              top: `${-poiSize * 0.3}px`,
                              right: `${-poiSize * 0.3}px`,
                              width: `${poiSize * 0.6}px`,
                              height: `${poiSize * 0.6}px`,
                              pointerEvents: 'none',
                              filter: `drop-shadow(0 0 4px ${colors.shadow})`,
                              zIndex: 200
                            }}
                            viewBox="0 0 24 24"
                            fill={colors.bg}
                            stroke="rgba(0, 0, 0, 0.5)"
                            strokeWidth="1.5"
                          >
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinejoin="round"/>
                            <circle cx="7" cy="7" r="2" fill="rgba(0, 0, 0, 0.4)"/>
                          </svg>
                        );
                      })()}
                      
                      {/* Scan failure notification bubble */}
                      {scanFailureNotification?.poiId === p.id && (
                        <div style={{
                          position: 'absolute',
                          top: '-120px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: '280px',
                          padding: '12px 16px',
                          background: 'linear-gradient(135deg, rgba(20, 0, 0, 0.95), rgba(40, 10, 0, 0.95))',
                          border: '2px solid rgba(255, 80, 80, 0.8)',
                          borderRadius: '8px',
                          boxShadow: '0 0 20px rgba(255, 80, 80, 0.6), inset 0 0 10px rgba(255, 80, 80, 0.2)',
                          animation: 'slideDown 0.3s ease-out',
                          zIndex: 1000
                        }}>
                          {/* Speech bubble arrow */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-10px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderTop: '10px solid rgba(255, 80, 80, 0.8)'
                          }} />
                          
                          <div style={{
                            fontSize: '11px',
                            color: '#ff9999',
                            fontWeight: '600',
                            marginBottom: '8px',
                            letterSpacing: '0.5px'
                          }}>
                            [ROLL {scanFailureNotification.roll}] SCAN FAILED
                          </div>
                          
                          <div style={{
                            fontSize: '10px',
                            color: '#ffcccc',
                            lineHeight: '1.5',
                            marginBottom: '10px'
                          }}>
                            {scanFailureNotification.message}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setScanFailureNotification(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px',
                              background: 'rgba(255, 80, 80, 0.3)',
                              border: '1px solid rgba(255, 80, 80, 0.6)',
                              borderRadius: '4px',
                              color: '#ff9999',
                              fontSize: '9px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              letterSpacing: '1px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(255, 80, 80, 0.5)';
                              e.target.style.borderColor = 'rgba(255, 80, 80, 0.9)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(255, 80, 80, 0.3)';
                              e.target.style.borderColor = 'rgba(255, 80, 80, 0.6)';
                            }}
                          >
                            OK
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  
                  return groupMarkers;
                });
                
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
                      setHoveredPOI(pin.id);
                      setHoveredPin(pin.id);
                    }}
                    onMouseLeave={() => { 
                      setHoveredPOI(null);
                      setHoveredPin(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPOI(pin.id);
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
                
                const markers_old = allVisiblePOIs.map(p => (
                  <div
                    key={p.id}
                    className={`map-poi ${p.type} ${shapeForType(p.type)} ${selectedPOI === p.id ? 'selected' : ''}`}
                    style={{
                      ...toXY(p.distanceAU, p.angleRad),
                      transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none'
                    }}
                    onMouseEnter={() => { setHoveredPOI(p.id); }}
                    onMouseLeave={() => { setHoveredPOI(null); }}
                    onClick={() => { setSelectedPOI(p.id); }}
                  >
                    <div className="poi-tooltip">{p.name} — {p.distanceAU.toFixed(2)} AU</div>
                  </div>
                ));
                // Highlight circle for hovered POI (only if not selected)
                const highlightHoverCircle = hoveredPOI && hoveredPOI !== 'SUN' && hoveredPOI !== selectedPOI ? (() => {
                  let poi = allVisiblePOIs.find(p => p.id === hoveredPOI);
                  if (!poi) poi = droppedPins.find(p => p.id === hoveredPOI);
                  if (!poi) return null;
                  const pos = toXY(poi.distanceAU, poi.angleRad);
                  const highlightSize = poiSize * 1.5;
                  return (
                    <div
                      className="poi-highlight-circle"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        width: `${highlightSize}px`,
                        height: `${highlightSize}px`,
                        transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none'
                      }}
                    />
                  );
                })() : null;
                
                // Highlight circle for selected POI or pin (static, bright)
                const highlightSelectedCircle = selectedPOI && selectedPOI !== 'SUN' ? (() => {
                  let poi = allVisiblePOIs.find(p => p.id === selectedPOI);
                  if (!poi) poi = droppedPins.find(p => p.id === selectedPOI);
                  if (!poi) return null;
                  const pos = toXY(poi.distanceAU, poi.angleRad);
                  const highlightSize = poiSize * 1.2;
                  return (
                    <div
                      className="poi-highlight-circle-selected"
                      style={{
                        left: pos.left,
                        top: pos.top,
                        width: `${highlightSize}px`,
                        height: `${highlightSize}px`,
                        transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out' : 'none'
                      }}
                    />
                  );
                })() : null;
                
                // Off-screen indicator for selected POI or pin
                const offScreenIndicator = selectedPOI && selectedPOI !== 'SUN' ? (() => {
                  let poi = allVisiblePOIs.find(p => p.id === selectedPOI);
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
                
                // Highlight circle for selected child POI (smaller, positioned at child in menu)
                const highlightSelectedChildCircle = selectedChildPOI ? (() => {
                  const childPOI = allVisiblePOIs.find(p => p.id === selectedChildPOI);
                  if (!childPOI) return null;
                  
                  // Child POIs don't appear on map independently, only in menu
                  // So we don't render a circle on the map for them
                  return null;
                })() : null;
                
                return (<>
                  <style>{`
                    @keyframes slideDown {
                      from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-10px);
                      }
                      to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                      }
                    }
                  `}</style>
                  <div 
                    ref={mapRef}
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
                        : (isDragging ? 'grabbing' : 'grab'),
                      userSelect: 'none'
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
                    
                    {/* Zoom Controls + Reset View - moved up and reorganized */}
                    <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 2 }}>
                      {/* Zoom controls row */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="small-btn" onClick={zoomOut}>-</button>
                        <span className="ui-small text-muted" style={{ opacity: 0.8 }}>{(zoom*100).toFixed(0)}%</span>
                        <button className="small-btn" onClick={zoomIn}>+</button>
                        <button className="small-btn" onClick={resetToDefaultView} title="Reset view (Sun-centered)">⊙</button>
                      </div>
                      
                      {/* Navigation Pin button - square, under reset camera */}
                      <button 
                        className="small-btn" 
                        onClick={() => setDropPinMode(!dropPinMode)}
                        style={{ 
                          fontSize: '9px', 
                          padding: '6px',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: dropPinMode ? 'rgba(52, 224, 255, 0.3)' : 'rgba(52, 224, 255, 0.1)',
                          marginLeft: 'auto'
                        }}
                        title={dropPinMode ? 'Drop Pin Mode Active' : 'Activate Drop Pin Mode'}
                      >
                        <svg width="12" height="14" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 2C5.8 2 4 3.8 4 6C4 8.5 8 13 8 13C8 13 12 8.5 12 6C12 3.8 10.2 2 8 2Z" 
                            stroke="#34e0ff" 
                            strokeWidth="1.2" 
                            fill="none"
                          />
                          <circle cx="8" cy="6" r="1.5" fill="#34e0ff" />
                          <ellipse cx="8" cy="16" rx="4" ry="1.5" 
                            stroke="#34e0ff" 
                            strokeWidth="1" 
                            fill="none"
                            opacity="0.6"
                          />
                          <line x1="8" y1="13" x2="8" y2="16" 
                            stroke="#34e0ff" 
                            strokeWidth="0.8" 
                            opacity="0.4"
                            strokeDasharray="1,1"
                          />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Debug: Mouse Coordinates - Bottom Right */}
                    <div style={{
                      position: 'absolute',
                      right: '10px',
                      bottom: '10px',
                      padding: '8px 12px',
                      background: 'rgba(0, 12, 18, 0.9)',
                      border: '1px solid rgba(52, 224, 255, 0.3)',
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: '#34e0ff',
                      fontFamily: 'monospace',
                      lineHeight: '1.4',
                      zIndex: 100,
                      pointerEvents: 'none'
                    }}>
                      <div>Mouse X: {cursorWorldPos.x.toFixed(3)} AU</div>
                      <div>Mouse Y: {cursorWorldPos.y.toFixed(3)} AU</div>
                      <div>Distance: {Math.sqrt(cursorWorldPos.x * cursorWorldPos.x + cursorWorldPos.y * cursorWorldPos.y).toFixed(3)} AU</div>
                      <div>Angle: {(Math.atan2(cursorWorldPos.y, cursorWorldPos.x) * 180 / Math.PI).toFixed(1)}°</div>
                    </div>
                    
                    {/* Heliosphere background - faint glow distinguishing solar system from deep space */}
                    {/* Calculate actual max POI distance to size heliosphere correctly */}
                    {(() => {
                      const maxPOIDistance = Math.max(
                        ...pois.filter(p => p.id !== 'SUN').map(p => p.distanceAU),
                        system.heliosphere.radiusAU
                      ) + 5; // Add 5 AU padding so heliosphere extends beyond largest orbit
                      // Heliosphere diameter in viewport units: 0.92 * zoom is radius, so diameter = 0.92 * zoom * 2
                      const heliosphereDiameter = 0.92 * zoom * 2;
                      
                      return (
                        <div style={{
                          position: 'absolute',
                          left: `${(0.5 + panOffset.x) * 100}%`,
                          top: `${(0.5 + panOffset.y) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                          width: `${heliosphereDiameter * 100}%`,
                          height: `${heliosphereDiameter * 100}%`,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle at center, rgba(52, 224, 255, 0.03) 0%, rgba(52, 224, 255, 0.015) 50%, transparent 70%)',
                          border: '1px solid rgba(52, 224, 255, 0.15)',
                          boxShadow: 'inset 0 0 80px rgba(52, 224, 255, 0.08)',
                          pointerEvents: 'none',
                          transition: panTransition ? 'left 0.8s ease-in-out, top 0.8s ease-in-out, width 0.8s ease-in-out, height 0.8s ease-in-out' : 'none',
                          zIndex: 0
                        }} />
                      );
                    })()}
                    {scaleRings}
                    {rings}
                    {pingWave}
                    {shipMarker}
                    {sunMarker}
                    {markers}
                    {pinMarkers}
                    {sequenceWaypoints}
                    {highlightHoverCircle}
                    {highlightSelectedCircle}
                    {offScreenIndicator}
                  </div>
                </>);
              })()}
            </div>
          </div>

          {/* Right Panel replaced with persistent Terminal Feed */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '0px', marginTop: '103px', marginBottom: '16px' }}>
            <TerminalFeed 
              events={terminalEvents} 
              legacyEntries={terminalLog} 
              onStartMining={(eventId, poiId) => {
                // Start mining operation
                startMining(poiId);
                // Remove pending confirmation from event
                setTerminalEvents(prev => prev.map(evt => 
                  evt.id === eventId ? { ...evt, meta: { ...evt.meta, pendingMiningStart: false } } : evt
                ));
              }}
              onCancelMining={(eventId) => {
                // Cancel mining
                setTerminalEvents(prev => prev.map(evt => 
                  evt.id === eventId ? { ...evt, meta: { ...evt.meta, pendingMiningStart: false, cancelled: true } } : evt
                ));
                setCurrentMiningPOI(null);
              }}
              onTransferLoot={(eventId, items) => {
                // Transfer selected items to inventory
                items.forEach(item => {
                  shipState.addToInventory(item.itemId, item.quantity);
                });
                setShipStateVersion(v => v + 1);
                // Update event to remove pending transfer flag
                setTerminalEvents(prev => prev.map(evt => 
                  evt.id === eventId ? { ...evt, meta: { ...evt.meta, pendingTransfer: false } } : evt
                ));
                setCurrentLootItems([]);
                setCurrentMiningPOI(null);
              }} 
              onLeaveLoot={(eventId) => {
                // Leave loot behind
                setTerminalEvents(prev => prev.map(evt => 
                  evt.id === eventId ? { ...evt, meta: { ...evt.meta, pendingTransfer: false, lootAbandoned: true } } : evt
                ));
                setCurrentLootItems([]);
                setCurrentMiningPOI(null);
              }} 
            />
          </div>
        </div>
      )}
      
      {/* Fixed Left-Side Vertical Contextual Menu */}
      {contextualMenu && (() => {
        // Determine target 
        let target;
        if (contextualMenu.targetType === 'poi') {
          target = pois.find(p => p.id === contextualMenu.targetId);
        } else if (contextualMenu.targetType === 'ship') {
          target = { name: 'SS-ARKOSE' };
        } else if (contextualMenu.targetType === 'sun') {
          target = { name: 'SUN' };
        }
        if (!target) return null;
        
        // SVG Icons for contextual menu
        const IconMoveTo = () => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="2.5"/>
            <path d="M12 7.5 L12 18" strokeLinecap="round"/>
            <circle cx="12" cy="18" r="3" fill="currentColor" opacity="0.3"/>
          </svg>
        );
        const IconSurvey = () => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8"/>
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 4 L12 8 M12 16 L12 20 M4 12 L8 12 M16 12 L20 12" strokeLinecap="round"/>
          </svg>
        );
        const IconMine = () => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 4 L10 4 L8 10 L16 10 L14 4" strokeLinejoin="round"/>
            <path d="M12 10 L12 20" strokeLinecap="round"/>
            <path d="M8 16 L16 16" strokeLinecap="round"/>
          </svg>
        );
        const IconInventory = () => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="6" width="16" height="14" rx="2"/>
            <path d="M4 10 L20 10" strokeLinecap="round"/>
            <path d="M10 6 L10 4 L14 4 L14 6" strokeLinecap="round"/>
          </svg>
        );
        const IconTag = () => (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" strokeLinejoin="round"/>
            <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
          </svg>
        );
        
        // Determine actions based on target type
        const getActions = () => {
          if (contextualMenu.targetType === 'ship') {
            return [
              { id: 'inventory', icon: <IconInventory />, tooltip: 'Inventory' },
              { id: 'surveySystem', icon: <IconSurvey />, tooltip: 'Survey System' }
            ];
          } else if (contextualMenu.targetType === 'sun') {
            return [
              { id: 'survey', icon: <IconSurvey />, tooltip: 'Survey Star' }
            ];
          } else if (target?.type === 'BELT') {
            return [
              { id: 'moveTo', icon: <IconMoveTo />, tooltip: 'Move To' },
              { id: 'survey', icon: <IconSurvey />, tooltip: 'Survey Cluster' },
              { id: 'mine', icon: <IconMine />, tooltip: 'Mine' },
              { id: 'tag', icon: <IconTag />, tooltip: 'Tag' }
            ];
          } else {
            return [
              { id: 'moveTo', icon: <IconMoveTo />, tooltip: 'Move To' },
              { id: 'survey', icon: <IconSurvey />, tooltip: 'Survey' },
              { id: 'tag', icon: <IconTag />, tooltip: 'Tag' }
            ];
          }
        };
        
        const actions = getActions();
        
        return (
          <div style={{
            position: 'fixed',
            left: '24px',
            top: '125px',
            zIndex: 5000
          }}>
            {/* Title above the menu */}
            <div style={{
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#34e0ff',
              marginBottom: '6px',
              textAlign: 'center',
              letterSpacing: '0.5px',
              textShadow: '0 0 8px rgba(52, 224, 255, 0.8)',
              whiteSpace: 'nowrap'
            }}>
              {target.name}
            </div>
            
            {/* Menu box */}
            <div
              style={{
                width: '60px',
                background: 'rgba(0, 15, 25, 0.85)',
                border: '2px solid rgba(52, 224, 255, 0.6)',
                borderRadius: '6px',
                padding: '8px 6px',
                boxShadow: '0 0 25px rgba(52, 224, 255, 0.5)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Icon-only action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {actions.map((action) => (
                <div key={action.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => handleContextualAction(action.id)}
                    onMouseEnter={() => setHoveredAction(action.id)}
                    onMouseLeave={() => setHoveredAction(null)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: hoveredAction === action.id ? 'rgba(52, 224, 255, 0.25)' : 'rgba(52, 224, 255, 0.1)',
                      border: `1px solid ${hoveredAction === action.id ? 'rgba(52, 224, 255, 0.9)' : 'rgba(52, 224, 255, 0.4)'}`,
                      borderRadius: '4px',
                      color: '#34e0ff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      boxShadow: hoveredAction === action.id ? '0 0 12px rgba(52, 224, 255, 0.6)' : 'none'
                    }}
                  >
                    {action.icon}
                  </button>
                  
                  {/* Tooltip */}
                  {hoveredAction === action.id && (
                    <div style={{
                      position: 'absolute',
                      left: '70px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0, 15, 25, 0.95)',
                      border: '1px solid rgba(52, 224, 255, 0.7)',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      color: '#34e0ff',
                      fontSize: '10px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 0 15px rgba(52, 224, 255, 0.5)',
                      zIndex: 6000,
                      pointerEvents: 'none',
                      letterSpacing: '0.3px'
                    }}>
                      {action.tooltip}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Close button */}
              <button
                onClick={closeContextualMenu}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: 'rgba(255, 80, 80, 0.1)',
                  border: '1px solid rgba(255, 80, 80, 0.4)',
                  borderRadius: '4px',
                  color: '#ff5050',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  marginTop: '6px',
                  transition: 'all 0.2s',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 80, 80, 0.25)';
                  e.currentTarget.style.borderColor = 'rgba(255, 80, 80, 0.8)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 80, 80, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 80, 80, 0.4)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                ✕
              </button>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Child Contextual Menu - appears below parent menu */}
      {childContextualMenu && (() => {
        const childPOI = pois.find(p => p.id === childContextualMenu.targetId);
        if (!childPOI) return null;
        
        return (
          <div style={{
            position: 'fixed',
            left: '24px',
            top: '385px', // Position below parent menu (125px + menu height ~260px)
            zIndex: 5000
          }}>
            {/* Title above the menu */}
            <div style={{
              fontSize: '9px',
              fontWeight: 'bold',
              color: '#34e0ff',
              marginBottom: '6px',
              textAlign: 'center',
              letterSpacing: '0.5px',
              textShadow: '0 0 8px rgba(52, 224, 255, 0.8)',
              whiteSpace: 'nowrap'
            }}>
              {childPOI.name}
            </div>
            
            {/* Menu box */}
            <div style={{
              width: '60px',
              background: 'rgba(0, 15, 25, 0.85)',
              border: '2px solid rgba(52, 224, 255, 0.6)',
              borderRadius: '6px',
              padding: '8px 6px',
              boxShadow: '0 0 25px rgba(52, 224, 255, 0.5)',
              backdropFilter: 'blur(10px)'
            }}>
              {/* Action buttons for child POI */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { id: 'moveTo', tooltip: 'Move To' },
                  { id: 'survey', tooltip: 'Survey' }
                ].map((action) => (
                  <div key={action.id} style={{ position: 'relative' }}>
                    <button
                      onClick={() => {
                        handleContextualAction(action.id);
                        setChildContextualMenu(null);
                        setSelectedChildPOI(null);
                      }}
                      onMouseEnter={() => setHoveredAction(action.id)}
                      onMouseLeave={() => setHoveredAction(null)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: hoveredAction === action.id ? 'rgba(52, 224, 255, 0.25)' : 'rgba(52, 224, 255, 0.1)',
                        border: `1px solid ${hoveredAction === action.id ? 'rgba(52, 224, 255, 0.9)' : 'rgba(52, 224, 255, 0.4)'}`,
                        borderRadius: '4px',
                        color: '#34e0ff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        boxShadow: hoveredAction === action.id ? '0 0 12px rgba(52, 224, 255, 0.6)' : 'none',
                        fontSize: '10px'
                      }}
                    >
                      {action.id === 'moveTo' ? '➤' : '◉'}
                    </button>
                    
                    {hoveredAction === action.id && (
                      <div style={{
                        position: 'absolute',
                        left: '70px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(0, 15, 25, 0.95)',
                        border: '1px solid rgba(52, 224, 255, 0.7)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: '#34e0ff',
                        fontSize: '10px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 0 15px rgba(52, 224, 255, 0.5)',
                        zIndex: 6000,
                        pointerEvents: 'none'
                      }}>
                        {action.tooltip}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
      
              {/* Actions Panel - shows when near POIs */}
        <ActionsPanel
          system={system}
          shipPosition={shipPosition}
          pois={pois}
          onActionExecute={handleActionExecute}
        />

        {/* Terminal Modal for action results */}
        {showTerminalModal && (
          <TerminalModal
            isOpen={showTerminalModal}
            content={terminalModalContent}
            onClose={() => {
              setShowTerminalModal(false);
              setShowInventoryWithTerminal(false);
              setCurrentLootItems([]);
              setTerminalInteractive(false);
              setTerminalChoices([]);
              setCurrentMiningPOI(null);
            }}
            interactive={terminalInteractive}
            choices={terminalChoices}
            onChoice={handleTerminalChoice}
            lootItems={currentLootItems}
            onLootTransfer={transferLootToInventory}
            showInventory={showInventoryWithTerminal}
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
        
        {/* Fuel Warning Modal */}
        {showFuelWarning && pendingMovement && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
          }}>
            <div style={{
              background: 'rgba(0, 20, 40, 0.95)',
              border: '2px solid rgba(255, 136, 0, 0.6)',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '450px',
              boxShadow: '0 0 30px rgba(255, 136, 0, 0.4), inset 0 0 20px rgba(255, 136, 0, 0.1)',
              animation: 'fadeInScale 0.3s ease-out'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#ff8800',
                marginBottom: '16px',
                textShadow: '0 0 8px rgba(255, 136, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                LOW FUEL WARNING
              </div>
              
              <div style={{
                fontSize: '11px',
                color: '#cfd8df',
                lineHeight: '1.6',
                marginBottom: '20px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  You are running critically low on H3-Pellets.
                </div>
                
                <div style={{
                  background: 'rgba(255, 136, 0, 0.1)',
                  border: '1px solid rgba(255, 136, 0, 0.3)',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '12px'
                }}>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#ff8800', fontWeight: 'bold' }}>Current Fuel:</span>{' '}
                    <span style={{ color: '#ff5050' }}>{pendingMovement.currentFuel} H3-Pellets ({pendingMovement.fuelPercentage.toFixed(1)}%)</span>
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ color: '#ff8800', fontWeight: 'bold' }}>Distance:</span>{' '}
                    <span style={{ color: '#34e0ff' }}>{pendingMovement.distance.toFixed(2)} AU</span>
                  </div>
                  <div>
                    <span style={{ color: '#ff8800', fontWeight: 'bold' }}>Required:</span>{' '}
                    <span style={{ color: '#34e0ff' }}>{pendingMovement.fuelNeeded} H3-Pellets</span>
                  </div>
                </div>
                
                <div style={{ color: '#ff8800', fontSize: '10px' }}>
                  Are you sure you want to proceed with this maneuver?
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={confirmMovement}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.4)',
                    borderRadius: '4px',
                    color: '#34e0ff',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(52, 224, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  PROCEED ANYWAY
                </button>
                
                <button
                  onClick={cancelMovement}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'rgba(255, 80, 80, 0.1)',
                    border: '1px solid rgba(255, 80, 80, 0.4)',
                    borderRadius: '4px',
                    color: '#ff5050',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 80, 80, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 80, 80, 0.8)';
                    e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 80, 80, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 80, 80, 0.4)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default ShipCommandConsole;
