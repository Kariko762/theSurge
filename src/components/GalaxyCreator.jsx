import { useState, useRef, useEffect } from 'react';

/**
 * GalaxyCreator - Visual galaxy design tool
 * Click to place solar systems, connect them, and export to JSON
 */

const GalaxyCreator = ({ onClose }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.5);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorGridPos, setCursorGridPos] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 1400, height: 800 });
  const [galaxyBgImage, setGalaxyBgImage] = useState(null);
  const [selectedBg, setSelectedBg] = useState('spiral_galaxy.jpg');
  const [systems, setSystems] = useState([]);
  const [mode, setMode] = useState('place'); // 'place', 'bridge', 'connect'
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [connectFirst, setConnectFirst] = useState(null);
  const [hoveredSystem, setHoveredSystem] = useState(null);
  const [systemCounter, setSystemCounter] = useState(1);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [galaxyName, setGalaxyName] = useState('Untitled Galaxy');
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState(null);
  const [showProperties, setShowProperties] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [toolMode, setToolMode] = useState(null); // null, 'static'
  const [staticIntensity, setStaticIntensity] = useState('Medium');
  const [staticSize, setStaticSize] = useState('medium');
  const [cursorWorld, setCursorWorld] = useState(null);
  const [showSystemNames, setShowSystemNames] = useState(true);
  const [radiationOpacity, setRadiationOpacity] = useState(100); // 0-100%
  const [labelDisplay, setLabelDisplay] = useState('systemNames'); // 'systemNames', 'zone', 'tier', 'starType'

  const width = canvasSize.width;
  const height = canvasSize.height;

  // Available backgrounds
  const availableBackgrounds = [
    'spiral_galaxy.jpg',
    'ring_galaxy.png',
    'chaotic_galaxy (1).png',
    'galaxy_bg.png',
    'galaxy2_bg.jpg'
  ];

  // Load galaxy background image
  useEffect(() => {
    const img = new Image();
    img.src = `/src/assets/media/${selectedBg}`;
    img.onload = () => setGalaxyBgImage(img);
  }, [selectedBg]);

  // Update canvas size on container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Draw the galaxy creator canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Apply transform for world space rendering
    ctx.save();
    ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
    ctx.scale(zoom, zoom);
    ctx.translate(-1000, -1000);

    // Draw galaxy background
    if (galaxyBgImage) {
      const worldSize = 2000;
      const imageAspect = galaxyBgImage.width / galaxyBgImage.height;
      const gridAspect = 1;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imageAspect > gridAspect) {
        drawHeight = worldSize;
        drawWidth = worldSize * imageAspect;
        offsetX = -(drawWidth - worldSize) / 2;
        offsetY = 0;
      } else {
        drawWidth = worldSize;
        drawHeight = worldSize / imageAspect;
        offsetX = 0;
        offsetY = -(drawHeight - worldSize) / 2;
      }
      
      ctx.globalAlpha = 0.5;
      ctx.drawImage(galaxyBgImage, offsetX, offsetY, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0;
    }

    // Draw zone-based nebula glows behind systems
    // Layer order: Dark (bottom) -> Quiet (middle) -> Static (top)
    const layerOrder = ['Dark', 'Quiet', 'Static'];
    const opacityMultiplier = radiationOpacity / 100;
    
    layerOrder.forEach(layer => {
      systems.filter(s => s.zone === layer || 
        (layer === 'Dark' && s.radiation === 'Medium') ||
        (layer === 'Quiet' && s.radiation === 'Low') ||
        (layer === 'Static' && s.radiation === 'High')
      ).forEach(system => {
        let colorInner, colorMid, baseAlpha;
        
        if (layer === 'Static' || system.radiation === 'High') {
          colorInner = '#ff1a6b'; // bright red-pink
          colorMid = '#B21C7F';
          baseAlpha = 0.35 * opacityMultiplier;
        } else if (layer === 'Quiet' || system.radiation === 'Low') {
          colorInner = '#1a9fff'; // bright cyan-blue
          colorMid = '#1C4C7F';
          baseAlpha = 0.30 * opacityMultiplier;
        } else { // Dark or Medium
          colorInner = '#b544ff'; // bright purple
          colorMid = '#711C7F';
          baseAlpha = 0.28 * opacityMultiplier;
        }
        
        const baseSize = 80; // Reduced from 120
        const gradient = ctx.createRadialGradient(
          system.position.x, system.position.y, 0,
          system.position.x, system.position.y, baseSize
        );
        
        const alphaInner = Math.round(baseAlpha * 255).toString(16).padStart(2, '0');
        const alphaMid = Math.round(baseAlpha * 0.6 * 255).toString(16).padStart(2, '0');
        gradient.addColorStop(0, `${colorInner}${alphaInner}`);
        gradient.addColorStop(0.5, `${colorMid}${alphaMid}`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(system.position.x, system.position.y, baseSize, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // Draw grid
    const gridSpacing = 50;
    const gridColor = 'rgba(52, 224, 255, 0.08)';
    const majorGridColor = 'rgba(52, 224, 255, 0.15)';
    
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5 / zoom;
    
    for (let x = 0; x <= 2000; x += gridSpacing) {
      const isMajor = x % 200 === 0;
      ctx.strokeStyle = isMajor ? majorGridColor : gridColor;
      ctx.lineWidth = isMajor ? 1 / zoom : 0.5 / zoom;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 2000);
      ctx.stroke();
    }
    
    for (let y = 0; y <= 2000; y += gridSpacing) {
      const isMajor = y % 200 === 0;
      ctx.strokeStyle = isMajor ? majorGridColor : gridColor;
      ctx.lineWidth = isMajor ? 1 / zoom : 0.5 / zoom;
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(2000, y);
      ctx.stroke();
    }

    // Draw connections
    ctx.strokeStyle = 'rgba(52, 224, 255, 0.6)';
    ctx.lineWidth = 2 / zoom;
    systems.forEach(system => {
      system.connections.forward.forEach(targetId => {
        const target = systems.find(s => s.id === targetId);
        if (target) {
          ctx.beginPath();
          ctx.moveTo(system.position.x, system.position.y);
          ctx.lineTo(target.position.x, target.position.y);
          ctx.stroke();
        }
      });
    });

    // Draw systems
    systems.forEach(system => {
      const isHovered = hoveredSystem?.id === system.id;
      const isSelected = selectedSystem?.id === system.id || 
                        connectFirst?.id === system.id;
      
      const radius = 4;
      
      ctx.beginPath();
      ctx.arc(system.position.x, system.position.y, radius, 0, Math.PI * 2);
      
      if (isSelected) {
        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(0, 255, 136, 0.9)';
      } else if (isHovered) {
        ctx.fillStyle = 'rgba(52, 224, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(52, 224, 255, 0.8)';
      } else {
        ctx.fillStyle = 'rgba(52, 224, 255, 0.6)';
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Draw system label based on labelDisplay mode
      if (labelDisplay) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const screenX = (system.position.x - 1000) * zoom + width / 2 + panOffset.x;
        const screenY = (system.position.y - 1000) * zoom + height / 2 + panOffset.y;
        const screenRadius = radius * zoom;
        
        ctx.fillStyle = '#34e0ff';
        ctx.font = '300 10px Roobert, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        let labelText = '';
        switch(labelDisplay) {
          case 'systemNames':
            labelText = system.name || system.id;
            break;
          case 'zone':
            labelText = system.zone || 'None';
            break;
          case 'tier':
            const tierNum = system.tier ? Math.round(system.tier * 4) : 0;
            labelText = tierNum > 0 ? `T${tierNum}` : 'T0';
            break;
          case 'starType':
            labelText = `${system.starType || 'Unknown'} / ${system.starSize || 'Unknown'}`;
            break;
          default:
            labelText = system.name || system.id;
        }
        
        ctx.fillText(labelText, screenX, screenY + screenRadius + 6);
        ctx.restore();
      }
    });

    // Draw cursor preview for static tool
    if (toolMode === 'static' && cursorWorld) {
      let radius;
      switch(staticSize) {
        case 'x-small': radius = 50; break;
        case 'small': radius = 80; break;
        case 'medium': radius = 120; break;
        case 'large': radius = 180; break;
        default: radius = 120;
      }
      
      let color;
      switch(staticIntensity) {
        case 'Low': color = 'rgba(100, 150, 255, 0.3)'; break;
        case 'Medium': color = 'rgba(255, 180, 100, 0.35)'; break;
        case 'High': color = 'rgba(255, 100, 100, 0.4)'; break;
        default: color = 'rgba(255, 180, 100, 0.35)';
      }
      
      // Preview circle outline
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([10 / zoom, 10 / zoom]);
      ctx.beginPath();
      ctx.arc(cursorWorld.x, cursorWorld.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Fill with transparency
      const gradient = ctx.createRadialGradient(
        cursorWorld.x, cursorWorld.y, 0,
        cursorWorld.x, cursorWorld.y, radius
      );
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.7, color.replace(/[\d.]+\)$/, '0.1)'));
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
    }

    ctx.restore();
  }, [galaxyBgImage, zoom, panOffset, width, height, systems, hoveredSystem, selectedSystem, connectFirst, toolMode, cursorWorld, staticSize, staticIntensity, labelDisplay, radiationOpacity]);

  // Convert screen to world coordinates
  const screenToWorld = (canvasX, canvasY) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const worldX = (canvasX - centerX - panOffset.x) / zoom + 1000;
    const worldY = (canvasY - centerY - panOffset.y) / zoom + 1000;
    return { x: worldX, y: worldY };
  };

  // Get system at point
  const getSystemAtPoint = (canvasX, canvasY) => {
    const world = screenToWorld(canvasX, canvasY);
    const clickRadius = 8 / zoom;
    
    for (const system of systems) {
      const dx = world.x - system.position.x;
      const dy = world.y - system.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= clickRadius) {
        return system;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedSystem = getSystemAtPoint(x, y);

    if (clickedSystem) {
      if (mode === 'connect') {
        if (!connectFirst) {
          setConnectFirst(clickedSystem);
        } else {
          // Connect the two systems
          const first = connectFirst;
          const second = clickedSystem;
          
          if (first.id !== second.id) {
            setSystems(prev => prev.map(s => {
              if (s.id === first.id && !s.connections.forward.includes(second.id)) {
                return {
                  ...s,
                  connections: {
                    ...s.connections,
                    forward: [...s.connections.forward, second.id]
                  }
                };
              }
              if (s.id === second.id && !s.connections.backward.includes(first.id)) {
                return {
                  ...s,
                  connections: {
                    ...s.connections,
                    backward: [...s.connections.backward, first.id]
                  }
                };
              }
              return s;
            }));
          }
          
          setConnectFirst(null);
          setMode('place');
          setIsEditMode(false);
        }
      } else {
        // Toggle selection: if clicking the same system, deselect it
        if (selectedSystem?.id === clickedSystem.id) {
          setSelectedSystem(null);
        } else {
          setSelectedSystem(clickedSystem);
        }
      }
    } else if (toolMode === 'static') {
      // Apply radiation to systems within radius
      const world = screenToWorld(x, y);
      
      let radius;
      switch(staticSize) {
        case 'x-small': radius = 50; break;
        case 'small': radius = 80; break;
        case 'medium': radius = 120; break;
        case 'large': radius = 180; break;
        default: radius = 120;
      }
      
      // Map intensity to zone
      let zone;
      switch(staticIntensity) {
        case 'Low': zone = 'Quiet'; break;
        case 'Medium': zone = 'Dark'; break;
        case 'High': zone = 'Static'; break;
        default: zone = 'Dark';
      }
      
      // Update all systems within radius
      setSystems(prev => prev.map(s => {
        const dx = s.position.x - world.x;
        const dy = s.position.y - world.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
          return {
            ...s,
            zone: zone,
            radiation: staticIntensity
          };
        }
        return s;
      }));
      
    } else if (isEditMode && mode === 'place') {
      // Place new system only when in edit mode
      const world = screenToWorld(x, y);
      const newSystem = {
        id: `SYS_${systemCounter.toString().padStart(3, '0')}`,
        name: `System ${systemCounter}`,
        type: 'Main Sequence',
        zone: 'Quiet',
        position: { 
          x: Math.round(world.x), 
          y: Math.round(world.y) 
        },
        tier: 0.1,
        radiation: 'Low',
        size: 3,
        seed: `SYS-${systemCounter}`,
        isHomebase: false,
        connections: {
          forward: [],
          backward: [],
          cross: []
        }
      };

      if (currentBranch) {
        // Continue branch
        newSystem.connections.backward = [currentBranch.id];
        
        setSystems(prev => [
          ...prev.map(s => 
            s.id === currentBranch.id 
              ? { ...s, connections: { ...s.connections, forward: [...s.connections.forward, newSystem.id] } }
              : s
          ),
          newSystem
        ]);
        
        setCurrentBranch(newSystem);
      } else {
        setSystems(prev => [...prev, newSystem]);
        setCurrentBranch(newSystem);
      }

      setSystemCounter(prev => prev + 1);
    } else if (!isEditMode) {
      // Pan mode - allow dragging
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const world = screenToWorld(x, y);
    setCursorGridPos({
      x: Math.max(0, Math.min(2000, Math.floor(world.x))),
      y: Math.max(0, Math.min(2000, Math.floor(world.y)))
    });
    
    // Update cursor world position for preview
    if (toolMode === 'static') {
      setCursorWorld(world);
    } else {
      setCursorWorld(null);
    }

    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      const hoveredSys = getSystemAtPoint(x, y);
      setHoveredSystem(hoveredSys);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle wheel with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(prev => Math.max(0.3, Math.min(5.0, prev * delta)));
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleNewBranch = () => {
    if (selectedSystem) {
      // Sub-branch mode: start from selected system
      setCurrentBranch(selectedSystem);
      setMode('place');
      setConnectFirst(null);
      setIsEditMode(true);
    } else {
      // New branch mode: start fresh
      setCurrentBranch(null);
      setMode('place');
      setConnectFirst(null);
      setIsEditMode(true);
    }
  };

  const handleEndBranch = () => {
    setCurrentBranch(null);
    setMode('place');
    setIsEditMode(false);
  };

  const handlePauseEdit = () => {
    setIsEditMode(false);
  };

  const handleResumeEdit = () => {
    if (currentBranch) {
      setIsEditMode(true);
    }
  };

  const handleConnect = () => {
    setMode('connect');
    setConnectFirst(null);
    setCurrentBranch(null);
    setIsEditMode(false);
    setToolMode(null);
    setShowToolsModal(false);
  };

  const handleToggleTools = () => {
    setShowToolsModal(!showToolsModal);
    if (showToolsModal) {
      setToolMode(null);
    }
  };

  const handleSelectStaticPainter = () => {
    setToolMode('static');
    setMode('place');
    setIsEditMode(false);
    setCurrentBranch(null);
    setConnectFirst(null);
    setShowToolsModal(false);
  };

  const handleCloseStaticPainter = () => {
    setToolMode(null);
  };

  const handleRandomizeSystems = () => {
    const starTypes = ['Main Sequence', 'Red Giant', 'Dwarf', 'Pulsar', 'Neutron Star', 'Binary System'];
    
    // Procedural name generation with variety
    const prefixes = ['Zeta', 'Kepler', 'Ross', 'Wolf', 'Gliese', 'Lacaille', 'Luyten', 'Barnard', 'Proxima', 
                      'Tau', 'Epsilon', 'Sigma', 'Vega', 'Altair', 'Deneb', 'Rigel', 'Betelgeuse', 'Antares',
                      'Aldebaran', 'Spica', 'Pollux', 'Castor', 'Arcturus', 'Capella', 'Procyon', 'Sirius'];
    const sectors = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'];
    const designations = ['Prime', 'Minor', 'Majoris', 'Minoris', 'Centauri', 'Ceti', 'Eridani', 'Draconis', 
                         'Aquarii', 'Orionis', 'Cygni', 'Lyrae', 'Andromedae', 'Pegasi', 'Tauri', 'Virginis'];
    
    setSystems(prev => prev.map((s, idx) => {
      // Generate unique catalog-style names like "Kepler-442", "Ross-128 B", "Gliese 581 c"
      const nameStyle = Math.floor(Math.random() * 4);
      let randomName;
      
      switch(nameStyle) {
        case 0: // Catalog number: "Kepler-442"
          randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${Math.floor(Math.random() * 9000) + 1000}`;
          break;
        case 1: // Catalog + sector: "Ross-128 B"
          randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${Math.floor(Math.random() * 900) + 100} ${sectors[Math.floor(Math.random() * sectors.length)]}`;
          break;
        case 2: // Catalog + designation: "Tau Ceti"
          randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${designations[Math.floor(Math.random() * designations.length)]}`;
          break;
        case 3: // Full designation: "Gliese 581 c"
          randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${Math.floor(Math.random() * 900) + 100} ${sectors[Math.floor(Math.random() * sectors.length)].toLowerCase()}`;
          break;
      }
      
      const randomType = starTypes[Math.floor(Math.random() * starTypes.length)];
      const randomStarSize = Math.floor(Math.random() * 4) + 2; // 2-5
      const randomSeed = `SYS-${Date.now()}-${idx}-${Math.floor(Math.random() * 10000)}`;
      
      return {
        ...s,
        name: randomName,
        type: randomType,
        size: randomStarSize,
        seed: randomSeed
      };
    }));
  };

  const handleCalculateTiers = () => {
    if (systems.length === 0) return;
    
    // Find HOMEBASE or first system as tier 0
    const homebaseIndex = systems.findIndex(s => s.id === 'HOMEBASE' || s.connections.backward.length === 0);
    const startSystem = homebaseIndex >= 0 ? systems[homebaseIndex] : systems[0];
    
    // BFS to calculate distance from start
    const distances = {};
    const queue = [{ id: startSystem.id, dist: 0 }];
    const visited = new Set();
    
    while (queue.length > 0) {
      const { id, dist } = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      distances[id] = dist;
      
      const system = systems.find(s => s.id === id);
      if (system) {
        system.connections.forward.forEach(targetId => {
          if (!visited.has(targetId)) {
            queue.push({ id: targetId, dist: dist + 1 });
          }
        });
      }
    }
    
    // Map distance to tier bands
    // Band 1 (T1): 0-100 grid units -> 0.25
    // Band 2 (T2): 101-300 grid units -> 0.50
    // Band 3 (T3): 301-600 grid units -> 0.75
    // Band 4 (T4): 601+ grid units -> 1.00
    setSystems(prev => prev.map(s => {
      const distance = distances[s.id] || 0;
      let tier;
      
      if (distance <= 100) {
        tier = 0.25;
      } else if (distance <= 300) {
        tier = 0.50;
      } else if (distance <= 600) {
        tier = 0.75;
      } else {
        tier = 1.00;
      }
      
      return { ...s, tier };
    }));
  };

  const handleSave = () => {
    // Process systems for export
    const exportSystems = systems.map(s => {
      const exported = { ...s };
      
      // If this is the homebase, override ID and seed
      if (s.isHomebase) {
        exported.id = 'HOMEBASE';
        exported.name = s.name || 'Homebase';
        exported.seed = 'SSG1-G:HOMEBASE:ALPHA7';
      }
      
      // Remove the isHomebase flag from export (internal only)
      delete exported.isHomebase;
      
      return exported;
    });

    // Update connections to reference HOMEBASE if applicable
    const homebaseOriginalId = systems.find(s => s.isHomebase)?.id;
    if (homebaseOriginalId) {
      exportSystems.forEach(s => {
        if (s.connections.forward.includes(homebaseOriginalId)) {
          s.connections.forward = s.connections.forward.map(id => 
            id === homebaseOriginalId ? 'HOMEBASE' : id
          );
        }
        if (s.connections.backward.includes(homebaseOriginalId)) {
          s.connections.backward = s.connections.backward.map(id => 
            id === homebaseOriginalId ? 'HOMEBASE' : id
          );
        }
        if (s.connections.cross.includes(homebaseOriginalId)) {
          s.connections.cross = s.connections.cross.map(id => 
            id === homebaseOriginalId ? 'HOMEBASE' : id
          );
        }
      });
    }

    const galaxyData = {
      galaxyId: galaxyName.toLowerCase().replace(/\s+/g, '_'),
      galaxyName: galaxyName,
      type: 'custom',
      backgroundImage: selectedBg,
      systems: exportSystems
    };

    const dataStr = JSON.stringify(galaxyData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${galaxyData.galaxyId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all systems?')) {
      setSystems([]);
      setCurrentBranch(null);
      setSystemCounter(1);
    }
  };

  const handleDelete = () => {
    if (!selectedSystem) return;

    const system = selectedSystem;
    
    // Count total connections
    const totalConnections = 
      system.connections.forward.length + 
      system.connections.backward.length + 
      system.connections.cross.length;

    // Case 1: Endpoint or starting point (connections <= 1)
    if (totalConnections <= 1) {
      // Simply remove the system and update any connected systems
      setSystems(prev => prev
        .filter(s => s.id !== system.id)
        .map(s => ({
          ...s,
          connections: {
            forward: s.connections.forward.filter(id => id !== system.id),
            backward: s.connections.backward.filter(id => id !== system.id),
            cross: s.connections.cross.filter(id => id !== system.id)
          }
        }))
      );
      setSelectedSystem(null);
      if (currentBranch?.id === system.id) {
        setCurrentBranch(null);
      }
      return;
    }

    // Case 2: Middle point in a chain (connections = 2)
    if (totalConnections === 2) {
      // Get all connected systems
      const connectedIds = [
        ...system.connections.forward,
        ...system.connections.backward,
        ...system.connections.cross
      ];

      if (connectedIds.length === 2) {
        const [firstId, secondId] = connectedIds;
        
        // Remove the system and reconnect the two systems to each other
        setSystems(prev => prev
          .filter(s => s.id !== system.id)
          .map(s => {
            // Remove references to deleted system
            let updated = {
              ...s,
              connections: {
                forward: s.connections.forward.filter(id => id !== system.id),
                backward: s.connections.backward.filter(id => id !== system.id),
                cross: s.connections.cross.filter(id => id !== system.id)
              }
            };

            // Connect the two orphaned systems together
            if (s.id === firstId && !updated.connections.forward.includes(secondId)) {
              updated.connections.forward = [...updated.connections.forward, secondId];
            }
            if (s.id === secondId && !updated.connections.backward.includes(firstId)) {
              updated.connections.backward = [...updated.connections.backward, firstId];
            }

            return updated;
          })
        );
        setSelectedSystem(null);
        if (currentBranch?.id === system.id) {
          setCurrentBranch(null);
        }
        return;
      }
    }

    // Case 3: Junction point (connections > 2)
    setDeleteWarning({
      system: system,
      message: `System "${system.name}" has ${totalConnections} connections. Deleting this will orphan ${totalConnections - 1} branch(es). Connect the orphaned branch(es) to new endpoints first before deleting this.`
    });
  };

  const handleCancelDelete = () => {
    setDeleteWarning(null);
  };

  const handleProperties = () => {
    setShowProperties(true);
  };

  const handleCloseProperties = () => {
    setShowProperties(false);
  };

  const handlePropertyChange = (field, value) => {
    if (!selectedSystem) return;
    
    setSystems(prev => prev.map(s => {
      if (s.id === selectedSystem.id) {
        const updated = { ...s };
        
        // Handle nested position fields
        if (field === 'position.x' || field === 'position.y') {
          const axis = field.split('.')[1];
          updated.position = { ...updated.position, [axis]: parseInt(value) || 0 };
        } else {
          updated[field] = value;
        }
        
        // Update selectedSystem to reflect changes
        setSelectedSystem(updated);
        return updated;
      }
      return s;
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div className="holo-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
            GALAXY CREATOR
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="text"
              value={galaxyName}
              onChange={(e) => setGalaxyName(e.target.value)}
              style={{
                background: 'rgba(0, 20, 40, 0.6)',
                border: '1px solid #34e0ff',
                color: '#34e0ff',
                padding: '4px 8px',
                fontSize: '10px',
                fontFamily: 'Roobert, sans-serif'
              }}
              placeholder="Galaxy Name"
            />
            <div className="text-muted" style={{ fontSize: '10px' }}>
              Systems: {systems.length}
            </div>
          </div>
        </div>
        <button className="small-btn" onClick={onClose} style={{ fontSize: '10px', padding: '8px 16px' }}>
          CLOSE
        </button>
      </div>

      {/* Controls */}
      <div className="holo-border" style={{ padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Edit Mode Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '12px', borderRight: '1px solid rgba(52, 224, 255, 0.3)' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: isEditMode ? '#00ff88' : '#666',
              boxShadow: isEditMode ? '0 0 10px rgba(0, 255, 136, 0.6)' : 'none',
              transition: 'all 0.3s ease'
            }} />
            <div className="text-muted" style={{ fontSize: '8px', color: isEditMode ? '#00ff88' : '#666' }}>
              {isEditMode ? 'EDIT MODE' : 'PAN MODE'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className="small-btn"
              onClick={handleNewBranch}
              style={{
                fontSize: '8px',
                padding: '4px 10px',
                backgroundColor: selectedSystem 
                  ? 'rgba(0, 255, 136, 0.2)' 
                  : mode === 'place' && !currentBranch 
                    ? 'rgba(52, 224, 255, 0.3)' 
                    : 'transparent'
              }}
            >
              {selectedSystem ? 'SUB BRANCH' : 'NEW BRANCH'}
            </button>
            <button
              className="small-btn"
              onClick={handleEndBranch}
              style={{
                fontSize: '8px',
                padding: '4px 10px',
                opacity: currentBranch ? 1 : 0.5
              }}
              disabled={!currentBranch}
            >
              END BRANCH
            </button>
            <button
              className="small-btn"
              onClick={isEditMode ? handlePauseEdit : handleResumeEdit}
              style={{
                fontSize: '8px',
                padding: '4px 10px',
                opacity: currentBranch ? 1 : 0.5,
                backgroundColor: !isEditMode && currentBranch ? 'rgba(255, 136, 0, 0.2)' : 'transparent'
              }}
              disabled={!currentBranch}
            >
              {isEditMode ? 'PAUSE EDIT' : 'RESUME EDIT'}
            </button>
            <button
              className="small-btn"
              onClick={handleConnect}
              style={{
                fontSize: '8px',
                padding: '4px 10px',
                backgroundColor: mode === 'connect' ? 'rgba(52, 224, 255, 0.3)' : 'transparent'
              }}
            >
              CONNECT
            </button>
            <button
              className="small-btn"
              onClick={handleDelete}
              style={{
                fontSize: '8px',
                padding: '4px 10px',
                opacity: selectedSystem ? 1 : 0.5,
                backgroundColor: selectedSystem ? 'rgba(255, 80, 80, 0.2)' : 'transparent'
              }}
              disabled={!selectedSystem}
            >
              DELETE
            </button>
            <button
              className="small-btn"
              onClick={handleProperties}
              style={{
                fontSize: '8px',
                padding: '4px 10px',
                opacity: selectedSystem ? 1 : 0.5,
                backgroundColor: selectedSystem && showProperties ? 'rgba(52, 224, 255, 0.3)' : 'transparent'
              }}
              disabled={!selectedSystem}
            >
              PROPERTIES
            </button>
          </div>

          <div style={{ position: 'relative', display: 'flex', gap: '6px', alignItems: 'center', paddingLeft: '12px', borderLeft: '1px solid rgba(52, 224, 255, 0.3)' }}>
            <button
              className="small-btn"
              onClick={handleToggleTools}
              style={{
                fontSize: '8px',
                padding: '4px 10px',
                backgroundColor: (showToolsModal || toolMode) ? 'rgba(255, 180, 100, 0.3)' : 'transparent'
              }}
            >
              TOOLS {(showToolsModal || toolMode) ? '▼' : '▶'}
            </button>
            
            {/* Tools Modal */}
            {showToolsModal && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '8px',
                backgroundColor: 'rgba(0, 20, 40, 0.95)',
                border: '1px solid #34e0ff',
                padding: '12px',
                minWidth: '280px',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Background Selector */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '8px', color: '#34e0ff', marginRight: '8px' }}>Background:</label>
                  <select
                    value={selectedBg}
                    onChange={e => setSelectedBg(e.target.value)}
                    style={{ fontSize: '8px', background: '#001428', color: '#34e0ff', border: '1px solid #34e0ff', borderRadius: '2px', padding: '2px 6px' }}
                  >
                    {availableBackgrounds.map(bg => (
                      <option key={bg} value={bg}>{bg.replace(/_/g, ' ').replace(/\.jpg|\.png| \(1\)/g, '').replace('galaxy', 'Galaxy').replace('spiral', 'Spiral').replace('ring', 'Ring').replace('chaotic', 'Chaotic')}</option>
                    ))}
                  </select>
                </div>

                {/* Show Labels Section */}
                <div>
                  <label style={{ fontSize: '8px', color: '#34e0ff', marginBottom: '8px', display: 'block' }}>Show Labels</label>
                  
                  {/* System Names Radio */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <input
                      type="checkbox"
                      checked={labelDisplay === 'systemNames'}
                      onChange={() => setLabelDisplay('systemNames')}
                      style={{ marginRight: '6px', accentColor: '#34e0ff', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '7px', color: '#34e0ff', cursor: 'pointer' }} onClick={() => setLabelDisplay('systemNames')}>
                      System Names
                    </label>
                  </div>

                  {/* Zone / Radiation Radio */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <input
                      type="checkbox"
                      checked={labelDisplay === 'zone'}
                      onChange={() => setLabelDisplay('zone')}
                      style={{ marginRight: '6px', accentColor: '#34e0ff', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '7px', color: '#34e0ff', cursor: 'pointer' }} onClick={() => setLabelDisplay('zone')}>
                      Zone / Radiation
                    </label>
                  </div>

                  {/* Tier Radio */}
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                    <input
                      type="checkbox"
                      checked={labelDisplay === 'tier'}
                      onChange={() => setLabelDisplay('tier')}
                      style={{ marginRight: '6px', accentColor: '#34e0ff', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '7px', color: '#34e0ff', cursor: 'pointer' }} onClick={() => setLabelDisplay('tier')}>
                      Tier
                    </label>
                  </div>

                  {/* Star Type / Size Radio */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={labelDisplay === 'starType'}
                      onChange={() => setLabelDisplay('starType')}
                      style={{ marginRight: '6px', accentColor: '#34e0ff', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '7px', color: '#34e0ff', cursor: 'pointer' }} onClick={() => setLabelDisplay('starType')}>
                      Star Type / Size
                    </label>
                  </div>
                </div>

                {/* Radiation Opacity Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '8px', color: '#34e0ff' }}>Radiation Opacity</label>
                    <span style={{ fontSize: '7px', color: '#34e0ff' }}>{radiationOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={radiationOpacity}
                    onChange={(e) => setRadiationOpacity(parseInt(e.target.value))}
                    style={{
                      width: '100%',
                      accentColor: '#34e0ff',
                      cursor: 'pointer'
                    }}
                  />
                </div>

                {/* Static Painter Button */}
                <button
                  className="small-btn"
                  onClick={handleSelectStaticPainter}
                  style={{
                    fontSize: '8px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(52, 224, 255, 0.2)',
                    width: '100%'
                  }}
                >
                  STATIC PAINTER
                </button>

                {/* Automation Button */}
                <button
                  className="small-btn"
                  onClick={() => setShowAutomationModal(!showAutomationModal)}
                  style={{
                    fontSize: '8px',
                    padding: '6px 10px',
                    backgroundColor: showAutomationModal ? 'rgba(0, 255, 136, 0.2)' : 'rgba(52, 224, 255, 0.2)',
                    width: '100%'
                  }}
                >
                  AUTOMATION {showAutomationModal ? '◀' : '▶'}
                </button>
              </div>
            )}

            {/* Automation Modal (slides out to the right) */}
            {showToolsModal && showAutomationModal && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '100%',
                marginTop: '8px',
                marginLeft: '240px',
                backgroundColor: 'rgba(0, 20, 40, 0.95)',
                border: '1px solid #00ff88',
                padding: '12px',
                minWidth: '240px',
                zIndex: 1001,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '9px', color: '#00ff88', fontWeight: 'bold' }}>
                    AUTOMATION TOOLS
                  </div>
                  <button
                    onClick={() => setShowAutomationModal(false)}
                    style={{
                      background: 'none',
                      border: '1px solid #00ff88',
                      color: '#00ff88',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      fontSize: '10px'
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Randomize Systems */}
                <button
                  className="small-btn"
                  onClick={handleRandomizeSystems}
                  disabled={systems.length === 0}
                  style={{
                    fontSize: '8px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(0, 255, 136, 0.2)',
                    width: '100%',
                    opacity: systems.length === 0 ? 0.5 : 1
                  }}
                >
                  RANDOMIZE SYSTEMS
                </button>
                <div style={{ fontSize: '7px', color: '#666', marginTop: '-8px', lineHeight: '1.4' }}>
                  Randomizes: Name, Star Type, Star Size, Seed
                </div>

                {/* Calculate Tiers */}
                <button
                  className="small-btn"
                  onClick={handleCalculateTiers}
                  disabled={systems.length === 0}
                  style={{
                    fontSize: '8px',
                    padding: '6px 10px',
                    backgroundColor: 'rgba(0, 255, 136, 0.2)',
                    width: '100%',
                    opacity: systems.length === 0 ? 0.5 : 1
                  }}
                >
                  CALCULATE TIERS
                </button>
                <div style={{ fontSize: '7px', color: '#666', marginTop: '-8px', lineHeight: '1.4' }}>
                  Auto-calculates tier based on distance from start
                </div>
              </div>
            )}
            
            {/* Static Painter Controls (shown when static painter is active) */}
            {toolMode === 'static' && (
              <>
                <button
                  className="small-btn"
                  onClick={handleCloseStaticPainter}
                  style={{
                    fontSize: '7px',
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 80, 80, 0.2)'
                  }}
                >
                  CLOSE PAINTER
                </button>
                <select
                  value={staticIntensity}
                  onChange={(e) => setStaticIntensity(e.target.value)}
                  style={{
                    background: 'rgba(0, 20, 40, 0.6)',
                    border: '1px solid #34e0ff',
                    color: '#34e0ff',
                    padding: '4px 8px',
                    fontSize: '8px',
                    fontFamily: 'Roobert, sans-serif'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
                
                <select
                  value={staticSize}
                  onChange={(e) => setStaticSize(e.target.value)}
                  style={{
                    background: 'rgba(0, 20, 40, 0.6)',
                    border: '1px solid #34e0ff',
                    color: '#34e0ff',
                    padding: '4px 8px',
                    fontSize: '8px',
                    fontFamily: 'Roobert, sans-serif'
                  }}
                >
                  <option value="x-small">X-Small</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <div className="text-muted" style={{ fontSize: '8px' }}>CURSOR:</div>
            <div className="text-muted" style={{ fontSize: '8px', minWidth: '80px', color: '#34e0ff' }}>
              X:{cursorGridPos.x} Y:{cursorGridPos.y}
            </div>
            
            <div className="text-muted" style={{ fontSize: '8px', marginLeft: '12px' }}>BACKGROUND:</div>
            <select
              value={selectedBg}
              onChange={(e) => setSelectedBg(e.target.value)}
              style={{
                background: 'rgba(0, 20, 40, 0.6)',
                border: '1px solid #34e0ff',
                color: '#34e0ff',
                padding: '4px 8px',
                fontSize: '8px',
                fontFamily: 'Roobert, sans-serif'
              }}
            >
              {availableBackgrounds.map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>

            <div className="text-muted" style={{ fontSize: '8px', marginLeft: '12px' }}>ZOOM:</div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{
                width: '120px',
                accentColor: '#34e0ff',
                cursor: 'pointer'
              }}
            />
            <div className="text-muted" style={{ fontSize: '8px', minWidth: '32px' }}>{(zoom * 100).toFixed(0)}%</div>

            <button 
              className="small-btn"
              onClick={handleClear}
              style={{ fontSize: '7px', padding: '4px 8px', marginLeft: '8px', backgroundColor: 'rgba(255, 80, 80, 0.2)' }}
            >
              CLEAR
            </button>
            
            <button 
              className="small-btn"
              onClick={handleSave}
              style={{ fontSize: '7px', padding: '4px 8px', backgroundColor: 'rgba(0, 255, 136, 0.2)' }}
            >
              SAVE JSON
            </button>
          </div>
        </div>
      </div>

      {/* Delete Warning Modal */}
      {deleteWarning && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          border: '2px solid #ff5050',
          padding: '24px',
          zIndex: 2000,
          minWidth: '400px',
          boxShadow: '0 0 30px rgba(255, 80, 80, 0.5)'
        }}>
          <div style={{ 
            fontSize: '12px', 
            color: '#ff5050', 
            marginBottom: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            ⚠ WARNING: CANNOT DELETE
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: '#34e0ff', 
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            {deleteWarning.message}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button 
              className="small-btn"
              onClick={handleCancelDelete}
              style={{ 
                fontSize: '8px', 
                padding: '6px 16px',
                backgroundColor: 'rgba(52, 224, 255, 0.2)'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div ref={containerRef} className="holo-border" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ 
            cursor: isDragging ? 'grabbing' : 
                    isEditMode ? 'crosshair' : 
                    hoveredSystem ? 'pointer' : 'grab',
            display: 'block'
          }}
        />

        {/* Properties Panel */}
        {showProperties && selectedSystem && (
          <div className="holo-border" style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '340px',
            backgroundColor: '#000',
            padding: '16px',
            overflowY: 'auto',
            zIndex: 100,
            animation: 'slideInRight 0.3s ease-out'
          }}>
            <button
              onClick={handleCloseProperties}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: '1px solid #34e0ff',
                color: '#34e0ff',
                cursor: 'pointer',
                padding: '4px 8px',
                fontSize: '10px'
              }}
            >
              ✕
            </button>

            <div className="text-muted" style={{ fontSize: '9px', marginBottom: '16px' }}>
              {'> '}SYSTEM PROPERTIES
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* ID - Read Only */}
            <div>
              <label style={{ fontSize: '8px', color: '#666', display: 'block', marginBottom: '4px' }}>ID (Read Only)</label>
              <input
                type="text"
                value={selectedSystem.id}
                disabled
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.4)',
                  border: '1px solid rgba(52, 224, 255, 0.3)',
                  color: '#666',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, monospace'
                }}
              />
            </div>

            {/* Name */}
            <div>
              <label style={{ fontSize: '8px', color: '#34e0ff', display: 'block', marginBottom: '4px' }}>NAME</label>
              <input
                type="text"
                value={selectedSystem.name}
                onChange={(e) => handlePropertyChange('name', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid #34e0ff',
                  color: '#34e0ff',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, sans-serif'
                }}
              />
            </div>

            {/* Type */}
            <div>
              <label style={{ fontSize: '8px', color: '#34e0ff', display: 'block', marginBottom: '4px' }}>STAR TYPE</label>
              <select
                value={selectedSystem.type}
                onChange={(e) => handlePropertyChange('type', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid #34e0ff',
                  color: '#34e0ff',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, sans-serif'
                }}
              >
                <option value="Main Sequence">Main Sequence</option>
                <option value="Red Giant">Red Giant</option>
                <option value="Dwarf">Dwarf</option>
                <option value="Pulsar">Pulsar</option>
                <option value="Neutron Star">Neutron Star</option>
                <option value="Binary System">Binary System</option>
              </select>
            </div>

            {/* Zone */}
            <div>
              <label style={{ fontSize: '8px', color: '#34e0ff', display: 'block', marginBottom: '4px' }}>ZONE</label>
              <select
                value={selectedSystem.zone}
                onChange={(e) => handlePropertyChange('zone', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid #34e0ff',
                  color: '#34e0ff',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, sans-serif'
                }}
              >
                <option value="Quiet">Quiet</option>
                <option value="Dark">Dark</option>
                <option value="Static">Static</option>
              </select>
            </div>

            {/* Position - Read Only (shows where it is) */}
            <div>
              <label style={{ fontSize: '8px', color: '#666', display: 'block', marginBottom: '4px' }}>POSITION (Read Only)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '7px', color: '#666', marginBottom: '2px' }}>X</div>
                  <input
                    type="number"
                    value={selectedSystem.position.x}
                    disabled
                    style={{
                      width: '100%',
                      background: 'rgba(0, 20, 40, 0.4)',
                      border: '1px solid rgba(52, 224, 255, 0.3)',
                      color: '#666',
                      padding: '6px 8px',
                      fontSize: '9px',
                      fontFamily: 'Roobert, monospace'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '7px', color: '#666', marginBottom: '2px' }}>Y</div>
                  <input
                    type="number"
                    value={selectedSystem.position.y}
                    disabled
                    style={{
                      width: '100%',
                      background: 'rgba(0, 20, 40, 0.4)',
                      border: '1px solid rgba(52, 224, 255, 0.3)',
                      color: '#666',
                      padding: '6px 8px',
                      fontSize: '9px',
                      fontFamily: 'Roobert, monospace'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Tier */}
            <div>
              <label style={{ fontSize: '8px', color: '#34e0ff', display: 'block', marginBottom: '4px' }}>
                TIER (0.0 - 1.0) <span style={{ color: '#666' }}>→ T{Math.ceil(selectedSystem.tier * 4)}</span>
              </label>
              <input
                type="number"
                value={selectedSystem.tier}
                onChange={(e) => handlePropertyChange('tier', parseFloat(e.target.value))}
                min="0"
                max="1"
                step="0.05"
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid #34e0ff',
                  color: '#34e0ff',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, monospace'
                }}
              />
            </div>

            {/* Radiation */}
            <div>
              <label style={{ fontSize: '8px', color: '#34e0ff', display: 'block', marginBottom: '4px' }}>RADIATION</label>
              <select
                value={selectedSystem.radiation}
                onChange={(e) => handlePropertyChange('radiation', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid #34e0ff',
                  color: '#34e0ff',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, sans-serif'
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label style={{ fontSize: '8px', color: '#34e0ff', display: 'block', marginBottom: '4px' }}>STAR SIZE (2-5)</label>
              <input
                type="number"
                value={selectedSystem.size}
                onChange={(e) => handlePropertyChange('size', parseInt(e.target.value))}
                min="2"
                max="5"
                step="1"
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid #34e0ff',
                  color: '#34e0ff',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, monospace'
                }}
              />
            </div>

            {/* Seed */}
            <div>
              <label style={{ fontSize: '8px', color: '#34e0ff', display: 'block', marginBottom: '4px' }}>SEED</label>
              <input
                type="text"
                value={selectedSystem.seed}
                onChange={(e) => handlePropertyChange('seed', e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(0, 20, 40, 0.6)',
                  border: '1px solid #34e0ff',
                  color: '#34e0ff',
                  padding: '6px 8px',
                  fontSize: '9px',
                  fontFamily: 'Roobert, monospace'
                }}
              />
            </div>

            {/* Homebase Flag */}
            <div style={{ borderTop: '1px solid rgba(52, 224, 255, 0.2)', paddingTop: '12px' }}>
              <label style={{ 
                fontSize: '8px', 
                color: selectedSystem.isHomebase ? '#00ff88' : '#34e0ff', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                marginBottom: '4px'
              }}>
                <input
                  type="checkbox"
                  checked={selectedSystem.isHomebase || false}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    if (newValue) {
                      // Unmark all other systems as homebase
                      setSystems(prev => prev.map(s => ({
                        ...s,
                        isHomebase: s.id === selectedSystem.id
                      })));
                      // Update selected system to reflect change
                      setSelectedSystem({ ...selectedSystem, isHomebase: true });
                    } else {
                      handlePropertyChange('isHomebase', false);
                    }
                  }}
                  style={{ accentColor: '#00ff88', cursor: 'pointer' }}
                />
                HOMEBASE
              </label>
              <div style={{ fontSize: '7px', color: '#666', lineHeight: '1.4', marginLeft: '20px' }}>
                {selectedSystem.isHomebase 
                  ? 'This system is the starting homebase. ID will be set to HOMEBASE on export.'
                  : 'Mark this system as the player starting point'}
              </div>
            </div>

            {/* Connections - Read Only */}
            <div>
              <label style={{ fontSize: '8px', color: '#666', display: 'block', marginBottom: '4px' }}>CONNECTIONS (Read Only)</label>
              <div style={{ fontSize: '8px', color: '#666', lineHeight: '1.6' }}>
                <div><strong style={{ color: '#34e0ff' }}>Forward:</strong> {selectedSystem.connections.forward.length > 0 ? selectedSystem.connections.forward.join(', ') : 'None'}</div>
                <div><strong style={{ color: '#34e0ff' }}>Backward:</strong> {selectedSystem.connections.backward.length > 0 ? selectedSystem.connections.backward.join(', ') : 'None'}</div>
                <div><strong style={{ color: '#34e0ff' }}>Cross:</strong> {selectedSystem.connections.cross.length > 0 ? selectedSystem.connections.cross.join(', ') : 'None'}</div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '8px', lineHeight: '1.8' }} className="text-muted">
          <div style={{ color: isEditMode ? '#00ff88' : toolMode === 'static' ? '#ffb464' : '#34e0ff', marginBottom: '4px' }}>
            {toolMode === 'static' && 'STATIC TOOL - Click to place radiation cloud'}
            {!toolMode && isEditMode && mode === 'place' && currentBranch && 'EDIT MODE - Click to continue branch'}
            {!toolMode && isEditMode && mode === 'place' && !currentBranch && 'EDIT MODE - Click to start new branch'}
            {!toolMode && !isEditMode && currentBranch && 'PAN MODE - Click RESUME EDIT to continue placing'}
            {!toolMode && !isEditMode && !currentBranch && 'PAN MODE - Drag to move, scroll to zoom'}
            {!toolMode && mode === 'connect' && !connectFirst && 'CONNECT MODE - Select first system'}
            {!toolMode && mode === 'connect' && connectFirst && 'CONNECT MODE - Select second system'}
          </div>
          <div style={{ fontSize: '7px' }}>
            {toolMode === 'static' ? 'Click to place cloud • Systems inside will update radiation level' : 
             'Scroll to zoom • ' + (isEditMode ? 'Click to place • PAUSE EDIT to pan' : 'Drag to pan • RESUME EDIT to continue')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalaxyCreator;
