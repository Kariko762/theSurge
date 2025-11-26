import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, WarningIcon, SuccessIcon, RefreshIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function EventSchedulerManager() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [simulatedRisk, setSimulatedRisk] = useState(0);

  // Simulation inputs for testing risk calculation
  const [simWake, setSimWake] = useState(0.5);
  const [simZone, setSimZone] = useState('normal');
  const [simTimeInSystem, setSimTimeInSystem] = useState(1);
  const [simFactionStanding, setSimFactionStanding] = useState({
    faction_freebelt: -30,
    faction_threxul: -100,
    faction_hexcorp: 0
  });

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    calculateSimulatedRisk();
  }, [config, simWake, simZone, simTimeInSystem, simFactionStanding]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.config.getEventScheduler();
      setConfig(response.config || response);
    } catch (err) {
      setError('Failed to load event scheduler configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setError('');
      
      await api.config.updateEventScheduler(config);
      
      setSuccessMessage('Event scheduler configuration saved!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (!confirm('Reset all event scheduler settings to defaults? This cannot be undone.')) {
      return;
    }
    loadConfig();
  };

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const calculateSimulatedRisk = () => {
    if (!config) return;

    let risk = 0;

    // 1. Wake contribution
    const wakeContribution = simWake * config.riskWeights.wake;
    risk += wakeContribution;

    // 2. Location danger
    const locationBaseRisk = config.locationRisk[simZone] || 30;
    risk += locationBaseRisk * (config.riskWeights.location / 100);

    // 3. Time in system
    const timeRisk = Math.min(simTimeInSystem * 2, 100);
    risk += timeRisk * (config.riskWeights.timeInSystem / 100);

    // 4. Faction standing (NEW)
    if (config.factionStandingRisk.enabled) {
      let factionRisk = 0;
      
      Object.entries(simFactionStanding).forEach(([factionId, standing]) => {
        if (standing < config.factionStandingRisk.threshold) {
          const standingDiff = Math.abs(standing - config.factionStandingRisk.threshold);
          const faction = config.factionStandingRisk.factions.find(f => f.id === factionId);
          
          if (faction) {
            // Poor standing increases encounter chance
            const encounterBonus = standingDiff * config.factionStandingRisk.multiplier;
            factionRisk += (faction.baseEncounterChance + encounterBonus);
          }
        }
      });
      
      risk += factionRisk * (config.factionStandingRisk.weight / 100);
    }

    setSimulatedRisk(Math.max(0, Math.min(100, risk)));
  };

  const getRiskLevel = (risk) => {
    if (risk < 20) return { label: 'LOW', color: '#0f0' };
    if (risk < 40) return { label: 'MODERATE', color: '#fa0' };
    if (risk < 60) return { label: 'HIGH', color: '#f90' };
    if (risk < 80) return { label: 'CRITICAL', color: '#f66' };
    return { label: 'EXTREME', color: '#f00' };
  };

  const getCheckInterval = (risk) => {
    if (risk < 20) return config.checkIntervals.low;
    if (risk < 40) return config.checkIntervals.moderate;
    if (risk < 60) return config.checkIntervals.high;
    if (risk < 80) return config.checkIntervals.critical;
    return config.checkIntervals.extreme;
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ color: '#0cf', fontSize: '1.2rem' }}>Loading event scheduler...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="glass-card" style={{ padding: '2rem', borderColor: '#f66', background: 'rgba(255,0,0,0.1)' }}>
        <WarningIcon size={24} />
        <span style={{ color: '#f66', marginLeft: '0.5rem' }}>Failed to load configuration</span>
      </div>
    );
  }

  const riskLevel = getRiskLevel(simulatedRisk);
  const checkInterval = getCheckInterval(simulatedRisk);

  return (
    <div style={{ padding: '1rem' }}>
      {/* Success Message */}
      {successMessage && (
        <div className="glass-card" style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderColor: 'rgba(0, 255, 136, 0.5)',
          background: 'rgba(0, 255, 136, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <SuccessIcon size={18} />
          <span style={{ color: '#00ff88' }}>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          borderColor: 'rgba(255, 107, 107, 0.5)',
          background: 'rgba(255, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <WarningIcon size={18} />
          <span style={{ color: '#ff6b6b' }}>{error}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', marginBottom: '0.5rem' }}>⏱️ Event Scheduler Configuration</h2>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          Configure dynamic event triggering based on risk factors
        </p>
      </div>

      {/* Actions Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="glass-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: saving ? 'rgba(0,0,0,0.3)' : 'rgba(0, 204, 255, 0.2)',
            border: '1px solid var(--neon-cyan)',
            color: 'var(--neon-cyan)',
            cursor: saving ? 'not-allowed' : 'pointer'
          }}
        >
          <SaveIcon size={18} />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>

        <button
          onClick={resetToDefaults}
          className="glass-button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 165, 0, 0.2)',
            border: '1px solid #fa0',
            color: '#fa0',
            cursor: 'pointer'
          }}
        >
          <RefreshIcon size={18} />
          Reset to Defaults
        </button>
      </div>

      {/* Risk Simulator */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'rgba(0, 204, 255, 0.05)' }}>
        <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>
          🎲 Risk Calculator Simulator
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Wake Input */}
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
              Wake Level: {simWake.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={simWake}
              onChange={(e) => setSimWake(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Zone Select */}
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>Zone Type</label>
            <select
              value={simZone}
              onChange={(e) => setSimZone(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff'
              }}
            >
              <option value="quiet">Quiet Zone</option>
              <option value="normal">Normal Zone</option>
              <option value="dark">Dark Zone</option>
              <option value="static">Static Zone</option>
              <option value="void">Void Zone</option>
            </select>
          </div>

          {/* Time in System */}
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
              Time in System: {simTimeInSystem.toFixed(1)} hours
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={simTimeInSystem}
              onChange={(e) => setSimTimeInSystem(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Faction Standing */}
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>Faction Standing (Hostile)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#888', fontSize: '0.8rem', width: '120px' }}>Freebelt: {simFactionStanding.faction_freebelt}</span>
                <input
                  type="range"
                  min="-100"
                  max="0"
                  value={simFactionStanding.faction_freebelt}
                  onChange={(e) => setSimFactionStanding(prev => ({ ...prev, faction_freebelt: parseInt(e.target.value) }))}
                  style={{ flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#888', fontSize: '0.8rem', width: '120px' }}>Threxul: {simFactionStanding.faction_threxul}</span>
                <input
                  type="range"
                  min="-100"
                  max="0"
                  value={simFactionStanding.faction_threxul}
                  onChange={(e) => setSimFactionStanding(prev => ({ ...prev, faction_threxul: parseInt(e.target.value) }))}
                  style={{ flex: 1 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Risk Result */}
        <div style={{
          padding: '1.5rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          border: `2px solid ${riskLevel.color}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Current Risk Score</div>
              <div style={{ color: riskLevel.color, fontSize: '2.5rem', fontWeight: 'bold' }}>
                {simulatedRisk.toFixed(1)}%
              </div>
              <div style={{ color: riskLevel.color, fontSize: '1.1rem', fontWeight: 'bold' }}>
                {riskLevel.label}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Check Frequency</div>
              <div style={{ color: '#0cf', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {checkInterval}s
              </div>
              <div style={{ color: '#666', fontSize: '0.8rem' }}>
                {(60 / checkInterval).toFixed(1)} checks/min
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
        {/* Global Settings */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>⚙️ Global Settings</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig('enabled', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ color: '#aaa' }}>Enable Dynamic Event Scheduler</span>
            </label>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
              Global Cooldown: {config.globalCooldown}s
            </label>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={config.globalCooldown}
              onChange={(e) => updateConfig('globalCooldown', parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <small style={{ color: '#666', fontSize: '0.8rem' }}>
              Minimum time between any events
            </small>
          </div>
        </div>

        {/* Risk Weights */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>⚖️ Risk Factor Weights</h3>
          
          {Object.entries(config.riskWeights).map(([factor, weight]) => (
            <div key={factor} style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
                {factor.charAt(0).toUpperCase() + factor.slice(1).replace(/([A-Z])/g, ' $1')}: {weight}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={weight}
                onChange={(e) => updateConfig(`riskWeights.${factor}`, parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>

        {/* Check Intervals */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>⏱️ Check Intervals</h3>
          
          {Object.entries(config.checkIntervals).map(([level, interval]) => (
            <div key={level} style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
                {level.toUpperCase()} Risk: {interval}s
              </label>
              <input
                type="range"
                min="1"
                max="120"
                step="1"
                value={interval}
                onChange={(e) => updateConfig(`checkIntervals.${level}`, parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>

        {/* Event Cooldowns */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>🕐 Event Type Cooldowns</h3>
          
          {Object.entries(config.eventCooldowns).map(([eventType, cooldown]) => (
            <div key={eventType} style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
                {eventType.charAt(0).toUpperCase() + eventType.slice(1)}: {cooldown}s
              </label>
              <input
                type="range"
                min="60"
                max="1800"
                step="30"
                value={cooldown}
                onChange={(e) => updateConfig(`eventCooldowns.${eventType}`, parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                {Math.floor(cooldown / 60)} minutes
              </small>
            </div>
          ))}
        </div>

        {/* Faction Standing Risk (NEW) */}
        <div className="glass-card" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>👁️ Faction Standing Risk</h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                checked={config.factionStandingRisk.enabled}
                onChange={(e) => updateConfig('factionStandingRisk.enabled', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span style={{ color: '#aaa' }}>Enable Faction Hunting (poor standing increases encounter chance)</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: config.factionStandingRisk.enabled ? 1 : 0.4 }}>
              <div>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
                  Faction Risk Weight: {config.factionStandingRisk.weight}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={config.factionStandingRisk.weight}
                  onChange={(e) => updateConfig('factionStandingRisk.weight', parseInt(e.target.value))}
                  disabled={!config.factionStandingRisk.enabled}
                  style={{ width: '100%' }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  How much faction standing contributes to total risk
                </small>
              </div>

              <div>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
                  Hostile Threshold: {config.factionStandingRisk.threshold}
                </label>
                <input
                  type="range"
                  min="-100"
                  max="0"
                  step="10"
                  value={config.factionStandingRisk.threshold}
                  onChange={(e) => updateConfig('factionStandingRisk.threshold', parseInt(e.target.value))}
                  disabled={!config.factionStandingRisk.enabled}
                  style={{ width: '100%' }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  Standing below this triggers hunting behavior
                </small>
              </div>

              <div>
                <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem' }}>
                  Risk Multiplier: {config.factionStandingRisk.multiplier.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={config.factionStandingRisk.multiplier}
                  onChange={(e) => updateConfig('factionStandingRisk.multiplier', parseFloat(e.target.value))}
                  disabled={!config.factionStandingRisk.enabled}
                  style={{ width: '100%' }}
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  How aggressively factions hunt you
                </small>
              </div>
            </div>
          </div>

          {/* Faction Encounter Settings */}
          <div style={{ marginTop: '1.5rem' }}>
            <h4 style={{ color: '#888', marginBottom: '1rem', fontSize: '0.95rem' }}>Faction Base Encounter Rates</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {config.factionStandingRisk.factions.map((faction, index) => (
                <div key={faction.id} style={{
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <div style={{ color: '#0cf', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {faction.id.replace('faction_', '').toUpperCase()}
                  </div>
                  <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    Base Chance: {faction.baseEncounterChance}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={faction.baseEncounterChance}
                    onChange={(e) => {
                      const newFactions = [...config.factionStandingRisk.factions];
                      newFactions[index].baseEncounterChance = parseInt(e.target.value);
                      updateConfig('factionStandingRisk.factions', newFactions);
                    }}
                    disabled={!config.factionStandingRisk.enabled}
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
