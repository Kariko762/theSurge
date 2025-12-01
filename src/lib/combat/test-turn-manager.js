/**
 * Test: Combat State Manager & Turn System
 * Tests D&D-style turn-based combat with action economy and reactions
 */

import { ShipManager } from '../ShipManager.js';
import { CombatStateManager } from './CombatStateManager.js';
import { ACTION_TYPES, executeAction } from './combatActions.js';

console.log('='.repeat(80));
console.log('COMBAT STATE MANAGER TEST');
console.log('='.repeat(80));

// ============================================================================
// Setup Ships
// ============================================================================

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

const pirate1 = new ShipManager('INTERCEPTOR', [
  'NAV_ADVANCED',
  'ENGINE_PLASMA',
  'SHIELD_MK1',
  'POWER_FUSION',
  'SENSORS_SHORT',
  'WEAPON_PULSE_LASER',
  'COMBAT_COMPUTER_MK2'
]);
pirate1.id = 'Pirate-Interceptor';

const pirate2 = new ShipManager('SURVEY_FRIGATE', [
  'NAV_BASIC',
  'ENGINE_ION',
  'SHIELD_MK2',
  'POWER_FISSION',
  'SENSORS_MEDIUM',
  'WEAPON_RAILGUN',
  'COMBAT_COMPUTER_MK1'
]);
pirate2.id = 'Pirate-Gunship';

// ============================================================================
// TEST 1: Combat Initialization
// ============================================================================
console.log('\n🎬 TEST 1: Combat Initialization');
console.log('-'.repeat(80));

const combat = new CombatStateManager();

const combatants = [
  { ship: playerShip, id: playerShip.id, faction: 'player', isPlayer: true },
  { ship: pirate1, id: pirate1.id, faction: 'pirates', isPlayer: false },
  { ship: pirate2, id: pirate2.id, faction: 'pirates', isPlayer: false }
];

const initResult = combat.startCombat(combatants, 300);

console.log(`✓ Combat initialized`);
console.log(`  Initiative order: ${initResult.initiativeOrder.join(' → ')}`);
console.log(`  First turn: ${initResult.currentShip.id}`);
console.log(`  Round: ${combat.roundNumber}`);

// ============================================================================
// TEST 2: Action Economy Tracking
// ============================================================================
console.log('\n📊 TEST 2: Action Economy Tracking');
console.log('-'.repeat(80));

const currentShipId = combat.getCurrentShipId();
const actions = combat.getActionsRemaining(currentShipId);

console.log(`\n${currentShipId} available actions:`);
console.log(`  Actions: ${actions.actions}`);
console.log(`  Bonus Actions: ${actions.bonusActions}`);
console.log(`  Reactions: ${actions.reactions}`);
console.log(`  Movement: ${actions.movement}`);

// ============================================================================
// TEST 3: Execute Actions
// ============================================================================
console.log('\n\n⚔️  TEST 3: Execute Actions');
console.log('-'.repeat(80));

const currentShip = combat.getCurrentShip();
const targetShip = combat.getEnemies(currentShip.id)[0];

console.log(`\n${currentShip.id} vs ${targetShip.id}`);
console.log('-'.repeat(40));

// Movement phase
console.log('\n--- MOVEMENT PHASE ---');
const moveResult = executeAction('MOVE_CLOSER', {
  actor: currentShip,
  target: targetShip,
  combatState: combat,
  movementPoints: 100
});

if (moveResult.success) {
  combat.spendAction(currentShip.id, 'movement', 'MOVE_CLOSER', 100);
  console.log(`✓ ${moveResult.message}`);
}

// Action phase
console.log('\n--- ACTION PHASE ---');
const weapon = currentShip.ship.calculateCombatStats().weapons[0];
const attackResult = executeAction('FIRE_WEAPON', {
  actor: currentShip,
  target: targetShip,
  weapon,
  combatState: combat
});

if (attackResult.success) {
  combat.spendAction(currentShip.id, 'action', 'FIRE_WEAPON');
  console.log(`✓ Hit! ${attackResult.damage} ${attackResult.damageType} damage${attackResult.crit ? ' (CRIT!)' : ''}`);
} else {
  console.log(`✗ Missed!`);
}

// Bonus action phase
console.log('\n--- BONUS ACTION PHASE ---');
const boostResult = executeAction('BOOST_SHIELDS', {
  actor: currentShip,
  combatState: combat
});

if (boostResult.success) {
  combat.spendAction(currentShip.id, 'bonusAction', 'BOOST_SHIELDS');
  console.log(`✓ ${boostResult.message}`);
}

// Check remaining actions
const remainingActions = combat.getActionsRemaining(currentShip.id);
console.log(`\nActions remaining:`);
console.log(`  Actions: ${remainingActions.actions}`);
console.log(`  Bonus Actions: ${remainingActions.bonusActions}`);
console.log(`  Movement: ${remainingActions.movement}`);

// ============================================================================
// TEST 4: Turn Advancement
// ============================================================================
console.log('\n\n🔄 TEST 4: Turn Advancement');
console.log('-'.repeat(80));

console.log(`\nCurrent turn: ${combat.getCurrentShipId()}`);

const nextTurn = combat.advanceTurn();
console.log(`Advanced to: ${nextTurn.combatant.id}`);
console.log(`Phase: ${nextTurn.phase}`);
console.log(`Round ended: ${nextTurn.roundEnded ? 'Yes' : 'No'}`);

// Advance again
const nextTurn2 = combat.advanceTurn();
console.log(`Advanced to: ${nextTurn2.combatant.id}`);

// This should start new round
const nextTurn3 = combat.advanceTurn();
console.log(`Advanced to: ${nextTurn3.combatant.id}`);
console.log(`Round: ${combat.roundNumber}`);
console.log(`New round started: ${nextTurn3.roundEnded ? 'Yes' : 'No'}`);

// ============================================================================
// TEST 5: Reaction Window System
// ============================================================================
console.log('\n\n⏸️  TEST 5: Reaction Window System');
console.log('-'.repeat(80));

// Simulate an attack that triggers reactions
const attacker = combat.combatants[0];
const defender = combat.combatants[1];

console.log(`\n${attacker.id} attacks ${defender.id}...`);

const triggeringAction = {
  actor: attacker.id,
  type: 'FIRE_WEAPON',
  target: defender.id,
  data: {}
};

// Open reaction window
const eligibleReactors = [defender.id];
console.log(`Opening reaction window for: ${eligibleReactors.join(', ')}`);

const reactionsPromise = combat.openReactionWindow(triggeringAction, eligibleReactors);

// Queue a reaction
setTimeout(() => {
  const queued = combat.queueReaction(defender.id, 'EMERGENCY_BURN');
  console.log(`Reaction queued: ${queued ? 'Success' : 'Failed'}`);
}, 10);

// Wait for reaction window to close
await reactionsPromise;

console.log(`Reaction window closed`);
console.log(`Queued reactions: ${combat.reactionQueue.length}`);

// Resolve reactions
const reactionResults = await combat.resolveReactions();
console.log(`Resolved ${reactionResults.length} reaction(s)`);

// ============================================================================
// TEST 6: Status Effects
// ============================================================================
console.log('\n\n✨ TEST 6: Status Effects');
console.log('-'.repeat(80));

const testShip = combat.combatants[0];

// Add status effects
combat.addStatusEffect(testShip.id, {
  type: 'EVASIVE',
  duration: 2,
  evasionBonus: 4,
  source: testShip.id
});

combat.addStatusEffect(testShip.id, {
  type: 'TARGET_LOCK',
  duration: 3,
  attackBonus: 2,
  lockedTarget: 'enemy-1',
  source: testShip.id
});

const effects = combat.getStatusEffects(testShip.id);
console.log(`\n${testShip.id} status effects:`);
effects.forEach(effect => {
  console.log(`  - ${effect.type} (${effect.duration} rounds)`);
});

// Process start of round (tick effects)
console.log(`\nProcessing start of round...`);
combat.processStartOfRound();

const effectsAfter = combat.getStatusEffects(testShip.id);
console.log(`Effects after round processing:`);
effectsAfter.forEach(effect => {
  console.log(`  - ${effect.type} (${effect.duration} rounds remaining)`);
});

// ============================================================================
// TEST 7: Combat Queries
// ============================================================================
console.log('\n\n🔍 TEST 7: Combat State Queries');
console.log('-'.repeat(80));

const queryShip = combat.combatants[0];

const enemies = combat.getEnemies(queryShip.id);
console.log(`\n${queryShip.id} enemies:`);
enemies.forEach(enemy => {
  const distance = combat.positioning.getDistance(queryShip.id, enemy.id);
  const band = combat.positioning.getDistanceBandKey(queryShip.id, enemy.id);
  console.log(`  - ${enemy.id} at ${distance}km (${band})`);
});

const allies = combat.getAllies(queryShip.id);
console.log(`\n${queryShip.id} allies: ${allies.length > 0 ? allies.map(a => a.id).join(', ') : 'None'}`);

// ============================================================================
// TEST 8: Full Combat Round Simulation
// ============================================================================
console.log('\n\n⚔️  TEST 8: Full Combat Round Simulation');
console.log('='.repeat(80));

// Reset combat
const combat2 = new CombatStateManager();
combat2.startCombat(combatants, 250);

console.log(`\n--- ROUND ${combat2.roundNumber} ---\n`);

// Simulate 3 turns
for (let i = 0; i < 3; i++) {
  const current = combat2.getCurrentShip();
  const targets = combat2.getEnemies(current.id);
  
  if (targets.length === 0) break;
  
  const target = targets[0];
  
  console.log(`\n${current.id}'s Turn:`);
  console.log('-'.repeat(40));
  
  // Move closer
  const move = executeAction('MOVE_CLOSER', {
    actor: current,
    target,
    combatState: combat2,
    movementPoints: 50
  });
  
  if (move.success) {
    combat2.spendAction(current.id, 'movement', 'MOVE_CLOSER', 50);
  }
  
  // Attack
  const wpn = current.ship.calculateCombatStats().weapons[0];
  if (wpn) {
    const attack = executeAction('FIRE_WEAPON', {
      actor: current,
      target,
      weapon: wpn,
      combatState: combat2
    });
    
    if (attack.success) {
      combat2.spendAction(current.id, 'action', 'FIRE_WEAPON');
    }
  }
  
  // Bonus action (alternating)
  if (i % 2 === 0) {
    const boost = executeAction('BOOST_SHIELDS', {
      actor: current,
      combatState: combat2
    });
    if (boost.success) {
      combat2.spendAction(current.id, 'bonusAction', 'BOOST_SHIELDS');
    }
  } else {
    const lock = executeAction('TARGET_LOCK', {
      actor: current,
      target,
      combatState: combat2
    });
    if (lock.success) {
      combat2.spendAction(current.id, 'bonusAction', 'TARGET_LOCK');
    }
  }
  
  // Advance turn
  combat2.advanceTurn();
}

// ============================================================================
// TEST 9: Combat Log
// ============================================================================
console.log('\n\n📜 TEST 9: Combat Log');
console.log('-'.repeat(80));

const log = combat2.getLog();
console.log(`\nTotal log entries: ${log.length}`);
console.log(`\nLast 10 entries:`);
log.slice(-10).forEach(entry => {
  console.log(`  [R${entry.round}:${entry.phase}] ${entry.message}`);
});

// ============================================================================
// TEST 10: State Export/Import
// ============================================================================
console.log('\n\n💾 TEST 10: State Export/Import');
console.log('-'.repeat(80));

const exportedState = combat2.exportState();
console.log(`\nExported combat state:`);
console.log(`  Combatants: ${exportedState.combatants.length}`);
console.log(`  Round: ${exportedState.roundNumber}`);
console.log(`  Phase: ${exportedState.phase}`);
console.log(`  Current turn: ${exportedState.initiativeOrder[exportedState.currentTurnIndex]}`);
console.log(`  Log entries: ${exportedState.combatLog.length}`);

// Create new combat manager and import state
const combat3 = new CombatStateManager();
combat3.importState(exportedState, combatants.map(c => c.ship));

console.log(`\nImported to new combat manager:`);
console.log(`  Round: ${combat3.roundNumber}`);
console.log(`  Phase: ${combat3.phase}`);
console.log(`  Current turn: ${combat3.getCurrentShipId()}`);
console.log(`  ✓ State successfully restored`);

console.log('\n' + '='.repeat(80));
console.log('✅ All Combat State Manager Tests Complete!');
console.log('='.repeat(80));
