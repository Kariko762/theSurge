import { useState, useEffect } from 'react'
import { getGameTime } from '../lib/gameTime.js'

/**
 * Right Panel Tabbed Interface for Solar System Map
 * Tabs: POIs, Ship Stats, Inventory, Actions, Communication
 */

const RightPanelTabs = ({ 
  system, 
  shipPosition, 
  pois, 
  droppedPins,
  scanProgress,
  selectedPOI,
  setSelectedPOI,
  setLockedSelection,
  centerOnPOI,
  moveShipTo,
  isMoving,
  movementProgress,
  scanningActive,
  startSystemScan,
  shipState,
  onSequenceWaypointAdd,
  sequenceSteps,
  setSequenceSteps,
  resetToDefaultView
}) => {
  const [activeTab, setActiveTab] = useState('pois');
  const [openDropdown, setOpenDropdown] = useState(null); // {type, poiId}
  const [poiTags, setPoiTags] = useState({});
  
  // Automation/Workflow state
  const [automationCollapsed, setAutomationCollapsed] = useState(false);
  const [isCreatingSequence, setIsCreatingSequence] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [autoApprove, setAutoApprove] = useState(false);
  const [showConfirmExecute, setShowConfirmExecute] = useState(false);
  const [showStepConfirm, setShowStepConfirm] = useState(false);
  const [gameTimeDisplay, setGameTimeDisplay] = useState('DAY 0 // 00:00');

  // Subscribe to game time updates
  useEffect(() => {
    const gameTime = getGameTime();
    const updateTime = () => {
      setGameTimeDisplay(gameTime.formatGameTime());
    };
    
    updateTime(); // Initial update
    const unsubscribe = gameTime.subscribe(updateTime);
    
    return unsubscribe;
  }, []);

  const tabs = [
    { id: 'pois', label: 'Points of Interest' },
    { id: 'ship', label: 'Ship Stats' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'actions', label: 'Actions' },
    { id: 'comms', label: 'Communication' }
  ];

  const moveDistances = [0.5, 1, 2, 5, 10, 25, 50, 100];
  const tagOptions = [
    { id: 'visited', icon: '✓', label: 'Visited', color: '#52ffa8' },
    { id: 'avoid', icon: '⚠', label: 'Avoid', color: '#ff5050' },
    { id: 'cache', icon: '📦', label: 'Cache', color: '#ffa500' },
    { id: 'mine', icon: '⛏', label: 'Mining', color: '#00aaff' },
    { id: 'quest', icon: '❗', label: 'Quest', color: '#ff0' }
  ];

  const toggleTag = (poiId, tagId) => {
    setPoiTags(prev => {
      const current = prev[poiId] || [];
      if (current.includes(tagId)) {
        return { ...prev, [poiId]: current.filter(t => t !== tagId) };
      } else {
        return { ...prev, [poiId]: [...current, tagId] };
      }
    });
  };

  const handleMoveToDistance = (poi, distance) => {
    // Get POI position
    const poiX = poi.x !== undefined ? poi.x : poi.distanceAU * Math.cos(poi.angleRad);
    const poiY = poi.y !== undefined ? poi.y : poi.distanceAU * Math.sin(poi.angleRad);
    
    // Calculate direction from ship to POI
    const dx = poiX - shipPosition.x;
    const dy = poiY - shipPosition.y;
    const distFromShip = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate how far to move (stop 'distance' AU away from POI)
    const moveRatio = (distFromShip - distance) / distFromShip;
    
    // Calculate target position
    const targetX = shipPosition.x + dx * moveRatio;
    const targetY = shipPosition.y + dy * moveRatio;
    
    // Convert to polar coordinates
    const targetAU = Math.sqrt(targetX * targetX + targetY * targetY);
    const targetAngle = Math.atan2(targetY, targetX);
    
    // Move ship to calculated position
    moveShipTo(targetAU, targetAngle);
    setOpenDropdown(null);
  };

  const renderPOIsTab = () => {
    const scannedPOIs = pois.filter(p => p.id !== 'SUN' && scanProgress.includes(p.id)).sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.distanceAU * Math.cos(a.angleRad) - shipPosition.x, 2) + Math.pow(a.distanceAU * Math.sin(a.angleRad) - shipPosition.y, 2));
      const distB = Math.sqrt(Math.pow(b.distanceAU * Math.cos(b.angleRad) - shipPosition.x, 2) + Math.pow(b.distanceAU * Math.sin(b.angleRad) - shipPosition.y, 2));
      return distA - distB;
    });
    
    // Add dropped pins to the POI list
    const allPOIs = [...scannedPOIs, ...(droppedPins || [])].sort((a, b) => {
      const aX = a.x !== undefined ? a.x : a.distanceAU * Math.cos(a.angleRad);
      const aY = a.y !== undefined ? a.y : a.distanceAU * Math.sin(a.angleRad);
      const bX = b.x !== undefined ? b.x : b.distanceAU * Math.cos(b.angleRad);
      const bY = b.y !== undefined ? b.y : b.distanceAU * Math.sin(b.angleRad);
      const distA = Math.sqrt(Math.pow(aX - shipPosition.x, 2) + Math.pow(aY - shipPosition.y, 2));
      const distB = Math.sqrt(Math.pow(bX - shipPosition.x, 2) + Math.pow(bY - shipPosition.y, 2));
      return distA - distB;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Commands Section */}
        <div style={{ 
          padding: '12px', 
          borderBottom: '1px solid rgba(52, 224, 255, 0.3)',
          flexShrink: 0
        }}>
          <button 
            className="action-btn" 
            onClick={startSystemScan}
            disabled={scanningActive}
            style={{ width: '100%', opacity: scanningActive ? 0.5 : 1, marginBottom: '8px' }}
          >
            {scanningActive ? 'Scanning...' : 'Scan System'}
          </button>
        </div>

        {/* POI Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px', paddingBottom: '80px', minHeight: '400px' }}>
          {allPOIs.map(poi => {
            const x = poi.x !== undefined ? poi.x : poi.distanceAU * Math.cos(poi.angleRad);
            const y = poi.y !== undefined ? poi.y : poi.distanceAU * Math.sin(poi.angleRad);
            const distFromShip = Math.sqrt(Math.pow(x - shipPosition.x, 2) + Math.pow(y - shipPosition.y, 2));
            const tags = poiTags[poi.id] || [];
            const inRange = distFromShip <= 5; // 5 AU interaction range
            const isNavPoint = poi.id && poi.id.startsWith('PIN_');

            return (
              <div 
                key={poi.id}
                style={{
                  background: selectedPOI === poi.id ? 'rgba(52, 224, 255, 0.15)' : 'rgba(0, 0, 0, 0.4)',
                  border: `1px solid ${selectedPOI === poi.id ? 'rgba(52, 224, 255, 0.9)' : 'rgba(52, 224, 255, 0.3)'}`,
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  overflow: 'visible',
                  position: 'relative',
                  zIndex: openDropdown?.poiId === poi.id ? 100 : 1
                }}
                onClick={() => { setSelectedPOI(poi.id); setLockedSelection(true); }}
              >
                {/* POI Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: isNavPoint ? '#ffc864' : '#34e0ff', fontWeight: 'bold' }}>
                    {isNavPoint && '📍 '}{poi.name}
                    {tags.map(tagId => {
                      const tag = tagOptions.find(t => t.id === tagId);
                      return tag ? (
                        <span key={tagId} style={{ marginLeft: '6px', fontSize: '10px' }} title={tag.label}>
                          {tag.icon}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(207, 216, 223, 0.6)' }}>
                    {distFromShip.toFixed(2)} AU
                  </div>
                </div>

                {/* POI Info */}
                <div style={{ fontSize: '9px', color: 'rgba(207, 216, 223, 0.7)', marginBottom: '8px' }}>
                  {isNavPoint ? 'NAV POINT' : poi.type.toUpperCase()}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '6px', position: 'relative' }}>
                  {/* Move To Button */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <button
                      className="small-btn"
                      style={{ width: '100%', fontSize: '8px', padding: '5px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown?.poiId === poi.id && openDropdown?.type === 'moveTo' 
                          ? null 
                          : { type: 'moveTo', poiId: poi.id });
                      }}
                      disabled={isMoving}
                    >
                      Move To
                    </button>
                    {openDropdown?.type === 'moveTo' && openDropdown?.poiId === poi.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        background: 'rgba(0, 20, 40, 0.95)',
                        border: '1px solid #34e0ff',
                        borderRadius: '4px',
                        padding: '6px',
                        minWidth: '120px',
                        zIndex: 1000,
                        boxShadow: '0 0 15px rgba(52, 224, 255, 0.4)'
                      }}>
                        <div style={{ fontSize: '8px', color: '#cfd8df', marginBottom: '6px', fontWeight: 'bold' }}>
                          Approach Distance
                        </div>
                        {moveDistances.filter(d => d <= distFromShip).map(dist => (
                          <button
                            key={dist}
                            className="small-btn"
                            style={{ width: '100%', fontSize: '8px', padding: '4px', marginBottom: '3px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveToDistance(poi, dist);
                            }}
                          >
                            {dist} AU
                          </button>
                        ))}
                        <button
                          className="small-btn"
                          style={{ width: '100%', fontSize: '8px', padding: '4px', background: 'rgba(52, 224, 255, 0.2)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveShipTo(poi.id);
                            setOpenDropdown(null);
                          }}
                        >
                          Exact Location
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tag Button */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <button
                      className="small-btn"
                      style={{ width: '100%', fontSize: '8px', padding: '5px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown?.poiId === poi.id && openDropdown?.type === 'tag' 
                          ? null 
                          : { type: 'tag', poiId: poi.id });
                      }}
                    >
                      Tag
                    </button>
                    {openDropdown?.type === 'tag' && openDropdown?.poiId === poi.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        background: 'rgba(0, 20, 40, 0.95)',
                        border: '1px solid #34e0ff',
                        borderRadius: '4px',
                        padding: '6px',
                        display: 'flex',
                        gap: '4px',
                        zIndex: 1000,
                        boxShadow: '0 0 15px rgba(52, 224, 255, 0.4)'
                      }}>
                        {tagOptions.map(tag => (
                          <button
                            key={tag.id}
                            style={{
                              width: '24px',
                              height: '24px',
                              background: tags.includes(tag.id) ? `${tag.color}40` : 'rgba(0, 0, 0, 0.6)',
                              border: `1px solid ${tags.includes(tag.id) ? tag.color : 'rgba(52, 224, 255, 0.4)'}`,
                              borderRadius: '3px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTag(poi.id, tag.id);
                            }}
                            title={tag.label}
                          >
                            {tag.icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Button */}
                  <div style={{ position: 'relative', flex: 1 }}>
                    <button
                      className="small-btn"
                      style={{ 
                        width: '100%', 
                        fontSize: '8px', 
                        padding: '5px',
                        opacity: inRange ? 1 : 0.3
                      }}
                      disabled={!inRange}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inRange) {
                          setOpenDropdown(openDropdown?.poiId === poi.id && openDropdown?.type === 'actions' 
                            ? null 
                            : { type: 'actions', poiId: poi.id });
                        }
                      }}
                    >
                      Actions
                    </button>
                    {openDropdown?.type === 'actions' && openDropdown?.poiId === poi.id && inRange && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '2px',
                        background: 'rgba(0, 20, 40, 0.95)',
                        border: '1px solid #34e0ff',
                        borderRadius: '4px',
                        padding: '6px',
                        minWidth: '100px',
                        zIndex: 1000,
                        boxShadow: '0 0 15px rgba(52, 224, 255, 0.4)'
                      }}>
                        <button className="small-btn" style={{ width: '100%', fontSize: '8px', padding: '4px', marginBottom: '3px' }}>
                          Scan
                        </button>
                        <button className="small-btn" style={{ width: '100%', fontSize: '8px', padding: '4px', marginBottom: '3px' }}>
                          Mine
                        </button>
                        <button className="small-btn" style={{ width: '100%', fontSize: '8px', padding: '4px' }}>
                          Investigate
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderShipStatsTab = () => {
    return (
      <div style={{ padding: '16px', fontSize: '10px', color: '#cfd8df' }}>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', color: '#34e0ff', marginBottom: '6px' }}>SHIP STATUS</div>
          <div>Hull: {shipState.getState().currentHull}%</div>
          <div>Shields: {shipState.getState().currentShields}%</div>
          <div>Fuel: {shipState.getState().fuel}%</div>
        </div>
        <div>
          <div style={{ fontSize: '9px', color: '#34e0ff', marginBottom: '6px' }}>POSITION</div>
          <div>X: {shipPosition.x.toFixed(2)} AU</div>
          <div>Y: {shipPosition.y.toFixed(2)} AU</div>
          <div>Distance from Sun: {shipPosition.distanceAU.toFixed(2)} AU</div>
        </div>
      </div>
    );
  };

  const renderInventoryTab = () => {
    const inventory = shipState.getState().inventory;
    const cargoMass = shipState.getState().cargoMass;
    const cargoCapacity = shipState.getState().cargoCapacity;
    const fillPercent = (cargoMass / cargoCapacity) * 100;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '12px' }}>
        {/* Filter buttons */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <button className="small-btn" style={{ fontSize: '8px', padding: '4px 8px' }}>All</button>
          <button className="small-btn" style={{ fontSize: '8px', padding: '4px 8px' }}>Resources</button>
          <button className="small-btn" style={{ fontSize: '8px', padding: '4px 8px' }}>Components</button>
          <button className="small-btn" style={{ fontSize: '8px', padding: '4px 8px' }}>Artifacts</button>
        </div>

        {/* Cargo capacity bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', color: '#34e0ff', marginBottom: '4px' }}>
            CARGO: {cargoMass.toFixed(1)}t / {cargoCapacity}t ({fillPercent.toFixed(1)}%)
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${fillPercent}%` }}></div>
          </div>
        </div>

        {/* Inventory grid */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '8px',
          alignContent: 'start'
        }}>
          {inventory.map(item => (
            <div 
              key={item.id}
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(52, 224, 255, 0.3)',
                borderRadius: '4px',
                padding: '8px',
                cursor: 'grab',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(52, 224, 255, 0.3)'}
            >
              <div style={{ 
                width: '100%',
                height: '60px',
                background: 'rgba(52, 224, 255, 0.08)',
                border: '1px dashed rgba(52, 224, 255, 0.3)',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                📦
              </div>
              <div style={{ fontSize: '9px', color: '#cfd8df', marginBottom: '4px', textAlign: 'center' }}>
                {item.name}
              </div>
              {item.stackable && (
                <div style={{ fontSize: '8px', color: '#34e0ff', textAlign: 'center' }}>
                  x{item.quantity}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActionsTab = () => {
    const handleCreateSequence = () => {
      if (isCreatingSequence) {
        // Complete sequence - notify parent to stop listening for clicks
        setIsCreatingSequence(false);
        if (onSequenceWaypointAdd) {
          onSequenceWaypointAdd(null); // Signal completion
        }
      } else {
        // Start creating sequence - notify parent to start listening for clicks
        setIsCreatingSequence(true);
        if (onSequenceWaypointAdd) {
          onSequenceWaypointAdd((worldX, worldY, action) => {
            // This callback will be called when user selects an action from the menu
            const newStep = {
              x: worldX,
              y: worldY,
              action: action || 'Move To',
              status: 'queued'
            };
            setSequenceSteps(steps => [...steps, newStep]);
          });
        }
      }
    };
    const handleChangeAction = () => {
      // Change action for selected sequence step
      // TODO: Implement action change UI
    };

    const handleDeleteAction = () => {
      // Delete selected sequence step
      if (sequenceSteps.length > 0) {
        // TODO: Add selection mechanism
        setSequenceSteps(steps => steps.slice(0, -1)); // For now, delete last
      }
    };

    const handleClearAll = () => {
      setSequenceSteps([]);
      setCurrentStepIndex(-1);
      setIsCreatingSequence(false);
    };

    const handleExecute = () => {
      if (sequenceSteps.length === 0) return;
      setShowConfirmExecute(true);
    };

    const executeSequence = () => {
      setShowConfirmExecute(false);
      // Reset to default view before starting sequence
      if (resetToDefaultView) {
        resetToDefaultView();
      }
      // Find first non-executed step
      const firstIncompleteIndex = sequenceSteps.findIndex(step => step.status !== 'executed');
      const startIndex = firstIncompleteIndex >= 0 ? firstIncompleteIndex : 0;
      setCurrentStepIndex(startIndex);
      executeStep(startIndex);
    };

    const executeStep = (index) => {
      if (index >= sequenceSteps.length) {
        // Sequence complete - auto clear
        setCurrentStepIndex(-1);
        setSequenceSteps([]);
        return;
      }

      const step = sequenceSteps[index];
      setCurrentStepIndex(index); // Update current step index
      setSequenceSteps(steps => steps.map((s, i) => 
        i === index ? { ...s, status: 'in-progress' } : s
      ));

      // Execute the action based on step type
      if (step.action === 'Move To') {
        // Calculate target position in polar coordinates
        const targetAU = Math.sqrt(step.x * step.x + step.y * step.y);
        const targetAngle = Math.atan2(step.y, step.x);
        
        // Move ship to target position with completion callback
        moveShipTo(targetAU, targetAngle, () => {
          // Mark as executed AFTER ship arrives
          setSequenceSteps(steps => steps.map((s, i) => 
            i === index ? { ...s, status: 'executed' } : s
          ));

          if (autoApprove) {
            executeStep(index + 1);
          } else {
            setShowStepConfirm(true);
          }
        });
      } else if (step.action === 'Scan') {
        // Scan action: Move to location, then scan nearby POI
        const targetAU = Math.sqrt(step.x * step.x + step.y * step.y);
        const targetAngle = Math.atan2(step.y, step.x);
        
        // First move to the location
        moveShipTo(targetAU, targetAngle, () => {
          // Then trigger system scan
          if (startSystemScan) {
            startSystemScan();
          }
          
          // Mark as executed after scan starts
          setTimeout(() => {
            setSequenceSteps(steps => steps.map((s, i) => 
              i === index ? { ...s, status: 'executed' } : s
            ));

            if (autoApprove) {
              executeStep(index + 1);
            } else {
              setShowStepConfirm(true);
            }
          }, 3000); // Give scan time to complete
        });
      } else {
        // Other actions (Mine, Investigate) - move to location first
        const targetAU = Math.sqrt(step.x * step.x + step.y * step.y);
        const targetAngle = Math.atan2(step.y, step.x);
        
        moveShipTo(targetAU, targetAngle, () => {
          // Placeholder for Mine/Investigate logic
          setTimeout(() => {
            setSequenceSteps(steps => steps.map((s, i) => 
              i === index ? { ...s, status: 'executed' } : s
            ));

            if (autoApprove) {
              executeStep(index + 1);
            } else {
              setShowStepConfirm(true);
            }
          }, 2000);
        });
      }
    };

    const approveNextStep = () => {
      setShowStepConfirm(false);
      executeStep(currentStepIndex + 1);
    };

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Automation Section */}
        <div style={{ 
          borderBottom: '1px solid rgba(52, 224, 255, 0.3)',
          background: 'rgba(0, 0, 0, 0.3)'
        }}>
          {/* Collapsible Header */}
          <div 
            onClick={() => setAutomationCollapsed(!automationCollapsed)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(52, 224, 255, 0.05)'
            }}
          >
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#34e0ff', letterSpacing: '0.5px' }}>
              AUTOMATION
            </span>
            <span style={{ fontSize: '12px', color: '#34e0ff' }}>
              {automationCollapsed ? '▼' : '▲'}
            </span>
          </div>

          {/* Automation Content */}
          {!automationCollapsed && (
            <div style={{ padding: '12px' }}>
              {/* Toolbar */}
              <div style={{ 
                display: 'flex', 
                gap: '6px', 
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}>
                <button 
                  onClick={handleCreateSequence}
                  style={{
                    padding: '6px 10px',
                    background: isCreatingSequence ? 'rgba(255, 200, 100, 0.2)' : 'rgba(52, 224, 255, 0.1)',
                    border: `1px solid ${isCreatingSequence ? '#ffc864' : '#34e0ff'}`,
                    borderRadius: '3px',
                    color: isCreatingSequence ? '#ffc864' : '#34e0ff',
                    fontSize: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {isCreatingSequence ? '✓ Complete Sequence' : '+ Create Sequence'}
                </button>
                <button 
                  onClick={handleChangeAction}
                  disabled={sequenceSteps.length === 0}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(52, 224, 255, 0.1)',
                    border: '1px solid #34e0ff',
                    borderRadius: '3px',
                    color: '#34e0ff',
                    fontSize: '8px',
                    cursor: sequenceSteps.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: sequenceSteps.length === 0 ? 0.5 : 1,
                    textTransform: 'uppercase'
                  }}
                >
                  Change Action
                </button>
                <button 
                  onClick={handleDeleteAction}
                  disabled={sequenceSteps.length === 0}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(255, 80, 80, 0.1)',
                    border: '1px solid #ff5050',
                    borderRadius: '3px',
                    color: '#ff5050',
                    fontSize: '8px',
                    cursor: sequenceSteps.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: sequenceSteps.length === 0 ? 0.5 : 1,
                    textTransform: 'uppercase'
                  }}
                >
                  Delete Action
                </button>
                <button 
                  onClick={handleClearAll}
                  disabled={sequenceSteps.length === 0}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(255, 80, 80, 0.1)',
                    border: '1px solid #ff5050',
                    borderRadius: '3px',
                    color: '#ff5050',
                    fontSize: '8px',
                    cursor: sequenceSteps.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: sequenceSteps.length === 0 ? 0.5 : 1,
                    textTransform: 'uppercase'
                  }}
                >
                  Clear All
                </button>
                <button 
                  onClick={handleExecute}
                  disabled={sequenceSteps.length === 0 || currentStepIndex >= 0}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(82, 255, 168, 0.1)',
                    border: '1px solid #52ffa8',
                    borderRadius: '3px',
                    color: '#52ffa8',
                    fontSize: '8px',
                    cursor: (sequenceSteps.length === 0 || currentStepIndex >= 0) ? 'not-allowed' : 'pointer',
                    opacity: (sequenceSteps.length === 0 || currentStepIndex >= 0) ? 0.5 : 1,
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  ▶ Execute
                </button>
              </div>

              {/* Sequence Table */}
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(52, 224, 255, 0.3)',
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                {sequenceSteps.length === 0 ? (
                  <div style={{ 
                    padding: '24px', 
                    textAlign: 'center', 
                    color: 'rgba(207, 216, 223, 0.5)',
                    fontSize: '9px'
                  }}>
                    {isCreatingSequence 
                      ? 'Click on the map to create sequence waypoints...' 
                      : 'No sequence created. Click "Create Sequence" to begin.'}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px' }}>
                    <thead>
                      <tr style={{ 
                        background: 'rgba(52, 224, 255, 0.1)',
                        borderBottom: '1px solid rgba(52, 224, 255, 0.3)'
                      }}>
                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#34e0ff' }}>#</th>
                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#34e0ff' }}>X, Y (AU)</th>
                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#34e0ff' }}>Action</th>
                        <th style={{ padding: '8px 6px', textAlign: 'left', color: '#34e0ff' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sequenceSteps.map((step, index) => (
                        <tr 
                          key={index}
                          style={{ 
                            borderBottom: '1px solid rgba(52, 224, 255, 0.1)',
                            background: currentStepIndex === index ? 'rgba(255, 200, 100, 0.1)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '8px 6px', color: '#cfd8df' }}>{index + 1}</td>
                          <td style={{ padding: '8px 6px', color: '#cfd8df' }}>
                            {step.x.toFixed(1)}, {step.y.toFixed(1)}
                          </td>
                          <td style={{ padding: '8px 6px', color: '#34e0ff' }}>{step.action}</td>
                          <td style={{ 
                            padding: '8px 6px',
                            color: step.status === 'executed' ? '#52ffa8' 
                                 : step.status === 'in-progress' ? '#ffc864'
                                 : '#cfd8df'
                          }}>
                            {step.status === 'queued' && '⏸ Queued'}
                            {step.status === 'in-progress' && '▶ In Progress'}
                            {step.status === 'executed' && '✓ Executed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Auto-approve checkbox */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginTop: '12px',
                fontSize: '9px',
                color: '#cfd8df',
                cursor: 'pointer'
              }}>
                <input 
                  type="checkbox" 
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                />
                Auto-approve next step
              </label>
            </div>
          )}
        </div>

        {/* Execute Confirmation Modal */}
        {showConfirmExecute && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(0, 20, 40, 0.98)',
              border: '2px solid #34e0ff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              boxShadow: '0 0 30px rgba(52, 224, 255, 0.5)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34e0ff', marginBottom: '16px' }}>
                CONFIRM SEQUENCE EXECUTION
              </div>
              <div style={{ fontSize: '10px', color: '#cfd8df', marginBottom: '20px', lineHeight: '1.6' }}>
                Execute automation sequence with {sequenceSteps.length} step{sequenceSteps.length !== 1 ? 's' : ''}?
                {!autoApprove && <div style={{ marginTop: '8px', color: '#ffc864' }}>
                  ⚠ You will be prompted to approve each step.
                </div>}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => setShowConfirmExecute(false)} style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 80, 80, 0.2)',
                  border: '1px solid #ff5050',
                  borderRadius: '4px',
                  color: '#ff5050',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  Cancel
                </button>
                <button onClick={executeSequence} style={{
                  padding: '8px 16px',
                  background: 'rgba(82, 255, 168, 0.2)',
                  border: '1px solid #52ffa8',
                  borderRadius: '4px',
                  color: '#52ffa8',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  Execute
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step Confirmation Modal */}
        {showStepConfirm && currentStepIndex >= 0 && currentStepIndex < sequenceSteps.length && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'rgba(0, 20, 40, 0.98)',
              border: '2px solid #34e0ff',
              borderRadius: '8px',
              padding: '24px',
              maxWidth: '400px',
              boxShadow: '0 0 30px rgba(52, 224, 255, 0.5)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#34e0ff', marginBottom: '16px' }}>
                STEP {currentStepIndex + 1} COMPLETE
              </div>
              <div style={{ fontSize: '10px', color: '#cfd8df', marginBottom: '20px', lineHeight: '1.6' }}>
                Step {currentStepIndex + 1} of {sequenceSteps.length} completed successfully.
                <div style={{ marginTop: '8px' }}>
                  Continue to next step?
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowStepConfirm(false); setCurrentStepIndex(-1); }} style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 80, 80, 0.2)',
                  border: '1px solid #ff5050',
                  borderRadius: '4px',
                  color: '#ff5050',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  Cancel Sequence
                </button>
                <button onClick={approveNextStep} style={{
                  padding: '8px 16px',
                  background: 'rgba(82, 255, 168, 0.2)',
                  border: '1px solid #52ffa8',
                  borderRadius: '4px',
                  color: '#52ffa8',
                  fontSize: '9px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}>
                  Continue ▶
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rest of Actions Tab Content */}
        <div style={{ padding: '16px', fontSize: '10px', color: '#cfd8df', flex: 1, overflow: 'auto' }}>
          <div style={{ marginBottom: '12px', color: '#34e0ff', fontSize: '9px', fontWeight: 'bold' }}>
            QUICK ACTIONS
          </div>
          <div>Other action controls will go here...</div>
        </div>
      </div>
    );
  };

  return (
    <div className="map-fullscreen-right">
      {/* Universal Date/Time Display */}
      <div style={{
        padding: '8px 12px',
        background: 'rgba(0, 20, 40, 0.8)',
        borderBottom: '1px solid rgba(52, 224, 255, 0.2)',
        textAlign: 'right'
      }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 'bold',
          color: '#34e0ff',
          letterSpacing: '1px',
          textShadow: '0 0 10px rgba(52, 224, 255, 0.5)'
        }}>
          {gameTimeDisplay}
        </div>
      </div>
      
      {/* Tab Header */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid rgba(52, 224, 255, 0.3)',
        background: 'rgba(0, 0, 0, 0.5)'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: activeTab === tab.id ? 'rgba(52, 224, 255, 0.15)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #34e0ff' : '2px solid transparent',
              color: activeTab === tab.id ? '#34e0ff' : 'rgba(207, 216, 223, 0.6)',
              fontSize: '9px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'pois' && renderPOIsTab()}
        {activeTab === 'ship' && renderShipStatsTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'actions' && renderActionsTab()}
        {activeTab === 'comms' && (
          <div style={{ padding: '16px', fontSize: '10px', color: '#cfd8df' }}>
            Communication panel - Under construction
          </div>
        )}
      </div>
    </div>
  );
};

export default RightPanelTabs;
