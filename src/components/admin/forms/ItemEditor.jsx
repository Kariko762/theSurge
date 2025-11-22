import { useState, useEffect } from 'react';
import { SaveIcon, CloseIcon, WarningIcon } from '../HoloIcons';
import '../../../styles/AdminGlass.css';

export default function ItemEditor({ item, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: 'resource',
    tier: 'common',
    weight: 1,
    size: 1,
    maxStack: 1,
    value: 0,
    tags: [],
    properties: {}
  });

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    if (item) {
      setFormData({
        id: item.id || '',
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'resource',
        tier: item.tier || 'common',
        weight: item.weight || 1,
        size: item.size || 1,
        maxStack: item.maxStack || 1,
        value: item.value || 0,
        tags: item.tags || [],
        properties: item.properties || {}
      });
    }
  }, [item]);

  const categories = [
    { value: 'resource', label: 'Resource', desc: 'Raw materials, minerals, gases' },
    { value: 'equipment', label: 'Equipment', desc: 'Ship modules, weapons, upgrades' },
    { value: 'consumable', label: 'Consumable', desc: 'Fuel, repair kits, ammo' },
    { value: 'component', label: 'Component', desc: 'Crafting materials, parts' },
    { value: 'artifact', label: 'Artifact', desc: 'Rare discoveries, relics' },
    { value: 'data', label: 'Data', desc: 'Information, blueprints, logs' },
    { value: 'contraband', label: 'Contraband', desc: 'Illegal or restricted items' }
  ];

  const tiers = [
    { value: 'common', label: 'Common', color: '#888' },
    { value: 'uncommon', label: 'Uncommon', color: '#0f0' },
    { value: 'rare', label: 'Rare', color: '#0af' },
    { value: 'epic', label: 'Epic', color: '#c0f' },
    { value: 'legendary', label: 'Legendary', color: '#fa0' }
  ];

  const validate = () => {
    const newErrors = {};

    if (!formData.id || formData.id.trim() === '') {
      newErrors.id = 'Item ID is required';
    } else if (!/^[a-z0-9_-]+$/.test(formData.id)) {
      newErrors.id = 'ID must be lowercase, alphanumeric, dashes and underscores only';
    }

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Item name is required';
    }

    if (formData.weight < 0) {
      newErrors.weight = 'Weight cannot be negative';
    }

    if (formData.size < 1) {
      newErrors.size = 'Size must be at least 1';
    }

    if (formData.maxStack < 1) {
      newErrors.maxStack = 'Max stack must be at least 1';
    }

    if (formData.value < 0) {
      newErrors.value = 'Value cannot be negative';
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
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    handleChange('tags', formData.tags.filter(t => t !== tag));
  };

  const getTierColor = (tier) => {
    const tierObj = tiers.find(t => t.value === tier);
    return tierObj?.color || '#888';
  };

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
        maxWidth: '900px',
        padding: '2rem',
        background: 'rgba(0, 20, 40, 0.95)',
        border: '1px solid var(--neon-cyan)',
        boxShadow: '0 0 40px rgba(0, 255, 255, 0.3)',
        marginBottom: '2rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.5rem' }}>
            {item ? 'Edit Item' : 'Create New Item'}
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
              <SaveIcon size={18} /> SAVE ITEM
            </button>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left Column */}
          <div>
            {/* Basic Info */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <h3 style={{ color: '#0ff', fontSize: '1rem', marginBottom: '1rem' }}>Basic Information</h3>

              <div className="form-group">
                <label>Item ID *</label>
                <input
                  type="text"
                  className="input-neon"
                  value={formData.id}
                  onChange={(e) => handleChange('id', e.target.value.toLowerCase())}
                  placeholder="iron_ore"
                  disabled={!!item}
                  style={errors.id ? { borderColor: '#ff6b6b' } : {}}
                />
                {errors.id && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.id}</div>}
                {item && <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>ID cannot be changed after creation</div>}
              </div>

              <div className="form-group">
                <label>Item Name *</label>
                <input
                  type="text"
                  className="input-neon"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Iron Ore"
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
                  placeholder="A common metallic ore found in asteroid belts..."
                  rows={4}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>
            </div>

            {/* Classification */}
            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <h3 style={{ color: '#0ff', fontSize: '1rem', marginBottom: '1rem' }}>Classification</h3>

              <div className="form-group">
                <label>Category</label>
                <select
                  className="input-neon"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} - {cat.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tier / Rarity</label>
                <select
                  className="input-neon"
                  value={formData.tier}
                  onChange={(e) => handleChange('tier', e.target.value)}
                  style={{
                    borderColor: getTierColor(formData.tier),
                    color: getTierColor(formData.tier)
                  }}
                >
                  {tiers.map(tier => (
                    <option key={tier.value} value={tier.value}>{tier.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="input-neon"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn-neon"
                    onClick={addTag}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    ADD
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {formData.tags.map(tag => (
                    <div
                      key={tag}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(0, 255, 255, 0.1)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        color: '#0ff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {tag}
                      <span
                        onClick={() => removeTag(tag)}
                        style={{ cursor: 'pointer', opacity: 0.7, fontSize: '1.1rem' }}
                      >
                        ×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div>
            {/* Physical Properties */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <h3 style={{ color: '#0ff', fontSize: '1rem', marginBottom: '1rem' }}>Physical Properties</h3>

              <div className="form-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  className="input-neon"
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                  style={errors.weight ? { borderColor: '#ff6b6b' } : {}}
                />
                {errors.weight && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.weight}</div>}
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Affects cargo capacity and ship handling
                </div>
              </div>

              <div className="form-group">
                <label>Size (cargo units)</label>
                <input
                  type="number"
                  className="input-neon"
                  value={formData.size}
                  onChange={(e) => handleChange('size', parseInt(e.target.value) || 1)}
                  min="1"
                  step="1"
                  style={errors.size ? { borderColor: '#ff6b6b' } : {}}
                />
                {errors.size && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.size}</div>}
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  How many cargo slots this item occupies
                </div>
              </div>

              <div className="form-group">
                <label>Max Stack Size</label>
                <input
                  type="number"
                  className="input-neon"
                  value={formData.maxStack}
                  onChange={(e) => handleChange('maxStack', parseInt(e.target.value) || 1)}
                  min="1"
                  step="1"
                  style={errors.maxStack ? { borderColor: '#ff6b6b' } : {}}
                />
                {errors.maxStack && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.maxStack}</div>}
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Maximum quantity in a single inventory slot
                </div>
              </div>
            </div>

            {/* Economic Properties */}
            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <h3 style={{ color: '#0ff', fontSize: '1rem', marginBottom: '1rem' }}>Economic Properties</h3>

              <div className="form-group">
                <label>Base Value (credits)</label>
                <input
                  type="number"
                  className="input-neon"
                  value={formData.value}
                  onChange={(e) => handleChange('value', parseInt(e.target.value) || 0)}
                  min="0"
                  step="1"
                  style={errors.value ? { borderColor: '#ff6b6b' } : {}}
                />
                {errors.value && <div style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{errors.value}</div>}
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Base market value (actual prices may vary by location)
                </div>
              </div>

              {/* Value per kg */}
              {formData.weight > 0 && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(0, 255, 0, 0.05)',
                  border: '1px solid rgba(0, 255, 0, 0.2)',
                  borderRadius: '4px'
                }}>
                  <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Value Density</div>
                  <div style={{ color: '#0f0', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    {(formData.value / formData.weight).toFixed(2)} cr/kg
                  </div>
                  <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Value per unit mass
                  </div>
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
