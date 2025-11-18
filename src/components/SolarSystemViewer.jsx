import React, { useState, useRef, useEffect } from 'react';
import { generateSystem, calculateStaticExposure } from '../lib/systemGenerator';

const SolarSystemViewer = ({ system, onClose, width = 1400, height = 800 }) => {
  const canvasRef = useRef(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [hoveredPOI, setHoveredPOI] = useState(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Generate the solar system data
  const solarSystem = generateSystem(system.seed);

  // Convert all POIs (orbits + extras) into a flat list with positions
  const allPOIs = [
    ...solarSystem.orbits.map(orbit => ({
      ...orbit,
      x: Math.cos(orbit.angleRad) * orbit.distanceAU * 30, // Scale AU to pixels
      y: Math.sin(orbit.angleRad) * orbit.distanceAU * 30,
      isPlanet: true
    })),
    ...solarSystem.extras.map(extra => ({
      ...extra,
      x: Math.cos(extra.angleRad) * extra.distanceAU * 30,
      y: Math.sin(extra.angleRad) * extra.distanceAU * 30,
      isPlanet: false
    }))
  ];

  // Build path network (not everything to everything)
  const buildPathNetwork = () => {
    const paths = [];
    const sorted = [...allPOIs].sort((a, b) => a.distanceAU - b.distanceAU);
    
    sorted.forEach((poi, idx) => {
      // Connect to 2-3 nearest neighbors
      const connectionCount = Math.min(2 + Math.floor(Math.random() * 2), sorted.length - idx - 1);
      
      for (let i = 1; i <= connectionCount; i++) {
        if (idx + i < sorted.length) {
          paths.push({
            from: poi,
            to: sorted[idx + i]
          });
        }
      }
    });
    
    return paths;
  };

  const paths = buildPathNetwork();

  // Draw solar system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Apply transform
    ctx.save();
    ctx.translate(centerX + panOffset.x, centerY + panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw surge radiation zones (nebula background)
    solarSystem.zones.surgeLoci.forEach(locus => {
      const x = Math.cos(locus.angle) * locus.au * 30;
      const y = Math.sin(locus.angle) * locus.au * 30;
      const radius = 150 * locus.strength;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const intensity = locus.strength * 0.3;
      gradient.addColorStop(0, `rgba(255, 100, 100, ${intensity})`);
      gradient.addColorStop(0.5, `rgba(200, 50, 150, ${intensity * 0.5})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    // Draw central star
    const starRadius = 25;
    ctx.shadowBlur = 40;
    ctx.shadowColor = '#34e0ff';
    ctx.beginPath();
    ctx.arc(0, 0, starRadius, 0, Math.PI * 2);
    
    const starGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, starRadius);
    starGradient.addColorStop(0, '#ffffff');
    starGradient.addColorStop(0.5, '#34e0ff');
    starGradient.addColorStop(1, 'rgba(52, 224, 255, 0.3)');
    ctx.fillStyle = starGradient;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw paths first (behind POIs)
    ctx.strokeStyle = '#34e0ff';
    ctx.lineWidth = 1.5 / zoom;
    paths.forEach(path => {
      ctx.beginPath();
      ctx.moveTo(path.from.x, path.from.y);
      ctx.lineTo(path.to.x, path.to.y);
      ctx.stroke();
    });

    // Draw POIs as small neon dots
    allPOIs.forEach(poi => {
      const isHovered = hoveredPOI?.parent?.id === poi.parent?.id;
      const isSelected = selectedPOI?.parent?.id === poi.parent?.id;
      const radius = isSelected ? 8 : isHovered ? 6 : 4;

      // Glow effect
      if (isHovered || isSelected) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#34e0ff';
      }

      ctx.beginPath();
      ctx.arc(poi.x, poi.y, radius, 0, Math.PI * 2);
      
      // Fill with cyan
      ctx.fillStyle = isSelected ? '#00ffff' : '#34e0ff';
      ctx.fill();

      // Border
      ctx.strokeStyle = '#34e0ff';
      ctx.lineWidth = 1 / zoom;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Label for selected/hovered POIs
      if (isSelected || isHovered) {
        ctx.fillStyle = '#34e0ff';
        ctx.font = `${10 / zoom}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(poi.parent.name, poi.x, poi.y + radius + 5 / zoom);
      }
    });

    ctx.restore();
  }, [solarSystem, allPOIs, paths, panOffset, zoom, hoveredPOI, selectedPOI, width, height]);

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (selectedPOI) return; // Locked when POI selected

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const clickedPOI = getPOIAtPoint(x, y);
    if (clickedPOI) {
      setSelectedPOI(clickedPOI);
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (selectedPOI) return; // No interaction when locked

    const rect = canvasRef.current.getBoundingClientRect();
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
      const poi = getPOIAtPoint(x, y);
      setHoveredPOI(poi);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (selectedPOI) return; // No zoom when locked
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.5, Math.min(3.0, prev * delta)));
  };

  const getPOIAtPoint = (canvasX, canvasY) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const worldX = (canvasX - centerX - panOffset.x) / zoom;
    const worldY = (canvasY - centerY - panOffset.y) / zoom;

    for (const poi of allPOIs) {
      const dx = worldX - poi.x;
      const dy = worldY - poi.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = selectedPOI?.parent?.id === poi.parent?.id ? 8 : hoveredPOI?.parent?.id === poi.parent?.id ? 6 : 4;

      if (distance <= radius) {
        return poi;
      }
    }

    return null;
  };

  const handlePOIClick = (poi) => {
    if (selectedPOI?.parent?.id === poi.parent?.id) {
      setSelectedPOI(null); // Deselect if clicking same POI
    } else {
      setSelectedPOI(poi);
      // Center on POI
      setPanOffset({
        x: -poi.x * zoom + width / 2,
        y: -poi.y * zoom + height / 2
      });
    }
  };

  const getStaticLevel = (distanceAU) => {
    const exposure = calculateStaticExposure(solarSystem, distanceAU);
    return Math.round(exposure * 10) / 10;
  };

  const getRiskColor = (level) => {
    if (level < 10) return '#0f0';
    if (level < 30) return '#ff0';
    if (level < 60) return '#ff8800';
    return '#f00';
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <div>
          <div className="holo-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
            SOLAR SYSTEM // {system.name.toUpperCase()}
          </div>
          <div className="text-muted" style={{ fontSize: '10px' }}>
            Star Class: {solarSystem.star.class} • Zone: {solarSystem.galactic.zone} • Surge: {solarSystem.galactic.surgeRadiation} mSv/h
          </div>
        </div>
        <button className="small-btn" onClick={onClose} style={{ fontSize: '10px', padding: '8px 16px' }}>
          CLOSE
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: 0 }}>
      {/* Canvas */}
      <div className="holo-border" style={{ flex: selectedPOI ? 3 : 1, position: 'relative', overflow: 'hidden' }}>
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
            cursor: selectedPOI ? 'default' : isDragging ? 'grabbing' : hoveredPOI ? 'pointer' : 'grab',
            display: 'block',
            maxWidth: '100%',
            maxHeight: '100%'
          }}
        />

        {/* Legend */}
        <div style={{ position: 'absolute', bottom: '16px', left: '16px', fontSize: '8px' }} className="text-muted">
          <div style={{ marginBottom: '4px', color: '#34e0ff' }}>CONTROLS</div>
          <div>Drag to pan • Scroll to zoom • Click POI to select</div>
        </div>
      </div>

      {/* POI Detail Pane */}
      {selectedPOI && (
        <div className="holo-border" style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '400px',
          backgroundColor: '#000',
          padding: '16px',
          overflowY: 'auto',
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <button
            onClick={() => setSelectedPOI(null)}
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
            {'> '}POI DETAILS
          </div>

          <div className="holo-text" style={{ fontSize: '13px', marginBottom: '12px' }}>
            {selectedPOI.parent.name.toUpperCase()}
          </div>

          <div className="data-cell" style={{ marginBottom: '12px' }}>
            <div className="data-cell-label">Type</div>
            <div className="data-cell-value">{selectedPOI.parent.type.toUpperCase()}</div>
          </div>

          <div className="data-cell" style={{ marginBottom: '12px' }}>
            <div className="data-cell-label">Size</div>
            <div className="data-cell-value">{selectedPOI.parent.size}</div>
          </div>

          <div className="data-cell" style={{ marginBottom: '12px' }}>
            <div className="data-cell-label">Distance</div>
            <div className="data-cell-value">{selectedPOI.distanceAU?.toFixed(2) || 'N/A'} AU</div>
          </div>

          <div className="data-cell" style={{ marginBottom: '12px' }}>
            <div className="data-cell-label">Static Radiation</div>
            <div className="data-cell-value" style={{ color: getRiskColor(getStaticLevel(selectedPOI.distanceAU)) }}>
              {getStaticLevel(selectedPOI.distanceAU)} mSv/h
            </div>
          </div>

          <div className="data-cell" style={{ marginBottom: '12px' }}>
            <div className="data-cell-label">Scan DC</div>
            <div className="data-cell-value">{selectedPOI.parent.scanDC}</div>
          </div>

          <div className="data-cell" style={{ marginBottom: '12px' }}>
            <div className="data-cell-label">Detection Range</div>
            <div className="data-cell-value">{selectedPOI.parent.detectAtAU?.toFixed(2) || 'N/A'} AU</div>
          </div>

          <div className="text-muted" style={{ fontSize: '8px', marginTop: '16px', marginBottom: '8px' }}>
            Seed
          </div>
          <div style={{ fontSize: '7px', fontFamily: 'monospace', wordBreak: 'break-all', color: '#34e0ff' }}>
            {selectedPOI.parent.id}
          </div>

          {selectedPOI.parent.tags && selectedPOI.parent.tags.length > 0 && (
            <>
              <div className="text-muted" style={{ fontSize: '8px', marginTop: '16px', marginBottom: '8px' }}>
                Tags
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {selectedPOI.parent.tags.map((tag, idx) => (
                  <span key={idx} style={{
                    fontSize: '7px',
                    padding: '2px 6px',
                    border: '1px solid #34e0ff',
                    color: '#34e0ff'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* POI List Menu - Right side (when no POI selected) */}
      {!selectedPOI && (
        <div className="holo-border holo-scroll" style={{
          flex: 1,
          maxWidth: '300px',
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div className="text-muted" style={{ fontSize: '9px', marginBottom: '16px' }}>
            {'> '}POINTS OF INTEREST
          </div>

          {allPOIs.map((poi, idx) => (
            <div
              key={poi.parent.id}
              onClick={() => handlePOIClick(poi)}
              style={{
                padding: '8px',
                marginBottom: '4px',
                border: hoveredPOI?.parent?.id === poi.parent?.id ? '1px solid #34e0ff' : '1px solid rgba(52, 224, 255, 0.3)',
                cursor: 'pointer',
                backgroundColor: hoveredPOI?.parent?.id === poi.parent?.id ? 'rgba(52, 224, 255, 0.1)' : 'transparent'
              }}
              onMouseEnter={() => setHoveredPOI(poi)}
              onMouseLeave={() => setHoveredPOI(null)}
            >
              <div style={{ fontSize: '10px', color: '#34e0ff' }}>{poi.parent.name}</div>
              <div className="text-muted" style={{ fontSize: '8px' }}>
                {poi.parent.type.toUpperCase()} • {poi.distanceAU?.toFixed(1) || 'N/A'} AU
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default SolarSystemViewer;
