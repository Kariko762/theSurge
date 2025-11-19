import React, { useState } from 'react';
import HoloIcon from './HoloIcons';
import HoloStars from './HoloStars';

// Unified neon palette
const TIER_COLORS = {
  0: '#00ffff',
  1: '#00ffff',
  2: '#00ffff',
  3: '#00ffff',
  4: '#00ffff'
};

export default function ItemFrame({ 
  item, 
  onDragStart, 
  onDragEnd,
  isDragging = false,
  isHovering = false,
  onClick = null,
  gridMode = true
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const tierColor = TIER_COLORS[item?.tier || 0] || '#00ffff';

  if (!item) {
    // Empty grid cell
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: isHovering 
            ? 'rgba(0, 255, 255, 0.15)' 
            : 'rgba(0, 10, 15, 0.4)',
          border: isHovering
            ? '1px solid rgba(0, 255, 255, 0.6)'
            : '1px solid rgba(0, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: isHovering
            ? '0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 10px rgba(0, 255, 255, 0.2)'
            : 'none'
        }}
      >
        <div style={{
          width: '60%',
          height: '60%',
          border: '1px dashed rgba(0, 255, 255, 0.1)'
        }} />
      </div>
    );
  }

  // Filled grid cell with item
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        background: isDragging 
          ? 'rgba(0, 255, 255, 0.25)' 
          : 'rgba(0, 15, 20, 0.6)',
        border: `1.5px solid ${tierColor}`,
        cursor: 'grab',
        transition: 'all 0.15s ease',
        boxShadow: isDragging 
          ? `0 0 20px ${tierColor}, inset 0 0 10px ${tierColor}40` 
          : `0 0 8px ${tierColor}30, inset 0 0 5px rgba(0,255,255,0.05)`,
        opacity: isDragging ? 0.6 : 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px'
      }}
    >
      {/* Holographic SVG Icon */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: `drop-shadow(0 0 4px ${tierColor}80)`,
        marginTop: '4px'
      }}>
        <HoloIcon item={item} size={gridMode ? 24 : 40} />
      </div>

      {/* Item Name */}
      <div style={{
        fontSize: '7px',
        color: tierColor,
        textAlign: 'center',
        marginTop: '2px',
        marginBottom: '2px',
        lineHeight: '1.1',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        textShadow: `0 0 4px ${tierColor}60`,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        width: '100%',
        padding: '0 2px'
      }}>
        {item.name}
      </div>

      {/* Star rating overlay (small) */}
      <div style={{
        position: 'absolute',
        bottom: '2px',
        left: '3px',
        display: 'flex',
        gap: '2px'
      }}>
        <HoloStars tier={item.tier} size={6} gap={2} />
      </div>

      {/* Stack Count */}
      {item.quantity > 1 && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          padding: '1px 4px',
          background: 'rgba(0, 0, 0, 0.7)',
          border: `1px solid ${tierColor}`,
          fontSize: '8px',
          color: tierColor,
          fontWeight: 'bold',
          lineHeight: '1',
          textShadow: `0 0 4px ${tierColor}`
        }}>
          ×{item.quantity}
        </div>
      )}

      {/* Tier indicator corner removed (replaced by stars) */}

      {/* Compact Tooltip */}
      {showTooltip && (
        <div style={{
          position: 'absolute',
          bottom: '105%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          padding: '8px',
          background: 'rgba(0, 5, 10, 0.98)',
          border: `1.5px solid ${tierColor}`,
          fontSize: '9px',
          color: '#ffffff',
          zIndex: 2000,
          boxShadow: `0 0 16px ${tierColor}60, inset 0 0 8px rgba(0,255,255,0.1)`,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <div style={{ 
            color: tierColor, 
            fontWeight: 'bold',
            marginBottom: '4px',
            fontSize: '10px',
            textShadow: `0 0 6px ${tierColor}`
          }}>
            {item.name}
          </div>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '8px',
            marginBottom: '4px'
          }}>
            {item.description}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '8px',
            color: 'rgba(0, 255, 255, 0.7)'
          }}>
            <span>{item.size_m3}m³</span>
            <span>{item.weight_kg}kg</span>
            {item.slotType && <span>{item.slotType}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
