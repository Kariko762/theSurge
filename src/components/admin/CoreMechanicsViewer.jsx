import { useState } from 'react';
import { CORE_MECHANICS, MECHANIC_CATEGORIES, getMechanicsByCategory } from '../../lib/coreMechanics';
import '../../styles/AdminGlass.css';

export default function CoreMechanicsViewer() {
  const [activeCategory, setActiveCategory] = useState('combat');

  const mechanics = getMechanicsByCategory(activeCategory);
  const categoryInfo = MECHANIC_CATEGORIES[activeCategory];

  return (
    <div>
      {/* Category Tabs - Second level sub-menu attached to first sub-menu */}
      <div className="tab-container-sub2">
        {Object.entries(MECHANIC_CATEGORIES).map(([id, cat]) => (
          <button
            key={id}
            className={`tab-button ${activeCategory === id ? 'active' : ''}`}
            onClick={() => setActiveCategory(id)}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Category Info Banner */}
      <div className="glass-card" style={{ 
        padding: '0.6rem 1rem', 
        marginBottom: '1rem',
        marginTop: '1rem',
        marginLeft: '2rem',
        marginRight: '2rem',
        background: `linear-gradient(135deg, ${categoryInfo.color}15, rgba(0,0,0,0.3))`,
        borderLeft: `3px solid ${categoryInfo.color}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{categoryInfo.icon}</span>
          <div>
            <h4 style={{ color: categoryInfo.color, margin: 0, fontSize: '0.95rem' }}>
              {categoryInfo.name} Mechanics
            </h4>
            <p style={{ color: '#888', margin: '0.1rem 0 0 0', fontSize: '0.75rem' }}>
              {mechanics.length} core mechanics • Immutable registry
            </p>
          </div>
        </div>
      </div>

      {/* Mechanics Table */}
      <div className="admin-glass-panel" style={{ padding: 0, marginBottom: '1rem', marginLeft: '2rem', marginRight: '2rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '20%' }}>Mechanic</th>
              <th style={{ width: '35%' }}>Description</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Base Value</th>
              <th style={{ width: '23%' }}>Calculation</th>
              <th style={{ width: '10%' }}>Affected By</th>
            </tr>
          </thead>
          <tbody>
            {mechanics.map(mechanic => (
              <tr key={mechanic.id}>
                <td>
                  <div style={{ 
                    fontWeight: '600', 
                    color: '#fff',
                    marginBottom: '0.25rem',
                    fontSize: '0.95rem'
                  }}>
                    {mechanic.name}
                  </div>
                  <code style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    fontFamily: 'monospace'
                  }}>
                    {mechanic.id}
                  </code>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {mechanic.displayFormat}
                    </span>
                  </div>
                </td>
                <td style={{ 
                  color: '#aaa',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}>
                  {mechanic.description}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(0, 204, 255, 0.15)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '4px',
                    borderLeft: '3px solid var(--neon-cyan)'
                  }}>
                    <span style={{
                      color: '#00ffff',
                      fontWeight: '600',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace'
                    }}>
                      {typeof mechanic.baseValue === 'boolean' 
                        ? (mechanic.baseValue ? 'true' : 'false')
                        : mechanic.baseValue}
                    </span>
                  </div>
                </td>
                <td>
                  <code style={{
                    fontSize: '0.82rem',
                    color: '#00ff88',
                    fontFamily: 'monospace',
                    background: 'rgba(0, 255, 136, 0.1)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '3px',
                    display: 'inline-block',
                    lineHeight: '1.3'
                  }}>
                    {mechanic.calculation}
                  </code>
                </td>
                <td>
                  {mechanic.affectedBy && mechanic.affectedBy.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {mechanic.affectedBy.slice(0, 3).map(source => (
                        <span
                          key={source}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.4rem',
                            background: 'rgba(255, 170, 0, 0.15)',
                            border: '1px solid rgba(255, 170, 0, 0.3)',
                            borderRadius: '3px',
                            color: '#ffaa00',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {source}
                        </span>
                      ))}
                      {mechanic.affectedBy.length > 3 && (
                        <span style={{
                          fontSize: '0.7rem',
                          color: '#666',
                          padding: '0.2rem 0'
                        }}>
                          +{mechanic.affectedBy.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span style={{ color: '#444' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Info Footer */}
      <div className="glass-card" style={{ 
        padding: '0.75rem 1rem', 
        marginLeft: '2rem',
        marginRight: '2rem',
        background: 'rgba(255, 170, 0, 0.1)',
        borderLeft: '3px solid rgba(255, 170, 0, 0.5)'
      }}>
        <h5 style={{ color: '#ffaa00', margin: '0 0 0.4rem 0', fontSize: '0.9rem' }}>
          ℹ️ About Core Mechanics
        </h5>
        <p style={{ color: '#aaa', fontSize: '0.8rem', lineHeight: '1.4', margin: 0 }}>
          These mechanics are <strong>hard-coded</strong> and cannot be edited. They form the foundation of the game's 
          systems. When creating Perks, AI Abilities, or Ship Components, you'll reference these mechanics to define 
          what bonuses they provide. For example, a perk might give <code>+2 initiative</code> or an AI passive might 
          provide <code>+1 evasion</code>.
        </p>
      </div>
    </div>
  );
}
