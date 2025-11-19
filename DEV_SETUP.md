# Space Game - Development Environment

A dark, desolate space exploration game built with React and Vite.

## Quick Start

### First Time Setup

1. **Run the setup script:**
   ```powershell
   .\setup-dev-environment.ps1
   ```
   This will:
   - Check for Node.js and npm
   - Install all dependencies
   - Optionally start the dev server

### Running the Game (After Setup)

**Option 1: Use the quick start script**
```powershell
.\start-dev.ps1
```

**Option 2: Use npm directly**
```powershell
npm run dev
```

The game will be available at: **http://localhost:5173**

## Development

- **Start dev server:** `npm run dev`
- **Build for production:** `npm run build`
- **Preview production build:** `npm run preview`

## VS Code Integration

This project works seamlessly with VS Code. Simply:
1. Open the folder in VS Code
2. Run the PowerShell scripts in the integrated terminal
3. The dev server will hot-reload as you make changes

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Canvas API** - For rendering the solar system map
- **CSS Custom Properties** - Holographic UI theming

## Project Structure

```
src/
├── components/          # React components
│   ├── ShipCommandConsole.jsx   # Main solar system map view
│   ├── RightPanelTabs.jsx       # Tabbed interface (POIs, Ship, Inventory, Actions, Comms)
│   ├── ActionsPanel.jsx         # Proximity-based actions
│   ├── HomebaseTerminal.jsx     # Main menu
│   └── ...
├── lib/                 # Game logic
│   ├── galaxyGenerator.js       # Procedural galaxy generation
│   ├── systemGenerator.js       # Solar system generation
│   ├── shipState.js             # Ship state management
│   └── dre/                     # Dynamic Random Engine
├── data/                # Game data
│   └── items/                   # Item database
└── styles/              # CSS styling
```

## Features

- Procedurally generated solar systems
- Interactive solar system map with pan/zoom
- Ship movement and navigation
- POI discovery through scanning
- Automation/workflow system for queued actions
- Inventory management
- Tag system for player notes
- Multiple action types (Move To, Scan, Mine, Investigate)

## Troubleshooting

**Port already in use:**
If port 5173 is already in use, Vite will automatically try the next available port (5174, 5175, etc.)

**Dependencies not installing:**
Make sure you have Node.js 18+ and npm installed. Download from https://nodejs.org/

**Hot reload not working:**
Try stopping the server (Ctrl+C) and running `npm run dev` again.
