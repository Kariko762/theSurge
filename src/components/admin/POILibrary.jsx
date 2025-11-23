import React, { useState, useEffect } from 'react';
import '../../styles/AdminCompact.css';

const POI_TYPES = [
  { id: 'PLANET', name: 'Planet', icon: '🌍', canHaveChildren: true },
  { id: 'MOON', name: 'Moon', icon: '🌙', canHaveChildren: false },
  { id: 'BELT', name: 'Asteroid Belt', icon: '☄️', canHaveChildren: true },
  { id: 'ORBITAL', name: 'Orbital Station', icon: '🛰️', canHaveChildren: false },
  { id: 'ANOMALY', name: 'Anomaly', icon: '❓', canHaveChildren: false },
  { id: 'HABITAT', name: 'Habitat', icon: '🏠', canHaveChildren: false },
  { id: 'CONFLICT', name: 'Conflict Zone', icon: '⚔️', canHaveChildren: false },
  { id: 'DISTRESS', name: 'Distress Beacon', icon: '🆘', canHaveChildren: false }
];

const POILibrary = () => {
  const [pois, setPOIs] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPOI, setEditingPOI] = useState(null);
  const [filterType, setFilterType] = useState('ALL');
  const [filterParent, setFilterParent] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Load POIs from localStorage or initialize with defaults
  useEffect(() => {
    const stored = localStorage.getItem('poi_library');
    if (stored) {
      try {
        setPOIs(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load POI library:', e);
        initializeDefaultPOIs();
      }
    } else {
      initializeDefaultPOIs();
    }
  }, []);

  const initializeDefaultPOIs = () => {
    const defaults = [
      { id: 'POI_PLANET_001', name: 'Terrestrial Planet', type: 'PLANET', parentId: null, description: 'Rocky planet with atmosphere', size: 'Large', properties: {} },
      { id: 'POI_PLANET_002', name: 'Gas Giant', type: 'PLANET', parentId: null, description: 'Massive gas giant', size: 'Large', properties: {} },
      { id: 'POI_MOON_001', name: 'Ice Moon', type: 'MOON', parentId: 'POI_PLANET_002', description: 'Frozen moon', size: 'Medium', properties: {} },
      { id: 'POI_BELT_001', name: 'Inner Belt', type: 'BELT', parentId: null, description: 'Dense asteroid field', size: 'Large', properties: {} },
      { id: 'POI_ORBITAL_001', name: 'Abandoned Station', type: 'ORBITAL', parentId: 'POI_PLANET_001', description: 'Derelict orbital station', size: 'Medium', properties: {} },
      { id: 'POI_ANOMALY_001', name: 'Quantum Anomaly', type: 'ANOMALY', parentId: null, description: 'Unexplained spacetime distortion', size: 'Medium', properties: {} }
    ];
    setPOIs(defaults);
    localStorage.setItem('poi_library', JSON.stringify(defaults));
  };

  const savePOIs = (updatedPOIs) => {
    setPOIs(updatedPOIs);
    localStorage.setItem('poi_library', JSON.stringify(updatedPOIs));
  };

  const createPOI = (poiData) => {
    const newPOI = {
      id: `POI_${poiData.type}_${Date.now()}`,
      ...poiData,
      properties: poiData.properties || {}
    };
    savePOIs([...pois, newPOI]);
    setIsCreating(false);
  };

  const updatePOI = (id, updates) => {
    savePOIs(pois.map(poi => poi.id === id ? { ...poi, ...updates } : poi));
    setEditingPOI(null);
  };

  const deletePOI = (id) => {
    if (confirm('Delete this POI? This will also remove it as a parent from any child POIs.')) {
      const updated = pois.map(poi => 
        poi.parentId === id ? { ...poi, parentId: null } : poi
      ).filter(poi => poi.id !== id);
      savePOIs(updated);
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
      if (filterParent === 'NONE' && poi.parentId !== null) return false;
      if (filterParent !== 'NONE' && poi.parentId !== filterParent) return false;
    }
    if (searchQuery && !poi.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !poi.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const parentPOIs = pois.filter(p => POI_TYPES.find(t => t.id === p.type)?.canHaveChildren);

  return (
    <div style={{ 
      padding: '1rem',
      background: 'rgba(0, 10, 20, 0.6)',
      minHeight: '100vh',
      color: '#cfd8df'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(52, 224, 255, 0.3)'
      }}>
        <h2 style={{ 
          fontSize: '1.1rem', 
          color: '#34e0ff',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          POI Library
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              textTransform: 'uppercase'
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
              fontSize: '0.7rem'
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
            fontSize: '0.7rem'
          }}>
            Import
            <input type="file" accept=".json" onChange={importPOIs} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '200px 200px 1fr',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.75rem',
        background: 'rgba(0, 255, 255, 0.03)',
        borderRadius: '4px',
        border: '1px solid rgba(0, 255, 255, 0.1)'
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
      </div>

      {/* POI Table */}
      <table className="data-table-compact" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: 'rgba(0, 255, 255, 0.08)' }}>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>Type</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>ID</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>Size</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>Parent</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '1px' }}>Description</th>
            <th style={{ padding: '0.4rem 0.6rem', fontSize: '0.65rem', color: '#34e0ff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPOIs.map(poi => {
            const typeInfo = POI_TYPES.find(t => t.id === poi.type);
            const parent = pois.find(p => p.id === poi.parentId);
            
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
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.75rem' }}>
                  <span title={typeInfo?.name}>{typeInfo?.icon}</span>
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem', fontFamily: 'monospace', color: '#00ccff' }}>
                  {poi.id}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.75rem', fontWeight: '600' }}>
                  {poi.name}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem' }}>
                  {poi.size}
                </td>
                <td style={{ padding: '0.5rem 0.6rem', fontSize: '0.7rem' }}>
                  {parent ? (
                    <span style={{ 
                      background: 'rgba(0, 204, 255, 0.15)',
                      border: '1px solid rgba(0, 204, 255, 0.3)',
                      borderRadius: '10px',
                      padding: '0.15rem 0.5rem',
                      fontSize: '0.65rem'
                    }}>
                      {parent.name}
                    </span>
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
  const [formData, setFormData] = useState(poi || {
    name: '',
    type: 'PLANET',
    size: 'Medium',
    parentId: null,
    description: '',
    properties: {}
  });

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
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 0 30px rgba(52, 224, 255, 0.3)'
      }}>
        <h3 style={{ 
          fontSize: '0.95rem', 
          color: '#34e0ff', 
          marginTop: 0, 
          marginBottom: '1rem',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {poi ? 'Edit POI' : 'Create New POI'}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Type */}
          <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'center' }}>
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
          <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'center' }}>
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
          <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'center' }}>
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

          {/* Parent POI */}
          <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.75rem', textAlign: 'right' }}>Parent POI:</label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
              style={{
                padding: '0.4rem 0.6rem',
                background: 'rgba(0, 10, 20, 0.8)',
                border: '1px solid rgba(52, 224, 255, 0.3)',
                borderRadius: '4px',
                color: '#cfd8df',
                fontSize: '0.75rem'
              }}
            >
              <option value="">None (Parent POI)</option>
              {parentPOIs.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.name} ({parent.type})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="form-inline" style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', alignItems: 'start' }}>
            <label style={{ fontSize: '0.75rem', textAlign: 'right', paddingTop: '0.4rem' }}>Description:</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
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
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
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
  );
};

export default POILibrary;
