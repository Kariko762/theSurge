# Ship Management System - Design Specification

## Overview
Ships are the foundation of player progression. Each ship has slots for weapons, subsystems, and AI crew members, with randomized base stats and configurable defaults.

## Ship Data Structure

```javascript
{
  id: "fighter_mk1",
  name: "Vanguard Fighter Mk I",
  description: "A light, maneuverable fighter with balanced capabilities",
  
  // Ship Class/Type
  class: "fighter", // fighter, corvette, frigate, destroyer, capital
  tier: "T0", // T0, T1, T2, T3
  rarity: "common", // common, uncommon, rare, epic, legendary, unique
  
  // Base Stats (with randomization)
  baseStats: {
    hull: { min: 80, max: 120, default: 100 },
    shields: { min: 40, max: 60, default: 50 },
    power: { min: 90, max: 110, default: 100 },
    speed: { min: 4, max: 6, default: 5 },
    cargo: { min: 8, max: 12, default: 10 }
  },
  
  // AI Crew Slots
  aiSlots: {
    min: 1,
    max: 3,
    default: 2,
    variance: 1 // +/- this amount from default
  },
  
  // Weapon Slots
  weaponSlots: [
    { id: "weapon_1", enabled: true, defaultWeapon: "laser_mk1" },
    { id: "weapon_2", enabled: true, defaultWeapon: "laser_mk1" },
    { id: "weapon_3", enabled: false, defaultWeapon: null },
    { id: "weapon_4", enabled: false, defaultWeapon: null }
  ],
  
  // Subsystem Slots (Components)
  subsystemSlots: [
    { id: "subsystem_1", enabled: true, defaultComponent: "shield_generator_mk1" },
    { id: "subsystem_2", enabled: true, defaultComponent: "scanner_basic" },
    { id: "subsystem_3", enabled: true, defaultComponent: "ecm_basic" },
    { id: "subsystem_4", enabled: false, defaultComponent: null },
    { id: "subsystem_5", enabled: false, defaultComponent: null }
  ],
  
  // Metadata
  metadata: {
    author: "system",
    created: "2025-11-23T00:00:00.000Z",
    enabled: true
  }
}
```

## Slot System

### Weapon Slots
- Maximum 4 slots per ship
- Each slot can be enabled/disabled
- Default weapon assignment (can be null)
- Weapons have: type, damage, range, power consumption, etc.

### Subsystem Slots
- Maximum 5 slots per ship
- Each slot can be enabled/disabled
- Default component assignment (can be null)
- Components provide bonuses to stats/skills

### AI Crew Slots
- Variable number based on ship (min/max/default)
- Variance allows randomization (e.g., 2±1 = 1-3 AI)
- Multiple AI can be assigned
- AI provide skill bonuses and special abilities

## Ship Classes

### Fighter
- **Focus**: Speed, maneuverability
- **Weapon Slots**: 2-3
- **Subsystem Slots**: 2-3
- **AI Slots**: 1-2
- **Cargo**: Low

### Corvette
- **Focus**: Balanced
- **Weapon Slots**: 3
- **Subsystem Slots**: 3-4
- **AI Slots**: 2-3
- **Cargo**: Medium

### Frigate
- **Focus**: Firepower, shields
- **Weapon Slots**: 3-4
- **Subsystem Slots**: 4
- **AI Slots**: 3-4
- **Cargo**: Medium-High

### Destroyer
- **Focus**: Heavy combat
- **Weapon Slots**: 4
- **Subsystem Slots**: 4-5
- **AI Slots**: 4-5
- **Cargo**: High

### Capital
- **Focus**: Command, support
- **Weapon Slots**: 4
- **Subsystem Slots**: 5
- **AI Slots**: 5-8
- **Cargo**: Very High

## Admin UI Components

### ShipManager.jsx
Main ship management interface with:
- List of all ships
- Create/Edit/Delete ship
- Filter by class, tier, rarity
- Enable/disable ships

### ShipEditor.jsx
Comprehensive ship editor:

#### Basic Info Section
- Name, description
- Class dropdown
- Tier dropdown (T0-T3)
- Rarity dropdown
- Enabled checkbox

#### Base Stats Section
- Each stat (hull, shields, power, speed, cargo)
- Min/Max/Default sliders
- Visual preview of randomization range

#### AI Crew Slots Section
- Min slider (0-8)
- Max slider (0-8)
- Default slider (between min/max)
- Variance slider (±0-3)
- Preview: "This ship will have 2±1 AI (1-3 total)"

#### Weapon Slots Section
- 4 weapon slot rows
- Each row:
  - Checkbox to enable/disable slot
  - Dropdown for default weapon (if enabled)
  - Preview of weapon stats

#### Subsystem Slots Section
- 5 subsystem slot rows
- Each row:
  - Checkbox to enable/disable slot
  - Dropdown for default component (if enabled)
  - Preview of component bonuses

#### Actions
- Save Ship
- Reset to Default
- Delete Ship (with confirmation)

## BuildSimulator Integration

Update BuildSimulator to:
1. Select a ship (shows base stats)
2. Select multiple AI crew (up to ship's max)
3. Select components (up to enabled slots)
4. Calculate final attributes with all bonuses
5. Test rolls with combined modifiers

### Multi-AI Selection
- Show all available AI in a list
- Checkboxes to select multiple
- Max selection based on ship (or configurable)
- Each AI's bonuses stack
- DRE shows breakdown per AI

## Component Library

Components need to be defined in config with:
- ID, name, description
- Stat modifications
- Skill bonuses
- Power consumption
- Rarity/tier requirements

Example:
```javascript
{
  id: "shield_generator_mk1",
  name: "Shield Generator Mk I",
  description: "Basic shield generation system",
  type: "defensive",
  tier: "T0",
  bonuses: {
    shields: 25,
    power: -10
  },
  requirements: {
    powerAvailable: 10
  }
}
```

## Weapon Library

Weapons need similar structure:
```javascript
{
  id: "laser_mk1",
  name: "Laser Cannon Mk I",
  description: "Standard energy weapon",
  type: "energy",
  tier: "T0",
  damage: { min: 5, max: 15 },
  range: "medium",
  powerCost: 15,
  cooldown: 2
}
```

## Implementation Order

1. ✅ Fix EventSimulator event loading
2. ⏳ Fix BuildSimulator multi-AI selection
3. ⏳ Create Ship data structure in config
4. ⏳ Create ShipManager component
5. ⏳ Create ShipEditor component
6. ⏳ Add Ships tab to Admin Config
7. ⏳ Update BuildSimulator to use ships
8. ⏳ Create Component Library manager
9. ⏳ Create Weapon Library manager

## Future Enhancements

- Ship visual customization
- Special ship abilities/perks
- Upgrade paths (Mk I → Mk II → Mk III)
- Faction-specific ships
- Legendary/unique ships with special traits
- Ship manufacturing/crafting system
