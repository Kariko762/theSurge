/**
 * Combat System Test
 * 
 * Demonstrates the turn-based combat system:
 * - Initiative rolls
 * - Attack rolls with SR (Signature Radius)
 * - Damage rolls
 * - Component modifiers
 */

import { ShipManager, SHIP_CLASSES } from './ShipManager.js';
import { DEFAULT_SHIP_LOADOUT } from './shipComponents.js';

console.log('='.repeat(80));
console.log('COMBAT SYSTEM TEST');
console.log('='.repeat(80));

// ============================================================================
// SHIP 1: Player Ship (Survey Frigate)
// ============================================================================

const playerShip = new ShipManager('SURVEY_FRIGATE', DEFAULT_SHIP_LOADOUT);
const playerStats = playerShip.calculateCombatStats();

console.log('\n📡 PLAYER SHIP: SS-ARKOSE (Survey Frigate)');
console.log('-'.repeat(80));
console.log('INSTALLED COMPONENTS:', playerShip.getInstalledComponents());
console.log('\n🎯 COMBAT STATS:');
console.log(`  Hull:              ${playerStats.maxHull} HP`);
console.log(`  Shields:           ${playerStats.maxShields} HP`);
console.log(`  Armor:             ${playerStats.armor}% reduction`);
console.log(`  Signature Radius:  ${playerStats.signatureRadius} (AC equivalent - lower is better)`);
console.log(`  Evasion:           ${playerStats.evasion}`);
console.log(`  Attack Bonus:      +${playerStats.attackBonus}`);
console.log(`  Initiative:        +${playerStats.initiative}`);
console.log(`  Speed:             ${playerStats.speed} units/turn`);
console.log(`  Sensor Range:      ${playerStats.sensorRange}`);
console.log(`  Power:             ${playerStats.powerGeneration}W gen, ${playerStats.powerConsumption}W used (${playerStats.powerBalance}W surplus)`);

console.log('\n🔫 WEAPONS:');
playerStats.weapons.forEach((weapon, i) => {
  console.log(`  [${i}] ${weapon.name}`);
  console.log(`      Damage:       ${weapon.damage} ${weapon.damageType}`);
  console.log(`      Range:        ${weapon.rangeClose}/${weapon.rangeLong}`);
  console.log(`      Attack Bonus: +${weapon.attackBonus}`);
  console.log(`      Rate of Fire: ${weapon.rateOfFire}/action`);
  console.log(`      Crit Range:   ${weapon.critRange}-20`);
});

// ============================================================================
// SHIP 2: Enemy Interceptor
// ============================================================================

const enemyShip = new ShipManager('INTERCEPTOR', [
  'NAV_BASIC',
  'ENGINE_PLASMA',
  'SHIELD_MK1',
  'POWER_FUSION',
  'SENSORS_SHORT',
  'WEAPON_PULSE_LASER',
  'COMBAT_COMPUTER_MK2'
]);

const enemyStats = enemyShip.calculateCombatStats();

console.log('\n\n⚔️  ENEMY SHIP: Viper-class Interceptor');
console.log('-'.repeat(80));
console.log('INSTALLED COMPONENTS:', enemyShip.getInstalledComponents());
console.log('\n🎯 COMBAT STATS:');
console.log(`  Hull:              ${enemyStats.maxHull} HP`);
console.log(`  Shields:           ${enemyStats.maxShields} HP`);
console.log(`  Armor:             ${enemyStats.armor}% reduction`);
console.log(`  Signature Radius:  ${enemyStats.signatureRadius} (harder to hit!)`);
console.log(`  Evasion:           ${enemyStats.evasion}`);
console.log(`  Attack Bonus:      +${enemyStats.attackBonus}`);
console.log(`  Initiative:        +${enemyStats.initiative}`);
console.log(`  Speed:             ${enemyStats.speed} units/turn`);

console.log('\n🔫 WEAPONS:');
enemyStats.weapons.forEach((weapon, i) => {
  console.log(`  [${i}] ${weapon.name}`);
  console.log(`      Damage:       ${weapon.damage} ${weapon.damageType}`);
  console.log(`      Range:        ${weapon.rangeClose}/${weapon.rangeLong}`);
  console.log(`      Attack Bonus: +${weapon.attackBonus}`);
  console.log(`      Rate of Fire: ${weapon.rateOfFire}/action`);
});

// ============================================================================
// COMBAT SIMULATION
// ============================================================================

console.log('\n\n' + '='.repeat(80));
console.log('COMBAT SIMULATION - Round 1');
console.log('='.repeat(80));

// INITIATIVE
console.log('\n🎲 INITIATIVE ROLLS:');
const playerInitiative = playerShip.rollInitiative();
const enemyInitiative = enemyShip.rollInitiative();

console.log(`  Player:  ${playerInitiative} (modifier: +${playerStats.initiative})`);
console.log(`  Enemy:   ${enemyInitiative} (modifier: +${enemyStats.initiative})`);

const turnOrder = playerInitiative >= enemyInitiative 
  ? ['Player', 'Enemy'] 
  : ['Enemy', 'Player'];

console.log(`\n  ⚡ Turn Order: ${turnOrder.join(' → ')}`);

// TURN 1: First Ship Attacks
console.log('\n' + '-'.repeat(80));
console.log(`TURN 1: ${turnOrder[0]} Ship`);
console.log('-'.repeat(80));

const attacker = turnOrder[0] === 'Player' ? playerShip : enemyShip;
const defender = turnOrder[0] === 'Player' ? enemyShip : playerShip;
const attackerStats = attacker.calculateCombatStats();
const defenderStats = defender.calculateCombatStats();

const weapon = attackerStats.weapons[0];
const range = 150; // Units away

console.log(`\n${turnOrder[0]} fires ${weapon.name} at ${turnOrder[1]} ship`);
console.log(`  Range: ${range} units`);
console.log(`  Target SR: ${defenderStats.signatureRadius}`);

// ATTACK ROLL
const attackResult = attacker.rollAttack(defenderStats.signatureRadius, weapon, range);

console.log(`\n🎲 ATTACK ROLL:`);
console.log(`  d20 Roll:      ${attackResult.roll}`);
console.log(`  Attack Bonus:  +${attackerStats.attackBonus + weapon.attackBonus}`);
if (attackResult.rangeModifier !== 0) {
  console.log(`  Range Penalty: ${attackResult.rangeModifier}`);
}
console.log(`  Total:         ${attackResult.total}`);
console.log(`  vs SR:         ${attackResult.targetSR}`);
console.log(`  Result:        ${attackResult.result}`);

// DAMAGE ROLL (if hit)
if (attackResult.hit) {
  const damageResult = attacker.rollDamage(weapon, attackResult.crit);
  
  console.log(`\n💥 DAMAGE ROLL:`);
  if (attackResult.crit) {
    console.log(`  ⭐ CRITICAL HIT! (damage dice doubled)`);
  }
  console.log(`  Damage:        ${damageResult.damage} ${damageResult.damageType}`);
  console.log(`  Dice Rolls:    [${damageResult.rolls.join(', ')}]`);
  if (damageResult.modifier > 0) {
    console.log(`  Modifier:      +${damageResult.modifier}`);
  }
  
  // Apply armor reduction
  const armorReduction = Math.floor(damageResult.damage * (defenderStats.armor / 100));
  const finalDamage = damageResult.damage - armorReduction;
  
  console.log(`\n🛡️ DAMAGE APPLICATION:`);
  console.log(`  Raw Damage:    ${damageResult.damage}`);
  console.log(`  Armor:         -${armorReduction} (${defenderStats.armor}% reduction)`);
  console.log(`  Final Damage:  ${finalDamage}`);
  console.log(`  Target Shields: ${defenderStats.maxShields} → ${Math.max(0, defenderStats.maxShields - finalDamage)}`);
}

// ============================================================================
// ADVANCED SCENARIO: With ECM and Cover
// ============================================================================

console.log('\n\n' + '='.repeat(80));
console.log('ADVANCED SCENARIO: ECM + Cover');
console.log('='.repeat(80));

// Add ECM to enemy ship
enemyShip.installComponent('ECM_ADVANCED');
const enemyStatsWithECM = enemyShip.calculateCombatStats();

console.log('\n⚡ Enemy installs ECM_ADVANCED');
console.log(`  Previous SR: ${enemyStats.signatureRadius}`);
console.log(`  New SR:      ${enemyStatsWithECM.signatureRadius} (${enemyStatsWithECM.signatureRadius - enemyStats.signatureRadius} from ECM)`);

// Enemy takes cover behind asteroid
const coverType = 'PARTIAL';
const effectiveSR = enemyShip.getEffectiveSR(coverType, []);

console.log(`\n🪨 Enemy takes cover behind asteroid (${coverType})`);
console.log(`  Base SR:      ${enemyStatsWithECM.signatureRadius}`);
console.log(`  Effective SR: ${effectiveSR} (cover bonus applied)`);

// Player attacks with modified SR
const attackWithCover = playerShip.rollAttack(effectiveSR, playerStats.weapons[0], 150);

console.log(`\n🎲 Player attacks enemy in cover:`);
console.log(`  Roll:   ${attackWithCover.roll}`);
console.log(`  Bonus:  +${playerStats.attackBonus + playerStats.weapons[0].attackBonus}`);
console.log(`  Total:  ${attackWithCover.total}`);
console.log(`  vs SR:  ${effectiveSR}`);
console.log(`  Result: ${attackWithCover.result}`);

// ============================================================================
// STAT COMPARISON TABLE
// ============================================================================

console.log('\n\n' + '='.repeat(80));
console.log('SHIP COMPARISON TABLE');
console.log('='.repeat(80));

const table = [
  ['Attribute', 'Player (Frigate)', 'Enemy (Interceptor)'],
  ['-'.repeat(20), '-'.repeat(20), '-'.repeat(20)],
  ['Hull', `${playerStats.maxHull} HP`, `${enemyStats.maxHull} HP`],
  ['Shields', `${playerStats.maxShields} HP`, `${enemyStats.maxShields} HP`],
  ['Armor', `${playerStats.armor}%`, `${enemyStats.armor}%`],
  ['Signature Radius', playerStats.signatureRadius, enemyStats.signatureRadius],
  ['Evasion', playerStats.evasion, enemyStats.evasion],
  ['Attack Bonus', `+${playerStats.attackBonus}`, `+${enemyStats.attackBonus}`],
  ['Initiative', `+${playerStats.initiative}`, `+${enemyStats.initiative}`],
  ['Speed', playerStats.speed, enemyStats.speed],
  ['Actions/Turn', playerStats.actionsPerTurn, enemyStats.actionsPerTurn],
  ['Reactions', playerStats.reactionsPerRound, enemyStats.reactionsPerRound],
  ['Primary Weapon', playerStats.weapons[0]?.damage || 'None', enemyStats.weapons[0]?.damage || 'None'],
];

table.forEach(row => {
  console.log(`  ${row[0].padEnd(20)} ${String(row[1]).padEnd(20)} ${row[2]}`);
});

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
