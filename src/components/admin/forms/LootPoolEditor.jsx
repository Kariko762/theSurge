import { useState, useEffect } from 'react';
import { SaveIcon, CloseIcon, WarningIcon, CreateIcon, DeleteIcon, SearchIcon } from '../HoloIcons';
import '../../../styles/AdminGlass.css';

export default function LootPoolEditor({ pool, items, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    tags: [],
    entries: []
  });

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);

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
        tags: pool.tags || [],
        entries: pool.entries || []
      });
    }
  }, [pool]);

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
      newErrors.entries = 'Pool must contain at least one item';
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

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    handleChange('tags', formData.tags.filter(t => t !== tag));
  };

  const addItemToPool = (item, weight = 10, minQty = 1, maxQty = 1) => {
    const newEntry = {
      itemId: item.id,
      weight: weight,
      minQuantity: minQty,
      maxQuantity: maxQty
    };
    handleChange('entries', [...formData.entries, newEntry]);
    setShowAddItem(false);
    setSearchQuery('');
  };

  const updateEntry = (index, field, value) => {
    const newEntries = [...formData.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    handleChange('entries', newEntries);
  };

  const removeEntry = (index) => {
    handleChange('entries', formData.entries.filter((_, i) => i !== index));
  };

  const getTierColor = (tier) => {
    const colors = {
      common: '#888',
      uncommon: '#0f0',
      rare: '#0af',
      epic: '#c0f',
      legendary: '#fa0'
    };
    return colors[tier] || '#888';
  };

  const filteredItems = items.filter(item => {
    const alreadyInPool = formData.entries.some(e => e.itemId === item.id);
    if (alreadyInPool) return false;
    
    if (!searchQuery) return true;
    
    return item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.category?.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            {pool ? 'Edit Loot Pool' : 'Create Loot Pool'}
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
                  placeholder="asteroid_mining"
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
                  placeholder="Asteroid Mining Loot"
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
                  placeholder="Loot dropped from mining asteroids..."
                  rows={3}
                  style={{ resize: 'vertical', minHeight: '60px' }}
                />
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
                    placeholder="mining, common..."
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
                      <span onClick={() => removeTag(tag)} style={{ cursor: 'pointer', opacity: 0.7, fontSize: '1.1rem' }}>
                        ×
                      </span>
                    </div>
                  ))}
                </div>
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
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Items</div>
                  </div>
                  <div>
                    <div style={{ color: '#0ff', fontSize: '1.2rem', fontWeight: 'bold' }}>{totalWeight}</div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Total Weight</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Pool Items */}
          <div>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#0ff', fontSize: '1rem', margin: 0 }}>Pool Items</h3>
                <button
                  className="btn-neon btn-neon-primary"
                  onClick={() => setShowAddItem(!showAddItem)}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                >
                  <CreateIcon size={14} /> ADD ITEM
                </button>
              </div>

              {errors.entries && <div style={{ color: '#ff6b6b', fontSize: '0.85rem', marginBottom: '1rem' }}>{errors.entries}</div>}

              {/* Add Item Panel */}
              {showAddItem && (
                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(0, 255, 255, 0.05)',
                  border: '1px solid rgba(0, 255, 255, 0.2)',
                  borderRadius: '4px'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input-neon"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search items..."
                        style={{ paddingLeft: '2.5rem' }}
                      />
                      <SearchIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    </div>
                  </div>

                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredItems.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                        {searchQuery ? 'No items match search' : 'All items already in pool'}
                      </div>
                    )}
                    {filteredItems.map(item => (
                      <div
                        key={item.id}
                        style={{
                          padding: '0.75rem',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: `1px solid ${getTierColor(item.tier)}40`,
                          borderRadius: '4px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => addItemToPool(item)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: getTierColor(item.tier), fontSize: '0.9rem', fontWeight: 'bold' }}>
                              {item.name}
                            </div>
                            <div style={{ color: '#666', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                              {item.id}
                            </div>
                          </div>
                          <div style={{
                            padding: '0.2rem 0.5rem',
                            background: `${getTierColor(item.tier)}20`,
                            border: `1px solid ${getTierColor(item.tier)}`,
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            color: getTierColor(item.tier),
                            textTransform: 'uppercase'
                          }}>
                            {item.tier}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pool Entries List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {formData.entries.map((entry, index) => {
                  const item = items.find(i => i.id === entry.itemId);
                  const dropChance = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(1) : 0;
                  
                  return (
                    <div
                      key={index}
                      className="glass-card"
                      style={{
                        padding: '1rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: `1px solid ${getTierColor(item?.tier)}40`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: getTierColor(item?.tier), fontSize: '0.95rem', fontWeight: 'bold' }}>
                            {item?.name || entry.itemId}
                          </div>
                          <div style={{ color: '#666', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                            {entry.itemId}
                          </div>
                        </div>
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

                      {/* Weight and Quantity Controls */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                            Weight
                          </label>
                          <input
                            type="number"
                            className="input-neon"
                            value={entry.weight}
                            onChange={(e) => updateEntry(index, 'weight', parseInt(e.target.value) || 0)}
                            min="0"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                          />
                          <div style={{ fontSize: '0.65rem', color: '#0ff', marginTop: '0.25rem' }}>
                            {dropChance}% chance
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                            Min Qty
                          </label>
                          <input
                            type="number"
                            className="input-neon"
                            value={entry.minQuantity}
                            onChange={(e) => updateEntry(index, 'minQuantity', parseInt(e.target.value) || 1)}
                            min="1"
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
                            Max Qty
                          </label>
                          <input
                            type="number"
                            className="input-neon"
                            value={entry.maxQuantity}
                            onChange={(e) => updateEntry(index, 'maxQuantity', parseInt(e.target.value) || 1)}
                            min={entry.minQuantity}
                            style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {formData.entries.length === 0 && !showAddItem && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                  <div style={{ fontSize: '0.9rem' }}>No items in this pool yet</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click "ADD ITEM" to get started</div>
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
