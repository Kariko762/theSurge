const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const TELEMETRY_FILE = path.join(__dirname, '../data/telemetry.json');

// Initialize telemetry file if it doesn't exist
if (!fs.existsSync(TELEMETRY_FILE)) {
  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify({ events: [] }, null, 2));
}

// Helper to read telemetry data
function readTelemetry() {
  const data = fs.readFileSync(TELEMETRY_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper to write telemetry data
function writeTelemetry(data) {
  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2));
}

// Helper to aggregate telemetry data
function aggregateTelemetry(events, timeRange) {
  const now = Date.now();
  const rangeMs = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'all': Infinity
  };

  const cutoff = now - (rangeMs[timeRange] || rangeMs['24h']);
  const filteredEvents = events.filter(e => new Date(e.timestamp).getTime() > cutoff);

  // Calculate overview stats
  const totalEvents = filteredEvents.length;
  const uniqueScenarios = new Set(filteredEvents.map(e => e.scenarioId)).size;
  const timeRangeHours = (rangeMs[timeRange] || rangeMs['24h']) / (1000 * 60 * 60);
  const avgEventsPerHour = totalEvents / timeRangeHours;
  
  const successCount = filteredEvents.filter(e => 
    e.outcome === 'success' || e.outcome === 'critical_success'
  ).length;
  const playerSuccessRate = totalEvents > 0 ? (successCount / totalEvents) * 100 : 0;

  // Calculate event frequency
  const eventFrequency = {};
  filteredEvents.forEach(e => {
    if (!eventFrequency[e.eventId]) {
      eventFrequency[e.eventId] = {
        eventId: e.eventId,
        triggers: 0,
        lastTriggered: null,
        totalDuration: 0,
        status: 'active'
      };
    }
    eventFrequency[e.eventId].triggers++;
    eventFrequency[e.eventId].totalDuration += e.duration || 0;
    
    const eventTime = new Date(e.timestamp).getTime();
    if (!eventFrequency[e.eventId].lastTriggered || eventTime > new Date(eventFrequency[e.eventId].lastTriggered).getTime()) {
      eventFrequency[e.eventId].lastTriggered = e.timestamp;
    }
  });

  const eventFrequencyArray = Object.values(eventFrequency).map(ef => ({
    ...ef,
    avgDuration: ef.triggers > 0 ? (ef.totalDuration / ef.triggers) : 0
  }));

  // Calculate player choices
  const playerChoices = {};
  filteredEvents.forEach(e => {
    if (e.playerChoice) {
      const key = `${e.scenarioId}:${e.playerChoice}`;
      if (!playerChoices[key]) {
        playerChoices[key] = {
          scenarioId: e.scenarioId,
          choice: e.playerChoice,
          count: 0
        };
      }
      playerChoices[key].count++;
    }
  });

  // Group by scenario and calculate percentages
  const scenarioGroups = {};
  Object.values(playerChoices).forEach(pc => {
    if (!scenarioGroups[pc.scenarioId]) {
      scenarioGroups[pc.scenarioId] = { scenarioId: pc.scenarioId, choices: [], total: 0 };
    }
    scenarioGroups[pc.scenarioId].choices.push(pc);
    scenarioGroups[pc.scenarioId].total += pc.count;
  });

  const playerChoiceDistribution = Object.values(scenarioGroups).map(sg => ({
    scenarioId: sg.scenarioId,
    choices: sg.choices.map(c => ({
      choice: c.choice,
      count: c.count,
      percentage: (c.count / sg.total) * 100
    }))
  }));

  // Detect dead scenarios (never triggered or very rarely)
  const allScenarioIds = new Set();
  const triggeredScenarios = {};
  filteredEvents.forEach(e => {
    allScenarioIds.add(e.scenarioId);
    triggeredScenarios[e.scenarioId] = (triggeredScenarios[e.scenarioId] || 0) + 1;
  });

  const deadScenarios = Array.from(allScenarioIds)
    .filter(sid => !triggeredScenarios[sid] || triggeredScenarios[sid] < 3)
    .map(sid => ({
      scenarioId: sid,
      triggers: triggeredScenarios[sid] || 0,
      lastSeen: filteredEvents.find(e => e.scenarioId === sid)?.timestamp || null
    }));

  // Calculate outcome distribution
  const outcomeDistribution = {
    success: filteredEvents.filter(e => e.outcome === 'success').length,
    failure: filteredEvents.filter(e => e.outcome === 'failure').length,
    critical_success: filteredEvents.filter(e => e.outcome === 'critical_success').length,
    critical_failure: filteredEvents.filter(e => e.outcome === 'critical_failure').length
  };

  // Calculate reward statistics
  const rewardsData = filteredEvents.filter(e => e.rewards);
  const totalCredits = rewardsData.reduce((sum, e) => sum + (e.rewards.credits || 0), 0);
  const totalItems = rewardsData.reduce((sum, e) => sum + (e.rewards.items?.length || 0), 0);
  const totalXP = rewardsData.reduce((sum, e) => sum + (e.rewards.xp || 0), 0);

  const avgCredits = rewardsData.length > 0 ? totalCredits / rewardsData.length : 0;
  const avgItems = rewardsData.length > 0 ? totalItems / rewardsData.length : 0;
  const avgXP = rewardsData.length > 0 ? totalXP / rewardsData.length : 0;

  // Get top rewards
  const rewardCounts = {};
  rewardsData.forEach(e => {
    e.rewards.items?.forEach(item => {
      rewardCounts[item] = (rewardCounts[item] || 0) + 1;
    });
  });

  const topRewards = Object.entries(rewardCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([item, count]) => ({ item, count }));

  return {
    overview: {
      totalEvents,
      uniqueScenarios,
      avgEventsPerHour: Math.round(avgEventsPerHour * 10) / 10,
      playerSuccessRate: Math.round(playerSuccessRate)
    },
    eventFrequency: eventFrequencyArray,
    playerChoices: playerChoiceDistribution,
    deadScenarios,
    outcomeDistribution,
    rewardStats: {
      avgCredits: Math.round(avgCredits),
      avgItems: Math.round(avgItems * 10) / 10,
      avgXP: Math.round(avgXP),
      topRewards
    }
  };
}

// GET /api/telemetry - Get aggregated telemetry data
router.get('/', (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    const data = readTelemetry();
    const aggregated = aggregateTelemetry(data.events, timeRange);
    res.json(aggregated);
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry data' });
  }
});

// POST /api/telemetry - Log AI debug messages to server console
router.post('/', (req, res) => {
  try {
    const { type, message, timestamp, stack } = req.body;
    
    // Log to server console with colored output
    if (type === 'AI_DEBUG') {
      console.log(`\x1b[36m${timestamp} [AI_DEBUG]\x1b[0m ${message}`);
    } else if (type === 'AI_ERROR') {
      console.error(`\x1b[31m${timestamp} [AI_ERROR]\x1b[0m ${message}`);
      if (stack) {
        console.error(`\x1b[31mStack:\x1b[0m ${stack}`);
      }
    } else {
      console.log(`${timestamp} [${type}] ${message}`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging to console:', error);
    res.status(500).json({ error: 'Failed to log message' });
  }
});

// POST /api/telemetry/track - Track a new event
router.post('/track', (req, res) => {
  try {
    const { eventId, scenarioId, playerChoice, outcome, duration, rewards } = req.body;

    if (!eventId || !scenarioId) {
      return res.status(400).json({ error: 'eventId and scenarioId are required' });
    }

    const data = readTelemetry();
    
    const newEvent = {
      eventId,
      scenarioId,
      timestamp: new Date().toISOString(),
      duration: duration || 0,
      playerChoice: playerChoice || null,
      outcome: outcome || null,
      rewards: rewards || null
    };

    data.events.push(newEvent);
    writeTelemetry(data);

    res.json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Error tracking telemetry:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

// DELETE /api/telemetry - Clear all telemetry data (admin only)
router.delete('/', (req, res) => {
  try {
    writeTelemetry({ events: [] });
    res.json({ success: true, message: 'Telemetry data cleared' });
  } catch (error) {
    console.error('Error clearing telemetry:', error);
    res.status(500).json({ error: 'Failed to clear telemetry data' });
  }
});

module.exports = router;
