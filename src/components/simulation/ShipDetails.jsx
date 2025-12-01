import React, { useState } from 'react';

const ShipDetails = ({ ship }) => {
  const [activeTab, setActiveTab] = useState('systems');

  if (!ship) {
    return (
      <div className="ship-details-empty">
        <div className="empty-icon">▲</div>
        <div className="empty-text">No ship selected</div>
        <div className="empty-subtext">Select a ship to view details</div>
      </div>
    );
  }

  const hullPercent = (ship.currentHull / ship.maxHull) * 100;
  const shieldPercent = (ship.currentShield / ship.maxShield) * 100;

  return (
    <div className="ship-details-content">
      {/* Ship Header */}
      <div className="ship-details-header">
        <div className="ship-icon-large">
          {ship.faction === 'enemy' ? '▼' : '▲'}
        </div>
        <h3 className="ship-name">{ship.name}</h3>
        <div className="ship-faction">{ship.faction.toUpperCase()}</div>
      </div>

      {/* Status Bars */}
      <div className="ship-status-bars">
        <div className="status-bar-group">
          <div className="status-bar-label">
            <span>Hull</span>
            <span className="status-value">{ship.currentHull}/{ship.maxHull}</span>
          </div>
          <div className="status-bar-container">
            <div 
              className="status-bar-fill hull"
              style={{ width: `${hullPercent}%` }}
            />
          </div>
        </div>

        <div className="status-bar-group">
          <div className="status-bar-label">
            <span>Shield</span>
            <span className="status-value">{ship.currentShield}/{ship.maxShield}</span>
          </div>
          <div className="status-bar-container">
            <div 
              className="status-bar-fill shield"
              style={{ width: `${shieldPercent}%` }}
            />
          </div>
        </div>

        <div className="status-bar-group">
          <div className="status-bar-label">
            <span>Action Points</span>
            <span className="status-value">{ship.currentAP || ship.maxAP}/{ship.maxAP}</span>
          </div>
          <div className="status-bar-container">
            <div 
              className="status-bar-fill ap"
              style={{ width: `${((ship.currentAP || ship.maxAP) / ship.maxAP) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="ship-tabs">
        <button
          className={`tab-btn ${activeTab === 'systems' ? 'active' : ''}`}
          onClick={() => setActiveTab('systems')}
        >
          SYSTEMS
        </button>
        <button
          className={`tab-btn ${activeTab === 'weapons' ? 'active' : ''}`}
          onClick={() => setActiveTab('weapons')}
        >
          WEAPONS
        </button>
        <button
          className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          MODULES
        </button>
      </div>

      {/* Tab Content */}
      <div className="ship-tab-content">
        {activeTab === 'systems' && (
          <div className="tab-panel">
            <div className="stat-row">
              <span className="stat-label">Attack Bonus</span>
              <span className="stat-value">+{ship.attackBonus || 0}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Defense</span>
              <span className="stat-value">{ship.defense || 10}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Evasion</span>
              <span className="stat-value">{ship.evasion || 0}%</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Movement Range</span>
              <span className="stat-value">{ship.movementRange || 3} hexes</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Status</span>
              <span className="stat-value status-operational">Operational</span>
            </div>
          </div>
        )}

        {activeTab === 'weapons' && (
          <div className="tab-panel">
            <div className="weapon-item">
              <div className="weapon-name">Primary Laser</div>
              <div className="weapon-stats">
                <span>Damage: 2d6</span>
                <span>Range: 5</span>
              </div>
            </div>
            <div className="weapon-item">
              <div className="weapon-name">Missile Launcher</div>
              <div className="weapon-stats">
                <span>Damage: 3d6</span>
                <span>Range: 8</span>
              </div>
            </div>
            <div className="weapon-item disabled">
              <div className="weapon-name">Torpedo Bay</div>
              <div className="weapon-stats">
                <span>Offline</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="tab-panel">
            <div className="module-item active">
              <div className="module-name">Shield Generator</div>
              <div className="module-status">Active</div>
            </div>
            <div className="module-item active">
              <div className="module-name">Repair Nanobots</div>
              <div className="module-status">Ready</div>
            </div>
            <div className="module-item cooldown">
              <div className="module-name">Cloaking Device</div>
              <div className="module-status">Cooldown: 2 turns</div>
            </div>
          </div>
        )}
      </div>

      {/* Position Info */}
      {ship.hex && (
        <div className="ship-position-info">
          <div className="position-label">Grid Position</div>
          <div className="position-coords">
            Q: {ship.hex.q} | R: {ship.hex.r}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipDetails;
