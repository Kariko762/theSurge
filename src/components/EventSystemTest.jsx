import { useState } from 'react';
import EventExecutor from '../lib/eventExecutor';
import '../styles/AdminGlass.css';

// Test event data - Survey Orbital Station
const eventData = {
  rootEvent: {
    id: 'survey_orbital_station',
    triggerType: 'player_action',
    metadata: {
      title: 'Survey Orbital Structure',
      description: 'You\'ve detected an orbital station or structure.',
      tags: ['exploration', 'risk', 'loot'],
      enabled: true,
      weight: 1.0
    }
  },
  scenarioPool: [
    {
      id: 'derelict_station',
      weight: 0.4,
      modifiers: {
        tierMultiplier: { T0: 0.5, T1: 0.4, T2: 0.3, T3: 0.2 },
        riskBonus: { low: 0, medium: 0.1, high: 0.2 }
      },
      scenario: {
        title: 'Derelict Space Station',
        description: 'The station appears abandoned. Life support is offline.',
        location: 'orbital_station',
        systemMessage: '[SCAN COMPLETE] Station Alpha-7. Status: DERELICT. Age: ~15 years.'
      },
      branches: [
        {
          id: 'leave',
          label: 'Leave the station',
          outcomes: [{
            weight: 1.0,
            type: 'safe_exit',
            narrative: 'You mark the coordinates and continue.',
            rewards: null
          }]
        },
        {
          id: 'investigate',
          label: 'Board and investigate',
          challenge: {
            mode: 'skill_check',
            difficulty: 'medium',
            skills: ['perception', 'technical'],
            baseTarget: 12
          },
          subScenarios: [
            {
              id: 'nothing_found',
              weight: 0.1,
              outcomeType: 'failure',
              narrative: {
                title: 'Empty Station',
                description: 'Nothing of value remains.',
                systemMessage: '[INVESTIGATION COMPLETE] No salvageable materials.'
              },
              rewards: { credits: 50, xp: 25, items: [] }
            },
            {
              id: 'abandon_cache',
              weight: 0.3,
              outcomeType: 'success',
              narrative: {
                title: 'Supply Cache',
                description: 'Emergency supplies still sealed!',
                systemMessage: '[CACHE LOCATED] Emergency locker E-47 opened.'
              },
              rewards: { credits: 300, xp: 100, items: ['med_kit', 'ship_components'] }
            },
            {
              id: 'trap_raiders',
              weight: 0.2,
              outcomeType: 'failure',
              narrative: {
                title: 'Ambush!',
                description: 'Raiders emerge from the shadows!',
                systemMessage: '[HOSTILE CONTACT] Armed hostiles detected!'
              },
              rewards: { credits: -150, xp: 75, items: [], damage: 'minor' }
            },
            {
              id: 'friendly_encounter',
              weight: 0.4,
              outcomeType: 'critical_success',
              narrative: {
                title: 'Unexpected Ally',
                description: 'A scientist offers valuable research data.',
                systemMessage: '[CONTACT] Dr. Elena Vasquez. Offering data exchange.'
              },
              rewards: { credits: 500, xp: 200, items: ['data_core'], unlocks: ['scientist_rescued'] }
            }
          ]
        }
      ]
    },
    {
      id: 'active_station',
      weight: 0.3,
      scenario: {
        title: 'Active Research Station',
        description: 'Lights are on, life support running.',
        systemMessage: '[HAIL] Welcome to Station Gamma-3.'
      },
      branches: [
        {
          id: 'trade',
          label: 'Dock and trade',
          outcomes: [{
            weight: 1.0,
            type: 'trade_opportunity',
            narrative: 'Station traders available.',
            rewards: { unlocks: ['trade_station_gamma3'] }
          }]
        }
      ]
    },
    {
      id: 'alien_artifact',
      weight: 0.1,
      scenario: {
        title: 'Ancient Alien Structure',
        description: 'Unknown architecture with strange energy.',
        systemMessage: '[WARNING] Unknown structure. Recommend caution.'
      },
      branches: [
        {
          id: 'scan_only',
          label: 'Scan from safe distance',
          outcomes: [{
            weight: 1.0,
            type: 'data_collected',
            narrative: 'Valuable scan data collected.',
            rewards: { credits: 600, xp: 150, items: ['scan_data'] }
          }]
        },
        {
          id: 'approach',
          label: 'Approach for closer examination',
          challenge: {
            mode: 'skill_check',
            difficulty: 'very_hard',
            skills: ['science', 'intuition'],
            baseTarget: 16
          },
          outcomes: [
            {
              weight: 0.3,
              type: 'critical_success',
              narrative: 'Artifact recovered!',
              rewards: { credits: 2000, xp: 500, items: ['alien_artifact'] }
            },
            {
              weight: 0.7,
              type: 'critical_failure',
              narrative: 'Defenses activate! Heavy damage!',
              rewards: { credits: -500, xp: 100, damage: 'major' }
            }
          ]
        }
      ]
    }
  ]
};

export default function EventSystemTest() {
  const [executor] = useState(() => new EventExecutor());
  const [gameContext, setGameContext] = useState({
    tier: 'T1',
    risk: 'medium',
    asteroidType: 'metallic',
    playerSkills: {
      perception: 3,
      technical: 2,
      engineering: 4,
      salvage: 2,
      science: 1,
      intuition: 2
    }
  });

  const [eventState, setEventState] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [log, setLog] = useState([]);

  const addLog = (message, type = 'info') => {
    setLog(prev => [...prev, { message, type, timestamp: Date.now() }]);
  };

  const triggerEvent = () => {
    addLog('🚀 Triggering Survey Orbital Station event...', 'system');
    
    const result = executor.executeEvent(eventData, gameContext);
    setEventState(result);
    setSelectedBranch(null);
    setOutcome(null);

    addLog(`📡 ${result.scenario.scenario.systemMessage}`, 'system');
    addLog(`Scenario selected: ${result.scenario.scenario.title}`, 'success');
    addLog(`Weight: ${result.scenario.weight} | Adjusted: ${result.scenario.adjustedWeight || 'N/A'}`, 'info');
  };

  const makeChoice = (branchId) => {
    if (!eventState) return;

    addLog(`⚡ Player chose: ${branchId}`, 'player');

    const result = executor.executeChoice(eventState.scenario, branchId, gameContext);
    setSelectedBranch(result.branch);
    setOutcome(result.outcome);

    // Display challenge results if applicable
    if (result.outcome.challengeResult) {
      const cr = result.outcome.challengeResult;
      addLog(
        `🎲 Challenge: ${cr.mode} (Difficulty: ${result.branch.challenge.difficulty})`,
        'challenge'
      );
      
      // Show detailed modifier breakdown
      addLog(`🎯 Target: ${cr.target}`, 'info');
      addLog(`🎲 Base Roll: ${cr.roll}`, cr.roll >= 15 ? 'success' : cr.roll <= 5 ? 'failure' : 'info');
      
      // Skill breakdown
      if (cr.skillBreakdown && cr.skillBreakdown.length > 0) {
        const skillDetails = cr.skillBreakdown.map(s => `${s.skill}: +${s.value}`).join(', ');
        addLog(`📊 Skills: ${skillDetails} (Total: +${cr.skillBonus})`, 'info');
      }
      
      // Equipment bonuses (future)
      if (cr.equipmentBonus !== 0) {
        const equipDetails = cr.equipmentBreakdown.map(e => `${e.item}: +${e.value}`).join(', ');
        addLog(`⚙️ Equipment: ${equipDetails} (Total: +${cr.equipmentBonus})`, 'info');
      }
      
      // Status effects (future)
      if (cr.statusBonus !== 0) {
        const statusDetails = cr.statusBreakdown.map(s => `${s.effect}: ${s.value >= 0 ? '+' : ''}${s.value}`).join(', ');
        addLog(`✨ Status Effects: ${statusDetails} (Total: ${cr.statusBonus >= 0 ? '+' : ''}${cr.statusBonus})`, cr.statusBonus >= 0 ? 'info' : 'failure');
      }
      
      // Final result
      addLog(
        `📈 Final: ${cr.roll} + ${cr.skillBonus}${cr.equipmentBonus ? ` + ${cr.equipmentBonus}` : ''}${cr.statusBonus ? ` + ${cr.statusBonus}` : ''} = ${cr.total} → ${cr.success ? 'SUCCESS ✓' : 'FAILURE ✗'}`,
        cr.success ? 'success' : 'failure'
      );
      
      if (cr.critical) {
        addLog(
          `💥 CRITICAL ${cr.criticalSuccess ? 'SUCCESS' : 'FAILURE'}! (Natural ${cr.roll})`,
          cr.criticalSuccess ? 'success' : 'failure'
        );
      }
    }

    // Display narrative
    if (result.outcome.narrative) {
      if (typeof result.outcome.narrative === 'string') {
        addLog(`📖 ${result.outcome.narrative}`, 'narrative');
      } else {
        addLog(`📖 ${result.outcome.narrative.title}`, 'narrative');
        addLog(result.outcome.narrative.description, 'narrative');
        if (result.outcome.narrative.systemMessage) {
          addLog(`📡 ${result.outcome.narrative.systemMessage}`, 'system');
        }
      }
    }

    // Display rewards
    if (result.outcome.rewards) {
      const r = result.outcome.rewards;
      if (r.credits) addLog(`💰 Credits: ${r.credits > 0 ? '+' : ''}${r.credits}`, 'reward');
      if (r.xp) addLog(`⭐ XP: +${r.xp}`, 'reward');
      if (r.items && r.items.length > 0) {
        addLog(`📦 Items: ${r.items.join(', ')}`, 'reward');
      }
      if (r.unlocks && r.unlocks.length > 0) {
        addLog(`🔓 Unlocked: ${r.unlocks.join(', ')}`, 'reward');
      }
      if (r.damage) {
        addLog(`⚠️ Ship damage: ${r.damage}`, 'failure');
      }
    }

    // Track telemetry
    executor.trackTelemetry(
      eventState.rootEvent.id,
      eventState.scenario.id,
      result.telemetry
    );

    addLog('📊 Telemetry tracked', 'system');
  };

  const resetTest = () => {
    setEventState(null);
    setSelectedBranch(null);
    setOutcome(null);
    setLog([]);
    addLog('System reset', 'system');
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'system': return '#0ff';
      case 'player': return '#ff0';
      case 'success': return '#0f0';
      case 'failure': return '#f00';
      case 'challenge': return '#f0f';
      case 'narrative': return '#fff';
      case 'reward': return '#fa0';
      default: return '#aaa';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', textAlign: 'center' }}>
        Event System Test
      </h1>
      <p style={{ color: '#aaa', textAlign: 'center', marginBottom: '2rem' }}>
        Testing modular event architecture with weighted scenario pools
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Game Context Panel */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Game Context</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
              System Tier: {gameContext.tier}
            </label>
            <select 
              value={gameContext.tier}
              onChange={(e) => setGameContext({ ...gameContext, tier: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="T0">T0 - Starting</option>
              <option value="T1">T1 - Early</option>
              <option value="T2">T2 - Mid</option>
              <option value="T3">T3 - Late</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
              Risk Level: {gameContext.risk}
            </label>
            <select 
              value={gameContext.risk}
              onChange={(e) => setGameContext({ ...gameContext, risk: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
              Player Skills
            </label>
            {Object.entries(gameContext.playerSkills).map(([skill, value]) => (
              <div key={skill} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ color: '#fff', width: '100px', textTransform: 'capitalize' }}>{skill}:</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={value}
                  onChange={(e) => setGameContext({
                    ...gameContext,
                    playerSkills: { ...gameContext.playerSkills, [skill]: parseInt(e.target.value) }
                  })}
                  className="slider-neon"
                  style={{ flex: 1 }}
                />
                <span style={{ color: 'var(--neon-cyan)', width: '30px', textAlign: 'right' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Controls Panel */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Controls</h3>
          
          <button
            onClick={triggerEvent}
            className="glass-button"
            style={{
              width: '100%',
              padding: '1rem',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(0, 100, 255, 0.1))',
              border: '2px solid var(--neon-cyan)',
              borderRadius: '8px',
              color: 'var(--neon-cyan)',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            🚀 Trigger Event
          </button>

          {eventState && !outcome && (
            <div>
              <h4 style={{ color: '#fff', marginBottom: '1rem' }}>Choose Your Action:</h4>
              {eventState.scenario.branches.map(branch => (
                <button
                  key={branch.id}
                  onClick={() => makeChoice(branch.id)}
                  className="glass-button"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '0.75rem',
                    background: 'rgba(0, 20, 40, 0.5)',
                    border: '1px solid var(--glass-border-bright)',
                    borderRadius: '6px',
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {branch.label}
                </button>
              ))}
            </div>
          )}

          {outcome && (
            <button
              onClick={resetTest}
              className="glass-button"
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(255, 100, 100, 0.2)',
                border: '2px solid #f66',
                borderRadius: '8px',
                color: '#f66',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔄 Reset Test
            </button>
          )}
        </div>
      </div>

      {/* Event Log */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Event Log</h3>
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '1.5rem',
          borderRadius: '6px',
          fontFamily: 'monospace',
          fontSize: '0.9rem'
        }}>
          {log.length === 0 && (
            <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
              No events logged yet. Click "Trigger Event" to begin.
            </div>
          )}
          {log.map((entry, idx) => (
            <div 
              key={idx}
              style={{
                color: getLogColor(entry.type),
                marginBottom: '0.75rem',
                paddingBottom: '0.75rem',
                borderBottom: idx < log.length - 1 ? '1px solid rgba(0, 255, 255, 0.1)' : 'none'
              }}
            >
              {entry.message}
            </div>
          ))}
        </div>
      </div>

      {/* Event Data Preview */}
      {eventState && (
        <div className="glass-card" style={{ marginTop: '2rem', padding: '2rem' }}>
          <h3 style={{ color: '#fff', marginBottom: '1.5rem' }}>Current Event Data</h3>
          <pre style={{
            background: 'rgba(0, 0, 0, 0.5)',
            padding: '1.5rem',
            borderRadius: '6px',
            color: 'var(--neon-cyan)',
            fontSize: '0.85rem',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {JSON.stringify({ eventState, selectedBranch, outcome }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
