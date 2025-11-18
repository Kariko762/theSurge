import { useState, useRef, useEffect, useMemo } from 'react'
import { generateUniverse } from '../lib/galaxyGenerator.js'

/**
 * UniverseViewer - Interactive map showing all galaxies with connections
 * Pan/zoom/drag functionality similar to solar system view
 */

const UniverseViewer = ({ onClose, onSelectGalaxy }) => {
  const canvasRef = useRef(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.6);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredGalaxy, setHoveredGalaxy] = useState(null);
  const [selectedGalaxy, setSelectedGalaxy] = useState(null);

  // Generate universe (memoized)
  const universe = useMemo(() => generateUniverse(5), []);

  // Canvas dimensions
  const width = 1400;
  const height = 800;

  // Draw the universe map
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas with deep space background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // BACKGROUND LAYER: Starfield (screen-space)
    ctx.save();
    const starSeed = 12345;
    const starCount = 800;
    let starRng = starSeed;
    const nextRandom = () => {
      starRng = (starRng * 1103515245 + 12345) & 0x7fffffff;
      return starRng / 0x7fffffff;
    };
    
    for (let i = 0; i < starCount; i++) {
      const x = nextRandom() * width;
      const y = nextRandom() * height;
      const brightness = nextRandom();
      const radius = brightness > 0.98 ? 1.5 : brightness > 0.92 ? 1.0 : 0.6;
      ctx.fillStyle = `rgba(255,255,255,${0.2 + brightness * 0.5})`;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // NEBULA LAYER: Subtle color regions (screen-space)
    ctx.save();
    const nebulaColors = [
      { color: '#231C7F', alpha: 0.08 }, // Blue
      { color: '#711C7F', alpha: 0.08 }, // Purple
      { color: '#B21C7F', alpha: 0.08 }  // Red
    ];
    
    let nebulaRng = 54321;
    const nebulaRandom = () => {
      nebulaRng = (nebulaRng * 1103515245 + 12345) & 0x7fffffff;
      return nebulaRng / 0x7fffffff;
    };
    
    for (let i = 0; i < 6; i++) {
      const x = nebulaRandom() * width;
      const y = nebulaRandom() * height;
      const size = 200 + nebulaRandom() * 300;
      const colorData = nebulaColors[Math.floor(nebulaRandom() * nebulaColors.length)];
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `${colorData.color}${Math.floor(colorData.alpha * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.5, `${colorData.color}${Math.floor(colorData.alpha * 0.5 * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    // GRID LAYER: Neon green holo-style grid (screen-space, behind galaxies)galaxies)
    ctx.save();
    const gridSize = 80; // Grid cell size in pixels
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.12)'; // Neon green
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 4]);
    
    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    ctx.setLineDash([]); // Reset line dash
    ctx.restore();

    // Apply transform for galaxy rendering
    ctx.save();
    ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw connections first (under galaxies)
    ctx.strokeStyle = 'rgba(52, 224, 255, 0.3)';
    ctx.lineWidth = 1.5 / zoom;
    universe.connections.forEach(conn => {
      const fromGalaxy = universe.galaxies.find(g => g.id === conn.from);
      const toGalaxy = universe.galaxies.find(g => g.id === conn.to);
      
      if (fromGalaxy && toGalaxy) {
        ctx.beginPath();
        ctx.moveTo(fromGalaxy.position.x, fromGalaxy.position.y);
        ctx.lineTo(toGalaxy.position.x, toGalaxy.position.y);
        ctx.stroke();
      }
    });

    // Draw galaxies
    universe.galaxies.forEach(galaxy => {
      const isHome = galaxy.id === universe.homeGalaxyId;
      const isHovered = hoveredGalaxy?.id === galaxy.id;
      const isSelected = selectedGalaxy?.id === galaxy.id;

      // Galaxy circle - smaller, uniform cyan
      const radius = isHome ? 50 : 35;
      
      // Glow effect for hovered/selected
      if (isHovered || isSelected) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#34e0ff';
      }

      ctx.beginPath();
      ctx.arc(galaxy.position.x, galaxy.position.y, radius, 0, Math.PI * 2);
      
      // Fill - all cyan/teal
      const gradient = ctx.createRadialGradient(
        galaxy.position.x, galaxy.position.y, 0,
        galaxy.position.x, galaxy.position.y, radius
      );
      
      gradient.addColorStop(0, 'rgba(52, 224, 255, 0.6)');
      gradient.addColorStop(0.5, 'rgba(52, 224, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(52, 224, 255, 0.1)');
      
      ctx.fillStyle = gradient;
      ctx.fill();

      // Border - neon cyan
      ctx.strokeStyle = isSelected ? '#00ffff' : isHovered ? '#34e0ff' : 'rgba(52, 224, 255, 0.8)';
      ctx.lineWidth = isSelected || isHovered ? 2.5 / zoom : 1.5 / zoom;
      ctx.stroke();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Galaxy name below circle
      ctx.fillStyle = '#34e0ff';
      ctx.font = `${12 / zoom}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(galaxy.name.toUpperCase(), galaxy.position.x, galaxy.position.y + radius + 10 / zoom);

      // Home indicator above circle
      if (isHome) {
        ctx.fillStyle = '#34e0ff';
        ctx.font = `${9 / zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('[ HOMEBASE ]', galaxy.position.x, galaxy.position.y - radius - 8 / zoom);
      }
    });

    ctx.restore();
  }, [universe, panOffset, zoom, hoveredGalaxy, selectedGalaxy, width, height]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Account for canvas CSS scaling
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check if clicking on a galaxy
    const clickedGalaxy = getGalaxyAtPoint(x, y);
    if (clickedGalaxy) {
      setSelectedGalaxy(clickedGalaxy);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    
    // Account for canvas CSS scaling
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      // Update hovered galaxy
      const galaxy = getGalaxyAtPoint(x, y);
      setHoveredGalaxy(galaxy);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3.0, prev * delta)));
  };

  const getGalaxyAtPoint = (canvasX, canvasY) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Transform canvas coordinates to world coordinates
    const worldX = (canvasX - centerX - panOffset.x) / zoom;
    const worldY = (canvasY - centerY - panOffset.y) / zoom;

    // Check each galaxy
    for (const galaxy of universe.galaxies) {
      const radius = galaxy.id === universe.homeGalaxyId ? 120 : 80;
      const dx = worldX - galaxy.position.x;
      const dy = worldY - galaxy.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= radius) {
        return galaxy;
      }
    }

    return null;
  };

  const handleEnterGalaxy = () => {
    if (selectedGalaxy && onSelectGalaxy) {
      onSelectGalaxy(selectedGalaxy);
    }
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
            UNIVERSE MAP // CHARTED GALAXIES
          </div>
          <div className="text-muted" style={{ fontSize: '10px' }}>
            Total Galaxies: {universe.galaxies.length} • Homebase: {universe.galaxies[0]?.name}
          </div>
        </div>
        <button className="small-btn" onClick={onClose} style={{ fontSize: '10px', padding: '8px 16px' }}>
          CLOSE
        </button>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
        {/* Map Canvas */}
        <div className="holo-border" style={{ flex: 3, position: 'relative', overflow: 'hidden' }}>
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
              cursor: isDragging ? 'grabbing' : hoveredGalaxy ? 'pointer' : 'grab',
              display: 'block',
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          />

          {/* Controls */}
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="small-btn" onClick={() => setZoom(prev => Math.min(3.0, prev * 1.2))} style={{ fontSize: '12px', padding: '6px 12px' }}>
              +
            </button>
            <button className="small-btn" onClick={() => setZoom(prev => Math.max(0.3, prev * 0.8))} style={{ fontSize: '12px', padding: '6px 12px' }}>
              −
            </button>
            <button className="small-btn" onClick={() => { setPanOffset({ x: 0, y: 0 }); setZoom(0.6); }} style={{ fontSize: '8px', padding: '6px 12px' }}>
              RESET
            </button>
          </div>
        </div>

        {/* Info Panel */}
        <div className="holo-border holo-scroll" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <div className="text-muted" style={{ fontSize: '9px', marginBottom: '16px' }}>
            {'> '}GALAXY DETAILS
          </div>

          {!selectedGalaxy && (
            <div className="text-muted" style={{ fontSize: '10px', fontStyle: 'italic', opacity: 0.6 }}>
              Click a galaxy to view details
            </div>
          )}

          {selectedGalaxy && (
            <div>
              <div className="holo-text" style={{ fontSize: '13px', marginBottom: '12px' }}>
                {selectedGalaxy.name.toUpperCase()}
              </div>

              {selectedGalaxy.id === universe.homeGalaxyId && (
                <div style={{ fontSize: '10px', color: '#34e0ff', marginBottom: '12px' }}>
                  [ HOMEBASE LOCATION ]
                </div>
              )}

              <div className="data-cell" style={{ marginBottom: '12px' }}>
                <div className="data-cell-label">Total Systems</div>
                <div className="data-cell-value">{selectedGalaxy.systemCount}</div>
              </div>

              <div className="data-cell" style={{ marginBottom: '12px' }}>
                <div className="data-cell-label">Galaxy ID</div>
                <div className="text-muted" style={{ fontSize: '8px', fontFamily: 'monospace' }}>
                  {selectedGalaxy.id}
                </div>
              </div>

              {/* Connection info */}
              <div className="text-muted" style={{ fontSize: '8px', marginTop: '16px', marginBottom: '8px' }}>
                Warp Gate Connections
              </div>
              <div style={{ fontSize: '9px', color: '#a855f7', lineHeight: '1.6' }}>
                {universe.connections
                  .filter(c => c.from === selectedGalaxy.id || c.to === selectedGalaxy.id)
                  .map((conn, idx) => {
                    const otherGalaxyId = conn.from === selectedGalaxy.id ? conn.to : conn.from;
                    const otherGalaxy = universe.galaxies.find(g => g.id === otherGalaxyId);
                    return (
                      <div key={idx}>→ {otherGalaxy?.name || 'Unknown'}</div>
                    );
                  })}
              </div>

              <button
                className="action-btn"
                onClick={handleEnterGalaxy}
                style={{ width: '100%', marginTop: '24px' }}
              >
                ENTER GALAXY
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-muted" style={{ fontSize: '8px', marginTop: '16px', opacity: 0.7, textAlign: 'center' }}>
        {'> '}DRAG TO PAN • SCROLL TO ZOOM • CLICK GALAXY TO SELECT • Purple lines show warp gate connections
      </div>
    </div>
  );
};

export default UniverseViewer;
