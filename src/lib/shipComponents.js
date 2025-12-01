// Ship Component Library
// Defines available modules, AI cores, and their stats/power requirements

export const COMPONENT_TYPES = {
  NAVIGATION: 'navigation',
  ENGINE: 'engine',
  SHIELD: 'shield',
  POWER: 'power',
  SENSORS: 'sensors',
  AI_CORE: 'ai_core',
  WEAPON: 'weapon',
  COMBAT_COMPUTER: 'combat_computer',
  ECM: 'electronic_warfare',
  POINT_DEFENSE: 'point_defense'
};

// Component Library
export const COMPONENTS = {
  // Navigation Modules (ALL SHIPS HAVE ONE - contributes to initiative)
  NAV_BASIC: {
    id: 'NAV_BASIC',
    type: COMPONENT_TYPES.NAVIGATION,
    name: 'Basic Nav Computer',
    powerReq: 5,
    attributes: { 
      navigationBonus: 0,
      initiativeBonus: 1        // All nav computers help initiative
    }
  },
  NAV_ADVANCED: {
    id: 'NAV_ADVANCED',
    type: COMPONENT_TYPES.NAVIGATION,
    name: 'Advanced Nav Computer',
    powerReq: 8,
    attributes: { 
      navigationBonus: 15,
      initiativeBonus: 2        // Better nav = faster course calculation
    }
  },

  // Engines (affect speed and evasion)
  ENGINE_ION: {
    id: 'ENGINE_ION',
    type: COMPONENT_TYPES.ENGINE,
    name: 'Ion Drive',
    powerReq: 15,
    attributes: { 
      thrust: 20,               // Speed bonus
      efficiency: 80,
      evasionBonus: 1           // Better maneuverability
    }
  },
  ENGINE_PLASMA: {
    id: 'ENGINE_PLASMA',
    type: COMPONENT_TYPES.ENGINE,
    name: 'Plasma Drive',
    powerReq: 25,
    attributes: { 
      thrust: 40,               // Much faster
      efficiency: 60,
      evasionBonus: 2           // Better evasion from speed
    }
  },

  // Shield Generators
  SHIELD_MK1: {
    id: 'SHIELD_MK1',
    type: COMPONENT_TYPES.SHIELD,
    name: 'Shield Generator Mk-I',
    powerReq: 10,
    attributes: { maxShields: 50 }
  },
  SHIELD_MK2: {
    id: 'SHIELD_MK2',
    type: COMPONENT_TYPES.SHIELD,
    name: 'Shield Generator Mk-II',
    powerReq: 18,
    attributes: { maxShields: 100 }
  },
  SHIELD_MK3: {
    id: 'SHIELD_MK3',
    type: COMPONENT_TYPES.SHIELD,
    name: 'Shield Generator Mk-III',
    powerReq: 30,
    attributes: { maxShields: 180 }
  },

  // Power Cores
  POWER_FISSION: {
    id: 'POWER_FISSION',
    type: COMPONENT_TYPES.POWER,
    name: 'Fission Reactor',
    powerReq: 0,
    attributes: { maxPower: 100, baseOutput: 100 }
  },
  POWER_FUSION: {
    id: 'POWER_FUSION',
    type: COMPONENT_TYPES.POWER,
    name: 'Fusion Core',
    powerReq: 0,
    attributes: { maxPower: 200, baseOutput: 200 }
  },
  POWER_RFE: {
    id: 'POWER_RFE',
    type: COMPONENT_TYPES.POWER,
    name: 'RFE Collector Array',
    powerReq: 0,
    attributes: { maxPower: 150, baseOutput: 150, rfeBonus: 20 }
  },

  // Sensor Suites
  SENSORS_SHORT: {
    id: 'SENSORS_SHORT',
    type: COMPONENT_TYPES.SENSORS,
    name: 'Short-Range Sensors',
    powerReq: 8,
    attributes: { 
      sensorRange: 100,
      initiativeBonus: 1        // Basic sensors help with initiative
    }
  },
  SENSORS_LONG: {
    id: 'SENSORS_LONG',
    type: COMPONENT_TYPES.SENSORS,
    name: 'Long-Range Sensors',
    powerReq: 15,
    attributes: { 
      sensorRange: 200,
      initiativeBonus: 2        // Better sensors = faster threat detection
    }
  },
  SENSORS_DEEP: {
    id: 'SENSORS_DEEP',
    type: COMPONENT_TYPES.SENSORS,
    name: 'Deep-Space Array',
    powerReq: 25,
    attributes: { 
      sensorRange: 300,
      initiativeBonus: 3,       // Advanced sensors = best initiative
      attackBonus: 1            // Better targeting
    }
  },

  // AI Cores
  AI_ARIA: {
    id: 'AI_ARIA',
    type: COMPONENT_TYPES.AI_CORE,
    name: 'ARIA (Navigation)',
    powerReq: 20,
    attributes: { role: 'Navigation', navigationBonus: 10 },
    integrity: 100
  },
  AI_FORGE: {
    id: 'AI_FORGE',
    type: COMPONENT_TYPES.AI_CORE,
    name: 'FORGE (Engineering)',
    powerReq: 20,
    attributes: { role: 'Engineering', repairBonus: 15 },
    integrity: 100
  },
  AI_CIPHER: {
    id: 'AI_CIPHER',
    type: COMPONENT_TYPES.AI_CORE,
    name: 'CIPHER (Research)',
    powerReq: 25,
    attributes: { role: 'Research', scanBonus: 20 },
    integrity: 87
  },
  AI_GHOST: {
    id: 'AI_GHOST',
    type: COMPONENT_TYPES.AI_CORE,
    name: 'GHOST (Sensors)',
    powerReq: 25,
    attributes: { role: 'Sensors', sensorBonus: 25 },
    integrity: 92
  },

  // ========================================================================
  // WEAPONS
  // ========================================================================
  
  WEAPON_PLASMA_CANNON: {
    id: 'WEAPON_PLASMA_CANNON',
    type: COMPONENT_TYPES.WEAPON,
    name: 'Plasma Cannon',
    powerReq: 15,
    attributes: {
      damage: '3d8',            // 3d8 = 3-24 damage
      damageType: 'energy',
      rangeClose: 100,          // Optimal range
      rangeLong: 300,           // Max range (disadvantage)
      attackBonus: 0,           // No inherent accuracy bonus
      rateOfFire: 1,            // 1 attack per action
      critRange: 20,            // Crit on natural 20
      rangeModifiers: {
        POINT_BLANK: -2,        // Too close, overheats
        CLOSE: 2,               // Optimal
        MEDIUM: 0,              // Good
        LONG: -4,               // Dissipates
        EXTREME: null           // Out of range
      }
    }
  },

  WEAPON_RAILGUN: {
    id: 'WEAPON_RAILGUN',
    type: COMPONENT_TYPES.WEAPON,
    name: 'Railgun',
    powerReq: 20,
    attributes: {
      damage: '4d6',            // 4-24 damage
      damageType: 'kinetic',
      rangeClose: 150,          // Longer optimal range
      rangeLong: 500,
      attackBonus: 2,           // Very accurate
      rateOfFire: 1,
      critRange: 19,            // Crit on 19-20 (precision weapon)
      rangeModifiers: {
        POINT_BLANK: -4,        // Can't aim properly
        CLOSE: 0,               // Decent
        MEDIUM: 2,              // Optimal
        LONG: 2,                // Still good (sniper)
        EXTREME: -2             // Extreme range penalty
      }
    }
  },

  WEAPON_MISSILE_LAUNCHER: {
    id: 'WEAPON_MISSILE_LAUNCHER',
    type: COMPONENT_TYPES.WEAPON,
    name: 'Missile Launcher',
    powerReq: 12,
    attributes: {
      damage: '5d8',            // 5-40 damage (high damage)
      damageType: 'explosive',
      rangeClose: 80,
      rangeLong: 250,
      attackBonus: -2,          // Less accurate (can be intercepted)
      rateOfFire: 1,
      critRange: 20,
      rangeModifiers: {
        POINT_BLANK: null,      // Can't fire, too close
        CLOSE: 0,               // Minimum range
        MEDIUM: 2,              // Optimal
        LONG: 0,                // Still effective
        EXTREME: null           // Out of fuel
      }
    }
  },

  WEAPON_PULSE_LASER: {
    id: 'WEAPON_PULSE_LASER',
    type: COMPONENT_TYPES.WEAPON,
    name: 'Pulse Laser Array',
    powerReq: 18,
    attributes: {
      damage: '2d10',           // 2-20 damage
      damageType: 'energy',
      rangeClose: 120,
      rangeLong: 350,
      attackBonus: 3,           // Extremely accurate (light speed)
      rateOfFire: 2,            // Can fire twice per action!
      critRange: 20,
      rangeModifiers: {
        POINT_BLANK: 1,         // Good at all ranges
        CLOSE: 2,               // Very good
        MEDIUM: 3,              // Optimal (light speed)
        LONG: 1,                // Beam disperses
        EXTREME: -2             // Minimal effectiveness
      }
    }
  },

  // ========================================================================
  // COMBAT COMPUTERS
  // ========================================================================

  COMBAT_COMPUTER_MK1: {
    id: 'COMBAT_COMPUTER_MK1',
    type: COMPONENT_TYPES.COMBAT_COMPUTER,
    name: 'Combat Computer Mk-I',
    powerReq: 10,
    attributes: {
      attackBonus: 1,           // +1 to hit
      initiativeBonus: 1,       // +1 initiative
      evasionBonus: 0,
    }
  },

  COMBAT_COMPUTER_MK2: {
    id: 'COMBAT_COMPUTER_MK2',
    type: COMPONENT_TYPES.COMBAT_COMPUTER,
    name: 'Combat Computer Mk-II',
    powerReq: 15,
    attributes: {
      attackBonus: 2,           // +2 to hit
      initiativeBonus: 2,       // +2 initiative
      evasionBonus: 1,          // +1 evasion
    }
  },

  COMBAT_COMPUTER_MK3: {
    id: 'COMBAT_COMPUTER_MK3',
    type: COMPONENT_TYPES.COMBAT_COMPUTER,
    name: 'Tactical Suite Mk-III',
    powerReq: 22,
    attributes: {
      attackBonus: 3,           // +3 to hit
      initiativeBonus: 3,       // +3 initiative
      evasionBonus: 2,          // +2 evasion
    }
  },

  // ========================================================================
  // ELECTRONIC WARFARE
  // ========================================================================

  ECM_BASIC: {
    id: 'ECM_BASIC',
    type: COMPONENT_TYPES.ECM,
    name: 'ECM Module',
    powerReq: 8,
    attributes: {
      signatureReduction: 3,    // Reduces SR by 3 (harder to hit)
      jamRange: 100,
      jamStrength: 2,           // -2 penalty to attackers
    }
  },

  ECM_ADVANCED: {
    id: 'ECM_ADVANCED',
    type: COMPONENT_TYPES.ECM,
    name: 'Advanced ECM Suite',
    powerReq: 15,
    attributes: {
      signatureReduction: 6,    // Reduces SR by 6
      jamRange: 150,
      jamStrength: 4,           // -4 penalty to attackers
      evasionBonus: 1,          // Also helps evasion
    }
  },

  STEALTH_FIELD: {
    id: 'STEALTH_FIELD',
    type: COMPONENT_TYPES.ECM,
    name: 'Stealth Field Generator',
    powerReq: 25,
    attributes: {
      signatureReduction: 8,    // Major SR reduction within rebalance
      jamRange: 200,
      jamStrength: 5,
      evasionBonus: 2,
      initiativeBonus: 2,       // Harder to detect = initiative bonus
    }
  },

  // ========================================================================
  // POINT DEFENSE
  // ========================================================================

  POINT_DEFENSE_TURRET: {
    id: 'POINT_DEFENSE_TURRET',
    type: COMPONENT_TYPES.POINT_DEFENSE,
    name: 'Point Defense Turret',
    powerReq: 8,
    attributes: {
      interceptChance: 50,      // 50% to intercept missiles
      reactionsPerRound: 1,     // 1 extra reaction
      interceptRange: 50,
    }
  },

  POINT_DEFENSE_ARRAY: {
    id: 'POINT_DEFENSE_ARRAY',
    type: COMPONENT_TYPES.POINT_DEFENSE,
    name: 'Point Defense Array',
    powerReq: 15,
    attributes: {
      interceptChance: 70,      // 70% to intercept
      reactionsPerRound: 2,     // 2 extra reactions
      interceptRange: 80,
    }
  }
};

// Ship loadout helper: calculates derived attributes from installed components
export function calculateShipAttributes(installedComponents, powerAllocation) {
  let maxShields = 0;
  let maxHull = 100; // base hull always 100
  let maxPower = 0;
  let sensorRange = 0;
  let totalPowerReq = 0;

  installedComponents.forEach(compId => {
    const comp = COMPONENTS[compId];
    if (!comp) return;

    // Track power requirement (modified by allocation %)
    const allocPercent = powerAllocation[compId] || 100;
    totalPowerReq += (comp.powerReq * allocPercent) / 100;

    // Accumulate attributes (scaled by allocation)
    if (comp.attributes.maxShields) {
      maxShields += (comp.attributes.maxShields * allocPercent) / 100;
    }
    if (comp.attributes.maxPower !== undefined) {
      maxPower = Math.max(maxPower, comp.attributes.baseOutput || comp.attributes.maxPower);
    }
    if (comp.attributes.sensorRange) {
      sensorRange = Math.max(sensorRange, (comp.attributes.sensorRange * allocPercent) / 100);
    }
  });

  // Static signature based on total power usage %
  const staticSignature = Math.min(100, (totalPowerReq / maxPower) * 100);

  return {
    maxShields: Math.round(maxShields),
    maxHull,
    maxPower: Math.round(maxPower),
    sensorRange: Math.round(sensorRange),
    totalPowerReq: Math.round(totalPowerReq),
    staticSignature: Math.round(staticSignature)
  };
}

// Default ship loadout for SS-ARKOSE (Survey Frigate)
export const DEFAULT_SHIP_LOADOUT = [
  'NAV_ADVANCED',          // Required for all ships (initiative +2)
  'ENGINE_ION',            // Propulsion
  'SHIELD_MK2',            // Defense
  'POWER_RFE',             // Power generation
  'SENSORS_LONG',          // Sensors (initiative +2)
  'WEAPON_PLASMA_CANNON',  // Primary weapon
  'COMBAT_COMPUTER_MK1',   // Combat targeting (+1 attack, +1 initiative)
  'AI_ARIA',               // Navigation AI
  'AI_FORGE'               // Engineering AI
];

export const DEFAULT_POWER_ALLOCATION = {
  NAV_ADVANCED: 100,
  ENGINE_ION: 100,
  SHIELD_MK2: 100,
  POWER_RFE: 100,
  SENSORS_LONG: 100,
  WEAPON_PLASMA_CANNON: 100,
  COMBAT_COMPUTER_MK1: 100,
  AI_ARIA: 100,
  AI_FORGE: 100
};
