# Admin Console Flow - Event Outcome System

## Component Interconnections Overview

This document explains how the admin console sections interconnect to create event outcomes in The Surge.

---

## **1. EVENT DEFINITION (Event Editor)**

**Location:** Admin Portal → Events Tab → Event Editor  
**Creates:** Dynamic events stored in `backend/data/events_dynamic.json`

### Event Structure Contains:
- **Event Metadata**: `id`, `name`, `description`, `category`, `tags`
- **Trigger Conditions**: `minRiskLevel`, `maxRiskLevel`, `requiredLocation`, `cooldown`
- **Branch Definitions**: Each branch contains:
  - `branchId`, `prompt`, `difficulty`
  - `requiredSkills[]` (references Ship Skills)
  - `successOutcomes[]` and `failureOutcomes[]`

### Feeds Into:
- Dynamic Event Scheduler (reads event pool)
- Event Trigger Service (evaluates trigger conditions)

---

## **2. OUTCOME DEFINITIONS (Within Event Editor)**

**Location:** Each branch's Success/Failure outcome arrays

### Outcome Types:

#### **A. Loot Outcomes**
```json
{
  "type": "loot",
  "poolId": "asteroid_mining"  // ← REFERENCES LOOT POOL
}
```
**Links To:** Loot Pool Editor → Specific Pool ID

#### **B. Resource Outcomes**
```json
{
  "type": "resource",
  "resource": "credits",
  "amount": 500
}
```
**Links To:** Game's resource system (credits, fuel, etc.)

#### **C. Reputation Outcomes**
```json
{
  "type": "reputation",
  "faction": "UEC",
  "change": 10
}
```
**Links To:** Faction system (tracked in user state)

#### **D. Encounter Outcomes**
```json
{
  "type": "encounter",
  "encounterId": "pirate_ambush"  // ← REFERENCES ENCOUNTER
}
```
**Links To:** Encounters system (stored separately)

#### **E. Text/Narrative Outcomes**
```json
{
  "type": "text",
  "message": "You discover a distress beacon..."
}
```
**Links To:** Terminal feed display

---

## **3. LOOT POOL SYSTEM (Loot Pool Editor)**

**Location:** Admin Portal → Loot Tab → Pool Editor  
**Creates:** Loot pools stored in `backend/data/config.json` → `lootPools{}`

### Pool Structure:
```
LOOT POOL
├── Pool Metadata (id, name, description, tags)
├── Mode: Manual OR Tag-Based
├── Entries[] (if Manual mode)
│   └── References Item IDs from LOOT TABLES
└── Grades[] (Container Tiers)
    ├── Grade Metadata (id, displayName, weight)
    ├── Filters
    │   ├── tiers[] (common, rare, epic, etc.)
    │   └── tags[] (military, mining, etc.)  // ← FILTERS LOOT TABLES
    ├── Guaranteed Items[]
    │   └── References Item IDs from LOOT TABLES
    ├── Roll Settings (minItems, maxItems)
    └── Container Data (visual display info)
```

### Pulls From:
- **Loot Tables** (`config.json` → `lootTables.items[]`) - The master item database
  - Each item has: `id`, `name`, `tier`, `tags[]`, `category`, `value`, `weight`

### Resolution Logic:
1. **Grade Selection**: Weighted roll based on grade weights
2. **Item Filtering**: 
   - **Manual Mode**: Uses pool's `entries[]` → filters by grade's tier/tag filters
   - **Tag Mode**: Scans ALL items in `lootTables.items[]` → filters by grade's tier/tag filters
3. **Item Rolling**: Random selection from filtered items based on roll settings
4. **Guaranteed Items**: Always added first

### Feeds Into:
- Event Outcomes (when outcome type = "loot")
- Loot Simulator (testing tool)

---

## **4. LOOT TABLES (Item Database)**

**Location:** `backend/data/config.json` → `lootTables.items[]`

### Structure:
```json
{
  "id": "beam_laser",
  "name": "Beam Laser",
  "tier": "uncommon",
  "tags": ["weapon", "military", "energy"],
  "category": "weapon",
  "value": 1200,
  "weight": 3,
  "description": "..."
}
```

**This is the SOURCE OF TRUTH for all items**

### Used By:
- Loot Pool Editor (for filtering and selection)
- Loot Resolution Service (final item lookup)
- Inventory System (item definitions)

---

## **5. SHIP ATTRIBUTES (Referenced by Events)**

**Location:** User's ship data (stored in `backend/data/users.json` or session state)

### Structure:
```json
{
  "skills": {
    "piloting": 5,
    "engineering": 3,
    "combat": 4,
    "navigation": 2
  },
  "attributes": {
    "hull": 100,
    "shields": 80,
    "fuel": 500
  }
}
```

### Referenced By:
- Event Branch `requiredSkills[]` - skill checks
- Combat system - combat attributes
- Event outcomes - resource changes (hull, shields, fuel)

### Managed Via:
- Ship Management UI (if implemented)
- User profile system

---

## **6. EVENT RESOLUTION FLOW (Runtime)**

```
PLAYER TRIGGERS EVENT
    ↓
[Event Trigger Service]
    ├─ Reads: events_dynamic.json
    ├─ Checks: Risk level, location, cooldown
    └─ Selects: Matching event
    ↓
[Player Chooses Branch]
    ├─ Reads: branch.requiredSkills
    ├─ Checks: Player ship skills
    └─ Rolls: Skill check vs difficulty DC
    ↓
[Outcome Processor] ← eventOutcomeProcessor.js
    ├─ Reads: branch.successOutcomes OR branch.failureOutcomes
    ├─ Processes each outcome:
    │   ├─ type: "loot"
    │   │   ├─ Calls: resolveLootPool(poolId)
    │   │   ├─ Reads: config.json → lootPools
    │   │   ├─ Reads: config.json → lootTables.items
    │   │   └─ Returns: { items[], containerData }
    │   │
    │   ├─ type: "resource"
    │   │   └─ Modifies: player.resources[resource]
    │   │
    │   ├─ type: "reputation"
    │   │   └─ Modifies: player.reputation[faction]
    │   │
    │   ├─ type: "encounter"
    │   │   └─ Triggers: Secondary encounter
    │   │
    │   └─ type: "text"
    │       └─ Displays: Narrative message
    └─ Returns: Combined outcome result
    ↓
[UI Display]
    ├─ Terminal Feed (text outcomes)
    ├─ Inventory Modal (loot outcomes)
    ├─ Resource Updates (HUD)
    └─ Combat Window (encounter outcomes)
```

---

## **7. ADMIN SIMULATION TOOLS**

### **A. Loot Simulator**
**Tests:** Loot Pool → Grade Selection → Item Resolution

**Flow:**
```
Select Pool → Roll → Identify Grade → Reveal Items
    ↓           ↓          ↓              ↓
Loot Pool   Weighted   Grade      Filter Items
 Database    Roll      Filters    & Roll Items
```

### **B. Event System Test** (if exists)
**Tests:** Full event flow including outcomes

**Flow:**
```
Load Event → Select Branch → Simulate Roll → Process Outcomes
```

---

## **8. DATA STORAGE ARCHITECTURE**

```
backend/data/
├── config.json
│   ├── lootTables
│   │   ├── items[] ................. Master item database
│   │   └── pools[] ................. Original loot pools
│   └── lootPools{} ................. Admin-created pools
│
├── events_dynamic.json ............ Dynamic events
├── events_mission.json ............ Mission events
├── events_poi.json ................ POI events
├── encounters.json ................ Encounter definitions
├── missions.json .................. Mission definitions
└── users.json ..................... Player data (ship, inventory)
```

---

## **KEY INTERCONNECTIONS FOR FLOW DIAGRAM**

### Nodes:
1. **Event Definition** (Event Editor)
2. **Branch Definition** (within Event Editor)
3. **Outcome Definition** (within Branch)
4. **Loot Pool** (Loot Pool Editor)
5. **Container Grade** (within Loot Pool)
6. **Loot Tables** (Item Database)
7. **Ship Attributes** (Player Data)
8. **Skill Check System** (DRE)
9. **Outcome Processor** (Backend Service)
10. **Player Inventory** (Result Storage)

### Connections:
- Event → Branch (contains)
- Branch → Skill Check (requires Ship Attributes)
- Branch → Outcomes (defines)
- Outcome → Loot Pool (references poolId)
- Loot Pool → Grades (contains)
- Grade → Loot Tables (filters by tags/tiers)
- Grade → Guaranteed Items (references item IDs)
- Loot Tables → Items (master database)
- Outcome Processor → All Systems (orchestrates)
- Outcome Processor → Player Inventory (updates)

### Data Flow Color Coding Suggestion:
- 🔵 **Blue arrows**: Data read operations
- 🟢 **Green arrows**: Data filtering/transformation
- 🟡 **Yellow arrows**: Random selection/rolling
- 🔴 **Red arrows**: Player state modifications
- 🟣 **Purple arrows**: Cross-system references (IDs)

---

## **DETAILED EXAMPLE: Mining Event Flow**

### Step-by-Step Breakdown:

1. **Event Triggered**: "Asteroid Field Discovery"
   - Source: `events_dynamic.json`
   - Trigger: Player in asteroid belt, risk level 20-40

2. **Player Sees Branches**:
   - Branch A: "Survey the field" (Engineering skill check)
   - Branch B: "Quick surface scan" (Navigation skill check)

3. **Player Chooses Branch A** → Engineering Check
   - Required Skill: `engineering: 3`
   - Player Ship: `engineering: 5` ✓
   - Difficulty: `normal` (DC 8)
   - Roll Result: Success!

4. **Outcome Processor Activates**:
   - Reads: `branch.successOutcomes[]`
   - Finds: `{ type: "loot", poolId: "asteroid_mining" }`

5. **Loot Resolution**:
   - Loads Pool: `asteroid_mining` from `lootPools`
   - Pool Mode: Tag-based
   - Rolls Grade: Weighted selection → "GRADE-II MINING HAUL"
   - Grade Filters: `tiers: ["common", "uncommon"]`, `tags: ["mining", "ore"]`

6. **Item Filtering**:
   - Scans: `lootTables.items[]`
   - Matches:
     - `iron_ore` (common, tags: mining, ore)
     - `platinum_ore` (uncommon, tags: mining, ore)
     - `helium3` (uncommon, tags: mining, gas)
   
7. **Item Rolling**:
   - Roll Settings: `minItems: 2, maxItems: 4`
   - Rolled: 3 items
   - Guaranteed: `credits x100`
   - Random Selection:
     - `iron_ore x15`
     - `platinum_ore x3`
     - `helium3 x8`

8. **Result Display**:
   - Terminal: "MINING OPERATION SUCCESSFUL"
   - Loot Grid: 4 items revealed sequentially
   - Inventory: Items added to cargo

---

## **FILE REFERENCES**

### Frontend Components:
- `src/components/admin/forms/EventEditor.jsx` - Event creation
- `src/components/admin/forms/LootPoolEditor.jsx` - Loot pool creation
- `src/components/admin/LootSimulator.jsx` - Testing tool

### Backend Services:
- `backend/services/eventOutcomeProcessor.js` - Outcome resolution
- `backend/services/eventTriggerService.js` - Event triggering
- `backend/routes/events.js` - Event API endpoints
- `backend/routes/config.js` - Config management

### Data Files:
- `backend/data/config.json` - Loot tables & pools
- `backend/data/events_dynamic.json` - Dynamic events
- `backend/data/users.json` - Player data

---

**Last Updated:** November 24, 2025  
**Version:** 0.2.0
