/**
 * AI Decision Tree
 * Modular workflow system for AI combat decisions
 * Each workflow logs its reasoning and returns structured decisions
 */

export class AIDecisionTree {
  constructor(ship, combatState, personality, veteranRank) {
    this.ship = ship;
    this.combatState = combatState;
    this.personality = personality;
    this.veteranRank = veteranRank;
    this.logs = [];
    this.recursionDepth = 0; // Prevent infinite loops
    this.maxRecursionDepth = 3;
    
    // Combat history tracking
    if (!ship.combatHistory) {
      ship.combatHistory = {
        attacksMade: 0,
        attacksHit: 0,
        attacksMissed: 0,
        totalDamageDealt: 0,
        timesHit: 0,
        timesMissed: 0,
        totalDamageTaken: 0,
        roundsInCombat: 0
      };
    }
  }

  log(message) {
    this.logs.push(message);
    console.log(`[AI:${this.ship.id}] ${message}`);
    // Use special phase label for decision engine logs
    this.combatState.logWithPhase(`[AI:${this.ship.id}] ${message}`, 'DECISION ENGINE');
  }

  /**
   * MAIN DECISION WORKFLOW
   * Executes all decision phases in order
   */
  async executeDecisionWorkflow() {
    console.log('[AIDecisionTree] executeDecisionWorkflow START');
    this.log('=== BEGINNING TURN DECISION WORKFLOW ===');
    
    // PHASE 1: RISK ASSESSMENT
    console.log('[AIDecisionTree] Calling riskAssessmentWorkflow...');
    const strategy = await this.riskAssessmentWorkflow();
    console.log('[AIDecisionTree] riskAssessmentWorkflow returned:', strategy);
    this.log(`Risk Assessment Result: ${strategy}`);

    // PHASE 1.1: COMMUNICATION (if triggered)
    if (strategy === 'SURRENDER' || strategy === 'TRUCE' || strategy === 'REQUEST_SURRENDER') {
      console.log('[AIDecisionTree] Entering communication phase for:', strategy);
      const diplomacyResult = await this.communicationWorkflow(strategy);
      console.log('[AIDecisionTree] Communication result:', diplomacyResult);
      if (diplomacyResult.success) {
        this.log('Communication succeeded - combat ending');
        return { strategy: diplomacyResult.outcome, actions: [], movement: null, bonusActions: [] };
      }
      // Communication failed - check recursion depth
      this.recursionDepth++;
      if (this.recursionDepth >= this.maxRecursionDepth) {
        this.log('Max recursion depth reached - defaulting to ATTACK strategy');
        // Don't recurse, just continue with ATTACK strategy
        const actionDecision = await this.actionDecisionWorkflow('ATTACK');
        return this.continueWorkflow('ATTACK', actionDecision);
      }
      this.log('Communication failed - returning to RISK ASSESSMENT');
      return await this.executeDecisionWorkflow();
    }

    // PHASE 2: ACTION DECISION
    console.log('[AIDecisionTree] Calling actionDecisionWorkflow with strategy:', strategy);
    const actionDecision = await this.actionDecisionWorkflow(strategy);
    console.log('[AIDecisionTree] Action decision:', actionDecision);
    console.log('[AIDecisionTree] Calling continueWorkflow...');
    return this.continueWorkflow(strategy, actionDecision);
  }

  /**
   * Continue workflow after action decision (extracted to avoid duplication)
   */
  async continueWorkflow(strategy, actionDecision) {
    this.log(`Action Decision: ${actionDecision.type} (${actionDecision.primaryAction})`);

    // PHASE 3: MOVEMENT
    const movementDecision = await this.movementWorkflow(actionDecision);
    this.log(`Movement: ${movementDecision ? movementDecision.action : 'STAY_PUT'}`);

    // PHASE 4: ACTION (execute the decided action)
    const actions = [actionDecision.primaryAction].filter(Boolean);
    this.log(`Executing Action: ${actions.join(', ') || 'NONE'}`);

    // PHASE 5: WAIT FOR REACTION
    // (This happens automatically in CombatFlowController when action executes)
    this.log('Action will trigger reaction window for opponent');

    // PHASE 6: RE-ASSESSMENT
    this.log('--- RE-ASSESSMENT FOR NEXT TURN ---');
    const nextTurnPrediction = await this.reAssessmentWorkflow();
    this.log(`Next Turn Prediction: ${nextTurnPrediction}`);

    // PHASE 7: BONUS ACTION (if any)
    const bonusDecision = await this.bonusActionWorkflow(nextTurnPrediction, actionDecision);
    this.log(`Bonus Action: ${bonusDecision.join(', ') || 'NONE'}`);

    // PHASE 8: 2ND MOVEMENT
    const secondMovement = await this.secondMovementWorkflow(nextTurnPrediction, actionDecision.target);
    if (secondMovement) {
      this.log(`2nd Movement: ${secondMovement.action}`);
    } else {
      this.log('2nd Movement: STAY_PUT');
    }

    // PHASE 9: END TURN
    this.log('=== END TURN - DECISION WORKFLOW COMPLETE ===');

    // Build decision summary for UI display
    const summary = this.buildDecisionSummary({
      strategy,
      movementDecision,
      actionDecision,
      bonusDecision,
      secondMovement,
      nextTurnPrediction
    });

    return {
      strategy,
      movement: movementDecision,
      actions,
      bonusActions: bonusDecision,
      finalMovement: secondMovement,
      targetId: actionDecision.target?.id,
      logs: this.logs,
      summary // Add structured summary for UI
    };
  }

  /**
   * Build concise decision summary for UI display
   */
  buildDecisionSummary(decisions) {
    const { strategy, movementDecision, actionDecision, bonusDecision, secondMovement, nextTurnPrediction } = decisions;
    
    const summary = {
      strategy,
      target: actionDecision.target?.id || 'none',
      phases: []
    };

    // Phase 1: Pre-action movement
    if (movementDecision && movementDecision.action !== 'STAY_PUT') {
      summary.phases.push({
        phase: 'Movement',
        action: movementDecision.action,
        detail: `Moving ${movementDecision.action === 'MOVE_CLOSER' ? 'closer' : 'farther'}`
      });
    } else {
      summary.phases.push({
        phase: 'Movement',
        action: 'STAY_PUT',
        detail: 'Holding position'
      });
    }

    // Phase 2: Main action
    if (actionDecision.primaryAction) {
      let detail = actionDecision.primaryAction;
      if (actionDecision.weapon) {
        detail = `${actionDecision.weapon.name}`;
      }
      summary.phases.push({
        phase: 'Action',
        action: actionDecision.primaryAction,
        detail
      });
    }

    // Phase 3: Bonus action
    if (bonusDecision && bonusDecision.length > 0) {
      summary.phases.push({
        phase: 'Bonus',
        action: bonusDecision[0],
        detail: bonusDecision[0].replace(/_/g, ' ')
      });
    }

    // Phase 4: Final movement
    if (secondMovement && secondMovement.action !== 'STAY_PUT') {
      summary.phases.push({
        phase: 'Final Move',
        action: secondMovement.action,
        detail: `Moving ${secondMovement.action === 'MOVE_CLOSER' ? 'closer' : 'farther'}`
      });
    }

    // Add tactical assessment
    summary.assessment = nextTurnPrediction;

    return summary;
  }

  /**
   * PHASE 1: RISK ASSESSMENT WORKFLOW
   * Comprehensive battlefield analysis including:
   * - Self status (HP, shields, hull)
   * - Combat performance (hit rate, damage dealt/taken)
   * - Opponent status and capabilities
   * - Team status (allies condition)
   * - Tactical situation (outnumbered, advantage)
   */
  async riskAssessmentWorkflow() {
    try {
      console.log('[AIDecisionTree] riskAssessmentWorkflow START');
      this.log('--- RISK ASSESSMENT WORKFLOW ---');
      this.log(`Ship object structure check: ${JSON.stringify(Object.keys(this.ship))}`);
      
      // === SELF ANALYSIS ===
      console.log('[AIDecisionTree] Starting self analysis...');
      // Defensive: check if ship has nested ship property or if it IS the ship
      const shipObj = this.ship.ship || this.ship;
      console.log('[AIDecisionTree] shipObj obtained, keys:', Object.keys(shipObj || {}));
      
      if (!shipObj || typeof shipObj.calculateCombatStats !== 'function') {
        console.error('[AIDecisionTree] ERROR: Invalid ship object');
        this.log('ERROR: Invalid ship object - missing calculateCombatStats');
        this.log(`Ship structure: ${JSON.stringify(this.ship, null, 2)}`);
        return 'DEFENSIVE_STAND'; // Fallback strategy
      }
      
      console.log('[AIDecisionTree] Calling calculateCombatStats...');
      const myStats = shipObj.calculateCombatStats();
      console.log('[AIDecisionTree] calculateCombatStats returned');
      const myHull = shipObj.currentHull ?? myStats.maxHull;
      const myShields = shipObj.currentShields ?? myStats.maxShields;
      const myHPPercent = ((myHull + myShields) / (myStats.maxHull + myStats.maxShields)) * 100;
    
    this.log('=== SELF STATUS ===');
    this.log(`Hull: ${myHull}/${myStats.maxHull} (${Math.round((myHull/myStats.maxHull)*100)}%)`);
    this.log(`Shields: ${myShields}/${myStats.maxShields} (${Math.round((myShields/myStats.maxShields)*100)}%)`);
    this.log(`Total HP: ${Math.round(myHPPercent)}%`);
    
    // === COMBAT PERFORMANCE ANALYSIS ===
    const history = this.ship.combatHistory;
    const hitRate = history.attacksMade > 0 ? (history.attacksHit / history.attacksMade * 100) : 0;
    const avgDamagePerHit = history.attacksHit > 0 ? (history.totalDamageDealt / history.attacksHit) : 0;
    const enemyHitRate = (history.timesHit + history.timesMissed) > 0 
      ? (history.timesHit / (history.timesHit + history.timesMissed) * 100) : 0;
    
    this.log('=== COMBAT PERFORMANCE ===');
    this.log(`Attacks Made: ${history.attacksMade} (${history.attacksHit} hits, ${history.attacksMissed} misses)`);
    this.log(`My Hit Rate: ${Math.round(hitRate)}%`);
    this.log(`Total Damage Dealt: ${history.totalDamageDealt}`);
    this.log(`Avg Damage Per Hit: ${Math.round(avgDamagePerHit)}`);
    this.log(`Times Hit By Enemy: ${history.timesHit}`);
    this.log(`Enemy Hit Rate Against Me: ${Math.round(enemyHitRate)}%`);
    this.log(`Total Damage Taken: ${history.totalDamageTaken}`);
    
    // Performance evaluation
    const performingWell = hitRate > 50 && avgDamagePerHit > 10;
    const performingPoorly = hitRate < 30 || history.attacksMissed > 3;
    const takingHeavyFire = history.timesHit > 2 || enemyHitRate > 60;
    
    this.log(`Performance Assessment: ${performingWell ? 'GOOD' : performingPoorly ? 'POOR' : 'AVERAGE'}`);
    if (takingHeavyFire) this.log('WARNING: Taking heavy fire!');
    
    // === OPPONENT ANALYSIS ===
    console.log('[AIDecisionTree] Starting opponent analysis...');
    const enemies = this.combatState.getEnemies(this.ship.id) || [];
    console.log('[AIDecisionTree] Found', enemies.length, 'enemies');
    this.log('=== OPPONENT ANALYSIS ===');
    this.log(`Enemy Count: ${enemies.length}`);
    
    let totalEnemyHP = 0;
    let knownEnemyStatus = [];
    let unknownEnemies = 0;
    
    // Safety: Limit enemy analysis to prevent freeze
    const maxEnemies = Math.min(enemies.length, 10);
    console.log('[AIDecisionTree] Will analyze', maxEnemies, 'enemies');
    for (let idx = 0; idx < maxEnemies; idx++) {
      const e = enemies[idx];
      console.log(`[AIDecisionTree] Analyzing enemy ${idx + 1}/${maxEnemies}...`);
      try {
        this.log(`  Analyzing enemy ${idx + 1}/${enemies.length}...`);
        const eShipObj = e.ship || e;
        
        if (!eShipObj || typeof eShipObj.calculateCombatStats !== 'function') {
          this.log(`  Enemy ${e.id || idx}: Invalid ship object, skipping`);
          continue;
        }
        
        // Check if we've scanned this enemy FIRST
        const effects = this.combatState.getStatusEffects(e.id) || [];
        const isScanned = effects.some(eff => eff.type === 'SCANNED');
        
        const eStats = eShipObj.calculateCombatStats();
        
        // Only know actual HP if scanned, otherwise estimate
        let estimatedHP;
        let actualHP;
        
        if (isScanned) {
          const eHull = eShipObj.currentHull ?? eStats.maxHull;
          const eShields = eShipObj.currentShields ?? eStats.maxShields;
          actualHP = eHull + eShields;
          estimatedHP = actualHP;
          totalEnemyHP += actualHP;
          
          const hpPercent = ((eHull + eShields) / (eStats.maxHull + eStats.maxShields)) * 100;
          this.log(`${e.id}: ${Math.round(hpPercent)}% HP (${eShields}/${eStats.maxShields} shields, ${eHull}/${eStats.maxHull} hull) [SCANNED]`);
          knownEnemyStatus.push({ id: e.id, hpPercent, hull: eHull, shields: eShields, maxHP: eStats.maxHull + eStats.maxShields });
        } else {
          // Estimate based on ship tier and visible size
          const shipTier = eShipObj.tier || 1;
          const visibleSize = eShipObj.size || 'medium';
          
          // Rough estimates: tier 1 = ~120-150, tier 2 = ~180-220, tier 3 = ~250-300
          const tierEstimates = {
            1: 135,
            2: 200,
            3: 275,
            4: 350,
            5: 450
          };
          
          estimatedHP = tierEstimates[shipTier] || 150;
          totalEnemyHP += estimatedHP; // Use estimate for tactical calculations
          
          this.log(`${e.id}: STATUS UNKNOWN (not scanned) - Tier ${shipTier} ship, estimated ~${estimatedHP} HP`);
          unknownEnemies++;
          
          // Should we consider scanning?
          if (shipTier > (this.ship.ship?.tier || 1)) {
            this.log(`  WARNING: Enemy appears more advanced (Tier ${shipTier} vs our Tier ${this.ship.ship?.tier || 1}) - scanning recommended!`);
          }
        }
      
        // Analyze weapons if scanned
        if (isScanned && eStats.weapons && eStats.weapons.length > 0) {
          this.log(`  Weapons: ${eStats.weapons.map(w => w.name).join(', ')}`);
        }
      } catch (error) {
        this.log(`  ERROR analyzing enemy ${e.id || idx}: ${error.message}`);
        console.error('Enemy analysis error:', error);
      }
    }
    
    if (unknownEnemies > 0) {
      this.log(`${unknownEnemies} enemies not scanned - limited intel`);
    }
    
    // === TEAM ANALYSIS ===
    console.log('[AIDecisionTree] Starting team analysis...');
    const allies = this.combatState.getAllies(this.ship.id) || [];
    console.log('[AIDecisionTree] Found', allies.length, 'allies');
    this.log('=== TEAM STATUS ===');
    
    if (allies.length === 0) {
      this.log('No allies - fighting alone');
    } else {
      this.log(`Allies: ${allies.length}`);
      let alliesHealthy = 0;
      let alliesDamaged = 0;
      let alliesCritical = 0;
      
      const maxAllies = Math.min(allies.length, 10);
      for (let idx = 0; idx < maxAllies; idx++) {
        const ally = allies[idx];
        try {
          this.log(`  Analyzing ally ${idx + 1}/${allies.length}...`);
          const aShipObj = ally.ship || ally;
          
          if (!aShipObj || typeof aShipObj.calculateCombatStats !== 'function') {
            this.log(`  Ally ${ally.id || idx}: Invalid ship object, skipping`);
            continue;
          }
          
          const aStats = aShipObj.calculateCombatStats();
          const aHull = aShipObj.currentHull ?? aStats.maxHull;
          const aShields = aShipObj.currentShields ?? aStats.maxShields;
          const aHPPercent = ((aHull + aShields) / (aStats.maxHull + aStats.maxShields)) * 100;
        
        if (aHPPercent > 70) {
          alliesHealthy++;
          this.log(`${ally.id}: ${Math.round(aHPPercent)}% HP - HEALTHY`);
        } else if (aHPPercent > 40) {
          alliesDamaged++;
          this.log(`${ally.id}: ${Math.round(aHPPercent)}% HP - DAMAGED`);
        } else {
          alliesCritical++;
          this.log(`${ally.id}: ${Math.round(aHPPercent)}% HP - CRITICAL`);
        }
        } catch (error) {
          this.log(`  ERROR analyzing ally ${ally.id || idx}: ${error.message}`);
          console.error('Ally analysis error:', error);
        }
      }
      
      this.log(`Team Health: ${alliesHealthy} healthy, ${alliesDamaged} damaged, ${alliesCritical} critical`);
    }
    
    // === TACTICAL SITUATION ===
    this.log('=== TACTICAL SITUATION ===');
    
    const ourForce = 1 + allies.length;
    const theirForce = enemies.length;
    const outnumbered = theirForce > ourForce;
    const severelyOutnumbered = theirForce >= ourForce * 2;
    const haveAdvantage = ourForce > theirForce;
    
    this.log(`Force Ratio: ${ourForce} vs ${theirForce}`);
    if (severelyOutnumbered) {
      this.log('SEVERELY OUTNUMBERED!');
    } else if (outnumbered) {
      this.log('Outnumbered - tactical disadvantage');
    } else if (haveAdvantage) {
      this.log('Numerical advantage');
    } else {
      this.log('Even numbers');
    }
    
    // HP comparison
    const ourTotalHP = myHull + myShields + allies.reduce((sum, a) => {
      try {
        const aShipObj = a.ship || a;
        if (!aShipObj || typeof aShipObj.calculateCombatStats !== 'function') return sum;
        const aStats = aShipObj.calculateCombatStats();
        const aHull = aShipObj.currentHull ?? aStats.maxHull;
        const aShields = aShipObj.currentShields ?? aStats.maxShields;
        return sum + aHull + aShields;
      } catch (error) {
        this.log(`  ERROR in HP comparison for ally: ${error.message}`);
        return sum;
      }
    }, 0);
    
    this.log(`Total HP Pool: Us ${ourTotalHP} vs Them ${totalEnemyHP}`);
    
    // === DECISION LOGIC ===
    console.log('[AIDecisionTree] Starting decision logic...');
    this.log('=== DECISION ANALYSIS ===');
    
    const criticalHP = myHPPercent < 30;
    const lowHP = myHPPercent < 50;
    const riskTolerance = this.personality.thresholds?.riskTolerance || 0.5;
    const aggression = this.personality.weights?.attack || 1.0;
    
    // Check if we're losing badly
    const losingBadly = (criticalHP && outnumbered) || 
                        (myHPPercent < 40 && severelyOutnumbered) ||
                        (performingPoorly && takingHeavyFire && lowHP);
    
    // Check if we're winning
    const winning = myHPPercent > 70 && 
                   (totalEnemyHP < ourTotalHP * 0.6 || haveAdvantage) &&
                   performingWell;
    
    // FLEE conditions
    if (losingBadly && !performingWell) {
      this.log('Decision: FLEE - Losing badly, poor performance');
      return 'FLEE';
    }
    
    // SURRENDER conditions (very low aggression, critical state)
    if (criticalHP && severelyOutnumbered && aggression < 0.5 && performingPoorly) {
      this.log('Decision: SURRENDER - Critical HP, hopeless situation');
      return 'SURRENDER';
    }
    
    // REQUEST SURRENDER (dominant position)
    if (winning && aggression < 0.8) {
      this.log('Decision: REQUEST_SURRENDER - Dominant position');
      return 'REQUEST_SURRENDER';
    }
    
    // DEFENSIVE STAND (damaged but holding)
    if ((lowHP || takingHeavyFire) && riskTolerance < 0.5) {
      this.log('Decision: DEFENSIVE_STAND - Low HP or heavy fire, cautious approach');
      return 'DEFENSIVE_STAND';
    }
    
    // ATTACK (default - conditions favor engagement)
    console.log('[AIDecisionTree] Decision: ATTACK');
    this.log('Decision: ATTACK - Conditions favor offensive action');
    if (performingWell) this.log('  Rationale: Good combat performance');
    if (haveAdvantage) this.log('  Rationale: Numerical advantage');
    if (myHPPercent > 60) this.log('  Rationale: Healthy HP');
    
    console.log('[AIDecisionTree] riskAssessmentWorkflow END - returning ATTACK');
    return 'ATTACK';
    
    } catch (error) {
      console.error('[AIDecisionTree] CRITICAL ERROR in riskAssessmentWorkflow:', error.message);
      console.error('[AIDecisionTree] Stack:', error.stack);
      this.log(`CRITICAL ERROR in riskAssessmentWorkflow: ${error.message}`);
      console.error('Risk Assessment Error:', error);
      console.error('Stack:', error.stack);
      console.log('[AIDecisionTree] Returning DEFENSIVE_STAND fallback');
      return 'DEFENSIVE_STAND'; // Safe fallback
    }
  }

  /**
   * PHASE 1.1: COMMUNICATION WORKFLOW
   * Renamed from diplomacyWorkflow for clarity
   */
  async communicationWorkflow(communicationType) {
    this.log(`--- COMMUNICATION WORKFLOW: ${communicationType} ---`);
    
    // For now, communication always fails (can be expanded later)
    this.log('Communication attempt failed - no negotiation system active');
    
    return { success: false };
  }

  /**
   * PHASE 2: ACTION DECISION WORKFLOW
   * Decides what type of action to take (ATTACK or DEFENSIVE_STANCE)
   */
  async actionDecisionWorkflow(strategy) {
    this.log('--- ACTION DECISION WORKFLOW ---');

    if (strategy === 'FLEE') {
      this.log('Strategy is FLEE - defensive stance with evasive maneuvers');
      return {
        type: 'DEFENSIVE_STANCE',
        primaryAction: 'EVASIVE_MANEUVERS',
        weapon: null,
        target: null
      };
    }

    if (strategy === 'DEFENSIVE_STAND') {
      this.log('Strategy is DEFENSIVE_STAND - using defensive subsystems');
      
      // Could trigger SCAN, EMERGENCY_REPAIR, or defensive components
      const shipObj = this.ship.ship || this.ship;
      const myStats = shipObj.calculateCombatStats();
      const myHull = shipObj.currentHull ?? myStats.maxHull;
      const hullPercent = (myHull / myStats.maxHull) * 100;

      if (hullPercent < 60) {
        this.log('Hull below 60% - prioritizing repairs if available');
        // Check if we have repair capability
        return {
          type: 'DEFENSIVE_STANCE',
          primaryAction: 'EVASIVE_MANEUVERS', // Fallback to evasion
          weapon: null,
          target: null
        };
      }

      return {
        type: 'DEFENSIVE_STANCE',
        primaryAction: 'EVASIVE_MANEUVERS',
        weapon: null,
        target: null
      };
    }

    // Strategy is ATTACK - select weapon and target
    this.log('Strategy is ATTACK - selecting weapon and target');
    
    // Check if we should scan first (unknown high-tier enemies)
    const enemies = this.combatState.getEnemies(this.ship.id) || [];
    const unscannedEnemies = enemies.filter(e => {
      const effects = this.combatState.getStatusEffects(e.id) || [];
      return !effects.some(eff => eff.type === 'SCANNED');
    });
    
    if (unscannedEnemies.length > 0) {
      const highTierUnscanned = unscannedEnemies.find(e => {
        const tier = e.ship?.tier || 1;
        const myTier = this.ship.ship?.tier || 1;
        return tier > myTier;
      });
      
      if (highTierUnscanned) {
        this.log(`Unscanned enemy appears more advanced - considering SCAN as primary action`);
        // Note: This returns SCAN as suggestion, but scanning might be bonus action for some ships
        // For now, we'll proceed with attack and suggest scan as bonus action
      }
    }
    
    const weaponDecision = await this.selectWeaponAndTarget();
    
    return {
      type: 'ATTACK',
      primaryAction: 'FIRE_WEAPON',
      weapon: weaponDecision.weapon,
      target: weaponDecision.target
    };
  }

  /**
   * Helper: Select best weapon and target
   * Uses multi-turn projection and risk/reward analysis
   */
  async selectWeaponAndTarget() {
    this.log('Selecting weapon and target...');
    
    const shipObj = this.ship.ship || this.ship;
    const myStats = shipObj.calculateCombatStats();
    const weapons = myStats.weapons || [];
    
    if (weapons.length === 0) {
      this.log('No weapons available');
      return { weapon: null, target: null };
    }

    const enemies = this.combatState.getEnemies(this.ship.id);
    if (enemies.length === 0) {
      this.log('No valid targets');
      return { weapon: null, target: null };
    }

    // Choose target (lowest HP enemy)
    let target = enemies[0];
    let lowestHP = Infinity;
    const maxTargets = Math.min(enemies.length, 10);
    for (let i = 0; i < maxTargets; i++) {
      const e = enemies[i];
      try {
        const eShipObj = e.ship || e;
        const eStats = eShipObj.calculateCombatStats();
        const eHull = eShipObj.currentHull ?? eStats.maxHull;
        const eShields = eShipObj.currentShields ?? eStats.maxShields;
        const totalHP = eHull + eShields;
        if (totalHP < lowestHP) {
          lowestHP = totalHP;
          target = e;
        }
      } catch (error) {
        this.log(`  ERROR analyzing enemy ${e.id}: ${error.message}`);
      }
    }

    this.log(`Target selected: ${target.id} (${Math.round(lowestHP)} HP)`);

    // Analyze target's weapons and threat range
    const targetThreat = this.analyzeTargetThreat(target);
    
    // Current combat state
    const distance = this.combatState.positioning.getDistance(this.ship.id, target.id);
    const distanceBand = this.combatState.positioning.getDistanceBandKey(this.ship.id, target.id);
    const maxMovement = myStats.maxSpeed || 100;
    
    this.log(`Current range: ${distanceBand} (${distance}km), Max movement: ${maxMovement}km/turn`);
    this.log(`Target threat analysis: ${JSON.stringify(targetThreat)}`);

    // Evaluate each weapon with multi-turn projection
    let bestWeapon = weapons[0];
    let bestScore = -10000;
    let bestProjection = null;

    weapons.forEach(w => {
      const projection = this.projectWeaponPerformance(w, distance, maxMovement, targetThreat, 3);
      
      if (projection.canUse) {
        this.log(`${w.name}: ${projection.summary}`);
        
        if (projection.totalScore > bestScore) {
          bestScore = projection.totalScore;
          bestWeapon = w;
          bestProjection = projection;
        }
      } else {
        this.log(`${w.name}: ${projection.summary}`);
      }
    });

    this.log(`DECISION: ${bestWeapon.name} selected (score: ${Math.round(bestScore)})`);
    if (bestProjection) {
      this.log(`  Reasoning: ${bestProjection.reasoning}`);
    }

    return { weapon: bestWeapon, target };
  }

  /**
   * Analyze target's weapon threat and optimal ranges
   * Handles multiple weapons and scanned vs unscanned enemies
   */
  analyzeTargetThreat(target) {
    const effects = this.combatState.getStatusEffects(target.id) || [];
    const isScanned = effects.some(eff => eff.type === 'SCANNED');
    
    const targetShip = target.ship || target;
    const targetStats = targetShip.calculateCombatStats();
    
    if (isScanned && targetStats.weapons && targetStats.weapons.length > 0) {
      // === SCANNED: We know their exact loadout ===
      const weapons = targetStats.weapons;
      const threatRanges = [];
      
      weapons.forEach(w => {
        const mods = w.rangeModifiers || {};
        
        // Find all ranges this weapon can fire at
        const validRanges = Object.entries(mods)
          .filter(([_, mod]) => mod !== null && mod !== undefined)
          .map(([band, mod]) => ({ band, modifier: mod }));
        
        // Find optimal range for this weapon
        const bestRange = validRanges.sort((a, b) => b.modifier - a.modifier)[0];
        
        if (bestRange) {
          threatRanges.push({
            weapon: w.name,
            optimalBand: bestRange.band,
            optimalModifier: bestRange.modifier,
            allValidRanges: validRanges.map(r => r.band),
            damage: w.damage || 10,
            attackBonus: w.attackBonus || 0
          });
        }
      });
      
      // Determine PRIMARY and SECONDARY threat zones
      // Primary: Where their BEST weapon is optimal
      // Secondary: Where their other weapons work
      const sortedByThreat = threatRanges.sort((a, b) => {
        const aThreat = a.damage * (1 + a.optimalModifier / 10);
        const bThreat = b.damage * (1 + b.optimalModifier / 10);
        return bThreat - aThreat;
      });
      
      const primaryThreat = sortedByThreat[0];
      const secondaryWeapons = sortedByThreat.slice(1);
      
      // Identify danger zones (ranges where ANY weapon is optimal)
      const dangerZones = new Set(threatRanges.map(t => t.optimalBand));
      
      // Identify safe zones (ranges where NO weapon is optimal)
      const allBands = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
      const safeZones = allBands.filter(band => !dangerZones.has(band));
      
      // Calculate coverage (which ranges can they fire at?)
      const coverageMap = {};
      allBands.forEach(band => {
        const weaponsAtRange = threatRanges.filter(t => t.allValidRanges.includes(band));
        coverageMap[band] = weaponsAtRange.length;
      });
      
      this.log(`Target scanned: ${weapons.length} weapons detected`);
      this.log(`  Primary threat: ${primaryThreat.weapon} at ${primaryThreat.optimalBand} (${primaryThreat.damage} dmg, +${primaryThreat.optimalModifier} mod)`);
      if (secondaryWeapons.length > 0) {
        secondaryWeapons.forEach(w => {
          this.log(`  Secondary: ${w.weapon} at ${w.optimalBand} (${w.damage} dmg, +${w.optimalModifier} mod)`);
        });
      }
      this.log(`  Danger zones: ${Array.from(dangerZones).join(', ')}`);
      this.log(`  Potential safe zones: ${safeZones.join(', ')}`);
      
      return {
        known: true,
        scanned: true,
        weaponCount: weapons.length,
        weapons: threatRanges,
        primaryThreat: primaryThreat,
        secondaryThreats: secondaryWeapons,
        dangerZones: Array.from(dangerZones),
        safeZones: safeZones,
        coverageMap: coverageMap,
        estimatedMaxDamage: sortedByThreat.reduce((sum, w) => sum + w.damage, 0),
        estimatedAvgDamage: sortedByThreat.reduce((sum, w) => sum + w.damage, 0) / sortedByThreat.length
      };
    } else {
      // === UNSCANNED: Estimate based on ship tier and class ===
      const tier = targetShip.tier || 1;
      const shipClass = targetShip.class || targetShip.size || 'unknown';
      
      // Enhanced tier-based estimates with multiple weapon assumptions
      const tierProfiles = {
        1: {
          weaponCount: 1,
          primaryRange: 'MEDIUM',
          secondaryRange: 'CLOSE',
          damage: 12,
          coverage: ['CLOSE', 'MEDIUM'],
          description: 'Basic armament'
        },
        2: {
          weaponCount: 2,
          primaryRange: 'MEDIUM',
          secondaryRange: 'LONG',
          damage: 18,
          coverage: ['CLOSE', 'MEDIUM', 'LONG'],
          description: 'Dual weapon system'
        },
        3: {
          weaponCount: 2,
          primaryRange: 'LONG',
          secondaryRange: 'MEDIUM',
          damage: 25,
          coverage: ['MEDIUM', 'LONG', 'EXTREME'],
          description: 'Advanced multi-range'
        },
        4: {
          weaponCount: 3,
          primaryRange: 'LONG',
          secondaryRange: 'EXTREME',
          damage: 32,
          coverage: ['CLOSE', 'MEDIUM', 'LONG', 'EXTREME'],
          description: 'Heavy weapons platform'
        },
        5: {
          weaponCount: 3,
          primaryRange: 'EXTREME',
          secondaryRange: 'LONG',
          damage: 40,
          coverage: ['MEDIUM', 'LONG', 'EXTREME'],
          description: 'Capital ship armament'
        }
      };
      
      // Adjust for ship class
      let profile = { ...(tierProfiles[tier] || tierProfiles[1]) };
      
      if (shipClass === 'fighter' || shipClass === 'small') {
        profile.primaryRange = 'CLOSE';
        profile.secondaryRange = 'MEDIUM';
        profile.weaponCount = Math.max(1, profile.weaponCount - 1);
        profile.description += ' (light fighter)';
      } else if (shipClass === 'corvette' || shipClass === 'medium') {
        // Default profile works
        profile.description += ' (corvette)';
      } else if (shipClass === 'frigate' || shipClass === 'large') {
        profile.weaponCount += 1;
        profile.description += ' (frigate - multiple weapons)';
      } else if (shipClass === 'cruiser' || shipClass === 'capital') {
        profile.weaponCount += 2;
        profile.primaryRange = profile.primaryRange === 'MEDIUM' ? 'LONG' : profile.primaryRange;
        profile.description += ' (cruiser - heavy armament)';
      }
      
      // Infer safe zones (ranges NOT in their coverage)
      const allBands = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
      const assumedSafeZones = allBands.filter(band => !profile.coverage.includes(band));
      
      this.log(`Target NOT scanned - making assumptions based on Tier ${tier} ${shipClass} ship`);
      this.log(`  Estimated: ${profile.weaponCount} weapon(s), ${profile.description}`);
      this.log(`  Assumed primary threat zone: ${profile.primaryRange}`);
      this.log(`  Assumed secondary zone: ${profile.secondaryRange}`);
      this.log(`  Estimated coverage: ${profile.coverage.join(', ')}`);
      this.log(`  POTENTIAL safe zones: ${assumedSafeZones.length > 0 ? assumedSafeZones.join(', ') : 'NONE - assume full coverage'}`);
      this.log(`  ⚠️  SCAN recommended for precise threat assessment!`);
      
      return {
        known: false,
        scanned: false,
        estimatedTier: tier,
        shipClass: shipClass,
        weaponCount: profile.weaponCount,
        primaryThreat: {
          weapon: 'Unknown weapon(s)',
          optimalBand: profile.primaryRange,
          damage: profile.damage
        },
        mostDangerousBand: profile.primaryRange,
        secondaryBand: profile.secondaryRange,
        estimatedDamage: profile.damage,
        assumedCoverage: profile.coverage,
        assumedSafeZones: assumedSafeZones,
        uncertainty: 'HIGH - estimates only, scan for accuracy'
      };
    }
  }

  /**
   * Project weapon performance over next N turns
   * Considers damage potential vs exposure to enemy fire
   */
  projectWeaponPerformance(weapon, currentDistance, maxMovement, targetThreat, turns = 3) {
    const rangeMods = weapon.rangeModifiers || {};
    const currentBand = this.combatState.positioning.getDistanceBandKey(this.ship.id, 
      this.combatState.getEnemies(this.ship.id)[0]?.id);
    
    // Can we even use this weapon at current range?
    const currentMod = rangeMods[currentBand];
    if (currentMod === null || currentMod === undefined) {
      return {
        canUse: false,
        summary: `Cannot fire at current range (${currentBand})`,
        totalScore: -10000
      };
    }

    // Find weapon's optimal range
    const optimalBand = Object.entries(rangeMods)
      .filter(([_, mod]) => mod !== null && mod !== undefined)
      .sort((a, b) => b[1] - a[1])[0];
    
    const optimalRangeBand = optimalBand ? optimalBand[0] : currentBand;
    const optimalMod = optimalBand ? optimalBand[1] : 0;

    // Calculate turns to reach optimal range
    const turnsToOptimal = this.calculateTurnsToRange(currentDistance, optimalRangeBand, maxMovement);
    
    // Project damage over N turns
    let projectedDamage = 0;
    let projectedRisk = 0;
    let currentDist = currentDistance;
    
    for (let turn = 0; turn < turns; turn++) {
      const turnBand = this.getDistanceBandFromKm(currentDist);
      const turnMod = rangeMods[turnBand];
      
      if (turnMod !== null && turnMod !== undefined) {
        // Damage this turn (weapon damage * accuracy modifier)
        // weapon.damage is an object with {min, max} properties
        let baseDamage = 15; // Default fallback
        if (weapon.damage && typeof weapon.damage === 'object' && weapon.damage.min !== undefined && weapon.damage.max !== undefined) {
          baseDamage = (weapon.damage.min + weapon.damage.max) / 2; // Use average
        } else if (typeof weapon.damage === 'number') {
          baseDamage = weapon.damage;
        } else if (weapon.baseDamage) {
          baseDamage = weapon.baseDamage;
        } else if (weapon.averageDamage) {
          baseDamage = weapon.averageDamage;
        }
        
        const accuracyFactor = 0.5 + (turnMod / 10); // Higher mod = better accuracy
        const turnDamage = baseDamage * accuracyFactor;
        projectedDamage += turnDamage;
        
        if (turn === 0) {
          this.log(`  Turn ${turn + 1}: ${Math.round(turnDamage)} dmg at ${turnBand} (base ${baseDamage}, mod ${turnMod})`);
        }
        
        // Risk this turn - now considers multiple enemy weapons
        const riskFactor = this.calculateRiskAtRange(turnBand, targetThreat);
        
        // Calculate incoming damage potential
        let incomingDamage = 0;
        if (targetThreat.scanned) {
          // Sum damage from all weapons that can hit us at this range
          const weaponsAtRange = targetThreat.weapons.filter(w => 
            w.allValidRanges.includes(turnBand)
          );
          
          weaponsAtRange.forEach(w => {
            const isOptimal = w.optimalBand === turnBand;
            const hitChance = isOptimal ? 0.7 : 0.4; // Optimal = better chance to hit
            incomingDamage += w.damage * hitChance;
          });
        } else {
          // Estimate based on tier and coverage
          const baseIncoming = targetThreat.estimatedDamage || 15;
          const weaponCountFactor = (targetThreat.weaponCount || 1) * 0.7; // Not all will hit
          incomingDamage = baseIncoming * weaponCountFactor * riskFactor;
        }
        
        projectedRisk += incomingDamage;
      }
      
      // Move toward optimal range (if not there yet)
      if (turn < turnsToOptimal) {
        currentDist = this.projectDistanceAfterMovement(currentDist, optimalRangeBand, maxMovement);
      }
    }

    // Calculate net value: damage dealt - risk taken
    const riskTolerance = this.personality?.thresholds?.riskTolerance || 0.5;
    const riskPenalty = projectedRisk * (1 - riskTolerance); // More cautious = higher penalty
    const netValue = projectedDamage - riskPenalty;
    
    // Bonus for weapons already at optimal range (no movement needed)
    const readinessBonus = turnsToOptimal === 0 ? 20 : 0;
    
    let totalScore = netValue + readinessBonus + (weapon.attackBonus || 0) * 5;
    
    // Validate score (prevent NaN)
    if (isNaN(totalScore)) {
      this.log(`  WARNING: NaN score detected for ${weapon.name}, using fallback`);
      totalScore = currentMod * 10 + (weapon.attackBonus || 0) * 5;
    }

    // Generate reasoning
    let reasoning = `${Math.round(projectedDamage)} dmg over ${turns} turns`;
    if (projectedRisk > 0) {
      reasoning += `, ${Math.round(projectedRisk)} risk exposure`;
    }
    if (turnsToOptimal > 0) {
      reasoning += `, ${turnsToOptimal}t to optimal`;
    } else {
      reasoning += `, already at optimal range`;
    }
    
    // Add risk context
    if (targetThreat.scanned) {
      if (projectedRisk > 30) {
        const dangerZones = targetThreat.dangerZones.join('/');
        reasoning += ` (HIGH RISK - enemy ${targetThreat.weaponCount} weapons optimal at ${dangerZones})`;
      }
    } else {
      if (projectedRisk > 20) {
        reasoning += ` (RISK UNCERTAIN - unscanned Tier ${targetThreat.estimatedTier}, SCAN recommended)`;
      }
    }

    return {
      canUse: true,
      projectedDamage,
      projectedRisk,
      turnsToOptimal,
      totalScore,
      summary: `${Math.round(projectedDamage)} dmg, ${Math.round(projectedRisk)} risk, ${turnsToOptimal}t to optimal → score ${Math.round(totalScore)}`,
      reasoning
    };
  }

  /**
   * Calculate risk factor for being at a specific range vs target
   * Now handles multiple weapons and precise/estimated threats
   */
  calculateRiskAtRange(rangeBand, targetThreat) {
    if (!targetThreat) return 0.3; // Unknown threat - moderate caution
    
    if (targetThreat.scanned) {
      // === SCANNED: Precise risk calculation ===
      
      // Check if we're in a known danger zone (any weapon optimal)
      if (targetThreat.dangerZones.includes(rangeBand)) {
        // How many weapons are optimal here?
        const weaponsOptimalHere = targetThreat.weapons.filter(w => w.optimalBand === rangeBand).length;
        
        // More weapons = more danger
        if (weaponsOptimalHere >= 2) {
          return 1.0; // CRITICAL - multiple weapons optimal here!
        } else {
          return 0.9; // High - one weapon optimal
        }
      }
      
      // Check if we're in a safe zone (no weapons optimal)
      if (targetThreat.safeZones.includes(rangeBand)) {
        // But can they still hit us?
        const coverageHere = targetThreat.coverageMap[rangeBand] || 0;
        
        if (coverageHere === 0) {
          return 0.0; // SAFE - they can't even fire at this range!
        } else if (coverageHere === 1) {
          return 0.2; // Low risk - one weapon can fire but not optimal
        } else {
          return 0.4; // Moderate - multiple weapons can fire
        }
      }
      
      // We're somewhere in between - calculate based on coverage
      const coverageHere = targetThreat.coverageMap[rangeBand] || 0;
      
      if (coverageHere === 0) return 0.0;
      if (coverageHere === 1) return 0.3;
      if (coverageHere === 2) return 0.5;
      return 0.7; // 3+ weapons can hit us
      
    } else {
      // === UNSCANNED: Use assumptions (more conservative) ===
      
      // Primary threat zone
      if (rangeBand === targetThreat.mostDangerousBand) {
        return 0.9; // High risk - assumed primary threat zone
      }
      
      // Secondary threat zone
      if (rangeBand === targetThreat.secondaryBand) {
        return 0.6; // Moderate risk - assumed secondary
      }
      
      // Check if in assumed coverage
      if (targetThreat.assumedCoverage && targetThreat.assumedCoverage.includes(rangeBand)) {
        return 0.5; // Moderate - they probably can hit us here
      }
      
      // Assumed safe zone
      if (targetThreat.assumedSafeZones && targetThreat.assumedSafeZones.includes(rangeBand)) {
        return 0.2; // Low risk - probably safe, but uncertain
      }
      
      // Calculate distance from their assumed optimal range
      const bands = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
      const currentIdx = bands.indexOf(rangeBand);
      const threatIdx = bands.indexOf(targetThreat.mostDangerousBand);
      
      if (currentIdx === -1 || threatIdx === -1) return 0.4; // Unknown - be cautious
      
      const distance = Math.abs(currentIdx - threatIdx);
      
      if (distance === 0) return 0.9; // At their optimal
      if (distance === 1) return 0.5; // Adjacent to optimal
      if (distance === 2) return 0.3; // Two bands away
      return 0.2; // Far from their optimal - probably safer
    }
  }

  /**
   * Calculate how many turns to reach a target range band
   */
  calculateTurnsToRange(currentDistance, targetBand, maxMovement) {
    const bandRanges = {
      'POINT_BLANK': [0, 50],
      'CLOSE': [51, 100],
      'MEDIUM': [101, 300],
      'LONG': [301, 500],
      'EXTREME': [501, 1000]
    };
    
    const targetRange = bandRanges[targetBand];
    if (!targetRange) return 999;
    
    // Target the middle of the band
    const targetDist = (targetRange[0] + targetRange[1]) / 2;
    const distanceToMove = Math.abs(currentDistance - targetDist);
    
    return Math.ceil(distanceToMove / maxMovement);
  }

  /**
   * Project distance after one turn of movement toward target band
   */
  projectDistanceAfterMovement(currentDist, targetBand, maxMovement) {
    const bandRanges = {
      'POINT_BLANK': [0, 50],
      'CLOSE': [51, 100],
      'MEDIUM': [101, 300],
      'LONG': [301, 500],
      'EXTREME': [501, 1000]
    };
    
    const targetRange = bandRanges[targetBand];
    if (!targetRange) return currentDist;
    
    const targetDist = (targetRange[0] + targetRange[1]) / 2;
    
    if (currentDist > targetDist) {
      // Moving closer
      return Math.max(targetDist, currentDist - maxMovement);
    } else {
      // Moving farther
      return Math.min(targetDist, currentDist + maxMovement);
    }
  }

  /**
   * Get distance band from km distance
   */
  getDistanceBandFromKm(distance) {
    if (distance <= 50) return 'POINT_BLANK';
    if (distance <= 100) return 'CLOSE';
    if (distance <= 300) return 'MEDIUM';
    if (distance <= 500) return 'LONG';
    return 'EXTREME';
  }

  /**
   * PHASE 3: MOVEMENT WORKFLOW
   */
  async movementWorkflow(actionDecision) {
    this.log('--- MOVEMENT WORKFLOW ---');

    if (actionDecision.type === 'DEFENSIVE_STANCE') {
      this.log('Defensive stance - moving away for safety');
      return { action: 'MOVE_FARTHER', movementPoints: 100, reason: 'Defensive positioning' };
    }

    const weapon = actionDecision.weapon;
    const target = actionDecision.target;

    if (!weapon || !target) {
      this.log('No weapon or target - staying put');
      return null;
    }

    const currentBand = this.combatState.positioning.getDistanceBandKey(this.ship.id, target.id);
    const currentRangeMod = weapon.rangeModifiers?.[currentBand];

    this.log(`Current band: ${currentBand}, Range mod: ${currentRangeMod}`);

    // Find optimal range for this weapon
    const bands = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
    let bestBand = currentBand;
    let bestMod = currentRangeMod;

    bands.forEach(band => {
      const mod = weapon.rangeModifiers?.[band];
      if (mod !== null && mod !== undefined && mod > bestMod) {
        bestBand = band;
        bestMod = mod;
      }
    });

    this.log(`Optimal band for ${weapon.name}: ${bestBand} (mod: ${bestMod})`);

    if (bestBand === currentBand) {
      this.log('Already at optimal range - no movement needed');
      return null;
    }

    const currentIndex = bands.indexOf(currentBand);
    const bestIndex = bands.indexOf(bestBand);

    if (bestIndex < currentIndex) {
      this.log(`Moving closer to reach ${bestBand}`);
      return { action: 'MOVE_CLOSER', movementPoints: 100, reason: `Optimal range for ${weapon.name}` };
    } else {
      this.log(`Moving farther to reach ${bestBand}`);
      return { action: 'MOVE_FARTHER', movementPoints: 100, reason: `Optimal range for ${weapon.name}` };
    }
  }

  /**
   * PHASE 6: RE-ASSESSMENT WORKFLOW
   * Predicts next turn strategy after current action resolves
   */
  async reAssessmentWorkflow() {
    this.log('Analyzing battlefield state for next turn...');
    
    const shipObj = this.ship.ship || this.ship;
    const myStats = shipObj.calculateCombatStats();
    const myHull = shipObj.currentHull ?? myStats.maxHull;
    const myShields = shipObj.currentShields ?? myStats.maxShields;
    const myHPPercent = ((myHull + myShields) / (myStats.maxHull + myStats.maxShields)) * 100;

    this.log(`Current HP: ${Math.round(myHPPercent)}%`);

    // Predict damage we might take this round
    const enemies = this.combatState.getEnemies(this.ship.id);
    const estimatedIncomingDamage = enemies.length * 15; // Rough estimate

    const projectedHP = Math.max(0, myHPPercent - (estimatedIncomingDamage / (myStats.maxHull + myStats.maxShields) * 100));
    this.log(`Projected HP after enemy turn: ~${Math.round(projectedHP)}%`);

    if (projectedHP < 40) {
      this.log('Next turn prediction: DEFENSIVE - projected low HP');
      return 'DEFENSIVE';
    }

    if (myHPPercent < 60) {
      this.log('Next turn prediction: CAUTIOUS - current HP moderate');
      return 'CAUTIOUS';
    }

    this.log('Next turn prediction: OFFENSIVE - HP stable, continue attack');
    return 'OFFENSIVE';
  }

  /**
   * PHASE 7: BONUS ACTION WORKFLOW
   */
  async bonusActionWorkflow(nextTurnPrediction, actionDecision) {
    this.log('--- BONUS ACTION WORKFLOW ---');

    const bonusActions = [];
    const shipObj = this.ship.ship || this.ship;
    const myStats = shipObj.calculateCombatStats();

    // Check available bonus actions based on components
    const hasShields = myStats.maxShields > 0;
    const hasSensors = myStats.sensorRange > 0;

    this.log(`Available bonus systems: Shields=${hasShields}, Sensors=${hasSensors}`);

    // PRIORITY 1: Scan unscanned high-threat enemies (if sensors available)
    if (hasSensors) {
      const enemies = this.combatState.getEnemies(this.ship.id) || [];
      const unscannedHighThreat = enemies.find(e => {
        const effects = this.combatState.getStatusEffects(e.id) || [];
        const isScanned = effects.some(eff => eff.type === 'SCANNED');
        if (isScanned) return false;
        
        const eTier = e.ship?.tier || 1;
        const myTier = this.ship.ship?.tier || 1;
        return eTier > myTier; // Unscanned and higher tier
      });
      
      if (unscannedHighThreat) {
        this.log(`High-threat enemy ${unscannedHighThreat.id} not scanned - using SCAN bonus action`);
        bonusActions.push('SCAN');
        return bonusActions;
      }
    }

    // Defensive bonus actions
    if (nextTurnPrediction === 'DEFENSIVE' && hasShields) {
      const currentShields = shipObj.currentShields ?? myStats.maxShields;
      const shieldPercent = (currentShields / myStats.maxShields) * 100;
      this.log(`Shield status: ${Math.round(shieldPercent)}%`);
      
      if (shieldPercent < 70) {
        this.log('Next turn defensive + low shields - boosting shields');
        bonusActions.push('BOOST_SHIELDS');
        return bonusActions;
      }
    }

    // Offensive bonus actions
    if ((nextTurnPrediction === 'OFFENSIVE' || nextTurnPrediction === 'CAUTIOUS') && hasSensors) {
      if (actionDecision.type === 'ATTACK' && actionDecision.target) {
        this.log('Offensive strategy + sensors - locking target for next turn');
        bonusActions.push('TARGET_LOCK');
        return bonusActions;
      }
    }

    this.log('No beneficial bonus actions identified');
    return bonusActions;
  }

  /**
   * PHASE 8: 2ND MOVEMENT WORKFLOW
   */
  async secondMovementWorkflow(nextTurnPrediction, target) {
    this.log('--- 2ND MOVEMENT WORKFLOW ---');

    // Defensive - create distance
    if (nextTurnPrediction === 'DEFENSIVE') {
      this.log('Next turn defensive - moving away for safety');
      return { action: 'MOVE_FARTHER', movementPoints: 100, reason: 'Pre-positioning for defensive next turn' };
    }

    // Cautious - maintain position
    if (nextTurnPrediction === 'CAUTIOUS') {
      this.log('Next turn cautious - maintaining current position');
      return null;
    }

    // Offensive - close distance if not already close
    if (nextTurnPrediction === 'OFFENSIVE' && target) {
      const currentBand = this.combatState.positioning.getDistanceBandKey(this.ship.id, target.id);
      if (currentBand === 'LONG' || currentBand === 'EXTREME') {
        this.log('Next turn offensive - closing distance for better accuracy');
        return { action: 'MOVE_CLOSER', movementPoints: 100, reason: 'Pre-positioning for offensive next turn' };
      }
    }

    this.log('No 2nd movement needed');
    return null;
  }
}
