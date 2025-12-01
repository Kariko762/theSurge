/**
 * Combat State Manager
 * Manages turn order, action economy, and combat flow for D&D-style space combat
 */

import { CombatPositioning } from './combatPositioning.js';

export class CombatStateManager {
  constructor() {
    // Core combat state
    this.combatants = [];              // Array of { ship, id, faction, isPlayer }
    this.initiativeOrder = [];         // Sorted array of combatant IDs
    this.currentTurnIndex = 0;
    this.roundNumber = 1;
    this.combatActive = false;
    
    // Turn phases
    this.phase = 'MOVEMENT';           // MOVEMENT, ACTION, BONUS_ACTION, REACTION_WINDOW, END_TURN
    this.phaseOrder = ['MOVEMENT', 'ACTION', 'BONUS_ACTION', 'END_TURN'];
    
    // Action tracking (Map of shipId -> action counts)
    this.actionTracking = new Map();  // { actions, bonusActions, reactions, movement }
    
    // Ability cooldowns and usage tracking
    this.abilityCooldowns = new Map(); // Map of shipId -> Map of abilityKey -> { lastUsedRound, usesRemaining }
    
    // Reaction queue
    this.reactionQueue = [];           // Pending reactions to resolve
    this.reactionWindowOpen = false;
    this.triggeringAction = null;
    
    // Positioning system
    this.positioning = new CombatPositioning();
    
    // Status effects (Map of shipId -> effects array)
    this.statusEffects = new Map();
    
    // Combat log
    this.combatLog = [];

    // Attack interception flag (set by reactions like POINT_DEFENSE)
    this._attackIntercepted = false;

    // Internal resolver for manual reaction window
    this._reactionResolver = null;
  }

  // ==========================================================================
  // COMBAT INITIALIZATION
  // ==========================================================================

  /**
   * Start combat encounter
   * @param {Array} ships - Array of ship objects with { ship: ShipManager, id, faction, isPlayer }
   * @param {number} initialDistance - Starting distance between factions
   */
  startCombat(ships, initialDistance = 300) {
    this.combatants = ships;
    this.combatActive = true;
    this.roundNumber = 1;
    
    // Initialize positioning
    const positionData = ships.map(s => ({ id: s.id, faction: s.faction }));
    this.positioning.initializeCombat(positionData, initialDistance);
    
    // Roll initiative for all combatants
    this.rollInitiative();
    
    // Initialize action tracking
    ships.forEach(combatant => {
      this.resetActionsForTurn(combatant.id);
      this.statusEffects.set(combatant.id, []);
      // Initialize dynamic hull / shields tracking on ship object for UI
      const stats = combatant.ship.calculateCombatStats();
      combatant.ship.currentHull = stats.maxHull;
      combatant.ship.currentShields = stats.maxShields;
    });
    
    this.currentTurnIndex = 0;
    this.phase = 'MOVEMENT';
    
    this.log(`Combat started! Round ${this.roundNumber}`);
    this.log(`Initiative order: ${this.initiativeOrder.join(', ')}`);
    
    return {
      initiativeOrder: this.initiativeOrder,
      currentShip: this.getCurrentShip()
    };
  }

  /**
   * Roll initiative for all combatants and sort
   */
  rollInitiative() {
    const initiativeRolls = this.combatants.map(combatant => {
      const initiativeRoll = combatant.ship.rollInitiative();
      return {
        id: combatant.id,
        roll: initiativeRoll,
        ...combatant
      };
    });

    // Sort by initiative (highest first)
    initiativeRolls.sort((a, b) => b.roll - a.roll);
    
    this.initiativeOrder = initiativeRolls.map(r => r.id);
    
    // Log initiative
    initiativeRolls.forEach(r => {
      this.log(`${r.id} rolled initiative: ${r.roll}`);
    });
  }

  // ==========================================================================
  // TURN MANAGEMENT
  // ==========================================================================

  /**
   * Get current combatant's turn
   * @returns {object} Current combatant
   */
  getCurrentShip() {
    const currentId = this.initiativeOrder[this.currentTurnIndex];
    return this.combatants.find(c => c.id === currentId);
  }

  /**
   * Get current combatant ID
   * @returns {string} Current ship ID
   */
  getCurrentShipId() {
    return this.initiativeOrder[this.currentTurnIndex];
  }

  /**
   * Advance to next phase in turn
   * @returns {object} { phase, combatant, roundEnded }
   */
  nextPhase() {
    const currentPhaseIndex = this.phaseOrder.indexOf(this.phase);
    
    if (currentPhaseIndex < this.phaseOrder.length - 1) {
      // Move to next phase
      this.phase = this.phaseOrder[currentPhaseIndex + 1];
      
      // Add phase divider
      const currentShip = this.getCurrentShip();
      const shipType = currentShip?.isAI ? 'AI' : 'PLAYER';
      this.log(`\n========= ${this.phase} (${shipType} - TURN ${this.currentTurnIndex + 1}) =========`);
      
      return {
        phase: this.phase,
        combatant: currentShip,
        roundEnded: false
      };
    } else {
      // End of turn, advance to next combatant
      return this.advanceTurn();
    }
  }

  /**
   * Advance to next combatant's turn
   * @returns {object} { phase, combatant, roundEnded }
   */
  advanceTurn() {
    this.currentTurnIndex++;
    
    // Check if round ended
    if (this.currentTurnIndex >= this.initiativeOrder.length) {
      return this.advanceRound();
    }
    
    // Reset to movement phase
    this.phase = 'MOVEMENT';
    
    // Reset actions for new turn
    const currentShipId = this.getCurrentShipId();
    this.resetActionsForTurn(currentShipId);
    
    // Add turn divider
    const currentShip = this.getCurrentShip();
    const shipType = currentShip?.isAI ? 'AI' : 'PLAYER';
    this.log(`\n========= ${this.phase} (${shipType} - TURN ${this.currentTurnIndex + 1}) =========`);
    this.log(`${currentShipId}'s turn`);
    
    return {
      phase: this.phase,
      combatant: currentShip,
      roundEnded: false
    };
  }

  /**
   * Start new round
   * @returns {object} { phase, combatant, roundEnded }
   */
  advanceRound() {
    this.roundNumber++;
    this.currentTurnIndex = 0;
    this.phase = 'MOVEMENT';
    
    // Process start-of-round effects
    this.processStartOfRound();
    
    // Reset actions for first combatant
    const firstShipId = this.getCurrentShipId();
    this.resetActionsForTurn(firstShipId);
    
    this.log(`\n=== ROUND ${this.roundNumber} ===`);
    this.log(`${firstShipId}'s turn`);
    
    return {
      phase: this.phase,
      combatant: this.getCurrentShip(),
      roundEnded: true,
      roundNumber: this.roundNumber
    };
  }

  /**
   * Skip current combatant's turn
   */
  skipTurn() {
    const currentShipId = this.getCurrentShipId();
    this.log(`${currentShipId} skipped their turn`);
    return this.advanceTurn();
  }

  // ==========================================================================
  // ACTION ECONOMY
  // ==========================================================================

  /**
   * Reset actions for a ship's turn
   * @param {string} shipId - Ship ID
   */
  resetActionsForTurn(shipId) {
    const combatant = this.combatants.find(c => c.id === shipId);
    if (!combatant) return;

    const shipStats = combatant.ship.shipClass.baseStats;
    
    this.actionTracking.set(shipId, {
      actions: shipStats.actionsPerTurn || 1,
      bonusActions: shipStats.bonusActionsPerTurn || 1,
      reactions: shipStats.reactionsPerRound || 1,
      movement: shipStats.baseSpeed || 100,
      usedActions: [],
      usedBonusActions: [],
      usedReactions: []
    });
  }

  /**
   * Get remaining actions for a ship
   * @param {string} shipId - Ship ID
   * @returns {object} Action counts
   */
  getActionsRemaining(shipId) {
    const tracking = this.actionTracking.get(shipId);
    if (!tracking) return null;

    return {
      actions: tracking.actions,
      bonusActions: tracking.bonusActions,
      reactions: tracking.reactions,
      movement: tracking.movement,
      usedActions: tracking.usedActions,
      usedBonusActions: tracking.usedBonusActions,
      usedReactions: tracking.usedReactions
    };
  }

  /**
   * Check if ship can perform action type
   * @param {string} shipId - Ship ID
   * @param {string} actionType - 'action', 'bonusAction', 'reaction', 'movement'
   * @returns {boolean}
   */
  canPerformAction(shipId, actionType) {
    const tracking = this.actionTracking.get(shipId);
    if (!tracking) return false;

    switch (actionType) {
      case 'action':
        return tracking.actions > 0;
      case 'bonusAction':
        return tracking.bonusActions > 0;
      case 'reaction':
        return tracking.reactions > 0;
      case 'movement':
        return tracking.movement > 0;
      default:
        return false;
    }
  }

  /**
   * Spend action
   * @param {string} shipId - Ship ID
   * @param {string} actionType - 'action', 'bonusAction', 'reaction', 'movement'
   * @param {string} actionName - Name of action taken
   * @param {number} cost - Cost (for movement)
   * @returns {boolean} Success
   */
  spendAction(shipId, actionType, actionName, cost = 1) {
    const tracking = this.actionTracking.get(shipId);
    if (!tracking) return false;

    switch (actionType) {
      case 'action':
        if (tracking.actions > 0) {
          tracking.actions--;
          tracking.usedActions.push(actionName);
          this.log(`${shipId} used action: ${actionName}`);
          return true;
        }
        break;
      
      case 'bonusAction':
        if (tracking.bonusActions > 0) {
          tracking.bonusActions--;
          tracking.usedBonusActions.push(actionName);
          this.log(`${shipId} used bonus action: ${actionName}`);
          return true;
        }
        break;
      
      case 'reaction':
        if (tracking.reactions > 0) {
          tracking.reactions--;
          tracking.usedReactions.push(actionName);
          this.log(`${shipId} used reaction: ${actionName}`);
          return true;
        }
        break;
      
      case 'movement':
        if (tracking.movement >= cost) {
          tracking.movement -= cost;
          this.log(`${shipId} used ${cost} movement`);
          return true;
        }
        break;
    }

    return false;
  }

  // ==========================================================================
  // REACTION SYSTEM (D&D-style interrupts)
  // ==========================================================================

  /**
   * Open reaction window for interrupts
   * Pauses combat flow to allow reactions to triggering action
   * 
   * @param {object} triggeringAction - { actor, type, target, data }
   * @param {Array} eligibleReactors - Ship IDs that can react
   * @returns {Promise} Resolves when all reactions collected
   */
  async openReactionWindow(triggeringAction, eligibleReactors = []) {
    this.reactionWindowOpen = true;
    this.triggeringAction = triggeringAction;
    this.reactionQueue = [];
    
    this.log(`⏸️  Reaction window opened: ${triggeringAction.type}`);
    
    // Filter eligible reactors (must have reactions available)
    const canReact = eligibleReactors.filter(id => 
      this.canPerformAction(id, 'reaction')
    );
    
    if (canReact.length === 0) {
      this.log('No eligible reactors');
      this.reactionWindowOpen = false;
      return [];
    }
    
    this.log(`Eligible reactors: ${canReact.join(', ')}`);
    
    // Wait for manual closure (player or AI) via closeReactionWindow()
    return new Promise(resolve => {
      this._reactionResolver = resolve;
    });
  }

  /**
   * Queue a reaction during reaction window
   * @param {string} shipId - Reacting ship ID
   * @param {string} reactionType - Type of reaction
   * @param {object} target - Target of reaction
   * @returns {boolean} Success
   */
  queueReaction(shipId, reactionType, target = null) {
    if (!this.reactionWindowOpen) {
      console.warn('Reaction window is closed');
      return false;
    }
    
    if (!this.canPerformAction(shipId, 'reaction')) {
      console.warn(`${shipId} has no reactions available`);
      return false;
    }
    
    this.reactionQueue.push({
      shipId,
      reactionType,
      target,
      triggeringAction: this.triggeringAction
    });
    
    this.log(`${shipId} queued reaction: ${reactionType}`);
    return true;
  }

  /**
   * Manually close the reaction window (called by reactor side when done)
   */
  closeReactionWindow() {
    if (!this.reactionWindowOpen) return;
    this.reactionWindowOpen = false;
    const resolver = this._reactionResolver;
    this._reactionResolver = null;
    if (resolver) resolver(this.reactionQueue);
  }

  /**
   * Resolve all queued reactions
   * @returns {Array} Results of reactions
   */
  async resolveReactions() {
    const results = [];
    
    // Lazy import to avoid circular dependency issues
    const { ACTION_TYPES, executeAction } = await import('./combatActions.js');

    for (const reaction of this.reactionQueue) {
      const abilityDef = ACTION_TYPES[reaction.reactionType];
      
      // Check if ability can be used (cooldown check)
      if (abilityDef && !this.canUseAbility(reaction.shipId, reaction.reactionType, abilityDef)) {
        const cooldownInfo = this.getAbilityCooldownInfo(reaction.shipId, reaction.reactionType, abilityDef);
        this.log(`${reaction.shipId} cannot use ${reaction.reactionType}: ${cooldownInfo.reason}`);
        results.push({ shipId: reaction.shipId, type: reaction.reactionType, success: false, reason: cooldownInfo.reason });
        continue;
      }
      
      // Spend the reaction
      this.spendAction(reaction.shipId, 'reaction', reaction.reactionType);
      
      // Mark ability as used (apply cooldown)
      if (abilityDef) {
        this.useAbility(reaction.shipId, reaction.reactionType, abilityDef);
      }
      
      const reactor = this.combatants.find(c => c.id === reaction.shipId);
      const attacker = this.combatants.find(c => c.id === reaction.triggeringAction.actor);
      const context = {
        actor: reactor,
        target: attacker,
        combatState: this,
        triggeringAction: reaction.triggeringAction
      };
      let execResult = {};
      try {
        execResult = executeAction(reaction.reactionType, context) || {};
      } catch (e) {
        execResult = { success: false, error: e };
      }
      // Handle interception flag
      if (reaction.reactionType === 'POINT_DEFENSE' && execResult.intercepted) {
        this._attackIntercepted = true;
      }
      // Note: COUNTERFIRE now applies its own damage in combatActions.js
      results.push({ shipId: reaction.shipId, type: reaction.reactionType, ...execResult });
      this.log(`Resolved reaction: ${reaction.shipId} - ${reaction.reactionType}`);
    }
    
    this.reactionQueue = [];
    return results;
  }

  // ========================================================================
  // DAMAGE & HEALING
  // ========================================================================

  /**
   * Apply damage to a ship (shields first, then hull)
   * @param {string} targetId
   * @param {number} amount
   * @param {string} damageType
   */
  applyDamage(targetId, amount, damageType = 'energy') {
    const combatant = this.combatants.find(c => c.id === targetId);
    if (!combatant) return;
    const ship = combatant.ship;
    const stats = ship.calculateCombatStats();
    ship.currentHull = ship.currentHull ?? stats.maxHull;
    ship.currentShields = ship.currentShields ?? stats.maxShields;

    // Aggregate temporary shields from effects
    const effects = this.getStatusEffects(targetId);
    let tempPool = 0;
    effects.forEach(e => { if (e.tempShields) tempPool += e.tempShields; });

    let remaining = amount;
    const preShields = ship.currentShields;
    const preTemp = tempPool;
    const preHull = ship.currentHull;

    // Consume normal shields
    if (ship.currentShields > 0 && remaining > 0) {
      const used = Math.min(ship.currentShields, remaining);
      ship.currentShields -= used;
      remaining -= used;
    }
    // Consume temp shields
    if (remaining > 0 && tempPool > 0) {
      let consume = Math.min(tempPool, remaining);
      // Deduct from individual effects proportionally
      effects.forEach(e => {
        if (e.tempShields && consume > 0) {
          const use = Math.min(e.tempShields, consume);
          e.tempShields -= use;
          consume -= use;
        }
      });
      remaining -= Math.min(tempPool, amount - (amount - remaining));
    }
    // Apply to hull
    if (remaining > 0) {
      ship.currentHull = Math.max(0, ship.currentHull - remaining);
    }

    this.log(`${targetId} takes ${amount} ${damageType} damage`);
    this.log(`  Shields: ${preShields} → ${ship.currentShields}${preTemp>0?` (Temp ${preTemp})`:''}`);
    this.log(`  Hull: ${preHull} → ${ship.currentHull}`);

    if (ship.currentHull <= 0) {
      this.log(`${targetId} is disabled!`);
    }
  }

  /**
   * Heal hull (cannot exceed max)
   */
  healHull(shipId, amount) {
    const combatant = this.combatants.find(c => c.id === shipId);
    if (!combatant) return;
    const ship = combatant.ship;
    const stats = ship.calculateCombatStats();
    ship.currentHull = ship.currentHull ?? stats.maxHull;
    const pre = ship.currentHull;
    ship.currentHull = Math.min(stats.maxHull, ship.currentHull + amount);
    this.log(`${shipId} repairs ${amount} hull (${pre} → ${ship.currentHull})`);
  }

  // ==========================================================================
  // STATUS EFFECTS
  // ==========================================================================

  /**
   * Add status effect to ship
   * @param {string} shipId - Target ship ID
   * @param {object} effect - { type, duration, value, source }
   */
  addStatusEffect(shipId, effect) {
    const effects = this.statusEffects.get(shipId) || [];
    effects.push({
      ...effect,
      appliedRound: this.roundNumber
    });
    this.statusEffects.set(shipId, effects);
    
    this.log(`${shipId} gained effect: ${effect.type}`);
  }

  /**
   * Remove status effect
   * @param {string} shipId - Ship ID
   * @param {string} effectType - Effect type to remove
   */
  removeStatusEffect(shipId, effectType) {
    const effects = this.statusEffects.get(shipId) || [];
    const filtered = effects.filter(e => e.type !== effectType);
    this.statusEffects.set(shipId, filtered);
    
    this.log(`${shipId} lost effect: ${effectType}`);
  }

  /**
   * Get active status effects for ship
   * @param {string} shipId - Ship ID
   * @returns {Array} Active effects
   */
  getStatusEffects(shipId) {
    return this.statusEffects.get(shipId) || [];
  }

  /**
   * Process start of round (tick down status effects)
   */
  processStartOfRound() {
    this.statusEffects.forEach((effects, shipId) => {
      const remaining = effects
        .map(effect => {
          // Decrement duration
          if (effect.duration !== undefined) {
            effect.duration--;
          }
          return effect;
        })
        .filter(effect => effect.duration === undefined || effect.duration > 0);
      
      this.statusEffects.set(shipId, remaining);
    });
  }

  // ==========================================================================
  // COMBAT STATE QUERIES
  // ==========================================================================

  /**
   * Get all enemies of a ship
   * @param {string} shipId - Ship ID
   * @returns {Array} Enemy combatants
   */
  getEnemies(shipId) {
    const combatant = this.combatants.find(c => c.id === shipId);
    if (!combatant) return [];
    
    return this.combatants.filter(c => c.faction !== combatant.faction);
  }

  /**
   * Get all allies of a ship
   * @param {string} shipId - Ship ID
   * @returns {Array} Allied combatants
   */
  getAllies(shipId) {
    const combatant = this.combatants.find(c => c.id === shipId);
    if (!combatant) return [];
    
    return this.combatants.filter(c => c.faction === combatant.faction && c.id !== shipId);
  }

  /**
   * Check if combat is over
   * @returns {object|null} { winner: faction, reason: string } or null
   */
  checkCombatEnd() {
    // Get active factions
    const activeFactions = new Set(this.combatants.map(c => c.faction));
    
    if (activeFactions.size <= 1) {
      const winner = Array.from(activeFactions)[0];
      return {
        winner,
        reason: 'All enemies defeated'
      };
    }
    
    return null;
  }

  /**
   * End combat
   */
  endCombat(result) {
    this.combatActive = false;
    this.log(`\nCombat ended: ${result.reason}`);
    this.log(`Winner: ${result.winner}`);
    
    return {
      ...result,
      rounds: this.roundNumber,
      log: this.combatLog
    };
  }

  // ==========================================================================
  // COMBAT LOG
  // ==========================================================================

  /**
   * Add entry to combat log
   * @param {string} message - Log message
   */
  log(message) {
    const entry = {
      round: this.roundNumber,
      phase: this.phase,
      message,
      timestamp: Date.now()
    };
    
    this.combatLog.push(entry);
    console.log(`[R${this.roundNumber}:${this.phase}] ${message}`);
  }

  /**
   * Log with a custom phase label (for AI decision engine)
   */
  logWithPhase(message, customPhase) {
    const entry = {
      round: this.roundNumber,
      phase: customPhase || this.phase,
      message,
      timestamp: Date.now()
    };
    
    this.combatLog.push(entry);
    console.log(`[R${this.roundNumber}:${customPhase || this.phase}] ${message}`);
  }

  /**
   * Get combat log
   * @returns {Array} Log entries
   */
  getLog() {
    return this.combatLog;
  }

  // ==========================================================================
  // STATE EXPORT/IMPORT (for save/load)
  // ==========================================================================

  /**
   * Export combat state
   * @returns {object} Serializable state
   */
  exportState() {
    return {
      combatants: this.combatants.map(c => ({
        id: c.id,
        faction: c.faction,
        isPlayer: c.isPlayer
        // Ship state exported separately
      })),
      initiativeOrder: this.initiativeOrder,
      currentTurnIndex: this.currentTurnIndex,
      roundNumber: this.roundNumber,
      phase: this.phase,
      combatActive: this.combatActive,
      actionTracking: Array.from(this.actionTracking.entries()),
      statusEffects: Array.from(this.statusEffects.entries()),
      positioning: this.positioning.exportState(),
      combatLog: this.combatLog
    };
  }

  /**
   * Import combat state
   * @param {object} state - State from exportState()
   */
  importState(state, ships) {
    this.combatants = state.combatants.map(c => ({
      ...c,
      ship: ships.find(s => s.id === c.id) // Re-attach ship instances
    }));
    this.initiativeOrder = state.initiativeOrder;
    this.currentTurnIndex = state.currentTurnIndex;
    this.roundNumber = state.roundNumber;
    this.phase = state.phase;
    this.combatActive = state.combatActive;
    this.actionTracking = new Map(state.actionTracking);
    this.statusEffects = new Map(state.statusEffects);
    this.positioning.importState(state.positioning);
    this.combatLog = state.combatLog;
  }

  // ==========================================================================
  // ABILITY COOLDOWN TRACKING
  // ==========================================================================

  /**
   * Check if an ability is available for use
   * @param {string} shipId - Ship ID
   * @param {string} abilityKey - Ability identifier (e.g., 'EMERGENCY_BURN')
   * @param {object} abilityDef - Ability definition with cooldown properties
   * @returns {boolean} True if ability can be used
   */
  canUseAbility(shipId, abilityKey, abilityDef) {
    if (!abilityDef.cooldown) return true; // No cooldown restrictions
    
    if (!this.abilityCooldowns.has(shipId)) {
      this.abilityCooldowns.set(shipId, new Map());
    }
    
    const shipCooldowns = this.abilityCooldowns.get(shipId);
    const cooldownData = shipCooldowns.get(abilityKey);
    
    // Check if ability has been used before
    if (!cooldownData) {
      // First use - initialize tracking
      return true;
    }
    
    const { lastUsedRound, usesRemaining } = cooldownData;
    
    // Check usage limit per combat
    if (abilityDef.cooldown.usesPerCombat !== undefined) {
      if (usesRemaining <= 0) {
        return false; // No uses remaining
      }
    }
    
    // Check round cooldown
    if (abilityDef.cooldown.rounds !== undefined) {
      const roundsSinceUse = this.roundNumber - lastUsedRound;
      if (roundsSinceUse < abilityDef.cooldown.rounds) {
        return false; // Still on cooldown
      }
    }
    
    return true;
  }

  /**
   * Mark an ability as used and apply cooldown
   * @param {string} shipId - Ship ID
   * @param {string} abilityKey - Ability identifier
   * @param {object} abilityDef - Ability definition with cooldown properties
   */
  useAbility(shipId, abilityKey, abilityDef) {
    if (!abilityDef.cooldown) return; // No tracking needed
    
    if (!this.abilityCooldowns.has(shipId)) {
      this.abilityCooldowns.set(shipId, new Map());
    }
    
    const shipCooldowns = this.abilityCooldowns.get(shipId);
    const existing = shipCooldowns.get(abilityKey);
    
    const usesPerCombat = abilityDef.cooldown.usesPerCombat;
    const usesRemaining = existing 
      ? existing.usesRemaining - 1 
      : (usesPerCombat !== undefined ? usesPerCombat - 1 : Infinity);
    
    shipCooldowns.set(abilityKey, {
      lastUsedRound: this.roundNumber,
      usesRemaining: usesRemaining
    });
  }

  /**
   * Get cooldown info for display
   * @param {string} shipId - Ship ID
   * @param {string} abilityKey - Ability identifier
   * @param {object} abilityDef - Ability definition
   * @returns {object} Cooldown status
   */
  getAbilityCooldownInfo(shipId, abilityKey, abilityDef) {
    if (!abilityDef.cooldown) {
      return { available: true, reason: null };
    }
    
    if (!this.abilityCooldowns.has(shipId)) {
      return { available: true, reason: null };
    }
    
    const shipCooldowns = this.abilityCooldowns.get(shipId);
    const cooldownData = shipCooldowns.get(abilityKey);
    
    if (!cooldownData) {
      return { available: true, reason: null };
    }
    
    const { lastUsedRound, usesRemaining } = cooldownData;
    
    // Check uses remaining
    if (abilityDef.cooldown.usesPerCombat !== undefined && usesRemaining <= 0) {
      return { 
        available: false, 
        reason: `No uses remaining (${abilityDef.cooldown.usesPerCombat} per combat)` 
      };
    }
    
    // Check round cooldown
    if (abilityDef.cooldown.rounds !== undefined) {
      const roundsSinceUse = this.roundNumber - lastUsedRound;
      if (roundsSinceUse < abilityDef.cooldown.rounds) {
        const roundsRemaining = abilityDef.cooldown.rounds - roundsSinceUse;
        return { 
          available: false, 
          reason: `Cooldown: ${roundsRemaining} round${roundsRemaining > 1 ? 's' : ''} remaining` 
        };
      }
    }
    
    // Show uses remaining if limited
    if (abilityDef.cooldown.usesPerCombat !== undefined) {
      return { 
        available: true, 
        reason: `${usesRemaining} use${usesRemaining > 1 ? 's' : ''} remaining` 
      };
    }
    
    return { available: true, reason: null };
  }
}
