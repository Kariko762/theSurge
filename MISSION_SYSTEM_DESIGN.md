# Mission System Design

## Overview
A comprehensive mission framework integrating with events, encounters, inventory, and reputation systems. Missions provide structured objectives with rewards, creating narrative-driven gameplay loops.

---

## **MISSION TYPES**

### 1. Combat Missions
**Objective:** Eliminate hostile targets

#### Subtypes:
- **Assassination**: Kill specific named target
- **Extermination**: Destroy X number of enemy ships
- **Defense**: Protect location/convoy from waves of attackers
- **Patrol**: Clear area of hostiles

#### Example:
```json
{
  "id": "pirate_bounty_01",
  "type": "combat",
  "subtype": "assassination",
  "name": "Eliminate Pirate Captain Krask",
  "description": "A notorious pirate captain has been raiding shipping lanes. Eliminate him and claim the bounty.",
  "objectives": [
    {
      "id": "kill_target",
      "type": "kill",
      "target": "pirate_captain_krask",
      "count": 1,
      "required": true
    }
  ]
}
```

---

### 2. Collection Missions
**Objective:** Gather specific items or resources

#### Subtypes:
- **Salvage**: Recover items from derelict ships/stations
- **Mining**: Extract minerals from asteroids
- **Retrieval**: Collect specific artifacts/cargo
- **Scanning**: Gather scientific data

#### Example:
```json
{
  "id": "titanium_delivery",
  "type": "collection",
  "subtype": "mining",
  "name": "Ore Shipment for Station Alpha",
  "description": "Station Alpha needs 50 units of titanium ore to complete repairs.",
  "objectives": [
    {
      "id": "collect_titanium",
      "type": "collect",
      "itemId": "titanium_ore",
      "count": 50,
      "required": true
    },
    {
      "id": "deliver_to_station",
      "type": "deliver",
      "location": "station_alpha",
      "requiredObjective": "collect_titanium"
    }
  ]
}
```

---

### 3. Transport Missions
**Objective:** Move cargo/passengers between locations

#### Subtypes:
- **Cargo Delivery**: Transport goods
- **Passenger Transport**: Ferry VIPs or refugees
- **Courier**: Time-sensitive small package delivery
- **Smuggling**: Illegal cargo with risk/reward

#### Example:
```json
{
  "id": "urgent_medical_supplies",
  "type": "transport",
  "subtype": "courier",
  "name": "Emergency Medical Supplies",
  "description": "Plague outbreak on Colony 7. Deliver medical supplies before time runs out.",
  "objectives": [
    {
      "id": "pickup_cargo",
      "type": "pickup",
      "location": "station_beta",
      "cargoId": "medical_supplies",
      "required": true
    },
    {
      "id": "deliver_cargo",
      "type": "deliver",
      "location": "colony_7",
      "cargoId": "medical_supplies",
      "timeLimit": 3600,
      "required": true
    }
  ],
  "penalties": {
    "timeLimitFailed": {
      "reputation": { "faction": "colonists", "change": -20 },
      "credits": -5000
    }
  }
}
```

---

### 4. Exploration Missions
**Objective:** Discover new locations or phenomena

#### Subtypes:
- **Survey**: Scan celestial bodies
- **Discovery**: Find hidden locations
- **Charting**: Map unknown space
- **Investigation**: Examine anomalies

#### Example:
```json
{
  "id": "survey_nebula",
  "type": "exploration",
  "subtype": "survey",
  "name": "Chart the Crimson Nebula",
  "description": "Navigate deep into the Crimson Nebula and survey 5 anomalies.",
  "objectives": [
    {
      "id": "reach_nebula",
      "type": "travel",
      "location": "crimson_nebula",
      "required": true
    },
    {
      "id": "scan_anomalies",
      "type": "scan",
      "target": "anomaly",
      "count": 5,
      "required": true
    }
  ]
}
```

---

### 5. Diplomatic Missions
**Objective:** Negotiate, broker deals, or influence factions

#### Subtypes:
- **Negotiation**: Broker peace/trade agreements
- **Espionage**: Gather intelligence
- **Sabotage**: Undermine faction operations
- **Aid**: Provide humanitarian assistance

#### Example:
```json
{
  "id": "peace_treaty",
  "type": "diplomatic",
  "subtype": "negotiation",
  "name": "Broker Peace with Korthan Brutes",
  "description": "Negotiate a ceasefire between UEC and Korthan factions.",
  "objectives": [
    {
      "id": "meet_korthan_rep",
      "type": "interact",
      "target": "korthan_ambassador",
      "location": "neutral_station",
      "required": true
    },
    {
      "id": "complete_negotiation",
      "type": "skillCheck",
      "skill": "combat",
      "difficulty": "hard",
      "required": true
    }
  ]
}
```

---

## **MISSION STRUCTURE**

### Core Schema
```json
{
  "id": "unique_mission_id",
  "type": "combat|collection|transport|exploration|diplomatic",
  "subtype": "specific_variant",
  "tier": 1-5,
  "name": "Mission Title",
  "description": "Detailed mission briefing",
  
  "objectives": [
    {
      "id": "objective_id",
      "type": "kill|collect|deliver|travel|scan|interact|skillCheck",
      "required": true|false,
      "count": 1,
      "target": "entity_id",
      "location": "location_id",
      "timeLimit": 3600,
      "requiredObjective": "prerequisite_objective_id"
    }
  ],
  
  "requirements": {
    "minLevel": 1,
    "minReputation": { "faction": "UEC", "level": 10 },
    "requiredItems": ["item_id"],
    "requiredShipType": ["frigate", "destroyer"],
    "requiredSkills": { "combat": 3, "engineering": 2 }
  },
  
  "triggers": {
    "availability": {
      "location": "station_alpha",
      "factionRep": { "UEC": 20 },
      "afterMission": "prerequisite_mission_id",
      "random": 0.25
    },
    "expires": {
      "afterTime": 86400,
      "afterMission": "conflicting_mission_id"
    }
  },
  
  "rewards": {
    "credits": 10000,
    "experience": 500,
    "reputation": [
      { "faction": "UEC", "change": 15 }
    ],
    "items": [
      { "itemId": "rare_weapon", "count": 1 }
    ],
    "loot": {
      "poolId": "mission_reward_pool",
      "guaranteed": true
    },
    "unlocks": ["new_mission_id", "ship_blueprint_id"]
  },
  
  "penalties": {
    "failure": {
      "reputation": [{ "faction": "UEC", "change": -10 }],
      "credits": -2000
    },
    "abandon": {
      "reputation": [{ "faction": "UEC", "change": -5 }]
    }
  },
  
  "narrative": {
    "briefing": "Full mission briefing text",
    "acceptance": "Text shown when accepting mission",
    "progress": {
      "objective_id": "Text shown when objective completes"
    },
    "completion": "Mission complete text",
    "failure": "Mission failed text"
  },
  
  "metadata": {
    "author": "admin",
    "created": "2025-11-24T00:00:00.000Z",
    "tags": ["story", "pirate", "bounty"]
  }
}
```

---

## **OBJECTIVE TYPES**

### Kill Objectives
```json
{
  "id": "kill_pirates",
  "type": "kill",
  "target": "pirate_raider",
  "count": 5,
  "location": "asteroid_belt_gamma",
  "required": true
}
```

### Collect Objectives
```json
{
  "id": "gather_ore",
  "type": "collect",
  "itemId": "platinum_ore",
  "count": 20,
  "required": true
}
```

### Deliver Objectives
```json
{
  "id": "deliver_cargo",
  "type": "deliver",
  "location": "station_omega",
  "cargoId": "medical_supplies",
  "required": true,
  "timeLimit": 1800
}
```

### Travel Objectives
```json
{
  "id": "reach_destination",
  "type": "travel",
  "location": "deep_space_marker",
  "radius": 100,
  "required": true
}
```

### Scan Objectives
```json
{
  "id": "scan_targets",
  "type": "scan",
  "target": "derelict_ship",
  "count": 3,
  "required": true
}
```

### Interact Objectives
```json
{
  "id": "speak_to_contact",
  "type": "interact",
  "target": "merchant_guild_rep",
  "location": "trade_hub",
  "required": true
}
```

### Skill Check Objectives
```json
{
  "id": "hack_terminal",
  "type": "skillCheck",
  "skill": "engineering",
  "difficulty": "medium",
  "required": true
}
```

---

## **MISSION TRIGGERS**

### Event Triggers
Missions can be offered as event outcomes:
```json
{
  "type": "mission",
  "missionId": "distress_call_rescue",
  "autoAccept": false
}
```

### Location Triggers
Missions available at specific stations/locations:
```json
{
  "triggers": {
    "availability": {
      "location": "trade_station_omega"
    }
  }
}
```

### Reputation Triggers
Missions unlocked by faction standing:
```json
{
  "requirements": {
    "minReputation": { "UEC": 50 }
  }
}
```

### Sequential Triggers
Mission chains:
```json
{
  "triggers": {
    "availability": {
      "afterMission": "mission_part_1"
    }
  }
}
```

### Random Triggers
Procedural mission generation:
```json
{
  "triggers": {
    "availability": {
      "random": 0.3,
      "location": "any_station"
    }
  }
}
```

---

## **MISSION STATE TRACKING**

### Player Mission Progress
```json
{
  "playerId": "player_123",
  "activeMissions": [
    {
      "missionId": "pirate_bounty_01",
      "status": "active",
      "startedAt": "2025-11-24T10:00:00.000Z",
      "objectives": {
        "kill_target": {
          "completed": false,
          "progress": 0,
          "required": 1
        }
      }
    }
  ],
  "completedMissions": ["tutorial_mission", "first_delivery"],
  "failedMissions": ["impossible_rescue"],
  "availableMissions": ["bounty_02", "trade_route_defense"]
}
```

---

## **MISSION BOARD SYSTEM**

### Dynamic Mission Availability
- Missions appear based on player level, location, and reputation
- Timer-based refresh (daily/weekly mission rotation)
- Priority tiers (story > faction > generic procedural)

### Mission Categories
- **Story Missions**: Hand-crafted narrative arcs
- **Faction Missions**: Reputation-based faction quests
- **Contracts**: Generic repeatable jobs
- **Events**: Dynamic one-time opportunities

---

## **INTEGRATION POINTS**

### With Events
- Events can trigger mission availability
- Events can modify mission objectives
- Mission completion can trigger events

### With Encounters
- Combat missions spawn specific encounters
- Mission objectives track encounter outcomes
- Loot from encounters counts toward collection objectives

### With Inventory
- Item requirements checked against player inventory
- Rewards added to inventory system
- Cargo missions reserve cargo space

### With Reputation
- Reputation gates mission availability
- Mission completion affects faction standing
- Diplomatic missions directly modify reputation

### With Loot System
- Mission rewards use loot pool system
- Guaranteed mission-specific items
- Bonus loot for exceptional performance

---

## **PROGRESSION TRACKING**

### Objective Progress Events
```javascript
// Backend service
function updateMissionProgress(playerId, missionId, objectiveId, delta) {
  const playerMissions = getPlayerMissions(playerId);
  const mission = playerMissions.activeMissions.find(m => m.missionId === missionId);
  
  if (!mission) return;
  
  const objective = mission.objectives[objectiveId];
  objective.progress += delta;
  
  if (objective.progress >= objective.required) {
    objective.completed = true;
    emitEvent('mission:objective:complete', { playerId, missionId, objectiveId });
    checkMissionCompletion(playerId, missionId);
  }
}
```

### Auto-Tracking Hooks
- Kill tracking: Monitor encounter outcomes
- Collection tracking: Monitor inventory changes
- Travel tracking: Monitor player position
- Scan tracking: Monitor sensor usage

---

## **REWARD DISTRIBUTION**

### Completion Rewards
```javascript
function distributeMissionRewards(playerId, mission) {
  const rewards = mission.rewards;
  
  // Credits
  addCredits(playerId, rewards.credits);
  
  // Experience
  addExperience(playerId, rewards.experience);
  
  // Reputation
  rewards.reputation.forEach(rep => {
    modifyReputation(playerId, rep.faction, rep.change);
  });
  
  // Items
  rewards.items.forEach(item => {
    addToInventory(playerId, item.itemId, item.count);
  });
  
  // Loot pool
  if (rewards.loot) {
    const lootResult = resolveLootPool(rewards.loot.poolId);
    addLootToInventory(playerId, lootResult.items);
  }
  
  // Unlocks
  rewards.unlocks.forEach(unlockId => {
    unlockContent(playerId, unlockId);
  });
}
```

---

## **EXAMPLE MISSION CHAINS**

### Pirate Threat Arc (3-Part Series)

#### Part 1: Scout
```json
{
  "id": "pirate_arc_01_scout",
  "type": "exploration",
  "name": "Pirate Activity Report",
  "objectives": [
    { "id": "scan_sector", "type": "scan", "count": 3 }
  ],
  "rewards": { "credits": 2000 },
  "narrative": {
    "completion": "Your scans reveal a pirate base location..."
  }
}
```

#### Part 2: Raid
```json
{
  "id": "pirate_arc_02_raid",
  "type": "combat",
  "name": "Raid the Pirate Base",
  "triggers": {
    "availability": { "afterMission": "pirate_arc_01_scout" }
  },
  "objectives": [
    { "id": "destroy_base", "type": "kill", "target": "pirate_base", "count": 1 }
  ],
  "rewards": { "credits": 8000, "loot": { "poolId": "pirate_base_loot" }}
}
```

#### Part 3: Manhunt
```json
{
  "id": "pirate_arc_03_captain",
  "type": "combat",
  "name": "Hunt the Pirate Captain",
  "triggers": {
    "availability": { "afterMission": "pirate_arc_02_raid" }
  },
  "objectives": [
    { "id": "kill_captain", "type": "kill", "target": "pirate_captain_krask", "count": 1 }
  ],
  "rewards": { "credits": 15000, "items": [{ "itemId": "legendary_weapon", "count": 1 }] }
}
```

---

## **ADMIN TOOLS**

### Mission Editor Features
- Visual objective tree builder
- Reward calculator (balance credits/XP by tier)
- Narrative text editor with variable insertion
- Trigger condition builder
- Testing mode (spawn mission for testing)

### Mission Analytics
- Completion rate tracking
- Average time to complete
- Most failed objectives
- Reward value analysis

---

## **FUTURE ENHANCEMENTS**

### Procedural Mission Generation
- Template-based random mission creation
- Dynamic target/location assignment
- Scaled rewards based on player level

### Time-Limited Missions
- Daily/weekly rotating contracts
- Seasonal events
- Emergency flash missions

### Multiplayer Missions
- Cooperative objectives
- Competitive missions
- Faction wars with mission contributions

### Branching Narratives
- Choice-driven mission outcomes
- Multiple ending paths
- Consequence tracking across mission chains

---

**Version:** 1.0.0  
**Last Updated:** November 24, 2025
