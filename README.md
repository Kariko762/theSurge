# The Surge: Dark Desolate Space

> *"The void is patient. G'ejar-Vale waits. Will you find it before the radiation claims you?"*

A **narrative-driven roguelike space exploration game** where you navigate a dead galaxy, collecting radiation from dying stars to fuel your Reference Frame Engine, rebuild your fractured AI crew, and search for the last refuge of humanity: **G'ejar-Vale**.

**Built with:** React + Vite + Node.js/Express | Canvas 2D Rendering | Dynamic Event System | No-Code Admin Portal  
**Genre:** Narrative Roguelike Space Exploration with D20 Mechanics  
**Status:** Active Development - Core Systems + Full Admin Portal Implemented

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

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   npm run init  # Creates default data files and admin user (admin/admin123)
   ```

4. **Start development servers**
   
   **Terminal 1 - Backend API:**
   ```bash
   cd backend
   npm run dev  # Runs on http://localhost:3001
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   npm run dev  # Runs on http://localhost:5173
   ```

5. **Access the application**
   - **Game UI**: http://localhost:5173
   - **Admin Portal**: Login with username `admin`, password `admin123` (⚠️ change this!)
   - **Backend API**: http://localhost:3001/api/health

### Quick Setup Script (PowerShell)

Use the included setup script for automated installation:

```powershell
.\setup-dev-environment.ps1
```

This script:
- Installs all dependencies (frontend + backend)
- Initializes backend data files
- Creates default admin user
- Displays next steps

### Development Script (PowerShell)

Start both servers simultaneously:

```powershell
.\start-dev.ps1
```

This script starts the backend API and frontend dev server in separate terminals.

### Build for Production

```bash
# Build frontend
npm run build

# Build backend (optional - Node.js runs from source)
cd backend
npm install --production

# Output will be in dist/ folder for frontend
# Preview production build locally
npm run preview
```

### Deployment

**Frontend (Static Site):**

The game frontend is a static site and can be deployed to any static hosting service:

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

**Backend (Node.js API):**

The backend requires a Node.js hosting environment:

**Recommended Hosts:**
- Railway.app
- Render.com
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

**Environment Variables for Production:**
```env
PORT=3001
JWT_SECRET=<your-secure-random-string-at-least-32-chars>
JWT_EXPIRES_IN=24h
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

⚠️ **CRITICAL:** Change `JWT_SECRET` before deploying to production!

---

## 📁 Project Structure

```
space-game/
├── index.html                       # Entry HTML file
├── package.json                     # Frontend dependencies and scripts
├── vite.config.js                   # Vite configuration
├── setup-dev-environment.ps1        # PowerShell setup script
├── start-dev.ps1                    # PowerShell dev server launcher
│
├── backend/                         # Node.js/Express API Server
│   ├── server.js                    # Main Express app
│   ├── package.json                 # Backend dependencies
│   ├── .env                         # Environment variables (JWT secret, etc.)
│   │
│   ├── data/                        # JSON data storage
│   │   ├── config.json              # Global game configuration + loot tables
│   │   ├── events_poi.json          # POI-specific events
│   │   ├── events_dynamic.json      # Random encounter events
│   │   ├── events_mission.json      # Story-driven quest events
│   │   ├── missions.json            # Mission definitions
│   │   ├── users.json               # Admin user accounts
│   │   └── telemetry.json           # Event analytics
│   │
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication middleware
│   │
│   ├── routes/
│   │   ├── auth.js                  # Login/logout/session endpoints
│   │   ├── users.js                 # User CRUD (admin only)
│   │   ├── events.js                # Event CRUD (editor/admin)
│   │   ├── config.js                # Config management (editor/admin)
│   │   ├── missions.js              # Mission CRUD (editor/admin)
│   │   ├── telemetry.js             # Analytics endpoints
│   │   └── encounters.js            # Encounter generation
│   │
│   ├── services/
│   │   ├── eventTriggerService.js   # Event scheduling & triggers
│   │   └── eventOutcomeProcessor.js # Outcome resolution + loot drops
│   │
│   ├── utils/
│   │   ├── fileHandler.js           # JSON file I/O with backups
│   │   └── validation.js            # Schema validation
│   │
│   ├── scripts/
│   │   └── initData.js              # Initialize default data files
│   │
│   └── README.md                    # Backend API documentation
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
│   │   ├── ActionsPanel.jsx         # POI action panel
│   │   ├── RightPanelTabs.jsx       # Homebase right panel tabs
│   │   ├── SettingsDropdown.jsx     # Settings menu
│   │   ├── TerminalModal.jsx        # Terminal text modal
│   │   ├── TerminalFeed.jsx         # Terminal message feed
│   │   ├── LiveClock.jsx            # Game time display
│   │   ├── TimeControlPanel.jsx     # Time debug controls
│   │   ├── DevPanel.jsx             # Developer debug panel
│   │   ├── EventSystemTest.jsx      # Event system testing UI
│   │   │
│   │   ├── inventory/
│   │   │   ├── InventoryModal.jsx       # Main inventory UI
│   │   │   ├── ItemDetailModal.jsx      # Item details popup
│   │   │   ├── ItemFrame.jsx            # Draggable item cards
│   │   │   ├── ScrapProgressModal.jsx   # Scrapping animation
│   │   │   ├── HoloIcons.jsx            # Item category icons
│   │   │   └── HoloStars.jsx            # Background starfield effect
│   │   │
│   │   ├── hangar/
│   │   │   ├── HangarView.jsx           # Component installation UI
│   │   │   └── ShipStatsPanel.jsx       # Ship stats display
│   │   │
│   │   ├── admin/                       # 🎯 ADMIN PORTAL COMPONENTS
│   │   │   ├── AdminSecurityModal.jsx   # Admin login screen
│   │   │   ├── ConfigEditor.jsx         # Global config UI + loot tables
│   │   │   ├── EventEditor.jsx          # Event creation/editing form
│   │   │   ├── SimulationPanel.jsx      # Event/loot testing panel
│   │   │   ├── LootSimulator.jsx        # 3-panel loot testing UI
│   │   │   ├── LootManager.jsx          # Loot pool & item database CRUD
│   │   │   │
│   │   │   └── forms/
│   │   │       ├── LootPoolEditor.jsx   # Loot pool form (dual-mode)
│   │   │       └── ItemEditor.jsx       # Item database form
│   │   │
│   │   └── hb_map*.jsx              # Homebase map tabs
│   │
│   ├── lib/
│   │   ├── shipState.js             # Ship state singleton manager
│   │   ├── shipComponents.js        # Component definitions + stats
│   │   ├── galaxyGenerator.js       # Universe procedural generation
│   │   ├── galaxyLoader.js          # JSON galaxy file loader
│   │   ├── galaxyValidator.js       # Galaxy JSON schema validation
│   │   ├── systemGenerator.js       # System POI generation (seeded)
│   │   ├── galaxyDiscovery.js       # Discovery mechanics
│   │   ├── graph.js                 # BFS pathfinding algorithm
│   │   ├── rng.js                   # Seeded RNG utilities
│   │   ├── gameTime.js              # Game time/tick management
│   │   ├── api.js                   # Backend API client wrapper
│   │   │
│   │   ├── inventory/
│   │   │   ├── inventoryManager.js          # Node.js version (testing)
│   │   │   ├── inventoryManagerBrowser.js   # React version (UI)
│   │   │   ├── itemDatabaseLoader.js        # Item database loader
│   │   │   ├── scrap.js                     # Scrapping system
│   │   │   ├── README.md                    # Inventory docs
│   │   │   └── test.js                      # Test suite (13 tests)
│   │   │
│   │   └── dre/                             # Dice Resolution Engine
│   │       ├── engine.js                    # DRE core logic
│   │       ├── dice.js                      # Dice rolling system
│   │       ├── tables.js                    # Lookup tables
│   │       ├── narrative.js                 # Narrative generation
│   │       ├── output.js                    # Output formatting
│   │       ├── modifiers/                   # Modifier sources
│   │       └── README.md                    # DRE documentation
│   │
│   ├── data/
│   │   ├── galaxy_andromeda.json    # Andromeda galaxy data
│   │   ├── poi_actions.json         # POI interaction definitions
│   │   ├── helix_systems/
│   │   │   └── Temp_Branch.json     # Helix Nebula galaxy (21 systems)
│   │   └── items/
│   │       └── itemDatabase.json    # 27+ items (frontend copy)
│   │
│   ├── styles/
│   │   ├── DesignSystem.css         # Typography, colors, spacing tokens
│   │   ├── TerminalFrame.css        # Terminal styling, scanlines, effects
│   │   └── AdminGlass.css           # Admin portal glassmorphism styles
│   │
│   └── assets/
│       ├── fonts/                   # Roobert font family (.otf files)
│       ├── media/galaxies/          # Galaxy images
│       └── lore/                    # Narrative markdown files
│
├── docs/
│   └── screenshots/                 # Admin UI screenshots for README
│
├── GAME_DESIGN.md                   # Complete game design document
├── GAME_SYSTEMS.md                  # Core mechanics documentation
├── HANDOVER.md                      # Technical handover guide
├── INVENTORY_BUILD_SUMMARY.md       # Inventory system docs
├── SEED_SYSTEM.md                   # Procedural generation docs
├── BACKEND_API_DESIGN.md            # Backend API specification
├── ADMIN_PANEL_GUIDE.md             # Admin Portal user guide
├── ADMIN_UI_REFACTOR_PLAN.md        # Admin UI architecture plan
├── EVENT_ENGINE_DESIGN.md           # Event system design doc
├── ENCOUNTERS_GUIDE.md              # Encounter system docs
├── TERMINAL_INTEGRATION_GUIDE.md    # Terminal feed integration
├── MINING_EVENT_MIGRATION_PLAN.md   # Mining system migration plan
└── README.md                        # This file
```

---

## ✨ What's Currently Implemented

### 🎯 **FLAGSHIP FEATURE: No-Code Admin Portal** (Complete ✅)

A comprehensive **visual content creation system** for building dynamic narrative events, managing loot tables, and configuring game balance—all without touching code. The Admin Portal is the crown jewel of The Surge's development tools.

![Admin UI - Event List](docs/screenshots/the-surge-admin-ui%20(1).png)
*Compact table view showing all events with status, triggers, tags, and quick actions*

---

#### **Event Management System**

**Dynamic Event Engine:**
- **Scheduler-based triggers** - Events fire automatically based on configurable time intervals (5-15s default)
- **Advanced condition filtering** - Events spawn based on location type, POI categories, player stats, time of day, visited systems, ship state
- **Weight-based probability** - Each event has a spawn weight affecting appearance likelihood
- **Smart cooldown system** - Prevents events from repeating immediately (per-event configurable)
- **Three event types**: 
  - **Dynamic** (procedural random encounters)
  - **Mission** (story-driven quest events)
  - **POI** (location-specific interactions)

**Branching Narrative System:**
- **Multiple choice paths** per event with unlimited branches
- **Optional skill checks** (Engineering, Perception, Combat, Piloting, Hacking, Diplomacy, Luck, etc.)
- **Difficulty tiers**: Easy/Medium/Hard/Very Hard with game-phase scaling (Early/Mid/Late)
- **d20-based resolution** with probability-weighted outcomes
- **Success/failure branches** with unique narrative consequences

**Rich Outcome Configuration:**
- Credits, XP, and inventory item rewards
- Ship damage and stat modifications
- Reputation changes and persistent status effects
- Event chaining for multi-part storylines
- Custom narrative feedback text
- Probability-weighted outcome trees

![Admin UI - Event Editor](docs/screenshots/the-surge-admin-ui%20(5).png)
*Event creation interface with metadata, triggers, and live JSON preview*

---

#### **Visual No-Code Event Editor**

**Form-Based Interface:**
- **No JSON editing required** - All configuration through intuitive forms
- **Real-time validation** with inline error highlighting
- **Live preview panel** showing event structure as you build
- **Tabbed organization**: Metadata → Trigger → Scenario → Branches → Preview
- **Drag-drop branch reordering** (planned)
- **Collapsible sections** for managing complex events

![Admin UI - Branch Editor](docs/screenshots/the-surge-admin-ui%20(6).png)
*Branch configuration with skill checks, difficulty settings, and outcome management*

**Branch & Outcome Builder:**
- **Visual skill check configuration** - Select skill, set difficulty, configure modifiers
- **Difficulty curve integration** - DC values auto-scale based on game phase (Early/Mid/Late)
- **Multiple outcomes per branch** with probability sliders
- **Inline reward/consequence editor** - Add credits, items, damage, reputation in one place
- **Nested outcome trees** - Create complex branching narratives
- **Probability validation** - Ensures outcome weights sum to 1.0

![Admin UI - Outcome Editor](docs/screenshots/the-surge-admin-ui%20(7).png)
*Outcome configuration with rewards, consequences, and narrative text*

**Import/Export System:**
- **Copy events between JSON files** - Move Dynamic → Mission, etc.
- **Share event templates** across projects
- **Bulk import/export** for batch operations
- **Template library** for common event patterns (planned)
- **Version control friendly** - All events stored as readable JSON

![Admin UI - Import/Export](docs/screenshots/the-surge-admin-ui%20(8).png)
*Import events from external JSON files with validation*

---

#### **Loot System & Container Configuration**

**Dual-Mode Loot Pools:**

The loot system supports **two distinct generation modes** with visual toggle:

1. **Manual Item Pool (MODE 1)**:
   - Designer picks specific items for the pool
   - Individual weight configuration per item
   - Quantity ranges (min/max) per drop
   - Drop probability calculated from weights
   - Perfect for curated, story-specific rewards

2. **Tag-Based Generation (MODE 2)**:
   - Pool filters items from database by tier + tags
   - Container grades define tier/tag filters
   - Items generated dynamically from matching database entries
   - Perfect for scalable, procedural loot

**Grade-Based Containers:**
- **4 container grades**: Common (50%), Uncommon (30%), Rare (15%), Legendary (5%)
- **Customizable weights** - Adjust grade probabilities
- **Tier filtering** (T1-T5) - Control item power level per grade
- **Tag filtering** - Match items by category (military, exploration, medical, etc.)
- **Guaranteed items** - Set min/max item counts
- **Bonus rolls** - Additional chances for extra loot

**Loot Pool Editor:**
- **Visual mode toggle** - Switch between Manual and Tag-based modes
- **Three-tab layout**: Basic Info → Manual Items → Container Grades
- **Manual Items tab** - Disabled when in tag mode (clear UX)
- **Live stats panel** - Shows item count, total weight, grade distribution
- **Item search & filter** - Find items by name, tier, category
- **Drag-to-add items** - One-click item addition
- **Weight visualization** - See drop probability percentages

**Item Database Editor:**
- **27+ items** (weapons, engines, sensors, AI cores, materials)
- **Tag management** - Add/remove tags per item
- **Tier assignment** (T1-T5)
- **Category organization** (9 categories)
- **Bulk editing** (planned)
- **Icon preview** (planned)

**Loot Simulator:**
- **3-panel testing view**: Terminal Output / DRE Resolution / Backend Response
- **Holographic grid display** - Visual loot container opening
- **Step-by-step reveal**: Roll → Continue → Next [1/N] → Complete
- **Scan animation** - Gritty sci-fi aesthetic
- **Real-time backend testing** - See actual API responses

![Admin UI - Loot Simulator](docs/screenshots/the-surge-admin-ui%20(15).png)
*Loot simulator with 3-panel testing interface and holographic item grid*

---

#### **Global Configuration Panel**

**Game Balance Controls:**
- **Difficulty curves** - Early/Mid/Late game DC scaling
  - Early: DC 10 (Easy) to 22 (Very Hard)
  - Mid: DC 12 to 24
  - Late: DC 14 to 26
- **Loot multipliers** - Critical/Success/Failure reward scaling
  - Critical: 2.0x rewards
  - Success: 1.0x rewards
  - Failure: 0.3x rewards
- **XP multipliers** - Adjust experience gain rates
- **Credit scaling** - Control economy balance
- **Event scheduler timing** - Adjust event fire rates

**Risk/Reward Weights:**
- **Zone risk profiles** - Dark/Static/Surge zone difficulty
- **POI danger levels** - Configure threat ratings per location type
- **Radiation exposure rates** - Control environmental hazard scaling

![Admin UI - Config Editor](docs/screenshots/the-surge-admin-ui%20(9).png)
*Global game configuration with difficulty curves and reward multipliers*

---

#### **Search, Filter & Batch Operations**

**Advanced Filtering:**
- **Search by ID, title, tags** - Instant text filtering
- **Filter by trigger type** - Dynamic/Mission/POI
- **Filter by conditions** - Location, POI type, time window
- **Quick enable/disable** - Toggle events on/off
- **Sort by metadata** - ID, title, weight, enabled status

**Batch Operations:**
- **Select multiple events** - Checkbox selection
- **Bulk delete** - Remove multiple events at once
- **Bulk export** - Export selected events to JSON
- **Bulk enable/disable** (planned)
- **Bulk tag editing** (planned)

![Admin UI - Event List Filters](docs/screenshots/the-surge-admin-ui%20(12).png)
*Advanced filtering and search capabilities*

---

#### **Backend API & Data Management**

**RESTful API (Node.js/Express):**
- **JWT authentication** - Secure admin access with role-based permissions
- **Three user roles**: Admin (full access), Editor (content only), Viewer (read-only)
- **CRUD endpoints** for events, missions, config, users
- **Query parameters** - Filter by type, tags, trigger type
- **File-based storage** - JSON data files with automatic backups
- **Hot-reload support** - Changes apply immediately without restart

**Data Validation:**
- **Schema validation** - Ensures event structure correctness
- **Circular dependency detection** - Prevents infinite event chains
- **Probability validation** - Outcome weights must sum to 1.0
- **DC range validation** - Difficulty checks within valid ranges
- **Trigger condition validation** - Ensures all required fields present

**Automatic Backups:**
- **Pre-save backups** - Creates `.backup` files before any modification
- **Rollback support** - Restore from backups if needed
- **Version control friendly** - Human-readable JSON diffs

**File Structure:**
```
backend/data/
├── config.json              # Global game configuration
├── events_poi.json          # Location-specific events
├── events_dynamic.json      # Random encounter events
├── events_mission.json      # Story-driven quest events
├── missions.json            # Mission definitions
├── users.json               # Admin user accounts
└── telemetry.json           # Event analytics (planned)
```

---

#### **Example Admin Workflow**

**Creating a Mining Encounter Event:**

1. **Click "Create New Event"** in Admin Portal
2. **Set Metadata**:
   - ID: `asteroid_mining_rich_deposit`
   - Title: "Rich Mineral Deposit"
   - Tags: `mining`, `asteroid`, `resources`
   - Enabled: ✅
3. **Configure Trigger**:
   - Type: POI Action
   - POI Type: BELT (asteroid belt)
   - Spawn Weight: 25
   - Conditions: Not previously mined
4. **Write Scenario**:
   - Title: "Mineral-Rich Asteroid"
   - Description: "Your sensors detect unusual concentrations of rare earth metals..."
   - System Message: "[SENSORS] Anomalous mineral signature detected"
5. **Add Branches**:
   - **Branch 1: "Precision Mining"**
     - Skill Check: Engineering DC 16 (Hard)
     - Success Outcome (60%): +500 credits, +3 rare ore, +100 XP
     - Failure Outcome (40%): +200 credits, +1 common ore, -10 hull damage
   - **Branch 2: "Quick Extraction"**
     - No skill check
     - Outcome: +300 credits, +2 common ore, +50 XP
6. **Test in Simulator**:
   - Select event from dropdown
   - Click "Roll Container"
   - Verify DRE resolution and loot drops
7. **Save to events_poi.json**
8. **Event immediately available in-game** (no restart needed)

![Admin UI - Complete Event](docs/screenshots/the-surge-admin-ui%20(13).png)
*Fully configured mining event with multiple branches and outcomes*

---

### ✅ Core Game Systems (Complete)

**LoginFrame** - User authentication & profile management
- Holographic terminal aesthetic with scanline effects
- Profile selection with save slots (planned: localStorage persistence)
- Fade-in animations and neon glow effects

**HomebaseTerminal** - Main base operations hub
- **Left Panel Tabs**: AI Crew, Power Grid, Research, Build Queue, Hangar Bay
- **Right Panel Tabs**: System Logs, Alerts, Galaxy Map, Inventory
- Enhanced slide-out animations with cyan glow effects
- Real-time progress bars (Power Grid, Life Support, Defenses)
- **Live Clock** - Game time display (DAY X // HH:MM format)
- Terminal feed with system messages

**ShipCommandConsole** - Ship control interface
- **Solar system map** with pan/zoom controls (0.1x - 3.0x)
- **Real-time stat cubes**: Shields, Hull, Energy, Radiation, Static exposure
- **POI markers** for planets, stations, asteroids, anomalies, derelicts
- System navigation and exploration controls
- Ship position tracking with environmental hazard calculations
- Action panel integration for POI interactions

---

### ✅ Galaxy Navigation System (Complete)

**UniverseViewer** - Multi-galaxy overview
- Visual galaxy selection grid
- Procedurally rendered galaxy shapes (spiral, elliptical, irregular)
- Warp between galaxies (Reference Frame Engine)

**GalaxyViewer** - Solar system map
- **21-system Helix Nebula** galaxy (JSON-based, hand-crafted)
- Interactive canvas with pan/zoom controls
- **System scanning** with 5-second progress animation
- **Scanned vs unscanned** visual states (opacity, border style)
- **Nebula zone rendering** with color coding:
  - Quiet Zone (Green) - Low surge radiation
  - Dark Zone (Red) - Sun-proximate, extreme heat
  - Static Zone (Purple) - Far from sun, extreme radiation
- **BFS pathfinding** for optimal route planning
- **Speech bubble info modals** - Click systems for details
- **Filter controls** - By zone type and tier
- **Connection line rendering** - Shows hyperspace lanes
- **Highlighted path visualization** - See planned route
- **Auto-navigation during scans** - UI locked during scan

**SolarSystemViewer** - Individual system detail
- **Procedurally generated POIs** (planets, moons, stations, belts, anomalies, derelicts)
- **POI discovery mechanics** - Parent POI visibility, child POI reveal on investigation
- **Environmental hazard visualization** - Radiation, static, heat zones
- **Wake signature tracking** - Plasma wake from RFE jumps
- **POI interaction buttons** - Scan, investigate, mine, dock, etc.

---

### ✅ Inventory & Hangar System (Complete)

**27-Item Database** (expandable via Admin Portal):
- **16 ship components**: Weapons (pulse lasers, railguns, missile launchers, plasma cannons), Engines (ion thrusters, warp drives), Sensors (long-range arrays, combat scanners), Tools (mining lasers, repair drones), Defense (shields, armor plating), Storage (cargo expanders)
- **4 AI cores**: Engineer (FORGE), Tactical (ARIA), Researcher (CIPHER), Navigator (GHOST)
- **7 materials/consumables**: Scrap metal, rare ores, fusion fuel, repair kits, encrypted data cores

**Inventory Management:**
- **Dual storage systems**: Homebase (unlimited) and Ship (capacity-limited)
- **Volume (m³) and weight (kg)** tracking with real-time validation
- **Visual capacity bars** with color-coded warnings (green → yellow → red)
- **Category filters**: 9 categories (weapons, engines, sensors, AI, materials, etc.)
- **Drag-drop transfer system** - Move items between homebase and ship
- **Stack management** - Materials auto-stack by type
- **Search & filter** - Find items quickly in large inventories

**Hangar System:**
- **Component installation** via drag-drop interface
- **6 slot types**: Weapon (6x), Thruster (4x), Sensor (2x), Internal (8x), Hull (4x), Mainframe (4x)
- **3 view modes**: External (weapons, hull, thrusters), Internal (sensors, utilities), Mainframe (AI cores)
- **Real-time ship stats calculation** - Auto-updates when components change
- **Power balance monitoring** - Warns when power draw exceeds reactor output
- **Installation prevention** - Cannot transfer installed components to homebase

**Ship Stats Panel:**
- **Auto-aggregation** from all installed components
- **Power balance display**: Reactor output vs. total draw
- **Weapon damage listing**: All equipped weapons with damage values
- **Thrust calculation**: Total engine output
- **Scan range**: Sensor detection distance
- **Armor & shields**: Defensive stat totals
- **Cargo capacity**: Storage volume from cargo bay components
- **DRE modifier collection**: Skill bonuses for dice rolls

**Item Scrapping System:**
- **Scrap items for materials** - Deconstruct components into raw resources
- **Animated progress modal** - Holographic scrapping animation
- **Yield calculation**: Based on item tier (T1=10 scrap, T5=100 scrap)
- **Confirmation prompts** - Prevent accidental scrapping

---

### ✅ Dice Resolution Engine (DRE) (Complete)

**Core Dice System:**
- **d20-based action resolution** - All skill checks, combat, scans use d20
- **Difficulty Checks (DC)** with skill modifiers
- **Critical success** (Natural 20) - Exceptional outcomes, bonus rewards
- **Critical failure** (Natural 1) - Catastrophic consequences
- **Multiple dice types**: d4, d6, d8, d10, d12, d20

**Modifier System:**
- **Ship component modifiers** - Bonuses from installed equipment
- **AI crew bonuses** - Each AI provides skill-specific modifiers
- **Environmental modifiers** - Radiation, heat, static exposure penalties
- **Attribute-based modifiers** - Player stats affect rolls
- **Skill system integration** - Engineering, Piloting, Combat, Hacking, etc.
- **Consequence tracking** - Persistent debuffs from failures

**Narrative Generation:**
- **Dynamic outcome descriptions** - Procedurally generated flavor text
- **Context-aware narratives** - Adapts to location, ship state, event type
- **Success/failure variations** - Different text for different outcomes
- **Terminal-style formatting** - Matches game aesthetic

---

### ✅ Game Time System (Complete)

**Tick-Based Time Progression:**
- **1 tick = 1 second real-time = 10 in-game minutes**
- **Day/hour/minute tracking** - Persistent across sessions (planned)
- **Subscribe/unsubscribe pattern** - UI components listen for time updates
- **Display format**: "DAY 0 // 00:00"
- **Auto-start on first access** - Singleton pattern, starts when game loads
- **Pause/resume support** - Pause time during menus/events

---

### ✅ Procedural Generation (Complete)

**Galaxy System:**
- **JSON-based galaxy definitions** - Hand-crafted systems with consistent data
- **Seed-based solar system generation** - Deterministic POI placement
- **Deterministic procedural POIs** - Same seed = same POIs every time
- **Zone-based difficulty**:
  - **Quiet Zone**: Low surge radiation, balanced risk
  - **Dark Zone**: Sun-proximate, extreme heat, high loot
  - **Static Zone**: Far from sun, extreme radiation, low population
- **Tier system** (T1-T4): Controls loot quality and encounter difficulty
- **Connection graph** - Defines hyperspace lanes between systems

**System Generator:**
- **Parent POI detection** - Planets visible on arrival
- **Child POI reveal** - Moons/stations appear on parent investigation
- **Environmental stat calculations** - Radiation, static, heat exposure
- **Wake signature tracking** - Plasma wake increases with jumps/scans

---

### ✅ Ship State Management (Complete)

**Singleton State Manager:**
- **Centralized ship state** - One source of truth for all ship data
- **Position tracking**: Current system, AU from sun, 2D coordinates
- **Component installation tracking** - Which components in which slots
- **Inventory management** - Ship cargo tracking
- **Scan history** - Visited and scanned systems
- **Route planning storage** - Save planned hyperspace routes
- **Game time integration** - Syncs with game clock

**Key Features:**
- **System scan tracking** - Scanned vs unscanned states
- **Active scan progress** - Real-time scan animation data
- **Planned route storage** - BFS pathfinding results with fuel costs
- **Visited system history** - Discovery mechanics
- **POI discovery logging** - Track which POIs have been revealed
- **Wake accumulation** - Tracks plasma wake for encounter probability

---

### ⚠️ Partially Implemented

**Route Plotting System:**
- Visual path highlighting ✅
- BFS pathfinding algorithm ✅
- Fuel cost calculation ✅
- "Plot Route" button UI (not yet functional) ⚠️
- Route storage in ship state ✅

**Launch Preparation:**
- Modal design pending ⚠️
- Fuel calculation logic exists ✅
- Component selection UI pending ⚠️
- AI assignment UI pending ⚠️

**Combat System:**
- DRE combat resolution complete ✅
- Combat event system in Admin Portal ✅
- Visual combat UI (modal/canvas) pending ⚠️
- Enemy AI behavior pending ⚠️
- Ship-to-ship combat animations pending ⚠️

**Resource Gathering:**
- Item scrapping system complete ✅
- Mining events in Admin Portal ✅
- POI harvesting UI pending ⚠️
- Fuel collection mechanics pending ⚠️

---

### ❌ Not Yet Implemented

- **Save/load game state** - LocalStorage persistence planned
- **Ship-to-ship travel mechanics** - Jump animations, travel time
- **Real-time fuel consumption** - Burn rate during jumps
- **Random encounters during travel** - Event triggers mid-jump
- **AI core damage/repair** - Component degradation system
- **Technology research tree** - Unlock new components/abilities
- **Multi-galaxy travel** - Warp between galaxies
- **Story progression triggers** - Main quest events
- **Economy/trading system** - NPC merchants, market prices
- **Reputation system** - Faction relationships
- **Mission log UI** - Quest tracking interface
- **Telemetry dashboard** - Event analytics and player behavior

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

### Game Design & Lore
- **[GAME_DESIGN.md](GAME_DESIGN.md)** - Complete narrative, setting, and design philosophy
- **[GAME_SYSTEMS.md](GAME_SYSTEMS.md)** - Detailed mechanics (dice, POIs, encounters, zones)

### Technical Documentation
- **[HANDOVER.md](HANDOVER.md)** - Technical architecture and code walkthrough
- **[BACKEND_API_DESIGN.md](BACKEND_API_DESIGN.md)** - Complete REST API specification
- **[backend/README.md](backend/README.md)** - Backend setup and API usage guide

### Feature Documentation
- **[ADMIN_PANEL_GUIDE.md](ADMIN_PANEL_GUIDE.md)** - Admin Portal user guide
- **[EVENT_ENGINE_DESIGN.md](EVENT_ENGINE_DESIGN.md)** - Event system architecture
- **[ENCOUNTERS_GUIDE.md](ENCOUNTERS_GUIDE.md)** - Encounter system deep-dive
- **[INVENTORY_BUILD_SUMMARY.md](INVENTORY_BUILD_SUMMARY.md)** - Inventory system docs
- **[TERMINAL_INTEGRATION_GUIDE.md](TERMINAL_INTEGRATION_GUIDE.md)** - Terminal feed usage
- **[MINING_EVENT_MIGRATION_PLAN.md](MINING_EVENT_MIGRATION_PLAN.md)** - Mining system migration

### Developer Resources
- **[SEED_SYSTEM.md](SEED_SYSTEM.md)** - Procedural generation details
- **[src/lib/dre/README.md](src/lib/dre/README.md)** - Dice Resolution Engine API
- **[src/lib/inventory/README.md](src/lib/inventory/README.md)** - Inventory Manager API
- **[ADMIN_UI_REFACTOR_PLAN.md](ADMIN_UI_REFACTOR_PLAN.md)** - Admin UI architecture plan

---

## 🧪 Testing

### Backend Tests

#### Loot System Tests
```powershell
cd backend
node test-loot-system.js
```
5 automated tests covering:
- Pool resolution (dual-mode)
- Grade-based weighted selection
- Tier and tag filtering
- Guaranteed items + random rolls
- Military loot pool validation

All tests passing ✅

### Frontend Tests

#### Inventory System Tests
```powershell
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

**Admin Portal:**
- Create/edit/delete events via EventEditor
- Configure loot pools in LootManager
- Test loot drops in LootSimulator
- Adjust global config in ConfigEditor
- Import/export events between files

**Game Systems:**
- Galaxy navigation: Browse Helix Nebula, scan systems
- Inventory management: Open inventory modal, transfer items
- Hangar system: Install components, view ship stats
- Game time: Observe time progression in top-right corner
- Event system: Trigger events in ShipCommandConsole (dev panel)

---

## 🛠️ Development Guide

### Project Commands

```powershell
# Frontend Development
npm run dev          # Start Vite dev server with HMR (port 5173)
npm run build        # Create optimized production build in dist/
npm run preview      # Preview production build locally

# Backend Development
cd backend
npm run dev          # Start backend with auto-restart (nodemon) (port 3001)
npm start            # Start backend in production mode
npm run init         # Initialize data files + create admin user

# Combined Development (PowerShell)
.\start-dev.ps1      # Start both frontend + backend servers

# Testing
node src/lib/inventory/test.js           # Run inventory tests (13 tests)
node backend/test-loot-system.js         # Run loot system tests (5 tests)
node src/lib/galaxyValidator.test.js     # Run galaxy validator tests
```

### Code Style

**React Components:**
- **Functional components** with hooks (no class components)
- `useMemo` for expensive calculations (pathfinding, filtering, etc.)
- `useEffect` for side effects (data fetching, subscriptions, timers)
- `useState` for local component state
- **No external state management** (Redux, Zustand, MobX, etc.)
- **Prop drilling** for shared state (ship state singleton exception)

**Naming Conventions:**
- Components: **PascalCase** (`GalaxyViewer.jsx`, `EventEditor.jsx`)
- Files: **camelCase** (`shipState.js`, `eventTriggerService.js`)
- Constants: **UPPER_SNAKE_CASE** (`MAX_CAPACITY`, `DEFAULT_TICK_RATE`)
- Functions: **camelCase** (`handleScanCluster`, `resolveLootPool`)
- CSS Classes: **kebab-case** (`glass-card`, `btn-neon-primary`)

**File Organization:**
- One component per file
- Co-locate related files (forms in `admin/forms/`)
- Separate concerns (UI components vs. logic in `lib/`)

### Key Singletons

**Ship State:**
```javascript
import { getShipState } from './lib/shipState.js';
const shipState = getShipState();

// Access/modify ship data
shipState.position.system = 'helix_alpha_01';
shipState.inventory.ship.addItem(itemId, quantity);
```

**Game Time:**
```javascript
import { getGameTime } from './lib/gameTime.js';
const gameTime = getGameTime();

// Subscribe to time updates
const unsubscribe = gameTime.subscribe((time) => {
  console.log(`DAY ${time.day} // ${time.hour}:${time.minute}`);
});

// Cleanup on unmount
useEffect(() => {
  return () => unsubscribe();
}, []);
```

**Backend API Client:**
```javascript
import api from './lib/api.js';

// Authenticated requests (requires JWT token in localStorage)
const events = await api.events.getAll({ type: 'mining,hazard' });
const config = await api.config.get();
await api.events.create(eventData);
await api.config.update(newConfig);
```

### Admin Portal Development

**Adding a New Event Type:**

1. **Define event structure** in `backend/data/events_*.json`
2. **Add trigger logic** in `backend/services/eventTriggerService.js`
3. **Add outcome processor** in `backend/services/eventOutcomeProcessor.js`
4. **Update EventEditor.jsx** with new trigger type UI
5. **Add validation rules** in `backend/utils/validation.js`
6. **Test in SimulationPanel.jsx**

**Adding a New Loot Pool Feature:**

1. **Update config schema** in `backend/data/config.json` → `lootTables`
2. **Add UI in LootPoolEditor.jsx** or **ItemEditor.jsx**
3. **Update backend resolution** in `backend/services/eventOutcomeProcessor.js` → `resolveLootPool()`
4. **Test in LootSimulator.jsx**
5. **Write backend test** in `backend/test-loot-system.js`

### Browser Compatibility

**Tested & Supported:**
- ✅ **Chrome 120+** (recommended - best performance)
- ✅ **Edge 120+** (Chromium-based)
- ⚠️ **Firefox Latest** (canvas performance may vary on large galaxies)

**Not Supported:**
- ❌ **Internet Explorer** (EOL, no support)
- ❌ **Safari** (untested, may have issues)

### Performance Considerations

**Canvas Rendering:**
- Redraws entire galaxy every frame for smooth animations
- 21-system Helix Nebula performs well (60 FPS)
- May need optimization for 100+ systems:
  - Dirty rectangle rendering (only redraw changed regions)
  - WebGL for hardware acceleration
  - Spatial partitioning (quadtree/grid)

**Event System:**
- Scheduler fires every 5-15 seconds (configurable)
- Events filtered by conditions before weight calculation
- Cooldown tracking prevents event spam

**Inventory System:**
- Items stored as flat arrays (not deeply nested)
- Capacity validation on every add/transfer
- Stats recalculated on component install/uninstall

---

## 🚧 Roadmap

### ✅ Completed (Current Version)

**Admin Portal & Content Tools:**
- ✅ Full-featured event editor with branching narratives
- ✅ Loot pool system with dual-mode generation (manual/tag-based)
- ✅ Item database CRUD with tag management
- ✅ Loot simulator with 3-panel testing
- ✅ Global config editor with difficulty curves
- ✅ Import/export system for events
- ✅ Backend API with JWT authentication
- ✅ Real-time validation and error handling
- ✅ Automatic backups before saves

**Core Game Systems:**
- ✅ Galaxy navigation (21-system Helix Nebula)
- ✅ Inventory & hangar systems (27+ items)
- ✅ Dice Resolution Engine (d20-based)
- ✅ Game time system (tick-based)
- ✅ Ship state management (singleton)
- ✅ Procedural POI generation (seeded)
- ✅ BFS pathfinding for routes
- ✅ Environmental hazard tracking

---

### 🔨 Immediate Next Steps (Q1 2026)

**1. Event System Integration** (Priority: CRITICAL)
- [ ] Wire event scheduler to ShipCommandConsole
- [ ] Display triggered events in TerminalModal
- [ ] Implement player choice UI for event branches
- [ ] Connect event outcomes to ship state/inventory
- [ ] Add event history log to right panel
- [ ] Test end-to-end event flow in-game

**2. Loot System Integration** (Priority: HIGH)
- [ ] Connect loot drops to POI interactions
- [ ] Display loot containers in terminal feed
- [ ] Animate loot reveal (holographic grid)
- [ ] Transfer loot to ship inventory automatically
- [ ] Add "Loot Log" tab in right panel
- [ ] Test military loot pool in asteroid mining

**3. Save/Load System** (Priority: HIGH)
- [ ] LocalStorage persistence for ship state
- [ ] Profile management with multiple save slots
- [ ] Auto-save on state changes (debounced)
- [ ] Manual save/load UI in settings menu
- [ ] Export/import save files (JSON)
- [ ] Cloud save support (planned)

**4. Route Plotting & Travel** (Priority: MEDIUM)
- [ ] Make "Plot Route" button functional
- [ ] Launch Preparation modal UI
  - Route visualization with fuel cost
  - Component selection (which systems to power)
  - AI core assignment (which AI to bring)
  - Cargo selection (leave items behind to save weight)
- [ ] Ship travel animations (system-to-system jump)
- [ ] Fuel consumption during travel
- [ ] Random encounter rolls mid-jump
- [ ] Arrival sequence at destination system

---

### 🎯 Medium-Term Features (Q2-Q3 2026)

**POI Interaction System:**
- [ ] Mining asteroid belts (event-driven)
- [ ] Docking at derelict stations
- [ ] Investigating anomalies
- [ ] Harvesting gas giants
- [ ] Salvaging wreckage
- [ ] Scanning ancient structures

**Combat System:**
- [ ] Visual combat UI (modal with dice rolls)
- [ ] Turn-based combat flow
- [ ] Enemy AI behavior patterns
- [ ] Ship damage visualization
- [ ] Component destruction/malfunction
- [ ] Escape/retreat mechanics

**AI Crew Management:**
- [ ] AI core damage/repair system
- [ ] AI personality dialogue system
- [ ] AI skill progression/upgrades
- [ ] AI relationship/morale tracking
- [ ] AI-specific side quests

**Technology Research:**
- [ ] Research tree UI in HomebaseTerminal
- [ ] Unlock new components via research
- [ ] Data fragment collection from POIs
- [ ] Tech tier progression (T1 → T5)
- [ ] Experimental tech with risks

**Economy & Trading:**
- [ ] NPC merchants at stations
- [ ] Dynamic market prices (supply/demand)
- [ ] Trade goods system
- [ ] Black market (illegal goods)
- [ ] Faction reputation discounts

---

### 🌟 Long-Term Vision (2027+)

**Story Progression:**
- [ ] Main quest chain (search for G'ejar-Vale)
- [ ] Faction storylines (Scavengers, Void Cult, Survivors)
- [ ] Character backstory reveals
- [ ] Multiple endings based on choices
- [ ] Post-game content (New Game+)

**Galaxy Expansion:**
- [ ] 3+ additional galaxies
- [ ] Inter-galaxy warp mechanics
- [ ] Galaxy-specific factions and dangers
- [ ] Unique loot tables per galaxy
- [ ] Galaxy discovery system

**Advanced Features:**
- [ ] Fleet management (multiple ships)
- [ ] Base building (upgrade asteroid shelter)
- [ ] Crew recruitment (human survivors)
- [ ] Crafting system (build components)
- [ ] Procedurally generated missions
- [ ] Reputation system with consequences

**Multiplayer (Distant Future):**
- [ ] Co-op exploration (2-4 players)
- [ ] Shared galaxy state
- [ ] Trade between players
- [ ] Joint combat encounters
- [ ] Competitive leaderboards

---

### 📊 Current Sprint Focus

**Week of Nov 24, 2025:**
- ✅ Loot system backend complete (dual-mode pools)
- ✅ Loot pool editor with visual mode toggle
- ✅ Item database editor with tag management
- ✅ Loot simulator with 3-panel testing
- 🔄 **IN PROGRESS:** End-to-end loot testing in simulator
- 🔄 **IN PROGRESS:** Event → Loot integration

**Next Week Goals:**
- [ ] Wire event system to game UI
- [ ] Test full event → outcome → loot flow
- [ ] Git commit: Admin Portal + Loot System
- [ ] Begin save/load system implementation

---

## 🐛 Known Issues

### Current Limitations

**Admin Portal:**
1. **Manual Items tab styling** - Tab disable state could be more visually obvious
2. **No undo/redo** - Changes are immediate, no undo stack (use backups)
3. **No drag-drop branch reordering** - Must delete/recreate branches to reorder

**Game UI:**
1. **Console spam** - Ship render position logs every frame (minor performance impact)
2. **Favicon 404** - Missing favicon.ico (cosmetic issue)
3. **Route plotting button** - "PLOT ROUTE" logs to console, not yet functional
4. **No persistence** - No save/load system yet (all progress lost on refresh)

**Backend:**
1. **No rate limiting** - API vulnerable to spam requests (add for production)
2. **Default admin password** - `admin123` must be changed in production
3. **No HTTPS** - HTTP only (enable HTTPS in production)
4. **File-based storage** - No database, concurrent writes could conflict

**Cross-Cutting:**
1. **No error boundaries** - React errors crash entire app
2. **No loading states** - API requests lack loading indicators
3. **No offline mode** - Requires backend connection

---

### Performance Considerations

**Canvas Rendering:**
- Galaxy map redraws every frame (60 FPS on modern hardware)
- 21-system Helix Nebula performs well
- May need optimization for 100+ system galaxies:
  - Implement dirty rectangle rendering (only redraw changed regions)
  - Consider WebGL for hardware acceleration
  - Add spatial partitioning (quadtree/grid culling)

**Event System:**
- Scheduler fires every 5-15 seconds by default
- Event filtering happens before weight calculation (efficient)
- Cooldown tracking uses simple timestamp comparison (fast)

**Inventory System:**
- Flat array storage (no deep nesting)
- Capacity validation on every operation (O(1) checks)
- Ship stats recalculation on component changes (O(n) slots)

---

### Security Notes

**⚠️ CRITICAL for Production Deployment:**

1. **Change Default Admin Password**
   - Default: `admin/admin123`
   - Change immediately after first login
   - Use strong passwords (12+ chars, mixed case, numbers, symbols)

2. **Set Strong JWT Secret**
   - Edit `backend/.env` → `JWT_SECRET`
   - Use cryptographically random string (32+ characters)
   - Never commit `.env` to version control

3. **Enable HTTPS**
   - Use reverse proxy (nginx, Caddy) with SSL certificates
   - Let's Encrypt for free SSL
   - Force HTTPS redirect

4. **Add Rate Limiting**
   - Install `express-rate-limit`
   - Limit login attempts (5 per 15 min)
   - Limit event creation (100 per hour)

5. **Validate User Input**
   - Already implemented in `backend/utils/validation.js`
   - Add additional checks as needed
   - Sanitize HTML in event descriptions

6. **Backup Data Regularly**
   - Automatic `.backup` files created before saves
   - Schedule daily backups to external storage
   - Test restore process

7. **Update Dependencies**
   - Run `npm audit` regularly
   - Update vulnerable packages
   - Test after updates

---

### Troubleshooting

**Backend won't start:**
```powershell
# Port 3001 already in use
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Data files missing
cd backend
npm run init

# JWT errors
# Ensure backend/.env has JWT_SECRET
# Check token format: "Bearer <token>"
```

**Frontend won't connect to backend:**
```powershell
# Check backend is running on port 3001
curl http://localhost:3001/api/health

# Check CORS settings in backend/.env
# CORS_ORIGIN should match frontend URL
```

**Events not appearing in-game:**
```powershell
# Check event is enabled in Admin Portal
# Verify trigger conditions match current location
# Check event cooldown hasn't blocked spawn
# View dev console for event scheduler logs
```

**Loot pools not working:**
```powershell
# Test in LootSimulator first
# Check pool has grades configured
# Verify items have matching tier+tags
# Check backend logs for resolution errors
```

**Items not saving:**
```powershell
# Check for console errors on save
# Verify JWT token is valid (not expired)
# Check backend logs for validation errors
# Ensure tags are arrays, not objects
```

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 🤝 Contributing

This is currently a solo development project. Feature requests and bug reports can be submitted via GitHub Issues.

**Areas where contributions would be welcome:**
- Event content (narrative events for Admin Portal)
- Loot pool configurations
- Item database entries (new components, AI cores, materials)
- Documentation improvements
- Bug reports with reproduction steps
- Performance optimization suggestions

**Contribution Guidelines:**
- Open an issue before starting work on major features
- Follow existing code style and patterns
- Test thoroughly before submitting
- Document new features in relevant markdown files

---

## 📞 Contact & Links

**Repository:** [github.com/Kariko762/theSurge](https://github.com/Kariko762/theSurge)  
**Branch:** main  
**Issues:** [github.com/Kariko762/theSurge/issues](https://github.com/Kariko762/theSurge/issues)

**Key Documentation:**
- [Admin Portal Guide](ADMIN_PANEL_GUIDE.md) - How to use the event editor
- [Backend API Docs](BACKEND_API_DESIGN.md) - REST API reference
- [Game Design Doc](GAME_DESIGN.md) - Lore, narrative, and design philosophy

---

**Last Updated:** November 24, 2025  
**Version:** 0.2.0 (Alpha)  
**Status:** Active Development - Admin Portal Complete, Event/Loot Systems Implemented

*The galaxy is dead. The void calls. G'ejar-Vale awaits.*

---

## 🎮 Quick Feature Checklist

**✅ Ready to Use:**
- Admin Portal with event creation
- Loot pool system (manual + tag-based)
- Galaxy navigation (21 systems)
- Inventory & hangar management
- Ship component installation
- Item scrapping system
- Game time system
- Procedural POI generation

**🔄 In Development:**
- Event system integration with game UI
- Loot drop animations
- Save/load persistence

**📋 Planned:**
- Route plotting & ship travel
- Combat UI
- AI crew management
- Technology research
- Trading & economy

**🌟 Dream Features:**
- Multiple galaxies
- Story progression
- Fleet management
- Multiplayer co-op
