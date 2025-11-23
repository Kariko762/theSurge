/**
 * Player Skills & Background System
 * 
 * Player chooses background at game start, which determines base skills.
 * Skills level up through use, affecting combat, diplomacy, and exploration.
 */

// ============================================================================
// PLAYER BACKGROUNDS (Character Creation)
// ============================================================================

export const PLAYER_BACKGROUNDS = {
  VETERAN_PILOT: {
    id: 'VETERAN_PILOT',
    name: 'Veteran Pilot',
    description: 'Former military pilot with years of combat experience. Excels at ship combat and evasive maneuvers.',
    startingSkills: {
      piloting: 8,        // +4 to initiative, evasion maneuvers
      gunnery: 7,         // +3 to weapon accuracy
      tactics: 6,         // +3 to tactical decisions, flanking
      engineering: 3,     // +1 to repairs
      science: 2,         // +1 to scans
      persuasion: 3,      // +1 to diplomacy
      intimidation: 7,    // +3 to threats
      hacking: 2          // +1 to system hacks
    },
    startingPerks: [
      'ACE_PILOT',        // Advantage on evasion rolls
      'COMBAT_VETERAN'    // +2 to all combat initiative
    ],
    backstory: 'You flew dozens of combat missions before The Surge. The scars on your hull tell stories of battles won and brothers lost.'
  },

  ENGINEER: {
    id: 'ENGINEER',
    name: 'Ship Engineer',
    description: 'Master technician who kept ships running through impossible conditions. Excels at repairs, system management, and jury-rigging.',
    startingSkills: {
      piloting: 4,        // +2 to initiative
      gunnery: 3,         // +1 to weapon accuracy
      tactics: 3,         // +1 to tactical decisions
      engineering: 9,     // +4 to repairs, system hacks
      science: 6,         // +3 to scans, analysis
      persuasion: 4,      // +2 to diplomacy
      intimidation: 2,    // +1 to threats
      hacking: 7          // +3 to system hacks
    },
    startingPerks: [
      'MASTER_TECHNICIAN', // Can repair 2 systems per turn
      'OVERCLOCK'          // Boost any system for 3 turns (cooldown 5)
    ],
    backstory: 'You kept the fleet alive when parts were scarce and hope was scarcer. Now you keep yourself alive with duct tape and genius.'
  },

  NOBLE: {
    id: 'NOBLE',
    name: 'Dispossessed Noble',
    description: 'Former elite who lost everything in The Surge. Excels at diplomacy, negotiation, and reading people.',
    startingSkills: {
      piloting: 4,        // +2 to initiative
      gunnery: 3,         // +1 to weapon accuracy
      tactics: 5,         // +2 to tactical decisions
      engineering: 2,     // +1 to repairs
      science: 5,         // +2 to scans
      persuasion: 9,      // +4 to diplomacy, trades
      intimidation: 6,    // +3 to threats (aristocratic authority)
      hacking: 3          // +1 to system hacks
    },
    startingPerks: [
      'SILVER_TONGUE',    // Reroll failed persuasion checks once
      'CONNECTIONS'       // 20% better trade prices, +10 faction reputation
    ],
    backstory: 'Your estate is ash. Your title means nothing. But your words still carry weight, and you know how to survive among wolves.'
  },

  SCAVENGER: {
    id: 'SCAVENGER',
    name: 'Wastelander Scavenger',
    description: 'Survivor who thrived in The Surge by being clever, ruthless, and resourceful. Excels at finding loot and improvisation.',
    startingSkills: {
      piloting: 6,        // +3 to initiative
      gunnery: 5,         // +2 to weapon accuracy
      tactics: 7,         // +3 to tactical decisions (street smart)
      engineering: 5,     // +2 to repairs (jury-rigging)
      science: 4,         // +2 to scans
      persuasion: 5,      // +2 to diplomacy
      intimidation: 5,    // +2 to threats
      hacking: 6          // +3 to system hacks (lockpicking)
    },
    startingPerks: [
      'SCAVENGERS_EYE',   // 30% more loot from wreckage
      'SURVIVOR'          // Can flee combat with advantage
    ],
    backstory: 'The Surge didn\'t break you - it forged you. You know every trick to stay alive when the galaxy wants you dead.'
  }
};

// ============================================================================
// SKILL DEFINITIONS
// ============================================================================

export const SKILLS = {
  // COMBAT SKILLS
  piloting: {
    name: 'Piloting',
    category: 'combat',
    description: 'Ship maneuvering, evasion, and positioning',
    combatEffects: {
      initiative: (level) => Math.floor(level / 2),        // +1 per 2 levels
      evasion: (level) => Math.floor(level / 3),           // +1 AC per 3 levels
      flanking: (level) => level >= 6 ? 'advantage' : null // Advantage at level 6+
    }
  },
  
  gunnery: {
    name: 'Gunnery',
    category: 'combat',
    description: 'Weapon accuracy and damage',
    combatEffects: {
      toHit: (level) => Math.floor(level / 2),             // +1 to hit per 2 levels
      damageBonus: (level) => level >= 8 ? 2 : (level >= 5 ? 1 : 0),
      critRange: (level) => level >= 10 ? 19 : 20         // Crit on 19-20 at level 10
    }
  },
  
  tactics: {
    name: 'Tactics',
    category: 'combat',
    description: 'Combat strategy and battlefield awareness',
    combatEffects: {
      actionEconomy: (level) => level >= 7 ? 'bonus_action' : null, // Extra action at 7+
      enemyPredict: (level) => level >= 5 ? 'reveal_intent' : null,  // See enemy next move
      ambushDetection: (level) => Math.floor(level / 2)              // Harder to ambush
    }
  },

  // TECHNICAL SKILLS
  engineering: {
    name: 'Engineering',
    category: 'technical',
    description: 'Repairs, system optimization, and jury-rigging',
    combatEffects: {
      repairAmount: (level) => 10 + (level * 2),           // Heal 10 + 2*level per repair
      systemBoost: (level) => level >= 6 ? 3 : 2,          // Turns systems stay boosted
      emergencyRepair: (level) => level >= 8 ? true : false // Combat repair available
    }
  },

  science: {
    name: 'Science',
    category: 'technical',
    description: 'Scanning, analysis, and research',
    combatEffects: {
      scanDepth: (level) => level >= 5 ? 'full' : 'basic', // Reveal weaknesses
      environmentalAdapt: (level) => Math.floor(level / 3), // Counter hazards
      exploitWeakness: (level) => level >= 7 ? '+2dmg' : null
    }
  },

  hacking: {
    name: 'Hacking',
    category: 'technical',
    description: 'System intrusion and electronic warfare',
    combatEffects: {
      disableSystem: (level) => Math.floor(level / 2),     // DC to disable enemy system
      counterHack: (level) => level >= 6 ? 'reaction' : null,
      virusDeployment: (level) => level >= 8 ? 'available' : null
    }
  },

  // SOCIAL SKILLS
  persuasion: {
    name: 'Persuasion',
    category: 'social',
    description: 'Diplomacy, negotiation, and charm',
    combatEffects: {
      surrenderDC: (level) => 10 + Math.floor(level / 2),  // DC for enemy surrender
      allyBonus: (level) => level >= 6 ? '+1 ally morale' : null,
      tradeBonus: (level) => level * 2  // % discount on trades
    }
  },

  intimidation: {
    name: 'Intimidation',
    category: 'social',
    description: 'Threats, fear, and dominance',
    combatEffects: {
      fearDC: (level) => 10 + Math.floor(level / 2),       // DC to cause fear
      moraleBreak: (level) => level >= 7 ? 2 : 1,          // Ships that flee when hit
      firstStrike: (level) => level >= 5 ? 'advantage' : null // Advantage on first attack
    }
  }
};

// ============================================================================
// PERKS SYSTEM
// ============================================================================

export const PERKS = {
  // PILOT PERKS
  ACE_PILOT: {
    name: 'Ace Pilot',
    description: 'Years of combat flying give you uncanny reflexes',
    effect: { evasionAdvantage: true, criticalEvasion: 'auto_success_on_20' }
  },
  
  COMBAT_VETERAN: {
    name: 'Combat Veteran',
    description: 'You\'ve seen it all. Nothing surprises you.',
    effect: { initiative: +2, immuneToFear: true }
  },

  // ENGINEER PERKS
  MASTER_TECHNICIAN: {
    name: 'Master Technician',
    description: 'You can repair multiple systems simultaneously',
    effect: { repairActions: 2, repairEfficiency: 1.5 }
  },

  OVERCLOCK: {
    name: 'Overclock',
    description: 'Push any system beyond its limits temporarily',
    effect: { 
      systemBoost: '+50% effectiveness',
      duration: 3,
      cooldown: 5,
      risk: 'system_damage_on_fumble'
    }
  },

  // NOBLE PERKS
  SILVER_TONGUE: {
    name: 'Silver Tongue',
    description: 'Your words can turn enemies into allies',
    effect: { rerollPersuasion: 'once_per_encounter', diplomacyBonus: +3 }
  },

  CONNECTIONS: {
    name: 'Connections',
    description: 'Even in the wastes, some remember your name',
    effect: { tradePriceModifier: 0.8, factionRepBonus: +10 }
  },

  // SCAVENGER PERKS
  SCAVENGERS_EYE: {
    name: 'Scavenger\'s Eye',
    description: 'You know exactly what\'s valuable in wreckage',
    effect: { lootMultiplier: 1.3, revealHiddenLoot: true }
  },

  SURVIVOR: {
    name: 'Survivor',
    description: 'Running away is a valid strategy',
    effect: { retreatAdvantage: true, retreatNoProvoke: true }
  }
};

// ============================================================================
// SKILL PROGRESSION
// ============================================================================

export class PlayerSkillManager {
  constructor(backgroundId) {
    const background = PLAYER_BACKGROUNDS[backgroundId];
    
    this.background = background;
    this.skills = { ...background.startingSkills };
    this.perks = [...background.startingPerks];
    this.experience = {};
    
    // Initialize XP tracking
    Object.keys(this.skills).forEach(skill => {
      this.experience[skill] = 0;
    });
  }

  /**
   * Add XP to a skill and check for level up
   */
  addExperience(skillName, amount) {
    if (!this.skills[skillName]) return;
    
    this.experience[skillName] += amount;
    
    // Level up formula: XP needed = currentLevel * 100
    const currentLevel = this.skills[skillName];
    const xpNeeded = currentLevel * 100;
    
    if (this.experience[skillName] >= xpNeeded) {
      this.skills[skillName]++;
      this.experience[skillName] -= xpNeeded;
      
      console.log(`[SKILL UP] ${skillName} → Level ${this.skills[skillName]}`);
      
      return {
        leveledUp: true,
        skill: skillName,
        newLevel: this.skills[skillName]
      };
    }
    
    return { leveledUp: false };
  }

  /**
   * Get skill modifier for d20 rolls
   */
  getModifier(skillName) {
    const level = this.skills[skillName] || 0;
    return Math.floor(level / 2); // Standard D&D-style: level/2 = modifier
  }

  /**
   * Calculate all combat-relevant stats
   */
  getCombatStats() {
    const stats = {
      initiative: this.getModifier('piloting'),
      evasionBonus: Math.floor(this.skills.piloting / 3),
      attackBonus: this.getModifier('gunnery'),
      damageBonus: this.skills.gunnery >= 8 ? 2 : (this.skills.gunnery >= 5 ? 1 : 0),
      repairAmount: 10 + (this.skills.engineering * 2),
      hackDC: 10 + this.getModifier('hacking'),
      persuasionBonus: this.getModifier('persuasion'),
      intimidationBonus: this.getModifier('intimidation')
    };
    
    // Apply perk modifiers
    if (this.perks.includes('COMBAT_VETERAN')) {
      stats.initiative += 2;
    }
    if (this.perks.includes('ACE_PILOT')) {
      stats.evasionAdvantage = true;
    }
    
    return stats;
  }

  /**
   * Get complete player state for saving
   */
  getState() {
    return {
      backgroundId: this.background.id,
      skills: { ...this.skills },
      perks: [...this.perks],
      experience: { ...this.experience }
    };
  }

  /**
   * Load player state from save
   */
  loadState(state) {
    this.skills = { ...state.skills };
    this.perks = [...state.perks ];
    this.experience = { ...state.experience };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get skill bonus for a specific skill level
 */
export function getSkillBonus(skillLevel) {
  return Math.floor(skillLevel / 2);
}

/**
 * Calculate if player has advantage on a roll
 */
export function hasAdvantage(skillName, perks, situation) {
  if (skillName === 'piloting' && perks.includes('ACE_PILOT') && situation === 'evasion') {
    return true;
  }
  if (skillName === 'intimidation' && perks.includes('COMBAT_VETERAN') && situation === 'first_strike') {
    return true;
  }
  return false;
}

export default PlayerSkillManager;
