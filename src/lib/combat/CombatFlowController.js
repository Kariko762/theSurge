/**
 * Combat Flow Controller
 * Executes a single turn for a combatant, delegating to AI or waiting for player.
 */

import { AICombatEngine } from './ai/AICombat.js';
import { executeAction, applyWeaponDamage } from './combatActions.js';

export class CombatFlowController {
  constructor(combatState) {
    this.combatState = combatState;
    this.stepByStepMode = false;
    this.currentAIPlan = null;
    this.currentPhaseIndex = 0;
    this.aiTurnPhases = [];
    this.pausedForReaction = false; // Track if we're paused waiting for player reaction
    this.pendingDamage = null; // Store attack context for damage application after reaction
    this.currentExecutor = null; // New executor instance (for phase-enforced AI turns)
  }

  /**
   * Enable/disable step-by-step mode
   */
  setStepByStepMode(enabled) {
    this.stepByStepMode = enabled;
  }

  /**
   * Resume AI turn after reaction window closes
   */
  async resumeAfterReaction() {
    console.log(`[CombatFlowController] Resuming AI turn after reaction`);
    this.pausedForReaction = false;
    
    // Check if using new executor
    if (this.currentExecutor && typeof this.currentExecutor.resumeAfterReaction === 'function') {
      console.log(`[CombatFlowController] Delegating resume to AICombatTurnExecutor`);
      return await this.currentExecutor.resumeAfterReaction();
    }
    
    // Legacy system: Apply damage now that reactions are resolved
    if (this.pendingDamage) {
      const { actor, target, weapon, attackResult } = this.pendingDamage;
      console.log(`[CombatFlowController] Applying deferred weapon damage with reaction validation`);
      const { applyWeaponDamageWithReactions } = await import('./combatActions.js');
      applyWeaponDamageWithReactions({ actor, target, weapon, attackResult, combatState: this.combatState });
      this.pendingDamage = null;
    }
    
    // Now advance to next phase
    this.currentPhaseIndex++;
    this.combatState.nextPhase(); // Move from ACTION to next phase
  }

  /**
   * Check if there are more phases to execute in current AI turn
   */
  hasMorePhases() {
    return this.currentPhaseIndex < this.aiTurnPhases.length;
  }

  /**
   * Get current phase info
   */
  getCurrentPhaseInfo() {
    if (this.currentPhaseIndex >= this.aiTurnPhases.length) return null;
    return this.aiTurnPhases[this.currentPhaseIndex];
  }

  getShip(id) {
    return this.combatState.combatants.find(c => c.id === id);
  }

  async executeTurn(shipId) {
    console.log(`[CombatFlowController] executeTurn called for ${shipId}`);
    console.log(`[CombatFlowController] stepByStepMode = ${this.stepByStepMode}`);
    const actor = this.getShip(shipId);
    if (!actor) return;

    if (actor.isAI) {
      // ========================================================================
      // FEATURE FLAG: Toggle between new phase-enforced executor and old system
      // ========================================================================
      const USE_NEW_EXECUTOR = !this.stepByStepMode; // Use new executor ONLY in auto mode
      
      if (USE_NEW_EXECUTOR) {
        console.log(`[CombatFlowController] Using NEW phase-enforced AI executor (auto mode)`);
        const { AICombatTurnExecutor } = await import('./ai/AICombatTurnExecutor.js');
        const executor = new AICombatTurnExecutor(this.combatState, this);
        
        // Store executor for resuming after reactions
        this.currentExecutor = executor;
        
        return await executor.executeTurn(shipId);
      }
      
      // ========================================================================
      // LEGACY SYSTEM (kept as fallback)
      // ========================================================================
      console.log(`[CombatFlowController] Using LEGACY AI system`);
      const personality = actor.personality || 'TACTICAL';
      const veteranRank = actor.veteranRank || 'TRAINED';
      console.log(`[CombatFlowController] Creating AI for ${actor.id}`);
      const ai = new AICombatEngine(actor, personality, veteranRank);
      console.log(`[CombatFlowController] Calling decideTurn...`);
      const plan = await ai.decideTurn(this.combatState);
      console.log(`[CombatFlowController] decideTurn returned:`, plan);
      
      if (this.stepByStepMode) {
        // Prepare phases for step-by-step execution
        this.currentAIPlan = plan;
        this.currentPhaseIndex = 0;
        this.aiTurnPhases = this.buildAIPhases(actor, plan);
        console.log(`[CombatFlowController] Built ${this.aiTurnPhases.length} phases for step-by-step execution:`, this.aiTurnPhases.map(p => p.type));
        console.log(`[CombatFlowController] RETURNING without executing - waiting for UI to call executeNextPhase()`);
        // Return full plan object including summary for UI display
        return { ...plan, stepByStep: true, phaseCount: this.aiTurnPhases.length };
      } else {
        // Execute entire turn at once
        console.log(`[CombatFlowController] Step-by-step mode OFF - executing full turn`);
        await this.executeAIPlan(actor, plan);
        return plan;
      }
    }

    // Player-controlled: in a real game, we'd wait for UI input.
    // For now, no-op and let external caller drive actions.
    return { strategy: 'PLAYER_INPUT' };
  }

  /**
   * Build phases array from AI plan for step-by-step execution
   */
  buildAIPhases(actor, plan) {
    const phases = [];
    const target = plan.targetId ? this.getShip(plan.targetId) : this.combatState.getEnemies(actor.id)[0];

    // Phase 1: Movement (ALWAYS create phase - even for STAY_PUT)
    // This ensures proper phase sequencing and prevents skipping
    const movement = plan.movement || { action: 'STAY_PUT' };
    phases.push({
      type: 'MOVEMENT',
      phase: 'movement',
      action: movement.action,
      data: { movement, target }
    });

    // Phase 2: Main Actions
    for (const actionType of plan.actions || []) {
      if (this.combatState.canPerformAction(actor.id, 'action')) {
        phases.push({
          type: 'ACTION',
          phase: 'action',
          action: actionType,
          data: { actionType, target }
        });
      }
    }

    // Phase 3: Bonus Actions
    for (const bonusType of plan.bonusActions || []) {
      if (this.combatState.canPerformAction(actor.id, 'bonusAction')) {
        phases.push({
          type: 'BONUS_ACTION',
          phase: 'bonusAction',
          action: bonusType,
          data: { bonusType, target }
        });
      }
    }

    // Phase 4: Final Movement (ALWAYS create phase - even for STAY_PUT)
    // Second movement opportunity at end of turn
    const finalMovement = plan.finalMovement || { action: 'STAY_PUT' };
    phases.push({
      type: 'FINAL_MOVEMENT',
      phase: 'movement',
      action: finalMovement.action,
      data: { movement: finalMovement, target }
    });

    return phases;
  }

  /**
   * Execute the next phase in step-by-step mode
   */
  async executeNextPhase() {
    if (!this.hasMorePhases()) {
      console.log(`[CombatFlowController] No more phases to execute`);
      return { done: true };
    }

    const phase = this.aiTurnPhases[this.currentPhaseIndex];
    const actor = this.combatState.getCurrentShip();
    
    console.log(`[CombatFlowController] Executing phase ${this.currentPhaseIndex + 1}/${this.aiTurnPhases.length}: ${phase.type} - ${phase.action}`);
    console.log(`[CombatFlowController] Current combat phase before execution: ${this.combatState.phase}`);
    
    const result = await this.executePhase(actor, phase);
    
    // Check if we're waiting for player reaction
    if (result.awaitingReaction) {
      console.log(`[CombatFlowController] Pausing for player reaction - reaction window open`);
      // Don't advance phase index yet - we'll resume this phase after reaction
      return {
        done: false,
        phase: phase.type,
        action: phase.action,
        result,
        remaining: this.aiTurnPhases.length - this.currentPhaseIndex,
        awaitingReaction: true
      };
    }
    
    // Advance combat phase after executing this AI phase
    // Movement phase -> Action phase, Action phase -> Reaction window, etc.
    if (phase.type === 'MOVEMENT' && this.combatState.phase === 'MOVEMENT') {
      // STAY_PUT or actual movement both advance the phase
      this.combatState.nextPhase(); // MOVEMENT -> ACTION
    } else if (phase.type === 'ACTION' && this.combatState.phase === 'ACTION') {
      this.combatState.nextPhase(); // ACTION -> BONUS_ACTION
    } else if (phase.type === 'BONUS_ACTION' && this.combatState.phase === 'BONUS_ACTION') {
      this.combatState.nextPhase(); // BONUS_ACTION -> END_TURN
    } else if (phase.type === 'FINAL_MOVEMENT' && this.combatState.phase === 'END_TURN') {
      // Final movement happens during END_TURN phase, and completes the turn
      // Don't advance - advanceTurn() will be called after all phases complete
    }
    
    console.log(`[CombatFlowController] Combat phase after execution: ${this.combatState.phase}`);
    
    this.currentPhaseIndex++;
    
    return {
      done: !this.hasMorePhases(),
      phase: phase.type,
      action: phase.action,
      result,
      remaining: this.aiTurnPhases.length - this.currentPhaseIndex
    };
  }

  /**
   * Execute a single phase
   */
  async executePhase(actor, phase) {
    const { type, action, data } = phase;
    const { target } = data;

    switch (type) {
      case 'MOVEMENT':
      case 'FINAL_MOVEMENT':
        return await this.executeMovementPhase(actor, data.movement, target);
      
      case 'ACTION':
        return await this.executeActionPhase(actor, data.actionType, target);
      
      case 'BONUS_ACTION':
        return await this.executeBonusActionPhase(actor, data.bonusType, target);
      
      default:
        return { success: false, message: 'Unknown phase type' };
    }
  }

  /**
   * Execute movement phase
   */
  async executeMovementPhase(actor, movement, target) {
    const moveType = movement.action;
    
    if (moveType === 'STAY_PUT') {
      // Log the STAY_PUT action explicitly
      this.combatState.log(`${actor.id} stays in position (no movement)`);
      return { success: true, message: 'Stayed in position' };
    }
    
    if (moveType === 'MOVE_CLOSER' || moveType === 'MOVE_FARTHER') {
      const movementPoints = movement.movementPoints ?? 100;
      const moveResult = executeAction(moveType, {
        actor,
        target,
        combatState: this.combatState,
        movementPoints
      });
      if (moveResult.success) {
        this.combatState.spendAction(actor.id, 'movement', moveType, movementPoints);
      }
      return moveResult;
    }
    
    return { success: false, message: 'Invalid movement type' };
  }

  /**
   * Execute action phase
   */
  async executeActionPhase(actor, actionType, target) {
    if (!this.combatState.canPerformAction(actor.id, 'action')) {
      return { success: false, message: 'No actions remaining' };
    }

    const ctx = { actor, target, combatState: this.combatState };
    
    if (actionType === 'FIRE_WEAPON') {
      const stats = actor.ship.calculateCombatStats();
      const weapon = stats.weapons[0];
      if (!weapon) return { success: false, message: 'No weapon' };
      ctx.weapon = weapon;

      // Execute attack (rolls to hit, does NOT apply damage yet)
      const attackResult = executeAction('FIRE_WEAPON', ctx);
      
      // Spend the action
      this.combatState.spendAction(actor.id, 'action', 'FIRE_WEAPON');

      // If attack hit, open reaction window BEFORE applying damage
      if (attackResult.hit && target) {
        const triggeringAction = { 
          actor: actor.id, 
          type: 'FIRE_WEAPON', 
          target: target.id, 
          data: { weapon, attackResult } 
        };
        const eligibleReactors = [target.id];

        const reactionsPromise = this.combatState.openReactionWindow(triggeringAction, eligibleReactors);

        // Let AI-controlled reactors decide and queue a reaction
        // Do NOT auto-decide for player-controlled reactors
        const hasPlayerReactor = eligibleReactors.some(rid => {
          const r = this.getShip(rid);
          return r && r.isPlayer;
        });

        if (!hasPlayerReactor) {
          // All reactors are AI, auto-decide
          for (const reactorId of eligibleReactors) {
            const reactor = this.getShip(reactorId);
            if (reactor && reactor.isAI) {
              const ai = new (await import('./ai/AICombat.js')).AICombatEngine(
                reactor,
                reactor.personality || 'TACTICAL',
                reactor.veteranRank || 'TRAINED'
              );
              const reactionType = ai.decideReaction(triggeringAction, this.combatState);
              if (reactionType) {
                this.combatState.queueReaction(reactor.id, reactionType, actor);
              }
            }
          }
          this.combatState.closeReactionWindow();
          await reactionsPromise;
          await this.combatState.resolveReactions();
          
          // NOW apply damage after reactions have resolved
          const { applyWeaponDamageWithReactions } = await import('./combatActions.js');
          applyWeaponDamageWithReactions({ actor, target, weapon, attackResult: attackResult.attackResult, combatState: this.combatState });
        } else {
          // Player needs to respond - store damage context and wait for player reaction
          this.pendingDamage = { actor, target, weapon, attackResult: attackResult.attackResult };
          return { ...attackResult, awaitingReaction: true };
        }
      }

      // Attack missed or no target
      return attackResult;
    }

    const result = executeAction(actionType, ctx);
    this.combatState.spendAction(actor.id, 'action', actionType);
    return result;
  }

  /**
   * Execute bonus action phase
   */
  async executeBonusActionPhase(actor, bonusType, target) {
    if (!this.combatState.canPerformAction(actor.id, 'bonusAction')) {
      return { success: false, message: 'No bonus actions remaining' };
    }

    const ctx = { actor, target, combatState: this.combatState };
    const result = executeAction(bonusType, ctx);
    this.combatState.spendAction(actor.id, 'bonusAction', bonusType);
    return result;
  }

  async executeAIPlan(actor, plan) {
    if (!plan) return;
    const target = plan.targetId ? this.getShip(plan.targetId) : this.combatState.getEnemies(actor.id)[0];

    // Movement
    if (plan.movement && this.combatState.canPerformAction(actor.id, 'movement')) {
      const moveType = plan.movement.action;
      if (moveType === 'MOVE_CLOSER' || moveType === 'MOVE_FARTHER') {
        const movementPoints = plan.movement.movementPoints ?? 100;
        const moveResult = executeAction(moveType, {
          actor,
          target,
          combatState: this.combatState,
          movementPoints
        });
        if (moveResult.success) {
          this.combatState.spendAction(actor.id, 'movement', moveType, movementPoints);
        }
      }
    }

    // Main actions
    for (const actionType of plan.actions || []) {
      if (!this.combatState.canPerformAction(actor.id, 'action')) break;

      // Provide minimal context per action
      const ctx = { actor, target, combatState: this.combatState };
      if (actionType === 'FIRE_WEAPON') {
        const stats = actor.ship.calculateCombatStats();
        const weapon = stats.weapons[0];
        if (!weapon) continue;
        ctx.weapon = weapon;

        // Execute attack (rolls to hit, does NOT apply damage yet)
        const attackResult = executeAction('FIRE_WEAPON', ctx);
        
        // Spend the action
        this.combatState.spendAction(actor.id, 'action', 'FIRE_WEAPON');

        // If attack hit, open reaction window BEFORE applying damage
        if (attackResult.hit && target) {
          const triggeringAction = { 
            actor: actor.id, 
            type: 'FIRE_WEAPON', 
            target: target.id, 
            data: { weapon, attackResult } 
          };
          const eligibleReactors = [target.id];

          const reactionsPromise = this.combatState.openReactionWindow(triggeringAction, eligibleReactors);

          // Check if player needs to react
          const hasPlayerReactor = eligibleReactors.some(rid => {
            const r = this.getShip(rid);
            return r && r.isPlayer;
          });

          if (!hasPlayerReactor) {
            // All reactors are AI, auto-decide
            for (const reactorId of eligibleReactors) {
              const reactor = this.getShip(reactorId);
              if (reactor && reactor.isAI) {
                const ai = new (await import('./ai/AICombat.js')).AICombatEngine(
                  reactor,
                  reactor.personality || 'TACTICAL',
                  reactor.veteranRank || 'TRAINED'
                );
                const reactionType = ai.decideReaction(triggeringAction, this.combatState);
                if (reactionType) {
                  this.combatState.queueReaction(reactor.id, reactionType, actor);
                }
              }
            }
            this.combatState.closeReactionWindow();
            await reactionsPromise;
            await this.combatState.resolveReactions();
            
            // NOW apply damage after reactions have resolved
            applyWeaponDamage({ actor, target, weapon, attackResult: attackResult.attackResult, combatState: this.combatState });
          }
          // If player reactor, reaction window stays open - damage applied after player responds
        }
        continue;
      }

      const result = executeAction(actionType, ctx);
      // Spend action regardless of hit/miss; attempting consumes the action
      this.combatState.spendAction(actor.id, 'action', actionType);
    }

    // Bonus actions
    for (const bonusType of plan.bonusActions || []) {
      if (!this.combatState.canPerformAction(actor.id, 'bonusAction')) break;
      const ctx = { actor, target, combatState: this.combatState };
      executeAction(bonusType, ctx);
      this.combatState.spendAction(actor.id, 'bonusAction', bonusType);
    }

    // Update phase/turn progression is handled by caller (e.g., CombatStateManager.nextPhase/advanceTurn)
  }

  async executeManualAction(actorId, action) {
    const actor = this.getShip(actorId);
    if (!actor) return;
    const target = action.targetId ? this.getShip(action.targetId) : this.combatState.getEnemies(actor.id)[0];
    const ctx = { actor, target, combatState: this.combatState };

    // Map action types to appropriate spend category
    const movementActions = new Set(['MOVE_CLOSER', 'MOVE_FARTHER']);
    const bonusActions = new Set(['BOOST_SHIELDS']);

    if (movementActions.has(action.type)) {
      if (!this.combatState.canPerformAction(actor.id, 'movement')) return;
      const movementPoints = action.movementPoints ?? 100;
      const res = executeAction(action.type, { ...ctx, movementPoints });
      if (res?.success) this.combatState.spendAction(actor.id, 'movement', action.type, movementPoints);
      return res;
    }

    if (action.type === 'FIRE_WEAPON') {
      if (!this.combatState.canPerformAction(actor.id, 'action')) return;
      const stats = actor.ship.calculateCombatStats();
      let weapon = stats.weapons[0];
      if (action.weaponId) {
        weapon = stats.weapons.find(w => w.id === action.weaponId) || weapon;
      } else if (typeof action.weaponIndex === 'number' && stats.weapons[action.weaponIndex]) {
        weapon = stats.weapons[action.weaponIndex];
      }
      if (!weapon) return;
      ctx.weapon = weapon;

      // Execute attack (rolls to hit, does NOT apply damage yet)
      const attackResult = executeAction('FIRE_WEAPON', ctx);
      
      // Spend the action
      this.combatState.spendAction(actor.id, 'action', 'FIRE_WEAPON');

      // If attack hit, open reaction window BEFORE applying damage
      if (attackResult.hit && target) {
        const triggeringAction = { 
          actor: actor.id, 
          type: 'FIRE_WEAPON', 
          target: target.id, 
          data: { weapon, attackResult } 
        };
        const eligibleReactors = [target.id];
        const reactionsPromise = this.combatState.openReactionWindow(triggeringAction, eligibleReactors);
        
        // If reactor is AI, auto decide + close
        for (const reactorId of eligibleReactors) {
          const reactor = this.getShip(reactorId);
          if (reactor && reactor.isAI) {
            const ai = new (await import('./ai/AICombat.js')).AICombatEngine(
              reactor,
              reactor.personality || 'TACTICAL',
              reactor.veteranRank || 'TRAINED'
            );
            const reactionType = ai.decideReaction(triggeringAction, this.combatState);
            if (reactionType) {
              this.combatState.queueReaction(reactor.id, reactionType, actor);
            }
          }
        }
        
        const allAIReactors = eligibleReactors.every(rid => {
          const r = this.getShip(rid);
          return r && r.isAI;
        });
        if (allAIReactors) {
          this.combatState.closeReactionWindow();
        }
        
        await reactionsPromise;
        await this.combatState.resolveReactions();
        
        // NOW apply damage after reactions have resolved
        const damageResult = applyWeaponDamage({ 
          actor, 
          target, 
          weapon, 
          attackResult: attackResult.attackResult, 
          combatState: this.combatState 
        });
        
        return { ...attackResult, ...damageResult };
      }

      return attackResult;
    }

    if (action.type === 'SCAN_TARGET' || action.type === 'EMERGENCY_REPAIR') {
      if (!this.combatState.canPerformAction(actor.id, 'action')) return;
      const res = executeAction(action.type, ctx);
      this.combatState.spendAction(actor.id, 'action', action.type);
      return res;
    }

    if (action.type === 'TARGET_LOCK' || action.type === 'POWER_REDISTRIBUTE') {
      if (!this.combatState.canPerformAction(actor.id, 'bonusAction')) return;
      const res = executeAction(action.type, ctx);
      this.combatState.spendAction(actor.id, 'bonusAction', action.type);
      return res;
    }

    if (bonusActions.has(action.type)) {
      if (!this.combatState.canPerformAction(actor.id, 'bonusAction')) return;
      const res = executeAction(action.type, ctx);
      this.combatState.spendAction(actor.id, 'bonusAction', action.type);
      return res;
    }

    if (action.type === 'EVASIVE_MANEUVERS') {
      if (!this.combatState.canPerformAction(actor.id, 'action')) return;
      const res = executeAction(action.type, ctx);
      this.combatState.spendAction(actor.id, 'action', action.type);
      return res;
    }

    // Unknown action: no-op
    return null;
  }
}

export default CombatFlowController;
