import { useState } from 'react';
import EventSimulator from './EventSimulator';
import BuildSimulator from './BuildSimulator';
import LootSimulator from './LootSimulator';
// Replaced legacy distance-band combat modal with new framed combat UI
import FramedCombatPage from '../combat/FramedCombatPage.jsx';
import '../../styles/AdminGlass.css';

export default function SimulationPanel() {
  const [activeSection, setActiveSection] = useState('events');
  const [showCombatModal, setShowCombatModal] = useState(false);

  const sections = [
    { id: 'events', label: 'Events' },
    { id: 'loot', label: 'Loot Containers' },
    { id: 'builds', label: 'Builds' },
    { id: 'combat', label: 'Ship Combat' }
  ];

  return (
    <div>
      {/* Sub-menu tabs */}
      <div className="tab-container-sub">
        {sections.map(section => (
          <button
            key={section.id}
            className={`tab-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === 'events' && <EventSimulator />}
      {activeSection === 'loot' && <LootSimulator />}
      {activeSection === 'builds' && <BuildSimulator />}
      {activeSection === 'combat' && (
        <div className="combat-launcher">
          <div className="launcher-content">
            <h2>Ship Combat Simulator</h2>
            <p>Launch the combat simulator to test ship configurations and AI decisions using the distance-band combat system.</p>
            <button className="launch-combat-btn" onClick={() => setShowCombatModal(true)}>
              Launch Combat Simulator
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Combat Modal */}
      {showCombatModal && (
        <div className="combat-modal-overlay" style={{ overflow: 'auto' }}>
          <div className="combat-modal-container digital-grid-bg" style={{ padding: 0, maxHeight: '90vh', overflow: 'auto' }}>
            <FramedCombatPage embedded onClose={() => setShowCombatModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
