import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, LoadingIcon, WarningIcon, SuccessIcon } from './HoloIcons';
import LootManager from './LootManager';
import NarrativeLibrary from './NarrativeLibrary';
import '../../styles/AdminGlass.css';

export default function ConfigEditor() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeSection, setActiveSection] = useState('difficulty');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.config.get();
      setConfig(response.config || response);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      await api.config.update(config);
      
      setSuccessMessage('Configuration saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all configuration to defaults? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      await api.config.reset();
      await loadConfig();
      setSuccessMessage('Configuration reset to defaults');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset configuration');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="glass-card" style={{
        padding: '2rem',
        borderColor: 'rgba(255, 107, 107, 0.5)',
        background: 'rgba(255, 0, 0, 0.1)'
      }}>
        <span style={{ color: '#ff6b6b', fontSize: '1.1rem' }}>Failed to load configuration</span>
      </div>
    );
  }

  const sections = [
    { id: 'difficulty', label: 'Difficulty Curves' },
    { id: 'loot', label: 'Loot Tables' },
    { id: 'narratives', label: 'Narrative Library' },
    { id: 'risk', label: 'Risk Weights' },
    { id: 'scheduler', label: 'Event Scheduler' }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          Configuration Editor
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-neon btn-neon-danger" 
            onClick={handleReset}
            style={{ fontSize: '0.85rem' }}
          >
            RESET TO DEFAULTS
          </button>
          <button 
            className="btn-neon btn-neon-primary" 
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving ? <LoadingIcon size={18} /> : <SaveIcon size={20} />}
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="glass-card" style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderColor: 'rgba(0, 255, 136, 0.5)',
          background: 'rgba(0, 255, 136, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <SuccessIcon size={20} />
          <span style={{ color: '#00ff88', fontSize: '0.9rem' }}>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderColor: 'rgba(255, 107, 107, 0.5)',
          background: 'rgba(255, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <WarningIcon size={20} />
          <span style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* Section Tabs */}
      <div className="tab-container" style={{ marginBottom: '2rem' }}>
        {sections.map(section => (
          <button
            key={section.id}
            className={`tab-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* DIFFICULTY CURVES SECTION */}
      {activeSection === 'difficulty' && config.difficultyCurves && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.3rem' }}>
            Difficulty Progression
          </h3>

          <div className="form-group">
            <label>Early Game Multiplier: {config.difficultyCurves.earlyGame?.toFixed(2) || '1.00'}</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={config.difficultyCurves.earlyGame || 1}
              onChange={(e) => updateConfig('difficultyCurves.earlyGame', parseFloat(e.target.value))}
              className="slider-neon"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
              <span>Easy (0.1)</span>
              <span>Hard (2.0)</span>
            </div>
            <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.75rem' }}>
              Affects challenge difficulty during the first 30 minutes of gameplay
            </small>
          </div>

          <div className="form-group">
            <label>Mid Game Multiplier: {config.difficultyCurves.midGame?.toFixed(2) || '1.50'}</label>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={config.difficultyCurves.midGame || 1.5}
              onChange={(e) => updateConfig('difficultyCurves.midGame', parseFloat(e.target.value))}
              className="slider-neon"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
              <span>Easy (0.5)</span>
              <span>Hard (3.0)</span>
            </div>
            <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.75rem' }}>
              Affects challenge difficulty from 30-60 minutes
            </small>
          </div>

          <div className="form-group">
            <label>Late Game Multiplier: {config.difficultyCurves.lateGame?.toFixed(2) || '2.00'}</label>
            <input
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={config.difficultyCurves.lateGame || 2}
              onChange={(e) => updateConfig('difficultyCurves.lateGame', parseFloat(e.target.value))}
              className="slider-neon"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
              <span>Easy (1.0)</span>
              <span>Extreme (5.0)</span>
            </div>
            <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.75rem' }}>
              Affects challenge difficulty after 60 minutes
            </small>
          </div>
        </div>
      )}

      {/* LOOT TABLES SECTION */}
      {activeSection === 'loot' && (
        <LootManager config={config} updateConfig={updateConfig} />
      )}

      {/* NARRATIVE LIBRARY SECTION */}
      {activeSection === 'narratives' && (
        <NarrativeLibrary config={config} updateConfig={updateConfig} />
      )}

      {/* RISK WEIGHTS SECTION */}
      {activeSection === 'risk' && config.riskWeights && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.3rem' }}>
            Event Risk Probabilities
          </h3>

          {Object.entries(config.riskWeights).map(([risk, weight]) => (
            <div key={risk} className="form-group">
              <label>{risk.toUpperCase()} RISK: {weight}</label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={weight}
                onChange={(e) => updateConfig(`riskWeights.${risk}`, parseFloat(e.target.value))}
                className="slider-neon"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                <span>Never (0)</span>
                <span>Very Frequent (10)</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EVENT SCHEDULER SECTION */}
      {activeSection === 'scheduler' && config.eventScheduler && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.3rem' }}>
            Event Scheduler Settings
          </h3>

          <div className="form-group">
            <label>Minimum Interval: {config.eventScheduler.minInterval || 5}s</label>
            <input
              type="range"
              min="2"
              max="30"
              step="1"
              value={config.eventScheduler.minInterval || 5}
              onChange={(e) => updateConfig('eventScheduler.minInterval', parseInt(e.target.value))}
              className="slider-neon"
            />
            <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.75rem' }}>
              Minimum time between event checks (seconds)
            </small>
          </div>

          <div className="form-group">
            <label>Maximum Interval: {config.eventScheduler.maxInterval || 15}s</label>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={config.eventScheduler.maxInterval || 15}
              onChange={(e) => updateConfig('eventScheduler.maxInterval', parseInt(e.target.value))}
              className="slider-neon"
            />
            <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.75rem' }}>
              Maximum time between event checks (seconds)
            </small>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.eventScheduler.pauseOnModal !== false}
                onChange={(e) => updateConfig('eventScheduler.pauseOnModal', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
              <span>Pause Scheduler When Modal Open</span>
            </label>
            <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
              Prevents events from triggering while player is interacting with UI
            </small>
          </div>

          <div className="glass-card" style={{ 
            padding: '1.5rem', 
            marginTop: '2rem',
            background: 'rgba(0, 204, 255, 0.05)'
          }}>
            <h4 style={{ color: 'var(--neon-cyan)', fontSize: '1rem', marginBottom: '1rem' }}>
              Timing Info
            </h4>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Events will be checked every <strong style={{ color: '#00ff88' }}>
              {config.eventScheduler.minInterval || 5}-{config.eventScheduler.maxInterval || 15} seconds
              </strong>. The actual interval is randomized within this range to create natural pacing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
