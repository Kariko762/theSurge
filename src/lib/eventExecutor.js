/**
 * Event Execution Engine
 * Processes modular event architecture with weighted scenario pools
 */

class EventExecutor {
  constructor() {
    this.rng = Math.random; // Can be replaced with seeded RNG
  }

  /**
   * Execute a player-triggered event
   * @param {Object} eventData - The full event data (root + scenario pool)
   * @param {Object} context - Game context (tier, risk, location, etc.)
   * @returns {Object} Selected scenario with tracking data
   */
  executeEvent(eventData, context = {}) {
    const { rootEvent, scenarioPool } = eventData;

    // 1. Select scenario from weighted pool
    const selectedScenario = this.selectScenario(scenarioPool, context);

    // 2. Track event trigger
    const telemetryData = {
      eventId: rootEvent.id,
      scenarioId: selectedScenario.id,
      timestamp: new Date().toISOString(),
      duration: 0,
      playerChoice: null,
      outcome: null,
      rewards: null
    };

    return {
      rootEvent,
      scenario: selectedScenario,
      telemetry: telemetryData,
      context
    };
  }

  /**
   * Select a scenario from the pool based on weights and modifiers
   */
  selectScenario(scenarioPool, context) {
    const { tier = 'T1', risk = 'medium', asteroidType = null } = context;

    // Calculate adjusted weights for each scenario
    const adjustedScenarios = scenarioPool.map(scenario => {
      let adjustedWeight = scenario.weight;

      // Apply tier multiplier
      if (scenario.modifiers?.tierMultiplier?.[tier] !== undefined) {
        adjustedWeight *= scenario.modifiers.tierMultiplier[tier];
      }

      // Apply risk bonus
      if (scenario.modifiers?.riskBonus?.[risk] !== undefined) {
        adjustedWeight += scenario.modifiers.riskBonus[risk];
      }

      // Apply asteroid type bonus (if applicable)
      if (asteroidType && scenario.modifiers?.asteroidTypeBonus?.[asteroidType] !== undefined) {
        adjustedWeight += scenario.modifiers.asteroidTypeBonus[asteroidType];
      }

      return { ...scenario, adjustedWeight: Math.max(0, adjustedWeight) };
    });

    // Weighted random selection
    const totalWeight = adjustedScenarios.reduce((sum, s) => sum + s.adjustedWeight, 0);
    let roll = this.rng() * totalWeight;

    for (const scenario of adjustedScenarios) {
      roll -= scenario.adjustedWeight;
      if (roll <= 0) {
        return scenario;
      }
    }

    // Fallback to first scenario
    return adjustedScenarios[0];
  }

  /**
   * Execute a player choice (branch selection)
   */
  executeChoice(scenario, branchId, context = {}) {
    const branch = scenario.branches.find(b => b.id === branchId);
    if (!branch) {
      throw new Error(`Branch ${branchId} not found in scenario ${scenario.id}`);
    }

    const startTime = Date.now();

    // If branch has sub-scenarios, select one
    if (branch.subScenarios && branch.subScenarios.length > 0) {
      const outcome = this.selectSubScenario(branch.subScenarios, branch.challenge, context);
      const duration = (Date.now() - startTime) / 1000;

      return {
        branch,
        outcome,
        telemetry: {
          playerChoice: branchId,
          outcome: outcome.id,
          duration,
          rewards: outcome.rewards
        }
      };
    }

    // Simple outcome selection (no sub-scenarios)
    const outcome = this.selectOutcome(branch.outcomes);
    const duration = (Date.now() - startTime) / 1000;

    return {
      branch,
      outcome,
      telemetry: {
        playerChoice: branchId,
        outcome: outcome.type,
        duration,
        rewards: outcome.rewards
      }
    };
  }

  /**
   * Select a sub-scenario based on weights and challenge results
   */
  selectSubScenario(subScenarios, challenge, context) {
    // If there's a challenge, roll it first
    let challengeResult = null;
    if (challenge) {
      challengeResult = this.rollChallenge(challenge, context);
    }

    // Filter sub-scenarios by challenge success/failure if applicable
    let eligibleScenarios = subScenarios;
    if (challengeResult !== null) {
      // For critical results, prioritize critical outcomes
      if (challengeResult.criticalSuccess) {
        const criticals = subScenarios.filter(s => s.outcomeType === 'critical_success');
        if (criticals.length > 0) {
          eligibleScenarios = criticals;
        } else {
          eligibleScenarios = subScenarios.filter(s => s.outcomeType === 'success' || s.outcomeType === 'critical_success');
        }
      } else if (challengeResult.criticalFailure) {
        const criticals = subScenarios.filter(s => s.outcomeType === 'critical_failure');
        if (criticals.length > 0) {
          eligibleScenarios = criticals;
        } else {
          eligibleScenarios = subScenarios.filter(s => s.outcomeType === 'failure' || s.outcomeType === 'critical_failure');
        }
      } else if (challengeResult.success) {
        // Regular success - only success outcomes
        eligibleScenarios = subScenarios.filter(s => 
          s.outcomeType === 'success' || s.outcomeType === 'critical_success'
        );
        if (eligibleScenarios.length === 0) eligibleScenarios = subScenarios;
      } else {
        // Regular failure - only failure outcomes
        eligibleScenarios = subScenarios.filter(s => 
          s.outcomeType === 'failure' || s.outcomeType === 'critical_failure'
        );
        if (eligibleScenarios.length === 0) eligibleScenarios = subScenarios;
      }
    }

    // Weighted selection from eligible scenarios
    const totalWeight = eligibleScenarios.reduce((sum, s) => sum + s.weight, 0);
    let roll = this.rng() * totalWeight;

    for (const subScenario of eligibleScenarios) {
      roll -= subScenario.weight;
      if (roll <= 0) {
        return { ...subScenario, challengeResult };
      }
    }

    return { ...eligibleScenarios[0], challengeResult };
  }

  /**
   * Select an outcome from a list (for simple branches)
   */
  selectOutcome(outcomes) {
    const totalWeight = outcomes.reduce((sum, o) => sum + o.weight, 0);
    let roll = this.rng() * totalWeight;

    for (const outcome of outcomes) {
      roll -= outcome.weight;
      if (roll <= 0) {
        return outcome;
      }
    }

    return outcomes[0];
  }

  /**
   * Roll a challenge (skill check, combat, etc.)
   */
  rollChallenge(challenge, context) {
    const { mode, difficulty, baseTarget, skills } = challenge;

    // Simple D20 + modifiers system
    const d20Roll = Math.floor(this.rng() * 20) + 1;
    
    // Get skill bonuses from context with breakdown
    const skillBreakdown = [];
    let skillBonus = 0;
    if (skills && context.playerSkills) {
      skills.forEach(skill => {
        const value = context.playerSkills[skill] || 0;
        if (value > 0) {
          skillBreakdown.push({ skill, value });
          skillBonus += value;
        }
      });
    }

    // Equipment bonuses (future expansion)
    const equipmentBreakdown = [];
    let equipmentBonus = 0;
    if (context.equipment) {
      // Example: context.equipment.scanner could give +2 to perception
      // This is a placeholder for future implementation
    }

    // Status effect modifiers (future expansion)
    const statusBreakdown = [];
    let statusBonus = 0;
    if (context.statusEffects) {
      // Example: "Focused" status could give +1 to all checks
      // "Injured" could give -2 penalty
      // This is a placeholder for future implementation
    }

    // Calculate total
    const total = d20Roll + skillBonus + equipmentBonus + statusBonus;
    const success = total >= baseTarget;

    // Determine critical results
    const critical = d20Roll === 20 || d20Roll === 1;

    return {
      mode,
      difficulty,
      roll: d20Roll,
      skillBonus,
      skillBreakdown,
      equipmentBonus,
      equipmentBreakdown,
      statusBonus,
      statusBreakdown,
      total,
      target: baseTarget,
      success,
      critical,
      criticalSuccess: d20Roll === 20,
      criticalFailure: d20Roll === 1
    };
  }

  /**
   * Send telemetry data to backend
   */
  async trackTelemetry(eventId, scenarioId, telemetryData) {
    try {
      const response = await fetch('http://localhost:3002/api/telemetry/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId,
          scenarioId,
          ...telemetryData
        })
      });

      if (!response.ok) {
        console.error('Failed to track telemetry:', await response.text());
      }
    } catch (error) {
      console.error('Error tracking telemetry:', error);
    }
  }
}

export default EventExecutor;
