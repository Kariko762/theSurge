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
  MISSION_COMPLETION_TABLES,
  CLUSTER_TYPE_CLASSIFICATION,
  ASTEROID_COMPOSITION,
  ASTEROID_LOOT_TABLES,
  ASTEROID_MINING_HAZARDS
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
    case 'scanCluster':
        const galacticZone = (context?.galacticZone ? String(context.galacticZone).toLowerCase() : 'periphery');
        const systemTier = typeof context?.systemTier === 'number' ? context.systemTier : 1.0;
      return resolveMineAsteroid(context, rng);
    case 'asteroidRecovery':
      return resolveAsteroidRecovery(context, rng);
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

/**
 * Execute DRE action from UI action panel
 * Simplified wrapper for direct UI integration
 */
export function executeDREAction({ actionType, targetType, targetName, distance, shipState, systemContext }) {
  const seed = `${targetName}-${Date.now()}`;
  
  // Map UI action types to DRE action types
  const dreActionMap = {
    'scan': 'scavenging',
    'mine': 'mining',
    'investigate': 'derelict',
    'hail': 'dialogue',
    'dock': 'dialogue',
    'respond': 'awayTeam',
    'orbit': 'dialogue',
    'approach': 'dialogue'
  };
  
  const dreAction = dreActionMap[actionType] || 'scavenging';
  
  // Build context from available data
  const context = {
    location: {
      type: typeof targetType === 'string' ? targetType.toLowerCase() : 'unknown',
      name: targetName,
      distance: distance,
      system: systemContext?.name || 'Unknown'
    },
    ship: {
      sensors: shipState?.power || 50,
      hull: shipState?.hull || 100,
      shields: shipState?.shields || 100
    },
    difficulty: distance > 3 ? 'Hard' : distance > 1 ? 'Medium' : 'Easy'
  };
  
  // Execute DRE action
  const result = resolveAction(dreAction, context, seed);
  
  // Format for terminal display
  return {
    narrative: result.narrative || [`Executed ${actionType} on ${targetName}`],
    outcome: result.outcome ? [
      `Result: ${result.success ? 'Success' : 'Failed'}`,
      result.outcome
    ] : ['Action completed']
  };
}

// ============================================================================
// ASTEROID MINING RESOLUTION
// ============================================================================

/**
 * SCAN_CLUSTER - Initial cluster discovery and classification
 * Returns detailed roll breakdown for terminal display
 */
function resolveScanCluster(context, rng) {
  const { 
    difficulty = 'easy', // Easy difficulty (DC 3) - asteroid scanning should be very reliable
    galacticZone = 'Dark',
    systemTier = 1,
    shipSensors = 20
  } = context;
  
  console.log('[DRE] === resolveScanCluster ===');
  console.log('[DRE] Context:', context);
  console.log('[DRE] Difficulty:', difficulty);
  console.log('[DRE] Galactic Zone:', galacticZone);
  console.log('[DRE] System Tier:', systemTier);
  
  // Collect modifiers
  const mods = collectModifiers('mining', context);
  console.log('[DRE] Modifiers collected:', mods);
  
  // Add +6 bonus to asteroid scanning to make it more reliable
  const scanningBonus = 6;
  
  const baseRoll = rollD20(rng);
  console.log('[DRE] Base D20 Roll:', baseRoll);
  
  const totalRoll = baseRoll.value + mods.total + scanningBonus;
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  console.log('[DRE] Total Roll:', totalRoll, '=', baseRoll.value, '+', mods.total, '+', scanningBonus);
  console.log('[DRE] Target Difficulty:', targetDifficulty);
  console.log('[DRE] Success?', success);
  
  // Build detailed roll log
  const rollLog = [
    `Scan Roll: D20(${baseRoll.value}) + Modifiers(${mods.total}) + Sensors(+${scanningBonus}) = ${totalRoll}`,
    `Target Difficulty: ${targetDifficulty} (${difficulty})`
  ];
  
  // Add modifier breakdown (breakdown is an object, not an array)
  if (mods.breakdown && typeof mods.breakdown === 'object') {
    Object.entries(mods.breakdown).forEach(([source, value]) => {
      rollLog.push(`  ${source}: ${value > 0 ? '+' : ''}${value}`);
    });
  }
  
  if (!success) {
    console.log('[DRE] Scan FAILED - returning failure result');
    return {
      actionType: 'scanCluster',
      result: 'fail',
      totalRoll,
      targetDifficulty,
      rollLog,
      consequences: {
        message: 'Sensor sweep inconclusive. Unable to classify cluster density.',
        wakeAdded: 0.05
      }
    };
  }
  
  console.log('[DRE] Scan SUCCESS - determining cluster type...');
  
  // Determine cluster type with modifiers
  let clusterTypeTable = [...CLUSTER_TYPE_CLASSIFICATION];
  
  // Filter out Type-V if not in Dark zone
  if (galacticZone !== 'Dark') {
    clusterTypeTable = clusterTypeTable.filter(c => !c.darkZoneOnly);
  }
  
  // Apply system tier bonus to shift weights toward higher types
  const tierBonus = Math.max(0, systemTier - 1);
  if (tierBonus > 0) {
    clusterTypeTable = clusterTypeTable.map(c => {
      const typeNum = parseInt(c.type.split('-')[1].replace('I', '1').replace('V', '5'));
      const weightBoost = typeNum >= 3 ? Math.pow(1.2, tierBonus) : 1;
      return { ...c, weight: c.weight * weightBoost };
    });
  }
  
  const clusterType = selectFromTable(clusterTypeTable, rng);
  console.log('[DRE] Cluster Type selected:', clusterType);
  
  const asteroidCount = Math.floor(clusterType.densityRange[0] + rng() * (clusterType.densityRange[1] - clusterType.densityRange[0] + 1));
  console.log('[DRE] Asteroid Count:', asteroidCount);
  
  rollLog.push(`Cluster Type Roll: ${clusterType.type} (${clusterType.label})`);
  rollLog.push(`Asteroid Count: ${asteroidCount} (range ${clusterType.densityRange[0]}-${clusterType.densityRange[1]})`);
  
  const scanResult = {
    actionType: 'scanCluster',
    result: 'success',
    totalRoll,
    targetDifficulty,
    rollLog,
    clusterData: {
      type: clusterType.type,
      typeLabel: clusterType.label,
      description: clusterType.description,
      currentAsteroids: asteroidCount,
      maxAsteroids: asteroidCount,
      recoveryDays: clusterType.recoveryDays,
      compositionBonus: clusterType.compositionBonus,
      miningRate: clusterType.miningRate
    },
    consequences: {
      wakeAdded: 0.1,
      message: `${clusterType.label} detected. ${asteroidCount} asteroids available. Recovery rate: ${clusterType.recoveryDays} day(s) per asteroid.`
    }
  };
  
  console.log('[DRE] === Returning Scan Result ===');
  console.log('[DRE] Result:', scanResult);
  
  return scanResult;
}

/**
 * MINE_ASTEROID - Extract resources from an asteroid
 * Returns detailed roll breakdown for terminal display
 */
function resolveMineAsteroid(context, rng) {
  const { 
    difficulty = 'normal', 
    cluster,
    galacticZone = 'Dark'
  } = context;
  
  const mods = collectModifiers('mining', context);
  const compositionBonus = cluster?.compositionBonus || 0;
  
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  const rollLog = [
    `Mining Roll: D20(${baseRoll.value}) + Modifiers(${mods.total}) = ${totalRoll}`,
    `Target Difficulty: ${targetDifficulty} (${difficulty})`
  ];
  
  // Add modifier breakdown (breakdown is an object, not an array)
  if (mods.breakdown && typeof mods.breakdown === 'object') {
    Object.entries(mods.breakdown).forEach(([source, value]) => {
      rollLog.push(`  ${source}: ${value > 0 ? '+' : ''}${value}`);
    });
  }
  
  // Hazard check (always rolled)
  const hazard = selectFromTable(ASTEROID_MINING_HAZARDS, rng);
  rollLog.push(`Hazard Check: ${hazard.label}`);
  if (hazard.damage > 0) {
    rollLog.push(`  Hull Damage: ${hazard.damage}%`);
  }
  
  if (!success) {
    return {
      actionType: 'mineAsteroid',
      result: 'fail',
      totalRoll,
      targetDifficulty,
      rollLog,
      secondaryRolls: { hazard },
      consequences: {
        damageTaken: hazard.damage,
        message: `Mining operation failed. ${hazard.label}.`,
        wakeAdded: 0.05,
        statusEffects: hazard.statusEffect ? [hazard.statusEffect] : []
      }
    };
  }
  
  // Determine asteroid composition with cluster bonus
  let compositionTable = [...ASTEROID_COMPOSITION];
  
  // Apply composition bonus by shifting weights toward higher tiers
  if (compositionBonus > 0) {
    compositionTable = compositionTable.map((comp, idx) => {
      const tierScore = compositionTable.length - idx; // Higher index = better tier
      const weightBoost = Math.pow(1.15, compositionBonus * (tierScore / compositionTable.length));
      return { ...comp, weight: comp.weight * weightBoost };
    });
  }
  
  // Filter out Xenotech if bonus too low
  compositionTable = compositionTable.filter(c => 
    !c.requiresBonus || compositionBonus >= c.requiresBonus
  );
  
  const composition = selectFromTable(compositionTable, rng);
  rollLog.push(`Asteroid Composition: ${composition.label} (${composition.yieldMultiplier}x multiplier)`);
  rollLog.push(`  ${composition.description}`);
  
  // Select loot from composition's loot table
  const lootTable = ASTEROID_LOOT_TABLES[composition.lootTable] || ASTEROID_LOOT_TABLES.metals;
  const loot = selectFromTable(lootTable, rng);
  
  // Calculate yield
  const baseYield = rollD6(rng);
  const finalYield = Math.floor(baseYield * composition.yieldMultiplier);
  
  rollLog.push(`Base Yield: D6(${baseYield})`);
  rollLog.push(`Final Yield: ${baseYield} × ${composition.yieldMultiplier} = ${finalYield}x ${loot.item}`);
  
  return {
    actionType: 'mineAsteroid',
    result: baseRoll.isCritSuccess ? 'crit_success' : 'success',
    totalRoll,
    targetDifficulty,
    rollLog,
    composition: composition.label,
    yieldMultiplier: composition.yieldMultiplier,
    secondaryRolls: {
      hazard,
      yield: { base: baseYield, multiplier: composition.yieldMultiplier, final: finalYield }
    },
    loot: [{ itemId: loot.itemId, name: loot.item, quantity: finalYield, category: composition.lootTable }],
    consequences: {
      damageTaken: hazard.damage,
      lootGained: [{ itemId: loot.itemId, item: loot.item, quantity: finalYield }],
      statusEffects: hazard.statusEffect ? [hazard.statusEffect] : [],
      wakeAdded: 0.15,
      message: `Extracted ${finalYield}x ${loot.item} from ${composition.label}. ${hazard.label}.`,
      asteroidConsumed: true
    }
  };
}

/**
 * ASTEROID_RECOVERY_TICK - Periodic replenishment check
 */
function resolveAsteroidRecovery(context, rng) {
  const { cluster, daysPassed } = context;
  
  if (!cluster || daysPassed < cluster.recoveryDays) {
    return {
      actionType: 'asteroidRecovery',
      result: 'pending',
      consequences: { recovered: 0 }
    };
  }
  
  const cyclesCompleted = Math.floor(daysPassed / cluster.recoveryDays);
  const asteroidsToRecover = Math.min(
    cyclesCompleted,
    cluster.maxAsteroids - cluster.currentAsteroids
  );
  
  return {
    actionType: 'asteroidRecovery',
    result: 'success',
    consequences: {
      recovered: asteroidsToRecover,
      message: asteroidsToRecover > 0 
        ? `${asteroidsToRecover} asteroid(s) replenished in cluster.`
        : 'Cluster at maximum capacity.'
    }
  };
}

// ============================================================================
// EXPORTED ASTEROID OPERATIONS
// ============================================================================

/**
 * Execute asteroid cluster scan
 * @param {Object} context - { galacticZone, systemTier, difficulty }
 * @returns {Object} Scan result with rollLog and clusterData
 */
export function executeAsteroidScan(context) {
  const seed = `scan-${Date.now()}-${Math.random()}-${performance.now()}`;
  const rng = makeRng(seed, 'scan_cluster');
  return resolveScanCluster(context, rng);
}

/**
 * Execute asteroid mining
 * @param {Object} context - { clusterType, compositionBonus, difficulty }
 * @returns {Object} Mining result with rollLog and loot
 */
export function executeAsteroidMine(context) {
  const seed = `mine-${Date.now()}-${Math.random()}-${performance.now()}`;
  const rng = makeRng(seed, 'mine_asteroid');
  return resolveMineAsteroid(context, rng);
}

/**
 * Execute asteroid recovery calculation
 * @param {Object} context - { currentAsteroids, maxAsteroids, recoveryRate, hoursElapsed }
 * @returns {Object} Recovery result
 */
export function executeAsteroidRecovery(context) {
  const seed = `recovery-${Date.now()}`;
  const rng = makeRng(seed, 'recovery');
  return resolveAsteroidRecovery(context, rng);
}
