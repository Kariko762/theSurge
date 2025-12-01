import React from 'react';
import '../../styles/AdminGlass.css';

/**
 * BattlespaceStrip
 * FTL-style positioning: 10 lanes total
 * Positions 0-4 (left): Player side
 * Positions 5-9 (right): Opponent side
 * Distance calculated from position difference
 */
export default function BattlespaceStrip({ combat, actor, opponents }) {
  if (!combat || !actor || !opponents || opponents.length === 0) return null;

  const bands = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
  const bandColors = {
    POINT_BLANK: 'var(--neon-pink)',
    CLOSE: 'var(--neon-purple)',
    MEDIUM: 'var(--neon-blue)',
    LONG: 'var(--neon-cyan)',
    EXTREME: '#7ab8c4',
  };

  // Get all ship positions
  const actorPos = combat.positioning.getPosition(actor.id);
  const opponentPositions = opponents.map(op => ({
    id: op.id,
    position: combat.positioning.getPosition(op.id),
    band: combat.positioning.getDistanceBandKey(actor.id, op.id)
  }));

  // 10 lanes, each 10% wide
  const lanes = Array.from({ length: 10 }, (_, i) => i);

  // Get current distance band for primary opponent
  const primaryOpponent = opponentPositions[0];
  const currentBand = primaryOpponent?.band || 'UNKNOWN';

  return (
    <div className="glass-card" style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 className="neon-title" style={{ margin: 0 }}>Battlespace</h3>
        <div style={{ 
          fontSize: 12, 
          color: bandColors[currentBand] || 'var(--neon-cyan)', 
          textShadow: `0 0 8px ${bandColors[currentBand] || 'var(--neon-cyan)'}`,
          fontWeight: 600,
          letterSpacing: 1
        }}>
          {currentBand.replace('_', ' ')}
        </div>
      </div>
      <div style={{ position: 'relative', width: '100%', height: 60, border: '1px solid var(--glass-border-bright)', borderRadius: 10, overflow: 'visible' }}>
        {/* Lane background stripes */}
        <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {lanes.map((lane) => (
            <div 
              key={lane} 
              style={{ 
                background: lane < 5 ? 'rgba(0,255,180,0.05)' : 'rgba(255,80,80,0.05)', 
                borderRight: lane < 9 ? '1px solid var(--glass-border)' : 'none',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 2
              }}
            >
              <div style={{ fontSize: 9, color: 'var(--glass-border)', opacity: 0.5 }}>{lane}</div>
            </div>
          ))}
        </div>

        {/* Middle divider (between player and opponent sides) */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--glass-border-bright)', pointerEvents: 'none' }} />

        {/* Actor marker */}
        <div 
          style={{ 
            position: 'absolute', 
            left: `${(actorPos / 10) * 100 + 5}%`, 
            transform: 'translateX(-50%)', 
            top: '50%',
            marginTop: -8
          }}
          title={`${actor.id} • Pos ${actorPos}`}
        >
          <div style={{ 
            width: 18, 
            height: 18, 
            borderRadius: '50%', 
            background: 'var(--neon-cyan)', 
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 0 12px rgba(0,255,255,0.8)' 
          }} />
        </div>

        {/* Opponent markers */}
        {opponentPositions.map((op) => {
          const color = bandColors[op.band] || 'var(--neon-pink)';
          return (
            <div 
              key={op.id} 
              title={`${op.id} • Pos ${op.position} • ${op.band}`} 
              style={{ 
                position: 'absolute', 
                left: `${(op.position / 10) * 100 + 5}%`, 
                transform: 'translateX(-50%)', 
                top: '50%',
                marginTop: -8
              }}
            >
              <div style={{ 
                width: 18, 
                height: 18, 
                borderRadius: '50%', 
                background: color, 
                border: '2px solid rgba(255,255,255,0.6)',
                boxShadow: `0 0 12px ${color}` 
              }} />
            </div>
          );
        })}
      </div>
      
      {/* Band legend below */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        marginTop: 8, 
        fontSize: 10, 
        opacity: 0.7 
      }}>
        {bands.map((b) => (
          <div 
            key={b} 
            style={{ 
              color: bandColors[b], 
              fontWeight: b === currentBand ? 700 : 400,
              textShadow: b === currentBand ? `0 0 6px ${bandColors[b]}` : 'none'
            }}
          >
            {b.replace('_', ' ')}
          </div>
        ))}
      </div>
    </div>
  );
}
