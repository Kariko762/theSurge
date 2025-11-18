# Dark Desolate Space Game - Technical Handover Document

## Project Overview

**Project Name:** Dark Desolate Space Game  
**Tech Stack:** React + Vite, Canvas 2D Rendering, JSON-based Galaxy Data  
**Repository:** theSurge (Kariko762)  
**Current Phase:** Galaxy Navigation & Scanning System Implementation  

---

## Architecture Overview

### Frontend Framework
- **React 18** with functional components and hooks
- **Vite** for development server and build tooling
- **Canvas 2D API** for all galaxy/system map rendering
- **CSS** with custom design system (Roobert font family)

### State Management
- **Singleton Pattern** for ship state (`src/lib/shipState.js`)
- **React useState/useMemo** for component-level state
- **No external state management library** (Redux, Zustand, etc.)

### Data Architecture
- **JSON-based galaxy definitions** (`src/data/`)
- **Procedural generation** for POIs within systems (via seeds)
- **Graph-based navigation** using BFS pathfinding (`src/lib/graph.js`)

---

## File Structure & Key Components

### Core Application Files

```
src/
├── App.jsx                          # Root component, handles frame transitions
├── main.jsx                         # Entry point, React rendering
├── components/
│   ├── LoginFrame.jsx               # Initial login screen
│   ├── HomebaseTerminal.jsx         # Main homebase UI with tab panels
│   ├── ShipCommandConsole.jsx       # Ship control interface
│   ├── UniverseViewer.jsx           # Universe map (multiple galaxies)
│   ├── GalaxyViewer.jsx            # Galaxy map (solar systems) - PRIMARY MAP
│   ├── SolarSystemViewer.jsx        # Individual system view with POIs
│   ├── hb_mapGalaxies.jsx          # Homebase MAP tab component
│   └── hb_mapSystems.jsx           # (Future: system-specific map tab)
├── lib/
│   ├── shipState.js                 # Ship state singleton manager
│   ├── shipComponents.js            # Component definitions and defaults
│   ├── galaxyGenerator.js           # Universe generation (now loads from JSON)
│   ├── galaxyLoader.js              # JSON galaxy file loader
│   ├── systemGenerator.js           # System POI generation (procedural)
│   ├── graph.js                     # BFS pathfinding for navigation
│   ├── rng.js                       # Seeded RNG utilities
│   └── gameTime.js                  # Game time/tick management
├── data/
│   └── helix_nebula_systems.json    # Galaxy definition (21 systems)
├── styles/
│   ├── DesignSystem.css             # Typography, colors, spacing tokens
│   └── TerminalFrame.css            # Terminal styling, scanlines, effects
└── assets/
    └── fonts/                       # Roobert font family (.otf files)
```

---

## Data Structure Documentation

### Galaxy JSON Format

**Location:** `src/data/helix_nebula_systems.json`

**Structure:**
```json
{
  "galaxyId": "helix_nebula",
  "galaxyName": "Helix Nebula",
  "type": "spiral",
  "centerX": 1000,
  "centerY": 1000,
  "systems": [
    {
      "id": "UNIQUE_ID",
      "name": "Display Name",
      "type": "Star Type",
      "zone": "Quiet|Dark|Static",
      "position": { "x": 1000, "y": 1000 },
      "tier": 0.0-1.0,
      "radiation": "Low|Medium|High",
      "size": 2-6,
      "seed": 1000000,
      "connections": {
        "forward": ["SYSTEM_IDS"],
        "backward": ["SYSTEM_IDS"],
        "cross": ["SYSTEM_IDS"]
      }
    }
  ]
}
```

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique system identifier (e.g., "HOMEBASE", "SYS_001") |
| `name` | String | Display name shown on map when scanned |
| `type` | String | Star class: "Main Sequence", "Red Giant", "Blue Giant", "White Dwarf", "Neutron Star", "Pulsar", "Black Hole", "Brown Dwarf", "Supergiant", "Dwarf" |
| `zone` | String | Zone classification affecting nebula color: "Quiet" (blue), "Dark" (purple), "Static" (red-purple) |
| `position` | Object | `{x, y}` coordinates in galaxy space (0-2000 range, center at 1000,1000) |
| `tier` | Number | Difficulty tier 0.0-1.0 (displayed as T1-T4 by multiplying by 4) |
| `radiation` | String | "Low", "Medium", "High" - affects nebula brightness and color intensity |
| `size` | Number | Visual star size 2-6 (affects circle radius on map) |
| `seed` | Number | Seed for procedural POI generation within the system |
| `connections.forward` | Array | System IDs this system connects TO |
| `connections.backward` | Array | System IDs that connect TO this system |
| `connections.cross` | Array | Shortcut/alternate connections (optional) |

**Current Galaxy:** Helix Nebula - 21 systems total, spiral layout

---

## Ship State Management

### Singleton Pattern

**File:** `src/lib/shipState.js`

**Access:**
```javascript
import { getShipState } from './shipState.js';
const shipState = getShipState();
```

**Key State Properties:**

```javascript
{
  // Ship Identity
  name: 'SS-ARKOSE',
  class: 'Survey Frigate',
  hull: 'Ronin-class Light Frame',
  
  // Current Status
  currentHull: 89,        // %
  currentShields: 78,     // %
  fuel: 84,              // %
  
  // Components & Power
  installedComponents: [...],
  powerAllocation: {...},
  
  // Position & Navigation
  position: {
    system: null,
    distanceAU: 0,
    angleRad: 0,
    x: 0,
    y: 0
  },
  
  // Cargo & Inventory
  inventory: [...],
  cargoCapacity: 40,
  cargoMass: 7.2,
  
  // Exploration & Scanning
  scannedPOIs: [],
  visitedSystems: [],
  scannedSystems: ['HOMEBASE'],    // System IDs scanned
  activeScan: null,                 // { systemId, progress, startTime }
  
  // Navigation & Route Planning
  navigator: {
    plannedRoute: [],               // Array of system IDs
    currentRouteIndex: 0,
    routeStats: null                // { totalLY, estimatedTravelTime, systems }
  },
  
  // Game Time
  gameTime: 0
}
```

**Key Methods:**

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `isSystemScanned(systemId)` | systemId: String | Boolean | Check if system has been scanned |
| `markSystemScanned(systemId)` | systemId: String | void | Mark system as scanned (reveals name/data) |
| `startScan(systemId)` | systemId: String | void | Begin scanning a system (sets `activeScan`) |
| `updateScanProgress(progress)` | progress: Number (0-100) | void | Update scan progress percentage |
| `completeScan()` | none | String | Complete scan, returns scanned systemId |
| `cancelScan()` | none | void | Cancel active scan |
| `setPlannedRoute(routeIds, stats)` | routeIds: Array, stats: Object | void | Store planned navigation route |
| `clearRoute()` | none | void | Clear planned route |

---

## Galaxy Map System (GalaxyViewer.jsx)

### Component Overview

**Purpose:** Interactive 2D map showing all solar systems in a galaxy with scanning, navigation, and route planning features.

**Rendering:** Canvas 2D with transform-based camera (pan/zoom)

**Key Features:**
- ✅ Pan & Zoom controls (drag to pan, scroll to zoom)
- ✅ System scanning with progress animation
- ✅ Scanned vs. unscanned visual states
- ✅ Speech bubble info modals
- ✅ Auto-navigation to scanning system
- ✅ Nebula intensity and zoom sliders with reset
- ✅ Filter by zone (Quiet/Dark/Static) and tier (T1-T4)
- ✅ Fixed-size text rendering (doesn't scale with zoom)
- ✅ Connection line rendering between systems
- ✅ Highlighted path visualization

### Visual System States

**Unscanned Systems:**
- Darker blue color (`rgba(26, 95, 127)`)
- No name visible
- Clickable → shows "SCAN ROUTE" button

**Scanned Systems:**
- Bright cyan color (`rgba(52, 224, 255)`)
- Name visible (12px Roobert Light)
- Clickable → shows system info with "PLOT ROUTE" or "CANCEL/CONTINUE" buttons

**Scanning Systems:**
- Pie-chart fill animation (0-100% progress)
- Auto-navigate: zooms to 1.2x and centers on system
- Progress: 2% per 100ms tick = ~5 seconds total

**HOMEBASE:**
- Pulsing green ring animation
- Label: "[ HOMEBASE ]" (11px Roobert Light)
- Pre-scanned by default

### Nebula Rendering

**Zone Color Mapping:**

| Zone | Color (Inner) | Color (Mid) | Radiation |
|------|--------------|-------------|-----------|
| Quiet | `#1C4C7F` (Blue) | `#153A60` | Low |
| Dark | `#711C7F` (Purple) | `#561560` | Medium |
| Static | `#B21C7F` (Red-Purple) | `#8A1560` | High |

**Intensity Control:** 0-100% slider adjusts nebula opacity multiplier

### Canvas Coordinate System

**World Space:** 0-2000 x 0-2000 (galaxy center at 1000, 1000)

**Transform Pipeline:**
1. Translate to canvas center + pan offset
2. Scale by zoom factor
3. Translate by -1000 (center world space)

**Screen to World Conversion:**
```javascript
const worldX = (canvasX - centerX - panOffset.x) / zoom + 1000;
const worldY = (canvasY - centerY - panOffset.y) / zoom + 1000;
```

**World to Screen Conversion:**
```javascript
const screenX = (worldX - 1000) * zoom + centerX + panOffset.x;
const screenY = (worldY - 1000) * zoom + centerY + panOffset.y;
```

### Text Rendering (Fixed-Size)

**Implementation:**
```javascript
ctx.save();
ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
const screenX = (system.position.x - 1000) * zoom + width / 2 + panOffset.x;
const screenY = (system.position.y - 1000) * zoom + height / 2 + panOffset.y;
ctx.font = '300 12px Roobert, sans-serif';
ctx.fillText(system.name.toUpperCase(), screenX, screenY + radius + 8);
ctx.restore();
```

**Key Point:** Transform reset ensures text stays same size regardless of zoom level.

---

## Scanning System Implementation

### Workflow

1. **User clicks unscanned system** → Info modal appears with "SCAN ROUTE" button
2. **Click "SCAN ROUTE"** → Calculates BFS route from HOMEBASE to target
3. **Identifies unscanned systems** → Filters route for systems not yet scanned
4. **Starts scan sequence** → Begins scanning first system, queues remaining
5. **Auto-navigation** → Zooms to 1.2x and centers on scanning system
6. **Progress animation** → Pie-chart fill from 0-100% over ~5 seconds
7. **Scan completion** → Shows speech bubble with system data
8. **Continue or stop** → User can continue to next system or cancel scan queue

### Scan Ticker Implementation

**Location:** `GalaxyViewer.jsx` - useEffect hook

**Logic:**
```javascript
useEffect(() => {
  const shipState = getShipState();
  const activeScan = shipState.state.activeScan;
  if (!activeScan) return;

  // Auto-navigate on scan start
  if (activeScan.progress === 0) {
    const scanningSystem = galaxy.systems.find(s => s.id === activeScan.systemId);
    setZoom(1.2);
    setPanOffset({ 
      x: -(scanningSystem.position.x - 1000) * 1.2,
      y: -(scanningSystem.position.y - 1000) * 1.2
    });
  }

  const interval = setInterval(() => {
    const currentProgress = shipState.state.activeScan?.progress || 0;
    if (currentProgress >= 100) {
      const completedSystemId = shipState.completeScan();
      const completedSystem = galaxy.systems.find(s => s.id === completedSystemId);
      
      // Show speech bubble modal
      const screenX = (completedSystem.position.x - 1000) * zoom + width / 2 + panOffset.x;
      const screenY = (completedSystem.position.y - 1000) * zoom + height / 2 + panOffset.y;
      setSystemInfoModal({ system: completedSystem, canvasX: screenX, canvasY: screenY });
      
      clearInterval(interval);
    } else {
      shipState.updateScanProgress(currentProgress + 2); // +2% per tick
    }
  }, 100);

  return () => clearInterval(interval);
}, [activeScan, galaxy.systems, zoom, panOffset, width, height]);
```

### Modal System

**Speech Bubble Info Modal:**
- Positioned above clicked system
- Arrow pointer to system
- Shows different content based on scan state

**Scanned System Modal:**
```
[SYSTEM NAME]
Type: [Star Type]
Zone: [Zone]
Tier: [T1-T4]
Distance: [X.X LY]

[PLOT ROUTE] or [CANCEL] [CONTINUE (X LEFT)]
```

**Unscanned System Modal:**
```
UNSCANNED SYSTEM
System data unavailable. Initiate scan sequence to reveal information.

[SCAN ROUTE]
```

---

## Navigation & Pathfinding

### BFS Pathfinding

**File:** `src/lib/graph.js`

**Function:** `findSystemPathBFS(systems, startId, endId)`

**Implementation:**
- Breadth-First Search algorithm
- Returns shortest path as array of system IDs
- Handles forward, backward, and cross connections
- Returns `null` if no path exists

**Usage:**
```javascript
const route = findSystemPathBFS(galaxy.systems, 'HOMEBASE', 'SYS_015');
// Returns: ['HOMEBASE', 'SYS_001', 'SYS_003', 'SYS_007', ...]
```

### Route Highlighting

**Green Highlighted Path:**
- Pulsing glow effect (0.5 + 0.5 * sin)
- Line width: 2.5 / zoom
- Color: `rgba(0, 255, 136, opacity)`
- Rendered ABOVE connection lines, BELOW system nodes

---

## Styling System

### Design Tokens

**File:** `src/styles/DesignSystem.css`

**Font Family:** Roobert (Light, Regular, Medium, SemiBold, Bold, Heavy)

**Color Palette:**
- Primary Cyan: `#34e0ff`
- Success Green: `#52ffa8` / `#00ff88`
- Warning Red: `#ff5050`
- Text Primary: `#cfd8df`
- Text Muted: `rgba(207, 216, 223, 0.6)`

**Typography Scale:**
- Display XL: 48px
- H1: 20px
- Body MD: 12px
- UI MD: 10px
- UI SM: 9px
- UI XS: 8px

### Terminal Frame Effects

**File:** `src/styles/TerminalFrame.css`

**Effects:**
- Scanlines overlay (repeating linear gradient)
- Noise overlay (subtle cyan lines)
- Disabled on galaxy map via `.no-scanlines` class

**Scanline Disable:**
```css
.no-scanlines::before,
.no-scanlines::after {
  display: none !important;
}
```

---

## UI Controls & Interactions

### Galaxy Map Controls

**Mouse:**
- **Left Click** → Select/show info modal for system
- **Left Drag** → Pan camera
- **Scroll Wheel** → Zoom in/out (0.1 - 3.0x)
- **Click Empty Space** → Close info modal

**Sliders:**
- **Nebula:** 0-100% intensity
- **Zoom:** 0.1x - 3.0x (10% - 300%)

**Buttons:**
- **RESET** → Resets nebula (50%), zoom (0.5x), pan (0, 0)
- **Zone Filters** → ALL, Quiet, Dark, Static
- **Tier Filters** → ALL, T1, T2, T3, T4

### Homebase Terminal

**Tab Structure:**

**Left Panel:**
- AI - AI core crew management
- POWER - Power allocation
- RESEARCH - Technology tree
- BUILD - Ship upgrades
- HANGAR - Ship status overview

**Right Panel:**
- LOGS - System logs
- ALERTS - Warnings/notifications
- MAP - Galaxy navigation (fullscreen)
- INVENTORY - Cargo management

**MAP Tab Behavior:**
- Opens fullscreen (no scanlines)
- Shows UniverseViewer by default
- Click galaxy → Opens GalaxyViewer
- "CLOSE MAP" button returns to homebase

---

## Known Issues & Limitations

### Current Limitations

1. **No route plotting yet** - "PLOT ROUTE" button logs to console
2. **No launch preparation** - Ship doesn't actually move between systems
3. **No game time integration** - Time ticker exists but not displayed
4. **No POI interactions** - Can view systems but can't interact with POIs
5. **Single galaxy only** - Universe view shows multiple but only Helix Nebula is playable

### Browser Compatibility

**Tested:**
- ✅ Chrome 120+ (recommended)
- ✅ Edge 120+
- ⚠️ Firefox (canvas performance may vary)

**Not Supported:**
- ❌ Internet Explorer

### Performance Considerations

**Canvas Rendering:**
- Redraws every frame due to animation loop
- 21 systems + nebula rendering = good performance
- May need optimization for 100+ systems

**Recommendations:**
- Implement dirty rectangle rendering for large galaxies
- Use off-screen canvas for nebula backgrounds
- Consider WebGL for 500+ systems

---

## Development Workflow

### Starting Development Server

```bash
npm run dev
```

**Port:** 3000 (default)  
**URL:** http://localhost:3000

### Building for Production

```bash
npm run build
```

**Output:** `dist/` folder

### Code Style

**React Components:**
- Functional components with hooks
- useMemo for expensive calculations
- useEffect for side effects
- useState for local state

**Naming Conventions:**
- Components: PascalCase (e.g., `GalaxyViewer.jsx`)
- Files: camelCase (e.g., `shipState.js`)
- Constants: UPPER_SNAKE_CASE
- Functions: camelCase

---

## Future Development Roadmap

### Immediate Next Steps

1. **Implement Plot Route functionality**
   - Store route in `shipState.navigator.plannedRoute`
   - Calculate total distance and travel time
   - Highlight route on map (already implemented visually)

2. **Add "Prepare for Launch" button**
   - Shows in Ship Status when route is plotted
   - Opens launch preparation modal

3. **Create Launch Preparation Modal**
   - Fullscreen modal
   - Route visualization
   - Component selection
   - AI core assignment
   - Fuel calculation
   - Confirm/Cancel buttons

4. **Game Time Display**
   - Top-right corner: "DAY X // HH:MM"
   - Add to all screens (Homebase, Ship, Maps)

5. **Terminal Timestamps**
   - Prefix format: "[DX HH:MM] Message"
   - Integrate with game time system

### Medium-Term Features

- System-to-system travel mechanics
- Fuel consumption during travel
- Random encounters during jumps
- POI scanning within systems
- Resource gathering
- Ship upgrades and repairs
- AI core damage and repair
- Save/load game state

### Long-Term Vision

- Multiple galaxies with inter-galaxy travel
- Story progression and missions
- Procedurally generated events
- Economy system (trading)
- Fleet management
- Multiplayer (distant future)

---

## Troubleshooting Guide

### Common Issues

**Issue: Text not visible on galaxy map**
- **Cause:** System not scanned yet
- **Fix:** Click system → "SCAN ROUTE" → Wait for scan completion

**Issue: Canvas stretched/distorted circles**
- **Cause:** CSS width/height doesn't match canvas pixel dimensions
- **Fix:** Already resolved - container resizing sets canvas pixel size

**Issue: Scan doesn't progress**
- **Cause:** useEffect dependencies not triggering re-render
- **Fix:** Already resolved - scan ticker checks activeScan.progress

**Issue: Font not loading (fallback to sans-serif)**
- **Cause:** .otf files not found or network slow
- **Fix:** Check `src/assets/fonts/` for Roobert-*.otf files

**Issue: Scanlines visible on galaxy map**
- **Cause:** `.no-scanlines` class not applied
- **Fix:** Check `HomebaseTerminal.jsx` - MAP wrapper has className="no-scanlines"

### Debug Tools

**Ship State Inspection:**
```javascript
import { getShipState } from './lib/shipState.js';
console.log(getShipState().state);
```

**Canvas Debug:**
```javascript
// In GalaxyViewer.jsx
console.log('Zoom:', zoom);
console.log('PanOffset:', panOffset);
console.log('Canvas Size:', { width, height });
```

---

## Contact & Handover Notes

### Code Quality

- **No compilation errors** - All files compile successfully
- **ESLint** - Not currently configured (recommended to add)
- **TypeScript** - Not used (could migrate for type safety)

### Testing

- **No automated tests** - Recommended to add Jest + React Testing Library
- **Manual testing** - All features tested in Chrome
- **Test coverage** - 0% (manual QA only)

### Documentation

- Design system documented in CSS comments
- Component purpose documented in file headers
- Complex algorithms commented inline
- This handover document covers architecture

### Git Repository

**Branch:** main  
**Recent Work:** Galaxy navigation, scanning system, visual improvements  
**Commit Frequency:** Ad-hoc (recommend more frequent, smaller commits)

---

## Quick Reference - Critical Code Locations

| Feature | File | Line(s) |
|---------|------|---------|
| Galaxy JSON | `src/data/helix_nebula_systems.json` | Full file |
| Ship State Singleton | `src/lib/shipState.js` | Lines 273-296 |
| Scan Progress Ticker | `src/components/GalaxyViewer.jsx` | Lines 105-140 |
| Canvas Rendering | `src/components/GalaxyViewer.jsx` | Lines 145-600 |
| System Info Modal | `src/components/GalaxyViewer.jsx` | Lines 800-940 |
| BFS Pathfinding | `src/lib/graph.js` | Lines 1-60 |
| Nebula Color Mapping | `src/components/GalaxyViewer.jsx` | Lines 220-240 |
| Fixed-Size Text | `src/components/GalaxyViewer.jsx` | Lines 410-430 |
| Scan Route Handler | `src/components/GalaxyViewer.jsx` | Lines 920-935 |
| No-Scanlines Wrapper | `src/components/HomebaseTerminal.jsx` | Lines 35-55 |

---

## Version History

**v1.0.0** - Initial galaxy navigation system  
**v1.0.1** - Scanning system with progress animation  
**v1.0.2** - Visual improvements (text size, nebula colors, scanlines)  
**Current:** v1.0.2

---

## Additional Resources

**Design Reference:** GAME_DESIGN.md  
**System Design:** GAME_SYSTEMS.md  
**Seed System:** SEED_SYSTEM.md  
**Dependencies:** package.json  

---

*Last Updated: November 18, 2025*  
*Document Version: 1.0*  
*Handover Complete*
