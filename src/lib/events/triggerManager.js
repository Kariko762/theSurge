/**
 * Event Trigger Manager
 * Evaluates event trigger conditions and selects events based on game state
 */

/**
 * Get all events that match trigger type
 * @param {Array} allEvents - All event definitions
 * @param {string} triggerType - Type of trigger (e.g., 'dynamic', 'poi_action')
 * @returns {Array} Filtered events
 */
export function getEventsByTrigger(allEvents, triggerType) {
  return allEvents.filter(event => event.trigger?.type === triggerType);
}

/**
 * Evaluate if event's trigger conditions are met
 * @param {Object} event - Event definition
 * @param {Object} gameState - Current game state
 * @param {Object} scheduler - Scheduler instance for cooldown checks
 * @returns {boolean} True if conditions are met
 */
export function evaluateTriggerConditions(event, gameState, scheduler = null) {
  const conditions = event.trigger?.conditions;
  if (!conditions) return true; // No conditions = always eligible

  // Wake check
  if (conditions.wake) {
    const wake = gameState.wake || 0;
    if (conditions.wake.min !== undefined && wake < conditions.wake.min) return false;
    if (conditions.wake.max !== undefined && wake > conditions.wake.max) return false;
  }

  // Zone check
  if (conditions.zone) {
    const zones = Array.isArray(conditions.zone) ? conditions.zone : [conditions.zone];
    if (!zones.includes(gameState.location?.zone)) return false;
  }

  // Radiation check
  if (conditions.radiation) {
    const radiationLevels = ['low', 'moderate', 'high', 'extreme'];
    const currentLevel = radiationLevels.indexOf(gameState.location?.radiation || 'low');
    
    if (conditions.radiation.min) {
      const minLevel = radiationLevels.indexOf(conditions.radiation.min);
      if (currentLevel < minLevel) return false;
    }
    
    if (conditions.radiation.max) {
      const maxLevel = radiationLevels.indexOf(conditions.radiation.max);
      if (currentLevel > maxLevel) return false;
    }
  }

  // Time in system check
  if (conditions.timeInSystem) {
    const time = gameState.timeInSystem || 0;
    if (conditions.timeInSystem.min !== undefined && time < conditions.timeInSystem.min) return false;
    if (conditions.timeInSystem.max !== undefined && time > conditions.timeInSystem.max) return false;
  }

  // Faction standing check
  if (conditions.factionStanding) {
    const { faction, min, max } = conditions.factionStanding;
    const standing = gameState.factionStanding?.[faction];
    
    if (standing === undefined) return false;
    if (min !== undefined && standing < min) return false;
    if (max !== undefined && standing > max) return false;
  }

  // POI type check (for poi_action triggers)
  if (conditions.poiType) {
    const poiTypes = Array.isArray(conditions.poiType) ? conditions.poiType : [conditions.poiType];
    if (!poiTypes.includes(gameState.poi?.type)) return false;
  }

  // Action check (for poi_action triggers)
  if (conditions.action && gameState.action !== conditions.action) {
    return false;
  }

  // Recent event check (don't trigger same event too soon)
  if (conditions.notRecent) {
    const notRecent = Array.isArray(conditions.notRecent) ? conditions.notRecent : [conditions.notRecent];
    const recentIds = (gameState.eventHistory || []).map(e => e.id);
    
    for (const id of notRecent) {
      if (recentIds.includes(id)) return false;
    }
  }

  // Cooldown check
  if (scheduler && conditions.cooldownSeconds) {
    const eventType = event.metadata?.tags?.[0] || 'unknown';
    if (scheduler.isOnCooldown(eventType)) return false;
  }

  // All conditions passed
  return true;
}

/**
 * Get all eligible events for current game state
 * @param {Array} allEvents - All event definitions
 * @param {string} triggerType - Trigger type to filter by
 * @param {Object} gameState - Current game state
 * @param {Object} scheduler - Scheduler instance
 * @returns {Array} Eligible events with weights
 */
export function getEligibleEvents(allEvents, triggerType, gameState, scheduler = null) {
  // Filter by trigger type
  const matchingEvents = getEventsByTrigger(allEvents, triggerType);

  // Filter by enabled status
  const enabledEvents = matchingEvents.filter(event => event.metadata?.enabled !== false);

  // Filter by trigger conditions
  const eligibleEvents = enabledEvents.filter(event => 
    evaluateTriggerConditions(event, gameState, scheduler)
  );

  // Map to include weights
  return eligibleEvents.map(event => ({
    event,
    weight: event.trigger?.weight || 1.0
  }));
}

/**
 * Select event from weighted pool
 * @param {Array} eligibleEvents - Array of {event, weight} objects
 * @returns {Object|null} Selected event or null if none eligible
 */
export function selectWeightedEvent(eligibleEvents) {
  if (!eligibleEvents || eligibleEvents.length === 0) return null;

  // Calculate total weight
  const totalWeight = eligibleEvents.reduce((sum, item) => sum + item.weight, 0);

  // Random selection
  let random = Math.random() * totalWeight;

  for (const item of eligibleEvents) {
    random -= item.weight;
    if (random <= 0) {
      return item.event;
    }
  }

  // Fallback to first event (shouldn't happen)
  return eligibleEvents[0].event;
}

/**
 * Main function: Get a random event for current game state
 * @param {Array} allEvents - All event definitions
 * @param {string} triggerType - Trigger type (e.g., 'dynamic')
 * @param {Object} gameState - Current game state
 * @param {Object} scheduler - Scheduler instance
 * @returns {Object|null} Selected event or null if none eligible
 */
export function triggerEvent(allEvents, triggerType, gameState, scheduler = null) {
  const eligible = getEligibleEvents(allEvents, triggerType, gameState, scheduler);
  
  if (eligible.length === 0) {
    console.log(`[TriggerManager] No eligible events for trigger type: ${triggerType}`);
    return null;
  }

  const selected = selectWeightedEvent(eligible);
  
  console.log(`[TriggerManager] Selected event: ${selected?.id} (from ${eligible.length} eligible)`);
  
  return selected;
}

/**
 * Get debug info about event eligibility
 */
export function debugEventEligibility(event, gameState, scheduler = null) {
  const conditions = event.trigger?.conditions || {};
  const results = {};

  // Check each condition
  if (conditions.wake) {
    const wake = gameState.wake || 0;
    results.wake = {
      required: conditions.wake,
      actual: wake,
      passed: (conditions.wake.min === undefined || wake >= conditions.wake.min) &&
              (conditions.wake.max === undefined || wake <= conditions.wake.max)
    };
  }

  if (conditions.zone) {
    const zones = Array.isArray(conditions.zone) ? conditions.zone : [conditions.zone];
    results.zone = {
      required: zones,
      actual: gameState.location?.zone,
      passed: zones.includes(gameState.location?.zone)
    };
  }

  if (conditions.factionStanding) {
    const { faction, min, max } = conditions.factionStanding;
    const standing = gameState.factionStanding?.[faction];
    results.factionStanding = {
      faction,
      required: { min, max },
      actual: standing,
      passed: standing !== undefined &&
              (min === undefined || standing >= min) &&
              (max === undefined || standing <= max)
    };
  }

  if (scheduler && conditions.cooldownSeconds) {
    const eventType = event.metadata?.tags?.[0] || 'unknown';
    const onCooldown = scheduler.isOnCooldown(eventType);
    results.cooldown = {
      duration: conditions.cooldownSeconds,
      remaining: scheduler.getCooldownRemaining(eventType),
      passed: !onCooldown
    };
  }

  const overall = evaluateTriggerConditions(event, gameState, scheduler);

  return {
    eventId: event.id,
    enabled: event.metadata?.enabled !== false,
    conditions: results,
    eligible: overall
  };
}
