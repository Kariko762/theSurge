/**
 * AI Combat Engine
 * Main decision-making system for NPC ship combat behavior
 * Combines personality traits, veteran rank, and tactical analysis
 */

import { getPersonality, getDynamicWeights, getActionPreference } from './AIPersonality.js';
import { getAIQuality, shouldMakeMistake, shouldWasteAction } from './VeteranSystem.js';
import { ThreatAssessment } from './ThreatAssessment.js';
import { getOptimalRangeBand } from '../distanceBands.js';
import { AIDecisionTree } from './AIDecisionTree.js';

export class AICombatEngine {
  /**
   * Create AI combat decision engine
   * @param {object} ship - Ship combatant object { ship, id, faction }
   * @param {string} personalityType - Personality key (AGGRESSIVE, CAUTIOUS, etc.)
   * @param {string} veteranRank - Veteran rank key (ROOKIE, TRAINED, etc.)
   */
  constructor(ship, personalityType = 'TACTICAL', veteranRank = 'TRAINED') {
    this.ship = ship;
    this.personality = getPersonality(personalityType);
    this.veteranRank = veteranRank;
    this.aiQuality = getAIQuality(veteranRank);
    this.threatAssessment = new ThreatAssessment();
    
    // Memory (for learning/adaptation)
    this.lastAction = null;
    this.lastTarget = null;
    this.roundsSinceHit = 0;
  }

  // ==========================================================================
  // MAIN DECISION LOOP
  // ==========================================================================

  /**
   * Decide actions for this turn
   * @param {object} combatState - CombatStateManager instance
   * @returns {object} Action plan
   */
  async decideTurn(combatState) {
    try {
      console.log(`[AICombat] Starting turn decision for ${this.ship.id}`);
      console.log(`[AICombat] Ship object keys:`, Object.keys(this.ship));
      
      // Create timeout promise (5 second max)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('AI decision timeout - exceeded 5 seconds')), 5000)
      );
      
      // Use new modular decision tree
      const decisionPromise = (async () => {
        const decisionTree = new AIDecisionTree(
          this.ship,
          combatState,
          this.personality,
          this.veteranRank
        );
        return await decisionTree.executeDecisionWorkflow();
      })();
      
      // Race between decision and timeout
      const decision = await Promise.race([decisionPromise, timeoutPromise]);
      
      console.log(`[AICombat] Decision complete for ${this.ship.id}:`, decision.strategy);
      
      // Convert decision tree output to action plan format
      return {
        strategy: decision.strategy,
        targetId: decision.targetId,
        movement: decision.movement,
        actions: decision.actions,
        bonusActions: decision.bonusActions,
        finalMovement: decision.finalMovement,
        logs: decision.logs,
        summary: decision.summary // Pass through decision summary for UI display
      };
    } catch (error) {
      console.error(`[AICombat] CRITICAL ERROR in decideTurn for ${this.ship.id}:`, error);
      console.error(`[AICombat] Stack trace:`, error.stack);
      console.error(`[AICombat] Ship object:`, this.ship);
      
      // Return safe fallback
      return {
        strategy: 'DEFENSIVE_STAND',
        targetId: null,
        movement: null,
        actions: [],
        bonusActions: [],
        finalMovement: null,
        logs: [`ERROR: ${error.message}`]
      };
    }
  }

  // ==========================================================================
  // SITUATION ASSESSMENT
  // ==========================================================================

  /**
   * Assess current tactical situation
   * @param {object} combatState - Combat state
   * @returns {object} Situation analysis
   */
  assessSituation(combatState) {
    const myStats = this.ship.ship.calculateCombatStats();
    const enemies = combatState.getEnemies(this.ship.id);
    const allies = combatState.getAllies(this.ship.id);
    
    // Self status
    const myHP = myStats.maxHull; // TODO: Use current HP when damage tracking added
    const myShields = myStats.maxShields;
    const myHPPercent = 100; // Placeholder
    
    // Analyze each enemy
    const enemyAnalyses = enemies.map(enemy => {
      const distance = combatState.positioning.getDistance(this.ship.id, enemy.id);
      const analysis = this.threatAssessment.analyzeEnemy(enemy, this.ship, distance);
      
      return {
        enemy,
        distance,
        distanceBand: combatState.positioning.getDistanceBandKey(this.ship.id, enemy.id),
        ...analysis
      };
    });
    
    // Tactical factors
    const outnumbered = this.threatAssessment.isOutnumbered(allies, enemies);
    const hasAdvantage = this.threatAssessment.hasAdvantage(
      this.ship, 
      enemies, 
      combatState.positioning
    );
    
    // Check if at optimal range
    const primaryTarget = enemyAnalyses.length > 0 ? enemyAnalyses[0].enemy : null;
    const optimalRange = primaryTarget 
      ? this.threatAssessment.isAtOptimalRange(this.ship, primaryTarget, combatState.positioning)
      : false;
    
    // Can flee?
    const canFlee = this.canFleeSuccessfully(enemyAnalyses, myStats);
    
    return {
      // Self
      myHP: myHPPercent,
      myShields,
      myStats,
      
      // Enemies
      enemies: enemyAnalyses,
      enemyCount: enemies.length,
      totalEnemyThreat: enemyAnalyses.reduce((sum, e) => sum + e.overallThreat, 0),
      
      // Tactical
      outnumbered,
      hasAdvantage,
      optimalRange,
      canFlee,
      
      // Allies
      allies,
      allyCount: allies.length
    };
  }

  /**
   * Check if can flee successfully
   * @param {Array} enemyAnalyses - Enemy threat analyses
   * @param {object} myStats - My combat stats
   * @returns {boolean}
   */
  canFleeSuccessfully(enemyAnalyses, myStats) {
    // Can flee if faster than all enemies
    const fasterThanAll = enemyAnalyses.every(e => {
      const enemySpeed = e.enemy.ship.calculateCombatStats().speed;
      return myStats.speed > enemySpeed;
    });
    
    return fasterThanAll;
  }

  // ==========================================================================
  // STRATEGIC DECISIONS (Fight/Flee/Negotiate)
  // ==========================================================================

  /**
   * Decide overall strategy
   * @param {object} situation - Situation assessment
   * @returns {string} Strategy ('FIGHT', 'FLEE', 'NEGOTIATE')
   */
  decideStrategy(situation) {
    const scores = {
      FIGHT: 0,
      FLEE: 0,
      NEGOTIATE: 0
    };
    
    // Get dynamic weights based on situation
    const weights = getDynamicWeights(this.personality, situation);
    
    // Base scoring from personality
    scores.FIGHT += weights.attack * 100;
    scores.FLEE += weights.retreat * 100;
    scores.NEGOTIATE += (weights.negotiate || 0) * 100;
    
    // HP-based modifiers
    if (situation.myHP < this.personality.thresholds.retreatHP) {
      scores.FLEE += 200;
      scores.FIGHT -= 100;
    }
    
    // Outnumbered penalty
    if (situation.outnumbered) {
      scores.FLEE += 50 * weights.retreat;
      scores.FIGHT -= 30;
    }
    
    // Advantage bonus
    if (situation.hasAdvantage) {
      scores.FIGHT += 50;
      scores.FLEE -= 30;
    }
    
    // Can't flee modifier
    if (!situation.canFlee) {
      scores.FLEE = 0;
      scores.FIGHT += 50;
    }
    
    // Cornered trader response
    if (this.personality.name === 'Trader/Neutral' && !situation.canFlee && situation.myHP < 30) {
      scores.FIGHT += 150; // Desperate
    }
    
    // No enemies = flee or negotiate
    if (situation.enemyCount === 0) {
      return 'FLEE';
    }
    
    // Return highest scoring strategy
    return Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
  }

  // ==========================================================================
  // TACTICAL DECISION MAKING
  // ==========================================================================

  /**
   * Decide tactical actions (movement, attacks, bonuses)
   * @param {object} situation - Situation assessment
   * @param {object} combatState - Combat state
   * @returns {object} Action plan
   */
  decideTacticalActions(situation, combatState) {
    const plan = {
      movement: null,
      actions: [],
      bonusActions: [],
      targetId: null,
      reasons: [],
      scores: {}
    };
    
    // 1. TARGET SELECTION
    const target = this.selectTarget(situation, combatState);
    if (!target) {
      // No valid targets, retreat
      return this.planFlee(situation, combatState);
    }
    
    plan.targetId = target.enemy.id;
    
    // 2. MOVEMENT DECISION (risk-aware)
    plan.movement = this.decideMovementRiskAware(target, situation, combatState, plan);
    
    // 3. ACTION PRIORITY (utility scoring)
    const { ordered, reasons, scores } = this.scoreAndSelectActions(target, situation, combatState);
    plan.actions = ordered;
    plan.reasons.push(...reasons);
    plan.scores = { ...plan.scores, ...scores };
    
    // 4. BONUS ACTIONS
    const bonus = this.decideBonusActions(target, situation, combatState);
    plan.bonusActions = bonus.actions;
    if (bonus.reasons) plan.reasons.push(...bonus.reasons);
    
    return plan;
  }

  // ==========================
  // RISK/UTILITY ESTIMATION
  // ==========================

  parseAverageDamage(damageStr) {
    const m = (damageStr || '').match(/(\d+)d(\d+)(?:\+(\d+))?/);
    if (!m) return 0;
    const n = parseInt(m[1]);
    const d = parseInt(m[2]);
    const k = parseInt(m[3] || 0);
    return n * (d + 1) / 2 + k;
  }

  clamp01(x) { return Math.max(0, Math.min(1, x)); }

  estimateHitChance(attackerStats, defenderStats, weapon, bandKey) {
    const rangeMod = weapon.rangeModifiers?.[bandKey];
    if (rangeMod === null || rangeMod === undefined) return 0;
    const bonuses = (attackerStats.attackBonus || 0) + (weapon.attackBonus || 0) + (rangeMod || 0);
    const SR_BASE = 18;
    const BASE_TN = 15;
    const targetSR = defenderStats.signatureRadius;
    const targetTN = BASE_TN + (SR_BASE - targetSR);
    // need roll >= targetTN - bonuses on d20
    const needed = targetTN - bonuses;
    const p = this.clamp01((21 - needed) / 20);
    return Math.max(0.05, Math.min(0.95, p));
  }

  estimateExpectedDamage(attackerStats, defenderStats, weapon, bandKey) {
    const hit = this.estimateHitChance(attackerStats, defenderStats, weapon, bandKey);
    const avg = this.parseAverageDamage(weapon.damage);
    const rof = weapon.rateOfFire || 1;
    const base = hit * avg * rof;
    // Crit bonus: approximate extra damage from doubling dice
    const critChance = (21 - (weapon.critRange || 20)) / 20; // e.g., 20 -> .05
    const critBonus = Math.max(0, critChance) * avg; // extra damage on top of base
    return base + critBonus;
  }

  estimateIncomingDamageToMe(situation, combatState) {
    const myStats = situation.myStats;
    const me = this.ship;
    let expected = 0;
    for (const e of situation.enemies) {
      const enemyStats = e.enemy.ship.calculateCombatStats();
      const band = e.distanceBand;
      for (const w of enemyStats.weapons || []) {
        expected += this.estimateExpectedDamage(enemyStats, myStats, w, band);
      }
    }
    return expected; // per round approximation
  }

  // ==========================
  // MOVEMENT (RISK-AWARE)
  // ==========================

  decideMovementRiskAware(target, situation, combatState, plan) {
    const myStats = situation.myStats;
    const defenderStats = target.enemy.ship.calculateCombatStats();
    const primaryWeapon = myStats.weapons[0];
    if (!primaryWeapon) return null;

    const currentBand = target.distanceBand;
    const bandOrder = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
    const idx = bandOrder.indexOf(currentBand);
    const closerBand = bandOrder[Math.max(0, idx - 1)];
    const fartherBand = bandOrder[Math.min(bandOrder.length - 1, idx + 1)];

    // Offensive deltas
    const dprCurrent = this.estimateExpectedDamage(myStats, defenderStats, primaryWeapon, currentBand);
    const dprCloser = this.estimateExpectedDamage(myStats, defenderStats, primaryWeapon, closerBand);
    const dprFarther = this.estimateExpectedDamage(myStats, defenderStats, primaryWeapon, fartherBand);

    // Incoming threat approximation: being closer tends to increase threat
    const incoming = this.estimateIncomingDamageToMe(situation, combatState);
    const proximityFactor = { POINT_BLANK: 1.5, CLOSE: 1.2, MEDIUM: 1.0, LONG: 0.8, EXTREME: 0.6 };
    const incomingCurrent = incoming * (proximityFactor[currentBand] || 1.0);
    const incomingCloser = incoming * (proximityFactor[closerBand] || 1.0);
    const incomingFarther = incoming * (proximityFactor[fartherBand] || 1.0);

    const weights = getDynamicWeights(this.personality, situation);
    const riskTolerance = this.personality.thresholds.riskTolerance ?? 0.5;
    const riskPenalty = 1.0 + (0.5 - riskTolerance); // higher tolerance -> lower penalty

    const scoreCloser = (dprCloser - dprCurrent) * (weights.attack || 1) - (incomingCloser - incomingCurrent) * riskPenalty;
    const scoreFarther = (dprFarther - dprCurrent) * (weights.attack || 1) - (incomingFarther - incomingCurrent) * riskPenalty;

    plan.reasons.push({
      kind: 'movement-eval',
      currentBand,
      dpr: { current: dprCurrent, closer: dprCloser, farther: dprFarther },
      incoming: { current: Math.round(incomingCurrent), closer: Math.round(incomingCloser), farther: Math.round(incomingFarther) },
      scores: { closer: Math.round(scoreCloser), farther: Math.round(scoreFarther) }
    });

    if (scoreCloser > 10 && currentBand !== 'POINT_BLANK') {
      return { action: 'MOVE_CLOSER', targetId: target.enemy.id, movementPoints: 100, reason: 'Increase DPR outweighs added risk' };
    }
    if (scoreFarther > 10 && currentBand !== 'EXTREME') {
      return { action: 'MOVE_FARTHER', targetId: target.enemy.id, movementPoints: 100, reason: 'Reduce incoming threat with minimal DPR loss' };
    }
    return null;
  }

  // ==========================
  // ACTION SCORING
  // ==========================

  scoreAndSelectActions(target, situation, combatState) {
    const scores = {};
    const reasons = [];
    const myStats = situation.myStats;
    const defenderStats = target.enemy.ship.calculateCombatStats();
    const band = target.distanceBand;
    const weights = getDynamicWeights(this.personality, situation);
    const riskTolerance = this.personality.thresholds.riskTolerance ?? 0.5;
    const riskPenalty = 1.0 + (0.5 - riskTolerance);

    // FIRE_WEAPON (primary)
    if ((myStats.weapons || []).length > 0) {
      const w = myStats.weapons[0];
      const expected = this.estimateExpectedDamage(myStats, defenderStats, w, band);
      const incoming = this.estimateIncomingDamageToMe(situation, combatState);
      const s = expected * (weights.attack || 1) - incoming * 0.0; // do not double-penalize here; movement accounts for risk
      scores.FIRE_WEAPON = Math.round(s);
      reasons.push({ kind: 'action-eval', action: 'FIRE_WEAPON', band, expectedDamage: Math.round(expected), score: Math.round(s) });
    }

    // EVASIVE_MANEUVERS: reduce expected incoming
    {
      const incoming = this.estimateIncomingDamageToMe(situation, combatState);
      const mitigated = incoming * 0.25; // assume ~25% less chance to be hit for a round
      const s = mitigated * riskPenalty * (weights.evasive || 1);
      scores.EVASIVE_MANEUVERS = Math.round(s);
      reasons.push({ kind: 'action-eval', action: 'EVASIVE_MANEUVERS', mitigated: Math.round(mitigated), score: Math.round(s) });
    }

    // SCAN_TARGET: modest offensive support
    if (this.aiQuality.usesAdvancedTactics) {
      const s = 15 * (weights.scanEnemy || 1);
      scores.SCAN_TARGET = Math.round(s);
      reasons.push({ kind: 'action-eval', action: 'SCAN_TARGET', score: Math.round(s) });
    }

    // EMERGENCY_REPAIR when low HP
    if (situation.myHP < 50) {
      const s = (60 - situation.myHP) * (weights.evasive || 1);
      scores.EMERGENCY_REPAIR = Math.round(s);
      reasons.push({ kind: 'action-eval', action: 'EMERGENCY_REPAIR', score: Math.round(s) });
    }

    const ordered = Object.entries(scores).sort((a,b) => b[1]-a[1]).map(([k]) => k).slice(0,2);
    return { ordered, reasons, scores };
  }

  /**
   * Select primary target
   * @param {object} situation - Situation
   * @param {object} combatState - Combat state
   * @returns {object} Target analysis
   */
  selectTarget(situation, combatState) {
    if (situation.enemies.length === 0) return null;
    
    const strategy = this.aiQuality.targetPriority;
    const enemies = situation.enemies.map(e => e.enemy);
    
    const targetShip = this.threatAssessment.selectTarget(
      enemies,
      this.ship,
      combatState.positioning,
      strategy
    );
    
    // Find the analysis for this target
    return situation.enemies.find(e => e.enemy.id === targetShip.id);
  }

  /**
   * Decide movement action
   * @param {object} target - Target analysis
   * @param {object} situation - Situation
   * @param {object} combatState - Combat state
   * @returns {object} Movement plan
   */
  decideMovement(target, situation, combatState) {
    const currentBand = target.distanceBand;
    const myStats = situation.myStats;
    
    // Get optimal range for primary weapon
    const primaryWeapon = myStats.weapons[0];
    if (!primaryWeapon) {
      return null; // No weapons, no point moving
    }
    
    const optimalBand = getOptimalRangeBand(primaryWeapon);
    
    // Personality-based movement preferences
    const weights = getDynamicWeights(this.personality, situation);
    
    // Aggressive: close in
    if (weights.closeDistance > 1.2 && currentBand !== 'POINT_BLANK') {
      return {
        action: 'MOVE_CLOSER',
        targetId: target.enemy.id,
        movementPoints: 100
      };
    }
    
    // Cautious: keep distance
    if (weights.keepDistance > 1.2 && (currentBand === 'POINT_BLANK' || currentBand === 'CLOSE')) {
      return {
        action: 'MOVE_FARTHER',
        targetId: target.enemy.id,
        movementPoints: 100
      };
    }
    
    // Tactical: move to optimal range
    if (weights.optimalRange > 1.0 && currentBand !== optimalBand) {
      const shouldMoveCloser = this.shouldMoveToOptimalRange(currentBand, optimalBand);
      return {
        action: shouldMoveCloser ? 'MOVE_CLOSER' : 'MOVE_FARTHER',
        targetId: target.enemy.id,
        movementPoints: 50
      };
    }
    
    // Stay at current range
    return null;
  }

  /**
   * Check if should move closer to reach optimal range
   * @param {string} currentBand - Current distance band
   * @param {string} optimalBand - Optimal distance band
   * @returns {boolean}
   */
  shouldMoveToOptimalRange(currentBand, optimalBand) {
    const bandOrder = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
    const currentIndex = bandOrder.indexOf(currentBand);
    const optimalIndex = bandOrder.indexOf(optimalBand);
    
    return optimalIndex < currentIndex;
  }

  /**
   * Prioritize combat actions
   * @param {object} target - Target analysis
   * @param {object} situation - Situation
   * @param {object} combatState - Combat state
   * @returns {Array} Ordered actions
   */
  prioritizeActions(target, situation, combatState) {
    const actions = [];
    const actionScores = {};
    const myStats = situation.myStats;
    const band = target.distanceBand;
    const hasReach = (myStats.weapons || []).some(w => {
      const mod = w.rangeModifiers?.[band];
      return mod !== null && mod !== undefined;
    });
    
    // Score FIRE_WEAPON
    if (target.canIHitThem || hasReach) {
      const fireScore = getActionPreference(this.personality, 'FIRE_WEAPON') * 100;
      actionScores.FIRE_WEAPON = fireScore;
    }
    
    // Score EVASIVE_MANEUVERS (if under fire or low HP)
    if (situation.myHP < 50 || target.canHitMe) {
      const evasiveScore = getActionPreference(this.personality, 'EVASIVE_MANEUVERS') * 80;
      actionScores.EVASIVE_MANEUVERS = evasiveScore;
    }
    
    // Score SCAN_TARGET (tactical/elite behavior)
    if (this.aiQuality.usesAdvancedTactics) {
      const scanScore = getActionPreference(this.personality, 'SCAN_TARGET') * 60;
      actionScores.SCAN_TARGET = scanScore;
    }
    
    // Score EMERGENCY_REPAIR (if damaged)
    if (situation.myHP < 40) {
      const repairScore = getActionPreference(this.personality, 'EMERGENCY_REPAIR') * 70;
      actionScores.EMERGENCY_REPAIR = repairScore;
    }
    
    // Sort by score
    const sortedActions = Object.entries(actionScores)
      .sort((a, b) => b[1] - a[1])
      .map(([action]) => action);
    
    // Return top 2 actions (we have 2 actions per turn typically)
    return sortedActions.slice(0, 2);
  }

  /**
   * Decide bonus actions
   * @param {object} target - Target analysis
   * @param {object} situation - Situation
   * @param {object} combatState - Combat state
   * @returns {Array} Bonus actions
   */
  decideBonusActions(target, situation, combatState) {
    const actions = [];
    const reasons = [];
    const weights = getDynamicWeights(this.personality, situation);
    const incoming = this.estimateIncomingDamageToMe(situation, combatState);

    // BOOST_SHIELDS if shields low or incoming is high
    if (situation.myShields < 50 || incoming > 20) {
      const score = getActionPreference(this.personality, 'BOOST_SHIELDS') * (1 + incoming / 40);
      if (score > 1.0) {
        actions.push('BOOST_SHIELDS');
        reasons.push({ kind: 'bonus-eval', action: 'BOOST_SHIELDS', reason: 'High incoming threat or low shields' });
      }
    }

    // TARGET_LOCK for tactical AI
    if (this.aiQuality.usesAdvancedTactics && target.canIHitThem) {
      actions.push('TARGET_LOCK');
      reasons.push({ kind: 'bonus-eval', action: 'TARGET_LOCK', reason: 'Improve next attack accuracy' });
    }

    return { actions, reasons };
  }

  // ==========================================================================
  // FLEE & NEGOTIATE PLANS
  // ==========================================================================

  /**
   * Plan flee action
   * @param {object} situation - Situation
   * @param {object} combatState - Combat state
   * @returns {object} Flee plan
   */
  planFlee(situation, combatState) {
    // Find farthest enemy to move away from
    const farthestEnemy = situation.enemies.reduce((farthest, e) => {
      return e.distance > (farthest?.distance || 0) ? e : farthest;
    }, null);
    
    return {
      movement: farthestEnemy ? {
        action: 'MOVE_FARTHER',
        targetId: farthestEnemy.enemy.id,
        movementPoints: 150 // Max movement
      } : null,
      actions: ['EVASIVE_MANEUVERS'],
      bonusActions: ['BOOST_SHIELDS'],
      strategy: 'FLEE'
    };
  }

  /**
   * Plan negotiate action
   * @param {object} situation - Situation
   * @param {object} combatState - Combat state
   * @returns {object} Negotiate plan
   */
  planNegotiate(situation, combatState) {
    // TODO: Implement negotiation system
    // For now, just defensive posture
    return {
      movement: null,
      actions: [],
      bonusActions: ['BOOST_SHIELDS'],
      strategy: 'NEGOTIATE'
    };
  }

  // ==========================================================================
  // MISTAKE & SUBOPTIMAL DECISIONS (Rookie Behavior)
  // ==========================================================================

  /**
   * Make a poor tactical decision (rookie mistake)
   * @param {object} situation - Situation
   * @param {object} combatState - Combat state
   * @returns {object} Suboptimal action plan
   */
  makeSuboptimalDecision(situation, combatState) {
    const badChoices = [
      // Attack strongest enemy instead of weakest
      () => {
        const strongestEnemy = situation.enemies.reduce((strongest, e) => {
          return e.overallThreat > (strongest?.overallThreat || 0) ? e : strongest;
        }, null);
        
        return {
          targetId: strongestEnemy?.enemy.id,
          movement: {
            action: 'MOVE_CLOSER',
            targetId: strongestEnemy?.enemy.id,
            movementPoints: 100
          },
          actions: ['FIRE_WEAPON'],
          bonusActions: [],
          mistake: 'Attacked strongest enemy'
        };
      },
      
      // Move to bad range
      () => {
        const target = situation.enemies[0];
        return {
          targetId: target?.enemy.id,
          movement: {
            action: 'MOVE_CLOSER',
            targetId: target?.enemy.id,
            movementPoints: 150
          },
          actions: ['FIRE_WEAPON'],
          bonusActions: [],
          mistake: 'Moved to suboptimal range'
        };
      },
      
      // Waste action on scan when should be shooting
      () => {
        const target = situation.enemies[0];
        return {
          targetId: target?.enemy.id,
          movement: null,
          actions: ['SCAN_TARGET'],
          bonusActions: [],
          mistake: 'Scanned instead of attacking'
        };
      }
    ];
    
    const choice = badChoices[Math.floor(Math.random() * badChoices.length)];
    return choice();
  }

  /**
   * Waste an action (rookie behavior)
   * @param {object} combatState - Combat state
   * @returns {object} Wasted action plan
   */
  makeWastedAction(combatState) {
    return {
      targetId: null,
      movement: null,
      actions: [],
      bonusActions: [],
      mistake: 'Wasted turn doing nothing'
    };
  }

  // ==========================================================================
  // REACTION DECISIONS
  // ==========================================================================

  /**
   * Decide if should use reaction
   * @param {object} triggeringAction - Action that triggered reaction window
   * @param {object} combatState - Combat state
   * @returns {string|null} Reaction type or null
   */
  decideReaction(triggeringAction, combatState) {
    // Check available reactions
    const actions = combatState.getActionsRemaining(this.ship.id);
    if (actions.reactions <= 0) return null;
    
    // If being attacked
    if (triggeringAction.type === 'FIRE_WEAPON' && triggeringAction.target === this.ship.id) {
      // Defensive personalities prefer emergency burn
      if (this.personality.weights.evasive > 1.0) {
        return 'EMERGENCY_BURN';
      }
      
      // Aggressive personalities counterfire
      if (this.personality.weights.attack > 1.2) {
        return 'COUNTERFIRE';
      }
      
      // Elite AI uses point defense if available
      if (this.aiQuality.usesAdvancedTactics) {
        return 'POINT_DEFENSE';
      }
    }
    
    return null;
  }
}
