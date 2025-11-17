# Dark Desolate Space Game

> *"The void is patient. G'ejar-Vale waits. Will you find it before the radiation claims you?"*

A **text-based roguelike space exploration game** where you navigate a dead galaxy, collecting radiation from dying stars to fuel your Reference Frame Engine, rebuild your fractured AI crew, and search for the last refuge of humanity: **G'ejar-Vale**.

---

## 🌌 The Story

Humanity once flourished among the stars. But **The Surge**—a catastrophic wave of corrupting solar radiation—burned the galaxy to ash. You survived by accident, hiding in a hollow asteroid while fleeing the authorities.

Now, everything is gone.

Your only companions are fractured AI personalities rebuilt from salvaged cores. Your only hope is a myth whispered through corrupted data: **G'ejar-Vale**, a hidden sanctuary untouched by the Surge.

Each expedition into dead solar systems brings you closer to the truth—and closer to your own demise.

**Survive. Rebuild. Discover. Escape.**

📖 **[Read Full Story & Game Design →](GAME_DESIGN.md)**

---

## 📁 Project Structure

```
space-game/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx                     # Vite entry point
│   ├── App.jsx                      # Main app with frame navigation
│   ├── components/
│   │   ├── LoginFrame.jsx           # Frame 1: Login + Profile Management
│   │   ├── HomebaseTerminal.jsx     # Frame 2: Homebase Terminal
│   │   └── ShipCommandConsole.jsx   # Frame 3: Ship Command Console
│   └── styles/
│       └── TerminalFrame.css        # Shared holographic styling
└── README.md
```

## 🎨 Design Aesthetic

- **Colors**: Deep blacks (#000000), faded cyan/teal holographics (#34e0ff at 40–60% opacity), muted whites (#cfd8df)
- **Tone**: Abandoned outpost, analog noise, faint distortion, degraded sci-fi terminal
- **Style**: Dark, desolate, dirty holographic overlays, flickering UI edges
- **Tech**: Vite + React with advanced CSS animations

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

The app will open at `http://localhost:3000` with hot module replacement (HMR).

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🧬 The Three Frames

### Frame 1: LoginFrame.jsx
Login and user/profile management shell featuring:
- Centered login container with holographic glow
- Email + password input fields
- "Create Profile" and "Load Existing Profile" buttons
- Placeholder async functions: `createUser()`, `loginUser()`, `loadProfile()`
- Decommissioned station terminal aesthetic
- **Fade-in-up animation** on load

### Frame 2: HomebaseTerminal.jsx
Main base terminal interface featuring:
- **Left slide-out tabs**: AI, Power, Research, Build, Hangar
- **Right slide-out tabs**: Logs, Alerts, Map, Inventory
- **Central display**: Terminal display area with live data
- **Progress bars** showing Power Grid, Life Support, Defenses
- **Enhanced slide animations** with glow effects and backdrop blur
- CSS-based slide animations with smooth transitions

### Frame 3: ShipCommandConsole.jsx
Ship cockpit command interface featuring:
- **Left systems column**: Navigation, Sensors, Engines, Power
- **Right systems column**: Weapons, Defence, Comms, Ship Status
- **Radial charts** displaying Hull and Fuel percentages
- **Central command display** with four sections:
  - Sensor Feed
  - Ship Vitals
  - System Warnings
  - Story Telemetry (narrative feed)
- **Animated radial gauges** with rotating glow effects
- Scanlines and glassy holographic effects

## ✨ Enhanced Vite Features

### Advanced Animations
- **Panel slide-outs** with smooth cubic-bezier easing
- **Glow effects** that pulse when panels open
- **Backdrop blur** on slide-out panels
- **Fade-in-up**, **slide-in-left**, **slide-in-right** animations
- **Shimmer effects** on progress bars

### Data Visualizations
- **Radial charts** with conic gradients for circular progress indicators
- **Progress bars** with animated shimmer overlays
- **Data grids** with hover effects and smooth transitions
- **Rotating glow animations** on radial gauges

### Development Navigation
Use the top-right frame switcher buttons to navigate between:
- **LOGIN** - Authentication frame
- **HOMEBASE** - Base terminal with slide-out tabs
- **SHIP** - Ship command console with radial charts

## 🎯 Features

- ✅ Vite for fast HMR and optimized builds
- ✅ Fully responsive layouts
- ✅ Dark, desolate, holographic aesthetic
- ✅ CSS scanlines and noise overlays
- ✅ Enhanced slide-out tab animations with glow effects
- ✅ Radial charts and progress bars
- ✅ Data visualization components
- ✅ Minimal, extendable placeholder functions
- ✅ No external animation libraries (pure CSS)

## 🔧 Customization

All shared styles are in `TerminalFrame.css` with CSS custom properties:

```css
--deep-black: #000000;
--faded-cyan: #34e0ff;
--muted-white: #cfd8df;
--terminal-glow: rgba(52, 224, 255, 0.4);
```

Modify these variables to adjust the overall aesthetic.

---

## 🎮 CORE GAME MECHANICS

### The RFE (Reference Frame Engine)

Your ship's **Reference Frame Engine** collapses space-time to enable instant travel—but it requires **stellar radiation** as fuel. Different star types emit different radiation levels:

- **O-Type (Blue Supergiants)** - Extreme radiation, very high fuel, extreme danger
- **B-Type (Blue-White)** - High radiation, high fuel, high risk
- **G-Type (Yellow, Sun-like)** - Balanced radiation, medium fuel, manageable risk
- **M-Type (Red Dwarfs)** - Low radiation, minimal fuel, safer systems

**Strategic choice**: High-radiation stars = more jumps but deadly systems. Low-radiation = safer but frequent refueling required.

### The Roguelike Loop

1. **Homebase (Asteroid Shelter)** - Repair ship, upgrade AI crew, plan route
2. **System Selection** - Choose star type based on fuel needs and risk tolerance
3. **Expedition** - Explore derelict stations, dead worlds, collect fragments
4. **Encounters** - Face rogue AIs, corrupted creatures, solar storms
5. **Return** - Bring resources and data fragments back to homebase
6. **Rebuild** - Process discoveries, upgrade systems, piece together G'ejar-Vale coordinates

### Fractured AI Crew

Your companions are damaged AI personalities salvaged from the ruins:

- **ARIA** (Navigation) - Paranoid perfectionist: *"We're off by 0.003%. That's how crews die."*
- **FORGE** (Engineering) - Gruff mechanic: *"She's held together by spite and prayers."*
- **CIPHER** (Research) - Unstable genius: *"Data... corrupted... but beautiful."*
- **GHOST** (Sensors) - Whispers warnings: *"...something watching... not alone..."*

Rebuild their memory cores to unlock new abilities and deeper personality.

---

## 📝 Next Steps

These frames are designed to be extended with:
- Backend authentication integration
- Real-time data feeds
- Game logic and state management
- Additional UI panels and systems
- Narrative engine integration
- Multiplayer functionality

---

## 🚀 PHASE ONE STATUS: COMPLETE ✅

**Completed:**
- ✅ Core UI frames (Login, Homebase, Ship Console)
- ✅ Dark desolate holographic aesthetic
- ✅ Enhanced animations (panel slides, radial charts, progress bars)
- ✅ Vite + React foundation with HMR
- ✅ Game design document and narrative framework

**Next Phase:**
- [ ] Implement star type database and RFE fuel system
- [ ] Build solar system selection interface
- [ ] Create expedition encounter system
- [ ] Develop AI crew dialogue engine
- [ ] Add resource management and progression
- [ ] Implement save/load profile system
- [ ] Build G'ejar-Vale coordinate fragment tracker

---

**Built with**: Vite + React  
**Style**: Dark Desolate Sci-Fi Terminal  
**Genre**: Text-Based Roguelike Space Exploration  
**Phase**: One (Foundational UI) - **COMPLETE**

*The galaxy is dead. The void calls. G'ejar-Vale awaits.*
