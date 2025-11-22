# Event Engine Design Document

## 🎯 Overview

A **Universal Event System** that handles all dynamic gameplay moments through a 5-stage pipeline: **Trigger → Scenario → Challenge → Resolution → Outcome**. Fully JSON-configurable, DRE-powered, and editor-friendly.

---

## 🏗️ Architecture

### **Core Pipeline**
```
┌──────────────────────────────────────────────────────────────┐
│                    EVENT ENGINE FLOW                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. TRIGGER                                                   │
│     ├─ POI Action (Mine, Scan, Board) - MANUAL               │
│     ├─ Location (Enter system, Approach POI) - AUTOMATIC     │
│     ├─ Condition (Wake threshold, Radiation level)           │
│     ├─ Mission Step (Delivery complete, Target found)        │
│     ├─ Dynamic (Scheduler-driven, risk-based)  ⭐ NEW        │
│     └─ Timer (Random event, Distress call)                   │
│                                                               │
│  2. SCENARIO SELECTION                                        │
│     ├─ Match trigger to scenario pool                        │
│     ├─ Weight-based selection (common/rare)                  │
│     ├─ Requirement check (research, items, flags)            │
│     └─ Load narrative + challenge definition                 │
│                                                               │
│  3. CHALLENGE EXECUTION                                       │
│     ├─ DRE Roll (2d6/d20 vs DC)                              │
│     ├─ Player Choice (3-5 options)                           │
│     ├─ Automatic (no roll, narrative only)                   │
│     └─ Hybrid (choice → roll)                                │
│     └─ ALL OUTPUT → TERMINAL (dual stream)  ⭐ NEW           │
│                                                               │
│  4. RESOLUTION DETERMINATION                                  │
│     ├─ Map DRE result to outcome tier                        │
│     ├─ Critical Failure (2-5)                                │
│     ├─ Failure (6-8)                                         │
│     ├─ Partial Success (9-11)                                │
│     ├─ Success (12-14)                                       │
│     └─ Critical Success (15+)                                │
│     └─ Stream roll details to terminal  ⭐ NEW               │
│                                                               │
│  5. OUTCOME APPLICATION                                       │
│     ├─ Loot (items, resources, data)                         │
│     ├─ Damage (hull, systems, AI injury)                     │
│     ├─ State Changes (flags, unlocks, discoveries)           │
│     ├─ Follow-up Events (chain to next scenario)             │
│     ├─ Wake/Consequence (attention, fatigue)                 │
│     └─ Terminal Output (narrative + data streams)  ⭐ NEW    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### **Terminal Integration (Dual Stream)**
```
┌──────────────────────────────────────────────────────────────┐
│                    TERMINAL OUTPUT FLOW                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  NARRATIVE STREAM (conversational)                            │
│  ├─ AI dialogue from ARIA, FORGE, GHOST                      │
│  ├─ Event descriptions                                       │
│  ├─ Story beats                                              │
│  └─ Outcome narratives                                       │
│                                                               │
│  DATA STREAM (technical)                                      │
│  ├─ "> EVENT: asteroid_mining_unstable"                      │
│  ├─ "> ROLL: 2d6 = 8 [4, 4]"                                 │
│  ├─ "> MODS: Ship+3, AI+1, Research+1 = +5"                  │
│  ├─ "> TOTAL: 13 vs DC 10 (SUCCESS +3)"                      │
│  ├─ "> LOOT: 5x Rare Ore, 2x Crystal Shard"                  │
│  ├─ "> SCIENCE: +25"                                         │
│  └─ "> WAKE: +0.02"                                          │
│                                                               │
│  CHOICE PROMPTS (when applicable)                             │
│  ├─ "[1] Hail the trader"                                    │
│  ├─ "[2] Scan their ship first"                              │
│  ├─ "[3] Ignore and continue"                                │
│  └─ "[4] Attack (HOSTILE)"                                   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### **Dynamic Event System (Risk-Based Scheduler)**
```
┌──────────────────────────────────────────────────────────────┐
│                 DYNAMIC EVENT SCHEDULER                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  RISK CALCULATION                                             │
│  ├─ Wake Level (0-1)                × 40%                     │
│  ├─ Location Danger (zone type)     × 30%                     │
│  ├─ Time in System (hours)          × 15%                     │
│  ├─ Recent Events (cooldown)        × 10%                     │
│  └─ Active Missions (difficulty)    × 5%                      │
│  = TOTAL RISK SCORE (0-100)                                   │
│                                                               │
│  SCHEDULER FREQUENCY                                          │
│  ├─ Risk 0-20   (LOW)      → Check every 60 seconds          │
│  ├─ Risk 21-40  (MODERATE) → Check every 30 seconds          │
│  ├─ Risk 41-60  (HIGH)     → Check every 15 seconds          │
│  ├─ Risk 61-80  (CRITICAL) → Check every 5 seconds           │
│  └─ Risk 81-100 (EXTREME)  → Check every 2 seconds           │
│                                                               │
│  EVENT CHECK ROLL                                             │
│  ├─ Roll d100 every scheduler tick                           │
│  ├─ If roll < (Risk Score), trigger dynamic event            │
│  ├─ Select event from weighted pool based on context         │
│  └─ Execute event through main event engine                  │
│                                                               │
│  COOLDOWN SYSTEM                                              │
│  ├─ Global: No events within 30s of previous                 │
│  ├─ Per-Type: Trader = 300s, Pirate = 600s, etc.            │
│  └─ One-Time: Certain events can only trigger once           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
src/lib/events/
├── eventEngine.js              # Core event execution pipeline
├── eventLoader.js              # Load/validate JSON definitions
├── triggerManager.js           # Trigger detection and routing
├── dynamicEventScheduler.js    # Risk-based scheduler ⭐ NEW
├── riskCalculator.js           # Calculate dynamic risk score ⭐ NEW
├── scenarioSelector.js         # Weighted scenario selection
├── challengeExecutor.js        # DRE integration + player choices
├── outcomeProcessor.js         # Apply consequences to game state
├── terminalFormatter.js        # Format events for terminal output ⭐ NEW
├── eventState.js               # Active event tracking + cooldowns
└── definitions/
    ├── events_poi.json         # POI-based events (mining, scanning)
    ├── events_mission.json     # Mission-specific events
    ├── events_dynamic.json     # Dynamic/random encounters ⭐ NEW
    ├── events_location.json    # System/zone entry events
    └── events_condition.json   # Threshold-triggered events

src/components/
├── EventModal.jsx              # Event UI (narrative, choices, results)
└── EventEditor.jsx             # Visual event creator/editor

src/components/admin/
├── EventConfigEditor.jsx       # Tweak min/max values, probabilities
├── ScenarioEditor.jsx          # Create/edit scenarios
├── MissionEditor.jsx           # Mission builder with event chains
└── GalaxyCreator.jsx           # EXTENDED: Pin missions to systems
```

---

## 📋 JSON Schema

### **Event Definition**
```json
{
  "id": "asteroid_mining_unstable",
  "version": "1.0",
  "metadata": {
    "author": "System",
    "created": "2025-11-21",
    "tags": ["mining", "hazard", "asteroid"]
  },
  
  "trigger": {
    "type": "poi_action",
    "poiTypes": ["belt"],
    "action": "mine",
    "conditions": {
      "clusterType": ["Type-III", "Type-IV", "Type-V"],
      "radiation": { "min": "moderate" },
      "wake": { "max": 0.8 }
    },
    "weight": 15,
    "oneTime": false,
    "cooldown": 0
  },
  
  "scenario": {
    "name": "Unstable Asteroid",
    "description": "The asteroid is rotating rapidly and showing structural fractures.",
    "narrative": [
      "ARIA: \"Caution - asteroid exhibits unstable rotation pattern.\"",
      "FORGE: \"Mineral composition is high-grade, but risk of fragmentation is elevated.\"",
      "GHOST: \"...structural analysis... recommend precision approach...\""
    ],
    "terminal": {
      "conversational": [
        "ARIA: \"Caution - asteroid exhibits unstable rotation pattern.\"",
        "FORGE: \"Mineral composition is high-grade, but risk of fragmentation is elevated.\"",
        "GHOST: \"...structural analysis... recommend precision approach...\""
      ],
      "stream": [
        "> EVENT TRIGGERED: UNSTABLE_ASTEROID",
        "> TYPE: Mining Hazard",
        "> CLUSTER: Type-III (High Grade)",
        "> DIFFICULTY: Normal (DC 10)"
      ]
    },
    "image": "asteroid_unstable.png",
    "sound": "warning_beep.ogg"
  },
  
  "challenge": {
    "type": "dre_roll",
    "mode": "automatic",
    "dreAction": "asteroid_mining",
    "dice": "2d6",
    "baseDC": 10,
    "modifiers": {
      "sources": ["ship", "ai", "research", "environment"],
      "custom": [
        { "condition": "hasResearch.precisionMining", "bonus": 2 },
        { "condition": "aiRole.engineer.tier >= 2", "bonus": 1 }
      ]
    },
    "flavor": "Make a precision mining laser cut to extract resources safely."
  },
  
  "resolutions": [
    {
      "range": [2, 5],
      "severity": "critical_failure",
      "narrative": [
        "The asteroid shatters catastrophically! Debris strikes the hull.",
        "Mining laser overload - asteroid fragments in all directions!"
      ],
      "terminal": {
        "conversational": [
          "ARIA: \"WARNING! Catastrophic structural failure!\"",
          "FORGE: \"Hull breach detected! Damage to mining laser!\"",
          "GHOST: \"...debris cloud expanding... evasive maneuvers required...\""
        ],
        "stream": [
          "> RESOLUTION: CRITICAL FAILURE",
          "> ROLL: 4 vs DC 10 (-6)",
          "> DAMAGE: Mining Laser -20, Hull -15",
          "> LOOT: None",
          "> WAKE: +0.2 (debris signature)",
          "> FOLLOW-UP: debris_field_navigation"
        ]
      },
      "outcomes": {
        "damage": [
          { "system": "mining_laser", "amount": 20 },
          { "type": "hull", "amount": 15 }
        ],
        "loot": [],
        "wake": 0.2,
        "followUp": {
          "eventId": "debris_field_navigation",
          "delay": 0
        }
      }
    },
    {
      "range": [6, 8],
      "severity": "failure",
      "narrative": [
        "Asteroid destabilizes before extraction completes. Minimal yield recovered.",
        "Structural collapse during mining. Resources lost in fragmentation."
      ],
      "terminal": {
        "conversational": [
          "FORGE: \"Asteroid collapse - lost most of the yield.\"",
          "ARIA: \"Minimal resources recovered. Structural integrity compromised too early.\""
        ],
        "stream": [
          "> RESOLUTION: FAILURE",
          "> ROLL: 7 vs DC 10 (-3)",
          "> LOOT: 2x Scrap Metal",
          "> WAKE: +0.05"
        ]
      },
      "outcomes": {
        "loot": [
          { "itemId": "scrap_metal", "quantity": [1, 3], "chance": 0.6 }
        ],
        "wake": 0.05
      }
    },
    {
      "range": [9, 11],
      "severity": "success",
      "narrative": [
        "Precise extraction complete. High-grade minerals secured despite instability.",
        "Successful mining operation. Asteroid remained stable throughout."
      ],
      "terminal": {
        "conversational": [
          "FORGE: \"Excellent work! High-grade ore extracted successfully.\"",
          "ARIA: \"Mining operation complete. Crystal shards detected in sample.\""
        ],
        "stream": [
          "> RESOLUTION: SUCCESS",
          "> ROLL: 10 vs DC 10 (+0)",
          "> LOOT: 5x Rare Ore, 1x Crystal Shard",
          "> SCIENCE: +25",
          "> WAKE: +0.02"
        ]
      },
      "outcomes": {
        "loot": [
          { "itemId": "rare_ore", "quantity": [3, 6], "chance": 1.0 },
          { "itemId": "crystal_shard", "quantity": [1, 2], "chance": 0.4 }
        ],
        "science": 25,
        "wake": 0.02
      }
    },
    {
      "range": [12, 16],
      "severity": "critical_success",
      "narrative": [
        "Perfect extraction! Core contains exceptionally pure {rareMineral}!",
        "Masterful mining - asteroid core reveals xenotech fragments!"
      ],
      "terminal": {
        "conversational": [
          "FORGE: \"Incredible! This is xenotech-grade material!\"",
          "ARIA: \"Anomalous reading detected - xenotech fragment signature confirmed.\"",
          "GHOST: \"...unprecedented discovery... recommend immediate analysis...\""
        ],
        "stream": [
          "> RESOLUTION: CRITICAL SUCCESS",
          "> ROLL: 15 vs DC 10 (+5)",
          "> LOOT: 8x Exotic Ore, 1x Xenotech Fragment",
          "> SCIENCE: +100",
          "> FLAG SET: discovered_xenotech",
          "> FOLLOW-UP: xenotech_analysis"
        ]
      },
      "outcomes": {
        "loot": [
          { "itemId": "exotic_ore", "quantity": [5, 10], "chance": 1.0 },
          { "itemId": "xenotech_fragment", "quantity": 1, "chance": 0.3 }
        ],
        "science": 100,
        "flags": ["discovered_xenotech"],
        "followUp": {
          "eventId": "xenotech_analysis",
          "delay": 0
        }
      }
    }
  ]
}
```

### **Mission Definition (Extended)**
```json
{
  "id": "mission_salvage_derelict",
  "type": "salvage",
  "tier": "highRisk",
  "name": "Derelict Platform Recovery",
  "description": "Investigate abandoned orbital platform for salvageable tech.",
  
  "location": {
    "systemType": "any",
    "zonePreference": ["dark", "static"],
    "poiType": "orbital",
    "minDistance": 20,
    "maxDistance": 80
  },
  
  "steps": [
    {
      "id": "approach",
      "objective": "Approach the derelict platform",
      "triggerEvent": "mission_derelict_approach",
      "onComplete": "scan_exterior"
    },
    {
      "id": "scan_exterior",
      "objective": "Scan platform exterior for hazards",
      "triggerEvent": "mission_derelict_scan",
      "onComplete": "dock_or_abort"
    },
    {
      "id": "dock_or_abort",
      "objective": "Decision: Dock or abort mission",
      "triggerEvent": "mission_derelict_choice",
      "onComplete": {
        "choice_dock": "interior_exploration",
        "choice_abort": "mission_failed"
      }
    },
    {
      "id": "interior_exploration",
      "objective": "Explore interior compartments",
      "triggerEvent": "mission_derelict_explore",
      "onComplete": "extract_salvage"
    },
    {
      "id": "extract_salvage",
      "objective": "Extract salvageable components",
      "triggerEvent": "mission_derelict_salvage",
      "onComplete": "mission_complete"
    }
  ],
  
  "rewards": {
    "baseline": [
      { "itemId": "ship_component_tier2", "quantity": 1 },
      { "itemId": "scrap_metal", "quantity": [10, 20] }
    ],
    "bonusPool": [
      { "itemId": "ai_core_fragment", "quantity": 1, "chance": 0.3 },
      { "itemId": "research_data", "quantity": 1, "chance": 0.5 }
    ],
    "credits": [500, 1500],
    "science": [50, 150]
  },
  
  "failure": {
    "loot": [
      { "itemId": "scrap_metal", "quantity": [2, 5] }
    ],
    "credits": 100
  }
}
```

### **Random Encounter Definition**
```json
{
  "id": "encounter_trader_neutral",
  "version": "1.0",
  
  "trigger": {
    "type": "location",
    "location": "system_deep_space",
    "conditions": {
      "wake": { "min": 0.3, "max": 0.7 },
      "systemTier": { "min": 1.5 }
    },
    "weight": 20,
    "cooldown": 300
  },
  
  "scenario": {
    "name": "Independent Trader",
    "description": "A small merchant vessel approaches on intercept course.",
    "narrative": [
      "ARIA: \"Contact detected - transponder identifies as independent trader.\"",
      "FORGE: \"Hailing us on standard frequencies. Seems friendly enough.\"",
      "GHOST: \"...no weapons lock... cautious approach recommended...\""
    ]
  },
  
  "challenge": {
    "type": "player_choice",
    "mode": "manual",
    "choices": [
      {
        "id": "hail_trader",
        "label": "Hail the trader",
        "description": "Open communications and see what they want.",
        "followUp": "encounter_trader_dialogue"
      },
      {
        "id": "scan_trader",
        "label": "Scan their ship first",
        "description": "Get more information before making contact.",
        "dreRoll": {
          "action": "scan",
          "dc": 8,
          "onSuccess": "encounter_trader_scan_success",
          "onFailure": "encounter_trader_scan_failure"
        }
      },
      {
        "id": "ignore_trader",
        "label": "Ignore and continue course",
        "description": "Keep moving, avoid interaction.",
        "followUp": "encounter_trader_ignored"
      },
      {
        "id": "attack_trader",
        "label": "Attack (HOSTILE)",
        "description": "Initiate combat - will increase wake significantly.",
        "requireConfirm": true,
        "followUp": "encounter_trader_combat"
      }
    ]
  },
  
  "resolutions": [
    {
      "id": "encounter_trader_dialogue",
      "narrative": [
        "TRADER: \"Greetings! Looking to trade supplies or information?\"",
        "TRADER: \"I've got fuel cells, repair kits, and some rare components.\""
      ],
      "outcomes": {
        "ui": "trading_menu",
        "flags": ["met_trader_neutral"]
      }
    }
  ]
}
```

---

## 🔧 Core Implementation

### **dynamicEventScheduler.js** ⭐ NEW
```javascript
import { gameTickManager } from '../gameTickManager.js';
import { calculateRiskScore } from './riskCalculator.js';
import { checkTrigger } from './triggerManager.js';
import { executeEvent } from './eventEngine.js';
import { makeRng } from '../rng.js';

/**
 * Dynamic Event Scheduler
 * Manages risk-based random event triggering
 */
export class DynamicEventScheduler {
  constructor() {
    this.enabled = true;
    this.globalCooldown = 30; // Minimum 30s between ANY events
    this.lastEventTime = 0;
    this.eventHistory = [];
    this.checkInterval = 60; // Default: check every 60s
    this.schedulerId = null;
  }

  /**
   * Start the scheduler
   */
  start(context) {
    if (this.schedulerId) return;
    
    // Initial check
    this.updateCheckFrequency(context);
    
    // Register with game tick manager
    this.schedulerId = gameTickManager.addRepeatingEvent(
      () => this.checkForDynamicEvent(context),
      this.checkInterval * 1000,
      { id: 'dynamic-event-check' }
    );
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.schedulerId) {
      gameTickManager.removeEvent(this.schedulerId);
      this.schedulerId = null;
    }
  }

  /**
   * Update check frequency based on risk
   */
  updateCheckFrequency(context) {
    const risk = calculateRiskScore(context);
    
    // Map risk to check interval
    let newInterval;
    if (risk < 20) {
      newInterval = 60; // LOW: every 60s
    } else if (risk < 40) {
      newInterval = 30; // MODERATE: every 30s
    } else if (risk < 60) {
      newInterval = 15; // HIGH: every 15s
    } else if (risk < 80) {
      newInterval = 5;  // CRITICAL: every 5s
    } else {
      newInterval = 2;  // EXTREME: every 2s
    }
    
    // Restart scheduler if interval changed
    if (newInterval !== this.checkInterval) {
      this.checkInterval = newInterval;
      this.stop();
      this.start(context);
      
      console.log(`[DynamicScheduler] Risk ${risk.toFixed(1)}% - Check every ${newInterval}s`);
    }
  }

  /**
   * Check if dynamic event should trigger
   */
  checkForDynamicEvent(context) {
    if (!this.enabled) return;
    
    // Update frequency based on current risk
    this.updateCheckFrequency(context);
    
    // Global cooldown check
    const now = Date.now();
    const timeSinceLastEvent = (now - this.lastEventTime) / 1000;
    if (timeSinceLastEvent < this.globalCooldown) {
      return;
    }
    
    // Calculate current risk
    const risk = calculateRiskScore(context);
    
    // Roll d100 vs risk score
    const rng = makeRng(`dynamic-check-${now}`, 'events');
    const roll = Math.floor(rng() * 100);
    
    console.log(`[DynamicScheduler] Roll ${roll} vs Risk ${risk.toFixed(1)}`);
    
    // Event triggers if roll < risk
    if (roll < risk) {
      this.triggerDynamicEvent(context);
    }
  }

  /**
   * Trigger a dynamic event
   */
  async triggerDynamicEvent(context) {
    // Check for eligible dynamic events
    const event = checkTrigger('dynamic', {
      ...context,
      eventHistory: this.eventHistory
    });
    
    if (!event) {
      console.log('[DynamicScheduler] No eligible events found');
      return;
    }
    
    console.log(`[DynamicScheduler] Triggering event: ${event.id}`);
    
    // Update cooldown
    this.lastEventTime = Date.now();
    
    // Add to history
    this.eventHistory.push({
      id: event.id,
      timestamp: Date.now(),
      type: event.type
    });
    
    // Trim history (keep last 20)
    if (this.eventHistory.length > 20) {
      this.eventHistory = this.eventHistory.slice(-20);
    }
    
    // Execute event
    await executeEvent(event.id, context, { source: 'dynamic' });
  }

  /**
   * Manually trigger immediate check (for debugging)
   */
  forceCheck(context) {
    this.checkForDynamicEvent(context);
  }

  /**
   * Reset cooldowns (for testing)
   */
  resetCooldowns() {
    this.lastEventTime = 0;
    this.eventHistory = [];
  }
}

// Singleton instance
export const dynamicEventScheduler = new DynamicEventScheduler();
```

### **riskCalculator.js** ⭐ NEW
```javascript
/**
 * Calculate risk score (0-100) based on game state
 * Higher risk = more frequent dynamic event checks
 */
export function calculateRiskScore(context) {
  let risk = 0;
  
  // 1. WAKE LEVEL (40% weight)
  const wakeContribution = (context.wake || 0) * 40;
  risk += wakeContribution;
  
  // 2. LOCATION DANGER (30% weight)
  const locationRisk = calculateLocationRisk(context.location);
  risk += locationRisk * 0.3;
  
  // 3. TIME IN SYSTEM (15% weight)
  const timeInSystem = context.timeInSystem || 0; // hours
  const timeRisk = Math.min(timeInSystem * 2, 100); // 2% per hour, max 100
  risk += timeRisk * 0.15;
  
  // 4. RECENT EVENTS (10% weight)
  const eventRisk = calculateEventPressure(context.eventHistory);
  risk += eventRisk * 0.1;
  
  // 5. ACTIVE MISSIONS (5% weight)
  const missionRisk = calculateMissionRisk(context.activeMissions);
  risk += missionRisk * 0.05;
  
  // Clamp to 0-100
  return Math.max(0, Math.min(100, risk));
}

/**
 * Calculate risk from location/zone type
 */
function calculateLocationRisk(location) {
  if (!location) return 0;
  
  let risk = 0;
  
  // Zone type
  const zoneRisk = {
    'quiet': 10,
    'normal': 30,
    'dark': 60,
    'static': 85,
    'void': 95
  };
  risk += zoneRisk[location.zone] || 30;
  
  // Radiation level
  const radiationRisk = {
    'low': 0,
    'moderate': 10,
    'high': 25,
    'extreme': 50
  };
  risk += radiationRisk[location.radiation] || 0;
  
  // Proximity to dangerous POIs
  if (location.nearHostile) risk += 20;
  if (location.nearDerelict) risk += 15;
  
  return Math.min(risk, 100);
}

/**
 * Calculate risk from recent event history
 * More events = higher "heat" = more likely to attract attention
 */
function calculateEventPressure(eventHistory) {
  if (!eventHistory || eventHistory.length === 0) return 0;
  
  const now = Date.now();
  const recentEvents = eventHistory.filter(e => {
    const ageMinutes = (now - e.timestamp) / 1000 / 60;
    return ageMinutes < 30; // Events within last 30 minutes
  });
  
  // Each recent event adds 10% pressure
  return Math.min(recentEvents.length * 10, 100);
}

/**
 * Calculate risk from active missions
 */
function calculateMissionRisk(missions) {
  if (!missions || missions.length === 0) return 0;
  
  const tierRisk = {
    'lowRisk': 5,
    'mediumRisk': 15,
    'highRisk': 30,
    'deadly': 50
  };
  
  let totalRisk = 0;
  for (const mission of missions) {
    totalRisk += tierRisk[mission.tier] || 10;
  }
  
  return Math.min(totalRisk, 100);
}

/**
 * Get risk level description
 */
export function getRiskLevel(risk) {
  if (risk < 20) return 'LOW';
  if (risk < 40) return 'MODERATE';
  if (risk < 60) return 'HIGH';
  if (risk < 80) return 'CRITICAL';
  return 'EXTREME';
}
```

### **terminalFormatter.js** ⭐ NEW
```javascript
/**
 * Format event data for terminal output (dual stream)
 */

/**
 * Format event start (scenario presentation)
 */
export function formatEventStart(event, context) {
  return {
    conversational: event.scenario.terminal?.conversational || event.scenario.narrative,
    stream: event.scenario.terminal?.stream || [
      `> EVENT: ${event.id}`,
      `> TYPE: ${event.metadata.tags.join(', ')}`,
      `> DIFFICULTY: ${event.challenge.baseDC}`
    ]
  };
}

/**
 * Format DRE roll result
 */
export function formatDREResult(dreResult) {
  const { baseRoll, modifiers, totalRoll, targetDifficulty, result } = dreResult;
  
  // Build modifier breakdown
  const modLines = [];
  if (modifiers.ship) modLines.push(`Ship +${modifiers.ship}`);
  if (modifiers.ai) modLines.push(`AI +${modifiers.ai}`);
  if (modifiers.research) modLines.push(`Research +${modifiers.research}`);
  if (modifiers.environment) {
    const sign = modifiers.environment >= 0 ? '+' : '';
    modLines.push(`Environment ${sign}${modifiers.environment}`);
  }
  if (modifiers.consequence) modLines.push(`Consequence ${modifiers.consequence}`);
  
  const margin = totalRoll - targetDifficulty;
  const marginStr = margin >= 0 ? `+${margin}` : `${margin}`;
  
  return [
    `> ROLL: ${baseRoll.notation} = ${baseRoll.value} ${JSON.stringify(baseRoll.rolls)}`,
    `> MODIFIERS: ${modLines.join(', ')} = ${modifiers.total >= 0 ? '+' : ''}${modifiers.total}`,
    `> TOTAL: ${totalRoll} vs DC ${targetDifficulty} (${result.toUpperCase()} ${marginStr})`
  ];
}

/**
 * Format outcome (loot, damage, etc.)
 */
export function formatOutcome(outcome, resolution) {
  const lines = [
    `> RESOLUTION: ${resolution.severity.toUpperCase()}`
  ];
  
  // Loot
  if (outcome.loot && outcome.loot.length > 0) {
    outcome.loot.forEach(item => {
      lines.push(`> LOOT: ${item.quantity}x ${item.name}`);
    });
  } else {
    lines.push(`> LOOT: None`);
  }
  
  // Damage
  if (outcome.damage && outcome.damage.length > 0) {
    outcome.damage.forEach(dmg => {
      const target = dmg.system || dmg.type;
      lines.push(`> DAMAGE: ${target} -${dmg.amount}`);
    });
  }
  
  // Science
  if (outcome.science) {
    lines.push(`> SCIENCE: +${outcome.science}`);
  }
  
  // Wake
  if (outcome.wake) {
    lines.push(`> WAKE: +${outcome.wake.toFixed(2)}`);
  }
  
  // Flags
  if (outcome.flags && outcome.flags.length > 0) {
    outcome.flags.forEach(flag => {
      lines.push(`> FLAG SET: ${flag}`);
    });
  }
  
  // Follow-up
  if (outcome.followUp) {
    lines.push(`> FOLLOW-UP: ${outcome.followUp.eventId}`);
  }
  
  return lines;
}

/**
 * Format player choices
 */
export function formatChoices(choices) {
  return choices.map((choice, index) => {
    const hostile = choice.requireConfirm ? ' (HOSTILE)' : '';
    return `[${index + 1}] ${choice.label}${hostile}`;
  });
}

/**
 * Complete terminal event object
 */
export function formatCompleteEvent(eventResult) {
  const { scenario, resolution, outcome } = eventResult;
  
  return {
    type: 'event',
    conversational: resolution.terminal?.conversational || resolution.narrative,
    stream: resolution.terminal?.stream || formatOutcome(outcome, resolution),
    timestamp: Date.now()
  };
}
```

### **eventEngine.js** (Updated with Terminal Integration)
```javascript
import { makeRng } from '../rng.js';
import { resolveAction } from '../dre/engine.js';
import { selectFromTable } from '../dre/tables.js';
import { loadEventDefinition } from './eventLoader.js';
import { applyOutcome } from './outcomeProcessor.js';
import { formatEventStart, formatDREResult, formatCompleteEvent } from './terminalFormatter.js';

/**
 * Execute a complete event flow
 * @param {string} eventId - ID of event to execute
 * @param {Object} context - Game context (ship, location, etc.)
 * @param {Object} triggerData - Additional trigger-specific data
 * @returns {Object} Event execution result
 */
export async function executeEvent(eventId, context, triggerData = {}) {
  // 1. LOAD EVENT DEFINITION
  const event = loadEventDefinition(eventId);
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }
  
  // 2. PRESENT SCENARIO → TERMINAL
  const scenarioOutput = formatEventStart(event, context);
  context.terminalCallback?.({
    type: 'event_start',
    ...scenarioOutput
  });
  
  // 3. EXECUTE CHALLENGE
  let resolution;
  
  if (event.challenge.type === 'dre_roll') {
    // Automatic DRE roll
    resolution = await executeDREChallenge(event, context);
    
    // Output roll to terminal
    const rollOutput = formatDREResult(resolution);
    context.terminalCallback?.({
      type: 'event_roll',
      stream: rollOutput
    });
    
  } else if (event.challenge.type === 'player_choice') {
    // Present choices, wait for player input
    resolution = await executeChoiceChallenge(event, context);
  } else if (event.challenge.type === 'automatic') {
    // No challenge, just narrative
    resolution = { result: 'success', totalRoll: null };
  }
  
  // 4. DETERMINE RESOLUTION TIER
  const outcomeData = selectResolution(event, resolution);
  
  // 5. APPLY OUTCOME
  const finalOutcome = await applyOutcome(outcomeData, context);
  
  // 6. OUTPUT TO TERMINAL
  const eventResult = {
    eventId: event.id,
    scenario: event.scenario,
    resolution: outcomeData,
    outcome: finalOutcome
  };
  
  const terminalOutput = formatCompleteEvent(eventResult);
  context.terminalCallback?.(terminalOutput);
  
  // 7. TRIGGER FOLLOW-UP EVENT (if any)
  if (outcomeData.outcomes.followUp) {
    const delay = outcomeData.outcomes.followUp.delay || 0;
    setTimeout(() => {
      executeEvent(outcomeData.outcomes.followUp.eventId, context, { source: 'followup' });
    }, delay * 1000);
  }
  
  return eventResult;
}

// ... (rest of implementation same as before)
```

---

## 🔗 Integration with Existing Systems

### **eventEngine.js**
```javascript
import { makeRng } from '../rng.js';
import { resolveAction } from '../dre/engine.js';
import { selectFromTable } from '../dre/tables.js';
import { loadEventDefinition } from './eventLoader.js';
import { applyOutcome } from './outcomeProcessor.js';

/**
 * Execute a complete event flow
 * @param {string} eventId - ID of event to execute
 * @param {Object} context - Game context (ship, location, etc.)
 * @param {Object} triggerData - Additional trigger-specific data
 * @returns {Object} Event execution result
 */
export async function executeEvent(eventId, context, triggerData = {}) {
  // 1. LOAD EVENT DEFINITION
  const event = loadEventDefinition(eventId);
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }
  
  // 2. PRESENT SCENARIO
  const scenarioData = {
    id: event.id,
    name: event.scenario.name,
    description: event.scenario.description,
    narrative: event.scenario.narrative,
    image: event.scenario.image,
    sound: event.scenario.sound
  };
  
  // 3. EXECUTE CHALLENGE
  let resolution;
  
  if (event.challenge.type === 'dre_roll') {
    // Automatic DRE roll
    resolution = await executeDREChallenge(event, context);
  } else if (event.challenge.type === 'player_choice') {
    // Present choices, wait for player input
    resolution = await executeChoiceChallenge(event, context);
  } else if (event.challenge.type === 'automatic') {
    // No challenge, just narrative
    resolution = { result: 'success', totalRoll: null };
  } else if (event.challenge.type === 'hybrid') {
    // Choice → DRE roll
    const choice = await executeChoiceChallenge(event, context);
    resolution = await executeDREChallenge(choice.followUpEvent, context);
  }
  
  // 4. DETERMINE RESOLUTION TIER
  const outcomeData = selectResolution(event, resolution);
  
  // 5. APPLY OUTCOME
  const finalOutcome = await applyOutcome(outcomeData, context);
  
  // Return complete event result
  return {
    eventId: event.id,
    scenario: scenarioData,
    challenge: event.challenge,
    resolution,
    outcome: finalOutcome,
    narrative: outcomeData.narrative,
    followUp: outcomeData.outcomes.followUp || null
  };
}

/**
 * Execute DRE-based challenge
 */
function executeDREChallenge(event, context) {
  const seed = `event-${event.id}-${Date.now()}`;
  
  // Build DRE context
  const dreContext = {
    ...context,
    difficulty: calculateDifficulty(event.challenge.baseDC),
    customModifiers: event.challenge.modifiers?.custom || []
  };
  
  // Execute DRE action
  const result = resolveAction(
    event.challenge.dreAction,
    dreContext,
    seed
  );
  
  return result;
}

/**
 * Execute player choice challenge
 */
async function executeChoiceChallenge(event, context) {
  // Present choices to player via UI
  const choice = await showChoiceModal({
    scenario: event.scenario,
    choices: event.challenge.choices
  });
  
  // If choice has DRE roll, execute it
  if (choice.dreRoll) {
    const dreResult = resolveAction(
      choice.dreRoll.action,
      context,
      `choice-${choice.id}-${Date.now()}`
    );
    
    // Determine follow-up based on success/failure
    const followUpId = dreResult.result === 'success'
      ? choice.dreRoll.onSuccess
      : choice.dreRoll.onFailure;
    
    return { choice, dreResult, followUpEvent: followUpId };
  }
  
  return { choice, followUpEvent: choice.followUp };
}

/**
 * Select resolution based on DRE result
 */
function selectResolution(event, resolution) {
  if (!resolution.totalRoll) {
    // Automatic success (narrative only)
    return event.resolutions.find(r => r.severity === 'success');
  }
  
  // Find matching resolution range
  for (const res of event.resolutions) {
    const [min, max] = res.range;
    if (resolution.totalRoll >= min && resolution.totalRoll <= max) {
      return res;
    }
  }
  
  // Fallback to best outcome if roll exceeds all ranges
  return event.resolutions[event.resolutions.length - 1];
}
```

### **triggerManager.js**
```javascript
import { loadEventsByTrigger } from './eventLoader.js';
import { selectFromTable } from '../dre/tables.js';
import { makeRng } from '../rng.js';

/**
 * Check if event trigger conditions are met
 */
export function checkTrigger(triggerType, context) {
  // Load all events with matching trigger type
  const events = loadEventsByTrigger(triggerType);
  
  // Filter by conditions
  const validEvents = events.filter(event => {
    return evaluateConditions(event.trigger.conditions, context);
  });
  
  if (validEvents.length === 0) return null;
  
  // Weight-based selection
  const rng = makeRng(`trigger-${triggerType}-${Date.now()}`, 'events');
  const selected = selectFromTable(
    validEvents.map(e => ({ value: e, weight: e.trigger.weight })),
    rng
  );
  
  return selected.value;
}

/**
 * Evaluate trigger conditions
 */
function evaluateConditions(conditions, context) {
  if (!conditions) return true;
  
  // POI type check
  if (conditions.poiTypes && !conditions.poiTypes.includes(context.poi?.type)) {
    return false;
  }
  
  // Radiation check
  if (conditions.radiation) {
    const radiationLevels = ['low', 'moderate', 'high', 'extreme'];
    const currentLevel = radiationLevels.indexOf(context.location.radiation);
    const minLevel = radiationLevels.indexOf(conditions.radiation.min || 'low');
    const maxLevel = radiationLevels.indexOf(conditions.radiation.max || 'extreme');
    
    if (currentLevel < minLevel || currentLevel > maxLevel) {
      return false;
    }
  }
  
  // Wake check
  if (conditions.wake) {
    if (conditions.wake.min && context.wake < conditions.wake.min) return false;
    if (conditions.wake.max && context.wake > conditions.wake.max) return false;
  }
  
  // Research check
  if (conditions.research) {
    for (const tech of conditions.research) {
      if (!context.researchTree?.[tech]) return false;
    }
  }
  
  // Flag check
  if (conditions.flags) {
    for (const flag of conditions.flags) {
      if (!context.gameFlags?.[flag]) return false;
    }
  }
  
  return true;
}

/**
 * Register trigger listeners
 */
export function registerTriggers(eventEngine) {
  // POI Action triggers
  eventEngine.on('poi_action', (action, poi, context) => {
    const event = checkTrigger('poi_action', { ...context, action, poi });
    if (event) {
      executeEvent(event.id, context, { action, poi });
    }
  });
  
  // Location triggers
  eventEngine.on('system_entry', (system, context) => {
    const event = checkTrigger('location', { ...context, location: 'system_entry', system });
    if (event) {
      executeEvent(event.id, context, { system });
    }
  });
  
  // Condition triggers (checked every tick)
  eventEngine.on('tick', (context) => {
    if (context.wake > 0.8) {
      const event = checkTrigger('condition', { ...context, condition: 'high_wake' });
      if (event) {
        executeEvent(event.id, context);
      }
    }
  });
}
```

---

## 🔗 Integration with Existing Systems

### **ShipCommandConsole.jsx Integration**
```jsx
import { executeEvent } from '../lib/events/eventEngine.js';
import { dynamicEventScheduler } from '../lib/events/dynamicEventScheduler.js';
import { calculateRiskScore } from '../lib/events/riskCalculator.js';

export function ShipCommandConsole() {
  const [terminalEvents, setTerminalEvents] = useState([]);
  const [currentRisk, setCurrentRisk] = useState(0);
  
  // Start dynamic event scheduler on mount
  useEffect(() => {
    const context = {
      shipState: shipState.getState(),
      location: currentLocation,
      wake: globalWake,
      timeInSystem: systemTime,
      aiRoster: getAIRoster(),
      researchTree: getResearchTree(),
      activeMissions: getMissions(),
      
      // Terminal callback for event output
      terminalCallback: (output) => {
        setTerminalEvents(prev => [...prev, output]);
      }
    };
    
    dynamicEventScheduler.start(context);
    
    // Update risk display every 5s
    const riskInterval = setInterval(() => {
      const risk = calculateRiskScore(context);
      setCurrentRisk(risk);
    }, 5000);
    
    return () => {
      dynamicEventScheduler.stop();
      clearInterval(riskInterval);
    };
  }, []);
  
  // POI action triggers event
  const handleMineAsteroid = async (poiId, cluster) => {
    const context = {
      shipState: shipState.getState(),
      location: currentLocation,
      wake: globalWake,
      poi: { id: poiId, type: 'belt' },
      action: 'mine',
      clusterType: cluster.type,
      
      terminalCallback: (output) => {
        setTerminalEvents(prev => [...prev, output]);
      }
    };
    
    // Instead of direct DRE call, trigger event
    await executeEvent('asteroid_mining_check', context, { cluster });
  };
  
  return (
    <div className="ship-console">
      {/* Risk indicator */}
      <div className="risk-indicator">
        RISK: {currentRisk.toFixed(0)}% - {getRiskLevel(currentRisk)}
      </div>
      
      {/* Terminal feed */}
      <TerminalFeed events={terminalEvents} />
    </div>
  );
}
```

### **gameTickManager.js Integration**
```javascript
// Dynamic event scheduler registers with tick manager
import { dynamicEventScheduler } from './events/dynamicEventScheduler.js';

// Start scheduler when game loads
export function initializeGameSystems(context) {
  // ... existing initialization
  
  // Start dynamic events
  dynamicEventScheduler.start(context);
}

// Update scheduler context on game state changes
export function onGameStateChange(newState) {
  // ... existing logic
  
  // Update risk calculation
  dynamicEventScheduler.updateCheckFrequency({
    ...newState,
    terminalCallback: addTerminalEvent
  });
}
```

### **Dynamic Event JSON Examples**

#### **Pirate Encounter (High Wake)**
```json
{
  "id": "dynamic_pirate_ambush",
  "version": "1.0",
  "metadata": {
    "author": "System",
    "tags": ["dynamic", "combat", "pirate", "hostile"]
  },
  
  "trigger": {
    "type": "dynamic",
    "conditions": {
      "wake": { "min": 0.6 },
      "zone": ["dark", "static"],
      "notRecent": ["dynamic_pirate_ambush", "dynamic_pirate_patrol"],
      "cooldownSeconds": 600
    },
    "weight": 30,
    "oneTime": false,
    "cooldown": 600
  },
  
  "scenario": {
    "name": "Pirate Ambush",
    "description": "Hostile contacts detected - pirates closing fast!",
    "terminal": {
      "conversational": [
        "ARIA: \"ALERT! Multiple hostile contacts - transponder IDs match known pirate signatures!\"",
        "GHOST: \"...four vessels... attack formation... weapons hot...\"",
        "FORGE: \"They've got us bracketed. Recommend immediate evasive action!\""
      ],
      "stream": [
        "> DYNAMIC EVENT: PIRATE_AMBUSH",
        "> TRIGGER: High wake signature detected",
        "> HOSTILES: 4 pirate corvettes",
        "> THREAT LEVEL: HIGH"
      ]
    }
  },
  
  "challenge": {
    "type": "player_choice",
    "mode": "manual",
    "timeLimit": 30,
    "choices": [
      {
        "id": "fight",
        "label": "Engage hostiles",
        "description": "Stand and fight - open fire!",
        "followUp": "combat_pirate_engage"
      },
      {
        "id": "evade",
        "label": "Evasive maneuvers",
        "description": "Try to outrun them.",
        "dreRoll": {
          "action": "piloting",
          "dc": 12,
          "onSuccess": "pirate_evade_success",
          "onFailure": "pirate_evade_failure"
        }
      },
      {
        "id": "negotiate",
        "label": "Hail pirates",
        "description": "Attempt to negotiate or pay them off.",
        "dreRoll": {
          "action": "diplomacy",
          "dc": 14,
          "onSuccess": "pirate_negotiate_success",
          "onFailure": "pirate_negotiate_failure"
        }
      },
      {
        "id": "distress",
        "label": "Broadcast distress signal",
        "description": "Call for help - might attract other ships.",
        "followUp": "pirate_distress_call"
      }
    ]
  }
}
```

#### **Trader Encounter (Low-Moderate Wake)**
```json
{
  "id": "dynamic_trader_friendly",
  "version": "1.0",
  "metadata": {
    "author": "System",
    "tags": ["dynamic", "trading", "peaceful", "merchant"]
  },
  
  "trigger": {
    "type": "dynamic",
    "conditions": {
      "wake": { "min": 0.2, "max": 0.7 },
      "zone": ["quiet", "normal"],
      "notRecent": ["dynamic_trader_friendly"],
      "cooldownSeconds": 300
    },
    "weight": 25,
    "oneTime": false,
    "cooldown": 300
  },
  
  "scenario": {
    "name": "Independent Trader",
    "description": "Friendly merchant vessel on approach vector.",
    "terminal": {
      "conversational": [
        "ARIA: \"Contact detected - civilian transponder, independent trader.\"",
        "FORGE: \"They're hailing us. Seems friendly - probably looking to trade.\"",
        "GHOST: \"...no weapons lock... safe approach...\""
      ],
      "stream": [
        "> DYNAMIC EVENT: TRADER_ENCOUNTER",
        "> TRIGGER: Moderate wake, safe zone",
        "> CONTACT: Independent merchant vessel 'Star Runner'",
        "> THREAT LEVEL: NONE"
      ]
    }
  },
  
  "challenge": {
    "type": "player_choice",
    "mode": "manual",
    "choices": [
      {
        "id": "trade",
        "label": "Open trade menu",
        "description": "See what they're selling.",
        "followUp": "trader_menu"
      },
      {
        "id": "info",
        "label": "Ask for information",
        "description": "Inquire about local systems and dangers.",
        "followUp": "trader_intel"
      },
      {
        "id": "ignore",
        "label": "Decline and continue",
        "description": "Politely refuse and move on.",
        "followUp": "trader_declined"
      }
    ]
  }
}
```

#### **Derelict Discovery (Time-Based)**
```json
{
  "id": "dynamic_derelict_discovery",
  "version": "1.0",
  "metadata": {
    "author": "System",
    "tags": ["dynamic", "discovery", "derelict", "salvage"]
  },
  
  "trigger": {
    "type": "dynamic",
    "conditions": {
      "timeInSystem": { "min": 2 },
      "zone": ["dark", "static", "void"],
      "wake": { "max": 0.5 },
      "notRecent": ["dynamic_derelict_discovery"],
      "cooldownSeconds": 900
    },
    "weight": 15,
    "oneTime": false,
    "cooldown": 900
  },
  
  "scenario": {
    "name": "Derelict Signature",
    "description": "Long-range sensors detect abandoned structure.",
    "terminal": {
      "conversational": [
        "ARIA: \"Faint energy signature detected. Analyzing... appears to be a derelict structure.\"",
        "GHOST: \"...old... dormant power core... no life signs...\"",
        "FORGE: \"Could be salvage opportunity. No immediate threats detected.\""
      ],
      "stream": [
        "> DYNAMIC EVENT: DERELICT_DISCOVERY",
        "> TRIGGER: Extended system presence, dark zone",
        "> SIGNATURE: Abandoned orbital platform",
        "> DISTANCE: 35km",
        "> THREAT LEVEL: UNKNOWN"
      ]
    }
  },
  
  "challenge": {
    "type": "player_choice",
    "mode": "manual",
    "choices": [
      {
        "id": "investigate",
        "label": "Approach derelict",
        "description": "Move closer to investigate.",
        "followUp": "derelict_approach"
      },
      {
        "id": "scan",
        "label": "Scan from distance",
        "description": "Long-range scan before committing.",
        "dreRoll": {
          "action": "scan",
          "dc": 10,
          "onSuccess": "derelict_scan_success",
          "onFailure": "derelict_scan_partial"
        }
      },
      {
        "id": "mark",
        "label": "Mark location and continue",
        "description": "Add to map for later investigation.",
        "followUp": "derelict_bookmarked"
      },
      {
        "id": "ignore",
        "label": "Ignore signal",
        "description": "Too risky - keep moving.",
        "followUp": "derelict_ignored"
      }
    ]
  }
}
```

#### **Radiation Storm (Condition-Based)**
```json
{
  "id": "dynamic_radiation_storm",
  "version": "1.0",
  "metadata": {
    "author": "System",
    "tags": ["dynamic", "hazard", "environmental", "radiation"]
  },
  
  "trigger": {
    "type": "dynamic",
    "conditions": {
      "zone": ["static", "dark"],
      "radiation": { "min": "moderate" },
      "notRecent": ["dynamic_radiation_storm"],
      "cooldownSeconds": 600
    },
    "weight": 20,
    "oneTime": false,
    "cooldown": 600
  },
  
  "scenario": {
    "name": "Radiation Spike",
    "description": "Dangerous radiation levels detected - storm forming!",
    "terminal": {
      "conversational": [
        "ARIA: \"WARNING! Radiation levels spiking rapidly!\"",
        "FORGE: \"This is bad - we need to shield up or get clear, NOW!\"",
        "GHOST: \"...storm front expanding... recommend immediate action...\""
      ],
      "stream": [
        "> DYNAMIC EVENT: RADIATION_STORM",
        "> TRIGGER: Static zone instability",
        "> RADIATION: EXTREME",
        "> ETA: 30 seconds",
        "> THREAT LEVEL: HIGH"
      ]
    }
  },
  
  "challenge": {
    "type": "player_choice",
    "mode": "manual",
    "timeLimit": 20,
    "choices": [
      {
        "id": "shields",
        "label": "Raise shields",
        "description": "Divert power to radiation shielding.",
        "dreRoll": {
          "action": "shield_defense",
          "dc": 10,
          "onSuccess": "storm_shielded",
          "onFailure": "storm_partial_damage"
        }
      },
      {
        "id": "flee",
        "label": "Emergency burn",
        "description": "Full thrust - get out of storm range!",
        "dreRoll": {
          "action": "piloting",
          "dc": 12,
          "onSuccess": "storm_escaped",
          "onFailure": "storm_caught"
        }
      },
      {
        "id": "shelter",
        "label": "Find shelter",
        "description": "Look for nearby asteroid or structure to hide behind.",
        "dreRoll": {
          "action": "scan",
          "dc": 14,
          "onSuccess": "storm_sheltered",
          "onFailure": "storm_no_shelter"
        }
      }
    ]
  }
}
```

---

## 🎨 Configuration Editor (EventConfigEditor.jsx)

```jsx
import React, { useState } from 'react';

export function EventConfigEditor() {
  const [config, setConfig] = useState({
    difficultyCurve: {
      easy: { min: 3, max: 5 },
      normal: { min: 8, max: 10 },
      hard: { min: 12, max: 14 }
    },
    lootMultipliers: {
      criticalSuccess: { min: 2.0, max: 3.0 },
      success: { min: 1.0, max: 1.5 },
      partialSuccess: { min: 0.5, max: 0.8 }
    },
    encounterRates: {
      trader: { weight: 20, cooldown: 300 },
      pirate: { weight: 15, cooldown: 600 },
      derelict: { weight: 10, cooldown: 900 }
    }
  });
  
  return (
    <div className="event-config-editor">
      <h2>Event System Configuration</h2>
      
      <section>
        <h3>Difficulty Curve</h3>
        {Object.entries(config.difficultyCurve).map(([level, range]) => (
          <div key={level}>
            <label>{level.toUpperCase()}</label>
            <input
              type="number"
              value={range.min}
              onChange={(e) => updateConfig(['difficultyCurve', level, 'min'], e.target.value)}
            />
            <span>to</span>
            <input
              type="number"
              value={range.max}
              onChange={(e) => updateConfig(['difficultyCurve', level, 'max'], e.target.value)}
            />
          </div>
        ))}
      </section>
      
      <section>
        <h3>Loot Multipliers</h3>
        {/* Similar structure for loot config */}
      </section>
      
      <section>
        <h3>Random Encounter Rates</h3>
        {/* Weight/cooldown adjustments */}
      </section>
      
      <button onClick={saveConfig}>Save Configuration</button>
      <button onClick={exportJSON}>Export JSON</button>
      <button onClick={resetDefaults}>Reset to Defaults</button>
    </div>
  );
}
```

---

## 🚀 Implementation Roadmap

### **Phase 1: Core Engine (Week 1-2)**
- ✅ Create event engine pipeline (`eventEngine.js`)
- ✅ Implement DRE integration (`challengeExecutor.js`)
- ✅ Build trigger manager (`triggerManager.js`)
- ✅ Create outcome processor (`outcomeProcessor.js`)
- ✅ Build terminal formatter (`terminalFormatter.js`) ⭐ NEW
- ✅ Test with 5 sample events

### **Phase 2: Dynamic Scheduler (Week 2-3)** ⭐ NEW
- ✅ Implement risk calculator (`riskCalculator.js`)
- ✅ Build dynamic event scheduler (`dynamicEventScheduler.js`)
- ✅ Integrate with gameTickManager
- ✅ Create frequency adjustment system (2s-60s intervals)
- ✅ Implement global and per-type cooldowns
- ✅ Test risk calculation with various scenarios

### **Phase 3: JSON Definitions (Week 3-4)**
- ✅ Define POI action events (mining, scanning)
- ✅ Create dynamic encounter events (pirates, traders, derelicts)
- ✅ Build mission event chains
- ✅ Add location-based events
- ✅ Create condition/hazard events (radiation storms, etc.)
- ✅ Add 20+ dynamic event variations

### **Phase 4: UI Components (Week 4-5)**
- ✅ EventModal for narrative/choices (with dual terminal streams)
- ✅ Event results display (conversational + data)
- ✅ Choice selection interface (timed choices support)
- ✅ Risk indicator UI component
- ✅ Integration with existing terminal feed

### **Phase 5: Editors (Week 5-7)**
- ✅ EventConfigEditor (min/max tweaks, risk weights)
- ✅ DynamicRiskEditor (adjust risk calculation weights) ⭐ NEW
- ✅ ScenarioEditor (create events visually)
- ✅ MissionEditor (chain events)
- ✅ Galaxy Creator integration (pin missions)

### **Phase 6: Testing & Polish (Week 7-8)**
- ✅ Playtest 50+ events
- ✅ Balance difficulty curves
- ✅ Tune loot drop rates
- ✅ Adjust dynamic event frequencies
- ✅ Test risk calculation accuracy
- ✅ Add 100+ narrative variations
- ✅ Performance optimization (event caching)

---

## 📊 Technical Benefits

### **1. Expandability**
- **Add new events**: Drop JSON file in `/definitions/`, no code changes
- **New trigger types**: Extend `triggerManager.js` with new condition evaluators
- **New challenge modes**: Add handlers in `challengeExecutor.js`
- **Custom modifiers**: Extend DRE modifier sources

### **2. Terminal-First Output**
- **Dual streams**: Conversational (AI dialogue) + Data (technical info)
- **Unified format**: All events use same terminal output structure
- **Rich feedback**: Players see both story and mechanics
- **Debugging**: Data stream shows exact rolls/modifiers

### **3. Dynamic Risk System**
- **Adaptive frequency**: Check rate scales with danger (2s-60s)
- **Multi-factor risk**: Wake, location, time, events, missions all contribute
- **Configurable weights**: Admins can tweak risk calculation formula
- **Player agency**: Wake management becomes critical for risk control

### **4. DRE Integration**
- **Consistent mechanics**: All events use same dice/modifier system
- **Deterministic**: Seeded RNG = reproducible outcomes
- **Moddable**: Modifiers come from ship/AI/research/environment
- **Balanced**: DC and outcome ranges tune difficulty

### **5. Mission System**
- **Event chains**: Missions are sequences of events
- **Branching outcomes**: Player choices affect mission flow
- **Galaxy integration**: Pin missions to specific systems
- **Dynamic rewards**: Outcome quality affects mission rewards

---

## 🎯 Key Design Decisions

### **Why Dynamic Scheduler?**
Traditional timer-based random events feel arbitrary. Risk-based scheduling creates **emergent gameplay**:
- High wake → More frequent checks → More encounters
- Dark zones → Higher risk → More dangerous events
- Long stays → Heat buildup → Pirates/hunters arrive
- Player actions (mining, combat) directly affect event frequency

### **Why Dual Terminal Streams?**
Players need **both narrative AND data**:
- **Conversational**: Immersion, character voices, story
- **Data**: Transparency, mechanics understanding, decision-making
- **Combined**: Players feel the story AND understand the systems

### **Why JSON-Driven?**
- **Moddability**: Community can add content without code access
- **Iteration speed**: Designers tweak events without recompilation
- **Version control**: Events are git-trackable text files
- **Validation**: JSON schema ensures event structure consistency

### **Why gameTickManager Integration?**
- **Centralized timing**: All time-based systems use one scheduler
- **Performance**: Batch event checks with other game ticks
- **Pause support**: Events respect game pause state
- **Debugging**: All scheduled events visible in one place

---

## 📝 Implementation Priority

### **CRITICAL PATH (Start Immediately)**
1. ✅ `terminalFormatter.js` - Format events for terminal output
2. ✅ `eventEngine.js` - Core pipeline with terminal callbacks
3. ✅ `riskCalculator.js` - Calculate dynamic risk score
4. ✅ `dynamicEventScheduler.js` - Risk-based event triggering
5. ✅ Integration with `ShipCommandConsole.jsx` for terminal output

### **HIGH PRIORITY (Week 2-3)**
6. ✅ 10-15 dynamic event JSONs (pirates, traders, hazards)
7. ✅ POI action event JSONs (mining, scanning)
8. ✅ EventModal UI component
9. ✅ Risk indicator UI

### **MEDIUM PRIORITY (Week 4-5)**
10. ✅ Mission event chains
11. ✅ EventConfigEditor
12. ✅ ScenarioEditor

### **LOWER PRIORITY (Week 6+)**
13. ✅ MissionEditor
14. ✅ Galaxy Creator mission pinning
15. ✅ Advanced event features (cascading, branching, nested choices)

---

## ✅ Summary

The Event Engine provides:

✅ **Universal 5-stage pipeline** - All events follow Trigger → Scenario → Challenge → Resolution → Outcome  
✅ **DRE-powered decisions** - Consistent dice mechanics across all events  
✅ **Terminal-first output** - Dual conversational + data streams  
✅ **Dynamic risk-based scheduler** - Event frequency scales with danger (2s-60s intervals)  
✅ **JSON-configurable** - Add events without code changes  
✅ **Visual editors** - Create events, tweak configs, build missions  
✅ **Fully expandable** - New trigger types, challenge modes, outcome types  
✅ **Mission integration** - Chain events into multi-step missions  
✅ **Galaxy integration** - Pin missions to specific systems  

**This system unifies POI actions, random encounters, missions, hazards, discoveries, and dynamic events into ONE moddable, testable, narrative-rich framework.** 🎲🚀
