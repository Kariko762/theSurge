import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, LoadingIcon, AddIcon, DeleteIcon, EditIcon } from './HoloIcons';
import ShipTiersManager from './ShipTiersManager';
import '../../styles/AdminGlass.css';

// Ship class definitions with slot progression
const SHIP_CLASSES = {
  fighter: { weapons: 2, subsystems: 2, minLevel: 1, maxLevel: 10 },
  corvette: { weapons: 3, subsystems: 3, minLevel: 1, maxLevel: 15 },
  frigate: { weapons: 4, subsystems: 4, minLevel: 5, maxLevel: 20 },
  destroyer: { weapons: 5, subsystems: 5, minLevel: 10, maxLevel: 25 },
  cruiser: { weapons: 6, subsystems: 6, minLevel: 15, maxLevel: 30 },
  battleship: { weapons: 8, subsystems: 7, minLevel: 20, maxLevel: 35 },
  carrier: { weapons: 4, subsystems: 8, minLevel: 20, maxLevel: 35 },
  freighter: { weapons: 2, subsystems: 6, minLevel: 1, maxLevel: 20 }
};

export default function ShipsManager() {
  const [activeTab, setActiveTab] = useState('builder');
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingShip, setEditingShip] = useState(null);
  const [filterClass, setFilterClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [lootItems, setLootItems] = useState([]);
  const [aiCrew, setAiCrew] = useState([]);
  const [shipTierBonuses, setShipTierBonuses] = useState([]);
  const [factions, setFactions] = useState([]);

  useEffect(() => {
    loadShips();
    loadLootItems();
    loadAICrew();
    loadShipTierBonuses();
    loadFactions();
  }, []);

  const loadShips = async () => {
    try {
      setLoading(true);
      const response = await api.config.get();
      setShips(response.config?.ships || response.ships || []);
      setError('');
    } catch (err) {
      setError('Failed to load ships');
    } finally {
      setLoading(false);
    }
  };

  const loadLootItems = async () => {
    try {
      const response = await api.config.get();
      setLootItems(response.config?.lootTables?.items || []);
    } catch (err) {
      console.error('Failed to load loot items:', err);
    }
  };

  const loadAICrew = async () => {
    try {
      const response = await api.config.get();
      setAiCrew(response.config?.aiCrew || []);
    } catch (err) {
      console.error('Failed to load AI crew:', err);
    }
  };

  const loadShipTierBonuses = async () => {
    try {
      const response = await api.config.get();
      setShipTierBonuses(response.config?.shipTierBonuses || []);
    } catch (err) {
      console.error('Failed to load ship tier bonuses:', err);
    }
  };

  const loadFactions = async () => {
    try {
      const response = await api.config.get();
      setFactions(response.config?.factions || []);
    } catch (err) {
      console.error('Failed to load factions:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.config.get();
      const updatedConfig = { ...response.config, ships };
      await api.config.update(updatedConfig);
      
      setSuccessMessage('Ships saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save ships');
    } finally {
      setSaving(false);
    }
  };

  const createNewShip = (shipClass = 'corvette') => {
    const classConfig = SHIP_CLASSES[shipClass];
    if (!classConfig) {
      console.error('Invalid ship class:', shipClass);
      return;
    }
    
    // Create weapon slots based on class
    const weaponSlots = {};
    for (let i = 1; i <= classConfig.weapons; i++) {
      weaponSlots[`slot_${i}`] = null; // Just store item ID
    }
    
    // Create subsystem slots based on class
    const subsystemSlots = {};
    for (let i = 1; i <= classConfig.subsystems; i++) {
      subsystemSlots[`slot_${i}`] = null; // Just store item ID
    }
    
    // Create AI core slots (2 slots for all ships)
    const aiCores = {
      slot_1: null,
      slot_2: null
    };
    
    const newShip = {
      id: `ship_${Date.now()}`,
      name: 'New Ship',
      class: shipClass,
      tier: 1,
      manufacturer: 'Unknown',
      faction: null,
      description: '',
      playerLevelRequired: classConfig.minLevel,
      baseStats: {
        hull: 100,
        shields: 50,
        power: 100,
        cargo: 50,
        speed: 5,
        agility: 5
      },
      fuelCapacity: {
        min: 50,
        max: 100
      },
      engine: null, // Item ID of equipped engine
      weaponSlots,
      subsystemSlots,
      aiCores,
      aiCoreSlots: 2, // Number of AI core slots (expandable)
      tierBonuses: [], // Array of selected tier bonus IDs
      cost: 10000,
      unlockRequirements: {
        credits: 10000,
        reputation: 0,
        tier: 1
      },
      enabled: true
    };
    
    setEditingShip(newShip);
  };

  const saveShip = () => {
    if (editingShip) {
      const index = ships.findIndex(s => s.id === editingShip.id);
      if (index >= 0) {
        const updated = [...ships];
        updated[index] = editingShip;
        setShips(updated);
      } else {
        setShips([...ships, editingShip]);
      }
      setEditingShip(null);
      setSuccessMessage('Ship updated');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const deleteShip = (id) => {
    if (confirm('Delete this ship?')) {
      setShips(ships.filter(s => s.id !== id));
      setSuccessMessage('Ship deleted');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const handleClassChange = (newClass) => {
    const classConfig = SHIP_CLASSES[newClass];
    
    // Regenerate weapon slots
    const weaponSlots = {};
    for (let i = 1; i <= classConfig.weapons; i++) {
      weaponSlots[`slot_${i}`] = editingShip.weaponSlots?.[`slot_${i}`] || null;
    }
    
    // Regenerate subsystem slots
    const subsystemSlots = {};
    for (let i = 1; i <= classConfig.subsystems; i++) {
      subsystemSlots[`slot_${i}`] = editingShip.subsystemSlots?.[`slot_${i}`] || null;
    }
    
    setEditingShip({
      ...editingShip,
      class: newClass,
      playerLevelRequired: classConfig.minLevel,
      weaponSlots,
      subsystemSlots
    });
  };

  const adjustAICoreSlots = (delta) => {
    const currentSlots = editingShip.aiCoreSlots || 2;
    const newSlotCount = Math.max(1, Math.min(6, currentSlots + delta));
    
    // Update aiCores object to match new slot count
    const newAiCores = { ...editingShip.aiCores };
    
    // Add new slots if increasing
    for (let i = 1; i <= newSlotCount; i++) {
      if (!newAiCores[`slot_${i}`]) {
        newAiCores[`slot_${i}`] = null;
      }
    }
    
    // Remove slots if decreasing
    const slotsToRemove = Object.keys(newAiCores).slice(newSlotCount);
    slotsToRemove.forEach(slot => delete newAiCores[slot]);
    
    setEditingShip({
      ...editingShip,
      aiCoreSlots: newSlotCount,
      aiCores: newAiCores
    });
  };

  const getTierBonusAllocation = (tier) => {
    // T1 = no bonuses, T2 = 1 Standard, T3 = 1 Standard + 1 Advanced, etc.
    const allocations = {
      1: { standard: 0, advanced: 0 },
      2: { standard: 1, advanced: 0 },
      3: { standard: 1, advanced: 1 },
      4: { standard: 2, advanced: 1 },
      5: { standard: 2, advanced: 2 }
    };
    return allocations[tier] || allocations[1];
  };

  const addTierBonus = (bonusId) => {
    const currentBonuses = editingShip.tierBonuses || [];
    if (!currentBonuses.includes(bonusId)) {
      setEditingShip({
        ...editingShip,
        tierBonuses: [...currentBonuses, bonusId]
      });
    }
  };

  const removeTierBonus = (bonusId) => {
    setEditingShip({
      ...editingShip,
      tierBonuses: (editingShip.tierBonuses || []).filter(id => id !== bonusId)
    });
  };

  const filteredShips = ships.filter(ship => {
    const matchesClass = filterClass === 'all' || ship.class === filterClass;
    const matchesSearch = !searchTerm || 
      ship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ship.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <LoadingIcon size={48} />
        <p style={{ color: '#aaa', marginTop: '1rem' }}>Loading ships...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Sub-Tabs */}
      <div className="tab-container-sub2">
        <button
          className={`tab-button ${activeTab === 'builder' ? 'active' : ''}`}
          onClick={() => setActiveTab('builder')}
        >
          Ship Builder
        </button>
        <button
          className={`tab-button ${activeTab === 'tiers' ? 'active' : ''}`}
          onClick={() => setActiveTab('tiers')}
        >
          Ship Tiers
        </button>
      </div>

      {activeTab === 'tiers' ? (
        <ShipTiersManager />
      ) : (
        <>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.3rem' }}>Ship Builder</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowClassPicker(!showClassPicker)} className="glass-button" style={{
              padding: '0.6rem 1.2rem',
              background: 'rgba(0, 255, 255, 0.1)',
              border: '2px solid var(--neon-cyan)',
              borderRadius: '6px',
              color: 'var(--neon-cyan)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <AddIcon size={16} />
              New Ship
            </button>
            {showClassPicker && (
              <div className="glass-card" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '0.5rem',
                padding: '0.35rem',
                minWidth: '240px',
                zIndex: 10,
                background: 'rgba(0, 20, 40, 0.98)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.35rem', padding: '0.2rem 0.4rem' }}>Select Ship Class:</div>
                {Object.entries(SHIP_CLASSES).map(([classKey, config]) => (
                  <button
                    key={classKey}
                    onClick={() => {
                      createNewShip(classKey);
                      setShowClassPicker(false);
                    }}
                    className="glass-button"
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.6rem',
                      marginBottom: '0.2rem',
                      background: 'rgba(0, 255, 255, 0.05)',
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      borderRadius: '4px',
                      color: '#fff',
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem'
                    }}
                  >
                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{classKey}</span>
                    <span style={{ color: '#888', fontSize: '0.65rem' }}>
                      {config.weapons}W/{config.subsystems}S · Lv{config.minLevel}+
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleSave} disabled={saving} className="glass-button" style={{
            padding: '0.6rem 1.2rem',
            background: 'rgba(0, 255, 136, 0.1)',
            border: '2px solid #0f8',
            borderRadius: '6px',
            color: '#0f8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <SaveIcon size={16} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="glass-card" style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          background: 'rgba(0, 255, 136, 0.1)',
          borderColor: '#0f8',
          color: '#0f8',
          fontSize: '0.85rem'
        }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="glass-card" style={{
          padding: '0.75rem',
          marginBottom: '1rem',
          background: 'rgba(255, 100, 100, 0.1)',
          borderColor: '#f66',
          color: '#f66',
          fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search ships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            />
          </div>
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{
                padding: '0.5rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.85rem'
              }}
            >
              <option value="all">All Classes</option>
              <option value="fighter">Fighter</option>
              <option value="corvette">Corvette</option>
              <option value="frigate">Frigate</option>
              <option value="destroyer">Destroyer</option>
              <option value="cruiser">Cruiser</option>
              <option value="battleship">Battleship</option>
              <option value="carrier">Carrier</option>
              <option value="freighter">Freighter</option>
            </select>
          </div>
          <div style={{ color: '#aaa', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
            {filteredShips.length} ship{filteredShips.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Ships List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredShips.map(ship => (
          <div key={ship.id} className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>{ship.name}</h3>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid var(--neon-cyan)',
                    borderRadius: '3px',
                    color: 'var(--neon-cyan)',
                    fontSize: '0.7rem',
                    textTransform: 'uppercase'
                  }}>
                    {ship.class}
                  </span>
                  <span style={{
                    padding: '0.2rem 0.6rem',
                    background: 'rgba(255, 170, 0, 0.1)',
                    border: '1px solid #fa0',
                    borderRadius: '3px',
                    color: '#fa0',
                    fontSize: '0.7rem'
                  }}>
                    T{ship.tier}
                  </span>
                  {!ship.enabled && (
                    <span style={{
                      padding: '0.2rem 0.6rem',
                      background: 'rgba(100, 100, 100, 0.1)',
                      border: '1px solid #666',
                      borderRadius: '3px',
                      color: '#666',
                      fontSize: '0.7rem'
                    }}>
                      DISABLED
                    </span>
                  )}
                </div>
                
                <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  {ship.manufacturer} • {ship.description || 'No description'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', fontSize: '0.75rem' }}>
                  <div>
                    <div style={{ color: '#888' }}>Hull</div>
                    <div style={{ color: '#fff' }}>{ship.baseStats.hull}</div>
                  </div>
                  <div>
                    <div style={{ color: '#888' }}>Shields</div>
                    <div style={{ color: '#0ff' }}>{ship.baseStats.shields}</div>
                  </div>
                  <div>
                    <div style={{ color: '#888' }}>Power</div>
                    <div style={{ color: '#fa0' }}>{ship.baseStats.power}</div>
                  </div>
                  <div>
                    <div style={{ color: '#888' }}>Cargo</div>
                    <div style={{ color: '#fff' }}>{ship.baseStats.cargo}</div>
                  </div>
                  <div>
                    <div style={{ color: '#888' }}>Crew</div>
                    <div style={{ color: '#fff' }}>{ship.baseStats.crew}</div>
                  </div>
                  <div>
                    <div style={{ color: '#888' }}>Weapons</div>
                    <div style={{ color: '#f55' }}>{Object.keys(ship.weaponSlots || {}).length}</div>
                  </div>
                  <div>
                    <div style={{ color: '#888' }}>Subsystems</div>
                    <div style={{ color: '#0f8' }}>{Object.keys(ship.subsystemSlots || {}).length}</div>
                  </div>
                  <div>
                    <div style={{ color: '#888' }}>Cost</div>
                    <div style={{ color: '#fa0' }}>{ship.cost?.toLocaleString()} cr</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setEditingShip({ ...ship })}
                  className="glass-button"
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid var(--neon-cyan)',
                    borderRadius: '4px',
                    color: 'var(--neon-cyan)',
                    cursor: 'pointer'
                  }}
                >
                  <EditIcon size={16} />
                </button>
                <button
                  onClick={() => deleteShip(ship.id)}
                  className="glass-button"
                  style={{
                    padding: '0.5rem',
                    background: 'rgba(255, 100, 100, 0.1)',
                    border: '1px solid #f66',
                    borderRadius: '4px',
                    color: '#f66',
                    cursor: 'pointer'
                  }}
                >
                  <DeleteIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredShips.length === 0 && (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>
              {searchTerm || filterClass !== 'all' ? 'No ships match your filters' : 'No ships configured'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingShip && (
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
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '2rem'
          }}>
            <h2 style={{ color: 'var(--neon-cyan)', marginBottom: '1.5rem' }}>
              {ships.find(s => s.id === editingShip.id) ? 'Edit Ship' : 'Create New Ship'}
            </h2>

            {/* Two-Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* LEFT COLUMN */}
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Basic Information</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Name</label>
                      <input
                        type="text"
                        value={editingShip.name}
                        onChange={(e) => setEditingShip({ ...editingShip, name: e.target.value })}
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
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Manufacturer</label>
                      <input
                        type="text"
                        value={editingShip.manufacturer}
                        onChange={(e) => setEditingShip({ ...editingShip, manufacturer: e.target.value })}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Class</label>
                        <select
                          value={editingShip.class}
                          onChange={(e) => handleClassChange(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'rgba(0, 20, 40, 0.5)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}
                        >
                          {Object.entries(SHIP_CLASSES).map(([key, cfg]) => (
                            <option key={key} value={key}>
                              {key.charAt(0).toUpperCase() + key.slice(1)} ({cfg.weapons}W/{cfg.subsystems}S)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Tier</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={editingShip.tier}
                          onChange={(e) => setEditingShip({ ...editingShip, tier: parseInt(e.target.value) })}
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
                    </div>

                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Description</label>
                      <textarea
                        value={editingShip.description}
                        onChange={(e) => setEditingShip({ ...editingShip, description: e.target.value })}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Level Req.</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={editingShip.playerLevelRequired || 1}
                          onChange={(e) => setEditingShip({ ...editingShip, playerLevelRequired: parseInt(e.target.value) })}
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
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Cost</label>
                        <input
                          type="number"
                          value={editingShip.cost}
                          onChange={(e) => setEditingShip({ ...editingShip, cost: parseInt(e.target.value) })}
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
                    </div>

                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Faction</label>
                      <select
                        value={editingShip.faction || ''}
                        onChange={(e) => setEditingShip({ ...editingShip, faction: e.target.value || null })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="">-- No Faction --</option>
                        {factions.map(faction => (
                          <option key={faction.id} value={faction.id}>
                            {faction.iconEmoji} {faction.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editingShip.enabled}
                        onChange={(e) => setEditingShip({ ...editingShip, enabled: e.target.checked })}
                      />
                      Enabled
                    </label>
                  </div>
                </div>

                {/* Base Stats */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Base Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {Object.entries(editingShip.baseStats || {}).filter(([stat]) => stat !== 'crew').map(([stat, value]) => (
                      <div key={stat}>
                        <label style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginBottom: '0.3rem', textTransform: 'capitalize' }}>
                          {stat}
                        </label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => setEditingShip({
                            ...editingShip,
                            baseStats: { ...editingShip.baseStats, [stat]: parseInt(e.target.value) || 0 }
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

                {/* AI Cores - Dynamic */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#c0f', margin: 0, fontSize: '1rem' }}>🤖 AI Cores ({editingShip.aiCoreSlots || 2})</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => adjustAICoreSlots(-1)}
                        disabled={(editingShip.aiCoreSlots || 2) <= 1}
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: 'rgba(200, 0, 255, 0.1)',
                          border: '1px solid #c0f',
                          borderRadius: '4px',
                          color: '#c0f',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          opacity: (editingShip.aiCoreSlots || 2) <= 1 ? 0.3 : 1
                        }}
                      >
                        −
                      </button>
                      <button
                        onClick={() => adjustAICoreSlots(1)}
                        disabled={(editingShip.aiCoreSlots || 2) >= 6}
                        style={{
                          padding: '0.3rem 0.6rem',
                          background: 'rgba(200, 0, 255, 0.1)',
                          border: '1px solid #c0f',
                          borderRadius: '4px',
                          color: '#c0f',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          opacity: (editingShip.aiCoreSlots || 2) >= 6 ? 0.3 : 1
                        }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {Object.entries(editingShip.aiCores || {}).map(([slotId, crewId]) => {
                      const assignedCrew = aiCrew.find(c => c.id === crewId);
                      return (
                        <div key={slotId}>
                          <label style={{ color: '#aaa', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>
                            {slotId.replace('_', ' ').toUpperCase()}
                          </label>
                          <select
                            value={crewId || ''}
                            onChange={(e) => setEditingShip({
                              ...editingShip,
                              aiCores: { ...editingShip.aiCores, [slotId]: e.target.value || null }
                            })}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              background: 'rgba(0, 20, 40, 0.5)',
                              border: `1px solid ${crewId ? '#0f8' : 'var(--glass-border)'}`,
                              borderRadius: '4px',
                              color: crewId ? '#0f8' : '#fff',
                              fontSize: '0.75rem'
                            }}
                          >
                            <option value="">-- Empty --</option>
                            {aiCrew.map(crew => (
                              <option key={crew.id} value={crew.id}>
                                {crew.name} ({crew.specialization})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tier Bonuses */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fa0', marginBottom: '0.5rem', fontSize: '1rem' }}>⭐ Tier Bonuses</h3>
                  {(() => {
                    const allocation = getTierBonusAllocation(editingShip.tier);
                    const selectedBonuses = editingShip.tierBonuses || [];
                    const selectedStandard = selectedBonuses.filter(id => 
                      shipTierBonuses.find(b => b.id === id && b.type === 'standard')
                    );
                    const selectedAdvanced = selectedBonuses.filter(id =>
                      shipTierBonuses.find(b => b.id === id && b.type === 'advanced')
                    );

                    return (
                      <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                          Tier {editingShip.tier}: {allocation.standard} Standard + {allocation.advanced} Advanced
                        </div>

                        {allocation.standard > 0 && (
                          <div>
                            <label style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                              Standard Bonuses ({selectedStandard.length}/{allocation.standard})
                            </label>
                            {shipTierBonuses.filter(b => b.type === 'standard' && b.tier <= editingShip.tier).length > 0 ? (
                              <div style={{ display: 'grid', gap: '0.35rem' }}>
                                {shipTierBonuses.filter(b => b.type === 'standard' && b.tier <= editingShip.tier).map(bonus => {
                                  const isSelected = selectedBonuses.includes(bonus.id);
                                  const canSelect = !isSelected && selectedStandard.length < allocation.standard;
                                  return (
                                    <button
                                      key={bonus.id}
                                      onClick={() => isSelected ? removeTierBonus(bonus.id) : (canSelect && addTierBonus(bonus.id))}
                                      disabled={!isSelected && !canSelect}
                                      style={{
                                        padding: '0.5rem',
                                        background: isSelected ? 'rgba(0, 200, 255, 0.15)' : 'rgba(0, 20, 40, 0.5)',
                                        border: `1px solid ${isSelected ? '#0cf' : 'var(--glass-border)'}`,
                                        borderRadius: '4px',
                                        color: isSelected ? '#0cf' : '#aaa',
                                        textAlign: 'left',
                                        cursor: (isSelected || canSelect) ? 'pointer' : 'not-allowed',
                                        fontSize: '0.75rem',
                                        opacity: (!isSelected && !canSelect) ? 0.4 : 1
                                      }}
                                    >
                                      {bonus.name} {isSelected && '✓'}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ color: '#666', fontSize: '0.75rem', padding: '0.5rem' }}>
                                No standard bonuses available. Create them in Ship Tiers tab.
                              </div>
                            )}
                          </div>
                        )}

                        {allocation.advanced > 0 && (
                          <div>
                            <label style={{ color: '#aaa', fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>
                              Advanced Bonuses ({selectedAdvanced.length}/{allocation.advanced})
                            </label>
                            {shipTierBonuses.filter(b => b.type === 'advanced' && b.tier <= editingShip.tier).length > 0 ? (
                              <div style={{ display: 'grid', gap: '0.35rem' }}>
                                {shipTierBonuses.filter(b => b.type === 'advanced' && b.tier <= editingShip.tier).map(bonus => {
                                  const isSelected = selectedBonuses.includes(bonus.id);
                                  const canSelect = !isSelected && selectedAdvanced.length < allocation.advanced;
                                  return (
                                    <button
                                      key={bonus.id}
                                      onClick={() => isSelected ? removeTierBonus(bonus.id) : (canSelect && addTierBonus(bonus.id))}
                                      disabled={!isSelected && !canSelect}
                                      style={{
                                        padding: '0.5rem',
                                        background: isSelected ? 'rgba(200, 100, 255, 0.15)' : 'rgba(0, 20, 40, 0.5)',
                                        border: `1px solid ${isSelected ? '#c8f' : 'var(--glass-border)'}`,
                                        borderRadius: '4px',
                                        color: isSelected ? '#c8f' : '#aaa',
                                        textAlign: 'left',
                                        cursor: (isSelected || canSelect) ? 'pointer' : 'not-allowed',
                                        fontSize: '0.75rem',
                                        opacity: (!isSelected && !canSelect) ? 0.4 : 1
                                      }}
                                    >
                                      {bonus.name} {isSelected && '✓'}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div style={{ color: '#666', fontSize: '0.75rem', padding: '0.5rem' }}>
                                No advanced bonuses available. Create them in Ship Tiers tab.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Fuel & Engine */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#0af', marginBottom: '1rem', fontSize: '1rem' }}>⛽ Fuel & Engine</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ color: '#aaa', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>Min Fuel</label>
                        <input
                          type="number"
                          min="0"
                          value={editingShip.fuelCapacity?.min || 50}
                          onChange={(e) => setEditingShip({
                            ...editingShip,
                            fuelCapacity: { ...editingShip.fuelCapacity, min: parseInt(e.target.value) }
                          })}
                          style={{
                            width: '100%',
                            padding: '0.4rem',
                            background: 'rgba(0, 20, 40, 0.5)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.75rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ color: '#aaa', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>Max Fuel</label>
                        <input
                          type="number"
                          min="0"
                          value={editingShip.fuelCapacity?.max || 100}
                          onChange={(e) => setEditingShip({
                            ...editingShip,
                            fuelCapacity: { ...editingShip.fuelCapacity, max: parseInt(e.target.value) }
                          })}
                          style={{
                            width: '100%',
                            padding: '0.4rem',
                            background: 'rgba(0, 20, 40, 0.5)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '0.75rem'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>Engine</label>
                      <select
                        value={editingShip.engine || ''}
                        onChange={(e) => setEditingShip({ ...editingShip, engine: e.target.value || null })}
                        style={{
                          width: '100%',
                          padding: '0.4rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: `1px solid ${editingShip.engine ? '#0f8' : 'var(--glass-border)'}`,
                          borderRadius: '4px',
                          color: editingShip.engine ? '#0f8' : '#fff',
                          fontSize: '0.75rem'
                        }}
                      >
                        <option value="">-- No Engine --</option>
                        {lootItems.filter(item => item.category === 'equipment' && item.subcategory === 'engine').map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} (T{item.tier})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Weapon Slots */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#f55', marginBottom: '1rem', fontSize: '1rem' }}>⚔️ Weapons ({Object.keys(editingShip.weaponSlots || {}).length})</h3>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {Object.entries(editingShip.weaponSlots || {}).map(([slotId, itemId]) => {
                      const equippedItem = lootItems.find(i => i.id === itemId);
                      return (
                        <div key={slotId}>
                          <label style={{ color: '#aaa', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>
                            {slotId.replace('_', ' ').toUpperCase()}
                          </label>
                          <select
                            value={itemId || ''}
                            onChange={(e) => setEditingShip({
                              ...editingShip,
                              weaponSlots: { ...editingShip.weaponSlots, [slotId]: e.target.value || null }
                            })}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              background: 'rgba(0, 20, 40, 0.5)',
                              border: `1px solid ${itemId ? '#0f8' : 'var(--glass-border)'}`,
                              borderRadius: '4px',
                              color: itemId ? '#0f8' : '#fff',
                              fontSize: '0.75rem'
                            }}
                          >
                            <option value="">-- Empty --</option>
                            {lootItems.filter(item => item.category === 'weapon').map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.subcategory} · T{item.tier})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subsystem Slots */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#0f8', marginBottom: '1rem', fontSize: '1rem' }}>🔧 Subsystems ({Object.keys(editingShip.subsystemSlots || {}).length})</h3>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {Object.entries(editingShip.subsystemSlots || {}).map(([slotId, itemId]) => {
                      const equippedItem = lootItems.find(i => i.id === itemId);
                      return (
                        <div key={slotId}>
                          <label style={{ color: '#aaa', fontSize: '0.7rem', display: 'block', marginBottom: '0.3rem' }}>
                            {slotId.replace('_', ' ').toUpperCase()}
                          </label>
                          <select
                            value={itemId || ''}
                            onChange={(e) => setEditingShip({
                              ...editingShip,
                              subsystemSlots: { ...editingShip.subsystemSlots, [slotId]: e.target.value || null }
                            })}
                            style={{
                              width: '100%',
                              padding: '0.4rem',
                              background: 'rgba(0, 20, 40, 0.5)',
                              border: `1px solid ${itemId ? '#0f8' : 'var(--glass-border)'}`,
                              borderRadius: '4px',
                              color: itemId ? '#0f8' : '#fff',
                              fontSize: '0.75rem'
                            }}
                          >
                            <option value="">-- Empty --</option>
                            {lootItems.filter(item => item.category === 'subsystem').map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.subcategory} · T{item.tier})
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setEditingShip(null)}
                className="glass-button"
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(100, 100, 100, 0.1)',
                  border: '2px solid #666',
                  borderRadius: '6px',
                  color: '#aaa'
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveShip}
                className="glass-button"
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(0, 255, 255, 0.1)',
                  border: '2px solid var(--neon-cyan)',
                  borderRadius: '6px',
                  color: 'var(--neon-cyan)'
                }}
              >
                Save Ship
              </button>
            </div>
          </div>
        </div>
      )}
      </> 
      )}
    </div>
  );
}
