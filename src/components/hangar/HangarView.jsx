import React, { useEffect, useState } from 'react';
import '../../styles/TerminalFrame.css';
import ItemFrame from '../inventory/ItemFrame';
import ShipStatsPanel from './ShipStatsPanel';
import {
  installComponent,
  uninstallComponent,
  getInstalledComponents,
} from '../../lib/inventory/inventoryManagerBrowser';

const VIEWS = [
  { id: 'external', label: 'External', slots: ['weapon', 'shield', 'engine', 'thruster', 'hull'] },
  { id: 'internal', label: 'Internal', slots: ['reactor', 'scanner', 'cargo', 'lifeSupport', 'fabricator'] },
  { id: 'mainframe', label: 'Mainframe', slots: ['mainframe'] },
];

export default function HangarView({ inventory, setInventory, onClose, fullscreen = false }) {
  const [activeView, setActiveView] = useState('external');
  const [draggedItem, setDraggedItem] = useState(null);
  const [anim, setAnim] = useState('enter');

  useEffect(() => {
    const t = setTimeout(() => setAnim('idle'), 300);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setAnim('exit');
    setTimeout(() => onClose && onClose(), 230);
  };

  const currentView = VIEWS.find((v) => v.id === activeView) || VIEWS[0];
  const shipItems = Object.values(inventory?.ship?.items || {});

  const handleInstall = (instanceId, slotType, slotIndex) => {
    const newInventory = { ...inventory };
    const result = installComponent(newInventory, instanceId, slotType, slotIndex);
    if (result.success) {
      setInventory(newInventory);
    } else {
      alert(result.error);
    }
  };

  const handleUninstall = (slotType, slotIndex) => {
    const newInventory = { ...inventory };
    const result = uninstallComponent(newInventory, slotType, slotIndex);
    if (result.success) {
      setInventory(newInventory);
    } else {
      alert(result.error);
    }
  };

  const handleDragStart = (item) => setDraggedItem(item);
  const handleDragEnd = () => setDraggedItem(null);

  const handleDropOnSlot = (slotType, slotIndex) => {
    if (!draggedItem) return;
    handleInstall(draggedItem.instanceId, slotType, slotIndex);
    setDraggedItem(null);
  };

  return (
    <div
      className={`${fullscreen ? 'no-scanlines' : 'terminal-modal-overlay'} ${anim === 'enter' ? 'modal-anim-enter' : ''} ${anim === 'exit' ? 'modal-anim-exit' : ''}`}
      onClick={fullscreen ? undefined : handleClose}
      style={
        fullscreen
          ? {
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              background:
                'radial-gradient(ellipse at top, rgba(0,20,30,0.7), rgba(0,10,20,0.6))',
            }
          : undefined
      }
    >
      <div
        className="terminal-modal hangar-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: fullscreen ? 'calc(100vw - 80px)' : '95vw',
          maxWidth: fullscreen ? 'unset' : '1600px',
          height: fullscreen ? 'calc(100vh - 80px)' : '90vh',
          margin: fullscreen ? '40px' : undefined,
          background: 'rgba(0, 10, 20, 0.95)',
          border: '2px solid rgba(0, 255, 255, 0.5)',
          boxShadow:
            '0 0 40px rgba(0, 255, 255, 0.3), inset 0 0 60px rgba(0, 255, 255, 0.05)',
          borderRadius: '8px',
          display: 'flex',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left: Ship Stats Panel */}
        <ShipStatsPanel inventory={inventory} />

        {/* Center: Main Hangar View */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
              paddingBottom: '15px',
            }}
          >
            <h2
              style={{
                color: '#00ffff',
                textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                fontSize: '24px',
                fontWeight: '300',
                letterSpacing: '2px',
              }}
            >
              🛠️ HANGAR BAY - COMPONENT INSTALLATION
            </h2>

            <button
              onClick={handleClose}
              style={{
                padding: '8px 16px',
                background: 'rgba(255, 0, 0, 0.1)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                color: '#ff4444',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              Close
            </button>
          </div>

          {/* View Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {VIEWS.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background:
                    activeView === view.id
                      ? 'rgba(0, 255, 255, 0.2)'
                      : 'rgba(0, 255, 255, 0.05)',
                  border: `2px solid ${
                    activeView === view.id ? '#00ffff' : 'rgba(0, 255, 255, 0.3)'
                  }`,
                  color: activeView === view.id ? '#00ffff' : 'rgba(0, 255, 255, 0.6)',
                  cursor: 'pointer',
                  borderRadius: '6px',
                  fontSize: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease',
                  boxShadow:
                    activeView === view.id ? '0 0 15px rgba(0, 255, 255, 0.4)' : 'none',
                }}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* Component Slots Grid */}
          <div style={{ flex: 1, display: 'flex', gap: '20px' }}>
            {/* Left: Slot Visualization */}
            <div
              style={{
                flex: 2,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '20px',
                overflowY: 'auto',
              }}
            >
              <h3
                style={{
                  color: '#00ffff',
                  fontSize: '14px',
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Component Slots
              </h3>

              {currentView.slots.map((slotType) => {
                const maxSlots = inventory?.ship?.slots?.[slotType] || 0;
                const installedComponents = getInstalledComponents(inventory, slotType);

                return (
                  <div key={slotType} style={{ marginBottom: '25px' }}>
                    <div
                      style={{
                        color: 'rgba(0, 255, 255, 0.8)',
                        fontSize: '12px',
                        marginBottom: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 'bold',
                      }}
                    >
                      {slotType} Slots ({installedComponents.length}/{maxSlots})
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px',
                      }}
                    >
                      {[...Array(maxSlots)].map((_, slotIndex) => {
                        const installedComp = installedComponents.find(
                          (c) => c.slotIndex === slotIndex
                        );
                        const installedItem = installedComp
                          ? inventory?.ship?.items?.[installedComp.instanceId]
                          : null;

                        return (
                          <div
                            key={slotIndex}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDropOnSlot(slotType, slotIndex)}
                            style={{
                              minHeight: '120px',
                              background: installedItem
                                ? 'rgba(0, 150, 255, 0.1)'
                                : 'rgba(0, 255, 255, 0.05)',
                              border: installedItem
                                ? '2px solid rgba(0, 150, 255, 0.6)'
                                : '2px dashed rgba(0, 255, 255, 0.3)',
                              borderRadius: '6px',
                              padding: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              transition: 'all 0.2s ease',
                              position: 'relative',
                            }}
                          >
                            {installedItem ? (
                              <>
                                <div
                                  style={{
                                    color: '#00ccff',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    marginBottom: '6px',
                                    textAlign: 'center',
                                  }}
                                >
                                  {installedItem.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: '9px',
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    marginBottom: '8px',
                                  }}
                                >
                                  Tier {installedItem.tier}
                                </div>
                                <button
                                  onClick={() => handleUninstall(slotType, slotIndex)}
                                  style={{
                                    padding: '4px 12px',
                                    background: 'rgba(255, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 0, 0, 0.5)',
                                    color: '#ff4444',
                                    fontSize: '9px',
                                    cursor: 'pointer',
                                    borderRadius: '3px',
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Uninstall
                                </button>
                              </>
                            ) : (
                              <div
                                style={{
                                  color: 'rgba(0, 255, 255, 0.4)',
                                  fontSize: '11px',
                                  textAlign: 'center',
                                }}
                              >
                                Empty {slotType} Slot
                                <br />
                                <span style={{ fontSize: '9px' }}>Drag component here</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Available Components */}
            <div
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '6px',
                padding: '20px',
                overflowY: 'auto',
              }}
            >
              <h3
                style={{
                  color: '#00ffff',
                  fontSize: '14px',
                  marginBottom: '15px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                Available Components
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {shipItems
                  .filter((item) => currentView.slots.includes(item.slotType))
                  .filter((item) => {
                    return !Object.values(inventory?.ship?.installedComponents || {}).some((slotArray) =>
                      slotArray.some((comp) => comp.instanceId === item.instanceId)
                    );
                  })
                  .map((item) => (
                    <ItemFrame
                      key={item.instanceId}
                      item={item}
                      onDragStart={() => handleDragStart(item)}
                      onDragEnd={handleDragEnd}
                      showTransferButton={false}
                      isDragging={draggedItem?.instanceId === item.instanceId}
                    />
                  ))}

                {shipItems.filter((item) => currentView.slots.includes(item.slotType)).length === 0 && (
                  <div
                    style={{
                      color: 'rgba(0, 255, 255, 0.4)',
                      fontSize: '12px',
                      textAlign: 'center',
                      padding: '20px',
                    }}
                  >
                    No compatible components in cargo
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
