const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, backupFile } = require('../utils/fileHandler');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateConfig } = require('../utils/validation');

/**
 * GET /api/config
 * Get all configuration
 */
router.get('/', async (req, res) => {
  try {
    const config = await readJSON('config.json');

    res.json({
      success: true,
      config
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/config
 * Update configuration (full or partial)
 */
router.put('/', authenticateToken, requireRole('editor', 'admin'), async (req, res) => {
  try {
    const updates = req.body;

    // Validate
    const validation = validateConfig(updates);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Load current config
    let config = await readJSON('config.json');

    // Backup before modification
    await backupFile('config.json');

    // Deep merge updates into existing config
    config = deepMerge(config, updates);

    // Add metadata
    config._metadata = {
      lastModified: new Date().toISOString(),
      modifiedBy: req.user.username
    };

    await writeJSON('config.json', config);

    res.json({
      success: true,
      config,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/config/reset
 * Reset config to defaults
 */
router.post('/reset', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Backup current config
    await backupFile('config.json');

    // Default configuration
    const defaultConfig = {
      difficultyCurve: {
        trivial: { dc: 0 },
        easy: { dc: 3 },
        normal: { dc: 8 },
        hard: { dc: 12 },
        deadly: { dc: 16 },
        impossible: { dc: 20 }
      },
      lootMultipliers: {
        criticalSuccess: { min: 2.0, max: 3.0 },
        success: { min: 1.0, max: 1.5 },
        partialSuccess: { min: 0.5, max: 0.8 },
        failure: { min: 0.0, max: 0.2 }
      },
      encounterRates: {
        trader: { weight: 20, cooldown: 300 },
        pirate: { weight: 15, cooldown: 600 },
        derelict: { weight: 10, cooldown: 900 },
        anomaly: { weight: 5, cooldown: 1200 }
      },
      riskCalculation: {
        wakeWeight: 40,
        locationWeight: 30,
        timeWeight: 15,
        eventWeight: 10,
        missionWeight: 5
      },
      dynamicScheduler: {
        lowRisk: { threshold: 20, interval: 60 },
        moderateRisk: { threshold: 40, interval: 30 },
        highRisk: { threshold: 60, interval: 15 },
        criticalRisk: { threshold: 80, interval: 5 },
        extremeRisk: { threshold: 100, interval: 2 }
      },
      _metadata: {
        lastModified: new Date().toISOString(),
        modifiedBy: req.user.username,
        resetToDefaults: true
      }
    };

    await writeJSON('config.json', defaultConfig);

    res.json({
      success: true,
      config: defaultConfig,
      message: 'Configuration reset to defaults'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    // If source value is an array, replace target array completely (don't merge)
    if (Array.isArray(source[key])) {
      output[key] = source[key];
    }
    // If both are objects (but not arrays), recursively merge
    else if (source[key] instanceof Object && key in target && target[key] instanceof Object && !Array.isArray(target[key])) {
      output[key] = deepMerge(target[key], source[key]);
    } 
    // Otherwise, just assign the value
    else {
      output[key] = source[key];
    }
  }
  
  return output;
}

module.exports = router;
