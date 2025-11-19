/**
 * DRE Walkthrough - Verbose Step-by-Step Demonstration
 * Run with: node src/lib/dre/walkthrough.js
 */

import { resolveAction } from './engine.js';
import { previewOdds, previewCombatHit } from './preview.js';
import { emitToTerminal } from './output.js';

function printHeader(title) {
  console.log('\n============================================================');
  console.log(title);
  console.log('============================================================\n');
}

function printOutcome(outcome, context, { showSections = true } = {}) {
  const output = emitToTerminal(outcome, context, { showModifiers: true, showRolls: true, showAIAnalysis: true, animated: false });
  console.log(output.narrative);
  if (showSections) {
    console.log('\n--- Details ---');
    output.sections.forEach(s => console.log(`[${s.type}] ${s.content}`));
  }
  if (output.aiSpeech) {
    console.log('\nAI:', output.aiSpeech);
  }
}

// Demo context shared pieces
const baseShip = {
  components: [
    { type: 'miningLaser', tier: 2 },
    { type: 'scanner', tier: 2 },
    { type: 'weaponsArray', tier: 2 },
    { type: 'targeting', tier: 1 },
    { type: 'engine', tier: 2 }
  ],
  hull: 85,
  maxHull: 100,
  shields: 12,
  evasion: 13,
  wake: 0.25
};

const aiRoster = [
  { role: 'engineer', tier: 2, docked: true, injured: false, personality: 'logical' },
  { role: 'tactical', tier: 2, docked: true, injured: false, personality: 'aggressive' }
];

const attributes = {
  // Sci‑Fi attributes
  kinetics: 1,
  reflexes: 3,
  resilience: 2,
  logic: 3,
  insight: 2,
  presence: 1,
  acuity: 3
};

const skills = {
  engineering: 2,
  scavenging: 1,
  gunnery: 2,
  piloting: 2,
  medicine: 0,
  survival: 1,
  hacking: 1
};

const system = { radiation: 'medium', zone: 'static', stability: 'unstable' };

(async function run() {
  printHeader('DRE Walkthrough');

  // 1) Preview odds for mining
  const miningContext = { shipState: baseShip, aiRoster, location: system, difficulty: 'normal', attributes, skills };
  console.log('Mining Odds:', previewOdds('mining', miningContext).summary);
  const mining = resolveAction('mining', miningContext, 'walk-mining');
  printOutcome(mining, miningContext);

  // 2) Scavenging with trap/detection chance
  const scavContext = { shipState: baseShip, aiRoster, location: system, difficulty: 'hard', attributes, skills };
  console.log('\nScavenging Odds:', previewOdds('scavenging', scavContext).summary);
  const scav = resolveAction('scavenging', scavContext, 'walk-scav');
  printOutcome(scav, scavContext);

  // 3) Derelict investigation – might trigger combat
  const derContext = { shipState: baseShip, aiRoster, location: system, difficulty: 'hard', attributes, skills };
  console.log('\nDerelict Odds:', previewOdds('derelict', derContext).summary);
  const der = resolveAction('derelict', derContext, 'walk-der');
  printOutcome(der, derContext);

  // 4) Combat sequence (3 rounds): initiative, attack exchanges, flee attempt
  printHeader('Combat Sequence');
  const enemy = { hull: 60, evasion: 14, shields: 8, weapons: [{ type: 'laser', tier: 2 }] };

  const init = resolveAction('combatInitiate', { shipState: baseShip, aiRoster, location: system, enemy, attributes, skills }, 'walk-combat-init');
  printOutcome(init, {});
  let playerTurn = init.consequences.playerTurn;

  for (let round = 1; round <= 3; round++) {
    console.log(`\n-- Round ${round} --`);

    if (playerTurn) {
      const atkCtx = { shipState: baseShip, aiRoster, location: system, weapon: { type: 'laser', tier: 2 }, target: enemy, range: 'medium', attributes, skills };
      const hitPreview = previewCombatHit(atkCtx);
      console.log(`Hit Chance: ${(hitPreview.hitChance).toFixed(0)}% (need >= ${hitPreview.neededRoll})`);
      const atk = resolveAction('combatAttack', atkCtx, `walk-combat-atk-${round}`);
      printOutcome(atk, atkCtx, { showSections: true });
      enemy.hull -= atk.consequences.enemyDamage || 0;
      console.log(`Enemy hull: ${Math.max(0, enemy.hull)}`);
      if (enemy.hull <= 0) break;
    } else {
      const eAtkCtx = { shipState: enemy, weapon: enemy.weapons[0], target: { evasion: baseShip.evasion, shields: baseShip.shields }, attributes: {}, skills: {} };
      const eAtk = resolveAction('combatAttack', eAtkCtx, `walk-enemy-atk-${round}`);
      printOutcome(eAtk, eAtkCtx, { showSections: true });
      baseShip.hull -= eAtk.consequences.enemyDamage || 0;
      console.log(`Player hull: ${Math.max(0, baseShip.hull)}`);
      if (baseShip.hull <= 0) break;
    }

    playerTurn = !playerTurn;
  }

  // 5) Attempt to flee
  const fleeCtx = { shipState: baseShip, aiRoster, location: system, combatDuration: 3, attributes, skills };
  console.log('\nFlee Odds:', previewOdds('combatFlee', fleeCtx).summary);
  const flee = resolveAction('combatFlee', fleeCtx, 'walk-flee');
  printOutcome(flee, fleeCtx);

  // 6) Mission completion (combines hard-coded baseline + DRE)
  const mission = {
    id: 'salvage-derelict-7',
    tier: 'highRisk',
    difficulty: 'hard',
    baseLoot: [ { item: 'Fuel Cell', quantity: 3 }, { item: 'Scrap Metal', quantity: 10 } ],
    bonusPool: ['Rare Component', 'AI Core Fragment', 'Research Data'],
    duration: 3.5
  };
  const missionCtx = { mission, shipState: baseShip, aiRoster, location: system, attributes, skills };
  console.log('\nMission Odds:', previewOdds('missionCompletion', missionCtx).summary);
  const missionOut = resolveAction('missionCompletion', missionCtx, 'walk-mission');
  printOutcome(missionOut, missionCtx);

  printHeader('Walkthrough Complete');
})();
