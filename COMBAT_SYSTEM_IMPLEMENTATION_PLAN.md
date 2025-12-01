# Combat System Implementation Plan
## Distance Band System + AI Combat + Turn Manager

---

## Phase 1: Distance Band System Core

### 1.1 Distance Band Constants & Utilities
**File:** `src/lib/combat/distanceBands.js`

```javascript
// Distance band definitions
DISTANCE_BANDS = {
  POINT_BLANK: { min: 0, max: 50, name: 'Point Blank' },
  CLOSE: { min: 51, max: 150, name: 'Close' },
  MEDIUM: { min: 151, max: 300, name: 'Medium' },
  LONG: { min: 301, max: 600, name: 'Long' },
  EXTREME: { min: 601, max: 1000, name: 'Extreme' }
}

// Functions:
- getDistanceBand(distance) → returns band object
- getMovementCost(currentBand, targetBand, shipSpeed) → movement points
- canReachBand(currentDistance, movementRemaining, targetBand) → boolean
- getWeaponRangeModifier(weapon, distanceBand) → attack bonus/penalty
```

**Tasks:**
- [ ] Create distance band enum
- [ ] Implement band detection function
- [ ] Calculate movement costs between bands
- [ ] Weapon range modifier lookup table

---

### 1.2 Combat Positioning State
**File:** `src/lib/combat/combatPositioning.js`

```javascript
// Tracks relative positions between all combatants
class CombatPositioning {
  constructor() {
    this.distances = new Map(); // Map<shipPairId, distance>
    this.facings = new Map();   // Map<shipId, facing> (for Phase 2)
  }

  // Core methods:
  getDistance(ship1Id, ship2Id) → number
  setDistance(ship1Id, ship2Id, distance)
  getDistanceBand(ship1Id, ship2Id) → DISTANCE_BAND
  
  // Movement:
  moveCloser(shipId, targetId, movementPoints) → newDistance
  moveFarther(shipId, targetId, movementPoints) → newDistance
  
  // Multi-ship support:
  getAllDistancesFrom(shipId) → Map<targetId, distance>
  getClosestEnemy(shipId, enemyIds) → { id, distance, band }
}
```

**Tasks:**
- [ ] Create positioning tracker class
- [ ] Implement distance storage/retrieval
- [ ] Add movement calculation methods
- [ ] Multi-target distance tracking

---

### 1.3 Update ShipManager with Distance-Aware Combat
**File:** `src/lib/ShipManager.js` (modify existing)

**Add to `rollAttack()` method:**
```javascript
rollAttack(targetSR, weapon, distance = 150) {
  // Get distance band
  const band = getDistanceBand(distance);
  
  // Get weapon's range modifier for this band
  const rangeModifier = getWeaponRangeModifier(weapon, band);
  
  // Check if weapon can fire at this range
  if (rangeModifier === null) {
    return { hit: false, result: 'OUT_OF_RANGE' };
  }
  
  // Apply range modifier to attack roll
  const total = roll + totalBonus + rangeModifier;
  // ... rest of attack logic
}
```

**Add to weapon attributes in `shipComponents.js`:**
```javascript
attributes: {
  damage: '3d8',
  rangeModifiers: {
    POINT_BLANK: 2,   // +2 at point blank
    CLOSE: 0,         // optimal
    MEDIUM: 0,        // optimal
    LONG: -4,         // penalty
    EXTREME: null     // cannot fire
  }
}
```

**Tasks:**
- [ ] Add `rangeModifiers` to all weapons
- [ ] Update `rollAttack()` to use distance bands
- [ ] Add range validation
- [ ] Update weapon definitions in components

---

## Phase 2: Turn Manager & Action Economy

### 2.1 Combat State Manager
**File:** `src/lib/combat/CombatStateManager.js`

```javascript
class CombatStateManager {
  constructor() {
    this.combatants = [];           // Array of ship instances
    this.initiativeOrder = [];      // Sorted by initiative roll
    this.currentTurnIndex = 0;
    this.roundNumber = 1;
    this.phase = 'MOVEMENT';        // MOVEMENT, ACTION, BONUS_ACTION, END_TURN
    this.actionQueue = [];          // Pending actions/reactions
    this.positioning = new CombatPositioning();
  }

  // Combat flow:
  startCombat(ships) → rolls initiative, sorts order
  getCurrentShip() → shipId
  advanceTurn() → moves to next ship
  advanceRound() → starts new round
  
  // Action tracking:
  spendAction(shipId, actionType) → boolean (success/fail)
  getActionsRemaining(shipId) → { actions, bonusActions, reactions, movement }
  resetActionsForTurn(shipId)
  
  // Reaction windows:
  openReactionWindow(triggeringAction, allowedReactors) → Promise
  closeReactionWindow()
  queueReaction(shipId, reactionType, target)
  resolveReactions() → array of reaction results
}
```

**Tasks:**
- [ ] Create combat state class
- [ ] Implement initiative rolling & sorting
- [ ] Track action economy per ship
- [ ] Build reaction queue system
- [ ] Phase management (movement → action → bonus → end)

---

### 2.2 Combat Action Definitions
**File:** `src/lib/combat/combatActions.js`

```javascript
// Action type definitions
ACTION_TYPES = {
  // MAIN ACTIONS (cost: 1 action)
  FIRE_WEAPON: {
    cost: { actions: 1 },
    requiresTarget: true,
    allowsReactions: ['POINT_DEFENSE', 'EMERGENCY_BURN'],
    execute: (actor, target, weapon) => { ... }
  },
  
  EVASIVE_MANEUVERS: {
    cost: { actions: 1 },
    requiresTarget: false,
    allowsReactions: [],
    execute: (actor) => {
      // Grant +4 evasion until next turn
      actor.addStatusEffect('EVASIVE', { evasionBonus: 4, duration: 1 });
    }
  },
  
  CHANGE_DISTANCE: {
    cost: { movement: 'varies' },
    requiresTarget: true,
    allowsReactions: ['OPPORTUNITY_ATTACK'],
    execute: (actor, target, direction) => { ... }
  },
  
  // BONUS ACTIONS
  BOOST_SHIELDS: {
    cost: { bonusActions: 1 },
    requiresTarget: false,
    allowsReactions: [],
    execute: (actor) => {
      actor.addStatusEffect('SHIELD_BOOST', { tempShields: 20, duration: 2 });
    }
  },
  
  // REACTIONS
  POINT_DEFENSE: {
    cost: { reactions: 1 },
    trigger: 'INCOMING_ATTACK',
    requiresComponent: 'POINT_DEFENSE_TURRET',
    execute: (actor, incomingAttack) => { ... }
  }
}
```

**Tasks:**
- [ ] Define all action types
- [ ] Implement action execution functions
- [ ] Add action validation (requirements, costs)
- [ ] Reaction trigger mapping

---

## Phase 3: AI Combat System

### 3.1 AI Personality Traits
**File:** `src/lib/combat/ai/AIPersonality.js`

```javascript
// Personality archetypes
PERSONALITY_TRAITS = {
  AGGRESSIVE: {
    name: 'Aggressive',
    weights: {
      attack: 1.5,         // 50% more likely to attack
      retreat: 0.3,        // 70% less likely to flee
      closeDistance: 1.4,  // Prefers close combat
      negotiate: 0.2       // Rarely negotiates
    },
    thresholds: {
      retreatHP: 15,       // Only retreats below 15% HP
      engageDistance: 'CLOSE'
    }
  },
  
  CAUTIOUS: {
    name: 'Cautious',
    weights: {
      attack: 0.8,
      retreat: 1.3,
      closeDistance: 0.6,
      keepDistance: 1.4,   // Prefers long range
      negotiate: 1.2
    },
    thresholds: {
      retreatHP: 40,       // Retreats at 40% HP
      engageDistance: 'LONG'
    }
  },
  
  TACTICAL: {
    name: 'Tactical',
    weights: {
      attack: 1.0,
      retreat: 1.0,
      optimalRange: 1.8,   // Strongly prefers weapon optimal range
      scanEnemy: 1.5,      // Scans before engaging
      negotiate: 0.9
    }
  },
  
  BERSERKER: {
    name: 'Berserker',
    weights: {
      attack: 2.0,         // Highly aggressive
      retreat: 0.1,        // Almost never retreats
      closeDistance: 2.0,  // Rushes to point blank
      reckless: 1.5        // Ignores damage, all-in attacks
    },
    thresholds: {
      retreatHP: 5,        // Fights to the death
      engageDistance: 'POINT_BLANK'
    }
  },
  
  PARANOID: {
    name: 'Paranoid',
    weights: {
      attack: 0.7,
      retreat: 1.8,        // Very likely to flee
      keepDistance: 1.6,
      scan: 1.4,           // Constantly scanning
      negotiate: 0.5       // Distrusts negotiations
    },
    thresholds: {
      retreatHP: 60,       // Retreats early
      engageDistance: 'EXTREME'
    }
  },
  
  TRADER: {
    name: 'Trader/Neutral',
    weights: {
      attack: 0.3,         // Rarely initiates combat
      retreat: 1.5,
      negotiate: 2.0,      // Strongly prefers talking
      flee: 1.8
    },
    thresholds: {
      retreatHP: 70,       // Flees at first sign of danger
      willFightBack: false // Won't fight unless cornered
    }
  }
}
```

**Tasks:**
- [ ] Define personality trait system
- [ ] Create personality weight modifiers
- [ ] Add retreat thresholds
- [ ] Implement behavior flags

---

### 3.2 Veteran System (Difficulty Scaling)
**File:** `src/lib/combat/ai/VeteranSystem.js`

```javascript
// Veteran ranks (difficulty scaling)
VETERAN_RANKS = {
  ROOKIE: {
    rank: 0,
    displayName: 'Rookie',
    statBonuses: {
      initiative: 0,
      attackBonus: -2,
      evasion: -1,
      critRange: 20      // Only crits on natural 20
    },
    aiQuality: {
      mistakeChance: 0.25,      // 25% chance of suboptimal decision
      reactionSpeed: 0.7,       // 70% reaction speed
      targetPriority: 'random'  // Poor target selection
    },
    colorCode: '#888888'  // Grey
  },
  
  TRAINED: {
    rank: 1,
    displayName: 'Trained',
    statBonuses: {
      initiative: 0,
      attackBonus: 0,
      evasion: 0,
      critRange: 20
    },
    aiQuality: {
      mistakeChance: 0.10,
      reactionSpeed: 1.0,
      targetPriority: 'weakest'
    },
    colorCode: '#4a90e2'  // Blue
  },
  
  VETERAN: {
    rank: 2,
    displayName: 'Veteran',
    statBonuses: {
      initiative: +1,
      attackBonus: +1,
      evasion: +1,
      critRange: 20,
      maxHP: 1.15           // +15% HP
    },
    aiQuality: {
      mistakeChance: 0.05,
      reactionSpeed: 1.2,
      targetPriority: 'tactical'  // Prioritizes threats
    },
    colorCode: '#7ed321'  // Green
  },
  
  ELITE: {
    rank: 3,
    displayName: 'Elite',
    statBonuses: {
      initiative: +2,
      attackBonus: +2,
      evasion: +2,
      critRange: 19,        // Crits on 19-20
      maxHP: 1.30,
      shieldRegenPerRound: 5
    },
    aiQuality: {
      mistakeChance: 0.02,
      reactionSpeed: 1.5,
      targetPriority: 'optimal',
      usesAdvancedTactics: true
    },
    colorCode: '#f5a623'  // Orange
  },
  
  ACE: {
    rank: 4,
    displayName: 'Ace',
    statBonuses: {
      initiative: +3,
      attackBonus: +3,
      evasion: +3,
      critRange: 18,        // Crits on 18-20
      maxHP: 1.50,
      shieldRegenPerRound: 10,
      extraReaction: 1      // +1 reaction per round
    },
    aiQuality: {
      mistakeChance: 0.0,   // Perfect play
      reactionSpeed: 2.0,
      targetPriority: 'optimal',
      usesAdvancedTactics: true,
      predictsPlayerMoves: true
    },
    colorCode: '#d0021b'  // Red
  }
}

class VeteranSystem {
  applyVeteranBonuses(ship, veteranRank) {
    const bonuses = VETERAN_RANKS[veteranRank].statBonuses;
    // Apply stat modifications
  }
  
  getAIQuality(veteranRank) → aiQuality object
  shouldMakeMistake(veteranRank) → boolean (random check)
}
```

**Tasks:**
- [ ] Create veteran rank definitions
- [ ] Implement stat bonus application
- [ ] Add AI quality modifiers
- [ ] Build mistake probability system

---

### 3.3 AI Decision Engine
**File:** `src/lib/combat/ai/AICombat.js`

```javascript
class AICombatEngine {
  constructor(ship, personality, veteranRank) {
    this.ship = ship;
    this.personality = PERSONALITY_TRAITS[personality];
    this.veteran = VETERAN_RANKS[veteranRank];
    this.threatAssessment = new ThreatAssessment();
  }

  // Main decision loop
  decideTurn(combatState) {
    // 1. Assess situation
    const situation = this.assessSituation(combatState);
    
    // 2. Check for mistakes (veteran system)
    if (this.shouldMakeMistake()) {
      return this.makeSuboptimalDecision(situation);
    }
    
    // 3. Strategic decision (fight/flee/negotiate)
    const strategy = this.decideStrategy(situation);
    if (strategy === 'FLEE') return this.executeFlee();
    if (strategy === 'NEGOTIATE') return this.executeNegotiate();
    
    // 4. Tactical decisions (movement, actions)
    const tacticalPlan = this.decideTacticalActions(situation);
    return tacticalPlan;
  }

  // Situation assessment
  assessSituation(combatState) {
    return {
      // Self status
      myHP: this.ship.currentHull / this.ship.maxHull,
      myShields: this.ship.currentShields / this.ship.maxShields,
      myPowerBalance: this.ship.powerBalance,
      
      // Enemy analysis
      enemies: combatState.combatants
        .filter(c => c.faction !== this.ship.faction)
        .map(enemy => ({
          id: enemy.id,
          distance: combatState.positioning.getDistance(this.ship.id, enemy.id),
          distanceBand: combatState.positioning.getDistanceBand(this.ship.id, enemy.id),
          threat: this.calculateThreatLevel(enemy),
          hp: enemy.currentHull / enemy.maxHull,
          weapons: enemy.weapons
        })),
      
      // Tactical factors
      outnumbered: this.isOutnumbered(combatState),
      hasAdvantage: this.hasAdvantage(combatState),
      optimalRange: this.isAtOptimalRange(combatState)
    };
  }

  // Strategy selection (fight/flee/negotiate)
  decideStrategy(situation) {
    const scores = {
      FIGHT: 0,
      FLEE: 0,
      NEGOTIATE: 0
    };

    // Base scoring
    scores.FIGHT += this.personality.weights.attack * 100;
    scores.FLEE += this.personality.weights.retreat * 100;
    scores.NEGOTIATE += (this.personality.weights.negotiate || 0) * 100;

    // Modify based on HP
    const hpPercent = situation.myHP * 100;
    if (hpPercent < this.personality.thresholds.retreatHP) {
      scores.FLEE += 200;  // Strong retreat incentive
      scores.FIGHT -= 100;
    }

    // Outnumbered penalty
    if (situation.outnumbered) {
      scores.FLEE += 50 * this.personality.weights.retreat;
      scores.FIGHT -= 30;
    }

    // Damaged but aggressive (berserker behavior)
    if (this.personality.name === 'BERSERKER' && hpPercent < 30) {
      scores.FIGHT += 300;  // Enrage
    }

    // Veteran quality affects decision
    if (this.veteran.aiQuality.usesAdvancedTactics) {
      // Elites make smarter strategic choices
      if (situation.hasAdvantage) scores.FIGHT += 50;
      if (!situation.hasAdvantage) scores.FLEE += 30;
    }

    // Return highest scoring strategy
    return Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
  }

  // Tactical action planning
  decideTacticalActions(situation) {
    const plan = {
      movement: null,
      actions: [],
      bonusActions: [],
      reactions: []
    };

    // 1. MOVEMENT DECISION
    plan.movement = this.decideMovement(situation);

    // 2. ACTION PRIORITY
    const actionPriorities = this.prioritizeActions(situation);
    plan.actions = actionPriorities.slice(0, 2); // Take top 2 actions

    // 3. BONUS ACTIONS
    if (situation.myShields < 0.5) {
      plan.bonusActions.push('BOOST_SHIELDS');
    }

    // 4. REACTION SETUP
    if (this.hasComponent('POINT_DEFENSE')) {
      plan.reactions.push('POINT_DEFENSE');
    }

    return plan;
  }

  // Movement decision
  decideMovement(situation) {
    const primaryTarget = this.selectPrimaryTarget(situation.enemies);
    if (!primaryTarget) return null;

    const currentBand = primaryTarget.distanceBand;
    const optimalBand = this.getOptimalRange();

    // Personality-based movement
    if (this.personality.weights.closeDistance > 1.0) {
      // Aggressive: close in
      if (currentBand === 'LONG' || currentBand === 'EXTREME') {
        return { action: 'MOVE_CLOSER', target: primaryTarget.id };
      }
    }

    if (this.personality.weights.keepDistance > 1.0) {
      // Cautious: maintain distance
      if (currentBand === 'POINT_BLANK' || currentBand === 'CLOSE') {
        return { action: 'MOVE_FARTHER', target: primaryTarget.id };
      }
    }

    // Tactical: move to optimal weapon range
    if (currentBand !== optimalBand) {
      const closer = this.shouldMoveCloser(currentBand, optimalBand);
      return {
        action: closer ? 'MOVE_CLOSER' : 'MOVE_FARTHER',
        target: primaryTarget.id
      };
    }

    return null; // Stay at current range
  }

  // Target selection
  selectPrimaryTarget(enemies) {
    const priority = this.veteran.aiQuality.targetPriority;

    switch (priority) {
      case 'random':
        return enemies[Math.floor(Math.random() * enemies.length)];
      
      case 'weakest':
        return enemies.reduce((a, b) => a.hp < b.hp ? a : b);
      
      case 'closest':
        return enemies.reduce((a, b) => a.distance < b.distance ? a : b);
      
      case 'tactical':
        // Prioritize threats (high damage, low HP)
        return enemies.sort((a, b) => {
          const threatA = a.threat / Math.max(a.hp, 0.1);
          const threatB = b.threat / Math.max(b.hp, 0.1);
          return threatB - threatA;
        })[0];
      
      case 'optimal':
        // Elite AI: complex multi-factor analysis
        return this.selectOptimalTarget(enemies);
      
      default:
        return enemies[0];
    }
  }

  // Calculate threat level of enemy
  calculateThreatLevel(enemy) {
    let threat = 0;
    
    // Weapon damage potential
    enemy.weapons.forEach(weapon => {
      const avgDamage = this.parseAverageDamage(weapon.damage);
      threat += avgDamage * weapon.rateOfFire;
    });

    // Attack bonus (accuracy)
    threat *= (1 + enemy.attackBonus * 0.1);

    // Distance modifier (closer = more immediate threat)
    const distanceMod = {
      POINT_BLANK: 1.5,
      CLOSE: 1.2,
      MEDIUM: 1.0,
      LONG: 0.7,
      EXTREME: 0.3
    };
    const distance = this.combatState.positioning.getDistanceBand(
      this.ship.id, 
      enemy.id
    );
    threat *= distanceMod[distance] || 1.0;

    return threat;
  }

  // Mistake system (veteran-based)
  shouldMakeMistake() {
    const mistakeChance = this.veteran.aiQuality.mistakeChance;
    return Math.random() < mistakeChance;
  }

  makeSuboptimalDecision(situation) {
    // Rookies make poor choices
    const badChoices = [
      { action: 'MOVE_CLOSER', target: 'random' },  // Move into danger
      { action: 'FIRE_WEAPON', target: 'strongest' }, // Shoot toughest target
      { action: 'WASTE_ACTION', target: null }       // Do nothing useful
    ];
    return badChoices[Math.floor(Math.random() * badChoices.length)];
  }
}
```

**Tasks:**
- [ ] Build situation assessment
- [ ] Implement strategy decision tree
- [ ] Create tactical action planner
- [ ] Add target selection AI
- [ ] Build threat calculation
- [ ] Integrate veteran mistake system
- [ ] Add personality weight modifiers

---

### 3.4 Threat Assessment Module
**File:** `src/lib/combat/ai/ThreatAssessment.js`

```javascript
class ThreatAssessment {
  // Analyzes enemy capabilities
  analyzeEnemy(enemy, myShip, distance) {
    return {
      offensiveThreat: this.calculateOffensiveThreat(enemy, distance),
      defensiveStrength: this.calculateDefensiveStrength(enemy),
      mobilityThreat: this.calculateMobilityThreat(enemy, myShip),
      overallThreat: this.calculateOverallThreat(enemy, myShip, distance)
    };
  }

  // Check if we're outnumbered
  isOutnumbered(allies, enemies) {
    return enemies.length > allies.length;
  }

  // Check if we have tactical advantage
  hasAdvantage(myShip, enemies, positioning) {
    const advantageFactors = [
      myShip.currentHull > enemies[0].currentHull,
      myShip.attackBonus > enemies[0].attackBonus,
      enemies.every(e => positioning.getDistanceBand(myShip.id, e.id) === myShip.optimalRange)
    ];
    return advantageFactors.filter(Boolean).length >= 2;
  }
}
```

**Tasks:**
- [ ] Implement threat analysis
- [ ] Add outnumbered detection
- [ ] Create advantage calculation

---

## Phase 4: Integration & UI

### 4.1 Combat UI Components
**File:** `src/components/combat/CombatWindow.jsx` (enhance existing)

**Add:**
- Distance band indicator
- Movement controls (closer/farther buttons)
- Action queue display
- Reaction window timer
- Enemy intent indicators (AI personality hints)
- Veteran rank badges

**Tasks:**
- [ ] Distance band visual indicator
- [ ] Movement controls
- [ ] Reaction window UI
- [ ] Enemy personality display
- [ ] Veteran rank badges

---

### 4.2 Combat Flow Controller
**File:** `src/lib/combat/CombatFlowController.js`

```javascript
class CombatFlowController {
  async executeTurn(shipId) {
    const ship = this.getShip(shipId);
    
    // If AI, get decision
    if (ship.isAI) {
      const aiEngine = new AICombatEngine(ship, ship.personality, ship.veteranRank);
      const plan = aiEngine.decideTurn(this.combatState);
      
      // Execute AI plan
      await this.executeAIPlan(ship, plan);
    } else {
      // Wait for player input
      await this.waitForPlayerActions(ship);
    }
  }

  async executeAction(actor, action, target) {
    // 1. Validate action
    if (!this.canPerformAction(actor, action)) return;

    // 2. Open reaction window
    const reactors = this.getEligibleReactors(action);
    const reactions = await this.openReactionWindow(action, reactors);

    // 3. Resolve reactions first
    for (const reaction of reactions) {
      await this.resolveReaction(reaction);
    }

    // 4. Resolve main action
    await this.resolveAction(actor, action, target);

    // 5. Update combat state
    this.updateCombatState();
  }
}
```

**Tasks:**
- [ ] Build turn execution flow
- [ ] Implement AI plan executor
- [ ] Create player input handler
- [ ] Add reaction window management

---

## Phase 5: Testing & Balancing

### 5.1 AI Personality Tests
- [ ] Test each personality type
- [ ] Verify behavior matches description
- [ ] Balance aggression/caution weights

### 5.2 Veteran Scaling Tests
- [ ] Test Rookie AI (should make mistakes)
- [ ] Test Ace AI (should be challenging)
- [ ] Verify stat bonuses apply correctly

### 5.3 Distance Band Balance
- [ ] Test weapon range modifiers
- [ ] Verify movement costs
- [ ] Check optimal range tactics

### 5.4 **CRITICAL: System Balancing (D20 Math)**
- [ ] **Fix Signature Radius (SR) values** - Currently 30-45 is too high for d20 rolls
  - Max d20 roll = 20
  - Max realistic attack bonus = +5 to +8
  - Max range modifier = +3
  - **Total max = ~28-31**
  - **Recommended SR range: 10-25** (easy to hit = 10-12, hard to hit = 20-25)
- [ ] Rebalance ship class base SR values
- [ ] Adjust ECM signature reduction (currently -10 to -30, should be -2 to -8)
- [ ] Test hit probability at each SR value
- [ ] Ensure average hit rate is 40-70% (challenging but not frustrating)

---

## Implementation Priority

### Week 1: Core Systems
1. Distance bands & positioning
2. Update ShipManager for distance-aware attacks
3. Combat state manager

### Week 2: AI Foundation
4. AI personality traits
5. Veteran system
6. Basic decision engine

### Week 3: AI Intelligence
7. Threat assessment
8. Target selection
9. Tactical decision-making

### Week 4: Integration
10. Combat flow controller
11. UI updates
12. Testing & balancing

---

## File Structure

```
src/lib/combat/
  ├── distanceBands.js           (Phase 1.1)
  ├── combatPositioning.js       (Phase 1.2)
  ├── CombatStateManager.js      (Phase 2.1)
  ├── combatActions.js           (Phase 2.2)
  ├── CombatFlowController.js    (Phase 4.2)
  └── ai/
      ├── AIPersonality.js       (Phase 3.1)
      ├── VeteranSystem.js       (Phase 3.2)
      ├── AICombat.js           (Phase 3.3)
      └── ThreatAssessment.js    (Phase 3.4)

src/components/combat/
  └── CombatWindow.jsx           (Phase 4.1 - enhance existing)
```

---

## Summary

**Distance Band System:**
- 5 bands: Point Blank, Close, Medium, Long, Extreme
- No grid complexity, just relative distance tracking
- Weapons have range modifiers per band
- Movement costs based on ship speed

**AI System:**
- 6 personality types (Aggressive, Cautious, Tactical, Berserker, Paranoid, Trader)
- 5 veteran ranks (Rookie → Ace) with stat bonuses
- Multi-factor decision engine (fight/flee/negotiate)
- Threat assessment & target prioritization
- Mistake probability based on veteran rank

**Turn Structure:**
- D&D-style phases: Movement → Action → Bonus → End
- Reaction windows pause combat for interrupts
- Action economy tracking per ship

**Ready to implement Phase 1?**
