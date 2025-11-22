import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api/client';
import '../../styles/AdminGlass.css';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.auth.login(username, password);
      
      if (response.token) {
        // Redirect to admin panel
        navigate('/admin');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Roobert, Arial, sans-serif',
      position: 'relative',
      zIndex: 1
    }}>
      <div className="glass-card" style={{
        width: '450px',
        padding: '3rem',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 className="admin-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            THE SURGE
          </h1>
          <p className="admin-subtitle">ADMIN PORTAL</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--neon-cyan)',
              marginBottom: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              letterSpacing: '2px'
            }}>
              USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoFocus
              className="input-neon"
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--neon-cyan)',
              marginBottom: '0.5rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              letterSpacing: '2px'
            }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="input-neon"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="glass-card" style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderColor: 'rgba(255, 107, 107, 0.5)',
              background: 'rgba(255, 0, 0, 0.1)'
            }}>
              <span style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className={`btn-neon ${!loading && username && password ? 'btn-neon-primary' : ''}`}
            style={{
              width: '100%',
              opacity: (!username || !password) ? 0.5 : 1
            }}
          >
            {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
          </button>
        </form>

        {/* Footer Hint */}
        <div className="glass-card" style={{
          marginTop: '2rem',
          padding: '1.25rem',
          background: 'rgba(0, 255, 255, 0.05)',
          textAlign: 'center'
        }}>
          <strong style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>First Time?</strong>
          <br />
          <span style={{ color: '#888', fontSize: '0.85rem' }}>
            Default: <code style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>admin</code> / <code style={{ color: '#fff', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>admin123</code>
          </span>
        </div>
      </div>
    </div>
  );
}
