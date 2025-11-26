import '../../styles/AdminGlass.css';

export default function APIDocumentation() {
  const endpoints = [
    {
      category: 'Authentication',
      items: [
        { method: 'POST', path: '/api/auth/login', desc: 'Login and receive JWT token', auth: false },
        { method: 'POST', path: '/api/auth/logout', desc: 'Logout and invalidate session', auth: true },
        { method: 'GET', path: '/api/auth/session', desc: 'Verify session and get user info', auth: true }
      ]
    },
    {
      category: 'Users (Admin Only)',
      items: [
        { method: 'GET', path: '/api/users', desc: 'Get all users', auth: true },
        { method: 'GET', path: '/api/users/:id', desc: 'Get user by ID', auth: true },
        { method: 'POST', path: '/api/users', desc: 'Create new user', auth: true },
        { method: 'PUT', path: '/api/users/:id', desc: 'Update user', auth: true },
        { method: 'DELETE', path: '/api/users/:id', desc: 'Delete user', auth: true }
      ]
    },
    {
      category: 'Events',
      items: [
        { method: 'GET', path: '/api/events', desc: 'Get all events (supports filtering)', auth: false },
        { method: 'GET', path: '/api/events/:id', desc: 'Get event by ID', auth: false },
        { method: 'POST', path: '/api/events', desc: 'Create new event', auth: true },
        { method: 'PUT', path: '/api/events/:id', desc: 'Update event', auth: true },
        { method: 'DELETE', path: '/api/events/:id', desc: 'Delete event', auth: true }
      ]
    },
    {
      category: 'Configuration',
      items: [
        { method: 'GET', path: '/api/config', desc: 'Get current configuration', auth: false },
        { method: 'PUT', path: '/api/config', desc: 'Update configuration', auth: true },
        { method: 'POST', path: '/api/config/reset', desc: 'Reset to defaults', auth: true }
      ]
    },
    {
      category: 'Missions',
      items: [
        { method: 'GET', path: '/api/missions', desc: 'Get all missions (supports filtering)', auth: false },
        { method: 'GET', path: '/api/missions/:id', desc: 'Get mission by ID', auth: false },
        { method: 'POST', path: '/api/missions', desc: 'Create new mission', auth: true },
        { method: 'PUT', path: '/api/missions/:id', desc: 'Update mission', auth: true },
        { method: 'DELETE', path: '/api/missions/:id', desc: 'Delete mission', auth: true }
      ]
    }
  ];

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET': return '#00ffff';
      case 'POST': return '#00ff00';
      case 'PUT': return '#ffaa00';
      case 'DELETE': return '#ff6b6b';
      default: return '#888';
    }
  };

  return (
    <div style={{ paddingTop: '2rem' }}>
      <h2 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
        API Documentation
      </h2>
      
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#888', margin: 0 }}>
              <strong style={{ color: 'var(--neon-cyan)' }}>Base URL:</strong> http://localhost:3002
            </p>
            <p style={{ color: '#888', margin: '0.5rem 0 0 0' }}>
              <strong style={{ color: 'var(--neon-cyan)' }}>Authentication:</strong> Bearer token in Authorization header
            </p>
          </div>
          <span className="status-success">SERVER ONLINE</span>
        </div>
      </div>

      {endpoints.map((category, idx) => (
        <div key={idx} className="glass-card" style={{ marginBottom: '1.5rem', padding: '2rem' }}>
          <h3 style={{
            color: 'var(--neon-cyan)',
            fontSize: '1.2rem',
            marginBottom: '1.5rem',
            borderBottom: '2px solid var(--glass-border)',
            paddingBottom: '0.75rem',
            textShadow: 'var(--glow-cyan)'
          }}>
            {category.category}
          </h3>

          {category.items.map((endpoint, endpointIdx) => (
            <div key={endpointIdx} className="glass-card" style={{
              padding: '1.25rem',
              marginBottom: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginBottom: '0.75rem'
              }}>
                <span className="status-badge" style={{
                  background: `${getMethodColor(endpoint.method)}20`,
                  borderColor: getMethodColor(endpoint.method),
                  color: getMethodColor(endpoint.method),
                  minWidth: '80px',
                  textAlign: 'center',
                  boxShadow: `0 0 10px ${getMethodColor(endpoint.method)}40`
                }}>
                  {endpoint.method}
                </span>
                
                <code style={{
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontFamily: 'Consolas, Monaco, monospace',
                  flex: 1
                }}>
                  {endpoint.path}
                </code>

                {endpoint.auth && (
                  <span className="status-warning" style={{ fontSize: '0.7rem' }}>
                    🔒 AUTH
                  </span>
                )}
              </div>

              <p style={{
                color: '#888',
                fontSize: '0.9rem',
                margin: 0,
                paddingLeft: '96px'
              }}>
                {endpoint.desc}
              </p>
            </div>
          ))}
        </div>
      ))}

      <div className="glass-card" style={{
        padding: '3rem',
        textAlign: 'center',
        marginTop: '2rem',
        background: 'rgba(0, 255, 255, 0.05)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📡</div>
        <h3 style={{ color: 'var(--neon-cyan)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
          Interactive Testing Coming Soon
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#888' }}>
          Try-it-out functionality • Request Builder • Response Viewer • cURL Generator
        </p>
        <p style={{ fontSize: '0.85rem', marginTop: '1rem', color: '#666' }}>
          For now, see <code style={{ color: 'var(--neon-cyan)', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>backend/README.md</code> for detailed examples.
        </p>
      </div>
    </div>
  );
}
