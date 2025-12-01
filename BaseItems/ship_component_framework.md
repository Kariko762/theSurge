# **The Surge — Ship Component Governance Framework**

*A structured reference for engines, shields, hull extenders, weapons, sensors, ECM, and power systems*

---

# **1. Purpose of This Document**

This document defines the **rules, scaling, and balance requirements** for all ship components used in *The Surge*. It complements the ship-scaling framework (SLv, EHP, EV, AB) and ensures all modules fit cleanly into the D20-based combat loop.

This includes:

* Engines
* Shield generators
* Hull extenders
* Weapons (D4/D6/D8/D10 damage dice)
* Power systems
* Sensors
* ECM suites
* Utility modules
* Faction-specific variants

Reference systems drawn from:

* **Ship & Faction Reference Guide** fileciteturn1file0
* **Universe Master Guide** fileciteturn1file1
* **Ship Combat Scaling Framework** fileciteturn1file2

---

# **2. Component Level Governance (CLv)**

Components follow a simple 1–5 tier system that maps cleanly to ship tiers.

| Component Tier | Recommended SLv Range | Notes                        |
| -------------- | --------------------- | ---------------------------- |
| **Tier 1**     | SLv 1–4               | Starter/basic equipment      |
| **Tier 2**     | SLv 5–8               | Mid-game progression         |
| **Tier 3**     | SLv 9–12              | Strong equipment / cruisers  |
| **Tier 4**     | SLv 13–16             | Capital-grade tech           |
| **Tier 5**     | SLv 17–20             | Advanced/alien/relic systems |

---

# **3. Component Categories**

## **3.1 Engines**

Determines **Speed**, **Agility**, and **Escape DC**.

### **Governance Rules**

* Engines MUST be class-specific.
* Speed and Agility bonuses scale with CLv.
* Each engine defines a **Flight Bonus** used in d20 escape and pursuit.

### **Engine Scaling Table**

| Class      | Tier 1            | Tier 3  | Tier 5  |
| ---------- | ----------------- | ------- | ------- |
| Fighter    | +2 Speed / +2 Agi | +4 / +4 | +6 / +6 |
| Corvette   | +2 / +1           | +4 / +2 | +6 / +3 |
| Frigate    | +1 / +1           | +3 / +2 | +5 / +3 |
| Destroyer  | +1 / +0           | +3 / +1 | +4 / +2 |
| Cruiser    | +0 / +0           | +2 / +1 | +3 / +2 |
| Battleship | +0 / -1           | +1 / 0  | +2 / +1 |

### **Engine Example (Markdown)**

```
### Engine: "engine_frigate_mk2" (Tier 2)
- Speed Bonus: +2
- Agility Bonus: +2
- Escape Bonus: +1
- Class: Frigate
```

---

## **3.2 Shield Generators**

Generates Shield Capacity & Recharge.

### **Shield Capacity Formula**

```
ShieldCap = 4 + CLv × 2
```

(Then modified by faction bonus.)

### **Recharge Formula**

```
Recharge = 1d4 per turn + CLv modifier
```

### **Shield Generator Scaling**

| Tier | Capacity | Recharge |
| ---- | -------- | -------- |
| T1   | +6       | 1d4      |
| T2   | +10      | 1d4+1    |
| T3   | +14      | 1d4+2    |
| T4   | +18      | 1d6      |
| T5   | +25      | 1d6+2    |

### **Example**

```
shield_generator_mk2 (Tier 2)
- Shield Bonus: +10
- Recharge: 1d4+1
```

---

## **3.3 Hull Extenders & Armor Plating**

Adds to Hull (EHP) before faction modifiers.

### **Hull Bonus Formula**

```
HullBonus = 4 + (CLv × 3)
```

### **Armor (Damage Reduction)**

| Tier | DR |
| ---- | -- |
| T1   | 1  |
| T2   | 2  |
| T3   | 3  |
| T4   | 4  |
| T5   | 5  |

### **Example**

```
hull_plating_reinforced (Tier 2)
- Hull Bonus: +10
- DR: 2
```

---

## **3.4 Sensors**

Boost **Accuracy**, **Detection**, and **Scan Rolls**.

### **Sensor Scaling**

| Tier | Accuracy Bonus | Scan Bonus |
| ---- | -------------- | ---------- |
| T1   | +1             | +1         |
| T2   | +2             | +2         |
| T3   | +3             | +3         |
| T4   | +4             | +4         |
| T5   | +5             | +5         |

### **Example**

```
sensor_array_longrange (Tier 3)
- Accuracy Bonus: +3
- Scan Bonus: +3
- Range: +1200 km
```

---

## **3.5 ECM Suites**

Reduce enemy hit chance & improve escape.

### **ECM Scaling**

| Tier | Evasion Bonus | Jam DC | Notes                  |
| ---- | ------------- | ------ | ---------------------- |
| T1   | +1            | 10     | Basic countermeasures  |
| T2   | +2            | 12     | Signal scramblers      |
| T3   | +3            | 14     | Multi-band jammers     |
| T4   | +4            | 16     | Active ECM systems     |
| T5   | +5            | 18     | Stealth-grade cloaking |

### **Example**

```
ecm_suite_advanced (Tier 3)
- Evasion Bonus: +3
- Jam Roll: DC 14
- Decoys: 1d2
```

---

# **4. Weapon Governance**

Weapons follow the dice-limited D20 structure.

Weapons have:

* Damage Dice
* Attack Bonus Modifier
* Reload (turns)
* Power Usage

## **4.1 Damage Category Bands**

| Type                 | Dice    | Role                |
| -------------------- | ------- | ------------------- |
| **Light Energy**     | 1d4–1d6 | Fighters, corvettes |
| **Medium Energy**    | 1d8     | Frigates            |
| **Heavy Energy**     | 1d10    | Destroyer+          |
| **Missiles (light)** | 2d6     | Burst damage        |
| **Missiles (heavy)** | 2d8     | Slow, high-impact   |
| **Plasma**           | 2d10    | Capital weapons     |

## **4.2 Weapon Accuracy & Attack Bonus**

| Tier | Attack Bonus |
| ---- | ------------ |
| T1   | +2           |
| T2   | +3           |
| T3   | +4           |
| T4   | +5           |
| T5   | +6           |

(This stacks with the ship’s base Attack Bonus.)

---

# **5. Power Systems**

Regulate capacity to run AIs, shields, weapons.

### **Power Capacity Formula**

```
Power = 4 + (CLv × 3)
```

### **Efficiency Bonus**

| Tier | Bonus |
| ---- | ----- |
| T1   | +0    |
| T2   | +1    |
| T3   | +2    |
| T4   | +3    |
| T5   | +4    |

### **Example**

```
power_core_military (Tier 3)
- Capacity Bonus: +13
- Efficiency Bonus: +2
```

---

# **6. Utility Systems**

## **6.1 Cargo Expanders**

```
CargoBonus = 10 + (CLv × 10)
```

## **6.2 Rad-Scrubbers**

Reduces radiation accumulation each turn.

| Tier | Reduction |
| ---- | --------- |
| T1   | 1d4       |
| T2   | 1d4+1     |
| T3   | 1d4+2     |
| T4   | 1d6       |
| T5   | 1d6+2     |

## **6.3 Repair Systems**

Automatic or mid-combat hull regeneration.

| Tier | Regen |
| ---- | ----- |
| T1   | 1     |
| T2   | 1d2   |
| T3   | 1d3   |
| T4   | 1d4   |
| T5   | 1d4+1 |

---

# **7. Faction-Specific Component Rules**

Factions add flavour, bonuses, and constraints.

## **7.1 UTD**

* Balanced bonuses
* +10% shield & hull cap to all components

## **7.2 Hex-Corp**

* +15% power from all cores
* Plasma weapons cost -1 power

## **7.3 Freebelt**

* ECM bonuses doubled
* Engines add +1 extra Agility

## **7.4 Kaelorii**

* Shields get +25% extra cap
* Beam weapons gain +1 to hit

## **7.5 Threxul**

* No shields, but +50% hull bonus from extenders
* Weapons use acid/spore variants (future doc)

## **7.6 Concordant**

* Sensors gain +2 extra Accuracy
* Shield generators recharge +1 extra

## **7.7 Ashinari**

* ECM gains +2 additional Evasion
* Precision weapons crit on 19–20

---

# **8. Component Validation Rules**

A component is valid when:

* Stats match Tier values
* Class restrictions honoured (engines)
* Dice fall within allowed bands
* Power usage fits ship power budget
* Faction bonuses applied AFTER base values

---

# **9. Templates**

## **9.1 Component Template (Markdown)**

```
### <Component Name> (Tier X, <Category>)
- Effect Bonuses: ...
- Power Usage: X
- Class Restriction: X
- Faction Mods: auto-applied
```

## **9.2 JSON Template**

```
{
  "id": "component_id",
  "name": "Component Name",
  "tier": X,
  "category": "engine|weapon|shield|subsystem|utility",
  "classRestriction": "fighter|corvette|frigate|etc or null",
  "effects": {
    "speed": X,
    "agility": X,
    "hull": X,
    "shields": X,
    "evasion": X,
    "accuracy": X,
    "power": X
  },
  "damage": "XdY+Z or null",
  "powerUsage": X,
  "enabled": true
}
```

---

# **10. Summary**

This governance document defines:

* Component tiers
* Engine/Shields/Hull/Sensor/ECM scaling
* Damage dice restrictions
* Power system rules
* Faction modifiers
* Templates for implementation

This ensures all ship subcomponents are:

* Balanced
* Predictable
* D20-aligned
* Faction-flavoured
* Future-proof for new ships & expansions.