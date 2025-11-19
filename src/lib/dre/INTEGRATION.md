# DRE Integration Guide

## Quick Integration Checklist

### Step 1: Import the DRE
```javascript
import { resolveAction } from './lib/dre/engine.js';
import { previewOdds } from './lib/dre/preview.js';
import { emitToTerminal } from './lib/dre/output.js';
```

### Step 2: Build Context from Game State

```javascript
// In your ShipCommandConsole or action handler
function buildActionContext(actionType) {
  return {
    // Always include ship state
    shipState: getShipState(), // Your existing ship state
    
    // Always include AI roster
    aiRoster: getShipState().ai || [],
    
    // Current location
    location: {
      ...currentSystem,
      radiation: currentSystem.radiation,
      zone: currentSystem.zone
    },
    
    // Research tree (if you have it)
    researchTree: playerResearch || {},
    
    // Action-specific context
    difficulty: 'normal', // or calculate dynamically
    
    // Consequence modifiers
    wake: getShipState().wake || 0,
    timeElapsed: missionTimer || 0
  };
}
```

### Step 3: Preview Odds (Optional but Recommended)

```javascript
function showActionOdds(actionType) {
  const context = buildActionContext(actionType);
  const odds = previewOdds(actionType, context);
  
  // Display to player
  return `Success Chance: ${odds.summary}`;
}
```

### Step 4: Execute Action

```javascript
function executeAction(actionType, additionalContext = {}) {
  const context = {
    ...buildActionContext(actionType),
    ...additionalContext
  };
  
  // Generate unique seed
  const seed = `${shipState.seed}-${actionType}-${Date.now()}`;
  
  // Resolve
  const outcome = resolveAction(actionType, context, seed);
  
  // Apply consequences to game state
  applyOutcome(outcome);
  
  // Display to terminal
  displayInTerminal(outcome, context);
  
  return outcome;
}
```

### Step 5: Apply Consequences

```javascript
function applyOutcome(outcome) {
  const shipState = getShipState();
  
  // Apply damage
  if (outcome.consequences.damageTaken) {
    shipState.hull -= outcome.consequences.damageTaken;
  }
  
  // Add loot
  if (outcome.consequences.lootGained) {
    outcome.consequences.lootGained.forEach(item => {
      addToInventory(item);
    });
  }
  
  // Update wake
  if (outcome.consequences.wakeAdded) {
    shipState.wake = Math.min(1.0, shipState.wake + outcome.consequences.wakeAdded);
  }
  
  // AI impacts
  if (outcome.consequences.aiImpact) {
    updateAIMorale(outcome.consequences.aiImpact.morale);
  }
  
  // Status effects
  if (outcome.consequences.statusEffects) {
    outcome.consequences.statusEffects.forEach(effect => {
      applyStatusEffect(effect);
    });
  }
  
  // Save state
  saveShipState(shipState);
}
```

### Step 6: Display in Terminal

```javascript
function displayInTerminal(outcome, context) {
  const output = emitToTerminal(outcome, context, {
    showModifiers: true,
    showRolls: true,
    showAIAnalysis: true,
    animated: true
  });
  
  // Add to terminal display
  addTerminalMessage({
    type: 'action-result',
    icon: output.icon,
    narrative: output.narrative,
    color: getResultColor(output.result),
    sections: output.sections,
    aiSpeech: output.aiSpeech
  });
  
  // Optional: Trigger dice animation
  if (output.animation) {
    animateDiceRoll(output.animation);
  }
  
  // Optional: Synthesize AI speech
  if (output.aiSpeech && aiVoiceEnabled) {
    speakText(output.aiSpeech);
  }
}
```

## Specific Action Integrations

### Mining Button Handler

```javascript
function handleMiningAction(asteroid) {
  // Preview
  const odds = previewOdds('mining', {
    ...buildActionContext('mining'),
    targetAsteroid: asteroid
  });
  
  // Show confirmation modal with odds
  if (!confirmAction(`Mine asteroid? ${odds.summary}`)) return;
  
  // Execute
  const outcome = executeAction('mining', {
    targetAsteroid: asteroid
  });
  
  // Check for critical failure
  if (outcome.result === 'crit_fail') {
    triggerEmergencyEvent();
  }
}
```

### Scavenging Container

```javascript
function handleScavenging(container) {
  const context = {
    ...buildActionContext('scavenging'),
    container
  };
  
  const outcome = executeAction('scavenging', context);
  
  // Check for detection
  if (outcome.secondaryRolls.detection?.detected) {
    spawnHostileEncounter();
  }
  
  return outcome;
}
```

### Combat Turn

```javascript
function handleCombatAttack(target, weapon) {
  const context = {
    ...buildActionContext('combatAttack'),
    weapon,
    target,
    range: calculateRange(target)
  };
  
  const outcome = executeAction('combatAttack', context);
  
  // Apply damage to enemy
  target.hull -= outcome.consequences.enemyDamage;
  
  // Check weapon status
  if (outcome.statusEffect.value === 'weaponJammed') {
    disableWeapon(weapon);
  }
  
  // Critical hit bonus
  if (outcome.statusEffect.value === 'criticalHit') {
    showCriticalHitEffect();
  }
  
  // Check if enemy destroyed
  if (target.hull <= 0) {
    endCombat('victory');
  }
  
  return outcome;
}
```

### Mission Completion

```javascript
function completeMission(mission) {
  const context = {
    ...buildActionContext('missionCompletion'),
    mission
  };
  
  const outcome = executeAction('missionCompletion', context);
  
  // Mark mission complete
  mission.completed = true;
  mission.result = outcome.result;
  
  // Unlock story progression
  if (outcome.consequences.storyUnlock) {
    unlockStoryElement(mission.storyFlag);
  }
  
  // Bonus rewards
  if (outcome.consequences.bonusReward) {
    showBonusRewardModal(outcome.consequences.bonusReward);
  }
  
  return outcome;
}
```

## Combat Loop Integration

```javascript
async function runCombat(enemy) {
  // Initiative
  const init = executeAction('combatInitiate', { enemy });
  let playerTurn = init.consequences.playerTurn;
  let turn = 1;
  
  while (enemy.hull > 0 && shipState.hull > 0) {
    if (playerTurn) {
      // Player action
      const action = await waitForPlayerCombatChoice();
      
      if (action.type === 'attack') {
        const outcome = handleCombatAttack(enemy, action.weapon);
      } else if (action.type === 'flee') {
        const outcome = executeAction('combatFlee', { 
          enemy, 
          combatDuration: turn 
        });
        if (outcome.consequences.combatEnded) break;
      } else if (action.type === 'repair') {
        const outcome = executeAction('combatRepair', {
          targetSystem: action.system,
          emergency: true
        });
      }
    } else {
      // Enemy turn
      const enemyAttack = executeAction('combatAttack', {
        shipState: enemy,
        weapon: enemy.weapons[0],
        target: { 
          evasion: shipState.evasion,
          shields: shipState.shields 
        }
      });
      
      shipState.hull -= enemyAttack.consequences.enemyDamage;
    }
    
    playerTurn = !playerTurn;
    turn++;
  }
  
  // Resolve combat end
  if (enemy.hull <= 0) {
    endCombat('victory');
    offerSalvage(enemy);
  } else if (shipState.hull <= 0) {
    endCombat('defeat');
  }
}
```

## Tips

1. **Unique Seeds**: Always use unique seeds per action
   ```javascript
   `${baseShipSeed}-${actionType}-${actionCounter++}`
   ```

2. **Show Odds**: Preview odds before dangerous actions
   ```javascript
   if (difficulty === 'deadly') {
     const odds = previewOdds(actionType, context);
     showWarning(`Only ${odds.successChance}% chance!`);
   }
   ```

3. **Log History**: Keep action log for player review
   ```javascript
   actionHistory.push(formatForLog(outcome));
   ```

4. **Modifier Tooltips**: Show modifier breakdown on hover
   ```javascript
   const mods = collectModifiers(actionType, context);
   tooltip.innerHTML = formatModifierBreakdown(mods.breakdown);
   ```

5. **Dynamic Difficulty**: Adjust based on player gear/level
   ```javascript
   const avgShipTier = calculateAverageComponentTier(shipState);
   const difficulty = avgShipTier < 2 ? 'hard' : 'normal';
   ```

---

**You're ready to integrate!** The DRE is fully functional and tested. Just import, build context, and execute actions.
