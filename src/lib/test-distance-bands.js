/**
 * Test: Distance Band Combat System
 * Tests the new distance-based positioning and range modifier system
 */

import { ShipManager, SHIP_CLASSES } from './ShipManager.js';
import { CombatPositioning } from './combat/combatPositioning.js';
import { 
  DISTANCE_BANDS, 
  getDistanceBand, 
  getMovementCost,
  calculateNewDistance,
  getOptimalRangeBand 
} from './combat/distanceBands.js';

console.log('='.repeat(80));
console.log('DISTANCE BAND COMBAT SYSTEM TEST');
console.log('='.repeat(80));

// ============================================================================
// TEST 1: Distance Band Detection
// ============================================================================
console.log('\n📏 TEST 1: Distance Band Detection');
console.log('-'.repeat(80));

const testDistances = [25, 100, 200, 400, 800];
testDistances.forEach(distance => {
  const band = getDistanceBand(distance);
  console.log(`${distance}km → ${band.name.padEnd(12)} [${band.min}-${band.max}km]`);
});

// ============================================================================
// TEST 2: Combat Positioning Initialization
// ============================================================================
console.log('\n🎯 TEST 2: Combat Positioning Initialization');
console.log('-'.repeat(80));

// Create test ships
const playerShip = new ShipManager('SURVEY_FRIGATE', [
  'NAV_ADVANCED',
  'ENGINE_ION',
  'SHIELD_MK2',
  'POWER_RFE',
  'SENSORS_LONG',
  'WEAPON_PLASMA_CANNON',
  'COMBAT_COMPUTER_MK1'
]);
playerShip.id = 'player-1';

const enemy1 = new ShipManager('INTERCEPTOR', [
  'NAV_ADVANCED',
  'ENGINE_PLASMA',
  'SHIELD_MK1',
  'POWER_FUSION',
  'SENSORS_SHORT',
  'WEAPON_PULSE_LASER',
  'COMBAT_COMPUTER_MK2'
]);
enemy1.id = 'enemy-1';

const enemy2 = new ShipManager('HEAVY_CRUISER', [
  'NAV_BASIC',
  'ENGINE_ION',
  'SHIELD_MK3',
  'POWER_ANTIMATTER',
  'SENSORS_MEDIUM',
  'WEAPON_RAILGUN',
  'COMBAT_COMPUTER_MK1'
]);
enemy2.id = 'enemy-2';

// Set up factions
playerShip.faction = 'player';
enemy1.faction = 'pirate';
enemy2.faction = 'pirate';

// Initialize combat positioning
const positioning = new CombatPositioning();
positioning.initializeCombat([
  { id: playerShip.id, faction: playerShip.faction },
  { id: enemy1.id, faction: enemy1.faction },
  { id: enemy2.id, faction: enemy2.faction }
], 300); // Start at medium range

console.log(`✓ Combat initialized with 3 ships`);
console.log(`  Player vs Enemy1: ${positioning.getDistance(playerShip.id, enemy1.id)}km (${positioning.getDistanceBandKey(playerShip.id, enemy1.id)})`);
console.log(`  Player vs Enemy2: ${positioning.getDistance(playerShip.id, enemy2.id)}km (${positioning.getDistanceBandKey(playerShip.id, enemy2.id)})`);
console.log(`  Enemy1 vs Enemy2: ${positioning.getDistance(enemy1.id, enemy2.id)}km (${positioning.getDistanceBandKey(enemy1.id, enemy2.id)})`);

// ============================================================================
// TEST 3: Movement Between Distance Bands
// ============================================================================
console.log('\n🚀 TEST 3: Movement Between Distance Bands');
console.log('-'.repeat(80));

console.log('Enemy Interceptor moves closer to player...');
const moveResult = positioning.moveCloser(
  enemy1.id, 
  playerShip.id, 
  100, // Movement points
  enemy1.calculateCombatStats().speed
);

console.log(`  Before: ${moveResult.oldDistance}km (${moveResult.oldBand})`);
console.log(`  After:  ${moveResult.newDistance}km (${moveResult.newBand})`);
console.log(`  Moved:  ${moveResult.distanceReduced}km`);
console.log(`  Band changed: ${moveResult.bandChanged ? 'YES' : 'NO'}`);

// ============================================================================
// TEST 4: Weapon Range Modifiers
// ============================================================================
console.log('\n⚔️  TEST 4: Weapon Range Modifiers');
console.log('-'.repeat(80));

const playerStats = playerShip.calculateCombatStats();
const plasmaCannon = playerStats.weapons[0];

console.log(`\n${plasmaCannon.name} Range Effectiveness:`);
console.log('-'.repeat(80));

Object.keys(DISTANCE_BANDS).forEach(bandKey => {
  const modifier = plasmaCannon.rangeModifiers[bandKey];
  const modStr = modifier === null 
    ? 'OUT OF RANGE' 
    : (modifier >= 0 ? `+${modifier}` : modifier);
  const band = DISTANCE_BANDS[bandKey];
  console.log(`  ${band.name.padEnd(12)} [${band.min}-${band.max}km]: ${modStr}`);
});

// ============================================================================
// TEST 5: Attack Rolls at Different Ranges
// ============================================================================
console.log('\n🎲 TEST 5: Attack Rolls at Different Ranges');
console.log('-'.repeat(80));

const enemyStats = enemy1.calculateCombatStats();
const targetSR = enemyStats.signatureRadius;

console.log(`\nPlayer attacks Enemy Interceptor (SR ${targetSR}) with Plasma Cannon:`);
console.log('-'.repeat(80));

// Test attacks at each distance band
const testBands = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
testBands.forEach(bandKey => {
  const result = playerShip.rollAttack(targetSR, plasmaCannon, bandKey);
  const band = DISTANCE_BANDS[bandKey];
  
  console.log(`\n${band.name} (${band.min}-${band.max}km):`);
  console.log(`  Roll: ${result.roll} + ${result.total - result.roll} (mods) = ${result.total}`);
  console.log(`  Range Modifier: ${result.rangeModifier === null ? 'OUT OF RANGE' : result.rangeModifier}`);
  console.log(`  Result: ${result.result}${result.crit ? ' (CRITICAL!)' : ''}`);
});

// ============================================================================
// TEST 6: Different Weapons at Same Range
// ============================================================================
console.log('\n\n🔫 TEST 6: Different Weapons at Same Range');
console.log('-'.repeat(80));

const cruiserStats = enemy2.calculateCombatStats();
const railgun = cruiserStats.weapons[0];

const testRange = 'LONG';
console.log(`\nComparing weapons at ${DISTANCE_BANDS[testRange].name} range:`);
console.log('-'.repeat(80));

console.log(`\n${plasmaCannon.name}:`);
const plasmaResult = playerShip.rollAttack(targetSR, plasmaCannon, testRange);
console.log(`  Range Mod: ${plasmaResult.rangeModifier}`);
console.log(`  Roll: ${plasmaResult.roll} + mods = ${plasmaResult.total} vs SR ${targetSR}`);
console.log(`  Result: ${plasmaResult.result}`);

console.log(`\n${railgun.name}:`);
const railgunResult = enemy2.rollAttack(targetSR, railgun, testRange);
console.log(`  Range Mod: ${railgunResult.rangeModifier}`);
console.log(`  Roll: ${railgunResult.roll} + mods = ${railgunResult.total} vs SR ${targetSR}`);
console.log(`  Result: ${railgunResult.result}`);

// ============================================================================
// TEST 7: Optimal Range Detection
// ============================================================================
console.log('\n\n🎯 TEST 7: Optimal Range Detection');
console.log('-'.repeat(80));

const weapons = [
  plasmaCannon,
  railgun,
  ...enemyStats.weapons
];

weapons.forEach(weapon => {
  const optimalBand = getOptimalRangeBand(weapon);
  console.log(`${weapon.name.padEnd(25)}: ${DISTANCE_BANDS[optimalBand].name}`);
});

// ============================================================================
// TEST 8: Movement Cost Calculation
// ============================================================================
console.log('\n\n💨 TEST 8: Movement Cost Calculation');
console.log('-'.repeat(80));

const shipSpeed = enemy1.calculateCombatStats().speed;
console.log(`Ship Speed: ${shipSpeed}`);
console.log(`\nMovement costs between bands:`);

const bands = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
bands.forEach((fromBand, i) => {
  if (i < bands.length - 1) {
    const toBand = bands[i + 1];
    const cost = getMovementCost(fromBand, toBand, shipSpeed);
    console.log(`  ${fromBand} → ${toBand}: ${cost} movement points`);
  }
});

// ============================================================================
// TEST 9: Multi-Target Distance Tracking
// ============================================================================
console.log('\n\n👥 TEST 9: Multi-Target Distance Tracking');
console.log('-'.repeat(80));

const allDistances = positioning.getAllDistancesFrom(playerShip.id);
console.log(`\nPlayer ship distances:`);
allDistances.forEach((distance, targetId) => {
  const band = getDistanceBand(distance);
  console.log(`  → ${targetId}: ${distance}km (${band.name})`);
});

const closest = positioning.getClosestEnemy(playerShip.id, [enemy1.id, enemy2.id]);
console.log(`\nClosest enemy: ${closest.id} at ${closest.distance}km (${closest.band})`);

const positionSummary = positioning.getPositionSummary(playerShip.id, [enemy1.id, enemy2.id]);
console.log(`\nPosition Summary:`);
console.log(`  Enemies: ${positionSummary.enemyCount}`);
console.log(`  Closest: ${positionSummary.closest.id} at ${positionSummary.closest.distance}km`);
console.log(`  Farthest: ${positionSummary.farthest.id} at ${positionSummary.farthest.distance}km`);
console.log(`  Average: ${Math.round(positionSummary.averageDistance)}km (${positionSummary.averageBand})`);

// ============================================================================
// TEST 10: Full Combat Round Simulation
// ============================================================================
console.log('\n\n⚔️  TEST 10: Full Combat Round Simulation');
console.log('='.repeat(80));

console.log('\nInitial Positions:');
console.log(`  Player vs Enemy1: ${positioning.getDistance(playerShip.id, enemy1.id)}km`);
console.log(`  Player vs Enemy2: ${positioning.getDistance(playerShip.id, enemy2.id)}km`);

console.log('\n--- ROUND 1 ---');

// Enemy1 (Interceptor) rushes closer
console.log('\nEnemy1 (Interceptor) moves closer...');
const move1 = positioning.moveCloser(enemy1.id, playerShip.id, 150, enemyStats.speed);
console.log(`  ${move1.oldBand} → ${move1.newBand} (${move1.newDistance}km)`);

// Enemy1 attacks
console.log('\nEnemy1 attacks Player with Pulse Laser:');
const attack1 = enemy1.rollAttack(
  playerStats.signatureRadius, 
  enemyStats.weapons[0], 
  positioning.getDistanceBandKey(enemy1.id, playerShip.id)
);
console.log(`  Roll: ${attack1.roll} + mods = ${attack1.total} vs SR ${playerStats.signatureRadius}`);
console.log(`  Range: ${attack1.distanceBand} (mod: ${attack1.rangeModifier})`);
console.log(`  Result: ${attack1.result}`);

if (attack1.hit) {
  const damage1 = enemy1.rollDamage(enemyStats.weapons[0], attack1.crit);
  console.log(`  Damage: ${damage1.damage} ${damage1.damageType} (${damage1.rolls.join('+')})${attack1.crit ? ' CRITICAL!' : ''}`);
}

// Player returns fire
console.log('\nPlayer returns fire with Plasma Cannon:');
const playerAttack = playerShip.rollAttack(
  enemyStats.signatureRadius,
  plasmaCannon,
  positioning.getDistanceBandKey(playerShip.id, enemy1.id)
);
console.log(`  Roll: ${playerAttack.roll} + mods = ${playerAttack.total} vs SR ${enemyStats.signatureRadius}`);
console.log(`  Range: ${playerAttack.distanceBand} (mod: ${playerAttack.rangeModifier})`);
console.log(`  Result: ${playerAttack.result}`);

if (playerAttack.hit) {
  const playerDamage = playerShip.rollDamage(plasmaCannon, playerAttack.crit);
  console.log(`  Damage: ${playerDamage.damage} ${playerDamage.damageType} (${playerDamage.rolls.join('+')})${playerAttack.crit ? ' CRITICAL!' : ''}`);
}

// Enemy2 (Cruiser) fires railgun from long range
console.log('\nEnemy2 (Heavy Cruiser) fires Railgun from long range:');
const attack2 = enemy2.rollAttack(
  playerStats.signatureRadius,
  railgun,
  positioning.getDistanceBandKey(enemy2.id, playerShip.id)
);
console.log(`  Roll: ${attack2.roll} + mods = ${attack2.total} vs SR ${playerStats.signatureRadius}`);
console.log(`  Range: ${attack2.distanceBand} (mod: ${attack2.rangeModifier})`);
console.log(`  Result: ${attack2.result}`);

if (attack2.hit) {
  const damage2 = enemy2.rollDamage(railgun, attack2.crit);
  console.log(`  Damage: ${damage2.damage} ${damage2.damageType} (${damage2.rolls.join('+')})${attack2.crit ? ' CRITICAL!' : ''}`);
}

console.log('\n' + '='.repeat(80));
console.log('✅ All Distance Band System Tests Complete!');
console.log('='.repeat(80));
