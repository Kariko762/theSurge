// Combat Engine - Turn-based space combat system
// Handles initiative, actions, damage calculation, and combat resolution

/**
 * Combat Participant (Player or Enemy)
 */
export class Combatant {
  constructor(data) {
    this.id = data.id || `combatant_${Date.now()}`;
    this.name = data.name || 'Unknown';
    this.type = data.type || 'ship'; // 'ship', 'station', 'fighter', 'capital'
    this.faction = data.faction || 'neutral'; // 'player', 'pirate', 'corporate', 'alien', etc.
    
    // Combat Stats
    this.maxHull = data.maxHull || 100;
    this.currentHull = data.currentHull || this.maxHull;
    this.maxShields = data.maxShields || 100;
    this.currentShields = data.currentShields || this.maxShields;
    this.shieldRegenRate = data.shieldRegenRate || 5; // % per turn
    
    // Combat Attributes
    this.initiative = data.initiative || 10; // Turn order priority
    this.evasion = data.evasion || 5; // Dodge chance %
    this.accuracy = data.accuracy || 80; // Hit chance %
    
    // Weapons Systems
    this.weapons = data.weapons || [
      {
        id: 'laser_cannon',
        name: 'Laser Cannon',
        type: 'energy',
        damage: { min: 15, max: 25 },
        shieldPenetration: 0.3, // 30% damage goes through shields
        accuracy: 85,
        cooldown: 0, // turns until ready
        maxCooldown: 1, // turns between uses
        energyCost: 10
      }
    ];
    
    // Defensive Systems
    this.armor = data.armor || 10; // Damage reduction
    this.pointDefense = data.pointDefense || 20; // % chance to intercept missiles
    
    // Resources
    this.maxEnergy = data.maxEnergy || 100;
    this.currentEnergy = data.currentEnergy || this.maxEnergy;
    this.energyRegenRate = data.energyRegenRate || 15; // per turn
    
    // Status Effects
    this.statusEffects = []; // { type: 'disabled_weapons', duration: 3 }
    
    // AI Behavior (for NPCs)
    this.aiProfile = data.aiProfile || 'balanced'; // 'aggressive', 'defensive', 'tactical', 'balanced'
  }
  
  isAlive() {
    return this.currentHull > 0;
  }
  
  isShieldsUp() {
    return this.currentShields > 0;
  }
  
  // Take damage with shield absorption
  takeDamage(amount, shieldPenetration = 0) {
    const result = {
      totalDamage: amount,
      shieldDamage: 0,
      hullDamage: 0,
      shieldsDestroyed: false,
      destroyed: false
    };
    
    if (this.currentShields > 0) {
      // Shields absorb damage
      const shieldAbsorbedDamage = amount * (1 - shieldPenetration);
      const penetratingDamage = amount * shieldPenetration;
      
      result.shieldDamage = Math.min(shieldAbsorbedDamage, this.currentShields);
      this.currentShields -= result.shieldDamage;
      
      if (this.currentShields <= 0) {
        this.currentShields = 0;
        result.shieldsDestroyed = true;
        // Overflow damage goes to hull
        const overflow = Math.abs(this.currentShields);
        result.hullDamage = overflow + penetratingDamage;
      } else {
        result.hullDamage = penetratingDamage;
      }
    } else {
      // No shields, all damage to hull
      result.hullDamage = amount;
    }
    
    // Apply armor reduction to hull damage
    const armoredDamage = Math.max(0, result.hullDamage - this.armor);
    this.currentHull -= armoredDamage;
    result.hullDamage = armoredDamage;
    
    if (this.currentHull <= 0) {
      this.currentHull = 0;
      result.destroyed = true;
    }
    
    return result;
  }
  
  // Regenerate shields
  regenerateShields() {
    if (this.currentShields < this.maxShields) {
      const regen = this.maxShields * (this.shieldRegenRate / 100);
      this.currentShields = Math.min(this.maxShields, this.currentShields + regen);
      return regen;
    }
    return 0;
  }
  
  // Regenerate energy
  regenerateEnergy() {
    if (this.currentEnergy < this.maxEnergy) {
      this.currentEnergy = Math.min(this.maxEnergy, this.currentEnergy + this.energyRegenRate);
      return this.energyRegenRate;
    }
    return 0;
  }
  
  // Get available actions for this combatant
  getAvailableActions() {
    const actions = [];
    
    // Attack actions (one per weapon)
    this.weapons.forEach(weapon => {
      if (weapon.cooldown === 0 && this.currentEnergy >= weapon.energyCost) {
        actions.push({
          type: 'attack',
          weaponId: weapon.id,
          name: `Fire ${weapon.name}`,
          description: `Deal ${weapon.damage.min}-${weapon.damage.max} damage`,
          energyCost: weapon.energyCost
        });
      }
    });
    
    // Defensive actions
    actions.push({
      type: 'defend',
      name: 'Evasive Maneuvers',
      description: 'Boost evasion by 30% for this turn',
      energyCost: 5
    });
    
    actions.push({
      type: 'boost_shields',
      name: 'Boost Shields',
      description: 'Regenerate 20% shields immediately',
      energyCost: 20
    });
    
    // Special actions
    if (this.currentEnergy >= 30) {
      actions.push({
        type: 'overcharge',
        name: 'Overcharge Weapons',
        description: 'Next attack deals +50% damage',
        energyCost: 30
      });
    }
    
    return actions.filter(action => this.currentEnergy >= action.energyCost);
  }
  
  // Update weapon cooldowns
  updateCooldowns() {
    this.weapons.forEach(weapon => {
      if (weapon.cooldown > 0) {
        weapon.cooldown--;
      }
    });
  }
  
  // Update status effects
  updateStatusEffects() {
    this.statusEffects = this.statusEffects
      .map(effect => ({ ...effect, duration: effect.duration - 1 }))
      .filter(effect => effect.duration > 0);
  }
}

/**
 * Combat Engine - Manages turn-based combat
 */
export class CombatEngine {
  constructor(playerData, enemyData) {
    this.player = new Combatant({ ...playerData, faction: 'player' });
    this.enemy = new Combatant({ ...enemyData, faction: enemyData.faction || 'hostile' });
    
    this.turnCount = 0;
    this.combatLog = [];
    this.isPlayerTurn = false;
    this.combatActive = true;
    this.winner = null;
    
    // Determine initiative (who goes first)
    this.determineInitiative();
  }
  
  determineInitiative() {
    const playerRoll = this.player.initiative + Math.floor(Math.random() * 20);
    const enemyRoll = this.enemy.initiative + Math.floor(Math.random() * 20);
    
    this.isPlayerTurn = playerRoll >= enemyRoll;
    
    this.addLog({
      type: 'initiative',
      message: this.isPlayerTurn 
        ? `${this.player.name} wins initiative!`
        : `${this.enemy.name} strikes first!`,
      playerRoll,
      enemyRoll
    });
  }
  
  addLog(entry) {
    this.combatLog.push({
      turn: this.turnCount,
      timestamp: Date.now(),
      ...entry
    });
  }
  
  // Player executes an action
  executePlayerAction(action, targetId = null) {
    if (!this.isPlayerTurn || !this.combatActive) {
      return { success: false, message: 'Not player turn or combat ended' };
    }
    
    const result = this.executeAction(this.player, this.enemy, action);
    
    if (result.success) {
      this.endTurn();
    }
    
    return result;
  }
  
  // Execute AI turn
  executeAITurn() {
    if (this.isPlayerTurn || !this.combatActive) return;
    
    const action = this.selectAIAction(this.enemy, this.player);
    const result = this.executeAction(this.enemy, this.player, action);
    
    this.addLog({
      type: 'ai_action',
      message: `${this.enemy.name} uses ${action.name}`,
      result
    });
    
    this.endTurn();
    
    return result;
  }
  
  // Execute an action from attacker to target
  executeAction(attacker, target, action) {
    const result = { success: true, action: action.type };
    
    switch (action.type) {
      case 'attack': {
        const weapon = attacker.weapons.find(w => w.id === action.weaponId);
        if (!weapon) {
          return { success: false, message: 'Weapon not found' };
        }
        
        // Deduct energy
        attacker.currentEnergy -= action.energyCost;
        
        // Roll to hit
        const hitRoll = Math.random() * 100;
        const hitChance = weapon.accuracy - target.evasion;
        
        if (hitRoll <= hitChance) {
          // Hit! Calculate damage
          const baseDamage = weapon.damage.min + Math.random() * (weapon.damage.max - weapon.damage.min);
          const damageResult = target.takeDamage(baseDamage, weapon.shieldPenetration);
          
          result.hit = true;
          result.damage = damageResult;
          result.message = `${attacker.name} hits ${target.name} for ${Math.round(damageResult.totalDamage)} damage!`;
          
          this.addLog({
            type: 'attack',
            attacker: attacker.name,
            target: target.name,
            weapon: weapon.name,
            hit: true,
            damage: damageResult
          });
        } else {
          // Miss!
          result.hit = false;
          result.message = `${attacker.name} misses ${target.name}!`;
          
          this.addLog({
            type: 'attack',
            attacker: attacker.name,
            target: target.name,
            weapon: weapon.name,
            hit: false
          });
        }
        
        // Set weapon cooldown
        weapon.cooldown = weapon.maxCooldown;
        break;
      }
      
      case 'defend': {
        attacker.currentEnergy -= action.energyCost;
        attacker.evasion = Math.round(attacker.evasion * 1.3);
        
        result.message = `${attacker.name} takes evasive maneuvers!`;
        this.addLog({
          type: 'defend',
          combatant: attacker.name,
          evasionBoost: 30
        });
        break;
      }
      
      case 'boost_shields': {
        attacker.currentEnergy -= action.energyCost;
        const boost = attacker.maxShields * 0.2;
        attacker.currentShields = Math.min(attacker.maxShields, attacker.currentShields + boost);
        
        result.message = `${attacker.name} boosts shields by ${Math.round(boost)}%!`;
        this.addLog({
          type: 'boost_shields',
          combatant: attacker.name,
          shieldBoost: boost
        });
        break;
      }
      
      case 'overcharge': {
        attacker.currentEnergy -= action.energyCost;
        attacker.statusEffects.push({ type: 'overcharged', duration: 1, damageBonus: 1.5 });
        
        result.message = `${attacker.name} overcharges weapons!`;
        this.addLog({
          type: 'overcharge',
          combatant: attacker.name
        });
        break;
      }
      
      default:
        result.success = false;
        result.message = 'Unknown action type';
    }
    
    return result;
  }
  
  // AI decision making
  selectAIAction(ai, target) {
    const availableActions = ai.getAvailableActions();
    
    if (availableActions.length === 0) {
      // No energy, skip turn
      return { type: 'skip', name: 'Recharge', energyCost: 0 };
    }
    
    // AI strategy based on profile
    switch (ai.aiProfile) {
      case 'aggressive': {
        // Always attack if possible
        const attacks = availableActions.filter(a => a.type === 'attack');
        if (attacks.length > 0) {
          return attacks[Math.floor(Math.random() * attacks.length)];
        }
        break;
      }
      
      case 'defensive': {
        // Boost shields if low
        if (ai.currentShields < ai.maxShields * 0.5) {
          const boostAction = availableActions.find(a => a.type === 'boost_shields');
          if (boostAction) return boostAction;
        }
        break;
      }
      
      case 'tactical': {
        // Use overcharge when shields are down
        if (target.currentShields === 0) {
          const overchargeAction = availableActions.find(a => a.type === 'overcharge');
          if (overchargeAction) return overchargeAction;
        }
        break;
      }
    }
    
    // Default: random attack or defend
    const attacks = availableActions.filter(a => a.type === 'attack');
    if (attacks.length > 0 && Math.random() > 0.3) {
      return attacks[0];
    }
    
    return availableActions[0];
  }
  
  // End current turn and switch to next combatant
  endTurn() {
    // Regenerate resources
    const currentCombatant = this.isPlayerTurn ? this.player : this.enemy;
    currentCombatant.regenerateShields();
    currentCombatant.regenerateEnergy();
    currentCombatant.updateCooldowns();
    currentCombatant.updateStatusEffects();
    
    // Check for combat end
    if (!this.player.isAlive()) {
      this.endCombat('enemy');
      return;
    }
    
    if (!this.enemy.isAlive()) {
      this.endCombat('player');
      return;
    }
    
    // Switch turns
    this.isPlayerTurn = !this.isPlayerTurn;
    this.turnCount++;
    
    this.addLog({
      type: 'turn_end',
      message: `Turn ${this.turnCount} begins`,
      activePlayer: this.isPlayerTurn ? this.player.name : this.enemy.name
    });
  }
  
  // End combat
  endCombat(winner) {
    this.combatActive = false;
    this.winner = winner;
    
    this.addLog({
      type: 'combat_end',
      message: winner === 'player' 
        ? `Victory! ${this.enemy.name} destroyed!`
        : `Defeat! ${this.player.name} destroyed!`,
      winner
    });
  }
  
  // Get current combat state for UI
  getState() {
    return {
      turnCount: this.turnCount,
      isPlayerTurn: this.isPlayerTurn,
      combatActive: this.combatActive,
      winner: this.winner,
      player: {
        name: this.player.name,
        type: this.player.type,
        currentHull: this.player.currentHull,
        maxHull: this.player.maxHull,
        currentShields: this.player.currentShields,
        maxShields: this.player.maxShields,
        currentEnergy: this.player.currentEnergy,
        maxEnergy: this.player.maxEnergy,
        statusEffects: this.player.statusEffects
      },
      enemy: {
        name: this.enemy.name,
        type: this.enemy.type,
        currentHull: this.enemy.currentHull,
        maxHull: this.enemy.maxHull,
        currentShields: this.enemy.currentShields,
        maxShields: this.enemy.maxShields,
        currentEnergy: this.enemy.currentEnergy,
        maxEnergy: this.enemy.maxEnergy,
        statusEffects: this.enemy.statusEffects
      },
      combatLog: this.combatLog,
      availableActions: this.isPlayerTurn ? this.player.getAvailableActions() : []
    };
  }
}

/**
 * Create enemy combatant from template
 */
export function createEnemy(template) {
  const templates = {
    pirate_fighter: {
      name: 'Pirate Fighter',
      type: 'fighter',
      faction: 'pirate',
      maxHull: 60,
      maxShields: 40,
      initiative: 12,
      evasion: 15,
      accuracy: 75,
      weapons: [
        {
          id: 'autocannon',
          name: 'Autocannon',
          type: 'kinetic',
          damage: { min: 10, max: 20 },
          shieldPenetration: 0.1,
          accuracy: 80,
          cooldown: 0,
          maxCooldown: 1,
          energyCost: 8
        }
      ],
      armor: 5,
      maxEnergy: 80,
      aiProfile: 'aggressive'
    },
    
    corporate_patrol: {
      name: 'Corporate Patrol Ship',
      type: 'ship',
      faction: 'corporate',
      maxHull: 100,
      maxShields: 80,
      initiative: 8,
      evasion: 5,
      accuracy: 85,
      weapons: [
        {
          id: 'pulse_laser',
          name: 'Pulse Laser',
          type: 'energy',
          damage: { min: 15, max: 25 },
          shieldPenetration: 0.4,
          accuracy: 85,
          cooldown: 0,
          maxCooldown: 1,
          energyCost: 12
        }
      ],
      armor: 12,
      maxEnergy: 100,
      aiProfile: 'balanced'
    },
    
    alien_drone: {
      name: 'Unknown Drone',
      type: 'drone',
      faction: 'alien',
      maxHull: 40,
      maxShields: 60,
      shieldRegenRate: 10,
      initiative: 15,
      evasion: 20,
      accuracy: 70,
      weapons: [
        {
          id: 'plasma_burst',
          name: 'Plasma Burst',
          type: 'plasma',
          damage: { min: 20, max: 30 },
          shieldPenetration: 0.5,
          accuracy: 70,
          cooldown: 0,
          maxCooldown: 2,
          energyCost: 15
        }
      ],
      armor: 3,
      maxEnergy: 120,
      energyRegenRate: 20,
      aiProfile: 'tactical'
    }
  };
  
  return templates[template] || templates.pirate_fighter;
}
