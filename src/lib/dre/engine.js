/**
 * Dice Resolution Engine - Main Resolution Pipeline
 * Resolves all action types with modifiers, dice, and weighted tables
 */

import { makeRng } from '../rng.js';
import { 
  rollD20, rollD12, rollD10, rollD6, rollD100, 
  rollNotation, rollMultiple 
} from './dice.js';
import { 
  DIFFICULTY_TDS,
  selectFromTable,
  getStatusEffect,
  getCombatDamage,
  MINING_YIELD_QUALITY,
  MINING_HAZARDS,
  MINING_LOOT_TYPES,
  SCAVENGING_LOOT_QUALITY,
  SCAVENGING_TRAPS,
  SCAVENGING_LOOT_TYPES,
  DERELICT_DISCOVERIES,
  DERELICT_STRUCTURE,
  DERELICT_AMBUSH,
  AWAY_TEAM_OUTCOMES,
  AWAY_TEAM_HAZARDS,
  AWAY_TEAM_DISCOVERIES,
  MISSION_COMPLETION_TABLES
} from './tables.js';
import { collectModifiers, getDifficultyModifier } from './modifiers/index.js';

/**
 * Main action resolution function
 * @param {string} actionType - Type of action to resolve
 * @param {Object} context - Full action context (ship, AI, location, etc.)
 * @param {string} seed - Seed for deterministic RNG
 * @returns {Object} Outcome object with results and narrative
 */
export function resolveAction(actionType, context, seed) {
  const rng = makeRng(seed, actionType);
  
  switch (actionType) {
    case 'mining':
      return resolveMining(context, rng);
    case 'scavenging':
      return resolveScavenging(context, rng);
    case 'derelict':
      return resolveDerelict(context, rng);
    case 'awayTeam':
      return resolveAwayTeam(context, rng);
    case 'combatInitiate':
      return resolveCombatInitiate(context, rng);
    case 'combatAttack':
      return resolveCombatAttack(context, rng);
    case 'combatFlee':
      return resolveCombatFlee(context, rng);
    case 'combatRepair':
      return resolveCombatRepair(context, rng);
    case 'missionCompletion':
      return resolveMissionCompletion(context, rng);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

// ============================================================================
// MINING RESOLUTION
// ============================================================================
function resolveMining(context, rng) {
  const { difficulty = 'normal' } = context;
  
  // Collect modifiers
  const mods = collectModifiers('mining', context);
  const difficultyMod = getDifficultyModifier(difficulty);
  
  // Primary roll
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  // Hazard roll
  const hazardRoll = rollD12(rng);
  const hazard = selectFromTable(MINING_HAZARDS, rng);
  
  // Yield quality (if successful)
  let yieldQuality = null;
  let lootType = null;
  if (success) {
    const yieldRoll = rollD10(rng);
    yieldQuality = selectFromTable(MINING_YIELD_QUALITY, rng);
    lootType = selectFromTable(MINING_LOOT_TYPES, rng);
  }
  
  return {
    actionType: 'mining',
    result: baseRoll.isCritSuccess ? 'crit_success' : baseRoll.isCritFail ? 'crit_fail' : success ? 'success' : 'fail',
    totalRoll,
    targetDifficulty,
    margin: totalRoll - targetDifficulty,
    modifierBreakdown: mods.breakdown,
    secondaryRolls: {
      hazard: { value: hazardRoll, outcome: hazard },
      yield: yieldQuality ? { quality: yieldQuality.value, multiplier: yieldQuality.multiplier } : null
    },
    consequences: {
      damageTaken: hazard.damage || 0,
      lootGained: success ? [{ item: lootType.label, quality: yieldQuality.label }] : [],
      statusEffects: hazard.damage > 30 ? ['Tool Damaged'] : [],
      wakeAdded: 0.15,
      aiImpact: { morale: success ? 1 : -1 }
    }
  };
}

// ============================================================================
// SCAVENGING RESOLUTION
// ============================================================================
function resolveScavenging(context, rng) {
  const { difficulty = 'normal' } = context;
  
  const mods = collectModifiers('scavenging', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  // Trap check
  const trapRoll = rollD12(rng);
  const trap = selectFromTable(SCAVENGING_TRAPS, rng);
  
  // Detection chance
  const detectionRoll = rollD100(rng);
  const detected = detectionRoll < (trap.detection || 0);
  
  // Loot quality (if successful)
  let lootQuality = null;
  let lootType = null;
  if (success) {
    lootQuality = selectFromTable(SCAVENGING_LOOT_QUALITY, rng);
    lootType = selectFromTable(SCAVENGING_LOOT_TYPES, rng);
  }
  
  return {
    actionType: 'scavenging',
    result: baseRoll.isCritSuccess ? 'crit_success' : baseRoll.isCritFail ? 'crit_fail' : success ? 'success' : 'fail',
    totalRoll,
    targetDifficulty,
    margin: totalRoll - targetDifficulty,
    modifierBreakdown: mods.breakdown,
    secondaryRolls: {
      trap: { value: trapRoll, outcome: trap },
      detection: { value: detectionRoll, detected },
      loot: lootQuality ? { quality: lootQuality.value, multiplier: lootQuality.multiplier } : null
    },
    consequences: {
      damageTaken: trap.damage || 0,
      lootGained: success ? [{ item: lootType.label, quality: lootQuality.label }] : [],
      statusEffects: trap.aiInjury ? ['AI Injured'] : [],
      wakeAdded: detected ? 0.3 : 0.1,
      aiImpact: { morale: success ? 1 : 0 }
    }
  };
}

// ============================================================================
// DERELICT INVESTIGATION RESOLUTION
// ============================================================================
function resolveDerelict(context, rng) {
  const { difficulty = 'hard' } = context;
  
  const mods = collectModifiers('derelict', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  // Structure integrity
  const structureRoll = rollD12(rng);
  const structure = selectFromTable(DERELICT_STRUCTURE, rng);
  
  // Discovery bonus
  const discoveryRoll = rollD6(rng);
  const discovery = selectFromTable(DERELICT_DISCOVERIES, rng);
  
  // Ambush check
  const ambushRoll = rollD100(rng);
  const ambush = selectFromTable(DERELICT_AMBUSH, rng);
  
  return {
    actionType: 'derelict',
    result: baseRoll.isCritSuccess ? 'crit_success' : baseRoll.isCritFail ? 'crit_fail' : success ? 'success' : 'fail',
    totalRoll,
    targetDifficulty,
    margin: totalRoll - targetDifficulty,
    modifierBreakdown: mods.breakdown,
    secondaryRolls: {
      structure: { value: structureRoll, outcome: structure },
      discovery: { value: discoveryRoll, outcome: discovery },
      ambush: { value: ambushRoll, outcome: ambush }
    },
    consequences: {
      damageTaken: structure.damage || 0,
      lootGained: success ? [{ item: discovery.label }] : [],
      statusEffects: structure.abort ? ['Mission Aborted'] : [],
      wakeAdded: ambush.combat ? 0.4 : 0.2,
      aiImpact: { morale: success ? 2 : -1 },
      combatTriggered: ambush.combat || false,
      combatDifficulty: ambush.difficulty
    }
  };
}

// ============================================================================
// AWAY TEAM MISSION RESOLUTION
// ============================================================================
function resolveAwayTeam(context, rng) {
  const { difficulty = 'hard' } = context;
  
  const mods = collectModifiers('awayTeam', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  // Mission outcome
  const outcome = selectFromTable(AWAY_TEAM_OUTCOMES, rng);
  
  // Environmental hazard
  const hazardRoll = rollD12(rng);
  const hazard = selectFromTable(AWAY_TEAM_HAZARDS, rng);
  
  // Discovery
  const discoveryRoll = rollD10(rng);
  const discovery = selectFromTable(AWAY_TEAM_DISCOVERIES, rng);
  
  return {
    actionType: 'awayTeam',
    result: outcome.value,
    totalRoll,
    targetDifficulty,
    margin: totalRoll - targetDifficulty,
    modifierBreakdown: mods.breakdown,
    secondaryRolls: {
      hazard: { value: hazardRoll, outcome: hazard },
      discovery: { value: discoveryRoll, outcome: discovery }
    },
    consequences: {
      damageTaken: hazard.damage || 0,
      lootGained: success ? [{ item: discovery.label }] : [],
      statusEffects: hazard.aiInjury ? ['AI Critically Injured'] : hazard.statusEffect ? [hazard.statusEffect] : [],
      wakeAdded: 0.25,
      aiImpact: { 
        morale: success ? 2 : -2,
        stabilityLoss: hazard.aiInjury ? 0.3 : 0
      }
    }
  };
}

// ============================================================================
// COMBAT INITIATE (Initiative Roll)
// ============================================================================
function resolveCombatInitiate(context, rng) {
  const { enemy } = context;
  
  const mods = collectModifiers('combatInitiate', context);
  const playerRoll = rollD20(rng);
  const enemyRoll = rollD20(rng);
  
  const playerTotal = playerRoll.value + mods.total;
  const enemyTotal = enemyRoll.value;
  
  const playerGoesFirst = playerTotal >= enemyTotal;
  
  return {
    actionType: 'combatInitiate',
    result: playerGoesFirst ? 'success' : 'fail',
    initiative: {
      playerRoll: playerTotal,
      enemyRoll: enemyTotal,
      playerGoesFirst
    },
    modifierBreakdown: mods.breakdown,
    consequences: {
      playerTurn: playerGoesFirst,
      combatState: 'active',
      wakeAdded: 0.05
    }
  };
}

// ============================================================================
// COMBAT ATTACK RESOLUTION
// ============================================================================
function resolveCombatAttack(context, rng) {
  const { weapon, target } = context;
  
  const mods = collectModifiers('combatAttack', context);
  
  // Hit roll
  const hitRoll = rollD20(rng);
  const hitTotal = hitRoll.value + mods.total;
  const targetEvasion = target?.evasion || 12;
  const hit = hitTotal >= targetEvasion;
  
  // Damage roll (if hit)
  let damageResult = null;
  let defenseRoll = null;
  let finalDamage = 0;
  
  if (hit) {
    const damageNotation = getCombatDamage(weapon?.type || 'laser', weapon?.tier || 1);
    damageResult = rollNotation(damageNotation, rng);
    
    // Defense/absorption
    defenseRoll = rollD12(rng);
    const shieldAbsorption = Math.min(defenseRoll, target?.shields || 0);
    finalDamage = Math.max(0, damageResult.total - shieldAbsorption);
  }
  
  // Status effect check
  const statusRoll = rollD6(rng);
  const statusEffect = getStatusEffect(statusRoll);
  
  // Apply crit multiplier
  if (statusEffect.value === 'criticalHit' && damageResult) {
    finalDamage *= statusEffect.multiplier;
  }
  
  return {
    actionType: 'combatAttack',
    result: hitRoll.isCritSuccess ? 'crit_success' : hit ? 'success' : 'fail',
    hitRoll: {
      d20: hitRoll.value,
      modifiers: mods.breakdown,
      total: hitTotal,
      targetEvasion,
      hit
    },
    damageRoll: damageResult ? {
      notation: damageResult.notation,
      rolls: damageResult.rolls,
      total: damageResult.total,
      finalDamage
    } : null,
    defenseRoll: defenseRoll ? {
      d12: defenseRoll,
      absorption: Math.min(defenseRoll, target?.shields || 0)
    } : null,
    statusEffect,
    consequences: {
      enemyDamage: finalDamage,
      weaponHeat: 15,
      statusEffects: statusEffect.value !== 'none' ? [statusEffect.label] : [],
      wakeAdded: 0.05,
      aiImpact: { morale: hit ? 1 : 0 }
    }
  };
}

// ============================================================================
// COMBAT FLEE RESOLUTION
// ============================================================================
function resolveCombatFlee(context, rng) {
  const { combatDuration = 0 } = context;
  
  const mods = collectModifiers('combatFlee', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const difficulty = 15 + Math.floor(combatDuration / 2); // Harder to flee longer combat
  const escaped = totalRoll >= difficulty;
  
  return {
    actionType: 'combatFlee',
    result: escaped ? 'success' : 'fail',
    totalRoll,
    targetDifficulty: difficulty,
    margin: totalRoll - difficulty,
    modifierBreakdown: mods.breakdown,
    consequences: {
      combatEnded: escaped,
      wakeAdded: escaped ? 0.8 : 0.1,
      fuelConsumed: escaped ? 2 : 0,
      statusEffects: escaped ? ['Damaged Engines'] : [],
      aiImpact: { stability: escaped ? -0.2 : 0, morale: escaped ? -1 : 0 }
    }
  };
}

// ============================================================================
// COMBAT REPAIR RESOLUTION
// ============================================================================
function resolveCombatRepair(context, rng) {
  const { targetSystem = 'hull', emergency = true } = context;
  
  const mods = collectModifiers('combatRepair', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const difficulty = emergency ? 14 : 10;
  const success = totalRoll >= difficulty;
  
  // Repair amount
  let repairAmount = 0;
  if (success) {
    const repairRoll = rollD10(rng);
    repairAmount = repairRoll + Math.max(0, mods.total);
  }
  
  return {
    actionType: 'combatRepair',
    result: success ? 'success' : 'fail',
    totalRoll,
    targetDifficulty: difficulty,
    margin: totalRoll - difficulty,
    modifierBreakdown: mods.breakdown,
    repairAmount,
    consequences: {
      systemRepaired: targetSystem,
      repairValue: repairAmount,
      turnSkipped: true,
      aiImpact: { engineerFatigue: 1 }
    }
  };
}

// ============================================================================
// MISSION COMPLETION RESOLUTION
// ============================================================================
function resolveMissionCompletion(context, rng) {
  const { mission } = context;
  
  const mods = collectModifiers('missionCompletion', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const difficulty = DIFFICULTY_TDS[mission.difficulty || 'normal'];
  const success = totalRoll >= difficulty;
  const margin = totalRoll - difficulty;
  
  // Get mission tier table
  const tierTable = MISSION_COMPLETION_TABLES[mission.tier] || MISSION_COMPLETION_TABLES.standard;
  
  // Weight outcome by margin
  let outcomeTable = tierTable;
  if (margin > 5) {
    // Excellent performance - boost success weights
    outcomeTable = tierTable.map(o => 
      o.result.includes('success') ? { ...o, weight: o.weight * 1.5 } : o
    );
  } else if (margin < -3) {
    // Poor performance - boost failure weights
    outcomeTable = tierTable.map(o => 
      o.result.includes('fail') ? { ...o, weight: o.weight * 1.5 } : o
    );
  }
  
  const outcome = selectFromTable(outcomeTable, rng);
  
  // Apply loot multiplier
  const finalLoot = (mission.baseLoot || []).map(item => ({
    ...item,
    quantity: Math.floor(item.quantity * outcome.lootMultiplier)
  }));
  
  // Bonus reward
  let bonusReward = null;
  if (outcome.bonusReward && mission.bonusPool) {
    const bonusIndex = Math.floor(rng() * mission.bonusPool.length);
    bonusReward = mission.bonusPool[bonusIndex];
  }
  
  return {
    actionType: 'missionCompletion',
    result: outcome.result,
    totalRoll,
    targetDifficulty: difficulty,
    margin,
    modifierBreakdown: mods.breakdown,
    consequences: {
      lootGained: finalLoot,
      bonusReward: bonusReward ? [{ item: bonusReward }] : null,
      storyUnlock: outcome.storyUnlock || false,
      wakeAdded: mission.duration * 0.1,
      aiImpact: { morale: success ? 3 : -2 }
    }
  };
}
