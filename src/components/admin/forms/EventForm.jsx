import { useState, useEffect } from 'react';
import api from '../../../lib/api/client';
import { SaveIcon, LoadingIcon, WarningIcon, CreateIcon, EditIcon, DeleteIcon, InfoIcon } from '../HoloIcons';
import BranchEditor from './BranchEditor';
import '../../../styles/AdminGlass.css';

export default function EventForm({ event, config, factions = [], onSave, onCancel }) {
  const [pois, setPOIs] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    metadata: {
      tags: [],
      enabled: true
    },
    trigger: {
      type: 'poi_action',
      weight: 1,
      conditions: {}
    },
    scenario: {
      title: '',
      description: '',
      location: '',
      systemMessage: ''
    },
    involvedFactions: [],
    branches: [
      {
        id: 'default',
        label: 'Continue',
        challenge: null,
        outcomes: []
      }
    ]
  });

  const [activeTab, setActiveTab] = useState('metadata');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingBranchIndex, setEditingBranchIndex] = useState(null);
  const [activeHelp, setActiveHelp] = useState(null);
  const [showBranchEditor, setShowBranchEditor] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        involvedFactions: event.involvedFactions || []
      });
    }
  }, [event]);

  // Load POIs from POI Library
  useEffect(() => {
    const storedPOIs = localStorage.getItem('poi_library');
    if (storedPOIs) {
      try {
        setPOIs(JSON.parse(storedPOIs));
      } catch (err) {
        console.error('Failed to load POI library:', err);
      }
    }
  }, []);

  const handleChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleArrayChange = (path, index, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      const arr = [...current[keys[keys.length - 1]]];
      arr[index] = value;
      current[keys[keys.length - 1]] = arr;
      return newData;
    });
  };

  const addTag = (tag) => {
    if (tag && !formData.metadata.tags.includes(tag)) {
      handleChange('metadata.tags', [...formData.metadata.tags, tag]);
    }
  };

  const removeTag = (tag) => {
    handleChange('metadata.tags', formData.metadata.tags.filter(t => t !== tag));
  };

  const openBranchEditor = (branch, index) => {
    setEditingBranch(branch);
    setEditingBranchIndex(index);
    setShowBranchEditor(true);
  };

  const saveBranch = (branchData) => {
    if (editingBranchIndex !== null) {
      // Edit existing branch
      const newBranches = [...formData.branches];
      newBranches[editingBranchIndex] = branchData;
      handleChange('branches', newBranches);
    } else {
      // Add new branch
      handleChange('branches', [...formData.branches, branchData]);
    }
    setEditingBranch(null);
    setEditingBranchIndex(null);
    setShowBranchEditor(false);
  };

  const deleteBranch = () => {
    if (editingBranchIndex !== null) {
      const newBranches = formData.branches.filter((_, i) => i !== editingBranchIndex);
      handleChange('branches', newBranches);
      setEditingBranch(null);
      setEditingBranchIndex(null);
      setShowBranchEditor(false);
    }
  };

  const removeBranchDirect = (index) => {
    if (confirm('Delete this branch?')) {
      const newBranches = formData.branches.filter((_, i) => i !== index);
      handleChange('branches', newBranches);
    }
  };

  const addSkill = (skill) => {
    if (skill && !formData.challenge.skills.includes(skill)) {
      handleChange('challenge.skills', [...formData.challenge.skills, skill]);
    }
  };

  const removeSkill = (skill) => {
    handleChange('challenge.skills', formData.challenge.skills.filter(s => s !== skill));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.id || formData.id.trim() === '') {
      newErrors.id = 'Event ID is required';
    }
    
    if (!formData.scenario.title || formData.scenario.title.trim() === '') {
      newErrors.title = 'Event title is required';
    }
    
    if (!formData.scenario.description || formData.scenario.description.trim() === '') {
      newErrors.description = 'Event description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    try {
      setSaving(true);
      
      if (event) {
        await api.events.update(event.id, formData);
      } else {
        await api.events.create(formData);
      }
      
      onSave();
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to save event' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'metadata', label: 'Metadata' },
    { id: 'trigger', label: 'Trigger' },
    { id: 'scenario', label: 'Scenario' },
    { id: 'branches', label: 'Branches' }
  ];

  const availableTags = ['mining', 'hazard', 'combat', 'exploration', 'social', 'trade', 'research', 'mystery'];
  const availableSkills = ['piloting', 'engineering', 'combat', 'negotiation', 'science', 'perception', 'luck'];
  const triggerTypes = ['poi_action', 'dynamic', 'mission', 'time_based', 'location_based'];
  const challengeModes = ['skillCheck', 'choice', 'combat', 'puzzle', 'none'];
  const difficulties = ['trivial', 'easy', 'medium', 'hard', 'extreme'];

  const helpContent = {
    metadata: {
      title: 'Event Metadata',
      sections: [
        {
          heading: 'Event ID',
          content: 'Unique identifier for this event. Use lowercase with underscores (e.g., asteroid_mining_01). Cannot be changed after creation.',
          impact: 'Referenced by game systems, telemetry tracking, and event chains. Must be unique across all events.'
        },
        {
          heading: 'Tags',
          content: 'Categorize events for filtering and discovery. Multiple tags allowed.',
          impact: 'Used by event scheduler for context-aware triggering. Events can be filtered by tags in admin panel and analytics.'
        },
        {
          heading: 'Enabled',
          content: 'Toggle whether this event can trigger in-game.',
          impact: 'Disabled events are ignored by the scheduler but remain in database. Use for testing or seasonal content.'
        }
      ]
    },
    trigger: {
      title: 'Trigger Configuration',
      sections: [
        {
          heading: 'Trigger Type',
          content: 'Defines when/how this event can fire:\n• poi_action: Player interacts with POI (mining, scanning, docking)\n  → Link to POIs via Conditions: {"poiType": "asteroid", "action": "mining"}\n• dynamic: Random encounters during gameplay\n• mission: Tied to mission progression\n• time_based: Triggers after time intervals\n• location_based: Fires when entering areas',
          impact: 'Determines the event scheduler behavior. POI actions are most common for emergent gameplay. Use Conditions field to specify WHICH POIs trigger this event.'
        },
        {
          heading: 'Weight',
          content: 'Relative probability of this event firing (0.1 - 10). Higher = more common.',
          impact: 'Weight 1.0 = baseline. Weight 0.1 = rare (10% chance), Weight 5.0 = very common (5x more likely). Weights are normalized against competing events.'
        },
        {
          heading: 'Conditions',
          content: 'JSON object defining requirements for trigger. For POI events, specify which POI types trigger this event:\n\nExamples:\n• {"poiType": "asteroid"} - Only asteroids\n• {"poiType": "station", "action": "dock"} - Stations when docking\n• {"location": "sector_7", "risk": "high"} - High-risk areas in sector 7\n• {"hasFlag": "discovered_artifact"} - Player has discovered artifact',
          impact: 'Event only fires if ALL conditions match. POI events use "poiType" (asteroid/station/derelict/anomaly) and "action" (mining/scanning/docking). Non-POI events can use location, resources, flags, player stats, etc.'
        }
      ]
    },
    scenario: {
      title: 'Scenario Presentation',
      sections: [
        {
          heading: 'Title',
          content: 'Eye-catching event name shown in terminal modal. Keep it punchy and descriptive.',
          impact: 'First thing players see. Sets tone and urgency. Good titles: "Unstable Asteroid Detected", "Derelict Distress Signal"'
        },
        {
          heading: 'Description',
          content: 'Rich narrative text setting the scene. 2-4 sentences. Create atmosphere and present the situation.',
          impact: 'Establishes context and immersion. Should hint at stakes and choices. This is your storytelling moment.'
        },
        {
          heading: 'Location',
          content: 'Where this is happening (e.g., "Asteroid Belt - Sector 7"). Adds context.',
          impact: 'Grounds the event in game world. Helps players orient themselves. Can be dynamically populated.'
        },
        {
          heading: 'System Message',
          content: 'Optional technical/AI message shown in terminal stream (cyan text).',
          impact: 'Used for ship AI commentary, sensor readings, or system alerts. Adds flavor without breaking narrative flow.'
        }
      ]
    }
  };

  const toggleHelp = (section) => {
    setActiveHelp(activeHelp === section ? null : section);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.8rem', textShadow: 'var(--glow-cyan)' }}>
          {event ? 'Edit Event' : 'Create New Event'}
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn-neon" 
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            style={{ fontSize: '0.85rem' }}
          >
            {showJsonPreview ? 'HIDE' : 'SHOW'} JSON
          </button>
          <button className="btn-neon" onClick={onCancel}>
            CANCEL
          </button>
          <button 
            className="btn-neon btn-neon-primary" 
            onClick={handleSubmit}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {saving ? <LoadingIcon size={18} /> : <SaveIcon size={20} />}
            {saving ? 'SAVING...' : 'SAVE EVENT'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errors.submit && (
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
          <span style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{errors.submit}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: showJsonPreview ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        {/* Form Section */}
        <div>
          {/* Tab Navigation */}
          <div className="tab-container" style={{ marginBottom: '2rem' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit}>
            {/* METADATA TAB */}
            {activeTab === 'metadata' && (
              <div style={{ display: 'grid', gridTemplateColumns: activeHelp === 'metadata' ? '2fr 1fr' : '1fr', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.2rem' }}>
                      Event Metadata
                    </h3>
                    <button
                      type="button"
                      className="btn-neon"
                      onClick={() => toggleHelp('metadata')}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        background: activeHelp === 'metadata' ? 'rgba(0, 255, 255, 0.2)' : 'transparent'
                      }}
                      title="Toggle help panel"
                    >
                      <InfoIcon size={18} />
                    </button>
                  </div>

                <div className="form-group">
                  <label>Event ID *</label>
                  <input
                    type="text"
                    className="input-neon"
                    value={formData.id}
                    onChange={(e) => handleChange('id', e.target.value)}
                    placeholder="unique_event_identifier"
                    disabled={!!event}
                  />
                  {errors.id && <span className="error-text">{errors.id}</span>}
                  <small style={{ color: '#666', fontSize: '0.8rem' }}>
                    Use lowercase with underscores (e.g., asteroid_mining_01)
                  </small>
                </div>

                <div className="form-group">
                  <label>Tags</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {formData.metadata.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="status-badge status-info" 
                        style={{ 
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onClick={() => removeTag(tag)}
                      >
                        {tag} <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
                      </span>
                    ))}
                  </div>
                  <select
                    className="input-neon"
                    onChange={(e) => {
                      addTag(e.target.value);
                      e.target.value = '';
                    }}
                  >
                    <option value="">+ Add Tag</option>
                    {availableTags.filter(t => !formData.metadata.tags.includes(t)).map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.metadata.enabled}
                      onChange={(e) => handleChange('metadata.enabled', e.target.checked)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <span>Event Enabled</span>
                  </label>
                  <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                    Disabled events will not trigger in-game
                  </small>
                </div>

                <div className="form-group">
                  <label>Involved Factions</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {formData.involvedFactions.map(factionId => {
                      const faction = factions.find(f => f.id === factionId);
                      if (!faction) return null;
                      return (
                        <span 
                          key={factionId}
                          className="status-badge"
                          style={{ 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: faction.colors?.primary || '#0cf',
                            color: '#000'
                          }}
                          onClick={() => handleChange('involvedFactions', formData.involvedFactions.filter(id => id !== factionId))}
                        >
                          {faction.iconEmoji} {faction.name} <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
                        </span>
                      );
                    })}
                  </div>
                  <select
                    className="input-neon"
                    onChange={(e) => {
                      const factionId = e.target.value;
                      if (factionId && !formData.involvedFactions.includes(factionId)) {
                        handleChange('involvedFactions', [...formData.involvedFactions, factionId]);
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">+ Add Faction</option>
                    {factions.filter(f => !formData.involvedFactions.includes(f.id)).map(faction => (
                      <option key={faction.id} value={faction.id}>
                        {faction.iconEmoji} {faction.name}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                    Which factions are involved in this event (affects encounter dynamics and honor changes)
                  </small>
                </div>
              </div>

              {/* Help Panel */}
              {activeHelp === 'metadata' && (
                <div className="glass-card" style={{
                  padding: '1.5rem',
                  background: 'rgba(0, 255, 255, 0.05)',
                  borderColor: 'rgba(0, 255, 255, 0.3)',
                  maxHeight: '80vh',
                  overflowY: 'auto'
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--neon-cyan)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <InfoIcon size={20} /> {helpContent.metadata.title}
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                      Step-by-step guide for configuring event metadata
                    </p>
                  </div>

                  {helpContent.metadata.sections.map((section, idx) => (
                    <div key={idx} style={{
                      marginBottom: '1.5rem',
                      paddingBottom: '1.5rem',
                      borderBottom: idx < helpContent.metadata.sections.length - 1 ? '1px solid rgba(0, 255, 255, 0.1)' : 'none'
                    }}>
                      <h5 style={{ color: '#0ff', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        {idx + 1}. {section.heading}
                      </h5>
                      <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                        {section.content}
                      </p>
                      <div style={{
                        background: 'rgba(255, 170, 0, 0.1)',
                        border: '1px solid rgba(255, 170, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '0.75rem',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{ color: '#ffaa00', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          💡 IMPACT
                        </div>
                        <div style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: '1.5' }}>
                          {section.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* TRIGGER TAB */}
            {activeTab === 'trigger' && (
              <div style={{ display: 'grid', gridTemplateColumns: activeHelp === 'trigger' ? '2fr 1fr' : '1fr', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.2rem' }}>
                      Trigger Configuration
                    </h3>
                    <button
                      type="button"
                      className="btn-neon"
                      onClick={() => toggleHelp('trigger')}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        background: activeHelp === 'trigger' ? 'rgba(0, 255, 255, 0.2)' : 'transparent'
                      }}
                      title="Toggle help panel"
                    >
                      <InfoIcon size={18} />
                    </button>
                  </div>

                <div className="form-group">
                  <label>Trigger Type *</label>
                  <select
                    className="input-neon"
                    value={formData.trigger.type}
                    onChange={(e) => handleChange('trigger.type', e.target.value)}
                  >
                    {triggerTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <small style={{ color: '#666', fontSize: '0.8rem' }}>
                    Determines how this event is triggered in-game
                  </small>
                </div>

                <div className="form-group">
                  <label>Weight: {formData.trigger.weight}</label>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={formData.trigger.weight}
                    onChange={(e) => handleChange('trigger.weight', parseFloat(e.target.value))}
                    className="slider-neon"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
                    <span>Rare (0.1)</span>
                    <span>Common (10)</span>
                  </div>
                  <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
                    Higher weights make events more likely to occur
                  </small>
                </div>

                {/* POI Action Conditions */}
                {formData.trigger.type === 'poi_action' && (
                  <>
                    <div className="form-group">
                      <label>POI Type</label>
                      <select
                        className="input-neon"
                        value={formData.trigger.conditions?.poiType || ''}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          poiType: e.target.value 
                        })}
                      >
                        <option value="">Any POI</option>
                        {pois.map(poi => {
                          const parentPOI = poi.parentId ? pois.find(p => p.id === poi.parentId) : null;
                          return (
                            <option key={poi.id} value={poi.id}>
                              {poi.name} ({poi.type.toLowerCase()})
                              {parentPOI && ` - Child of ${parentPOI.name}`}
                            </option>
                          );
                        })}
                      </select>
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        Which POI triggers this event (from POI Library)
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Player Action</label>
                      <select
                        className="input-neon"
                        value={formData.trigger.conditions?.action || ''}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          action: e.target.value 
                        })}
                      >
                        <option value="">Any Action</option>
                        <option value="mining">Mining</option>
                        <option value="scanning">Scanning</option>
                        <option value="docking">Docking</option>
                        <option value="approaching">Approaching</option>
                        <option value="salvaging">Salvaging</option>
                      </select>
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        What action the player is performing
                      </small>
                    </div>
                  </>
                )}

                {/* Time-Based Conditions */}
                {formData.trigger.type === 'time_based' && (
                  <>
                    <div className="form-group">
                      <label>Delay (seconds)</label>
                      <input
                        type="number"
                        className="input-neon"
                        min="1"
                        value={formData.trigger.conditions?.delay || 60}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          delay: parseInt(e.target.value) 
                        })}
                        placeholder="60"
                      />
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        How long to wait before this event can trigger
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Interval (seconds)</label>
                      <input
                        type="number"
                        className="input-neon"
                        min="1"
                        value={formData.trigger.conditions?.interval || 300}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          interval: parseInt(e.target.value) 
                        })}
                        placeholder="300"
                      />
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        How often this event can repeat (0 = once only)
                      </small>
                    </div>
                  </>
                )}

                {/* Location-Based Conditions */}
                {formData.trigger.type === 'location_based' && (
                  <>
                    <div className="form-group">
                      <label>Location/Zone</label>
                      <input
                        type="text"
                        className="input-neon"
                        value={formData.trigger.conditions?.location || ''}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          location: e.target.value 
                        })}
                        placeholder="sector_7, asteroid_belt, deep_space"
                      />
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        Specific location ID or zone type
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Entry Type</label>
                      <select
                        className="input-neon"
                        value={formData.trigger.conditions?.entryType || 'any'}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          entryType: e.target.value 
                        })}
                      >
                        <option value="any">Any Entry</option>
                        <option value="first">First Time Only</option>
                        <option value="warp">Warp Entry</option>
                        <option value="drift">Drifting Into</option>
                      </select>
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        How the player enters the location
                      </small>
                    </div>
                  </>
                )}

                {/* Mission Conditions */}
                {formData.trigger.type === 'mission' && (
                  <>
                    <div className="form-group">
                      <label>Mission ID</label>
                      <input
                        type="text"
                        className="input-neon"
                        value={formData.trigger.conditions?.missionId || ''}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          missionId: e.target.value 
                        })}
                        placeholder="mission_01"
                      />
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        Which mission triggers this event
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Mission Stage</label>
                      <select
                        className="input-neon"
                        value={formData.trigger.conditions?.stage || 'any'}
                        onChange={(e) => handleChange('trigger.conditions', { 
                          ...formData.trigger.conditions, 
                          stage: e.target.value 
                        })}
                      >
                        <option value="any">Any Stage</option>
                        <option value="start">Mission Start</option>
                        <option value="progress">In Progress</option>
                        <option value="complete">On Completion</option>
                        <option value="failed">On Failure</option>
                      </select>
                      <small style={{ color: '#666', fontSize: '0.8rem' }}>
                        When during the mission this fires
                      </small>
                    </div>
                  </>
                )}

                {/* Additional Conditions (JSON) */}
                <div className="form-group">
                  <label>Additional Conditions (JSON)</label>
                  <textarea
                    className="input-neon"
                    rows="3"
                    value={JSON.stringify(formData.trigger.conditions, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleChange('trigger.conditions', parsed);
                      } catch (err) {
                        // Allow invalid JSON while typing
                      }
                    }}
                    placeholder='{"risk": "high", "hasFlag": "discovered_artifact"}'
                    style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                  <small style={{ color: '#666', fontSize: '0.8rem' }}>
                    Advanced: Add custom conditions like risk level, player stats, flags
                  </small>
                </div>
              </div>

              {/* Help Panel */}
              {activeHelp === 'trigger' && (
                <div className="glass-card" style={{
                  padding: '1.5rem',
                  background: 'rgba(0, 255, 255, 0.05)',
                  borderColor: 'rgba(0, 255, 255, 0.3)',
                  maxHeight: '80vh',
                  overflowY: 'auto'
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--neon-cyan)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <InfoIcon size={20} /> {helpContent.trigger.title}
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                      Configure when and how this event triggers
                    </p>
                  </div>

                  {helpContent.trigger.sections.map((section, idx) => (
                    <div key={idx} style={{
                      marginBottom: '1.5rem',
                      paddingBottom: '1.5rem',
                      borderBottom: idx < helpContent.trigger.sections.length - 1 ? '1px solid rgba(0, 255, 255, 0.1)' : 'none'
                    }}>
                      <h5 style={{ color: '#0ff', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        {idx + 1}. {section.heading}
                      </h5>
                      <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                        {section.content}
                      </p>
                      <div style={{
                        background: 'rgba(255, 170, 0, 0.1)',
                        border: '1px solid rgba(255, 170, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '0.75rem',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{ color: '#ffaa00', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          💡 IMPACT
                        </div>
                        <div style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: '1.5' }}>
                          {section.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* SCENARIO TAB */}
            {activeTab === 'scenario' && (
              <div style={{ display: 'grid', gridTemplateColumns: activeHelp === 'scenario' ? '2fr 1fr' : '1fr', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.2rem' }}>
                      Event Scenario
                    </h3>
                    <button
                      type="button"
                      className="btn-neon"
                      onClick={() => toggleHelp('scenario')}
                      style={{
                        width: '32px',
                        height: '32px',
                        padding: 0,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        background: activeHelp === 'scenario' ? 'rgba(0, 255, 255, 0.2)' : 'transparent'
                      }}
                      title="Toggle help panel"
                    >
                      <InfoIcon size={18} />
                    </button>
                  </div>

                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    className="input-neon"
                    value={formData.scenario.title}
                    onChange={(e) => handleChange('scenario.title', e.target.value)}
                    placeholder="Event title that players will see"
                  />
                  {errors.title && <span className="error-text">{errors.title}</span>}
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    className="input-neon"
                    rows="4"
                    value={formData.scenario.description}
                    onChange={(e) => handleChange('scenario.description', e.target.value)}
                    placeholder="Detailed description of what happens in this event..."
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    className="input-neon"
                    value={formData.scenario.location}
                    onChange={(e) => handleChange('scenario.location', e.target.value)}
                    placeholder="e.g., Asteroid Belt, Space Station, Deep Space"
                  />
                </div>

                <div className="form-group">
                  <label>System Message</label>
                  <textarea
                    className="input-neon"
                    rows="2"
                    value={formData.scenario.systemMessage || ''}
                    onChange={(e) => handleChange('scenario.systemMessage', e.target.value)}
                    placeholder="[SCAN COMPLETE] Message shown in terminal..."
                    style={{ resize: 'vertical', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              {/* Help Panel */}
              {activeHelp === 'scenario' && (
                <div className="glass-card" style={{
                  padding: '1.5rem',
                  background: 'rgba(0, 255, 255, 0.05)',
                  borderColor: 'rgba(0, 255, 255, 0.3)',
                  maxHeight: '80vh',
                  overflowY: 'auto'
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: 'var(--neon-cyan)', fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <InfoIcon size={20} /> {helpContent.scenario.title}
                    </h4>
                    <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                      Craft the narrative presentation of your event
                    </p>
                  </div>

                  {helpContent.scenario.sections.map((section, idx) => (
                    <div key={idx} style={{
                      marginBottom: '1.5rem',
                      paddingBottom: '1.5rem',
                      borderBottom: idx < helpContent.scenario.sections.length - 1 ? '1px solid rgba(0, 255, 255, 0.1)' : 'none'
                    }}>
                      <h5 style={{ color: '#0ff', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        {idx + 1}. {section.heading}
                      </h5>
                      <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                        {section.content}
                      </p>
                      <div style={{
                        background: 'rgba(255, 170, 0, 0.1)',
                        border: '1px solid rgba(255, 170, 0, 0.3)',
                        borderRadius: '4px',
                        padding: '0.75rem',
                        marginTop: '0.5rem'
                      }}>
                        <div style={{ color: '#ffaa00', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          💡 IMPACT
                        </div>
                        <div style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: '1.5' }}>
                          {section.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* BRANCHES TAB */}
            {activeTab === 'branches' && (
              <div className="glass-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.2rem' }}>
                    Event Branches
                  </h3>
                  <button
                    className="btn-neon btn-neon-primary"
                    onClick={() => openBranchEditor(null, null)}
                    style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <CreateIcon size={18} /> ADD BRANCH
                  </button>
                </div>

                {formData.branches.length === 0 && (
                  <div style={{ 
                    padding: '3rem', 
                    textAlign: 'center',
                    background: 'rgba(0, 20, 40, 0.3)',
                    borderRadius: '8px',
                    border: '1px dashed var(--glass-border)'
                  }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🔀</div>
                    <div style={{ color: '#888', fontSize: '1rem', marginBottom: '0.5rem' }}>
                      No branches defined
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      Click "ADD BRANCH" to create player choices for this event
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formData.branches.map((branch, index) => (
                    <div 
                      key={index}
                      className="glass-card"
                      style={{ 
                        padding: '1.5rem',
                        background: 'rgba(0, 20, 40, 0.3)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => openBranchEditor(branch, index)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <span style={{ 
                              color: 'var(--neon-cyan)', 
                              fontWeight: 'bold',
                              fontSize: '1.1rem'
                            }}>
                              {branch.label || 'Unlabeled Branch'}
                            </span>
                            {branch.challenge && (
                              <span className="status-badge status-warning">
                                Challenge: {branch.challenge.difficulty}
                              </span>
                            )}
                          </div>
                          <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                            ID: {branch.id}
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                            {branch.challenge ? (
                              <>
                                <span style={{ color: '#aaa' }}>
                                  Skills: {branch.challenge.skills?.join(', ') || 'none'}
                                </span>
                                <span style={{ color: '#aaa' }}>
                                  Sub-scenarios: {branch.subScenarios?.length || 0}
                                </span>
                              </>
                            ) : (
                              <span style={{ color: '#aaa' }}>
                                Simple outcomes: {branch.outcomes?.length || 0}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-neon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openBranchEditor(branch, index);
                            }}
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                          >
                            <EditIcon size={16} /> EDIT
                          </button>
                          <button
                            className="btn-neon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBranchDirect(index);
                            }}
                            style={{ 
                              fontSize: '0.8rem', 
                              padding: '0.5rem 1rem',
                              borderColor: '#ff6b6b',
                              color: '#ff6b6b'
                            }}
                          >
                            <DeleteIcon size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* JSON Preview Section */}
        {showJsonPreview && (
          <div className="glass-card" style={{ padding: '2rem', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.2rem' }}>
              JSON Preview
            </h3>
            <div className="code-preview">
              <pre style={{ fontSize: '0.85rem' }}>
                {(() => {
                  try {
                    return JSON.stringify(formData, null, 2);
                  } catch (err) {
                    return `Error serializing JSON: ${err.message}\n\nThis usually means there's circular references or invalid data in the form.`;
                  }
                })()}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Branch Editor Modal */}
      {showBranchEditor && (
        <BranchEditor
          branch={editingBranch}
          config={config}
          onSave={saveBranch}
          onCancel={() => {
            setEditingBranch(null);
            setEditingBranchIndex(null);
            setShowBranchEditor(false);
          }}
          onDelete={editingBranchIndex !== null ? deleteBranch : null}
        />
      )}
    </div>
  );
}
