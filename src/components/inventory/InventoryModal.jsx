import React, { useState, useMemo, useEffect } from 'react';
import '../../styles/TerminalFrame.css';
import ItemFrame from './ItemFrame';
import ItemDetailModal from './ItemDetailModal';
import { 
  getInventorySummary, 
  transferToShip, 
  transferToHomebase,
  getAllItems,
  addItem,
  removeItem
} from '../../lib/inventory/inventoryManagerBrowser';

const FILTERS = [
  { id: 'all', label: 'All Items' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'engine', label: 'Engines' },
  { id: 'sensor', label: 'Sensors' },
  { id: 'tool', label: 'Tools' },
  { id: 'defense', label: 'Defense' },
  { id: 'aiCore', label: 'AI Cores' },
  { id: 'crafting', label: 'Crafting' },
  { id: 'consumable', label: 'Consumables' }
];

export default function InventoryModal({ 
  inventory, 
  setInventory, 
  location = 'homebase', // 'homebase' or 'ship'
  onClose,
  fullscreen = false
}) {
  const [anim, setAnim] = useState('enter'); // 'enter' | 'idle' | 'exit'

  useEffect(() => {
    const t = setTimeout(() => setAnim('idle'), 300);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setAnim('exit');
    setTimeout(() => onClose && onClose(), 230);
  };
  const [activeFilter, setActiveFilter] = useState('all');
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [viewMode, setViewMode] = useState(location); // Which inventory to display
  const [selectedItem, setSelectedItem] = useState(null); // For detail modal
  const [gridItems, setGridItems] = useState([]); // Track item positions in grid

  const targetInventory = viewMode === 'ship' ? inventory.ship : inventory.homebase;
  const summary = getInventorySummary(inventory, viewMode);

  // Filter items by category
  const filteredItems = useMemo(() => {
    const items = Object.values(targetInventory.items);
    if (activeFilter === 'all') return items;
    return items.filter(item => item.category === activeFilter);
  }, [targetInventory.items, activeFilter]);

  // Initialize grid items on mount and when filtered items change
  useEffect(() => {
    setGridItems(filteredItems);
  }, [filteredItems]);

  // Handle transfer to ship
  const handleTransferToShip = (instanceId, quantity = 1) => {
    const newInventory = { ...inventory };
    const result = transferToShip(newInventory, instanceId, quantity);
    
    if (result.success) {
      setInventory(newInventory);
    } else {
      alert(result.error);
    }
  };

  // Handle transfer to homebase
  const handleTransferToHomebase = (instanceId, quantity = 1) => {
    const newInventory = { ...inventory };
    const result = transferToHomebase(newInventory, instanceId, quantity);
    
    if (result.success) {
      setInventory(newInventory);
    } else {
      alert(result.error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (item, index) => {
    setDraggedItem(item);
    setDraggedFromIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedFromIndex(null);
    setHoverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setHoverIndex(index);
  };

  const handleDragLeave = () => {
    setHoverIndex(null);
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (!draggedItem || draggedFromIndex === null) return;

    // Swap items in grid
    const newGridItems = [...gridItems];
    const targetItem = newGridItems[targetIndex];
    newGridItems[targetIndex] = draggedItem;
    newGridItems[draggedFromIndex] = targetItem || null;
    
    setGridItems(newGridItems);
    setDraggedItem(null);
    setDraggedFromIndex(null);
    setHoverIndex(null);
  };

  return (
    <div
      className={`${fullscreen ? 'no-scanlines' : 'terminal-modal-overlay'} ${anim === 'enter' ? 'modal-anim-enter' : ''} ${anim === 'exit' ? 'modal-anim-exit' : ''}`}
      onClick={fullscreen ? undefined : handleClose}
      style={fullscreen ? {
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'radial-gradient(ellipse at top, rgba(0,20,30,0.7), rgba(0,10,20,0.6))'
      } : undefined}
    >
      <div 
        className="terminal-modal inventory-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: fullscreen ? 'calc(100vw - 120px)' : '90vw',
          maxWidth: fullscreen ? 'unset' : '1400px',
          height: fullscreen ? 'calc(100vh - 120px)' : '85vh',
          margin: fullscreen ? '60px' : undefined,
          background: 'rgba(0, 10, 20, 0.95)',
          border: '2px solid rgba(0, 255, 255, 0.5)',
          boxShadow: '0 0 40px rgba(0, 255, 255, 0.3), inset 0 0 60px rgba(0, 255, 255, 0.05)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px'
        }}
      >
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
          paddingBottom: '15px'
        }}>
          <h2 style={{ 
            color: '#00ffff', 
            textShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            fontSize: '24px',
            fontWeight: '300',
            letterSpacing: '2px'
          }}>
            {viewMode === 'homebase' ? '⚡ HOMEBASE INVENTORY' : '🚀 SHIP CARGO'}
          </h2>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setViewMode('homebase')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'homebase' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 255, 255, 0.05)',
                border: `1px solid ${viewMode === 'homebase' ? '#00ffff' : 'rgba(0, 255, 255, 0.3)'}`,
                color: '#00ffff',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Homebase
            </button>
            <button
              onClick={() => setViewMode('ship')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'ship' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(0, 255, 255, 0.05)',
                border: `1px solid ${viewMode === 'ship' ? '#00ffff' : 'rgba(0, 255, 255, 0.3)'}`,
                color: '#00ffff',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              Ship
            </button>
          </div>

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
              textTransform: 'uppercase'
            }}
          >
            Close
          </button>
        </div>

        {/* Capacity Bar */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '11px', 
            color: '#00ffff',
            marginBottom: '5px'
          }}>
            <span>Volume: {summary.totalVolume_m3.toFixed(1)} / {summary.capacity_m3} m³</span>
            <span>Weight: {summary.totalWeight_kg.toFixed(0)} / {summary.maxWeight_kg} kg</span>
          </div>
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(0, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 255, 255, 0.3)'
          }}>
            <div style={{
              width: `${Math.min(summary.volumePercent, 100)}%`,
              height: '100%',
              background: summary.volumePercent > 90 
                ? 'linear-gradient(90deg, #ff0000, #ff6600)' 
                : 'linear-gradient(90deg, #00ffff, #00cccc)',
              boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          borderBottom: '1px solid rgba(0, 255, 255, 0.2)',
          paddingBottom: '15px'
        }}>
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              style={{
                padding: '8px 16px',
                background: activeFilter === filter.id 
                  ? 'rgba(0, 255, 255, 0.2)' 
                  : 'rgba(0, 255, 255, 0.05)',
                border: `1px solid ${activeFilter === filter.id ? '#00ffff' : 'rgba(0, 255, 255, 0.3)'}`,
                color: activeFilter === filter.id ? '#00ffff' : 'rgba(0, 255, 255, 0.6)',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.2s ease'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Scrollable 15-column Grid */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '2px solid rgba(0, 255, 255, 0.3)',
            boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.1)'
          }}
          className="holo-scroll"
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))',
              gap: '6px',
              minHeight: '100%'
            }}
          >
            {Array.from({ length: Math.max(150, gridItems.length) }, (_, index) => {
              const item = gridItems[index] || null;
              const isHovering = hoverIndex === index && draggedItem;
              
              return (
                <div
                  key={index}
                  style={{
                    aspectRatio: '1 / 1',
                    position: 'relative'
                  }}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <ItemFrame
                    item={item}
                    onDragStart={() => item && handleDragStart(item, index)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedItem?.instanceId === item?.instanceId}
                    isHovering={isHovering}
                    onClick={() => item && setSelectedItem(item)}
                    gridMode={true}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Stats */}
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(0, 255, 255, 0.05)',
          border: '1px solid rgba(0, 255, 255, 0.2)',
          borderRadius: '4px',
          fontSize: '11px',
          color: 'rgba(0, 255, 255, 0.7)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Total Items: {summary.itemCount}</span>
          <span>Capacity: {summary.volumePercent.toFixed(1)}% | Weight: {summary.weightPercent.toFixed(1)}%</span>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onTransferToShip={(instanceId, quantity) => {
            if (viewMode === 'homebase') {
              handleTransferToShip(instanceId, quantity);
              setSelectedItem(null); // close after transfer
            }
          }}
          canTransfer={viewMode === 'homebase'}
          onApplyScrap={(item, res) => {
            const newInventory = JSON.parse(JSON.stringify(inventory)); // Deep clone
            // remove scrapped item (one unit)
            removeItem(newInventory, viewMode, item.instanceId, 1);
            // add outputs
            res.outputs.forEach(o => {
              addItem(newInventory, viewMode, o.id, o.quantity);
            });
            setInventory(newInventory);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}
