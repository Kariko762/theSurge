const express = require('express');
const router = express.Router();
const { readJSON, writeJSON } = require('../utils/fileHandler');

const POI_LIBRARY_FILE = 'poi_library.json';

// Get all POIs
router.get('/', async (req, res) => {
  try {
    const pois = await readJSON(POI_LIBRARY_FILE);
    res.json({ success: true, pois: pois || [] });
  } catch (error) {
    console.error('Error reading POI library:', error);
    res.status(500).json({ success: false, error: 'Failed to load POI library' });
  }
});

// Create new POI
router.post('/', async (req, res) => {
  try {
    const pois = await readJSON(POI_LIBRARY_FILE) || [];
    const newPOI = {
      id: `POI_${req.body.type}_${Date.now()}`,
      ...req.body,
      properties: req.body.properties || {}
    };
    pois.push(newPOI);
    await writeJSON(POI_LIBRARY_FILE, pois);
    res.json({ success: true, poi: newPOI });
  } catch (error) {
    console.error('Error creating POI:', error);
    res.status(500).json({ success: false, error: 'Failed to create POI' });
  }
});

// Update POI
router.put('/:id', async (req, res) => {
  try {
    const pois = await readJSON(POI_LIBRARY_FILE) || [];
    const index = pois.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'POI not found' });
    }
    pois[index] = { ...pois[index], ...req.body };
    await writeJSON(POI_LIBRARY_FILE, pois);
    res.json({ success: true, poi: pois[index] });
  } catch (error) {
    console.error('Error updating POI:', error);
    res.status(500).json({ success: false, error: 'Failed to update POI' });
  }
});

// Delete POI
router.delete('/:id', async (req, res) => {
  try {
    const pois = await readJSON(POI_LIBRARY_FILE) || [];
    // Remove POI and clear it as parent from any child POIs
    const filtered = pois
      .map(p => {
        // Handle both old parentId and new parentIds formats
        if (p.parentId === req.params.id) {
          return { ...p, parentId: null, parentIds: [] };
        }
        if (p.parentIds && p.parentIds.includes(req.params.id)) {
          return { ...p, parentIds: p.parentIds.filter(id => id !== req.params.id) };
        }
        return p;
      })
      .filter(p => p.id !== req.params.id);
    await writeJSON(POI_LIBRARY_FILE, filtered);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting POI:', error);
    res.status(500).json({ success: false, error: 'Failed to delete POI' });
  }
});

// Initialize with defaults (called when library is empty)
router.post('/initialize', async (req, res) => {
  try {
    const defaults = [
      // Planets - Procedurally generated celestial bodies
      { 
        id: 'POI_PLANET_DEFAULT', 
        name: 'Procedural Planet', 
        type: 'PLANET', 
        parentIds: [], 
        description: 'Randomly generated planets with varied properties',
        size: 'Large',
        isParent: true,
        rarity: 60,
        maxCount: 8,
        orbitType: 'circular',
        orbitSpeed: 1.0,
        orbitRadiusMin: 0.5,
        orbitRadiusMax: 30,
        tierMultiplier: 1.0,
        imagePool: 'planets',
        properties: {}
      },
      // Moons - Orbit planets
      { 
        id: 'POI_MOON_DEFAULT', 
        name: 'Procedural Moon', 
        type: 'MOON', 
        parentIds: ['POI_PLANET_DEFAULT'], 
        description: 'Natural satellites orbiting planets',
        size: 'Small',
        isParent: false,
        rarity: 40,
        maxCount: 3,
        orbitType: 'circular',
        orbitSpeed: 2.0,
        orbitRadiusMin: 0.1,
        orbitRadiusMax: 0.5,
        tierMultiplier: 0.5,
        imagePool: '',
        properties: {}
      },
      // Asteroid Belts - Debris fields
      { 
        id: 'POI_BELT_DEFAULT', 
        name: 'Asteroid Belt', 
        type: 'BELT', 
        parentIds: [], 
        description: 'Dense asteroid fields with mining opportunities',
        size: 'Large',
        isParent: true,
        rarity: 30,
        maxCount: 2,
        orbitType: 'circular',
        orbitSpeed: 0.5,
        orbitRadiusMin: 2,
        orbitRadiusMax: 20,
        tierMultiplier: 1.0,
        imagePool: '',
        properties: {}
      },
      // Space Stations - Permanent installations
      { 
        id: 'POI_STATION_DEFAULT', 
        name: 'Space Station', 
        type: 'STATION', 
        parentIds: ['POI_PLANET_DEFAULT'], 
        description: 'Permanent orbital installations with services',
        size: 'Medium',
        isParent: false,
        rarity: 25,
        maxCount: 5,
        orbitType: 'circular',
        orbitSpeed: 1.5,
        orbitRadiusMin: 0.3,
        orbitRadiusMax: 10,
        tierMultiplier: 1.5,
        imagePool: '',
        properties: {}
      },
      // Habitats - Living spaces
      { 
        id: 'POI_HABITAT_DEFAULT', 
        name: 'Space Habitat', 
        type: 'HABITAT', 
        parentIds: [], 
        description: 'Civilian habitation structures',
        size: 'Medium',
        isParent: true,
        rarity: 20,
        maxCount: 4,
        orbitType: 'circular',
        orbitSpeed: 1.2,
        orbitRadiusMin: 0.5,
        orbitRadiusMax: 8,
        tierMultiplier: 1.0,
        imagePool: '',
        properties: {}
      },
      // Anomalies - Strange phenomena
      { 
        id: 'POI_ANOMALY_DEFAULT', 
        name: 'Spatial Anomaly', 
        type: 'ANOMALY', 
        parentIds: [], 
        description: 'Unexplained spacetime distortions',
        size: 'Small',
        isParent: false,
        rarity: 10,
        maxCount: 2,
        orbitType: 'eccentric',
        orbitSpeed: 0.3,
        orbitRadiusMin: 1,
        orbitRadiusMax: 25,
        tierMultiplier: 2.0,
        imagePool: '',
        properties: {}
      },
      // Conflict Zones - Active combat areas
      { 
        id: 'POI_CONFLICT_DEFAULT', 
        name: 'Conflict Zone', 
        type: 'CONFLICT', 
        parentIds: [], 
        description: 'Active combat zones with hostile forces',
        size: 'Medium',
        isParent: false,
        rarity: 15,
        maxCount: 3,
        orbitType: 'elliptical',
        orbitSpeed: 1.0,
        orbitRadiusMin: 1,
        orbitRadiusMax: 15,
        tierMultiplier: 2.5,
        imagePool: '',
        properties: {}
      },
      // Distress Signals - Rescue opportunities
      { 
        id: 'POI_DISTRESS_DEFAULT', 
        name: 'Distress Signal', 
        type: 'DISTRESS', 
        parentIds: [], 
        description: 'Ships or stations sending emergency signals',
        size: 'Small',
        isParent: false,
        rarity: 12,
        maxCount: 2,
        orbitType: 'none',
        orbitSpeed: 0.0,
        orbitRadiusMin: 0,
        orbitRadiusMax: 0,
        tierMultiplier: 1.5,
        imagePool: '',
        properties: {}
      },
      // Facilities - Industrial/Research
      { 
        id: 'POI_FACILITY_DEFAULT', 
        name: 'Orbital Facility', 
        type: 'FACILITY', 
        parentIds: [], 
        description: 'Industrial or research facilities',
        size: 'Large',
        isParent: false,
        rarity: 18,
        maxCount: 4,
        orbitType: 'circular',
        orbitSpeed: 1.0,
        orbitRadiusMin: 0.5,
        orbitRadiusMax: 12,
        tierMultiplier: 1.5,
        imagePool: '',
        properties: {}
      },
      // Nebulae - Gas clouds
      { 
        id: 'POI_NEBULA_DEFAULT', 
        name: 'Nebula Cloud', 
        type: 'NEBULA', 
        parentIds: [], 
        description: 'Gas clouds affecting sensors and travel',
        size: 'Large',
        isParent: false,
        rarity: 8,
        maxCount: 1,
        orbitType: 'none',
        orbitSpeed: 0.0,
        orbitRadiusMin: 0,
        orbitRadiusMax: 0,
        tierMultiplier: 1.0,
        imagePool: '',
        properties: {}
      },
      // FTL Wakes - Jump signatures
      { 
        id: 'POI_WAKE_DEFAULT', 
        name: 'FTL Wake', 
        type: 'WAKE', 
        parentIds: [], 
        description: 'Residual signatures from FTL jumps',
        size: 'Small',
        isParent: false,
        rarity: 5,
        maxCount: 1,
        orbitType: 'none',
        orbitSpeed: 0.0,
        orbitRadiusMin: 0,
        orbitRadiusMax: 0,
        tierMultiplier: 1.0,
        imagePool: '',
        properties: {}
      }
    ];
    await writeJSON(POI_LIBRARY_FILE, defaults);
    res.json({ success: true, pois: defaults });
  } catch (error) {
    console.error('Error initializing POI library:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize POI library' });
  }
});

module.exports = router;
