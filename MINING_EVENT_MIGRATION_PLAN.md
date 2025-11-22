# Mining System → Event Engine Migration Plan

## Executive Summary

**Goal**: Move the current hardcoded "Survey Asteroid Belt" and "Mine Asteroids" actions from `ShipCommandConsole.jsx` into the Event Engine system.

**Benefits**:
- ✅ Configurable narrative variations via Narrative Pools
- ✅ Configurable loot drops via Loot Pools  
- ✅ Designer-controlled balance (weights, difficulties, rewards)
- ✅ Reusable content across different mining scenarios
- ✅ Centralized event management in Admin UI
- ✅ Consistent player experience with other event types

---

## Current System Analysis

### Current Flow (Hardcoded in ShipCommandConsole.jsx)

```
1. SURVEY PHASE:
   User clicks "Scan Cluster" on BELT POI
   → handleScanCluster(poiId, poi)
   → executeAsteroidScan() from DRE
   → SUCCESS: Register cluster to shipState + show terminal output
   → FAILURE: Show scan failure notification

2. MINING PHASE:
   User clicks "Mine Asteroids" on scanned BELT POI
   → handleMiningOptions(poiId, cluster)
   → Show mining confirmation in terminal
   → User confirms
   → startMining(poiId)
   → Schedule completion via gameTickManager
   → completeMining(poiId, cluster)
   → executeAsteroidMine() from DRE
   → Add loot to inventory + update cluster asteroid count
```

### Current Components Involved

**Frontend:**
- `ShipCommandConsole.jsx` - Hardcoded handlers for scan/mine
- `RightPanelTabs.jsx` - Belt POI action buttons
- `ActionsPanel.jsx` - POI-based action UI (minimal usage)
- `poiActionSystem.js` - POI action definitions (has BELT actions defined but unused)

**DRE (Dice Roll Engine):**
- `dre/engine.js` - `executeAsteroidScan()` and `executeAsteroidMine()`
- `dre/poiActionTables.js` - `asteroid_mining` table with outcomes
- `dre/narrative.js` - Resolvers: `resolveScanCluster()` and `resolveMineAsteroid()`

**Ship State:**
- `shipState.js` - Cluster registration, asteroid tracking, recovery system

---

## Migration Architecture

### Phase 1: Event Configuration (Backend)

Create two new events in `backend/data/events_poi.json`:

#### Event 1: "survey_asteroid_belt"

```json
{
  "id": "survey_asteroid_belt",
  "metadata": {
    "title": "Survey Asteroid Belt",
    "description": "Initiate deep scan of asteroid cluster to identify composition and mining potential.",
    "tags": ["exploration", "mining", "survey", "belt"],
    "enabled": true
  },
  "trigger": {
    "type": "poi_action",
    "action": "survey",
    "weight": 1.0,
    "conditions": {
      "poiType": "BELT",
      "requires": {
        "shipSystems": ["sensors"],
        "notScanned": true
      }
    }
  },
  "scenario": {
    "title": "Asteroid Belt Survey",
    "description": "Your sensors detect a dense cluster of asteroids. A deep scan could reveal composition and mining viability.",
    "location": "asteroid_belt",
    "systemMessage": "[SENSORS] Asteroid cluster detected. Initiating deep-field scan protocol."
  },
  "branches": [
    {
      "id": "initiate_scan",
      "label": "Initiate deep scan of asteroid cluster",
      "challenge": {
        "mode": "skillCheck",
        "difficulty": "easy",
        "skills": ["sensors", "perception"],
        "baseTarget": 8,
        "description": "Basic sensor sweep to identify cluster composition and size."
      },
      "outcomes": [
        {
          "weight": 0.7,
          "type": "success",
          "narrativePool": "scan_discovery",  // References narrative pool
          "rewards": {
            "credits": 0,
            "xp": 25,
            "rewardType": "none",
            "clusterData": {
              "register": true,  // Special flag to register cluster to shipState
              "type": "{clusterType}",  // Interpolated from narrative
              "size": "{clusterSize}",
              "compositionBonus": "{compositionBonus}",
              "miningRate": "{miningRate}",
              "recoveryRate": "{recoveryRate}"
            }
          },
          "nextEvent": {
            "eventId": "mine_asteroid_belt",
            "autoTrigger": false,
            "availableAfter": true
          }
        },
        {
          "weight": 0.3,
          "type": "failure",
          "narrative": "Sensor interference from dense asteroid field. Unable to determine composition.",
          "systemMessage": "[SCAN FAILED] Insufficient sensor resolution. Recommend repositioning or equipment upgrade.",
          "rewards": {
            "credits": 0,
            "xp": 10,
            "rewardType": "none"
          }
        }
      ]
    },
    {
      "id": "skip",
      "label": "Skip scan and continue exploration",
      "challenge": null,
      "outcomes": [
        {
          "weight": 1.0,
          "type": "safe_exit",
          "narrative": "You note the cluster's position and move on.",
          "rewards": null
        }
      ]
    }
  ]
}
```

#### Event 2: "mine_asteroid_belt"

```json
{
  "id": "mine_asteroid_belt",
  "metadata": {
    "title": "Mine Asteroid Cluster",
    "description": "Extract valuable minerals from registered asteroid cluster.",
    "tags": ["mining", "resources", "loot", "belt"],
    "enabled": true
  },
  "trigger": {
    "type": "poi_action",
    "action": "mine",
    "weight": 1.0,
    "conditions": {
      "poiType": "BELT",
      "requires": {
        "shipSystems": ["mining_laser"],
        "clusterRegistered": true,
        "asteroidsAvailable": true
      }
    }
  },
  "scenario": {
    "title": "Mining Operation",
    "description": "Cluster {clusterType} ready for extraction. {currentAsteroids} asteroids available.",
    "location": "asteroid_belt",
    "systemMessage": "[MINING] Laser systems armed. Targeting asteroid for extraction."
  },
  "branches": [
    {
      "id": "commence_mining",
      "label": "Commence mining operation",
      "challenge": {
        "mode": "skillCheck",
        "difficulty": "normal",
        "skills": ["mining_laser", "mining"],
        "baseTarget": 10,
        "modifiers": [
          {
            "source": "compositionBonus",
            "type": "environment",
            "bonus": "{clusterCompositionBonus}"
          }
        ],
        "description": "Extract minerals from asteroid without destabilizing its structure."
      },
      "outcomes": [
        {
          "weight": 0.5,
          "type": "success",
          "narrativePool": "mining_success",  // Uses narrative pool
          "rewards": {
            "credits": 200,
            "xp": 50,
            "rewardType": "lootPool",
            "lootPool": "asteroid_mining",  // Uses loot pool
            "asteroidConsumed": true  // Special flag to decrement cluster count
          }
        },
        {
          "weight": 0.3,
          "type": "partial_success",
          "narrativePool": "mining_success",
          "rewards": {
            "credits": 100,
            "xp": 30,
            "rewardType": "lootPool",
            "lootPool": "asteroid_mining_reduced",
            "asteroidConsumed": true
          }
        },
        {
          "weight": 0.2,
          "type": "failure",
          "narrativePool": "mining_failure",
          "rewards": {
            "credits": 0,
            "xp": 10,
            "rewardType": "none",
            "damage": {
              "system": "mining_laser",
              "amount": 5
            },
            "asteroidConsumed": true  // Still consumed on failure
          }
        }
      ]
    },
    {
      "id": "cancel",
      "label": "Cancel mining operation",
      "challenge": null,
      "outcomes": [
        {
          "weight": 1.0,
          "type": "safe_exit",
          "narrative": "Mining operation cancelled. Laser systems disarmed.",
          "rewards": null
        }
      ]
    }
  ]
}
```

---

### Phase 2: Event Engine Enhancements (Backend)

#### New Event Trigger Type: `poi_action`

**Location**: `backend/services/eventTriggerService.js` (create if doesn't exist)

```javascript
/**
 * Check if POI action event should trigger
 * @param {Object} event - Event definition
 * @param {Object} context - { poiType, action, shipState, poi }
 * @returns {boolean} - Whether event can trigger
 */
function checkPOIActionTrigger(event, context) {
  const { trigger } = event;
  const { poiType, action, shipState, poi } = context;
  
  // Match POI type
  if (trigger.conditions?.poiType && trigger.conditions.poiType !== poiType) {
    return false;
  }
  
  // Match action type
  if (trigger.action && trigger.action !== action) {
    return false;
  }
  
  // Check requirements
  if (trigger.conditions?.requires) {
    const req = trigger.conditions.requires;
    
    // Check ship systems
    if (req.shipSystems) {
      for (const system of req.shipSystems) {
        if (!shipState.hasOperationalSystem(system)) {
          return false;
        }
      }
    }
    
    // Check if cluster is registered (for mining)
    if (req.clusterRegistered) {
      const cluster = shipState.getClusterByPOI(poi.id);
      if (!cluster) return false;
    }
    
    // Check if asteroids are available
    if (req.asteroidsAvailable) {
      const cluster = shipState.getClusterByPOI(poi.id);
      if (!cluster || cluster.currentAsteroids === 0) {
        return false;
      }
    }
    
    // Check if NOT already scanned (for survey)
    if (req.notScanned) {
      const cluster = shipState.getClusterByPOI(poi.id);
      if (cluster) return false; // Already registered = scanned
    }
  }
  
  return true;
}
```

#### New Outcome Processor: Special Flags

**Location**: `backend/services/eventOutcomeProcessor.js` (create if doesn't exist)

```javascript
/**
 * Process special outcome flags for mining events
 * @param {Object} outcome - Event outcome
 * @param {Object} context - { shipState, poi, eventData }
 */
function processOutcomeFlags(outcome, context) {
  const { rewards } = outcome;
  const { shipState, poi, eventData } = context;
  
  // Register cluster to shipState
  if (rewards?.clusterData?.register) {
    const clusterData = {
      type: interpolate(rewards.clusterData.type, eventData),
      size: interpolate(rewards.clusterData.size, eventData),
      compositionBonus: parseInt(interpolate(rewards.clusterData.compositionBonus, eventData)),
      miningRate: parseFloat(interpolate(rewards.clusterData.miningRate, eventData)),
      recoveryRate: parseFloat(interpolate(rewards.clusterData.recoveryRate, eventData))
    };
    
    shipState.registerCluster(poi.id, clusterData);
  }
  
  // Consume asteroid from cluster
  if (rewards?.asteroidConsumed) {
    const cluster = shipState.getClusterByPOI(poi.id);
    if (cluster) {
      shipState.mineClusterAsteroid(cluster.id);
    }
  }
  
  // Apply damage to ship systems
  if (rewards?.damage) {
    const { system, amount } = rewards.damage;
    shipState.damageSystem(system, amount);
  }
}

/**
 * Interpolate narrative variables from event data
 * @param {string} template - Template string with {variables}
 * @param {Object} data - Data object with variable values
 * @returns {string} - Interpolated string
 */
function interpolate(template, data) {
  if (typeof template !== 'string') return template;
  
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}
```

---

### Phase 3: Frontend Integration

#### Step 1: Event Trigger from POI Actions

**Location**: `src/lib/eventEngine.js` (create new client-side event engine)

```javascript
import api from './api/client';

class EventEngine {
  constructor() {
    this.activeEvent = null;
    this.eventHistory = [];
  }
  
  /**
   * Trigger POI action event
   * @param {string} action - Action type ('survey', 'mine', 'dock', etc.)
   * @param {Object} poi - POI object
   * @param {Object} shipState - Ship state manager
   * @returns {Promise<Object>} - Event data or null if no event triggered
   */
  async triggerPOIAction(action, poi, shipState) {
    try {
      // Query backend for matching events
      const response = await api.events.query({
        triggerType: 'poi_action',
        action,
        poiType: poi.type
      });
      
      if (!response.events || response.events.length === 0) {
        console.log(`[EventEngine] No events found for action: ${action}, POI type: ${poi.type}`);
        return null;
      }
      
      // Filter events by trigger conditions
      const eligibleEvents = response.events.filter(event => {
        return this.checkTriggerConditions(event, { poi, shipState, action });
      });
      
      if (eligibleEvents.length === 0) {
        console.log(`[EventEngine] No eligible events after condition check`);
        return null;
      }
      
      // Weight-based selection
      const selectedEvent = this.selectWeightedEvent(eligibleEvents);
      
      // Store active event
      this.activeEvent = {
        ...selectedEvent,
        context: { poi, action }
      };
      
      return this.activeEvent;
      
    } catch (error) {
      console.error('[EventEngine] Error triggering POI action:', error);
      return null;
    }
  }
  
  /**
   * Check if event trigger conditions are met
   */
  checkTriggerConditions(event, context) {
    const { trigger } = event;
    const { poi, shipState, action } = context;
    
    if (!trigger || !trigger.conditions) return true;
    
    const cond = trigger.conditions;
    
    // Check POI type
    if (cond.poiType && cond.poiType !== poi.type) {
      return false;
    }
    
    // Check requirements
    if (cond.requires) {
      const req = cond.requires;
      
      // Ship systems check (simplified - full check on backend)
      if (req.shipSystems && req.shipSystems.length > 0) {
        // Assume operational for now, backend will validate
      }
      
      // Cluster registration check
      if (req.clusterRegistered) {
        const cluster = shipState.getClusterByPOI(poi.id);
        if (!cluster) return false;
      }
      
      // Asteroids available check
      if (req.asteroidsAvailable) {
        const cluster = shipState.getClusterByPOI(poi.id);
        if (!cluster || cluster.currentAsteroids === 0) {
          return false;
        }
      }
      
      // Not scanned check
      if (req.notScanned) {
        const cluster = shipState.getClusterByPOI(poi.id);
        if (cluster) return false;
      }
    }
    
    return true;
  }
  
  /**
   * Select event based on weights
   */
  selectWeightedEvent(events) {
    const totalWeight = events.reduce((sum, e) => sum + (e.trigger.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const event of events) {
      random -= (event.trigger.weight || 1);
      if (random <= 0) return event;
    }
    
    return events[0]; // Fallback
  }
  
  /**
   * Execute branch selection and resolve outcome
   */
  async executeBranch(branchId, eventId) {
    // This would handle DRE roll, outcome selection, narrative pool resolution, etc.
    // Similar to existing event system but adapted for POI actions
  }
}

export default new EventEngine();
```

#### Step 2: Replace Hardcoded Handlers

**Location**: `src/components/ShipCommandConsole.jsx`

**BEFORE** (Current hardcoded approach):
```javascript
const handleScanCluster = (poiId, poi) => {
  // 50+ lines of hardcoded logic...
  const scanResult = executeAsteroidScan(scanContext);
  // Manual terminal output construction...
  // Manual cluster registration...
};
```

**AFTER** (Event Engine integration):
```javascript
import eventEngine from '../lib/eventEngine';
import EventModal from './EventModal'; // Reuse existing event modal

const [activeEventModal, setActiveEventModal] = useState(null);

const handleScanCluster = async (poiId, poi) => {
  console.log('[EventEngine] Triggering survey action for POI:', poiId);
  
  const event = await eventEngine.triggerPOIAction('survey', poi, shipState);
  
  if (!event) {
    // Fallback to old system if no event configured
    console.warn('[EventEngine] No event configured, using legacy scan system');
    handleScanClusterLegacy(poiId, poi);
    return;
  }
  
  // Open event modal with event data
  setActiveEventModal({
    event,
    onBranchSelect: (branchId) => handleEventBranchSelect(event.id, branchId, poi),
    onClose: () => setActiveEventModal(null)
  });
};

const handleEventBranchSelect = async (eventId, branchId, poi) => {
  try {
    // Execute branch via backend event engine
    const result = await api.events.executeBranch(eventId, branchId, {
      poiId: poi.id,
      poiType: poi.type,
      shipState: shipState.exportState()
    });
    
    // Process outcome
    processEventOutcome(result, poi);
    
    // Close modal
    setActiveEventModal(null);
    
  } catch (error) {
    console.error('[EventEngine] Branch execution error:', error);
  }
};

const processEventOutcome = (result, poi) => {
  const { outcome, narrative, rewards, clusterData } = result;
  
  // Add to terminal feed
  const conversational = [
    `"${narrative.description}"`,
    narrative.systemMessage ? `"${narrative.systemMessage}"` : null
  ].filter(Boolean);
  
  const stream = [
    `> ${narrative.title.toUpperCase()}`,
    ...narrative.details || [],
    rewards?.credits ? `> Credits: +${rewards.credits}` : null,
    rewards?.xp ? `> XP: +${rewards.xp}` : null
  ].filter(Boolean);
  
  setTerminalEvents(prev => [...prev, {
    id: `evt_${outcome.type}_${Date.now()}`,
    type: outcome.type,
    timestamp: Date.now(),
    conversational,
    stream,
    meta: { 
      poiId: poi.id,
      title: narrative.title,
      eventId: result.eventId
    }
  }]);
  
  // Handle cluster registration (if scan success)
  if (clusterData?.registered) {
    console.log('[EventEngine] Cluster registered:', clusterData);
    // shipState.registerCluster() already called on backend
    // Just update UI state
    setShipStateVersion(v => v + 1);
  }
  
  // Handle loot rewards
  if (rewards?.items && rewards.items.length > 0) {
    console.log('[EventEngine] Items received:', rewards.items);
    // Add to inventory via inventory manager
    rewards.items.forEach(item => {
      inventoryManager.addItem(item.id, item.quantity);
    });
  }
  
  // Handle damage
  if (rewards?.damage) {
    console.log('[EventEngine] System damage:', rewards.damage);
    // Apply damage to ship systems
    shipState.damageSystem(rewards.damage.system, rewards.damage.amount);
    setShipStateVersion(v => v + 1);
  }
};
```

#### Step 3: Update POI Action Buttons

**Location**: `src/components/RightPanelTabs.jsx`

**BEFORE**:
```javascript
<button onClick={() => onScanCluster(poi.id, poi)}>
  🔍 Scan Cluster
</button>
```

**AFTER** (No change needed - same handler, different implementation):
```javascript
<button onClick={() => onScanCluster(poi.id, poi)}>
  🔍 Scan Cluster
</button>
```

The `onScanCluster` handler in `ShipCommandConsole` now uses the event engine instead of hardcoded logic.

---

### Phase 4: Config Integration

#### Narrative Pools (Already Created)

**Location**: `backend/data/config.json` → `narrativeLibrary.pools`

```json
{
  "narrativeLibrary": {
    "pools": [
      {
        "id": "scan_discovery",
        "name": "Asteroid Scan Discovery",
        "category": "mining",
        "entries": [
          {
            "weight": 35,
            "title": "Type-I Iron Cluster",
            "message": "Sensors identify a common iron-rich asteroid cluster. Standard density, minimal volatiles.",
            "systemMessage": "CLASSIFICATION: Type-I Ferrous. Composition: 75% iron ore, 20% silicates, 5% trace elements.",
            "tone": "neutral",
            "assignDefinition": "type_i_iron"
          },
          // ... more entries
        ]
      },
      {
        "id": "mining_success",
        "name": "Mining Success Narratives",
        "category": "mining",
        "entries": [
          {
            "weight": 40,
            "title": "Rich Vein Discovered",
            "message": "Your mining laser breaches a particularly dense deposit. Ore extraction exceeds expectations!",
            "systemMessage": "MINING EFFICIENCY: +15%. Extracted premium-grade ore.",
            "tone": "positive"
          },
          // ... more entries
        ]
      },
      {
        "id": "mining_failure",
        "name": "Mining Failure Narratives",
        "category": "mining",
        "entries": [
          {
            "weight": 50,
            "title": "Equipment Malfunction",
            "message": "Mining laser overheats during extraction. Thermal regulators strained.",
            "systemMessage": "WARNING: Laser efficiency reduced. Recommend cooldown period.",
            "tone": "negative"
          },
          // ... more entries
        ]
      }
    ]
  }
}
```

#### Loot Pools (Already Created)

**Location**: `backend/data/config.json` → `lootTables.pools`

```json
{
  "lootTables": {
    "pools": [
      {
        "id": "asteroid_mining",
        "name": "Asteroid Mining Loot",
        "description": "Standard asteroid mining yields",
        "entries": [
          {
            "itemId": "iron_ore",
            "weight": 70,
            "minQuantity": 5,
            "maxQuantity": 15
          },
          {
            "itemId": "platinum_ore",
            "weight": 20,
            "minQuantity": 2,
            "maxQuantity": 8
          },
          {
            "itemId": "helium3",
            "weight": 10,
            "minQuantity": 1,
            "maxQuantity": 3
          }
        ]
      },
      {
        "id": "asteroid_mining_reduced",
        "name": "Reduced Mining Yield",
        "description": "Poor mining results",
        "entries": [
          {
            "itemId": "iron_ore",
            "weight": 80,
            "minQuantity": 1,
            "maxQuantity": 5
          },
          {
            "itemId": "platinum_ore",
            "weight": 20,
            "minQuantity": 1,
            "maxQuantity": 2
          }
        ]
      }
    ]
  }
}
```

---

## Implementation Steps

### ✅ Step 1: Backend Event Definitions (1-2 hours)
1. Create `survey_asteroid_belt` event in `events_poi.json`
2. Create `mine_asteroid_belt` event in `events_poi.json`
3. Test event loading via `/api/events?triggerType=poi_action`

### ✅ Step 2: Backend Services (2-3 hours)
1. Create `eventTriggerService.js` with `checkPOIActionTrigger()`
2. Create `eventOutcomeProcessor.js` with special flag handlers
3. Add API endpoint `/api/events/execute-branch` for DRE integration
4. Test trigger condition matching
5. Test outcome processing (cluster registration, loot drops)

### ✅ Step 3: Frontend Event Engine (3-4 hours)
1. Create `src/lib/eventEngine.js` with `triggerPOIAction()`
2. Add narrative pool resolution to outcome processing
3. Add loot pool resolution to outcome processing
4. Test event triggering from POI actions
5. Test modal display and branch selection

### ✅ Step 4: Replace Hardcoded Logic (2-3 hours)
1. Update `handleScanCluster()` in `ShipCommandConsole.jsx`
2. Update `handleMiningOptions()` / `startMining()` in `ShipCommandConsole.jsx`
3. Add fallback to legacy system if no event configured
4. Test survey flow (scan → register cluster → terminal output)
5. Test mining flow (mine → loot drop → asteroid decrement)

### ✅ Step 5: UI Polish (1-2 hours)
1. Ensure EventModal supports POI context display
2. Add cluster stats to event modal (asteroids remaining, composition)
3. Add mining progress indicator (if timed action)
4. Test full player experience flow

### ✅ Step 6: DRE Integration (2-3 hours)
1. Link event branch challenges to DRE tables
2. Map DRE outcomes to narrative pools
3. Ensure skill/modifier system works with POI actions
4. Test difficulty scaling (easy scan, normal mining)

### ⏳ Step 7: Legacy Cleanup (1 hour)
1. Remove old `handleScanCluster` / `completeScan` functions (keep as fallback)
2. Remove old `handleMiningOptions` / `startMining` / `completeMining` functions
3. Archive old terminal output construction code
4. Document migration for other POI actions (dock, investigate, etc.)

---

## What Stays in Game Code vs Event Engine

### ❌ REMOVE from Game Code (Move to Event Engine)

- **Narrative text** - All hardcoded messages → Narrative Pools
- **Loot tables** - Hardcoded iron_ore, platinum_ore drops → Loot Pools
- **Difficulty/DC values** - Hardcoded DC 8, DC 10 → Event challenge.baseTarget
- **Outcome weights** - Hardcoded 70% success, 30% failure → Event outcome.weight
- **Rewards** - Hardcoded credits, XP → Event outcome.rewards
- **Survey/mining logic flow** - Hardcoded scan → register → mine flow → Event trigger conditions

### ✅ KEEP in Game Code (Game Engine Responsibility)

- **POI rendering** - Visual display of asteroid belts in solar system
- **Ship movement** - Navigation to POI location
- **Cluster tracking** - `shipState.js` cluster registration and asteroid counts
- **Recovery system** - Asteroid regeneration over time (game time, not event time)
- **Inventory management** - Adding loot to inventory (called by event engine)
- **Ship systems** - Damage application, system status (called by event engine)
- **Terminal feed** - Display of event outcomes (receives data from event engine)
- **DRE execution** - Dice rolling, modifiers (called by event engine, not replaced)
- **Game tick manager** - Time-based action scheduling (mining duration)

### 🔄 BRIDGE Components (Shared Responsibility)

- **Event triggering** - Game detects POI action → Event engine selects event
- **Outcome processing** - Event engine resolves outcome → Game applies effects
- **Modal display** - Event engine provides data → Game renders EventModal
- **Condition checking** - Event engine checks trigger conditions → Game provides context (shipState, POI data)

---

## Testing Checklist

### Survey Event Testing

- [ ] Click "Scan Cluster" on unscanned BELT POI → Triggers `survey_asteroid_belt` event
- [ ] Event modal displays with scan branch
- [ ] Select "Initiate deep scan" → Executes DRE roll
- [ ] Success outcome → Narrative from `scan_discovery` pool displayed
- [ ] Cluster registered to shipState with correct data (type, size, composition)
- [ ] Terminal shows survey report with cluster stats
- [ ] XP reward applied correctly
- [ ] Next visit to same POI → "Mine Asteroids" button now enabled

### Mining Event Testing

- [ ] Click "Mine Asteroids" on scanned BELT POI → Triggers `mine_asteroid_belt` event
- [ ] Event modal displays cluster stats (type, asteroids remaining)
- [ ] Select "Commence mining" → Executes DRE roll with composition bonus
- [ ] Success outcome → Narrative from `mining_success` pool displayed
- [ ] Loot from `asteroid_mining` pool added to inventory
- [ ] Asteroid count decrements by 1
- [ ] Credits and XP rewards applied
- [ ] Terminal shows mining report with loot list
- [ ] When asteroids = 0 → Mining button disabled, "Depleted" message shown

### Failure Cases

- [ ] Survey failure → No cluster registered, can retry scan
- [ ] Mining failure → Asteroid consumed, no loot, damage applied
- [ ] Mining on depleted cluster → Error message, event doesn't trigger
- [ ] Missing requirements (no mining laser) → Event doesn't trigger

### Narrative/Loot Pool Variety

- [ ] Scan 5 clusters → Different narratives each time (verify randomization)
- [ ] Mine 10 asteroids → Different loot combinations (verify weights)
- [ ] Check narrative tone affects display (color coding in terminal)

---

## Migration Benefits

### For Players
- ✨ **Emergent variety** - Same action, different story every time
- 🎲 **Fair randomization** - Clear percentages, weight-based outcomes
- 📊 **Transparent mechanics** - See exact chances, difficulty targets
- 🎯 **Consistent UI** - All events use same modal, terminal format

### For Designers
- 🎨 **No code changes** - Edit narratives/loot in admin UI
- ⚖️ **Easy balancing** - Adjust weights, rewards, difficulties via config
- 📚 **Reusable content** - One narrative pool → Many events
- 🔍 **Event analytics** - Track which outcomes fire most (future feature)

### For Developers
- 🧹 **Cleaner code** - Remove 200+ lines of hardcoded logic
- 🔧 **Maintainable** - Event definitions in JSON, not scattered in code
- 🧪 **Testable** - Mock events, test outcomes independently
- 🚀 **Scalable** - Add new mining events without touching game code

---

## Future Enhancements

### Short-term (Post-Migration)
- Add more mining event variations (exotic asteroids, pirate ambushes)
- Create mining missions (mine X asteroids for faction)
- Add mining equipment upgrades (affects difficulty, yield)

### Long-term
- **POI Definitions System** - Assign persistent types to POIs (Type-I Iron, Type-II Platinum)
- **Dynamic encounters** - Mining triggers combat event (pirates)
- **Cluster exhaustion** - Depleted clusters become "barren" POI type
- **Mining contracts** - NPCs request specific ore types
- **Mining fleet management** - Send NPC miners to clusters

---

## Risk Mitigation

### Fallback Strategy
Keep legacy mining code as fallback:
```javascript
const handleScanCluster = async (poiId, poi) => {
  const event = await eventEngine.triggerPOIAction('survey', poi, shipState);
  
  if (!event) {
    // No event configured - use legacy system
    console.warn('[EventEngine] Using legacy scan system');
    return handleScanClusterLegacy(poiId, poi);
  }
  
  // Event engine path...
};
```

### Gradual Migration
1. Phase 1: Survey only (lower risk)
2. Phase 2: Mining (depends on survey working)
3. Phase 3: Remove legacy code (after validation)

### Rollback Plan
If event engine has critical bugs:
1. Set event `enabled: false` in JSON
2. System automatically falls back to legacy handlers
3. Fix bugs in event engine
4. Re-enable events

---

## Conclusion

This migration moves **narrative variety** and **loot configuration** out of code and into the hands of designers via the Event Engine and Config Editor. The game code becomes a **thin integration layer** that triggers events and applies outcomes, while all content lives in configurable JSON.

**Estimated Total Time**: 12-18 hours
**Risk Level**: Medium (legacy fallback reduces risk)
**Player Impact**: Positive (more variety, same UX)
**Developer Impact**: Major improvement (maintainability, extensibility)
