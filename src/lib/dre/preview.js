/**
 * Dice Resolution Engine - Odds Preview
 * Calculate probability bands without rolling
 */

import { collectModifiers, getDifficultyModifier } from './modifiers/index.js';
import { DIFFICULTY_TDS } from './tables.js';

/**
 * Preview success probability for an action
 * @param {string} actionType - Type of action
 * @param {Object} context - Action context
 * @returns {Object} Probability breakdown
 */
export function previewOdds(actionType, context) {
  const { difficulty = 'normal' } = context;
  
  // Collect modifiers
  const mods = collectModifiers(actionType, context);
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  
  // Calculate probabilities for D20
  // Base roll ranges from 1-20
  // Success if: (roll + modifier) >= targetDifficulty
  // Need roll >= (targetDifficulty - modifier)
  
  const neededRoll = targetDifficulty - mods.total;
  
  // Probabilities
  let critSuccess = 5; // Always 5% (nat 20)
  let critFail = 5;    // Always 5% (nat 1)
  
  let success = 0;
  let fail = 0;
  
  if (neededRoll <= 1) {
    // Guaranteed success (except nat 1)
    success = 90;
    fail = 0;
  } else if (neededRoll >= 20) {
    // Guaranteed fail (except nat 20)
    success = 0;
    fail = 90;
  } else {
    // Calculate success range
    const successRange = 20 - neededRoll + 1; // Rolls that succeed
    success = (successRange - 1) * 5; // Subtract 1 for nat 20 already counted
    fail = 90 - success;
  }
  
  return {
    actionType,
    difficulty,
    targetDifficulty,
    modifierTotal: mods.total,
    modifierBreakdown: mods.breakdown,
    neededRoll,
    probabilities: {
      critSuccess,
      success,
      fail,
      critFail
    },
    successChance: critSuccess + success,
    failChance: fail + critFail,
    summary: generateOddsSummary(critSuccess + success, mods.total)
  };
}

/**
 * Generate human-readable odds summary
 * @param {number} successChance - Total success percentage
 * @param {number} modifier - Total modifier
 * @returns {string} Summary text
 */
function generateOddsSummary(successChance, modifier) {
  const modText = modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : '±0';
  
  if (successChance >= 95) {
    return `Almost Certain (${successChance}%) [${modText}]`;
  } else if (successChance >= 75) {
    return `Very Likely (${successChance}%) [${modText}]`;
  } else if (successChance >= 60) {
    return `Likely (${successChance}%) [${modText}]`;
  } else if (successChance >= 50) {
    return `Even Odds (${successChance}%) [${modText}]`;
  } else if (successChance >= 35) {
    return `Unlikely (${successChance}%) [${modText}]`;
  } else if (successChance >= 20) {
    return `Very Unlikely (${successChance}%) [${modText}]`;
  } else {
    return `Nearly Impossible (${successChance}%) [${modText}]`;
  }
}

/**
 * Compare odds between different contexts
 * Useful for "what if" scenarios
 * @param {string} actionType - Type of action
 * @param {Array<Object>} contexts - Array of contexts to compare
 * @returns {Array<Object>} Array of odds previews
 */
export function compareOdds(actionType, contexts) {
  return contexts.map((context, index) => ({
    index,
    label: context.label || `Option ${index + 1}`,
    odds: previewOdds(actionType, context)
  }));
}

/**
 * Get recommended difficulty for target success chance
 * @param {string} actionType - Type of action
 * @param {Object} context - Action context
 * @param {number} targetSuccessChance - Desired success % (0-100)
 * @returns {Object} Recommended difficulty and expected odds
 */
export function getRecommendedDifficulty(actionType, context, targetSuccessChance = 65) {
  const difficulties = ['trivial', 'easy', 'normal', 'hard', 'deadly', 'impossible'];
  
  const results = difficulties.map(diff => {
    const odds = previewOdds(actionType, { ...context, difficulty: diff });
    const delta = Math.abs(odds.successChance - targetSuccessChance);
    return { difficulty: diff, odds, delta };
  });
  
  // Find closest match
  results.sort((a, b) => a.delta - b.delta);
  
  return {
    recommended: results[0].difficulty,
    expectedSuccessChance: results[0].odds.successChance,
    allOptions: results
  };
}

/**
 * Preview combat hit chance
 * @param {Object} context - Combat context with weapon, modifiers, target
 * @returns {Object} Hit probability breakdown
 */
export function previewCombatHit(context) {
  const { target } = context;
  const mods = collectModifiers('combatAttack', context);
  
  const targetEvasion = target?.evasion || 12;
  const neededRoll = targetEvasion - mods.total;
  
  let critSuccess = 5;
  let critFail = 5;
  let hit = 0;
  let miss = 0;
  
  if (neededRoll <= 1) {
    hit = 90;
    miss = 0;
  } else if (neededRoll >= 20) {
    hit = 0;
    miss = 90;
  } else {
    const hitRange = 20 - neededRoll + 1;
    hit = (hitRange - 1) * 5;
    miss = 90 - hit;
  }
  
  return {
    targetEvasion,
    modifierTotal: mods.total,
    modifierBreakdown: mods.breakdown,
    neededRoll,
    probabilities: {
      critSuccess,
      hit,
      miss,
      critFail
    },
    hitChance: critSuccess + hit,
    missChance: miss + critFail
  };
}
