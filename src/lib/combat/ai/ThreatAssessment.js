/**
 * Threat Assessment Module
 * Analyzes enemy capabilities and tactical situations
 */

import { getDistanceBandKey } from '../distanceBands.js';

export class ThreatAssessment {
  /**
   * Analyze enemy ship's threat level
   * @param {object} enemy - Enemy ship data
   * @param {object} myShip - My ship data
   * @param {number} distance - Distance to enemy
   * @returns {object} Threat analysis
   */
  analyzeEnemy(enemy, myShip, distance) {
    const enemyStats = enemy.ship.calculateCombatStats();
    const myStats = myShip.ship.calculateCombatStats();
    
    return {
      offensiveThreat: this.calculateOffensiveThreat(enemyStats, distance),
      defensiveStrength: this.calculateDefensiveStrength(enemyStats),
      mobilityThreat: this.calculateMobilityThreat(enemyStats, myStats),
      overallThreat: this.calculateOverallThreat(enemyStats, myStats, distance),
      canHitMe: this.canEnemyHitMe(enemyStats, myStats, distance),
      canIHitThem: this.canIHitEnemy(myStats, enemyStats, distance)
    };
  }

  /**
   * Calculate offensive threat (damage potential)
   * @param {object} enemyStats - Enemy combat stats
   * @param {number} distance - Distance to enemy
   * @returns {number} Threat score
   */
  calculateOffensiveThreat(enemyStats, distance) {
    let threat = 0;
    const distanceBand = getDistanceBandKey(distance);
    
    // Analyze each weapon
    enemyStats.weapons.forEach(weapon => {
      // Parse average damage
      const avgDamage = this.parseAverageDamage(weapon.damage);
      
      // Factor in rate of fire
      const damagePerTurn = avgDamage * (weapon.rateOfFire || 1);
      
      // Factor in attack bonus (accuracy)
      const accuracyMultiplier = 1 + (weapon.attackBonus / 10);
      
      // Factor in range modifier
      const rangeModifier = weapon.rangeModifiers?.[distanceBand];
      const rangeMultiplier = rangeModifier !== null ? (1 + rangeModifier / 10) : 0;
      
      threat += damagePerTurn * accuracyMultiplier * rangeMultiplier;
    });
    
    // Factor in ship's overall attack bonus
    threat *= (1 + enemyStats.attackBonus / 10);
    
    return Math.round(threat);
  }

  /**
   * Calculate defensive strength (survivability)
   * @param {object} stats - Ship stats
   * @returns {number} Defense score
   */
  calculateDefensiveStrength(stats) {
    const hp = stats.maxHull + stats.maxShields;
    const avoidance = stats.signatureRadius; // Lower SR = harder to hit
    const armor = stats.armor || 0;
    
    // Higher defense score = harder to kill
    return Math.round(hp * (1 + armor / 100) * (50 / Math.max(avoidance, 10)));
  }

  /**
   * Calculate mobility threat (speed and maneuverability)
   * @param {object} enemyStats - Enemy stats
   * @param {object} myStats - My stats
   * @returns {number} Mobility score
   */
  calculateMobilityThreat(enemyStats, myStats) {
    const speedDiff = enemyStats.speed - myStats.speed;
    const evasionDiff = enemyStats.evasion - myStats.evasion;
    
    // Positive = enemy is faster/more maneuverable (threat)
    return Math.round(speedDiff * 0.5 + evasionDiff * 5);
  }

  /**
   * Calculate overall threat rating
   * @param {object} enemyStats - Enemy stats
   * @param {object} myStats - My stats
   * @param {number} distance - Distance to enemy
   * @returns {number} Overall threat (0-100+)
   */
  calculateOverallThreat(enemyStats, myStats, distance) {
    const offensive = this.calculateOffensiveThreat(enemyStats, distance);
    const defensive = this.calculateDefensiveStrength(enemyStats);
    const mobility = this.calculateMobilityThreat(enemyStats, myStats);
    
    // Distance modifier (closer = more immediate threat)
    const distanceMod = this.getDistanceModifier(distance);
    
    const baseThreat = offensive * 2 + defensive * 0.5 + mobility;
    return Math.round(baseThreat * distanceMod);
  }

  /**
   * Get distance modifier for threat (closer = more threatening)
   * @param {number} distance - Distance in km
   * @returns {number} Multiplier
   */
  getDistanceModifier(distance) {
    const band = getDistanceBandKey(distance);
    const modifiers = {
      POINT_BLANK: 1.5,
      CLOSE: 1.2,
      MEDIUM: 1.0,
      LONG: 0.7,
      EXTREME: 0.3
    };
    return modifiers[band] || 1.0;
  }

  /**
   * Check if enemy can hit me at current distance
   * @param {object} enemyStats - Enemy stats
   * @param {object} myStats - My stats
   * @param {number} distance - Distance
   * @returns {boolean}
   */
  canEnemyHitMe(enemyStats, myStats, distance) {
    const distanceBand = getDistanceBandKey(distance);
    const avgAttackRoll = 10; // Average d20
    const SR_BASE = 18;
    const BASE_TN = 15;
    const targetSR = myStats.signatureRadius;
    const targetTN = BASE_TN + (SR_BASE - targetSR);

    for (const weapon of enemyStats.weapons) {
      const rangeMod = weapon.rangeModifiers?.[distanceBand];
      if (rangeMod === null || rangeMod === undefined) continue; // out of range
      const totalAttack = avgAttackRoll + (enemyStats.attackBonus || 0) + (weapon.attackBonus || 0) + (rangeMod || 0);
      if (totalAttack >= targetTN - 2) return true; // allow small buffer
    }
    return false;
  }

  /**
   * Check if I can hit enemy at current distance
   * @param {object} myStats - My stats
   * @param {object} enemyStats - Enemy stats
   * @param {number} distance - Distance
   * @returns {boolean}
   */
  canIHitEnemy(myStats, enemyStats, distance) {
    const distanceBand = getDistanceBandKey(distance);
    const avgAttackRoll = 10;
    const SR_BASE = 18;
    const BASE_TN = 15;
    const targetSR = enemyStats.signatureRadius;
    const targetTN = BASE_TN + (SR_BASE - targetSR);

    for (const weapon of myStats.weapons) {
      const rangeMod = weapon.rangeModifiers?.[distanceBand];
      if (rangeMod === null || rangeMod === undefined) continue; // out of range
      const totalAttack = avgAttackRoll + (myStats.attackBonus || 0) + (weapon.attackBonus || 0) + (rangeMod || 0);
      if (totalAttack >= targetTN - 2) return true;
    }
    return false;
  }

  /**
   * Parse average damage from dice notation
   * @param {string} damageStr - Damage string (e.g., "3d8+2")
   * @returns {number} Average damage
   */
  parseAverageDamage(damageStr) {
    const match = damageStr.match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!match) return 0;
    
    const numDice = parseInt(match[1]);
    const dieSize = parseInt(match[2]);
    const modifier = parseInt(match[3] || 0);
    
    // Average of die = (max + min) / 2 = (dieSize + 1) / 2
    const avgPerDie = (dieSize + 1) / 2;
    return numDice * avgPerDie + modifier;
  }

  /**
   * Check if outnumbered
   * @param {Array} allies - Allied ships
   * @param {Array} enemies - Enemy ships
   * @returns {boolean}
   */
  isOutnumbered(allies, enemies) {
    return enemies.length > allies.length + 1; // Outnumbered if 2+ more enemies
  }

  /**
   * Check if we have tactical advantage
   * @param {object} myShip - My ship data
   * @param {Array} enemies - Enemy ships
   * @param {object} positioning - Combat positioning
   * @returns {boolean}
   */
  hasAdvantage(myShip, enemies, positioning) {
    if (enemies.length === 0) return true;
    
    const myStats = myShip.ship.calculateCombatStats();
    const advantageFactors = [];
    
    // Check HP advantage
    const avgEnemyHP = enemies.reduce((sum, e) => {
      const stats = e.ship.calculateCombatStats();
      return sum + stats.maxHull + stats.maxShields;
    }, 0) / enemies.length;
    
    const myHP = myStats.maxHull + myStats.maxShields;
    if (myHP > avgEnemyHP) advantageFactors.push(true);
    
    // Check attack bonus advantage
    const avgEnemyAttack = enemies.reduce((sum, e) => {
      return sum + e.ship.calculateCombatStats().attackBonus;
    }, 0) / enemies.length;
    
    if (myStats.attackBonus > avgEnemyAttack) advantageFactors.push(true);
    
    // Check positioning (at optimal range for weapons)
    const optimalRange = this.isAtOptimalRange(myShip, enemies[0], positioning);
    if (optimalRange) advantageFactors.push(true);
    
    // Need at least 2 of 3 advantages
    return advantageFactors.filter(Boolean).length >= 2;
  }

  /**
   * Check if at optimal weapon range
   * @param {object} myShip - My ship
   * @param {object} target - Target ship
   * @param {object} positioning - Combat positioning
   * @returns {boolean}
   */
  isAtOptimalRange(myShip, target, positioning) {
    if (!target) return false;
    
    const distance = positioning.getDistance(myShip.id, target.id);
    const distanceBand = getDistanceBandKey(distance);
    const myStats = myShip.ship.calculateCombatStats();
    
    if (myStats.weapons.length === 0) return false;
    
    // Check if primary weapon has positive range modifier
    const weapon = myStats.weapons[0];
    const rangeMod = weapon.rangeModifiers?.[distanceBand];
    
    return rangeMod !== null && rangeMod > 0;
  }

  /**
   * Prioritize targets based on threat
   * @param {Array} enemies - Enemy ships
   * @param {object} myShip - My ship
   * @param {object} positioning - Combat positioning
   * @param {string} strategy - Priority strategy
   * @returns {object} Best target
   */
  selectTarget(enemies, myShip, positioning, strategy = 'tactical') {
    if (enemies.length === 0) return null;
    if (enemies.length === 1) return enemies[0];
    
    switch (strategy) {
      case 'random':
        return enemies[Math.floor(Math.random() * enemies.length)];
      
      case 'weakest':
        return this.selectWeakestTarget(enemies);
      
      case 'closest':
        return this.selectClosestTarget(enemies, myShip, positioning);
      
      case 'strongest':
        return this.selectStrongestTarget(enemies);
      
      case 'tactical':
        return this.selectTacticalTarget(enemies, myShip, positioning);
      
      case 'optimal':
        return this.selectOptimalTarget(enemies, myShip, positioning);
      
      default:
        return enemies[0];
    }
  }

  selectWeakestTarget(enemies) {
    return enemies.reduce((weakest, enemy) => {
      const stats = enemy.ship.calculateCombatStats();
      const weakestStats = weakest.ship.calculateCombatStats();
      const hp = stats.maxHull + stats.maxShields;
      const weakestHP = weakestStats.maxHull + weakestStats.maxShields;
      return hp < weakestHP ? enemy : weakest;
    });
  }

  selectClosestTarget(enemies, myShip, positioning) {
    return enemies.reduce((closest, enemy) => {
      const dist = positioning.getDistance(myShip.id, enemy.id);
      const closestDist = positioning.getDistance(myShip.id, closest.id);
      return dist < closestDist ? enemy : closest;
    });
  }

  selectStrongestTarget(enemies) {
    return enemies.reduce((strongest, enemy) => {
      const threat = this.calculateDefensiveStrength(enemy.ship.calculateCombatStats());
      const strongestThreat = this.calculateDefensiveStrength(strongest.ship.calculateCombatStats());
      return threat > strongestThreat ? enemy : strongest;
    });
  }

  selectTacticalTarget(enemies, myShip, positioning) {
    // Prioritize high threat, low HP targets
    return enemies.reduce((best, enemy) => {
      const distance = positioning.getDistance(myShip.id, enemy.id);
      const threat = this.calculateOffensiveThreat(enemy.ship.calculateCombatStats(), distance);
      const defense = this.calculateDefensiveStrength(enemy.ship.calculateCombatStats());
      const score = threat / Math.max(defense, 1);
      
      const bestDist = positioning.getDistance(myShip.id, best.id);
      const bestThreat = this.calculateOffensiveThreat(best.ship.calculateCombatStats(), bestDist);
      const bestDefense = this.calculateDefensiveStrength(best.ship.calculateCombatStats());
      const bestScore = bestThreat / Math.max(bestDefense, 1);
      
      return score > bestScore ? enemy : best;
    });
  }

  selectOptimalTarget(enemies, myShip, positioning) {
    // Multi-factor analysis for elite AI
    return enemies.reduce((best, enemy) => {
      const distance = positioning.getDistance(myShip.id, enemy.id);
      const analysis = this.analyzeEnemy(enemy, myShip, distance);
      
      let score = 0;
      score += analysis.offensiveThreat * 0.4;  // Prioritize dangerous targets
      score -= analysis.defensiveStrength * 0.2; // Prefer softer targets
      score += analysis.canIHitThem ? 50 : 0;     // Must be able to hit
      score -= analysis.canHitMe ? 30 : 0;        // Prefer those who can't retaliate
      
      const bestDist = positioning.getDistance(myShip.id, best.id);
      const bestAnalysis = this.analyzeEnemy(best, myShip, bestDist);
      
      let bestScore = 0;
      bestScore += bestAnalysis.offensiveThreat * 0.4;
      bestScore -= bestAnalysis.defensiveStrength * 0.2;
      bestScore += bestAnalysis.canIHitThem ? 50 : 0;
      bestScore -= bestAnalysis.canHitMe ? 30 : 0;
      
      return score > bestScore ? enemy : best;
    });
  }
}
