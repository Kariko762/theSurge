import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, LoadingIcon, AddIcon, DeleteIcon, EditIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function ShipTiersManager() {
  const [tierBonuses, setTierBonuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingBonus, setEditingBonus] = useState(null);
  const [filterTier, setFilterTier] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadTierBonuses();
  }, []);

  const loadTierBonuses = async () => {
    try {
      setLoading(true);
      const response = await api.config.get();
      setTierBonuses(response.config?.shipTierBonuses || []);
      setError('');
    } catch (err) {
      setError('Failed to load ship tier bonuses');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.config.get();
      const updatedConfig = { ...response.config, shipTierBonuses: tierBonuses };
      await api.config.update(updatedConfig);
      
      setSuccessMessage('Ship tier bonuses saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save ship tier bonuses');
    } finally {
      setSaving(false);
    }
  };

  const createNewBonus = () => {
    const newBonus = {
      id: `ship_bonus_${Date.now()}`,
      name: 'New Bonus',
      type: 'standard', // standard or advanced
      tier: 2,
      description: '',
      effects: {
        hull: 0,
        shields: 0,
        power: 0,
        cargo: 0,
        speed: 0,
        agility: 0,
        accuracy: 0,
        evasion: 0,
        range: 0,
        damage: 0
      },
      tags: []
    };
    setEditingBonus(newBonus);
  };

  const saveBonus = () => {
    if (editingBonus) {
      const index = tierBonuses.findIndex(b => b.id === editingBonus.id);
      if (index >= 0) {
        const updated = [...tierBonuses];
        updated[index] = editingBonus;
        setTierBonuses(updated);
      } else {
        setTierBonuses([...tierBonuses, editingBonus]);
      }
      setEditingBonus(null);
    }
  };

  const deleteBonus = (id) => {
    if (confirm('Delete this tier bonus?')) {
      setTierBonuses(tierBonuses.filter(b => b.id !== id));
    }
  };

  const filteredBonuses = tierBonuses.filter(bonus => {
    if (filterTier !== 'all' && bonus.tier !== parseInt(filterTier)) return false;
    if (filterType !== 'all' && bonus.type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingIcon size={48} />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 2rem 2rem 2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>Ship Tier Bonuses</h3>
          <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Define bonuses that apply to ships based on their tier
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {error && <span style={{ color: '#f66', fontSize: '0.85rem' }}>{error}</span>}
          {successMessage && <span style={{ color: '#0f8', fontSize: '0.85rem' }}>{successMessage}</span>}
          <button className="btn-neon" onClick={createNewBonus} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AddIcon size={18} /> New Bonus
          </button>
          <button
            className="btn-neon btn-neon-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving ? <LoadingIcon size={18} /> : <SaveIcon size={18} />}
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
          <div>
            <label style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.8rem'
              }}
            >
              <option value="all">All Types</option>
              <option value="standard">Standard</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem' }}>Tier</label>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.8rem'
              }}
            >
              <option value="all">All Tiers</option>
              <option value="2">Tier 2</option>
              <option value="3">Tier 3</option>
              <option value="4">Tier 4</option>
              <option value="5">Tier 5</option>
            </select>
          </div>

          <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '1.2rem' }}>
            {filteredBonuses.length} bonus{filteredBonuses.length !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {/* Bonuses Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
        {filteredBonuses.map(bonus => (
          <div key={bonus.id} className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <h4 style={{ color: '#fff', margin: 0, fontSize: '0.95rem' }}>{bonus.name}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    background: bonus.type === 'standard' ? 'rgba(0, 200, 255, 0.1)' : 'rgba(200, 100, 255, 0.1)',
                    border: `1px solid ${bonus.type === 'standard' ? '#0cf' : '#c8f'}`,
                    borderRadius: '3px',
                    color: bonus.type === 'standard' ? '#0cf' : '#c8f',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}>
                    {bonus.type}
                  </span>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    background: 'rgba(255, 170, 0, 0.1)',
                    border: '1px solid #fa0',
                    borderRadius: '3px',
                    color: '#fa0',
                    fontSize: '0.7rem'
                  }}>
                    T{bonus.tier}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setEditingBonus({ ...bonus })}
                  className="glass-button"
                  style={{
                    padding: '0.4rem',
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid var(--neon-cyan)',
                    borderRadius: '4px',
                    color: 'var(--neon-cyan)',
                    cursor: 'pointer'
                  }}
                >
                  <EditIcon size={14} />
                </button>
                <button
                  onClick={() => deleteBonus(bonus.id)}
                  className="glass-button"
                  style={{
                    padding: '0.4rem',
                    background: 'rgba(255, 100, 100, 0.1)',
                    border: '1px solid #f66',
                    borderRadius: '4px',
                    color: '#f66',
                    cursor: 'pointer'
                  }}
                >
                  <DeleteIcon size={14} />
                </button>
              </div>
            </div>

            <p style={{ color: '#aaa', fontSize: '0.8rem', margin: '0 0 0.75rem 0', lineHeight: 1.4 }}>
              {bonus.description || 'No description'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem', fontSize: '0.75rem' }}>
              {Object.entries(bonus.effects).filter(([_, value]) => value !== 0).map(([stat, value]) => (
                <div key={stat} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                  <span style={{ color: '#888', textTransform: 'capitalize' }}>{stat}</span>
                  <span style={{ color: value > 0 ? '#0f8' : '#f55' }}>
                    {value > 0 ? '+' : ''}{value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredBonuses.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            No tier bonuses configured yet
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingBonus && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: '700px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem'
          }}>
            <h2 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem' }}>
              {tierBonuses.find(b => b.id === editingBonus.id) ? 'Edit Tier Bonus' : 'Create New Tier Bonus'}
            </h2>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Basic Info */}
              <div className="glass-card" style={{ padding: '1rem' }}>
                <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Name</label>
                    <input
                      type="text"
                      value={editingBonus.name}
                      onChange={(e) => setEditingBonus({ ...editingBonus, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(0, 20, 40, 0.5)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Type</label>
                    <select
                      value={editingBonus.type}
                      onChange={(e) => setEditingBonus({ ...editingBonus, type: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(0, 20, 40, 0.5)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                    >
                      <option value="standard">Standard</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Minimum Tier</label>
                    <input
                      type="number"
                      min="2"
                      max="5"
                      value={editingBonus.tier}
                      onChange={(e) => setEditingBonus({ ...editingBonus, tier: parseInt(e.target.value) })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(0, 20, 40, 0.5)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Description</label>
                    <textarea
                      value={editingBonus.description}
                      onChange={(e) => setEditingBonus({ ...editingBonus, description: e.target.value })}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(0, 20, 40, 0.5)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '4px',
                        color: '#fff',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Stat Effects */}
              <div className="glass-card" style={{ padding: '1rem' }}>
                <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Stat Effects</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {Object.entries(editingBonus.effects).map(([stat, value]) => (
                    <div key={stat}>
                      <label style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem', textTransform: 'capitalize' }}>
                        {stat}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setEditingBonus({
                          ...editingBonus,
                          effects: { ...editingBonus.effects, [stat]: parseInt(e.target.value) || 0 }
                        })}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setEditingBonus(null)}
                  className="btn-neon"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBonus}
                  className="btn-neon btn-neon-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <SaveIcon size={18} /> Save Bonus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
