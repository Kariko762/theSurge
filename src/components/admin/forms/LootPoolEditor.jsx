import { useState, useEffect } from 'react';
import { SaveIcon, CloseIcon, WarningIcon, CreateIcon, DeleteIcon, SearchIcon } from '../HoloIcons';
import '../../../styles/AdminGlass.css';

export default function LootPoolEditor({ pool, items, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    tags: [],
    grades: [], // NEW: Tiered containers
    entries: []
  });

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [activeTab, setActiveTab] = useState('base'); // 'base', 'entries', or 'containers'
  const [editingGrade, setEditingGrade] = useState(null);
  const [poolMode, setPoolMode] = useState('tags'); // 'manual' or 'tags'
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  useEffect(() => {
    if (pool) {
      const hasEntries = pool.entries && pool.entries.length > 0;
      setPoolMode(hasEntries ? 'manual' : 'tags');
      setFormData({
        id: pool.id || '',
        name: pool.name || '',
        description: pool.description || '',
        tags: pool.tags || [],
        grades: pool.grades || [],
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

    // Entries can be empty for tag-based generation (MODE 2)
    // No validation needed for entries

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

  // Grade management functions
  const createNewGrade = () => {
    const newGrade = {
      id: `grade_${Date.now()}`,
      displayName: 'New Container Grade',
      weight: 10,
      filters: {
        tiers: [],
        tags: []
      },
      guaranteedItems: [],
      rollSettings: {
        minItems: 2,
        maxItems: 4,
        bonusRolls: 0
      }
    };
    setEditingGrade(newGrade);
  };

  const saveGrade = (grade) => {
    const existingIndex = formData.grades.findIndex(g => g.id === grade.id);
    if (existingIndex >= 0) {
      const newGrades = [...formData.grades];
      newGrades[existingIndex] = grade;
      handleChange('grades', newGrades);
    } else {
      handleChange('grades', [...formData.grades, grade]);
    }
    setEditingGrade(null);
  };

  const deleteGrade = (gradeId) => {
    if (confirm('Delete this container grade?')) {
      handleChange('grades', formData.grades.filter(g => g.id !== gradeId));
    }
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

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '2px solid rgba(0, 255, 255, 0.2)'
        }}>
          <button
            onClick={() => setActiveTab('base')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'base' ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'base' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              color: activeTab === 'base' ? 'var(--neon-cyan)' : '#666',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'base' ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
          >
            📦 BASIC INFO
          </button>
          <button
            onClick={() => setActiveTab('entries')}
            disabled={poolMode === 'tags'}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'entries' ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'entries' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              color: activeTab === 'entries' ? 'var(--neon-cyan)' : '#666',
              cursor: poolMode === 'tags' ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'entries' ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              marginBottom: '-2px',
              opacity: poolMode === 'tags' ? 0.4 : 1
            }}
          >
            📋 MANUAL ITEMS ({formData.entries.length})
          </button>
          <button
            onClick={() => setActiveTab('containers')}
            style={{
              padding: '0.75rem 1.5rem',
              background: activeTab === 'containers' ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'containers' ? '2px solid var(--neon-cyan)' : '2px solid transparent',
              color: activeTab === 'containers' ? 'var(--neon-cyan)' : '#666',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: activeTab === 'containers' ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
          >
            ⭐ CONTAINERS ({formData.grades.length})
          </button>
        </div>

        {/* Tab Content */}
        <div>
        {activeTab === 'base' && (
        <div>
          <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 40, 80, 0.3)', maxWidth: '800px', margin: '0 auto' }}>
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

              {/* Pool Mode Toggle */}
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label>Pool Generation Mode</label>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px'
                }}>
                  <button
                    onClick={() => setPoolMode('manual')}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: poolMode === 'manual' ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
                      border: poolMode === 'manual' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: poolMode === 'manual' ? 'var(--neon-cyan)' : '#888',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: poolMode === 'manual' ? 'bold' : 'normal',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📋 Manual Item Pool
                  </button>
                  <button
                    onClick={() => {
                      if (poolMode === 'manual' && formData.entries.length > 0) {
                        setShowConfirmModal(true);
                      } else {
                        setPoolMode('tags');
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: poolMode === 'tags' ? 'rgba(0, 255, 255, 0.2)' : 'transparent',
                      border: poolMode === 'tags' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: poolMode === 'tags' ? 'var(--neon-cyan)' : '#888',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: poolMode === 'tags' ? 'bold' : 'normal',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🏷️ By Item Tag(s)
                  </button>
                </div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  {poolMode === 'manual' 
                    ? 'Pool uses specific items defined in Manual Items tab' 
                    : 'Pool generates items from database matching container filters (tier + tags)'}
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
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Manual Items</div>
                  </div>
                  <div>
                    <div style={{ color: '#0ff', fontSize: '1.2rem', fontWeight: 'bold' }}>{totalWeight}</div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Total Weight</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'entries' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <div>
            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 40, 80, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ color: '#0ff', fontSize: '1rem', margin: 0 }}>Manual Pool Items</h3>
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
        )}

        {activeTab === 'containers' && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#0ff', fontSize: '1.1rem', margin: 0 }}>Container Grades</h3>
                <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                  Define tiered containers with filters, guaranteed items, and presentation
                </p>
              </div>
              <button
                className="btn-neon btn-neon-primary"
                onClick={createNewGrade}
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <CreateIcon size={16} /> CREATE GRADE
              </button>
            </div>

            {/* Grades List */}
            {formData.grades.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(0, 40, 80, 0.3)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
                <div style={{ color: '#666', fontSize: '1rem', marginBottom: '0.5rem' }}>No container grades defined</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>
                  Container grades allow you to create tiered loot reveals (Grade-I, Grade-II, etc.)
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {formData.grades.map(grade => {
                  const totalGradeWeight = formData.grades.reduce((sum, g) => sum + g.weight, 0);
                  const dropChance = ((grade.weight / totalGradeWeight) * 100).toFixed(1);
                  
                  return (
                    <div
                      key={grade.id}
                      className="glass-card"
                      style={{
                        padding: '1.5rem',
                        background: 'rgba(0, 40, 80, 0.3)',
                        border: `2px solid ${grade.containerData.glowColor}`,
                        boxShadow: `0 0 20px ${grade.containerData.glowColor}40`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div>
                            <h4 style={{ color: '#0ff', margin: 0, fontSize: '1.1rem' }}>
                              {grade.displayName}
                            </h4>
                            <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                              {dropChance}% drop chance • {grade.rollSettings.minItems}-{grade.rollSettings.maxItems} items
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn-neon"
                            onClick={() => setEditingGrade({ ...grade })}
                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                          >
                            EDIT
                          </button>
                          <button
                            className="btn-neon"
                            onClick={() => deleteGrade(grade.id)}
                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', borderColor: '#ff6b6b', color: '#ff6b6b' }}
                          >
                            <DeleteIcon size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Grade Details */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.8rem' }}>
                        <div>
                          <div style={{ color: '#666', marginBottom: '0.25rem' }}>Tier Filters</div>
                          <div style={{ color: '#0ff' }}>
                            {grade.filters.tiers.length > 0 ? grade.filters.tiers.join(', ') : 'All tiers'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#666', marginBottom: '0.25rem' }}>Tag Filters</div>
                          <div style={{ color: '#0ff' }}>
                            {grade.filters.tags.length > 0 ? grade.filters.tags.join(', ') : 'No filters'}
                          </div>
                        </div>
                        <div>
                          <div style={{ color: '#666', marginBottom: '0.25rem' }}>Guaranteed Items</div>
                          <div style={{ color: '#fa0' }}>
                            {grade.guaranteedItems.length} item{grade.guaranteedItems.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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

        {/* GRADE EDITOR MODAL */}
        {editingGrade && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '3rem 1rem',
            zIndex: 1100,
            overflowY: 'auto'
          }}>
            <div className="glass-card" style={{
              width: '100%',
              maxWidth: '900px',
              padding: '2rem',
              background: 'rgba(0, 20, 40, 0.98)',
              border: '2px solid #0ff',
              boxShadow: '0 0 40px rgba(0, 255, 255, 0.6)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h3 style={{ color: '#0ff', margin: 0, fontSize: '1.3rem' }}>
                  {editingGrade.displayName}
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn-neon"
                    onClick={() => setEditingGrade(null)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    CANCEL
                  </button>
                  <button
                    className="btn-neon btn-neon-primary"
                    onClick={() => saveGrade(editingGrade)}
                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                  >
                    <SaveIcon size={16} /> SAVE GRADE
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Basic Info */}
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 40, 80, 0.3)' }}>
                    <h4 style={{ color: '#0ff', fontSize: '0.9rem', marginBottom: '1rem' }}>Basic Information</h4>
                    
                    <div className="form-group">
                      <label>Display Name</label>
                      <input
                        type="text"
                        className="input-neon"
                        value={editingGrade.displayName}
                        onChange={(e) => setEditingGrade({ ...editingGrade, displayName: e.target.value })}
                        placeholder="GRADE-I MILITARY CONTAINER"
                      />
                    </div>

                    <div className="form-group">
                      <label>Drop Weight</label>
                      <input
                        type="number"
                        className="input-neon"
                        value={editingGrade.weight}
                        onChange={(e) => setEditingGrade({ ...editingGrade, weight: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Higher weight = more likely to drop
                      </div>
                    </div>
                  </div>

                  {/* Roll Settings */}
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 40, 80, 0.3)' }}>
                    <h4 style={{ color: '#0ff', fontSize: '0.9rem', marginBottom: '1rem' }}>🎲 Roll Settings</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Min Items</label>
                        <input
                          type="number"
                          className="input-neon"
                          value={editingGrade.rollSettings.minItems}
                          onChange={(e) => setEditingGrade({
                            ...editingGrade,
                            rollSettings: { ...editingGrade.rollSettings, minItems: parseInt(e.target.value) || 1 }
                          })}
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Max Items</label>
                        <input
                          type="number"
                          className="input-neon"
                          value={editingGrade.rollSettings.maxItems}
                          onChange={(e) => setEditingGrade({
                            ...editingGrade,
                            rollSettings: { ...editingGrade.rollSettings, maxItems: parseInt(e.target.value) || 1 }
                          })}
                          min={editingGrade.rollSettings.minItems}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Bonus Rolls</label>
                      <input
                        type="number"
                        className="input-neon"
                        value={editingGrade.rollSettings.bonusRolls}
                        onChange={(e) => setEditingGrade({
                          ...editingGrade,
                          rollSettings: { ...editingGrade.rollSettings, bonusRolls: parseInt(e.target.value) || 0 }
                        })}
                        min="0"
                      />
                      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Extra chances to add more items
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Tier Filters */}
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 40, 80, 0.3)' }}>
                    <h4 style={{ color: '#0ff', fontSize: '0.9rem', marginBottom: '1rem' }}>🎯 Tier Filters</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      {['common', 'uncommon', 'rare', 'epic', 'legendary'].map(tier => (
                        <label key={tier} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem',
                          background: editingGrade.filters.tiers.includes(tier) ? `${getTierColor(tier)}20` : 'rgba(0, 0, 0, 0.3)',
                          border: `1px solid ${editingGrade.filters.tiers.includes(tier) ? getTierColor(tier) : 'var(--glass-border)'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: getTierColor(tier)
                        }}>
                          <input
                            type="checkbox"
                            checked={editingGrade.filters.tiers.includes(tier)}
                            onChange={(e) => {
                              const newTiers = e.target.checked
                                ? [...editingGrade.filters.tiers, tier]
                                : editingGrade.filters.tiers.filter(t => t !== tier);
                              setEditingGrade({
                                ...editingGrade,
                                filters: { ...editingGrade.filters, tiers: newTiers }
                              });
                            }}
                          />
                          {tier}
                        </label>
                      ))}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                      Only items matching these tiers will be included
                    </div>
                  </div>

                  {/* Tag Filters */}
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 40, 80, 0.3)' }}>
                    <h4 style={{ color: '#0ff', fontSize: '0.9rem', marginBottom: '1rem' }}>🏷️ Tag Filters</h4>
                    <div className="form-group">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          className="input-neon"
                          placeholder="military, weapon..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              const tag = e.target.value.trim();
                              if (!editingGrade.filters.tags.includes(tag)) {
                                setEditingGrade({
                                  ...editingGrade,
                                  filters: { ...editingGrade.filters, tags: [...editingGrade.filters.tags, tag] }
                                });
                              }
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.75rem' }}>
                      {editingGrade.filters.tags.map(tag => (
                        <div
                          key={tag}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: 'rgba(0, 255, 255, 0.1)',
                            border: '1px solid rgba(0, 255, 255, 0.3)',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#0ff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          {tag}
                          <span
                            onClick={() => setEditingGrade({
                              ...editingGrade,
                              filters: { ...editingGrade.filters, tags: editingGrade.filters.tags.filter(t => t !== tag) }
                            })}
                            style={{ cursor: 'pointer', opacity: 0.7, fontSize: '1.1rem' }}
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                      Only items with these tags will be included
                    </div>
                  </div>

                  {/* Guaranteed Items */}
                  <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 40, 80, 0.3)' }}>
                    <h4 style={{ color: '#fa0', fontSize: '0.9rem', marginBottom: '1rem' }}>⭐ Guaranteed Items</h4>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '1rem' }}>
                      These items will ALWAYS appear in this container
                    </div>
                    
                    {editingGrade.guaranteedItems.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontSize: '0.85rem' }}>
                        No guaranteed items yet
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {editingGrade.guaranteedItems.map((gi, index) => {
                          const item = items.find(i => i.id === gi.itemId);
                          return (
                            <div
                              key={index}
                              style={{
                                padding: '0.5rem',
                                background: 'rgba(255, 170, 0, 0.1)',
                                border: '1px solid rgba(255, 170, 0, 0.3)',
                                borderRadius: '4px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem'
                              }}
                            >
                              <div>
                                <div style={{ color: getTierColor(item?.tier) }}>{item?.name || gi.itemId}</div>
                                <div style={{ color: '#666', fontSize: '0.7rem' }}>Qty: {gi.quantity}</div>
                              </div>
                              <button
                                className="btn-neon"
                                onClick={() => setEditingGrade({
                                  ...editingGrade,
                                  guaranteedItems: editingGrade.guaranteedItems.filter((_, i) => i !== index)
                                })}
                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderColor: '#ff6b6b', color: '#ff6b6b' }}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div style={{ marginTop: '1rem' }}>
                      <select
                        className="input-neon"
                        onChange={(e) => {
                          if (e.target.value) {
                            const itemId = e.target.value;
                            if (!editingGrade.guaranteedItems.some(gi => gi.itemId === itemId)) {
                              setEditingGrade({
                                ...editingGrade,
                                guaranteedItems: [...editingGrade.guaranteedItems, { itemId, quantity: 1 }]
                              });
                            }
                            e.target.value = '';
                          }
                        }}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <option value="">+ Add guaranteed item</option>
                        {items.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.tier})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
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
          zIndex: 10000
        }}>
          <div className="glass-card" style={{
            padding: '2rem',
            maxWidth: '500px',
            background: 'rgba(0, 20, 40, 0.95)',
            border: '1px solid rgba(255, 107, 107, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <WarningIcon size={32} color="#ff6b6b" />
              <h3 style={{ color: '#ff6b6b', margin: 0 }}>Switch to Tag-Based Mode?</h3>
            </div>
            <p style={{ color: '#ccc', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              This will clear all {formData.entries.length} manual item{formData.entries.length !== 1 ? 's' : ''} from this pool. 
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="btn-neon"
                onClick={() => setShowConfirmModal(false)}
                style={{ borderColor: '#666', color: '#666' }}
              >
                CANCEL
              </button>
              <button
                className="btn-neon"
                onClick={() => {
                  setPoolMode('tags');
                  setFormData(prev => ({ ...prev, entries: [] }));
                  setShowConfirmModal(false);
                }}
                style={{ borderColor: '#ff6b6b', color: '#ff6b6b' }}
              >
                CLEAR & SWITCH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
