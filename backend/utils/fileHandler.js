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

module.exports = {
  readJSON,
  writeJSON,
  ensureDataDir,
  backupFile,
  DATA_DIR
};
