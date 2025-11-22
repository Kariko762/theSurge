# DRE (Dice Resolution Engine) - Deep Dive

## 🎲 What is the DRE?

The **Dice Resolution Engine** is the core randomness and outcome system for The Surge. It handles ALL chance-based events: mining, combat, scanning, scavenging, away missions, etc.

Think of it as the "dice rolling brain" of the game - but with:
- **Deterministic RNG** (same seed = same result, always)
- **Modular modifiers** (ship, AI, research, environment all add bonuses)
- **Weighted outcome tables** (different results based on roll ranges)
- **Rich narrative generation** (converts rolls into story text)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DRE PIPELINE                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SEED INPUT                                               │
│     └─ Unique identifier for this action                    │
│                                                              │
│  2. DICE ROLLING                                             │
│     └─ Roll 2d6 or d20 using seeded RNG                     │
│                                                              │
│  3. MODIFIER COLLECTION                                      │
│     ├─ Ship components                                       │
│     ├─ AI crew bonuses                                       │
│     ├─ Research unlocks                                      │
│     ├─ Environment hazards                                   │
│     └─ Consequence penalties (wake, fatigue)                │
│                                                              │
│  4. TOTAL CALCULATION                                        │
│     └─ Base Roll + All Modifiers = Total                    │
│                                                              │
│  5. DIFFICULTY CHECK                                         │
│     └─ Compare Total vs Target DC                           │
│                                                              │
│  6. OUTCOME SELECTION                                        │
│     └─ Match total to outcome table range                   │
│                                                              │
│  7. SECONDARY ROLLS (if needed)                              │
│     ├─ Loot quality                                          │
│     ├─ Hazard type                                           │
│     └─ Composition/discovery                                │
│                                                              │
│  8. NARRATIVE GENERATION                                     │
│     └─ Convert numbers into story text                      │
│                                                              │
│  9. OUTCOME OBJECT                                           │
│     └─ Return structured result with all data               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 File Structure

```
src/lib/dre/
├── dice.js              # Core dice rolling functions (d6, d20, d100, notation parser)
├── tables.js            # Weighted outcome tables (loot, hazards, discoveries)
├── engine.js            # Main resolveAction() pipeline
├── poiActionTables.js   # POI-specific action definitions
├── narrative.js         # Outcome → narrative text conversion
├── output.js            # Terminal formatting and AI speech
├── preview.js           # Odds calculation (no actual rolling)
├── modifiers/
│   ├── index.js         # Modifier aggregation system
│   └── sources/
│       ├── ship.js      # Ship component bonuses
│       ├── ai.js        # AI crew bonuses
│       ├── research.js  # Tech tree bonuses
│       ├── skills.js    # Skill bonuses
│       ├── environment.js # Zone/radiation penalties
│       └── consequence.js # Wake/time pressure penalties
└── test.js              # Unit tests
```

---

## 🎯 Step-by-Step Execution

### **Example: Mining an Asteroid**

#### **1. SEED INPUT**
```javascript
const seed = `${shipState.id}-mining-${poiId}-${Date.now()}`;
// Result: "ship-alpha-mining-poi_belt_3-1732233456789"

// Why unique seeds?
// - Different seeds = different random outcomes
// - Same seed = EXACT same result (for testing/debugging)
// - Timestamp ensures no two actions ever have same seed
```

#### **2. DICE ROLLING**
```javascript
import { rollNotation } from './dice.js';
import { makeRng } from '../rng.js';

const rng = makeRng(seed, 'mining'); // Create seeded RNG
const roll = rollNotation("2d6", rng); // Roll 2 six-sided dice

console.log(roll);
// {
//   value: 8,           // Final result (4 + 4)
//   rolls: [4, 4],      // Individual die results
//   notation: "2d6"     // What was rolled
// }
```

**How Seeded RNG Works:**
```javascript
// Traditional random (NOT USED):
Math.random(); // Different every time
Math.random(); // Can't reproduce

// Seeded RNG (USED IN DRE):
const rng1 = makeRng("seed-123", "mining");
rng1(); // 0.6483719
rng1(); // 0.2847123
rng1(); // 0.9183847

const rng2 = makeRng("seed-123", "mining");
rng2(); // 0.6483719 (SAME!)
rng2(); // 0.2847123 (SAME!)
rng2(); // 0.9183847 (SAME!)
```

#### **3. MODIFIER COLLECTION**
```javascript
import { collectModifiers } from './modifiers/index.js';

const context = {
  shipState: {
    components: [
      { type: 'miningLaser', tier: 2 }, // +2 bonus
      { type: 'refineryModule', tier: 1 } // +1 bonus
    ],
    hull: 80,
    maxHull: 100
  },
  aiRoster: [
    { 
      role: 'engineer',    // +1 to mining
      tier: 2,             // Tier 2 = experienced
      docked: true,        // Must be aboard ship
      injured: false,      // Injured AI gives no bonus
      personality: 'methodical' // Bonus for certain action types
    }
  ],
  location: {
    radiation: 'moderate', // Penalty in high radiation
    zone: 'dark'          // Zone type affects modifiers
  },
  researchTree: {
    efficientMining: true  // +1 if researched
  },
  clusterType: 'Type-II',  // Composition bonus
  compositionBonus: 2      // +2 from cluster quality
};

const mods = collectModifiers('mining', context);

console.log(mods);
// {
//   ship: 3,           // miningLaser(2) + refineryModule(1)
//   ai: 1,             // Engineer role bonus
//   research: 1,       // Efficient mining tech
//   environment: 2,    // Type-II composition bonus
//   consequence: 0,    // No penalties
//   total: 7           // Sum of all modifiers
// }
```

**Modifier Priority:**
```javascript
// Each source is checked in order:
1. Ship Components      (highest priority)
2. AI Crew
3. Research Unlocks
4. Skills
5. Environment
6. Consequence          (lowest priority, often penalties)

// If same source gives multiple bonuses, they stack
// Example: Multiple engineers aboard = multiple bonuses
```

#### **4. TOTAL CALCULATION**
```javascript
const baseRoll = 8;      // From 2d6
const modifiers = 7;     // From collectModifiers()
const totalRoll = baseRoll + modifiers;

console.log(totalRoll);  // 15
```

#### **5. DIFFICULTY CHECK**
```javascript
import { DIFFICULTY_TDS } from './tables.js';

const difficulty = 'normal';
const targetDC = DIFFICULTY_TDS[difficulty];

console.log(DIFFICULTY_TDS);
// {
//   trivial: 0,     // Auto-success
//   easy: 3,
//   normal: 8,
//   hard: 12,
//   deadly: 16,
//   impossible: 20
// }

console.log(targetDC);    // 8 (normal difficulty)

const success = totalRoll >= targetDC;
console.log(success);     // true (15 >= 8)

const margin = totalRoll - targetDC;
console.log(margin);      // +7 (how much we beat the DC by)
```

#### **6. OUTCOME SELECTION**
```javascript
// Outcomes are in ranges - higher rolls = better results
const outcomeTable = [
  {
    range: [2, 5],        // Roll 2-5 = critical failure
    severity: "critical_failure",
    narrative: [
      "Mining laser overheats! Asteroid fragments damage hull.",
      "Unstable asteroid - structural collapse! Debris storm."
    ],
    effects: {
      damage: [
        { system: "mining_laser", amount: 15 },
        { type: "hull", amount: 10 }
      ],
      loot: []            // No loot on crit fail
    }
  },
  {
    range: [6, 8],        // Roll 6-8 = partial success
    severity: "partial_success",
    narrative: [
      "Modest mining yield. Collected {amount} tons of {oreType}.",
      "Difficult extraction. Retrieved some materials."
    ],
    effects: {
      loot: [
        { itemId: "scrap_metal", quantity: [2, 5], chance: 0.8 }
      ]
    }
  },
  {
    range: [9, 11],       // Roll 9-11 = success
    severity: "success",
    narrative: [
      "Mining operation complete. Extracted {oreType} successfully.",
      "Good yield from asteroid. {amount} tons secured."
    ],
    effects: {
      loot: [
        { itemId: "iron_ore", quantity: [5, 10], chance: 1.0 },
        { itemId: "rare_ore", quantity: [2, 5], chance: 0.6 }
      ]
    }
  },
  {
    range: [12, 14],      // Roll 12-14 = critical success
    severity: "critical_success",
    narrative: [
      "Motherlode! Asteroid contains massive {exoticResource} deposit!",
      "Exceptional mining operation! Discovered {rarity}!"
    ],
    effects: {
      loot: [
        { itemId: "exotic_ore", quantity: [3, 6], chance: 0.9 },
        { itemId: "platinum_ore", quantity: [5, 10], chance: 1.0 },
        { itemId: "crystal_shard", quantity: [3, 5], chance: 0.8 }
      ],
      science: 100        // Science points bonus
    }
  }
];

// Our roll was 15, so we check which range it falls into
function determineOutcome(totalRoll, table) {
  for (const outcome of table) {
    const [min, max] = outcome.range;
    if (totalRoll >= min && totalRoll <= max) {
      return outcome;
    }
  }
  // If roll exceeds all ranges, use best outcome
  return table[table.length - 1];
}

const outcome = determineOutcome(15, outcomeTable);
console.log(outcome.severity); // "critical_success" (15 is in [12, 14] range)
```

#### **7. SECONDARY ROLLS**
```javascript
// After determining base outcome, roll for specifics

// A. Asteroid Composition
const compositionRoll = rollNotation("1d100", rng);
const composition = selectFromTable(ASTEROID_COMPOSITION, rng);

// ASTEROID_COMPOSITION table (weighted)
const ASTEROID_COMPOSITION = [
  { 
    composition: 'Ferrous',     // Common
    weight: 45,                 // 45% chance
    yieldMultiplier: 1.0,
    lootTable: 'metals'
  },
  { 
    composition: 'Metallic',    // Uncommon
    weight: 30,                 // 30% chance
    yieldMultiplier: 1.5,
    lootTable: 'metals'
  },
  { 
    composition: 'Rare',        // Rare
    weight: 15,                 // 15% chance
    yieldMultiplier: 2.0,
    lootTable: 'rare'
  },
  { 
    composition: 'Crystalline', // Very rare
    weight: 8,                  // 8% chance
    yieldMultiplier: 3.0,
    lootTable: 'exotic'
  },
  { 
    composition: 'Xenotech',    // Ultra rare
    weight: 2,                  // 2% chance
    yieldMultiplier: 5.0,
    lootTable: 'xenotech',
    requiresBonus: 4            // Need +4 composition bonus
  }
];

console.log(composition);
// {
//   composition: 'Metallic',
//   yieldMultiplier: 1.5,
//   lootTable: 'metals'
// }

// B. Loot Generation
const lootTable = ASTEROID_LOOT_TABLES[composition.lootTable];

const loot = [];
for (const entry of outcome.effects.loot) {
  const chanceRoll = rng(); // 0.0 - 1.0
  if (chanceRoll <= entry.chance) {
    const quantity = rollBetween(entry.quantity[0], entry.quantity[1], rng);
    const finalQuantity = Math.floor(quantity * composition.yieldMultiplier);
    
    loot.push({
      itemId: entry.itemId,
      name: getItemName(entry.itemId),
      quantity: finalQuantity,
      category: getItemCategory(entry.itemId)
    });
  }
}

console.log(loot);
// [
//   { itemId: 'exotic_ore', name: 'Exotic Ore', quantity: 6, category: 'rare' },
//   { itemId: 'platinum_ore', name: 'Platinum Ore', quantity: 12, category: 'rare' },
//   { itemId: 'crystal_shard', name: 'Crystal Shard', quantity: 5, category: 'exotic' }
// ]
// Note: Quantities boosted by 1.5x multiplier from Metallic composition
```

#### **8. NARRATIVE GENERATION**
```javascript
// Pick random narrative template
const narrativeTemplates = outcome.narrative;
const template = pick(narrativeTemplates, rng);

console.log(template);
// "Exceptional mining operation! Discovered {rarity}!"

// Replace placeholders with actual values
function fillTemplate(template, data) {
  return template.replace(/{(\w+)}/g, (match, key) => {
    if (Array.isArray(data[key])) {
      return pick(data[key], rng); // Random choice from array
    }
    return data[key] || match;
  });
}

const narrative = fillTemplate(template, {
  rarity: ['iridium vein', 'crystallized exotic matter', 'precursor alloy'],
  exoticResource: 'iridium vein',
  amount: [30, 50]
});

console.log(narrative);
// "Exceptional mining operation! Discovered crystallized exotic matter!"
```

#### **9. OUTCOME OBJECT**
```javascript
// Final result returned to game
const result = {
  actionType: 'mining',
  result: 'success',              // crit_success, success, partial, fail, crit_fail
  totalRoll: 15,
  targetDifficulty: 8,
  margin: 7,                      // How much we beat DC by
  
  rollLog: {
    baseRoll: { value: 8, rolls: [4, 4], notation: '2d6' },
    modifiers: {
      ship: 3,
      ai: 1,
      research: 1,
      environment: 2,
      total: 7
    }
  },
  
  composition: 'Metallic',
  yieldMultiplier: 1.5,
  
  loot: [
    { itemId: 'exotic_ore', name: 'Exotic Ore', quantity: 6, category: 'rare' },
    { itemId: 'platinum_ore', name: 'Platinum Ore', quantity: 12, category: 'rare' },
    { itemId: 'crystal_shard', name: 'Crystal Shard', quantity: 5, category: 'exotic' }
  ],
  
  consequences: {
    damageTaken: 0,
    lootGained: 3,
    statusEffects: [],
    sciencePoints: 100,
    wakeAdded: 0.05
  },
  
  narrative: [
    "Exceptional mining operation! Discovered crystallized exotic matter!",
    "Perfect extraction. Metallic composition detected with 1.5x yield bonus."
  ],
  
  meta: {
    seed: 'ship-alpha-mining-poi_belt_3-1732233456789',
    timestamp: 1732233456789
  }
};

return result;
```

---

## 🔧 Modifier System Deep Dive

### **Ship Component Modifiers** (`modifiers/sources/ship.js`)
```javascript
export function getShipModifiers(actionType, context) {
  const { shipState } = context;
  let total = 0;
  
  // Check each component
  for (const component of shipState.components || []) {
    // Mining laser helps with mining
    if (actionType === 'mining' && component.type === 'miningLaser') {
      total += component.tier; // Tier 1 = +1, Tier 2 = +2, etc.
    }
    
    // Sensors help with scanning
    if (actionType === 'scan' && component.type === 'sensors') {
      total += component.tier;
    }
    
    // Deep scanner helps with surface scans
    if (actionType === 'surface_scan' && component.type === 'deepScanner') {
      total += component.tier * 2; // Double bonus
    }
    
    // Weapons help in combat
    if (actionType === 'combatAttack' && component.type === 'laser') {
      total += component.tier + 1; // Tier + 1
    }
  }
  
  return total;
}
```

### **AI Crew Modifiers** (`modifiers/sources/ai.js`)
```javascript
export function getAIModifiers(actionType, context) {
  const { aiRoster } = context;
  let total = 0;
  
  for (const ai of aiRoster || []) {
    // Skip if not docked or injured
    if (!ai.docked || ai.injured) continue;
    
    // Role-based bonuses
    if (actionType === 'mining' && ai.role === 'engineer') {
      total += 1;
    }
    
    if (actionType === 'scan' && ai.role === 'scientist') {
      total += 2; // Scientists better at scanning
    }
    
    if (actionType === 'combatAttack' && ai.role === 'tactical') {
      total += ai.tier; // Tactical AI bonus scales with tier
    }
    
    // Personality modifiers
    if (ai.personality === 'cautious') {
      total += 1; // Cautious AI helps avoid failures
    }
    
    if (ai.personality === 'reckless' && actionType === 'combatAttack') {
      total += 2; // Reckless helps in combat
    }
  }
  
  return total;
}
```

### **Research Modifiers** (`modifiers/sources/research.js`)
```javascript
export function getResearchModifiers(actionType, context) {
  const { researchTree } = context;
  let total = 0;
  
  if (!researchTree) return 0;
  
  // Research unlocks
  if (actionType === 'mining' && researchTree.efficientMining) {
    total += 1;
  }
  
  if (actionType === 'scan' && researchTree.advancedScanning) {
    total += 2;
  }
  
  if (researchTree.xenoarchaeology && actionType === 'derelict') {
    total += 3;
  }
  
  return total;
}
```

### **Environment Modifiers** (`modifiers/sources/environment.js`)
```javascript
export function getEnvironmentModifiers(actionType, context) {
  const { location, clusterType, compositionBonus } = context;
  let total = 0;
  
  // Radiation penalties
  if (location?.radiation === 'high') {
    total -= 2; // Penalty in high radiation
  } else if (location?.radiation === 'extreme') {
    total -= 4;
  }
  
  // Zone effects
  if (location?.zone === 'dark') {
    total -= 1; // Dark zone penalty
  } else if (location?.zone === 'static') {
    total -= 3; // Static zone major penalty
  }
  
  // Cluster quality bonus (mining only)
  if (actionType === 'mining' && compositionBonus) {
    total += compositionBonus; // Type-II = +2, Type-III = +3, etc.
  }
  
  return total;
}
```

### **Consequence Modifiers** (`modifiers/sources/consequence.js`)
```javascript
export function getConsequenceModifiers(actionType, context) {
  const { wake, timeElapsed, fatigue } = context;
  let total = 0;
  
  // Wake penalty (attracts attention)
  if (wake > 0.5) {
    total -= 1;
  }
  if (wake > 0.8) {
    total -= 2;
  }
  
  // Time pressure
  if (timeElapsed > 10) {
    total -= 1; // Rushed = penalty
  }
  
  // Crew fatigue
  if (fatigue > 50) {
    total -= 1;
  }
  if (fatigue > 80) {
    total -= 3;
  }
  
  return total;
}
```

---

## 📊 Weighted Table System

### **How selectFromTable() Works**
```javascript
export function selectFromTable(table, rng) {
  // Calculate total weight
  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  
  // Roll random number 0 to totalWeight
  const roll = rng() * totalWeight;
  
  // Find which entry the roll lands in
  let cumulative = 0;
  for (const entry of table) {
    cumulative += entry.weight;
    if (roll < cumulative) {
      return entry;
    }
  }
  
  // Fallback (shouldn't happen)
  return table[table.length - 1];
}
```

### **Example: Cluster Type Selection**
```javascript
const CLUSTER_TYPE_CLASSIFICATION = [
  { 
    type: 'Type-I',           // Common, low yield
    weight: 40,               // 40% chance
    densityRange: [3, 8],
    compositionBonus: 0,
    miningRate: 8
  },
  { 
    type: 'Type-II',          // Uncommon, good yield
    weight: 30,               // 30% chance
    densityRange: [5, 12],
    compositionBonus: 2,
    miningRate: 10
  },
  { 
    type: 'Type-III',         // Rare, high yield
    weight: 20,               // 20% chance
    densityRange: [8, 15],
    compositionBonus: 3,
    miningRate: 12
  },
  { 
    type: 'Type-IV',          // Very rare, very high yield
    weight: 9,                // 9% chance
    densityRange: [3, 6],
    compositionBonus: 4,
    miningRate: 15
  },
  { 
    type: 'Type-V',           // Ultra rare, xenotech
    weight: 1,                // 1% chance
    densityRange: [1, 3],
    compositionBonus: 6,
    miningRate: 18,
    darkZoneOnly: true        // Only in dark zones
  }
];

// Total weight = 40 + 30 + 20 + 9 + 1 = 100
// Roll: 0.652 * 100 = 65.2
// Cumulative: 40 (no), 70 (YES!) → Type-II selected
```

---

## 🧪 Determinism & Testing

### **Why Determinism Matters**
```javascript
// PROBLEM: Random results can't be debugged
const result1 = mineAsteroid(); // Got 15 iron ore
const result2 = mineAsteroid(); // Got 3 platinum ore ???
// Can't reproduce bugs!

// SOLUTION: Seeded RNG
const seed = 'test-seed-123';
const result1 = mineAsteroid(seed); // Got 15 iron ore
const result2 = mineAsteroid(seed); // Got 15 iron ore (SAME!)
// Bugs are reproducible!
```

### **Testing Example**
```javascript
import { executeAsteroidMine } from './engine.js';

describe('DRE Mining', () => {
  it('should be deterministic', () => {
    const context = {
      clusterType: 'Type-II',
      compositionBonus: 2,
      difficulty: 'normal'
    };
    
    const seed = 'test-seed-mining-1';
    
    const result1 = executeAsteroidMine(context, seed);
    const result2 = executeAsteroidMine(context, seed);
    
    expect(result1.totalRoll).toBe(result2.totalRoll);
    expect(result1.loot).toEqual(result2.loot);
    expect(result1.composition).toBe(result2.composition);
  });
  
  it('should apply modifiers correctly', () => {
    const baseContext = {
      difficulty: 'normal',
      shipState: { components: [] }
    };
    
    const modContext = {
      difficulty: 'normal',
      shipState: {
        components: [{ type: 'miningLaser', tier: 2 }]
      }
    };
    
    const seed = 'test-seed-mod';
    
    const baseResult = executeAsteroidMine(baseContext, seed);
    const modResult = executeAsteroidMine(modContext, seed);
    
    // Same base roll, but modified result should be +2 higher
    expect(modResult.totalRoll).toBe(baseResult.totalRoll + 2);
  });
});
```

---

## 🎮 Integration with Game

### **From UI to DRE and Back**
```javascript
// 1. USER CLICKS "MINE ASTEROID" BUTTON
onClick={() => startMining(poiId)}

// 2. GAME PREPARES CONTEXT
const completeMining = (poiId, cluster) => {
  const context = {
    clusterType: cluster.type,
    compositionBonus: cluster.compositionBonus,
    difficulty: 'normal',
    shipState: shipState.getState(),
    aiRoster: getAIRoster(),
    location: { radiation: 'low', zone: 'quiet' },
    researchTree: getResearchTree()
  };
  
  // 3. GENERATE UNIQUE SEED
  const seed = `${shipState.id}-mine-${poiId}-${Date.now()}`;
  
  // 4. CALL DRE
  const result = executeAsteroidMine(context, seed);
  
  // 5. PROCESS RESULT
  if (result.result === 'success') {
    // Add loot to inventory
    result.loot.forEach(item => {
      inventoryManager.addItem(item.itemId, item.quantity);
    });
    
    // Decrement asteroid count
    shipState.mineClusterAsteroid(cluster.id);
    
    // Display success message
    setTerminalEvents(prev => [...prev, {
      type: 'mining',
      conversational: result.narrative,
      stream: [
        `> MINING COMPLETE`,
        `> Composition: ${result.composition}`,
        `> Yield: ${result.yieldMultiplier}x`,
        ...result.loot.map(l => `> ${l.quantity}x ${l.name}`)
      ]
    }]);
  } else {
    // Handle failure
    setTerminalEvents(prev => [...prev, {
      type: 'mining',
      conversational: ["Mining operation failed."],
      stream: [`> FAILURE - Roll: ${result.totalRoll} vs DC ${result.targetDifficulty}`]
    }]);
  }
};
```

---

## 🔮 Advanced Features

### **Odds Preview (No Rolling)**
```javascript
import { previewOdds } from './preview.js';

// Show player their chances BEFORE committing
const odds = previewOdds('mining', context);

console.log(odds);
// {
//   probabilities: {
//     critSuccess: 15,   // 15% chance
//     success: 55,       // 55% chance
//     fail: 25,          // 25% chance
//     critFail: 5        // 5% chance
//   },
//   summary: "Likely (70%) [+4]",
//   modifierTotal: 4,
//   averageOutcome: "success"
// }

// Display to player
UI.showActionConfirm({
  action: "Mine Asteroid",
  odds: odds.summary,
  details: `Success: ${odds.probabilities.success}%, Critical: ${odds.probabilities.critSuccess}%`
});
```

### **Multiple Outcomes (Combat)**
```javascript
// Combat uses multiple DRE calls per turn

// Turn 1: Initiative
const init = resolveAction('combatInitiate', { enemy, shipState }, seed);

// Turn 2: Attack
const attack = resolveAction('combatAttack', {
  shipState,
  weapon: { type: 'laser', tier: 2 },
  target: enemy
}, `${seed}-attack-1`);

// Apply damage
enemy.hull -= attack.consequences.enemyDamage;

// Turn 3: Enemy attacks
const enemyAttack = resolveAction('combatAttack', {
  shipState: enemy,
  target: playerShip
}, `${seed}-enemy-1`);

playerShip.hull -= enemyAttack.consequences.enemyDamage;
```

### **Cascading Consequences**
```javascript
// Action outcomes can trigger follow-up actions

const scanResult = resolvePOIAction('surface_scan', context);

if (scanResult.consequences.discoveredRuins) {
  // Discovery triggers new action
  const exploreResult = resolveAction('awayTeam', {
    ...context,
    location: scanResult.consequences.ruinsLocation
  }, `${seed}-explore`);
  
  if (exploreResult.result === 'crit_success') {
    // Critical triggers ANOTHER action
    const artifactResult = resolveAction('artifactAnalysis', {
      ...context,
      artifact: exploreResult.consequences.artifact
    }, `${seed}-artifact`);
  }
}
```

---

## 📝 Summary

### **DRE in One Sentence:**
The DRE takes a **seeded random number**, adds **modifiers from ship/AI/environment**, rolls **dice**, compares to **difficulty**, picks an **outcome from a table**, generates **loot/narrative**, and returns a **structured result object**.

### **Key Principles:**
1. **Deterministic** - Same input = same output
2. **Modular** - Modifiers come from 6 independent sources
3. **Weighted** - Outcomes use probability tables
4. **Rich** - Results include narrative text, not just numbers
5. **Testable** - Seeded RNG makes bugs reproducible

### **When to Use DRE:**
- ✅ Any action with chance/risk
- ✅ Mining, scanning, combat, scavenging
- ✅ Mission completion rewards
- ✅ Away team encounters
- ✅ Dialogue checks (future)

### **When NOT to Use DRE:**
- ❌ Guaranteed outcomes (no randomness)
- ❌ UI interactions (buttons, menus)
- ❌ Passive state updates (time passage)
- ❌ Deterministic calculations (distance, fuel cost)

---

**The DRE is the heart of The Surge's chance-based gameplay** - every risk, every reward, every "what happens next?" moment flows through this engine. 🎲🚀
