/**
 * Dynamic Event Scheduler
 * Manages risk-based event triggering using game tick system
 */

import { calculateRiskScore, getRiskLevel, getCheckInterval } from './riskCalculator.js';
import { getEventsByTrigger, getEligibleEvents, selectWeightedEvent } from './triggerManager.js';

export class DynamicEventScheduler {
  constructor() {
    this.enabled = false;
    this.config = null;
    this.gameState = null;
    
    // Timing
    this.lastCheckTime = 0;
    this.currentInterval = 60; // seconds
    this.nextCheckTime = 0;
    
    // Cooldowns
    this.globalCooldown = 30; // seconds
    this.lastEventTime = 0;
    this.eventCooldowns = new Map(); // eventType -> lastTriggerTime
    
    // History
    this.eventHistory = [];
    this.maxHistorySize = 20;
    
    // Callbacks
    this.onEventTrigger = null; // callback(eventId, gameState)
    this.onRiskUpdate = null; // callback(riskScore, riskLevel)
    
    // Stats
    this.stats = {
      totalChecks: 0,
      totalTriggers: 0,
      currentRisk: 0,
      currentInterval: 60
    };

    console.log('[DynamicEventScheduler] Initialized');
  }

  /**
   * Start the scheduler
   */
  start(config, gameState, onEventTrigger = null, onRiskUpdate = null) {
    if (!config || !gameState) {
      console.error('[DynamicEventScheduler] Cannot start: missing config or gameState');
      return;
    }

    this.config = config;
    this.gameState = gameState;
    this.enabled = config.enabled !== false;
    this.globalCooldown = config.globalCooldown || 30;
    
    // Set callbacks
    if (onEventTrigger) this.onEventTrigger = onEventTrigger;
    if (onRiskUpdate) this.onRiskUpdate = onRiskUpdate;
    
    this.lastCheckTime = Date.now();
    this.updateInterval();

    console.log('[DynamicEventScheduler] Started', {
      enabled: this.enabled,
      interval: this.currentInterval,
      globalCooldown: this.globalCooldown
    });
  }

  /**
   * Stop the scheduler
   */
  stop() {
    this.enabled = false;
    console.log('[DynamicEventScheduler] Stopped');
  }

  /**
   * Update game state (call this whenever game state changes)
   */
  updateGameState(gameState) {
    this.gameState = gameState;
    this.updateInterval(); // Recalculate interval based on new state
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(config) {
    this.config = config;
    this.enabled = config.enabled !== false;
    this.globalCooldown = config.globalCooldown || 30;
    this.updateInterval();
  }

  /**
   * Main tick function - call this every game tick (e.g., every second)
   */
  tick(currentTime = Date.now()) {
    if (!this.enabled || !this.config || !this.gameState) {
      return;
    }

    // Check if it's time for an event check
    const secondsSinceLastCheck = (currentTime - this.lastCheckTime) / 1000;
    
    if (secondsSinceLastCheck >= this.currentInterval) {
      this.performEventCheck(currentTime);
      this.lastCheckTime = currentTime;
      this.updateInterval(); // Adjust interval based on current risk
    }
  }

  /**
   * Update check interval based on current risk
   */
  updateInterval() {
    if (!this.config || !this.gameState) return;

    const riskScore = calculateRiskScore(this.gameState, this.config);
    const riskLevel = getRiskLevel(riskScore);
    const newInterval = getCheckInterval(riskScore, this.config);
    
    if (newInterval !== this.currentInterval) {
      console.log(`[DynamicEventScheduler] Risk: ${riskScore.toFixed(1)}% (${riskLevel.level}) - Interval: ${newInterval}s`);
      this.currentInterval = newInterval;
    }

    this.stats.currentRisk = riskScore;
    this.stats.currentInterval = newInterval;

    // Calculate time until next check
    const now = Date.now();
    const secondsSinceLastCheck = (now - this.lastCheckTime) / 1000;
    const nextCheck = Math.max(0, this.currentInterval - secondsSinceLastCheck);

    // Notify risk update callback with complete assessment
    if (this.onRiskUpdate) {
      this.onRiskUpdate({
        score: riskScore,
        level: riskLevel.level,
        color: riskLevel.color,
        nextCheck: nextCheck,
        breakdown: {} // TODO: Add detailed breakdown
      });
    }
  }

  /**
   * Perform event check (roll dice, maybe trigger event)
   */
  performEventCheck(currentTime) {
    this.stats.totalChecks++;

    // Calculate current risk
    const riskScore = calculateRiskScore(this.gameState, this.config);
    
    // Roll d100
    const roll = Math.floor(Math.random() * 100);
    
    console.log(`[DynamicEventScheduler] Check #${this.stats.totalChecks}: Roll ${roll} vs Risk ${riskScore.toFixed(1)}`);

    // Event triggers if roll < risk
    if (roll < riskScore) {
      this.attemptTriggerEvent(currentTime);
    }
  }

  /**
   * Attempt to trigger an event (respecting cooldowns)
   */
  async attemptTriggerEvent(currentTime) {
    // Check global cooldown
    const secondsSinceLastEvent = (currentTime - this.lastEventTime) / 1000;
    if (secondsSinceLastEvent < this.globalCooldown) {
      console.log(`[DynamicEventScheduler] Blocked by global cooldown (${secondsSinceLastEvent.toFixed(1)}s / ${this.globalCooldown}s)`);
      return;
    }

    if (!this.onEventTrigger) {
      console.warn('[DynamicEventScheduler] No onEventTrigger callback registered');
      return;
    }

    try {
      // Fetch all events from backend
      const response = await fetch('http://localhost:3002/api/events');
      const data = await response.json();
      const allEvents = data.events || []; // Backend returns {success, events}
      
      // Get eligible events with weights
      const eligibleEvents = getEligibleEvents(allEvents, 'dynamic', this.gameState, this);
      
      console.log(`[DynamicEventScheduler] ${eligibleEvents.length} events eligible`);
      
      if (eligibleEvents.length === 0) {
        console.log('[DynamicEventScheduler] No eligible events for current game state');
        return;
      }
      
      // Select weighted random event
      const selectedEvent = selectWeightedEvent(eligibleEvents);
      console.log('[DynamicEventScheduler] Selected event:', selectedEvent);
      
      if (!selectedEvent) {
        console.log('[DynamicEventScheduler] Event selection failed');
        return;
      }
      
      console.log(`[DynamicEventScheduler] Selected event: ${selectedEvent.id}`);
      
      // Update stats and tracking
      this.stats.totalTriggers++;
      this.lastEventTime = currentTime;
      
      // Trigger the event via callback
      this.onEventTrigger(selectedEvent.id, selectedEvent.type || 'unknown', selectedEvent);
      
      // Record event for cooldown tracking
      this.recordEvent(selectedEvent.id, currentTime, selectedEvent.type);
      
    } catch (error) {
      console.error('[DynamicEventScheduler] Error triggering event:', error);
    }
  }

  /**
   * Record event execution for cooldown tracking
   */
  recordEvent(eventId, timestamp = Date.now(), eventType = 'unknown') {
    // Add to history
    this.eventHistory.push({
      id: eventId,
      type: eventType,
      timestamp
    });

    // Trim history to max size
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Update type-specific cooldown
    if (eventType && eventType !== 'unknown') {
      this.eventCooldowns.set(eventType, timestamp);
    }

    console.log(`[DynamicEventScheduler] Recorded event: ${eventId} (${eventType})`);
  }

  /**
   * Check if event type is on cooldown
   */
  isOnCooldown(eventType, currentTime = Date.now()) {
    if (!this.config || !this.config.eventCooldowns) return false;

    const cooldownDuration = this.config.eventCooldowns[eventType];
    if (!cooldownDuration) return false;

    const lastTrigger = this.eventCooldowns.get(eventType);
    if (!lastTrigger) return false;

    const secondsSince = (currentTime - lastTrigger) / 1000;
    return secondsSince < cooldownDuration;
  }

  /**
   * Get time remaining on event type cooldown
   */
  getCooldownRemaining(eventType, currentTime = Date.now()) {
    if (!this.config || !this.config.eventCooldowns) return 0;

    const cooldownDuration = this.config.eventCooldowns[eventType];
    if (!cooldownDuration) return 0;

    const lastTrigger = this.eventCooldowns.get(eventType);
    if (!lastTrigger) return 0;

    const secondsSince = (currentTime - lastTrigger) / 1000;
    const remaining = Math.max(0, cooldownDuration - secondsSince);
    return remaining;
  }

  /**
   * Force an immediate check (for debugging)
   */
  forceCheck() {
    console.log('[DynamicEventScheduler] Force check triggered');
    this.performEventCheck(Date.now());
  }

  /**
   * Reset all cooldowns (for debugging/testing)
   */
  resetCooldowns() {
    this.lastEventTime = 0;
    this.eventCooldowns.clear();
    this.eventHistory = [];
    console.log('[DynamicEventScheduler] Cooldowns reset');
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    return {
      ...this.stats,
      enabled: this.enabled,
      globalCooldownRemaining: Math.max(0, this.globalCooldown - (Date.now() - this.lastEventTime) / 1000),
      eventHistorySize: this.eventHistory.length,
      activeTypeCooldowns: Array.from(this.eventCooldowns.entries()).map(([type, time]) => ({
        type,
        remaining: this.getCooldownRemaining(type)
      })).filter(c => c.remaining > 0)
    };
  }

  /**
   * Get current risk assessment
   */
  getRiskAssessment() {
    if (!this.config || !this.gameState) {
      return { score: 0, level: 'UNKNOWN', interval: 60 };
    }

    const score = calculateRiskScore(this.gameState, this.config);
    const level = getRiskLevel(score);
    const interval = getCheckInterval(score, this.config);

    return {
      score: score.toFixed(1),
      level: level.level,
      color: level.color,
      description: level.description,
      interval,
      checksPerMinute: (60 / interval).toFixed(1)
    };
  }
}

// Singleton instance
export const dynamicScheduler = new DynamicEventScheduler();
