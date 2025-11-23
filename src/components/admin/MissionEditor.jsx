import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { CreateIcon, LoadingIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function MissionEditor() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const response = await api.missions.getAll();
      setMissions(response.missions || []);
    } catch (err) {
      setError(err.message || 'Failed to load missions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading missions...</div>
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
    <div style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          Mission Editor
        </h2>
        <button className="btn-neon btn-neon-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreateIcon size={20} />
          CREATE NEW MISSION
        </button>
      </div>
      
      <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--neon-cyan)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Visual Flowchart Editor Coming Soon
          </h3>
          <p style={{ color: '#888', fontSize: '1rem' }}>
            Currently loaded <span className="status-info">{missions.length} missions</span>
          </p>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '2rem',
          marginTop: '2rem',
          color: '#666'
        }}>
          <div>Step 1</div>
          <div style={{ color: 'var(--neon-cyan)' }}>→</div>
          <div>Step 2</div>
          <div style={{ color: 'var(--neon-cyan)' }}>→</div>
          <div>Outcome</div>
        </div>
        
        <p style={{ fontSize: '0.9rem', marginTop: '2rem', color: '#666' }}>
          Features: Drag-and-Drop • Step Chaining • Branch Logic • Reward Editor • Validation
        </p>
      </div>
    </div>
  );
}
