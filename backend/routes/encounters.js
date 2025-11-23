const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, backupFile } = require('../utils/fileHandler');

/**
 * GET /api/encounters
 * Get all encounters with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const encounters = await readJSON('encounters.json');

    let filtered = encounters;

    // Filter by disposition
    if (req.query.disposition) {
      const dispositions = req.query.disposition.split(',');
      filtered = filtered.filter(e => dispositions.includes(e.disposition));
    }

    // Filter by enabled status
    if (req.query.enabled !== undefined) {
      const enabled = req.query.enabled === 'true';
      filtered = filtered.filter(e => e.enabled === enabled);
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      filtered = filtered.filter(e =>
        tags.some(tag => e.tags?.includes(tag))
      );
    }

    res.json({
      success: true,
      encounters: filtered,
      count: filtered.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/encounters/:id
 * Get single encounter by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const encounters = await readJSON('encounters.json');
    const encounter = encounters.find(e => e.id === req.params.id);

    if (!encounter) {
      return res.status(404).json({
        success: false,
        error: 'Encounter not found'
      });
    }

    res.json({
      success: true,
      encounter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/encounters
 * Create new encounter
 */
router.post('/', async (req, res) => {
  try {
    const newEncounter = req.body;

    // Validate required fields
    if (!newEncounter.id || !newEncounter.name || !newEncounter.disposition) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: id, name, disposition'
      });
    }

    const encounters = await readJSON('encounters.json');

    // Check for duplicate ID
    if (encounters.find(e => e.id === newEncounter.id)) {
      return res.status(400).json({
        success: false,
        error: `Encounter with ID '${newEncounter.id}' already exists`
      });
    }

    // Add metadata
    newEncounter.created = new Date().toISOString();
    newEncounter.modified = new Date().toISOString();
    newEncounter.enabled = newEncounter.enabled !== false; // Default to true

    // Backup before modification
    await backupFile('encounters.json');

    // Add encounter
    encounters.push(newEncounter);
    await writeJSON('encounters.json', encounters);

    res.status(201).json({
      success: true,
      encounter: newEncounter,
      message: 'Encounter created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/encounters/:id
 * Update existing encounter
 */
router.put('/:id', async (req, res) => {
  try {
    const updatedEncounter = req.body;

    // Ensure ID matches
    if (updatedEncounter.id !== req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Encounter ID in body must match URL parameter'
      });
    }

    const encounters = await readJSON('encounters.json');
    const index = encounters.findIndex(e => e.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Encounter not found'
      });
    }

    // Backup before modification
    await backupFile('encounters.json');

    // Update encounter
    updatedEncounter.modified = new Date().toISOString();
    encounters[index] = updatedEncounter;

    await writeJSON('encounters.json', encounters);

    res.json({
      success: true,
      encounter: updatedEncounter,
      message: 'Encounter updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/encounters/:id
 * Delete encounter
 */
router.delete('/:id', async (req, res) => {
  try {
    const encounters = await readJSON('encounters.json');
    const index = encounters.findIndex(e => e.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Encounter not found'
      });
    }

    // Backup before modification
    await backupFile('encounters.json');

    // Remove encounter
    const deletedEncounter = encounters[index];
    encounters.splice(index, 1);
    await writeJSON('encounters.json', encounters);

    res.json({
      success: true,
      message: 'Encounter deleted successfully',
      deletedEncounter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/encounters/trigger
 * Check if an encounter should trigger based on game state
 */
router.post('/trigger', async (req, res) => {
  try {
    const { disposition, location, wake, reputation } = req.body;

    const encounters = await readJSON('encounters.json');

    // Filter enabled encounters by disposition
    let candidates = encounters.filter(e => {
      if (!e.enabled) return false;
      if (disposition && e.disposition !== disposition) return false;
      return true;
    });

    // Apply trigger conditions
    candidates = candidates.filter(e => {
      const conditions = e.triggerConditions || {};

      // Check wake requirements
      if (conditions.wake) {
        if (conditions.wake.min && wake < conditions.wake.min) return false;
        if (conditions.wake.max && wake > conditions.wake.max) return false;
      }

      // Check location requirements
      if (conditions.locations && location) {
        if (!conditions.locations.includes(location)) return false;
      }

      // Check reputation requirements
      if (conditions.reputation && reputation !== undefined) {
        if (conditions.reputation.min && reputation < conditions.reputation.min) return false;
        if (conditions.reputation.max && reputation > conditions.reputation.max) return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      return res.json({
        success: true,
        triggered: false,
        encounter: null
      });
    }

    // Weight-based selection
    const totalWeight = candidates.reduce((sum, e) => sum + (e.weight || 1), 0);
    let random = Math.random() * totalWeight;

    let selected = candidates[0];
    for (const encounter of candidates) {
      const weight = encounter.weight || 1;
      random -= weight;
      if (random <= 0) {
        selected = encounter;
        break;
      }
    }

    res.json({
      success: true,
      triggered: true,
      encounter: selected
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
