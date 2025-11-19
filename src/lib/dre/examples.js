/**
 * DRE Usage Examples
 * Demonstrates how to integrate the Dice Resolution Engine
 */

import { resolveAction } from './engine.js';
import { previewOdds } from './preview.js';
import { emitToTerminal } from './output.js';

// ============================================================================
// EXAMPLE 1: Simple Mining Action
// ============================================================================

console.log('=== Example 1: Mining Action ===\n');

const miningContext = {
  shipState: {
    components: [
      { type: 'miningLaser', tier: 2 },
      { type: 'scanner', tier: 1 }
    ],
    hull: 80,
    maxHull: 100
  },
  aiRoster: [
    { role: 'engineer', tier: 1, docked: true, injured: false, personality: 'cautious' }
  ],
  location: {
    radiation: 'low',
    zone: 'quiet'
  },
  difficulty: 'normal'
};

// Preview odds first
const miningOdds = previewOdds('mining', miningContext);
console.log('Success Chance:', miningOdds.summary);
console.log('Modifiers:', miningOdds.modifierBreakdown);
console.log();

// Execute action
const miningResult = resolveAction('mining', miningContext, 'example-mining-1');
const miningOutput = emitToTerminal(miningResult, miningContext);

console.log(miningOutput.narrative);
console.log('\nAI Says:', miningOutput.aiSpeech);
console.log();

// ============================================================================
// EXAMPLE 2: Combat Sequence
// ============================================================================

console.log('=== Example 2: Combat ===\n');

const combatContext = {
  shipState: {
    components: [
      { type: 'weaponsArray', tier: 2 },
      { type: 'targeting', tier: 1 }
    ],
    hull: 60,
    maxHull: 100
  },
  aiRoster: [
    { role: 'tactical', tier: 2, docked: true, injured: false, personality: 'aggressive' }
  ],
  enemy: {
    hull: 50,
    evasion: 14,
    shields: 10
  },
  weapon: {
    type: 'laser',
    tier: 2
  },
  range: 'medium'
};

// Preview hit chance
const hitOdds = previewOdds('combatAttack', combatContext);
console.log('Hit Chance:', hitOdds.summary);
console.log();

// Initiative roll
const initiative = resolveAction('combatInitiate', combatContext, 'combat-init');
const initOutput = emitToTerminal(initiative);
console.log(initOutput.narrative);
console.log();

// Attack
const attack = resolveAction('combatAttack', combatContext, 'combat-attack-1');
const attackOutput = emitToTerminal(attack);
console.log(attackOutput.narrative);
console.log('\nAI Says:', attackOutput.aiSpeech);
console.log();

// ============================================================================
// EXAMPLE 3: Scavenging with Trap
// ============================================================================

console.log('=== Example 3: Scavenging ===\n');

const scavContext = {
  shipState: {
    components: [
      { type: 'scanner', tier: 3 }
    ]
  },
  aiRoster: [
    { role: 'researcher', tier: 2, docked: true, injured: false }
  ],
  location: {
    zone: 'static', // Better loot in static zones
    radiation: 'medium'
  },
  difficulty: 'hard'
};

const scavOdds = previewOdds('scavenging', scavContext);
console.log('Success Chance:', scavOdds.summary);
console.log();

const scavResult = resolveAction('scavenging', scavContext, 'scav-example');
const scavOutput = emitToTerminal(scavResult);
console.log(scavOutput.narrative);
console.log();

// ============================================================================
// EXAMPLE 4: Mission Completion
// ============================================================================

console.log('=== Example 4: Mission Completion ===\n');

const mission = {
  id: 'salvage-derelict-7',
  tier: 'highRisk',
  difficulty: 'hard',
  baseLoot: [
    { item: 'Fuel Cell', quantity: 3 },
    { item: 'Scrap Metal', quantity: 10 }
  ],
  bonusPool: ['Rare Component', 'AI Core Fragment', 'Research Data'],
  duration: 3.5
};

const missionContext = {
  mission,
  shipState: {
    components: [
      { type: 'scanner', tier: 2 },
      { type: 'hull', tier: 1 }
    ]
  },
  aiRoster: [
    { role: 'tactical', tier: 2, docked: true, injured: false },
    { role: 'engineer', tier: 1, docked: true, injured: false }
  ],
  researchTree: {
    missionPlanning: true
  }
};

const missionOdds = previewOdds('missionCompletion', missionContext);
console.log('Mission Success Chance:', missionOdds.summary);
console.log();

const missionResult = resolveAction('missionCompletion', missionContext, 'mission-completion');
const missionOutput = emitToTerminal(missionResult);
console.log(missionOutput.narrative);
console.log();

// ============================================================================
// EXAMPLE 5: Comparing Loadouts
// ============================================================================

console.log('=== Example 5: Loadout Comparison ===\n');

import { compareOdds } from './preview.js';

const loadouts = [
  {
    label: 'Basic Setup',
    shipState: { components: [{ type: 'miningLaser', tier: 1 }] },
    aiRoster: [],
    location: { radiation: 'high' },
    difficulty: 'hard'
  },
  {
    label: 'Upgraded Laser',
    shipState: { components: [{ type: 'miningLaser', tier: 3 }] },
    aiRoster: [],
    location: { radiation: 'high' },
    difficulty: 'hard'
  },
  {
    label: 'Laser + Engineer AI',
    shipState: { components: [{ type: 'miningLaser', tier: 3 }] },
    aiRoster: [{ role: 'engineer', tier: 2, docked: true }],
    location: { radiation: 'high' },
    difficulty: 'hard'
  }
];

const comparison = compareOdds('mining', loadouts);
comparison.forEach(({ label, odds }) => {
  console.log(`${label}: ${odds.summary}`);
});
console.log();

// ============================================================================
// EXAMPLE 6: Away Team Mission
// ============================================================================

console.log('=== Example 6: Away Team Mission ===\n');

const awayContext = {
  shipState: { components: [] },
  aiRoster: [
    { role: 'medic', tier: 2, docked: true, injured: false },
    { role: 'engineer', tier: 1, docked: true, injured: false }
  ],
  location: {
    atmosphere: 'hostile',
    radiation: 'high'
  },
  researchTree: {
    environmentalSuits: true,
    medicalProtocols: true
  },
  difficulty: 'deadly'
};

const awayOdds = previewOdds('awayTeam', awayContext);
console.log('Mission Success:', awayOdds.summary);
console.log('Modifiers:', awayOdds.modifierBreakdown);
console.log();

const awayResult = resolveAction('awayTeam', awayContext, 'away-team-1');
const awayOutput = emitToTerminal(awayResult);
console.log(awayOutput.narrative);
console.log();

console.log('=== Examples Complete ===');
