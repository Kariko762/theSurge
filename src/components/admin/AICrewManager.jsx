import { useState, useEffect } from 'react';
import api from '../../lib/api/client';
import { SaveIcon, EditIcon, DeleteIcon, AddIcon, LoadingIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function AICrewManager() {
  const [aiList, setAiList] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingAI, setEditingAI] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const skillsList = ['combat', 'piloting', 'engineering', 'navigation'];

  useEffect(() => {
    loadAICores();
  }, []);

  const loadAICores = async () => {
    try {
      setLoading(true);
      const aiCores = await api.aiCores.getAll();
      setAiList(aiCores || {});
    } catch (err) {
      console.error('Failed to load AI cores:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveToBackend = async (updatedList) => {
    try {
      // aiCores is an object, not an array
      const existing = await api.aiCores.getAll();
      
      for (const [aiId, aiCore] of Object.entries(updatedList)) {
        const exists = existing.hasOwnProperty(aiId);
        
        if (exists) {
          await api.aiCores.update(aiCore.id, aiCore);
        } else {
          await api.aiCores.create(aiCore);
        }
      }
    } catch (err) {
      console.error('Failed to save AI cores:', err);
      alert('Failed to save AI cores: ' + err.message);
    }
  };



  const handleEdit = (aiId) => {
    setEditingAI({ ...aiList[aiId], id: aiId });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingAI({
      id: '',
      name: '',
      role: '',
      tier: 1,
      description: '',
      skillModifiers: {}
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingAI.id || !editingAI.name) {
      alert('AI Core must have an ID and name');
      return;
    }

    const updatedList = {
      ...aiList,
      [editingAI.id]: {
        id: editingAI.id,
        name: editingAI.name,
        role: editingAI.role,
        tier: editingAI.tier,
        description: editingAI.description,
        skillModifiers: editingAI.skillModifiers || {}
      }
    };

    setAiList(updatedList);
    await saveToBackend(updatedList);
    setEditingAI(null);
    setIsCreating(false);
  };

  const handleDelete = async (aiId) => {
    if (!confirm(`Delete AI Core "${aiList[aiId].name}"? This cannot be undone.`)) return;
    
    const updatedList = { ...aiList };
    delete updatedList[aiId];
    
    setAiList(updatedList);
    await saveToBackend(updatedList);
  };

  const handleCancel = () => {
    setEditingAI(null);
    setIsCreating(false);
  };

  const updateSkillModifier = (skill, value) => {
    setEditingAI(prev => ({
      ...prev,
      skillModifiers: {
        ...prev.skillModifiers,
        [skill]: parseInt(value) || 0
      }
    }));
  };

  const removeSkillModifier = (skill) => {
    setEditingAI(prev => {
      const newMods = { ...prev.skillModifiers };
      delete newMods[skill];
      return { ...prev, skillModifiers: newMods };
    });
  };

  const addAbility = (type) => {
  };

  const filteredAI = Object.entries(aiList);

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <LoadingIcon size={48} />
        <p style={{ color: '#aaa', marginTop: '1rem' }}>Loading AI cores...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Action Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 2rem' }}>
        <button className="btn-neon btn-neon-primary" onClick={handleCreate}>
          <AddIcon size={16} /> CREATE NEW AI CORE
        </button>
      </div>

      {/* AI List */}
      {!editingAI && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', margin: '1rem 2rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th>Tier</th>
                <th>Skill Modifiers</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAI.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                    No AI cores found
                  </td>
                </tr>
              ) : (
                filteredAI.map(([id, ai]) => (
                  <tr key={id}>
                    <td>
                      <code style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{id}</code>
                    </td>
                    <td>
                      <strong style={{ color: '#fff' }}>{ai.name}</strong>
                    </td>
                    <td style={{ color: '#aaa' }}>{ai.role}</td>
                    <td>
                      <span className={`badge ${ai.tier >= 3 ? 'badge-warning' : 'badge-info'}`}>
                        Tier {ai.tier}
                      </span>
                    </td>
                    <td style={{ color: '#00ff88' }}>
                      {Object.entries(ai.skillModifiers || {}).map(([skill, val]) => (
                        <span key={skill} style={{ marginRight: '0.5rem' }}>
                          {skill}: +{val}
                        </span>
                      ))}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-icon btn-icon-edit"
                        onClick={() => handleEdit(id)}
                        title="Edit"
                      >
                        <EditIcon size={16} />
                      </button>
                      <button
                        className="btn-icon btn-icon-delete"
                        onClick={() => handleDelete(id)}
                        title="Delete"
                      >
                        <DeleteIcon size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Create Form */}
      {editingAI && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem' }}>
            {isCreating ? 'Create New AI Core' : `Edit: ${editingAI.name}`}
          </h4>

          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>AI Core ID (Unique)</label>
              <input
                type="text"
                value={editingAI.id}
                onChange={(e) => setEditingAI({...editingAI, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
                placeholder="tactical_core_mk1"
                className="input-neon"
                disabled={!isCreating}
              />
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingAI.name}
                onChange={(e) => setEditingAI({...editingAI, name: e.target.value})}
                placeholder="Tactical Core Mk1"
                className="input-neon"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={editingAI.role}
                onChange={(e) => setEditingAI({...editingAI, role: e.target.value})}
                className="input-neon"
              >
                <option value="">Select Role...</option>
                <option value="combat">Combat</option>
                <option value="navigation">Navigation</option>
                <option value="engineering">Engineering</option>
                <option value="general">General</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tier</label>
              <select
                value={editingAI.tier}
                onChange={(e) => setEditingAI({...editingAI, tier: parseInt(e.target.value)})}
                className="input-neon"
              >
                <option value={1}>Tier 1 (Basic)</option>
                <option value={2}>Tier 2 (Advanced)</option>
                <option value={3}>Tier 3 (Elite)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Description</label>
            <textarea
              value={editingAI.description}
              onChange={(e) => setEditingAI({...editingAI, description: e.target.value})}
              placeholder="AI core description..."
              className="input-neon"
              rows={3}
            />
          </div>

          {/* Passive Abilities */}
          <h5 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem' }}>
            Skill Modifiers
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {skillsList.map(skill => (
              <div key={skill} className="glass-card" style={{ padding: '1rem', background: 'rgba(0, 255, 136, 0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ flex: 1, textTransform: 'capitalize', color: '#0ff' }}>{skill}</label>
                  <input
                    type="number"
                    value={editingAI.skillModifiers?.[skill] || 0}
                    onChange={(e) => updateSkillModifier(skill, e.target.value)}
                    className="input-neon"
                    style={{ width: '80px' }}
                    min="0"
                    max="10"
                  />
                  {editingAI.skillModifiers?.[skill] > 0 && (
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => removeSkillModifier(skill)}
                      title="Remove"
                    >
                      <DeleteIcon size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(0, 204, 255, 0.2)' }}>
            <button className="btn-neon btn-neon-primary" onClick={handleSave}>
              <SaveIcon size={18} /> {isCreating ? 'CREATE AI CORE' : 'SAVE CHANGES'}
            </button>
            <button className="btn-neon" onClick={handleCancel}>
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
