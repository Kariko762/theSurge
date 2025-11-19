# Dark Desolate Space Game

> *"The void is patient. G'ejar-Vale waits. Will you find it before the radiation claims you?"*

A **text-based roguelike space exploration game** where you navigate a dead galaxy, collecting radiation from dying stars to fuel your Reference Frame Engine, rebuild your fractured AI crew, and search for the last refuge of humanity: **G'ejar-Vale**.

**Built with:** React + Vite | Canvas 2D Rendering | JSON-based Procedural Generation  
**Genre:** Text-Based Roguelike Space Exploration  
**Status:** Active Development - Core Systems Implemented

---

## 🌌 The Story

Humanity once flourished among the stars. But **The Surge**—a catastrophic wave of corrupting solar radiation—burned the galaxy to ash. You survived by accident, hiding in a hollow asteroid while fleeing the authorities.

Now, everything is gone.

Your only companions are fractured AI personalities rebuilt from salvaged cores. Your only hope is a myth whispered through corrupted data: **G'ejar-Vale**, a hidden sanctuary untouched by the Surge.

Each expedition into dead solar systems brings you closer to the truth—and closer to your own demise.

**Survive. Rebuild. Discover. Escape.**

📖 **[Read Full Story & Game Design →](GAME_DESIGN.md)**

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ (recommended: 18 or 20 LTS)
- **npm** 8+ (comes with Node.js)
- **Modern browser** (Chrome 120+, Edge 120+, Firefox latest)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kariko762/theSurge.git
   cd theSurge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173` (Vite's default port)
   - Development server includes hot module replacement (HMR)

### Build for Production

```bash
# Create optimized production build
npm run build

# Output will be in dist/ folder
# Preview production build locally
npm run preview
```

### Deployment

The game is a static site and can be deployed to any static hosting service:

**GitHub Pages:**
```bash
npm run build
# Deploy dist/ folder to gh-pages branch
```

**Netlify/Vercel:**
- Connect GitHub repository
- Build command: `npm run build`
- Publish directory: `dist`

**Manual deployment:**
- Build the project (`npm run build`)
- Upload contents of `dist/` folder to your web server

---

## 📁 Project Structure

```
space-game/
├── index.html                       # Entry HTML file
├── package.json                     # Dependencies and scripts
├── vite.config.js                   # Vite configuration
│
├── src/
│   ├── main.jsx                     # Vite entry point
│   ├── App.jsx                      # Main app with frame navigation
│   │
│   ├── components/
│   │   ├── LoginFrame.jsx           # Frame 1: Login + Profile Management
│   │   ├── HomebaseTerminal.jsx     # Frame 2: Homebase Terminal
│   │   ├── ShipCommandConsole.jsx   # Frame 3: Ship Command Console
│   │   ├── UniverseViewer.jsx       # Universe map (multiple galaxies)
│   │   ├── GalaxyViewer.jsx         # Galaxy map (solar systems)
│   │   ├── SolarSystemViewer.jsx    # Individual system view with POIs
│   │   ├── GalaxyCreator.jsx        # Galaxy JSON creation tool
│   │   ├── ActionsPanel.jsx         # Action list panel
│   │   ├── SettingsDropdown.jsx     # Settings menu
│   │   ├── TerminalModal.jsx        # Terminal text modal
│   │   │
│   │   ├── inventory/
│   │   │   ├── InventoryModal.jsx       # Main inventory UI
│   │   │   ├── ItemDetailModal.jsx      # Item details popup
│   │   │   ├── ItemFrame.jsx            # Draggable item cards
│   │   │   ├── ScrapProgressModal.jsx   # Scrapping animation
│   │   │   ├── HoloIcons.jsx            # Item icons
│   │   │   └── HoloStars.jsx            # Background effect
│   │   │
│   │   ├── hangar/
│   │   │   ├── HangarView.jsx           # Component installation UI
│   │   │   └── ShipStatsPanel.jsx       # Ship stats display
│   │   │
│   │   ├── admin/
│   │   │   └── AdminSecurityModal.jsx   # Galaxy creation security
│   │   │
│   │   └── hb_map*.jsx              # Homebase map tabs
│   │
│   ├── lib/
│   │   ├── shipState.js             # Ship state singleton manager
│   │   ├── shipComponents.js        # Component definitions
│   │   ├── galaxyGenerator.js       # Universe generation
│   │   ├── galaxyLoader.js          # JSON galaxy file loader
│   │   ├── galaxyValidator.js       # Galaxy JSON validation
│   │   ├── systemGenerator.js       # System POI generation (procedural)
│   │   ├── galaxyDiscovery.js       # Discovery mechanics
│   │   ├── graph.js                 # BFS pathfinding
│   │   ├── rng.js                   # Seeded RNG utilities
│   │   ├── gameTime.js              # Game time/tick management
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventoryManager.js          # Node.js version (testing)
│   │   │   ├── inventoryManagerBrowser.js   # React version (UI)
│   │   │   ├── itemDatabaseLoader.js        # Item database loader
│   │   │   ├── scrap.js                     # Scrapping system
│   │   │   ├── README.md                    # Inventory docs
│   │   │   └── test.js                      # Test suite (13 tests)
│   │   │
│   │   └── dre/
│   │       ├── engine.js            # Dice Resolution Engine core
│   │       ├── dice.js              # Dice rolling system
│   │       ├── tables.js            # Lookup tables
│   │       ├── narrative.js         # Narrative generation
│   │       ├── output.js            # Output formatting
│   │       ├── modifiers/           # Modifier sources
│   │       └── README.md            # DRE documentation
│   │
│   ├── data/
│   │   ├── galaxy_andromeda.json    # Andromeda galaxy data
│   │   ├── helix_systems/
│   │   │   └── Temp_Branch.json     # Helix Nebula galaxy (21 systems)
│   │   └── items/
│   │       └── itemDatabase.json    # 27 items (components, AI, materials)
│   │
│   ├── styles/
│   │   ├── DesignSystem.css         # Typography, colors, spacing tokens
│   │   └── TerminalFrame.css        # Terminal styling, scanlines, effects
│   │
│   └── assets/
│       ├── fonts/                   # Roobert font family (.otf files)
│       ├── media/galaxies/          # Galaxy images
│       └── lore/                    # Narrative files
│
├── GAME_DESIGN.md                   # Complete game design document
├── GAME_SYSTEMS.md                  # Core mechanics documentation
├── HANDOVER.md                      # Technical handover guide
├── INVENTORY_BUILD_SUMMARY.md       # Inventory system docs
├── SEED_SYSTEM.md                   # Procedural generation docs
└── README.md                        # This file
```

---

## ✨ What's Currently Implemented

### ✅ Core UI Frames (Complete)

**LoginFrame** - User authentication interface
- Login/create profile system
- Holographic terminal aesthetic
- Fade-in animations

**HomebaseTerminal** - Main base operations
- Left panel tabs: AI, Power, Research, Build, Hangar
- Right panel tabs: Logs, Alerts, Map, Inventory
- Enhanced slide-out animations with glow effects
- Progress bars for Power Grid, Life Support, Defenses
- Game time display (DAY X // HH:MM format)

**ShipCommandConsole** - Ship control interface
- Solar system map with pan/zoom controls
- Real-time stat cubes: Shields, Hull, Energy, Radiation, Static
- POI markers for planets, stations, asteroids, anomalies
- System navigation and exploration
- Ship position tracking with environmental calculations

### ✅ Galaxy Navigation System (Complete)

**UniverseViewer** - Multiple galaxy overview
- Visual galaxy selection
- Procedurally rendered galaxy shapes

**GalaxyViewer** - Solar system map
- 21-system Helix Nebula galaxy (JSON-based)
- Interactive canvas with pan/zoom (0.1x - 3.0x)
- System scanning with progress animation (~5 seconds)
- Scanned vs unscanned visual states
- Nebula rendering with zone colors (Quiet/Dark/Static)
- BFS pathfinding for route planning
- Speech bubble info modals
- Filter by zone and tier
- Connection line rendering
- Highlighted path visualization
- Auto-navigation during scans

**SolarSystemViewer** - Individual system detail
- Procedurally generated POIs (planets, moons, stations, etc.)
- POI discovery and scanning mechanics
- Environmental hazard visualization

### ✅ Inventory & Hangar System (Complete)

**27-Item Database**
- 16 ship components (weapons, engines, sensors, tools, defense, storage)
- 4 AI cores (Engineer, Tactical, Researcher, Navigator)
- 7 materials/consumables (scrap, ores, fuel, repair kits, data)

**Inventory Management**
- Separate homebase and ship storage
- Volume (m³) and weight (kg) capacity tracking
- Visual capacity bars with real-time validation
- Category filters (9 categories)
- Drag-drop transfer system
- Stack management for materials

**Hangar System**
- Component installation with drag-drop
- 6 slot types (weapon, thruster, sensor, internal, hull, mainframe)
- 3 view modes (External, Internal, Mainframe)
- Real-time ship stats calculation
- Power balance monitoring
- Prevents transfer of installed components

**Ship Stats Panel**
- Auto-aggregation from installed components
- Power balance warnings (reactor vs. draw)
- Weapon damage listing
- Thrust, scan range, armor, shields
- Cargo capacity calculation
- DRE modifier collection

**Item Scrapping System**
- Scrap items for materials
- Animated progress modal
- Yield calculation based on tier

### ✅ Dice Resolution Engine (DRE) (Complete)

**Core System**
- d20-based action resolution
- Difficulty checks (DC) with modifiers
- Critical success/failure (Natural 20/1)
- Multiple dice types (d4, d6, d8, d10, d12, d20)

**Modifier System**
- Ship component modifiers
- AI crew bonuses
- Environmental modifiers
- Attribute-based modifiers
- Skill system integration
- Consequence tracking

**Narrative Generation**
- Dynamic outcome descriptions
- Context-aware flavor text
- Success/failure variations

### ✅ Game Time System (Complete)

**Tick-Based Progression**
- 1 tick = 1 second real-time = 10 in-game minutes
- Day/hour/minute tracking
- Subscribe/unsubscribe pattern for UI updates
- Format: "DAY 0 // 00:00"
- Auto-starts on first access (singleton)

### ✅ Procedural Generation (Complete)

**Galaxy System**
- JSON-based galaxy definitions
- Seed-based solar system generation
- Deterministic procedural POIs
- Zone-based difficulty (Quiet/Dark/Static)
- Tier system (T1-T4)
- Connection graph for navigation

**System Generator**
- Parent POI detection on arrival
- Child POI reveal on investigation
- Environmental stat calculations (radiation, static exposure)
- Wake signature tracking

### ✅ Ship State Management (Complete)

**Singleton Pattern**
- Centralized ship state
- Position tracking (system, AU, coordinates)
- Component installation tracking
- Inventory management
- Scan history
- Route planning storage
- Game time integration

**Key Features**
- System scan tracking (scanned vs unscanned)
- Active scan progress monitoring
- Planned route storage with stats
- Visited system history
- POI discovery logging

### ⚠️ Partially Implemented

**Route Plotting**
- Visual path highlighting ✅
- BFS pathfinding ✅
- Route calculation ✅
- "Plot Route" button (logs to console, not functional) ⚠️

**Launch Preparation**
- Modal design pending
- Fuel calculation logic exists
- Component selection pending
- AI assignment pending

**Combat System**
- DRE combat resolution complete ✅
- Visual combat UI pending ⚠️
- Enemy AI pending ⚠️

**Resource Gathering**
- Scrapping system complete ✅
- POI harvesting pending ⚠️
- Fuel collection pending ⚠️

### ❌ Not Yet Implemented

- Save/load game state
- Ship-to-ship travel mechanics
- Real-time fuel consumption during jumps
- Random encounters during travel
- AI core damage/repair system
- Technology research tree
- Multi-galaxy travel
- Story progression triggers
- Economy/trading system

---

---

## 🎮 Core Game Philosophy

### D&D in Space: Dice-Driven Roguelike

Every action is determined by **d20 rolls + modifiers** vs. difficulty checks (DC):
- **Critical Success (Natural 20)** - Exceptional outcome, bonus rewards
- **Success (Meet/Beat DC)** - Action succeeds
- **Failure (Below DC)** - Consequences apply
- **Critical Failure (Natural 1)** - Catastrophic failure

**Modifiers come from:**
- Ship systems (Navigation, Sensors, Weapons, Engines, Shields)
- AI crew bonuses (ARIA +2 piloting, FORGE +2 repairs, etc.)
- Environmental factors (radiation zones, nebulae, asteroid fields)
- Research upgrades and ship components

### The Reference Frame Engine (RFE)

Your ship's **RFE** collapses space-time for instant travel but requires **stellar radiation** as fuel:

- **O-Type (Blue Supergiants)** - Extreme radiation, very high fuel, extreme danger
- **B-Type (Blue-White)** - High radiation, high fuel, high risk
- **G-Type (Yellow, Sun-like)** - Balanced radiation, medium fuel, manageable risk
- **M-Type (Red Dwarfs)** - Low radiation, minimal fuel, safer systems

**Strategic Choice:** High-radiation stars = more jumps but deadly systems. Low-radiation = safer but frequent refueling.

### The Roguelike Loop

1. **Homebase (Asteroid Shelter)** - Repair ship, upgrade AI crew, plan route
2. **System Selection** - Choose star type based on fuel needs and risk tolerance
3. **Expedition** - Explore derelict stations, dead worlds, collect fragments
4. **Encounters** - Face rogue AIs, corrupted creatures, solar storms, scavengers
5. **Return** - Bring resources and data fragments back to homebase
6. **Rebuild** - Process discoveries, upgrade systems, piece together G'ejar-Vale coordinates

### Radiation Zones & Strategy

**Dark Zones (Sun-Proximate)**
- ☢️ Surge Radiation: ZERO (sun suppresses it)
- 🔥 Environmental: EXTREME (solar heat, flares)
- 👥 Population: HIGH (survivors/scavengers)
- 💎 Loot: HIGH quality
- ⚔️ Combat: HARD (competition)

**Static Zones (Far from Sun)**
- ☢️ Surge Radiation: EXTREME (no protection)
- 🔥 Environmental: HIGH (radiation damage)
- 👥 Population: VERY LOW (too dangerous)
- 💎 Loot: MEDIUM (abandoned, not looted)
- ⚔️ Combat: EASY (few hostiles)

**Surge Zones (Anomalous)**
- ☢️ Surge Radiation: VERY HIGH (concentrated corruption)
- 🔥 Environmental: VERY HIGH (mutations)
- 👥 Population: LOW (desperate/corrupted)
- 💎 Loot: HIGH (untouched)
- ⚔️ Combat: MODERATE (corrupted creatures)

### Plasma Wake System

Every RFE jump creates a detectable plasma wake:
- **Each jump**: +10 Wake
- **Each scan**: +5 Wake
- **Each engagement**: +15 Wake
- **Natural decay**: -5 Wake per turn (if stationary)

**Wake Thresholds:**
- 0-20: Silent (low detection)
- 21-50: Low (minor patrols)
- 51-80: Medium (scavengers tracking)
- 81-100: High (encounter imminent)
- 100+: CRITICAL (major threat)

High wake = more hostile encounters. Strategic balance between speed and stealth.

### Fractured AI Crew

Your companions are damaged AI personalities salvaged from the ruins:

- **ARIA** (Navigation) - Paranoid perfectionist: *"We're off by 0.003%. That's how crews die."*
  - +2 to piloting, +1 to route planning
- **FORGE** (Engineering) - Gruff mechanic: *"She's held together by spite and prayers."*
  - +2 to repairs, +1 to jury-rigging
- **CIPHER** (Research) - Unstable genius: *"Data... corrupted... but beautiful."*
  - +2 to scanning, +1 to decryption
- **GHOST** (Sensors) - Whispers warnings: *"...something watching... not alone..."*
  - +2 to detection, +1 to stealth

**AI Risk:** They can be damaged or destroyed during expeditions. Lost AI = lost bonuses. Backups available at homebase (costs resources + time).

---

## 🎨 Design Aesthetic

**Color Palette:**
- Deep blacks (#000000)
- Cyan holographics (#34e0ff at 30-90% opacity)
- Muted whites (#cfd8df)
- Success green (#52ffa8, #00ff88)
- Warning red (#ff5050)

**Visual Style:**
- Abandoned outpost terminal
- Analog noise and scanlines
- Glassmorphism effects
- Faint distortion and flicker
- Degraded sci-fi aesthetic
- No external animation libraries (pure CSS)

**Typography:**
- Font: Roobert (Light, Regular, Medium, SemiBold, Bold, Heavy)
- Monospace for data displays
- Letter-spacing for emphasis

---

## 📚 Documentation

- **[GAME_DESIGN.md](GAME_DESIGN.md)** - Complete narrative and design philosophy
- **[GAME_SYSTEMS.md](GAME_SYSTEMS.md)** - Detailed mechanics (dice, POIs, encounters)
- **[HANDOVER.md](HANDOVER.md)** - Technical architecture and code guide
- **[INVENTORY_BUILD_SUMMARY.md](INVENTORY_BUILD_SUMMARY.md)** - Inventory system documentation
- **[SEED_SYSTEM.md](SEED_SYSTEM.md)** - Procedural generation details
- **[src/lib/dre/README.md](src/lib/dre/README.md)** - Dice Resolution Engine API
- **[src/lib/inventory/README.md](src/lib/inventory/README.md)** - Inventory Manager API

---

## 🧪 Testing

### Inventory System Tests
```bash
node src/lib/inventory/test.js
```
13 automated tests covering:
- Inventory creation
- Item add/remove/transfer
- Component installation
- Capacity validation
- Ship stats calculation
- Slot type validation

All tests passing ✅

### Manual Testing
- Galaxy navigation: Browse Helix Nebula, scan systems
- Inventory management: Open inventory modal, transfer items
- Hangar system: Install components, view ship stats
- Game time: Observe time progression in top-right corner

---

## 🛠️ Development Guide

### Project Commands

```bash
# Development
npm run dev          # Start dev server with HMR (port 5173)

# Production
npm run build        # Create optimized build in dist/
npm run preview      # Preview production build locally

# Testing
node src/lib/inventory/test.js           # Run inventory tests
node src/lib/galaxyValidator.test.js     # Run galaxy validator tests
```

### Code Style

**React Components:**
- Functional components with hooks
- `useMemo` for expensive calculations
- `useEffect` for side effects
- `useState` for local state
- No external state management (Redux, Zustand, etc.)

**Naming Conventions:**
- Components: PascalCase (`GalaxyViewer.jsx`)
- Files: camelCase (`shipState.js`)
- Constants: UPPER_SNAKE_CASE
- Functions: camelCase

### Key Singletons

**Ship State:**
```javascript
import { getShipState } from './lib/shipState.js';
const shipState = getShipState();
```

**Game Time:**
```javascript
import { getGameTime } from './lib/gameTime.js';
const gameTime = getGameTime();
```

### Browser Compatibility

**Tested:**
- ✅ Chrome 120+ (recommended)
- ✅ Edge 120+
- ⚠️ Firefox (canvas performance may vary)

**Not Supported:**
- ❌ Internet Explorer

---

## 🚧 Roadmap

### Immediate Next Steps

1. **Complete Route Plotting**
   - Make "Plot Route" button functional
   - Store route in ship state
   - Calculate travel time and fuel cost

2. **Launch Preparation Modal**
   - Fullscreen modal with route visualization
   - Component selection interface
   - AI core assignment
   - Fuel calculation display
   - Confirm/Cancel buttons

3. **Ship Travel Mechanics**
   - System-to-system navigation
   - Fuel consumption during jumps
   - Travel time progression
   - Random encounter rolls

4. **Save/Load System**
   - LocalStorage integration
   - Profile management
   - Game state serialization

### Medium-Term Features

- POI interaction system (investigation, harvesting)
- Combat UI with dice roll visualization
- AI crew damage/repair mechanics
- Technology research tree
- Story progression triggers
- Environmental hazard effects
- Scavenger/pirate encounters

### Long-Term Vision

- Multiple galaxies with inter-galaxy travel
- Procedurally generated narrative events
- Economy/trading system
- Fleet management
- Multiplayer (distant future)
- G'ejar-Vale discovery endgame

---

## 🐛 Known Issues

### Current Limitations

1. **Console Spam** - Ship render position logs every frame (performance impact minimal)
2. **Favicon 404** - Missing favicon.ico (cosmetic)
3. **Route Plotting** - "PLOT ROUTE" button logs to console, not functional
4. **No Persistence** - No save/load system yet

### Performance Considerations

**Canvas Rendering:**
- Redraws every frame for animations
- 21-system galaxy performs well
- May need optimization for 100+ systems (dirty rectangle rendering, WebGL)

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🤝 Contributing

This is currently a solo development project. Feature requests and bug reports can be submitted via GitHub Issues.

---

## 📞 Contact

**Repository:** [github.com/Kariko762/theSurge](https://github.com/Kariko762/theSurge)  
**Branch:** main

---

**Last Updated:** November 19, 2025  
**Version:** 0.1.0 (Alpha)  
**Status:** Active Development

*The galaxy is dead. The void calls. G'ejar-Vale awaits.*
