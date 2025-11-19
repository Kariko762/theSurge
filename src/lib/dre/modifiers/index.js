/**
 * Modifier Registry and Aggregation
 * Collects modifiers from all sources
 */

import { getShipModifiers } from './sources/ship.js';
import { getAIModifiers } from './sources/ai.js';
import { getEnvironmentModifiers } from './sources/environment.js';
import { getResearchModifiers } from './sources/research.js';
import { getAttributeModifiers } from './sources/attributes.js';
import { getSkillModifiers } from './sources/skills.js';
import { getConsequenceModifiers } from './sources/consequence.js';

/**
 * Registry of all modifier sources
 * Order matters: sources are evaluated in order
 */
export const MODIFIER_SOURCES = [
  { name: 'ship', fn: getShipModifiers, priority: 1 },
  { name: 'ai', fn: getAIModifiers, priority: 2 },
  { name: 'attributes', fn: getAttributeModifiers, priority: 3 },
  { name: 'research', fn: getResearchModifiers, priority: 4 },
  { name: 'skills', fn: getSkillModifiers, priority: 5 },
  { name: 'environment', fn: getEnvironmentModifiers, priority: 6 },
  { name: 'consequence', fn: getConsequenceModifiers, priority: 7 }
];

/**
 * Collect modifiers from all registered sources
 * @param {string} actionType - Type of action being performed
 * @param {Object} context - Action context containing all relevant data
 * @returns {Object} { total: number, breakdown: {...} }
 */
export function collectModifiers(actionType, context) {
  const breakdown = {};
  let total = 0;
  
  for (const source of MODIFIER_SOURCES) {
    try {
      const mod = source.fn(actionType, context);
      if (mod !== 0) {
        breakdown[source.name] = mod;
        total += mod;
      }
    } catch (error) {
      console.warn(`Error in modifier source "${source.name}":`, error);
      breakdown[source.name] = 0;
    }
  }
  
  return { total, breakdown };
}

/**
 * Add a custom modifier source (for plugins/extensions)
 * @param {string} name - Source name
 * @param {function} fn - Function that returns modifier value
 * @param {number} priority - Evaluation priority (lower = earlier)
 */
export function registerModifierSource(name, fn, priority = 10) {
  MODIFIER_SOURCES.push({ name, fn, priority });
  MODIFIER_SOURCES.sort((a, b) => a.priority - b.priority);
}

/**
 * Remove a modifier source
 * @param {string} name - Source name to remove
 */
export function unregisterModifierSource(name) {
  const index = MODIFIER_SOURCES.findIndex(s => s.name === name);
  if (index !== -1) {
    MODIFIER_SOURCES.splice(index, 1);
  }
}

/**
 * Get difficulty modifier based on difficulty level
 * @param {string} difficulty - Difficulty level
 * @returns {number} Modifier value
 */
export function getDifficultyModifier(difficulty) {
  const modifiers = {
    trivial: -5,
    easy: -2,
    normal: 0,
    hard: 3,
    deadly: 6,
    impossible: 10
  };
  
  return modifiers[difficulty] || 0;
}

/**
 * Preview modifiers without applying them
 * Useful for UI to show "what would happen if..."
 * @param {string} actionType - Type of action
 * @param {Object} context - Action context
 * @returns {Object} Modifier breakdown
 */
export function previewModifiers(actionType, context) {
  return collectModifiers(actionType, context);
}
