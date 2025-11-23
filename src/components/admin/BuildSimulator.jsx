import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api/client';
import { PlayIcon, RefreshIcon, LoadingIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function BuildSimulator() {
  const [aiCrewList, setAiCrewList] = useState({});
  const [selectedAI, setSelectedAI] = useState([]); // Changed to array for multiple AI
  const [loading, setLoading] = useState(true);
  
  // Ship configuration
  const [shipConfig, setShipConfig] = useState({
    hull: 100,
    shields: 50,
    weapons: 3,
    sensors: 2,
    cargo: 10,
    speed: 5
  });

  // Component configuration
  const [components, setComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);

  // DRE Log
  const [dreLog, setDreLog] = useState([]);
  const [attributeBreakdown, setAttributeBreakdown] = useState(null);
  const dreRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (dreRef.current) dreRef.current.scrollTop = dreRef.current.scrollHeight;
  }, [dreLog]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.config.get();
      setAiCrewList(response.config?.aiCrew || response.aiCrew || {});
      
      // Mock components for now
      setComponents([
        { id: 'shield_boost', name: 'Shield Booster MkII', stat: 'shields', value: 25, type: 'additive' },
        { id: 'weapon_upgrade', name: 'Plasma Cannon', stat: 'weapons', value: 2, type: 'additive' },
        { id: 'sensor_array', name: 'Advanced Sensor Array', stat: 'sensors', value: 3, type: 'additive' },
        { id: 'hull_plating', name: 'Reinforced Hull Plating', stat: 'hull', value: 50, type: 'additive' },
        { id: 'cargo_bay', name: 'Expanded Cargo Bay', stat: 'cargo', value: 15, type: 'additive' },
        { id: 'engine_boost', name: 'Ion Engine Booster', stat: 'speed', value: 2, type: 'additive' },
        { id: 'efficiency_core', name: 'Efficiency Core', stat: 'all_skills', value: 1, type: 'additive' },
        { id: 'combat_ai', name: 'Combat AI Module', stat: 'combat', value: 2, type: 'additive' }
      ]);
    } catch (err) {
      addLog('Failed to load data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const addLog = (message, type = 'info', data = null) => {
    setDreLog(prev => [...prev, {
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
      message,
      type,
      data
    }]);
  };

  const resetSimulation = () => {
    setDreLog([]);
    setAttributeBreakdown(null);
    addLog('Build simulator reset', 'system');
  };

  const calculateBuild = () => {
    resetSimulation();
    
    addLog('=== BUILD CALCULATION START ===', 'header');
    addLog('Calculating final build attributes...', 'process');

    const breakdown = {
      ship: { ...shipConfig },
      ai: null,
      components: [],
      skills: {},
      finalStats: { ...shipConfig },
      finalSkills: {}
    };

    // Step 1: Base Ship Stats
    addLog('', 'space');
    addLog('STEP 1: Base Ship Configuration', 'header');
    Object.entries(shipConfig).forEach(([stat, value]) => {
      addLog(`  ${stat}: ${value}`, 'data');
    });

    // Step 2: Apply AI Bonuses
    if (selectedAI) {
      addLog('', 'space');
      addLog('STEP 2: AI Crew Bonuses', 'header');
      breakdown.ai = selectedAI;
      
      addLog(`Selected AI: ${selectedAI.name}`, 'info');
      addLog(`Role: ${selectedAI.role}`, 'info');
      addLog('Skill Modifiers:', 'info');
      
      Object.entries(selectedAI.skillModifiers || {}).forEach(([skill, value]) => {
        breakdown.finalSkills[skill] = (breakdown.finalSkills[skill] || 0) + value;
        breakdown.skills[skill] = {
          base: 0,
          ai: value,
          components: 0,
          total: value
        };
        addLog(`  ${skill}: +${value}`, 'reward');
      });

      // Combat modifiers
      if (selectedAI.combatModifiers) {
        addLog('Combat Modifiers:', 'info');
        Object.entries(selectedAI.combatModifiers).forEach(([stat, value]) => {
          if (breakdown.finalStats[stat] !== undefined) {
            breakdown.finalStats[stat] += value;
            addLog(`  ${stat}: +${value} → ${breakdown.finalStats[stat]}`, 'reward');
          }
        });
      }
    } else {
      addLog('', 'space');
      addLog('STEP 2: AI Crew Bonuses', 'header');
      addLog('No AI selected - skipping AI bonuses', 'warning');
    }

    // Step 3: Apply Component Bonuses
    addLog('', 'space');
    addLog('STEP 3: Component Bonuses', 'header');
    
    if (selectedComponents.length === 0) {
      addLog('No components selected', 'warning');
    } else {
      selectedComponents.forEach(comp => {
        breakdown.components.push(comp);
        addLog(`Installing: ${comp.name}`, 'process');
        
        if (comp.stat === 'all_skills') {
          addLog('  Type: Universal Skill Bonus', 'info');
          Object.keys(breakdown.finalSkills).forEach(skill => {
            breakdown.finalSkills[skill] += comp.value;
            breakdown.skills[skill].components += comp.value;
            breakdown.skills[skill].total += comp.value;
          });
          addLog(`  All skills: +${comp.value}`, 'reward');
        } else if (breakdown.finalStats[comp.stat] !== undefined) {
          // Ship stat bonus
          breakdown.finalStats[comp.stat] += comp.value;
          addLog(`  ${comp.stat}: +${comp.value} → ${breakdown.finalStats[comp.stat]}`, 'reward');
        } else if (breakdown.finalSkills[comp.stat] !== undefined || comp.stat in (selectedAI?.skillModifiers || {})) {
          // Skill bonus
          if (!breakdown.skills[comp.stat]) {
            breakdown.skills[comp.stat] = { base: 0, ai: 0, components: 0, total: 0 };
          }
          breakdown.finalSkills[comp.stat] = (breakdown.finalSkills[comp.stat] || 0) + comp.value;
          breakdown.skills[comp.stat].components += comp.value;
          breakdown.skills[comp.stat].total += comp.value;
          addLog(`  ${comp.stat} skill: +${comp.value}`, 'reward');
        } else {
          addLog(`  Unknown stat: ${comp.stat}`, 'warning');
        }
      });
    }

    // Step 4: Final Summary
    addLog('', 'space');
    addLog('STEP 4: Final Build Summary', 'header');
    
    addLog('Ship Stats:', 'success');
    Object.entries(breakdown.finalStats).forEach(([stat, value]) => {
      const change = value - shipConfig[stat];
      if (change > 0) {
        addLog(`  ${stat}: ${shipConfig[stat]} → ${value} (+${change})`, 'reward');
      } else {
        addLog(`  ${stat}: ${value}`, 'data');
      }
    });

    if (Object.keys(breakdown.finalSkills).length > 0) {
      addLog('', 'space');
      addLog('Skill Modifiers:', 'success');
      Object.entries(breakdown.finalSkills).forEach(([skill, total]) => {
        const detail = breakdown.skills[skill];
        addLog(`  ${skill}: ${total} (AI: ${detail.ai}, Components: ${detail.components})`, 'reward');
      });
    }

    setAttributeBreakdown(breakdown);
    
    addLog('', 'space');
    addLog('=== BUILD CALCULATION COMPLETE ===', 'header');
  };

  const testRoll = (skill) => {
    if (!attributeBreakdown) {
      addLog('No build calculated yet', 'error');
      return;
    }

    addLog('', 'space');
    addLog(`=== TESTING ${skill.toUpperCase()} ROLL ===`, 'header');
    
    const roll = Math.floor(Math.random() * 20) + 1;
    const bonus = attributeBreakdown.finalSkills[skill] || 0;
    const total = roll + bonus;

    addLog(`Rolling d20 for ${skill}...`, 'process');
    addLog(`Base roll: ${roll}`, roll >= 15 ? 'success' : roll <= 5 ? 'critical-fail' : 'info');
    addLog(`Skill bonus: +${bonus}`, 'info');
    
    if (bonus > 0) {
      const detail = attributeBreakdown.skills[skill];
      addLog('Bonus breakdown:', 'info');
      if (detail.ai > 0) addLog(`  AI: +${detail.ai}`, 'data');
      if (detail.components > 0) addLog(`  Components: +${detail.components}`, 'data');
    }
    
    addLog(`Final total: ${roll} + ${bonus} = ${total}`, 'success');
    
    // Check against difficulty targets
    const difficulties = [
      { name: 'Easy', target: 8 },
      { name: 'Medium', target: 12 },
      { name: 'Hard', target: 16 },
      { name: 'Very Hard', target: 20 }
    ];
    
    addLog('Against difficulty targets:', 'info');
    difficulties.forEach(diff => {
      const success = total >= diff.target;
      addLog(`  ${diff.name} (${diff.target}): ${success ? '✓ SUCCESS' : '✗ FAILURE'}`, success ? 'success' : 'failure');
    });

    if (roll === 20) {
      addLog('🌟 NATURAL 20 - CRITICAL SUCCESS!', 'critical-success');
    } else if (roll === 1) {
      addLog('💥 NATURAL 1 - CRITICAL FAILURE!', 'critical-fail');
    }
  };

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
      return <div key={entry.timestamp} style={{ height: '0.5rem' }} />;
    }

    return (
      <div 
        key={entry.timestamp}
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
      {/* Controls */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ color: '#fff', margin: 0 }}>Build Calculator</h3>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={calculateBuild}
              className="glass-button"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(0, 255, 255, 0.1)',
                border: '2px solid var(--neon-cyan)',
                borderRadius: '6px',
                color: 'var(--neon-cyan)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <PlayIcon size={18} />
              Calculate Build
            </button>

            <button
              onClick={resetSimulation}
              className="glass-button"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255, 100, 100, 0.1)',
                border: '2px solid #f66',
                borderRadius: '6px',
                color: '#f66',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshIcon size={18} />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Configuration Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Ship Configuration */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
              🚀 Base Ship Configuration
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {Object.entries(shipConfig).map(([stat, value]) => (
                <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ 
                    color: '#aaa', 
                    width: '80px', 
                    textTransform: 'capitalize',
                    fontSize: '0.85rem'
                  }}>
                    {stat}:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={value}
                    onChange={(e) => setShipConfig({
                      ...shipConfig,
                      [stat]: parseInt(e.target.value)
                    })}
                    style={{ flex: 1 }}
                  />
                  <span style={{ 
                    color: 'var(--neon-cyan)', 
                    width: '40px', 
                    textAlign: 'right',
                    fontSize: '0.9rem'
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Selection */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
              🤖 AI Crew Member
            </h3>
            <select
              value={selectedAI ? selectedAI.id : ''}
              onChange={(e) => {
                const ai = Object.values(aiCrewList).find(a => a.id === e.target.value);
                setSelectedAI(ai || null);
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9rem',
                marginBottom: '1rem'
              }}
            >
              <option value="">-- No AI --</option>
              {Object.values(aiCrewList).map(ai => (
                <option key={ai.id} value={ai.id}>
                  {ai.name} ({ai.role})
                </option>
              ))}
            </select>

            {selectedAI && (
              <div style={{ 
                padding: '1rem', 
                background: 'rgba(0, 255, 255, 0.05)', 
                borderRadius: '6px',
                border: '1px solid rgba(0, 255, 255, 0.2)'
              }}>
                <div style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  {selectedAI.name}
                </div>
                <div style={{ color: '#aaa', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                  {selectedAI.description}
                </div>
                <div style={{ color: '#0ff', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Skill Modifiers:
                </div>
                {Object.entries(selectedAI.skillModifiers || {}).map(([skill, value]) => (
                  <div key={skill} style={{ 
                    color: '#0f0', 
                    fontSize: '0.8rem',
                    paddingLeft: '1rem'
                  }}>
                    {skill}: +{value}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Component Selection */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
              ⚙️ Ship Components
            </h3>
            <div style={{ 
              display: 'grid', 
              gap: '0.5rem',
              maxHeight: '300px',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {components.map(comp => {
                const isSelected = selectedComponents.some(c => c.id === comp.id);
                return (
                  <label
                    key={comp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: isSelected ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 20, 40, 0.3)',
                      border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'var(--glass-border)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedComponents([...selectedComponents, comp]);
                        } else {
                          setSelectedComponents(selectedComponents.filter(c => c.id !== comp.id));
                        }
                      }}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                        {comp.name}
                      </div>
                      <div style={{ color: '#0f0', fontSize: '0.75rem' }}>
                        {comp.stat}: +{comp.value}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* DRE Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
            <h3 style={{ color: '#f0f', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚙️</span> DRE (Build Calculation Engine)
            </h3>
            <div 
              ref={dreRef}
              style={{
                height: '600px',
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '1rem',
                borderRadius: '6px',
                border: '1px solid rgba(255, 0, 255, 0.2)',
                fontFamily: 'monospace',
                fontSize: '0.85rem'
              }}
            >
              {dreLog.length === 0 && (
                <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                  Configure your build and click "Calculate Build" to see the breakdown
                </div>
              )}
              {dreLog.map(renderLogEntry)}
            </div>
          </div>

          {/* Skill Test Panel */}
          {attributeBreakdown && Object.keys(attributeBreakdown.finalSkills).length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>
                🎲 Test Skill Rolls
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {Object.keys(attributeBreakdown.finalSkills).map(skill => (
                  <button
                    key={skill}
                    onClick={() => testRoll(skill)}
                    className="glass-button"
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(0, 20, 40, 0.5)',
                      border: '1px solid var(--glass-border-bright)',
                      borderRadius: '6px',
                      color: '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div style={{ textTransform: 'capitalize' }}>{skill}</div>
                    <div style={{ color: '#0f0', fontSize: '0.75rem' }}>
                      +{attributeBreakdown.finalSkills[skill]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
