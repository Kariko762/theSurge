# Ship Creation & Faction Reference Guide

**Complete documentation for creating ships and understanding the factions of *The Surge***

---

# Part 1: Ship Creation System

## Ship Object Structure

Every ship in the system follows this exact structure:

```javascript
{
  "id": "ship_unique_id",
  "name": "Ship Display Name",
  "class": "fighter|corvette|frigate|destroyer|cruiser|battleship|carrier|freighter",
  "tier": 1-5,
  "manufacturer": "Manufacturer Name",
  "faction": "Faction ID or null",
  "description": "Ship description text",
  "playerLevelRequired": 1-50,
  
  "baseStats": {
    "hull": 100-5000,
    "shields": 50-3000,
    "power": 50-500,
    "cargo": 20-1000,
    "speed": 20-100,
    "agility": 20-100
  },
  
  "fuelCapacity": {
    "min": 50-500,
    "max": 100-1000
  },
  
  "engine": "engine_id",
  
  "weaponSlots": {
    "slot_1": "weapon_id or null",
    "slot_2": "weapon_id or null"
    // ... up to slot_8 depending on class
  },
  
  "subsystemSlots": {
    "slot_1": "subsystem_id or null",
    "slot_2": "subsystem_id or null"
    // ... up to slot_8 depending on class
  },
  
  "aiCores": {
    "slot_1": "ai_core_id or null",
    "slot_2": "ai_core_id or null"
    // ... adjustable 1-6 slots
  },
  
  "aiCoreSlots": 1-6,
  
  "tierBonuses": ["tier_bonus_id_1", "tier_bonus_id_2"],
  
  "cost": 1000-1000000,
  
  "unlockRequirements": {
    "level": 1-50,
    "faction": "faction_id or null",
    "reputation": 0-100,
    "missions": ["mission_id"]
  },
  
  "enabled": true
}
```

## Ship Classes & Slot Configurations

Each class has specific slot counts and level requirements:

| Class | Weapon Slots | Subsystem Slots | Min Level | Max Level | Role |
|-------|--------------|-----------------|-----------|-----------|------|
| **fighter** | 2 | 2 | 1 | 10 | Fast, agile interceptor |
| **corvette** | 3 | 3 | 1 | 15 | Light patrol vessel |
| **frigate** | 4 | 4 | 5 | 20 | Medium combat ship |
| **destroyer** | 5 | 5 | 10 | 25 | Heavy escort |
| **cruiser** | 6 | 6 | 15 | 30 | Mainline warship |
| **battleship** | 8 | 7 | 20 | 35 | Heavy capital ship |
| **carrier** | 4 | 8 | 20 | 35 | Support/systems ship |
| **freighter** | 2 | 6 | 1 | 20 | Cargo transport |

**AI Core Slots:** Adjustable from 1-6 regardless of class (configurable in UI)

## Base Stats Guidelines

Recommended stat ranges by ship class:

```javascript
{
  fighter: { 
    hull: 100-300, shields: 50-150, power: 50-100, 
    cargo: 20-50, speed: 80-100, agility: 80-100 
  },
  corvette: { 
    hull: 250-500, shields: 100-250, power: 75-150, 
    cargo: 40-100, speed: 70-90, agility: 70-90 
  },
  frigate: { 
    hull: 450-800, shields: 200-400, power: 125-200, 
    cargo: 80-200, speed: 60-80, agility: 60-80 
  },
  destroyer: { 
    hull: 750-1200, shields: 350-600, power: 175-275, 
    cargo: 150-300, speed: 50-70, agility: 50-70 
  },
  cruiser: { 
    hull: 1100-1800, shields: 500-900, power: 225-350, 
    cargo: 250-500, speed: 40-60, agility: 40-60 
  },
  battleship: { 
    hull: 2000-3500, shields: 1000-2000, power: 350-500, 
    cargo: 400-800, speed: 30-50, agility: 30-50 
  },
  carrier: { 
    hull: 1800-3000, shields: 800-1500, power: 300-450, 
    cargo: 600-1000, speed: 35-55, agility: 35-55 
  },
  freighter: { 
    hull: 600-1000, shields: 200-400, power: 100-175, 
    cargo: 500-1500, speed: 40-60, agility: 40-60 
  }
}
```

## Available Equipment IDs

### Engines (Equipment Category)

```javascript
"engine_fighter_t1"    // Thrust: 80,  Agility: 95,  Cost: 2000cr  (Fighter class)
"engine_corvette_t1"   // Thrust: 100, Agility: 75,  Cost: 3500cr  (Corvette class)
"engine_frigate_t2"    // Thrust: 130, Agility: 60,  Cost: 6000cr  (Frigate class)
"engine_cruiser_t3"    // Thrust: 180, Agility: 45,  Cost: 12000cr (Cruiser class)
```

**Note:** Each engine is class-specific. Match engine to ship class.

### Weapons

```javascript
// LASER WEAPONS
"pulse_laser_mk1"      // Damage: 15,  Range: 200,  FireRate: 2,   Tier: common    (500cr)
"pulse_laser_mk2"      // Damage: 22,  Range: 250,  FireRate: 2.5, Tier: uncommon  (1200cr)
"beam_laser"           // Damage: 35,  Range: 300,  FireRate: 5,   Tier: rare      (2500cr)

// MISSILE WEAPONS
"missile_launcher_light"  // Damage: 40,  Range: 500,  FireRate: 0.5, Tracking: true, Tier: common (600cr)
"missile_launcher_heavy"  // Damage: 120, Range: 800,  FireRate: 0.2, Tracking: true, Tier: rare   (3500cr)

// KINETIC WEAPONS
"autocannon"           // Damage: 8,   Range: 300,  FireRate: 10,  Tier: common    (700cr)
"railgun_mk1"          // Damage: 50,  Range: 600,  FireRate: 1,   ArmorPiercing,  Tier: uncommon (1800cr)

// ADVANCED WEAPONS
"plasma_cannon"        // Damage: 80,  Range: 350,  FireRate: 1.5, Thermal,        Tier: epic (8000cr)
```

### Subsystems

```javascript
// SHIELD SYSTEMS
"shield_capacitor"        // No direct stats listed, Tier: rare (850cr)
"shield_generator_mk1"    // Strength: 100, Recharge: 10,  Tier: common   (1200cr)
"shield_generator_mk2"    // Strength: 175, Recharge: 18,  Tier: uncommon (2500cr)

// ECM (Electronic Countermeasures)
"ecm_suite_basic"      // Evasion: 10, Jamming: 15,               Tier: common (800cr)
"ecm_suite_advanced"   // Evasion: 25, Jamming: 40, Decoys: 3,    Tier: rare   (2800cr)

// SENSOR ARRAYS
"sensor_array_standard"   // Range: 500,  Accuracy: 15,             Tier: common   (600cr)
"sensor_array_longrange"  // Range: 1200, Accuracy: 25, Gravitic,   Tier: uncommon (1500cr)

// POWER SYSTEMS
"power_core_compact"   // Output: 100, Efficiency: 80,             Tier: common (900cr)
"power_core_military"  // Output: 250, Efficiency: 90, Overcharge, Tier: rare   (4500cr)

// HULL & CARGO
"hull_plating_reinforced"  // Armor: 50, HullBonus: 25,  Tier: uncommon (1800cr)
"cargo_expander"           // CargoBonus: 50,            Tier: common   (800cr)
```

### FTL Drives (Optional Equipment)

```javascript
"ftl_drive_basic"      // Range: 10 ly, ChargeTime: 30s, Tier: uncommon (15000cr)
```

## Tier Bonus System

Ships can have **tier bonuses** applied (stored in `backend/data/ship_tiers.json`). These are IDs of bonus effects:

**Bonus Types:**
- **standard** - Basic upgrades
- **advanced** - Enhanced upgrades

**Example Tier Bonus Structure:**
```javascript
{
  "id": "tier_bonus_hull_1",
  "name": "Reinforced Hull I",
  "type": "standard",
  "tier": 1,
  "description": "Basic hull reinforcement",
  "effects": {
    "hull": 50,
    "armor": 10
  },
  "tags": ["hull", "defense"]
}
```

**Common Effect Types:**
- `hull` - Increase hull points
- `shields` - Increase shield capacity
- `power` - Increase power capacity
- `speed` - Increase speed
- `agility` - Increase agility
- `accuracy` - Increase weapon accuracy
- `evasion` - Increase evasion
- `initiative` - Increase combat initiative

**Tier Progression:**
- **Tier 1 ships:** 0-2 bonus slots
- **Tier 2 ships:** 1-3 bonus slots
- **Tier 3 ships:** 2-4 bonus slots
- **Tier 4 ships:** 3-5 bonus slots
- **Tier 5 ships:** 4-6 bonus slots

## Unlock Requirements

Control when ships become available to players:

```javascript
"unlockRequirements": {
  "level": 1-50,              // Minimum player level
  "faction": "faction_id",    // Required faction affiliation (or null)
  "reputation": 0-100,        // Minimum faction reputation (0-100)
  "missions": ["mission_id"]  // Missions that must be completed
}
```

**Examples:**
```javascript
// Starter ship - no requirements
{ "level": 1, "faction": null, "reputation": 0, "missions": [] }

// Mid-tier ship - level locked
{ "level": 15, "faction": null, "reputation": 0, "missions": [] }

// Faction ship - reputation locked
{ "level": 10, "faction": "utd", "reputation": 50, "missions": [] }

// Mission reward ship
{ "level": 5, "faction": null, "reputation": 0, "missions": ["mission_rescue_convoy"] }
```

## AI Cores

AI core slots are **dynamically adjustable** (1-6 slots). The UI allows changing `aiCoreSlots` value.

**Structure:**
```javascript
"aiCores": {
  "slot_1": null,  // or "ai_core_id"
  "slot_2": null,
  "slot_3": null   // only if aiCoreSlots >= 3
},
"aiCoreSlots": 2  // Number of available slots (1-6)
```

**Note:** AI core definitions are stored in `backend/data/config.json` in the `aiCrew` object.

## Ship Costs

Recommended pricing by tier and class:

```javascript
{
  tier_1: { 
    fighter: 5000-15000,   corvette: 15000-30000,   frigate: 30000-60000    
  },
  tier_2: { 
    fighter: 15000-35000,  corvette: 30000-70000,   frigate: 60000-120000   
  },
  tier_3: { 
    fighter: 35000-75000,  corvette: 70000-140000,  frigate: 120000-250000  
  },
  tier_4: { 
    destroyer: 250000-500000, cruiser: 500000-900000 
  },
  tier_5: { 
    battleship: 900000-2000000, carrier: 1000000-2500000 
  }
}
```

## Validation Rules

**Required Fields:**
- ✅ `id` - Must be unique, format: `ship_<name>_<variant>`
- ✅ `name` - Display name (string)
- ✅ `class` - Must match one of 8 classes
- ✅ `tier` - Must be 1-5
- ✅ `baseStats` - All 6 stats required (hull, shields, power, cargo, speed, agility)
- ✅ `engine` - Must be valid engine ID
- ✅ `weaponSlots` - Slot count must match class definition
- ✅ `subsystemSlots` - Slot count must match class definition
- ✅ `aiCores` - Slot count must match `aiCoreSlots` value
- ✅ `cost` - Must be positive integer
- ✅ `enabled` - Boolean (true/false)

**Optional Fields:**
- `manufacturer` - String or null
- `faction` - Faction ID or null
- `description` - String
- `playerLevelRequired` - Defaults to class min level
- `fuelCapacity` - Can be omitted (defaults applied)
- `tierBonuses` - Can be empty array
- `unlockRequirements` - Can be minimal object

## Example Ships

### Example 1: Basic Tier 1 Fighter

```javascript
{
  "id": "ship_eagle_mk1",
  "name": "Eagle Mk1 Interceptor",
  "class": "fighter",
  "tier": 1,
  "manufacturer": "Corsair Aerospace",
  "faction": null,
  "description": "A nimble light fighter popular with independent pilots. Fast, cheap, and reliable.",
  "playerLevelRequired": 1,
  
  "baseStats": {
    "hull": 150,
    "shields": 80,
    "power": 60,
    "cargo": 25,
    "speed": 90,
    "agility": 95
  },
  
  "fuelCapacity": { "min": 80, "max": 120 },
  
  "engine": "engine_fighter_t1",
  
  "weaponSlots": {
    "slot_1": "pulse_laser_mk1",
    "slot_2": "missile_launcher_light"
  },
  
  "subsystemSlots": {
    "slot_1": "sensor_array_standard",
    "slot_2": "shield_generator_mk1"
  },
  
  "aiCores": {
    "slot_1": null,
    "slot_2": null
  },
  "aiCoreSlots": 2,
  
  "tierBonuses": [],
  
  "cost": 12000,
  
  "unlockRequirements": {
    "level": 1,
    "faction": null,
    "reputation": 0,
    "missions": []
  },
  
  "enabled": true
}
```

### Example 2: Mid-Tier Frigate with Bonuses

```javascript
{
  "id": "ship_hammer_class_frigate",
  "name": "Hammer-Class Frigate",
  "class": "frigate",
  "tier": 3,
  "manufacturer": "Federation Shipyards",
  "faction": "utd",
  "description": "A robust medium warship favored by UTD patrol groups. Well-balanced for extended operations.",
  "playerLevelRequired": 12,
  
  "baseStats": {
    "hull": 650,
    "shields": 350,
    "power": 175,
    "cargo": 150,
    "speed": 65,
    "agility": 70
  },
  
  "fuelCapacity": { "min": 250, "max": 400 },
  
  "engine": "engine_frigate_t2",
  
  "weaponSlots": {
    "slot_1": "beam_laser",
    "slot_2": "pulse_laser_mk2",
    "slot_3": "missile_launcher_heavy",
    "slot_4": "railgun_mk1"
  },
  
  "subsystemSlots": {
    "slot_1": "shield_generator_mk2",
    "slot_2": "ecm_suite_advanced",
    "slot_3": "sensor_array_longrange",
    "slot_4": "power_core_military"
  },
  
  "aiCores": {
    "slot_1": null,
    "slot_2": null,
    "slot_3": null
  },
  "aiCoreSlots": 3,
  
  "tierBonuses": ["tier_bonus_hull_2", "tier_bonus_shields_2"],
  
  "cost": 145000,
  
  "unlockRequirements": {
    "level": 12,
    "faction": "utd",
    "reputation": 35,
    "missions": []
  },
  
  "enabled": true
}
```

### Example 3: High-End Battleship

```javascript
{
  "id": "ship_titan_battleship",
  "name": "Titan-Class Battleship",
  "class": "battleship",
  "tier": 5,
  "manufacturer": "Imperial Forge",
  "faction": "kaelorii",
  "description": "A massive capital ship bristling with weaponry. The pinnacle of Kaelorii military engineering.",
  "playerLevelRequired": 28,
  
  "baseStats": {
    "hull": 3200,
    "shields": 1800,
    "power": 480,
    "cargo": 650,
    "speed": 42,
    "agility": 38
  },
  
  "fuelCapacity": { "min": 450, "max": 800 },
  
  "engine": "engine_cruiser_t3",
  
  "weaponSlots": {
    "slot_1": "plasma_cannon",
    "slot_2": "plasma_cannon",
    "slot_3": "beam_laser",
    "slot_4": "beam_laser",
    "slot_5": "railgun_mk1",
    "slot_6": "missile_launcher_heavy",
    "slot_7": "missile_launcher_heavy",
    "slot_8": "autocannon"
  },
  
  "subsystemSlots": {
    "slot_1": "shield_generator_mk2",
    "slot_2": "shield_generator_mk2",
    "slot_3": "power_core_military",
    "slot_4": "ecm_suite_advanced",
    "slot_5": "sensor_array_longrange",
    "slot_6": "hull_plating_reinforced",
    "slot_7": "cargo_expander"
  },
  
  "aiCores": {
    "slot_1": null,
    "slot_2": null,
    "slot_3": null,
    "slot_4": null,
    "slot_5": null
  },
  "aiCoreSlots": 5,
  
  "tierBonuses": [
    "tier_bonus_hull_5",
    "tier_bonus_shields_5",
    "tier_bonus_accuracy_3",
    "tier_bonus_initiative_4"
  ],
  
  "cost": 1750000,
  
  "unlockRequirements": {
    "level": 28,
    "faction": "kaelorii",
    "reputation": 80,
    "missions": ["mission_kaelorii_loyalty_proven"]
  },
  
  "enabled": true
}
```

## Quick Reference Checklist

When creating a new ship:

1. ✅ Choose ship class (determines slot counts)
2. ✅ Set tier (1-5)
3. ✅ Define base stats (match class guidelines)
4. ✅ Select matching engine for class
5. ✅ Fill weapon slots (count matches class)
6. ✅ Fill subsystem slots (count matches class)
7. ✅ Set AI core slots (1-6, adjustable)
8. ✅ Add tier bonuses (0-6 based on tier)
9. ✅ Set cost (use tier/class pricing guide)
10. ✅ Configure unlock requirements
11. ✅ Set `enabled: true`
12. ✅ Assign unique ID

**File Location:** Ships are stored in `backend/data/ships.json`

---

# Part 2: Factions of *The Surge*

## Overview

The galaxy after *The Surge* is a fractured landscape where remnants of humanity struggle alongside alien civilizations. Each faction brings unique technology, culture, and military doctrine to the conflict over resources, territory, and survival.

---

## 1. United Terran Directorate (UTD)

**Faction ID:** `utd`  
**Type:** Human Government  
**Theme:** Militarised, structured, lawful, survival-driven

### Key Features

* The last functional remnant of humanity's pre-Surge government.
* Highly disciplined fleets, durable vessels, defensive doctrines.
* Bureaucratic, rigid, but perceived as stabilising order.
* Controls a handful of fortified systems and beacon worlds.
* Prioritises civilian preservation and long-term reconstruction.
* Often at odds with freedom groups and scavenger clans.

### Ship Characteristics

- **Design Philosophy:** Durable, balanced, defensive
- **Typical Loadouts:** Shield generators, sensor arrays, railguns
- **Color Scheme:** Military grey, blue trim, formal insignias
- **Manufacturers:** Federation Shipyards, Terran Defense Industries

### Reputation Mechanics

- **Gain Reputation:** Completing missions for UTD stations, protecting convoys, eliminating pirates
- **Lose Reputation:** Attacking UTD vessels, smuggling, aiding rebels
- **Benefits:** Access to military-grade weapons, discounted repairs at UTD stations, escort missions

---

## 2. Hex-Corp

**Faction ID:** `hexcorp`  
**Type:** Human Megacorporation  
**Theme:** Hyper-industrial, paramilitary, technocratic

### Key Features

* Wealth-hoarding corporate remnant operating black-ops extraction fleets.
* Masters of Khyrelium refinement and exotic tech salvage.
* Ships are efficient, modular, high-output but fragile without escorts.
* Known for ruthless efficiency and exploitative operations.
* Has secret AIs, hidden labs, and private "security" task forces.
* Neither allies nor enemies — pragmatically self-serving.

### Ship Characteristics

- **Design Philosophy:** Efficient, modular, high-damage output
- **Typical Loadouts:** Plasma cannons, power cores, cargo expanders
- **Color Scheme:** Corporate white/gold, angular designs, logo branding
- **Manufacturers:** Hex-Corp Industries, Advanced Systems Division

### Reputation Mechanics

- **Gain Reputation:** Salvage missions, material delivery, corporate contracts
- **Lose Reputation:** Stealing from Hex-Corp facilities, exposing secrets
- **Benefits:** Exclusive high-tech equipment, mining contracts, experimental weapons

---

## 3. The Free Meridian (Freedom Front)

**Faction ID:** `free_meridian`  
**Type:** Human Rebel / Anti-Government  
**Theme:** Guerrilla, nomadic, improvised tech

### Key Features

* Anti-authoritarian freedom movement formed after the collapse.
* Specialists in stealth, ECM, sabotage and hit-and-run warfare.
* Operate retrofitted ships with unpredictable modifications.
* Seen as terrorists by the UTD and opportunists by Hex-Corp.
* Protect drifting colonies and anti-authoritarian enclaves.

### Ship Characteristics

- **Design Philosophy:** Stealth, agility, improvised modifications
- **Typical Loadouts:** ECM suites, missile launchers, evasive systems
- **Color Scheme:** Matte black, red accents, graffiti markings
- **Manufacturers:** Independent shipyards, salvaged components

### Reputation Mechanics

- **Gain Reputation:** Sabotage missions, rescuing refugees, attacking UTD/Hex-Corp
- **Lose Reputation:** Working for governments, corporate contracts
- **Benefits:** Black market access, stealth equipment, safe havens in outer systems

---

## 4. Kaelorii Ascendancy

**Faction ID:** `kaelorii`  
**Type:** Alien Species  
**Theme:** Psychic resonance, crystalline bio-tech

### Key Features

* Ethereal, luminous beings with semi-crystalline exoskeleton structures.
* Ships glide rather than thrust — resonance engines & harmonic shields.
* Combat style relies on guided energy lances and "pulse overloading."
* Rarely hostile; territorial but diplomatic.
* Their worlds bloom with living spires and bio-luminescent cities.

### Ship Characteristics

- **Design Philosophy:** Organic curves, energy-based systems, graceful movement
- **Typical Loadouts:** Beam lasers, harmonic shields, resonance drives
- **Color Scheme:** Iridescent blues/purples, crystalline structures, bioluminescence
- **Manufacturers:** Kaelorii Resonance Forges

### Reputation Mechanics

- **Gain Reputation:** Scientific cooperation, diplomatic missions, protecting their territories
- **Lose Reputation:** Damaging their bio-structures, aggressive expansion
- **Benefits:** Energy weapon technology, advanced shields, resonance-based equipment

---

## 5. Threxul Brood-Clans

**Faction ID:** `threxul`  
**Type:** Alien Species  
**Theme:** Hive-social, multi-limbed apex predators

### Key Features

* Brutal, ancient species with chitin warships grown rather than built.
* Combat doctrine: swarm, overwhelm, devour, disable engines first.
* Ship components are living bio-weapons — spore cannons, acid torpedoes.
* Maintain rigid brood hierarchies; honour through conquest.
* Fearsome reputation; systems they inhabit become "graveyards."

### Ship Characteristics

- **Design Philosophy:** Organic hulls, bio-weapons, swarm tactics
- **Typical Loadouts:** Spore cannons, acid projectors, regenerative hulls
- **Color Scheme:** Dark chitin browns/blacks, organic textures, bone-like structures
- **Manufacturers:** Brood-grown vessels (living ships)

### Reputation Mechanics

- **Gain Reputation:** Combat victories, duels of honor, proving strength
- **Lose Reputation:** Fleeing combat, showing weakness, refusing challenges
- **Benefits:** Bio-weapon systems, regenerative technology, brood contracts

---

## 6. Varrkel Nomad-Forges

**Faction ID:** `varrkel`  
**Type:** Alien Species  
**Theme:** Brutalist engineering, metal-morph forges, radiation-tolerant

### Key Features

* Wanderer race dwelling in radiation belts and stellar debris fields.
* Ships are asymmetrical, plated, and retrofit themselves mid-flight.
* Weapons: rail-hammers, arc-bolts, slag-pulse emitters.
* Traders, salvagers, and pragmatic allies if well-paid.
* Honour system tied to craftsmanship, not warfare.

### Ship Characteristics

- **Design Philosophy:** Asymmetrical, heavily armored, adaptive systems
- **Typical Loadouts:** Railguns, hull plating, power-intensive weapons
- **Color Scheme:** Oxidized metals, rust patterns, industrial aesthetic
- **Manufacturers:** Nomad-Forge clans (each ship unique)

### Reputation Mechanics

- **Gain Reputation:** Trading, salvage contracts, craftsmanship appreciation
- **Lose Reputation:** Destroying crafted items, dishonoring trades
- **Benefits:** Unique modifications, custom weapons, forge access

---

## 7. The Oryndril Exchange

**Faction ID:** `oryndril`  
**Type:** Multispecies Neutral Consortium  
**Theme:** Diplomatic, trade-focused, knowledge-preserving

### Key Features

* Floating trade stations operating as neutral havens across the ruined galaxy.
* They maintain ancient star charts and pre-Surge archives.
* Ships have no weapons — but unmatched jump-range and sensors.
* Act as mediators between factions, sometimes reluctantly.
* Their influence keeps small pockets of civilisation alive.

### Ship Characteristics

- **Design Philosophy:** Unarmed, long-range, diplomatic vessels
- **Typical Loadouts:** Advanced sensors, FTL drives, cargo expanders
- **Color Scheme:** Neutral whites/silvers, ornate diplomatic markings
- **Manufacturers:** Multi-species collaborative shipyards

### Reputation Mechanics

- **Gain Reputation:** Trading, mediation missions, knowledge sharing
- **Lose Reputation:** Attacking neutral zones, breaking treaties
- **Benefits:** Universal docking rights, rare trade goods, ancient knowledge access

---

## 8. Ashinari Veilclan

**Faction ID:** `ashinari`  
**Type:** Human-Derived (Culturally distinct)  
**Theme:** Cyber-samurai assassins, honour duels, stealth warfare

### Key Features

* Isolationist splinter of humanity who merged warrior tradition with cybernetics.
* Ships emphasise precision, stealth, phase-slash weapons, and singular lethal strikes.
* Combat style: hit once, disappear, punish overextension.
* Strict honour code: duel challenges, protector oaths, shadow-edicts.
* Feared elite assassins and guardians hired only through ritual vows.

### Ship Characteristics

- **Design Philosophy:** Precision, stealth, single-strike lethality
- **Typical Loadouts:** Phase weapons, stealth systems, precision targeting
- **Color Scheme:** Black/silver, elegant lines, ceremonial markings
- **Manufacturers:** Veilclan forges (ceremonially crafted)

### Reputation Mechanics

- **Gain Reputation:** Honor duels, contract fulfillment, protecting oaths
- **Lose Reputation:** Dishonorable combat, oath-breaking, cowardice
- **Benefits:** Stealth technology, assassination contracts, elite training

---

## Faction Relationships Matrix

| Faction | UTD | Hex-Corp | Free Meridian | Kaelorii | Threxul | Varrkel | Oryndril | Ashinari |
|---------|-----|----------|---------------|----------|---------|---------|----------|----------|
| **UTD** | — | Neutral | Hostile | Friendly | Hostile | Neutral | Friendly | Neutral |
| **Hex-Corp** | Neutral | — | Neutral | Neutral | Neutral | Friendly | Neutral | Neutral |
| **Free Meridian** | Hostile | Neutral | — | Friendly | Hostile | Neutral | Friendly | Neutral |
| **Kaelorii** | Friendly | Neutral | Friendly | — | Hostile | Neutral | Friendly | Neutral |
| **Threxul** | Hostile | Neutral | Hostile | Hostile | — | Neutral | Hostile | Neutral |
| **Varrkel** | Neutral | Friendly | Neutral | Neutral | Neutral | — | Friendly | Neutral |
| **Oryndril** | Friendly | Neutral | Friendly | Friendly | Hostile | Friendly | — | Friendly |
| **Ashinari** | Neutral | Neutral | Neutral | Neutral | Neutral | Neutral | Friendly | — |

### Relationship Descriptions

- **Hostile:** Active conflict, KOS (Kill On Sight) protocols may apply
- **Neutral:** No formal alliance, transactional relationships only
- **Friendly:** Mutual cooperation, trade agreements, defensive pacts

---

## Using Factions in Ship Design

When creating faction-specific ships:

1. **Match Manufacturer to Faction**
   - UTD: "Federation Shipyards", "Terran Defense Industries"
   - Hex-Corp: "Hex-Corp Industries", "Advanced Systems Division"
   - Kaelorii: "Kaelorii Resonance Forges"
   - Threxul: "Brood-Forge [Clan Name]"
   - Varrkel: "Nomad-Forge [Clan Name]"
   - Ashinari: "Veilclan Forge"

2. **Set Faction Field**
   ```javascript
   "faction": "utd"  // or "hexcorp", "kaelorii", etc.
   ```

3. **Apply Faction-Appropriate Equipment**
   - UTD: Balanced loadouts, military-grade systems
   - Hex-Corp: High-damage weapons, industrial equipment
   - Free Meridian: ECM suites, stealth, guerrilla gear
   - Kaelorii: Energy weapons, harmonic systems
   - Threxul: Bio-weapons (when implemented)
   - Varrkel: Heavy armor, railguns
   - Ashinari: Precision weapons, stealth systems

4. **Configure Unlock Requirements**
   ```javascript
   "unlockRequirements": {
     "faction": "kaelorii",
     "reputation": 75,  // Higher rep for advanced faction ships
     "level": 20
   }
   ```

---

## Faction-Specific Ship Templates

### UTD Destroyer Example
```javascript
{
  "id": "ship_utd_guardian_destroyer",
  "name": "Guardian-Class Destroyer",
  "class": "destroyer",
  "tier": 4,
  "manufacturer": "Federation Shipyards",
  "faction": "utd",
  "description": "UTD frontline warship. Durable, dependable, and devastating.",
  "baseStats": { "hull": 1100, "shields": 550, "power": 250, "cargo": 280, "speed": 58, "agility": 55 },
  "weaponSlots": {
    "slot_1": "beam_laser",
    "slot_2": "railgun_mk1",
    "slot_3": "railgun_mk1",
    "slot_4": "missile_launcher_heavy",
    "slot_5": "autocannon"
  },
  "unlockRequirements": { "faction": "utd", "reputation": 60, "level": 18 }
}
```

### Hex-Corp Frigate Example
```javascript
{
  "id": "ship_hexcorp_extractor",
  "name": "Extractor-Class Frigate",
  "class": "frigate",
  "tier": 3,
  "manufacturer": "Hex-Corp Industries",
  "faction": "hexcorp",
  "description": "Corporate extraction vessel. High damage output, minimal defense.",
  "baseStats": { "hull": 480, "shields": 220, "power": 190, "cargo": 200, "speed": 72, "agility": 65 },
  "weaponSlots": {
    "slot_1": "plasma_cannon",
    "slot_2": "beam_laser",
    "slot_3": "pulse_laser_mk2",
    "slot_4": "missile_launcher_light"
  },
  "unlockRequirements": { "faction": "hexcorp", "reputation": 45, "level": 12 }
}
```

### Kaelorii Cruiser Example
```javascript
{
  "id": "ship_kaelorii_harmony",
  "name": "Harmony-Spire Cruiser",
  "class": "cruiser",
  "tier": 4,
  "manufacturer": "Kaelorii Resonance Forges",
  "faction": "kaelorii",
  "description": "Elegant alien warship powered by resonance drives.",
  "baseStats": { "hull": 1400, "shields": 850, "power": 310, "cargo": 380, "speed": 52, "agility": 58 },
  "weaponSlots": {
    "slot_1": "beam_laser",
    "slot_2": "beam_laser",
    "slot_3": "beam_laser",
    "slot_4": "pulse_laser_mk2",
    "slot_5": "pulse_laser_mk2",
    "slot_6": "pulse_laser_mk2"
  },
  "subsystemSlots": {
    "slot_1": "shield_generator_mk2",
    "slot_2": "shield_generator_mk2",
    "slot_3": "sensor_array_longrange",
    "slot_4": "power_core_military",
    "slot_5": "ecm_suite_basic",
    "slot_6": "hull_plating_reinforced"
  },
  "unlockRequirements": { "faction": "kaelorii", "reputation": 70, "level": 22 }
}
```

---

## Next Steps

**For Ship Creation:**
- Implement ships in `backend/data/ships.json`
- Test in Ship Manager UI (`/admin/ships`)
- Balance stats against tier and cost guidelines

**For Faction Integration:**
- Update `backend/data/factions.json` with faction details
- Implement reputation tracking system
- Create faction-specific missions and encounters
- Add faction-locked equipment to item pools

---

**Document Version:** 1.0  
**Last Updated:** December 1, 2025  
**Maintained By:** The Surge Development Team
