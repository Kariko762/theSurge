import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, LoadingIcon, AddIcon, DeleteIcon, EditIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

const FACTION_TYPES = ['human_faction', 'alien_species', 'machine', 'hybrid', 'unknown'];
const SPECIES_TYPES = ['human', 'varrkel', 'threxul', 'kaelorii', 'drogan', 'orrix', 'rhal', 'solun', 'precursor', 'autonomous_machine', 'sythari', 'xal_reef', 'other'];
const FACTION_STANCES = ['allied', 'friendly', 'neutral', 'suspicious', 'hostile', 'war'];

export default function FactionsManager() {
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingFaction, setEditingFaction] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStance, setFilterStance] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFactions();
  }, []);

  const loadFactions = async () => {
    try {
      setLoading(true);
      const factions = await api.factions.getAll();
      setFactions(factions || []);
      setError('');
    } catch (err) {
      setError('Failed to load factions');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // Save each faction individually
      for (const faction of factions) {
        const existing = await api.factions.getAll();
        const exists = existing.some(f => f.id === faction.id);
        
        if (exists) {
          await api.factions.update(faction.id, faction);
        } else {
          await api.factions.create(faction);
        }
      }
      
      setSuccessMessage('Factions saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save factions');
    } finally {
      setSaving(false);
    }
  };

  const createNewFaction = () => {
    const newFaction = {
      id: `faction_${Date.now()}`,
      name: 'New Faction',
      type: 'human_faction',
      species: 'human',
      status: 'scattered',
      stance: 'neutral',
      description: '',
      homeworld: '',
      leader: '',
      founded: '',
      baseReputation: 0,
      relationshipsWith: {}, // { factionId: honorValue (-100 to +100) }
      traits: [],
      colors: {
        primary: '#0cf',
        secondary: '#08a'
      },
      flags: {
        isPlayable: false,
        isHostile: false,
        canTrade: true,
        canAlly: true,
        appearsInEvents: true,
        ownsShips: true
      },
      lore: {
        history: '',
        culture: '',
        goals: '',
        notes: ''
      },
      portrait: '' // Path to faction portrait image
    };
    setEditingFaction(newFaction);
  };

  const saveFaction = () => {
    if (editingFaction) {
      const index = factions.findIndex(f => f.id === editingFaction.id);
      if (index >= 0) {
        const updated = [...factions];
        updated[index] = editingFaction;
        setFactions(updated);
      } else {
        setFactions([...factions, editingFaction]);
      }
      setEditingFaction(null);
      setSuccessMessage('Faction updated');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const deleteFaction = (id) => {
    if (confirm('Delete this faction? This will also remove all relationship references.')) {
      // Remove faction and clean up relationships
      const updatedFactions = factions.filter(f => f.id !== id).map(f => ({
        ...f,
        relationshipsWith: Object.fromEntries(
          Object.entries(f.relationshipsWith || {}).filter(([fId]) => fId !== id)
        )
      }));
      setFactions(updatedFactions);
      setSuccessMessage('Faction deleted');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const getStanceColor = (stance) => {
    const colors = {
      allied: '#0f8',
      friendly: '#0cf',
      neutral: '#aaa',
      suspicious: '#fa0',
      hostile: '#f66',
      war: '#c00'
    };
    return colors[stance] || '#888';
  };

  const getStanceLabel = (stance) => {
    return stance.charAt(0).toUpperCase() + stance.slice(1);
  };

  const getTypeLabel = (type) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const getSpeciesLabel = (species) => {
    const labels = {
      varrkel: "Varr'Kel",
      threxul: 'Threxul',
      kaelorii: "Kae'Lorii",
      drogan: 'Drogan Clans',
      orrix: 'Orrix',
      rhal: 'Rhal Consortium',
      solun: 'Solun Fragments',
      precursor: 'Precursor Phantoms',
      autonomous_machine: 'Autonomous Machines',
      sythari: 'Sythari',
      xal_reef: 'Xal Reefs',
      other: 'Unknown'
    };
    return labels[species] || species.charAt(0).toUpperCase() + species.slice(1);
  };

  const getAlignmentLabel = (stance) => {
    if (!stance || typeof stance !== 'string') return 'Unknown';
    return stance.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredFactions = factions.filter(faction => {
    const matchesType = filterType === 'all' || faction.type === filterType;
    const matchesStance = filterStance === 'all' || faction.stance === filterStance;
    const matchesSearch = !searchTerm || 
      faction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faction.species?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesStance && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <LoadingIcon size={48} />
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.3rem' }}>Factions & Relationships</h2>
          <p style={{ color: '#888', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Manage races, organizations, and inter-faction relationships
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {error && <span style={{ color: '#f66', fontSize: '0.85rem' }}>{error}</span>}
          {successMessage && <span style={{ color: '#0f8', fontSize: '0.85rem' }}>{successMessage}</span>}
          <button
            className="btn-neon"
            onClick={createNewFaction}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <AddIcon size={18} /> New Faction
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
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
          <div>
            <input
              type="text"
              placeholder="Search factions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.4rem 0.75rem',
                background: 'rgba(0, 20, 40, 0.5)',
                border: '1px solid var(--glass-border)',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '0.8rem'
              }}
            />
          </div>

          <div>
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
              {FACTION_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStance}
              onChange={(e) => setFilterStance(e.target.value)}
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
              <option value="all">All Stances</option>
              {FACTION_STANCES.map(stance => (
                <option key={stance} value={stance}>
                  {getStanceLabel(stance)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ color: '#888', fontSize: '0.75rem' }}>
            {filteredFactions.length} faction{filteredFactions.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Factions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1rem' }}>
        {filteredFactions.map(faction => (
          <div key={faction.id} className="glass-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ color: faction.colors?.primary || '#0cf', margin: 0, fontSize: '1.1rem' }}>
                  {faction.iconEmoji && <span style={{ marginRight: '0.5rem' }}>{faction.iconEmoji}</span>}
                  {faction.name}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    background: 'rgba(0, 200, 255, 0.1)',
                    border: '1px solid #0cf',
                    borderRadius: '3px',
                    color: '#0cf',
                    fontSize: '0.7rem',
                    textTransform: 'capitalize'
                  }}>
                    {getTypeLabel(faction.type)}
                  </span>
                  {faction.species && (
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      background: 'rgba(100, 200, 255, 0.1)',
                      border: '1px solid #4af',
                      borderRadius: '3px',
                      color: '#4af',
                      fontSize: '0.7rem'
                    }}>
                      {getSpeciesLabel(faction.species)}
                    </span>
                  )}
                  <span style={{
                    padding: '0.15rem 0.5rem',
                    background: `${getStanceColor(faction.stance)}15`,
                    border: `1px solid ${getStanceColor(faction.stance)}`,
                    borderRadius: '3px',
                    color: getStanceColor(faction.stance),
                    fontSize: '0.7rem'
                  }}>
                    {getStanceLabel(faction.stance)}
                  </span>
                  {faction.flags?.isHostile && (
                    <span style={{
                      padding: '0.15rem 0.5rem',
                      background: 'rgba(255, 100, 100, 0.1)',
                      border: '1px solid #f66',
                      borderRadius: '3px',
                      color: '#f66',
                      fontSize: '0.7rem'
                    }}>
                      HOSTILE
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setEditingFaction({ ...faction })}
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
                  onClick={() => deleteFaction(faction.id)}
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
              {faction.description || 'No description'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
              {faction.leader && (
                <div>
                  <span style={{ color: '#888' }}>Leader:</span>
                  <span style={{ color: '#fff', marginLeft: '0.25rem' }}>{faction.leader}</span>
                </div>
              )}
              {faction.homeworld && (
                <div>
                  <span style={{ color: '#888' }}>Homeworld:</span>
                  <span style={{ color: '#fff', marginLeft: '0.25rem' }}>{faction.homeworld}</span>
                </div>
              )}
              <div>
                <span style={{ color: '#888' }}>Base Rep:</span>
                <span style={{ 
                  color: faction.baseReputation >= 0 ? '#0f8' : '#f66',
                  marginLeft: '0.25rem' 
                }}>
                  {faction.baseReputation >= 0 ? '+' : ''}{faction.baseReputation}
                </span>
              </div>
              {faction.founded && (
                <div>
                  <span style={{ color: '#888' }}>Founded:</span>
                  <span style={{ color: '#fff', marginLeft: '0.25rem' }}>{faction.founded}</span>
                </div>
              )}
            </div>

            {Object.keys(faction.relationshipsWith || {}).length > 0 && (
              <div style={{ 
                borderTop: '1px solid rgba(255,255,255,0.1)', 
                paddingTop: '0.5rem',
                marginTop: '0.5rem'
              }}>
                <div style={{ color: '#888', fontSize: '0.7rem', marginBottom: '0.35rem' }}>
                  Relationships:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {Object.entries(faction.relationshipsWith).map(([factionId, honor]) => {
                    const relatedFaction = factions.find(f => f.id === factionId);
                    if (!relatedFaction) return null;
                    return (
                      <div key={factionId} style={{
                        padding: '0.25rem 0.5rem',
                        background: 'rgba(0, 20, 40, 0.5)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '3px',
                        fontSize: '0.7rem'
                      }}>
                        <span style={{ color: '#aaa' }}>{relatedFaction.name}:</span>
                        <span style={{ 
                          color: honor >= 50 ? '#0f8' : honor >= 0 ? '#fa0' : '#f66',
                          marginLeft: '0.25rem',
                          fontWeight: 'bold'
                        }}>
                          {honor >= 0 ? '+' : ''}{honor}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredFactions.length === 0 && (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            {searchTerm || filterType !== 'all' || filterStance !== 'all' ? 'No factions match your filters' : 'No factions configured'}
          </p>
        </div>
      )}

      {/* Edit Modal */}
      {editingFaction && (
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
              {factions.find(f => f.id === editingFaction.id) ? 'Edit Faction' : 'Create New Faction'}
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
                        value={editingFaction.name}
                        onChange={(e) => setEditingFaction({ ...editingFaction, name: e.target.value })}
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
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Type</label>
                        <select
                          value={editingFaction.type}
                          onChange={(e) => setEditingFaction({ ...editingFaction, type: e.target.value })}
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
                          {FACTION_TYPES.map(type => (
                            <option key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Stance</label>
                        <select
                          value={editingFaction.stance}
                          onChange={(e) => setEditingFaction({ ...editingFaction, stance: e.target.value })}
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
                          <option value="hostile">Hostile</option>
                          <option value="suspicious">Suspicious</option>
                          <option value="neutral">Neutral</option>
                          <option value="friendly">Friendly</option>
                          <option value="allied">Allied</option>
                          <option value="war">War</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Description</label>
                      <textarea
                        value={editingFaction.description}
                        onChange={(e) => setEditingFaction({ ...editingFaction, description: e.target.value })}
                        rows={3}
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

                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Traits (comma-separated)</label>
                      <input
                        type="text"
                        value={(editingFaction.traits || []).join(', ')}
                        onChange={(e) => {
                          const traitsArray = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                          setEditingFaction({ ...editingFaction, traits: traitsArray });
                        }}
                        placeholder="e.g., militaristic, bureaucratic, lawful"
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
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Leader</label>
                        <input
                          type="text"
                          value={editingFaction.leader}
                          onChange={(e) => setEditingFaction({ ...editingFaction, leader: e.target.value })}
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
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Homeworld</label>
                        <input
                          type="text"
                          value={editingFaction.homeworld}
                          onChange={(e) => setEditingFaction({ ...editingFaction, homeworld: e.target.value })}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Founded</label>
                        <input
                          type="text"
                          value={editingFaction.founded}
                          onChange={(e) => setEditingFaction({ ...editingFaction, founded: e.target.value })}
                          placeholder="e.g., 2287 CE"
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
                        <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Base Reputation</label>
                        <input
                          type="number"
                          value={editingFaction.baseReputation}
                          onChange={(e) => setEditingFaction({ ...editingFaction, baseReputation: parseInt(e.target.value) || 0 })}
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
                  </div>
                </div>

                {/* Portrait */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Portrait</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {editingFaction.portrait && (
                      <div style={{ textAlign: 'center' }}>
                        <img 
                          src={editingFaction.portrait} 
                          alt="Faction Portrait"
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '200px',
                            border: '2px solid var(--neon-cyan)',
                            borderRadius: '8px',
                            background: 'rgba(0,0,0,0.5)'
                          }} 
                        />
                      </div>
                    )}
                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>
                        Portrait Image Path
                      </label>
                      <input
                        type="text"
                        value={editingFaction.portrait || ''}
                        onChange={(e) => setEditingFaction({ ...editingFaction, portrait: e.target.value })}
                        placeholder={`/src/assets/factions/${editingFaction.id}/portrait.png`}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.75rem'
                        }}
                      />
                      <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                        💡 Place images in: <code style={{ color: '#0cf' }}>src/assets/factions/{editingFaction.id}/</code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flags */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Faction Flags</h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editingFaction.flags?.isPlayable || false}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          flags: { ...editingFaction.flags, isPlayable: e.target.checked }
                        })}
                      />
                      Playable (Player can join)
                    </label>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editingFaction.flags?.isHostile || false}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          flags: { ...editingFaction.flags, isHostile: e.target.checked }
                        })}
                      />
                      Hostile by default
                    </label>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editingFaction.flags?.canTrade || false}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          flags: { ...editingFaction.flags, canTrade: e.target.checked }
                        })}
                      />
                      Can trade with
                    </label>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={editingFaction.flags?.canAlly || false}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          flags: { ...editingFaction.flags, canAlly: e.target.checked }
                        })}
                      />
                      Can form alliances
                    </label>
                  </div>
                </div>

                {/* Colors */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>Faction Colors</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Primary</label>
                      <input
                        type="color"
                        value={editingFaction.colors?.primary || '#0cf'}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          colors: { ...editingFaction.colors, primary: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          height: '40px',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Secondary</label>
                      <input
                        type="color"
                        value={editingFaction.colors?.secondary || '#08a'}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          colors: { ...editingFaction.colors, secondary: e.target.value }
                        })}
                        style={{
                          width: '100%',
                          height: '40px',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Relationships */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fa0', marginBottom: '1rem', fontSize: '1rem' }}>🤝 Faction Relationships</h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {factions.filter(f => f.id !== editingFaction.id).map(faction => {
                      const currentHonor = editingFaction.relationshipsWith?.[faction.id] ?? null;
                      return (
                        <div key={faction.id} style={{
                          padding: '0.75rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div>
                              <div style={{ color: faction.colors?.primary || '#0cf', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                {faction.name}
                              </div>
                              <div style={{ color: '#888', fontSize: '0.7rem' }}>
                                {faction.type} • {getAlignmentLabel(faction.stance)}
                              </div>
                            </div>
                            {currentHonor !== null && (
                              <button
                                onClick={() => {
                                  const { [faction.id]: removed, ...rest } = editingFaction.relationshipsWith;
                                  setEditingFaction({
                                    ...editingFaction,
                                    relationshipsWith: rest
                                  });
                                }}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  background: 'rgba(255, 100, 100, 0.1)',
                                  border: '1px solid #f66',
                                  borderRadius: '3px',
                                  color: '#f66',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem'
                                }}
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="range"
                              min="-100"
                              max="100"
                              value={currentHonor ?? 0}
                              onChange={(e) => setEditingFaction({
                                ...editingFaction,
                                relationshipsWith: {
                                  ...editingFaction.relationshipsWith,
                                  [faction.id]: parseInt(e.target.value)
                                }
                              })}
                              style={{
                                width: '100%',
                                accentColor: currentHonor >= 50 ? '#0f8' : currentHonor >= 0 ? '#fa0' : '#f66'
                              }}
                            />
                            <div style={{
                              color: currentHonor >= 50 ? '#0f8' : currentHonor >= 0 ? '#fa0' : '#f66',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              minWidth: '50px',
                              textAlign: 'right'
                            }}>
                              {currentHonor >= 0 ? '+' : ''}{currentHonor ?? 0}
                            </div>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.65rem', color: '#666' }}>
                            <span>Hostile</span>
                            <span>Neutral</span>
                            <span>Allied</span>
                          </div>
                        </div>
                      );
                    })}
                    {factions.filter(f => f.id !== editingFaction.id).length === 0 && (
                      <div style={{ color: '#666', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
                        Create other factions to set up relationships
                      </div>
                    )}
                  </div>
                </div>

                {/* Lore */}
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
                  <h3 style={{ color: '#fff', marginBottom: '1rem', fontSize: '1rem' }}>📜 Lore & Background</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>History</label>
                      <textarea
                        value={editingFaction.lore?.history || ''}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          lore: { ...editingFaction.lore, history: e.target.value }
                        })}
                        rows={3}
                        placeholder="Faction's historical background..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          resize: 'vertical',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Culture</label>
                      <textarea
                        value={editingFaction.lore?.culture || ''}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          lore: { ...editingFaction.lore, culture: e.target.value }
                        })}
                        rows={3}
                        placeholder="Cultural traits and beliefs..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          resize: 'vertical',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ color: '#aaa', fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Goals</label>
                      <textarea
                        value={editingFaction.lore?.goals || ''}
                        onChange={(e) => setEditingFaction({
                          ...editingFaction,
                          lore: { ...editingFaction.lore, goals: e.target.value }
                        })}
                        rows={2}
                        placeholder="Faction's objectives and ambitions..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          background: 'rgba(0, 20, 40, 0.5)',
                          border: '1px solid var(--glass-border)',
                          borderRadius: '4px',
                          color: '#fff',
                          resize: 'vertical',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                onClick={() => setEditingFaction(null)}
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
                onClick={saveFaction}
                className="glass-button"
                style={{
                  padding: '0.6rem 1.2rem',
                  background: 'rgba(0, 255, 255, 0.1)',
                  border: '2px solid var(--neon-cyan)',
                  borderRadius: '6px',
                  color: 'var(--neon-cyan)'
                }}
              >
                Save Faction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
