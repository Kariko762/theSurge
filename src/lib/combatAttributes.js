/**
 * Combat Attributes Calculator
 * 
 * Combines Player Skills + AI Crew + Ship Components + Research
 * to produce final combat-ready attributes.
 */

import { getSkillBonus } from './playerSkills.js';
import { AI_CREW } from './aiCrew.js';

// ============================================================================
// SHIP COMPONENT COMBAT MODIFIERS
// ============================================================================

export const COMBAT_COMPONENTS = {
  // WEAPONS
  PLASMA_CANNON_MK1: {
    id: 'PLASMA_CANNON_MK1',
    name: 'Plasma Cannon Mk-I',
    type: 'weapon',
    damage: '2d8',
    toHitBonus: +2,
    range: 'medium',
    powerCost: 10,
    modifiers: { gunnery: +1 }
  },
  
  PLASMA_CANNON_MK2: {
    id: 'PLASMA_CANNON_MK2',
    name: 'Plasma Cannon Mk-II',
    type: 'weapon',
    damage: '3d8',
    toHitBonus: +3,
    range: 'medium',
    powerCost: 15,
    modifiers: { gunnery: +2 }
  },
  
  MISSILE_LAUNCHER: {
    id: 'MISSILE_LAUNCHER',
    name: 'Missile Launcher',
    type: 'weapon',
    damage: '4d10',
    toHitBonus: +1,
    range: 'long',
    ammo: 6,
    powerCost: 5,
    modifiers: { tactics: +1 }
  },
  
  RAILGUN: {
    id: 'RAILGUN',
    name: 'Railgun',
    type: 'weapon',
    damage: '6d6',
    toHitBonus: +4,
    range: 'long',
    powerCost: 25,
    modifiers: { gunnery: +3 },
    special: 'ignores_half_shields'
  },

  // DEFENSIVE SYSTEMS
  SHIELD_GENERATOR_MK1: {
    id: 'SHIELD_GENERATOR_MK1',
    name: 'Shield Generator Mk-I',
    type: 'defense',
    maxShields: 50,
    regenRate: 5,
    powerCost: 10,
    modifiers: { evasion: +1 }
  },
  
  SHIELD_GENERATOR_MK2: {
    id: 'SHIELD_GENERATOR_MK2',
    name: 'Shield Generator Mk-II',
    type: 'defense',
    maxShields: 100,
    regenRate: 10,
    powerCost: 18,
    modifiers: { evasion: +2 }
  },
  
  SHIELD_GENERATOR_MK3: {
    id: 'SHIELD_GENERATOR_MK3',
    name: 'Shield Generator Mk-III',
    type: 'defense',
    maxShields: 180,
    regenRate: 15,
    powerCost: 30,
    modifiers: { evasion: +3 }
  },
  
  POINT_DEFENSE_SYSTEM: {
    id: 'POINT_DEFENSE_SYSTEM',
    name: 'Point Defense System',
    type: 'defense',
    powerCost: 15,
    modifiers: { evasion: +2 },
    special: 'intercept_1_missile_per_turn'
  },

  // ENGINES
  ION_DRIVE: {
    id: 'ION_DRIVE',
    name: 'Ion Drive',
    type: 'engine',
    thrust: 100,
    powerCost: 15,
    modifiers: { piloting: +1, initiative: +1 }
  },
  
  PLASMA_DRIVE: {
    id: 'PLASMA_DRIVE',
    name: 'Plasma Drive',
    type: 'engine',
    thrust: 180,
    powerCost: 25,
    modifiers: { piloting: +2, initiative: +2 }
  },
  
  QUANTUM_DRIVE: {
    id: 'QUANTUM_DRIVE',
    name: 'Quantum Drive',
    type: 'engine',
    thrust: 300,
    powerCost: 40,
    modifiers: { piloting: +3, initiative: +3, evasion: +1 }
  },

  // SENSORS & TARGETING
  BASIC_SENSORS: {
    id: 'BASIC_SENSORS',
    name: 'Basic Sensor Suite',
    type: 'sensors',
    range: 100,
    powerCost: 8,
    modifiers: { science: +1 }
  },
  
  ADVANCED_SENSORS: {
    id: 'ADVANCED_SENSORS',
    name: 'Advanced Sensor Suite',
    type: 'sensors',
    range: 200,
    powerCost: 15,
    modifiers: { science: +2, gunnery: +1 }
  },
  
  TARGETING_COMPUTER: {
    id: 'TARGETING_COMPUTER',
    name: 'Targeting Computer',
    type: 'sensors',
    powerCost: 20,
    modifiers: { gunnery: +3, tactics: +1 },
    special: 'advantage_on_first_attack'
  },

  // ECM & HACKING
  ECM_SUITE: {
    id: 'ECM_SUITE',
    name: 'ECM Suite',
    type: 'countermeasures',
    powerCost: 12,
    modifiers: { hacking: +2, evasion: +1 },
    special: 'enemy_attacks_disadvantage'
  },
  
  HACKING_MODULE: {
    id: 'HACKING_MODULE',
    name: 'Cyber Warfare Module',
    type: 'countermeasures',
    powerCost: 18,
    modifiers: { hacking: +4 },
    special: 'can_hack_enemy_systems'
  }
};

// ============================================================================
// RESEARCH UPGRADES
// ============================================================================

export const RESEARCH_TREE = {
  // WEAPON RESEARCH
  ADVANCED_BALLISTICS: {
    id: 'ADVANCED_BALLISTICS',
    name: 'Advanced Ballistics',
    category: 'weapons',
    description: 'Improved projectile calculations',
    cost: 500,
    researchTime: 3,
    modifiers: { gunnery: +1, damageBonus: +1 },
    prerequisites: []
  },
  
  PLASMA_REFINEMENT: {
    id: 'PLASMA_REFINEMENT',
    name: 'Plasma Refinement',
    category: 'weapons',
    description: 'Hotter, more focused plasma bolts',
    cost: 1000,
    researchTime: 5,
    modifiers: { damageBonus: +2 },
    prerequisites: ['ADVANCED_BALLISTICS'],
    special: 'plasma_weapons_+1d8_damage'
  },
  
  // DEFENSE RESEARCH
  SHIELD_HARMONICS: {
    id: 'SHIELD_HARMONICS',
    name: 'Shield Harmonics',
    category: 'defense',
    description: 'Optimized shield frequency modulation',
    cost: 600,
    researchTime: 4,
    modifiers: { maxShieldsPercent: +20 },
    prerequisites: []
  },
  
  REACTIVE_ARMOR: {
    id: 'REACTIVE_ARMOR',
    name: 'Reactive Armor',
    category: 'defense',
    description: 'Hull plates that absorb kinetic impacts',
    cost: 800,
    researchTime: 4,
    modifiers: { hullBonus: +20 },
    prerequisites: [],
    special: 'reduce_critical_damage_25%'
  },
  
  // MANEUVERABILITY RESEARCH
  THRUST_VECTORING: {
    id: 'THRUST_VECTORING',
    name: 'Thrust Vectoring',
    category: 'engines',
    description: 'Precision maneuvering thrusters',
    cost: 700,
    researchTime: 4,
    modifiers: { piloting: +1, evasion: +1 },
    prerequisites: []
  },
  
  INERTIAL_DAMPENING: {
    id: 'INERTIAL_DAMPENING',
    name: 'Inertial Dampening',
    category: 'engines',
    description: 'Cancel momentum for instant direction changes',
    cost: 1200,
    researchTime: 6,
    modifiers: { piloting: +2, evasion: +2 },
    prerequisites: ['THRUST_VECTORING'],
    special: 'can_change_range_as_bonus_action'
  },
  
  // TACTICAL RESEARCH
  COMBAT_ANALYTICS: {
    id: 'COMBAT_ANALYTICS',
    name: 'Combat Analytics',
    category: 'tactics',
    description: 'Real-time battle analysis algorithms',
    cost: 500,
    researchTime: 3,
    modifiers: { tactics: +2 },
    prerequisites: [],
    special: 'reveal_enemy_stats_after_1_turn'
  },
  
  PREDICTIVE_TARGETING: {
    id: 'PREDICTIVE_TARGETING',
    name: 'Predictive Targeting',
    category: 'tactics',
    description: 'AI-assisted shot prediction',
    cost: 1000,
    researchTime: 5,
    modifiers: { gunnery: +2 },
    prerequisites: ['COMBAT_ANALYTICS'],
    special: 'reroll_1_miss_per_turn'
  },
  
  // HACKING RESEARCH
  QUANTUM_DECRYPTION: {
    id: 'QUANTUM_DECRYPTION',
    name: 'Quantum Decryption',
    category: 'hacking',
    description: 'Break encryption in real-time',
    cost: 900,
    researchTime: 5,
    modifiers: { hacking: +3 },
    prerequisites: [],
    special: 'hack_attempts_advantage'
  }
};

// ============================================================================
// FINAL ATTRIBUTES CALCULATOR
// ============================================================================

export class CombatAttributesCalculator {
  constructor(playerSkills, aiCrew, shipComponents, researchCompleted) {
    this.playerSkills = playerSkills;
    this.aiCrew = aiCrew;
    this.shipComponents = shipComponents || [];
    this.researchCompleted = researchCompleted || [];
  }

  /**
   * Calculate final combat attributes
   */
  calculateAttributes() {
    // BASE: Player skills
    const base = {
      piloting: this.playerSkills.skills.piloting,
      gunnery: this.playerSkills.skills.gunnery,
      tactics: this.playerSkills.skills.tactics,
      engineering: this.playerSkills.skills.engineering,
      science: this.playerSkills.skills.science,
      hacking: this.playerSkills.skills.hacking,
      
      // Derived stats
      initiative: 0,
      evasion: 10, // Base AC = 10
      maxHull: 100,
      maxShields: 0,
      damageBonus: 0
    };

    // ADD: AI crew bonuses
    const aiStats = this.aiCrew.getCombinedStats();
    Object.keys(aiStats).forEach(stat => {
      if (base[stat] !== undefined) {
        base[stat] += Math.floor(aiStats[stat] / 2); // AI contributes half their skill
      }
    });

    // ADD: Ship components
    this.shipComponents.forEach(componentId => {
      const component = COMBAT_COMPONENTS[componentId];
      if (!component) return;
      
      // Apply modifiers
      if (component.modifiers) {
        Object.keys(component.modifiers).forEach(stat => {
          if (base[stat] !== undefined) {
            base[stat] += component.modifiers[stat];
          }
        });
      }
      
      // Special stats
      if (component.maxShields) base.maxShields += component.maxShields;
      if (component.special) {
        base.specials = base.specials || [];
        base.specials.push(component.special);
      }
    });

    // ADD: Research bonuses
    this.researchCompleted.forEach(researchId => {
      const research = RESEARCH_TREE[researchId];
      if (!research) return;
      
      if (research.modifiers) {
        Object.keys(research.modifiers).forEach(stat => {
          if (stat === 'maxShieldsPercent') {
            base.maxShields *= (1 + research.modifiers[stat] / 100);
          } else if (base[stat] !== undefined) {
            base[stat] += research.modifiers[stat];
          }
        });
      }
      
      if (research.special) {
        base.specials = base.specials || [];
        base.specials.push(research.special);
      }
    });

    // CALCULATE DERIVED STATS
    base.initiative += Math.floor(base.piloting / 2);
    base.evasion += Math.floor(base.piloting / 3);
    base.damageBonus += base.gunnery >= 8 ? 2 : (base.gunnery >= 5 ? 1 : 0);
    
    // APPLY PERKS
    const perks = this.playerSkills.perks;
    if (perks.includes('COMBAT_VETERAN')) {
      base.initiative += 2;
    }
    if (perks.includes('ACE_PILOT')) {
      base.evasionAdvantage = true;
    }

    return base;
  }

  /**
   * Get attack roll breakdown
   */
  getAttackBreakdown(weaponId) {
    const attrs = this.calculateAttributes();
    const weapon = COMBAT_COMPONENTS[weaponId];
    
    if (!weapon) return null;
    
    return {
      weaponName: weapon.name,
      damage: weapon.damage,
      toHit: weapon.toHitBonus + Math.floor(attrs.gunnery / 2),
      damageBonus: attrs.damageBonus,
      range: weapon.range,
      special: weapon.special,
      powerCost: weapon.powerCost
    };
  }

  /**
   * Get defense breakdown
   */
  getDefenseBreakdown() {
    const attrs = this.calculateAttributes();
    
    return {
      evasion: attrs.evasion,
      maxHull: attrs.maxHull,
      maxShields: attrs.maxShields,
      shieldRegen: this.getShieldRegen(),
      specialDefenses: attrs.specials?.filter(s => s.includes('defense') || s.includes('intercept')) || []
    };
  }

  /**
   * Get shield regen rate
   */
  getShieldRegen() {
    let regen = 0;
    this.shipComponents.forEach(componentId => {
      const component = COMBAT_COMPONENTS[componentId];
      if (component?.regenRate) {
        regen += component.regenRate;
      }
    });
    return regen;
  }

  /**
   * Get initiative breakdown
   */
  getInitiativeBreakdown() {
    const attrs = this.calculateAttributes();
    const aiPassives = this.aiCrew.getActivePassives();
    
    let total = attrs.initiative;
    const breakdown = [`Base piloting: +${Math.floor(attrs.piloting / 2)}`];
    
    // AI passives
    aiPassives.forEach(passive => {
      if (passive.effect.initiative) {
        total += passive.effect.initiative;
        breakdown.push(`${passive.name}: +${passive.effect.initiative}`);
      }
    });
    
    return { total, breakdown };
  }

  /**
   * Format combat summary for UI
   */
  getCombatSummary() {
    const attrs = this.calculateAttributes();
    
    return {
      offensive: {
        gunnery: attrs.gunnery,
        toHitBonus: Math.floor(attrs.gunnery / 2),
        damageBonus: attrs.damageBonus,
        tactics: attrs.tactics
      },
      defensive: {
        evasion: attrs.evasion,
        hull: attrs.maxHull,
        shields: attrs.maxShields,
        piloting: attrs.piloting
      },
      technical: {
        engineering: attrs.engineering,
        repairPerTurn: 10 + (attrs.engineering * 2),
        science: attrs.science,
        hacking: attrs.hacking
      },
      initiative: this.getInitiativeBreakdown().total,
      specialAbilities: attrs.specials || []
    };
  }
}

export default CombatAttributesCalculator;
