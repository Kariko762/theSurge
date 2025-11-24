# Ship Tier Bonus System

## Overview
Ships gain bonuses based on their tier level. Higher tier ships receive progressively more powerful bonuses from Standard, Advanced, and Legendary categories.

---

## **BONUS TIER PROGRESSION**

### Tier 1 (Base)
- **No bonuses** - Base ship stats only

### Tier 2
- **1x Standard Bonus**

### Tier 3
- **1x Standard Bonus**
- **1x Advanced Bonus**

### Tier 4
- **2x Standard Bonuses**
- **1x Advanced Bonus**

### Tier 5
- **2x Standard Bonuses**
- **2x Advanced Bonuses**

### Tier 6 (Legendary)
- **1x Legendary Passive Ability**
- **2x Standard Bonuses**
- **2x Advanced Bonuses**

---

## **BONUS TYPE DEFINITIONS**

### Standard Bonuses (Common Upgrades)
**Power Level:** Small to moderate stat increases  
**Availability:** Tier 2+  
**Typical Values:** +5-15 to single stats

#### Ship Statistics
- **Hull Reinforcement**: +10 Hull HP
- **Shield Boost**: +10 Shield HP
- **Power Capacitor**: +10 Power
- **Cargo Expansion**: +5 Cargo Space
- **Engine Tuning**: +1 Speed
- **Maneuvering Thrusters**: +1 Agility

#### Combat Stats
- **Targeting Computer**: +1 Accuracy
- **ECM Suite**: +1 Evasion
- **Extended Range Modules**: +1 Range
- **Weapon Enhancement**: +1 Damage

#### Initiative & Checks
- **Quick Response Systems**: +1 Initiative (turn order)
- **Engineering Toolkit**: +1 Engineering Checks
- **Pilot Assist**: +1 Piloting Checks
- **Combat Trainer**: +1 Combat Checks
- **Nav Computer**: +1 Navigation Checks

#### Specialized
- **Sensor Boost**: +1 Detection Range
- **Stealth Coating**: +1 Stealth Rating
- **Fuel Efficiency**: -5% Fuel Consumption
- **Repair Drone**: +5% Hull Repair Rate

---

### Advanced Bonuses (Powerful Upgrades)
**Power Level:** Significant stat increases or multi-stat bonuses  
**Availability:** Tier 3+  
**Typical Values:** +15-30 to stats, or multiple smaller bonuses

#### Multi-Stat Bonuses
- **Battle Fortress**: +20 Hull, +10 Shields
- **Weapons Platform**: +2 Damage, +1 Accuracy, +1 Range
- **Interceptor Package**: +2 Speed, +2 Agility, +1 Evasion
- **Fleet Command Suite**: +2 Initiative, +2 to all Skill Checks

#### Enhanced Combat
- **Critical Systems**: +10% Critical Hit Chance
- **Armor Plating**: +15% Damage Reduction (kinetic)
- **Shield Harmonics**: +15% Damage Reduction (energy)
- **Weapon Overcharge**: +3 Damage, +1 Accuracy

#### Advanced Skills
- **Elite Engineering**: +3 Engineering Checks, +10 Power
- **Ace Pilot**: +3 Piloting Checks, +2 Agility
- **Combat Veteran**: +3 Combat Checks, +1 Damage
- **Master Navigator**: +3 Navigation Checks, +1 Speed

#### Tactical Advantages
- **First Strike**: +3 Initiative, advantage on first round
- **Sensor Array**: +2 Detection, reveals enemy stats
- **Stealth Ops**: +3 Stealth, -1 enemy accuracy
- **Regenerative Shields**: Shields regenerate 5% per turn

---

### Legendary Passive Abilities
**Power Level:** Unique game-changing abilities  
**Availability:** Tier 6 ONLY  
**Nature:** Permanent passive effects or triggered abilities

#### Survival Legendaries
- **Phoenix Protocol**: Once per combat, if HP drops to 0, restore to 25% HP
- **Unbreakable**: Hull cannot drop below 1 HP from a single hit
- **Shield Fortress**: Shields absorb 50% more damage before depleting
- **Adaptive Armor**: Reduce damage from repeated damage types by 25%

#### Combat Legendaries
- **Overkill**: Critical hits deal 200% damage instead of 150%
- **Chain Lightning**: Weapon hits have 25% chance to strike adjacent target
- **Devastator**: +50% damage when enemy HP is below 25%
- **Headhunter**: Deal bonus damage equal to 10% of enemy max HP

#### Tactical Legendaries
- **Battlefield Commander**: All allies gain +1 to all checks
- **Ghost Ship**: Cannot be targeted if you don't attack this turn
- **Warp Strike**: First attack each combat ignores shields
- **Master Tactician**: Re-roll any failed check once per encounter

#### Utility Legendaries
- **Scavenger Elite**: Gain 50% more loot from all sources
- **Efficient Systems**: All ship systems use 25% less power
- **Emergency Warp**: Escape combat without risk once per day
- **Lucky Star**: +10% chance for all positive outcomes

---

## **UI VISIBILITY LOGIC**

### When Type = "Standard"
**Visible Panels:**
- ✅ Standard Bonus Selection ONLY

**Hidden Panels:**
- ❌ Advanced Bonus Selection
- ❌ Legendary Passive Selection

---

### When Type = "Advanced"
**Visible Panels:**
- ✅ Standard Bonus Selection
- ✅ Advanced Bonus Selection

**Hidden Panels:**
- ❌ Legendary Passive Selection

---

### When Type = "Legendary"
**Visible Panels:**
- ✅ Standard Bonus Selection
- ✅ Advanced Bonus Selection
- ✅ Legendary Passive Selection

---

## **STAT EFFECT CATEGORIES**

### Ship Core Stats
```javascript
{
  hull: 0,        // Hit points
  shields: 0,     // Shield points
  power: 0,       // Power capacity
  cargo: 0,       // Cargo space
  speed: 0,       // Movement speed
  agility: 0      // Maneuverability
}
```

### Combat Stats
```javascript
{
  accuracy: 0,    // Hit chance
  evasion: 0,     // Dodge chance
  range: 0,       // Weapon range
  damage: 0       // Damage output
}
```

### Initiative & Checks
```javascript
{
  initiative: 0,        // Turn order modifier
  engineering: 0,       // Engineering skill bonus
  piloting: 0,          // Piloting skill bonus
  combat: 0,            // Combat skill bonus
  navigation: 0         // Navigation skill bonus
}
```

### Advanced Combat
```javascript
{
  criticalChance: 0,    // % chance for critical hits
  damageReduction: 0,   // % damage mitigation
  detection: 0,         // Sensor range
  stealth: 0           // Stealth rating
}
```

### Special Modifiers
```javascript
{
  fuelEfficiency: 0,    // % fuel reduction
  repairRate: 0,        // % hull repair per turn
  shieldRegen: 0,       // % shield regen per turn
  lootBonus: 0         // % bonus loot
}
```

---

## **IMPLEMENTATION NOTES**

### Bonus Selection Process
1. Player selects ship tier bonus slot
2. Selects bonus **Type** (Standard/Advanced/Legendary)
3. UI reveals appropriate panels:
   - Standard → Shows standard bonuses only
   - Advanced → Shows standard + advanced bonuses
   - Legendary → Shows standard + advanced + legendary bonuses
4. Player configures each visible bonus type
5. Bonus saved to ship configuration

### Data Structure
```javascript
{
  id: "ship_bonus_123",
  name: "Elite Combat Suite",
  type: "advanced",           // standard | advanced | legendary
  tier: 3,                    // Minimum ship tier
  description: "...",
  
  // Standard effects (always visible for advanced/legendary)
  standardEffects: {
    damage: 1,
    accuracy: 1
  },
  
  // Advanced effects (visible for advanced/legendary only)
  advancedEffects: {
    criticalChance: 10,
    combat: 2
  },
  
  // Legendary effects (visible for legendary only)
  legendaryPassive: {
    id: "overkill",
    name: "Overkill",
    description: "Critical hits deal 200% damage instead of 150%"
  },
  
  tags: ["combat", "damage", "critical"]
}
```

### Progressive Reveal
- Changing Type dropdown updates visible form sections
- Standard: Only basic stat sliders visible
- Advanced: Standard section + Advanced section visible
- Legendary: All three sections visible

---

**Version:** 1.0.0  
**Last Updated:** November 24, 2025
