# Encounters System - Integration Guide

## 🎯 **What It Does**

The Encounters system is a **fully integrated event outcome** that handles NPC interactions through your existing event engine:
- **Hostile encounters** (pirates, bandits, aggressive factions)
- **Neutral encounters** (traders, patrols, random ships)
- **Positive encounters** (rescue missions, friendly ships, allies)

**Key Architecture:** Encounters are **event outcomes**, not standalone triggers. They flow through the same event pipeline as loot, narrative, and rewards.

---

## 🔧 **How It Integrates**

### **Event Flow Architecture**

```
PLAYER ACTION (mine/survey/scan)
  ↓
BACKEND: eventTriggerService checks conditions
  ↓
EVENT TRIGGERED (from events_poi.json or events_dynamic.json)
  ↓
PLAYER CHOOSES BRANCH
  ↓
BACKEND: executeBranch() rolls outcome
  ↓
IF outcome.encounter exists:
  ├─ resolveEncounter() fetches from encounters.json
  ├─ Filters by disposition & tags
  └─ Returns encounter data
  ↓
FRONTEND: Displays encounter with trade/combat/diplomacy options
```

### **Example Event with Encounter Outcome**

From `events_poi.json`:
```json
{
  "id": "survey_derelict_station",
  "branches": [
    {
      "id": "investigate",
      "label": "Board the station and investigate",
      "subScenarios": [
        {
          "id": "trap_raiders",
          "weight": 0.2,
          "outcomeType": "encounter",
          "narrative": {
            "title": "Ambush!",
            "description": "Raiders emerge from the shadows!"
          },
          "encounter": {
            "disposition": "hostile",
            "tags": ["pirate", "ambush"]
          },
          "rewards": {
            "xp": 75
          }
        }
      ]
    }
  ]
}
```

**What Happens:**
1. Player surveys derelict station
2. Chooses "investigate" branch
3. Outcome rolls 20% chance → "trap_raiders"
4. Backend calls `resolveEncounter({disposition: "hostile", tags: ["pirate", "ambush"]})`
5. Returns `enc_pirate_ambush_001` from `encounters.json`
6. Frontend displays encounter modal with combat/trade/diplomacy options

---

## 🚀 **How to Use It (No Coding Required)**

### **Step 1: Access Admin Panel**

1. Navigate to: **http://localhost:3001/admin**
2. Login with your admin credentials
3. Click the **"Encounters"** tab (👾 icon)

### **Step 2: Create Encounters**

Encounters are **data templates** that get selected by events. Create diverse encounters for different situations:

You'll see a table with 5 pre-configured encounters:
- **Pirate Ambush** (Hostile) - Combat/Trade/Diplomacy
- **Independent Trader** (Neutral) - Trade/Diplomacy
- **Distress Signal** (Positive) - Rescue/Diplomacy
- **Military Patrol** (Neutral) - Inspection/Compliance
- **Derelict Mystery** (Neutral) - Exploration/Danger

### **Step 3: Create New Encounter**

1. Click **"CREATE NEW"** button
2. Fill out the form:

**Basic Fields:**
```
Name: "Friendly Convoy"
Disposition: Positive
Ship Class: "Transport Fleet"
Faction: "Trade Alliance"
Weight: 1.5
Description: "A merchant convoy shares supplies and information"
```

**Encounter Options:**
- ☑️ Enable Trading (if they can buy/sell)
- ☐ Enable Combat (if hostile/combat possible)
- ☑️ Enable Diplomacy (if dialogue/choices available)

3. Click **"CREATE ENCOUNTER"**

### **Step 4: Edit Existing Encounters**

1. Find encounter in table
2. Click **"EDIT"** button
3. Modify any fields
4. Click **"UPDATE ENCOUNTER"**

### **Step 5: Enable/Disable Encounters**

- Click the **STATUS** button (● ACTIVE / ○ DISABLED)
- Disabled encounters won't trigger in-game
- Useful for seasonal/event-based encounters

### **Step 6: Filter & Search**

**Filters:**
- **ALL** - Show everything
- **HOSTILE** ⚔️ - Pirates, bandits, enemies
- **NEUTRAL** ⚡ - Traders, patrols, random ships
- **POSITIVE** 🤝 - Rescues, allies, friendly

**Search:**
- Type encounter name or ID
- Real-time filtering

---

## 🔧 **API Integration (For Frontend)**

### **Trigger an Encounter**

**Endpoint:** `POST http://localhost:3001/api/encounters/trigger`

**Request Body:**
```json
{
  "disposition": "hostile",
  "location": "asteroid_belt",
  "wake": 0.6,
  "reputation": 0
}
```

**Response:**
```json
{
  "success": true,
  "triggered": true,
  "encounter": {
    "id": "enc_pirate_ambush_001",
    "name": "Pirate Ambush - Scavenger Crew",
    "disposition": "hostile",
    "dialogue": {
      "initial": "Well, well... what do we have here?",
      "hostile": "Wrong answer, friend. Weapons hot!",
      "friendly": "Smart move. Drop your cargo...",
      "neutral": "You got guts, I'll give you that."
    },
    "options": {
      "trade": { "enabled": true, "inventory": [...] },
      "combat": { "enabled": true, "difficulty": "medium" },
      "diplomacy": { "enabled": true, "outcomes": [...] }
    }
  }
}
```

### **Get All Encounters**

**Endpoint:** `GET http://localhost:3001/api/encounters`

**Optional Query Params:**
- `?disposition=hostile` - Filter by type
- `?enabled=true` - Only active encounters
- `?tags=pirate,combat` - Filter by tags

---

## 🎮 **Example Usage Scenarios**

### **Scenario 1: Random Encounter While Traveling**

**Game Event:** Player enters dark zone

**Frontend Code Calls:**
```javascript
const response = await fetch('http://localhost:3001/api/encounters/trigger', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    disposition: 'hostile', // Or randomly choose
    location: 'dark_zone',
    wake: playerShip.currentWake,
    reputation: playerShip.reputation
  })
});

const data = await response.json();

if (data.triggered) {
  // Show encounter modal with data.encounter
  showEncounterModal(data.encounter);
}
```

### **Scenario 2: Trader Encounter**

**Game Event:** Player approaches trading station

**System Checks:**
```json
{
  "disposition": "neutral",
  "location": "trade_route",
  "wake": 0.3,
  "reputation": 50
}
```

**Result:** Triggers "Independent Trader" encounter
- Shows trading UI with `encounter.options.trade.inventory`
- Player can buy fuel cells, repair kits, advanced scanner

### **Scenario 3: Distress Signal**

**Game Event:** Random check while in deep space

**System Checks:**
```json
{
  "disposition": "positive",
  "location": "deep_space",
  "wake": 0.2,
  "reputation": 20
}
```

**Result:** Triggers "Distress Signal" encounter
- Player sees dialogue: "...requesting assistance... life support at 12%..."
- Options via `encounter.options.diplomacy.outcomes`:
  - Rescue Full (costs 200 credits + 2 repair kits)
  - Rescue Minimal (costs 50 credits)
  - Relay Signal (free)

---

## 📊 **Encounter Data Structure**

```json
{
  "id": "enc_unique_id",
  "name": "Display Name",
  "disposition": "hostile|neutral|positive",
  "description": "Brief description shown to player",
  
  "shipClass": "Visual detail",
  "faction": "Which group they belong to",
  "weight": 1.5, // Higher = more likely to trigger
  "enabled": true,
  
  "triggerConditions": {
    "wake": { "min": 0.4, "max": 1.0 },
    "locations": ["asteroid_belt", "dark_zone"],
    "reputation": { "min": -100, "max": 100 }
  },
  
  "dialogue": {
    "initial": "First contact message",
    "hostile": "If player attacks",
    "friendly": "If player cooperates",
    "neutral": "If player declines"
  },
  
  "options": {
    "trade": {
      "enabled": true,
      "inventory": [
        { "itemId": "fuel_cells", "quantity": 10, "price": 50 }
      ]
    },
    "combat": {
      "enabled": true,
      "difficulty": "medium",
      "shipStats": { "hull": 80, "shields": 60 }
    },
    "diplomacy": {
      "enabled": true,
      "outcomes": [
        {
          "choice": "bribe",
          "cost": 500,
          "success": "They take your credits and leave"
        }
      ]
    }
  },
  
  "rewards": {
    "credits": { "min": 200, "max": 800 },
    "items": [
      { "itemId": "pirate_bounty", "quantity": 1, "chance": 0.7 }
    ],
    "reputation": -5
  }
}
```

---

## 🎨 **Creating Different Encounter Types**

### **Hostile Pirate**
- Disposition: `hostile`
- Enable: Combat ✓, Diplomacy ✓
- Weight: 1.5 (common in dangerous areas)
- Trigger: High wake (0.6-1.0), dark zones

### **Friendly Trader**
- Disposition: `neutral` or `positive`
- Enable: Trade ✓, Diplomacy ✓
- Weight: 2.0 (very common)
- Trigger: Low wake (0.1-0.6), safe zones

### **Mystery Derelict**
- Disposition: `neutral`
- Enable: Diplomacy ✓ (for exploration choices)
- Weight: 0.5 (rare)
- Trigger: Medium wake, deep space

### **Military Patrol**
- Disposition: `neutral`
- Enable: Combat ✓ (defensive), Diplomacy ✓
- Weight: 1.2
- Trigger: Near stations, patrol routes

---

## 🔄 **Integrated Event Examples**

### **Mining Ambush**
**Event:** `mine_asteroid_belt` (events_poi.json)
**Outcome:** 10% chance when mining
```json
{
  "outcomeType": "encounter",
  "narrative": {
    "title": "Pirate Ambush",
    "description": "Your mining laser signature attracted pirates!"
  },
  "encounter": {
    "disposition": "hostile",
    "tags": ["pirate", "ambush"]
  }
}
```
**Result:** Triggers `enc_pirate_ambush_001` from encounters.json

### **Derelict Station Trader**
**Event:** `survey_derelict_station` (events_poi.json)
**Outcome:** 20% chance when investigating
```json
{
  "outcomeType": "encounter",
  "narrative": {
    "title": "Scavenger Ship",
    "description": "Another ship was already here - a trader!"
  },
  "encounter": {
    "disposition": "neutral",
    "tags": ["trader", "scavenger"]
  }
}
```
**Result:** Triggers `enc_trader_independent_001` from encounters.json

### **Distress Signal During Scan**
**Event:** `survey_asteroid_belt` (events_poi.json)
**Outcome:** 5% chance during scan failure
```json
{
  "outcomeType": "encounter",
  "narrative": {
    "title": "Distress Signal Detected",
    "description": "A damaged ship requests assistance!"
  },
  "encounter": {
    "disposition": "positive",
    "tags": ["rescue", "distress"]
  }
}
```
**Result:** Triggers `enc_distress_rescue_001` from encounters.json

---

## 📋 **Backend Integration Summary**

### **Files Modified:**

**`backend/services/eventOutcomeProcessor.js`**
- Added `resolveEncounter()` function
- Processes `outcome.encounter` field
- Returns matched encounter in result

**`backend/data/events_poi.json`**
- Mining ambush encounter (10% on mine failure)
- Raider encounter (20% on station investigation)
- Trader encounter (20% on derelict station)
- Distress signal (5% on scan)

**`backend/data/events_dynamic.json`**
- Military patrol (10% on gas giant scan)
- Rescue beacon (20% on ice moon drilling)
- Pirate scavenger (10% on asteroid explosion)
- Station hideout (10% on cargo search)

**`src/lib/eventEngine.js`**
- `applyOutcomeChanges()` now extracts encounter data
- Sets `newState.activeEncounter` for frontend

---

## 🎨 **Adding Encounters to Events**

To add an encounter outcome to any event:

1. **Edit event JSON** (events_poi.json or events_dynamic.json)
2. **Add encounter outcome** to branch outcomes:
```json
{
  "id": "your_outcome_id",
  "weight": 0.15,
  "outcomeType": "encounter",
  "narrative": {
    "title": "Encounter Title",
    "description": "What happens when encounter triggers"
  },
  "encounter": {
    "disposition": "hostile|neutral|positive",
    "tags": ["optional", "filter", "tags"]
  },
  "rewards": {
    "xp": 100
  }
}
```

3. **Backend automatically:**
   - Filters encounters by disposition
   - Further filters by tags (if specified)
   - Weight-based random selection
   - Returns full encounter data

4. **Frontend receives:**
   - Encounter narrative
   - Available options (trade/combat/diplomacy)
   - Dialogue options
   - Reward possibilities

---

## 🚀 **No Code Example Flow**

**You want:** Friendly alien encounter that gives player a special token

### **Step 1: Create Encounter (Admin UI)**
1. Go to Admin → Encounters
2. Click "CREATE NEW"
3. Fill form:
   - Name: "Benevolent Alien - The Gift Giver"
   - Disposition: Positive
   - Ship Class: "Unknown Vessel"
   - Faction: "Ancient Civilization"
   - Tags: ["alien", "gift", "friendly"]
   - Dialogue → Initial: "Greetings, young species. We offer you this token of friendship."
   - Options → Diplomacy: Enabled
     - Outcome: "accept_gift" → Success: "They give you an ancient artifact"
   - Rewards → Items: ["alien_token"]

### **Step 2: Add to Event (Admin UI)**
1. Go to Admin → Events
2. Find event: "survey_alien_artifact"
3. Edit branch: "approach"
4. Add new outcome:
```json
{
  "id": "alien_gift",
  "weight": 0.25,
  "outcomeType": "encounter",
  "narrative": {
    "title": "First Contact",
    "description": "The alien structure activates! A vessel emerges!"
  },
  "encounter": {
    "disposition": "positive",
    "tags": ["alien", "gift"]
  }
}
```

### **Step 3: Play Game**
1. Travel to system with alien artifact
2. Survey the artifact
3. Choose "Approach for closer examination"
4. 25% chance: Alien encounter triggers
5. Accept gift → Receive alien_token

**Zero frontend code needed!**

---

## 📊 **Encounter Data Structure**

| Action | Location | No Code? |
|--------|----------|----------|
| View all encounters | Admin → Encounters | ✅ Yes |
| Create encounter | Click "CREATE NEW" | ✅ Yes |
| Edit encounter | Click "EDIT" on row | ✅ Yes |
| Delete encounter | Click "DELETE" on row | ✅ Yes |
| Enable/Disable | Click STATUS button | ✅ Yes |
| Filter by type | Click filter buttons | ✅ Yes |
| Search | Type in search box | ✅ Yes |
| Trigger in-game | API call from frontend | ⚠️ Requires integration |

---

## 🚀 **Next Steps**

The encounters are **ready to use** right now! You just need to:

1. **Create encounters** via admin UI (no coding)
2. **Frontend integration** (one-time setup):
   - Call `/api/encounters/trigger` when player enters new area
   - Display encounter modal with dialogue
   - Show Trade/Combat/Diplomacy buttons based on `options`
   - Apply rewards after resolution

The **data layer is complete** - all encounter logic, filtering, and management happens in the backend with zero code changes needed for new encounters!
