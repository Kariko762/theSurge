/**
 * AI Combat Turn Executor
 * Enforces strict phase-by-phase execution of AI turns
 * Prevents phase skipping and ensures proper game flow
 */

import { AICombatEngine } from './AICombat.js';
import { executeAction } from '../combatActions.js';

export class AICombatTurnExecutor {
  constructor(combatState, flowController) {
    this.combatState = combatState;
    this.flowController = flowController;
    this.currentPhase = null;
    this.decisionPlan = null;
    this.actorId = null;
    this.devMode = false; // TODO: Hook to game settings
    this.pausedForReaction = false;
    this.resumeAtPhase = null;
  }

  // ==========================================================================
  // PHASE 1: DECISION
  // ==========================================================================

  /**
   * AI analyzes battlefield and decides strategy
   * Sets phase: DECISION
   */
  async phase_Decision() {
    this.enforcePhase('DECISION');
    this.logPhase('DECISION', 'Starting AI decision workflow...');
    
    const actor = this.getActor();
    if (!actor) {
      throw new Error(`Actor ${this.actorId} not found in combat`);
    }

    // Create AI engine and get decision
    const personality = actor.personality || 'TACTICAL';
    const veteranRank = actor.veteranRank || 'TRAINED';
    
    const ai = new AICombatEngine(actor, personality, veteranRank);
    this.decisionPlan = await ai.decideTurn(this.combatState);
    
    this.logPhase('DECISION', `Strategy: ${this.decisionPlan.strategy}`);
    this.logPhase('DECISION', `Target: ${this.decisionPlan.targetId || 'none'}`);
    this.logPhase('DECISION', `Actions: ${this.decisionPlan.actions?.join(', ') || 'none'}`);
    
    return this.advanceToNextPhase('MOVEMENT_PRE');
  }

  // ==========================================================================
  // PHASE 2: PRE-ACTION MOVEMENT
  // ==========================================================================

  /**
   * Execute movement before main action
   * Sets phase: MOVEMENT (combat state phase)
   * CRITICAL: Always consumes the movement phase, even if staying put
   */
  async phase_Movement_Pre() {
    this.enforcePhase('MOVEMENT_PRE');
    this.logPhase('MOVEMENT_PRE', 'Processing pre-action movement...');
    
    const actor = this.getActor();
    const movement = this.decisionPlan.movement;
    
    // CRITICAL: Check if combat state is in MOVEMENT phase
    if (this.combatState.phase !== 'MOVEMENT') {
      this.logPhase('MOVEMENT_PRE', `WARNING: Combat state phase is ${this.combatState.phase}, expected MOVEMENT`);
    }
    
    // Execute movement (or stay put)
    if (!movement || movement.action === 'STAY_PUT') {
      this.logPhase('MOVEMENT_PRE', 'Staying in position (no movement)');
      // Still consume the phase - this prevents skipping
      this.combatState.nextPhase(); // MOVEMENT → ACTION
    } else {
      const target = this.getTarget();
      const result = await this.flowController.executeMovementPhase(actor, movement, target);
      
      if (result.success) {
        this.logPhase('MOVEMENT_PRE', `Moved: ${movement.action}`);
      } else {
        this.logPhase('MOVEMENT_PRE', `Movement failed: ${result.message}`);
      }
      
      // Advance combat state phase
      this.combatState.nextPhase(); // MOVEMENT → ACTION
    }
    
    return this.advanceToNextPhase('ACTION');
  }

  // ==========================================================================
  // PHASE 3: ACTION
  // ==========================================================================

  /**
   * Execute main action (usually FIRE_WEAPON)
   * Sets phase: ACTION
   * May pause for player reactions
   */
  async phase_Action() {
    this.enforcePhase('ACTION');
    this.logPhase('ACTION', 'Processing main action...');
    
    const actor = this.getActor();
    const actions = this.decisionPlan.actions || [];
    
    // Check combat state phase
    if (this.combatState.phase !== 'ACTION') {
      this.logPhase('ACTION', `WARNING: Combat state phase is ${this.combatState.phase}, expected ACTION`);
    }
    
    // No action planned
    if (actions.length === 0) {
      this.logPhase('ACTION', 'No actions planned - skipping');
      this.combatState.nextPhase(); // ACTION → BONUS_ACTION
      return this.advanceToNextPhase('BONUS_ACTION');
    }
    
    // Execute ONLY the first action
    const actionType = actions[0];
    const target = this.getTarget();
    
    this.logPhase('ACTION', `Executing: ${actionType}`);
    
    const result = await this.flowController.executeActionPhase(actor, actionType, target);
    
    // Check if we need to pause for player reaction
    if (result.awaitingReaction) {
      this.logPhase('ACTION', 'PAUSING - Awaiting player reaction');
      this.pausedForReaction = true;
      this.resumeAtPhase = 'BONUS_ACTION';
      
      // Combat state phase will advance after reaction resolves
      return { 
        paused: true, 
        phase: 'REACTION_WINDOW', 
        resumeAt: 'BONUS_ACTION',
        message: 'Waiting for player reaction'
      };
    }
    
    // Action complete, advance phase
    this.combatState.nextPhase(); // ACTION → BONUS_ACTION
    return this.advanceToNextPhase('BONUS_ACTION');
  }

  // ==========================================================================
  // PHASE 4: BONUS ACTION
  // ==========================================================================

  /**
   * Execute bonus action (if any)
   * Sets phase: BONUS_ACTION
   */
  async phase_BonusAction() {
    this.enforcePhase('BONUS_ACTION');
    this.logPhase('BONUS_ACTION', 'Processing bonus action...');
    
    const actor = this.getActor();
    const bonusActions = this.decisionPlan.bonusActions || [];
    
    // Check combat state phase
    if (this.combatState.phase !== 'BONUS_ACTION') {
      this.logPhase('BONUS_ACTION', `WARNING: Combat state phase is ${this.combatState.phase}, expected BONUS_ACTION`);
    }
    
    // No bonus action planned
    if (bonusActions.length === 0) {
      this.logPhase('BONUS_ACTION', 'No bonus actions planned');
      this.combatState.nextPhase(); // BONUS_ACTION → END_TURN
      return this.advanceToNextPhase('MOVEMENT_POST');
    }
    
    // Execute first bonus action
    const bonusType = bonusActions[0];
    const target = this.getTarget();
    
    this.logPhase('BONUS_ACTION', `Executing: ${bonusType}`);
    
    const result = await this.flowController.executeBonusActionPhase(actor, bonusType, target);
    
    if (result.success) {
      this.logPhase('BONUS_ACTION', 'Bonus action complete');
    } else {
      this.logPhase('BONUS_ACTION', `Bonus action failed: ${result.message}`);
    }
    
    // Advance phase
    this.combatState.nextPhase(); // BONUS_ACTION → END_TURN
    return this.advanceToNextPhase('MOVEMENT_POST');
  }

  // ==========================================================================
  // PHASE 5: POST-ACTION MOVEMENT
  // ==========================================================================

  /**
   * Execute final movement (if any)
   * Sets phase: MOVEMENT_POST
   * Combat state should be in END_TURN phase
   */
  async phase_Movement_Post() {
    this.enforcePhase('MOVEMENT_POST');
    this.logPhase('MOVEMENT_POST', 'Processing post-action movement...');
    
    const actor = this.getActor();
    const finalMovement = this.decisionPlan.finalMovement;
    
    // No final movement planned
    if (!finalMovement || finalMovement.action === 'STAY_PUT') {
      this.logPhase('MOVEMENT_POST', 'No final movement');
      return this.advanceToNextPhase('END_TURN');
    }
    
    // Execute final movement
    const target = this.getTarget();
    const result = await this.flowController.executeMovementPhase(actor, finalMovement, target);
    
    if (result.success) {
      this.logPhase('MOVEMENT_POST', `Moved: ${finalMovement.action}`);
    } else {
      this.logPhase('MOVEMENT_POST', `Movement failed: ${result.message}`);
    }
    
    return this.advanceToNextPhase('END_TURN');
  }

  // ==========================================================================
  // PHASE 6: END TURN
  // ==========================================================================

  /**
   * Finalize turn and advance to next combatant
   * Sets phase: END_TURN
   */
  async phase_EndTurn() {
    this.enforcePhase('END_TURN');
    this.logPhase('END_TURN', 'Finalizing turn...');
    
    // Turn is complete
    this.logPhase('END_TURN', `${this.actorId}'s turn complete`);
    
    // Combat state manager will handle advanceTurn in the calling code
    // We just signal that we're done
    
    return { complete: true };
  }

  // ==========================================================================
  // ORCHESTRATOR - Main Entry Point
  // ==========================================================================

  /**
   * Execute full AI turn through all phases
   * @param {string} actorId - ID of AI ship taking turn
   * @returns {object} Result with completion status
   */
  async executeTurn(actorId) {
    this.actorId = actorId;
    this.currentPhase = 'DECISION';
    this.pausedForReaction = false;
    this.resumeAtPhase = null;
    
    console.log(`\n[AICombatTurnExecutor] ========== STARTING AI TURN: ${actorId} ==========`);
    
    const phaseSequence = [
      'phase_Decision',
      'phase_Movement_Pre',
      'phase_Action',
      'phase_BonusAction',
      'phase_Movement_Post',
      'phase_EndTurn'
    ];
    
    for (const phaseMethod of phaseSequence) {
      console.log(`[AICombatTurnExecutor] Executing ${phaseMethod}...`);
      
      try {
        const result = await this[phaseMethod]();
        
        // Check for pause (reaction window)
        if (result?.paused) {
          console.log(`[AICombatTurnExecutor] PAUSED at ${phaseMethod} - awaiting reaction`);
          return result;
        }
        
        // Dev mode checkpoint (if enabled)
        if (this.devMode && phaseMethod !== 'phase_EndTurn') {
          await this.waitForDevContinue(phaseMethod);
        }
        
      } catch (error) {
        console.error(`[AICombatTurnExecutor] ERROR in ${phaseMethod}:`, error);
        this.logPhase('ERROR', `Phase ${phaseMethod} failed: ${error.message}`);
        throw error;
      }
    }
    
    console.log(`[AICombatTurnExecutor] ========== AI TURN COMPLETE: ${actorId} ==========\n`);
    
    return { 
      complete: true, 
      strategy: this.decisionPlan.strategy,
      logs: this.decisionPlan.logs 
    };
  }

  /**
   * Resume turn after reaction window closes
   */
  async resumeAfterReaction() {
    if (!this.pausedForReaction || !this.resumeAtPhase) {
      console.error('[AICombatTurnExecutor] Cannot resume - not paused or no resume point');
      return;
    }
    
    console.log(`[AICombatTurnExecutor] Resuming at ${this.resumeAtPhase}...`);
    
    this.pausedForReaction = false;
    const resumePhase = this.resumeAtPhase;
    this.resumeAtPhase = null;
    
    // Map resume point to phase method
    const phaseMap = {
      'BONUS_ACTION': 'phase_BonusAction',
      'MOVEMENT_POST': 'phase_Movement_Post',
      'END_TURN': 'phase_EndTurn'
    };
    
    const startPhaseMethod = phaseMap[resumePhase];
    if (!startPhaseMethod) {
      console.error(`[AICombatTurnExecutor] Unknown resume phase: ${resumePhase}`);
      return;
    }
    
    // Build remaining phase sequence
    const fullSequence = [
      'phase_BonusAction',
      'phase_Movement_Post',
      'phase_EndTurn'
    ];
    
    const startIndex = fullSequence.indexOf(startPhaseMethod);
    const remainingPhases = fullSequence.slice(startIndex);
    
    // Execute remaining phases
    for (const phaseMethod of remainingPhases) {
      console.log(`[AICombatTurnExecutor] Executing ${phaseMethod}...`);
      this.currentPhase = phaseMethod.replace('phase_', '').toUpperCase();
      
      try {
        const result = await this[phaseMethod]();
        
        if (result?.paused) {
          console.log(`[AICombatTurnExecutor] PAUSED again at ${phaseMethod}`);
          return result;
        }
        
      } catch (error) {
        console.error(`[AICombatTurnExecutor] ERROR in ${phaseMethod}:`, error);
        throw error;
      }
    }
    
    console.log(`[AICombatTurnExecutor] ========== AI TURN RESUMED & COMPLETE ==========\n`);
    return { complete: true };
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Enforce that we're in the expected phase
   * Throws error if phase mismatch (prevents phase skipping)
   */
  enforcePhase(expectedPhase) {
    if (this.currentPhase !== expectedPhase) {
      const error = `PHASE VIOLATION: Expected ${expectedPhase}, but currently in ${this.currentPhase}`;
      console.error(`[AICombatTurnExecutor] ${error}`);
      throw new Error(error);
    }
  }

  /**
   * Advance to next phase in sequence
   */
  advanceToNextPhase(nextPhase) {
    const previousPhase = this.currentPhase;
    this.currentPhase = nextPhase;
    console.log(`[AICombatTurnExecutor] Phase transition: ${previousPhase} → ${nextPhase}`);
    return { continue: true, nextPhase };
  }

  /**
   * Get actor ship object
   */
  getActor() {
    return this.combatState.combatants.find(c => c.id === this.actorId);
  }

  /**
   * Get target ship object
   */
  getTarget() {
    if (!this.decisionPlan.targetId) {
      // Default to first enemy
      const enemies = this.combatState.getEnemies(this.actorId);
      return enemies.length > 0 ? enemies[0] : null;
    }
    return this.combatState.combatants.find(c => c.id === this.decisionPlan.targetId);
  }

  /**
   * Log phase activity
   */
  logPhase(phase, message) {
    const logMessage = `[${phase}] ${message}`;
    console.log(`[AICombatTurnExecutor] ${logMessage}`);
    this.combatState.logWithPhase(logMessage, phase);
  }

  /**
   * Dev mode: Wait for manual continue
   */
  async waitForDevContinue(completedPhase) {
    console.log(`[DEV MODE] Completed ${completedPhase}. Waiting for continue signal...`);
    
    // Emit event for UI to show "Continue" button
    this.combatState.emit?.('devModeCheckpoint', { 
      phase: completedPhase,
      actorId: this.actorId,
      decisionPlan: this.decisionPlan,
      combatPhase: this.combatState.phase
    });
    
    // Wait for continue signal
    return new Promise(resolve => {
      this.combatState.once?.('devModeContinue', resolve);
    });
  }
}

export default AICombatTurnExecutor;
