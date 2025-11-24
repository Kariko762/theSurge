const express = require('express');
const router = express.Router();
const { readItems, writeItems, readItemsCore, writeItemsCore } = require('../utils/fileHandler');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /api/items - Get all items (or filtered by category)
 * Query params: ?category=weapons|subsystems|resources|consumables|equipment|artifacts
 */
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const items = await readItems(category);
    res.json(items);
  } catch (error) {
    console.error('Error reading items:', error);
    res.status(500).json({ error: 'Failed to read items' });
  }
});

/**
 * GET /api/items/core - Get item system metadata (categories, tiers, loot tables)
 */
router.get('/core', async (req, res) => {
  try {
    const itemsCore = await readItemsCore();
    res.json(itemsCore);
  } catch (error) {
    console.error('Error reading items core:', error);
    res.status(500).json({ error: 'Failed to read items core' });
  }
});

/**
 * PUT /api/items/core - Update item system metadata
 * Requires authentication
 */
router.put('/core', authenticateToken, async (req, res) => {
  try {
    await writeItemsCore(req.body);
    res.json(req.body);
  } catch (error) {
    console.error('Error updating items core:', error);
    res.status(500).json({ error: 'Failed to update items core' });
  }
});

/**
 * GET /api/items/:category/:id - Get specific item by category and ID
 */
router.get('/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    const items = await readItems(category);
    const item = items.find(i => i.id === id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error reading item:', error);
    res.status(500).json({ error: 'Failed to read item' });
  }
});

/**
 * POST /api/items/:category - Create new item in specific category
 * Requires authentication
 */
router.post('/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['weapons', 'subsystems', 'resources', 'consumables', 'equipment', 'artifacts'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be one of: ' + validCategories.join(', ') });
    }
    
    const items = await readItems(category);
    const newItem = req.body;
    
    // Validate required fields
    if (!newItem.id || !newItem.name || !newItem.type) {
      return res.status(400).json({ error: 'Missing required fields: id, name, type' });
    }
    
    // Check for duplicate ID
    if (items.some(i => i.id === newItem.id)) {
      return res.status(409).json({ error: 'Item with this ID already exists' });
    }
    
    items.push(newItem);
    await writeItems(items, category);
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

/**
 * PUT /api/items/:category/:id - Update existing item
 * Requires authentication
 */
router.put('/:category/:id', authenticateToken, async (req, res) => {
  try {
    const { category, id } = req.params;
    const items = await readItems(category);
    const index = items.findIndex(i => i.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const updatedItem = { ...items[index], ...req.body, id };
    items[index] = updatedItem;
    
    await writeItems(items, category);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

/**
 * DELETE /api/items/:category/:id - Delete item
 * Requires authentication
 */
router.delete('/:category/:id', authenticateToken, async (req, res) => {
  try {
    const { category, id } = req.params;
    const items = await readItems(category);
    const filteredItems = items.filter(i => i.id !== id);
    
    if (filteredItems.length === items.length) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    await writeItems(filteredItems, category);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
