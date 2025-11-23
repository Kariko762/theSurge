import { useState } from 'react';
import { AI_CREW } from '../../lib/aiCrew';
import { CORE_MECHANICS, getMechanicOptions } from '../../lib/coreMechanics';
import { SaveIcon, EditIcon, DeleteIcon, AddIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function AICrewManager() {
  const [aiList, setAiList] = useState(AI_CREW);
  const [editingAI, setEditingAI] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const mechanicOptions = getMechanicOptions();

  const formatAbilityJSON = (ability) => {
    const effect = {
      mechanic: ability.mechanic,
      modifier: ability.modifier
    };
    return JSON.stringify(effect, null, 2);
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
      description: '',
      slotSize: 1,
      powerCost: 20,
      passives: [],
      actives: [],
      integrity: 100
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    if (!editingAI.id || !editingAI.name) {
      alert('AI must have an ID and name');
      return;
    }

    setAiList(prev => ({
      ...prev,
      [editingAI.id]: {
        name: editingAI.name,
        role: editingAI.role,
        description: editingAI.description,
        slotSize: editingAI.slotSize,
        powerCost: editingAI.powerCost,
        passives: editingAI.passives,
        actives: editingAI.actives,
        integrity: editingAI.integrity
      }
    }));

    setEditingAI(null);
    setIsCreating(false);
  };

  const handleDelete = (aiId) => {
    if (!confirm(`Delete AI "${aiList[aiId].name}"? This cannot be undone.`)) return;
    
    setAiList(prev => {
      const newList = { ...prev };
      delete newList[aiId];
      return newList;
    });
  };

  const handleCancel = () => {
    setEditingAI(null);
    setIsCreating(false);
  };

  const updateEditingAI = (path, value) => {
    setEditingAI(prev => {
      const keys = path.split('.');
      const updated = { ...prev };
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const addAbility = (type) => {
    const newAbility = {
      name: '',
      description: '',
      mechanic: '',
      modifier: 0
    };

    if (type === 'active') {
      newAbility.cooldown = 3;
      newAbility.actionType = 'action';
    }

    setEditingAI(prev => ({
      ...prev,
      [type === 'passive' ? 'passives' : 'actives']: [
        ...(prev[type === 'passive' ? 'passives' : 'actives'] || []),
        newAbility
      ]
    }));
  };

  const updateAbility = (type, index, field, value) => {
    setEditingAI(prev => {
      const abilities = [...prev[type === 'passive' ? 'passives' : 'actives']];
      abilities[index] = { ...abilities[index], [field]: value };
      return {
        ...prev,
        [type === 'passive' ? 'passives' : 'actives']: abilities
      };
    });
  };

  const removeAbility = (type, index) => {
    setEditingAI(prev => {
      const abilities = [...prev[type === 'passive' ? 'passives' : 'actives']];
      abilities.splice(index, 1);
      return {
        ...prev,
        [type === 'passive' ? 'passives' : 'actives']: abilities
      };
    });
  };

  const filteredAI = Object.entries(aiList);

  return (
    <div>
      {/* Action Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 2rem' }}>
        <button className="btn-neon btn-neon-primary" onClick={handleCreate} style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}>
          <AddIcon size={16} /> CREATE NEW AI
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
                <th>Slot Size</th>
                <th>Power</th>
                <th>Passives</th>
                <th>Actives</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAI.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: '#666', padding: '3rem' }}>
                    No AI crew found
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
                      <span className={`badge ${ai.slotSize === 2 ? 'badge-warning' : 'badge-info'}`}>
                        {ai.slotSize} slot{ai.slotSize > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ color: '#ffaa00' }}>{ai.powerCost}⚡</td>
                    <td style={{ color: '#00ff88' }}>{ai.passives?.length || 0}</td>
                    <td style={{ color: '#00ccff' }}>{ai.actives?.length || 0}</td>
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
          <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.3rem' }}>
            {isCreating ? 'Create New AI' : `Edit: ${editingAI.name}`}
          </h4>

          {/* Basic Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>AI ID (Unique)</label>
              <input
                type="text"
                value={editingAI.id}
                onChange={(e) => updateEditingAI('id', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                placeholder="AI_EXAMPLE"
                className="input-neon"
                disabled={!isCreating}
              />
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingAI.name}
                onChange={(e) => updateEditingAI('name', e.target.value)}
                placeholder="Example AI"
                className="input-neon"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                value={editingAI.role}
                onChange={(e) => updateEditingAI('role', e.target.value)}
                placeholder="Tactical Systems"
                className="input-neon"
              />
            </div>

            <div className="form-group">
              <label>Slot Size</label>
              <select
                value={editingAI.slotSize}
                onChange={(e) => updateEditingAI('slotSize', parseInt(e.target.value))}
                className="input-neon"
              >
                <option value={1}>1 Slot (Normal)</option>
                <option value={2}>2 Slots (Powerful)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Power Cost per Turn</label>
              <input
                type="number"
                value={editingAI.powerCost}
                onChange={(e) => updateEditingAI('powerCost', parseInt(e.target.value))}
                min="10"
                max="50"
                className="input-neon"
              />
            </div>

            <div className="form-group">
              <label>Integrity (Health)</label>
              <input
                type="number"
                value={editingAI.integrity}
                onChange={(e) => updateEditingAI('integrity', parseInt(e.target.value))}
                min="1"
                max="200"
                className="input-neon"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Description</label>
            <textarea
              value={editingAI.description}
              onChange={(e) => updateEditingAI('description', e.target.value)}
              placeholder="AI description and lore..."
              className="input-neon"
              rows={3}
            />
          </div>

          {/* Passive Abilities */}
          <h5 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Passive Abilities (Always Active)
          </h5>
          {editingAI.passives?.map((passive, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(0, 255, 136, 0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={passive.name}
                  onChange={(e) => updateAbility('passive', idx, 'name', e.target.value)}
                  placeholder="Passive Name"
                  className="input-neon"
                  style={{ flex: '1' }}
                />
                <button
                  className="btn-icon btn-icon-delete"
                  onClick={() => removeAbility('passive', idx)}
                >
                  <DeleteIcon size={16} />
                </button>
              </div>
              <textarea
                value={passive.description}
                onChange={(e) => updateAbility('passive', idx, 'description', e.target.value)}
                placeholder="Description of passive effect..."
                className="input-neon"
                rows={2}
                style={{ marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Mechanic</label>
                  <select
                    value={passive.mechanic || ''}
                    onChange={(e) => updateAbility('passive', idx, 'mechanic', e.target.value)}
                    className="input-neon"
                  >
                    <option value="">Select Mechanic...</option>
                    {mechanicOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Modifier</label>
                  <input
                    type="number"
                    value={passive.modifier || 0}
                    onChange={(e) => updateAbility('passive', idx, 'modifier', parseFloat(e.target.value) || 0)}
                    className="input-neon"
                    step="0.1"
                  />
                </div>
              </div>
              {passive.mechanic && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0, 255, 255, 0.05)', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>
                  {formatAbilityJSON(passive)}
                </div>
              )}
            </div>
          ))}
          <button
            className="btn-neon btn-neon-success"
            onClick={() => addAbility('passive')}
            style={{ marginBottom: '2rem' }}
          >
            <AddIcon size={16} /> Add Passive
          </button>

          {/* Active Abilities */}
          <h5 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Active Abilities (Cooldown-Based)
          </h5>
          {editingAI.actives?.map((active, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', background: 'rgba(0, 204, 255, 0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={active.name}
                  onChange={(e) => updateAbility('active', idx, 'name', e.target.value)}
                  placeholder="Ability Name"
                  className="input-neon"
                />
                <select
                  value={active.actionType || 'action'}
                  onChange={(e) => updateAbility('active', idx, 'actionType', e.target.value)}
                  className="input-neon"
                >
                  <option value="action">Action</option>
                  <option value="bonus">Bonus Action</option>
                  <option value="instant">Instant</option>
                  <option value="reaction">Reaction</option>
                </select>
                <button
                  className="btn-icon btn-icon-delete"
                  onClick={() => removeAbility('active', idx)}
                >
                  <DeleteIcon size={16} />
                </button>
              </div>
              <textarea
                value={active.description}
                onChange={(e) => updateAbility('active', idx, 'description', e.target.value)}
                placeholder="Description of ability effect..."
                className="input-neon"
                rows={2}
                style={{ marginBottom: '0.75rem' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Mechanic</label>
                  <select
                    value={active.mechanic || ''}
                    onChange={(e) => updateAbility('active', idx, 'mechanic', e.target.value)}
                    className="input-neon"
                  >
                    <option value="">Select Mechanic...</option>
                    {mechanicOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Modifier</label>
                  <input
                    type="number"
                    value={active.modifier || 0}
                    onChange={(e) => updateAbility('active', idx, 'modifier', parseFloat(e.target.value) || 0)}
                    className="input-neon"
                    step="0.1"
                  />
                </div>
                <div className="form-group">
                  <label>Cooldown</label>
                  <input
                    type="number"
                    value={active.cooldown || 0}
                    onChange={(e) => updateAbility('active', idx, 'cooldown', parseInt(e.target.value) || 0)}
                    className="input-neon"
                    min="0"
                  />
                </div>
              </div>
              {active.mechanic && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0, 255, 255, 0.05)', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--neon-cyan)' }}>
                  {formatAbilityJSON(active)}
                </div>
              )}
            </div>
          ))}
          <button
            className="btn-neon btn-neon-success"
            onClick={() => addAbility('active')}
          >
            <AddIcon size={16} /> Add Active
          </button>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(0, 204, 255, 0.2)' }}>
            <button className="btn-neon btn-neon-primary" onClick={handleSave}>
              <SaveIcon size={18} /> {isCreating ? 'CREATE AI' : 'SAVE CHANGES'}
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
