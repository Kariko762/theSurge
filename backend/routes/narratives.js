const express = require('express');
const router = express.Router();
const { readNarratives, writeNarratives } = require('../utils/fileHandler');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/narratives - Get all narrative pools
 */
router.get('/', async (req, res) => {
  try {
    const narratives = await readNarratives();
    res.json(narratives);
  } catch (error) {
    console.error('Error reading narratives:', error);
    res.status(500).json({ error: 'Failed to read narratives' });
  }
});

/**
 * GET /api/narratives/:poolId - Get specific narrative pool by ID
 */
router.get('/:poolId', async (req, res) => {
  try {
    const narratives = await readNarratives();
    const pool = narratives.pools?.find(p => p.id === req.params.poolId);
    
    if (!pool) {
      return res.status(404).json({ error: 'Narrative pool not found' });
    }
    
    res.json(pool);
  } catch (error) {
    console.error('Error reading narrative pool:', error);
    res.status(500).json({ error: 'Failed to read narrative pool' });
  }
});

/**
 * POST /api/narratives - Create new narrative pool
 * Requires authentication
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const narratives = await readNarratives();
    const newPool = req.body;
    
    // Validate required fields
    if (!newPool.id || !newPool.name) {
      return res.status(400).json({ error: 'Missing required fields: id, name' });
    }
    
    // Initialize pools array if it doesn't exist
    if (!narratives.pools) {
      narratives.pools = [];
    }
    
    // Check for duplicate ID
    if (narratives.pools.some(p => p.id === newPool.id)) {
      return res.status(409).json({ error: 'Narrative pool with this ID already exists' });
    }
    
    narratives.pools.push(newPool);
    await writeNarratives(narratives);
    
    res.status(201).json(newPool);
  } catch (error) {
    console.error('Error creating narrative pool:', error);
    res.status(500).json({ error: 'Failed to create narrative pool' });
  }
});

/**
 * PUT /api/narratives/:poolId - Update existing narrative pool
 * Requires authentication
 */
router.put('/:poolId', authenticateToken, async (req, res) => {
  try {
    const narratives = await readNarratives();
    
    if (!narratives.pools) {
      return res.status(404).json({ error: 'Narrative pool not found' });
    }
    
    const index = narratives.pools.findIndex(p => p.id === req.params.poolId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Narrative pool not found' });
    }
    
    const updatedPool = { ...narratives.pools[index], ...req.body, id: req.params.poolId };
    narratives.pools[index] = updatedPool;
    
    await writeNarratives(narratives);
    res.json(updatedPool);
  } catch (error) {
    console.error('Error updating narrative pool:', error);
    res.status(500).json({ error: 'Failed to update narrative pool' });
  }
});

/**
 * DELETE /api/narratives/:poolId - Delete narrative pool
 * Requires authentication
 */
router.delete('/:poolId', authenticateToken, async (req, res) => {
  try {
    const narratives = await readNarratives();
    
    if (!narratives.pools) {
      return res.status(404).json({ error: 'Narrative pool not found' });
    }
    
    const originalLength = narratives.pools.length;
    narratives.pools = narratives.pools.filter(p => p.id !== req.params.poolId);
    
    if (narratives.pools.length === originalLength) {
      return res.status(404).json({ error: 'Narrative pool not found' });
    }
    
    await writeNarratives(narratives);
    res.json({ message: 'Narrative pool deleted successfully' });
  } catch (error) {
    console.error('Error deleting narrative pool:', error);
    res.status(500).json({ error: 'Failed to delete narrative pool' });
  }
});

module.exports = router;
