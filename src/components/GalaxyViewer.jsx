import { useState, useRef, useEffect, useMemo } from 'react'
import { calculateDistance } from '../lib/galaxyGenerator.js'
import { makeRng, lerp } from '../lib/rng.js'
import { findSystemPathBFS } from '../lib/graph.js'
import { getShipState } from '../lib/shipState.js'
import SolarSystemViewer from './SolarSystemViewer'

/**
 * GalaxyViewer - Interactive 2D map showing all solar systems
 * Click systems to see info modal with Plot Route button
 * v1.0.1 - Text size increased, scanlines removed
 */

const GalaxyViewer = ({ galaxy, currentSystemId = 'HOMEBASE', onClose, onSelectSystem, externalSelectedSystemId }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.5); // Start zoomed out to see all systems
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterTier, setFilterTier] = useState('ALL');
  const [nebulaIntensity, setNebulaIntensity] = useState(50); // 0-100%
  const [viewingSolarSystem, setViewingSolarSystem] = useState(null); // When drilling into a system
  const [fadeState, setFadeState] = useState('visible'); // 'visible', 'fading-out', 'fading-in'
  const [animTime, setAnimTime] = useState(0); // animation timestamp for pulsing effects
  const [systemInfoModal, setSystemInfoModal] = useState(null); // { system, canvasX, canvasY } for info popup
  const [canvasSize, setCanvasSize] = useState({ width: 1400, height: 800 });
  const [scanCompleteModal, setScanCompleteModal] = useState(null); // { system } when scan completes
  const [scanQueue, setScanQueue] = useState([]); // Queue of systems to scan
  const [galaxyBgImage, setGalaxyBgImage] = useState(null); // Background galaxy image
  const [cursorGridPos, setCursorGridPos] = useState({ x: 0, y: 0 }); // Current cursor grid position

  // Canvas dimensions from container
  const width = canvasSize.width;
  const height = canvasSize.height;

  // Get current system
  const currentSystem = useMemo(() => {
    return galaxy.systems.find(s => s.id === currentSystemId);
  }, [galaxy, currentSystemId]);

  // Load galaxy background image
  useEffect(() => {
    const img = new Image();
    img.src = '/src/assets/media/galaxy2_bg.jpg';
    img.onload = () => setGalaxyBgImage(img);
  }, []);

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

  // Get accessible systems from current position
  const accessibleSystemIds = useMemo(() => {
    if (!currentSystem) return new Set();
    const ids = new Set([currentSystemId]);
    currentSystem.connections.forward.forEach(id => ids.add(id));
    currentSystem.connections.backward.forEach(id => ids.add(id));
    currentSystem.connections.cross.forEach(id => ids.add(id));
    return ids;
  }, [currentSystem, currentSystemId]);

  // Compute path from current system (typically HOMEBASE) to selected system
  const highlightedPathIds = useMemo(() => {
    if (!selectedItem || !selectedItem.id || !galaxy?.systems) return [];
    if (!currentSystemId) return [];
    const path = findSystemPathBFS(galaxy, currentSystemId, selectedItem.id);
    return path; // array of system ids in order
  }, [galaxy, currentSystemId, selectedItem]);

  // Filter systems for display
  const filteredSystems = useMemo(() => {
    return galaxy.systems.filter(sys => {
      if (filterZone !== 'ALL' && sys.zone !== filterZone) return false;
      if (filterTier !== 'ALL') {
        const tier = Math.ceil(sys.tier * 4);
        if (tier !== parseInt(filterTier)) return false;
      }
      return true;
    });
  }, [galaxy.systems, filterZone, filterTier]);

  // Simple RAF loop to drive subtle animations (e.g., HOMEBASE pulse)
  useEffect(() => {
    let rafId;
    const loop = (t) => {
      setAnimTime(t);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Scan progress ticker - increments scan progress over time
  useEffect(() => {
    const shipState = getShipState();
    const activeScan = shipState.state.activeScan;
    
    if (!activeScan) return;

    // Auto-navigate to system being scanned
    const scanningSystem = galaxy.systems.find(s => s.id === activeScan.systemId);
    if (scanningSystem && activeScan.progress === 0) {
      // Zoom in a bit and center on system
      const targetZoom = Math.max(zoom, 1.2);
      setZoom(targetZoom);
      const px = -(scanningSystem.position.x - 1000) * targetZoom;
      const py = -(scanningSystem.position.y - 1000) * targetZoom;
      setPanOffset({ x: px, y: py });
    }

    const interval = setInterval(() => {
      const currentProgress = shipState.state.activeScan?.progress || 0;
      if (currentProgress >= 100) {
        // Scan complete
        const completedSystemId = shipState.completeScan();
        const completedSystem = galaxy.systems.find(s => s.id === completedSystemId);
        
        if (completedSystem) {
          // Get canvas position for speech bubble
          const screenX = (completedSystem.position.x - 1000) * zoom + width / 2 + panOffset.x;
          const screenY = (completedSystem.position.y - 1000) * zoom + height / 2 + panOffset.y;
          setSystemInfoModal({ system: completedSystem, canvasX: screenX, canvasY: screenY });
        }
        
        clearInterval(interval);
      } else {
        shipState.updateScanProgress(currentProgress + 2); // 2% per tick = 50 ticks = ~5 seconds
      }
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, [getShipState().state.activeScan, galaxy.systems, zoom, panOffset, width, height]);

  // If an external selection is provided (e.g., from a Tree View), sync it and focus
  useEffect(() => {
    if (!externalSelectedSystemId) return;
    const sys = galaxy.systems.find(s => s.id === externalSelectedSystemId);
    if (!sys) return;
    setSelectedItem(sys);
    // Ensure we are in system view and center on the selected system
    const targetZoom = Math.max(zoom, 1.5);
    setZoom(targetZoom);
    // Compute pan to center the system: (x-1000)*zoom + center + pan = center => pan = -(x-1000)*zoom
    const centerX = width / 2;
    const centerY = height / 2;
    const px = -(sys.position.x - 1000) * targetZoom;
    const py = -(sys.position.y - 1000) * targetZoom;
    setPanOffset({ x: px, y: py });
  }, [externalSelectedSystemId, galaxy.systems, width, height]);

  // Draw the galaxy map
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
    // Translate to center the galaxy coordinate space (which is 0-2000, 0-2000)
    ctx.translate(-1000, -1000); // Center the 2000x2000 galaxy at origin

    // BACKGROUND LAYER: Galaxy background image (in world space, zooms with camera)
    if (galaxyBgImage) {
      // The coordinate system is 0-2000, centered at 1000,1000
      // We want the galaxy image to COVER the entire 2000x2000 grid (like CSS background-size: cover)
      
      const worldSize = 2000;
      const imageAspect = galaxyBgImage.width / galaxyBgImage.height;
      const gridAspect = 1; // 2000x2000 is square
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      // Use "cover" strategy - scale to fill the entire area, cropping if necessary
      if (imageAspect > gridAspect) {
        // Image is wider - fit to height, crop sides
        drawHeight = worldSize;
        drawWidth = worldSize * imageAspect;
        offsetX = -(drawWidth - worldSize) / 2; // Center the excess width
        offsetY = 0;
      } else {
        // Image is taller - fit to width, crop top/bottom
        drawWidth = worldSize;
        drawHeight = worldSize / imageAspect;
        offsetX = 0;
        offsetY = -(drawHeight - worldSize) / 2; // Center the excess height
      }
      
      // Apply opacity based on nebula intensity slider
      ctx.globalAlpha = nebulaIntensity / 100;
      // Draw with offsets to center the galaxy
      ctx.drawImage(galaxyBgImage, offsetX, offsetY, drawWidth, drawHeight);
      ctx.globalAlpha = 1.0;
    }

    // GRID OVERLAY: Subtle coordinate grid
    {
      const gridSpacing = 50; // Grid every 50 units
      const gridColor = 'rgba(52, 224, 255, 0.08)'; // Very subtle cyan
      const majorGridColor = 'rgba(52, 224, 255, 0.15)'; // Slightly more visible for major lines
      
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 0.5 / zoom;
      
      // Draw vertical lines
      for (let x = 0; x <= 2000; x += gridSpacing) {
        const isMajor = x % 200 === 0; // Major lines every 200 units
        ctx.strokeStyle = isMajor ? majorGridColor : gridColor;
        ctx.lineWidth = isMajor ? 1 / zoom : 0.5 / zoom;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 2000);
        ctx.stroke();
      }
      
      // Draw horizontal lines
      for (let y = 0; y <= 2000; y += gridSpacing) {
        const isMajor = y % 200 === 0; // Major lines every 200 units
        ctx.strokeStyle = isMajor ? majorGridColor : gridColor;
        ctx.lineWidth = isMajor ? 1 / zoom : 0.5 / zoom;
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2000, y);
        ctx.stroke();
      }
    }

    // SYSTEM VIEW: Draw all systems and connections (no quadrant/grid view)
    {
      const visibleSystems = filteredSystems;
      
      // Draw nebula zones in background (color by radiation type)
      // Layer order: Dark (bottom) -> Quiet (middle) -> Static (top)
      const intensityMultiplier = nebulaIntensity / 100;
      const layerOrder = ['Dark', 'Quiet', 'Static'];
      
      layerOrder.forEach(layer => {
        visibleSystems.filter(s => s.zone === layer ||
          (layer === 'Dark' && s.radiation === 'Medium') ||
          (layer === 'Quiet' && s.radiation === 'Low') ||
          (layer === 'Static' && s.radiation === 'High')
        ).forEach(system => {
          const sysRng = makeRng(system.seed, 'nebula');

          // Radiation-based palette and density using brighter colors
          let colorInner, colorMid, baseCount, countVar, sizeMin, sizeMax, aInner, aMid;
          
          if (layer === 'Static' || system.radiation === 'High') {
            colorInner = '#ff1a6b'; // bright red-pink
            colorMid = '#B21C7F';
            baseCount = 2; countVar = 2; sizeMin = 70; sizeMax = 140; aInner = 0.35; aMid = 0.20;
          } else if (layer === 'Quiet' || system.radiation === 'Low') {
            colorInner = '#1a9fff'; // bright cyan-blue
            colorMid = '#1C4C7F';
            baseCount = 1; countVar = 1; sizeMin = 60; sizeMax = 120; aInner = 0.30; aMid = 0.18;
          } else { // Dark or Medium
            colorInner = '#b544ff'; // bright purple
            colorMid = '#711C7F';
            baseCount = 1; countVar = 2; sizeMin = 65; sizeMax = 130; aInner = 0.28; aMid = 0.16;
          }

          const count = baseCount + Math.floor(sysRng() * (countVar + 1));

          // Base haze to guarantee presence (reduced size)
          {
            const baseSize = lerp(sizeMax * 0.65, sizeMax * 0.85, sysRng()); // Reduced from 0.75-1.05
            const gradient = ctx.createRadialGradient(
              system.position.x, system.position.y, 0,
              system.position.x, system.position.y, baseSize
            );
            const alphaInner = Math.round(aInner * 0.6 * intensityMultiplier * 255).toString(16).padStart(2, '0');
            const alphaMid = Math.round(aMid * 0.6 * intensityMultiplier * 255).toString(16).padStart(2, '0');
            gradient.addColorStop(0, `${colorInner}${alphaInner}`);
            gradient.addColorStop(0.6, `${colorMid}${alphaMid}`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(system.position.x, system.position.y, baseSize, 0, Math.PI * 2);
            ctx.fill();
          }

          // Cloudlets for texture
          for (let i = 0; i < count; i++) {
            const spread = 130; // Reduced from 160
            const offsetX = (sysRng() - 0.5) * spread;
            const offsetY = (sysRng() - 0.5) * spread;
            const size = lerp(sizeMin, sizeMax, sysRng());

            const gradient = ctx.createRadialGradient(
              system.position.x + offsetX, system.position.y + offsetY, 0,
              system.position.x + offsetX, system.position.y + offsetY, size
            );
            const alphaInner = Math.round(aInner * intensityMultiplier * 255).toString(16).padStart(2, '0');
            const alphaMid = Math.round(aMid * intensityMultiplier * 255).toString(16).padStart(2, '0');
            gradient.addColorStop(0, `${colorInner}${alphaInner}`);
            gradient.addColorStop(0.5, `${colorMid}${alphaMid}`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(system.position.x + offsetX, system.position.y + offsetY, size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      });
      
      // Draw all connections first (behind systems)
      ctx.strokeStyle = 'rgba(52, 224, 255, 0.4)';
      ctx.lineWidth = 1.5 / zoom;
      visibleSystems.forEach(system => {
        // Draw forward connections
        system.connections.forward.forEach(targetId => {
          const target = galaxy.systems.find(s => s.id === targetId);
          if (target && visibleSystems.includes(target)) {
            ctx.beginPath();
            ctx.moveTo(system.position.x, system.position.y);
            ctx.lineTo(target.position.x, target.position.y);
            ctx.stroke();
          }
        });

        // Draw cross connections
        system.connections.cross.forEach(targetId => {
          const target = galaxy.systems.find(s => s.id === targetId);
          if (target && visibleSystems.includes(target)) {
            ctx.beginPath();
            ctx.moveTo(system.position.x, system.position.y);
            ctx.lineTo(target.position.x, target.position.y);
            ctx.stroke();
          }
        });
      });

      // Highlighted path overlay (neon green) - draw above base connections but below nodes
      if (highlightedPathIds.length > 1) {
        const pulse = 0.5 + 0.5 * Math.sin(animTime * 0.006);
        ctx.save();
        ctx.shadowBlur = 20 + 20 * pulse;
        ctx.shadowColor = 'rgba(0,255,136,0.9)';
        ctx.strokeStyle = `rgba(0,255,136,${0.6 + 0.3 * pulse})`;
        ctx.lineWidth = 2.5 / zoom;

        for (let i = 0; i < highlightedPathIds.length - 1; i++) {
          const a = galaxy.systems.find(s => s.id === highlightedPathIds[i]);
          const b = galaxy.systems.find(s => s.id === highlightedPathIds[i + 1]);
          if (!a || !b) continue;
          ctx.beginPath();
          ctx.moveTo(a.position.x, a.position.y);
          ctx.lineTo(b.position.x, b.position.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // Draw systems on top - size 2-5 based on system.size (star class)
      const shipState = getShipState();
      visibleSystems.forEach(system => {
        const isCurrent = system.id === currentSystemId;
        const isHovered = hoveredItem?.id === system.id;
        const isSelected = selectedItem?.id === system.id;
        const isScanned = shipState.isSystemScanned(system.id);
        const activeScan = shipState.state.activeScan;
        const isScanning = activeScan?.systemId === system.id;

        // Radius from generated size (2-5). Homebase slightly larger for visibility
        const baseSize = Math.max(2, Math.min(5, system.size || 3));
        const radius = isCurrent ? Math.max(6, baseSize + 1) : baseSize;
        
        // Glow effect for hovered/selected
        if (isHovered || isSelected) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = isScanned ? '#34e0ff' : '#1a5f7f';
        }

        ctx.beginPath();
        ctx.arc(system.position.x, system.position.y, radius, 0, Math.PI * 2);
        
        // Color based on scan status
        let gradient;
        if (isScanned) {
          // Scanned: bright cyan gradient
          gradient = ctx.createRadialGradient(
            system.position.x, system.position.y, 0,
            system.position.x, system.position.y, radius
          );
          gradient.addColorStop(0, 'rgba(52, 224, 255, 0.8)');
          gradient.addColorStop(0.6, 'rgba(52, 224, 255, 0.4)');
          gradient.addColorStop(1, 'rgba(52, 224, 255, 0.1)');
        } else {
          // Unscanned: darker blue
          gradient = ctx.createRadialGradient(
            system.position.x, system.position.y, 0,
            system.position.x, system.position.y, radius
          );
          gradient.addColorStop(0, 'rgba(26, 95, 127, 0.6)');
          gradient.addColorStop(0.6, 'rgba(26, 95, 127, 0.3)');
          gradient.addColorStop(1, 'rgba(26, 95, 127, 0.05)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fill();

        // Border color based on scan status
        const borderColor = isScanned ? 'rgba(52, 224, 255, 0.9)' : 'rgba(26, 95, 127, 0.7)';
        ctx.strokeStyle = isSelected ? (isScanned ? '#00ffff' : '#3a8fb5') : isHovered ? (isScanned ? '#34e0ff' : '#2a7fa5') : borderColor;
        ctx.lineWidth = (isSelected || isHovered) ? 2.5 / zoom : 1.8 / zoom;
        ctx.stroke();

        // Reset shadow
        ctx.shadowBlur = 0;

        // Scanning progress pie fill
        if (isScanning && activeScan) {
          const progress = activeScan.progress / 100;
          ctx.save();
          ctx.fillStyle = 'rgba(52, 224, 255, 0.4)';
          ctx.beginPath();
          ctx.moveTo(system.position.x, system.position.y);
          ctx.arc(
            system.position.x, 
            system.position.y, 
            radius,
            -Math.PI / 2, // Start at top
            -Math.PI / 2 + (Math.PI * 2 * progress), // Progress clockwise
            false
          );
          ctx.closePath();
          ctx.fill();
          
          // Scanning ring pulse
          const pulse = 0.5 + 0.5 * Math.sin(animTime * 0.01);
          ctx.shadowBlur = 15 + pulse * 15;
          ctx.shadowColor = 'rgba(52, 224, 255, 0.8)';
          ctx.strokeStyle = `rgba(52, 224, 255, ${0.6 + 0.3 * pulse})`;
          ctx.lineWidth = 2 / zoom;
          ctx.beginPath();
          ctx.arc(system.position.x, system.position.y, radius + 3, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // If this node is on the highlighted path (and not HOMEBASE), add a subtle green halo
        if (!isCurrent && highlightedPathIds.includes(system.id)) {
          const pulse = 0.5 + 0.5 * Math.sin(animTime * 0.006);
          const ringR = radius + 4 + pulse * 3;
          ctx.save();
          ctx.shadowBlur = 18 + pulse * 18;
          ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
          ctx.strokeStyle = `rgba(0, 255, 136, ${0.35 + 0.25 * pulse})`;
          ctx.lineWidth = 1.8 / zoom;
          ctx.beginPath();
          ctx.arc(system.position.x, system.position.y, ringR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // HOMEBASE pulsing neon green ring
        if (isCurrent) {
          const pulse = 0.5 + 0.5 * Math.sin(animTime * 0.006);
          const ringR = radius + 6 + pulse * 6;
          ctx.save();
          ctx.shadowBlur = 25 + pulse * 25;
          ctx.shadowColor = 'rgba(0, 255, 136, 0.9)';
          ctx.strokeStyle = `rgba(0, 255, 136, ${0.45 + 0.35 * pulse})`;
          ctx.lineWidth = 2 / zoom;
          ctx.beginPath();
          ctx.arc(system.position.x, system.position.y, ringR, 0, Math.PI * 2);
          ctx.stroke();
          // faint outer halo
          ctx.shadowBlur = 10 + pulse * 10;
          ctx.strokeStyle = `rgba(0, 255, 136, ${0.15 + 0.15 * pulse})`;
          ctx.lineWidth = 4 / zoom;
          ctx.beginPath();
          ctx.arc(system.position.x, system.position.y, ringR + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // System name - only visible if scanned, fixed size text
        if (isScanned) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform for fixed-size text
          
          // Convert world position to screen position
          const screenX = (system.position.x - 1000) * zoom + width / 2 + panOffset.x;
          const screenY = (system.position.y - 1000) * zoom + height / 2 + panOffset.y;
          const screenRadius = radius * zoom;
          
          ctx.fillStyle = '#34e0ff';
          ctx.font = '300 12px Roobert, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(system.name.toUpperCase(), screenX, screenY + screenRadius + 8);
          
          // Current location indicator
          if (isCurrent) {
            ctx.fillStyle = '#00ff88';
            ctx.font = '300 11px Roobert, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText('[ HOMEBASE ]', screenX, screenY - screenRadius - 8);
          }
          
          ctx.restore();
        }
      });
    }

    ctx.restore();
  }, [galaxy, filteredSystems, panOffset, zoom, currentSystemId, accessibleSystemIds, hoveredItem, selectedItem, width, height, animTime, highlightedPathIds, nebulaIntensity]);

  // Get grid or system at a canvas point
  const getItemAtPoint = (canvasX, canvasY) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Transform canvas coordinates to world coordinates
    // Rendering: translate(center+pan), scale(zoom), translate(-1000)
    // A point at world (x,y) becomes: (x-1000)*zoom + center + pan on canvas
    // So: canvasX = (worldX - 1000) * zoom + centerX + panOffset.x
    // Reversing: worldX = (canvasX - centerX - panOffset.x) / zoom + 1000
    const worldX = (canvasX - centerX - panOffset.x) / zoom + 1000;
    const worldY = (canvasY - centerY - panOffset.y) / zoom + 1000;

    // Check for system hits
    if (!isNaN(zoom)) {
      const visibleSystems = filteredSystems;
      
      for (const system of visibleSystems) {
        const baseSize = Math.max(2, Math.min(5, system.size || 3));
        const radius = system.id === currentSystemId ? Math.max(6, baseSize + 1) : baseSize;
        const dx = worldX - system.position.x;
        const dy = worldY - system.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          return system;
        }
      }
    }

    return null;
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    // Double-click to drill into system
    if (e.detail === 2 && selectedItem && selectedItem.position) {
      handleDrillIntoSystem(selectedItem);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    
    // Account for canvas CSS scaling
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedItem = getItemAtPoint(x, y);
    if (clickedItem) {
      setSelectedItem(clickedItem);
      // Show info modal at clicked position
      setSystemInfoModal({
        system: clickedItem,
        canvasX: x,
        canvasY: y
      });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setSystemInfoModal(null); // Close modal when clicking empty space
    }
  };

  // Drill into a system to view solar system detail
  const handleDrillIntoSystem = (system) => {
    setFadeState('fading-out');
    setTimeout(() => {
      setViewingSolarSystem(system);
      setFadeState('fading-in');
      setTimeout(() => setFadeState('visible'), 300);
    }, 300);
  };

  // Return from solar system view
  const handleBackFromSolarSystem = () => {
    setFadeState('fading-out');
    setTimeout(() => {
      setViewingSolarSystem(null);
      setFadeState('fading-in');
      setTimeout(() => setFadeState('visible'), 300);
    }, 300);
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Account for canvas CSS scaling
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Calculate world coordinates for grid position
    const centerX = width / 2;
    const centerY = height / 2;
    const worldX = (x - centerX - panOffset.x) / zoom + 1000;
    const worldY = (y - centerY - panOffset.y) / zoom + 1000;
    
    // Update cursor grid position (clamped to 0-2000 range)
    setCursorGridPos({
      x: Math.max(0, Math.min(2000, Math.floor(worldX))),
      y: Math.max(0, Math.min(2000, Math.floor(worldY)))
    });

    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      const item = getItemAtPoint(x, y);
      setHoveredItem(item);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // SCROLL ZOOM
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(5.0, prev * delta)));
  };

  const handleJump = () => {
    if (selectedItem && selectedItem.position && onSelectSystem) {
      // Check if accessible
      if (accessibleSystemIds.has(selectedItem.id)) {
        onSelectSystem(selectedItem);
        onClose();
      }
    }
  };

  const handleSurveyGrid = () => {
    if (selectedItem && selectedItem.bounds) {
      // TODO: Implement survey mechanics
      console.log('Survey grid:', selectedItem.id);
    }
  };

  const getRiskColor = (zone) => {
    switch(zone) {
      case 'Quiet': return '#0f0';
      case 'Dark': return '#ff0';
      case 'Static': return '#ff8800';
      default: return '#888';
    }
  };

  const getTierLabel = (tier) => {
    const tierNum = Math.ceil(tier * 4);
    return `T${tierNum}`;
  };

  // Main galaxy map JSX
  const galaxyMapJSX = (
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
            GALAXY MAP // {galaxy.name.toUpperCase()}
          </div>
          <div className="text-muted" style={{ fontSize: '10px' }}>
            Current Position: {currentSystem?.name || 'Unknown'} ({currentSystem?.zone}) 
            • Total Systems: {galaxy.systems.length}
          </div>
        </div>
        <button className="small-btn" onClick={onClose} style={{ fontSize: '10px', padding: '8px 16px' }}>
          CLOSE
        </button>
      </div>

      {/* Filters */}
      <div className="holo-border" style={{ padding: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="text-muted" style={{ fontSize: '8px' }}>FILTER:</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', 'Quiet', 'Dark', 'Static'].map(zone => (
              <button
                key={zone}
                className="small-btn"
                onClick={() => setFilterZone(zone)}
                style={{
                  fontSize: '7px',
                  padding: '3px 8px',
                  backgroundColor: filterZone === zone ? 'rgba(52, 224, 255, 0.3)' : 'transparent',
                  borderColor: filterZone === zone ? '#34e0ff' : 'rgba(52, 224, 255, 0.4)'
                }}
              >
                {zone}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['ALL', '1', '2', '3', '4'].map(tier => (
              <button
                key={tier}
                className="small-btn"
                onClick={() => setFilterTier(tier)}
                style={{
                  fontSize: '7px',
                  padding: '3px 8px',
                  backgroundColor: filterTier === tier ? 'rgba(52, 224, 255, 0.3)' : 'transparent',
                  borderColor: filterTier === tier ? '#34e0ff' : 'rgba(52, 224, 255, 0.4)'
                }}
              >
                {tier === 'ALL' ? 'ALL' : `T${tier}`}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <div className="text-muted" style={{ fontSize: '8px' }}>CURSOR:</div>
            <div className="text-muted" style={{ fontSize: '8px', minWidth: '80px', color: '#34e0ff' }}>
              X:{cursorGridPos.x} Y:{cursorGridPos.y}
            </div>
            
            <div className="text-muted" style={{ fontSize: '8px', marginLeft: '12px' }}>BG OPACITY:</div>
            <input
              type="range"
              min="0"
              max="100"
              value={nebulaIntensity}
              onChange={(e) => setNebulaIntensity(parseInt(e.target.value))}
              style={{
                width: '120px',
                accentColor: '#34e0ff',
                cursor: 'pointer'
              }}
            />
            <div className="text-muted" style={{ fontSize: '8px', minWidth: '32px' }}>{nebulaIntensity}%</div>
            
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
              onClick={() => {
                setNebulaIntensity(50);
                setZoom(0.5);
                setPanOffset({ x: 0, y: 0 });
              }}
              style={{ fontSize: '7px', padding: '4px 8px', marginLeft: '8px' }}
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* Canvas - Full Width */}
      <div ref={containerRef} className="holo-border" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ 
            cursor: isDragging ? 'grabbing' : hoveredItem ? 'pointer' : 'grab',
            display: 'block'
          }}
        />

          {/* Legend */}
          <div style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '8px', lineHeight: '1.8' }} className="text-muted">
            <div style={{ color: '#34e0ff', marginBottom: '4px' }}>SYSTEM VIEW</div>
            <div style={{ fontSize: '7px', marginBottom: '8px' }}>
              Scroll to zoom • Drag to pan • Click system for info
            </div>
            
            <div style={{ color: '#34e0ff' }}>● Current Position</div>
            <div style={{ color: '#8a2be2' }}>● Connected System</div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ color: '#34e0ff' }}>─ Branch Link</div>
            </div>
          </div>

          {/* System Info Modal - Speech Bubble */}
          {systemInfoModal && (() => {
            const { system, canvasX, canvasY } = systemInfoModal;
            if (!system || !system.position) return null;
            
            const shipState = getShipState();
            const isScanned = shipState.isSystemScanned(system.id);
            
            // Calculate distance only if both positions exist
            let distance = 0;
            try {
              if (currentSystem?.position && system?.position) {
                distance = calculateDistance(currentSystem.position, system.position);
              }
            } catch (e) {
              console.error('Distance calculation error:', e);
              distance = 0;
            }
            
            // Position modal above the system
            const modalX = canvasX;
            const modalY = canvasY - 120; // Position above system
            
            return (
              <div style={{
                position: 'absolute',
                left: `${modalX}px`,
                top: `${modalY}px`,
                transform: 'translate(-50%, 0)',
                background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 40, 60, 0.95) 100%)',
                border: '2px solid #34e0ff',
                borderRadius: '8px',
                padding: '12px 16px',
                minWidth: '200px',
                boxShadow: '0 0 20px rgba(52, 224, 255, 0.4), inset 0 0 10px rgba(52, 224, 255, 0.1)',
                pointerEvents: 'auto',
                zIndex: 100
              }}>
                {/* Speech bubble pointer */}
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '10px solid #34e0ff'
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-7px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '8px solid rgba(0, 40, 60, 0.95)'
                }} />

                {isScanned ? (
                  // Scanned system info
                  <>
                    <div style={{ fontSize: '11px', color: '#34e0ff', fontWeight: 'bold', marginBottom: '8px' }}>
                      {system.name.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '9px', color: '#cfd8df', marginBottom: '4px' }}>
                      Type: {system.type}
                    </div>
                    <div style={{ fontSize: '9px', color: '#cfd8df', marginBottom: '4px' }}>
                      Zone: {system.zone}
                    </div>
                    <div style={{ fontSize: '9px', color: '#cfd8df', marginBottom: '4px' }}>
                      Tier: {Math.ceil(system.tier * 4)}
                    </div>
                    <div style={{ fontSize: '9px', color: '#cfd8df', marginBottom: '12px' }}>
                      Distance: {(distance || 0).toFixed(1)} LY
                    </div>
                    
                    {scanQueue.length > 0 ? (
                      // If we're in the middle of scanning a route
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="small-btn"
                          onClick={() => {
                            shipState.cancelScan();
                            setScanQueue([]);
                            setSystemInfoModal(null);
                          }}
                          style={{ flex: 1, fontSize: '8px', padding: '6px', backgroundColor: 'rgba(255, 80, 80, 0.2)' }}
                        >
                          CANCEL
                        </button>
                        <button 
                          className="small-btn"
                          onClick={() => {
                            // Continue to next system
                            const nextSystemId = scanQueue[0];
                            setScanQueue(prev => prev.slice(1));
                            shipState.startScan(nextSystemId);
                            setSystemInfoModal(null);
                          }}
                          style={{ flex: 2, fontSize: '8px', padding: '6px' }}
                        >
                          CONTINUE ({scanQueue.length} LEFT)
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="small-btn"
                        onClick={() => {
                          // TODO: Plot route
                          console.log('Plot route to:', system.id);
                        }}
                        style={{ width: '100%', fontSize: '9px', padding: '6px' }}
                      >
                        PLOT ROUTE
                      </button>
                    )}
                  </>
                ) : (
                  // Unscanned system
                  <>
                    <div style={{ fontSize: '11px', color: '#1a5f7f', fontWeight: 'bold', marginBottom: '8px' }}>
                      UNSCANNED SYSTEM
                    </div>
                    <div style={{ fontSize: '9px', color: '#cfd8df', marginBottom: '12px' }}>
                      System data unavailable. Initiate scan sequence to reveal information.
                    </div>
                    <button 
                      className="small-btn"
                      onClick={() => {
                        // Calculate route from HOMEBASE to target system
                        const route = findSystemPathBFS(galaxy.systems, 'HOMEBASE', system.id);
                        
                        if (route && route.length > 0) {
                          // Find all unscanned systems in route
                          const shipState = getShipState();
                          const unscannedInRoute = route.filter(sysId => !shipState.isSystemScanned(sysId));
                          
                          if (unscannedInRoute.length > 0) {
                            // Start scanning first system
                            shipState.startScan(unscannedInRoute[0]);
                            // Queue remaining systems
                            setScanQueue(unscannedInRoute.slice(1));
                            // Close info modal
                            setSystemInfoModal(null);
                          }
                        }
                      }}
                      style={{ width: '100%', fontSize: '9px', padding: '6px' }}
                    >
                      SCAN ROUTE
                    </button>
                  </>
                )}
              </div>
            );
          })()}

          {/* Scan Complete Modal */}
          {scanCompleteModal && (() => {
            const { system } = scanCompleteModal;
            const shipState = getShipState();
            
            return (
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.98) 0%, rgba(0, 40, 60, 0.98) 100%)',
                border: '3px solid #34e0ff',
                borderRadius: '12px',
                padding: '24px',
                minWidth: '320px',
                maxWidth: '400px',
                boxShadow: '0 0 40px rgba(52, 224, 255, 0.6), inset 0 0 20px rgba(52, 224, 255, 0.1)',
                zIndex: 200
              }}>
                <div style={{ fontSize: '14px', color: '#00ff88', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                  SCAN COMPLETE
                </div>
                
                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(52, 224, 255, 0.1)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '12px', color: '#34e0ff', fontWeight: 'bold', marginBottom: '8px' }}>
                    {system.name.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '10px', color: '#cfd8df', marginBottom: '4px' }}>
                    Type: {system.type}
                  </div>
                  <div style={{ fontSize: '10px', color: '#cfd8df', marginBottom: '4px' }}>
                    Zone: {system.zone}
                  </div>
                  <div style={{ fontSize: '10px', color: '#cfd8df', marginBottom: '4px' }}>
                    Tier: {Math.ceil(system.tier * 4)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#cfd8df' }}>
                    Radiation: {system.radiation}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {shipState.state.activeScan && (
                    <button 
                      className="small-btn"
                      onClick={() => {
                        shipState.cancelScan();
                        setScanQueue([]);
                        setScanCompleteModal(null);
                      }}
                      style={{ flex: 1, fontSize: '9px', padding: '8px', backgroundColor: 'rgba(255, 80, 80, 0.2)' }}
                    >
                      STOP SCAN
                    </button>
                  )}
                  
                  {scanQueue.length > 0 && (
                    <button 
                      className="small-btn"
                      onClick={() => {
                        setScanCompleteModal(null);
                      }}
                      style={{ flex: 1, fontSize: '9px', padding: '8px' }}
                    >
                      SCAN NEXT ({scanQueue.length})
                    </button>
                  )}
                  
                  <button 
                    className="small-btn"
                    onClick={() => {
                      setScanCompleteModal(null);
                    }}
                    style={{ flex: 1, fontSize: '9px', padding: '8px' }}
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

      {/* Footer */}
      <div className="text-muted" style={{ fontSize: '8px', marginTop: '16px', opacity: 0.7, textAlign: 'center' }}>
        {'> '}DRAG TO PAN • SCROLL TO ZOOM • CLICK SYSTEM FOR INFO
      </div>
    </div>
  );

  // Render solar system view if drilling down
  if (viewingSolarSystem) {
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
        padding: '20px',
        opacity: fadeState === 'visible' ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}>
        <SolarSystemViewer 
          system={viewingSolarSystem} 
          onClose={handleBackFromSolarSystem}
          width={width}
          height={height}
        />
      </div>
    );
  }

  // Render galaxy map
  return (
    <div style={{ 
      opacity: fadeState === 'visible' ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out'
    }}>
      {galaxyMapJSX}
    </div>
  );
};

export default GalaxyViewer;
