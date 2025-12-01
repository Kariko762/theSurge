# Ship Combat Stats - Quick Reference

## Signature Radius (SR) - Our AC System

**Lower SR = Harder to Hit = Better**

Think of SR like a reverse AC:
- In D&D: Higher AC = harder to hit
- In our system: **Lower SR = harder to hit**

### Why "Signature Radius"?
Represents the ship's detectability and targetability:
- Smaller ships = lower SR (harder to lock on)
- ECM systems reduce SR (jamming, stealth)
- Cover reduces effective SR (obstacles)
- Disabled systems increase SR (easier to target)

### Attack Roll Formula
```javascript
d20 + attackBonus + weaponBonus >= targetSR
```

---

## Initiative - Who Goes First

**Formula:** `d20 + initiative modifier`

### Initiative Sources (ALL CUMULATIVE):

| Source | Bonus | Required? |
|--------|-------|-----------|
| **Ship Class Base** | +0 to +5 | Yes (intrinsic to hull) |
| **Nav Computer** | +1 to +2 | Yes (mandatory component) |
| **Sensors** | +1 to +3 | Recommended |
| **Combat Computer** | +1 to +3 | Optional |
| **Stealth Field** | +2 | Optional |

### Example Build (Player Frigate):
```
Base (Frigate):        +2
Nav Advanced:          +2
Sensors Long:          +2
Combat Computer Mk-I:  +1
─────────────────────────
Total Initiative:      +7
```

---

## Component Modifier System

### How It Works:
1. **Ship Class** provides base stats (hull, SR, speed, initiative, etc.)
2. **Components** modify those base stats
3. **Power Allocation** scales component effectiveness (0-200%)

### Example: Signature Radius
```
Base SR (Frigate):     45
ECM Advanced:          -20  (stealth/jamming)
Stealth Field:         -30  (more stealth)
─────────────────────────
Final SR:              15 (very hard to hit!)
```

---

## Critical Components That Affect Combat

### Nav Computer (MANDATORY)
**Every ship must have one**
- Handles jump calculations
- Contributes to initiative
- No ship operates without one

### Sensors (HIGHLY RECOMMENDED)
- Extends detection range
- Boosts initiative (faster threat detection)
- Advanced sensors can boost attack bonus

### Combat Computer (OPTIONAL)
- Increases attack accuracy
- Boosts initiative
- Improves evasion (predictive maneuvering)

### ECM/Stealth (DEFENSIVE)
- Reduces SR (harder to hit)
- Jams enemy sensors
- Stealth fields can boost initiative

### Engines (MOBILITY)
- Increases speed
- Improves evasion (maneuverability)
- Affects fuel efficiency

---

## Ship Class Comparison

| Stat | Interceptor | Frigate | Cruiser |
|------|------------|---------|---------|
| **SR** | 30 | 45 | 65 |
| **Hull** | 60 | 100 | 250 |
| **Armor** | 5% | 10% | 25% |
| **Initiative** | +5 | +2 | +0 |
| **Speed** | 120 | 80 | 50 |
| **Reactions** | 2 | 1 | 1 |
| **Weapons** | 1 | 2 | 4 |
| **Role** | Dogfighter | Balanced | Tank |

---

## Weapon Types Quick Ref

| Weapon | Damage | Range | Accuracy | Special |
|--------|--------|-------|----------|---------|
| **Plasma Cannon** | 3d8 | 100/300 | +0 | Standard |
| **Railgun** | 4d6 | 150/500 | +2 | Crit 19-20 |
| **Missile** | 5d8 | 80/250 | -2 | High damage, interceptable |
| **Pulse Laser** | 2d10 | 120/350 | +3 | Fires 2x/action |

---

## Combat Flow (D&D 5e Style)

### 1. Initiative Phase
- All ships roll initiative (d20 + modifier)
- Highest goes first
- Order remains same each round

### 2. Turn Structure
Each ship on their turn:
- **Movement**: Up to speed distance (can split)
- **Action** (×2): Attack, Maneuver, Repair, Scan, etc.
- **Bonus Action** (×1): Quick actions (shield boost, power reroute)
- **Reaction** (×1+): Triggered responses (point defense, counterfire)

### 3. Attack Resolution
```
1. Declare target + weapon
2. Roll d20 + bonuses
3. Compare to target SR
4. On hit: Roll damage dice
5. Apply armor reduction
6. Subtract from shields/hull
```

### 4. Round End
- When all ships have acted, round ends
- Start new round at step 1 (same initiative order)

---

## Cover Bonuses (Like D&D)

| Cover Type | SR Modifier | Example |
|------------|-------------|---------|
| **None** | +0 | Open space |
| **Partial** | -5 | Asteroid, debris field |
| **Heavy** | -10 | Space station, large wreck |
| **Total** | Cannot target | Behind planet |

**Remember:** Lower SR = harder to hit, so -5 and -10 are defensive bonuses!

---

## Power Allocation Strategy

Components can be set to 0-200% power:

**100%** = Normal operation
**150%** = Overcharged (+50% effectiveness, +50% power draw)
**50%** = Reduced power (-50% effectiveness, -50% power draw)
**0%** = Offline (no effect, no power draw)

### Example Tactics:
- **Combat Mode**: Weapons 150%, Engines 150%, Sensors 50%
- **Stealth Mode**: ECM 200%, Engines 100%, Weapons 0%
- **Survey Mode**: Sensors 200%, Shields 100%, Weapons 0%

---

## Design Philosophy

### Core Principles:
1. **Ship class defines base stats** (no "naked" combat effectiveness)
2. **Components provide modifiers** (all bonuses come from equipment)
3. **Lower SR = Better defense** (thematic for stealth/detection)
4. **Nav computers are mandatory** (can't navigate without one)
5. **Sensors affect combat readiness** (initiative, targeting)
6. **Action economy prevents alpha strikes** (like D&D)

### Why This Way?
- **Familiar to RPG players** (D&D combat flow)
- **Strategic depth** (loadout customization matters)
- **Thematic consistency** (space combat = sensors + stealth)
- **Scalable** (easy to add new components/ship classes)
- **Balanced** (no single dominant strategy)

---

## Stat Breakpoints

### Initiative Tiers:
- **+0 to +3**: Slow (cruisers, haulers)
- **+4 to +7**: Average (frigates, corvettes)
- **+8 to +12**: Fast (interceptors, scouts)
- **+13+**: Lightning (experimental/special builds)

### SR Tiers:
- **5-20**: Extremely hard to hit (stealth builds)
- **21-40**: Hard to hit (light ships, ECM)
- **41-60**: Standard (frigates, destroyers)
- **61-80**: Easy to hit (cruisers, capitals)
- **81+**: Very easy to hit (stations, haulers)

### Damage Per Round (DPR) Estimates:
- **1 weapon @ 3d8**: ~13 avg damage
- **2 weapons @ 3d8**: ~26 avg damage
- **1 weapon @ 5d8 (missile)**: ~22 avg damage
- **1 weapon @ 2d10 × 2 (pulse laser)**: ~22 avg damage

---

## Component Slot Planning

### Essential Loadout (Frigate):
1. Nav Computer (mandatory)
2. Power Core (mandatory)
3. Engine (mandatory)
4. Sensors (highly recommended)
5. Shield Generator (defensive)
6. Weapon (offensive)
7. Combat Computer (accuracy/initiative)
8. Hull Plating (armor)

### Optional Slots:
- ECM (if stealth/evasion build)
- Point Defense (if facing missiles)
- AI Cores (role bonuses)
- Additional weapons

---

## Quick Start Loadouts

### **Balanced Frigate** (SS-ARKOSE default)
```
Nav Advanced, Sensors Long, Combat Computer Mk-I
Engine Ion, Shield Mk-II, Power RFE
Weapon: Plasma Cannon
Result: +7 initiative, SR 45, balanced offense/defense
```

### **Stealth Interceptor**
```
Nav Advanced, Sensors Deep, Stealth Field
Engine Plasma, Shield Mk-I, Power Fusion
Weapon: Pulse Laser
Result: +12 initiative, SR 15, hit-and-run
```

### **Tank Cruiser**
```
Nav Basic, Sensors Long, Combat Computer Mk-II
Engine Ion, Shield Mk-III, Power Fusion
Weapons: 2× Railgun, 1× Missile
Result: +4 initiative, SR 50, high armor/shields
```

---

This system gives you **D&D-quality tactical combat** in a space setting! 🚀
