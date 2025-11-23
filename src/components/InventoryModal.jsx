import { useEffect, useState } from 'react'
import { getShipState } from '../lib/shipState.js'

/**
 * Inventory Modal - Grid-based inventory display
 * Shows ship inventory in a holographic grid layout matching the design
 */

const InventoryModal = ({ 
  isOpen, 
  onClose
}) => {
  const [inventory, setInventory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Load inventory from shipState
  useEffect(() => {
    if (isOpen) {
      const shipState = getShipState();
      const state = shipState.getState();
      setInventory(state.inventory || []);
    }
  }, [isOpen]);
  
  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  // Grid size: 6 columns x 5 rows = 30 slots
  const GRID_COLS = 6;
  const GRID_ROWS = 5;
  const TOTAL_SLOTS = GRID_COLS * GRID_ROWS;
  
  // Create grid array with items + empty slots
  const gridItems = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    return inventory[i] || null;
  });
  
  const handleSlotClick = (item, index) => {
    if (item) {
      setSelectedItem(selectedItem?.index === index ? null : { ...item, index });
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(8px)'
    }}
    onClick={onClose}
    >
      <div 
        style={{
          width: '700px',
          height: '650px',
          background: 'linear-gradient(135deg, rgba(0, 30, 45, 0.95) 0%, rgba(0, 40, 60, 0.98) 100%)',
          border: '3px solid rgba(52, 224, 255, 0.8)',
          borderRadius: '20px',
          boxShadow: '0 0 60px rgba(52, 224, 255, 0.7), 0 0 120px rgba(52, 224, 255, 0.4), inset 0 3px 0 rgba(52, 224, 255, 0.5), inset 0 -3px 30px rgba(0, 120, 180, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Outer glow frame effect */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          border: '2px solid rgba(52, 224, 255, 0.3)',
          borderRadius: '24px',
          pointerEvents: 'none',
          boxShadow: '0 0 40px rgba(52, 224, 255, 0.5)',
          zIndex: -1
        }} />
        
        {/* Header */}
        <div style={{
          padding: '28px 36px 24px 36px',
          borderBottom: 'none',
          background: 'linear-gradient(180deg, rgba(0, 60, 90, 0.4) 0%, transparent 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '300',
            color: '#34e0ff',
            letterSpacing: '8px',
            textShadow: '0 0 20px rgba(52, 224, 255, 1), 0 0 40px rgba(52, 224, 255, 0.6), 0 0 60px rgba(52, 224, 255, 0.3)',
            textTransform: 'uppercase',
            fontFamily: 'Roobert, sans-serif'
          }}>
            INVENTORY
          </div>
        </div>
        
        {/* Action Buttons Row */}
        <div style={{
          padding: '0 36px 20px 36px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-start'
        }}>
          {['JETTISON', 'SALVAGE', 'LOCK', 'MARK FOR SCRAP'].map(label => (
            <button
              key={label}
              style={{
                padding: '10px 20px',
                background: 'rgba(0, 20, 30, 0.6)',
                border: '2px solid rgba(52, 224, 255, 0.5)',
                borderRadius: '8px',
                color: 'rgba(52, 224, 255, 0.7)',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '1.5px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 0 8px rgba(52, 224, 255, 0.2), inset 0 1px 0 rgba(52, 224, 255, 0.2)',
                textShadow: '0 0 6px rgba(52, 224, 255, 0.5)',
                opacity: selectedItem ? 1 : 0.5,
                pointerEvents: selectedItem ? 'auto' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedItem) {
                  e.currentTarget.style.background = 'rgba(52, 224, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.9)';
                  e.currentTarget.style.color = '#34e0ff';
                  e.currentTarget.style.boxShadow = '0 0 16px rgba(52, 224, 255, 0.5), inset 0 1px 0 rgba(52, 224, 255, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 20, 30, 0.6)';
                e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.5)';
                e.currentTarget.style.color = 'rgba(52, 224, 255, 0.7)';
                e.currentTarget.style.boxShadow = '0 0 8px rgba(52, 224, 255, 0.2), inset 0 1px 0 rgba(52, 224, 255, 0.2)';
              }}
            >
              {label}
            </button>
          ))}
        </div>
        
        {/* Inventory Grid */}
        <div style={{
          flex: 1,
          padding: '0 36px 36px 36px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
            gap: '2px',
            background: 'rgba(52, 224, 255, 0.15)',
            border: '2px solid rgba(52, 224, 255, 0.4)',
            borderRadius: '8px',
            padding: '2px',
            height: '100%',
            boxShadow: 'inset 0 0 20px rgba(0, 100, 150, 0.3), 0 0 15px rgba(52, 224, 255, 0.2)'
          }}>
            {gridItems.map((item, index) => (
              <div
                key={index}
                onClick={() => handleSlotClick(item, index)}
                style={{
                  background: item 
                    ? 'linear-gradient(135deg, rgba(0, 40, 60, 0.8) 0%, rgba(0, 60, 90, 0.9) 100%)'
                    : 'rgba(0, 20, 35, 0.5)',
                  border: selectedItem?.index === index
                    ? '2px solid rgba(52, 224, 255, 1)'
                    : item
                    ? '1px solid rgba(52, 224, 255, 0.3)'
                    : '1px solid rgba(52, 224, 255, 0.15)',
                  borderRadius: '4px',
                  cursor: item ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: item 
                    ? '0 0 8px rgba(52, 224, 255, 0.3), inset 0 1px 0 rgba(52, 224, 255, 0.2)'
                    : 'inset 0 0 5px rgba(0, 0, 0, 0.5)',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (item) {
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.7)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(52, 224, 255, 0.5), inset 0 1px 0 rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (item && selectedItem?.index !== index) {
                    e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 8px rgba(52, 224, 255, 0.3), inset 0 1px 0 rgba(52, 224, 255, 0.2)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                {item && (
                  <>
                    {/* Item Icon/Visual - placeholder for now */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      right: '8px',
                      bottom: '20px',
                      background: 'radial-gradient(circle, rgba(52, 224, 255, 0.3) 0%, transparent 70%)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: 'rgba(52, 224, 255, 0.6)'
                    }}>
                      {getItemIcon(item)}
                    </div>
                    
                    {/* Quantity Badge */}
                    {item.quantity > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        background: 'rgba(52, 224, 255, 0.2)',
                        border: '1px solid rgba(52, 224, 255, 0.5)',
                        borderRadius: '3px',
                        padding: '2px 5px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#34e0ff',
                        textShadow: '0 0 6px rgba(52, 224, 255, 0.8)',
                        boxShadow: '0 0 6px rgba(52, 224, 255, 0.4)'
                      }}>
                        {item.quantity}
                      </div>
                    )}
                    
                    {/* Item Name on Hover */}
                    <div style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      right: item.quantity > 1 ? '30px' : '4px',
                      fontSize: '9px',
                      color: 'rgba(52, 224, 255, 0.8)',
                      fontWeight: '600',
                      textAlign: 'center',
                      textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.name}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Close button - ESC hint */}
        <div style={{
          position: 'absolute',
          top: '32px',
          right: '36px',
          fontSize: '10px',
          color: 'rgba(52, 224, 255, 0.5)',
          letterSpacing: '1px',
          textShadow: '0 0 8px rgba(52, 224, 255, 0.6)'
        }}>
          [ESC] to close
        </div>
      </div>
    </div>
  );
};

// Get appropriate icon for item type
const getItemIcon = (item) => {
  const type = item.type || item.category || 'unknown';
  
  switch(type.toLowerCase()) {
    case 'ore':
    case 'mineral':
    case 'resource':
      return '⬢'; // Hexagon for ore/minerals
    case 'fragment':
    case 'component':
      return '⚙'; // Gear for components
    case 'artifact':
    case 'rare':
      return '◆'; // Diamond for artifacts
    case 'fuel':
    case 'energy':
      return '⚡'; // Lightning for fuel/energy
    case 'data':
    case 'intel':
      return '▣'; // Square for data
    default:
      return '■'; // Square for unknown
  }
};

export default InventoryModal;
