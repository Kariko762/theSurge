import { useState, useEffect } from 'react';
import { SaveIcon, DeleteIcon, CreateIcon, WarningIcon } from '../HoloIcons';
import '../../../styles/AdminGlass.css';

export default function BranchEditor({ branch, config, onSave, onCancel, onDelete }) {
  const [formData, setFormData] = useState(branch ? {
    ...branch,
    outcomes: branch.outcomes || [],
    subScenarios: branch.subScenarios || []
  } : {
    id: '',
    label: '',
    challenge: null,
    outcomes: [],
    subScenarios: []
  });

  const [expandedOutcome, setExpandedOutcome] = useState(null);
  const [hasChallenge, setHasChallenge] = useState(!!branch?.challenge);

  // Add modal-open class to body when modal is mounted
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const handleChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const toggleChallenge = (enabled) => {
    setHasChallenge(enabled);
    if (enabled) {
      setFormData(prev => ({
        ...prev,
        challenge: {
          mode: 'skillCheck',
          difficulty: 'medium',
          skills: [],
          baseTarget: 12,
          description: ''
        },
        subScenarios: prev.subScenarios.length > 0 ? prev.subScenarios : [
          {
            id: 'success_outcome',
            weight: 0.5,
            outcomeType: 'success',
            narrative: { title: '', description: '', systemMessage: '' },
            rewards: { credits: 0, xp: 0, rewardType: 'none', items: [], lootPool: null }
          },
          {
            id: 'failure_outcome',
            weight: 0.5,
            outcomeType: 'failure',
            narrative: { title: '', description: '', systemMessage: '' },
            rewards: { credits: 0, xp: 0, rewardType: 'none', items: [], lootPool: null }
          }
        ],
        outcomes: []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        challenge: null,
        subScenarios: [],
        outcomes: prev.outcomes.length > 0 ? prev.outcomes : [
          {
            weight: 1.0,
            type: 'default',
            narrative: '',
            rewards: null
          }
        ]
      }));
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

  const addOutcome = () => {
    const newOutcome = hasChallenge ? {
      id: `outcome_${Date.now()}`,
      weight: 0.5,
      outcomeType: 'success',
      narrative: { title: '', description: '', systemMessage: '' },
      rewards: { credits: 0, xp: 0, rewardType: 'none', items: [], lootPool: null }
    } : {
      weight: 1.0,
      type: 'default',
      narrative: '',
      rewards: null
    };

    if (hasChallenge) {
      setFormData(prev => ({ ...prev, subScenarios: [...prev.subScenarios, newOutcome] }));
    } else {
      setFormData(prev => ({ ...prev, outcomes: [...prev.outcomes, newOutcome] }));
    }
  };

  const removeOutcome = (index) => {
    if (hasChallenge) {
      setFormData(prev => ({
        ...prev,
        subScenarios: prev.subScenarios.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        outcomes: prev.outcomes.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOutcome = (index, field, value) => {
    if (hasChallenge) {
      setFormData(prev => ({
        ...prev,
        subScenarios: prev.subScenarios.map((outcome, i) => 
          i === index ? { ...outcome, [field]: value } : outcome
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        outcomes: prev.outcomes.map((outcome, i) => 
          i === index ? { ...outcome, [field]: value } : outcome
        )
      }));
    }
  };

  const updateOutcomeNested = (index, path, value) => {
    if (hasChallenge) {
      setFormData(prev => ({
        ...prev,
        subScenarios: prev.subScenarios.map((outcome, i) => {
          if (i !== index) return outcome;
          const keys = path.split('.');
          const updated = { ...outcome };
          let current = updated;
          for (let j = 0; j < keys.length - 1; j++) {
            current[keys[j]] = { ...current[keys[j]] };
            current = current[keys[j]];
          }
          current[keys[keys.length - 1]] = value;
          return updated;
        })
      }));
    }
  };

  const addItem = (index, item) => {
    if (item && hasChallenge) {
      const current = formData.subScenarios[index].rewards.items || [];
      if (!current.includes(item)) {
        updateOutcomeNested(index, 'rewards.items', [...current, item]);
      }
    }
  };

  const removeItem = (index, item) => {
    if (hasChallenge) {
      const current = formData.subScenarios[index].rewards.items || [];
      updateOutcomeNested(index, 'rewards.items', current.filter(i => i !== item));
    }
  };

  const addFactionReputation = (index) => {
    if (hasChallenge) {
      const current = formData.subScenarios[index].rewards?.factionReputation || [];
      updateOutcomeNested(index, 'rewards.factionReputation', [
        ...current,
        {
          factionId: '',
          change: 0,
          condition: null
        }
      ]);
    }
  };

  const removeFactionReputation = (index, repIndex) => {
    if (hasChallenge) {
      const current = formData.subScenarios[index].rewards?.factionReputation || [];
      updateOutcomeNested(index, 'rewards.factionReputation', current.filter((_, i) => i !== repIndex));
    }
  };

  const updateFactionReputation = (outcomeIndex, repIndex, field, value) => {
    if (hasChallenge) {
      const current = formData.subScenarios[outcomeIndex].rewards?.factionReputation || [];
      const updated = current.map((rep, i) => 
        i === repIndex ? { ...rep, [field]: value } : rep
      );
      updateOutcomeNested(outcomeIndex, 'rewards.factionReputation', updated);
    }
  };

  const updateFactionReputationCondition = (outcomeIndex, repIndex, conditionField, value) => {
    if (hasChallenge) {
      const current = formData.subScenarios[outcomeIndex].rewards?.factionReputation || [];
      const updated = current.map((rep, i) => {
        if (i !== repIndex) return rep;
        return {
          ...rep,
          condition: rep.condition ? { ...rep.condition, [conditionField]: value } : { [conditionField]: value }
        };
      });
      updateOutcomeNested(outcomeIndex, 'rewards.factionReputation', updated);
    }
  };

  const validate = () => {
    if (!formData.id || formData.id.trim() === '') {
      alert('Branch ID is required');
      return false;
    }
    if (!formData.label || formData.label.trim() === '') {
      alert('Branch label is required');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  const availableSkills = ['piloting', 'engineering', 'combat', 'negotiation', 'science', 'perception', 'technical', 'salvage', 'intuition', 'luck'];
  const availableItems = ['med_kit', 'ship_components', 'rare_ore', 'data_core', 'research_notes', 'scan_data', 'alien_artifact', 'scrap_metal'];
  const difficulties = ['trivial', 'easy', 'medium', 'hard', 'very_hard', 'extreme'];
  const outcomeTypes = ['success', 'failure', 'critical_success', 'critical_failure'];
  
  const conditionTypes = [
    { value: null, label: 'Always Apply (No Condition)' },
    { value: 'combat_target', label: 'If Combat Target Has Faction' },
    { value: 'encounter_faction', label: 'If Encounter Has Faction' },
    { value: 'poi_owner', label: 'If POI Has Owner Faction' },
    { value: 'dynamic_faction', label: 'Use Dynamic Faction from Context' }
  ];
  
  const contextSources = [
    { value: 'target.factionId', label: 'Combat Target Faction' },
    { value: 'encounter.factionId', label: 'Encounter Faction' },
    { value: 'poi.ownerFaction', label: 'POI Owner Faction' },
    { value: 'event.involvedFactions[0]', label: 'First Involved Faction' }
  ];

  const outcomes = hasChallenge ? formData.subScenarios : formData.outcomes;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '6rem 1rem',
      overflowY: 'auto'
    }}>
      <div className="glass-card" style={{
        maxWidth: '1200px',
        width: '100%',
        maxHeight: 'none',
        overflowY: 'visible',
        padding: '1.5rem',
        marginBottom: '4rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.3rem' }}>
            {branch ? 'Edit Branch' : 'Create Branch'}
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {branch && onDelete && (
              <button 
                className="btn-neon"
                onClick={onDelete}
                style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
              >
                <DeleteIcon size={18} /> DELETE
              </button>
            )}
            <button className="btn-neon" onClick={onCancel}>
              CANCEL
            </button>
            <button 
              className="btn-neon btn-neon-primary" 
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <SaveIcon size={20} /> SAVE BRANCH
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* LEFT COLUMN - Basic Info & Challenge */}
          <div>
            {/* Basic Info */}
            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
              <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Branch Details</h3>
              
              <div className="form-group">
                <label>Branch ID *</label>
                <input
                  type="text"
                  className="input-neon"
                  value={formData.id}
                  onChange={(e) => handleChange('id', e.target.value)}
                  placeholder="investigate"
                  disabled={!!branch}
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  Unique identifier for this branch (lowercase, no spaces)
                </small>
              </div>

              <div className="form-group">
                <label>Player-Facing Label *</label>
                <input
                  type="text"
                  className="input-neon"
                  value={formData.label}
                  onChange={(e) => handleChange('label', e.target.value)}
                  placeholder="Board the station and investigate"
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  This is what the player sees as a choice button
                </small>
              </div>
            </div>

            {/* Challenge Toggle */}
            <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
              <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '0.95rem' }}>Challenge</h3>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', marginBottom: '0.75rem' }}>
                <input
                  type="checkbox"
                  checked={hasChallenge}
                  onChange={(e) => toggleChallenge(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: '#fff', fontSize: '0.9rem' }}>This branch requires a skill check</span>
              </label>

              {hasChallenge && (
                <>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      className="input-neon"
                      value={formData.challenge.difficulty}
                      onChange={(e) => handleChange('challenge.difficulty', e.target.value)}
                    >
                      {difficulties.map(diff => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Number</label>
                    <input
                      type="number"
                      className="input-neon"
                      value={formData.challenge.baseTarget}
                      onChange={(e) => handleChange('challenge.baseTarget', parseInt(e.target.value))}
                      min="5"
                      max="25"
                />
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  D20 + modifiers must meet or exceed this number
                </small>
              </div>

              <div className="form-group">
                <label>Required Skills</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                  {formData.challenge.skills.map(skill => (
                    <span 
                      key={skill} 
                      className="status-badge status-warning" 
                      style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
                    </span>
                  ))}
                </div>
                <select
                  className="input-neon"
                  onChange={(e) => {
                    addSkill(e.target.value);
                    e.target.value = '';
                  }}
                >
                  <option value="">+ Add Skill</option>
                  {availableSkills.filter(s => !formData.challenge.skills.includes(s)).map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Challenge Description</label>
                <textarea
                  className="input-neon"
                  rows="2"
                  value={formData.challenge.description}
                  onChange={(e) => handleChange('challenge.description', e.target.value)}
                  placeholder="Brief explanation of what the check represents..."
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
            </>
          )}
        </div>
          </div>

          {/* RIGHT COLUMN - Outcomes */}
          <div>
            {/* Outcomes */}
            <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ color: '#fff', margin: 0, fontSize: '0.95rem' }}>
                  {hasChallenge ? 'Sub-Scenarios' : 'Outcomes'}
                </h3>
                <button
                  className="btn-neon"
                  onClick={addOutcome}
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  <CreateIcon size={16} /> ADD OUTCOME
                </button>
              </div>

              {outcomes.length === 0 && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
                  No outcomes defined. Click "ADD OUTCOME" to create one.
                </div>
              )}

          {outcomes.map((outcome, index) => (
            <div 
              key={index}
              className="glass-card"
              style={{ 
                padding: '1rem', 
                marginBottom: '0.75rem',
                background: 'rgba(0, 10, 20, 0.5)',
                border: expandedOutcome === index ? '1px solid var(--neon-cyan)' : '1px solid var(--glass-border)'
              }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: expandedOutcome === index ? '0.75rem' : 0,
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedOutcome(expandedOutcome === index ? null : index)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--neon-cyan)', fontSize: '1rem' }}>
                    {expandedOutcome === index ? '▼' : '▶'}
                  </span>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {hasChallenge ? outcome.narrative?.title || `Outcome ${index + 1}` : `Outcome ${index + 1}`}
                  </span>
                  {hasChallenge && (
                    <>
                      <span className={`status-badge status-${outcome.outcomeType.includes('success') ? 'success' : 'error'}`}>
                        {outcome.outcomeType}
                      </span>
                      <span style={{ color: '#888', fontSize: '0.8rem' }}>
                        Weight: {outcome.weight}
                      </span>
                    </>
                  )}
                </div>
                <button
                  className="btn-neon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOutcome(index);
                  }}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderColor: '#ff6b6b', color: '#ff6b6b' }}
                >
                  <DeleteIcon size={14} />
                </button>
              </div>

              {expandedOutcome === index && (
                <div style={{ marginTop: '0.75rem' }}>
                  {hasChallenge ? (
                    <>
                      <div className="form-group">
                        <label>Outcome ID</label>
                        <input
                          type="text"
                          className="input-neon"
                          value={outcome.id}
                          onChange={(e) => updateOutcome(index, 'id', e.target.value)}
                          placeholder="success_cache_found"
                        />
                      </div>

                      <div className="form-group">
                        <label>Outcome Type</label>
                        <select
                          className="input-neon"
                          value={outcome.outcomeType}
                          onChange={(e) => updateOutcome(index, 'outcomeType', e.target.value)}
                        >
                          {outcomeTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Weight (0-1)</label>
                        <input
                          type="number"
                          className="input-neon"
                          value={outcome.weight}
                          onChange={(e) => updateOutcome(index, 'weight', parseFloat(e.target.value))}
                          min="0"
                          max="1"
                          step="0.1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          className="input-neon"
                          value={outcome.narrative?.title || ''}
                          onChange={(e) => updateOutcomeNested(index, 'narrative.title', e.target.value)}
                          placeholder="Supply Cache Discovered"
                        />
                      </div>

                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          className="input-neon"
                          rows="2"
                          value={outcome.narrative?.description || ''}
                          onChange={(e) => updateOutcomeNested(index, 'narrative.description', e.target.value)}
                          placeholder="What happens in this outcome..."
                          style={{ resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>

                      <div className="form-group">
                        <label>System Message</label>
                        <input
                          type="text"
                          className="input-neon"
                          value={outcome.narrative?.systemMessage || ''}
                          onChange={(e) => updateOutcomeNested(index, 'narrative.systemMessage', e.target.value)}
                          placeholder="[CACHE LOCATED] Emergency locker opened."
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="form-group">
                          <label>Credits</label>
                          <input
                            type="number"
                            className="input-neon"
                            value={outcome.rewards?.credits || 0}
                            onChange={(e) => updateOutcomeNested(index, 'rewards.credits', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label>XP</label>
                          <input
                            type="number"
                            className="input-neon"
                            value={outcome.rewards?.xp || 0}
                            onChange={(e) => updateOutcomeNested(index, 'rewards.xp', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="form-group">
                          <label>Damage</label>
                          <select
                            className="input-neon"
                            value={outcome.rewards?.damage || 'none'}
                            onChange={(e) => updateOutcomeNested(index, 'rewards.damage', e.target.value === 'none' ? null : e.target.value)}
                          >
                            <option value="none">None</option>
                            <option value="minor">Minor</option>
                            <option value="major">Major</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Reward Type</label>
                        <select
                          className="input-neon"
                          value={outcome.rewards?.rewardType || 'none'}
                          onChange={(e) => updateOutcomeNested(index, 'rewards.rewardType', e.target.value)}
                        >
                          <option value="none">No Item Rewards</option>
                          <option value="specific">Specific Items</option>
                          <option value="lootPool">Loot Pool (Random)</option>
                        </select>
                      </div>

                      {outcome.rewards?.rewardType === 'specific' && (
                        <div className="form-group">
                          <label>Items</label>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                            {(outcome.rewards?.items || []).map(item => {
                              const itemData = config?.lootTables?.items?.find(i => i.id === item);
                              return (
                                <span 
                                  key={item} 
                                  className="status-badge status-info" 
                                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                  onClick={() => removeItem(index, item)}
                                >
                                  {itemData?.name || item} <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</span>
                                </span>
                              );
                            })}
                          </div>
                          <select
                            className="input-neon"
                            onChange={(e) => {
                              addItem(index, e.target.value);
                              e.target.value = '';
                            }}
                          >
                            <option value="">+ Add Item</option>
                            {(config?.lootTables?.items || []).filter(i => !(outcome.rewards?.items || []).includes(i.id)).map(item => (
                              <option key={item.id} value={item.id}>{item.name} ({item.id})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {outcome.rewards?.rewardType === 'lootPool' && (
                        <div className="form-group">
                          <label>Loot Pool</label>
                          <select
                            className="input-neon"
                            value={outcome.rewards?.lootPool || ''}
                            onChange={(e) => updateOutcomeNested(index, 'rewards.lootPool', e.target.value || null)}
                          >
                            <option value="">Select a pool...</option>
                            {(config?.lootTables?.pools || []).map(pool => (
                              <option key={pool.id} value={pool.id}>
                                {pool.name} ({pool.entries?.length || 0} items)
                              </option>
                            ))}
                          </select>
                          {outcome.rewards?.lootPool && (
                            <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(0, 255, 255, 0.05)', border: '1px solid rgba(0, 255, 255, 0.2)', borderRadius: '4px' }}>
                              <div style={{ color: '#0ff', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Pool Preview:</div>
                              <div style={{ color: '#666', fontSize: '0.75rem' }}>
                                {(() => {
                                  const pool = config?.lootTables?.pools?.find(p => p.id === outcome.rewards.lootPool);
                                  if (!pool) return 'Pool not found';
                                  return pool.entries?.map(e => {
                                    const item = config?.lootTables?.items?.find(i => i.id === e.itemId);
                                    return `${item?.name || e.itemId} (${e.minQuantity}-${e.maxQuantity})`;
                                  }).join(', ') || 'No items in pool';
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Faction Reputation Section */}
                      <div className="form-group" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ margin: 0, color: '#fa0', fontSize: '0.95rem', fontWeight: 'bold' }}>🤝 Faction Reputation Changes</label>
                          <button
                            className="btn-neon"
                            onClick={(e) => {
                              e.preventDefault();
                              addFactionReputation(index);
                            }}
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
                          >
                            <CreateIcon size={12} /> Add Faction Rep
                          </button>
                        </div>

                        {(!outcome.rewards?.factionReputation || outcome.rewards.factionReputation.length === 0) && (
                          <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontSize: '0.85rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }}>
                            No faction reputation changes. Click "Add Faction Rep" to add one.
                          </div>
                        )}

                        {(outcome.rewards?.factionReputation || []).map((rep, repIndex) => (
                          <div key={repIndex} className="glass-card" style={{ padding: '1rem', marginBottom: '0.75rem', background: 'rgba(0, 20, 40, 0.4)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <span style={{ color: '#fa0', fontWeight: 'bold', fontSize: '0.85rem' }}>Reputation Change #{repIndex + 1}</span>
                              <button
                                className="btn-neon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeFactionReputation(index, repIndex);
                                }}
                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderColor: '#f66', color: '#f66' }}
                              >
                                <DeleteIcon size={12} /> Remove
                              </button>
                            </div>

                            {/* Condition Type Selection */}
                            <div className="form-group">
                              <label style={{ fontSize: '0.8rem' }}>Condition Type</label>
                              <select
                                className="input-neon"
                                value={rep.condition?.type || ''}
                                onChange={(e) => {
                                  const conditionType = e.target.value || null;
                                  if (!conditionType) {
                                    updateFactionReputation(index, repIndex, 'condition', null);
                                  } else {
                                    updateFactionReputation(index, repIndex, 'condition', {
                                      type: conditionType,
                                      source: 'target.factionId',
                                      operator: 'exists'
                                    });
                                  }
                                }}
                                style={{ fontSize: '0.8rem' }}
                              >
                                {conditionTypes.map(ct => (
                                  <option key={ct.value || 'none'} value={ct.value || ''}>{ct.label}</option>
                                ))}
                              </select>
                              <small style={{ color: '#666', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>
                                {!rep.condition && 'This reputation change will always apply'}
                                {rep.condition?.type === 'combat_target' && 'Only applies if player attacked a faction ship'}
                                {rep.condition?.type === 'encounter_faction' && 'Only applies if encounter has a faction'}
                                {rep.condition?.type === 'poi_owner' && 'Only applies if POI has an owner faction'}
                                {rep.condition?.type === 'dynamic_faction' && 'Uses faction from event context dynamically'}
                              </small>
                            </div>

                            {/* Faction Selection (Static) or Context Source (Dynamic) */}
                            {!rep.condition && (
                              <div className="form-group">
                                <label style={{ fontSize: '0.8rem' }}>Faction</label>
                                <select
                                  className="input-neon"
                                  value={rep.factionId || ''}
                                  onChange={(e) => updateFactionReputation(index, repIndex, 'factionId', e.target.value)}
                                  style={{ fontSize: '0.8rem' }}
                                >
                                  <option value="">Select faction...</option>
                                  {(config?.factions || []).map(faction => (
                                    <option key={faction.id} value={faction.id}>
                                      {faction.iconEmoji} {faction.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {rep.condition && (
                              <>
                                <div className="form-group">
                                  <label style={{ fontSize: '0.8rem' }}>Get Faction From</label>
                                  <select
                                    className="input-neon"
                                    value={rep.condition.source || 'target.factionId'}
                                    onChange={(e) => updateFactionReputationCondition(index, repIndex, 'source', e.target.value)}
                                    style={{ fontSize: '0.8rem' }}
                                  >
                                    {contextSources.map(cs => (
                                      <option key={cs.value} value={cs.value}>{cs.label}</option>
                                    ))}
                                  </select>
                                  <small style={{ color: '#0cf', fontSize: '0.7rem', display: 'block', marginTop: '0.25rem' }}>
                                    💡 Dynamic: Reputation applies to whatever faction is found at: <code style={{ background: 'rgba(0, 0, 0, 0.5)', padding: '0.1rem 0.3rem', borderRadius: '2px' }}>{rep.condition.source}</code>
                                  </small>
                                </div>

                                <div className="form-group">
                                  <label style={{ fontSize: '0.8rem' }}>Condition Operator</label>
                                  <select
                                    className="input-neon"
                                    value={rep.condition.operator || 'exists'}
                                    onChange={(e) => updateFactionReputationCondition(index, repIndex, 'operator', e.target.value)}
                                    style={{ fontSize: '0.8rem' }}
                                  >
                                    <option value="exists">Exists (faction must be present)</option>
                                    <option value="equals">Equals (specific faction ID)</option>
                                    <option value="not_equals">Not Equals (exclude specific faction)</option>
                                  </select>
                                </div>

                                {(rep.condition.operator === 'equals' || rep.condition.operator === 'not_equals') && (
                                  <div className="form-group">
                                    <label style={{ fontSize: '0.8rem' }}>Compare To Faction</label>
                                    <select
                                      className="input-neon"
                                      value={rep.condition.value || ''}
                                      onChange={(e) => updateFactionReputationCondition(index, repIndex, 'value', e.target.value)}
                                      style={{ fontSize: '0.8rem' }}
                                    >
                                      <option value="">Select faction...</option>
                                      {(config?.factions || []).map(faction => (
                                        <option key={faction.id} value={faction.id}>
                                          {faction.iconEmoji} {faction.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Reputation Change Value */}
                            <div className="form-group">
                              <label style={{ fontSize: '0.8rem' }}>Reputation Change</label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                  type="range"
                                  min="-100"
                                  max="100"
                                  step="5"
                                  value={rep.change || 0}
                                  onChange={(e) => updateFactionReputation(index, repIndex, 'change', parseInt(e.target.value))}
                                  style={{
                                    width: '100%',
                                    accentColor: rep.change >= 0 ? '#0f8' : '#f66'
                                  }}
                                />
                                <span style={{
                                  color: rep.change >= 0 ? '#0f8' : '#f66',
                                  fontSize: '1.1rem',
                                  fontWeight: 'bold',
                                  minWidth: '60px',
                                  textAlign: 'right'
                                }}>
                                  {rep.change >= 0 ? '+' : ''}{rep.change}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.65rem', color: '#666' }}>
                                <span>Hostile</span>
                                <span>Neutral</span>
                                <span>Allied</span>
                              </div>
                            </div>

                            {/* Preview */}
                            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(0, 255, 170, 0.05)', border: '1px solid rgba(0, 255, 170, 0.2)', borderRadius: '4px' }}>
                              <div style={{ color: '#0fa', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.35rem' }}>Preview Logic:</div>
                              <div style={{ color: '#aaa', fontSize: '0.7rem', fontFamily: 'monospace', lineHeight: 1.4 }}>
                                {!rep.condition && rep.factionId && (
                                  <>
                                    <span style={{ color: '#fa0' }}>ALWAYS:</span> {config?.factions?.find(f => f.id === rep.factionId)?.name || rep.factionId} {rep.change >= 0 ? '+' : ''}{rep.change}
                                  </>
                                )}
                                {!rep.condition && !rep.factionId && (
                                  <span style={{ color: '#f66' }}>⚠️ No faction selected</span>
                                )}
                                {rep.condition && (
                                  <>
                                    <span style={{ color: '#fa0' }}>IF</span> <span style={{ color: '#0cf' }}>{rep.condition.source}</span> {rep.condition.operator === 'exists' ? 'exists' : rep.condition.operator === 'equals' ? `== "${rep.condition.value}"` : `!= "${rep.condition.value}"`}<br />
                                    <span style={{ color: '#fa0' }}>THEN</span> [<span style={{ color: '#0cf' }}>Dynamic Faction</span>] {rep.change >= 0 ? '+' : ''}{rep.change}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="form-group">
                        <label>Weight</label>
                        <input
                          type="number"
                          className="input-neon"
                          value={outcome.weight}
                          onChange={(e) => updateOutcome(index, 'weight', parseFloat(e.target.value))}
                          min="0"
                          max="1"
                          step="0.1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Narrative</label>
                        <textarea
                          className="input-neon"
                          rows="3"
                          value={outcome.narrative || ''}
                          onChange={(e) => updateOutcome(index, 'narrative', e.target.value)}
                          placeholder="What happens in this outcome..."
                          style={{ resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
