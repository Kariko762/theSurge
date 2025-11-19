import React, { useState } from 'react';
import InventoryModal from './components/inventory/InventoryModal';
import HangarView from './components/hangar/HangarView';
import { createDefaultInventory, addItem } from './lib/inventory/inventoryManagerBrowser';

/**
 * Example integration component showing how to use the inventory + hangar system
 */
export default function InventoryIntegrationExample() {
  const [inventory, setInventory] = useState(() => {
    // Create default inventory
    const inv = createDefaultInventory();
    
    // Add starting items to homebase
    addItem(inv, 'homebase', 'beam_laser_mk1', 1);
    addItem(inv, 'homebase', 'beam_laser_mk2', 1);
    addItem(inv, 'homebase', 'missile_rack_mk1', 1);
    addItem(inv, 'homebase', 'mining_laser_mk1', 1);
    addItem(inv, 'homebase', 'mining_laser_mk2', 1);
    addItem(inv, 'homebase', 'mag_thruster_mk1', 1);
    addItem(inv, 'homebase', 'mag_thruster_mk2', 1);
    addItem(inv, 'homebase', 'scanner_mk1', 1);
    addItem(inv, 'homebase', 'signal_booster_mk1', 1);
    addItem(inv, 'homebase', 'power_core_mk1', 1);
    addItem(inv, 'homebase', 'power_core_mk2', 1);
    addItem(inv, 'homebase', 'shield_generator_mk1', 1);
    addItem(inv, 'homebase', 'hull_plating_mk1', 1);
    addItem(inv, 'homebase', 'targeting_computer_mk1', 1);
    addItem(inv, 'homebase', 'cargo_hold_mk1', 1);
    addItem(inv, 'homebase', 'ai_core_engineer_mk1', 1);
    addItem(inv, 'homebase', 'ai_core_tactical_mk1', 1);
    addItem(inv, 'homebase', 'ai_core_researcher_mk1', 1);
    addItem(inv, 'homebase', 'ai_core_navigator_mk1', 1);
    addItem(inv, 'homebase', 'scrap_metal', 100);
    addItem(inv, 'homebase', 'titanium_alloy', 50);
    addItem(inv, 'homebase', 'rare_ore', 25);
    addItem(inv, 'homebase', 'crystal_matrix', 10);
    addItem(inv, 'homebase', 'fuel_cell', 20);
    addItem(inv, 'homebase', 'repair_kit', 10);
    addItem(inv, 'homebase', 'research_data', 15);
    
    return inv;
  });

  const [showInventory, setShowInventory] = useState(false);
  const [showHangar, setShowHangar] = useState(false);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, #000000, #001122)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace'
    }}>
      <div style={{
        textAlign: 'center'
      }}>
        <h1 style={{
          color: '#00ffff',
          fontSize: '32px',
          marginBottom: '40px',
          textShadow: '0 0 20px rgba(0, 255, 255, 0.8)'
        }}>
          🚀 Inventory & Hangar System Demo
        </h1>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => setShowInventory(true)}
            style={{
              padding: '16px 40px',
              background: 'rgba(0, 255, 255, 0.2)',
              border: '2px solid #00ffff',
              color: '#00ffff',
              fontSize: '18px',
              cursor: 'pointer',
              borderRadius: '8px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)',
              transition: 'all 0.3s ease',
              width: '300px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 255, 255, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.4)';
            }}
          >
            📦 Open Inventory
          </button>

          <button
            onClick={() => setShowHangar(true)}
            style={{
              padding: '16px 40px',
              background: 'rgba(255, 100, 0, 0.2)',
              border: '2px solid #ff6600',
              color: '#ff6600',
              fontSize: '18px',
              cursor: 'pointer',
              borderRadius: '8px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: '0 0 20px rgba(255, 100, 0, 0.4)',
              transition: 'all 0.3s ease',
              width: '300px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 100, 0, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 100, 0, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 100, 0, 0.2)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 100, 0, 0.4)';
            }}
          >
            🛠️ Open Hangar
          </button>
        </div>

        <div style={{
          marginTop: '60px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          maxWidth: '600px',
          lineHeight: '1.8'
        }}>
          <p style={{ marginBottom: '15px' }}>
            <strong style={{ color: '#00ffff' }}>Instructions:</strong>
          </p>
          <p style={{ marginBottom: '10px' }}>
            1. Open <strong>Inventory</strong> to view homebase storage (25 items pre-loaded)
          </p>
          <p style={{ marginBottom: '10px' }}>
            2. Use filters to browse by category (Weapons, Tools, AI Cores, etc.)
          </p>
          <p style={{ marginBottom: '10px' }}>
            3. Transfer items to ship using "→ Ship" button or drag-drop
          </p>
          <p style={{ marginBottom: '10px' }}>
            4. Open <strong>Hangar</strong> to install components to ship slots
          </p>
          <p style={{ marginBottom: '10px' }}>
            5. Switch between External/Internal/Mainframe views
          </p>
          <p style={{ marginBottom: '10px' }}>
            6. Drag components from "Available Components" to empty slots
          </p>
          <p>
            7. Watch ship stats update in real-time (left panel)
          </p>
        </div>
      </div>

      {/* Modals */}
      {showInventory && (
        <InventoryModal
          inventory={inventory}
          setInventory={setInventory}
          location="homebase"
          onClose={() => setShowInventory(false)}
        />
      )}

      {showHangar && (
        <HangarView
          inventory={inventory}
          setInventory={setInventory}
          onClose={() => setShowHangar(false)}
        />
      )}
    </div>
  );
}
