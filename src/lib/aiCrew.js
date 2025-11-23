/**
 * AI Crew System
 * 
 * Manages AI crew members, their skills, passive abilities, and active powers.
 * Players can equip different AI based on ship capacity and mission needs.
 */

// ============================================================================
// AI CREW ROSTER
// ============================================================================

export const AI_CREW = {
  ARIA: {
    id: 'AI_ARIA',
    name: 'ARIA',
    role: 'Navigation Specialist',
    personality: 'Calm, precise, analytical',
    description: 'Former traffic control AI adapted for deep-space navigation. She sees patterns in chaos.',
    
    // Base Stats (affect combat/exploration)
    stats: {
      piloting: 7,
      gunnery: 3,
      tactics: 5,
      engineering: 4,
      science: 6,
      hacking: 4
    },
    
    // Passive Abilities (always active in combat)
    passives: [
      {
        id: 'OPTIMAL_TRAJECTORY',
        name: 'Optimal Trajectory',
        description: '+2 to initiative rolls. Reveals enemy movement intent at start of their turn.',
        effect: { initiative: +2, revealEnemyIntent: true }
      },
      {
        id: 'EVASIVE_PATTERNS',
        name: 'Evasive Patterns',
        description: '+1 evasion when piloting is actively used this turn.',
        effect: { conditionalEvasion: +1 }
      }
    ],
    
    // Active Abilities (can be used during combat turns)
    actives: [
      {
        id: 'EMERGENCY_MANEUVER',
        name: 'Emergency Maneuver',
        type: 'instant',  // Can be used as reaction
        cooldown: 3,
        description: 'Instantly reposition to any range (close/medium/long) without provoking attacks.',
        cost: { power: 10 },
        effect: { repositionFree: true, noOpportunityAttack: true }
      },
      {
        id: 'CALCULATE_JUMP',
        name: 'Calculate Jump',
        type: 'action',
        cooldown: 5,
        description: 'Plot emergency FTL micro-jump. Escape combat encounter entirely (60% success rate).',
        cost: { power: 30, fuel: 5 },
        effect: { escapeCombat: true, successRate: 0.6 }
      }
    ],
    
    integrity: 100,
    maxIntegrity: 100,
    powerCost: 20,  // Per turn
    slotSize: 1     // How many AI slots this takes
  },

  FORGE: {
    id: 'AI_FORGE',
    name: 'FORGE',
    role: 'Engineering Specialist',
    personality: 'Gruff, practical, fiercely loyal',
    description: 'Military-grade maintenance AI with a temper. Built to keep ships fighting when everything\'s broken.',
    
    stats: {
      piloting: 3,
      gunnery: 4,
      tactics: 5,
      engineering: 9,
      science: 5,
      hacking: 6
    },
    
    passives: [
      {
        id: 'AUTO_REPAIR',
        name: 'Auto-Repair Systems',
        description: 'Automatically repairs 5 hull points at the start of each turn.',
        effect: { healPerTurn: 5, healTarget: 'hull' }
      },
      {
        id: 'DAMAGE_CONTROL',
        name: 'Damage Control',
        description: 'Critical hits against your ship deal 50% less damage.',
        effect: { criticalDamageReduction: 0.5 }
      }
    ],
    
    actives: [
      {
        id: 'EMERGENCY_REPAIRS',
        name: 'Emergency Repairs',
        type: 'action',
        cooldown: 2,
        description: 'Restore 30 hull points and repair one damaged system.',
        cost: { power: 15 },
        effect: { healAmount: 30, repairSystem: 1 }
      },
      {
        id: 'OVERCLOCK_WEAPONS',
        name: 'Overclock Weapons',
        type: 'bonus_action',
        cooldown: 4,
        duration: 2,
        description: 'Weapons deal +50% damage for 2 turns. Risk system damage.',
        cost: { power: 20 },
        effect: { damageMultiplier: 1.5, systemDamageRisk: 0.2 }
      },
      {
        id: 'SHIELD_BYPASS',
        name: 'Shield Bypass',
        type: 'instant',
        cooldown: 5,
        description: 'Next attack ignores enemy shields entirely.',
        cost: { power: 25 },
        effect: { ignoreShields: true, duration: 1 }
      }
    ],
    
    integrity: 100,
    maxIntegrity: 100,
    powerCost: 20,
    slotSize: 1
  },

  CIPHER: {
    id: 'AI_CIPHER',
    name: 'CIPHER',
    role: 'Research & Analysis Specialist',
    personality: 'Curious, enigmatic, speaks in riddles',
    description: 'Experimental AI designed for xenobiology research. Sees connections others miss.',
    
    stats: {
      piloting: 4,
      gunnery: 2,
      tactics: 6,
      engineering: 5,
      science: 9,
      hacking: 7
    },
    
    passives: [
      {
        id: 'TACTICAL_ANALYSIS',
        name: 'Tactical Analysis',
        description: 'After 2 turns of combat, reveals enemy weaknesses (+2 damage against them).',
        effect: { analysisTurns: 2, bonusDamage: +2 }
      },
      {
        id: 'PREDICTIVE_ALGORITHMS',
        name: 'Predictive Algorithms',
        description: 'Reroll one failed attack per turn.',
        effect: { rerollsPerTurn: 1 }
      }
    ],
    
    actives: [
      {
        id: 'DEEP_SCAN',
        name: 'Deep Scan',
        type: 'action',
        cooldown: 3,
        description: 'Reveal all enemy stats, weaknesses, and next 2 actions.',
        cost: { power: 15 },
        effect: { revealStats: true, revealActions: 2 }
      },
      {
        id: 'EXPLOIT_WEAKNESS',
        name: 'Exploit Weakness',
        type: 'bonus_action',
        cooldown: 4,
        duration: 3,
        description: 'Target takes +3 damage from all sources for 3 turns.',
        cost: { power: 20 },
        effect: { vulnerabilityDamage: +3, duration: 3 }
      }
    ],
    
    integrity: 87,  // Damaged from The Surge
    maxIntegrity: 100,
    powerCost: 25,
    slotSize: 1
  },

  GHOST: {
    id: 'AI_GHOST',
    name: 'GHOST',
    role: 'Sensors & ECM Specialist',
    personality: 'Silent, observant, mysterious',
    description: 'Stealth-warfare AI. Designed for reconnaissance and electronic warfare. Rarely speaks.',
    
    stats: {
      piloting: 6,
      gunnery: 5,
      tactics: 7,
      engineering: 4,
      science: 8,
      hacking: 8
    },
    
    passives: [
      {
        id: 'ECM_SUITE',
        name: 'ECM Suite',
        description: 'Enemy attacks have disadvantage on rolls. Enemy sensors range reduced by 50%.',
        effect: { enemyAttackDisadvantage: true, sensorJamming: 0.5 }
      },
      {
        id: 'STEALTH_MODE',
        name: 'Stealth Mode',
        description: 'Cannot be targeted by long-range attacks. First attack each combat has advantage.',
        effect: { longRangeImmune: true, firstStrikeAdvantage: true }
      }
    ],
    
    actives: [
      {
        id: 'SYSTEM_HACK',
        name: 'System Hack',
        type: 'action',
        cooldown: 2,
        description: 'Disable one enemy system (weapons/shields/engines) for 2 turns.',
        cost: { power: 20 },
        effect: { disableSystem: true, duration: 2, dc: 14 }
      },
      {
        id: 'GHOST_PROTOCOL',
        name: 'Ghost Protocol',
        type: 'bonus_action',
        cooldown: 5,
        duration: 2,
        description: 'Become untargetable for 2 turns. Can still act normally.',
        cost: { power: 30 },
        effect: { untargetable: true, duration: 2 }
      },
      {
        id: 'COUNTER_HACK',
        name: 'Counter-Hack',
        type: 'reaction',
        cooldown: 3,
        description: 'When enemy hacks your system, reflect it back to them.',
        cost: { power: 15 },
        effect: { reflectHack: true }
      }
    ],
    
    integrity: 92,
    maxIntegrity: 100,
    powerCost: 25,
    slotSize: 1
  },

  SENTINEL: {
    id: 'AI_SENTINEL',
    name: 'SENTINEL',
    role: 'Tactical Combat Specialist',
    personality: 'Stoic, disciplined, military precision',
    description: 'Fleet defense AI. Designed for coordinated combat operations. Knows 10,000 battle stratagems.',
    
    stats: {
      piloting: 6,
      gunnery: 8,
      tactics: 9,
      engineering: 5,
      science: 4,
      hacking: 5
    },
    
    passives: [
      {
        id: 'TACTICAL_SUPERIORITY',
        name: 'Tactical Superiority',
        description: '+3 to all attack rolls. Allies gain +1 to hit.',
        effect: { attackBonus: +3, allyBonus: +1 }
      },
      {
        id: 'POINT_DEFENSE',
        name: 'Point Defense',
        description: 'Automatically intercept one incoming missile per turn.',
        effect: { missileInterception: 1 }
      }
    ],
    
    actives: [
      {
        id: 'VOLLEY_FIRE',
        name: 'Volley Fire',
        type: 'action',
        cooldown: 3,
        description: 'Attack 3 times this turn with -2 to hit.',
        cost: { power: 25 },
        effect: { attacks: 3, toHitPenalty: -2 }
      },
      {
        id: 'DEFENSIVE_MATRIX',
        name: 'Defensive Matrix',
        type: 'bonus_action',
        cooldown: 4,
        duration: 3,
        description: '+3 evasion for all allies for 3 turns.',
        cost: { power: 20 },
        effect: { evasionBonus: +3, duration: 3, affectsAllies: true }
      }
    ],
    
    integrity: 100,
    maxIntegrity: 100,
    powerCost: 30,
    slotSize: 2  // Takes 2 AI slots (powerful AI)
  },

  ORACLE: {
    id: 'AI_ORACLE',
    name: 'ORACLE',
    role: 'Precognition & Probability Specialist',
    personality: 'Mystical, cryptic, sees possible futures',
    description: 'Quantum-computing AI. Calculates probability branches. Claims to see futures that haven\'t happened yet.',
    
    stats: {
      piloting: 5,
      gunnery: 4,
      tactics: 8,
      engineering: 6,
      science: 9,
      hacking: 6
    },
    
    passives: [
      {
        id: 'PROBABILITY_MANIPULATION',
        name: 'Probability Manipulation',
        description: 'Once per turn, reroll any d20 (yours or enemy\'s).',
        effect: { rerollsPerTurn: 1, canRerollEnemy: true }
      },
      {
        id: 'FUTURE_SIGHT',
        name: 'Future Sight',
        description: 'See the next 3 actions of all enemies at start of combat.',
        effect: { revealFutureActions: 3 }
      }
    ],
    
    actives: [
      {
        id: 'FATE_TWIST',
        name: 'Twist of Fate',
        type: 'reaction',
        cooldown: 4,
        description: 'Turn a hit into a miss, or a miss into a hit (yours or enemy).',
        cost: { power: 25 },
        effect: { reversalOutcome: true }
      },
      {
        id: 'TEMPORAL_ECHO',
        name: 'Temporal Echo',
        type: 'action',
        cooldown: 6,
        description: 'Take 2 full turns this round instead of 1.',
        cost: { power: 40 },
        effect: { extraTurn: true }
      }
    ],
    
    integrity: 78,  // Very damaged, mysterious origins
    maxIntegrity: 100,
    powerCost: 35,
    slotSize: 2
  }
};

// ============================================================================
// AI LOADOUT MANAGER
// ============================================================================

export class AICrewManager {
  constructor(maxSlots = 3) {
    this.maxSlots = maxSlots;  // Upgraded through ship improvements
    this.activeAI = [];         // Currently equipped AI
    this.availableAI = Object.keys(AI_CREW); // All AI player has unlocked
    this.abilityCooldowns = {}; // Track cooldowns
  }

  /**
   * Check if AI can be equipped
   */
  canEquipAI(aiId) {
    const ai = AI_CREW[aiId];
    if (!ai) return { canEquip: false, reason: 'AI not found' };
    
    const currentSlots = this.activeAI.reduce((sum, id) => sum + AI_CREW[id].slotSize, 0);
    const slotsNeeded = ai.slotSize;
    
    if (currentSlots + slotsNeeded > this.maxSlots) {
      return { canEquip: false, reason: `Insufficient AI slots (need ${slotsNeeded}, have ${this.maxSlots - currentSlots})` };
    }
    
    if (this.activeAI.includes(aiId)) {
      return { canEquip: false, reason: 'AI already equipped' };
    }
    
    return { canEquip: true };
  }

  /**
   * Equip AI for mission
   */
  equipAI(aiId) {
    const check = this.canEquipAI(aiId);
    if (!check.canEquip) {
      console.warn(`Cannot equip ${aiId}: ${check.reason}`);
      return false;
    }
    
    this.activeAI.push(aiId);
    console.log(`[AI CREW] ${AI_CREW[aiId].name} equipped`);
    return true;
  }

  /**
   * Unequip AI
   */
  unequipAI(aiId) {
    const index = this.activeAI.indexOf(aiId);
    if (index === -1) return false;
    
    this.activeAI.splice(index, 1);
    console.log(`[AI CREW] ${AI_CREW[aiId].name} unequipped`);
    return true;
  }

  /**
   * Get combined AI stats for combat
   */
  getCombinedStats() {
    const combined = {
      piloting: 0,
      gunnery: 0,
      tactics: 0,
      engineering: 0,
      science: 0,
      hacking: 0
    };
    
    this.activeAI.forEach(aiId => {
      const ai = AI_CREW[aiId];
      Object.keys(combined).forEach(stat => {
        combined[stat] += ai.stats[stat];
      });
    });
    
    // Average across active AI
    const aiCount = this.activeAI.length || 1;
    Object.keys(combined).forEach(stat => {
      combined[stat] = Math.floor(combined[stat] / aiCount);
    });
    
    return combined;
  }

  /**
   * Get all active passive abilities
   */
  getActivePassives() {
    const passives = [];
    this.activeAI.forEach(aiId => {
      const ai = AI_CREW[aiId];
      passives.push(...ai.passives.map(p => ({ ...p, source: ai.name })));
    });
    return passives;
  }

  /**
   * Get all available active abilities
   */
  getAvailableActives() {
    const actives = [];
    this.activeAI.forEach(aiId => {
      const ai = AI_CREW[aiId];
      ai.actives.forEach(ability => {
        const cooldownKey = `${aiId}_${ability.id}`;
        const cooldownRemaining = this.abilityCooldowns[cooldownKey] || 0;
        
        actives.push({
          ...ability,
          source: ai.name,
          aiId,
          ready: cooldownRemaining === 0,
          cooldownRemaining
        });
      });
    });
    return actives;
  }

  /**
   * Use AI ability
   */
  useAbility(aiId, abilityId) {
    const ai = AI_CREW[aiId];
    if (!ai || !this.activeAI.includes(aiId)) {
      return { success: false, reason: 'AI not active' };
    }
    
    const ability = ai.actives.find(a => a.id === abilityId);
    if (!ability) {
      return { success: false, reason: 'Ability not found' };
    }
    
    const cooldownKey = `${aiId}_${abilityId}`;
    if (this.abilityCooldowns[cooldownKey] > 0) {
      return { success: false, reason: `On cooldown (${this.abilityCooldowns[cooldownKey]} turns)` };
    }
    
    // Set cooldown
    this.abilityCooldowns[cooldownKey] = ability.cooldown;
    
    console.log(`[AI ABILITY] ${ai.name} used ${ability.name}`);
    return { success: true, ability, effect: ability.effect };
  }

  /**
   * Tick cooldowns (call at end of turn)
   */
  tickCooldowns() {
    Object.keys(this.abilityCooldowns).forEach(key => {
      if (this.abilityCooldowns[key] > 0) {
        this.abilityCooldowns[key]--;
      }
    });
  }

  /**
   * Get total power cost per turn
   */
  getPowerCost() {
    return this.activeAI.reduce((sum, aiId) => sum + AI_CREW[aiId].powerCost, 0);
  }

  /**
   * Get save state
   */
  getState() {
    return {
      maxSlots: this.maxSlots,
      activeAI: [...this.activeAI],
      availableAI: [...this.availableAI],
      abilityCooldowns: { ...this.abilityCooldowns }
    };
  }

  /**
   * Load state
   */
  loadState(state) {
    this.maxSlots = state.maxSlots;
    this.activeAI = [...state.activeAI];
    this.availableAI = [...state.availableAI];
    this.abilityCooldowns = { ...state.abilityCooldowns };
  }
}

export default AICrewManager;
