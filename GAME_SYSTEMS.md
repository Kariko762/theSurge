# CORE GAME SYSTEMS
## Detailed Mechanics Documentation

---

## 🎲 CORE PHILOSOPHY: D&D IN SPACE

This is a **text-based, dice-driven roguelike**. Every action, every encounter, every discovery is determined by **dice rolls** modified by your stats, AI crew bonuses, and environmental factors.

### The Dice System

**Base Mechanic**: d20 + modifiers vs. difficulty check (DC)

- **Critical Success (Natural 20)**: Exceptional outcome, bonus rewards
- **Success (Meet/Beat DC)**: Action succeeds as intended
- **Failure (Below DC)**: Action fails, consequences apply
- **Critical Failure (Natural 1)**: Catastrophic failure, severe penalties

**Common Dice Used**:
- **d20** - Primary action resolution
- **d12** - Major damage/rewards
- **d10** - Standard damage/discovery
- **d8** - Minor damage/resources
- **d6** - Small bonuses/penalties
- **d4** - Minimal effects

### Stat Modifiers

Your ship and AI crew provide modifiers to rolls:

**Ship Systems**:
- **Navigation** → Travel/evasion checks
- **Sensors** → Detection/scanning checks
- **Engines** → Speed/escape checks
- **Weapons** → Combat attack rolls
- **Shields** → Defense/damage reduction
- **Comms** → Negotiation/hacking checks

**AI Crew Bonuses**:
- **ARIA** (Navigation) → +2 to piloting, +1 to route planning
- **FORGE** (Engineering) → +2 to repairs, +1 to jury-rigging
- **CIPHER** (Research) → +2 to scanning, +1 to decryption
- **GHOST** (Sensors) → +2 to detection, +1 to stealth

---

## 🏠 HOMEBASE SYSTEMS

### Core AI Management

You have **2 Core AI slots** with limited power. Additional AI can be built but require more power.

**Power Management**:
- **Base Power**: 100 units
- **Core AI**: 40 units each (2 active = 80 units)
- **Additional AI**: 50 units each
- **Power Upgrades**: Expand capacity via homebase improvements

**Strategic Choice**: 
- Have 3-4 AI total but only enough power for 2
- Swap AI based on mission needs
- Research AI = slower but better discoveries
- Combat AI = safer but fewer resources
- Engineering AI = faster repairs but less combat readiness

### AI Functionality at Homebase

**When Active at Base**:
- **Research AI**: Decrypt data fragments, unlock tech
- **Engineering AI**: Build ship upgrades, craft items
- **Resource AI**: Process salvage, refine materials
- **Navigation AI**: Map new routes, calculate optimal paths

**Repeatable Tasks**: 
AI can run tasks while you're on expeditions:
- Researching G'ejar-Vale coordinates
- Building ship components
- Analyzing collected data
- Monitoring solar system scans

---

## 🚀 EXPEDITION SYSTEM

### Pre-Launch: System Selection

**Core AI** presents 3-5 randomly generated solar systems each cycle:

```
> SYSTEM SELECTION PROTOCOL INITIATED
> ARIA: "Three viable targets identified. Reviewing parameters."

┌─────────────────────────────────────────────────────────────┐
│ SYSTEM ALPHA-7 | G-TYPE STAR | SEED: 8A4F29E1              │
│ Radiation: MEDIUM | Wake Risk: LOW | Distance: 12 LY       │
│ POIs Detected: 4 Planets, 1 Station, Asteroid Belt         │
│ Threat Assessment: MODERATE | Reward Potential: MEDIUM     │
└─────────────────────────────────────────────────────────────┘

> Roll d20 + Navigation to calculate jump accuracy...
> [ROLL: 14 + 2 = 16] SUCCESS - Precise arrival at heliosphere edge
```

### The Seed System

Each system has a **unique seed** that determines:
- Solar system size (heliosphere radius)
- Star type and radiation output
- Number and type of POIs
- Environmental hazards
- Loot tables
- Encounter probabilities

**Seed determines**:
- Procedural generation is **deterministic** (same seed = same system)
- Allows for sharing "interesting systems" between players later
- Ensures balanced distribution of resources and challenges

---

## 🌍 POI HIERARCHY & DISCOVERY

### Parent POIs (Scanned on Arrival)

When you enter a system, you **scan from the heliosphere edge**:

**Initial Scan Results**:
```
> LONG-RANGE SCAN COMPLETE
> SYSTEM SIZE: 8.2 BILLION KM (HELIOSPHERE DETECTED)
> STAR TYPE: G2V (YELLOW DWARF)
> SURGE RADIATION: MEDIUM (DISTANCE-VARIABLE)

POIs DETECTED:
├─ SUN (0,0,0) - CENTER - RADIATION SOURCE
├─ PLANET [LARGE] (2.4M KM) - UNIDENTIFIED
├─ PLANET [MEDIUM] (5.1M KM) - UNIDENTIFIED
├─ DYSON SPHERE [INCOMPLETE] (1.8M KM) - FAINT SIGNAL
├─ ASTEROID BELT (3.2M - 4.5M KM) - UNSURVEYED
├─ ORBITAL PLATFORM (4.8M KM) - UNIDENTIFIED
├─ DISTRESS SIGNAL (6.3M KM) - WEAK TRANSMISSION
├─ PLASMA WAKE DISTURBANCE [LARGE] (7.1M KM) - ACTIVE
├─ SURGE ZONE (5.5M KM) - HIGH RADIATION
└─ NEBULA FORMATION (6.8M KM) - UNKNOWN COMPOSITION

> ARIA: "Course plotting available. Select destination."
> FORGE: "That Dyson sphere... could have parts we need."
> GHOST: "...distress signal... could be trap... could be survivors..."
```

### Child POIs (Revealed on Investigation)

**Parent → Child Reveal System**:

When you **approach, scan, or investigate** a parent POI:

```
> APPROACHING: ORBITAL PLATFORM (4.8M KM)
> ROLL: Sensors Check (d20 + Sensors) DC 12
> [ROLL: 16 + 3 = 19] SUCCESS - Detailed scan complete

PLATFORM IDENTIFIED:
├─ TYPE: Military Outpost (Pre-Surge)
├─ STATUS: Partially Operational
├─ POWER: 12% Auxiliary Systems
├─ HOSTILES: 2 Rogue Defense Drones (ACTIVE)
├─ SALVAGE: Medium (estimated)
└─ DATA FRAGMENTS: High Probability

CHILD POIs REVEALED:
├─ Docking Bay [DAMAGED] - Accessible
├─ Command Center [SEALED] - Requires hacking (DC 15)
├─ Armory [COLLAPSED] - Requires clearing debris
├─ Data Core [OFFLINE] - Requires power restoration
└─ Emergency Beacon [TRANSMITTING] - Automated distress

> FORGE: "Those drones won't be friendly. We ready for a fight?"
> Roll d20 + Weapons to engage or d20 + Stealth to avoid?
```

### POI Types & Properties

#### **HELIOSPHERE**
- **Distance**: Edge of solar system (defines max range)
- **Purpose**: Arrival point, safe retreat boundary
- **Mechanic**: Crossing it = leaving system

#### **SUN**
- **Distance**: Center (0,0,0)
- **Radiation**: Inverse to Surge (close = safe from Surge, dangerous heat)
- **RFE Fuel**: Primary refueling source
- **Risk**: Extreme heat damage, solar flares

#### **LARGE SOLAR FACILITIES (Dyson Spheres, etc.)**
- **Child POIs**: Power cores, construction platforms, AI cores
- **Loot**: Advanced tech, massive power sources
- **Risk**: Automated defenses, radiation traps

#### **PLANETS**
- **Child POIs**: Colonies, research stations, landing zones, caves
- **Loot**: Resources, data fragments, survivors
- **Risk**: Environmental hazards, corrupted creatures

#### **MOONS (LARGE/MEDIUM)**
- **Child POIs**: Mining facilities, outposts, hidden bases
- **Loot**: Rare materials, escape pods
- **Risk**: Unstable orbits, abandoned defenses

#### **ORBITAL PLATFORMS**
- **Child POIs**: Docking bays, command centers, cargo holds
- **Loot**: Ship parts, weapons, supplies
- **Risk**: Rogue AIs, scavengers, structural collapse

#### **ASTEROID FIELDS**
- **Child POIs**: Mining operations, hidden stations, debris
- **Loot**: Iron, minerals (reduces Surge radiation locally)
- **Risk**: Navigation hazards, ambush points
- **Special**: High iron = low Surge radiation (safer)

#### **CONFLICT ZONES (LARGE/MEDIUM)**
- **Child POIs**: Destroyed fleets, damaged ships, survivors
- **Loot**: Military tech, combat data
- **Risk**: Active combat, hostile factions, mines

#### **DISTRESS SIGNALS**
- **Child POIs**: Stranded ships, escape pods, survivors
- **Loot**: Varies (could be treasure or trap)
- **Risk**: Scavenger bait, pirate traps, disease

#### **PLASMA WAKE DISTURBANCES**
- **Mechanic**: Evidence of recent ship activity
- **Warning**: Someone else was here recently
- **Risk**: Potential hostile encounter

#### **O'NEILL CYLINDERS**
- **Child POIs**: Habitats, farms, life support, populations
- **Loot**: Food, water, survivors, AI cores
- **Risk**: Failed life support, trapped populations

#### **NEBULA/CLOUD FORMATIONS**
- **Child POIs**: Hidden bases, anomalies, rare resources
- **Loot**: Exotic materials, ancient tech
- **Risk**: Sensor interference, navigation difficulty

#### **SURGE ZONES**
- **Mechanic**: Concentrated Surge radiation
- **Risk**: High radiation damage, corrupted creatures
- **Reward**: Fewer hostiles (too dangerous for scavengers)
- **Loot**: Untouched salvage, data on The Surge

---

## 🌊 PLASMA WAKE SYSTEM

### What is Plasma Wake?

Every time you **use your RFE to travel**, you create a plasma disturbance that can be detected.

**Wake Level Accumulation**:
- **Each jump**: +10 Wake
- **Each scan**: +5 Wake
- **Each engagement**: +15 Wake
- **Natural decay**: -5 Wake per turn (if stationary)

**Wake Thresholds**:
- **0-20**: Silent (very low detection chance)
- **21-50**: Low (minor patrols may investigate)
- **51-80**: Medium (scavengers actively tracking)
- **81-100**: High (hostile encounter imminent)
- **100+**: CRITICAL (major threat incoming)

### Dynamic Encounter Generation

**Wake-Based Encounters**:

```
> PLASMA WAKE LEVEL: 73 (HIGH)
> GHOST: "...detecting... multiple contacts... closing fast..."
> ROLL: Random Encounter (d20 + Wake Modifier)
> [ROLL: 12 + 4 = 16] ENCOUNTER TRIGGERED

HOSTILE CONTACT:
├─ TYPE: Scavenger Raiding Party
├─ SHIPS: 3x Light Fighters
├─ INTENT: Demand cargo or attack
└─ OPTIONS:
    ├─ Fight (d20 + Weapons) DC 14
    ├─ Flee (d20 + Engines) DC 15
    ├─ Negotiate (d20 + Comms) DC 16
    └─ Stealth (d20 + Sensors) DC 18 (if not yet detected)

> ARIA: "We can outrun them, but it'll burn fuel."
> FORGE: "Or we stand and scrap. Your call."
```

---

## ☢️ RADIATION ZONES & STRATEGIC DEPTH

### The Three Zone Types

#### **1. DARK ZONES (Sun-Proximate)**
- **Surge Radiation**: ZERO (sun's power suppresses it)
- **Environmental Danger**: EXTREME (solar heat, flares)
- **Population Density**: HIGH (safe from Surge = more survivors/scavengers)
- **Loot Quality**: HIGH (people live/work here)
- **Combat Difficulty**: HARD (more competition)
- **Strategy**: High risk, high reward, expect fights

#### **2. STATIC ZONES (Far from Sun)**
- **Surge Radiation**: EXTREME (no sun protection)
- **Environmental Danger**: HIGH (radiation damage over time)
- **Population Density**: VERY LOW (too dangerous)
- **Loot Quality**: MEDIUM (abandoned, not looted)
- **Combat Difficulty**: EASY (few hostiles)
- **Strategy**: Avoid long stays, quick salvage runs

#### **3. SURGE ZONES (Anomalous High Radiation)**
- **Surge Radiation**: VERY HIGH (concentrated corruption)
- **Environmental Danger**: VERY HIGH (mutations, instability)
- **Population Density**: LOW (only desperate/corrupted beings)
- **Loot Quality**: HIGH (untouched due to danger)
- **Combat Difficulty**: MODERATE (corrupted creatures, rogue AIs)
- **Strategy**: Specialized equipment needed, big rewards

### Radiation Damage Mechanic

**Per Turn in Zone**:
- **Dark Zone**: 0 Surge damage, 2d6 heat damage (sun proximity)
- **Safe Zone (Mid-Range)**: 1d4 Surge damage
- **Static Zone**: 2d8 Surge damage
- **Surge Zone**: 3d10 Surge damage + corruption chance

**Mitigation**:
- **Shields**: Reduce damage by shield rating
- **Radiation Meds**: Temporary immunity (limited supply)
- **Iron-Rich Areas**: Asteroid belts reduce Surge by 50%
- **Speed**: Less time = less damage (but higher Wake)

### Strategic Triangle

```
        FAST (High Wake)
              /\
             /  \
            /    \
           /      \
          /        \
         /   RISK   \
        /  TRIANGLE  \
       /              \
      /________________\
 SAFE              SLOW
(Dark Zones)    (Static Zones)
(More Combat)   (More Radiation)
```

**Player must balance**:
- **Fast exploration** = High Wake = More encounters
- **Slow, careful** = More radiation damage over time
- **Safe zones** = More competition from other survivors

---

## 🎲 DICE ROLL UI INTEGRATION

### Visual Dice Rolling

Every action should **show the dice roll** to the player:

```
┌───────────────────────────────────────────┐
│  ATTEMPTING: HACK COMMAND CENTER DOOR     │
│  DIFFICULTY: DC 15                        │
│                                           │
│  BASE ROLL: d20                           │
│  + Comms System: +2                       │
│  + CIPHER (Active): +2                    │
│  + Ship Computer: +1                      │
│  ─────────────────                        │
│  TOTAL MODIFIER: +5                       │
│                                           │
│  🎲 ROLLING...                            │
│                                           │
│  ╔═══════╗                                │
│  ║   14  ║  [RESULT]                      │
│  ╚═══════╝                                │
│  + 5 (modifier) = 19 TOTAL                │
│                                           │
│  ✓ SUCCESS (DC 15)                        │
│  Door unlocked. Access granted.           │
└───────────────────────────────────────────┘
```

### Dice Roll Component

Should display:
- **Action being attempted** (clear description)
- **Difficulty Check (DC)** (transparent challenge)
- **Modifiers breakdown** (show all bonuses/penalties)
- **Animated dice roll** (visual d20 tumbling)
- **Result calculation** (roll + modifiers)
- **Success/Failure** (color-coded outcome)
- **Narrative result** (what happens next)

### Critical Outcomes

**Critical Success (Natural 20)**:
```
╔═══════════════════════════════════════════╗
║  ⚡ CRITICAL SUCCESS! ⚡                   ║
║  🎲 NATURAL 20!                           ║
║                                           ║
║  Not only did you hack the door—         ║
║  you've gained FULL SYSTEM ACCESS!        ║
║                                           ║
║  + Command Center unlocked                ║
║  + Security systems disabled              ║
║  + Bonus data fragment recovered          ║
║  + Station AI core partially restored     ║
╚═══════════════════════════════════════════╝
```

**Critical Failure (Natural 1)**:
```
╔═══════════════════════════════════════════╗
║  💀 CRITICAL FAILURE! 💀                  ║
║  🎲 NATURAL 1!                            ║
║                                           ║
║  Your hacking attempt triggered the       ║
║  station's DEFENSE PROTOCOLS!             ║
║                                           ║
║  - Alarm systems activated                ║
║  - 2x Combat Drones deploying             ║
║  - Hull integrity: -15%                   ║
║  - COMBAT INITIATED                       ║
╚═══════════════════════════════════════════╝
```

---

## 🛡️ AI CREW ON EXPEDITIONS

### Taking AI With You

**Benefits**:
- Skill modifiers during encounters
- Unique dialogue and insights
- Special abilities in combat/exploration
- Emotional companionship (narrative)

**Risks**:
- **Can be damaged or destroyed** during encounters
- **Lost AI = lost bonuses** until repaired at homebase
- **Severe damage = memory fragments lost** (regression)
- **Destroyed = permanent death** (unless backed up)

### Backup System

At homebase, you can **create AI backups**:
- **Costs**: Resources + time
- **Benefit**: If AI destroyed, restore from backup
- **Limitation**: Backup doesn't include XP/upgrades since backup was made
- **Strategic Choice**: Backup before dangerous missions vs. speed

### AI Permadeath Risk

```
> COMBAT ENCOUNTER: ROGUE DEFENSE DRONES
> AI CREW: ARIA (Navigation) ACTIVE
> SHIP HULL: 34%

> DRONE ATTACKS SHIP SYSTEMS
> ROLL: d20 Attack vs. Ship Defense
> [ROLL: 18] HIT - Critical systems damaged!

> ARIA CORE HIT - INTEGRITY CHECK
> ROLL: d20 + AI Stability DC 15
> [ROLL: 4 + 1 = 5] CRITICAL FAILURE

╔═══════════════════════════════════════════╗
║  ⚠️ AI CORE CRITICAL DAMAGE ⚠️            ║
║                                           ║
║  ARIA's core has sustained catastrophic   ║
║  damage. Emergency shutdown initiated.    ║
║                                           ║
║  STATUS: OFFLINE (Requires major repair)  ║
║  MEMORY: 60% corrupted                    ║
║  PERSONALITY: Unstable                    ║
║                                           ║
║  Return to homebase for reconstruction.   ║
║  Without backup, some memories are lost.  ║
╚═══════════════════════════════════════════╝

> ARIA: "I... I can't... navigation failing... sorry..."
```

---

## 📊 EXAMPLE RUN FLOW

### 1. Homebase Preparation

```
> HOMEBASE TERMINAL ACTIVE
> Current Power: 100/150 units

AI STATUS:
├─ ARIA (Navigation) - ACTIVE (40 power)
├─ FORGE (Engineering) - ACTIVE (40 power)
├─ CIPHER (Research) - OFFLINE (would need 50 power)
└─ GHOST (Sensors) - OFFLINE (would need 50 power)

FORGE: "We could bring GHOST for better detection, but I'd have to stay behind."
ARIA: "Or keep both of us and risk missing hidden threats. Your call."

> [DECISION: Keep ARIA + FORGE | Switch to ARIA + GHOST]
```

### 2. System Selection

```
> SYSTEM SCAN COMPLETE - 4 OPTIONS AVAILABLE

OPTION 1: KEPLER-442
├─ Star: G-Type (Medium radiation)
├─ Threat: MODERATE | Reward: MEDIUM
└─ POIs: 3 Planets, 1 Station, Distress Signal

OPTION 2: VEGA-7
├─ Star: A-Type (High radiation)
├─ Threat: HIGH | Reward: HIGH
└─ POIs: Dyson Sphere, Surge Zone, Conflict Zone

OPTION 3: BARNARD'S REFUGE
├─ Star: M-Type (Low radiation)
├─ Threat: LOW | Reward: LOW
└─ POIs: 2 Moons, Asteroid Belt, O'Neill Cylinder

> SELECT DESTINATION [1-3]
```

### 3. Arrival & Initial Scan

```
> JUMPING TO: KEPLER-442
> ROLL: Navigation (d20+2) DC 10
> [ROLL: 15+2 = 17] SUCCESS - Clean arrival

> LONG-RANGE SCAN INITIATED
> Current Position: Heliosphere Edge (9.2B km from sun)
> Surge Radiation: MEDIUM (distance-dependent)
> Plasma Wake: 10 (LOW)

POIs DETECTED:
├─ PLANET [LARGE] (1.8M km) - Gas Giant
├─ PLANET [MEDIUM] (3.4M km) - Rocky, Atmosphere Traces
├─ PLANET [SMALL] (5.9M km) - Barren
├─ ORBITAL STATION (3.6M km) - Faint Power Signature
└─ DISTRESS SIGNAL (4.2M km) - Active Transmission

> FORGE: "Station might have parts. Or trouble."
> ARIA: "Distress could be survivors. Or bait."
```

### 4. Investigation & Discovery

```
> APPROACHING: ORBITAL STATION (3.6M km)
> Travel Time: 2 hours | Plasma Wake: +10 (Now 20)
> Surge Damage: 1d4 = 2 (Hull: 98%)

> ROLL: Close-Range Scan (d20 + Sensors) DC 12
> [ROLL: 11 + 0 = 11] FAILURE - Scan incomplete

ARIA: "Something's interfering with sensors. Could be natural. Could be jamming."

> OPTIONS:
  [1] Dock immediately (risky, no intel)
  [2] Circle and scan again (more time, more Wake)
  [3] Hail the station (comms check)
  [4] Abort and investigate distress signal instead

> CHOICE: 3 (Hail Station)

> ROLL: Comms Check (d20 + Comms) DC 14
> [ROLL: 9 + 2 = 11] FAILURE

> No response. Station appears dead... or silent by choice.
> FORGE: "Don't like this. Too quiet."

> Dock anyway? [Y/N]
```

### 5. Encounter

```
> DOCKING WITH STATION...
> ROLL: Docking Procedure (d20 + Navigation) DC 10
> [ROLL: 16 + 2 = 18] SUCCESS - Secure dock

> BOARDING STATION...
> INTERIOR: Dark, auxiliary power only
> ATMOSPHERE: Breathable (barely)

> ROLL: Perception Check (d20) DC 13
> [ROLL: 17] SUCCESS

You notice scorch marks on the walls. Recent. Whatever happened here wasn't long ago.

> EXPLORING DEEPER...

> ROLL: Random Encounter (d20) DC 15
> [ROLL: 19] ENCOUNTER TRIGGERED

╔═══════════════════════════════════════════╗
║  ⚠️ HOSTILE DETECTED ⚠️                   ║
║                                           ║
║  ROGUE SECURITY DRONE - ACTIVE            ║
║  Damaged but operational.                 ║
║  Hostile programming intact.              ║
║                                           ║
║  INITIATIVE ROLL (d20 + Navigation)       ║
║  You: [ROLL: 12 + 2 = 14]                 ║
║  Drone: [ROLL: 8]                         ║
║                                           ║
║  YOU ACT FIRST                            ║
╚═══════════════════════════════════════════╝

> COMBAT OPTIONS:
  [1] Fire weapons (d20 + Weapons) DC 13
  [2] Hack drone (d20 + Comms) DC 16
  [3] Evade and flee (d20 + Engines) DC 12
  [4] Use environment (d20 + Intelligence) DC 14
```

---

**STATUS**: Core mechanics documented  
**NEXT**: Implement dice rolling UI component and system seed generator

