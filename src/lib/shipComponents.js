// Ship Component Library
// Defines available modules, AI cores, and their stats/power requirements

export const COMPONENT_TYPES = {
  NAVIGATION: 'navigation',
  ENGINE: 'engine',
  SHIELD: 'shield',
  POWER: 'power',
  SENSORS: 'sensors',
  AI_CORE: 'ai_core'
};

// Component Library
export const COMPONENTS = {
  // Navigation Modules
  NAV_BASIC: {
    id: 'NAV_BASIC',
    type: COMPONENT_TYPES.NAVIGATION,
    name: 'Basic Nav Computer',
    powerReq: 5,
    attributes: { navigationBonus: 0 }
  },
  NAV_ADVANCED: {
    id: 'NAV_ADVANCED',
    type: COMPONENT_TYPES.NAVIGATION,
    name: 'Advanced Nav Computer',
    powerReq: 8,
    attributes: { navigationBonus: 15 }
  },

  // Engines
  ENGINE_ION: {
    id: 'ENGINE_ION',
    type: COMPONENT_TYPES.ENGINE,
    name: 'Ion Drive',
    powerReq: 15,
    attributes: { thrust: 100, efficiency: 80 }
  },
  ENGINE_PLASMA: {
    id: 'ENGINE_PLASMA',
    type: COMPONENT_TYPES.ENGINE,
    name: 'Plasma Drive',
    powerReq: 25,
    attributes: { thrust: 180, efficiency: 60 }
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
    attributes: { sensorRange: 100 }
  },
  SENSORS_LONG: {
    id: 'SENSORS_LONG',
    type: COMPONENT_TYPES.SENSORS,
    name: 'Long-Range Sensors',
    powerReq: 15,
    attributes: { sensorRange: 200 }
  },
  SENSORS_DEEP: {
    id: 'SENSORS_DEEP',
    type: COMPONENT_TYPES.SENSORS,
    name: 'Deep-Space Array',
    powerReq: 25,
    attributes: { sensorRange: 300 }
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
  'NAV_ADVANCED',
  'ENGINE_ION',
  'SHIELD_MK2',
  'POWER_RFE',
  'SENSORS_LONG',
  'AI_ARIA',
  'AI_FORGE'
];

export const DEFAULT_POWER_ALLOCATION = {
  NAV_ADVANCED: 100,
  ENGINE_ION: 100,
  SHIELD_MK2: 100,
  POWER_RFE: 100,
  SENSORS_LONG: 100,
  AI_ARIA: 100,
  AI_FORGE: 100
};
