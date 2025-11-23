/**
 * Core Game Mechanics Registry
 * 
 * IMMUTABLE - These are the foundational mechanics of the game.
 * All modifiers, perks, AI effects, and components reference these.
 */

// ============================================================================
// CORE MECHANICS
// ============================================================================

export const CORE_MECHANICS = {
  // COMBAT MECHANICS
  initiative: {
    id: 'initiative',
    name: 'Initiative',
    category: 'combat',
    description: 'Turn order in combat. Higher = act first.',
    baseValue: 0,
    calculation: 'Base + (piloting / 2) + engine_bonus + perks',
    displayFormat: '+{value}',
    affectedBy: ['piloting', 'engines', 'AI_passives', 'perks']
  },

  evasion: {
    id: 'evasion',
    name: 'Evasion (AC)',
    category: 'combat',
    description: 'Armor Class - difficulty for enemies to hit you. 10 = base.',
    baseValue: 10,
    calculation: '10 + (piloting / 3) + shield_bonus + engine_bonus',
    displayFormat: '{value} AC',
    affectedBy: ['piloting', 'shields', 'engines', 'AI_passives', 'perks']
  },

  toHit: {
    id: 'toHit',
    name: 'To Hit Bonus',
    category: 'combat',
    description: 'Attack accuracy. Added to d20 rolls when attacking.',
    baseValue: 0,
    calculation: '(gunnery / 2) + weapon_bonus + targeting_bonus',
    displayFormat: '+{value}',
    affectedBy: ['gunnery', 'weapons', 'sensors', 'AI_passives', 'perks']
  },

  damageBonus: {
    id: 'damageBonus',
    name: 'Damage Bonus',
    category: 'combat',
    description: 'Extra damage added to all weapon attacks.',
    baseValue: 0,
    calculation: 'gunnery_bonus + research + perks',
    displayFormat: '+{value}',
    affectedBy: ['gunnery', 'research', 'AI_passives', 'perks']
  },

  critRange: {
    id: 'critRange',
    name: 'Critical Hit Range',
    category: 'combat',
    description: 'D20 roll needed for critical hit (default 20).',
    baseValue: 20,
    calculation: '20 - (gunnery_tier + perks)',
    displayFormat: '{value}-20',
    affectedBy: ['gunnery', 'perks', 'weapons']
  },

  // DEFENSE MECHANICS
  maxHull: {
    id: 'maxHull',
    name: 'Maximum Hull',
    category: 'defense',
    description: 'Ship hull points. When this reaches 0, ship is destroyed.',
    baseValue: 100,
    calculation: '100 + ship_type_bonus + research + perks',
    displayFormat: '{value} HP',
    affectedBy: ['ship_class', 'research', 'perks']
  },

  maxShields: {
    id: 'maxShields',
    name: 'Maximum Shields',
    category: 'defense',
    description: 'Shield capacity. Absorbs damage before hull takes hits.',
    baseValue: 0,
    calculation: 'shield_generator_capacity + (research * 1.2)',
    displayFormat: '{value} HP',
    affectedBy: ['shield_generator', 'research', 'perks']
  },

  shieldRegen: {
    id: 'shieldRegen',
    name: 'Shield Regeneration',
    category: 'defense',
    description: 'Shields restored per turn.',
    baseValue: 0,
    calculation: 'shield_generator_regen + engineering_bonus',
    displayFormat: '{value}/turn',
    affectedBy: ['shield_generator', 'engineering', 'AI_passives']
  },

  armor: {
    id: 'armor',
    name: 'Armor',
    category: 'defense',
    description: 'Damage reduction from all attacks.',
    baseValue: 0,
    calculation: 'hull_plating + research',
    displayFormat: '-{value} damage',
    affectedBy: ['ship_components', 'research']
  },

  // SKILL MECHANICS
  piloting: {
    id: 'piloting',
    name: 'Piloting',
    category: 'skill',
    description: 'Ship maneuvering, evasion, and positioning. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  gunnery: {
    id: 'gunnery',
    name: 'Gunnery',
    category: 'skill',
    description: 'Weapon accuracy and damage. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  tactics: {
    id: 'tactics',
    name: 'Tactics',
    category: 'skill',
    description: 'Combat strategy and battlefield awareness. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  engineering: {
    id: 'engineering',
    name: 'Engineering',
    category: 'skill',
    description: 'Repairs, system optimization, jury-rigging. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  science: {
    id: 'science',
    name: 'Science',
    category: 'skill',
    description: 'Scanning, analysis, research. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  hacking: {
    id: 'hacking',
    name: 'Hacking',
    category: 'skill',
    description: 'System intrusion, electronic warfare. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  persuasion: {
    id: 'persuasion',
    name: 'Persuasion',
    category: 'skill',
    description: 'Diplomacy, negotiation, charm. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  intimidation: {
    id: 'intimidation',
    name: 'Intimidation',
    category: 'skill',
    description: 'Threats, fear, dominance. Player skill (1-10).',
    baseValue: 1,
    calculation: 'player_skill_level',
    displayFormat: '{value}',
    affectedBy: ['player_background', 'XP', 'training']
  },

  // TECHNICAL MECHANICS
  repairAmount: {
    id: 'repairAmount',
    name: 'Repair Amount',
    category: 'technical',
    description: 'Hull/systems repaired per repair action.',
    baseValue: 10,
    calculation: '10 + (engineering * 2) + AI_bonuses',
    displayFormat: '{value} HP',
    affectedBy: ['engineering', 'AI_passives', 'perks', 'tools']
  },

  scanRange: {
    id: 'scanRange',
    name: 'Scan Range',
    category: 'technical',
    description: 'Maximum distance for sensor scans.',
    baseValue: 100,
    calculation: 'sensor_range + (science * 10)',
    displayFormat: '{value} units',
    affectedBy: ['sensors', 'science', 'AI_passives']
  },

  scanDepth: {
    id: 'scanDepth',
    name: 'Scan Depth',
    category: 'technical',
    description: 'Information revealed by scans (basic/full/deep).',
    baseValue: 'basic',
    calculation: 'science_level >= 5 ? "full" : "basic"',
    displayFormat: '{value}',
    affectedBy: ['science', 'sensors', 'AI_passives']
  },

  hackDC: {
    id: 'hackDC',
    name: 'Hacking DC',
    category: 'technical',
    description: 'Difficulty class for hacking attempts (your offense).',
    baseValue: 10,
    calculation: '10 + (hacking / 2) + ECM_bonus',
    displayFormat: 'DC {value}',
    affectedBy: ['hacking', 'ECM', 'AI_passives']
  },

  // SOCIAL MECHANICS
  tradePriceModifier: {
    id: 'tradePriceModifier',
    name: 'Trade Price Modifier',
    category: 'social',
    description: 'Percentage discount on purchases, premium on sales.',
    baseValue: 1.0,
    calculation: '1.0 - (persuasion * 0.02) - perk_bonuses',
    displayFormat: '{value}%',
    affectedBy: ['persuasion', 'perks', 'faction_rep']
  },

  factionRep: {
    id: 'factionRep',
    name: 'Faction Reputation',
    category: 'social',
    description: 'Standing with various factions. Affects missions/prices.',
    baseValue: 0,
    calculation: 'mission_rewards + trade_interactions + perks',
    displayFormat: '{value}',
    affectedBy: ['missions', 'persuasion', 'perks']
  },

  surrenderDC: {
    id: 'surrenderDC',
    name: 'Surrender DC',
    category: 'social',
    description: 'Difficulty for enemies to resist surrender demands.',
    baseValue: 10,
    calculation: '10 + (intimidation / 2) + reputation',
    displayFormat: 'DC {value}',
    affectedBy: ['intimidation', 'perks', 'ship_size']
  },

  // RESOURCE MECHANICS
  powerGeneration: {
    id: 'powerGeneration',
    name: 'Power Generation',
    category: 'resources',
    description: 'Energy generated per turn for systems/weapons/AI.',
    baseValue: 100,
    calculation: 'reactor_output + (engineering_bonus * 5)',
    displayFormat: '{value}⚡/turn',
    affectedBy: ['reactor', 'engineering', 'AI_passives']
  },

  fuelEfficiency: {
    id: 'fuelEfficiency',
    name: 'Fuel Efficiency',
    category: 'resources',
    description: 'Fuel consumed per FTL jump.',
    baseValue: 10,
    calculation: '10 - (piloting * 0.5) - engine_efficiency',
    displayFormat: '{value} fuel/jump',
    affectedBy: ['piloting', 'engines', 'perks']
  },

  cargoCapacity: {
    id: 'cargoCapacity',
    name: 'Cargo Capacity',
    category: 'resources',
    description: 'Maximum items/resources that can be carried.',
    baseValue: 50,
    calculation: 'ship_base_cargo + cargo_modules',
    displayFormat: '{value} tons',
    affectedBy: ['ship_class', 'cargo_modules']
  },

  lootMultiplier: {
    id: 'lootMultiplier',
    name: 'Loot Multiplier',
    category: 'resources',
    description: 'Multiplier on loot/salvage found.',
    baseValue: 1.0,
    calculation: '1.0 + perk_bonuses',
    displayFormat: 'x{value}',
    affectedBy: ['perks', 'science']
  },

  // SPECIAL MECHANICS
  actionEconomy: {
    id: 'actionEconomy',
    name: 'Action Economy',
    category: 'special',
    description: 'Number of actions per turn (1 = standard, 2 = bonus action).',
    baseValue: 1,
    calculation: 'tactics >= 7 ? 2 : 1',
    displayFormat: '{value} actions',
    affectedBy: ['tactics', 'perks', 'AI_actives']
  },

  advantageOnEvasion: {
    id: 'advantageOnEvasion',
    name: 'Evasion Advantage',
    category: 'special',
    description: 'Roll evasion checks with advantage (roll twice, take better).',
    baseValue: false,
    calculation: 'perks.includes("ACE_PILOT")',
    displayFormat: '{value}',
    affectedBy: ['perks']
  },

  immuneToFear: {
    id: 'immuneToFear',
    name: 'Fear Immunity',
    category: 'special',
    description: 'Cannot be affected by intimidation/fear effects.',
    baseValue: false,
    calculation: 'perks.includes("COMBAT_VETERAN")',
    displayFormat: '{value}',
    affectedBy: ['perks']
  },

  revealEnemyIntent: {
    id: 'revealEnemyIntent',
    name: 'Reveal Enemy Intent',
    category: 'special',
    description: 'See what enemy will do next turn.',
    baseValue: false,
    calculation: 'AI_passives.includes("OPTIMAL_TRAJECTORY")',
    displayFormat: '{value}',
    affectedBy: ['AI_passives', 'tactics']
  }
};

// ============================================================================
// MECHANIC CATEGORIES
// ============================================================================

export const MECHANIC_CATEGORIES = {
  combat: { name: 'Combat', color: '#ff6b6b', icon: '⚔️' },
  defense: { name: 'Defense', color: '#00ff88', icon: '🛡️' },
  skill: { name: 'Player Skills', color: '#00ccff', icon: '📊' },
  technical: { name: 'Technical', color: '#ffaa00', icon: '🔧' },
  social: { name: 'Social', color: '#ff00ff', icon: '💬' },
  resources: { name: 'Resources', color: '#00ffff', icon: '⚡' },
  special: { name: 'Special Effects', color: '#ffffff', icon: '✨' }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all mechanics in a category
 */
export function getMechanicsByCategory(category) {
  return Object.values(CORE_MECHANICS).filter(m => m.category === category);
}

/**
 * Get mechanic options for dropdowns
 */
export function getMechanicOptions() {
  return Object.values(CORE_MECHANICS).map(m => ({
    value: m.id,
    label: `${m.name} (${m.category})`,
    category: m.category
  }));
}

/**
 * Validate an effect object
 */
export function validateEffect(effect) {
  if (!effect.mechanic) return 'Effect must specify a mechanic';
  if (!CORE_MECHANICS[effect.mechanic]) return `Unknown mechanic: ${effect.mechanic}`;
  
  const mechanic = CORE_MECHANICS[effect.mechanic];
  
  // Check modifier type matches mechanic base value
  if (typeof mechanic.baseValue === 'number' && typeof effect.modifier !== 'number') {
    return `${mechanic.name} requires numeric modifier`;
  }
  if (typeof mechanic.baseValue === 'boolean' && typeof effect.modifier !== 'boolean') {
    return `${mechanic.name} requires boolean modifier`;
  }
  
  return null; // Valid
}

/**
 * Build effect object from dropdown selections
 */
export function buildEffect(mechanicId, modifier, condition = null) {
  if (!CORE_MECHANICS[mechanicId]) {
    throw new Error(`Unknown mechanic: ${mechanicId}`);
  }

  const effect = {
    mechanic: mechanicId,
    modifier: modifier
  };

  if (condition) {
    effect.condition = condition;
  }

  return effect;
}

/**
 * Format effect for display
 */
export function formatEffect(effect) {
  const mechanic = CORE_MECHANICS[effect.mechanic];
  if (!mechanic) return JSON.stringify(effect);

  let display = mechanic.name;
  
  if (typeof effect.modifier === 'number') {
    display += effect.modifier >= 0 ? ` +${effect.modifier}` : ` ${effect.modifier}`;
  } else if (typeof effect.modifier === 'boolean') {
    display += effect.modifier ? ' ✓' : ' ✗';
  } else {
    display += `: ${effect.modifier}`;
  }

  if (effect.condition) {
    display += ` (${effect.condition})`;
  }

  return display;
}

export default CORE_MECHANICS;
