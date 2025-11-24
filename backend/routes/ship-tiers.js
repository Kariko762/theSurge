const express = require('express');
const router = express.Router();
const { readShipTiers, writeShipTiers } = require('../utils/fileHandler');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/ship-tiers - Get all ship tier bonuses
 */
router.get('/', async (req, res) => {
  try {
    const tierBonuses = await readShipTiers();
    res.json(tierBonuses);
  } catch (error) {
    console.error('Error reading ship tier bonuses:', error);
    res.status(500).json({ error: 'Failed to read ship tier bonuses' });
  }
});

/**
 * GET /api/ship-tiers/:id - Get specific tier bonus by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const tierBonuses = await readShipTiers();
    const bonus = tierBonuses.find(b => b.id === req.params.id);
    
    if (!bonus) {
      return res.status(404).json({ error: 'Tier bonus not found' });
    }
    
    res.json(bonus);
  } catch (error) {
    console.error('Error reading tier bonus:', error);
    res.status(500).json({ error: 'Failed to read tier bonus' });
  }
});

/**
 * POST /api/ship-tiers - Create new tier bonus
 * Requires authentication
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const tierBonuses = await readShipTiers();
    const newBonus = req.body;
    
    // Validate required fields
    if (!newBonus.id || !newBonus.name || !newBonus.type || !newBonus.tier) {
      return res.status(400).json({ error: 'Missing required fields: id, name, type, tier' });
    }
    
    // Check for duplicate ID
    if (tierBonuses.some(b => b.id === newBonus.id)) {
      return res.status(409).json({ error: 'Tier bonus with this ID already exists' });
    }
    
    tierBonuses.push(newBonus);
    await writeShipTiers(tierBonuses);
    
    res.status(201).json(newBonus);
  } catch (error) {
    console.error('Error creating tier bonus:', error);
    res.status(500).json({ error: 'Failed to create tier bonus' });
  }
});

/**
 * PUT /api/ship-tiers/:id - Update existing tier bonus
 * Requires authentication
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tierBonuses = await readShipTiers();
    const index = tierBonuses.findIndex(b => b.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Tier bonus not found' });
    }
    
    const updatedBonus = { ...tierBonuses[index], ...req.body, id: req.params.id };
    tierBonuses[index] = updatedBonus;
    
    await writeShipTiers(tierBonuses);
    res.json(updatedBonus);
  } catch (error) {
    console.error('Error updating tier bonus:', error);
    res.status(500).json({ error: 'Failed to update tier bonus' });
  }
});

/**
 * DELETE /api/ship-tiers/:id - Delete tier bonus
 * Requires authentication
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const tierBonuses = await readShipTiers();
    const filteredBonuses = tierBonuses.filter(b => b.id !== req.params.id);
    
    if (filteredBonuses.length === tierBonuses.length) {
      return res.status(404).json({ error: 'Tier bonus not found' });
    }
    
    await writeShipTiers(filteredBonuses);
    res.json({ message: 'Tier bonus deleted successfully' });
  } catch (error) {
    console.error('Error deleting tier bonus:', error);
    res.status(500).json({ error: 'Failed to delete tier bonus' });
  }
});

module.exports = router;
