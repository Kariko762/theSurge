# Inventory & Hangar System

Complete modular inventory and ship outfitting system with drag-drop UI, capacity management, and component installation.

## Features

### Inventory Management
- **Separate Storage**: Homebase (1000m³, 50,000kg) and Ship (200m³, 10,000kg)
- **Item Stacking**: Stackable materials/consumables with max stack limits
- **Capacity Tracking**: Real-time volume and weight validation
- **Bidirectional Transfers**: Ship ↔ Homebase with validation
- **Category Filters**: Weapons, Engines, Sensors, Tools, Defense, AI Cores, Crafting, Consumables

### Item Database
- **Components**: 16 ship components (weapons, engines, sensors, tools, reactors, armor, shields)
- **AI Cores**: 4 specialized AI cores (Engineer, Tactical, Researcher, Navigator)
- **Materials**: 4 crafting materials with tier progression
- **Consumables**: Fuel cells, repair kits
- **Attributes**: size_m³, weight_kg, tier, slotType, modifiers, attributes

### Hangar System
- **3 View Modes**: External (weapons/thrusters/hull), Internal (sensors/internal), Mainframe (AI cores)
- **Slot Management**: Install/uninstall components to specific slots
- **Drag-Drop Installation**: Drag components from cargo to slots
- **Ship Stats Panel**: Real-time stat calculations from installed components
- **Power Management**: Automatic power balance tracking (reactor output vs component draw)

### UI Components
- **InventoryModal**: Grid-based inventory with filters and transfers
- **ItemFrame**: Draggable item cards with tooltips showing stats/modifiers
- **HangarView**: Component installation interface with 3 view modes
- **ShipStatsPanel**: Left-side stats display with icons and modifiers

## File Structure

```
src/
├── data/
│   └── items/
│       └── itemDatabase.json          # Item definitions with stats
├── lib/
│   └── inventory/
│       └── inventoryManager.js        # Core inventory logic
└── components/
    ├── inventory/
    │   ├── InventoryModal.jsx         # Main inventory UI
    │   └── ItemFrame.jsx              # Draggable item component
    └── hangar/
        ├── HangarView.jsx             # Component installation UI
        └── ShipStatsPanel.jsx         # Ship stats display
```

## Usage

### 1. Create Inventory State

```jsx
import { createDefaultInventory } from './lib/inventory/inventoryManager';

const [inventory, setInventory] = useState(createDefaultInventory());
```

### 2. Add Starting Items

```jsx
import { addItem } from './lib/inventory/inventoryManager';

// Add components to homebase
addItem(inventory, 'homebase', 'beam_laser_mk1', 1);
addItem(inventory, 'homebase', 'mining_laser_mk1', 1);
addItem(inventory, 'homebase', 'mag_thruster_mk1', 1);
addItem(inventory, 'homebase', 'scanner_mk1', 1);
addItem(inventory, 'homebase', 'power_core_mk1', 1);
addItem(inventory, 'homebase', 'ai_core_engineer_mk1', 1);

// Add materials
addItem(inventory, 'homebase', 'scrap_metal', 50);
addItem(inventory, 'homebase', 'titanium_alloy', 20);
addItem(inventory, 'homebase', 'fuel_cell', 10);
```

### 3. Show Inventory Modal

```jsx
import InventoryModal from './components/inventory/InventoryModal';

const [showInventory, setShowInventory] = useState(false);

// In your component
{showInventory && (
  <InventoryModal
    inventory={inventory}
    setInventory={setInventory}
    location="homebase" // or "ship"
    onClose={() => setShowInventory(false)}
  />
)}
```

### 4. Show Hangar Modal

```jsx
import HangarView from './components/hangar/HangarView';

const [showHangar, setShowHangar] = useState(false);

// In your component
{showHangar && (
  <HangarView
    inventory={inventory}
    setInventory={setInventory}
    onClose={() => setShowHangar(false)}
  />
)}
```

### 5. Programmatic Operations

```jsx
import { 
  transferToShip, 
  transferToHomebase,
  installComponent,
  uninstallComponent,
  calculateShipStats
} from './lib/inventory/inventoryManager';

// Transfer item from homebase to ship
const result = transferToShip(inventory, 'item_instance_id', 1);
if (result.success) {
  console.log(result.message);
} else {
  console.error(result.error);
}

// Install component to ship slot
installComponent(inventory, 'item_instance_id', 'weapon', 0);

// Uninstall component from slot
uninstallComponent(inventory, 'weapon', 0);

// Get ship stats with installed components
const stats = calculateShipStats(inventory);
console.log('Weapons:', stats.weapons);
console.log('Power Balance:', stats.powerBalance);
console.log('Modifiers:', stats.modifiers);
```

## Item Database Schema

```json
{
  "id": "beam_laser_mk1",
  "name": "Beam Laser Mk I",
  "category": "weapon",
  "slotType": "weapon",
  "tier": 1,
  "size_m3": 12,
  "weight_kg": 450,
  "maxStack": 1,
  "attributes": {
    "damage": "1d8",
    "type": "laser",
    "powerDraw": 15
  },
  "modifiers": {
    "combatAttack": 1
  },
  "description": "Standard beam laser array."
}
```

## Ship Slots Configuration

Default ship has:
- **Weapon Slots**: 2
- **Thruster Slots**: 1
- **Sensor Slots**: 2
- **Internal Slots**: 4 (reactors, mining lasers, shields, cargo holds)
- **Hull Slots**: 1 (armor plating)
- **Mainframe Slots**: 1 (AI cores)

## Capacity Limits

- **Homebase**: 1000m³, 50,000kg
- **Ship**: 200m³, 10,000kg (base, +200m³ with cargo hold module)

## Integration with DRE

Installed components automatically provide modifiers to the DRE system:

```jsx
import { collectModifiers } from './lib/dre/modifiers';
import { calculateShipStats } from './lib/inventory/inventoryManager';

// Get ship stats
const shipStats = calculateShipStats(inventory);

// Pass to DRE
const context = {
  ship: {
    modifiers: shipStats.modifiers,
    hasComponent: (type) => Object.values(shipStats.weapons).some(w => w.includes(type))
  }
};

const modifiers = collectModifiers(context, 'mining');
```

## Example Workflow

1. **Start at Homebase** - Player opens inventory modal
2. **View Items** - Filter by category (e.g., "Weapons")
3. **Transfer to Ship** - Drag item or click "→ Ship" button
4. **Open Hangar** - Switch to hangar view
5. **Install Components** - Drag weapon to weapon slot
6. **Check Stats** - Left panel shows +1 combatAttack modifier
7. **Power Validation** - Panel warns if power draw exceeds reactor output
8. **Complete Installation** - Return to game with modified ship

## Advanced Features

### Power Management
The system tracks power balance:
- Reactors provide `powerOutput`
- Components consume `powerDraw`
- Panel shows warning if balance is negative
- DRE penalties can be applied for underpowered ships

### Dynamic Stats
Ship stats update in real-time as components are installed/uninstalled:
- Weapon damage arrays
- Thrust values
- Scan range (max of all sensors)
- Armor/shield totals
- Cargo capacity bonuses

### Modifier Aggregation
All component modifiers are collected into a single object:
```js
{
  mining: 3,        // From mining laser mk1
  combatAttack: 2,  // From weapon + targeting computer
  scavenging: 1,    // From scanner
  maxHull: 20       // From armor plating
}
```

## Future Enhancements

- **Component Damage**: Track component health, disable if broken
- **Upgrade System**: Craft higher-tier components
- **Ship Loadouts**: Save/load component configurations
- **Weight Penalties**: Reduce thrust if overweight
- **Crew Stations**: Assign crew to components for bonuses
- **Contraband Scanning**: Illegal items flagged in inventory
