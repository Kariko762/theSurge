import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import ShipEditor from './ShipEditor';
import { CreateIcon, EditIcon, DeleteIcon, LoadingIcon, WarningIcon, SearchIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function ShipManager() {
  const [ships, setShips] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingShip, setEditingShip] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterTier, setFilterTier] = useState('all');

  useEffect(() => {
    loadShips();
  }, []);

  const loadShips = async () => {
    try {
      setLoading(true);
      const response = await api.config.get();
      setShips(response.config?.ships || response.ships || {});
      setError('');
    } catch (err) {
      setError('Failed to load ships: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingShip(null);
  };

  const handleEdit = (ship) => {
    setEditingShip(ship);
    setIsCreating(false);
  };

  const handleSave = async (shipData) => {
    try {
      const response = await api.config.get();
      const config = response.config || response;
      
      if (!config.ships) {
        config.ships = {};
      }

      config.ships[shipData.id] = shipData;

      await api.config.update(config);
      await loadShips();
      setEditingShip(null);
      setIsCreating(false);
    } catch (err) {
      throw new Error('Failed to save ship: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async (shipId) => {
    if (!confirm(`Delete ship "${ships[shipId]?.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.config.get();
      const config = response.config || response;
      
      delete config.ships[shipId];
      await api.config.update(config);
      await loadShips();
    } catch (err) {
      setError('Failed to delete ship: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCancel = () => {
    setEditingShip(null);
    setIsCreating(false);
  };

  const filteredShips = Object.values(ships).filter(ship => {
    const matchesSearch = !searchTerm || 
      ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = filterClass === 'all' || ship.class === filterClass;
    const matchesTier = filterTier === 'all' || ship.tier === filterTier;

    return matchesSearch && matchesClass && matchesTier;
  });

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingIcon size={48} />
        <p style={{ color: '#aaa', marginTop: '1rem' }}>Loading ships...</p>
      </div>
    );
  }

  if (editingShip || isCreating) {
    return (
      <ShipEditor
        ship={editingShip}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: '#fff', margin: 0 }}>Ship Registry</h2>
          <p style={{ color: '#aaa', margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            {filteredShips.length} ship{filteredShips.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="glass-button"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(0, 255, 255, 0.1)',
            border: '2px solid var(--neon-cyan)',
            borderRadius: '6px',
            color: 'var(--neon-cyan)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <CreateIcon size={20} />
          CREATE NEW SHIP
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {/* Search */}
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              Search Ships
            </label>
            <div style={{ position: 'relative' }}>
              <SearchIcon size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                  background: 'rgba(0, 20, 40, 0.5)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              />
              <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <SearchIcon size={18} />
              </div>
            </div>
          </div>

          {/* Class Filter */}
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              Ship Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="all">All Classes</option>
              <option value="fighter">Fighter</option>
              <option value="corvette">Corvette</option>
              <option value="frigate">Frigate</option>
              <option value="destroyer">Destroyer</option>
              <option value="capital">Capital</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div>
            <label style={{ color: '#aaa', display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              Tier
            </label>
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="all">All Tiers</option>
              <option value="T0">T0 - Starting</option>
              <option value="T1">T1 - Early</option>
              <option value="T2">T2 - Mid</option>
              <option value="T3">T3 - Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          borderColor: 'rgba(255, 107, 107, 0.5)',
          background: 'rgba(255, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <WarningIcon size={20} />
            <span style={{ color: '#ff6b6b' }}>{error}</span>
          </div>
        </div>
      )}

      {/* Ships Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table className="admin-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Tier</th>
              <th>Rarity</th>
              <th>Weapons</th>
              <th>Subsystems</th>
              <th>AI Slots</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredShips.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                  {searchTerm || filterClass !== 'all' || filterTier !== 'all'
                    ? 'No ships match your filters'
                    : 'No ships defined. Click "CREATE NEW SHIP" to add one.'}
                </td>
              </tr>
            ) : (
              filteredShips.map(ship => {
                const enabledWeapons = ship.weaponSlots?.filter(s => s.enabled).length || 0;
                const enabledSubsystems = ship.subsystemSlots?.filter(s => s.enabled).length || 0;
                const aiRange = ship.aiSlots ? `${ship.aiSlots.min}-${ship.aiSlots.max}` : 'N/A';

                return (
                  <tr key={ship.id}>
                    <td>
                      <div style={{ fontWeight: 'bold', color: '#fff' }}>{ship.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>{ship.id}</div>
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{ship.class}</td>
                    <td>{ship.tier}</td>
                    <td style={{ 
                      textTransform: 'capitalize',
                      color: ship.rarity === 'legendary' ? '#ff0' : 
                             ship.rarity === 'epic' ? '#a335ee' :
                             ship.rarity === 'rare' ? '#0070dd' :
                             ship.rarity === 'uncommon' ? '#1eff00' : '#9d9d9d'
                    }}>
                      {ship.rarity}
                    </td>
                    <td>{enabledWeapons}/4</td>
                    <td>{enabledSubsystems}/5</td>
                    <td>{aiRange}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        background: ship.metadata?.enabled ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                        color: ship.metadata?.enabled ? '#0f8' : '#f66',
                        border: `1px solid ${ship.metadata?.enabled ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 107, 107, 0.3)'}`
                      }}>
                        {ship.metadata?.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(ship)}
                          className="glass-button"
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(0, 255, 255, 0.05)',
                            border: '1px solid rgba(0, 255, 255, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Edit Ship"
                        >
                          <EditIcon size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ship.id)}
                          className="glass-button"
                          style={{
                            padding: '0.5rem',
                            background: 'rgba(255, 107, 107, 0.05)',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Delete Ship"
                        >
                          <DeleteIcon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
