const express = require('express');
const router = express.Router();
const { readShips, writeShips } = require('../utils/fileHandler');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/ships - Get all ships
 */
router.get('/', async (req, res) => {
  try {
    const ships = await readShips();
    res.json(ships);
  } catch (error) {
    console.error('Error reading ships:', error);
    res.status(500).json({ error: 'Failed to read ships' });
  }
});

/**
 * GET /api/ships/:id - Get specific ship by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const ships = await readShips();
    const ship = ships.find(s => s.id === req.params.id);
    
    if (!ship) {
      return res.status(404).json({ error: 'Ship not found' });
    }
    
    res.json(ship);
  } catch (error) {
    console.error('Error reading ship:', error);
    res.status(500).json({ error: 'Failed to read ship' });
  }
});

/**
 * POST /api/ships - Create new ship
 * Requires authentication
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const ships = await readShips();
    const newShip = req.body;
    
    // Validate ship has required fields
    if (!newShip.id || !newShip.name || !newShip.class) {
      return res.status(400).json({ error: 'Missing required fields: id, name, class' });
    }
    
    // Check for duplicate ID
    if (ships.some(s => s.id === newShip.id)) {
      return res.status(409).json({ error: 'Ship with this ID already exists' });
    }
    
    ships.push(newShip);
    await writeShips(ships);
    
    res.status(201).json(newShip);
  } catch (error) {
    console.error('Error creating ship:', error);
    res.status(500).json({ error: 'Failed to create ship' });
  }
});

/**
 * PUT /api/ships/:id - Update existing ship
 * Requires authentication
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const ships = await readShips();
    const index = ships.findIndex(s => s.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Ship not found' });
    }
    
    const updatedShip = { ...ships[index], ...req.body, id: req.params.id };
    ships[index] = updatedShip;
    
    await writeShips(ships);
    res.json(updatedShip);
  } catch (error) {
    console.error('Error updating ship:', error);
    res.status(500).json({ error: 'Failed to update ship' });
  }
});

/**
 * DELETE /api/ships/:id - Delete ship
 * Requires authentication
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const ships = await readShips();
    const filteredShips = ships.filter(s => s.id !== req.params.id);
    
    if (filteredShips.length === ships.length) {
      return res.status(404).json({ error: 'Ship not found' });
    }
    
    await writeShips(filteredShips);
    res.json({ message: 'Ship deleted successfully' });
  } catch (error) {
    console.error('Error deleting ship:', error);
    res.status(500).json({ error: 'Failed to delete ship' });
  }
});

module.exports = router;
