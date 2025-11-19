import { useState, useMemo } from 'react'

/**
 * Actions Panel - Shows available actions based on proximity to POIs
 * Integrated with DRE (Dynamic Random Engine) for action execution
 */

const ActionsPanel = ({ system, shipPosition, pois, onActionExecute }) => {
  const INTERACTION_RANGE = 5; // AU - how close you need to be to interact
  
  // Calculate which POIs are in range
  const nearbyPOIs = useMemo(() => {
    if (!system || !shipPosition || !pois) return [];
    
    return pois.filter(poi => {
      if (poi.id === 'SUN') return false; // Can't interact with sun
      
      // Calculate distance from ship to POI
      const dx = poi.x - shipPosition.x;
      const dy = poi.y - shipPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance <= INTERACTION_RANGE;
    }).map(poi => {
      const dx = poi.x - shipPosition.x;
      const dy = poi.y - shipPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return { ...poi, distanceFromShip: distance };
    }).sort((a, b) => a.distanceFromShip - b.distanceFromShip);
  }, [system, shipPosition, pois]);
  
  // Determine available actions based on POI type
  const getActionsForPOI = (poi) => {
    const actions = [];
    
    switch (poi.type) {
      case 'planet':
        actions.push({ id: 'scan', label: 'Scan Surface', icon: '🔍' });
        actions.push({ id: 'orbit', label: 'Enter Orbit', icon: '🛸' });
        break;
      case 'station':
      case 'orbital':
      case 'habitat':
        actions.push({ id: 'hail', label: 'Hail Station', icon: '📡' });
        actions.push({ id: 'dock', label: 'Request Docking', icon: '🔗' });
        break;
      case 'anomaly':
        actions.push({ id: 'investigate', label: 'Investigate', icon: '❓' });
        actions.push({ id: 'scan', label: 'Deep Scan', icon: '🔍' });
        break;
      case 'belt':
        actions.push({ id: 'mine', label: 'Mine Resources', icon: '⛏️' });
        actions.push({ id: 'scan', label: 'Scan Belt', icon: '🔍' });
        break;
      case 'facility':
        actions.push({ id: 'hail', label: 'Hail Facility', icon: '📡' });
        actions.push({ id: 'approach', label: 'Approach', icon: '➡️' });
        break;
      case 'distress':
        actions.push({ id: 'respond', label: 'Respond to Distress', icon: '🆘' });
        actions.push({ id: 'scan', label: 'Scan Signal', icon: '🔍' });
        break;
      default:
        actions.push({ id: 'scan', label: 'Scan', icon: '🔍' });
    }
    
    return actions;
  };
  
  const handleAction = (poi, action) => {
    if (onActionExecute) {
      onActionExecute({
        poiId: poi.id,
        poiName: poi.name,
        poiType: poi.type,
        actionId: action.id,
        actionLabel: action.label,
        distance: poi.distanceFromShip
      });
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '225px',
      right: '490px',
      width: '300px',
      maxHeight: 'calc(100vh - 220px)',
      background: 'rgba(0, 12, 18, 0.95)',
      border: '1px solid rgba(52, 224, 255, 0.6)',
      borderRadius: '8px',
      boxShadow: '0 0 20px rgba(52, 224, 255, 0.4)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(52, 224, 255, 0.3)',
        background: 'rgba(52, 224, 255, 0.1)',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#34e0ff',
        letterSpacing: '0.5px'
      }}>
        AVAILABLE ACTIONS
      </div>
      
      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px'
      }}>
        {nearbyPOIs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(207, 216, 223, 0.5)',
            fontSize: '10px'
          }}>
            No POIs within interaction range<br/>
            <span style={{ fontSize: '9px' }}>(within {INTERACTION_RANGE} AU)</span>
          </div>
        ) : (
          nearbyPOIs.map(poi => {
            const actions = getActionsForPOI(poi);
            
            return (
              <div key={poi.id} style={{
                marginBottom: '16px',
                padding: '12px',
                background: 'rgba(52, 224, 255, 0.05)',
                border: '1px solid rgba(52, 224, 255, 0.2)',
                borderRadius: '6px'
              }}>
                {/* POI Header */}
                <div style={{
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(52, 224, 255, 0.2)'
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#34e0ff',
                    marginBottom: '4px'
                  }}>
                    {poi.name}
                  </div>
                  <div style={{
                    fontSize: '9px',
                    color: 'rgba(207, 216, 223, 0.6)',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{poi.type.toUpperCase()}</span>
                    <span>{poi.distanceFromShip.toFixed(2)} AU</span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {actions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleAction(poi, action)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(52, 224, 255, 0.1)',
                        border: '1px solid rgba(52, 224, 255, 0.4)',
                        borderRadius: '4px',
                        color: '#34e0ff',
                        fontSize: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(52, 224, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(52, 224, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.4)';
                      }}
                    >
                      <span>{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActionsPanel;
