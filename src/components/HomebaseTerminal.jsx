import { useState } from 'react'

/**
 * FRAME 2: Homebase Terminal - Main Base UI
 * Full-screen terminal with slide-out tab stacks and central display
 */

const HomebaseTerminal = ({ onLaunch }) => {
  const [leftActiveTab, setLeftActiveTab] = useState(null);
  const [rightActiveTab, setRightActiveTab] = useState(null);
  const [activeCoreAI, setActiveCoreAI] = useState(['ARIA', 'FORGE']); // 2 active AI
  const [powerUsage, setPowerUsage] = useState(80); // 40 each for 2 AI

  const leftTabs = ['AI', 'POWER', 'RESEARCH', 'BUILD', 'HANGAR'];
  const rightTabs = ['LOGS', 'ALERTS', 'MAP', 'INVENTORY'];

  const aiCrew = [
    { name: 'ARIA', role: 'Navigation', power: 40, status: 'ONLINE', integrity: 100 },
    { name: 'FORGE', role: 'Engineering', power: 40, status: 'ONLINE', integrity: 100 },
    { name: 'CIPHER', role: 'Research', power: 50, status: 'OFFLINE', integrity: 87 },
    { name: 'GHOST', role: 'Sensors', power: 50, status: 'OFFLINE', integrity: 92 }
  ];

  const systemOptions = [
    { name: 'KEPLER-442', star: 'G-TYPE', radiation: 'MEDIUM', threat: 'MODERATE', distance: '12 LY', seed: '8A4F29E1' },
    { name: 'VEGA-7', star: 'A-TYPE', radiation: 'HIGH', threat: 'HIGH', distance: '25 LY', seed: 'F3C91A28' },
    { name: "BARNARD'S REFUGE", star: 'M-TYPE', radiation: 'LOW', threat: 'LOW', distance: '6 LY', seed: '4E7B2D90' }
  ];

  const toggleLeftTab = (tab) => {
    setLeftActiveTab(leftActiveTab === tab ? null : tab);
  };

  const toggleRightTab = (tab) => {
    setRightActiveTab(rightActiveTab === tab ? null : tab);
  };

  const renderLeftPanelContent = () => {
    switch(leftActiveTab) {
      case 'HANGAR':
        return (
          <div className="holo-border" style={{ position: 'relative', padding: '16px', minHeight: '220px' }}>
            <div className="tab-panel-header holo-text">HANGAR BAY</div>
            <div className="text-muted" style={{ fontSize: '10px', marginBottom: '12px' }}>
              {'> '}ORBITAL SLIPWAY STATUS: GREEN // DOCK 2 READY
            </div>
            <div className="data-grid">
              <div className="data-cell">
                <div className="data-cell-label">Vessel</div>
                <div className="data-cell-value">SS-ARKOSE</div>
                <div className="ui-small">Class: Survey Frigate</div>
              </div>
              <div className="data-cell">
                <div className="data-cell-label">Fuel</div>
                <div className="data-cell-value">84%</div>
                <div className="progress-bar"><div className="progress-bar-fill" style={{ width: '84%' }}></div></div>
              </div>
              <div className="data-cell">
                <div className="data-cell-label">Cargo</div>
                <div className="data-cell-value">12/40</div>
                <div className="ui-small">Mass: 7.2t</div>
              </div>
            </div>
            <button className="action-btn" style={{ position: 'absolute', right: '16px', bottom: '16px' }} onClick={() => onLaunch && onLaunch()}>
              Launch
            </button>
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
        <div className="display-header holo-text">
          HOMEBASE TERMINAL // ASTEROID SHELTER ALPHA-7
        </div>
        <div className="display-content">
          {/* System Status */}
          <div style={{ marginBottom: '25px' }}>
            <p className="holo-text" style={{ fontSize: '11px', marginBottom: '12px', letterSpacing: '2px' }}>
              {'> '}STATION STATUS
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
          </div>

          {/* AI Core Status */}
          <div className="holo-border" style={{ padding: '20px', marginBottom: '20px' }}>
            <p className="holo-text" style={{ fontSize: '11px', marginBottom: '12px', letterSpacing: '2px' }}>
              {'> '}AI CORE STATUS
            </p>
            <div className="text-muted" style={{ fontSize: '9px', lineHeight: '1.8' }}>
              ARIA (Navigation) - ONLINE - Integrity: 100%
              <br />
              FORGE (Engineering) - ONLINE - Integrity: 100%
              <br />
              CIPHER (Research) - OFFLINE - Integrity: 87%
              <br />
              GHOST (Sensors) - OFFLINE - Integrity: 92%
              <br /><br />
              <span className="holo-text">POWER USAGE: 80/100 UNITS (2 Active AI)</span>
            </div>
          </div>

          {/* Available Expeditions */}
          <div className="holo-border" style={{ padding: '20px', marginBottom: '20px' }}>
            <p className="holo-text" style={{ fontSize: '11px', marginBottom: '15px', letterSpacing: '2px' }}>
              {'> '}AVAILABLE EXPEDITIONS
            </p>
            {systemOptions.map((system, idx) => (
              <div key={idx} className="data-cell mb-2" style={{ position: 'relative', transition: 'all 0.3s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div>
                    <div className="holo-text" style={{ fontSize: '11px' }}>{system.name}</div>
                    <div className="text-muted" style={{ fontSize: '8px' }}>
                      {system.star} STAR • {system.distance} • SEED: {system.seed}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9px', color: '#34e0ff' }}>{system.radiation}</div>
                    <div className="text-muted" style={{ fontSize: '8px' }}>THREAT: {system.threat}</div>
                  </div>
                </div>
                <div className="text-muted" style={{ fontSize: '8px' }}>
                  Select a destination and launch.
                </div>
                <button className="small-btn" style={{ position: 'absolute', right: '10px', bottom: '10px' }} onClick={() => onLaunch && onLaunch(system.seed)}>
                  Launch
                </button>
              </div>
            ))}
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
    </div>
  );
};

export default HomebaseTerminal;
