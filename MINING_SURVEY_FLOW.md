# Mining & Survey System - Complete Flow Breakdown

## Overview

The game uses a **Dice Resolution Engine (DRE)** for all chance-based actions. Mining, surveys, and POI actions follow a multi-step flow with visual feedback, terminal output, and state management.

---

## 🎯 Core Concepts

### 1. **DRE (Dice Resolution Engine)**
- Located in `src/lib/dre/`
- Handles ALL dice-based actions (mining, scanning, combat, scavenging, etc.)
- Uses **deterministic RNG** (same seed = same result)
- Rolls 2d6 or d20 against difficulty classes
- Applies modifiers from ship, AI, environment, research

### 2. **POI Action System**
- Located in `src/lib/poiActionSystem.js`
- Defines available actions per POI type
- Actions can have children (multi-step flows)
- Requirements checked before showing actions

### 3. **Ship State**
- Located in `src/lib/shipState.js`
- Tracks all persistent data (inventory, clusters, visited POIs, etc.)
- Manages asteroid clusters, mining progress, recovery timers

---

## 📊 Mining Flow (Asteroid Belt)

### Files Involved
- **ShipCommandConsole.jsx** - UI, state management, action triggers
- **dre/engine.js** - Dice rolling and outcome resolution
- **dre/tables.js** - Cluster types, composition, loot tables
- **shipState.js** - Cluster registration and tracking
- **TerminalModal.jsx** - Terminal output display

### Step-by-Step Flow

#### **STEP 1: Scan Cluster** (Survey)
```
User clicks "Scan Cluster" on Belt POI
  ↓
handleScanCluster(poiId, poi)
  ↓
1. Add "Survey Initiated" message to terminal
2. Pan camera to cluster (setPanOffset)
3. Start scanning progress indicator (3 universe seconds)
  ↓
After 3s → completeScan(poiId, poi)
  ↓
4. Execute DRE: executeAsteroidScan(context)
   - context = { systemTier, galacticZone, difficulty: 'easy' }
   - DRE rolls 2d6 + modifiers vs DC 3
  ↓
5a. SUCCESS:
   - Generate cluster data (type, asteroid count, composition bonus, etc.)
   - Register cluster to shipState.registerCluster()
   - Add POI to scanProgress (visual fill)
   - Display cluster report in terminal
   
5b. FAILURE:
   - Show failure message in terminal
   - Display notification bubble with fail reason
```

**DRE Scan Resolution** (`engine.js`):
```javascript
executeAsteroidScan(context) {
  1. Roll 2d6
  2. Apply modifiers (sensors, skills, research)
  3. Check vs DC 3 (easy difficulty)
  4. If success → generate cluster data from CLUSTER_TYPE_CLASSIFICATION table
  5. Return { result, clusterData, totalRoll, narrative }
}
```

**Cluster Data Structure**:
```javascript
{
  type: "Type-II Cluster",
  maxAsteroids: 8,
  currentAsteroids: 8,
  compositionBonus: 2,
  recoveryDays: 1.5,
  miningRate: 12, // seconds per asteroid
  scannedAt: timestamp
}
```

---

#### **STEP 2: Mine Asteroid**
```
User clicks "Mine" on scanned cluster
  ↓
handleMiningOptions(poiId, cluster)
  ↓
1. Check if cluster depleted (currentAsteroids === 0)
   - If depleted → show "Cluster Depleted" message, exit
  ↓
2. Show mining authorization request in terminal
3. Set currentMiningPOI state
  ↓
User confirms "Start Mining"
  ↓
startMining(poiId)
  ↓
4. Add "Mining Initiated" message to terminal
5. Start mining progress indicator (duration = cluster.miningRate seconds)
6. Schedule mining completion event
  ↓
After {miningRate}s → completeMining(poiId, cluster)
  ↓
7. Execute DRE: executeAsteroidMine(context)
   - context = { clusterType, compositionBonus, difficulty: 'normal' }
   - DRE rolls 2d6 + modifiers vs DC (varies by cluster type)
  ↓
8a. SUCCESS:
   - Roll asteroid composition (Ferrous, Metallic, Rare, etc.)
   - Generate loot from ASTEROID_LOOT_TABLES
   - Add items to inventory (inventoryManager.addItem)
   - Decrement cluster.currentAsteroids
   - Display success report in terminal
   
8b. FAILURE:
   - Asteroid destroyed, no loot
   - Decrement cluster.currentAsteroids anyway
   - Display failure message
```

**DRE Mine Resolution** (`engine.js`):
```javascript
executeAsteroidMine(context) {
  1. Roll 2d6
  2. Apply modifiers (mining laser, mining skill, composition bonus)
  3. Check vs DC (based on cluster type difficulty)
  4. If success:
     - Roll composition from ASTEROID_COMPOSITION table
     - Generate loot from composition-specific loot table
     - Apply yield multiplier
  5. Return { result, loot, composition, yieldMultiplier, narrative }
}
```

**Loot Generation**:
```javascript
ASTEROID_LOOT_TABLES = {
  metals: [
    { itemId: 'scrap_metal', weight: 40 },
    { itemId: 'iron_ore', weight: 30 },
    { itemId: 'titanium_alloy', weight: 20 }
  ],
  volatiles: [...],
  rare: [...],
  exotic: [...],
  xenotech: [...]
}
```

---

#### **STEP 3: Cluster Recovery** (Passive)
```
Every universe day:
  ↓
shipState checks all clusters
  ↓
If cluster.currentAsteroids < cluster.maxAsteroids:
  - Add asteroids based on recoveryRate
  - Update cluster state
```

---

## 🌍 Planet Survey Flow (NOT YET IMPLEMENTED)

### Proposed Flow (Based on Mining Pattern)

#### **STEP 1: Atmospheric Scan**
```
User clicks "Scan Atmosphere" on Planet POI
  ↓
handleAtmosphericScan(poiId, poi)
  ↓
1. Add "Atmospheric Scan Initiated" message
2. Pan to planet
3. Start scanning progress (3 universe seconds)
  ↓
completeScan(poiId, poi)
  ↓
4. Execute DRE: resolvePOIAction('atmospheric_scan', context)
   - Uses poiActionTables.atmospheric_scan
   - Rolls 2d6 + modifiers (sensors, science skill)
  ↓
5a. SUCCESS:
   - Generate atmospheric data (composition, pressure, breathability)
   - Register to shipState.scanPOI()
   - Display atmosphere report
   - Unlock child POIs (landing sites, colonies)
   
5b. FAILURE:
   - Sensor interference, no data
   - Display failure message
```

**DRE Table** (`poiActionTables.js`):
```javascript
atmospheric_scan: {
  dice: "2d6",
  modifiers: [
    { source: "sensors", type: "shipSystem", bonus: 2 },
    { source: "science", type: "skill", bonus: 1 }
  ],
  outcomes: [
    { range: [2, 5], severity: "critical_failure", narrative: [...], effects: {...} },
    { range: [6, 8], severity: "partial_success", narrative: [...], effects: {...} },
    { range: [9, 11], severity: "success", narrative: [...], effects: {...} },
    { range: [12, 14], severity: "critical_success", narrative: [...], effects: {...} }
  ]
}
```

---

#### **STEP 2: Surface Scan**
```
User clicks "Scan Surface"
  ↓
handleSurfaceScan(poiId, poi)
  ↓
1. Check if atmospheric scan complete (requirement)
2. Start surface scan progress
  ↓
completeScan(poiId, poi)
  ↓
3. Execute DRE: resolvePOIAction('surface_scan', context)
   - Rolls 2d6 + modifiers (deep_scanner, mining skill)
  ↓
4. SUCCESS:
   - Discover resources (minerals, water, structures)
   - Reveal child POIs (mining sites, ruins, colonies)
   - Add to shipState
```

---

#### **STEP 3: Deploy Landing Team** (Away Mission)
```
User clicks "Deploy Team" on landing site
  ↓
handleAwayMission(poiId, landingSite)
  ↓
1. Check requirements (AI crew available, not injured)
2. Show team deployment UI
3. User selects AI crew member(s)
  ↓
startAwayMission(selectedAI)
  ↓
4. Start mission timer (duration based on planet hazard level)
  ↓
completeAwayMission()
  ↓
5. Execute DRE: resolveAction('awayTeam', context)
   - context = { aiRoster, planet hazards, equipment }
   - Rolls for hazards, discoveries, loot
  ↓
6. Outcome:
   - Loot acquired
   - AI injury/status effects
   - Discoveries (data fragments, blueprints)
   - Display mission report
```

---

## 🌙 Moon Survey Flow

Same as Planet but:
- Smaller scale (fewer child POIs)
- Different hazard tables
- Lower resource yields
- Faster scan times

---

## 🛰️ Orbital Station Survey

```
User clicks "Scan Station"
  ↓
handleStationScan(poiId, poi)
  ↓
Execute DRE: resolvePOIAction('station_structural', context)
  ↓
Outcomes:
  - Structural integrity assessment
  - Docking bay status
  - Rogue AI/defense drones detected
  - Reveal child POIs (docking bays, command center, cargo holds)
```

---

## 📁 File Structure & Responsibilities

### **ShipCommandConsole.jsx**
- **State Management**: scanProgress, miningInProgress, terminalEvents, selectedPOI
- **Action Handlers**: handleScanCluster, handleMiningOptions, startMining, completeMining
- **UI Rendering**: POI markers, progress indicators, terminal feed
- **Event Scheduling**: Uses gameTickManager for timed events

### **dre/engine.js**
- **resolveAction()**: Main resolution pipeline
- **executeAsteroidScan()**: Cluster scanning logic
- **executeAsteroidMine()**: Mining logic
- **resolvePOIAction()**: Generic POI action resolver (future)

### **dre/tables.js**
- **CLUSTER_TYPE_CLASSIFICATION**: Types of asteroid clusters
- **ASTEROID_COMPOSITION**: Composition per asteroid
- **ASTEROID_LOOT_TABLES**: Loot by composition type
- **MINING_HAZARDS**: Potential mining failures

### **dre/poiActionTables.js**
- **atmospheric_scan**: Planet atmosphere analysis
- **surface_scan**: Planet surface resources
- **biosignature_scan**: Life detection
- **asteroid_mining**: Mining action definition
- **station_structural**: Station integrity scan

### **shipState.js**
- **registerCluster()**: Add scanned cluster
- **mineClusterAsteroid()**: Decrement asteroid count
- **getClusterByPOI()**: Lookup cluster data
- **scanPOI()**: Mark POI as scanned

### **inventoryManager.js**
- **addItem()**: Add mined resources to cargo
- **removeItem()**: Consume items
- **getItemCount()**: Check inventory

---

## 🎲 How DRE Works

### Core Roll Mechanics
```javascript
// 1. Roll base dice
const roll = rollNotation("2d6", rng); // or rollD20(rng)

// 2. Collect modifiers from all sources
const mods = collectModifiers(actionType, context);
// Returns: { ship: +3, ai: +1, environment: -2, total: +2 }

// 3. Calculate total
const totalRoll = roll.value + mods.total;

// 4. Check vs difficulty
const dc = DIFFICULTY_TDS[difficulty]; // { easy: 3, normal: 8, hard: 12 }
const success = totalRoll >= dc;

// 5. Determine outcome severity
const outcome = determineOutcome(totalRoll, outcomeTable);
```

### Modifier Sources (Priority Order)
1. **Ship Components** - Mining laser tier, sensor tier, etc.
2. **AI Crew** - Role bonuses, personality effects
3. **Research** - Unlocked tech (efficient mining, advanced scanning)
4. **Skills** - Player/crew skill levels
5. **Environment** - Radiation zones, hazards, cluster type
6. **Consequence** - Wake level, time pressure, crew fatigue

### Example Modifier Calculation
```javascript
// Mining action with Tier 2 laser, Engineer AI, Type-II cluster

Ship modifier:      +2 (Tier 2 mining laser)
AI modifier:        +1 (Engineer role bonus)
Environment:        +2 (Type-II composition bonus)
Research:           +1 (Efficient Mining unlocked)
─────────────────────
Total modifier:     +6

Roll: 2d6 = 8
Total: 8 + 6 = 14
DC: 8 (normal difficulty)
Result: SUCCESS (14 >= 8)
```

---

## 🔄 State Flow Diagram

```
┌─────────────────┐
│   User Action   │
│ (Scan Cluster)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ShipCommand     │
│ Console.jsx     │◄─── UI Events, State Updates
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DRE Engine     │
│  engine.js      │◄─── Dice Rolling, Modifier Collection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Outcome        │
│  Processing     │◄─── Loot, State Changes, Narrative
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│  Ship State     │  │  Terminal       │
│  Update         │  │  Output         │
└─────────────────┘  └─────────────────┘
         │                  │
         └────────┬─────────┘
                  │
                  ▼
           ┌─────────────┐
           │  UI Update  │
           └─────────────┘
```

---

## 🚀 Adding New Survey Types

### Example: Nebula Survey

1. **Add DRE Table** (`poiActionTables.js`):
```javascript
nebula_composition: {
  name: "Nebula Composition Scan",
  dice: "2d6",
  modifiers: [
    { source: "sensors", type: "shipSystem", bonus: 2 },
    { source: "science", type: "skill", bonus: 1 }
  ],
  outcomes: [
    {
      range: [2, 5],
      severity: "critical_failure",
      narrative: ["Sensor overload! Nebula interference causes damage."],
      effects: { damage: { system: "sensors", amount: 10 } }
    },
    {
      range: [9, 11],
      severity: "success",
      narrative: ["Nebula composition mapped: {gasType}."],
      effects: {
        data: { gasType: ["hydrogen", "helium", "methane"] },
        science: 25
      }
    }
  ]
}
```

2. **Add Handler** (`ShipCommandConsole.jsx`):
```javascript
const handleNebulaScan = (poiId, poi) => {
  // Add terminal message
  setTerminalEvents(prev => [...prev, {
    type: 'survey',
    conversational: ["Initiating nebula composition analysis..."],
    stream: ["&gt; NEBULA SCAN INITIATED"]
  }]);
  
  // Start scan progress
  setScanningInProgress({ poiId, startTime: getUniverseTime() });
  
  // Schedule completion
  scheduler.schedule(`nebula_scan_${poiId}`, 3.0);
};

const completeNebulaScan = (poiId, poi) => {
  const result = resolvePOIAction('nebula_composition', {
    systemTier: currentGalaxySystem.tier,
    difficulty: 'normal'
  });
  
  if (result.result === 'success') {
    // Process success
    shipState.scanPOI(poiId);
    // Display results
  }
};
```

3. **Add to POI Actions** (`poi_actions.json`):
```json
{
  "NEBULA": {
    "actions": [
      {
        "id": "scan_composition",
        "label": "Scan Composition",
        "dreTable": "nebula_composition",
        "duration": 3.0
      }
    ]
  }
}
```

---

## 🔍 Debugging Tips

### Enable Mining Logs
```javascript
console.log('[MINING] === Scan Result ===');
console.log('[MINING] Roll:', scanResult.totalRoll);
console.log('[MINING] DC:', scanResult.targetDifficulty);
console.log('[MINING] Modifiers:', scanResult.modifierBreakdown);
```

### Test Determinism
```javascript
const seed = 'test-seed-123';
const result1 = executeAsteroidMine(context, seed);
const result2 = executeAsteroidMine(context, seed);

// Should be identical
console.assert(result1.totalRoll === result2.totalRoll);
```

### Preview Odds
```javascript
import { previewOdds } from './lib/dre/preview.js';

const odds = previewOdds('mining', context);
console.log(odds.summary); // "Likely (68%) [+3]"
```

---

## 📝 Summary

### Current Implementation
✅ **Asteroid Mining** - Fully implemented with scan → mine → loot flow  
✅ **DRE System** - Core dice engine with modifiers  
✅ **Ship State** - Cluster tracking, inventory management  
✅ **Terminal Output** - Rich feedback with conversational + stream modes  

### To Be Implemented
❌ **Planet Surveys** - Atmospheric, surface, biosignature scans  
❌ **Moon Surveys** - Simplified planet flow  
❌ **Station Surveys** - Structural, hacking, docking flows  
❌ **Away Missions** - Deploy AI crew for ground ops  
❌ **POI Action Panel** - Generic action UI for all POI types  

### Key Files to Work With
- `ShipCommandConsole.jsx` - Add new handlers following `handleScanCluster` pattern
- `dre/poiActionTables.js` - Add new DRE tables for each survey type
- `dre/engine.js` - Add new resolution functions if needed
- `poi_actions.json` - Define available actions per POI type
- `shipState.js` - Add new state tracking methods

---

**Built for The Surge** - A holographic space survival game 🚀
