import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { LoadingIcon, WarningIcon, CreateIcon, EditIcon, DeleteIcon, SearchIcon, FilterIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function EncounterManager() {
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    disposition: 'neutral',
    description: '',
    shipClass: '',
    faction: '',
    weight: 1.0,
    enabled: true,
    tags: [],
    triggerConditions: {
      wake: { min: 0, max: 1 },
      locations: [],
      reputation: { min: -100, max: 100 }
    },
    dialogue: {
      initial: '',
      hostile: '',
      friendly: '',
      neutral: ''
    },
    options: {
      trade: { enabled: false, inventory: [] },
      combat: { enabled: false, difficulty: 'medium' },
      diplomacy: { enabled: false, outcomes: [] }
    },
    rewards: {
      credits: { min: 0, max: 0 },
      items: [],
      reputation: 0
    }
  });

  useEffect(() => {
    loadEncounters();
  }, [filter]);

  const loadEncounters = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== 'all' ? { disposition: filter } : {};
      const response = await fetch(`http://localhost:3002/api/encounters?${new URLSearchParams(params)}`);
      const data = await response.json();
      
      if (data.success) {
        setEncounters(data.encounters);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEncounter(null);
    setFormData({
      id: `enc_${Date.now()}`,
      name: '',
      disposition: 'neutral',
      description: '',
      shipClass: '',
      faction: '',
      weight: 1.0,
      enabled: true,
      tags: [],
      triggerConditions: {
        wake: { min: 0, max: 1 },
        locations: [],
        reputation: { min: -100, max: 100 }
      },
      dialogue: {
        initial: '',
        hostile: '',
        friendly: '',
        neutral: ''
      },
      options: {
        trade: { enabled: false, inventory: [] },
        combat: { enabled: false, difficulty: 'medium' },
        diplomacy: { enabled: false, outcomes: [] }
      },
      rewards: {
        credits: { min: 0, max: 0 },
        items: [],
        reputation: 0
      }
    });
    setShowForm(true);
    document.body.classList.add('modal-open');
  };

  const handleEdit = (encounter) => {
    setEditingEncounter(encounter);
    setFormData(encounter);
    setShowForm(true);
    document.body.classList.add('modal-open');
  };

  const handleSave = async () => {
    try {
      const url = editingEncounter 
        ? `http://localhost:3001/api/encounters/${editingEncounter.id}`
        : 'http://localhost:3001/api/encounters';
      
      const method = editingEncounter ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowForm(false);
        document.body.classList.remove('modal-open');
        loadEncounters();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/encounters/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteConfirm(null);
        loadEncounters();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleEnabled = async (encounter) => {
    try {
      const response = await fetch(`http://localhost:3001/api/encounters/${encounter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...encounter, enabled: !encounter.enabled })
      });
      
      const data = await response.json();
      
      if (data.success) {
        loadEncounters();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getDispositionIcon = (disposition) => {
    switch (disposition) {
      case 'hostile': return '⚔️';
      case 'positive': return '🤝';
      case 'neutral': return '⚡';
      default: return '❓';
    }
  };

  const filteredEncounters = encounters.filter(enc => {
    if (searchTerm && !enc.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !enc.id?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={60} />
        <div className="loading-text" style={{ marginTop: '1.5rem' }}>Loading encounters...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        {/* Form Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.5rem', textShadow: '0 0 10px var(--neon-cyan)' }}>
            {editingEncounter ? 'EDIT ENCOUNTER' : 'NEW ENCOUNTER'}
          </h2>
        </div>

        {/* Glass Card Form */}
        <div className="glass-card" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Basic Info */}
            <div>
              <label className="form-group">
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--neon-cyan)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Encounter Name
                </span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-neon"
                  placeholder="Enter encounter name..."
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <label className="form-group">
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--neon-cyan)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Disposition
                </span>
                <select
                  value={formData.disposition}
                  onChange={(e) => setFormData({ ...formData, disposition: e.target.value })}
                  className="input-neon"
                >
                  <option value="hostile">⚔️ Hostile</option>
                  <option value="neutral">⚡ Neutral</option>
                  <option value="positive">🤝 Positive</option>
                </select>
              </label>

              <label className="form-group">
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--neon-cyan)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Ship Class
                </span>
                <input
                  type="text"
                  value={formData.shipClass}
                  onChange={(e) => setFormData({ ...formData, shipClass: e.target.value })}
                  className="input-neon"
                  placeholder="e.g., Corvette"
                />
              </label>

              <label className="form-group">
                <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--neon-cyan)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Weight
                </span>
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className="input-neon"
                />
              </label>
            </div>

            <label className="form-group">
              <span style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--neon-cyan)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Description
              </span>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-neon"
                style={{ minHeight: '80px', resize: 'vertical' }}
                placeholder="Describe this encounter..."
              />
            </label>

            {/* Encounter Options */}
            <div style={{ 
              padding: '1.5rem', 
              background: 'rgba(0, 255, 255, 0.05)', 
              borderRadius: '8px',
              border: '1px solid rgba(0, 255, 255, 0.2)'
            }}>
              <div style={{ marginBottom: '1rem', color: 'var(--neon-cyan)', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Encounter Options
              </div>
              
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <input
                    type="checkbox"
                    checked={formData.options.trade.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      options: {
                        ...formData.options,
                        trade: { ...formData.options.trade, enabled: e.target.checked }
                      }
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>💰 Enable Trading</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <input
                    type="checkbox"
                    checked={formData.options.combat.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      options: {
                        ...formData.options,
                        combat: { ...formData.options.combat, enabled: e.target.checked }
                      }
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>⚔️ Enable Combat</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '6px', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <input
                    type="checkbox"
                    checked={formData.options.diplomacy.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      options: {
                        ...formData.options,
                        diplomacy: { ...formData.options.diplomacy, enabled: e.target.checked }
                      }
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>🗣️ Enable Diplomacy</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={() => {
                  setShowForm(false);
                  document.body.classList.remove('modal-open');
                }}
                className="btn-neon"
                style={{ flex: 1 }}
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                className="btn-neon-primary"
                style={{ flex: 1 }}
              >
                {editingEncounter ? 'UPDATE ENCOUNTER' : 'CREATE ENCOUNTER'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.5rem', textShadow: '0 0 10px var(--neon-cyan)', letterSpacing: '2px' }}>
          ENCOUNTER MANAGER
        </h2>
        <button 
          className="btn-neon-primary" 
          onClick={handleCreate}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CreateIcon size={18} />
          CREATE NEW
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="glass-card" style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderColor: '#ff6b6b',
          background: 'rgba(255, 107, 107, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <WarningIcon size={20} />
            <span style={{ color: '#ff6b6b' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <SearchIcon size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--neon-cyan)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-neon"
              placeholder="Search encounters..."
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'all', label: 'ALL', icon: '' },
              { id: 'hostile', label: 'HOSTILE', icon: '⚔️' },
              { id: 'neutral', label: 'NEUTRAL', icon: '⚡' },
              { id: 'positive', label: 'POSITIVE', icon: '🤝' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="btn-neon"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.8rem',
                  background: filter === f.id ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
                  borderColor: filter === f.id ? 'var(--neon-cyan)' : 'rgba(0, 255, 255, 0.3)',
                  boxShadow: filter === f.id ? '0 0 15px rgba(0, 255, 255, 0.4)' : 'none'
                }}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Encounters Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>TYPE</th>
              <th>NAME</th>
              <th>SHIP CLASS</th>
              <th>FACTION</th>
              <th style={{ width: '200px' }}>OPTIONS</th>
              <th style={{ width: '100px' }}>STATUS</th>
              <th style={{ width: '180px', textAlign: 'center' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredEncounters.map(encounter => (
              <tr key={encounter.id}>
                <td style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                  {getDispositionIcon(encounter.disposition)}
                </td>
                <td>
                  <div style={{ fontWeight: 'bold', color: 'var(--neon-cyan)', marginBottom: '0.25rem' }}>
                    {encounter.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#666' }}>
                    {encounter.id}
                  </div>
                </td>
                <td>{encounter.shipClass || '—'}</td>
                <td>{encounter.faction || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {encounter.options?.trade?.enabled && (
                      <span className="status-badge status-info" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                        💰 Trade
                      </span>
                    )}
                    {encounter.options?.combat?.enabled && (
                      <span className="status-badge status-danger" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                        ⚔️ Combat
                      </span>
                    )}
                    {encounter.options?.diplomacy?.enabled && (
                      <span className="status-badge status-success" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                        🗣️ Diplomacy
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => handleToggleEnabled(encounter)}
                    className={`status-badge ${encounter.enabled ? 'status-success' : 'status-warning'}`}
                    style={{ 
                      cursor: 'pointer', 
                      border: 'none',
                      width: '100%',
                      transition: 'all 0.2s'
                    }}
                  >
                    {encounter.enabled ? '● ACTIVE' : '○ DISABLED'}
                  </button>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => handleEdit(encounter)}
                      className="btn-neon"
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <EditIcon size={14} />
                      EDIT
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(encounter.id)}
                      className="btn-neon-danger"
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <DeleteIcon size={14} />
                      DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEncounters.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '3rem', 
            color: 'rgba(255, 255, 255, 0.5)',
            background: 'rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>👽</div>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--neon-cyan)' }}>
              No encounters found
            </div>
            <div style={{ fontSize: '0.85rem' }}>
              {searchTerm 
                ? 'No encounters match your search criteria.'
                : filter !== 'all'
                  ? `No ${filter} encounters configured. Try a different filter.`
                  : 'Create your first encounter to get started.'
              }
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', textAlign: 'center' }}>
              CONFIRM DELETE
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginBottom: '2rem', textAlign: 'center' }}>
              Are you sure you want to delete this encounter?<br />
              <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>This action cannot be undone.</span>
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-neon"
                style={{ flex: 1 }}
              >
                CANCEL
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-neon-danger"
                style={{ flex: 1 }}
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
