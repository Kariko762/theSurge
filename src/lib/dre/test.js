/**
 * DRE Test Suite - Basic validation
 * Run with: node src/lib/dre/test.js
 */

import { resolveAction } from './engine.js';
import { previewOdds } from './preview.js';
import { collectModifiers } from './modifiers/index.js';

// Test counters
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// ============================================================================
// DETERMINISM TESTS
// ============================================================================

test('Same seed produces same mining result', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const result1 = resolveAction('mining', context, 'test-seed-1');
  const result2 = resolveAction('mining', context, 'test-seed-1');
  
  assert(result1.totalRoll === result2.totalRoll, 'Rolls should match');
  assert(result1.result === result2.result, 'Results should match');
});

test('Different seeds produce different results', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const result1 = resolveAction('mining', context, 'seed-A');
  const result2 = resolveAction('mining', context, 'seed-B');
  
  // Should be different (highly likely with different seeds)
  const different = result1.totalRoll !== result2.totalRoll || result1.result !== result2.result;
  assert(different, 'Different seeds should produce different outcomes (usually)');
});

// ============================================================================
// MODIFIER TESTS
// ============================================================================

test('Ship components add modifiers', () => {
  const context = {
    shipState: {
      components: [
        { type: 'miningLaser', tier: 2 },
        { type: 'scanner', tier: 1 }
      ]
    },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const result = resolveAction('mining', context, 'test-mods-1');
  
  assert(result.modifierBreakdown.ship > 0, 'Ship should provide bonus');
  assert(result.modifierBreakdown.ship >= 2, 'Mining laser tier 2 should give at least +2');
});

test('AI crew adds modifiers', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [
      { role: 'engineer', tier: 1, docked: true, injured: false }
    ],
    location: {},
    difficulty: 'normal'
  };
  
  const result = resolveAction('mining', context, 'test-ai-1');
  
  assert(result.modifierBreakdown.ai !== undefined, 'AI should provide modifier');
  assert(result.modifierBreakdown.ai > 0, 'Engineer should provide bonus to mining');
});

test('Environment applies penalties', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    location: {
      radiation: 'high',
      zone: 'dark'
    },
    difficulty: 'normal'
  };
  
  const result = resolveAction('mining', context, 'test-env-1');
  
  assert(result.modifierBreakdown.environment !== undefined, 'Environment should affect roll');
  assert(result.modifierBreakdown.environment < 0, 'High radiation and dark zone should penalize');
});

test('Modifiers stack correctly', () => {
  const noMods = {
    shipState: { components: [] },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const withMods = {
    shipState: {
      components: [{ type: 'miningLaser', tier: 3 }]
    },
    aiRoster: [
      { role: 'engineer', tier: 2, docked: true, injured: false }
    ],
    location: {},
    difficulty: 'normal'
  };
  
  const seed = 'stack-test';
  const result1 = resolveAction('mining', noMods, seed);
  const result2 = resolveAction('mining', withMods, seed);
  
  // Same base roll, different total due to modifiers
  assert(result2.totalRoll > result1.totalRoll, 'Modifiers should increase total');
});

// ============================================================================
// ACTION TYPE TESTS
// ============================================================================

test('Mining produces valid outcome', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const result = resolveAction('mining', context, 'mining-test');
  
  assert(result.actionType === 'mining', 'Action type should be mining');
  assert(['crit_success', 'success', 'fail', 'crit_fail'].includes(result.result), 'Result should be valid');
  assert(result.consequences !== undefined, 'Should have consequences');
  assert(typeof result.consequences.wakeAdded === 'number', 'Wake should be numeric');
});

test('Scavenging produces valid outcome', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const result = resolveAction('scavenging', context, 'scav-test');
  
  assert(result.actionType === 'scavenging', 'Action type should be scavenging');
  assert(result.secondaryRolls.trap !== undefined, 'Should have trap roll');
  assert(result.secondaryRolls.detection !== undefined, 'Should have detection roll');
});

test('Combat attack produces valid outcome', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    weapon: { type: 'laser', tier: 1 },
    target: { evasion: 12, shields: 10 }
  };
  
  const result = resolveAction('combatAttack', context, 'combat-test');
  
  assert(result.actionType === 'combatAttack', 'Action type should be combatAttack');
  assert(result.hitRoll !== undefined, 'Should have hit roll');
  assert(result.statusEffect !== undefined, 'Should have status effect');
});

// ============================================================================
// ODDS PREVIEW TESTS
// ============================================================================

test('Odds preview calculates probabilities', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const odds = previewOdds('mining', context);
  
  assert(odds.probabilities !== undefined, 'Should have probabilities');
  assert(odds.successChance !== undefined, 'Should have success chance');
  assert(odds.failChance !== undefined, 'Should have fail chance');
  
  // Probabilities should sum to 100
  const total = odds.probabilities.critSuccess + 
                odds.probabilities.success + 
                odds.probabilities.fail + 
                odds.probabilities.critFail;
  assert(total === 100, `Probabilities should sum to 100, got ${total}`);
});

test('Higher modifiers increase success chance', () => {
  const lowMod = {
    shipState: { components: [] },
    aiRoster: [],
    location: { radiation: 'high' },
    difficulty: 'normal'
  };
  
  const highMod = {
    shipState: {
      components: [
        { type: 'miningLaser', tier: 3 },
        { type: 'scanner', tier: 2 }
      ]
    },
    aiRoster: [
      { role: 'engineer', tier: 2, docked: true }
    ],
    location: {},
    difficulty: 'normal'
  };
  
  const odds1 = previewOdds('mining', lowMod);
  const odds2 = previewOdds('mining', highMod);
  
  assert(odds2.successChance > odds1.successChance, 'Better gear should increase success chance');
});

// ============================================================================
// CRITICAL ROLL TESTS
// ============================================================================

test('Critical success on nat 20', () => {
  // Force a nat 20 by finding a seed that produces it
  let foundCrit = false;
  
  for (let i = 0; i < 100; i++) {
    const result = resolveAction('mining', {
      shipState: { components: [] },
      aiRoster: [],
      location: {},
      difficulty: 'normal'
    }, `crit-search-${i}`);
    
    if (result.result === 'crit_success') {
      foundCrit = true;
      break;
    }
  }
  
  assert(foundCrit, 'Should find a critical success in 100 tries');
});

// ============================================================================
// RUN TESTS
// ============================================================================

console.log('\n=== DRE Test Suite ===\n');

test('Same seed produces same mining result', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const result1 = resolveAction('mining', context, 'test-seed-1');
  const result2 = resolveAction('mining', context, 'test-seed-1');
  
  assert(result1.totalRoll === result2.totalRoll, 'Rolls should match');
});

test('Ship components add modifiers', () => {
  const context = {
    shipState: {
      components: [{ type: 'miningLaser', tier: 2 }]
    },
    aiRoster: [],
    location: {},
    difficulty: 'normal'
  };
  
  const result = resolveAction('mining', context, 'test-ship');
  assert(result.modifierBreakdown.ship > 0, 'Ship should add bonus');
});

test('AI crew adds modifiers', () => {
  const context = {
    shipState: { components: [] },
    aiRoster: [{ role: 'engineer', docked: true, injured: false }],
    location: {},
    difficulty: 'normal'
  };
  
  const result = resolveAction('mining', context, 'test-ai');
  assert(result.modifierBreakdown.ai > 0, 'AI should add bonus');
});

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

if (failed === 0) {
  console.log('🌟 All tests passed!');
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
