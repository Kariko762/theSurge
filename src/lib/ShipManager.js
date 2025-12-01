/**
 * Ship Manager
 * 
 * Manages ship combat attributes, component modifiers, and stat calculations.
 * All ships have BASE stats determined by their hull/class, then MODIFIED by components.
 */

import { COMPONENTS, COMPONENT_TYPES } from './shipComponents.js';
import { getWeaponRangeModifier, getDistanceBandKey } from './combat/distanceBands.js';

// ============================================================================
// SHIP HULL CLASSES - Base Stats
// ============================================================================

export const SHIP_CLASSES = {
  SURVEY_FRIGATE: {
    id: 'SURVEY_FRIGATE',
    name: 'Survey Frigate',
    hull: 'Ronin-class Light Frame',
    
    // CORE ATTRIBUTES (base values before components)
    baseStats: {
      // HP / SURVIVABILITY
      maxHull: 100,
      maxShields: 50,           // Base shields (before shield generators)
      armor: 10,                // Base armor % damage reduction
      
      // DEFENSE / EVASION
      signatureRadius: 18,      // SR (defense). Lower SR = harder to hit
      baseEvasion: 12,          // Base evasion rating (10 + size modifier)
      
      // OFFENSE
      baseAttackBonus: 0,       // No inherent attack bonus
      weaponSlots: 2,
      
      // MOBILITY
      baseSpeed: 80,            // Grid spaces per turn
      maxAcceleration: 15,      // Speed change per action
      turnRate: 60,             // Degrees per turn
      
      // ACTION ECONOMY
      actionsPerTurn: 2,        // Standard action economy
      bonusActionsPerTurn: 1,
      reactionsPerRound: 1,
      
      // INITIATIVE
      baseInitiative: 2,        // Small frigate = decent reaction time
      
      // CARGO & UTILITY
      cargoCapacity: 40,
      powerCapacity: 150,
      
      // COMPONENT SLOTS
      slots: {
        weapon: 2,
        thruster: 1,
        sensor: 2,
        shield: 1,
        power: 1,
        navigation: 1,
        internal: 4,
        hull: 1,
      }
    }
  },
  
  HEAVY_CRUISER: {
    id: 'HEAVY_CRUISER',
    name: 'Heavy Cruiser',
    hull: 'Titan-class Heavy Frame',
    
    baseStats: {
      maxHull: 250,
      maxShields: 100,
      armor: 25,
      
      signatureRadius: 24,      // Large ship = easier to hit (higher SR)
      baseEvasion: 10,          // Slower, less maneuverable
      
      baseAttackBonus: 2,       // Better targeting systems
      weaponSlots: 4,
      
      baseSpeed: 50,
      maxAcceleration: 10,
      turnRate: 30,
      
      actionsPerTurn: 2,
      bonusActionsPerTurn: 1,
      reactionsPerRound: 1,
      
      baseInitiative: 0,        // Heavy = slower reactions
      
      cargoCapacity: 100,
      powerCapacity: 300,
      
      slots: {
        weapon: 4,
        thruster: 2,
        sensor: 2,
        shield: 2,
        power: 1,
        navigation: 1,
        internal: 6,
        hull: 1,
      }
    }
  },
  
  INTERCEPTOR: {
    id: 'INTERCEPTOR',
    name: 'Interceptor',
    hull: 'Viper-class Strike Frame',
    
    baseStats: {
      maxHull: 60,
      maxShields: 30,
      armor: 5,
      
      signatureRadius: 12,      // Small, harder to hit (lower SR)
      baseEvasion: 16,          // Very agile
      
      baseAttackBonus: 1,
      weaponSlots: 1,
      
      baseSpeed: 120,
      maxAcceleration: 25,
      turnRate: 90,
      
      actionsPerTurn: 2,
      bonusActionsPerTurn: 1,
      reactionsPerRound: 2,     // Extra reaction (nimble)
      
      baseInitiative: 5,        // Fast reactions
      
      cargoCapacity: 15,
      powerCapacity: 100,
      
      slots: {
        weapon: 1,
        thruster: 1,
        sensor: 1,
        shield: 1,
        power: 1,
        navigation: 1,
        internal: 2,
        hull: 1,
      }
    }
  }
};

// ============================================================================
// SHIP MANAGER CLASS
// ============================================================================

export class ShipManager {
  constructor(shipClass = 'SURVEY_FRIGATE', installedComponents = []) {
    this.shipClass = SHIP_CLASSES[shipClass];
    this.installedComponents = installedComponents;
    this.powerAllocation = {};
    
    // Initialize power allocation for all components
    installedComponents.forEach(compId => {
      this.powerAllocation[compId] = 100; // Default 100% power
    });
  }

  // ========================================================================
  // COMPONENT MANAGEMENT
  // ========================================================================

  installComponent(componentId) {
    if (!this.installedComponents.includes(componentId)) {
      this.installedComponents.push(componentId);
      this.powerAllocation[componentId] = 100;
      return true;
    }
    return false;
  }

  uninstallComponent(componentId) {
    this.installedComponents = this.installedComponents.filter(id => id !== componentId);
    delete this.powerAllocation[componentId];
  }

  setPowerAllocation(componentId, percent) {
    if (this.installedComponents.includes(componentId)) {
      this.powerAllocation[componentId] = Math.max(0, Math.min(200, percent));
    }
  }

  // ========================================================================
  // STAT CALCULATION - Aggregate Base + Component Modifiers
  // ========================================================================

  calculateCombatStats() {
    const base = this.shipClass.baseStats;
    
    // Start with base stats
    const stats = {
      // HP / SURVIVABILITY
      maxHull: base.maxHull,
      maxShields: base.maxShields,
      armor: base.armor,
      
      // DEFENSE (lower SR = harder to hit, like lower AC in D&D is worse)
      signatureRadius: base.signatureRadius,
      evasion: base.baseEvasion,
      
      // OFFENSE
      attackBonus: base.baseAttackBonus,
      critRange: 20,              // Natural 20 only by default
      critMultiplier: 2,
      
      // MOBILITY
      speed: base.baseSpeed,
      acceleration: base.maxAcceleration,
      turnRate: base.turnRate,
      
      // ACTION ECONOMY
      actionsPerTurn: base.actionsPerTurn,
      bonusActionsPerTurn: base.bonusActionsPerTurn,
      reactionsPerRound: base.reactionsPerRound,
      
      // INITIATIVE
      initiative: base.baseInitiative,
      
      // SENSORS & UTILITY
      sensorRange: 0,
      scanBonus: 0,
      
      // POWER
      powerGeneration: 0,
      powerConsumption: 0,
      
      // WEAPONS (populated separately)
      weapons: [],
      
      // MODIFIERS (from special components)
      modifiers: {
        repairBonus: 0,
        navigationBonus: 0,
        jamResist: 0,
        ecmStrength: 0,
      }
    };

    // Aggregate component bonuses
    this.installedComponents.forEach(compId => {
      const comp = COMPONENTS[compId];
      if (!comp) return;

      const powerPercent = this.powerAllocation[compId] || 100;
      const efficiency = powerPercent / 100;

      // POWER CONSUMPTION
      stats.powerConsumption += comp.powerReq * efficiency;

      // POWER GENERATION
      if (comp.attributes.baseOutput) {
        stats.powerGeneration = Math.max(stats.powerGeneration, comp.attributes.baseOutput * efficiency);
      }

      // SHIELDS
      if (comp.attributes.maxShields) {
        stats.maxShields += comp.attributes.maxShields * efficiency;
      }

      // SENSORS
      if (comp.attributes.sensorRange) {
        stats.sensorRange = Math.max(stats.sensorRange, comp.attributes.sensorRange * efficiency);
      }

      // INITIATIVE (from advanced sensors, nav computers)
      if (comp.attributes.initiativeBonus) {
        stats.initiative += comp.attributes.initiativeBonus * efficiency;
      }

      // SIGNATURE RADIUS (ECM reduces SR = harder to hit)
      if (comp.attributes.signatureReduction) {
        stats.signatureRadius -= comp.attributes.signatureReduction * efficiency;
      }

      // EVASION (engines, combat computers)
      if (comp.attributes.evasionBonus) {
        stats.evasion += comp.attributes.evasionBonus * efficiency;
      }

      // ATTACK BONUS (combat computers, targeting systems)
      if (comp.attributes.attackBonus) {
        stats.attackBonus += comp.attributes.attackBonus * efficiency;
      }

      // SPEED (engine thrust)
      if (comp.attributes.thrust) {
        stats.speed += comp.attributes.thrust * efficiency;
      }

      // SCAN BONUS
      if (comp.attributes.scanBonus) {
        stats.scanBonus += comp.attributes.scanBonus * efficiency;
      }

      // REPAIR BONUS
      if (comp.attributes.repairBonus) {
        stats.modifiers.repairBonus += comp.attributes.repairBonus * efficiency;
      }

      // NAVIGATION BONUS
      if (comp.attributes.navigationBonus) {
        stats.modifiers.navigationBonus += comp.attributes.navigationBonus * efficiency;
      }

      // WEAPONS (separate tracking - include rangeModifiers)
      if (comp.type === 'weapon' && comp.attributes.damage) {
        stats.weapons.push({
          id: compId,
          name: comp.name,
          damage: comp.attributes.damage,
          damageType: comp.attributes.damageType,
          rangeClose: comp.attributes.rangeClose,
          rangeLong: comp.attributes.rangeLong,
          rangeModifiers: comp.attributes.rangeModifiers || {}, // Distance band modifiers
          attackBonus: comp.attributes.attackBonus || 0,
          rateOfFire: comp.attributes.rateOfFire || 1,
          critRange: comp.attributes.critRange || 20,
          powerAllocated: powerPercent,
        });
      }
    });

    // FINAL CALCULATIONS
    stats.signatureRadius = Math.max(10, Math.round(stats.signatureRadius)); // Min SR 10
    stats.evasion = Math.round(stats.evasion);
    stats.initiative = Math.round(stats.initiative);
    stats.attackBonus = Math.round(stats.attackBonus);
    stats.maxShields = Math.round(stats.maxShields);
    stats.sensorRange = Math.round(stats.sensorRange);
    stats.powerBalance = Math.round(stats.powerGeneration - stats.powerConsumption);

    return stats;
  }

  // ========================================================================
  // COMBAT ROLLS
  // ========================================================================

  /**
   * Roll initiative for combat
   * Initiative = d20 + initiative modifier
   */
  rollInitiative() {
    const stats = this.calculateCombatStats();
    const roll = Math.floor(Math.random() * 20) + 1; // 1d20
    return roll + stats.initiative;
  }

  /**
   * Roll attack against target SR (Signature Radius = their AC)
   * Now uses distance band system for range modifiers and SR-based TN
   * Attack Roll = d20 + attackBonus + weaponBonus + rangeModifier
   * Hit if total >= TN, where TN = BASE_TN + (SR_BASE - targetSR)
   * 
   * @param {number} targetSR - Target's Signature Radius (their AC)
   * @param {object} weapon - Weapon object from stats.weapons
   * @param {number|string} distanceOrBand - Distance in km OR band key (CLOSE, MEDIUM, etc.)
   * @returns {object} - { hit: boolean, roll: number, crit: boolean, total: number }
   */
  rollAttack(targetSR, weapon, distanceOrBand = 150) {
    const BASE_TN = 15; // baseline difficulty
    const SR_BASE = 18; // reference SR where TN == BASE_TN
    const stats = this.calculateCombatStats();
    const roll = Math.floor(Math.random() * 20) + 1; // 1d20
    
    // Track all modifiers for detailed logging
    const modifiers = [];
    
    // Natural 1 = auto miss, Natural 20 = auto hit + crit
    if (roll === 1) {
      return { hit: false, roll, crit: false, total: roll, result: 'CRITICAL_MISS', modifiers: [] };
    }
    if (roll === 20) {
      return { hit: true, roll, crit: true, total: roll, result: 'CRITICAL_HIT', modifiers: [] };
    }

    // Calculate total attack bonus
    let totalBonus = 0;
    
    // Ship attack bonus (from sensors, etc.)
    if (stats.attackBonus !== 0) {
      totalBonus += stats.attackBonus;
      modifiers.push({ source: 'Ship Sensors', value: stats.attackBonus });
    }
    
    // Weapon attack bonus
    if (weapon.attackBonus) {
      totalBonus += weapon.attackBonus;
      modifiers.push({ source: weapon.name, value: weapon.attackBonus });
    }

    // Status effect bonuses (TARGET_LOCK, etc.)
    if (options.combatState && options.actorId) {
      const effects = options.combatState.getStatusEffects(options.actorId) || [];
      for (const effect of effects) {
        if (effect.type === 'TARGET_LOCK' && effect.attackBonus) {
          // Only apply if attacking the locked target
          if (!options.targetId || effect.lockedTarget === options.targetId) {
            totalBonus += effect.attackBonus;
            modifiers.push({ source: 'Target Lock', value: effect.attackBonus });
          }
        }
      }
    }

    // Get range modifier from distance band system
    const rangeModifier = getWeaponRangeModifier(weapon, distanceOrBand);
    
    // null means weapon cannot fire at this range
    if (rangeModifier === null) {
      const bandKey = typeof distanceOrBand === 'string' 
        ? distanceOrBand 
        : getDistanceBandKey(distanceOrBand);
      
      return { 
        hit: false, 
        roll, 
        crit: false, 
        total: 0, 
        rangeModifier: null,
        distanceBand: bandKey,
        result: 'OUT_OF_RANGE',
        modifiers: []
      };
    }

    // Add range modifier
    if (rangeModifier !== 0) {
      totalBonus += rangeModifier;
      const bandKey = typeof distanceOrBand === 'string' 
        ? distanceOrBand 
        : getDistanceBandKey(distanceOrBand);
      modifiers.push({ source: `Range (${bandKey})`, value: rangeModifier });
    }

    const total = roll + totalBonus;
    const targetTN = BASE_TN + (SR_BASE - targetSR);

    // Check for critical hit (if weapon has extended crit range)
    const isCrit = roll >= (weapon.critRange || 20);

    const bandKey = typeof distanceOrBand === 'string' 
      ? distanceOrBand 
      : getDistanceBandKey(distanceOrBand);

    return {
      hit: total >= targetTN,
      roll,
      crit: isCrit && total >= targetTN,
      total,
      targetTN,
      rangeModifier,
      distanceBand: bandKey,
      result: total >= targetTN ? (isCrit ? 'CRITICAL_HIT' : 'HIT') : 'MISS',
      modifiers
    };
  }

  /**
   * Roll damage for weapon
   * Damage = weapon dice + modifiers
   * @param {object} weapon - Weapon from stats.weapons
   * @param {boolean} isCrit - Is this a critical hit?
   * @returns {object} - { damage: number, damageType: string, rolls: [] }
   */
  rollDamage(weapon, isCrit = false) {
    // Parse damage dice (e.g., "3d8+2")
    const damageStr = weapon.damage;
    const match = damageStr.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    
    if (!match) {
      return { damage: 0, damageType: weapon.damageType, rolls: [] };
    }

    let numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = parseInt(match[3] || 0);

    // Critical hits double dice
    if (isCrit) {
      numDice *= 2;
    }

    // Roll dice
    const rolls = [];
    let total = 0;
    for (let i = 0; i < numDice; i++) {
      const roll = Math.floor(Math.random() * dieSize) + 1;
      rolls.push(roll);
      total += roll;
    }

    total += modifier;

    return {
      damage: total,
      damageType: weapon.damageType,
      rolls,
      modifier,
      isCrit
    };
  }

  /**
   * Calculate effective SR (Signature Radius) accounting for cover/conditions
   * @param {string} cover - 'NONE', 'PARTIAL', 'HEAVY', 'TOTAL'
   * @param {array} statusEffects - Active status effects
   * @returns {number} - Effective SR
   */
  getEffectiveSR(cover = 'NONE', statusEffects = []) {
    const stats = this.calculateCombatStats();
    let effectiveSR = stats.signatureRadius;

    // Cover bonuses (reduce SR = harder to hit, like +AC in D&D)
    const coverBonus = {
      'NONE': 0,
      'PARTIAL': -5,      // Like half cover (+2 AC)
      'HEAVY': -10,       // Like 3/4 cover (+5 AC)
      'TOTAL': -999,      // Cannot be targeted
    };
    effectiveSR += coverBonus[cover] || 0;

    // Status effects
    statusEffects.forEach(effect => {
      if (effect.type === 'SENSOR_JAMMED') {
        effectiveSR += 5; // Easier to hit (worse SR)
      }
      if (effect.type === 'ECM_ACTIVE') {
        effectiveSR -= 5; // Harder to hit (better SR)
      }
      if (effect.type === 'DISABLED_ENGINES') {
        effectiveSR += 10; // Much easier to hit
      }
    });

    return Math.max(5, effectiveSR); // Minimum SR 5
  }

  // ========================================================================
  // UTILITY
  // ========================================================================

  getShipClass() {
    return this.shipClass;
  }

  getInstalledComponents() {
    return [...this.installedComponents];
  }

  exportState() {
    return {
      shipClassId: this.shipClass.id,
      installedComponents: [...this.installedComponents],
      powerAllocation: { ...this.powerAllocation }
    };
  }

  importState(state) {
    this.shipClass = SHIP_CLASSES[state.shipClassId];
    this.installedComponents = [...state.installedComponents];
    this.powerAllocation = { ...state.powerAllocation };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let shipManagerInstance = null;

export function getShipManager() {
  if (!shipManagerInstance) {
    shipManagerInstance = new ShipManager('SURVEY_FRIGATE', [
      'NAV_ADVANCED',
      'ENGINE_ION',
      'SHIELD_MK2',
      'POWER_RFE',
      'SENSORS_LONG',
      'AI_ARIA',
      'AI_FORGE'
    ]);
  }
  return shipManagerInstance;
}

export function resetShipManager(shipClass, components) {
  shipManagerInstance = new ShipManager(shipClass, components);
  return shipManagerInstance;
}
