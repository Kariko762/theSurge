const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, backupFile } = require('../utils/fileHandler');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateEvent } = require('../utils/validation');

/**
 * GET /api/events
 * Get all events with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const poi = await readJSON('events_poi.json');
    const dynamic = await readJSON('events_dynamic.json');
    const mission = await readJSON('events_mission.json');

    let events = [...poi, ...dynamic, ...mission];

    // Filter by type
    if (req.query.type) {
      const types = req.query.type.split(',');
      events = events.filter(e =>
        types.some(type => e.metadata?.tags?.includes(type))
      );
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      events = events.filter(e =>
        tags.some(tag => e.metadata?.tags?.includes(tag))
      );
    }

    // Filter by trigger type
    if (req.query.triggerType) {
      events = events.filter(e => e.trigger?.type === req.query.triggerType);
    }

    res.json({
      success: true,
      events,
      count: events.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/events/:id
 * Get single event by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const poi = await readJSON('events_poi.json');
    const dynamic = await readJSON('events_dynamic.json');
    const mission = await readJSON('events_mission.json');

    const events = [...poi, ...dynamic, ...mission];
    const event = events.find(e => e.id === req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/events
 * Create new event
 */
router.post('/', authenticateToken, requireRole('editor', 'admin'), async (req, res) => {
  try {
    const newEvent = req.body;

    // Validate event structure
    const validation = validateEvent(newEvent);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Determine which file to save to based on tags or trigger type
    let filename = 'events_dynamic.json';
    if (newEvent.trigger?.type === 'poi_action') {
      filename = 'events_poi.json';
    } else if (newEvent.metadata?.tags?.includes('mission')) {
      filename = 'events_mission.json';
    }

    const events = await readJSON(filename);

    // Check for duplicate ID
    if (events.find(e => e.id === newEvent.id)) {
      return res.status(400).json({
        success: false,
        error: `Event with ID '${newEvent.id}' already exists`
      });
    }

    // Add metadata if missing
    if (!newEvent.metadata.author) {
      newEvent.metadata.author = req.user.username;
    }
    if (!newEvent.metadata.created) {
      newEvent.metadata.created = new Date().toISOString();
    }

    // Backup before modification
    await backupFile(filename);

    // Add event
    events.push(newEvent);
    await writeJSON(filename, events);

    res.status(201).json({
      success: true,
      event: newEvent,
      message: 'Event created successfully',
      file: filename
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/events/:id
 * Update existing event
 */
router.put('/:id', authenticateToken, requireRole('editor', 'admin'), async (req, res) => {
  try {
    const updatedEvent = req.body;

    // Validate
    const validation = validateEvent(updatedEvent);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Ensure ID matches
    if (updatedEvent.id !== req.params.id) {
      return res.status(400).json({
        success: false,
        error: 'Event ID in body must match URL parameter'
      });
    }

    // Find event in all files
    const files = ['events_poi.json', 'events_dynamic.json', 'events_mission.json'];
    let found = false;
    let targetFile = null;

    for (const filename of files) {
      const events = await readJSON(filename);
      const index = events.findIndex(e => e.id === req.params.id);

      if (index !== -1) {
        // Backup before modification
        await backupFile(filename);

        // Update event
        events[index] = {
          ...updatedEvent,
          metadata: {
            ...updatedEvent.metadata,
            modified: new Date().toISOString(),
            modifiedBy: req.user.username
          }
        };

        await writeJSON(filename, events);
        found = true;
        targetFile = filename;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully',
      file: targetFile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/events/:id
 * Delete event
 */
router.delete('/:id', authenticateToken, requireRole('editor', 'admin'), async (req, res) => {
  try {
    const files = ['events_poi.json', 'events_dynamic.json', 'events_mission.json'];
    let found = false;
    let deletedEvent = null;

    for (const filename of files) {
      const events = await readJSON(filename);
      const index = events.findIndex(e => e.id === req.params.id);

      if (index !== -1) {
        // Backup before modification
        await backupFile(filename);

        // Remove event
        deletedEvent = events[index];
        events.splice(index, 1);
        await writeJSON(filename, events);
        found = true;
        break;
      }
    }

    if (!found) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.json({
      success: true,
      message: 'Event deleted successfully',
      deletedEvent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
