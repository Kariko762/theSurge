import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, SearchIcon, FilterIcon, WarningIcon } from './HoloIcons';
import ConfirmModal from './modals/ConfirmModal';
import '../../styles/AdminGlass.css';

export default function MarketplaceManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [editingCell, setEditingCell] = useState(null); // { itemId, field }
  const [editValue, setEditValue] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showPricingIssues, setShowPricingIssues] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const allItems = await api.items.getAll();
      setItems(allItems || []);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'weapon', 'subsystem', 'resource', 'consumable', 'equipment', 'artifact'];
  const tiers = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

  const startEdit = (itemId, field, currentValue) => {
    setEditingCell({ itemId, field });
    setEditValue(currentValue?.toString() || '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingCell) return;
    
    const { itemId, field } = editingCell;
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    try {
      setSaving(true);
      const updatedItem = { ...item };
      
      // Parse value based on field type
      if (field === 'value') {
        updatedItem.value = parseInt(editValue) || 0;
      } else {
        updatedItem[field] = editValue;
      }

      await api.items.update(item.category, itemId, updatedItem);
      
      // Update local state
      setItems(items.map(i => i.id === itemId ? updatedItem : i));
      cancelEdit();
    } catch (err) {
      console.error('Failed to save item:', err);
      setError('Failed to save changes: ' + err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Calculate suggested price based on tier and category
  const getSuggestedPrice = (item) => {
    const basePrice = getCategoryBasePrice(item.category);
    const multiplier = getTierMultiplier(item.tier);
    
    return Math.round(basePrice * multiplier);
  };

  // Get category base price
  const getCategoryBasePrice = (category) => {
    const categoryBasePrices = {
      weapon: 500,
      subsystem: 400,
      equipment: 300,
      resource: 50,
      consumable: 100,
      artifact: 2000
    };
    return categoryBasePrices[category] || 100;
  };

  // Get tier multiplier
  const getTierMultiplier = (tier) => {
    const tierMultipliers = {
      common: 1,
      uncommon: 2.5,
      rare: 6,
      epic: 15,
      legendary: 40
    };
    return tierMultipliers[tier] || 1;
  };

  // Find pricing inconsistencies
  const getPricingIssue = (item) => {
    const suggested = getSuggestedPrice(item);
    const actual = item.value || 0;
    const difference = ((actual - suggested) / suggested) * 100;

    if (Math.abs(difference) > 50) {
      return {
        severity: 'high',
        message: `${difference > 0 ? '+' : ''}${difference.toFixed(0)}% vs suggested (${suggested})`
      };
    } else if (Math.abs(difference) > 25) {
      return {
        severity: 'medium',
        message: `${difference > 0 ? '+' : ''}${difference.toFixed(0)}% vs suggested (${suggested})`
      };
    }
    return null;
  };

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'value') {
      aVal = a.value || 0;
      bVal = b.value || 0;
    }

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Filter items
  const filteredItems = sortedItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesTier = filterTier === 'all' || item.tier === filterTier;
    
    const matchesPricingIssue = !showPricingIssues || getPricingIssue(item);

    return matchesSearch && matchesCategory && matchesTier && matchesPricingIssue;
  });

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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate statistics
  const stats = {
    totalItems: items.length,
    totalValue: items.reduce((sum, i) => sum + (i.value || 0), 0),
    avgValue: items.length > 0 ? Math.round(items.reduce((sum, i) => sum + (i.value || 0), 0) / items.length) : 0,
    pricingIssues: items.filter(i => getPricingIssue(i)).length
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <div style={{ color: '#0cf', fontSize: '1.2rem' }}>Loading marketplace...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Error Notification */}
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          background: 'rgba(255, 100, 100, 0.2)',
          border: '1px solid #f66',
          borderRadius: '4px',
          color: '#f66',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <WarningIcon size={20} />
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--neon-cyan)', marginBottom: '0.5rem' }}>💰 Marketplace Manager</h2>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>
          View and balance item pricing across all categories
        </p>
      </div>

      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.4)' }}>
          <div style={{ color: '#888', fontSize: '0.8rem' }}>Total Items</div>
          <div style={{ color: '#0cf', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalItems}</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.4)' }}>
          <div style={{ color: '#888', fontSize: '0.8rem' }}>Total Market Value</div>
          <div style={{ color: '#0f0', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.totalValue.toLocaleString()}¢</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.4)' }}>
          <div style={{ color: '#888', fontSize: '0.8rem' }}>Average Price</div>
          <div style={{ color: '#fa0', fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.avgValue.toLocaleString()}¢</div>
        </div>
        <div className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 20, 40, 0.4)' }}>
          <div style={{ color: '#888', fontSize: '0.8rem' }}>Pricing Issues</div>
          <div style={{ color: stats.pricingIssues > 0 ? '#f66' : '#0f0', fontSize: '1.5rem', fontWeight: 'bold' }}>
            {stats.pricingIssues}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', position: 'relative' }}>
          <SearchIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items..."
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem 0.6rem 2.5rem',
              background: 'rgba(0, 20, 40, 0.5)',
              border: '1px solid var(--glass-border)',
              borderRadius: '4px',
              color: '#fff'
            }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '0.6rem',
            background: 'rgba(0, 20, 40, 0.5)',
            border: '1px solid var(--glass-border)',
            borderRadius: '4px',
            color: '#fff'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          style={{
            padding: '0.6rem',
            background: 'rgba(0, 20, 40, 0.5)',
            border: '1px solid var(--glass-border)',
            borderRadius: '4px',
            color: '#fff'
          }}
        >
          {tiers.map(tier => (
            <option key={tier} value={tier}>
              {tier === 'all' ? 'All Tiers' : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#aaa', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showPricingIssues}
            onChange={(e) => setShowPricingIssues(e.target.checked)}
          />
          Show Pricing Issues Only
        </label>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--neon-cyan)' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#0cf', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                Item Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#0cf', cursor: 'pointer' }} onClick={() => handleSort('category')}>
                Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'left', color: '#0cf', cursor: 'pointer' }} onClick={() => handleSort('tier')}>
                Tier {sortField === 'tier' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right', color: '#0cf', cursor: 'pointer' }} onClick={() => handleSort('value')}>
                Price {sortField === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'right', color: '#0cf' }}>
                Suggested Price
              </th>
              <th style={{ padding: '0.75rem', textAlign: 'center', color: '#0cf' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => {
              const suggested = getSuggestedPrice(item);
              const issue = getPricingIssue(item);
              const isEditingPrice = editingCell?.itemId === item.id && editingCell?.field === 'value';

              return (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: issue ? 'rgba(255, 100, 100, 0.1)' : 'transparent'
                  }}
                >
                  <td style={{ padding: '0.75rem', color: '#fff' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ color: '#666', fontSize: '0.75rem' }}>{item.id}</div>
                  </td>
                  <td style={{ padding: '0.75rem', color: '#aaa' }}>
                    {item.category}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{ color: getTierColor(item.tier), fontWeight: 'bold' }}>
                      {item.tier}
                    </span>
                  </td>
                  <td
                    style={{ padding: '0.75rem', textAlign: 'right', cursor: 'pointer' }}
                    onClick={() => !isEditingPrice && startEdit(item.id, 'value', item.value)}
                  >
                    {isEditingPrice ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                        style={{
                          width: '100px',
                          padding: '0.25rem',
                          background: 'rgba(0, 255, 255, 0.1)',
                          border: '1px solid var(--neon-cyan)',
                          borderRadius: '3px',
                          color: '#0f0',
                          textAlign: 'right'
                        }}
                      />
                    ) : (
                      <span style={{ color: '#0f0', fontWeight: 'bold' }}>
                        {(item.value || 0).toLocaleString()}¢
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', color: '#fa0' }}>
                    {suggested.toLocaleString()}¢
                  </td>
                  <td 
                    style={{ 
                      padding: '0.75rem', 
                      textAlign: 'center',
                      cursor: 'help'
                    }}
                    title={issue 
                      ? `Current Price: ${item.value}¢\nSuggested Price: ${suggested}¢\nVariance: ${issue.message}\n\nReason: ${issue.severity === 'high' 
                          ? `Price is off by more than 50% from suggested value. Consider adjusting to match tier/category balance.`
                          : `Price is off by more than 25% from suggested value. Minor adjustment may improve market balance.`}\n\nSuggested pricing formula:\nCategory Base × Tier Multiplier\n${item.category}: ${getCategoryBasePrice(item.category)}¢ × ${getTierMultiplier(item.tier)} = ${suggested}¢`
                      : `Current Price: ${item.value}¢\nSuggested Price: ${suggested}¢\n\nPrice matches suggested value for ${item.tier} ${item.category}.`
                    }
                  >
                    {issue ? (
                      <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        background: issue.severity === 'high' ? 'rgba(255, 100, 100, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                        border: `1px solid ${issue.severity === 'high' ? '#f66' : '#fa0'}`,
                        borderRadius: '3px',
                        color: issue.severity === 'high' ? '#f66' : '#fa0',
                        fontSize: '0.75rem'
                      }}>
                        {issue.message}
                      </div>
                    ) : (
                      <span style={{ color: '#0f0', fontSize: '0.85rem' }}>✓ OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredItems.length === 0 && (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
          No items match your filters
        </div>
      )}
    </div>
  );
}
