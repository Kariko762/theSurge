/**
 * Combat Actions
 * Defines all action types and their execution logic
 */
import { COMPONENTS, COMPONENT_TYPES } from '../shipComponents.js';

/**
 * Action type definitions
 * Each action has: name, cost, requirements, execution function
 */
export const ACTION_TYPES = {
  // ==========================================================================
  // MAIN ACTIONS (cost: 1 action)
  // ==========================================================================
  
  FIRE_WEAPON: {
    name: 'Fire Weapon',
    cost: { actions: 1 },
    requiresTarget: true,
    allowsReactions: ['POINT_DEFENSE', 'EMERGENCY_BURN', 'BOOST_SHIELDS', 'COUNTERFIRE'],
    
    /**
     * Execute weapon attack
     * NOTE: This function ONLY rolls the attack. Damage is NOT applied here.
     * The CombatFlowController opens reaction window after this returns,
     * then applies damage after reactions resolve.
     * @param {object} context - { actor, target, weapon, combatState }
     * @returns {object} Result with attack roll (damage NOT yet applied)
     */
    execute: (context) => {
      const { actor, target, weapon, combatState } = context;
      
      // Get distance to target
      const distance = combatState.positioning.getDistance(actor.id, target.id);
      const distanceBand = combatState.positioning.getDistanceBandKey(actor.id, target.id);
      
      // Calculate effective SR (signature radius) with status effects
      let targetSR = target.ship.calculateCombatStats().signatureRadius;
      const effects = combatState.getStatusEffects(target.id);
      effects.forEach(effect => {
        if (effect.type === 'EVASIVE') {
          targetSR += effect.evasionBonus || 0;
        }
      });
      
      // Roll attack (with status effects)
      const attackResult = actor.ship.rollAttack(targetSR, weapon, distanceBand, {
        combatState,
        actorId: actor.id,
        targetId: target.id
      });
      
      combatState.log(`${actor.id} attacks ${target.id} with ${weapon.name} at ${distanceBand}`);
      if (attackResult.rangeModifier !== null) {
        // Build detailed attack breakdown
        const modBreakdown = attackResult.modifiers.length > 0
          ? attackResult.modifiers.map(m => `${m.source} ${m.value >= 0 ? '+' : ''}${m.value}`).join(', ')
          : 'no modifiers';
        combatState.log(`  Attack: d20(${attackResult.roll}) + [${modBreakdown}] = ${attackResult.total} vs TN ${attackResult.targetTN}`);
      }
      combatState.log(`  Result: ${attackResult.result}`);

      // Track combat history
      if (!actor.combatHistory) {
        actor.combatHistory = {
          attacksMade: 0,
          attacksHit: 0,
          attacksMissed: 0,
          totalDamageDealt: 0,
          timesHit: 0,
          timesMissed: 0,
          totalDamageTaken: 0,
          roundsInCombat: 0
        };
      }
      actor.combatHistory.attacksMade++;

      if (!attackResult.hit) {
        actor.combatHistory.attacksMissed++;
        return { success: false, hit: false, message: `${weapon.name} missed!`, attackResult };
      }
      
      // Attack HIT
      actor.combatHistory.attacksHit++;
      
      // Return result WITHOUT applying damage yet
      // CombatFlowController will open reaction window, then call applyWeaponDamage
      return {
        success: true,
        hit: true,
        crit: attackResult.crit,
        attackResult,
        // Flag to indicate reactions should happen before damage
        pendingDamage: true
      };
    }
  },

  EVASIVE_MANEUVERS: {
    name: 'Evasive Maneuvers',
    cost: { actions: 1 },
    requiresTarget: false,
    allowsReactions: [],
    
    execute: (context) => {
      const { actor, combatState } = context;
      
      // Grant evasion bonus until next turn
      combatState.addStatusEffect(actor.id, {
        type: 'EVASIVE',
        duration: 1,
        evasionBonus: 4,
        source: actor.id
      });
      
      combatState.log(`${actor.id} performs evasive maneuvers (+4 evasion)`);
      
      return {
        success: true,
        message: 'Evasion increased!',
        evasionBonus: 4
      };
    }
  },

  SCAN_TARGET: {
    name: 'Scan Target',
    cost: { actions: 1 },
    requiresTarget: true,
    allowsReactions: [],
    
    execute: (context) => {
      const { actor, target, combatState } = context;
      
      // Reveal target info and apply debuff
      combatState.addStatusEffect(target.id, {
        type: 'SCANNED',
        duration: 3,
        srPenalty: -2, // Easier to hit
        source: actor.id
      });
      
      combatState.log(`${actor.id} scans ${target.id} (-2 SR for 3 rounds)`);
      
      return {
        success: true,
        message: 'Target scanned!',
        targetInfo: target.ship.calculateCombatStats()
      };
    }
  },

  EMERGENCY_REPAIR: {
    name: 'Emergency Repair',
    cost: { actions: 1 },
    requiresTarget: false,
    allowsReactions: [],
    
    execute: (context) => {
      const { actor, combatState } = context;
      const healAmount = 15;
      combatState.healHull(actor.id, healAmount);
      return {
        success: true,
        message: 'Repairs complete!',
        healAmount
      };
    }
  },

  // ==========================================================================
  // MOVEMENT ACTIONS (cost: movement points)
  // ==========================================================================

  MOVE_CLOSER: {
    name: 'Move Closer',
    cost: { movement: 'variable' },
    requiresTarget: true,
    allowsReactions: ['OPPORTUNITY_ATTACK'],
    
    execute: (context) => {
      const { actor, target, combatState, movementPoints } = context;
      
      const actorStats = actor.ship.calculateCombatStats();
      const moveResult = combatState.positioning.moveCloser(
        actor.id,
        target.id,
        movementPoints || 100,
        actorStats.speed
      );
      
      combatState.log(`${actor.id} moves closer to ${target.id}`);
      combatState.log(`  ${moveResult.oldBand} → ${moveResult.newBand} (${moveResult.newDistance}km)`);
      
      return {
        success: moveResult.success,
        message: `Moved to ${moveResult.newBand}`,
        moveResult
      };
    }
  },

  MOVE_FARTHER: {
    name: 'Move Farther',
    cost: { movement: 'variable' },
    requiresTarget: true,
    allowsReactions: [],
    
    execute: (context) => {
      const { actor, target, combatState, movementPoints } = context;
      
      const actorStats = actor.ship.calculateCombatStats();
      const moveResult = combatState.positioning.moveFarther(
        actor.id,
        target.id,
        movementPoints || 100,
        actorStats.speed
      );
      
      combatState.log(`${actor.id} moves away from ${target.id}`);
      combatState.log(`  ${moveResult.oldBand} → ${moveResult.newBand} (${moveResult.newDistance}km)`);
      
      return {
        success: moveResult.success,
        message: `Moved to ${moveResult.newBand}`,
        moveResult
      };
    }
  },

  // ==========================================================================
  // BONUS ACTIONS
  // ==========================================================================

  BOOST_SHIELDS: {
    name: 'Boost Shields',
    cost: { bonusActions: 1 },
    requiresTarget: false,
    allowsReactions: [],
    
    execute: (context) => {
      const { actor, combatState } = context;
      
      // Grant temporary shields
      combatState.addStatusEffect(actor.id, {
        type: 'SHIELD_BOOST',
        duration: 2,
        tempShields: 20,
        source: actor.id
      });
      
      combatState.log(`${actor.id} boosts shields (+20 temp shields for 2 rounds)`);
      
      return {
        success: true,
        message: 'Shields boosted!',
        tempShields: 20
      };
    }
  },

  POWER_REDISTRIBUTE: {
    name: 'Redistribute Power',
    cost: { bonusActions: 1 },
    requiresTarget: false,
    allowsReactions: [],
    
    execute: (context) => {
      const { actor, combatState, powerAllocation } = context;
      
      // Change power allocation (placeholder - needs implementation)
      combatState.log(`${actor.id} redistributes power`);
      
      return {
        success: true,
        message: 'Power redistributed!',
        newAllocation: powerAllocation
      };
    }
  },

  TARGET_LOCK: {
    name: 'Target Lock',
    cost: { bonusActions: 1 },
    requiresTarget: true,
    allowsReactions: [],
    
    execute: (context) => {
      const { actor, target, combatState } = context;
      
      // Grant attack bonus against locked target
      combatState.addStatusEffect(actor.id, {
        type: 'TARGET_LOCK',
        duration: 2,
        attackBonus: 2,
        lockedTarget: target.id,
        source: actor.id
      });
      
      combatState.log(`${actor.id} locks onto ${target.id} (+2 attack for 2 rounds)`);
      
      return {
        success: true,
        message: `Locked onto ${target.id}!`,
        attackBonus: 2
      };
    }
  },

  // ==========================================================================
  // REACTIONS (cost: 1 reaction)
  // ==========================================================================

  POINT_DEFENSE: {
    name: 'Point Defense',
    cost: { reactions: 1 },
    cooldown: { rounds: 3 }, // Can use once every 3 rounds
    requiresTarget: false,
    trigger: 'INCOMING_ATTACK',
    requiresComponent: 'POINT_DEFENSE_TURRET',
    
    execute: (context) => {
      const { actor, combatState, triggeringAction } = context;
      
      // Check for point defense component
      const actorStats = actor.ship.calculateCombatStats();
      // Placeholder - needs component check
      
      const interceptChance = 50; // From component
      const interceptRoll = Math.random() * 100;
      
      if (interceptRoll < interceptChance) {
        combatState.log(`${actor.id} intercepts attack with point defense!`);
        return {
          success: true,
          intercepted: true,
          message: 'Attack intercepted!'
        };
      } else {
        combatState.log(`${actor.id} point defense failed to intercept`);
        return {
          success: false,
          intercepted: false,
          message: 'Failed to intercept'
        };
      }
    }
  },

  EMERGENCY_BURN: {
    name: 'Emergency Burn',
    cost: { reactions: 1 },
    cooldown: { usesPerCombat: 1 }, // Can only use once per combat
    requiresTarget: false,
    trigger: 'INCOMING_ATTACK',
    
    execute: (context) => {
      const { actor, combatState } = context;
      
      // Grant immediate evasion bonus
      combatState.addStatusEffect(actor.id, {
        type: 'EMERGENCY_BURN',
        duration: 0, // Instant
        evasionBonus: 3,
        source: actor.id
      });
      
      combatState.log(`${actor.id} emergency burn (+3 evasion vs this attack)`);
      
      return {
        success: true,
        message: 'Emergency burn!',
        evasionBonus: 3
      };
    }
  },

  COUNTERFIRE: {
    name: 'Counterfire',
    cost: { reactions: 1 },
    cooldown: { rounds: 2 }, // Can use once every 2 rounds
    requiresTarget: true,
    trigger: 'BEING_ATTACKED',
    requiresWeaponTrait: 'REACTION_FIRE', // Weapon must support reaction fire
    
    execute: (context) => {
      const { actor, target, combatState } = context;
      
      // Check if any weapon has reaction fire capability
      const actorStats = actor.ship.calculateCombatStats();
      if (actorStats.weapons.length === 0) {
        return { success: false, message: 'No weapons available' };
      }
      
      // Find weapon with REACTION_FIRE trait (for now, allow any weapon)
      const weapon = actorStats.weapons[0];
      // TODO: Check weapon.traits for 'REACTION_FIRE' once weapon traits are implemented
      
      const distanceBand = combatState.positioning.getDistanceBandKey(actor.id, target.id);
      
      const attackResult = actor.ship.rollAttack(
        target.ship.calculateCombatStats().signatureRadius,
        weapon,
        distanceBand
      );
      
      attackResult.total -= 2; // Reaction penalty
      attackResult.hit = attackResult.total >= attackResult.targetTN; // Re-check after penalty
      
      combatState.log(`${actor.id} returns fire at ${target.id} (reaction, -2 penalty)`);
      // Build detailed attack breakdown
      const modBreakdown = attackResult.modifiers.length > 0
        ? attackResult.modifiers.map(m => `${m.source} ${m.value >= 0 ? '+' : ''}${m.value}`).join(', ')
        : 'no modifiers';
      combatState.log(`  Attack: d20(${attackResult.roll}) + [${modBreakdown}] - 2 penalty = ${attackResult.total} vs TN ${attackResult.targetTN}`);
      combatState.log(`  Result: ${attackResult.hit ? 'HIT' : 'MISS'}`);
      
      if (attackResult.hit) {
        const damageResult = actor.ship.rollDamage(weapon, attackResult.crit);
        combatState.log(`  Damage: ${damageResult.damage} ${damageResult.damageType}`);
        // Apply counterfire damage immediately
        combatState.applyDamage(target.id, damageResult.damage, damageResult.damageType);
        return {
          success: true,
          hit: true,
          damage: damageResult.damage,
          damageType: damageResult.damageType,
          message: `Counterfire hit for ${damageResult.damage} damage!`
        };
      }
      
      return {
        success: false,
        hit: false,
        message: 'Counterfire missed'
      };
    }
  }
};

/**
 * Execute an action
 * @param {string} actionType - Action type key from ACTION_TYPES
 * @param {object} context - Execution context
 * @returns {object} Result
 */
export function executeAction(actionType, context) {
  const action = ACTION_TYPES[actionType];
  
  if (!action) {
    console.error(`Unknown action type: ${actionType}`);
    return { success: false, message: 'Unknown action' };
  }
  
  // Validate requirements
  if (action.requiresTarget && !context.target) {
    return { success: false, message: 'Requires target' };
  }
  
  // Execute action
  try {
    return action.execute(context);
  } catch (error) {
    console.error(`Error executing ${actionType}:`, error);
    return { success: false, message: 'Action failed', error };
  }
}

/**
 * Apply weapon damage after reactions have been resolved
 * This is called by CombatFlowController after the reaction window closes
 * @param {object} context - { actor, target, weapon, attackResult, combatState }
 * @returns {object} Damage result
 */
export function applyWeaponDamage(context) {
  const { actor, target, weapon, attackResult, combatState } = context;
  
  // Check if attack was intercepted by point defense
  if (combatState._attackIntercepted) {
    combatState.log(`  Attack intercepted by point defense!`);
    combatState._attackIntercepted = false;
    return { success: false, intercepted: true, message: 'Intercepted' };
  }
  
  // Roll damage
  const damageResult = actor.ship.rollDamage(weapon, attackResult.crit);
  
  combatState.log(`  Damage: ${damageResult.damage} ${damageResult.damageType}`);
  
  // Apply damage to target
  combatState.applyDamage(target.id, damageResult.damage, damageResult.damageType);
  
  // Track damage dealt in combat history
  if (actor.combatHistory) {
    actor.combatHistory.totalDamageDealt += damageResult.damage;
  }
  
  return {
    success: true,
    damage: damageResult.damage,
    damageType: damageResult.damageType,
    damageResult
  };
}

/**
 * Apply weapon damage after reactions have been resolved
 * Re-validates the attack with reaction modifiers applied
 */
export function applyWeaponDamageWithReactions(context) {
  const { actor, target, weapon, attackResult, combatState } = context;
  
  // Check if attack was intercepted by point defense
  if (combatState._attackIntercepted) {
    combatState.log(`  ❌ Attack intercepted by point defense!`);
    combatState._attackIntercepted = false;
    return { success: false, intercepted: true, message: 'Intercepted' };
  }
  
  // Get any evasion bonuses from reactions
  const targetStats = target.ship.calculateCombatStats();
  let modifiedTN = attackResult.targetTN; // Original TN from the attack
  let evasionBonus = 0;
  
  // Check for active evasion effects on target
  const targetEffects = combatState.statusEffects.filter(e => e.targetId === target.id && e.evasionBonus);
  for (const effect of targetEffects) {
    if (effect.evasionBonus) {
      evasionBonus += effect.evasionBonus;
      combatState.log(`  Reaction modifier: ${effect.type} grants +${effect.evasionBonus} evasion`);
    }
  }
  
  // Apply evasion bonus to target number
  modifiedTN += evasionBonus;
  
  // Re-validate if attack still hits with modified TN
  const originalHit = attackResult.hit;
  const stillHits = attackResult.total >= modifiedTN;
  
  if (evasionBonus > 0) {
    combatState.log(`  Re-validation: Attack total ${attackResult.total} vs modified TN ${modifiedTN} (base ${attackResult.targetTN} + ${evasionBonus} evasion)`);
  }
  
  if (!stillHits && originalHit) {
    // Attack was going to hit, but reaction made it miss!
    combatState.log(`  ❌ MISS! Reaction caused the attack to miss!`);
    return { success: false, dodged: true, message: 'Attack dodged by reaction!' };
  }
  
  if (!stillHits) {
    // Attack already missed
    combatState.log(`  ❌ Attack still misses`);
    return { success: false, message: 'Attack missed' };
  }
  
  // Attack still hits - roll and apply damage
  const damageResult = actor.ship.rollDamage(weapon, attackResult.crit);
  
  // Track damage dealt in combat history
  if (actor.combatHistory) {
    actor.combatHistory.totalDamageDealt += damageResult.damage;
  }
  
  combatState.log(`  Damage: ${damageResult.damage} ${damageResult.damageType}`);
  
  // Apply damage to target
  combatState.applyDamage(target.id, damageResult.damage, damageResult.damageType);
  
  return {
    success: true,
    damage: damageResult.damage,
    damageType: damageResult.damageType,
    damageResult
  };
}

/**
 * Get available actions for a combatant
 * @param {object} combatant - Combatant object
 * @param {object} combatState - Combat state manager
 * @returns {Array} Available action types
 */
export function getAvailableActions(combatant, combatState) {
  const actions = combatState.getActionsRemaining(combatant.id);
  const available = [];
  const comps = combatant.ship?.installedComponents || [];
  const stats = combatant.ship?.calculateCombatStats ? combatant.ship.calculateCombatStats() : null;
  const hasType = (typeConst) => comps.some(id => COMPONENTS[id]?.type === typeConst);
  const hasWeapons = !!(stats && stats.weapons && stats.weapons.length > 0);
  const hasEngine = hasType(COMPONENT_TYPES.ENGINE);
  const hasSensors = hasType(COMPONENT_TYPES.SENSORS) || (stats && stats.scanBonus > 0);
  const hasShieldGen = hasType(COMPONENT_TYPES.SHIELD);
  const hasPowerCore = hasType(COMPONENT_TYPES.POWER);
  const hasCombatComputer = hasType(COMPONENT_TYPES.COMBAT_COMPUTER);
  const hasPointDefense = hasType(COMPONENT_TYPES.POINT_DEFENSE);
  const canRepair = (stats && stats.modifiers && stats.modifiers.repairBonus > 0) || comps.some(id => COMPONENTS[id]?.type === COMPONENT_TYPES.AI_CORE && (COMPONENTS[id]?.attributes?.repairBonus || 0) > 0);
  
  // Main actions
  if (actions.actions > 0) {
    if (hasWeapons) available.push('FIRE_WEAPON');
    if (hasEngine) available.push('EVASIVE_MANEUVERS');
    if (hasSensors) available.push('SCAN_TARGET');
    if (canRepair) available.push('EMERGENCY_REPAIR');
  }
  
  // Movement
  if (actions.movement > 0) {
    if (hasEngine) {
      available.push('MOVE_CLOSER', 'MOVE_FARTHER');
    }
  }
  
  // Bonus actions
  if (actions.bonusActions > 0) {
    if (hasShieldGen) available.push('BOOST_SHIELDS');
    if (hasSensors || hasCombatComputer) available.push('TARGET_LOCK');
    if (hasPowerCore) available.push('POWER_REDISTRIBUTE');
  }
  
  // Reactions (only during reaction window)
  if (combatState.reactionWindowOpen && actions.reactions > 0) {
    if (hasPointDefense) available.push('POINT_DEFENSE');
    if (hasEngine) available.push('EMERGENCY_BURN');
    if (hasWeapons) available.push('COUNTERFIRE');
  }
  
  return available;
}
