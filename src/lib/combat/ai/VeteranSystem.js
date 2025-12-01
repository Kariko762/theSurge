/**
 * Veteran System - Difficulty Scaling
 * Provides stat bonuses and AI quality tiers for progressive difficulty
 */

/**
 * Veteran rank definitions
 * Each rank provides stat bonuses and affects AI decision quality
 */
export const VETERAN_RANKS = {
  ROOKIE: {
    rank: 0,
    displayName: 'Rookie',
    description: 'Inexperienced pilot, makes frequent mistakes',
    color: '#888888', // Grey
    
    statBonuses: {
      initiative: 0,
      attackBonus: -2,      // Penalty to hit
      evasion: -1,          // Easier to hit
      critRange: 20,        // Only crits on natural 20
      maxHP: 0.85,          // 85% HP (multiplier)
      maxShields: 0.85      // 85% shields
    },
    
    aiQuality: {
      mistakeChance: 0.25,      // 25% chance of poor decision
      reactionSpeed: 0.7,       // 70% reaction speed
      targetPriority: 'random', // Poor target selection
      usesAdvancedTactics: false,
      predictsPlayerMoves: false,
      wasteActionChance: 0.15   // 15% chance to waste actions
    }
  },

  TRAINED: {
    rank: 1,
    displayName: 'Trained',
    description: 'Standard trained pilot, baseline performance',
    color: '#4a90e2', // Blue
    
    statBonuses: {
      initiative: 0,
      attackBonus: 0,       // No bonus/penalty
      evasion: 0,
      critRange: 20,
      maxHP: 1.0,           // 100% HP (baseline)
      maxShields: 1.0
    },
    
    aiQuality: {
      mistakeChance: 0.10,
      reactionSpeed: 1.0,       // Full speed
      targetPriority: 'weakest', // Basic targeting
      usesAdvancedTactics: false,
      predictsPlayerMoves: false,
      wasteActionChance: 0.05
    }
  },

  VETERAN: {
    rank: 2,
    displayName: 'Veteran',
    description: 'Experienced pilot with improved stats and tactics',
    color: '#7ed321', // Green
    
    statBonuses: {
      initiative: +1,
      attackBonus: +1,
      evasion: +1,
      critRange: 20,
      maxHP: 1.15,          // +15% HP
      maxShields: 1.15,
      shieldRegenPerRound: 3
    },
    
    aiQuality: {
      mistakeChance: 0.05,
      reactionSpeed: 1.2,
      targetPriority: 'tactical',    // Prioritizes threats
      usesAdvancedTactics: false,
      predictsPlayerMoves: false,
      wasteActionChance: 0.02,
      usesStatusEffects: true        // Understands buffs/debuffs
    }
  },

  ELITE: {
    rank: 3,
    displayName: 'Elite',
    description: 'Elite pilot with superior combat skills',
    color: '#f5a623', // Orange
    
    statBonuses: {
      initiative: +2,
      attackBonus: +2,
      evasion: +2,
      critRange: 19,        // Crits on 19-20
      maxHP: 1.30,          // +30% HP
      maxShields: 1.30,
      shieldRegenPerRound: 5,
      damageBonus: 1.15     // +15% damage multiplier
    },
    
    aiQuality: {
      mistakeChance: 0.02,
      reactionSpeed: 1.5,
      targetPriority: 'optimal',
      usesAdvancedTactics: true,     // Flanking, focus fire, etc.
      predictsPlayerMoves: false,
      wasteActionChance: 0.0,
      usesStatusEffects: true,
      coordinatesWithAllies: true    // Team tactics
    }
  },

  ACE: {
    rank: 4,
    displayName: 'Ace',
    description: 'Legendary pilot, near-perfect performance',
    color: '#d0021b', // Red
    
    statBonuses: {
      initiative: +3,
      attackBonus: +3,
      evasion: +3,
      critRange: 18,        // Crits on 18-20
      maxHP: 1.50,          // +50% HP
      maxShields: 1.50,
      shieldRegenPerRound: 10,
      damageBonus: 1.25,    // +25% damage
      extraReaction: 1,     // +1 reaction per round
      extraBonusAction: 1   // +1 bonus action per round
    },
    
    aiQuality: {
      mistakeChance: 0.0,           // Perfect decision-making
      reactionSpeed: 2.0,           // Double reaction speed
      targetPriority: 'optimal',
      usesAdvancedTactics: true,
      predictsPlayerMoves: true,    // Anticipates player actions
      wasteActionChance: 0.0,
      usesStatusEffects: true,
      coordinatesWithAllies: true,
      exploitsWeaknesses: true,     // Targets damaged systems
      perfectRangeControl: true     // Always at optimal weapon range
    }
  }
};

/**
 * Get veteran rank by key
 * @param {string} rankName - Rank key (ROOKIE, TRAINED, etc.)
 * @returns {object} Veteran rank object
 */
export function getVeteranRank(rankName) {
  const rank = VETERAN_RANKS[rankName];
  if (!rank) {
    console.warn(`Unknown veteran rank: ${rankName}, defaulting to TRAINED`);
    return VETERAN_RANKS.TRAINED;
  }
  return rank;
}

/**
 * Apply veteran bonuses to ship stats
 * @param {object} baseStats - Base ship stats
 * @param {string} veteranRank - Veteran rank key
 * @returns {object} Modified stats
 */
export function applyVeteranBonuses(baseStats, veteranRank) {
  const rank = getVeteranRank(veteranRank);
  const bonuses = rank.statBonuses;
  
  return {
    ...baseStats,
    initiative: (baseStats.initiative || 0) + (bonuses.initiative || 0),
    attackBonus: (baseStats.attackBonus || 0) + (bonuses.attackBonus || 0),
    evasion: (baseStats.evasion || 0) + (bonuses.evasion || 0),
    critRange: bonuses.critRange || 20,
    maxHull: Math.round(baseStats.maxHull * (bonuses.maxHP || 1.0)),
    maxShields: Math.round(baseStats.maxShields * (bonuses.maxShields || 1.0)),
    shieldRegenPerRound: bonuses.shieldRegenPerRound || 0,
    damageBonus: bonuses.damageBonus || 1.0,
    extraReactions: bonuses.extraReaction || 0,
    extraBonusActions: bonuses.extraBonusAction || 0
  };
}

/**
 * Get AI quality for veteran rank
 * @param {string} veteranRank - Veteran rank key
 * @returns {object} AI quality settings
 */
export function getAIQuality(veteranRank) {
  const rank = getVeteranRank(veteranRank);
  return rank.aiQuality;
}

/**
 * Check if AI should make a mistake
 * @param {string} veteranRank - Veteran rank key
 * @returns {boolean}
 */
export function shouldMakeMistake(veteranRank) {
  const quality = getAIQuality(veteranRank);
  return Math.random() < quality.mistakeChance;
}

/**
 * Check if AI should waste an action
 * @param {string} veteranRank - Veteran rank key
 * @returns {boolean}
 */
export function shouldWasteAction(veteranRank) {
  const quality = getAIQuality(veteranRank);
  return Math.random() < (quality.wasteActionChance || 0);
}

/**
 * Get target priority strategy for veteran rank
 * @param {string} veteranRank - Veteran rank key
 * @returns {string} Priority strategy
 */
export function getTargetPriority(veteranRank) {
  const quality = getAIQuality(veteranRank);
  return quality.targetPriority;
}

/**
 * Get random veteran rank (for spawning enemies)
 * @param {object} weights - Optional weight distribution
 * @returns {string} Veteran rank key
 */
export function getRandomVeteranRank(weights = {}) {
  const defaultWeights = {
    ROOKIE: 0.30,    // 30%
    TRAINED: 0.40,   // 40%
    VETERAN: 0.20,   // 20%
    ELITE: 0.08,     // 8%
    ACE: 0.02        // 2%
  };
  
  const finalWeights = { ...defaultWeights, ...weights };
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [rank, weight] of Object.entries(finalWeights)) {
    cumulative += weight;
    if (roll <= cumulative) {
      return rank;
    }
  }
  
  return 'TRAINED'; // Fallback
}

/**
 * Get veteran rank for encounter difficulty
 * @param {string} difficulty - 'easy', 'medium', 'hard', 'deadly'
 * @returns {string} Appropriate veteran rank
 */
export function getVeteranRankForDifficulty(difficulty) {
  switch (difficulty) {
    case 'easy':
      return Math.random() < 0.7 ? 'ROOKIE' : 'TRAINED';
    case 'medium':
      return Math.random() < 0.6 ? 'TRAINED' : 'VETERAN';
    case 'hard':
      return Math.random() < 0.5 ? 'VETERAN' : 'ELITE';
    case 'deadly':
      return Math.random() < 0.6 ? 'ELITE' : 'ACE';
    default:
      return 'TRAINED';
  }
}

/**
 * Calculate effective combat rating with veteran bonuses
 * @param {object} baseStats - Base ship stats
 * @param {string} veteranRank - Veteran rank key
 * @returns {number} Combat rating
 */
export function calculateCombatRating(baseStats, veteranRank) {
  const rank = getVeteranRank(veteranRank);
  const bonuses = rank.statBonuses;
  
  // Simplified combat rating formula
  const hp = baseStats.maxHull * (bonuses.maxHP || 1.0);
  const shields = baseStats.maxShields * (bonuses.maxShields || 1.0);
  const offense = (baseStats.attackBonus || 0) + (bonuses.attackBonus || 0);
  const defense = (baseStats.evasion || 0) + (bonuses.evasion || 0);
  
  return Math.round(
    (hp + shields) * 0.5 +  // Survivability
    offense * 10 +          // Offense
    defense * 8             // Defense
  );
}

/**
 * Get veteran rank badge/icon info for UI
 * @param {string} veteranRank - Veteran rank key
 * @returns {object} UI-friendly rank info
 */
export function getVeteranRankInfo(veteranRank) {
  const rank = getVeteranRank(veteranRank);
  return {
    name: rank.displayName,
    description: rank.description,
    color: rank.color,
    rank: rank.rank,
    statBonuses: rank.statBonuses,
    isElite: rank.rank >= 3  // Elite or Ace
  };
}

/**
 * Get difficulty tier for encounter balancing
 * @param {Array<string>} veteranRanks - Array of veteran ranks in encounter
 * @returns {string} Overall difficulty tier
 */
export function getEncounterDifficulty(veteranRanks) {
  const avgRank = veteranRanks.reduce((sum, rank) => {
    return sum + getVeteranRank(rank).rank;
  }, 0) / veteranRanks.length;
  
  if (avgRank < 1.0) return 'easy';
  if (avgRank < 2.0) return 'medium';
  if (avgRank < 3.0) return 'hard';
  return 'deadly';
}
