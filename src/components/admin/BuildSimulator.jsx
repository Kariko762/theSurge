import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api/client';
import { PlayIcon, RefreshIcon, LoadingIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function BuildSimulator() {
  const [ships, setShips] = useState([]);
  const [selectedShip, setSelectedShip] = useState(null);
  const [aiCores, setAiCores] = useState({});
  const [selectedAI, setSelectedAI] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Three-panel logs
  const [terminalLog, setTerminalLog] = useState([]);
  const [dreLog, setDreLog] = useState([]);
  const [backendLog, setBackendLog] = useState([]);
  
  const [attributeBreakdown, setAttributeBreakdown] = useState(null);
  
  const terminalRef = useRef(null);
  const dreRef = useRef(null);
  const backendRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLog]);

  useEffect(() => {
    if (dreRef.current) dreRef.current.scrollTop = dreRef.current.scrollHeight;
  }, [dreLog]);

  useEffect(() => {
    if (backendRef.current) backendRef.current.scrollTop = backendRef.current.scrollHeight;
  }, [backendLog]);

  const loadData = async () => {
    try {
      setLoading(true);
      addBackendLog('Loading configuration...', 'process');
      const response = await api.config.get();
      
      setAiCores(response.config?.aiCores || response.aiCores || {});
      setShips(response.config?.ships || {});
      
      addBackendLog(`Loaded ${Object.keys(response.config?.aiCores || {}).length} AI cores`, 'success');
      addBackendLog(`Loaded ${Object.keys(response.config?.ships || {}).length} ship configurations`, 'success');
    } catch (err) {
      addBackendLog('Failed to load data: ' + err.message, 'error');
      addTerminalLog('⚠️ ERROR: Failed to load configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addTerminalLog = (message, type = 'info') => {
    setTerminalLog(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const addDreLog = (message, type = 'info') => {
    setDreLog(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const addBackendLog = (message, type = 'info') => {
    setBackendLog(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  };

  const resetSimulation = () => {
    setTerminalLog([]);
    setDreLog([]);
    setBackendLog([]);
    setAttributeBreakdown(null);
    addTerminalLog('>> SYSTEM RESET', 'system');
    addBackendLog('Simulator reset', 'system');
  };

  const calculateBuild = () => {
    if (!selectedShip) {
      addTerminalLog('⚠️ ERROR: No ship selected', 'error');
      addBackendLog('Build calculation failed: No ship selected', 'error');
      return;
    }

    addBackendLog('=== BUILD CALCULATION START ===', 'header');
    addTerminalLog('>> Initializing build calculation...', 'process');
    addDreLog('=== BUILD ANALYSIS ===', 'header');

    const breakdown = {
      ship: selectedShip,
      ai: selectedAI.length > 0 ? selectedAI : null,
      finalStats: { ...(selectedShip.baseStats || selectedShip.stats || {}) },
      finalSkills: {}
    };

    // Ship base stats
    addDreLog(`Ship: ${selectedShip.name}`, 'info');
    addDreLog(`Class: ${selectedShip.class} | Tier: ${selectedShip.tier}`, 'info');
    addTerminalLog(`>> Loading ship: ${selectedShip.name}`, 'success');
    
    const shipStats = selectedShip.baseStats || selectedShip.stats || {};
    Object.entries(shipStats).forEach(([stat, value]) => {
      addDreLog(`  ${stat}: ${value}`, 'data');
    });

    // AI bonuses
    if (selectedAI.length > 0) {
      addDreLog('', 'space');
      addDreLog('AI CORE BONUSES', 'header');
      addTerminalLog(`>> Integrating ${selectedAI.length} AI core(s)`, 'process');
      
      selectedAI.forEach(ai => {
        addBackendLog(`Loading AI: ${ai.name} (${ai.role})`, 'process');
        addDreLog(`${ai.name} - ${ai.role}`, 'success');
        
        Object.entries(ai.skillModifiers || {}).forEach(([skill, value]) => {
          breakdown.finalSkills[skill] = (breakdown.finalSkills[skill] || 0) + value;
          addDreLog(`  ${skill}: +${value}`, 'reward');
        });
      });
      addBackendLog('AI integration complete', 'success');
    }

    addDreLog('', 'space');
    addDreLog('FINAL BUILD STATS', 'header');
    Object.entries(breakdown.finalStats).forEach(([stat, value]) => {
      addDreLog(`${stat}: ${value}`, 'success');
    });

    if (Object.keys(breakdown.finalSkills).length > 0) {
      addDreLog('', 'space');
      addDreLog('SKILL MODIFIERS', 'header');
      Object.entries(breakdown.finalSkills).forEach(([skill, value]) => {
        addDreLog(`${skill}: +${value}`, 'reward');
      });
    }

    setAttributeBreakdown(breakdown);
    addTerminalLog('>> Build calculation complete', 'success');
    addBackendLog('=== BUILD CALCULATION COMPLETE ===', 'header');
  };

  const rollAttack = () => {
    if (!attributeBreakdown) return;
    addTerminalLog('>> Rolling attack...', 'process');
    const roll = Math.floor(Math.random() * 20) + 1;
    const bonus = attributeBreakdown.finalSkills['combat'] || 0;
    const total = roll + bonus;
    addDreLog(`Attack Roll: d20(${roll}) + ${bonus} = ${total}`, roll === 20 ? 'critical-success' : roll === 1 ? 'critical-fail' : 'success');
    addTerminalLog(`>> Attack total: ${total}`, total >= 15 ? 'success' : 'info');
    addBackendLog(`Attack roll executed: ${total}`, 'process');
  };

  const rollDefense = () => {
    if (!attributeBreakdown) return;
    addTerminalLog('>> Rolling defense...', 'process');
    const roll = Math.floor(Math.random() * 20) + 1;
    const bonus = attributeBreakdown.finalSkills['piloting'] || 0;
    const total = roll + bonus;
    addDreLog(`Defense Roll: d20(${roll}) + ${bonus} = ${total}`, roll === 20 ? 'critical-success' : roll === 1 ? 'critical-fail' : 'success');
    addTerminalLog(`>> Defense total: ${total}`, total >= 15 ? 'success' : 'info');
    addBackendLog(`Defense roll executed: ${total}`, 'process');
  };

  const rollEngineering = () => {
    if (!attributeBreakdown) return;
    addTerminalLog('>> Rolling engineering check...', 'process');
    const roll = Math.floor(Math.random() * 20) + 1;
    const bonus = attributeBreakdown.finalSkills['engineering'] || 0;
    const total = roll + bonus;
    addDreLog(`Engineering Check: d20(${roll}) + ${bonus} = ${total}`, roll === 20 ? 'critical-success' : roll === 1 ? 'critical-fail' : 'success');
    addTerminalLog(`>> Engineering total: ${total}`, total >= 15 ? 'success' : 'info');
    addBackendLog(`Engineering check executed: ${total}`, 'process');
  };

  const rollNavigation = () => {
    if (!attributeBreakdown) return;
    addTerminalLog('>> Rolling navigation check...', 'process');
    const roll = Math.floor(Math.random() * 20) + 1;
    const bonus = attributeBreakdown.finalSkills['navigation'] || 0;
    const total = roll + bonus;
    addDreLog(`Navigation Check: d20(${roll}) + ${bonus} = ${total}`, roll === 20 ? 'critical-success' : roll === 1 ? 'critical-fail' : 'success');
    addTerminalLog(`>> Navigation total: ${total}`, total >= 15 ? 'success' : 'info');
    addBackendLog(`Navigation check executed: ${total}`, 'process');
  };

  const simulateDamage = () => {
    if (!attributeBreakdown) return;
    const damage = Math.floor(Math.random() * 30) + 10;
    addTerminalLog(`>> Incoming damage: ${damage}`, 'warning');
    addDreLog(`Damage calculation: ${damage} points`, 'warning');
    addBackendLog(`Damage event: ${damage} HP`, 'warning');
  };

  const simulateRepair = () => {
    if (!attributeBreakdown) return;
    const repair = Math.floor(Math.random() * 20) + 5;
    addTerminalLog(`>> Repairing hull: +${repair} HP`, 'success');
    addDreLog(`Repair systems: ${repair} points restored`, 'success');
    addBackendLog(`Repair event: +${repair} HP`, 'success');
  };

  const btnStyle = (color) => ({
    padding: '0.6rem 1rem',
    background: `rgba(${color === '#0ff' ? '0,255,255' : color === '#f66' ? '255,102,102' : color === '#fa0' ? '255,170,0' : color === '#0af' ? '0,170,255' : color === '#0f8' ? '0,255,136' : color === '#b8f' ? '184,136,255' : color === '#f00' ? '255,0,0' : '0,255,0'}, 0.1)`,
    border: `2px solid ${color}`,
    borderRadius: '6px',
    color,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem'
  });

  const getLogColor = (type) => {
    switch (type) {
      case 'header': return '#0ff';
      case 'system': return '#0ff';
      case 'process': return '#09f';
      case 'success': return '#0f0';
      case 'critical-success': return '#0ff';
      case 'failure': return '#f66';
      case 'critical-fail': return '#f00';
      case 'reward': return '#0f0';
      case 'warning': return '#fa0';
      case 'error': return '#f00';
      case 'data': return '#999';
      case 'space': return 'transparent';
      default: return '#aaa';
    }
  };

  const renderLogEntry = (entry) => {
    if (entry.type === 'space') {
      return <div key={entry.id} style={{ height: '0.5rem' }} />;
    }

    return (
      <div 
        key={entry.id}
        style={{
          color: getLogColor(entry.type),
          marginBottom: '0.5rem',
          fontFamily: entry.type === 'data' ? 'monospace' : 'inherit',
          fontSize: entry.type === 'header' ? '0.95rem' : '0.85rem',
          fontWeight: entry.type === 'header' ? 'bold' : 'normal',
          paddingLeft: entry.type === 'data' ? '1rem' : '0'
        }}
      >
        {entry.type !== 'header' && (
          <span style={{ color: '#666', fontSize: '0.75rem', marginRight: '0.5rem' }}>
            [{entry.time}]
          </span>
        )}
        {entry.message}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingIcon size={48} />
        <p style={{ color: '#aaa', marginTop: '1rem' }}>Loading build data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Ship & AI Selection */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Build Configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Ship Selection */}
          <div>
            <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Select Ship</label>
            <select
              value={selectedShip?.id || ''}
              onChange={(e) => {
                const ship = Object.values(ships).find(s => s.id === e.target.value);
                setSelectedShip(ship || null);
                if (ship) addTerminalLog(`>> Ship selected: ${ship.name}`, 'success');
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            >
              <option value="">-- Select Ship --</option>
              {Object.values(ships).map(ship => (
                <option key={ship.id} value={ship.id}>
                  {ship.name} ({ship.class} - T{ship.tier})
                </option>
              ))}
            </select>
          </div>

          {/* AI Selection */}
          <div>
            <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Assign AI Cores (Multi-select)</label>
            <select
              multiple
              size={4}
              value={selectedAI.map(ai => ai.id)}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(opt => 
                  Object.values(aiCores).find(ai => ai.id === opt.value)
                ).filter(Boolean);
                setSelectedAI(selected);
              }}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              {Object.values(aiCores).map(ai => (
                <option key={ai.id} value={ai.id}>
                  {ai.name} ({ai.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={calculateBuild} className="glass-button" style={btnStyle('#0ff')}>
            <PlayIcon size={16} /> Calculate Build
          </button>
          <button onClick={resetSimulation} className="glass-button" style={btnStyle('#f66')}>
            <RefreshIcon size={16} /> Reset
          </button>
          <button onClick={rollAttack} className="glass-button" style={btnStyle('#fa0')} disabled={!attributeBreakdown}>
            🎲 Roll Attack
          </button>
          <button onClick={rollDefense} className="glass-button" style={btnStyle('#0af')} disabled={!attributeBreakdown}>
            🛡️ Roll Defense
          </button>
          <button onClick={rollEngineering} className="glass-button" style={btnStyle('#0f8')} disabled={!attributeBreakdown}>
            🔧 Roll Engineering
          </button>
          <button onClick={rollNavigation} className="glass-button" style={btnStyle('#b8f')} disabled={!attributeBreakdown}>
            🧭 Roll Navigation
          </button>
          <button onClick={simulateDamage} className="glass-button" style={btnStyle('#f00')} disabled={!attributeBreakdown}>
            💥 Simulate Damage
          </button>
          <button onClick={simulateRepair} className="glass-button" style={btnStyle('#0f0')} disabled={!attributeBreakdown}>
            ⚙️ Simulate Repair
          </button>
        </div>
      </div>

      {/* Three-Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {/* Terminal Panel */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ color: '#0ff', marginBottom: '0.75rem', fontSize: '0.9rem' }}>📟 TERMINAL</h3>
          <div 
            ref={terminalRef}
            style={{
              height: '500px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 255, 0.3)',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}
          >
            {terminalLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Terminal ready...</div>
            )}
            {terminalLog.map(entry => renderLogEntry(entry))}
          </div>
        </div>

        {/* DRE Panel */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ color: '#f0f', marginBottom: '0.75rem', fontSize: '0.9rem' }}>⚙️ DRE</h3>
          <div 
            ref={dreRef}
            style={{
              height: '500px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 0, 255, 0.3)',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}
          >
            {dreLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>DRE ready...</div>
            )}
            {dreLog.map(entry => renderLogEntry(entry))}
          </div>
        </div>

        {/* Backend Panel */}
        <div className="glass-card" style={{ padding: '1rem' }}>
          <h3 style={{ color: '#0f8', marginBottom: '0.75rem', fontSize: '0.9rem' }}>🖥️ BACKEND</h3>
          <div 
            ref={backendRef}
            style={{
              height: '500px',
              overflowY: 'auto',
              background: 'rgba(0, 0, 0, 0.8)',
              padding: '0.75rem',
              borderRadius: '4px',
              border: '1px solid rgba(0, 255, 136, 0.3)',
              fontFamily: 'monospace',
              fontSize: '0.8rem'
            }}
          >
            {backendLog.length === 0 && (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>Backend ready...</div>
            )}
            {backendLog.map(entry => renderLogEntry(entry))}
          </div>
        </div>
      </div>
    </div>
  );
}
