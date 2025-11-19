/**
 * Dice Resolution Engine - Dice Utilities
 * Core dice rolling functions using seeded RNG
 */

import { makeRng, randInt } from '../rng.js';

/**
 * Generic dice roller
 * @param {number} sides - Number of sides on the die
 * @param {function} rng - Seeded random number generator
 * @returns {number} Roll result
 */
export function roll(sides, rng) {
  return randInt(rng, 1, sides);
}

/**
 * Roll a D20 with critical detection
 * @param {function} rng - Seeded random number generator
 * @returns {Object} { value, isCritSuccess, isCritFail }
 */
export function rollD20(rng) {
  const value = roll(20, rng);
  return {
    value,
    isCritSuccess: value === 20,
    isCritFail: value === 1
  };
}

/**
 * Roll a D12 (used for hazards, defense, structure)
 * @param {function} rng - Seeded random number generator
 * @returns {number} Roll result
 */
export function rollD12(rng) {
  return roll(12, rng);
}

/**
 * Roll a D10 (used for loot quality, yield)
 * @param {function} rng - Seeded random number generator
 * @returns {number} Roll result
 */
export function rollD10(rng) {
  return roll(10, rng);
}

/**
 * Roll a D6 (used for status effects, secondary outcomes)
 * @param {function} rng - Seeded random number generator
 * @returns {number} Roll result
 */
export function rollD6(rng) {
  return roll(6, rng);
}

/**
 * Roll a D100 (percentile, used for detection, branching)
 * @param {function} rng - Seeded random number generator
 * @returns {number} Roll result (1-100)
 */
export function rollD100(rng) {
  return randInt(rng, 1, 100);
}

/**
 * Roll multiple dice and sum them
 * @param {number} count - Number of dice to roll
 * @param {number} sides - Number of sides per die
 * @param {function} rng - Seeded random number generator
 * @returns {Object} { rolls: Array, total: number }
 */
export function rollMultiple(count, sides, rng) {
  const rolls = [];
  let total = 0;
  
  for (let i = 0; i < count; i++) {
    const value = roll(sides, rng);
    rolls.push(value);
    total += value;
  }
  
  return { rolls, total };
}

/**
 * Parse and roll a dice notation string (e.g., "2d8+3")
 * @param {string} notation - Dice notation (e.g., "2d8", "1d10+2", "3d6-1")
 * @param {function} rng - Seeded random number generator
 * @returns {Object} { notation, rolls, rawTotal, modifier, total }
 */
export function rollNotation(notation, rng) {
  // Parse notation: "2d8+3" -> count=2, sides=8, modifier=+3
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/i);
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }
  
  const count = parseInt(match[1]);
  const sides = parseInt(match[2]);
  const modifier = match[3] ? parseInt(match[3]) : 0;
  
  const { rolls, total: rawTotal } = rollMultiple(count, sides, rng);
  const total = rawTotal + modifier;
  
  return {
    notation,
    rolls,
    rawTotal,
    modifier,
    total
  };
}

/**
 * Check if a roll is a critical (1 or max value)
 * @param {number} value - The roll value
 * @param {number} sides - The die size
 * @returns {Object} { isCritSuccess, isCritFail }
 */
export function checkCritical(value, sides) {
  return {
    isCritSuccess: value === sides,
    isCritFail: value === 1
  };
}

/**
 * Create a dice roller with a specific seed
 * Useful for predictable combat/action sequences
 * @param {string} seed - Seed string for RNG
 * @param {string} label - Label for this dice stream
 * @returns {function} RNG function
 */
export function createDiceRng(seed, label) {
  return makeRng(seed, label);
}
