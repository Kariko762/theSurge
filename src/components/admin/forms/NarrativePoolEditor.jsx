import { useState, useEffect } from 'react';
import { SaveIcon, CloseIcon, WarningIcon, CreateIcon, DeleteIcon } from '../HoloIcons';
import '../../../styles/AdminGlass.css';

export default function NarrativePoolEditor({ pool, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: 'exploration',
    entries: []
  });

  const [errors, setErrors] = useState({});
  const [expandedEntry, setExpandedEntry] = useState(null);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    if (pool) {
      setFormData({
        id: pool.id || '',
        name: pool.name || '',
        description: pool.description || '',
        category: pool.category || 'exploration',
        entries: pool.entries || []
      });
    }
  }, [pool]);

  const categories = [
    { value: 'mining', label: 'Mining' },
    { value: 'exploration', label: 'Exploration' },
    { value: 'combat', label: 'Combat' },
    { value: 'station', label: 'Station' },
    { value: 'trade', label: 'Trade' },
    { value: 'discovery', label: 'Discovery' },
    { value: 'hazard', label: 'Hazard' }
  ];

  const tones = [
    { value: 'neutral', label: 'Neutral', color: '#888' },
    { value: 'positive', label: 'Positive', color: '#0f0' },
    { value: 'negative', label: 'Negative', color: '#ff6b6b' },
    { value: 'warning', label: 'Warning', color: '#fa0' },
    { value: 'danger', label: 'Danger', color: '#f00' },
    { value: 'mysterious', label: 'Mysterious', color: '#c0f' },
    { value: 'excited', label: 'Excited', color: '#0ff' },
    { value: 'eerie', label: 'Eerie', color: '#66f' },
    { value: 'tense', label: 'Tense', color: '#f80' },
    { value: 'curious', label: 'Curious', color: '#0af' },
    { value: 'urgent', label: 'Urgent', color: '#ff0' }
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.id || formData.id.trim() === '') {
      newErrors.id = 'Pool ID is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.id)) {
      newErrors.id = 'ID must be lowercase, alphanumeric, dashes and underscores only';
    }

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Pool name is required';
    }

    if (formData.entries.length === 0) {
      newErrors.entries = 'Pool must contain at least one narrative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addEntry = () => {
    const newEntry = {
      weight: 10,
      title: '',
      message: '',
      systemMessage: '',
      tone: 'neutral',
      assignDefinition: ''
    };
    handleChange('entries', [...formData.entries, newEntry]);
    setExpandedEntry(formData.entries.length);
  };

  const updateEntry = (index, field, value) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    handleChange('entries', newEntries);
  };

  const removeEntry = (index) => {
    handleChange('entries', formData.entries.filter((_, i) => i !== index));
    if (expandedEntry === index) setExpandedEntry(null);
  };

  const getToneColor = (tone) => {
    const toneObj = tones.find(t => t.value === tone);
    return toneObj?.color || '#888';
  };

  const totalWeight = formData.entries.reduce((sum, e) => sum + (e.weight || 0), 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '4rem 1rem',
      zIndex: 1000,
      overflowY: 'auto'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '1100px',
        padding: '2rem',
        background: 'rgba(0, 20, 40, 0.95)',
        border: '1px solid var(--neon-cyan)',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
        marginBottom: '2rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.5rem' }}>
            {pool ? 'Edit Narrative Pool' : 'Create Narrative Pool'}
          </h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn-neon"
              onClick={onCancel}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              <CloseIcon size={18} /> CANCEL
            </button>
            <button
              className="btn-neon btn-neon-primary"
              onClick={handleSubmit}
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              <SaveIcon size={18} /> SAVE POOL
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2rem' }}>
          {/* Left Column - Pool Info */}
          <div>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <h3 style={{ color: '#0ff', fontSize: '1rem', marginBottom: '1rem' }}>Pool Information</h3>

              <div className="form-group">
                <label>Pool ID *</label>
                <input
                  type="text"
                  className="input-neon"
                  value={formData.id}
                  onChange={(e) => handleChange('id', e.target.value.toLowerCase())}
                  placeholder="mining_success"
                  disabled={!!pool}
                  style={errors.id ? { borderColor: '#ff6b6b' } : {}}
                />
                {errors.id && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.id}</div>}
                {pool && <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>ID cannot be changed</div>}
              </div>

              <div className="form-group">
                <label>Pool Name *</label>
                <input
                  type="text"
                  className="input-neon"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Mining Success Narratives"
                  style={errors.name ? { borderColor: '#ff6b6b' } : {}}
                />
                {errors.name && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.name}</div>}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="input-neon"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Various success messages for mining operations..."
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '60px' }}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  className="input-neon"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(0, 255, 255, 0.05)',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                borderRadius: '4px'
              }}>
                <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Pool Stats</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <div style={{ color: '#0ff', fontSize: '1.2rem', fontWeight: 'bold' }}>{formData.entries.length}</div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Narratives</div>
                  </div>
                  <div>
                    <div style={{ color: '#0ff', fontSize: '1.2rem', fontWeight: 'bold' }}>{totalWeight}</div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Total Weight</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Narrative Entries */}
          <div>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#0ff', fontSize: '1rem', margin: 0 }}>Narrative Variations</h3>
                <button
                  className="btn-neon btn-neon-primary"
                  onClick={addEntry}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                >
                  <CreateIcon size={14} /> ADD NARRATIVE
                </button>
              </div>

              {errors.entries && <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1rem' }}>{errors.entries}</div>}

              {/* Entries List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {formData.entries.map((entry, index) => {
                  const dropChance = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(0) : 0;
                  const isExpanded = expandedEntry === index;
                  
                  return (
                    <div
                      key={index}
                      className="glass-card"
                      style={{
                        padding: '1rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: `1px solid ${getToneColor(entry.tone)}40`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setExpandedEntry(isExpanded ? null : index)}>
                          <div style={{ color: getToneColor(entry.tone), fontSize: '0.9rem', fontWeight: 'bold' }}>
                            {entry.title || `Narrative ${index + 1}`}
                          </div>
                          <div style={{ color: '#0ff', fontSize: '0.7rem' }}>
                            Weight: {entry.weight} ({dropChance}% chance)
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-neon"
                            onClick={() => setExpandedEntry(isExpanded ? null : index)}
                            style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }}
                          >
                            {isExpanded ? '▼' : '▶'}
                          </button>
                          <button
                            className="btn-neon"
                            onClick={() => removeEntry(index)}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.3rem 0.6rem',
                              borderColor: '#ff6b6b',
                              color: '#ff6b6b'
                            }}
                          >
                            <DeleteIcon size={12} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 255, 255, 0.2)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Title</label>
                              <input
                                type="text"
                                className="input-neon"
                                value={entry.title}
                                onChange={(e) => updateEntry(index, 'title', e.target.value)}
                                placeholder="Rich Vein Discovered"
                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Weight</label>
                              <input
                                type="number"
                                className="input-neon"
                                value={entry.weight}
                                onChange={(e) => updateEntry(index, 'weight', parseInt(e.target.value) || 0)}
                                min="0"
                                style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                              />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.75rem' }}>Tone</label>
                              <select
                                className="input-neon"
                                value={entry.tone}
                                onChange={(e) => updateEntry(index, 'tone', e.target.value)}
                                style={{
                                  fontSize: '0.85rem',
                                  padding: '0.4rem 0.6rem',
                                  color: getToneColor(entry.tone)
                                }}
                              >
                                {tones.map(tone => (
                                  <option key={tone.value} value={tone.value}>{tone.label}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Message</label>
                            <textarea
                              className="input-neon"
                              value={entry.message}
                              onChange={(e) => updateEntry(index, 'message', e.target.value)}
                              placeholder="Your scanners light up as you breach a particularly rich mineral deposit..."
                              rows={3}
                              style={{ fontSize: '0.85rem', padding: '0.6rem', resize: 'vertical' }}
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>System Message</label>
                            <input
                              type="text"
                              className="input-neon"
                              value={entry.systemMessage}
                              onChange={(e) => updateEntry(index, 'systemMessage', e.target.value)}
                              placeholder="Mining efficiency increased by 15%"
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.75rem' }}>Assign POI Definition (optional)</label>
                            <input
                              type="text"
                              className="input-neon"
                              value={entry.assignDefinition || ''}
                              onChange={(e) => updateEntry(index, 'assignDefinition', e.target.value)}
                              placeholder="type_i_iron, operational, derelict..."
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                            />
                            <div style={{ color: '#666', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                              If set, this narrative will assign a POI definition when selected
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {formData.entries.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
                  <div style={{ fontSize: '0.9rem' }}>No narratives in this pool yet</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click "ADD NARRATIVE" to get started</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Validation Summary */}
        {Object.keys(errors).length > 0 && (
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff6b6b', marginBottom: '0.5rem' }}>
              <WarningIcon size={18} />
              <strong>Please fix the following errors:</strong>
            </div>
            <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#ff6b6b', fontSize: '0.85rem' }}>
              {Object.values(errors).map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
