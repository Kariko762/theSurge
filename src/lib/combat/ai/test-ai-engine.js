/**
 * Test: AI Combat Engine + Flow Controller
 * Runs a simple turn for an AI ship against a player ship.
 */

import { ShipManager } from '../../ShipManager.js';
import { CombatStateManager } from '../CombatStateManager.js';
import { CombatFlowController } from '../CombatFlowController.js';

console.log('='.repeat(80));
console.log('AI COMBAT ENGINE TEST');
console.log('='.repeat(80));

// Create ships
const playerShip = new ShipManager('SURVEY_FRIGATE', [
  'NAV_ADVANCED',
  'ENGINE_ION',
  'SHIELD_MK2',
  'POWER_RFE',
  'SENSORS_LONG',
  'WEAPON_PLASMA_CANNON',
  'COMBAT_COMPUTER_MK1'
]);
playerShip.id = 'Player-Frigate';

const aiShip = new ShipManager('INTERCEPTOR', [
  'NAV_ADVANCED',
  'ENGINE_PLASMA',
  'SHIELD_MK1',
  'POWER_FUSION',
  'SENSORS_SHORT',
  'WEAPON_PULSE_LASER',
  'COMBAT_COMPUTER_MK2'
]);
aiShip.id = 'Pirate-Interceptor';

// Build combatants
const combatants = [
  { ship: playerShip, id: playerShip.id, faction: 'player', isPlayer: true },
  { ship: aiShip, id: aiShip.id, faction: 'pirates', isPlayer: false, isAI: true, personality: 'TACTICAL', veteranRank: 'VETERAN' }
];

// Start combat
const combat = new CombatStateManager();
combat.startCombat(combatants, 300);

// Ensure it's AI's turn for the test
const aiIndex = combat.initiativeOrder.indexOf(aiShip.id);
if (aiIndex !== -1) {
  combat.currentTurnIndex = aiIndex;
}

console.log(`\nCurrent turn: ${combat.getCurrentShipId()}`);

// Execute AI turn
const flow = new CombatFlowController(combat);
const plan = await flow.executeTurn(aiShip.id);

console.log('\nAI Plan:');
console.log(JSON.stringify(plan, null, 2));

if (plan?.reasons?.length) {
  console.log('\nAI Reasons:');
  plan.reasons.forEach(r => console.log('  -', JSON.stringify(r)));
}

console.log('\nRemaining actions:');
console.log(combat.getActionsRemaining(aiShip.id));

console.log('\nDistances after turn:');
combat.getEnemies(aiShip.id).forEach(e => {
  const d = combat.positioning.getDistance(aiShip.id, e.id);
  const band = combat.positioning.getDistanceBandKey(aiShip.id, e.id);
  console.log(`  ${aiShip.id} -> ${e.id}: ${d}km (${band})`);
});

console.log('\nLast 5 log entries:');
combat.getLog().slice(-5).forEach(entry => {
  console.log(`  [R${entry.round}:${entry.phase}] ${entry.message}`);
});

console.log('\n' + '='.repeat(80));
console.log('✅ AI Combat Engine Test Complete');
console.log('='.repeat(80));
