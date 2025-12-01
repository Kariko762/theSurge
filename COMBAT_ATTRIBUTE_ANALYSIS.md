# Combat Attribute Analysis: D&D 5e → Space Game

## D&D 5e Combat System Summary

### Core Turn Structure
1. **Initiative Roll**: Dexterity check determines turn order
2. **Turn Phases**:
   - **Movement**: Up to speed distance, can be split before/after action
   - **Action**: Attack, Cast Spell, Dash, Disengage, Dodge, Help, Hide, Ready, Search, Use Object
   - **Bonus Action**: Special abilities/features
   - **Reaction**: Triggered responses (opportunity attacks, etc.)
3. **Round**: ~6 seconds game time, all combatants take one turn

### Key Mechanics
- **Action Economy**: 1 Action + 1 Bonus Action + 1 Reaction per turn
- **Movement Between Attacks**: Can split movement and attacks
- **Opportunity Attacks**: Triggered when enemy leaves reach
- **Advantage/Disadvantage**: Roll 2d20, take higher/lower
- **Cover**: Half (+2 AC), Three-Quarters (+5 AC), Total (untargetable)
- **Critical Hits**: Natural 20 doubles damage dice

### Combat Attributes (D&D)
```
INITIATIVE:
  - Dexterity modifier (reaction speed)

OFFENSE:
  - Attack Bonus = Base Attack Bonus + Ability Modifier + Proficiency
  - Damage = Weapon Dice + Ability Modifier
  - Range (short/long with disadvantage beyond normal)

DEFENSE:
  - AC (Armor Class) = 10 + Armor + Dex Modifier + Shield
  - Hit Points (damage capacity)
  - Saving Throws (avoid effects)

MOBILITY:
  - Speed (feet per turn, usually 30ft)
  - Multiple movement types (walking, flying, swimming)

SPECIAL:
  - Reactions (triggered abilities)
  - Concentration (maintaining spells)
  - Conditions (prone, grappled, stunned, etc.)
```

---

## Current Ship System Analysis

### Existing Attributes

#### ShipState.js
```javascript
currentHull: 89,              // ✓ HP equivalent
currentShields: 78,           // ✓ Temporary HP / AC boost
fuel/fuelPellets: 1000,       // ✓ Resource management
currentVelocity: 0,           // ✓ Movement state
position: { x, y, distance }  // ✓ Spatial positioning
```

#### ShipComponents.js
```javascript
Component Attributes:
  - powerReq: 5-30           // Power cost
  - maxShields: 50-180       // Shield capacity
  - thrust: 100-180          // Engine power
  - efficiency: 60-80        // Fuel efficiency
  - sensorRange: 100-300     // Detection range
  - navigationBonus: 0-15    // Nav accuracy
  - repairBonus: 15          // Repair effectiveness
  - scanBonus: 20            // Scan effectiveness
```

#### InventoryManager.js
```javascript
Ship Stats (from installed components):
  - weapons: []              // Weapon damage
  - totalDamage: 0           // Aggregate damage
  - thrust: 0                // Speed capability
  - powerOutput: 0           // Power generation
  - powerDraw: 0             // Power consumption
  - scanRange: 0             // Sensor range
  - armor: 0                 // Damage reduction
  - shields: 0               // Shield capacity
  - cargoCapacity_m3: 200    // Storage space
```

---

## Missing Attributes for Turn-Based Combat

### 🔴 CRITICAL MISSING ATTRIBUTES

#### 1. **Initiative / Turn Order**
**D&D Equivalent**: Dexterity check
**What We Need**:
```javascript
ship: {
  initiative: 0,              // Base initiative modifier
  initiativeBonus: 0,         // From components/AI
  currentInitiative: 0,       // Rolled at combat start
}
```
**Source**: 
- Sensors (faster detection)
- AI Cores (processing speed)
- Component: "Combat Computer" or "Tactical Suite"

---

#### 2. **Action Points / Action Economy**
**D&D Equivalent**: 1 Action + 1 Bonus Action + 1 Reaction
**What We Need**:
```javascript
combat: {
  actionPoints: 2,            // Main actions per turn
  bonusActions: 1,            // Bonus/quick actions
  reactions: 1,               // Defensive reactions
  movementPoints: 100,        // Movement budget per turn
  
  // Action costs
  actionCosts: {
    fireWeapon: 1,            // Main action
    evasiveManeuvers: 1,      // Main action
    boostShields: 1,          // Bonus action
    reroute Power: 1,         // Bonus action
    pointDefense: 1,          // Reaction
    counterfire: 1,           // Reaction
  }
}
```

---

#### 3. **Attack / Accuracy Attributes**
**D&D Equivalent**: Attack Bonus, Proficiency Bonus
**What We Need**:
```javascript
offense: {
  attackBonus: 0,             // Base to-hit modifier
  weaponAccuracy: 0,          // Weapon-specific accuracy
  trackingSpeed: 0,           // Target lock speed
  criticalRange: 20,          // Crit threshold (19-20, 18-20, etc.)
  criticalMultiplier: 2,      // Damage multiplier on crit
}
```
**Source**:
- Weapons (tracking systems, targeting computers)
- AI Cores (firing solutions)
- Sensors (target acquisition)

---

#### 4. **Evasion / Defense Stats**
**D&D Equivalent**: AC (Armor Class)
**What We Need**:
```javascript
defense: {
  evasion: 0,                 // Dodge/maneuverability (like AC)
  armor: 0,                   // Damage reduction (existing)
  shields: 0,                 // Ablative defense (existing)
  pointDefense: 0,            // Intercept projectiles
  ECM: 0,                     // Electronic countermeasures
  signature: 50,              // Detection difficulty (lower = harder to hit)
}
```
**Source**:
- Engines (maneuverability)
- Hull upgrades (armor)
- ECM modules
- Component: "Stealth Field Generator"

---

#### 5. **Speed / Movement**
**D&D Equivalent**: Speed (30 ft/turn), can split movement
**What We Need**:
```javascript
movement: {
  baseSpeed: 100,             // AU/turn or grid spaces
  currentSpeed: 0,            // After movement this turn
  maxAcceleration: 20,        // Speed gain per action
  turnRate: 45,               // Degrees per turn
  canSplitMovement: true,     // Move → Attack → Move
}
```
**Source**:
- Engines (thrust, efficiency)
- Ship mass/weight
- Component: "Inertial Dampeners", "RCS Thrusters"

---

#### 6. **Reaction System**
**D&D Equivalent**: Reactions (opportunity attacks, readied actions)
**What We Need**:
```javascript
reactions: {
  available: 1,               // Reactions per round
  pointDefenseActive: false,  // Auto-intercept missiles
  counterfireReady: false,    // Return fire when attacked
  evasiveReady: false,        // Dodge on incoming attack
}
```
**Reaction Types**:
- **Point Defense**: Intercept incoming projectile (like Shield spell)
- **Counterfire**: Return fire when attacked
- **Emergency Burn**: Evade when targeted (like Dodge)
- **Shield Boost**: Temporarily boost shields on incoming hit

---

#### 7. **Weapon Range & Targeting**
**D&D Equivalent**: Range (normal/long with disadvantage)
**What We Need**:
```javascript
weapons: [{
  name: 'Plasma Cannon',
  damage: '3d8',              // Dice notation
  damageType: 'energy',       // energy, kinetic, explosive
  rangeClose: 100,            // Optimal range (no penalty)
  rangeLong: 300,             // Max range (disadvantage)
  rateOfFire: 1,              // Attacks per action
  attackBonus: 2,             // Weapon accuracy modifier
  energyCost: 10,             // Power per shot
  cooldown: 0,                // Turns before refire
}]
```

---

#### 8. **Status Effects / Conditions**
**D&D Equivalent**: Prone, Grappled, Stunned, Poisoned, etc.
**What We Need**:
```javascript
statusEffects: [
  {
    type: 'DISABLED_ENGINES',
    duration: 3,              // Turns remaining
    effect: { speed: 0 }
  },
  {
    type: 'SENSOR_JAMMED',
    duration: 2,
    effect: { attackBonus: -4, evasion: -2 }
  },
  {
    type: 'POWER_SURGE',
    duration: 1,
    effect: { damageBonus: 5 }
  }
]
```
**Condition Types**:
- **Disabled**: System offline (engines, weapons, sensors)
- **Jammed**: Accuracy penalties
- **Overheated**: Can't fire weapons
- **Hull Breach**: Ongoing damage per turn
- **Shields Down**: No shield protection
- **ECM Active**: Attacker disadvantage

---

#### 9. **Critical Hit System**
**D&D Equivalent**: Natural 20 = double damage dice
**What We Need**:
```javascript
criticals: {
  critRange: 20,              // Natural 20 only (or 19-20, 18-20)
  critMultiplier: 2,          // Damage multiplier
  critEffects: [              // Additional crit effects
    'DISABLE_SYSTEM',         // Random system offline
    'HULL_BREACH',            // Ongoing damage
    'CREW_INJURY',            // Reduce effectiveness
  ]
}
```

---

#### 10. **Cover / Positioning**
**D&D Equivalent**: Half Cover (+2 AC), Three-Quarters (+5 AC)
**What We Need**:
```javascript
positioning: {
  cover: null,                // 'PARTIAL', 'HEAVY', 'TOTAL'
  coverBonus: 0,              // +2, +5 to evasion
  range: 200,                 // Distance to target
  facingAngle: 0,             // Ship orientation
  arcFiring: 'FRONT',         // Which weapons can fire
}
```
**Cover Sources**:
- Asteroids
- Debris fields
- Space stations
- Planetary rings

---

### 📊 Derived Stats Needed

```javascript
// Calculate from installed components
derivedStats: {
  // OFFENSE
  totalAttackBonus: 0,        // weaponAccuracy + AI + sensors
  totalDamage: 0,             // Sum of weapon damage
  firepower: 0,               // Damage per round potential
  
  // DEFENSE
  effectiveAC: 0,             // evasion + armor + cover
  effectiveHP: 0,             // hull + shields combined
  damageReduction: 0,         // Armor percentage
  
  // MOBILITY
  combatSpeed: 0,             // Movement per turn
  acceleration: 0,            // Speed change per action
  
  // UTILITY
  sensorPower: 0,             // Detection + targeting
  powerBalance: 0,            // generation - consumption
  crewEfficiency: 0,          // AI effectiveness
}
```

---

## New Components Needed

### Weapons
```javascript
WEAPON_PLASMA_CANNON: {
  id: 'WEAPON_PLASMA_CANNON',
  type: 'weapon',
  slotType: 'weapon',
  powerReq: 15,
  attributes: {
    damage: '3d8',            // NEW
    damageType: 'energy',     // NEW
    rangeClose: 100,          // NEW
    rangeLong: 300,           // NEW
    attackBonus: 2,           // NEW
    rateOfFire: 1,            // NEW
    critRange: 20,            // NEW
  }
}
```

### Combat Systems
```javascript
COMBAT_COMPUTER_MK1: {
  id: 'COMBAT_COMPUTER_MK1',
  type: 'combat_computer',
  slotType: 'internal',
  powerReq: 12,
  attributes: {
    initiativeBonus: 3,       // NEW
    attackBonus: 1,           // NEW
    evasionBonus: 1,          // NEW
  }
}

ECM_MODULE: {
  id: 'ECM_MODULE',
  type: 'electronic_warfare',
  slotType: 'internal',
  powerReq: 10,
  attributes: {
    signatureReduction: 25,   // NEW
    jamRange: 150,            // NEW
    jamStrength: 3,           // NEW (penalty to attacker)
  }
}

POINT_DEFENSE_TURRET: {
  id: 'POINT_DEFENSE',
  type: 'defensive_weapon',
  slotType: 'weapon',
  powerReq: 8,
  attributes: {
    interceptChance: 60,      // NEW (% to intercept missile)
    reactionsPerRound: 2,     // NEW
    interceptRange: 50,       // NEW
  }
}
```

---

## Ship State Additions Needed

```javascript
// Add to ShipState
combat: {
  // Initiative
  initiative: 0,
  initiativeBonus: 0,
  initiativeRolled: 0,
  
  // Action Economy
  actionsRemaining: 2,
  bonusActionsRemaining: 1,
  reactionsRemaining: 1,
  movementRemaining: 100,
  
  // Offense
  attackBonus: 0,
  critRange: 20,
  
  // Defense
  evasion: 10,              // Base AC equivalent
  signature: 50,            // Detection/targeting difficulty
  
  // Positioning
  facing: 0,                // Degrees (0 = north)
  cover: null,              // null, 'PARTIAL', 'HEAVY', 'TOTAL'
  rangeToTarget: 0,
  
  // Status
  statusEffects: [],
  disabledSystems: [],
  
  // Turn tracking
  turnNumber: 0,
  inCombat: false,
}

// Weapon slots tracking
weapons: [
  {
    instanceId: 'weapon_1',
    itemId: 'WEAPON_PLASMA_CANNON',
    cooldownRemaining: 0,
    powerAllocated: 100,
    arc: 'FRONT',           // FRONT, REAR, PORT, STARBOARD, TURRET
  }
]
```

---

## Action Definitions

### Main Actions (Cost: 1 Action)
```javascript
ACTIONS = {
  FIRE_WEAPON: {
    cost: { actions: 1 },
    requirements: ['weapon equipped', 'in range', 'target locked'],
  },
  EVASIVE_MANEUVERS: {
    cost: { actions: 1 },
    effect: { evasion: +4 },          // Like Dodge
    duration: 'until next turn',
  },
  FULL_BURN: {
    cost: { actions: 1 },
    effect: { movementPoints: +50 },  // Like Dash
  },
  SENSOR_SCAN: {
    cost: { actions: 1 },
    effect: 'reveal enemy stats/weaknesses',
  },
  REPAIR_SYSTEM: {
    cost: { actions: 1 },
    effect: 'restore disabled system or hull',
  },
  READY_ACTION: {
    cost: { actions: 1 },
    effect: 'trigger action on condition',
  }
}
```

### Bonus Actions
```javascript
BONUS_ACTIONS = {
  REROUTE_POWER: {
    cost: { bonusActions: 1 },
    effect: 'shift power allocation',
  },
  BOOST_SHIELDS: {
    cost: { bonusActions: 1 },
    effect: 'temp shield HP',
  },
  QUICK_SCAN: {
    cost: { bonusActions: 1 },
    effect: 'target acquisition',
  },
  ACTIVATE_ECM: {
    cost: { bonusActions: 1 },
    effect: 'jamming active',
  }
}
```

### Reactions
```javascript
REACTIONS = {
  POINT_DEFENSE: {
    cost: { reactions: 1 },
    trigger: 'incoming missile',
    effect: 'intercept attempt',
  },
  EMERGENCY_BURN: {
    cost: { reactions: 1 },
    trigger: 'being targeted',
    effect: { evasion: +2 },
  },
  COUNTERFIRE: {
    cost: { reactions: 1 },
    trigger: 'being attacked',
    effect: 'immediate return fire',
  },
  SHIELD_BOOST: {
    cost: { reactions: 1 },
    trigger: 'incoming damage',
    effect: 'reduce damage',
  }
}
```

---

## Implementation Priority

### Phase 1: Core Combat Stats
1. ✅ Add `initiative` and `initiativeBonus` to ship
2. ✅ Add `attackBonus`, `evasion`, `signature` to ship
3. ✅ Add weapon attributes: `damage`, `damageType`, `range`, `attackBonus`
4. ✅ Add `actionPoints`, `bonusActions`, `reactions` to combat state

### Phase 2: Combat Components
1. Create weapon components with combat stats
2. Create combat computer components
3. Create ECM/defensive components
4. Update `calculateShipStats()` to aggregate combat attributes

### Phase 3: Turn System
1. Implement initiative rolling
2. Implement action economy tracking
3. Implement movement splitting
4. Implement reaction triggers

### Phase 4: Advanced Systems
1. Status effects system
2. Critical hit effects
3. Cover/positioning
4. AI tactical decision-making

---

## Example Ship Combat Profile (Fully Equipped)

```javascript
{
  // IDENTITY
  name: 'SS-ARKOSE',
  class: 'Survey Frigate',
  
  // HP / DEFENSES
  currentHull: 100,
  maxHull: 100,
  currentShields: 80,
  maxShields: 100,
  armor: 15,              // NEW: 15% damage reduction
  evasion: 14,            // NEW: AC equivalent (10 base + 4 from engines/computer)
  
  // OFFENSE
  attackBonus: 5,         // NEW: +2 weapon, +2 computer, +1 AI
  weapons: [
    {
      name: 'Plasma Cannon',
      damage: '3d8+2',
      damageType: 'energy',
      rangeClose: 100,
      rangeLong: 300,
      attackBonus: 2,
      cooldown: 0,
    }
  ],
  
  // MOBILITY
  baseSpeed: 100,         // NEW: Grid spaces per turn
  currentSpeed: 0,
  maxAcceleration: 20,    // NEW
  
  // ACTION ECONOMY
  actionsPerTurn: 2,      // NEW
  bonusActionsPerTurn: 1, // NEW
  reactionsPerRound: 1,   // NEW
  
  // INITIATIVE
  initiative: 3,          // NEW: +2 sensors, +1 combat computer
  
  // SPECIAL
  signature: 35,          // NEW: 50 base - 15 from ECM
  pointDefense: 60,       // NEW: 60% intercept chance
  sensorRange: 250,
}
```

---

## Questions to Answer

1. **Grid vs. Free Movement?**
   - D&D uses 5ft squares. Do we want hex grid, square grid, or free 2D space?
   - Recommendation: **Hex grid** (fits space theme, easier pathfinding)

2. **Turn Duration?**
   - D&D = 6 seconds. Space combat could be longer.
   - Recommendation: **30 seconds per round** (more realistic for ship maneuvers)

3. **Range Units?**
   - AU, kilometers, or abstract grid spaces?
   - Recommendation: **Grid spaces** (1 space = ~1000km or 0.01 AU)

4. **Damage Scaling?**
   - D&D uses 1d6-4d10 typically. Ship weapons could be higher.
   - Recommendation: **2d6 to 6d12** for weapons, scale hull to 100-500 HP

5. **Multiple Enemies?**
   - Need enemy ship archetypes (fighter, cruiser, dreadnought)
   - Need NPC tactical AI
   - Recommendation: **Start with 3 enemy ship templates**

---

## Next Steps

1. **Review this analysis** - confirm missing attributes
2. **Design combat component library** - weapons, defense systems
3. **Extend ShipState** - add combat properties
4. **Build combat state machine** - turn management, initiative
5. **Create UI mockups** - combat display, action selection
6. **Write combat resolver** - attack rolls, damage, effects

Let me know which phase you want to tackle first! 🚀
