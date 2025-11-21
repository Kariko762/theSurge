/**
 * Dice Resolution Engine - Weighted Outcome Tables
 * Defines outcome tables for different action types
 */

import { weighted } from '../rng.js';

// ============================================================================
// DIFFICULTY TARGET SCORES
// ============================================================================

export const DIFFICULTY_TDS = {
  trivial: 5,
  easy: 3,      // Lowered from 10 - asteroid scanning should be very reliable
  normal: 15,
  hard: 18,
  deadly: 22,
  impossible: 25
};

// ============================================================================
// MINING TABLES
// ============================================================================

export const MINING_YIELD_QUALITY = [
  { value: 'poor', weight: 20, multiplier: 0.5, label: 'Poor Quality' },
  { value: 'standard', weight: 50, multiplier: 1.0, label: 'Standard Quality' },
  { value: 'good', weight: 20, multiplier: 1.5, label: 'Good Quality' },
  { value: 'excellent', weight: 8, multiplier: 2.0, label: 'Excellent Quality' },
  { value: 'pristine', weight: 2, multiplier: 3.0, label: 'Pristine Quality' }
];

export const MINING_HAZARDS = [
  { value: 'none', weight: 40, damage: 0, label: 'No Hazard' },
  { value: 'minor', weight: 30, damage: 5, label: 'Minor Debris' },
  { value: 'moderate', weight: 20, damage: 15, label: 'Moderate Impact' },
  { value: 'severe', weight: 8, damage: 30, label: 'Severe Collision' },
  { value: 'critical', weight: 2, damage: 50, label: 'Critical Structural Failure' }
];

export const MINING_LOOT_TYPES = [
  { value: 'scrapMetal', weight: 40, label: 'Scrap Metal' },
  { value: 'titaniumAlloy', weight: 30, label: 'Titanium Alloy' },
  { value: 'rareOre', weight: 20, label: 'Rare Ore' },
  { value: 'crystalMatrix', weight: 8, label: 'Crystal Matrix' },
  { value: 'exoticMaterial', weight: 2, label: 'Exotic Material' }
];

// ============================================================================
// SCAVENGING TABLES
// ============================================================================

export const SCAVENGING_LOOT_QUALITY = [
  { value: 'junk', weight: 30, multiplier: 0.3, label: 'Junk' },
  { value: 'salvage', weight: 40, multiplier: 1.0, label: 'Salvageable' },
  { value: 'functional', weight: 20, multiplier: 1.5, label: 'Functional' },
  { value: 'pristine', weight: 8, multiplier: 2.5, label: 'Pristine' },
  { value: 'rare', weight: 2, multiplier: 4.0, label: 'Rare Component' }
];

export const SCAVENGING_TRAPS = [
  { value: 'none', weight: 60, damage: 0, label: 'Safe' },
  { value: 'alarm', weight: 20, damage: 0, detection: 30, label: 'Alarm Triggered' },
  { value: 'minor', weight: 12, damage: 10, label: 'Minor Trap' },
  { value: 'major', weight: 6, damage: 25, label: 'Major Trap' },
  { value: 'lethal', weight: 2, damage: 50, aiInjury: true, label: 'Lethal Trap' }
];

export const SCAVENGING_LOOT_TYPES = [
  { value: 'fuelCell', weight: 30, label: 'Fuel Cell' },
  { value: 'components', weight: 35, label: 'Ship Components' },
  { value: 'dataCore', weight: 15, label: 'Data Core' },
  { value: 'aiFragment', weight: 10, label: 'AI Core Fragment' },
  { value: 'researchData', weight: 8, label: 'Research Data' },
  { value: 'artifacts', weight: 2, label: 'Precursor Artifact' }
];

// ============================================================================
// DERELICT INVESTIGATION TABLES
// ============================================================================

export const DERELICT_DISCOVERIES = [
  { value: 'nothing', weight: 30, label: 'Nothing of Value' },
  { value: 'logs', weight: 25, label: 'Ship Logs' },
  { value: 'supplies', weight: 20, label: 'Supplies Cache' },
  { value: 'technology', weight: 15, label: 'Advanced Technology' },
  { value: 'survivors', weight: 7, label: 'Survivors' },
  { value: 'artifact', weight: 3, label: 'Alien Artifact' }
];

export const DERELICT_STRUCTURE = [
  { value: 'stable', weight: 40, damage: 0, label: 'Structurally Sound' },
  { value: 'minor', weight: 30, damage: 10, label: 'Minor Instability' },
  { value: 'moderate', weight: 20, damage: 20, label: 'Moderate Decay' },
  { value: 'severe', weight: 8, damage: 40, label: 'Severe Structural Damage' },
  { value: 'collapse', weight: 2, damage: 80, abort: true, label: 'Catastrophic Collapse' }
];

export const DERELICT_AMBUSH = [
  { value: 'safe', weight: 70, label: 'No Hostiles' },
  { value: 'pirates', weight: 15, combat: true, difficulty: 'normal', label: 'Pirates' },
  { value: 'drones', weight: 10, combat: true, difficulty: 'hard', label: 'Defense Drones' },
  { value: 'aliens', weight: 5, combat: true, difficulty: 'deadly', label: 'Alien Hostiles' }
];

// ============================================================================
// AWAY TEAM MISSION TABLES
// ============================================================================

export const AWAY_TEAM_OUTCOMES = [
  { value: 'critFail', weight: 5, multiplier: 0, aiInjury: true, label: 'Critical Failure' },
  { value: 'fail', weight: 20, multiplier: 0.3, label: 'Mission Failed' },
  { value: 'partial', weight: 35, multiplier: 0.7, label: 'Partial Success' },
  { value: 'success', weight: 30, multiplier: 1.0, label: 'Success' },
  { value: 'critSuccess', weight: 10, multiplier: 2.0, bonus: true, label: 'Critical Success' }
];

export const AWAY_TEAM_HAZARDS = [
  { value: 'safe', weight: 30, damage: 0, label: 'Safe Environment' },
  { value: 'radiation', weight: 25, damage: 10, statusEffect: 'radiation', label: 'Radiation Exposure' },
  { value: 'hostile', weight: 20, damage: 15, label: 'Hostile Wildlife' },
  { value: 'extreme', weight: 15, damage: 25, statusEffect: 'injured', label: 'Extreme Conditions' },
  { value: 'critical', weight: 10, damage: 50, aiInjury: true, label: 'Critical Hazard' }
];

export const AWAY_TEAM_DISCOVERIES = [
  { value: 'nothing', weight: 35, label: 'Nothing Found' },
  { value: 'resources', weight: 30, label: 'Natural Resources' },
  { value: 'ruins', weight: 20, label: 'Ancient Ruins' },
  { value: 'technology', weight: 10, label: 'Lost Technology' },
  { value: 'lifeform', weight: 5, label: 'Unknown Lifeform' }
];

// ============================================================================
// COMBAT TABLES
// ============================================================================

export const COMBAT_DAMAGE_TABLES = {
  laser: {
    tier1: { dice: '1d8', modifier: 0 },
    tier2: { dice: '2d8', modifier: 2 },
    tier3: { dice: '3d8', modifier: 4 }
  },
  missile: {
    tier1: { dice: '1d10+2', modifier: 0 },
    tier2: { dice: '2d10+4', modifier: 2 },
    tier3: { dice: '3d10+6', modifier: 4 }
  },
  railgun: {
    tier1: { dice: '1d12', modifier: 0 },
    tier2: { dice: '2d12', modifier: 3 },
    tier3: { dice: '3d12+10', modifier: 5 }
  },
  plasma: {
    tier1: { dice: '2d6', modifier: 1 },
    tier2: { dice: '3d8+2', modifier: 3 },
    tier3: { dice: '4d10+5', modifier: 5 }
  }
};

export const COMBAT_STATUS_EFFECTS = [
  { roll: 1, value: 'weaponJammed', severity: 'critical', duration: 3, label: 'Weapon Jammed' },
  { roll: 2, value: 'shieldOverload', severity: 'major', duration: 2, label: 'Shield Overload' },
  { roll: 3, value: 'minorMalfunction', severity: 'minor', duration: 1, label: 'Minor Malfunction' },
  { roll: 4, value: 'none', severity: null, duration: 0, label: 'No Effect' },
  { roll: 5, value: 'none', severity: null, duration: 0, label: 'No Effect' },
  { roll: 6, value: 'criticalHit', severity: 'bonus', multiplier: 2, label: 'Critical Hit!' }
];

export const COMBAT_ENEMY_TYPES = {
  pirate: {
    hull: 50,
    evasion: 12,
    weapons: [{ type: 'laser', tier: 1 }],
    difficulty: 'normal'
  },
  drone: {
    hull: 30,
    evasion: 16,
    weapons: [{ type: 'laser', tier: 2 }],
    difficulty: 'hard'
  },
  warship: {
    hull: 100,
    evasion: 10,
    weapons: [{ type: 'railgun', tier: 2 }, { type: 'missile', tier: 1 }],
    difficulty: 'deadly'
  },
  alien: {
    hull: 80,
    evasion: 14,
    weapons: [{ type: 'plasma', tier: 3 }],
    difficulty: 'deadly'
  }
};

// ============================================================================
// MISSION COMPLETION TABLES
// ============================================================================

export const MISSION_COMPLETION_TABLES = {
  standard: [
    { result: 'critFail', weight: 5, lootMultiplier: 0, penalty: true },
    { result: 'fail', weight: 15, lootMultiplier: 0.2, penalty: false },
    { result: 'partial', weight: 25, lootMultiplier: 0.6, bonusReward: false },
    { result: 'success', weight: 45, lootMultiplier: 1.0, bonusReward: false },
    { result: 'critSuccess', weight: 10, lootMultiplier: 2.0, bonusReward: true }
  ],
  
  highRisk: [
    { result: 'critFail', weight: 10, lootMultiplier: 0, penalty: true },
    { result: 'fail', weight: 20, lootMultiplier: 0.1, penalty: false },
    { result: 'partial', weight: 30, lootMultiplier: 0.8, bonusReward: false },
    { result: 'success', weight: 30, lootMultiplier: 1.5, bonusReward: true },
    { result: 'critSuccess', weight: 10, lootMultiplier: 3.0, bonusReward: true }
  ],
  
  story: [
    { result: 'partial', weight: 20, lootMultiplier: 0.8, storyUnlock: true },
    { result: 'success', weight: 65, lootMultiplier: 1.0, storyUnlock: true },
    { result: 'critSuccess', weight: 15, lootMultiplier: 1.5, storyUnlock: true }
  ]
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Select an outcome from a weighted table
 * @param {Array} table - Weighted table array
 * @param {function} rng - Seeded RNG
 * @returns {Object} Selected outcome
 */
export function selectFromTable(table, rng) {
  const pairs = table.map(item => [item, item.weight]);
  return weighted(pairs, rng);
}

/**
 * Get status effect from D6 roll
 * @param {number} roll - D6 result (1-6)
 * @returns {Object} Status effect object
 */
export function getStatusEffect(roll) {
  return COMBAT_STATUS_EFFECTS.find(e => e.roll === roll) || COMBAT_STATUS_EFFECTS[3];
}

/**
 * Get combat damage notation for weapon
 * @param {string} weaponType - Weapon type (laser, missile, etc.)
 * @param {number} tier - Weapon tier (1-3)
 * @returns {string} Dice notation
 */
export function getCombatDamage(weaponType, tier) {
  const weapon = COMBAT_DAMAGE_TABLES[weaponType];
  if (!weapon) return '1d6';
  
  const tierKey = `tier${Math.min(tier, 3)}`;
  return weapon[tierKey]?.dice || '1d6';
}

// ============================================================================
// ASTEROID MINING TABLES
// ============================================================================

/**
 * Cluster Type Classification (Type-I to Type-V)
 * Inverted density: Lower types = MORE asteroids but WORSE quality
 *                   Higher types = FEWER asteroids but BETTER quality
 */
export const CLUSTER_TYPE_CLASSIFICATION = [
  { 
    type: 'Type-I', 
    weight: 50, 
    densityRange: [15, 20],
    recoveryDays: 5,
    compositionBonus: 0,
    miningRate: 8,  // seconds per asteroid extraction
    label: 'Type-I Cluster',
    description: 'Common ferrous asteroids, low-grade ore'
  },
  { 
    type: 'Type-II', 
    weight: 30, 
    densityRange: [10, 15],
    recoveryDays: 4,
    compositionBonus: 1,
    miningRate: 10,
    label: 'Type-II Cluster',
    description: 'Mixed composition, moderate yield'
  },
  { 
    type: 'Type-III', 
    weight: 15, 
    densityRange: [6, 10],
    recoveryDays: 3,
    compositionBonus: 2,
    miningRate: 12,
    label: 'Type-III Cluster',
    description: 'Platinum-group concentration, high yield'
  },
  { 
    type: 'Type-IV', 
    weight: 4, 
    densityRange: [3, 6],
    recoveryDays: 2,
    compositionBonus: 4,
    miningRate: 15,
    label: 'Type-IV Cluster',
    description: 'Exotic crystalline structures, very high yield'
  },
  { 
    type: 'Type-V', 
    weight: 1, 
    densityRange: [1, 3],
    recoveryDays: 1,
    compositionBonus: 6,
    miningRate: 18,  // Slowest to mine but best rewards
    label: 'Type-V Cluster',
    description: 'Anomalous composition - possible xenotech',
    darkZoneOnly: true
  }
];

/**
 * Asteroid Composition (rolled per individual asteroid)
 * Better cluster types get composition bonus to shift weights toward higher tiers
 */
export const ASTEROID_COMPOSITION = [
  { 
    composition: 'Ferrous', 
    weight: 45, 
    yieldMultiplier: 1.0,
    lootTable: 'metals',
    label: 'Ferrous Asteroid',
    description: 'Iron-nickel core, standard metals'
  },
  { 
    composition: 'Carbonaceous', 
    weight: 25, 
    yieldMultiplier: 1.3,
    lootTable: 'volatiles',
    label: 'Carbonaceous Asteroid',
    description: 'Carbon-rich, organic compounds'
  },
  { 
    composition: 'Silicate', 
    weight: 15, 
    yieldMultiplier: 1.6,
    lootTable: 'minerals',
    label: 'Silicate Asteroid',
    description: 'Rare earth elements, refined minerals'
  },
  { 
    composition: 'Metallic', 
    weight: 10, 
    yieldMultiplier: 2.0,
    lootTable: 'precious',
    label: 'Metallic Asteroid',
    description: 'Platinum-group metals, high-value ore'
  },
  { 
    composition: 'Crystalline', 
    weight: 4, 
    yieldMultiplier: 3.0,
    lootTable: 'exotic',
    label: 'Crystalline Asteroid',
    description: 'Energy crystals, exotic compounds'
  },
  { 
    composition: 'Xenotech', 
    weight: 1, 
    yieldMultiplier: 5.0,
    lootTable: 'xenotech',
    label: 'Xenotech Asteroid',
    description: 'Precursor materials, unknown alloys',
    requiresBonus: 4
  }
];

/**
 * Loot Tables by Composition Type
 */
export const ASTEROID_LOOT_TABLES = {
  metals: [
    { itemId: 'scrap_metal', item: 'Scrap Metal', weight: 40 },
    { itemId: 'iron_ore', item: 'Iron Ore', weight: 30 },
    { itemId: 'titanium_alloy', item: 'Titanium Alloy', weight: 20 },
    { itemId: 'steel_alloy', item: 'Steel Alloy', weight: 10 }
  ],
  volatiles: [
    { itemId: 'water_ice', item: 'Water Ice', weight: 35 },
    { itemId: 'fuel_cell', item: 'Helium-3 Pellets', weight: 30 },
    { itemId: 'methane', item: 'Methane', weight: 20 },
    { itemId: 'ammonia', item: 'Ammonia', weight: 15 }
  ],
  minerals: [
    { itemId: 'silicon', item: 'Silicon', weight: 35 },
    { itemId: 'rare_ore', item: 'Rare Ore', weight: 30 },
    { itemId: 'carbon_fiber', item: 'Carbon Fiber', weight: 20 },
    { itemId: 'crystal_matrix', item: 'Crystal Matrix', weight: 15 }
  ],
  precious: [
    { itemId: 'platinum', item: 'Platinum', weight: 40 },
    { itemId: 'iridium', item: 'Iridium', weight: 30 },
    { itemId: 'palladium', item: 'Palladium', weight: 20 },
    { itemId: 'rhodium', item: 'Rhodium', weight: 10 }
  ],
  exotic: [
    { itemId: 'quantum_core', item: 'Quantum Core', weight: 35 },
    { itemId: 'dark_matter', item: 'Dark Matter Residue', weight: 30 },
    { itemId: 'nanotech_comp', item: 'Nanotech Components', weight: 20 },
    { itemId: 'exotic_polymer', item: 'Exotic Polymers', weight: 15 }
  ],
  xenotech: [
    { itemId: 'precursor_frag', item: 'Precursor Fragment', weight: 35 },
    { itemId: 'xenotech_alloy', item: 'Xenotech Alloy', weight: 30 },
    { itemId: 'ancient_tech', item: 'Ancient Tech', weight: 20 },
    { itemId: 'gv_coordinate', item: "G'ejar-Vale Coordinate", weight: 10 },
    { itemId: 'ai_core_frag', item: 'AI Core Fragment', weight: 5 }
  ]
};

/**
 * Mining Hazards (rolled during extraction)
 */
export const ASTEROID_MINING_HAZARDS = [
  { value: 'clean', weight: 50, damage: 0, label: 'Clean extraction' },
  { value: 'debris', weight: 25, damage: 5, label: 'Minor debris impact' },
  { value: 'unstable', weight: 15, damage: 15, label: 'Unstable rotation' },
  { value: 'collision', weight: 8, damage: 30, label: 'Collision with fragments' },
  { value: 'explosion', weight: 2, damage: 50, statusEffect: 'Mining Laser Damaged', label: 'Volatile explosion' }
];
