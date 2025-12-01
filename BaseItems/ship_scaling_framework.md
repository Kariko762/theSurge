# **The Surge — Ship Combat Scaling & Governance Framework**

*A structured reference for implementing D20-based ship combat across all factions*

---

# **1. Purpose of This Document**

This governance framework defines how ships, damage, levels, and combat values scale within **The Surge** universe when using:

* **D20 attack rolls**
* **D4/D6/D8/D10 damage dice**
* D&D-style **levels**, **hit progression**, and **balance pacing**

This ensures:

* Consistency across factions
* Predictable difficulty scaling
* Lore-aligned ship power curves
* Transparency for designers and developers
* Easy expansion for new ships, factions, and tiers

---

# **2. Ship Level Governance (SLv)**

Ships follow a D&D-inspired 1–20 level system.

## **2.1 Level Bands Per Class**

| Class             | Level Range | Notes                         |
| ----------------- | ----------- | ----------------------------- |
| **Fighter**       | 1–3         | Light craft, evasive, fragile |
| **Corvette**      | 3–6         | Small escorts, light guns     |
| **Frigate**       | 5–9         | Core mid-tier combatants      |
| **Destroyer**     | 7–11        | Heavy escorts, artillery      |
| **Cruiser**       | 9–13        | Large mainline warships       |
| **Battleship**    | 11–18       | Capital-grade leviathans      |
| **Relic/Ancient** | 18–20       | Rare, unique encounters       |

Factions **modify** their ships within these brackets but never exceed them.

---

# **3. Effective HP (EHP) Governance**

Effective HP = **Hull + Shields (after faction modifiers)**.

Target EHP ensures ships die in:

* **3–4 critical hits**, or
* **5–7 standard hits** vs equal-tier foes.

## **3.1 EHP Formula**

Each class uses its own formula:

```
Fighter:    EHP = 8  + SLv × 3
Corvette:   EHP = 12 + SLv × 3
Frigate:    EHP = 16 + SLv × 3.5
Destroyer:  EHP = 22 + SLv × 3.5
Cruiser:    EHP = 26 + SLv × 4
Battleship: EHP = 32 + SLv × 4.5
```

## **3.2 Expected EHP Targets**

| Class      | Mid-Level EHP | Notes                   |
| ---------- | ------------- | ----------------------- |
| Fighter    | 12–16         | Dies fast, high evasion |
| Corvette   | 20–24         | Skirmisher              |
| Frigate    | 32–40         | Baseline enemy strength |
| Destroyer  | 40–50         | Heavy but hittable      |
| Cruiser    | 50–60         | Needs 3–4 crits to kill |
| Battleship | 80–100        | Designed as boss units  |

---

# **4. Defense Rating Governance (EV / DR)**

Ships use a Defense Rating similar to **Armor Class (AC)** in D&D.

## **4.1 EV Ranges**

| Class      | EV Range |
| ---------- | -------- |
| Fighter    | 16–18    |
| Corvette   | 15–16    |
| Frigate    | 13–15    |
| Destroyer  | 12–14    |
| Cruiser    | 11–13    |
| Battleship | 10–12    |

Higher EV = more missed attacks.

---

# **5. Attack Bonus Governance**

Attack bonus follows D&D-style progression.

## **5.1 Attack Bonus by Tier**

| SLv   | Attack Bonus |
| ----- | ------------ |
| 1–4   | +3 to +4     |
| 5–10  | +5 to +7     |
| 11–16 | +7 to +9     |
| 17–20 | +9 to +11    |

---

# **6. Damage Dice Governance**

Weapons deal damage using **D4/D6/D8/D10**, matching D&D scaling.

## **6.1 Standard Damage Profiles**

| Weapon Type    | Dice     | Notes                  |
| -------------- | -------- | ---------------------- |
| Pulse Laser    | 1d6 + 1  | Light, accurate        |
| Beam Laser     | 1d8 + 2  | Sustained, reliable    |
| Autocannon     | 1d6 + 1  | Fast-firing            |
| Railgun        | 1d10 + 2 | Armor-piercing         |
| Light Missiles | 2d6 + 2  | Burst damage           |
| Heavy Missiles | 2d8 + 3  | Slow, devastating      |
| Plasma Cannon  | 2d10 + 2 | High-risk, high-damage |

## **6.2 Critical Hit Governance**

Crit = **double damage dice**, flat bonuses unchanged.

Example:

```
1d8 + 2  →  Crit = 2d8 + 2
2d10 + 2 →  Crit = 4d10 + 2
```

---

# **7. Factional Stat Modifiers**

Each faction imposes hull/shield/evasion/power flavour.

## **7.1 Modifiers Table**

| Faction    | Hull | Shields | Evasion | Notes                  |
| ---------- | ---- | ------- | ------- | ---------------------- |
| UTD        | +10% | +10%    | Base    | Durable, military      |
| Hex-Corp   | Base | +15%    | -5%     | High-output tech       |
| Freebelt   | +15% | -20%    | +10%    | Scrappy, agile         |
| Kaelori    | -10% | +25%    | +5%     | Resonance shields      |
| Threxul    | +25% | N/A     | -10%    | Regenerative bio-hulls |
| Concordant | -5%  | +20%    | Base    | Defensive guardians    |
| Ashinari   | -15% | +10%    | +20%    | Stealth assassins      |

These apply **after calculating base EHP**.

---

# **8. Example Ship Profiles (Governance Examples)**

## **8.1 Fighter Example (UTD SLv 2)**

```
EHP = 8 + (2 × 3) = 14
Hull = 8
Shields = 6
EV = 17
Attack Bonus = +4
Weapons = Pulse Laser (1d6 + 1)
Crit = 2d6 + 1
```

## **8.2 Cruiser Example (UTD SLv 11)**

```
EHP = 26 + (11 × 4) = 70 → tuned to 52 after balance
Hull = 32
Shields = 20
EV = 12
Attack Bonus = +8
Weapons:
 - Beam Lasers (1d8 + 2)
 - Railguns (1d10 + 2)
 - Heavy Missiles (2d8 + 3)
```

---

# **9. Governance Rules for Designers**

### **9.1 Adding a New Ship**

When designing a new ship:

1. Assign a **Ship Level (SLv)** within its class bracket.
2. Calculate **EHP** using the class formula.
3. Apply **faction modifiers**.
4. Split EHP into **Hull / Shields**.
5. Set **EV** from class EV band.
6. Assign appropriate **Attack Bonus**.
7. Select weapons and **damage dice** matching ship class.

### **9.2 Validation**

A ship is valid when:

* EHP stays within ±10% of class target
* EV is inside its class range
* Attack Bonus matches SLv tier
* Damage dice follow weapon category
* Faction modifiers have been applied

### **9.3 Exceptions**

Only two cases allow deviation:

* **Ancient / Relic Ships** (SLv 18–20)
* **Unique Boss Entities** (Threxul Prime, Kaelori Vault Guardians)

---

# **10. Governance Summary**

This document defines:

* D20 hit mechanics
* Damage dice mappings
* Ship level scaling
* EHP (HP) formulas
* Faction stats
* Weapon profiles
* Defense values

It provides a unified, expandable, and lore-aligned structure for ship combat in **The Surge**.

---

# **11. Appendix: Copy-Paste Templates**

## **11.1 Ship Stat Template (Markdown)**

```
## <Ship Name> (SLv X, <Faction>, <Class>)
- Hull: X
- Shields: X
- EV: X
- Attack Bonus: +X
- Weapons:
  - <Weapon> (XdY + Z)
- Crit: <XdY + Z>
- Notes: <Des
```