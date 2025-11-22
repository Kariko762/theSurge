import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { CreateIcon, EditIcon, DeleteIcon, LoadingIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentUser = api.getUser();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.users.getAll();
      setUsers(response.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading users...</div>
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
          User Management
        </h2>
        <button className="btn-neon btn-neon-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CreateIcon size={20} />
          CREATE NEW USER
        </button>
      </div>
      
      <div className="glass-card" style={{ padding: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>ROLE</th>
              <th>LAST LOGIN</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  {user.username}
                  {user.id === currentUser?.id && (
                    <span style={{ 
                      marginLeft: '0.5rem', 
                      fontSize: '0.75rem',
                      color: '#666'
                    }}>
                      (you)
                    </span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${
                    user.role === 'admin' ? 'status-danger' : 
                    user.role === 'editor' ? 'status-warning' : 
                    'status-info'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td style={{ color: '#666' }}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-neon" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <EditIcon size={16} />
                      EDIT
                    </button>
                    {user.id !== currentUser?.id && (
                      <button className="btn-neon btn-neon-danger" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <DeleteIcon size={16} />
                        DELETE
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <p style={{ fontSize: '0.9rem', marginTop: '2rem', color: '#666', textAlign: 'center' }}>
          Features: Create/Edit/Delete • Password Management • Role Assignment • Activity Logs
        </p>
      </div>
    </div>
  );
}
