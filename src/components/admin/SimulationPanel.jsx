import { useState } from 'react';
import EventSimulator from './EventSimulator';
import BuildSimulator from './BuildSimulator';
import LootSimulator from './LootSimulator';
import '../../styles/AdminGlass.css';

export default function SimulationPanel() {
  const [activeSection, setActiveSection] = useState('events');

  const sections = [
    { id: 'events', label: 'Events' },
    { id: 'loot', label: 'Loot Containers' },
    { id: 'builds', label: 'Builds' }
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
    </div>
  );
}
