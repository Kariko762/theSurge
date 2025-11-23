# Simulation System - Technical Documentation

## Overview

The Simulation tab in the Admin Portal provides comprehensive testing and debugging tools for events and builds. It consists of two sub-systems:

1. **Event Simulator** - End-to-end event testing with step-by-step execution
2. **Build Simulator** - AI/Ship/Component attribute calculator with roll testing

---

## Event Simulator

### Purpose
Test any event (enabled or disabled) from the event library with full visibility into every processing step, similar to Visual Studio breakpoints.

### Multi-Panel Architecture

#### 🖥️ Terminal Panel (Player View)
- Shows what the player sees in-game
- Narrative text and system messages
- Available choices
- Final rewards and outcomes
- **Color Coding:**
  - Cyan: System messages
  - White: Titles and narrative
  - Orange: Prompts
  - Green: Available choices
  - Magenta: Challenge indicators
  - Yellow: Player selections

#### ⚙️ DRE Panel (Dynamic Resolution Engine)
- Weight calculations and scenario selection
- Challenge calculations (dice rolls, modifiers)
- Skill bonus breakdowns
- Outcome determination logic
- **Color Coding:**
  - Magenta header
  - Blue: Processing steps
  - Green: Success states
  - Red: Failures
  - Cyan: Critical successes
  - Gray: Data values

#### 📡 Backend Panel (Event Processor)
- Event data loading
- Schema validation
- Context application
- Telemetry tracking
- Database operations
- **Color Coding:**
  - Green header
  - Cyan: System operations
  - Green: Success confirmations
  - Orange: Warnings
  - Red: Errors

#### 📊 System Panel (Flow Control)
- Step headers and progress
- High-level execution flow
- Simulation state management
- **Color Coding:**
  - Orange header
  - Cyan: Step markers
  - Green: Completions

### Execution Modes

#### Step-by-Step Mode (Default)
- Manual progression through 12 execution steps
- Click "Continue" to advance to next step
- Pause at player decision points
- Perfect for debugging and understanding flow

**Steps:**
0. Initialize
1. Load Event Data
2. Validate Event Structure
3. Apply Game Context
4. Select Scenario (Weighted Random)
5. Display Scenario to Player
6. Wait for Player Choice
7. Process Choice
8. Calculate Challenge (if applicable)
9. Determine Outcome
10. Apply Rewards & Consequences
11. Track Telemetry
12. Complete

#### Auto-Run Mode
- Uncheck "Step-by-Step Mode"
- Automatic execution with delays
- Good for quick testing
- Auto-selects challenging branches for demonstration

### Features

#### Event Selection
- Load all events from all types (dynamic, POI, mission)
- Show both enabled and disabled events
- Filter by event type in dropdown
- Display event metadata (title, tags, weight, enabled status)

#### Game Context Configuration
- System Tier (T0-T3)
- Risk Level (low/medium/high)
- Location
- Player Skills (8 skills, 0-5 range)
  - perception
  - technical
  - engineering
  - salvage
  - science
  - intuition
  - combat
  - piloting
- Ship Stats
  - hull
  - shields
  - weapons
  - sensors

#### Progress Tracking
- Visual progress bar (0-12 steps)
- Current step indicator
- Step completion percentage

#### Interactive Player Choices
- When simulation reaches Step 6, presents actual choices
- Click choice to select (in step mode, auto-continues)
- Shows challenge information if applicable
- Highlights selected choice

### Technical Implementation

**Key Functions:**
- `executeStep(step)`: Main step dispatcher
- `step_Initialize()` through `step_Complete()`: Individual step handlers
- `processPlayerChoice(branchId)`: Handle player selections
- `addLog(panel, message, type, data)`: Unified logging
- `renderLogEntry(entry)`: Colored log rendering

**State Management:**
- `eventState`: Current event execution state
- `selectedBranch`: Player's chosen branch
- `outcome`: Final outcome result
- `currentStep`: Current execution step (0-12)
- `isRunning`: Simulation active flag
- `stepMode`: Step-by-step vs auto-run

**Auto-Scroll:**
- All panels auto-scroll to bottom on new log entries
- Uses refs for smooth scrolling

---

## Build Simulator

### Purpose
Calculate final ship/AI attributes with full transparency into modifier sources. Test skill rolls against difficulty targets. Perfect for balancing efforts.

### Architecture

#### Configuration Panel (Left Side)

**🚀 Base Ship Configuration**
- 6 core ship stats (sliders 0-200)
  - hull
  - shields
  - weapons
  - sensors
  - cargo
  - speed

**🤖 AI Crew Member**
- Dropdown selector from AI Crew database
- Shows selected AI details:
  - Name and role
  - Description
  - Skill modifier breakdown
  - Combat modifiers (if applicable)

**⚙️ Ship Components**
- Checkbox list of available components
- Each shows:
  - Component name
  - Stat affected
  - Bonus value
- Visual feedback for selected components
- Scrollable list for many components

#### DRE Panel (Right Side)

**⚙️ Build Calculation Engine**
- Step-by-step breakdown of calculations
- Shows modifier sources and applications
- Color-coded results
- Full transparency into final values

**Calculation Steps:**
1. Base Ship Configuration (display all stats)
2. AI Crew Bonuses (skill modifiers, combat bonuses)
3. Component Bonuses (additive modifiers)
4. Final Build Summary (before → after comparisons)

**🎲 Test Skill Rolls** (appears after calculation)
- Button for each available skill
- Click to test a d20 roll
- Shows:
  - Base roll (d20)
  - Skill bonus breakdown (AI + Components)
  - Final total
  - Success/failure against difficulty targets
  - Critical success/failure detection

### Component Types

**Stat Types:**
- `additive`: Adds value to stat
- Ship stats: hull, shields, weapons, sensors, cargo, speed
- Skills: combat, engineering, technical, etc.
- Universal: `all_skills` (adds to all skill modifiers)

**Example Components (Mock Data):**
```javascript
{ id: 'shield_boost', name: 'Shield Booster MkII', stat: 'shields', value: 25 }
{ id: 'efficiency_core', name: 'Efficiency Core', stat: 'all_skills', value: 1 }
{ id: 'combat_ai', name: 'Combat AI Module', stat: 'combat', value: 2 }
```

### Build Breakdown

**Attribute Breakdown Structure:**
```javascript
{
  ship: { hull: 100, shields: 50, ... },  // Base ship stats
  ai: { id, name, role, skillModifiers },  // Selected AI
  components: [ ... ],                     // Selected components
  skills: {
    combat: {
      base: 0,
      ai: 2,           // From AI
      components: 1,   // From components
      total: 3
    }
  },
  finalStats: { ... },      // Ship stats after all bonuses
  finalSkills: { ... }      // Skills after all bonuses
}
```

### Roll Testing

**Test Roll Output:**
- Natural d20 roll
- Skill bonus breakdown
- Final total calculation
- Success/failure vs difficulty targets:
  - Easy (8)
  - Medium (12)
  - Hard (16)
  - Very Hard (20)
- Critical detection (natural 1 or 20)

**Example Output:**
```
Rolling d20 for combat...
Base roll: 14
Skill bonus: +3
Bonus breakdown:
  AI: +2
  Components: +1
Final total: 14 + 3 = 17

Against difficulty targets:
  Easy (8): ✓ SUCCESS
  Medium (12): ✓ SUCCESS
  Hard (16): ✓ SUCCESS
  Very Hard (20): ✗ FAILURE
```

---

## Integration Points

### API Integration
- **Event Simulator**: Loads from `/api/events/dynamic`, `/api/events/poi`, `/api/events/mission`
- **Build Simulator**: Loads from `/api/config` (aiCrew section)
- Both use existing API client (`lib/api/client.js`)

### Game Systems Integration
- **EventExecutor**: Used by Event Simulator for actual event processing
- **DRE (Dynamic Resolution Engine)**: Calculation logic mirrored in both simulators
- **Telemetry**: Event Simulator tracks execution data

### Admin Panel Integration
- Main tab: "Simulation"
- Sub-tabs: "Events", "Builds"
- Uses existing tab hierarchy CSS classes
- Seamless navigation with other admin sections

---

## Use Cases

### 1. Event Testing
**Scenario:** Testing a new "Ancient Alien Artifact" event

**Steps:**
1. Navigate to Simulation → Events
2. Select event from dropdown
3. Configure game context (tier, risk, player skills)
4. Enable step-by-step mode
5. Click "Start"
6. Step through execution, watching:
   - How scenario weights are calculated
   - Which scenario is selected
   - How player choices are processed
   - Challenge roll calculations
   - Outcome determination
   - Reward application

**Benefit:** See exactly why a scenario was chosen, how modifiers affect rolls, and verify reward logic.

### 2. Balance Testing
**Scenario:** Ensuring T1 events aren't too hard for new players

**Steps:**
1. Load event
2. Set context to T1, low skills (1-2 range)
3. Run multiple times
4. Observe challenge success rates
5. Adjust event difficulty or tier modifiers

**Benefit:** Data-driven balancing decisions.

### 3. Build Optimization
**Scenario:** Creating a combat-focused build

**Steps:**
1. Navigate to Simulation → Builds
2. Select combat AI (e.g., "Warmaster")
3. Add combat components (weapons, combat AI module)
4. Click "Calculate Build"
5. Review DRE breakdown
6. Test combat rolls
7. Compare against difficulty targets

**Benefit:** See exact attribute sources, test effectiveness, optimize loadouts.

### 4. Order of Operations Verification
**Scenario:** Ensure bonuses apply in correct order

**Steps:**
1. Build Simulator with mixed bonuses
2. Review DRE calculation steps:
   - Base stats
   - AI modifiers
   - Component modifiers
3. Verify final values match expectations

**Benefit:** Catch bugs in calculation order, ensure consistent behavior.

### 5. Pre-Production Testing
**Scenario:** Test new AI/event/component before making LIVE

**Steps:**
1. Create new entity in admin panel
2. Test in simulator (works with disabled events)
3. Verify behavior
4. Enable/publish when confident

**Benefit:** Safe testing environment, no player impact.

---

## Future Expansion

### Missions (Planned)
- Multi-stage event testing
- Progression tracking
- Branching path visualization
- Success/failure condition testing

### Additional Features (Potential)
- Save/load test configurations
- Export test results
- Automated test suites
- Comparison mode (before/after changes)
- Visual flowcharts of event paths
- Probability analysis (run 1000x, show distribution)

---

## Technical Notes

### Performance
- Lazy loading of events (only when simulator opened)
- Efficient log rendering (React keys, minimal re-renders)
- Auto-scroll throttling via refs
- No unnecessary state updates

### Error Handling
- Graceful handling of missing event data
- Validation before execution
- Error messages in appropriate panels
- Reset capability at any time

### Accessibility
- Color coding + text indicators
- Clear step labels
- Keyboard navigation support
- Screen reader compatible log structure

### Maintainability
- Modular step functions
- Centralized logging
- Consistent color scheme
- Clear separation of concerns (UI, logic, state)

---

## Color Reference

### Event Simulator
| Type | Color | Usage |
|------|-------|-------|
| header | #0ff | Step headers, major sections |
| system | #0ff | System messages |
| title | #fff | Event/scenario titles |
| narrative | #ddd | Story text |
| prompt | #fa0 | Player prompts |
| choice | #0f0 | Available choices |
| challenge | #f0f | Challenge indicators |
| player-choice | #ff0 | Selected choice |
| process | #09f | Processing messages |
| success | #0f0 | Success states |
| critical-success | #0ff | Natural 20s |
| failure | #f66 | Failures |
| critical-fail | #f00 | Natural 1s |
| reward | #0f0 | Positive rewards |
| penalty | #f90 | Negative consequences |
| warning | #fa0 | Warnings |
| error | #f00 | Errors |
| data | #999 | Raw data values |
| waiting | #f90 | Waiting states |

### Build Simulator
| Type | Color | Usage |
|------|-------|-------|
| header | #0ff | Section headers |
| process | #09f | Calculation steps |
| success | #0f0 | Completions |
| critical-success | #0ff | Natural 20s |
| failure | #f66 | Failed checks |
| critical-fail | #f00 | Natural 1s |
| reward | #0f0 | Positive bonuses |
| warning | #fa0 | Warnings |
| error | #f00 | Errors |
| data | #999 | Breakdown values |

---

## Keyboard Shortcuts (Future)

- `Space`: Continue (step mode)
- `R`: Reset simulation
- `S`: Toggle step mode
- `1-9`: Select choice (when applicable)
- `Esc`: Reset to idle

---

## Dependencies

- React 18+ (hooks: useState, useEffect, useRef)
- EventExecutor (`lib/eventExecutor.js`)
- API Client (`lib/api/client.js`)
- HoloIcons component
- AdminGlass.css styles

---

## File Structure

```
src/components/admin/
├── SimulationPanel.jsx       # Main container with sub-tabs
├── EventSimulator.jsx         # Event testing system
└── BuildSimulator.jsx         # Build calculation system
```

---

## API Endpoints Used

```
GET /api/events/dynamic/all    # All dynamic events
GET /api/events/poi/all        # All POI events
GET /api/events/mission/all    # All mission events
GET /api/config                # Full config (includes aiCrew)
```

---

This simulation system provides the transparency and control needed for confident game development, balancing, and debugging. It transforms opaque backend processes into visual, step-by-step workflows that can be inspected, tested, and verified before going live.
