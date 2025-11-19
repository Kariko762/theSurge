import React from 'react';
import { calculateShipStats } from '../../lib/inventory/inventoryManagerBrowser';

const STAT_ICONS = {
  weapons: '⚔️',
  thrust: '🚀',
  powerOutput: '⚡',
  powerDraw: '🔌',
  scanRange: '📡',
  armor: '🛡️',
  shields: '✨',
  cargoCapacity_m3: '📦'
};

export default function ShipStatsPanel({ inventory }) {
  const stats = calculateShipStats(inventory);

  return (
    <div style={{
      width: '280px',
      background: 'rgba(0, 5, 10, 0.9)',
      borderRight: '2px solid rgba(0, 255, 255, 0.3)',
      padding: '20px',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '15px'
    }}>
      {/* Header */}
      <div style={{
        color: '#00ffff',
        fontSize: '16px',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        textAlign: 'center',
        paddingBottom: '15px',
        borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
        textShadow: '0 0 10px rgba(0, 255, 255, 0.8)'
      }}>
        🚀 Ship Status
      </div>

      {/* Power Balance */}
      <StatBlock
        icon="⚡"
        label="Power Balance"
        value={`${stats.powerBalance >= 0 ? '+' : ''}${stats.powerBalance}`}
        color={stats.powerBalance >= 0 ? '#00ff88' : '#ff4444'}
        subtitle={`${stats.powerOutput} / ${stats.powerDraw}`}
      />

      {/* Weapons */}
      {stats.weapons.length > 0 && (
        <div style={{
          background: 'rgba(0, 255, 255, 0.05)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: '6px',
          padding: '12px'
        }}>
          <div style={{
            color: '#00ffff',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            ⚔️ Weapons ({stats.weapons.length})
          </div>
          {stats.weapons.map((dmg, idx) => (
            <div key={idx} style={{
              fontSize: '10px',
              color: 'rgba(255, 100, 100, 0.9)',
              marginLeft: '20px',
              marginBottom: '4px'
            }}>
              • {dmg} damage
            </div>
          ))}
        </div>
      )}

      {/* Thrust */}
      {stats.thrust > 0 && (
        <StatBlock
          icon="🚀"
          label="Thrust"
          value={stats.thrust.toLocaleString()}
          color="#00ccff"
        />
      )}

      {/* Scan Range */}
      {stats.scanRange > 0 && (
        <StatBlock
          icon="📡"
          label="Scan Range"
          value={`${(stats.scanRange / 1000).toFixed(1)}k`}
          color="#ffaa00"
        />
      )}

      {/* Armor */}
      {stats.armor > 0 && (
        <StatBlock
          icon="🛡️"
          label="Armor"
          value={stats.armor}
          color="#00ff88"
        />
      )}

      {/* Shields */}
      {stats.shields > 0 && (
        <StatBlock
          icon="✨"
          label="Shields"
          value={stats.shields}
          color="#cc00ff"
        />
      )}

      {/* Cargo Capacity */}
      <StatBlock
        icon="📦"
        label="Cargo Capacity"
        value={`${stats.cargoCapacity_m3}m³`}
        color="#00ffff"
      />

      {/* Modifiers Section */}
      {Object.keys(stats.modifiers).length > 0 && (
        <div style={{
          background: 'rgba(0, 255, 100, 0.05)',
          border: '1px solid rgba(0, 255, 100, 0.2)',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '10px'
        }}>
          <div style={{
            color: '#00ff88',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            ⚙️ Active Modifiers
          </div>
          {Object.entries(stats.modifiers).map(([key, value]) => (
            <div key={key} style={{
              fontSize: '10px',
              color: value > 0 ? '#00ff88' : '#ff4444',
              marginLeft: '20px',
              marginBottom: '4px',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>{key}:</span>
              <span style={{ fontWeight: 'bold' }}>
                {value > 0 ? '+' : ''}{value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Warning: Negative Power */}
      {stats.powerBalance < 0 && (
        <div style={{
          background: 'rgba(255, 0, 0, 0.1)',
          border: '2px solid rgba(255, 0, 0, 0.5)',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '10px'
        }}>
          <div style={{
            color: '#ff4444',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '6px',
            textTransform: 'uppercase'
          }}>
            ⚠️ Power Deficit
          </div>
          <div style={{
            fontSize: '9px',
            color: 'rgba(255, 100, 100, 0.8)'
          }}>
            Ship requires {Math.abs(stats.powerBalance)} more power. Install additional reactor or remove components.
          </div>
        </div>
      )}
    </div>
  );
}

function StatBlock({ icon, label, value, color, subtitle = null }) {
  return (
    <div style={{
      background: 'rgba(0, 255, 255, 0.05)',
      border: '1px solid rgba(0, 255, 255, 0.2)',
      borderRadius: '6px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        fontSize: '24px',
        filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.6))'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '9px',
          color: 'rgba(255, 255, 255, 0.5)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2px'
        }}>
          {label}
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: color,
          textShadow: `0 0 6px ${color}80`
        }}>
          {value}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.4)',
            marginTop: '2px'
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
