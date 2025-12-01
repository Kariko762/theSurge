/**
 * AI Personality System
 * Defines behavioral archetypes that influence AI decision-making
 */

/**
 * Personality trait definitions
 * Each personality has weights that modify decision probabilities
 */
export const PERSONALITY_TRAITS = {
  AGGRESSIVE: {
    name: 'Aggressive',
    description: 'Prefers direct confrontation, closes to optimal range aggressively',
    color: '#d0021b', // Red
    
    weights: {
      attack: 1.5,          // 50% more likely to attack
      retreat: 0.3,         // 70% less likely to flee
      closeDistance: 1.4,   // Prefers closing in
      keepDistance: 0.6,    // Dislikes keeping range
      negotiate: 0.2,       // Rarely negotiates
      evasive: 0.7,         // Less defensive
      targetWeakest: 1.2    // Opportunistic
    },
    
    thresholds: {
      retreatHP: 15,        // Only retreats below 15% HP
      engageDistance: 'CLOSE',
      pursueFleeing: true,
      riskTolerance: 0.8    // High risk tolerance
    },
    
    actionPreferences: {
      FIRE_WEAPON: 1.5,
      EVASIVE_MANEUVERS: 0.5,
      BOOST_SHIELDS: 0.7,
      EMERGENCY_REPAIR: 0.6
    }
  },

  CAUTIOUS: {
    name: 'Cautious',
    description: 'Maintains distance, retreats early, prefers long-range engagements',
    color: '#4a90e2', // Blue
    
    weights: {
      attack: 0.8,
      retreat: 1.3,         // 30% more likely to flee
      closeDistance: 0.6,
      keepDistance: 1.4,    // Strongly prefers long range
      negotiate: 1.2,
      evasive: 1.3,         // Very defensive
      targetWeakest: 1.4    // Picks easy targets
    },
    
    thresholds: {
      retreatHP: 40,        // Retreats at 40% HP
      engageDistance: 'LONG',
      pursueFleeing: false,
      riskTolerance: 0.3    // Low risk tolerance
    },
    
    actionPreferences: {
      FIRE_WEAPON: 1.0,
      EVASIVE_MANEUVERS: 1.5,
      BOOST_SHIELDS: 1.4,
      EMERGENCY_REPAIR: 1.3
    }
  },

  TACTICAL: {
    name: 'Tactical',
    description: 'Analyzes threats, maintains optimal weapon range, balanced approach',
    color: '#7ed321', // Green
    
    weights: {
      attack: 1.0,
      retreat: 1.0,
      closeDistance: 1.0,
      keepDistance: 1.0,
      optimalRange: 1.8,    // Strongly prefers weapon optimal range
      scanEnemy: 1.5,       // Gathers intel before engaging
      negotiate: 0.9,
      evasive: 1.1,
      targetStrongest: 1.3  // Eliminates threats
    },
    
    thresholds: {
      retreatHP: 25,
      engageDistance: 'MEDIUM',
      pursueFleeing: true,
      riskTolerance: 0.5    // Balanced
    },
    
    actionPreferences: {
      FIRE_WEAPON: 1.2,
      SCAN_TARGET: 1.5,
      EVASIVE_MANEUVERS: 1.1,
      TARGET_LOCK: 1.4,
      BOOST_SHIELDS: 1.0
    }
  },

  BERSERKER: {
    name: 'Berserker',
    description: 'Charges in recklessly, fights to the death, ignores damage',
    color: '#ff4500', // Orange-red
    
    weights: {
      attack: 2.0,          // Extremely aggressive
      retreat: 0.1,         // Almost never retreats
      closeDistance: 2.0,   // Rushes to point blank
      keepDistance: 0.2,
      negotiate: 0.0,       // Never negotiates
      evasive: 0.3,         // Ignores defense
      reckless: 1.5,        // All-in attacks
      targetClosest: 1.8    // Attacks whatever is nearest
    },
    
    thresholds: {
      retreatHP: 5,         // Fights to near death
      engageDistance: 'POINT_BLANK',
      pursueFleeing: true,
      riskTolerance: 1.0,   // Maximum risk
      enrageHP: 30          // Gets more aggressive below 30% HP
    },
    
    actionPreferences: {
      FIRE_WEAPON: 2.0,
      EVASIVE_MANEUVERS: 0.2,
      BOOST_SHIELDS: 0.3,
      EMERGENCY_REPAIR: 0.1
    }
  },

  PARANOID: {
    name: 'Paranoid',
    description: 'Extremely cautious, scans constantly, flees at first sign of danger',
    color: '#bd10e0', // Purple
    
    weights: {
      attack: 0.7,
      retreat: 1.8,         // Very likely to flee
      closeDistance: 0.4,
      keepDistance: 1.6,
      negotiate: 0.5,       // Distrusts negotiations
      evasive: 1.6,         // Extremely defensive
      scanEnemy: 1.4,       // Constantly scanning for threats
      targetStrongest: 0.8, // Avoids tough enemies
      flee: 1.8             // Quick to run
    },
    
    thresholds: {
      retreatHP: 60,        // Retreats very early
      engageDistance: 'EXTREME',
      pursueFleeing: false,
      riskTolerance: 0.1,   // Minimal risk
      suspicionLevel: 1.5   // Assumes worst intentions
    },
    
    actionPreferences: {
      FIRE_WEAPON: 0.7,
      EVASIVE_MANEUVERS: 2.0,
      BOOST_SHIELDS: 1.8,
      SCAN_TARGET: 1.6,
      EMERGENCY_REPAIR: 1.5
    }
  },

  TRADER: {
    name: 'Trader/Neutral',
    description: 'Avoids combat, strongly prefers negotiation, only fights when cornered',
    color: '#f8e71c', // Yellow
    
    weights: {
      attack: 0.3,          // Rarely initiates combat
      retreat: 1.5,
      closeDistance: 0.5,
      keepDistance: 1.3,
      negotiate: 2.0,       // Strongly prefers talking
      evasive: 1.4,
      flee: 1.8,            // Quick to escape
      surrender: 1.5        // Will surrender if cornered
    },
    
    thresholds: {
      retreatHP: 70,        // Flees at first sign of damage
      engageDistance: 'LONG',
      pursueFleeing: false,
      riskTolerance: 0.2,
      willFightBack: false, // Won't fight unless cornered
      corneredHP: 30        // Fights back when below 30% HP and can't flee
    },
    
    actionPreferences: {
      FIRE_WEAPON: 0.4,
      EVASIVE_MANEUVERS: 1.8,
      BOOST_SHIELDS: 1.6,
      EMERGENCY_REPAIR: 1.4
    }
  }
};

/**
 * Get personality by name
 * @param {string} personalityName - Personality key
 * @returns {object} Personality trait object
 */
export function getPersonality(personalityName) {
  const personality = PERSONALITY_TRAITS[personalityName];
  if (!personality) {
    console.warn(`Unknown personality: ${personalityName}, defaulting to TACTICAL`);
    return PERSONALITY_TRAITS.TACTICAL;
  }
  return personality;
}

/**
 * Get random personality
 * @param {Array<string>} exclude - Personality names to exclude
 * @returns {string} Random personality key
 */
export function getRandomPersonality(exclude = []) {
  const available = Object.keys(PERSONALITY_TRAITS).filter(p => !exclude.includes(p));
  return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get personality weight for decision
 * @param {object} personality - Personality trait object
 * @param {string} decision - Decision type (attack, retreat, etc.)
 * @returns {number} Weight multiplier
 */
export function getPersonalityWeight(personality, decision) {
  return personality.weights[decision] || 1.0;
}

/**
 * Check if personality should retreat based on HP
 * @param {object} personality - Personality trait object
 * @param {number} hpPercent - Current HP percentage (0-100)
 * @returns {boolean}
 */
export function shouldRetreatByHP(personality, hpPercent) {
  return hpPercent <= personality.thresholds.retreatHP;
}

/**
 * Get personality's preferred engagement distance
 * @param {object} personality - Personality trait object
 * @returns {string} Distance band key
 */
export function getPreferredEngagementDistance(personality) {
  return personality.thresholds.engageDistance || 'MEDIUM';
}

/**
 * Calculate action preference score
 * @param {object} personality - Personality trait object
 * @param {string} actionType - Action type key
 * @returns {number} Preference score
 */
export function getActionPreference(personality, actionType) {
  return personality.actionPreferences[actionType] || 1.0;
}

/**
 * Check if personality is enraged (Berserker trait)
 * @param {object} personality - Personality trait object
 * @param {number} hpPercent - Current HP percentage
 * @returns {boolean}
 */
export function isEnraged(personality, hpPercent) {
  if (!personality.thresholds.enrageHP) return false;
  return hpPercent <= personality.thresholds.enrageHP;
}

/**
 * Check if personality is cornered and will fight back (Trader trait)
 * @param {object} personality - Personality trait object
 * @param {number} hpPercent - Current HP percentage
 * @param {boolean} canFlee - Can the ship flee?
 * @returns {boolean}
 */
export function isCornered(personality, hpPercent, canFlee) {
  if (!personality.thresholds.corneredHP) return false;
  return hpPercent <= personality.thresholds.corneredHP && !canFlee;
}

/**
 * Modify weights based on dynamic conditions
 * @param {object} personality - Personality trait object
 * @param {object} situation - Current situation assessment
 * @returns {object} Modified weights
 */
export function getDynamicWeights(personality, situation) {
  const weights = { ...personality.weights };
  
  // Berserker enrage bonus
  if (isEnraged(personality, situation.myHP)) {
    weights.attack *= 1.5;
    weights.retreat *= 0.5;
    weights.reckless = (weights.reckless || 1.0) * 2.0;
  }
  
  // Trader cornered response
  if (isCornered(personality, situation.myHP, situation.canFlee)) {
    weights.attack *= 3.0;  // Desperate fight
    weights.flee = 0.0;
  }
  
  // Outnumbered penalty for non-berserkers
  if (situation.outnumbered && personality.name !== 'Berserker') {
    weights.retreat *= 1.5;
    weights.flee *= 1.3;
  }
  
  // Advantage bonus
  if (situation.hasAdvantage) {
    weights.attack *= 1.2;
    weights.closeDistance *= 1.1;
  }
  
  return weights;
}

/**
 * Get personality description for UI
 * @param {string} personalityName - Personality key
 * @returns {object} UI-friendly description
 */
export function getPersonalityInfo(personalityName) {
  const personality = getPersonality(personalityName);
  return {
    name: personality.name,
    description: personality.description,
    color: personality.color,
    traits: {
      aggression: personality.weights.attack || 1.0,
      caution: personality.weights.retreat || 1.0,
      riskTolerance: personality.thresholds.riskTolerance || 0.5
    },
    retreatThreshold: personality.thresholds.retreatHP,
    preferredRange: personality.thresholds.engageDistance
  };
}
