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
      const ships = await api.ships.getAll();
      setShips(ships || []);
      setError('');
    } catch (err) {
      setError('Failed to load ships');
    } finally {
      setLoading(false);
    }
  };

  const loadLootItems = async () => {
    try {
      const items = await api.items.getAll();
      setLootItems(items || []);
    } catch (err) {
      console.error('Failed to load loot items:', err);
    }
  };

  const loadAICrew = async () => {
    try {
      const aiCrew = await api.aiCores.getAll();
      setAiCrew(aiCrew || {});
    } catch (err) {
      console.error('Failed to load AI crew:', err);
    }
  };

  const loadShipTierBonuses = async () => {
    try {
      const tierBonuses = await api.shipTiers.getAll();
      setShipTierBonuses(tierBonuses || []);
    } catch (err) {
      console.error('Failed to load ship tier bonuses:', err);
    }
  };

  const loadFactions = async () => {
    try {
      const factions = await api.factions.getAll();
      setFactions(factions || []);
    } catch (err) {
      console.error('Failed to load factions:', err);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // Save each ship individually (use update if exists, create if new)
      for (const ship of ships) {
        const existingShips = await api.ships.getAll();
        const exists = existingShips.some(s => s.id === ship.id);
        
        if (exists) {
          await api.ships.update(ship.id, ship);
        } else {
          await api.ships.create(ship);
        }
      }
      
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
      {/* Messages */}
      {successMessage && (
        <div className="theme-success" style={{ marginBottom: '1rem' }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="theme-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="theme-container" style={{ padding: '0.75rem 1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search ships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="theme-input"
              style={{ fontSize: '0.85rem', padding: '0.5rem' }}
            />
          </div>
          <div>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="theme-input"
              style={{ fontSize: '0.85rem', padding: '0.5rem' }}
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
          <div style={{ color: '#aaa', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
            {filteredShips.length} ship{filteredShips.length !== 1 ? 's' : ''}
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowClassPicker(!showClassPicker)} className="theme-button" style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AddIcon size={14} />
              New Ship
            </button>
            {showClassPicker && (
              <div className="glass-card" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
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
          <button onClick={handleSave} disabled={saving} className="theme-button" style={{
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <SaveIcon size={14} />
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Ships Table */}
      <div style={{
        background: 'linear-gradient(var(--theme-gradient-angle), var(--theme-gradient-start), var(--theme-gradient-end))',
        border: '1px solid rgba(0, 255, 255, 0.15)',
        borderRadius: '8px',
        overflow: 'hidden',
        padding: '1rem'
      }}>
        <table className="theme-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Tier</th>
              <th>Manufacturer</th>
              <th>Hull</th>
              <th>Shields</th>
              <th>Power</th>
              <th>Cargo</th>
              <th>Weapons</th>
              <th>Subsystems</th>
              <th>Cost</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
          {filteredShips.map(ship => (
            <tr key={ship.id}>
              <td>{ship.name}</td>
              <td><span className="theme-badge">{ship.class}</span></td>
              <td><span className="theme-tag">T{ship.tier}</span></td>
              <td>{ship.manufacturer}</td>
              <td>{ship.baseStats.hull}</td>
              <td>{ship.baseStats.shields}</td>
              <td>{ship.baseStats.power}</td>
              <td>{ship.baseStats.cargo}</td>
              <td>{Object.keys(ship.weaponSlots || {}).length}</td>
              <td>{Object.keys(ship.subsystemSlots || {}).length}</td>
              <td>{ship.cost?.toLocaleString()} cr</td>
              <td>
                {ship.enabled ? (
                  <span className="theme-badge">ENABLED</span>
                ) : (
                  <span className="theme-badge" style={{
                    background: 'rgba(100, 100, 100, 0.1)',
                    borderColor: '#666',
                    color: '#666'
                  }}>DISABLED</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setEditingShip({ ...ship })}
                    className="theme-button"
                    style={{ padding: '0.4rem 0.6rem' }}
                  >
                    <EditIcon size={14} />
                  </button>
                  <button
                    onClick={() => deleteShip(ship.id)}
                    className="theme-button"
                    style={{ 
                      padding: '0.4rem 0.6rem',
                      background: 'rgba(255, 100, 100, 0.1)',
                      borderColor: '#f66',
                      color: '#f66'
                    }}
                  >
                    <DeleteIcon size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {filteredShips.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            {searchTerm || filterClass !== 'all' ? 'No ships match your filters' : 'No ships configured'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingShip && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div className="theme-card" style={{
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '1rem'
          }}>
            <h2 className="theme-subtitle" style={{ marginBottom: '1rem' }}>
              {ships.find(s => s.id === editingShip.id) ? 'Edit Ship' : 'Create New Ship'}
            </h2>

            {/* Two-Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* LEFT COLUMN */}
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Basic Info */}
                <div className="theme-container" style={{ padding: '1rem' }}>
                  <h3 className="theme-subtitle" style={{ marginBottom: '1rem' }}>Basic Information</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Name</label>
                      <input
                        type="text"
                        value={editingShip.name}
                        onChange={(e) => setEditingShip({ ...editingShip, name: e.target.value })}
                        className="theme-input"
                      />
                    </div>

                    <div>
                      <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Manufacturer</label>
                      <input
                        type="text"
                        value={editingShip.manufacturer}
                        onChange={(e) => setEditingShip({ ...editingShip, manufacturer: e.target.value })}
                        className="theme-input"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Class</label>
                        <select
                          value={editingShip.class}
                          onChange={(e) => handleClassChange(e.target.value)}
                          className="theme-input"
                        >
                          {Object.entries(SHIP_CLASSES).map(([key, cfg]) => (
                            <option key={key} value={key}>
                              {key.charAt(0).toUpperCase() + key.slice(1)} ({cfg.weapons}W/{cfg.subsystems}S)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Tier</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={editingShip.tier}
                          onChange={(e) => setEditingShip({ ...editingShip, tier: parseInt(e.target.value) })}
                          className="theme-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Description</label>
                      <textarea
                        value={editingShip.description}
                        onChange={(e) => setEditingShip({ ...editingShip, description: e.target.value })}
                        rows={2}
                        className="theme-input"
                        style={{ resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Level Req.</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={editingShip.playerLevelRequired || 1}
                          onChange={(e) => setEditingShip({ ...editingShip, playerLevelRequired: parseInt(e.target.value) })}
                          className="theme-input"
                        />
                      </div>

                      <div>
                        <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Cost</label>
                        <input
                          type="number"
                          value={editingShip.cost}
                          onChange={(e) => setEditingShip({ ...editingShip, cost: parseInt(e.target.value) })}
                          className="theme-input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="theme-body" style={{ display: 'block', marginBottom: '0.5rem' }}>Faction</label>
                      <select
                        value={editingShip.faction || ''}
                        onChange={(e) => setEditingShip({ ...editingShip, faction: e.target.value || null })}
                        className="theme-input"
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
                <div className="theme-container" style={{ padding: '1rem' }}>
                  <h3 className="theme-subtitle" style={{ marginBottom: '1rem' }}>Base Stats</h3>
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
                <div className="theme-container" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="theme-subtitle" style={{ margin: 0 }}>🤖 AI Cores ({editingShip.aiCoreSlots || 2})</h3>
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
                      const assignedCrew = aiCrew[crewId];
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
                            {Object.values(aiCrew).map(crew => (
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
                <div className="theme-container" style={{ padding: '1rem' }}>
                  <h3 className="theme-subtitle" style={{ marginBottom: '0.5rem' }}>⭐ Tier Bonuses</h3>
                  {(() => {
                    const allocation = getTierBonusAllocation(editingShip.tier);
                    const selectedBonuses = editingShip.tierBonuses || [];
                    const selectedStandard = selectedBonuses.filter(id => 
                      shipTierBonuses.find(b => b.id === id && b.type === 'standard')
                    );
                    const selectedAdvanced = selectedBonuses.filter(id =>
                      shipTierBonuses.find(b => b.id === id && b.type === 'advanced')
                    );

                    const allAvailableBonuses = shipTierBonuses.filter(b => b.tier <= editingShip.tier);

                    return (
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#888' }}>
                          Tier {editingShip.tier}: {allocation.standard} Standard + {allocation.advanced} Advanced
                          <span style={{ marginLeft: '0.5rem', color: '#0cf' }}>
                            ({selectedStandard.length}/{allocation.standard} Standard, {selectedAdvanced.length}/{allocation.advanced} Advanced)
                          </span>
                        </div>

                        {allAvailableBonuses.length > 0 ? (
                          <table className="theme-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Bonuses</th>
                                <th>Type</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allAvailableBonuses.map(bonus => {
                                const isSelected = selectedBonuses.includes(bonus.id);
                                const isStandard = bonus.type === 'standard';
                                const canActivate = !isSelected && (
                                  (isStandard && selectedStandard.length < allocation.standard) ||
                                  (!isStandard && selectedAdvanced.length < allocation.advanced)
                                );

                                // Extract bonuses from standardEffects and advancedEffects
                                const standardBonuses = bonus.standardEffects ? 
                                  Object.entries(bonus.standardEffects)
                                    .filter(([key, val]) => val && val !== 0)
                                    .map(([key, val]) => {
                                      const unit = (key.includes('Chance') || key.includes('Reduction') || key.includes('Efficiency') || key.includes('Rate') || key.includes('Bonus')) ? '%' : '';
                                      return `${val > 0 ? '+' : ''}${val}${unit} ${key}`;
                                    }) : [];
                                
                                const advancedBonuses = bonus.advancedEffects ? 
                                  Object.entries(bonus.advancedEffects)
                                    .filter(([key, val]) => val && val !== 0)
                                    .map(([key, val]) => {
                                      const unit = (key.includes('Chance') || key.includes('Reduction') || key.includes('Efficiency') || key.includes('Rate') || key.includes('Bonus')) ? '%' : '';
                                      return `${val > 0 ? '+' : ''}${val}${unit} ${key}`;
                                    }) : [];
                                
                                const allBonuses = [...standardBonuses, ...advancedBonuses];
                                const bonusText = allBonuses.length > 0 ? allBonuses.join(', ') : '';

                                return (
                                  <tr key={bonus.id} style={{ opacity: (!isSelected && !canActivate) ? 0.4 : 1 }}>
                                    <td>{bonus.name}</td>
                                    <td style={{ fontSize: '0.75rem', color: bonusText ? 'inherit' : '#666' }}>
                                      {bonusText || '—'}
                                    </td>
                                    <td>
                                      <span className="theme-badge" style={{
                                        background: isStandard ? 'rgba(0, 200, 255, 0.1)' : 'rgba(200, 100, 255, 0.1)',
                                        borderColor: isStandard ? '#0cf' : '#c8f',
                                        color: isStandard ? '#0cf' : '#c8f'
                                      }}>
                                        {bonus.type}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      {isSelected ? (
                                        <button
                                          onClick={() => removeTierBonus(bonus.id)}
                                          className="theme-button"
                                          style={{ 
                                            padding: '0.3rem 0.5rem',
                                            fontSize: '0.7rem',
                                            background: 'rgba(255, 100, 100, 0.1)',
                                            borderColor: '#f66',
                                            color: '#f66'
                                          }}
                                        >
                                          Disable
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => canActivate && addTierBonus(bonus.id)}
                                          disabled={!canActivate}
                                          className="theme-button"
                                          style={{ 
                                            padding: '0.3rem 0.5rem',
                                            fontSize: '0.7rem',
                                            opacity: canActivate ? 1 : 0.3,
                                            cursor: canActivate ? 'pointer' : 'not-allowed'
                                          }}
                                        >
                                          Activate
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ color: '#666', fontSize: '0.75rem', padding: '0.5rem' }}>
                            No tier bonuses available. Create them in Ship Tiers tab.
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
                <div className="theme-container" style={{ padding: '1rem' }}>
                  <h3 className="theme-subtitle" style={{ marginBottom: '1rem' }}>⛽ Fuel & Engine</h3>
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
                <div className="theme-container" style={{ padding: '1rem' }}>
                  <h3 className="theme-subtitle" style={{ marginBottom: '1rem' }}>⚔️ Weapons ({Object.keys(editingShip.weaponSlots || {}).length})</h3>
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
                <div className="theme-container" style={{ padding: '1rem' }}>
                  <h3 className="theme-subtitle" style={{ marginBottom: '1rem' }}>🔧 Subsystems ({Object.keys(editingShip.subsystemSlots || {}).length})</h3>
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
