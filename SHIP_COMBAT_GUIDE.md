# Ship Combat Simulator

## Overview
Turn-based tactical combat simulator with hexagonal grid, card-based actions, and roll-based combat resolution.

## Features

### 🎮 Game Modes
- **Setup Phase**: Place ships on the hexagonal grid
- **Combat Phase**: Execute turn-based tactical combat
- **Victory Conditions**: Destroy all enemy ships

### 🗺️ Hexagonal Grid System
- **Grid Size**: 20x15 hexagonal tiles
- **Terrain Types**:
  - ⬡ **Open Space**: No modifiers
  - ☄️ **Asteroid**: Cover (+defense), movement penalty
  - ☢️ **Radiation**: Damage over time, shield drain
  - 🌫️ **Nebula**: Reduced accuracy, sensor range
  - 🔧 **Repair Zone**: Hull/shield regeneration

### 🃏 Card-Based Actions
Actions are presented as cards with different types:

#### Movement Cards (Blue)
- **Move** (1 AP): Move to adjacent hex
- **Boost** (2 AP): Move up to 3 hexes

#### Action Cards (Red)
- **Primary Fire** (2 AP): 2d6 damage, range 5
- **Missile** (3 AP): 3d6 damage, range 8

#### Instant Cards (Yellow)
- **Shield Boost** (1 AP): Restore 2d6 shields
- **Evasive** (1 AP): +2 defense until next turn

#### Utility Cards (Green/Purple)
- **Repair** (2 AP): Restore 1d6 hull
- **Scan** (1 AP): Reveal enemy stats

### ⚔️ Combat System

#### Action Points (AP)
- Each ship has 5 AP per turn (default)
- Cards cost 1-3 AP
- AP refreshes at start of turn

#### Attack Resolution
1. Roll d20 + attack bonus
2. Compare to defender's defense value
3. If hit, roll damage dice (e.g., 2d6)
4. Damage applied to shields first, then hull
5. Ship destroyed at 0 hull

#### Ship Stats
- **Hull**: Ship health (100 default)
- **Shield**: Ablative defense (50 default)
- **Attack Bonus**: Added to attack rolls (+2 default)
- **Defense**: Target number to hit (12 default)
- **Max AP**: Action points per turn (5 default)

### 🎨 Visual Effects

#### Hex Highlighting
- **Cyan glow**: Beneficial zones (repair, objectives)
- **Blue glow**: Cover zones (asteroids)
- **Red glow**: Hazard zones (radiation)
- **Purple glow**: Special zones (anomalies)
- **Animated pulse**: Terrain effects pulse with varying intensity

#### Ship Indicators
- Player ships: 🚀 (cyan)
- Enemy ships: 👾 (red)
- Health bars: Green (hull) + Blue (shield)
- Selection glow: Bright outline on selected ship

#### Card States
- **Available**: Full color, hover lift effect
- **Selected**: Raised, glowing border
- **Disabled**: Grayed out, no interaction

### 📊 UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ COMBAT SIMULATOR                    [START] [RESET]     │
├──────────┬─────────────────────────────────┬────────────┤
│  FLEET   │       HEX BATTLEFIELD           │   SHIP     │
│  ROSTER  │   (Hexagonal Grid with          │  DETAILS   │
│          │    terrain & ships)             │            │
│ Player   │                                 │  [Icon]    │
│ Ships    │                                 │  Name      │
│          │                                 │  Hull ███  │
│ Enemy    │                                 │  Shield ██ │
│ Ships    │                                 │            │
│          │                                 │  [Tabs]    │
│ [+Add]   │                                 │  Systems   │
└──────────┴─────────────────────────────────┴────────────┘
│              ACTION CARD DECK                            │
│  [Move] [Attack] [Shield] [Repair] [Scan] ...           │
│  TURN: Player │ AP: 3/5 │ [END TURN]    [COMBAT LOG] >  │
└──────────────────────────────────────────────────────────┘
```

### 🎯 How to Play

#### Setup Phase
1. Click "Simulation" tab in admin panel
2. Click "Ship Combat" sub-tab
3. Click "+ ADD SHIP" for player and enemy sides
4. Select a ship from roster
5. Click on hex grid to place ship
6. Repeat for all ships
7. Click "START COMBAT"

#### Combat Phase
1. Select your ship from fleet roster
2. Available action cards appear at bottom
3. Click a card to select it
4. Highlighted hexes show valid targets/range
5. Click hex or enemy ship to execute action
6. Repeat until out of AP
7. Click "END TURN"
8. Enemy AI takes turn automatically
9. Repeat until victory/defeat

### 🤖 AI Behavior
Current AI is simple:
- Each enemy ship attacks nearest player ship
- Uses primary fire action
- No movement or tactics (basic implementation)

### 🔮 Future Enhancements
- [ ] Advanced AI with tactics (flanking, focus fire)
- [ ] More card types (EMP, Hack, Cloak)
- [ ] Ship loadout customization
- [ ] Crew morale system
- [ ] Multi-objective scenarios
- [ ] Environmental hazards (asteroid drift, solar wind)
- [ ] Special abilities per ship class
- [ ] Campaign mode with persistent damage
- [ ] Multiplayer support

### 🎨 Visual Style
Matches game aesthetic:
- Dark space background with stars
- Neon cyan/teal UI elements
- Holographic card effects
- Glowing hex borders
- Smooth animations and transitions

## Technical Details

### Components
- `ShipCombat.jsx`: Main combat controller
- `HexGrid.jsx`: Hexagonal battlefield renderer
- `ActionCard.jsx`: Individual card component
- `ShipDetails.jsx`: Right panel ship stats

### CSS
- `ShipCombat.css`: Complete styling system

### Key Functions
- `rollDice(num, sides)`: Dice rolling
- `attackShip(attacker, defender, card)`: Combat resolution
- `hexDistance(a, b)`: Hex grid pathfinding
- `drawTerrainHex()`: Animated terrain rendering
- `executeEnemyTurn()`: AI logic

## Credits
Inspired by:
- XCOM's tactical combat
- Hearthstone's card system
- Civilization's hex grid
- Your amazing holographic hex grid concept image!
