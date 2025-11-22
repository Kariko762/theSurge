# Event Engine Expandability Guide

## 🔧 How to Extend the Event Engine

The event engine is designed for **maximum expandability**. Here's how to add new features without modifying core code.

---

## 1️⃣ Adding New Event Types

### **Step 1: Create JSON Definition**
Create a new file in `src/lib/events/definitions/`:

```json
// events_nebula.json
{
  "id": "nebula_survey_anomaly",
  "version": "1.0",
  "metadata": {
    "author": "YourName",
    "created": "2025-11-21",
    "tags": ["nebula", "survey", "science"]
  },
  
  "trigger": {
    "type": "poi_action",
    "poiTypes": ["nebula"],
    "action": "survey",
    "weight": 20
  },
  
  "scenario": {
    "name": "Nebula Anomaly",
    "terminal": {
      "conversational": ["ARIA: \"Anomalous readings detected...\""],
      "stream": ["> EVENT: NEBULA_SURVEY", "> TYPE: Science"]
    }
  },
  
  "challenge": {
    "type": "dre_roll",
    "dreAction": "nebula_survey",
    "dice": "2d6",
    "baseDC": 10
  },
  
  "resolutions": [
    {
      "range": [9, 14],
      "severity": "success",
      "terminal": {
        "conversational": ["ARIA: \"Survey complete!\""],
        "stream": ["> RESOLUTION: SUCCESS", "> SCIENCE: +50"]
      },
      "outcomes": {
        "science": 50,
        "loot": [{"itemId": "science_data", "quantity": 1}]
      }
    }
  ]
}
```

### **Step 2: (Optional) Add DRE Action**
If using custom DRE action, add to `src/lib/dre/poiActionTables.js`:

```javascript
export const POI_ACTIONS = {
  // ... existing actions
  
  nebula_survey: {
    name: "Nebula Survey",
    dice: "2d6",
    difficulty: "normal",
    modifierSources: ["ship", "ai", "research", "environment"],
    customModifiers: [
      {
        condition: (ctx) => ctx.shipState.components.some(c => c.type === 'spectroscope'),
        bonus: 2,
        description: "Spectroscope installed"
      }
    ]
  }
};
```

✅ **That's it!** Event is now available - no core code changes needed.

---

## 2️⃣ Adding New Trigger Types

### **Step 1: Add Trigger Evaluator**
Extend `src/lib/events/triggerManager.js`:

```javascript
// Add new trigger type handler
export function checkTrigger(triggerType, context) {
  const events = loadEventsByTrigger(triggerType);
  
  // Add new trigger type
  if (triggerType === 'proximity') {
    return checkProximityTrigger(events, context);
  }
  
  // ... existing trigger types
}

function checkProximityTrigger(events, context) {
  const validEvents = events.filter(event => {
    const trigger = event.trigger;
    
    // Check if player is within range of target POI
    const distance = calculateDistance(context.playerPos, trigger.targetPos);
    if (distance > trigger.maxDistance) return false;
    
    // Check proximity duration
    if (context.timeNearTarget < trigger.minDuration) return false;
    
    return true;
  });
  
  if (validEvents.length === 0) return null;
  
  // Weight-based selection
  const rng = makeRng(`trigger-proximity-${Date.now()}`, 'events');
  return selectFromTable(validEvents, rng);
}
```

### **Step 2: Create Events with New Trigger**
```json
{
  "trigger": {
    "type": "proximity",
    "targetType": "black_hole",
    "maxDistance": 50,
    "minDuration": 60,
    "weight": 25
  }
}
```

✅ **New trigger type available across all events!**

---

## 3️⃣ Adding New Challenge Modes

### **Step 1: Extend Challenge Executor**
Modify `src/lib/events/challengeExecutor.js`:

```javascript
export async function executeChallenge(event, context) {
  const { challenge } = event;
  
  // Add new challenge mode
  if (challenge.type === 'skill_check') {
    return executeSkillCheck(challenge, context);
  }
  
  // ... existing challenge types
}

async function executeSkillCheck(challenge, context) {
  const skill = challenge.skill; // "engineering", "piloting", etc.
  const skillLevel = context.playerSkills?.[skill] || 0;
  
  // Roll d20 + skill level
  const rng = makeRng(`skill-${skill}-${Date.now()}`, 'events');
  const roll = rollNotation("1d20", rng);
  const total = roll.value + skillLevel;
  
  const success = total >= challenge.dc;
  
  return {
    result: success ? 'success' : 'failure',
    totalRoll: total,
    baseRoll: roll.value,
    skillBonus: skillLevel,
    targetDifficulty: challenge.dc
  };
}
```

### **Step 2: Use in Event JSON**
```json
{
  "challenge": {
    "type": "skill_check",
    "skill": "engineering",
    "dc": 15,
    "flavor": "Make an engineering check to repair the damaged relay."
  }
}
```

✅ **New challenge mode available!**

---

## 4️⃣ Adding New Outcome Types

### **Step 1: Extend Outcome Processor**
Modify `src/lib/events/outcomeProcessor.js`:

```javascript
export async function applyOutcome(resolution, context) {
  const { outcomes } = resolution;
  
  // Existing outcome types
  if (outcomes.loot) applyLoot(outcomes.loot, context);
  if (outcomes.damage) applyDamage(outcomes.damage, context);
  if (outcomes.flags) applyFlags(outcomes.flags, context);
  
  // Add new outcome type: AI experience
  if (outcomes.aiExperience) {
    applyAIExperience(outcomes.aiExperience, context);
  }
  
  // Add new outcome type: reputation change
  if (outcomes.reputation) {
    applyReputationChange(outcomes.reputation, context);
  }
  
  // ... rest of processing
}

function applyAIExperience(expData, context) {
  const { aiRole, amount } = expData;
  
  // Find AI with matching role
  const ai = context.aiRoster.find(a => a.role === aiRole);
  if (!ai) return;
  
  // Add experience
  ai.experience = (ai.experience || 0) + amount;
  
  // Check for level up
  if (ai.experience >= ai.nextLevelThreshold) {
    ai.tier += 1;
    ai.experience = 0;
    
    context.terminalCallback?.({
      type: 'ai_levelup',
      conversational: [`${ai.name} has gained a level! Now Tier ${ai.tier}.`],
      stream: [`> AI LEVEL UP: ${ai.name} → Tier ${ai.tier}`]
    });
  }
}

function applyReputationChange(repData, context) {
  const { faction, amount } = repData;
  
  context.reputation = context.reputation || {};
  context.reputation[faction] = (context.reputation[faction] || 0) + amount;
  
  context.terminalCallback?.({
    type: 'reputation',
    stream: [`> REPUTATION: ${faction} ${amount >= 0 ? '+' : ''}${amount}`]
  });
}
```

### **Step 2: Use in Event JSON**
```json
{
  "outcomes": {
    "loot": [{"itemId": "scrap", "quantity": 5}],
    "aiExperience": {
      "aiRole": "engineer",
      "amount": 50
    },
    "reputation": {
      "faction": "independent_traders",
      "amount": 10
    }
  }
}
```

✅ **New outcome types integrated!**

---

## 5️⃣ Adding New Modifier Sources

### **Step 1: Create Modifier Source**
Add file `src/lib/dre/modifiers/sources/reputation.js`:

```javascript
/**
 * Reputation-based modifiers
 */
export function getReputationModifiers(actionType, context) {
  if (!context.reputation) return 0;
  
  let total = 0;
  
  // High trader rep helps with trading/negotiation
  if (actionType === 'diplomacy' || actionType === 'trading') {
    const traderRep = context.reputation.independent_traders || 0;
    if (traderRep > 50) total += 2;
    if (traderRep > 100) total += 1;
  }
  
  // High pirate rep penalizes legitimate actions
  if (actionType === 'docking' || actionType === 'trading') {
    const pirateRep = context.reputation.pirates || 0;
    if (pirateRep > 50) total -= 2;
  }
  
  return total;
}
```

### **Step 2: Register in Modifier Index**
Modify `src/lib/dre/modifiers/index.js`:

```javascript
import { getReputationModifiers } from './sources/reputation.js';

export function collectModifiers(actionType, context) {
  const mods = {
    ship: getShipModifiers(actionType, context),
    ai: getAIModifiers(actionType, context),
    research: getResearchModifiers(actionType, context),
    environment: getEnvironmentModifiers(actionType, context),
    consequence: getConsequenceModifiers(actionType, context),
    reputation: getReputationModifiers(actionType, context), // NEW
    total: 0
  };
  
  mods.total = Object.values(mods).reduce((sum, val) => {
    return typeof val === 'number' ? sum + val : sum;
  }, 0);
  
  return mods;
}
```

✅ **Reputation now affects all DRE rolls!**

---

## 6️⃣ Adding Risk Calculation Factors

### **Step 1: Extend Risk Calculator**
Modify `src/lib/events/riskCalculator.js`:

```javascript
export function calculateRiskScore(context) {
  let risk = 0;
  
  // Existing factors
  risk += (context.wake || 0) * 40;
  risk += calculateLocationRisk(context.location) * 0.3;
  risk += Math.min((context.timeInSystem || 0) * 2, 100) * 0.15;
  
  // NEW: Ship damage increases risk
  const hullPercent = context.shipState.hull / context.shipState.maxHull;
  if (hullPercent < 0.5) risk += 20;
  if (hullPercent < 0.25) risk += 30;
  
  // NEW: Low fuel increases risk
  const fuelPercent = context.shipState.fuel / context.shipState.maxFuel;
  if (fuelPercent < 0.3) risk += 15;
  if (fuelPercent < 0.1) risk += 35;
  
  // NEW: Hostile reputation increases risk
  const hostileRep = context.reputation?.pirates || 0;
  if (hostileRep > 50) risk += 10;
  if (hostileRep > 100) risk += 20;
  
  return Math.max(0, Math.min(100, risk));
}
```

✅ **Risk now accounts for ship health, fuel, and reputation!**

---

## 7️⃣ Creating Event Templates

### **Common Event Patterns**

#### **Template: Discovery Event**
```json
{
  "id": "discovery_[thing]",
  "trigger": {
    "type": "poi_action",
    "action": "scan",
    "weight": 15
  },
  "scenario": {
    "terminal": {
      "conversational": ["ARIA: \"Unusual signature detected...\""],
      "stream": ["> EVENT: DISCOVERY", "> TYPE: [category]"]
    }
  },
  "challenge": {
    "type": "dre_roll",
    "dreAction": "scan",
    "baseDC": 10
  },
  "resolutions": [
    {
      "range": [9, 14],
      "severity": "success",
      "outcomes": {
        "science": 50,
        "loot": [{"itemId": "[data_type]", "quantity": 1}],
        "flags": ["discovered_[thing]"]
      }
    }
  ]
}
```

#### **Template: Combat Encounter**
```json
{
  "id": "combat_[enemy_type]",
  "trigger": {
    "type": "dynamic",
    "conditions": {"wake": {"min": 0.6}},
    "weight": 25
  },
  "scenario": {
    "terminal": {
      "conversational": ["ARIA: \"ALERT! Hostile contacts!\""],
      "stream": ["> EVENT: COMBAT", "> HOSTILES: [count]x [enemy]"]
    }
  },
  "challenge": {
    "type": "player_choice",
    "choices": [
      {"id": "fight", "label": "Engage", "followUp": "combat_[enemy]_fight"},
      {"id": "flee", "label": "Evade", "dreRoll": {"action": "piloting", "dc": 12}}
    ]
  }
}
```

#### **Template: Hazard Event**
```json
{
  "id": "hazard_[type]",
  "trigger": {
    "type": "dynamic",
    "conditions": {"zone": ["dark", "static"]},
    "weight": 20
  },
  "scenario": {
    "terminal": {
      "conversational": ["ARIA: \"WARNING! [hazard] detected!\""],
      "stream": ["> EVENT: HAZARD", "> TYPE: [hazard_type]"]
    }
  },
  "challenge": {
    "type": "player_choice",
    "timeLimit": 20,
    "choices": [
      {"id": "shields", "label": "Raise shields", "dreRoll": {"action": "defense", "dc": 10}},
      {"id": "evade", "label": "Evasive action", "dreRoll": {"action": "piloting", "dc": 12}}
    ]
  }
}
```

---

## 8️⃣ Event Validation Schema

### **Create Validation Function**
Add to `src/lib/events/eventLoader.js`:

```javascript
export function validateEventSchema(event) {
  const errors = [];
  
  // Required fields
  if (!event.id) errors.push("Missing event ID");
  if (!event.trigger) errors.push("Missing trigger definition");
  if (!event.scenario) errors.push("Missing scenario definition");
  if (!event.challenge) errors.push("Missing challenge definition");
  if (!event.resolutions || event.resolutions.length === 0) {
    errors.push("Missing resolutions array");
  }
  
  // Trigger validation
  if (event.trigger) {
    if (!event.trigger.type) errors.push("Missing trigger.type");
    if (!event.trigger.weight) errors.push("Missing trigger.weight");
  }
  
  // Scenario validation
  if (event.scenario) {
    if (!event.scenario.terminal) errors.push("Missing scenario.terminal");
  }
  
  // Resolution validation
  if (event.resolutions) {
    event.resolutions.forEach((res, idx) => {
      if (!res.range) errors.push(`Resolution ${idx}: Missing range`);
      if (!res.severity) errors.push(`Resolution ${idx}: Missing severity`);
      if (!res.terminal) errors.push(`Resolution ${idx}: Missing terminal output`);
      if (!res.outcomes) errors.push(`Resolution ${idx}: Missing outcomes`);
    });
  }
  
  if (errors.length > 0) {
    console.error(`[EventValidation] Errors in event ${event.id}:`, errors);
    return false;
  }
  
  return true;
}
```

✅ **All events validated on load!**

---

## 🎯 Summary

The event engine is expandable via:

✅ **New Events** - Drop JSON in `/definitions/`  
✅ **New Triggers** - Extend `triggerManager.js`  
✅ **New Challenges** - Extend `challengeExecutor.js`  
✅ **New Outcomes** - Extend `outcomeProcessor.js`  
✅ **New Modifiers** - Add source in `dre/modifiers/sources/`  
✅ **New Risk Factors** - Extend `riskCalculator.js`  
✅ **Templates** - Copy/modify common patterns  
✅ **Validation** - Schema checking prevents errors  

**Everything is modular - extend without breaking existing systems!** 🔧🚀
