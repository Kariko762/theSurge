const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, backupFile } = require('../utils/fileHandler');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateMission } = require('../utils/validation');

/**
 * GET /api/missions
 * Get all missions with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    let missions = await readJSON('missions.json');

    // Filter by type
    if (req.query.type) {
      const types = req.query.type.split(',');
      missions = missions.filter(m => types.includes(m.type));
    }

    // Filter by tier
    if (req.query.tier) {
      const tiers = req.query.tier.split(',');
      missions = missions.filter(m => tiers.includes(m.tier));
    }

    res.json({
      success: true,
      missions,
      count: missions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/missions/:id
 * Get single mission by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const missions = await readJSON('missions.json');
    const mission = missions.find(m => m.id === req.params.id);

    if (!mission) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    res.json({
      success: true,
      mission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/missions
 * Create new mission
 */
router.post('/', authenticateToken, requireRole('editor', 'admin'), async (req, res) => {
  try {
    const newMission = req.body;

    // Validate
    const validation = validateMission(newMission);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    const missions = await readJSON('missions.json');

    // Check for duplicate ID
    if (missions.find(m => m.id === newMission.id)) {
      return res.status(400).json({
        success: false,
        error: `Mission with ID '${newMission.id}' already exists`
      });
    }

    // Add metadata
    newMission.metadata = {
      author: req.user.username,
      created: new Date().toISOString()
    };

    // Backup before modification
    await backupFile('missions.json');

    missions.push(newMission);
    await writeJSON('missions.json', missions);

    res.status(201).json({
      success: true,
      mission: newMission,
      message: 'Mission created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/missions/:id
 * Update existing mission
 */
router.put('/:id', authenticateToken, requireRole('editor', 'admin'), async (req, res) => {
  try {
    const updatedMission = req.body;

    // Validate
    const validation = validateMission(updatedMission);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Ensure ID matches
    if (updatedMission.id !== req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Mission ID in body must match URL parameter'
      });
    }

    const missions = await readJSON('missions.json');
    const index = missions.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Backup before modification
    await backupFile('missions.json');

    // Update mission
    missions[index] = {
      ...updatedMission,
      metadata: {
        ...missions[index].metadata,
        modified: new Date().toISOString(),
        modifiedBy: req.user.username
      }
    };

    await writeJSON('missions.json', missions);

    res.json({
      success: true,
      mission: missions[index],
      message: 'Mission updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/missions/:id
 * Delete mission
 */
router.delete('/:id', authenticateToken, requireRole('editor', 'admin'), async (req, res) => {
  try {
    const missions = await readJSON('missions.json');
    const index = missions.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Mission not found'
      });
    }

    // Backup before modification
    await backupFile('missions.json');

    const deletedMission = missions[index];
    missions.splice(index, 1);
    await writeJSON('missions.json', missions);

    res.json({
      success: true,
      message: 'Mission deleted successfully',
      deletedMission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
