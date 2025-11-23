# Faction Reputation System
## Dynamic Conditional Honor/Reputation Changes

---

## 🎯 Overview

The faction reputation system allows events to modify player standing with factions based on both **static** and **dynamic** conditions. This enables complex narrative scenarios like:

- Attacking a faction ship reduces reputation with that faction (dynamic)
- Completing a mission for a faction increases reputation (static)
- Defending against pirates improves reputation with law-abiding factions (conditional)
- Destroying a faction station triggers reputation loss (dynamic based on POI owner)

---

## 📊 Data Structure

### Static Reputation Change (Always Applies)

```javascript
{
  factionId: 'terran_alliance',
  change: +10,
  condition: null
}
```

**Result**: Always grants +10 reputation with Terran Alliance when this outcome triggers.

---

### Dynamic Reputation Change (Conditional)

```javascript
{
  factionId: null,  // Not used - faction determined dynamically
  change: -10,
  condition: {
    type: 'combat_target',           // Type of condition
    source: 'target.factionId',      // Where to get faction ID
    operator: 'exists'                // Condition check
  }
}
```

**Result**: If player attacked a ship with a faction, reduce reputation by -10 with that faction.

---

## 🔧 Condition Types

### 1. **No Condition** (Static)
- **When**: `condition: null`
- **Behavior**: Always applies to the specified `factionId`
- **Example**: Completing a Terran mission always gives +10 Terran rep

### 2. **Combat Target**
- **Type**: `combat_target`
- **When**: Player attacks/destroys a ship
- **Source**: `target.factionId`
- **Use Case**: "IF player destroyed a faction ship, THEN -10 rep with that faction"

### 3. **Encounter Faction**
- **Type**: `encounter_faction`
- **Source**: `encounter.factionId`
- **Use Case**: "IF encounter belongs to a faction, THEN +5 rep for peaceful resolution"

### 4. **POI Owner**
- **Type**: `poi_owner`
- **Source**: `poi.ownerFaction`
- **Use Case**: "IF POI has an owner faction, THEN +15 rep for helping them"

### 5. **Dynamic Faction**
- **Type**: `dynamic_faction`
- **Source**: Custom path (e.g., `event.involvedFactions[0]`)
- **Use Case**: Flexible reputation changes based on event context

---

## 🎮 Condition Operators

### `exists`
- **Check**: Does the faction exist in the context?
- **Example**: `target.factionId` exists → Apply reputation change
- **Use Case**: "Any faction ship" scenarios

```javascript
{
  operator: 'exists',
  source: 'target.factionId'
}
```

### `equals`
- **Check**: Is the faction ID exactly this value?
- **Example**: `target.factionId === 'pirate_syndicate'`
- **Use Case**: "Only if it's a pirate ship"

```javascript
{
  operator: 'equals',
  source: 'target.factionId',
  value: 'pirate_syndicate'
}
```

### `not_equals`
- **Check**: Is the faction ID NOT this value?
- **Example**: `target.factionId !== 'terran_alliance'`
- **Use Case**: "All non-Terran factions"

```javascript
{
  operator: 'not_equals',
  source: 'target.factionId',
  value: 'terran_alliance'
}
```

---

## 💡 Example Scenarios

### Scenario 1: Attack Any Faction Ship

**Event**: Player encounters a ship and chooses to attack

**Outcome Configuration**:
```javascript
factionReputation: [
  {
    factionId: null,
    change: -10,
    condition: {
      type: 'combat_target',
      source: 'target.factionId',
      operator: 'exists'
    }
  }
]
```

**Result**:
- IF attacked ship has `factionId: 'terran_alliance'` → Terran Alliance -10
- IF attacked ship has `factionId: 'pirate_syndicate'` → Pirate Syndicate -10
- IF attacked ship has no faction → No reputation change

---

### Scenario 2: Help Specific Faction, Anger Their Enemy

**Event**: Defend Terran convoy from pirates

**Outcome Configuration**:
```javascript
factionReputation: [
  {
    factionId: 'terran_alliance',
    change: +15,
    condition: null  // Always applies
  },
  {
    factionId: 'pirate_syndicate',
    change: -5,
    condition: null  // Always applies
  }
]
```

**Result**:
- Terran Alliance +15 (helped them)
- Pirate Syndicate -5 (attacked their ships)

---

### Scenario 3: Destroy Only Non-Allied Ships

**Event**: Combat scenario with faction check

**Outcome Configuration**:
```javascript
factionReputation: [
  {
    factionId: null,
    change: -20,
    condition: {
      type: 'combat_target',
      source: 'target.factionId',
      operator: 'not_equals',
      value: 'terran_alliance'  // Only if NOT Terran
    }
  }
]
```

**Result**:
- IF destroyed ship is Terran → No reputation change (friendly fire protection)
- IF destroyed ship is any other faction → -20 rep with that faction

---

### Scenario 4: POI Assistance Based on Owner

**Event**: Repair a damaged station

**Outcome Configuration**:
```javascript
factionReputation: [
  {
    factionId: null,
    change: +25,
    condition: {
      type: 'poi_owner',
      source: 'poi.ownerFaction',
      operator: 'exists'
    }
  }
]
```

**Result**:
- IF station owned by Terran Alliance → Terran +25
- IF station owned by Independent Miners → Miners +25
- IF station has no owner → No reputation change

---

### Scenario 5: Multi-Conditional Complex Event

**Event**: Choose to defend a convoy under attack

**Outcome Configuration**:
```javascript
factionReputation: [
  // Gain rep with the faction you're defending
  {
    factionId: null,
    change: +20,
    condition: {
      type: 'encounter_faction',
      source: 'encounter.factionId',
      operator: 'exists'
    }
  },
  // Lose rep with the attackers
  {
    factionId: null,
    change: -15,
    condition: {
      type: 'combat_target',
      source: 'target.factionId',
      operator: 'exists'
    }
  }
]
```

**Result**:
- Convoy faction (e.g., Terran Alliance) +20
- Attacker faction (e.g., Pirate Syndicate) -15

---

## 🧪 Testing in EventSimulator

The EventSimulator shows faction reputation processing in **Step 10: Apply Rewards**:

```
=== FACTION REPUTATION CHANGES ===
Evaluating condition #1: combat_target
  Source: target.factionId = pirate_syndicate
  Operator: exists → ✓
  → Dynamic faction resolved: pirate_syndicate
Faction: pirate_syndicate -10

🤝 FACTION RELATIONS:
  pirate_syndicate: -10
```

### Mock Context for Testing

The simulator uses mock context data:
```javascript
{
  target: { factionId: 'pirate_syndicate' },
  encounter: { factionId: 'terran_alliance' },
  poi: { ownerFaction: 'independent_miners' }
}
```

---

## 🎨 UI in BranchEditor

### Creating a Reputation Change

1. **Open BranchEditor** for an outcome
2. Scroll to **"🤝 Faction Reputation Changes"** section
3. Click **"Add Faction Rep"**
4. Configure:
   - **Condition Type**: Choose from dropdown
   - **Faction/Source**: Select faction (static) or context source (dynamic)
   - **Operator**: Choose condition check
   - **Change**: Use slider (-100 to +100)
5. **Preview Logic** shows exactly what will happen

### Example UI States

**Static Reputation**:
```
Condition Type: Always Apply (No Condition)
Faction: 🏛️ Terran Alliance
Reputation Change: +15

Preview Logic:
ALWAYS: Terran Alliance +15
```

**Dynamic Reputation**:
```
Condition Type: If Combat Target Has Faction
Get Faction From: Combat Target Faction
Condition Operator: Exists (faction must be present)
Reputation Change: -10

Preview Logic:
IF target.factionId exists
THEN [Dynamic Faction] -10
```

---

## 🔌 Backend Implementation

### Processing Logic (eventOutcomeProcessor.js)

```javascript
function processFactionReputation(reputationChanges, context, playerState) {
  reputationChanges.forEach(rep => {
    let targetFactionId = rep.factionId;
    let applies = true;
    
    // Handle conditional reputation
    if (rep.condition) {
      const sourcePath = rep.condition.source.split('.');
      let value = context;
      
      // Traverse path to get faction ID
      sourcePath.forEach(key => {
        value = value?.[key];
      });
      
      // Check condition
      if (rep.condition.operator === 'exists') {
        applies = !!value;
      } else if (rep.condition.operator === 'equals') {
        applies = value === rep.condition.value;
      } else if (rep.condition.operator === 'not_equals') {
        applies = value !== rep.condition.value;
      }
      
      if (applies && value) {
        targetFactionId = value;
      }
    }
    
    if (applies && targetFactionId) {
      // Apply reputation change
      if (!playerState.factionReputation) {
        playerState.factionReputation = {};
      }
      
      playerState.factionReputation[targetFactionId] = 
        (playerState.factionReputation[targetFactionId] || 0) + rep.change;
      
      console.log(`Faction ${targetFactionId}: ${rep.change > 0 ? '+' : ''}${rep.change}`);
    }
  });
}
```

---

## 📝 Best Practices

### 1. **Always vs. Conditional**
- Use **static** (no condition) for mission rewards
- Use **conditional** for dynamic gameplay (combat, encounters)

### 2. **Multiple Reputation Changes**
- You can have both static and dynamic changes in one outcome
- Example: +10 for quest faction, -5 for enemy faction

### 3. **Faction Balance**
- Consider creating opposing reputation changes
- Helping one faction often angers their enemies

### 4. **Testing**
- Use EventSimulator to verify logic
- Check Preview Logic in BranchEditor
- Test with different context values

### 5. **Documentation**
- Use clear condition types
- Name factions descriptively
- Comment complex multi-faction scenarios

---

## 🚀 Future Enhancements

### Planned Features

1. **Reputation Thresholds**
   - Unlock dialogue options at +50 rep
   - Trigger hostile encounters at -50 rep

2. **Faction-Gated Content**
   - Ships require minimum reputation
   - Items locked behind faction standing
   - Special missions for allied factions

3. **Reputation Decay**
   - Unused factions slowly drift to neutral
   - Requires maintenance of relationships

4. **Faction Alliances**
   - Helping allied faction B improves standing with faction A
   - Complex relationship webs

5. **Event Filtering by Reputation**
   - High rep triggers "honored guest" events
   - Low rep triggers "ambush" events

---

**Status**: Faction Reputation System fully implemented in BranchEditor  
**Next**: Backend integration for processing reputation changes  
**Testing**: EventSimulator shows faction logic processing

