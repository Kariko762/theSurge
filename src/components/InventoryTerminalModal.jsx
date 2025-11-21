import React, { useState } from 'react';

/**
 * InventoryTerminalModal - Terminal-style inventory viewer with drag-drop and contextual actions
 * Shows up in terminal feed when user requests inventory audit
 */

const InventoryTerminalModal = ({ inventory, maxCapacity, onClose, onJettison, onDestroy, onSmelt, onSplit, onMoveItem }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState(null); // {x, y, itemId, quantity, index}
  const [splitAmount, setSplitAmount] = useState(1);

  // Calculate total used capacity
  const usedCapacity = inventory.reduce((sum, item) => sum + (item.quantity * (item.size || 1)), 0);
  const capacityPercent = (usedCapacity / maxCapacity) * 100;

  const handleDragStart = (e, item, index) => {
    setDraggedItem(item);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      onMoveItem(draggedIndex, targetIndex);
    }
    setDraggedItem(null);
    setDraggedIndex(null);
  };

  const handleContextMenu = (e, item, index) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId: item.itemId,
      quantity: item.quantity,
      index,
      item
    });
  };

  const handleContextAction = (action) => {
    if (!contextMenu) return;

    switch (action) {
      case 'jettison':
        onJettison(contextMenu.index, contextMenu.quantity);
        break;
      case 'destroy':
        onDestroy(contextMenu.index, contextMenu.quantity);
        break;
      case 'smelt':
        onSmelt(contextMenu.index);
        break;
      case 'split':
        if (splitAmount > 0 && splitAmount < contextMenu.quantity) {
          onSplit(contextMenu.index, splitAmount);
        }
        break;
    }
    setContextMenu(null);
  };

  return (
    <div style={{
      position: 'relative',
      padding: '12px 16px',
      border: '2px solid rgba(0,255,255,0.6)',
      borderRadius: '8px',
      boxShadow: '0 0 10px rgba(0,255,255,0.25), inset 0 0 16px rgba(0,255,255,0.1)',
      background: 'rgba(0,15,25,0.85)',
      fontFamily: 'Consolas, monospace',
      color: '#00ffff',
      marginTop: '12px'
    }}>
      {/* Inner frame */}
      <div style={{
        position: 'absolute',
        inset: '6px',
        border: '1px solid rgba(0,255,255,0.35)',
        borderRadius: '5px',
        pointerEvents: 'none'
      }} />

      {/* AI Response */}
      <div style={{
        marginBottom: '12px',
        padding: '10px 12px',
        border: '1px solid rgba(0,255,255,0.35)',
        borderRadius: '4px',
        background: 'rgba(0,25,40,0.5)',
        boxShadow: 'inset 0 0 10px rgba(0,255,255,0.2)',
        fontSize: '11px',
        fontStyle: 'italic',
        lineHeight: '1.4'
      }}>
        "Certainly, running a quick audit..."
      </div>

      {/* Capacity Bar */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#34e0ff',
          marginBottom: '4px',
          fontWeight: '600'
        }}>
          <span>STORAGE CAPACITY</span>
          <span>{usedCapacity} / {maxCapacity} UNITS ({capacityPercent.toFixed(1)}%)</span>
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          background: 'rgba(0,20,40,0.8)',
          border: '1px solid rgba(52,224,255,0.4)',
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.min(capacityPercent, 100)}%`,
            background: capacityPercent > 90 
              ? 'linear-gradient(90deg, rgba(255,80,80,0.6), rgba(255,80,80,0.8))'
              : capacityPercent > 75
              ? 'linear-gradient(90deg, rgba(255,180,80,0.6), rgba(255,180,80,0.8))'
              : 'linear-gradient(90deg, rgba(52,224,255,0.6), rgba(52,224,255,0.8))',
            boxShadow: 'inset 0 0 8px rgba(255,255,255,0.3)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Inventory Grid */}
      <div style={{
        border: '1px solid rgba(0,255,255,0.3)',
        borderRadius: '4px',
        padding: '8px',
        background: 'rgba(0,22,34,0.5)',
        minHeight: '120px',
        maxHeight: '300px',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '8px'
        }}>
          {inventory.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '20px',
              fontSize: '10px',
              color: 'rgba(52,224,255,0.5)',
              fontStyle: 'italic'
            }}>
              INVENTORY EMPTY
            </div>
          ) : inventory.map((item, index) => (
            <div
              key={`${item.itemId}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onContextMenu={(e) => handleContextMenu(e, item, index)}
              style={{
                padding: '8px',
                border: draggedIndex === index 
                  ? '2px solid rgba(255,255,255,0.8)' 
                  : '1px solid rgba(52,224,255,0.4)',
                borderRadius: '4px',
                background: draggedIndex === index 
                  ? 'rgba(52,224,255,0.2)' 
                  : 'rgba(0,30,50,0.6)',
                cursor: 'grab',
                transition: 'all 0.2s',
                position: 'relative',
                minHeight: '60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                if (draggedIndex !== index) {
                  e.currentTarget.style.borderColor = 'rgba(52,224,255,0.8)';
                  e.currentTarget.style.background = 'rgba(0,40,60,0.7)';
                }
              }}
              onMouseLeave={(e) => {
                if (draggedIndex !== index) {
                  e.currentTarget.style.borderColor = 'rgba(52,224,255,0.4)';
                  e.currentTarget.style.background = 'rgba(0,30,50,0.6)';
                }
              }}
            >
              <div style={{
                fontSize: '9px',
                fontWeight: '600',
                color: '#34e0ff',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {item.name || item.itemId}
              </div>
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#fff',
                textAlign: 'right'
              }}>
                ×{item.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999
            }}
            onClick={() => setContextMenu(null)}
          />
          
          <div style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            background: 'rgba(0,20,40,0.95)',
            border: '1px solid rgba(52,224,255,0.6)',
            borderRadius: '4px',
            padding: '8px',
            minWidth: '140px',
            boxShadow: '0 0 20px rgba(0,0,0,0.8), 0 0 10px rgba(52,224,255,0.4)',
            zIndex: 1000,
            fontSize: '10px'
          }}>
            <div
              onClick={() => handleContextAction('jettison')}
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                borderRadius: '2px',
                color: '#34e0ff',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(52,224,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              🚀 JETTISON
            </div>
            <div
              onClick={() => handleContextAction('destroy')}
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                borderRadius: '2px',
                color: '#ff5050',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,80,80,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              💥 DESTROY
            </div>
            <div
              onClick={() => handleContextAction('smelt')}
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                borderRadius: '2px',
                color: '#ffb63c',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,180,60,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              🔥 SMELT
            </div>
            
            {contextMenu.quantity > 1 && (
              <>
                <div style={{
                  height: '1px',
                  background: 'rgba(52,224,255,0.3)',
                  margin: '6px 0'
                }} />
                <div style={{
                  padding: '6px 8px',
                  color: '#34e0ff'
                }}>
                  <div style={{ marginBottom: '4px' }}>✂️ SPLIT STACK</div>
                  <input
                    type="number"
                    min="1"
                    max={contextMenu.quantity - 1}
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(parseInt(e.target.value) || 1)}
                    style={{
                      width: '100%',
                      padding: '4px',
                      background: 'rgba(0,30,50,0.8)',
                      border: '1px solid rgba(52,224,255,0.4)',
                      borderRadius: '2px',
                      color: '#34e0ff',
                      fontSize: '10px',
                      marginBottom: '4px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={() => handleContextAction('split')}
                    style={{
                      width: '100%',
                      padding: '4px',
                      background: 'rgba(52,224,255,0.15)',
                      border: '1px solid rgba(52,224,255,0.5)',
                      borderRadius: '2px',
                      color: '#34e0ff',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    CONFIRM
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Close Button */}
      <div style={{
        marginTop: '12px',
        textAlign: 'right'
      }}>
        <button
          onClick={onClose}
          style={{
            padding: '6px 12px',
            background: 'rgba(52,224,255,0.15)',
            border: '1px solid rgba(52,224,255,0.5)',
            borderRadius: '4px',
            color: '#34e0ff',
            fontSize: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            letterSpacing: '0.5px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(52,224,255,0.3)';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(52,224,255,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(52,224,255,0.15)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};

export default InventoryTerminalModal;
