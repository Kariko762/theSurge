const express = require('express');
const router = express.Router();
const { readFactions, writeFactions } = require('../utils/fileHandler');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/factions - Get all factions
 */
router.get('/', async (req, res) => {
  try {
    const factions = await readFactions();
    res.json(factions);
  } catch (error) {
    console.error('Error reading factions:', error);
    res.status(500).json({ error: 'Failed to read factions' });
  }
});

/**
 * GET /api/factions/:id - Get specific faction by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const factions = await readFactions();
    const faction = factions.find(f => f.id === req.params.id);
    
    if (!faction) {
      return res.status(404).json({ error: 'Faction not found' });
    }
    
    res.json(faction);
  } catch (error) {
    console.error('Error reading faction:', error);
    res.status(500).json({ error: 'Failed to read faction' });
  }
});

/**
 * POST /api/factions - Create new faction
 * Requires authentication
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const factions = await readFactions();
    const newFaction = req.body;
    
    // Validate required fields
    if (!newFaction.id || !newFaction.name || !newFaction.alignment) {
      return res.status(400).json({ error: 'Missing required fields: id, name, alignment' });
    }
    
    // Check for duplicate ID
    if (factions.some(f => f.id === newFaction.id)) {
      return res.status(409).json({ error: 'Faction with this ID already exists' });
    }
    
    factions.push(newFaction);
    await writeFactions(factions);
    
    res.status(201).json(newFaction);
  } catch (error) {
    console.error('Error creating faction:', error);
    res.status(500).json({ error: 'Failed to create faction' });
  }
});

/**
 * PUT /api/factions/:id - Update existing faction
 * Requires authentication
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const factions = await readFactions();
    const index = factions.findIndex(f => f.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Faction not found' });
    }
    
    const updatedFaction = { ...factions[index], ...req.body, id: req.params.id };
    factions[index] = updatedFaction;
    
    await writeFactions(factions);
    res.json(updatedFaction);
  } catch (error) {
    console.error('Error updating faction:', error);
    res.status(500).json({ error: 'Failed to update faction' });
  }
});

/**
 * DELETE /api/factions/:id - Delete faction
 * Requires authentication
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const factions = await readFactions();
    const filteredFactions = factions.filter(f => f.id !== req.params.id);
    
    if (filteredFactions.length === factions.length) {
      return res.status(404).json({ error: 'Faction not found' });
    }
    
    await writeFactions(filteredFactions);
    res.json({ message: 'Faction deleted successfully' });
  } catch (error) {
    console.error('Error deleting faction:', error);
    res.status(500).json({ error: 'Failed to delete faction' });
  }
});

module.exports = router;
