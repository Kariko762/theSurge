import React, { useState, useEffect } from 'react';
import HexGrid from './HexGrid';
import ActionCard from './ActionCard';
import ShipDetails from './ShipDetails';
import api from '../../lib/api/client';
import '../../styles/ShipCombat.css';

const ShipCombat = ({ onClose }) => {
  const [selectedShip, setSelectedShip] = useState(null);
  const [playerShips, setPlayerShips] = useState([]);
  const [enemyShips, setEnemyShips] = useState([]);
  const [currentTurn, setCurrentTurn] = useState('player');
  const [actionPoints, setActionPoints] = useState(5);
  const [maxActionPoints, setMaxActionPoints] = useState(5);
  const [selectedCard, setSelectedCard] = useState(null);
  const [combatLog, setCombatLog] = useState([]);
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [gamePhase, setGamePhase] = useState('setup'); // setup, combat, ended
  const [availableShips, setAvailableShips] = useState([]);
  const [showShipSelector, setShowShipSelector] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [expandedShipId, setExpandedShipId] = useState(null);
  const [showActionDetail, setShowActionDetail] = useState(false);
  const [selectedActionDetail, setSelectedActionDetail] = useState(null);
  const [showShipDetail, setShowShipDetail] = useState(false);
  const [selectedShipDetail, setSelectedShipDetail] = useState(null);
  const [hoverHex, setHoverHex] = useState(null);
  const [itemDetails, setItemDetails] = useState({}); // Cache for item details

  // Available action cards based on selected ship
  const [availableCards, setAvailableCards] = useState([]);

  useEffect(() => {
    loadAvailableShips();
  }, []);

  useEffect(() => {
    if (selectedShip) {
      generateActionCards(selectedShip);
      setActionPoints(selectedShip.currentAP || selectedShip.maxAP || 5);
      setMaxActionPoints(selectedShip.maxAP || 5);
    }
  }, [selectedShip]);

  const loadAvailableShips = async () => {
    try {
      const ships = await api.ships.getAll();
      setAvailableShips(ships || []);
    } catch (err) {
      console.error('Failed to load ships:', err);
    }
  };

  const fetchItemDetails = async (itemId) => {
    if (!itemId || itemDetails[itemId]) return itemDetails[itemId];
    
    try {
      // Try fetching from different categories since we don't know which one
      const categories = ['weapons', 'subsystems', 'equipment', 'consumables', 'resources', 'artifacts'];
      
      for (const category of categories) {
        try {
          const item = await api.items.getById(category, itemId);
          if (item) {
            setItemDetails(prev => ({ ...prev, [itemId]: item }));
            return item;
          }
        } catch (err) {
          // Continue to next category
          continue;
        }
      }
      
      console.warn(`Item not found in any category: ${itemId}`);
      return null;
    } catch (err) {
      console.error(`Failed to load item ${itemId}:`, err);
      return null;
    }
  };

  const loadSlotItems = async (slots) => {
    if (!slots || typeof slots !== 'object') return;
    
    const itemIds = Object.values(slots).filter(id => id !== null);
    await Promise.all(itemIds.map(id => fetchItemDetails(id)));
  };

  const generateActionCards = (ship) => {
    if (!ship) {
      setAvailableCards([]);
      return;
    }

    const cards = [];

    // Always available: Basic movement
    cards.push({
      id: 'move',
      name: 'Move',
      type: 'Movement',
      icon: '→',
      apCost: 1,
      description: 'Move to an adjacent hex',
      color: '#3498db'
    });

    // Boost movement if ship has thrusters
    if (ship.components?.thrusters || ship.thrusterSlots > 0) {
      cards.push({
        id: 'boost',
        name: 'Boost',
        type: 'Movement',
        icon: '⇒',
        apCost: 2,
        description: 'Move up to 3 hexes',
        color: '#3498db'
      });
    }

    // Weapon-based actions
    if (ship.components?.weapons) {
      ship.components.weapons.forEach((weapon, index) => {
        cards.push({
          id: `weapon_${index}`,
          name: weapon.name || 'Weapon',
          type: 'Action',
          icon: weapon.type === 'missile' ? '◆' : '×',
          apCost: weapon.apCost || 2,
          description: weapon.description || `Fire ${weapon.name}`,
          color: '#e74c3c',
          range: weapon.range || 5,
          damage: weapon.damage || '2d6',
          weaponData: weapon
        });
      });
    } else if (ship.weaponSlots > 0) {
      // Default primary weapon if ship has weapon slots but none equipped
      cards.push({
        id: 'primary_fire',
        name: 'Primary Fire',
        type: 'Action',
        icon: '×',
        apCost: 2,
        description: 'Fire primary weapons at target',
        color: '#e74c3c',
        range: 5,
        damage: '2d6'
      });
    }

    // Shield-based actions
    if (ship.components?.shields || ship.shieldSlots > 0) {
      cards.push({
        id: 'shield_boost',
        name: 'Shield Boost',
        type: 'Instant',
        icon: '◉',
        apCost: 1,
        description: 'Restore 2d6 shield points',
        color: '#f39c12'
      });
    }

    // Evasive maneuvers (always available)
    cards.push({
      id: 'evasive',
      name: 'Evasive',
      type: 'Instant',
      icon: '~',
      apCost: 1,
      description: '+2 Defense until next turn',
      color: '#f39c12'
    });

    // Utility-based actions
    if (ship.components?.utility) {
      ship.components.utility.forEach((util, index) => {
        if (util.type === 'repair') {
          cards.push({
            id: `utility_repair_${index}`,
            name: util.name || 'Repair',
            type: 'Action',
            icon: '+',
            apCost: util.apCost || 2,
            description: util.description || 'Repair hull damage',
            color: '#2ecc71',
            utilityData: util
          });
        } else if (util.type === 'scan') {
          cards.push({
            id: `utility_scan_${index}`,
            name: util.name || 'Scan',
            type: 'Action',
            icon: '◎',
            apCost: util.apCost || 1,
            description: util.description || 'Scan target',
            color: '#9b59b6',
            utilityData: util
          });
        }
      });
    }

    // Default repair if ship has utility slots
    if (ship.utilitySlots > 0 && !cards.find(c => c.type === 'Action' && c.icon === '+')) {
      cards.push({
        id: 'repair',
        name: 'Repair',
        type: 'Action',
        icon: '+',
        apCost: 2,
        description: 'Repair hull for 1d6 points',
        color: '#2ecc71'
      });
    }

    setAvailableCards(cards);
  };

  const handleCardSelect = (card) => {
    if (card.apCost > actionPoints) {
      addCombatLog(`Insufficient AP for ${card.name}`, 'warning');
      return;
    }
    setSelectedCard(card);
    addCombatLog(`Selected: ${card.name}`, 'info');
  };

  const handleCardUse = (targetHex, targetShip) => {
    if (!selectedCard) return;

    // Deduct AP from state and ship
    setActionPoints(prev => prev - selectedCard.apCost);
    
    // Update ship's currentAP
    if (selectedShip) {
      const updatedShip = {
        ...selectedShip,
        currentAP: selectedShip.currentAP - selectedCard.apCost
      };
      updateShipState(updatedShip);
    }

    // Execute card effect
    executeCardEffect(selectedCard, targetHex, targetShip);

    // Clear selection
    setSelectedCard(null);
  };

  const executeCardEffect = (card, targetHex, targetShip) => {
    switch (card.id) {
      case 'move':
      case 'boost':
        if (targetHex) {
          moveShip(selectedShip, targetHex);
        }
        break;
      case 'primary_fire':
      case 'missile':
        if (targetShip) {
          attackShip(selectedShip, targetShip, card);
        }
        break;
      case 'shield_boost':
        boostShields(selectedShip);
        break;
      case 'repair':
        repairShip(selectedShip);
        break;
      case 'scan':
        scanTarget(targetShip);
        break;
      default:
        break;
    }
  };

  const moveShip = (ship, targetHex) => {
    // Update ship position
    const updatedShip = { ...ship, hex: targetHex };
    updateShipState(updatedShip);
    addCombatLog(`${ship.name} moved to ${targetHex.q},${targetHex.r}`, 'action');
  };

  const attackShip = (attacker, defender, card) => {
    // Roll for hit
    const hitRoll = rollDice(1, 20);
    const attackBonus = attacker.attackBonus || 0;
    const defenseValue = defender.defense || 10;

    const totalAttack = hitRoll + attackBonus;

    if (totalAttack >= defenseValue) {
      // Hit! Roll damage
      const [numDice, diceSize] = card.damage.split('d').map(Number);
      const damage = rollDice(numDice, diceSize);
      
      // Apply damage to shields first, then hull
      let remainingDamage = damage;
      const updatedDefender = { ...defender };

      if (updatedDefender.currentShield > 0) {
        const shieldDamage = Math.min(remainingDamage, updatedDefender.currentShield);
        updatedDefender.currentShield -= shieldDamage;
        remainingDamage -= shieldDamage;
        addCombatLog(`${attacker.name} hits ${defender.name}! ${shieldDamage} shield damage`, 'combat');
      }

      if (remainingDamage > 0) {
        updatedDefender.currentHull -= remainingDamage;
        addCombatLog(`${attacker.name} hits ${defender.name}! ${remainingDamage} hull damage`, 'combat');
      }

      updateShipState(updatedDefender);

      // Check if ship destroyed
      if (updatedDefender.currentHull <= 0) {
        addCombatLog(`${defender.name} DESTROYED!`, 'critical');
        destroyShip(updatedDefender);
      }
    } else {
      addCombatLog(`${attacker.name} missed ${defender.name}!`, 'combat');
    }
  };

  const boostShields = (ship) => {
    const healing = rollDice(2, 6);
    const updatedShip = {
      ...ship,
      currentShield: Math.min(ship.currentShield + healing, ship.maxShield)
    };
    updateShipState(updatedShip);
    addCombatLog(`${ship.name} restored ${healing} shield points`, 'action');
  };

  const repairShip = (ship) => {
    const healing = rollDice(1, 6);
    const updatedShip = {
      ...ship,
      currentHull: Math.min(ship.currentHull + healing, ship.maxHull)
    };
    updateShipState(updatedShip);
    addCombatLog(`${ship.name} repaired ${healing} hull points`, 'action');
  };

  const scanTarget = (target) => {
    if (target) {
      addCombatLog(`Scanned ${target.name}: Hull ${target.currentHull}/${target.maxHull}, Shield ${target.currentShield}/${target.maxShield}`, 'info');
    }
  };

  const rollDice = (num, sides) => {
    let total = 0;
    for (let i = 0; i < num; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    return total;
  };

  const updateShipState = (updatedShip) => {
    if (updatedShip.faction === 'player') {
      setPlayerShips(prev => prev.map(s => s.id === updatedShip.id ? updatedShip : s));
    } else {
      setEnemyShips(prev => prev.map(s => s.id === updatedShip.id ? updatedShip : s));
    }

    if (selectedShip?.id === updatedShip.id) {
      setSelectedShip(updatedShip);
    }
  };

  const destroyShip = (ship) => {
    if (ship.faction === 'player') {
      setPlayerShips(prev => prev.filter(s => s.id !== ship.id));
    } else {
      setEnemyShips(prev => prev.filter(s => s.id !== ship.id));
    }

    if (selectedShip?.id === ship.id) {
      setSelectedShip(null);
    }

    // Check win/loss conditions
    checkVictoryConditions();
  };

  const checkVictoryConditions = () => {
    setTimeout(() => {
      if (playerShips.length === 0) {
        addCombatLog('DEFEAT! All player ships destroyed.', 'critical');
        setGamePhase('ended');
      } else if (enemyShips.length === 0) {
        addCombatLog('VICTORY! All enemy ships destroyed!', 'critical');
        setGamePhase('ended');
      }
    }, 100);
  };

  const addCombatLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setCombatLog(prev => [{ message, type, timestamp }, ...prev].slice(0, 50));
  };

  const endTurn = () => {
    if (currentTurn === 'player') {
      addCombatLog('Player turn ended', 'system');
      setCurrentTurn('enemy');
      // AI turn logic would go here
      setTimeout(() => {
        executeEnemyTurn();
      }, 1000);
    } else {
      addCombatLog('Enemy turn ended', 'system');
      setCurrentTurn('player');
      // Reset player AP
      if (selectedShip) {
        setActionPoints(selectedShip.maxAP || 5);
      }
    }
  };

  const executeEnemyTurn = () => {
    // Simple AI: each enemy ship attacks nearest player ship
    enemyShips.forEach(enemy => {
      if (playerShips.length === 0) return;

      const target = playerShips[0]; // Simplified - just attack first player ship
      const attackCard = availableCards.find(c => c.id === 'primary_fire');
      if (attackCard) {
        attackShip(enemy, target, attackCard);
      }
    });

    // End enemy turn
    setTimeout(() => {
      setCurrentTurn('player');
      if (selectedShip) {
        setActionPoints(selectedShip.maxAP || 5);
      }
    }, 2000);
  };

  const openShipSelector = (faction) => {
    setSelectedFaction(faction);
    setShowShipSelector(true);
  };

  const selectShipFromDatabase = (dbShip) => {
    const shipAP = dbShip.baseStats.actionPoints || 5;
    
    // Auto-place ship in appropriate zone
    let hex;
    if (selectedFaction === 'player') {
      // Player ships: top-left quadrant (q: 0-7, r: 0-5)
      hex = getRandomEmptyHex(0, 7, 0, 5);
    } else {
      // Enemy ships: bottom-right quadrant (q: 22-29, r: 14-19)
      hex = getRandomEmptyHex(22, 29, 14, 19);
    }

    const combatShip = {
      id: `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dbId: dbShip.id,
      name: dbShip.name,
      class: dbShip.class,
      tier: dbShip.tier,
      faction: selectedFaction,
      maxHull: dbShip.baseStats.hull,
      currentHull: dbShip.baseStats.hull,
      maxShield: dbShip.baseStats.shields,
      currentShield: dbShip.baseStats.shields,
      maxAP: shipAP,
      currentAP: shipAP,
      attackBonus: 2,
      defense: 10 + Math.floor(dbShip.baseStats.agility / 2),
      speed: dbShip.baseStats.speed,
      agility: dbShip.baseStats.agility,
      weaponSlots: dbShip.weaponSlots,
      subsystemSlots: dbShip.subsystemSlots,
      aiCores: dbShip.aiCores,
      aiCoreSlots: dbShip.aiCoreSlots,
      hex: hex
    };

    if (selectedFaction === 'player') {
      setPlayerShips(prev => [...prev, combatShip]);
    } else {
      setEnemyShips(prev => [...prev, combatShip]);
    }

    setShowShipSelector(false);
    setSelectedFaction(null);
  };

  const getRandomEmptyHex = (minQ, maxQ, minR, maxR) => {
    const allShips = [...playerShips, ...enemyShips];
    let attempts = 0;
    let hex;
    
    do {
      const q = Math.floor(Math.random() * (maxQ - minQ + 1)) + minQ;
      const r = Math.floor(Math.random() * (maxR - minR + 1)) + minR;
      hex = { q, r };
      attempts++;
    } while (
      allShips.some(s => s.hex?.q === hex.q && s.hex?.r === hex.r) && 
      attempts < 50
    );
    
    return hex;
  };

  const startCombat = () => {
    if (playerShips.length === 0 || enemyShips.length === 0) {
      alert('Add at least one ship to each side before starting combat!');
      return;
    }
    setGamePhase('combat');
    setCurrentTurn('player');
    addCombatLog('Combat started!', 'system');
  };

  const resetCombat = () => {
    setPlayerShips([]);
    setEnemyShips([]);
    setSelectedShip(null);
    setCurrentTurn('player');
    setActionPoints(5);
    setCombatLog([]);
    setGamePhase('setup');
    setSelectedCard(null);
  };

  return (
    <div className="ship-combat-container">
      {/* Main Combat Area */}
      <div className="combat-main">
        {/* Left Panel - Fleet Roster */}
        <div className={`fleet-roster ${leftPanelCollapsed ? 'collapsed' : ''}`}>
          <button 
            className="collapse-toggle"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          >
            {leftPanelCollapsed ? '▶' : '◀'}
          </button>

          {!leftPanelCollapsed && (
            <>
              {/* Ship Management Container */}
              <div className="ship-management-container">
                <div className="ship-management-header">
                  <h3>SHIP MANAGEMENT</h3>
                </div>
                {gamePhase === 'setup' && (
                  <div className="ship-management-buttons">
                    <button className="btn-add-ship-mgmt player" onClick={() => openShipSelector('player')}>
                      + ADD PLAYER SHIP
                    </button>
                    <button className="btn-add-ship-mgmt enemy" onClick={() => openShipSelector('enemy')}>
                      + ADD ENEMY SHIP
                    </button>
                  </div>
                )}
              </div>

              {/* Actions Panel - Only visible during combat */}
              {gamePhase === 'combat' && (
                <div className="actions-panel">
                  <div className="actions-header">
                    <h3>ACTIONS</h3>
                  </div>
                  
                  {/* AP Display */}
                  <div className="ap-display">
                    <span className="ap-label">AP</span>
                    <div className="ap-pips">
                      {Array.from({ length: maxActionPoints }).map((_, i) => (
                        <div key={i} className={`ap-pip ${i < actionPoints ? 'filled' : 'empty'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Movement Actions */}
                  <div className="action-category">
                    <div className="action-category-header">
                      <span>Movement</span>
                      <span className="action-count">
                        ({availableCards.filter(c => c.type === 'Movement').length}/{availableCards.filter(c => c.type === 'Movement').length})
                      </span>
                    </div>
                    <div className="action-list">
                      {availableCards.filter(card => card.type === 'Movement').map(card => (
                        <div 
                          key={card.id} 
                          className={`action-item ${selectedCard?.id === card.id ? 'selected' : ''} ${card.apCost > actionPoints ? 'disabled' : ''}`}
                          onClick={() => {
                            if (card.apCost <= actionPoints && currentTurn === 'player') {
                              handleCardSelect(card);
                            }
                          }}
                        >
                          <div className="action-item-icon" style={{ color: card.color }}>{card.icon}</div>
                          <div className="action-item-info">
                            <div className="action-item-name">{card.name}</div>
                            <div className="action-item-cost">AP: {card.apCost}</div>
                          </div>
                          <button 
                            className="action-detail-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActionDetail(card);
                              setShowActionDetail(true);
                            }}
                          >
                            ?
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Actions */}
                  <div className="action-category">
                    <div className="action-category-header">
                      <span>Action</span>
                      <span className="action-count">
                        ({availableCards.filter(c => c.type === 'Action').length}/{availableCards.filter(c => c.type === 'Action').length})
                      </span>
                    </div>
                    <div className="action-list">
                      {availableCards.filter(card => card.type === 'Action').map(card => (
                        <div 
                          key={card.id} 
                          className={`action-item ${selectedCard?.id === card.id ? 'selected' : ''} ${card.apCost > actionPoints ? 'disabled' : ''}`}
                          onClick={() => {
                            if (card.apCost <= actionPoints && currentTurn === 'player') {
                              handleCardSelect(card);
                            }
                          }}
                        >
                          <div className="action-item-icon" style={{ color: card.color }}>{card.icon}</div>
                          <div className="action-item-info">
                            <div className="action-item-name">{card.name}</div>
                            <div className="action-item-cost">AP: {card.apCost}</div>
                          </div>
                          <button 
                            className="action-detail-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActionDetail(card);
                              setShowActionDetail(true);
                            }}
                          >
                            ?
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Instant Actions */}
                  <div className="action-category">
                    <div className="action-category-header">
                      <span>Instant</span>
                      <span className="action-count">
                        ({availableCards.filter(c => c.type === 'Instant').length}/{availableCards.filter(c => c.type === 'Instant').length})
                      </span>
                    </div>
                    <div className="action-list">
                      {availableCards.filter(card => card.type === 'Instant').map(card => (
                        <div 
                          key={card.id} 
                          className={`action-item ${selectedCard?.id === card.id ? 'selected' : ''} ${card.apCost > actionPoints ? 'disabled' : ''}`}
                          onClick={() => {
                            if (card.apCost <= actionPoints && currentTurn === 'player') {
                              handleCardSelect(card);
                            }
                          }}
                        >
                          <div className="action-item-icon" style={{ color: card.color }}>{card.icon}</div>
                          <div className="action-item-info">
                            <div className="action-item-name">{card.name}</div>
                            <div className="action-item-cost">AP: {card.apCost}</div>
                          </div>
                          <button 
                            className="action-detail-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedActionDetail(card);
                              setShowActionDetail(true);
                            }}
                          >
                            ?
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Fleet Roster - Moved to bottom */}
              <div className="fleet-section">
                <div className="fleet-section-header">
                  <h3 className="fleet-section-title">PLAYER SHIPS</h3>
                  <div className="fleet-header-actions">
                    {gamePhase === 'setup' && (
                      <>
                        <button className="btn-combat-primary-small" onClick={startCombat}>
                          START
                        </button>
                        <button className="btn-combat-secondary-small" onClick={resetCombat}>
                          RESET
                        </button>
                      </>
                    )}
                    {gamePhase !== 'setup' && (
                      <button className="btn-combat-secondary-small" onClick={resetCombat}>
                        RESET
                      </button>
                    )}
                  </div>
                </div>
                <div className="fleet-list">
                  {playerShips.map(ship => (
                    <div key={ship.id} className="fleet-ship-card-wrapper">
                      <div
                        className={`fleet-ship-card ${selectedShip?.id === ship.id ? 'selected' : ''}`}
                        onClick={() => setSelectedShip(ship)}
                      >
                        <div className="ship-card-icon">▲</div>
                        <div className="ship-card-info">
                          <div className="ship-card-name">{ship.name}</div>
                          <div className="ship-card-health">
                            <div className="health-bar">
                              <div 
                                className="health-bar-fill hull"
                                style={{ width: `${(ship.currentHull / ship.maxHull) * 100}%` }}
                              />
                            </div>
                            <div className="health-bar">
                              <div 
                                className="health-bar-fill shield"
                                style={{ width: `${(ship.currentShield / ship.maxShield) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <button 
                          className="ship-detail-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await loadSlotItems(ship.weaponSlots);
                            await loadSlotItems(ship.subsystemSlots);
                            await loadSlotItems(ship.aiCores);
                            setSelectedShipDetail(ship);
                            setShowShipDetail(true);
                          }}
                          title="View Ship Details"
                        >
                          ?
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="fleet-section">
                <h3 className="fleet-section-title enemy">ENEMY SHIPS</h3>
                <div className="fleet-list">
                  {enemyShips.map(ship => (
                    <div key={ship.id} className="fleet-ship-card-wrapper">
                      <div
                        className={`fleet-ship-card enemy ${selectedShip?.id === ship.id ? 'selected' : ''}`}
                        onClick={() => setSelectedShip(ship)}
                      >
                        <div className="ship-card-icon enemy">▼</div>
                        <div className="ship-card-info">
                          <div className="ship-card-name">{ship.name}</div>
                          <div className="ship-card-health">
                            <div className="health-bar">
                              <div 
                                className="health-bar-fill hull"
                                style={{ width: `${(ship.currentHull / ship.maxHull) * 100}%` }}
                              />
                            </div>
                            <div className="health-bar">
                              <div 
                                className="health-bar-fill shield"
                                style={{ width: `${(ship.currentShield / ship.maxShield) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <button 
                          className="ship-detail-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await loadSlotItems(ship.weaponSlots);
                            await loadSlotItems(ship.subsystemSlots);
                            await loadSlotItems(ship.aiCores);
                            setSelectedShipDetail(ship);
                            setShowShipDetail(true);
                          }}
                          title="View Ship Details"
                        >
                          ?
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center Column - Action Deck + Hex Grid */}
        <div className="center-column">
          {/* Action Deck */}
          <div className="action-deck">
            <div className="combat-status-bar">
              <div className="status-left">
                <span className="status-phase">
                  PHASE: <span className={`phase-${gamePhase}`}>{gamePhase.toUpperCase()}</span>
                </span>
                <span className="status-turn">
                  TURN: <span className={currentTurn}>{currentTurn.toUpperCase()}</span>
                </span>
                <span className="status-ap">
                  AP: <span className="ap-value">{actionPoints}/{maxActionPoints}</span>
                </span>
                {hoverHex && (
                  <span className="status-hex">
                    HEX: <span className="hex-coords">({hoverHex.q}, {hoverHex.r})</span>
                  </span>
                )}
              </div>
              <div className="status-center">
                {gamePhase === 'combat' && currentTurn === 'player' && (
                  <button className="btn-end-turn" onClick={endTurn}>
                    END TURN
                  </button>
                )}
              </div>
              <div className="status-right">
                <button 
                  className="btn-combat-log"
                  onClick={() => setShowCombatLog(!showCombatLog)}
                >
                  {showCombatLog ? 'HIDE LOG' : 'COMBAT LOG'} 
                </button>
                <button 
                  className="btn-fullscreen"
                  onClick={() => {
                    const elem = document.querySelector('.combat-modal-container') || document.documentElement;
                    if (!document.fullscreenElement) {
                      elem.requestFullscreen();
                    } else {
                      document.exitFullscreen();
                    }
                  }}
                  title="Toggle Fullscreen"
                >
                  ⛶
                </button>
                {onClose && (
                  <button 
                    className="btn-close-modal"
                    onClick={onClose}
                    title="Close Combat Simulator"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hex Grid */}
          <div className="combat-grid-container">
            <HexGrid
              playerShips={playerShips}
              enemyShips={enemyShips}
              selectedShip={selectedShip}
              selectedCard={selectedCard}
              onHexClick={handleCardUse}
              gamePhase={gamePhase}
              setPlayerShips={setPlayerShips}
              setEnemyShips={setEnemyShips}
              onHoverHexChange={setHoverHex}
            />
          </div>
        </div>
      </div>

      {/* Combat Log Sidebar */}
      {showCombatLog && (
        <div className="combat-log-sidebar">
          <div className="combat-log-header">
            <h3>COMBAT LOG</h3>
            <button onClick={() => setShowCombatLog(false)}>✕</button>
          </div>
          <div className="combat-log-content">
            {combatLog.map((entry, index) => (
              <div key={index} className={`log-entry ${entry.type}`}>
                <span className="log-timestamp">{entry.timestamp}</span>
                <span className="log-message">{entry.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ship Detail Modal */}
      {showShipDetail && selectedShipDetail && (
        <div className="ship-detail-modal">
          <div className="ship-detail-content">
            <div className="ship-detail-header">
              <h3>{selectedShipDetail.name}</h3>
              <button onClick={() => setShowShipDetail(false)}>✕</button>
            </div>
            <div className="ship-detail-body">
              <div className="ship-detail-section">
                <h4>Ship Statistics</h4>
                <div className="ship-detail-row">
                  <span className="ship-detail-label">Class:</span>
                  <span className="ship-detail-value">{selectedShipDetail.class}</span>
                </div>
                <div className="ship-detail-row">
                  <span className="ship-detail-label">Tier:</span>
                  <span className="ship-detail-value">T{selectedShipDetail.tier}</span>
                </div>
                <div className="ship-detail-row">
                  <span className="ship-detail-label">Hull:</span>
                  <span className="ship-detail-value">{selectedShipDetail.currentHull}/{selectedShipDetail.maxHull}</span>
                </div>
                <div className="ship-detail-row">
                  <span className="ship-detail-label">Shields:</span>
                  <span className="ship-detail-value">{selectedShipDetail.currentShield}/{selectedShipDetail.maxShield}</span>
                </div>
                <div className="ship-detail-row">
                  <span className="ship-detail-label">Action Points:</span>
                  <span className="ship-detail-value">{selectedShipDetail.currentAP}/{selectedShipDetail.maxAP}</span>
                </div>
                <div className="ship-detail-row">
                  <span className="ship-detail-label">Defense:</span>
                  <span className="ship-detail-value">{selectedShipDetail.defense}</span>
                </div>
                <div className="ship-detail-row">
                  <span className="ship-detail-label">Attack Bonus:</span>
                  <span className="ship-detail-value">+{selectedShipDetail.attackBonus || 0}</span>
                </div>
                {selectedShipDetail.hex && (
                  <div className="ship-detail-row">
                    <span className="ship-detail-label">Position:</span>
                    <span className="ship-detail-value">({selectedShipDetail.hex.q}, {selectedShipDetail.hex.r})</span>
                  </div>
                )}
              </div>

              {/* Installed Components */}
              {selectedShipDetail.weaponSlots && typeof selectedShipDetail.weaponSlots === 'object' && (
                <div className="ship-detail-section">
                  <h4>Weapon Slots</h4>
                  {Object.entries(selectedShipDetail.weaponSlots).map(([slot, weaponId]) => {
                    const item = weaponId ? itemDetails[weaponId] : null;
                    return (
                      <div key={slot} className="component-item">
                        <div className="component-header">
                          <span className="component-name">
                            {item ? item.name : weaponId || 'Empty'}
                          </span>
                          {item && <span className="component-type">{item.tier}</span>}
                        </div>
                        {item && (
                          <>
                            {item.description && (
                              <div className="component-description">{item.description}</div>
                            )}
                            {item.properties && (
                              <div className="component-stats">
                                {item.properties.damage && (
                                  <div className="component-stat">Damage: {item.properties.damage}</div>
                                )}
                                {item.properties.range && (
                                  <div className="component-stat">Range: {item.properties.range}</div>
                                )}
                                {item.properties.fireRate && (
                                  <div className="component-stat">Fire Rate: {item.properties.fireRate}</div>
                                )}
                                {item.properties.accuracy && (
                                  <div className="component-stat">Accuracy: {item.properties.accuracy}%</div>
                                )}
                                {item.properties.critChance && (
                                  <div className="component-stat">Crit Chance: {item.properties.critChance}%</div>
                                )}
                                {item.properties.critMultiplier && (
                                  <div className="component-stat">Crit Multiplier: x{item.properties.critMultiplier}</div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedShipDetail.subsystemSlots && typeof selectedShipDetail.subsystemSlots === 'object' && (
                <div className="ship-detail-section">
                  <h4>Subsystem Slots</h4>
                  {Object.entries(selectedShipDetail.subsystemSlots).map(([slot, subsystemId]) => {
                    const item = subsystemId ? itemDetails[subsystemId] : null;
                    return (
                      <div key={slot} className="component-item">
                        <div className="component-header">
                          <span className="component-name">
                            {item ? item.name : subsystemId || 'Empty'}
                          </span>
                          {item && <span className="component-type">{item.tier}</span>}
                        </div>
                        {item && (
                          <>
                            {item.description && (
                              <div className="component-description">{item.description}</div>
                            )}
                            {item.properties && (
                              <div className="component-stats">
                                {item.properties.strength && (
                                  <div className="component-stat">Shield Strength: {item.properties.strength}</div>
                                )}
                                {item.properties.recharge && (
                                  <div className="component-stat">Recharge Rate: {item.properties.recharge}/turn</div>
                                )}
                                {item.properties.evasion && (
                                  <div className="component-stat">Evasion: +{item.properties.evasion}%</div>
                                )}
                                {item.properties.jamming && (
                                  <div className="component-stat">Jamming: {item.properties.jamming}%</div>
                                )}
                                {item.properties.armor && (
                                  <div className="component-stat">Armor: +{item.properties.armor}</div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedShipDetail.aiCores && typeof selectedShipDetail.aiCores === 'object' && (
                <div className="ship-detail-section">
                  <h4>AI Core Slots</h4>
                  {Object.entries(selectedShipDetail.aiCores).map(([slot, coreId]) => {
                    const item = coreId ? itemDetails[coreId] : null;
                    return (
                      <div key={slot} className="component-item">
                        <div className="component-header">
                          <span className="component-name">
                            {item ? item.name : coreId || 'Empty'}
                          </span>
                          {item && <span className="component-type">{item.tier}</span>}
                        </div>
                        {item && item.description && (
                          <div className="component-description">{item.description}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Detail Modal */}
      {showActionDetail && selectedActionDetail && (
        <div className="action-detail-modal">
          <div className="action-detail-content">
            <div className="action-detail-header">
              <h3>{selectedActionDetail.name}</h3>
              <button onClick={() => setShowActionDetail(false)}>✕</button>
            </div>
            <div className="action-detail-body">
              <div className="action-detail-row">
                <span className="action-detail-label">Type:</span>
                <span className="action-detail-value">{selectedActionDetail.type}</span>
              </div>
              <div className="action-detail-row">
                <span className="action-detail-label">AP Cost:</span>
                <span className="action-detail-value">{selectedActionDetail.apCost}</span>
              </div>
              {selectedActionDetail.range && (
                <div className="action-detail-row">
                  <span className="action-detail-label">Range:</span>
                  <span className="action-detail-value">{selectedActionDetail.range} hexes</span>
                </div>
              )}
              {selectedActionDetail.damage && (
                <div className="action-detail-row">
                  <span className="action-detail-label">Damage:</span>
                  <span className="action-detail-value">{selectedActionDetail.damage}</span>
                </div>
              )}
              <div className="action-detail-row">
                <span className="action-detail-label">Description:</span>
                <span className="action-detail-value">{selectedActionDetail.description}</span>
              </div>
              {selectedActionDetail.weaponData && (
                <div className="action-detail-row">
                  <span className="action-detail-label">Derived From:</span>
                  <span className="action-detail-value">Weapon: {selectedActionDetail.weaponData.name || 'Equipped Weapon'}</span>
                </div>
              )}
              {selectedActionDetail.utilityData && (
                <div className="action-detail-row">
                  <span className="action-detail-label">Derived From:</span>
                  <span className="action-detail-value">Utility: {selectedActionDetail.utilityData.name || 'Equipped Utility'}</span>
                </div>
              )}
              {selectedShip && (
                <div className="action-detail-section">
                  <h4>Combat Statistics</h4>
                  <div className="action-detail-row">
                    <span className="action-detail-label">Attack Bonus:</span>
                    <span className="action-detail-value">+{selectedShip.attackBonus || 0}</span>
                  </div>
                  <div className="action-detail-row">
                    <span className="action-detail-label">Hit Chance:</span>
                    <span className="action-detail-value">d20 + {selectedShip.attackBonus || 0} vs Target Defense</span>
                  </div>
                  {selectedActionDetail.range && (
                    <div className="action-detail-row">
                      <span className="action-detail-label">Effective Range:</span>
                      <span className="action-detail-value">Current range calculated in-game</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ship Selector Modal */}
      {showShipSelector && (
        <div className="ship-selector-modal">
          <div className="ship-selector-content">
            <div className="ship-selector-header">
              <h3>SELECT SHIP - {selectedFaction?.toUpperCase()}</h3>
              <button onClick={() => setShowShipSelector(false)}>✕</button>
            </div>
            <div className="ship-selector-grid">
              {availableShips.filter(ship => ship.enabled).map(ship => (
                <div 
                  key={ship.id}
                  className="ship-selector-card"
                  onClick={() => selectShipFromDatabase(ship)}
                >
                  <div className="ship-selector-icon">
                    {selectedFaction === 'player' ? '▲' : '▼'}
                  </div>
                  <div className="ship-selector-info">
                    <div className="ship-selector-name">{ship.name}</div>
                    <div className="ship-selector-class">{ship.class} · T{ship.tier}</div>
                    <div className="ship-selector-stats">
                      <span>◆ {ship.baseStats.hull}</span>
                      <span>◉ {ship.baseStats.shields}</span>
                      <span>→ {ship.baseStats.speed}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipCombat;
