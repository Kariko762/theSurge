import { useState, useEffect } from 'react';
import { CreateIcon, EditIcon, DeleteIcon, SearchIcon } from './HoloIcons';
import NarrativePoolEditor from './forms/NarrativePoolEditor';
import ConfirmModal from './modals/ConfirmModal';
import '../../styles/AdminGlass.css';

export default function NarrativeLibrary({ config, updateConfig }) {
  const [pools, setPools] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingPool, setEditingPool] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showPoolEditor, setShowPoolEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [poolToDelete, setPoolToDelete] = useState(null);

  useEffect(() => {
    if (config?.narrativeLibrary?.pools) {
      setPools(config.narrativeLibrary.pools);
    }
  }, [config]);

  const categories = ['all', 'mining', 'exploration', 'combat', 'station', 'trade', 'discovery', 'hazard'];

  const filteredPools = pools.filter(pool => {
    const matchesSearch = !searchQuery || 
      pool.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pool.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || pool.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const openPoolEditor = (pool, index) => {
    setEditingPool(pool);
    setEditingIndex(index);
    setShowPoolEditor(true);
  };

  const savePool = (poolData) => {
    let newPools;
    if (editingIndex !== null) {
      newPools = [...pools];
      newPools[editingIndex] = poolData;
    } else {
      newPools = [...pools, poolData];
    }
    
    setPools(newPools);
    updateConfig('narrativeLibrary.pools', newPools);
    closePoolEditor();
  };

  const closePoolEditor = () => {
    setEditingPool(null);
    setEditingIndex(null);
    setShowPoolEditor(false);
  };

  const confirmDelete = (pool, index) => {
    setPoolToDelete({ pool, index });
    setShowDeleteConfirm(true);
  };

  const deletePool = () => {
    if (poolToDelete !== null) {
      const newPools = pools.filter((_, i) => i !== poolToDelete.index);
      setPools(newPools);
      updateConfig('narrativeLibrary.pools', newPools);
      setShowDeleteConfirm(false);
      setPoolToDelete(null);
    }
  };

  const getToneColor = (tone) => {
    const colors = {
      positive: '#0f0',
      neutral: '#888',
      negative: '#ff6b6b',
      warning: '#fa0',
      danger: '#f00',
      mysterious: '#c0f',
      excited: '#0ff',
      eerie: '#66f',
      tense: '#f80',
      curious: '#0af',
      urgent: '#ff0'
    };
    return colors[tone] || '#888';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.3rem' }}>
          Narrative Library
        </h3>
        <button
          className="btn-neon btn-neon-primary"
          onClick={() => openPoolEditor(null, null)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
        >
          <CreateIcon size={18} /> CREATE POOL
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          {/* Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Search Narrative Pools</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-neon"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or description..."
                style={{ paddingLeft: '2.5rem' }}
              />
              <SearchIcon size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            </div>
          </div>

          {/* Category Filter */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Category</label>
            <select
              className="input-neon"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '1rem', color: '#888', fontSize: '0.85rem' }}>
          Showing {filteredPools.length} of {pools.length} narrative pools
        </div>
      </div>

      {/* Empty State */}
      {filteredPools.length === 0 && (
        <div className="glass-card" style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'rgba(0, 20, 40, 0.3)',
          borderRadius: '8px',
          border: '1px dashed var(--glass-border)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📖</div>
          <div style={{ color: '#888', fontSize: '1rem', marginBottom: '0.5rem' }}>
            {searchQuery || filterCategory !== 'all' ? 'No pools match filters' : 'No narrative pools'}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Create pools to reuse weighted narrative variations across multiple events
          </div>
        </div>
      )}

      {/* Pools Grid */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredPools.map((pool, index) => {
          const actualIndex = pools.findIndex(p => p.id === pool.id);
          const totalWeight = pool.entries?.reduce((sum, e) => sum + (e.weight || 0), 0) || 0;
          
          return (
            <div
              key={pool.id || index}
              className="glass-card"
              style={{
                padding: '1.5rem',
                background: 'rgba(0, 20, 40, 0.4)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                cursor: 'pointer'
              }}
              onClick={() => openPoolEditor(pool, actualIndex)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ color: '#0ff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                    {pool.name || 'Unnamed Pool'}
                  </h4>
                  <div style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                    {pool.id || 'no_id'}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(0, 255, 255, 0.1)',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#0ff',
                    marginBottom: '0.5rem'
                  }}>
                    {pool.category || 'uncategorized'}
                  </div>
                  {pool.description && (
                    <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '0', marginTop: '0.5rem' }}>
                      {pool.description}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn-neon"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPoolEditor(pool, actualIndex);
                    }}
                    style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                  >
                    <EditIcon size={14} /> EDIT
                  </button>
                  <button
                    className="btn-neon"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(pool, actualIndex);
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.4rem 0.75rem',
                      borderColor: '#ff6b6b',
                      color: '#ff6b6b'
                    }}
                  >
                    <DeleteIcon size={14} /> DELETE
                  </button>
                </div>
              </div>

              {/* Pool Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>Narratives</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>{pool.entries?.length || 0}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>Total Weight</div>
                  <div style={{ color: '#fff', fontSize: '0.9rem' }}>{totalWeight}</div>
                </div>
              </div>

              {/* Preview Narratives */}
              {pool.entries && pool.entries.length > 0 && (
                <div>
                  <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    Narrative variations:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {pool.entries.slice(0, 3).map((entry, i) => {
                      const dropChance = totalWeight > 0 ? ((entry.weight / totalWeight) * 100).toFixed(0) : 0;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid ${getToneColor(entry.tone)}40`,
                            borderRadius: '4px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <div style={{ color: getToneColor(entry.tone), fontSize: '0.85rem', fontWeight: 'bold' }}>
                              {entry.title}
                            </div>
                            <div style={{ color: '#0ff', fontSize: '0.7rem' }}>
                              {dropChance}%
                            </div>
                          </div>
                          <div style={{ color: '#aaa', fontSize: '0.75rem', lineHeight: '1.4' }}>
                            {entry.message?.substring(0, 100)}{entry.message?.length > 100 ? '...' : ''}
                          </div>
                        </div>
                      );
                    })}
                    {pool.entries.length > 3 && (
                      <div style={{ color: '#666', fontSize: '0.75rem', textAlign: 'center', padding: '0.5rem' }}>
                        +{pool.entries.length - 3} more narratives
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pool Editor Modal */}
      {showPoolEditor && (
        <NarrativePoolEditor
          pool={editingPool}
          onSave={savePool}
          onCancel={closePoolEditor}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && poolToDelete && (
        <ConfirmModal
          title="Delete Narrative Pool"
          message={
            <div>
              <p style={{ marginBottom: '1rem' }}>Are you sure you want to delete this narrative pool?</p>
              <div style={{
                padding: '1rem',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '4px'
              }}>
                <div style={{ color: '#0ff', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {poolToDelete.pool.name}
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                  {poolToDelete.pool.id}
                </div>
                <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {poolToDelete.pool.entries?.length || 0} narrative variations
                </div>
              </div>
              <p style={{ marginTop: '1rem', color: '#ff6b6b', fontSize: '0.9rem' }}>
                ⚠️ This action cannot be undone.
              </p>
            </div>
          }
          confirmText="DELETE POOL"
          confirmDanger={true}
          onConfirm={deletePool}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setPoolToDelete(null);
          }}
        />
      )}
    </div>
  );
}
