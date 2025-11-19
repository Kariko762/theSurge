/**
 * Test script for galaxy validator
 * Run with: node src/lib/galaxyValidator.test.js
 */

import { readFile } from 'fs/promises';
import { validateGalaxy, formatValidationReport } from './galaxyValidator.js';

async function testGalaxy(path) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${path}`);
  console.log('='.repeat(60));

  try {
    const data = await readFile(path, 'utf-8');
    const galaxyData = JSON.parse(data);
    
    // If it's a helix arm file (array), wrap it
    const galaxy = Array.isArray(galaxyData) 
      ? { id: 'test', name: 'Test', systems: galaxyData }
      : galaxyData.systems 
        ? { id: galaxyData.galaxyId || 'test', name: galaxyData.galaxyName || 'Test', systems: galaxyData.systems }
        : { id: 'test', name: 'Test', systems: [] };

    const report = validateGalaxy(galaxy);
    console.log(formatValidationReport(report));

    return report;
  } catch (error) {
    console.error(`Failed to test ${path}:`, error.message);
    return null;
  }
}

// Test all galaxy files
async function main() {
  const files = [
    'src/data/helix_systems/untitled_galaxy.json',
    'src/data/galaxy_andromeda.json',
    'src/data/helix_systems/helix_arm_1.json'
  ];

  for (const file of files) {
    await testGalaxy(file);
  }

  console.log('\n' + '='.repeat(60));
  console.log('Validation complete');
  console.log('='.repeat(60));
}

main();
