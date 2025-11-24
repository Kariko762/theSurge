/**
 * Direct test of loot container system
 * Run with: node backend/test-loot-system.js
 */

const fs = require('fs');
const path = require('path');

// Load the event outcome processor
const eventOutcomeProcessor = require('./services/eventOutcomeProcessor');

// Load config to get loot pools
const configPath = path.join(__dirname, 'data', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function runTests() {
  console.log('🎁 LOOT CONTAINER SYSTEM TEST\n');

// Test 1: Create a test loot pool with grades
console.log('📦 Test 1: Creating test loot pool with grades...');
const testPool = {
  id: 'test_military_loot',
  name: 'Test Military Loot Pool',
  description: 'Test pool with multiple container grades',
  tags: ['military', 'test'],
  grades: [
    {
      id: 'grade_1',
      displayName: 'GRADE-I MILITARY CONTAINER',
      weight: 50,
      filters: {
        tiers: ['common', 'uncommon'],
        tags: ['military']
      },
      guaranteedItems: [
        { itemId: 'credits', quantity: 100 }
      ],
      rollSettings: {
        minItems: 2,
        maxItems: 3,
        bonusRolls: 0
      },
      containerData: {
        icon: '📦',
        glowColor: '#0ff',
        revealAnimation: 'pulse',
        revealDelay: 300
      }
    },
    {
      id: 'grade_2',
      displayName: 'GRADE-II MILITARY CONTAINER',
      weight: 30,
      filters: {
        tiers: ['uncommon', 'rare'],
        tags: ['military']
      },
      guaranteedItems: [
        { itemId: 'credits', quantity: 500 }
      ],
      rollSettings: {
        minItems: 3,
        maxItems: 5,
        bonusRolls: 1
      },
      containerData: {
        icon: '🎁',
        glowColor: '#0af',
        revealAnimation: 'flash',
        revealDelay: 250
      }
    },
    {
      id: 'grade_3',
      displayName: 'GRADE-III MILITARY CONTAINER',
      weight: 15,
      filters: {
        tiers: ['rare', 'epic'],
        tags: ['military']
      },
      guaranteedItems: [
        { itemId: 'credits', quantity: 1000 }
      ],
      rollSettings: {
        minItems: 4,
        maxItems: 6,
        bonusRolls: 2
      },
      containerData: {
        icon: '💎',
        glowColor: '#c0f',
        revealAnimation: 'spin',
        revealDelay: 200
      }
    },
    {
      id: 'grade_legendary',
      displayName: 'LEGENDARY MILITARY CACHE',
      weight: 5,
      filters: {
        tiers: ['epic', 'legendary'],
        tags: ['military']
      },
      guaranteedItems: [
        { itemId: 'credits', quantity: 5000 }
      ],
      rollSettings: {
        minItems: 5,
        maxItems: 8,
        bonusRolls: 3
      },
      containerData: {
        icon: '⭐',
        glowColor: '#fa0',
        revealAnimation: 'shake',
        revealDelay: 150
      }
    }
  ],
  entries: [
    { itemId: 'iron_ore', weight: 10, minQty: 5, maxQty: 15 },
    { itemId: 'platinum_ore', weight: 5, minQty: 2, maxQty: 5 },
    { itemId: 'credits', weight: 8, minQty: 100, maxQty: 500 },
    { itemId: 'ecm_suite_advanced', weight: 3, minQty: 1, maxQty: 1 },
    { itemId: 'power_core_military', weight: 3, minQty: 1, maxQty: 2 }
  ]
};

// Add test pool to config in lootTables.pools (where resolveLootPool looks)
if (!config.lootTables) config.lootTables = {};
if (!config.lootTables.pools) config.lootTables.pools = [];
const existingIndex = config.lootTables.pools.findIndex(p => p.id === testPool.id);
if (existingIndex >= 0) {
  config.lootTables.pools[existingIndex] = testPool;
} else {
  config.lootTables.pools.push(testPool);
}
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log('✅ Test pool created and saved to config.json\n');

// Test 2: Resolve loot multiple times to check grade distribution
console.log('🎲 Test 2: Resolving loot 20 times to check grade distribution...');
const gradeStats = {
  'grade_1': 0,
  'grade_2': 0,
  'grade_3': 0,
  'grade_legendary': 0
};

for (let i = 0; i < 20; i++) {
  try {
    const result = await eventOutcomeProcessor.resolveLootPool('test_military_loot');
    if (result && result.containerData && result.containerData.gradeId) {
      gradeStats[result.containerData.gradeId]++;
    }
  } catch (error) {
    console.error(`Error on roll ${i + 1}:`, error.message);
  }
}

console.log('Grade distribution (expected ~50%, ~30%, ~15%, ~5%):');
console.log(`  GRADE-I:     ${gradeStats.grade_1}/20 (${(gradeStats.grade_1/20*100).toFixed(1)}%)`);
console.log(`  GRADE-II:    ${gradeStats.grade_2}/20 (${(gradeStats.grade_2/20*100).toFixed(1)}%)`);
console.log(`  GRADE-III:   ${gradeStats.grade_3}/20 (${(gradeStats.grade_3/20*100).toFixed(1)}%)`);
console.log(`  LEGENDARY:   ${gradeStats.grade_legendary}/20 (${(gradeStats.grade_legendary/20*100).toFixed(1)}%)\n`);

// Test 3: Verify guaranteed items
console.log('⭐ Test 3: Checking guaranteed items consistency...');
let guaranteedItemsCorrect = true;
for (let i = 0; i < 5; i++) {
  const result = await eventOutcomeProcessor.resolveLootPool('test_military_loot');
  const hasGuaranteedCredits = result.items.some(item => 
    item.itemId === 'credits' && item.guaranteed === true
  );
  if (!hasGuaranteedCredits) {
    console.error(`❌ Roll ${i + 1}: Missing guaranteed credits!`);
    guaranteedItemsCorrect = false;
  }
}
if (guaranteedItemsCorrect) {
  console.log('✅ All 5 rolls contained guaranteed credits\n');
}

// Test 4: Verify container metadata structure
console.log('🎨 Test 4: Checking container metadata structure...');
const sampleResult = await eventOutcomeProcessor.resolveLootPool('test_military_loot');
console.log('Sample container data:', JSON.stringify(sampleResult.containerData, null, 2));

if (sampleResult.containerData && 
    sampleResult.containerData.gradeId &&
    sampleResult.containerData.displayName &&
    sampleResult.containerData.icon &&
    sampleResult.containerData.glowColor &&
    sampleResult.containerData.revealAnimation) {
  console.log('✅ Container data structure is correct\n');
} else {
  console.error('❌ Container data structure incomplete!\n');
}

// Test 5: Full result inspection
console.log('🚀 Test 5: Full integration test...');
const fullResult = await eventOutcomeProcessor.resolveLootPool('test_military_loot');
console.log('\nFull result:');
console.log('Items:', fullResult.items.map(i => `${i.itemId} x${i.quantity}${i.guaranteed ? ' ⭐' : ''}`).join(', '));
console.log('Container:', fullResult.containerData.displayName);
console.log('Icon:', fullResult.containerData.icon);
console.log('Animation:', fullResult.containerData.revealAnimation);
console.log('Delay:', fullResult.containerData.revealDelay + 'ms');

console.log('\n✅ ALL TESTS COMPLETE\n');
}

// Run the async test suite
runTests().catch(error => {
  console.error('❌ TEST FAILED:', error);
  process.exit(1);
});
