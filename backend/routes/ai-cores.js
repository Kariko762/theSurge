const express = require('express');
const router = express.Router();
const { readAICores, writeAICores } = require('../utils/fileHandler');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/ai-cores - Get all AI cores
 */
router.get('/', async (req, res) => {
  try {
    const aiCores = await readAICores();
    res.json(aiCores);
  } catch (error) {
    console.error('Error reading AI cores:', error);
    res.status(500).json({ error: 'Failed to read AI cores' });
  }
});

/**
 * GET /api/ai-cores/:id - Get specific AI core by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const aiCores = await readAICores();
    const aiCore = aiCores.find(a => a.id === req.params.id);
    
    if (!aiCore) {
      return res.status(404).json({ error: 'AI core not found' });
    }
    
    res.json(aiCore);
  } catch (error) {
    console.error('Error reading AI core:', error);
    res.status(500).json({ error: 'Failed to read AI core' });
  }
});

/**
 * POST /api/ai-cores - Create new AI core
 * Requires authentication
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const aiCores = await readAICores();
    const newAICore = req.body;
    
    // Validate required fields
    if (!newAICore.id || !newAICore.name || !newAICore.personality) {
      return res.status(400).json({ error: 'Missing required fields: id, name, personality' });
    }
    
    // Check for duplicate ID
    if (aiCores.some(a => a.id === newAICore.id)) {
      return res.status(409).json({ error: 'AI core with this ID already exists' });
    }
    
    aiCores.push(newAICore);
    await writeAICores(aiCores);
    
    res.status(201).json(newAICore);
  } catch (error) {
    console.error('Error creating AI core:', error);
    res.status(500).json({ error: 'Failed to create AI core' });
  }
});

/**
 * PUT /api/ai-cores/:id - Update existing AI core
 * Requires authentication
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const aiCores = await readAICores();
    const index = aiCores.findIndex(a => a.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'AI core not found' });
    }
    
    const updatedAICore = { ...aiCores[index], ...req.body, id: req.params.id };
    aiCores[index] = updatedAICore;
    
    await writeAICores(aiCores);
    res.json(updatedAICore);
  } catch (error) {
    console.error('Error updating AI core:', error);
    res.status(500).json({ error: 'Failed to update AI core' });
  }
});

/**
 * DELETE /api/ai-cores/:id - Delete AI core
 * Requires authentication
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const aiCores = await readAICores();
    const filteredAICores = aiCores.filter(a => a.id !== req.params.id);
    
    if (filteredAICores.length === aiCores.length) {
      return res.status(404).json({ error: 'AI core not found' });
    }
    
    await writeAICores(filteredAICores);
    res.json({ message: 'AI core deleted successfully' });
  } catch (error) {
    console.error('Error deleting AI core:', error);
    res.status(500).json({ error: 'Failed to delete AI core' });
  }
});

module.exports = router;
