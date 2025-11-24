import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { CreateIcon, EditIcon, DeleteIcon, SaveIcon, WarningIcon, SearchIcon, SuccessIcon, LoadingIcon } from './HoloIcons';
import ItemEditor from './forms/ItemEditor';
import LootPoolEditor from './forms/LootPoolEditor';
import ConfirmModal from './modals/ConfirmModal';
import '../../styles/AdminGlass.css';

export default function LootManager() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('items');
  const [items, setItems] = useState([]);
  const [lootPools, setLootPools] = useState([]);
  const [factions, setFactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSubcategory, setFilterSubcategory] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showItemEditor, setShowItemEditor] = useState(false);
  const [editingPool, setEditingPool] = useState(null);
  const [editingPoolIndex, setEditingPoolIndex] = useState(null);
  const [showPoolEditor, setShowPoolEditor] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [lootChanged, setLootChanged] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await api.config.get();
      const cfg = response.config || response;
      setConfig(cfg);
      
      // Only set items/pools/factions on initial load
      if (cfg?.lootTables?.items) {
        // Convert object to array if needed (PowerShell sometimes converts arrays to objects)
        let itemsData = cfg.lootTables.items;
        if (!Array.isArray(itemsData)) {
          itemsData = Object.values(itemsData);
        }
        setItems(itemsData);
      } else {
        setItems([]);
      }
      if (cfg?.lootTables?.pools) {
        let poolsData = cfg.lootTables.pools;
        if (!Array.isArray(poolsData)) {
          poolsData = Object.values(poolsData);
        }
        setLootPools(poolsData);
      } else {
        setLootPools([]);
      }
      if (cfg?.factions) {
        let factionsData = cfg.factions;
        if (!Array.isArray(factionsData)) {
          factionsData = Object.values(factionsData);
        }
        setFactions(factionsData);
      } else {
        setFactions([]);
      }
      
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      const response = await api.config.get();
      const updatedConfig = { 
        ...response.config, 
        lootTables: {
          ...(response.config.lootTables || {}),
          items,
          pools: lootPools
        }
      };
      await api.config.update(updatedConfig);
      
      setLootChanged(false);
      setSuccessMessage('Loot tables saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save loot tables');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['all', 'resource', 'weapon', 'subsystem', 'equipment', 'consumable', 'artifact', 'data', 'contraband'];
  const tiers = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSubcategory = filterSubcategory === 'all' || item.subcategory === filterSubcategory;
    const matchesTier = filterTier === 'all' || item.tier === filterTier;
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesTier;
  });

  // Get unique subcategories for current category
  const subcategories = ['all', ...new Set(
    items
      .filter(item => filterCategory === 'all' || item.category === filterCategory)
      .map(item => item.subcategory)
      .filter(Boolean)
  )];

  const openItemEditor = (item, index) => {
    setEditingItem(item);
    setEditingIndex(index);
    setShowItemEditor(true);
  };

  const saveItem = (itemData) => {
    let newItems;
    if (editingIndex !== null) {
      // Edit existing
      newItems = [...items];
      newItems[editingIndex] = itemData;
    } else {
      // Add new
      newItems = [...items, itemData];
    }
    
    setItems(newItems);
    setLootChanged(true);
    closeItemEditor();
  };

  const closeItemEditor = () => {
    setEditingItem(null);
    setEditingIndex(null);
    setShowItemEditor(false);
  };

  const openPoolEditor = (pool, index) => {
    setEditingPool(pool);
    setEditingPoolIndex(index);
    setShowPoolEditor(true);
  };

  const savePool = (poolData) => {
    let newPools;
    if (editingPoolIndex !== null) {
      newPools = [...lootPools];
      newPools[editingPoolIndex] = poolData;
    } else {
      newPools = [...lootPools, poolData];
    }
    
    setLootPools(newPools);
    setLootChanged(true);
    closePoolEditor();
  };

  const closePoolEditor = () => {
    setEditingPool(null);
    setEditingPoolIndex(null);
    setShowPoolEditor(false);
  };

  const confirmDelete = (item, index, type = 'item') => {
    setItemToDelete({ item, index, type });
    setShowDeleteConfirm(true);
  };

  const deleteItem = () => {
    if (itemToDelete !== null) {
      if (itemToDelete.type === 'pool') {
        const newPools = lootPools.filter((_, i) => i !== itemToDelete.index);
        setLootPools(newPools);
      } else {
        const newItems = items.filter((_, i) => i !== itemToDelete.index);
        setItems(newItems);
      }
      
      setLootChanged(true);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
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

  return (
    <div>
      {/* Unsaved Changes Warning */}
      {lootChanged && (
        <div className="glass-card" style={{
          padding: '0.75rem 1rem',
          margin: '1rem 2rem',
          marginBottom: '0.5rem',
          borderColor: 'rgba(255, 165, 0, 0.5)',
          background: 'rgba(255, 165, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <WarningIcon size={18} />
          <span style={{ color: '#ffa500', fontSize: '0.85rem', fontWeight: 'bold' }}>
            Warning - Don't forget to save the loot table! You have unsaved changes.
          </span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="glass-card" style={{
          padding: '0.75rem 1rem',
          margin: '1rem 2rem',
          marginBottom: '0.5rem',
          borderColor: 'rgba(0, 255, 136, 0.5)',
          background: 'rgba(0, 255, 136, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <SuccessIcon size={18} />
          <span style={{ color: '#00ff88', fontSize: '0.85rem' }}>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{
          padding: '0.75rem 1rem',
          margin: '1rem 2rem',
          marginBottom: '0.5rem',
          marginTop: successMessage ? '0' : '1rem',
          borderColor: 'rgba(255, 107, 107, 0.5)',
          background: 'rgba(255, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <WarningIcon size={18} />
          <span style={{ color: '#ff6b6b', fontSize: '0.85rem' }}>{error}</span>
        </div>
      )}

      {/* Save Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        margin: '1rem 2rem',
        marginBottom: '0.5rem'
      }}>
        <button
          className="btn-neon"
          onClick={handleSave}
          disabled={saving || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            opacity: (saving || loading) ? 0.5 : 1,
            borderColor: lootChanged ? '#ffa500' : undefined,
            animation: lootChanged ? 'pulse 2s infinite' : undefined
          }}
        >
          {saving ? <LoadingIcon size={16} /> : <SaveIcon size={16} />}
          {saving ? 'Saving...' : lootChanged ? 'Save Changes *' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="tab-container-sub2">
        <button
          className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
        >
          Items ({items.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('pools')}
        >
          Loot Pools ({lootPools.length})
        </button>
      </div>

      {/* ITEMS TAB */}
      {activeTab === 'items' && (
        <>
          {/* Compact Filter Bar */}
          <div className="glass-card" style={{ padding: '0.75rem 1rem', margin: '1rem 2rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              {/* Filters Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                {/* Search */}
                <div>
                  <input
                    type="text"
                    className="input-neon"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search items..."
                    style={{ 
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.8rem',
                      width: '100%'
                    }}
                  />
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    className="input-neon"
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setFilterSubcategory('all');
                    }}
                    style={{ 
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.8rem',
                      width: '100%'
                    }}
                  >
                    <option value="all">All Categories</option>
                    {categories.filter(c => c !== 'all').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory Filter */}
                <div>
                  <select
                    className="input-neon"
                    value={filterSubcategory}
                    onChange={(e) => setFilterSubcategory(e.target.value)}
                    disabled={subcategories.length <= 1}
                    style={{ 
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.8rem',
                      width: '100%',
                      opacity: subcategories.length <= 1 ? 0.5 : 1
                    }}
                  >
                    <option value="all">All Subcategories</option>
                    {subcategories.filter(s => s !== 'all').map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Tier Filter */}
                <div>
                  <select
                    className="input-neon"
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    style={{ 
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.8rem',
                      width: '100%'
                    }}
                  >
                    <option value="all">All Tiers</option>
                    {tiers.filter(t => t !== 'all').map(tier => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add Item Button */}
              <button
                className="btn-neon btn-neon-primary"
                onClick={() => openItemEditor(null, null)}
                style={{ 
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <CreateIcon size={14} /> Add Item
              </button>
            </div>

            {/* Item Count */}
            <div style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.75rem' }}>
              Showing {filteredItems.length} of {items.length} items
            </div>
          </div>

      {/* Items Grid */}
      {filteredItems.length === 0 && (
        <div className="glass-card" style={{
          padding: '3rem',
          textAlign: 'center',
          background: 'rgba(0, 20, 40, 0.3)',
          borderRadius: '8px',
          border: '1px dashed var(--glass-border)',
          margin: '0 2rem 2rem 2rem'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📦</div>
          <div style={{ color: '#888', fontSize: '1rem', marginBottom: '0.5rem' }}>
            {searchQuery || filterCategory !== 'all' || filterSubcategory !== 'all' || filterTier !== 'all' ? 'No items match filters' : 'No items in database'}
          </div>
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Click "Add Item" to create your first item
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem', margin: '0 2rem 2rem 2rem' }}>
        {filteredItems.map((item, index) => {
          const actualIndex = items.findIndex(i => i.id === item.id);
          return (
            <div
              key={item.id || index}
              className="glass-card"
              style={{
                padding: '1.5rem',
                background: 'rgba(0, 20, 40, 0.4)',
                border: `1px solid ${getTierColor(item.tier)}40`,
                position: 'relative',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => openItemEditor(item, actualIndex)}
            >
              {/* Tier Badge */}
              <div style={{
                position: 'absolute',
                top: '0.75rem',
                right: '0.75rem',
                padding: '0.25rem 0.75rem',
                background: `${getTierColor(item.tier)}20`,
                border: `1px solid ${getTierColor(item.tier)}`,
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                color: getTierColor(item.tier),
                textTransform: 'uppercase'
              }}>
                {item.tier || 'common'}
              </div>

              {/* Item Name */}
              <h4 style={{
                color: getTierColor(item.tier),
                fontSize: '1.1rem',
                marginBottom: '0.5rem',
                marginRight: '5rem'
              }}>
                {item.name || 'Unnamed Item'}
              </h4>

              {/* Item ID */}
              <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.75rem', fontFamily: 'monospace' }}>
                {item.id || 'no_id'}
              </div>

              {/* Category */}
              <div style={{
                display: 'inline-block',
                padding: '0.2rem 0.5rem',
                background: 'rgba(0, 255, 255, 0.1)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#0ff',
                marginBottom: '0.75rem'
              }}>
                {item.category || 'uncategorized'}
              </div>

              {/* Description */}
              <p style={{
                color: '#aaa',
                fontSize: '0.85rem',
                lineHeight: '1.5',
                marginBottom: '1rem',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {item.description || 'No description'}
              </p>

              {/* Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem',
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px'
              }}>
                <div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>Weight</div>
                  <div style={{ color: '#fff', fontSize: '0.85rem' }}>{item.weight || 0} kg</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>Size</div>
                  <div style={{ color: '#fff', fontSize: '0.85rem' }}>{item.size || 1}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>Max Stack</div>
                  <div style={{ color: '#fff', fontSize: '0.85rem' }}>{item.maxStack || 1}</div>
                </div>
                <div>
                  <div style={{ color: '#666', fontSize: '0.7rem' }}>Value</div>
                  <div style={{ color: '#0f0', fontSize: '0.85rem' }}>{item.value || 0} cr</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-neon"
                  onClick={(e) => {
                    e.stopPropagation();
                    openItemEditor(item, actualIndex);
                  }}
                  style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                >
                  <EditIcon size={14} /> EDIT
                </button>
                <button
                  className="btn-neon"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(item, actualIndex);
                  }}
                  style={{
                    flex: 1,
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
          );
        })}
      </div>
        </>
      )}

      {/* POOLS TAB */}
      {activeTab === 'pools' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--neon-cyan)', margin: 0, fontSize: '1.3rem' }}>
              Loot Pools
            </h3>
            <button
              className="btn-neon btn-neon-primary"
              onClick={() => openPoolEditor(null, null)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
            >
              <CreateIcon size={18} /> CREATE POOL
            </button>
          </div>

          {/* Pools List */}
          {lootPools.length === 0 && (
            <div className="glass-card" style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'rgba(0, 20, 40, 0.3)',
              borderRadius: '8px',
              border: '1px dashed var(--glass-border)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>🎲</div>
              <div style={{ color: '#888', fontSize: '1rem', marginBottom: '0.5rem' }}>
                No loot pools configured
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                Create pools to group items with weights and quantities for random loot drops
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '1rem' }}>
            {lootPools.map((pool, index) => (
              <div
                key={pool.id || index}
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  background: 'rgba(0, 20, 40, 0.4)',
                  border: '1px solid rgba(0, 255, 255, 0.3)',
                  cursor: 'pointer'
                }}
                onClick={() => openPoolEditor(pool, index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#0ff', fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                      {pool.name || 'Unnamed Pool'}
                    </h4>
                    <div style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                      {pool.id || 'no_id'}
                    </div>
                    {pool.description && (
                      <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '0' }}>
                        {pool.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-neon"
                      onClick={(e) => {
                        e.stopPropagation();
                        openPoolEditor(pool, index);
                      }}
                      style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem' }}
                    >
                      <EditIcon size={14} /> EDIT
                    </button>
                    <button
                      className="btn-neon"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(pool, index, 'pool');
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
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Items</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                      {Array.isArray(pool.entries) ? pool.entries.length : 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Total Weight</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                      {Array.isArray(pool.entries) ? pool.entries.reduce((sum, e) => sum + (e.weight || 0), 0) : 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666', fontSize: '0.7rem' }}>Tags</div>
                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                      {Array.isArray(pool.tags) ? pool.tags.length : 0}
                    </div>
                  </div>
                </div>

                {/* Pool Items Preview */}
                {Array.isArray(pool.entries) && pool.entries.length > 0 && (
                  <div>
                    <div style={{ color: '#666', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                      Items in this pool:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {pool.entries.slice(0, 5).map((entry, i) => {
                        const item = items.find(it => it.id === entry.itemId);
                        return (
                          <div
                            key={i}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: 'rgba(0, 255, 255, 0.1)',
                              border: '1px solid rgba(0, 255, 255, 0.3)',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: '#0ff'
                            }}
                          >
                            {item?.name || entry.itemId} ({entry.weight})
                          </div>
                        );
                      })}
                      {pool.entries.length > 5 && (
                        <div style={{ color: '#666', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          +{pool.entries.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Item Editor Modal */}
      {showItemEditor && (
        <ItemEditor
          item={editingItem}
          factions={factions}
          onSave={saveItem}
          onCancel={closeItemEditor}
        />
      )}

      {/* Pool Editor Modal */}
      {showPoolEditor && (
        <LootPoolEditor
          pool={editingPool}
          items={items}
          onSave={savePool}
          onCancel={closePoolEditor}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <ConfirmModal
          title={itemToDelete.type === 'pool' ? 'Delete Loot Pool' : 'Delete Item'}
          message={
            <div>
              <p style={{ marginBottom: '1rem' }}>
                Are you sure you want to delete this {itemToDelete.type === 'pool' ? 'loot pool' : 'item'}?
              </p>
              <div style={{
                padding: '1rem',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.3)',
                borderRadius: '4px'
              }}>
                <div style={{ color: getTierColor(itemToDelete.item.tier), fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {itemToDelete.item.name}
                </div>
                <div style={{ color: '#666', fontSize: '0.85rem', fontFamily: 'monospace', marginTop: '0.25rem' }}>
                  {itemToDelete.item.id}
                </div>
              </div>
              <p style={{ marginTop: '1rem', color: '#ff6b6b', fontSize: '0.9rem' }}>
                ⚠️ This action cannot be undone.
              </p>
            </div>
          }
          confirmText={itemToDelete.type === 'pool' ? 'DELETE POOL' : 'DELETE ITEM'}
          confirmDanger={true}
          onConfirm={deleteItem}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setItemToDelete(null);
          }}
        />
      )}
    </div>
  );
}
