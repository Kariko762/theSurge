/**
 * Risk Calculator for Dynamic Event Scheduler
 * Calculates risk score (0-100%) based on game state factors
 */

/**
 * Calculate overall risk score from game state
 * @param {Object} gameState - Current game state
 * @param {number} gameState.wake - Current wake level (0-1)
 * @param {Object} gameState.location - Current location info
 * @param {string} gameState.location.zone - Zone type (quiet, normal, dark, static, void)
 * @param {string} gameState.location.radiation - Radiation level (low, moderate, high, extreme)
 * @param {boolean} gameState.location.nearHostile - Near hostile POI
 * @param {boolean} gameState.location.nearDerelict - Near derelict POI
 * @param {number} gameState.timeInSystem - Hours in current system
 * @param {Array} gameState.eventHistory - Recent events [{id, timestamp, type}]
 * @param {Array} gameState.activeMissions - Active missions [{tier}]
 * @param {Object} gameState.factionStanding - Faction standings {factionId: standing}
 * @param {Object} config - Scheduler configuration
 * @returns {number} Risk score 0-100
 */
export function calculateRiskScore(gameState, config) {
  if (!gameState || !config) {
    console.warn('[RiskCalculator] Missing gameState or config');
    return 0;
  }

  let totalRisk = 0;

  // 1. WAKE CONTRIBUTION
  const wake = gameState.wake || 0;
  const wakeWeight = config.riskWeights?.wake || 40;
  const wakeContribution = wake * wakeWeight;
  totalRisk += wakeContribution;

  // 2. LOCATION DANGER
  const locationRisk = calculateLocationRisk(gameState.location, config);
  const locationWeight = config.riskWeights?.location || 30;
  totalRisk += locationRisk * (locationWeight / 100);

  // 3. TIME IN SYSTEM
  const timeInSystem = gameState.timeInSystem || 0;
  const timeWeight = config.riskWeights?.timeInSystem || 15;
  const timeRisk = Math.min(timeInSystem * 2, 100); // 2% per hour, max 100
  totalRisk += timeRisk * (timeWeight / 100);

  // 4. RECENT EVENTS PRESSURE
  const eventPressure = calculateEventPressure(gameState.eventHistory);
  const eventWeight = config.riskWeights?.recentEvents || 10;
  totalRisk += eventPressure * (eventWeight / 100);

  // 5. ACTIVE MISSIONS
  const missionRisk = calculateMissionRisk(gameState.activeMissions);
  const missionWeight = config.riskWeights?.activeMissions || 5;
  totalRisk += missionRisk * (missionWeight / 100);

  // 6. FACTION STANDING (if enabled)
  if (config.factionStandingRisk?.enabled) {
    const factionRisk = calculateFactionRisk(gameState.factionStanding, config.factionStandingRisk);
    const factionWeight = config.factionStandingRisk.weight || 20;
    totalRisk += factionRisk * (factionWeight / 100);
  }

  // Clamp to 0-100
  return Math.max(0, Math.min(100, totalRisk));
}

/**
 * Calculate risk from location/zone type
 */
function calculateLocationRisk(location, config) {
  if (!location) return 0;

  let risk = 0;

  // Zone type base risk
  const zoneRisk = config.locationRisk || {
    quiet: 10,
    normal: 30,
    dark: 60,
    static: 85,
    void: 95
  };
  risk += zoneRisk[location.zone] || 30;

  // Radiation modifier
  const radiationRisk = config.radiationRisk || {
    low: 0,
    moderate: 10,
    high: 25,
    extreme: 50
  };
  risk += radiationRisk[location.radiation] || 0;

  // Proximity modifiers
  if (location.nearHostile) risk += 20;
  if (location.nearDerelict) risk += 15;

  return Math.min(risk, 100);
}

/**
 * Calculate risk from recent event history
 * More recent events = higher "heat"
 */
function calculateEventPressure(eventHistory) {
  if (!eventHistory || eventHistory.length === 0) return 0;

  const now = Date.now();
  const recentEvents = eventHistory.filter(e => {
    const ageMinutes = (now - e.timestamp) / 1000 / 60;
    return ageMinutes < 30; // Events within last 30 minutes
  });

  // Each recent event adds 10% pressure
  return Math.min(recentEvents.length * 10, 100);
}

/**
 * Calculate risk from active missions
 */
function calculateMissionRisk(missions) {
  if (!missions || missions.length === 0) return 0;

  const tierRisk = {
    lowRisk: 5,
    mediumRisk: 15,
    highRisk: 30,
    deadly: 50
  };

  let totalRisk = 0;
  for (const mission of missions) {
    totalRisk += tierRisk[mission.tier] || 10;
  }

  return Math.min(totalRisk, 100);
}

/**
 * Calculate risk from faction standing
 * Poor standing with hostile factions increases encounter chance
 */
function calculateFactionRisk(factionStanding, factionConfig) {
  if (!factionStanding || !factionConfig) return 0;

  const threshold = factionConfig.threshold || -50;
  const multiplier = factionConfig.multiplier || 0.5;
  const factions = factionConfig.factions || [];

  let totalRisk = 0;

  factions.forEach(faction => {
    const standing = factionStanding[faction.id];
    
    if (standing !== undefined && standing < threshold) {
      // Standing is below threshold - faction is hunting you
      const standingDiff = Math.abs(standing - threshold);
      const encounterBonus = standingDiff * multiplier;
      totalRisk += (faction.baseEncounterChance || 0) + encounterBonus;
    }
  });

  return Math.min(totalRisk, 100);
}

/**
 * Get risk level description from score
 */
export function getRiskLevel(riskScore) {
  if (riskScore < 20) return { level: 'LOW', color: '#0f0', description: 'Minimal threat' };
  if (riskScore < 40) return { level: 'MODERATE', color: '#fa0', description: 'Elevated activity' };
  if (riskScore < 60) return { level: 'HIGH', color: '#f90', description: 'Dangerous conditions' };
  if (riskScore < 80) return { level: 'CRITICAL', color: '#f66', description: 'Extreme danger' };
  return { level: 'EXTREME', color: '#f00', description: 'Imminent threat' };
}

/**
 * Get check interval based on risk score
 */
export function getCheckInterval(riskScore, config) {
  const intervals = config.checkIntervals || {
    low: 60,
    moderate: 30,
    high: 15,
    critical: 5,
    extreme: 2
  };

  if (riskScore < 20) return intervals.low;
  if (riskScore < 40) return intervals.moderate;
  if (riskScore < 60) return intervals.high;
  if (riskScore < 80) return intervals.critical;
  return intervals.extreme;
}

/**
 * Get breakdown of risk contributions for debugging
 */
export function getRiskBreakdown(gameState, config) {
  if (!gameState || !config) return {};

  const wake = gameState.wake || 0;
  const wakeWeight = config.riskWeights?.wake || 40;
  
  const locationRisk = calculateLocationRisk(gameState.location, config);
  const locationWeight = config.riskWeights?.location || 30;
  
  const timeInSystem = gameState.timeInSystem || 0;
  const timeWeight = config.riskWeights?.timeInSystem || 15;
  const timeRisk = Math.min(timeInSystem * 2, 100);
  
  const eventPressure = calculateEventPressure(gameState.eventHistory);
  const eventWeight = config.riskWeights?.recentEvents || 10;
  
  const missionRisk = calculateMissionRisk(gameState.activeMissions);
  const missionWeight = config.riskWeights?.activeMissions || 5;
  
  let factionRisk = 0;
  let factionWeight = 0;
  if (config.factionStandingRisk?.enabled) {
    factionRisk = calculateFactionRisk(gameState.factionStanding, config.factionStandingRisk);
    factionWeight = config.factionStandingRisk.weight || 20;
  }

  return {
    wake: {
      value: wake,
      weight: wakeWeight,
      contribution: wake * wakeWeight
    },
    location: {
      value: locationRisk,
      weight: locationWeight,
      contribution: locationRisk * (locationWeight / 100)
    },
    time: {
      value: timeRisk,
      weight: timeWeight,
      contribution: timeRisk * (timeWeight / 100)
    },
    events: {
      value: eventPressure,
      weight: eventWeight,
      contribution: eventPressure * (eventWeight / 100)
    },
    missions: {
      value: missionRisk,
      weight: missionWeight,
      contribution: missionRisk * (missionWeight / 100)
    },
    factions: {
      value: factionRisk,
      weight: factionWeight,
      contribution: factionRisk * (factionWeight / 100),
      enabled: config.factionStandingRisk?.enabled || false
    }
  };
}
