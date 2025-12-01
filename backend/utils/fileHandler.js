const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

/**
 * Read JSON file from data directory
 */
async function readJSON(filename) {
  try {
    const filepath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return [];
    }
    throw error;
  }
}

/**
 * Write JSON file to data directory
 */
async function writeJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Backup data file
 */
async function backupFile(filename) {
  const filepath = path.join(DATA_DIR, filename);
  const backupPath = path.join(DATA_DIR, `${filename}.backup`);
  
  try {
    await fs.copyFile(filepath, backupPath);
    return true;
  } catch (error) {
    console.error(`Failed to backup ${filename}:`, error.message);
    return false;
  }
}

// ==================== SPECIALIZED FILE HANDLERS ====================

/**
 * Ships
 */
async function readShips() {
  return await readJSON('ships.json');
}

async function writeShips(ships) {
  await writeJSON('ships.json', ships);
}

/**
 * Ship Tier Bonuses
 */
async function readShipTiers() {
  return await readJSON('ship_tiers.json');
}

async function writeShipTiers(tierBonuses) {
  await writeJSON('ship_tiers.json', tierBonuses);
}

/**
 * Factions
 */
async function readFactions() {
  return await readJSON('factions.json');
}

async function writeFactions(factions) {
  await writeJSON('factions.json', factions);
}

/**
 * Items (by category)
 */
async function readItems(category = null) {
  if (category) {
    // Read specific category
    return await readJSON(`items/items_${category}.json`);
  } else {
    // Read all item categories and combine
    const categories = ['weapons', 'subsystems', 'resources', 'consumables', 'equipment', 'artifacts', 'ships', 'core'];
    const allItems = [];
    
    for (const cat of categories) {
      try {
        const items = await readJSON(`items/items_${cat}.json`);
        if (cat === 'core') {
          // Core contains metadata, not items
          continue;
        }
        allItems.push(...items);
      } catch (error) {
        console.warn(`Failed to read items_${cat}.json:`, error.message);
      }
    }
    
    return allItems;
  }
}

async function writeItems(items, category) {
  if (!category) {
    throw new Error('Category is required for writeItems');
  }
  await writeJSON(`items/items_${category}.json`, items);
}

async function readItemsCore() {
  return await readJSON('items/items_core.json');
}

async function writeItemsCore(coreData) {
  await writeJSON('items/items_core.json', coreData);
}

/**
 * Narratives
 */
async function readNarratives() {
  return await readJSON('narratives.json');
}

async function writeNarratives(narratives) {
  await writeJSON('narratives.json', narratives);
}

/**
 * Events Core
 */
async function readEventsCore() {
  return await readJSON('events_core.json');
}

async function writeEventsCore(eventsCore) {
  await writeJSON('events_core.json', eventsCore);
}

/**
 * Missions
 */
async function readMissions() {
  // Read all mission files from missions/ directory
  const missionsDir = path.join(DATA_DIR, 'missions');
  
  try {
    const files = await fs.readdir(missionsDir);
    const missionFiles = files.filter(f => f.endsWith('.json') && f !== 'missions_core.json');
    
    const missions = [];
    for (const file of missionFiles) {
      try {
        const mission = await readJSON(`missions/${file}`);
        missions.push(mission);
      } catch (error) {
        console.warn(`Failed to read mission ${file}:`, error.message);
      }
    }
    
    return missions;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function readMission(missionId) {
  // Try to find mission file by ID
  const missionsDir = path.join(DATA_DIR, 'missions');
  
  try {
    const files = await fs.readdir(missionsDir);
    const missionFile = files.find(f => f.startsWith(`[ms${missionId}]`));
    
    if (missionFile) {
      return await readJSON(`missions/${missionFile}`);
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function writeMission(mission) {
  // Mission filename format: [msXXXXXX]mission_name.json
  const missionId = mission.id.replace('mission_', '');
  const sanitizedName = mission.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `[ms${missionId}]${sanitizedName}.json`;
  
  await writeJSON(`missions/${filename}`, mission);
}

async function readMissionsCore() {
  return await readJSON('missions/missions_core.json');
}

async function writeMissionsCore(missionsCore) {
  await writeJSON('missions/missions_core.json', missionsCore);
}

/**
 * AI Cores (still in config.json for now)
 */
async function readAICores() {
  const config = await readJSON('config.json');
  return config.aiCores || [];
}

async function writeAICores(aiCores) {
  const config = await readJSON('config.json');
  config.aiCores = aiCores;
  await writeJSON('config.json', config);
}

/**
 * Config (legacy aggregator)
 */
async function readConfig() {
  return await readJSON('config.json');
}

async function writeConfig(config) {
  await writeJSON('config.json', config);
}

/**
 * Build aggregated config from all separate files (for backwards compatibility)
 */
async function buildAggregatedConfig() {
  const [
    ships,
    shipTierBonuses,
    factions,
    items,
    narratives,
    eventsCore,
    missions,
    itemsCore,
    config
  ] = await Promise.all([
    readShips(),
    readShipTiers(),
    readFactions(),
    readItems(), // Get all items
    readNarratives(),
    readEventsCore(),
    readMissions(),
    readItemsCore(),
    readConfig()
  ]);

  // Merge everything into config format
  return {
    ...config,
    ships,
    shipTierBonuses,
    factions,
    items,
    narratives,
    eventsCore,
    missions,
    itemsCore
  };
}

module.exports = {
  // Generic handlers
  readJSON,
  writeJSON,
  ensureDataDir,
  backupFile,
  DATA_DIR,
  
  // Specialized handlers
  readShips,
  writeShips,
  readShipTiers,
  writeShipTiers,
  readFactions,
  writeFactions,
  readItems,
  writeItems,
  readItemsCore,
  writeItemsCore,
  readNarratives,
  writeNarratives,
  readEventsCore,
  writeEventsCore,
  readMissions,
  readMission,
  writeMission,
  readMissionsCore,
  writeMissionsCore,
  readAICores,
  writeAICores,
  readConfig,
  writeConfig,
  buildAggregatedConfig
};
