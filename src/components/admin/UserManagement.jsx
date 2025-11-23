import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { CreateIcon, EditIcon, DeleteIcon, LoadingIcon, SaveIcon, WarningIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'viewer'
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadUsers();
    loadCurrentUser();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.users.getAll();
      setUsers(response.users || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('surge_user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'viewer' });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({ 
      username: user.username, 
      password: '', 
      role: user.role 
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (username) => {
    try {
      await api.users.delete(username);
      await loadUsers();
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username || formData.username.trim() === '') {
      errors.username = 'Username is required';
    }
    
    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (editingUser && formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const payload = {
        username: formData.username,
        role: formData.role
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }
      
      if (editingUser) {
        await api.users.update(editingUser.username, payload);
      } else {
        await api.users.create(payload);
      }
      
      await loadUsers();
      setShowForm(false);
      setEditingUser(null);
    } catch (err) {
      setFormErrors({ submit: err.message || 'Failed to save user' });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormErrors({});
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading users...</div>
      </div>
    );
  }

  // USER FORM
  if (showForm) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
            {editingUser ? 'Edit User' : 'Create New User'}
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn-neon" onClick={handleCancel}>
              CANCEL
            </button>
            <button 
              className="btn-neon btn-neon-primary" 
              onClick={handleSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <SaveIcon size={20} />
              SAVE USER
            </button>
          </div>
        </div>

        {formErrors.submit && (
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
            <span style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{formErrors.submit}</span>
          </div>
        )}

        <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username *</label>
              <input
                type="text"
                className="input-neon"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter username"
                disabled={!!editingUser}
              />
              {formErrors.username && <span className="error-text">{formErrors.username}</span>}
              {editingUser && (
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  Username cannot be changed
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Password {editingUser ? '(leave blank to keep current)' : '*'}</label>
              <input
                type="password"
                className="input-neon"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingUser ? 'Enter new password to change' : 'Enter password (min 6 characters)'}
              />
              {formErrors.password && <span className="error-text">{formErrors.password}</span>}
              <small style={{ color: '#666', fontSize: '0.8rem' }}>
                {editingUser ? 'Only fill this if you want to change the password' : 'Minimum 6 characters'}
              </small>
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                className="input-neon"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="viewer">Viewer (Read Only)</option>
                <option value="editor">Editor (Can Create/Edit)</option>
                <option value="admin">Admin (Full Access)</option>
              </select>
              <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                • Viewer: Can view all data, cannot make changes<br />
                • Editor: Can create and edit events, missions, config<br />
                • Admin: Full access including user management
              </small>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // USER LIST
  return (
    <div style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          User Management
        </h2>
        <button 
          className="btn-neon btn-neon-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={handleCreate}
        >
          <CreateIcon size={20} />
          CREATE NEW USER
        </button>
      </div>

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

      <div className="glass-card" style={{ padding: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>USERNAME</th>
              <th>ROLE</th>
              <th>LAST LOGIN</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.username}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>
                  {user.username}
                  {currentUser?.username === user.username && (
                    <span style={{ marginLeft: '0.5rem', color: '#00ff88', fontSize: '0.8rem' }}>(you)</span>
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
                <td style={{ color: '#888', fontSize: '0.85rem' }}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      className="btn-neon"
                      style={{ 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                      onClick={() => handleEdit(user)}
                    >
                      <EditIcon size={16} />
                      EDIT
                    </button>
                    
                    <button
                      className="btn-neon btn-neon-danger"
                      style={{ 
                        padding: '0.5rem 1rem', 
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                      onClick={() => setDeleteConfirm(user.username)}
                      disabled={currentUser?.username === user.username}
                    >
                      <DeleteIcon size={16} />
                      DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem' }}>Confirm Deletion</h3>
            <p style={{ color: '#888', marginBottom: '2rem' }}>
              Are you sure you want to delete user <strong style={{ color: '#fff' }}>{deleteConfirm}</strong>? 
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-neon" onClick={() => setDeleteConfirm(null)}>
                CANCEL
              </button>
              <button 
                className="btn-neon btn-neon-danger" 
                onClick={() => handleDelete(deleteConfirm)}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
