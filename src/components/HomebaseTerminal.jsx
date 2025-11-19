import { useState } from 'react'
import MapGalaxies from './hb_mapGalaxies.jsx'
import MapSystems from './hb_mapSystems.jsx'
import InventoryModal from './inventory/InventoryModal.jsx'
import HangarView from './hangar/HangarView.jsx'
import { createDefaultInventory, addItem } from '../lib/inventory/inventoryManagerBrowser.js'
import AdminSecurityModal from './admin/AdminSecurityModal.jsx'

/**
 * FRAME 2: Homebase Terminal - Main Base UI
 * Full-screen terminal with slide-out tab stacks and central display
 */

const HomebaseTerminal = ({ onLaunch }) => {
  const [leftActiveTab, setLeftActiveTab] = useState(null);
  const [rightActiveTab, setRightActiveTab] = useState(null);
  const [activeCoreAI, setActiveCoreAI] = useState(['ARIA', 'FORGE']); // 2 active AI
  const [powerUsage, setPowerUsage] = useState(80); // 40 each for 2 AI
  const [activeOverlay, setActiveOverlay] = useState(null); // 'inventory' | 'hangar' | null
  const [adminOpen, setAdminOpen] = useState(false);
  
  // Initialize inventory with starting items
  const [inventory, setInventory] = useState(() => {
    const inv = createDefaultInventory();
    addItem(inv, 'homebase', 'beam_laser_mk1', 1);
    addItem(inv, 'homebase', 'beam_laser_mk2', 1);
    addItem(inv, 'homebase', 'mining_laser_mk1', 1);
    addItem(inv, 'homebase', 'mag_thruster_mk1', 1);
    addItem(inv, 'homebase', 'scanner_mk1', 1);
    addItem(inv, 'homebase', 'power_core_mk1', 1);
    addItem(inv, 'homebase', 'ai_core_engineer_mk1', 1);
    addItem(inv, 'homebase', 'ai_core_tactical_mk1', 1);
    addItem(inv, 'homebase', 'scrap_metal', 100);
    addItem(inv, 'homebase', 'titanium_alloy', 50);
    addItem(inv, 'homebase', 'fuel_cell', 20);
    addItem(inv, 'homebase', 'repair_kit', 10);
    return inv;
  });

  const leftTabs = ['AI', 'POWER', 'RESEARCH', 'BUILD', 'HANGAR'];
  const rightTabs = ['LOGS', 'ALERTS', 'MAP', 'INVENTORY'];

  const aiCrew = [
    { name: 'ARIA', role: 'Navigation', power: 40, status: 'ONLINE', integrity: 100 },
    { name: 'FORGE', role: 'Engineering', power: 40, status: 'ONLINE', integrity: 100 },
    { name: 'CIPHER', role: 'Research', power: 50, status: 'OFFLINE', integrity: 87 },
    { name: 'GHOST', role: 'Sensors', power: 50, status: 'OFFLINE', integrity: 92 }
  ];

  const toggleLeftTab = (tab) => {
    if (tab === 'HANGAR') {
      setActiveOverlay('hangar');
      setLeftActiveTab(null);
      return;
    }
    setLeftActiveTab(leftActiveTab === tab ? null : tab);
  };

  const toggleRightTab = (tab) => {
    if (tab === 'INVENTORY') {
      setActiveOverlay('inventory');
      setRightActiveTab(null);
      return;
    }
    setRightActiveTab(rightActiveTab === tab ? null : tab);
  };

  // If MAP is active, render it fullscreen instead of in panel
  if (rightActiveTab === 'MAP') {
    return (
      <div className="no-scanlines" style={{ position: 'relative', width: '100%', height: '100%' }}>
        <MapGalaxies onLaunch={onLaunch} />
        {/* Close button overlay */}
        <button 
          className="small-btn" 
          onClick={() => setRightActiveTab(null)}
          style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            zIndex: 2000,
            fontSize: '10px',
            padding: '8px 16px'
          }}
        >
          CLOSE MAP
        </button>
      </div>
    );
  }

  const renderLeftPanelContent = () => {
    switch(leftActiveTab) {
      case 'HANGAR':
        return (
          <div className="holo-border" style={{ position: 'relative', padding: '16px', minHeight: '120px' }}>
            <div className="tab-panel-header holo-text">HANGAR BAY</div>
            <div className="text-muted" style={{ fontSize: '10px' }}>
              {'> '}Use the left HANGAR tab to open the full Hangar overlay.
            </div>
          </div>
        );
      case 'AI':
        return (
          <div>
            <div className="tab-panel-header holo-text">
              AI CREW MANAGEMENT
            </div>
            <div className="text-muted" style={{ fontSize: '10px', marginBottom: '20px' }}>
              {'> '}POWER AVAILABLE: {100 - powerUsage}/100 UNITS
            </div>
            
            {aiCrew.map((ai) => (
              <div key={ai.name} className="data-cell mb-2" style={{ 
                borderColor: ai.status === 'ONLINE' ? 'rgba(52, 224, 255, 0.6)' : 'rgba(52, 224, 255, 0.2)',
                background: ai.status === 'ONLINE' ? 'rgba(52, 224, 255, 0.08)' : 'rgba(0, 0, 0, 0.4)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="holo-text" style={{ fontSize: '11px', marginBottom: '4px' }}>{ai.name}</div>
                    <div className="text-muted" style={{ fontSize: '9px' }}>{ai.role}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', color: ai.status === 'ONLINE' ? '#34e0ff' : '#888' }}>
                      {ai.status}
                    </div>
                    <div className="text-muted" style={{ fontSize: '8px' }}>{ai.power}W</div>
                  </div>
                </div>
                <div className="progress-bar" style={{ marginTop: '10px' }}>
                  <div className="progress-bar-fill" style={{ width: `${ai.integrity}%` }}></div>
                </div>
                <div className="text-muted" style={{ fontSize: '8px', marginTop: '4px' }}>
                  INTEGRITY: {ai.integrity}%
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'POWER':
        return (
          <div>
            <div className="tab-panel-header holo-text">POWER SYSTEMS</div>
            <div className="data-cell">
              <div className="data-cell-label">Grid Capacity</div>
              <div className="data-cell-value">100W</div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: '67%' }}></div>
              </div>
            </div>
            <div className="data-cell mt-2">
              <div className="data-cell-label">Current Draw</div>
              <div className="data-cell-value">{powerUsage}W</div>
              <div className="text-muted" style={{ fontSize: '9px', marginTop: '8px' }}>
                2x Core AI Active (40W each)
              </div>
            </div>
            <div className="mt-2 text-muted" style={{ fontSize: '9px', lineHeight: '1.6' }}>
              {'> '}Upgrade power grid to support additional AI crew members.
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <div className="tab-panel-header holo-text">{leftActiveTab}</div>
            <div className="text-muted" style={{ fontSize: '10px' }}>
              {'> '}MODULE: {leftActiveTab?.toUpperCase()}
            </div>
            <div className="mt-2 text-muted" style={{ fontSize: '9px', lineHeight: '1.6' }}>
              [System interface under construction]
            </div>
          </div>
        );
    }
  };

  const renderRightPanelContent = () => {
    switch(rightActiveTab) {
      case 'INVENTORY':
        return (
          <div className="holo-border" style={{ position: 'relative', padding: '16px', minHeight: '120px' }}>
            <div className="tab-panel-header holo-text">INVENTORY</div>
            <div className="text-muted" style={{ fontSize: '10px' }}>
              {'> '}Use the right INVENTORY tab to open the full Inventory overlay.
            </div>
          </div>
        );
      
      case 'LOGS':
        return (
          <div>
            <div className="tab-panel-header holo-text">SYSTEM LOGS</div>
            <div style={{ fontSize: '9px', lineHeight: '1.8', color: '#cfd8df', opacity: 0.7 }}>
              {'> '}14:23:07 // POWER FLUCTUATION DETECTED IN SECTOR 4
              <br />
              {'> '}14:18:42 // AI CORE SYNC COMPLETE
              <br />
              {'> '}14:12:15 // HANGAR BAY DEPRESSURIZATION CYCLE
              <br />
              {'> '}13:58:03 // EXTERNAL SENSOR ARRAY OFFLINE
              <br />
              {'> '}13:45:21 // RFE FUEL RESERVES: 42% CAPACITY
              <br />
              {'> '}13:22:09 // SURGE RADIATION SPIKE DETECTED
              <br />
              {'> '}12:58:44 // ARIA: NAVIGATION RECALIBRATION COMPLETE
              <br />
              {'> '}12:33:15 // FORGE: HULL INTEGRITY CHECK PASSED
            </div>
          </div>
        );
      
      default:
        return (
          <div>
            <div className="tab-panel-header holo-text">{rightActiveTab}</div>
            <div className="text-muted" style={{ fontSize: '10px' }}>
              {'> '}DATA STREAM: {rightActiveTab?.toUpperCase()}
            </div>
            <div className="mt-2 text-muted" style={{ fontSize: '9px', lineHeight: '1.6' }}>
              [Feed interface under construction]
            </div>
          </div>
        );
    }
  };

  return (
    <div className="terminal-frame">
      {/* Left Tab Stack */}
      <div className="tab-stack-left">
        {leftTabs.map((tab) => (
          <div
            key={tab}
            className={`tab-item ${leftActiveTab === tab ? 'active' : ''}`}
            onClick={() => toggleLeftTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Left Tab Panel */}
      <div className={`tab-panel left holo-border ${leftActiveTab ? 'open' : ''}`}>
        {leftActiveTab && (
          <div className="tab-panel-content">
            {renderLeftPanelContent()}
          </div>
        )}
      </div>

      {/* Right Tab Stack */}
      <div className="tab-stack-right">
        {rightTabs.map((tab) => (
          <div
            key={tab}
            className={`tab-item ${rightActiveTab === tab ? 'active' : ''}`}
            onClick={() => toggleRightTab(tab)}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Right Tab Panel */}
      <div className={`tab-panel right holo-border ${rightActiveTab ? 'open' : ''}`}>
        {rightActiveTab && (
          <div className="tab-panel-content">
            {renderRightPanelContent()}
          </div>
        )}
      </div>

      {/* Central Terminal Display */}
      <div className="central-display holo-glow flicker fade-in">
        <div className="display-header holo-text" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>HOMEBASE TERMINAL // ASTEROID SHELTER ALPHA-7</span>
          <button
            title="Admin"
            aria-label="Open admin panel"
            onClick={() => setAdminOpen(true)}
            style={{
              width: 28,
              height: 28,
              border: '1px solid rgba(0,255,255,0.6)',
              background: 'rgba(0,255,255,0.06)',
              color: '#00ffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 0 10px rgba(0,255,255,0.4)'
            }}
          >
            {/* shield/lock glyph */}
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 4L26 8V16C26 21 21 25 16 28C11 25 6 21 6 16V8L16 4Z" stroke="#00ffff" strokeWidth="1.6" />
              <rect x="12" y="13" width="8" height="6" rx="1" stroke="#00ffff" strokeWidth="1.4" />
              <path d="M20 13V10C20 8.343 18.657 7 17 7H15C13.343 7 12 8.343 12 10V13" stroke="#00ffff" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
        <div className="display-content">
          {/* Split Status Display: Ship (Left) | Homebase (Right) */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
            {/* Ship Status (Left 50%) */}
            <div className="holo-border" style={{ flex: 1, padding: '20px' }}>
              <p className="holo-text" style={{ fontSize: '11px', marginBottom: '15px', letterSpacing: '2px' }}>
                {'> '}SHIP STATUS
              </p>
              <div className="data-grid">
                <div className="data-cell fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="data-cell-label">Hull Integrity</div>
                  <div className="data-cell-value">89%</div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '89%', backgroundColor: 'rgba(82, 255, 168, 0.6)' }}></div>
                  </div>
                </div>
                <div className="data-cell fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="data-cell-label">Shield Status</div>
                  <div className="data-cell-value">78%</div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '78%', backgroundColor: 'rgba(52, 224, 255, 0.6)' }}></div>
                  </div>
                </div>
                <div className="data-cell fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="data-cell-label">Fuel (He-3 Pellets)</div>
                  <div className="data-cell-value">500 units</div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '84%', backgroundColor: 'rgba(255, 180, 50, 0.6)' }}></div>
                  </div>
                </div>
              </div>
              <div className="text-muted" style={{ fontSize: '9px', marginTop: '15px', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '6px' }}>
                  <span className="holo-text">Current System:</span> HOMEBASE (Quiet Zone)
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span className="holo-text">Distance from Homebase:</span> 0.0 LY
                </div>
                <div>
                  <span className="holo-text">Surge Static:</span> <span style={{ color: '#0f0' }}>2.3 mSv/h</span>
                </div>
              </div>
            </div>

            {/* Homebase Status (Right 50%) */}
            <div className="holo-border" style={{ flex: 1, padding: '20px' }}>
              <p className="holo-text" style={{ fontSize: '11px', marginBottom: '15px', letterSpacing: '2px' }}>
                {'> '}HOMEBASE STATUS
              </p>
              <div className="data-grid">
                <div className="data-cell fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="data-cell-label">Power Grid</div>
                  <div className="data-cell-value">67%</div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '67%' }}></div>
                  </div>
                </div>
                <div className="data-cell fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="data-cell-label">Life Support</div>
                  <div className="data-cell-value">42%</div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '42%' }}></div>
                  </div>
                </div>
                <div className="data-cell fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="data-cell-label">Defenses</div>
                  <div className="data-cell-value">31%</div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: '31%' }}></div>
                  </div>
                </div>
              </div>
              <div className="text-muted" style={{ fontSize: '9px', marginTop: '15px', lineHeight: '1.8' }}>
                <div style={{ marginBottom: '6px' }}>
                  <span className="holo-text">Active AI Cores:</span> 2/4 (ARIA, FORGE)
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <span className="holo-text">Power Draw:</span> 80/100 Units
                </div>
                <div>
                  <span className="holo-text">Run Duration:</span> 0h 00m
                </div>
              </div>
            </div>
          </div>

          {/* Current Automation (100% width) */}
          <div className="holo-border" style={{ padding: '20px', marginBottom: '20px' }}>
            <p className="holo-text" style={{ fontSize: '11px', marginBottom: '15px', letterSpacing: '2px' }}>
              {'> '}CURRENT AUTOMATION
            </p>
            
            {/* ARIA - Navigation AI */}
            <div className="data-cell mb-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div className="holo-text" style={{ fontSize: '10px' }}>ARIA (Navigation AI)</div>
                  <div className="text-muted" style={{ fontSize: '8px' }}>Surveying: Asteroid Belt Sigma-9</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: '#34e0ff' }}>IN PROGRESS</div>
                  <div className="text-muted" style={{ fontSize: '8px' }}>40W</div>
                </div>
              </div>
              <div className="progress-bar" style={{ height: '10px', marginBottom: '6px' }}>
                <div className="progress-bar-fill" style={{ width: '67%' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }} className="text-muted">
                <span>Duration: 2h 30m</span>
                <span>Time Left: 50m</span>
              </div>
            </div>

            {/* FORGE - Engineering AI */}
            <div className="data-cell mb-2">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div className="holo-text" style={{ fontSize: '10px' }}>FORGE (Engineering AI)</div>
                  <div className="text-muted" style={{ fontSize: '8px' }}>Building: Shield Capacitor Array</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: '#34e0ff' }}>IN PROGRESS</div>
                  <div className="text-muted" style={{ fontSize: '8px' }}>40W</div>
                </div>
              </div>
              <div className="progress-bar" style={{ height: '10px', marginBottom: '6px' }}>
                <div className="progress-bar-fill" style={{ width: '23%' }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px' }} className="text-muted">
                <span>Duration: 6h 00m</span>
                <span>Time Left: 4h 37m</span>
              </div>
            </div>

            {/* Offline AI cores */}
            <div className="text-muted" style={{ fontSize: '9px', marginTop: '12px', opacity: 0.6 }}>
              {'> '}CIPHER (Research AI) - OFFLINE
              <br />
              {'> '}GHOST (Sensors AI) - OFFLINE
            </div>
          </div>

          {/* G'ejar-Vale Progress */}
          <div className="holo-border" style={{ padding: '20px' }}>
            <p className="holo-text" style={{ fontSize: '11px', marginBottom: '10px', letterSpacing: '2px' }}>
              {'> '}G'EJAR-VALE COORDINATE FRAGMENTS
            </p>
            <div className="progress-bar" style={{ height: '12px' }}>
              <div className="progress-bar-fill" style={{ width: `${(7/30)*100}%` }}></div>
            </div>
            <div className="text-muted" style={{ fontSize: '9px', marginTop: '8px' }}>
              {Math.round((7/30)*100)}% Complete (7/30 fragments recovered)
              <br />
              <span style={{ fontStyle: 'italic', opacity: 0.7 }}>
                "The void is patient. G'ejar-Vale waits..."
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Fullscreen overlays (like Galaxy view), tabs remain accessible */}
      {activeOverlay === 'inventory' && (
        <InventoryModal
          inventory={inventory}
          setInventory={setInventory}
          location="homebase"
          onClose={() => setActiveOverlay(null)}
          fullscreen
        />
      )}
      {activeOverlay === 'hangar' && (
        <HangarView
          inventory={inventory}
          setInventory={setInventory}
          onClose={() => setActiveOverlay(null)}
          fullscreen
        />
      )}
      {adminOpen && (
        <AdminSecurityModal onClose={() => setAdminOpen(false)} />
      )}
    </div>
  );
};

export default HomebaseTerminal;
