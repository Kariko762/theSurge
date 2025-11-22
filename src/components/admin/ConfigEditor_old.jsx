import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, LoadingIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function ConfigEditor() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.config.get();
      setConfig(response.config);
    } catch (err) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading configuration...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card" style={{
        padding: '2rem',
        borderColor: 'rgba(255, 107, 107, 0.5)',
        background: 'rgba(255, 0, 0, 0.1)'
      }}>
        <span style={{ color: '#ff6b6b', fontSize: '1.1rem' }}>{error}</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          Configuration Editor
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-neon">RESET TO DEFAULTS</button>
          <button className="btn-neon btn-neon-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SaveIcon size={20} />
            SAVE CHANGES
          </button>
        </div>
      </div>
      
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Visual Config Editor Coming Soon
          </h3>
          <p style={{ color: '#888', fontSize: '1rem' }}>
            Configuration loaded: <span className={config ? 'status-success' : 'status-danger'}>
              {config ? 'SUCCESS' : 'FAILED'}
            </span>
          </p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', marginBottom: '0.5rem', letterSpacing: '2px' }}>DIFFICULTY CURVES</div>
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>Sliders</div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', marginBottom: '0.5rem', letterSpacing: '2px' }}>LOOT TABLES</div>
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>Rate Editor</div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', marginBottom: '0.5rem', letterSpacing: '2px' }}>RISK WEIGHTS</div>
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>Probability</div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.8rem', marginBottom: '0.5rem', letterSpacing: '2px' }}>EVENT SCHEDULER</div>
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>2s - 60s</div>
          </div>
        </div>
        
        <p style={{ fontSize: '0.9rem', marginTop: '2rem', color: '#666' }}>
          Features: Real-time Sliders • Probability Calculator • Preset Templates • Import/Export
        </p>
      </div>
    </div>
  );
}
