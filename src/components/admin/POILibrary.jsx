import React, { useState, useEffect } from 'react';
import '../../styles/AdminCompact.css';

const POI_TYPES = [
  { id: 'PLANET', name: 'Planet', icon: '🌍', canHaveChildren: true },
  { id: 'MOON', name: 'Moon', icon: '🌙', canHaveChildren: false },
  { id: 'BELT', name: 'Asteroid Belt', icon: '☄️', canHaveChildren: true },
  { id: 'STATION', name: 'Station', icon: '🛰️', canHaveChildren: false },
  { id: 'HABITAT', name: 'Habitat', icon: '🏠', canHaveChildren: true },
  { id: 'ANOMALY', name: 'Anomaly', icon: '❓', canHaveChildren: false },
  { id: 'CONFLICT', name: 'Conflict Zone', icon: '⚔️', canHaveChildren: false },
  { id: 'DISTRESS', name: 'Distress Beacon', icon: '🆘', canHaveChildren: false },
  { id: 'FACILITY', name: 'Facility', icon: '🏭', canHaveChildren: false },
  { id: 'NEBULA', name: 'Nebula', icon: '🌫️', canHaveChildren: false },
  { id: 'WAKE', name: 'Wake Signature', icon: '💨', canHaveChildren: false }
];

const POILibrary = () => {
  const [pois, setPOIs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterParent, setFilterParent] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load POIs from backend
  useEffect(() => {
    loadPOIs();
  }, []);

  const loadPOIs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3002/api/poi-library');
      const data = await response.json();
      if (data.success) {
        if (data.pois.length === 0) {
          // Initialize with defaults if empty
          await initializeDefaultPOIs();
        } else {
          setPOIs(data.pois);
        }
      }
    } catch (error) {
      console.error('Failed to load POI library:', error);
      alert('Failed to load POI library from server');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultPOIs = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/poi-library/initialize', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setPOIs(data.pois);
      }
    } catch (error) {
      console.error('Failed to initialize POI library:', error);
    }
  };

  const createPOI = async (poiData) => {
    try {
      const response = await fetch('http://localhost:3002/api/poi-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poiData)
      });
      const data = await response.json();
      if (data.success) {
        setPOIs([...pois, data.poi]);
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Failed to create POI:', error);
      alert('Failed to create POI');
    }
  };

  const updatePOI = async (id, updates) => {
    try {
      const response = await fetch(`http://localhost:3002/api/poi-library/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (data.success) {
        setPOIs(pois.map(poi => poi.id === id ? data.poi : poi));
        setEditingPOI(null);
      }
    } catch (error) {
      console.error('Failed to update POI:', error);
      alert('Failed to update POI');
    }
  };

  const deletePOI = async (id) => {
    if (!confirm('Delete this POI? This will also remove it as a parent from any child POIs.')) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:3002/api/poi-library/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        await loadPOIs(); // Reload to get updated parent references
      }
    } catch (error) {
      console.error('Failed to delete POI:', error);
      alert('Failed to delete POI');
    }
  };

  const duplicatePOI = (poi) => {
    const duplicate = {
      ...poi,
      id: `POI_${poi.type}_${Date.now()}`,
      name: `${poi.name} (Copy)`
    };
    savePOIs([...pois, duplicate]);
  };

  const exportPOIs = () => {
    const dataStr = JSON.stringify(pois, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'poi_library.json';
    link.click();
  };

  const importPOIs = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (Array.isArray(imported)) {
          if (confirm(`Import ${imported.length} POIs? This will replace existing POIs.`)) {
            savePOIs(imported);
          }
        }
      } catch (error) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const filteredPOIs = pois.filter(poi => {
    if (filterType !== 'ALL' && poi.type !== filterType) return false;
    if (filterParent !== 'ALL') {
      const parentIds = poi.parentIds || (poi.parentId ? [poi.parentId] : []);
      if (filterParent === 'NONE' && parentIds.length > 0) return false;
      if (filterParent !== 'NONE' && !parentIds.includes(filterParent)) return false;
    }
    if (searchQuery && !poi.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !poi.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const parentPOIs = pois.filter(p => p.isParent === true);

  if (loading) {
    return (
      <div className="digital-grid-bg" style={{ 
        padding: '1rem',
        minHeight: '100vh',
        color: '#cfd8df',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#34e0ff', fontSize: '0.9rem' }}>Loading POI Library...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '1rem',
      minHeight: '100vh',
      color: '#cfd8df',
      background: 'transparent'
    }}>
      {/* Filters and Actions */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '150px 150px 200px auto',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.75rem',
        background: 'rgba(0, 255, 255, 0.1)',
        borderRadius: '4px',
        border: '1px solid rgba(0, 255, 255, 0.1)',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ fontSize: '0.65rem', color: '#34e0ff', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.3rem' }}>
            Type
          </label>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              width: '100%',
              padding: '0.4rem 0.6rem',
              background: 'rgba(0, 10, 20, 0.8)',
              border: '1px solid rgba(52, 224, 255, 0.3)',
              borderRadius: '4px',
              color: '#cfd8df',
              fontSize: '0.75rem'
            }}
          >
            <option value="ALL">All Types</option>
            {POI_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.65rem', color: '#34e0ff', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.3rem' }}>
            Parent
          </label>
          <select 
            value={filterParent}
            onChange={(e) => setFilterParent(e.target.value)}
            style={{
              width: '100%',
              padding: '0.4rem 0.6rem',
              background: 'rgba(0, 10, 20, 0.8)',
              border: '1px solid rgba(52, 224, 255, 0.3)',
              borderRadius: '4px',
              color: '#cfd8df',
              fontSize: '0.75rem'
            }}
          >
            <option value="ALL">All</option>
            <option value="NONE">No Parent</option>
            {parentPOIs.map(poi => (
              <option key={poi.id} value={poi.id}>{poi.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.65rem', color: '#34e0ff', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.3rem' }}>
            Search
          </label>
          <input 
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.4rem 0.6rem',
              background: 'rgba(0, 10, 20, 0.8)',
              border: '1px solid rgba(52, 224, 255, 0.3)',
              borderRadius: '4px',
              color: '#cfd8df',
              fontSize: '0.75rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button
            className="btn-compact"
            onClick={() => setIsCreating(true)}
            style={{
              background: 'rgba(52, 224, 255, 0.15)',
              border: '1px solid rgba(52, 224, 255, 0.4)',
              color: '#34e0ff',
              cursor: 'pointer',
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: '700',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            + Create POI
          </button>
          <button
            className="btn-compact"
            onClick={exportPOIs}
            style={{
              background: 'rgba(0, 204, 255, 0.1)',
              border: '1px solid rgba(0, 204, 255, 0.3)',
              color: '#00ccff',
              cursor: 'pointer',
              padding: '0.3rem 0.8rem',
              borderRadius: '4px',
              fontSize: '0.7rem',
              whiteSpace: 'nowrap'
            }}
          >
            Export
          </button>
          <label style={{
            background: 'rgba(0, 204, 255, 0.1)',
            border: '1px solid rgba(0, 204, 255, 0.3)',
            color: '#00ccff',
            cursor: 'pointer',
            padding: '0.3rem 0.8rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            whiteSpace: 'nowrap'
          }}>
            Import
            <input type="file" accept=".json" onChange={importPOIs} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* POI Table */}
      <div style={{
        background: 'rgba(0, 255, 255, 0.05)',
        borderRadius: '4px',
        border: '1px solid rgba(0, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        <table className="data-table-compact" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: 'transparent', border: 'none' }}>
        <thead>
          <tr style={{ background: 'rgba(0, 255, 255, 0.08)' }}>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Name</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Size</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Rarity (%)</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Max Count</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Is Parent</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Parents</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Description</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px', borderTop: 'none', borderBottom: '1px solid rgba(0, 255, 255, 0.1)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPOIs.map(poi => {
            const typeInfo = POI_TYPES.find(t => t.id === poi.type);
            const parentIds = poi.parentIds || (poi.parentId ? [poi.parentId] : []);
            const parents = pois.filter(p => parentIds.includes(p.id));
            
            return (
              <tr 
                key={poi.id}
                style={{
                  borderBottom: '1px solid rgba(0, 255, 255, 0.05)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  <span style={{ marginRight: '0.5rem' }} title={typeInfo?.name}>{typeInfo?.icon}</span>
                  {poi.name}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem' }}>
                  {poi.size}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', textAlign: 'center' }}>
                  <span style={{ 
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid rgba(52, 224, 255, 0.3)',
                    borderRadius: '10px',
                    padding: '0.15rem 0.5rem',
                    fontSize: '0.65rem',
                    whiteSpace: 'nowrap',
                    display: 'inline-block'
                  }}>
                    {poi.rarity || 50}%
                  </span>
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', textAlign: 'center', color: '#34e0ff' }}>
                  {poi.maxCount || 3}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', textAlign: 'center' }}>
                  {poi.isParent ? (
                    <span style={{ 
                      color: '#00ff88',
                      fontSize: '0.9rem'
                    }} title="Can be a parent for other POIs">
                      ✓
                    </span>
                  ) : (
                    <span style={{ color: '#666' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem' }}>
                  {parents.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {parents.map(parent => (
                        <span
                          key={parent.id}
                          style={{ 
                            background: 'rgba(0, 204, 255, 0.15)',
                            border: '1px solid rgba(0, 204, 255, 0.3)',
                            borderRadius: '10px',
                            padding: '0.15rem 0.5rem',
                            fontSize: '0.65rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {parent.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: '#666' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', color: '#aaa', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {poi.description}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => setEditingPOI(poi)}
                      className="btn-icon"
                      title="Edit"
                      style={{
                        width: '26px',
                        height: '26px',
                        padding: 0,
                        background: 'rgba(52, 224, 255, 0.1)',
                        border: '1px solid rgba(52, 224, 255, 0.3)',
                        borderRadius: '4px',
                        color: '#34e0ff',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => duplicatePOI(poi)}
                      className="btn-icon"
                      title="Duplicate"
                      style={{
                        width: '26px',
                        height: '26px',
                        padding: 0,
                        background: 'rgba(0, 204, 255, 0.1)',
                        border: '1px solid rgba(0, 204, 255, 0.3)',
                        borderRadius: '4px',
                        color: '#00ccff',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      ⎘
                    </button>
                    <button
                      onClick={() => deletePOI(poi.id)}
                      className="btn-icon"
                      title="Delete"
                      style={{
                        width: '26px',
                        height: '26px',
                        padding: 0,
                        background: 'rgba(255, 80, 80, 0.1)',
                        border: '1px solid rgba(255, 80, 80, 0.3)',
                        borderRadius: '4px',
                        color: '#ff5050',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {filteredPOIs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontSize: '0.85rem' }}>
          No POIs found matching filters
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreating || editingPOI) && (
        <POIEditorModal
          poi={editingPOI}
          parentPOIs={parentPOIs}
          onSave={editingPOI ? (data) => updatePOI(editingPOI.id, data) : createPOI}
          onCancel={() => { setIsCreating(false); setEditingPOI(null); }}
        />
      )}
    </div>
  );
};

const POIEditorModal = ({ poi, parentPOIs, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    // Default values
    name: '',
    type: 'PLANET',
    size: 'Medium',
    parentIds: [],
    description: '',
    properties: {},
    isParent: false,
    // New generation properties with defaults
    rarity: 50,
    maxCount: 3,
    orbitType: 'circular',
    orbitSpeed: 1.0,
    orbitRadiusMin: 1.0,
    orbitRadiusMax: 5.0,
    tierMultiplier: 1.0,
    zoneRestrictions: [],
    imagePool: null,
    // Merge with existing POI data (if editing)
    ...(poi ? {
      ...poi,
      // Ensure backward compatibility: convert old parentId to parentIds array
      parentIds: poi.parentIds || (poi.parentId ? [poi.parentId] : [])
    } : {})
  });

  // Load image pools from backend
  const [imagePools, setImagePools] = useState([]);
  useEffect(() => {
    const loadImagePools = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/image-pools');
        const data = await response.json();
        if (data.success) {
          setImagePools(data.pools || []);
        }
      } catch (error) {
        console.error('Failed to load image pools:', error);
      }
    };
    loadImagePools();
  }, []);

  const selectedType = POI_TYPES.find(t => t.id === formData.type);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'rgba(0, 15, 25, 0.95)',
        border: '2px solid rgba(52, 224, 255, 0.6)',
        borderRadius: '8px',
        padding: '1.5rem',
        maxWidth: '1000px',
        width: '95%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 0 30px rgba(52, 224, 255, 0.3)'
      }}>
        <h3 style={{ 
          fontSize: '0.95rem', 
          color: '#34e0ff', 
          marginTop: 0, 
          marginBottom: '1.5rem',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          textAlign: 'center'
        }}>
          {poi ? 'Edit POI' : 'Create New POI'}
        </h3>

        {/* TWO COLUMN LAYOUT */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem'
        }}>
          {/* LEFT COLUMN - EDIT POI */}
          <div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#34e0ff',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(52, 224, 255, 0.3)'
            }}>
              Edit POI
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Type */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Type:</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 10, 20, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#cfd8df',
                    fontSize: '0.75rem'
                  }}
                >
                  {POI_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 10, 20, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#cfd8df',
                    fontSize: '0.75rem'
                  }}
                  placeholder="POI Name"
                />
              </div>

              {/* Size */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Size:</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 10, 20, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#cfd8df',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                </select>
              </div>

              {/* Parent POIs */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right', paddingTop: '0.4rem' }}>Parent POIs:</label>
                <div style={{
                  padding: '0.5rem',
                  background: 'rgba(0, 10, 20, 0.8)',
                  border: '1px solid rgba(52, 224, 255, 0.3)',
                  borderRadius: '4px',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {parentPOIs.length === 0 ? (
                    <div style={{ fontSize: '0.7rem', color: '#666', fontStyle: 'italic' }}>
                      No parent POIs available (mark POIs as "Is Parent" first)
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {parentPOIs.map(parent => {
                        const isSelected = (formData.parentIds || []).includes(parent.id);
                        return (
                          <label
                            key={parent.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              cursor: 'pointer',
                              padding: '0.3rem',
                              borderRadius: '3px',
                              background: isSelected ? 'rgba(52, 224, 255, 0.1)' : 'transparent',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(52, 224, 255, 0.05)')}
                            onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newParentIds = e.target.checked
                                  ? [...(formData.parentIds || []), parent.id]
                                  : (formData.parentIds || []).filter(id => id !== parent.id);
                                setFormData({ ...formData, parentIds: newParentIds });
                              }}
                              style={{
                                width: '14px',
                                height: '14px',
                                cursor: 'pointer',
                                accentColor: '#34e0ff'
                              }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#cfd8df' }}>
                              {parent.name} ({parent.type})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'start' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right', paddingTop: '0.4rem' }}>Description:</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 10, 20, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#cfd8df',
                    fontSize: '0.75rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="POI description..."
                />
              </div>

              {/* Is Parent */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Is Parent:</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.isParent || false}
                    onChange={(e) => setFormData({ ...formData, isParent: e.target.checked })}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: '#34e0ff'
                    }}
                  />
                  <span style={{ color: '#cfd8df' }}>Allow other POIs to orbit this one</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - GENERATION SETTINGS */}
          <div>
            <div style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              color: '#34e0ff',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid rgba(52, 224, 255, 0.3)'
            }}>
              Generation Settings
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Rarity */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Rarity:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.rarity || 50}
                onChange={(e) => setFormData({ ...formData, rarity: parseInt(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.75rem', color: '#34e0ff', minWidth: '40px' }}>
                {formData.rarity || 50}%
              </span>
            </div>
          </div>

              {/* Max Count */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Max Count:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.maxCount}
              onChange={(e) => setFormData({ ...formData, maxCount: parseInt(e.target.value) || 1 })}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(0, 10, 20, 0.8)',
                border: '1px solid rgba(52, 224, 255, 0.3)',
                borderRadius: '4px',
                color: '#cfd8df',
                fontSize: '0.75rem',
                width: '100px'
              }}
            />
          </div>

              {/* Orbit Type */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Orbit Type:</label>
            <select
              value={formData.orbitType}
              onChange={(e) => setFormData({ ...formData, orbitType: e.target.value })}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(0, 10, 20, 0.8)',
                border: '1px solid rgba(52, 224, 255, 0.3)',
                borderRadius: '4px',
                color: '#cfd8df',
                fontSize: '0.75rem'
              }}
            >
              <option value="circular">Circular</option>
              <option value="elliptical">Elliptical</option>
              <option value="eccentric">Eccentric</option>
              <option value="none">None (Static)</option>
            </select>
          </div>

              {/* Orbit Speed */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Orbit Speed:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="range"
                min="0.1"
                max="5.0"
                step="0.1"
                value={formData.orbitSpeed || 1.0}
                onChange={(e) => setFormData({ ...formData, orbitSpeed: parseFloat(e.target.value) })}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '0.75rem', color: '#34e0ff', minWidth: '40px' }}>
                {(formData.orbitSpeed || 1.0).toFixed(1)}x
              </span>
            </div>
          </div>

              {/* Orbit Radius Range */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Orbit Radius:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={formData.orbitRadiusMin}
                onChange={(e) => setFormData({ ...formData, orbitRadiusMin: parseFloat(e.target.value) || 0.1 })}
                style={{
                  padding: '0.4rem 0.6rem',
                  background: 'rgba(0, 10, 20, 0.8)',
                  border: '1px solid rgba(52, 224, 255, 0.3)',
                  borderRadius: '4px',
                  color: '#cfd8df',
                  fontSize: '0.75rem'
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#666' }}>to</span>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={formData.orbitRadiusMax}
                onChange={(e) => setFormData({ ...formData, orbitRadiusMax: parseFloat(e.target.value) || 1.0 })}
                style={{
                  padding: '0.4rem 0.6rem',
                  background: 'rgba(0, 10, 20, 0.8)',
                  border: '1px solid rgba(52, 224, 255, 0.3)',
                  borderRadius: '4px',
                  color: '#cfd8df',
                  fontSize: '0.75rem'
                }}
              />
            </div>
          </div>

              {/* Tier Multiplier */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Tier Multiplier:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={formData.tierMultiplier || 1.0}
                    onChange={(e) => setFormData({ ...formData, tierMultiplier: parseFloat(e.target.value) })}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#34e0ff', minWidth: '40px' }}>
                    {(formData.tierMultiplier || 1.0).toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Image Pool */}
              <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Image Pool:</label>
                <select
                  value={formData.imagePool || ''}
                  onChange={(e) => setFormData({ ...formData, imagePool: e.target.value || null })}
                  style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 10, 20, 0.8)',
                    border: '1px solid rgba(52, 224, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#cfd8df',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="">None</option>
                  {imagePools.map(pool => (
                    <option key={pool.id} value={pool.id}>
                      {pool.name} ({pool.images.length} images)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons in Right Column */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={onCancel}
                style={{
                  padding: '0.4rem 1rem',
                  background: 'rgba(255, 80, 80, 0.1)',
                  border: '1px solid rgba(255, 80, 80, 0.4)',
                  borderRadius: '4px',
                  color: '#ff5050',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(formData)}
                disabled={!formData.name || !formData.type}
                style={{
                  padding: '0.4rem 1rem',
                  background: formData.name && formData.type ? 'rgba(52, 224, 255, 0.15)' : 'rgba(100, 100, 100, 0.1)',
                  border: `1px solid ${formData.name && formData.type ? 'rgba(52, 224, 255, 0.4)' : 'rgba(100, 100, 100, 0.3)'}`,
                  borderRadius: '4px',
                  color: formData.name && formData.type ? '#34e0ff' : '#666',
                  cursor: formData.name && formData.type ? 'pointer' : 'not-allowed',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  letterSpacing: '1px',
                  textTransform: 'uppercase'
                }}
              >
                Save POI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default POILibrary;
