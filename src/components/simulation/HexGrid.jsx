import React, { useState, useEffect, useRef } from 'react';

const HexGrid = ({ 
  playerShips, 
  enemyShips, 
  selectedShip, 
  selectedCard, 
  onHexClick,
  gamePhase,
  setPlayerShips,
  setEnemyShips,
  onHoverHexChange
}) => {
  const canvasRef = useRef(null);
  const [hoveredHex, setHoveredHex] = useState(null);
  const [gridWidth] = useState(30);
  const [gridHeight] = useState(20);
  const [hexSize] = useState(22);
  const [terrain, setTerrain] = useState({});
  const lastMouseMoveRef = useRef(0);
  const animationFrameRef = useRef(0);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    generateTerrain();
  }, []);

  // Redraw when ships or selections change
  useEffect(() => {
    drawGrid();
  }, [playerShips, enemyShips, selectedShip, selectedCard, terrain]);

  const generateTerrain = () => {
    const newTerrain = {};
    
    // Generate random terrain features
    for (let q = 0; q < gridWidth; q++) {
      for (let r = 0; r < gridHeight; r++) {
        const key = `${q},${r}`;
        const rand = Math.random();
        
        if (rand < 0.06) {
          // Radiation/Surge zones - causes disadvantage on rolls
          const intensity = 0.3 + Math.random() * 0.5; // 0.3 to 0.8
          newTerrain[key] = { type: 'radiation', intensity };
        } else if (rand < 0.12) {
          // Fortified positions - directional advantage
          // Random 3 consecutive sides (0-5, representing hex sides)
          const startSide = Math.floor(Math.random() * 6);
          const sides = [startSide, (startSide + 1) % 6, (startSide + 2) % 6];
          newTerrain[key] = { type: 'fortified', sides };
        }
      }
    }
    
    setTerrain(newTerrain);
  };

  const drawGrid = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas with transparent background
    ctx.clearRect(0, 0, width, height);

    // FIRST: Draw all normal hexes (complete grid)
    for (let q = 0; q < gridWidth; q++) {
      for (let r = 0; r < gridHeight; r++) {
        const { x, y } = hexToPixel({ q, r });
        drawNormalHex(ctx, x, y, false);
      }
    }

    // SECOND: Draw terrain effects on top (overlays)
    for (let q = 0; q < gridWidth; q++) {
      for (let r = 0; r < gridHeight; r++) {
        const key = `${q},${r}`;
        const terrainData = terrain[key];
        if (terrainData) {
          const { x, y } = hexToPixel({ q, r });
          drawTerrainOverlay(ctx, x, y, terrainData);
        }
      }
    }

    // THIRD: Draw ships on hexes
    for (let q = 0; q < gridWidth; q++) {
      for (let r = 0; r < gridHeight; r++) {
        const shipOnHex = [...playerShips, ...enemyShips].find(
          s => s.hex?.q === q && s.hex?.r === r
        );
        if (shipOnHex) {
          const { x, y } = hexToPixel({ q, r });
          drawShip(ctx, x, y, shipOnHex);
        }
      }
    }

    // FOURTH: Draw movement/attack range if card selected
    if (selectedCard && selectedShip) {
      drawCardRange(ctx, selectedCard, selectedShip);
    }
  };

  const drawNormalHex = (ctx, x, y, isHovered) => {
    const corners = getHexCorners(x, y);
    
    ctx.beginPath();
    corners.forEach((corner, i) => {
      if (i === 0) ctx.moveTo(corner.x, corner.y);
      else ctx.lineTo(corner.x, corner.y);
    });
    ctx.closePath();

    // Fill
    ctx.fillStyle = 'rgba(0, 20, 30, 0.3)';
    ctx.fill();

    // Stroke
    ctx.strokeStyle = 'rgba(52, 224, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawHoverEffect = (ctx, x, y) => {
    const corners = getHexCorners(x, y);
    
    ctx.beginPath();
    corners.forEach((corner, i) => {
      if (i === 0) ctx.moveTo(corner.x, corner.y);
      else ctx.lineTo(corner.x, corner.y);
    });
    ctx.closePath();

    // Bright fill
    ctx.fillStyle = 'rgba(52, 224, 255, 0.2)';
    ctx.fill();

    // Bright glowing stroke
    ctx.strokeStyle = 'rgba(52, 224, 255, 0.9)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#34e0ff';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawTerrainOverlay = (ctx, x, y, terrainData) => {
    const corners = getHexCorners(x, y);
    
    if (terrainData.type === 'radiation') {
      // Radiation/Surge zone - static glow effect (no animation)
      const intensity = terrainData.intensity || 0.5;
      const glowAlpha = intensity * 0.2;
      
      ctx.beginPath();
      corners.forEach((corner, i) => {
        if (i === 0) ctx.moveTo(corner.x, corner.y);
        else ctx.lineTo(corner.x, corner.y);
      });
      ctx.closePath();
      
      // Static cyan glow fill
      ctx.fillStyle = `rgba(52, 224, 255, ${glowAlpha})`;
      ctx.fill();
      
      // Subtle border
      ctx.strokeStyle = `rgba(52, 224, 255, ${intensity * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
    } else if (terrainData.type === 'fortified') {
      // Fortified position - half borders (3 sides)
      const sides = terrainData.sides || [0, 1, 2];
      
      // Draw only the 3 consecutive sides
      ctx.strokeStyle = '#34e0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#34e0ff';
      ctx.shadowBlur = 8;
      
      sides.forEach(sideIndex => {
        const corner1 = corners[sideIndex];
        const corner2 = corners[(sideIndex + 1) % 6];
        
        ctx.beginPath();
        ctx.moveTo(corner1.x, corner1.y);
        ctx.lineTo(corner2.x, corner2.y);
        ctx.stroke();
      });
      
      ctx.shadowBlur = 0;
    }
  };

  const drawTerrainIcon = (ctx, x, y, type) => {
    // Icons removed - effects are now purely visual (glow/borders)
  };

  const drawShip = (ctx, x, y, ship) => {
    const isSelected = selectedShip?.id === ship.id;
    const isEnemy = ship.faction === 'enemy';

    // Ship background glow - smaller
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = isEnemy 
      ? 'rgba(231, 76, 60, 0.3)' 
      : 'rgba(52, 224, 255, 0.3)';
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = isEnemy ? '#e74c3c' : '#34e0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = isEnemy ? '#e74c3c' : '#34e0ff';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Ship icon - smaller triangle
    ctx.fillStyle = isEnemy ? '#e74c3c' : '#34e0ff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isEnemy ? '▼' : '▲', x, y);

    // Health bars - smaller and closer
    const barWidth = 28;
    const barHeight = 3;
    const barX = x - barWidth / 2;
    const barY = y + 16;

    // Hull bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const hullPercent = ship.currentHull / ship.maxHull;
    ctx.fillStyle = hullPercent > 0.5 ? '#2ecc71' : hullPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barWidth * hullPercent, barHeight);

    // Shield bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(barX, barY + 5, barWidth, barHeight);
    
    const shieldPercent = ship.currentShield / ship.maxShield;
    ctx.fillStyle = '#3498db';
    ctx.fillRect(barX, barY + 5, barWidth * shieldPercent, barHeight);
  };

  const drawCardRange = (ctx, card, ship) => {
    if (!ship.hex) return;

    const range = card.range || (card.type === 'Movement' ? 3 : 5);
    const { x: centerX, y: centerY } = hexToPixel(ship.hex);

    // Draw range hexes
    for (let q = 0; q < gridWidth; q++) {
      for (let r = 0; r < gridHeight; r++) {
        const distance = hexDistance(ship.hex, { q, r });
        if (distance > 0 && distance <= range) {
          const { x, y } = hexToPixel({ q, r });
          const corners = getHexCorners(x, y);

          ctx.beginPath();
          corners.forEach((corner, i) => {
            if (i === 0) ctx.moveTo(corner.x, corner.y);
            else ctx.lineTo(corner.x, corner.y);
          });
          ctx.closePath();

          const color = card.type === 'Movement' ? '52, 224, 255' : '231, 76, 60';
          ctx.fillStyle = `rgba(${color}, 0.1)`;
          ctx.fill();
          ctx.strokeStyle = `rgba(${color}, 0.4)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
  };

  const getHexCorners = (x, y) => {
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i + Math.PI / 6; // Offset by 30° for flat-top
      corners.push({
        x: x + hexSize * Math.cos(angle),
        y: y + hexSize * Math.sin(angle)
      });
    }
    return corners;
  };

  const hexToPixel = (hex) => {
    // Flat-top offset-r coordinates
    const xOffset = (hex.r % 2) * hexSize * Math.sqrt(3) / 2;
    const x = hex.q * hexSize * Math.sqrt(3) + xOffset + 60;
    const y = hex.r * hexSize * 1.5 + 60;
    return { x, y };
  };

  const pixelToHex = (x, y) => {
    // More precise conversion for flat-top offset coordinates
    const py = (y - 60) / (hexSize * 1.5);
    const r = Math.floor(py + 0.5);
    
    const xOffset = (r % 2) * hexSize * Math.sqrt(3) / 2;
    const px = (x - 60 - xOffset) / (hexSize * Math.sqrt(3));
    const q = Math.floor(px + 0.5);
    
    return { q: Math.max(0, Math.min(gridWidth - 1, q)), 
             r: Math.max(0, Math.min(gridHeight - 1, r)) };
  };

  const axialRound = (q, r) => {
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  };

  const hexDistance = (a, b) => {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  };

  const handleCanvasClick = (e) => {
    if (isDragging) return; // Don't process clicks during drag

    const rect = canvasRef.current.getBoundingClientRect();
    
    // Get the actual canvas dimensions
    const canvasWidth = 1200;
    const canvasHeight = 900;
    
    // Calculate the center of the canvas in screen space
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Get mouse position relative to center
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Reverse the transformations (zoom then pan)
    const x = (mouseX / zoom) + (canvasWidth / 2);
    const y = (mouseY / zoom) + (canvasHeight / 2);
    
    const hex = pixelToHex(x, y);

    // Check if hex is valid
    if (hex.q >= 0 && hex.q < gridWidth && hex.r >= 0 && hex.r < gridHeight) {
      if (gamePhase === 'setup') {
        // Place ship on hex
        handleShipPlacement(hex);
      } else if (gamePhase === 'combat') {
        // Use selected card on hex
        const targetShip = [...playerShips, ...enemyShips].find(
          s => s.hex?.q === hex.q && s.hex?.r === hex.r
        );
        onHexClick(hex, targetShip);
      }
    }
  };

  const handleShipPlacement = (hex) => {
    if (!selectedShip) return;

    // Check if hex is occupied
    const occupied = [...playerShips, ...enemyShips].some(
      s => s.hex?.q === hex.q && s.hex?.r === hex.r
    );

    if (occupied) return;

    // Place ship
    const updatedShip = { ...selectedShip, hex };
    if (selectedShip.faction === 'player') {
      setPlayerShips(prev => prev.map(s => s.id === selectedShip.id ? updatedShip : s));
    } else {
      setEnemyShips(prev => prev.map(s => s.id === selectedShip.id ? updatedShip : s));
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    
    // Get the actual canvas dimensions
    const canvasWidth = 1200;
    const canvasHeight = 900;
    
    // Calculate the center of the canvas in screen space
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Get mouse position relative to center
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Reverse the transformations (zoom then pan)
    const x = (mouseX / zoom) + (canvasWidth / 2);
    const y = (mouseY / zoom) + (canvasHeight / 2);
    
    const hex = pixelToHex(x, y);

    if (hex.q >= 0 && hex.q < gridWidth && hex.r >= 0 && hex.r < gridHeight) {
      setHoveredHex(hex);
      if (onHoverHexChange) {
        onHoverHexChange(hex);
      }
    } else {
      setHoveredHex(null);
      if (onHoverHexChange) {
        onHoverHexChange(null);
      }
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(2, prev + 0.2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.5, prev - 0.2));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomSlider = (e) => {
    setZoom(parseFloat(e.target.value));
  };

  return (
    <div className="hex-grid-wrapper">
      <div className="hex-grid-background" />
      <div className="hex-grid-gradient" />
      
      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">−</button>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1" 
          value={zoom} 
          onChange={handleZoomSlider}
          className="zoom-slider"
        />
        <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">+</button>
        <button className="zoom-btn zoom-reset" onClick={handleZoomReset} title="Reset View">⊙</button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
      </div>

      <canvas
        ref={canvasRef}
        width={1200}
        height={900}
        style={{ 
          width: '1200px', 
          height: '900px',
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        className="hex-grid-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setHoveredHex(null);
          setIsDragging(false);
        }}
      />
    </div>
  );
};

export default HexGrid;
