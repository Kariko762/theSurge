import { useState } from 'react';
import { PLAYER_BACKGROUNDS, SKILLS, PERKS } from '../../lib/playerSkills';
import { SaveIcon, EditIcon, DeleteIcon, AddIcon } from './HoloIcons';
import '../../styles/AdminGlass.css';

export default function PlayerSkillsManager() {
  const [activeView, setActiveView] = useState('backgrounds');
  const [backgrounds, setBackgrounds] = useState(PLAYER_BACKGROUNDS);
  const [skills, setSkills] = useState(SKILLS);
  const [perks, setPerks] = useState(PERKS);
  const [editingItem, setEditingItem] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // === BACKGROUNDS ===
  const handleEditBackground = (bgId) => {
    const bg = backgrounds[bgId];
    setEditingItem({ 
      ...bg, 
      id: bgId, 
      type: 'background',
      perks: bg.startingPerks || bg.perks || []
    });
    setIsCreating(false);
  };

  const handleCreateBackground = () => {
    setEditingItem({
      id: '',
      type: 'background',
      name: '',
      description: '',
      backstory: '',
      startingSkills: {
        piloting: 1,
        gunnery: 1,
        tactics: 1,
        engineering: 1,
        science: 1,
        hacking: 1,
        persuasion: 1,
        intimidation: 1
      },
      perks: []
    });
    setIsCreating(true);
  };

  const handleSaveBackground = () => {
    if (!editingItem.id || !editingItem.name) {
      alert('Background must have an ID and name');
      return;
    }

    setBackgrounds(prev => ({
      ...prev,
      [editingItem.id]: {
        name: editingItem.name,
        description: editingItem.description,
        backstory: editingItem.backstory,
        startingSkills: editingItem.startingSkills,
        startingPerks: editingItem.perks || []
      }
    }));

    setEditingItem(null);
    setIsCreating(false);
  };

  const handleDeleteBackground = (bgId) => {
    if (!confirm(`Delete background "${backgrounds[bgId].name}"? This cannot be undone.`)) return;
    
    setBackgrounds(prev => {
      const newList = { ...prev };
      delete newList[bgId];
      return newList;
    });
  };

  // === SKILLS ===
  const handleEditSkill = (skillId) => {
    setEditingItem({ ...skills[skillId], id: skillId, type: 'skill' });
    setIsCreating(false);
  };

  const handleCreateSkill = () => {
    setEditingItem({
      id: '',
      type: 'skill',
      name: '',
      description: '',
      combatEffect: '',
      maxLevel: 10
    });
    setIsCreating(true);
  };

  const handleSaveSkill = () => {
    if (!editingItem.id || !editingItem.name) {
      alert('Skill must have an ID and name');
      return;
    }

    setSkills(prev => ({
      ...prev,
      [editingItem.id]: {
        name: editingItem.name,
        description: editingItem.description,
        combatEffect: editingItem.combatEffect,
        maxLevel: editingItem.maxLevel
      }
    }));

    setEditingItem(null);
    setIsCreating(false);
  };

  const handleDeleteSkill = (skillId) => {
    if (!confirm(`Delete skill "${skills[skillId].name}"? This cannot be undone.`)) return;
    
    setSkills(prev => {
      const newList = { ...prev };
      delete newList[skillId];
      return newList;
    });
  };

  // === PERKS ===
  const handleEditPerk = (perkId) => {
    const perk = perks[perkId];
    setEditingItem({ 
      ...perk, 
      id: perkId, 
      type: 'perk',
      effect: typeof perk.effect === 'object' ? JSON.stringify(perk.effect, null, 2) : perk.effect
    });
    setIsCreating(false);
  };

  const handleCreatePerk = () => {
    setEditingItem({
      id: '',
      type: 'perk',
      name: '',
      description: '',
      effect: ''
    });
    setIsCreating(true);
  };

  const handleSavePerk = () => {
    if (!editingItem.id || !editingItem.name) {
      alert('Perk must have an ID and name');
      return;
    }

    let effectValue = editingItem.effect;
    // Try to parse as JSON if it looks like an object
    if (typeof effectValue === 'string' && (effectValue.trim().startsWith('{') || effectValue.trim().startsWith('['))) {
      try {
        effectValue = JSON.parse(effectValue);
      } catch (e) {
        // Keep as string if parse fails
      }
    }

    setPerks(prev => ({
      ...prev,
      [editingItem.id]: {
        name: editingItem.name,
        description: editingItem.description,
        effect: effectValue
      }
    }));

    setEditingItem(null);
    setIsCreating(false);
  };

  const handleDeletePerk = (perkId) => {
    if (!confirm(`Delete perk "${perks[perkId].name}"? This cannot be undone.`)) return;
    
    setPerks(prev => {
      const newList = { ...prev };
      delete newList[perkId];
      return newList;
    });
  };

  const updateEditingItem = (path, value) => {
    setEditingItem(prev => {
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

  const handleCancel = () => {
    setEditingItem(null);
    setIsCreating(false);
  };

  return (
    <div>
      {/* View Tabs - Moved to top, anchored to sub-menu */}
      {!editingItem && (
        <div className="tab-container-sub2">
          <button
            className={`tab-button ${activeView === 'backgrounds' ? 'active' : ''}`}
            onClick={() => setActiveView('backgrounds')}
          >
            Backgrounds ({Object.keys(backgrounds).length})
          </button>
          <button
            className={`tab-button ${activeView === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveView('skills')}
          >
            Skills ({Object.keys(skills).length})
          </button>
          <button
            className={`tab-button ${activeView === 'perks' ? 'active' : ''}`}
            onClick={() => setActiveView('perks')}
          >
            Perks ({Object.keys(perks).length})
          </button>
        </div>
      )}

      {/* Action Button */}
      {!editingItem && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 2rem' }}>
          <button
            className="btn-neon btn-neon-primary"
            onClick={() => {
              if (activeView === 'backgrounds') handleCreateBackground();
              else if (activeView === 'skills') handleCreateSkill();
              else handleCreatePerk();
            }}
            style={{ fontSize: '0.85rem', padding: '0.6rem 1.2rem' }}
          >
            <AddIcon size={16} /> CREATE NEW
          </button>
        </div>
      )}

      {/* BACKGROUNDS VIEW */}
      {!editingItem && activeView === 'backgrounds' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Perks</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(backgrounds).map(([id, bg]) => (
                <tr key={id}>
                  <td><code style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{id}</code></td>
                  <td><strong style={{ color: '#fff' }}>{bg.name}</strong></td>
                  <td style={{ color: '#aaa', maxWidth: '300px' }}>{bg.description}</td>
                  <td><span className="badge badge-info">{(bg.startingPerks || bg.perks || []).length} perks</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon btn-icon-edit" onClick={() => handleEditBackground(id)}>
                      <EditIcon size={16} />
                    </button>
                    <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteBackground(id)}>
                      <DeleteIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SKILLS VIEW */}
      {!editingItem && activeView === 'skills' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Combat Effect</th>
                <th>Max Level</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(skills).map(([id, skill]) => (
                <tr key={id}>
                  <td><code style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{id}</code></td>
                  <td><strong style={{ color: '#fff' }}>{skill.name}</strong></td>
                  <td style={{ color: '#aaa', maxWidth: '250px' }}>{skill.description}</td>
                  <td style={{ color: '#00ff88', fontSize: '0.85rem' }}>{skill.combatEffect}</td>
                  <td style={{ color: '#ffaa00' }}>{skill.maxLevel}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon btn-icon-edit" onClick={() => handleEditSkill(id)}>
                      <EditIcon size={16} />
                    </button>
                    <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteSkill(id)}>
                      <DeleteIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PERKS VIEW */}
      {!editingItem && activeView === 'perks' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Effect</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(perks).map(([id, perk]) => (
                <tr key={id}>
                  <td><code style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{id}</code></td>
                  <td><strong style={{ color: '#fff' }}>{perk.name}</strong></td>
                  <td style={{ color: '#aaa', maxWidth: '300px' }}>{perk.description}</td>
                  <td style={{ color: '#00ff88', fontSize: '0.85rem' }}>
                    {typeof perk.effect === 'object' ? JSON.stringify(perk.effect) : perk.effect}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-icon btn-icon-edit" onClick={() => handleEditPerk(id)}>
                      <EditIcon size={16} />
                    </button>
                    <button className="btn-icon btn-icon-delete" onClick={() => handleDeletePerk(id)}>
                      <DeleteIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT FORMS */}
      {editingItem && editingItem.type === 'background' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.3rem' }}>
            {isCreating ? 'Create New Background' : `Edit: ${editingItem.name}`}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Background ID (Unique)</label>
              <input
                type="text"
                value={editingItem.id}
                onChange={(e) => updateEditingItem('id', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                className="input-neon"
                disabled={!isCreating}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => updateEditingItem('name', e.target.value)}
                className="input-neon"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Description</label>
            <textarea
              value={editingItem.description}
              onChange={(e) => updateEditingItem('description', e.target.value)}
              className="input-neon"
              rows={2}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Backstory</label>
            <textarea
              value={editingItem.backstory}
              onChange={(e) => updateEditingItem('backstory', e.target.value)}
              className="input-neon"
              rows={4}
            />
          </div>

          <h5 style={{ color: 'var(--neon-cyan)', marginBottom: '1rem', fontSize: '1.1rem' }}>
            Starting Skills
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            {Object.entries(editingItem.startingSkills).map(([skill, level]) => (
              <div key={skill} className="form-group">
                <label style={{ textTransform: 'capitalize' }}>{skill}</label>
                <input
                  type="number"
                  value={level}
                  onChange={(e) => updateEditingItem(`startingSkills.${skill}`, parseInt(e.target.value) || 1)}
                  min="1"
                  max="10"
                  className="input-neon"
                />
              </div>
            ))}
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Perks (comma-separated IDs)</label>
            <input
              type="text"
              value={(editingItem.perks || []).join(', ')}
              onChange={(e) => updateEditingItem('perks', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="ACE_PILOT, COMBAT_VETERAN"
              className="input-neon"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 204, 255, 0.2)' }}>
            <button className="btn-neon btn-neon-primary" onClick={handleSaveBackground}>
              <SaveIcon size={18} /> {isCreating ? 'CREATE' : 'SAVE'}
            </button>
            <button className="btn-neon" onClick={handleCancel}>CANCEL</button>
          </div>
        </div>
      )}

      {editingItem && editingItem.type === 'skill' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.3rem' }}>
            {isCreating ? 'Create New Skill' : `Edit: ${editingItem.name}`}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Skill ID (Unique)</label>
              <input
                type="text"
                value={editingItem.id}
                onChange={(e) => updateEditingItem('id', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                className="input-neon"
                disabled={!isCreating}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => updateEditingItem('name', e.target.value)}
                className="input-neon"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Description</label>
            <textarea
              value={editingItem.description}
              onChange={(e) => updateEditingItem('description', e.target.value)}
              className="input-neon"
              rows={3}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Combat Effect</label>
            <input
              type="text"
              value={editingItem.combatEffect}
              onChange={(e) => updateEditingItem('combatEffect', e.target.value)}
              placeholder="+initiative, +evasion, +damage"
              className="input-neon"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Max Level</label>
            <input
              type="number"
              value={editingItem.maxLevel}
              onChange={(e) => updateEditingItem('maxLevel', parseInt(e.target.value) || 10)}
              min="1"
              max="20"
              className="input-neon"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 204, 255, 0.2)' }}>
            <button className="btn-neon btn-neon-primary" onClick={handleSaveSkill}>
              <SaveIcon size={18} /> {isCreating ? 'CREATE' : 'SAVE'}
            </button>
            <button className="btn-neon" onClick={handleCancel}>CANCEL</button>
          </div>
        </div>
      )}

      {editingItem && editingItem.type === 'perk' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ color: 'var(--neon-cyan)', marginBottom: '2rem', fontSize: '1.3rem' }}>
            {isCreating ? 'Create New Perk' : `Edit: ${editingItem.name}`}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Perk ID (Unique)</label>
              <input
                type="text"
                value={editingItem.id}
                onChange={(e) => updateEditingItem('id', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                className="input-neon"
                disabled={!isCreating}
              />
            </div>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => updateEditingItem('name', e.target.value)}
                className="input-neon"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Description</label>
            <textarea
              value={editingItem.description}
              onChange={(e) => updateEditingItem('description', e.target.value)}
              className="input-neon"
              rows={3}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Mechanical Effect (JSON object or string)</label>
            <textarea
              value={editingItem.effect}
              onChange={(e) => updateEditingItem('effect', e.target.value)}
              placeholder='{"initiative": 2, "immuneToFear": true}'
              className="input-neon"
              rows={4}
            />
            <small style={{ color: '#666', fontSize: '0.8rem', display: 'block', marginTop: '0.5rem' }}>
              Can be JSON object or plain text string
            </small>
          </div>

          <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(0, 204, 255, 0.2)' }}>
            <button className="btn-neon btn-neon-primary" onClick={handleSavePerk}>
              <SaveIcon size={18} /> {isCreating ? 'CREATE' : 'SAVE'}
            </button>
            <button className="btn-neon" onClick={handleCancel}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}
