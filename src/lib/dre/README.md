# Dice Resolution Engine (DRE)

## Overview

The Dice Resolution Engine is a comprehensive, deterministic system for resolving all chance-based actions in the game. It uses D20-based mechanics with modular modifiers from ship components, AI crew, research, environment, and more.

## Quick Start

```javascript
import { resolveAction } from './lib/dre/engine.js';
import { previewOdds } from './lib/dre/preview.js';
import { emitToTerminal } from './lib/dre/output.js';

// Preview odds before action
const odds = previewOdds('mining', {
  shipState: getShipState(),
  aiRoster: getAIRoster(),
  location: currentSystem,
  difficulty: 'normal'
});

console.log(odds.summary); // "Likely (68%) [+3]"

// Resolve action
const outcome = resolveAction('mining', {
  shipState: getShipState(),
  aiRoster: getAIRoster(),
  location: currentSystem,
  difficulty: 'normal'
}, 'unique-seed-12345');

// Format for terminal
const output = emitToTerminal(outcome);
console.log(output.narrative);
```

## Action Types

### Exploration Actions
- **mining** - Extract resources from asteroids
- **scavenging** - Loot containers and debris
- **derelict** - Investigate abandoned structures
- **awayTeam** - Send AI crew on surface missions

### Combat Actions
- **combatInitiate** - Initiative roll
- **combatAttack** - Attack enemy
- **combatFlee** - Escape from combat
- **combatRepair** - Emergency repairs mid-combat

### Mission Actions
- **missionCompletion** - Resolve mission rewards

## Context Object

Every action requires a context object with relevant data:

```javascript
const context = {
  // Ship data
  shipState: {
    components: [
      { type: 'miningLaser', tier: 2 },
      { type: 'scanner', tier: 1 }
    ],
    hull: 80,
    maxHull: 100
  },
  
  // AI crew
  aiRoster: [
    { role: 'engineer', tier: 2, docked: true, injured: false, personality: 'cautious' }
  ],
  
  // Environment
  location: {
    radiation: 'high',
    zone: 'static',
    stability: 'unstable'
  },
  
  // Research unlocks
  researchTree: {
    efficientMining: true,
    advancedScanning: false
  },
  
  // Difficulty
  difficulty: 'normal', // trivial, easy, normal, hard, deadly, impossible
  
  // Consequence modifiers
  wake: 0.6,
  timeElapsed: 8,
  fatigue: 45
};
```

## Outcome Object

All actions return a standardized outcome:

```javascript
{
  actionType: 'mining',
  result: 'success', // crit_success, success, fail, crit_fail
  totalRoll: 17,
  targetDifficulty: 15,
  margin: 2,
  modifierBreakdown: {
    ship: +3,
    ai: +1,
    environment: -2
  },
  secondaryRolls: {
    hazard: { value: 9, outcome: { damage: 15, label: 'Moderate Impact' } },
    yield: { quality: 'good', multiplier: 1.5 }
  },
  consequences: {
    damageTaken: 15,
    lootGained: [{ item: 'Titanium Alloy', quality: 'Good Quality' }],
    statusEffects: [],
    wakeAdded: 0.15,
    aiImpact: { morale: 1 }
  }
}
```

## Modifier System

### Modifier Sources

The DRE collects modifiers from 6 sources (in priority order):

1. **Ship Components** - Lasers, scanners, engines, weapons
2. **AI Crew** - Role bonuses, personality effects
3. **Research** - Unlocked technologies
4. **Skills** - Player/crew skills (future expansion)
5. **Environment** - Radiation, zones, hazards
6. **Consequence** - Wake, time pressure, fatigue

### Adding Custom Modifiers

```javascript
import { registerModifierSource } from './lib/dre/modifiers/index.js';

function getCustomModifiers(actionType, context) {
  // Your custom logic here
  return context.specialBonus || 0;
}

registerModifierSource('custom', getCustomModifiers, 7);
```

## Combat System

Combat uses multiple DRE calls per turn:

```javascript
// Turn 1: Initiative
const init = resolveAction('combatInitiate', { enemy, shipState, aiRoster }, seed);

// Turn 2: Player attacks
const attack = resolveAction('combatAttack', {
  shipState,
  aiRoster,
  weapon: { type: 'laser', tier: 2 },
  target: enemy,
  range: 'medium'
}, `${seed}-attack-1`);

// Apply damage
enemy.hull -= attack.consequences.enemyDamage;

// Enemy turn
const enemyAttack = resolveAction('combatAttack', {
  shipState: enemy,
  weapon: enemy.weapons[0],
  target: playerShip
}, `${seed}-enemy-1`);
```

## Mission Rewards

Missions combine hard-coded baseline rewards with DRE multipliers:

```javascript
const mission = {
  id: 'salvage-op-7',
  tier: 'highRisk', // standard, highRisk, story
  difficulty: 'hard',
  baseLoot: [
    { item: 'Fuel Cell', quantity: 3 },
    { item: 'Scrap Metal', quantity: 10 }
  ],
  bonusPool: ['Rare Component', 'AI Core Fragment'],
  duration: 2.5
};

const outcome = resolveAction('missionCompletion', {
  mission,
  shipState,
  aiRoster,
  location
}, seed);

// Loot is multiplied by outcome
// Success: 1.0x, Partial: 0.6x, Fail: 0.2x, etc.
```

## Odds Preview

Show players success probability before committing:

```javascript
const odds = previewOdds('scavenging', context);

console.log(odds.probabilities);
// { critSuccess: 5, success: 60, fail: 30, critFail: 5 }

console.log(odds.summary);
// "Likely (65%) [+4]"

// Compare different loadouts
const comparison = compareOdds('mining', [
  { label: 'Current Setup', shipState: currentShip, ... },
  { label: 'With Mk3 Laser', shipState: upgradedShip, ... }
]);
```

## Terminal Integration

```javascript
const outcome = resolveAction('scavenging', context, seed);
const output = emitToTerminal(outcome, context, {
  showModifiers: true,
  showRolls: true,
  showAIAnalysis: true,
  animated: true
});

// Output has sections for display
output.sections.forEach(section => {
  console.log(`[${section.type}] ${section.content}`);
});

// AI speech ready for synthesis
console.log(output.aiSpeech);
// "Salvage recovered. Quality is acceptable."

// Animation data for dice roll visual
if (output.animation) {
  animateDiceRoll(output.animation);
}
```

## Deterministic Seeding

Same seed = same outcome (crucial for replays, debugging):

```javascript
const seed1 = 'mission-42-action-1';
const outcome1 = resolveAction('mining', context, seed1);
const outcome2 = resolveAction('mining', context, seed1);

// outcome1 === outcome2 (exact same rolls)
```

Use unique seeds per action:
```javascript
const baseSeed = shipState.seed;
const actionSeed = `${baseSeed}-${actionType}-${Date.now()}`;
```

## Tables & Customization

All weighted tables are in `tables.js`:

```javascript
export const MINING_YIELD_QUALITY = [
  { value: 'poor', weight: 20, multiplier: 0.5 },
  { value: 'standard', weight: 50, multiplier: 1.0 },
  { value: 'excellent', weight: 8, multiplier: 2.0 }
];
```

Customize by importing and modifying:

```javascript
import { MINING_YIELD_QUALITY } from './lib/dre/tables.js';

// Boost excellent quality chance
MINING_YIELD_QUALITY.find(q => q.value === 'excellent').weight = 15;
```

## Testing

```javascript
import { resolveAction } from './lib/dre/engine.js';

// Test determinism
const seed = 'test-seed-1';
const context = { /* ... */ };

const result1 = resolveAction('mining', context, seed);
const result2 = resolveAction('mining', context, seed);

console.assert(result1.totalRoll === result2.totalRoll, 'Not deterministic!');

// Test modifier stacking
const noModContext = { shipState: { components: [] }, aiRoster: [], location: {} };
const withModContext = { 
  shipState: { components: [{ type: 'miningLaser', tier: 3 }] },
  aiRoster: [{ role: 'engineer', docked: true }],
  location: {}
};

const noMod = resolveAction('mining', noModContext, 'seed1');
const withMod = resolveAction('mining', withModContext, 'seed1');

console.log('Base roll:', noMod.totalRoll);
console.log('With mods:', withMod.totalRoll);
console.log('Modifier breakdown:', withMod.modifierBreakdown);
```

## File Structure

```
src/lib/dre/
├── dice.js              # Core dice rolling functions
├── tables.js            # Weighted outcome tables
├── engine.js            # Main resolveAction() pipeline
├── preview.js           # Odds calculation (no rolling)
├── narrative.js         # Outcome → narrative text
├── output.js            # Terminal formatting
├── modifiers/
│   ├── index.js         # Modifier aggregation
│   └── sources/
│       ├── ship.js      # Ship component modifiers
│       ├── ai.js        # AI crew modifiers
│       ├── research.js  # Research tree modifiers
│       ├── skills.js    # Skill modifiers
│       ├── environment.js # Zone/radiation modifiers
│       └── consequence.js # Wake/fatigue modifiers
└── README.md            # This file
```

## Future Expansion

- Add new action types by extending `engine.js`
- Add modifier sources via `registerModifierSource()`
- Customize tables in `tables.js`
- Extend narrative templates in `narrative.js`
- Add AI personality voices in `output.js`

## Best Practices

1. **Always use unique seeds** - Include timestamp or action counter
2. **Preview odds for player** - Show success chance before risky actions
3. **Log outcomes** - Keep history for player review
4. **Respect modifiers** - Don't bypass the modifier system
5. **Test determinism** - Verify same seed = same outcome

---

Built with ❤️ for **The Surge**
