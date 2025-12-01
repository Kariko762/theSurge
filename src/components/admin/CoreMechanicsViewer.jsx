import { useState } from 'react';
import { CORE_MECHANICS, MECHANIC_CATEGORIES, getMechanicsByCategory } from '../../lib/coreMechanics';
import '../../styles/AdminCompact.css';

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
            {cat.name}
          </button>
        ))}
      </div>

      {/* Category Info Banner */}
      <div className="theme-category-banner with-accent" style={{ borderLeftColor: categoryInfo.color }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{categoryInfo.icon}</span>
          <div>
            <h4 className="theme-subtitle" style={{ color: categoryInfo.color }}>
              {categoryInfo.name} Mechanics
            </h4>
            <p className="theme-body" style={{ margin: '0.1rem 0 0 0' }}>
              {mechanics.length} core mechanics • Immutable registry
            </p>
          </div>
        </div>
      </div>

      {/* Mechanics Table */}
      <div className="theme-container" style={{ margin: '1rem 2rem', overflow: 'hidden' }}>
        <table className="theme-table">
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
                  <div className="theme-body" style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                    {mechanic.name}
                  </div>
                  <code className="theme-body" style={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>
                    {mechanic.id}
                  </code>
                  <div style={{ marginTop: '0.25rem' }}>
                    <span className="theme-badge" style={{ fontSize: '0.7rem' }}>
                      {mechanic.displayFormat}
                    </span>
                  </div>
                </td>
                <td className="theme-body" style={{ lineHeight: '1.4' }}>
                  {mechanic.description}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div className="theme-value-highlight">
                    <span className="value" style={{ fontSize: '0.85rem' }}>
                      {typeof mechanic.baseValue === 'boolean' 
                        ? (mechanic.baseValue ? 'true' : 'false')
                        : mechanic.baseValue}
                    </span>
                  </div>
                </td>
                <td>
                  <code className="theme-code" style={{ display: 'inline-block', lineHeight: '1.3', padding: '0.3rem 0.5rem' }}>
                    {mechanic.calculation}
                  </code>
                </td>
                <td>
                  {mechanic.affectedBy && mechanic.affectedBy.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                      {mechanic.affectedBy.slice(0, 3).map(source => (
                        <span key={source} className="theme-tag">
                          {source}
                        </span>
                      ))}
                      {mechanic.affectedBy.length > 3 && (
                        <span className="theme-body" style={{ fontSize: '0.7rem', padding: '0.2rem 0' }}>
                          +{mechanic.affectedBy.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="theme-body">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Footer */}
      <div className="theme-info-banner">
        <div>
          <h5 className="theme-title" style={{ fontSize: '0.9rem', margin: '0 0 0.4rem 0' }}>
            ℹ️ About Core Mechanics
          </h5>
          <p className="theme-body" style={{ lineHeight: '1.4', margin: 0 }}>
            These mechanics are <strong>hard-coded</strong> and cannot be edited. They form the foundation of the game's 
            systems. When creating Perks, AI Abilities, or Ship Components, you'll reference these mechanics to define 
            what bonuses they provide. For example, a perk might give <code className="theme-code" style={{ padding: '0.2rem 0.4rem' }}>+2 initiative</code> or an AI passive might 
            provide <code className="theme-code" style={{ padding: '0.2rem 0.4rem' }}>+1 evasion</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
