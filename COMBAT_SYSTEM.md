# Combat System Framework

## Overview
Turn-based space combat system with holographic UI, damage calculation, and AI opponents.

## Files Created
1. **`src/lib/combatEngine.js`** - Core combat logic
2. **`src/components/CombatWindow.jsx`** - Combat UI modal

---

## Combat Engine Features

### Combatant System
- **Hull** - Ship structural integrity (0-100%)
- **Shields** - Energy shields that absorb damage (0-100%)
- **Energy** - Powers weapons and abilities
- **Initiative** - Determines turn order
- **Evasion** - Dodge chance
- **Accuracy** - Hit chance
- **Armor** - Damage reduction

### Weapons System
Each combatant has configurable weapons:
```javascript
{
  id: 'laser_cannon',
  name: 'Laser Cannon',
  type: 'energy',
  damage: { min: 15, max: 25 },
  shieldPenetration: 0.3, // 30% bypasses shields
  accuracy: 85,
  cooldown: 0,
  maxCooldown: 1, // turns between uses
  energyCost: 10
}
```

### Combat Actions
- **Attack** - Fire weapons at enemy
- **Evasive Maneuvers** - +30% evasion for 1 turn
- **Boost Shields** - Regenerate 20% shields
- **Overcharge Weapons** - +50% damage next attack

### AI Profiles
- **Aggressive** - Always attacks
- **Defensive** - Boosts shields when low
- **Tactical** - Uses overcharge when enemy shields down
- **Balanced** - Mix of all strategies

### Enemy Templates
Pre-configured enemy types:
- **pirate_fighter** - Fast, aggressive, low hull
- **corporate_patrol** - Balanced stats, pulse lasers
- **alien_drone** - High shields, plasma weapons

---

## Combat Window UI

### Layout
```
┌─────────────────────────────────────────┐
│        ⚔️ COMBAT ENGAGEMENT ⚔️         │
│            Turn: 3 | YOUR TURN          │
├─────────────────────────────────────────┤
│                                         │
│  [Player Ship]  VS  [Enemy Ship]        │
│   🚀 🛡️          💥     👾 🛡️          │
│                                         │
│   Hull: ███████░░ 70/100                │
│   Shields: █████░░░ 50/100              │
│   Energy: ████████░ 80/100              │
│                                         │
├─────────────────────────────────────────┤
│  Combat Log:                            │
│  > Player hits Enemy for 22 damage!     │
│  > Enemy misses Player!                 │
├─────────────────────────────────────────┤
│  SELECT ACTION:                         │
│  [Fire Laser] [Evasive] [Boost Shields] │
│  ⚡ 10       ⚡ 5        ⚡ 20           │
│                                         │
│  [EXECUTE: Fire Laser Cannon]           │
└─────────────────────────────────────────┘
```

### Visual Features
- Holographic blue/cyan theme with neon glow
- Animated ship icons with floating effect
- Shield effects with pulsing opacity
- Damage flash animations (💥)
- Color-coded stat bars (hull=gray, shields=cyan, energy=yellow)
- Combat log with last 5 actions
- Victory/Defeat banners with animations

---

## Integration with Events

### Example: Pirate Ambush Event

**In `events_dynamic.json`:**
```json
{
  "id": "evt_pirate_ambush",
  "trigger": {
    "type": "poi_action",
    "conditions": {
      "poiType": "POI_ORBITAL_001"
    }
  },
  "branches": [
    {
      "id": "fight_pirates",
      "label": "Engage in combat!",
      "challenge": {
        "mode": "combat",
        "enemyTemplate": "pirate_fighter"
      },
      "outcomes": [
        {
          "type": "combat_victory",
          "rewards": {
            "credits": 500,
            "items": ["pirate_loot"]
          }
        },
        {
          "type": "combat_defeat",
          "rewards": {
            "credits": -200,
            "damage": "major"
          }
        }
      ]
    }
  ]
}
```

**In `ShipCommandConsole.jsx`:**
```javascript
import CombatWindow from './CombatWindow';

function ShipCommandConsole() {
  const [combatActive, setCombatActive] = useState(false);
  const [combatEnemy, setCombatEnemy] = useState(null);
  
  // When event branch has combat challenge
  const handleEventBranch = (branch) => {
    if (branch.challenge?.mode === 'combat') {
      // Trigger combat
      setCombatEnemy(branch.challenge.enemyTemplate);
      setCombatActive(true);
    }
  };
  
  const handleCombatEnd = (result) => {
    setCombatActive(false);
    
    if (result.winner === 'player') {
      // Apply victory rewards
      applyEventRewards(currentEvent.branches.outcomes.find(o => o.type === 'combat_victory'));
    } else {
      // Apply defeat consequences
      applyEventRewards(currentEvent.branches.outcomes.find(o => o.type === 'combat_defeat'));
    }
  };
  
  return (
    <>
      {/* Main game UI */}
      
      {combatActive && (
        <CombatWindow
          playerData={{
            name: 'SS-ARKOSE',
            type: 'Survey Frigate',
            maxHull: 100,
            currentHull: shipState.currentHull,
            maxShields: 100,
            currentShields: shipState.currentShields,
            weapons: [
              {
                id: 'laser_cannon',
                name: 'Laser Cannon',
                type: 'energy',
                damage: { min: 15, max: 25 },
                shieldPenetration: 0.3,
                accuracy: 85,
                cooldown: 0,
                maxCooldown: 1,
                energyCost: 10
              }
            ]
          }}
          enemyTemplate={combatEnemy || 'pirate_fighter'}
          onCombatEnd={handleCombatEnd}
          onClose={() => setCombatActive(false)}
        />
      )}
    </>
  );
}
```

---

## Combat Flow

1. **Initialization**
   - Create `CombatEngine` with player and enemy data
   - Roll initiative to determine first turn
   - Display combat window

2. **Turn Loop**
   - Display available actions for active combatant
   - Player selects action and executes
   - Calculate damage/effects with animations
   - Regenerate shields/energy
   - Update weapon cooldowns
   - Switch turns
   - AI automatically selects and executes action

3. **Combat End**
   - Check for hull <= 0 after each action
   - Display victory/defeat banner
   - Return combat results to caller
   - Apply rewards/consequences
   - Close combat window

---

## Damage Calculation

### Shield Absorption
```javascript
shieldAbsorbedDamage = totalDamage × (1 - shieldPenetration)
penetratingDamage = totalDamage × shieldPenetration

if (shields > 0) {
  shields -= shieldAbsorbedDamage
  if (shields < 0) {
    overflow = abs(shields)
    hull -= (overflow + penetratingDamage - armor)
  } else {
    hull -= (penetratingDamage - armor)
  }
} else {
  hull -= (totalDamage - armor)
}
```

### Hit Calculation
```javascript
hitChance = weaponAccuracy - targetEvasion
roll = random(0-100)
hit = roll <= hitChance
```

---

## Next Steps

### Phase 1: Event Integration ✅ In Progress
- [x] Add combat challenge type to event schema
- [x] Trigger combat from event branches
- [ ] Pass combat results back to event system
- [ ] Apply victory/defeat rewards

### Phase 2: Enhanced Combat ⏳ Planned
- [ ] Multiple weapon slots
- [ ] Critical hits system
- [ ] Status effects (EMP, ion damage, fire)
- [ ] Targeting subsystems (engines, weapons, shields)
- [ ] Retreat/flee option
- [ ] Boarding actions

### Phase 3: Visual Polish ⏳ Planned
- [ ] 3D ship models or sprites
- [ ] Particle effects for weapons
- [ ] Screen shake on damage
- [ ] Sound effects
- [ ] Background space environment

---

## Testing Combat

### Quick Test in Browser Console
```javascript
import { CombatEngine, createEnemy } from './lib/combatEngine';

const player = {
  name: 'Test Ship',
  maxHull: 100,
  maxShields: 100,
  weapons: [
    {
      id: 'laser',
      name: 'Laser',
      damage: { min: 20, max: 30 },
      shieldPenetration: 0.3,
      accuracy: 85,
      cooldown: 0,
      maxCooldown: 1,
      energyCost: 10
    }
  ]
};

const enemy = createEnemy('pirate_fighter');
const combat = new CombatEngine(player, enemy);

console.log(combat.getState());
```

### Manual Combat Test
```javascript
// Player attacks
const action = combat.player.getAvailableActions()[0];
combat.executePlayerAction(action);

// AI turn
combat.executeAITurn();

// Check state
console.log(combat.getState());
```

---

## Configuration

### Balancing Tips
- **Hull**: 60-100 for light ships, 100-200 for capitals
- **Shields**: 40-80% of hull value
- **Energy**: 80-120, regenerate 15-20 per turn
- **Weapon Damage**: 10-30 for balanced, 40+ for heavy
- **Cooldowns**: 1 turn = rapid fire, 2-3 = heavy weapons
- **Shield Penetration**: 0.1-0.3 = energy, 0.5-0.7 = kinetic

### AI Tuning
Adjust `aiProfile` field:
- `aggressive` - Good for swarm enemies
- `defensive` - Tank enemies with high shields
- `tactical` - Boss encounters
- `balanced` - Standard encounters

---

## Future Enhancements

### Ship Loadouts
Pull player weapons from `shipState.installedComponents`:
```javascript
const playerWeapons = shipState.installedComponents
  .filter(c => c.category === 'weapon')
  .map(c => ({
    id: c.id,
    name: c.name,
    damage: c.stats.damage,
    // ...
  }));
```

### Loot Drops
```javascript
onCombatEnd={(result) => {
  if (result.winner === 'player') {
    const loot = generateCombatLoot(enemy.faction, enemy.type);
    shipState.addItems(loot);
  }
}}
```

### Multi-Enemy Combat
Extend `CombatEngine` to support array of enemies:
```javascript
this.enemies = enemyData.map(e => new Combatant(e));
```

### Crew System
Add crew members with special abilities:
```javascript
{
  crew: [
    { name: 'Engineer', ability: 'emergency_repairs' },
    { name: 'Gunner', ability: 'precise_shot' }
  ]
}
```
