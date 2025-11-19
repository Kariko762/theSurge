/**
 * Inventory Manager (Browser Version)
 * 
 * Browser-compatible version for React components.
 * Uses JSON import instead of fs.readFileSync.
 */

import itemDatabaseRaw from '../../data/items/itemDatabase.json';

const itemDatabase = itemDatabaseRaw;

// Generate unique instance IDs for items
let instanceCounter = 0;
export function generateInstanceId() {
  return `item_${Date.now()}_${instanceCounter++}`;
}

// Get all items from database
export function getAllItems() {
  return {
    ...itemDatabase.components,
    ...itemDatabase.aiCores,
    ...itemDatabase.materials
  };
}

// Get item definition from database
export function getItemDefinition(itemId) {
  const allItems = getAllItems();
  return allItems[itemId] || null;
}

// Calculate total volume in inventory
export function calculateTotalVolume(items) {
  return Object.values(items).reduce((total, item) => {
    return total + (item.size_m3 * item.quantity);
  }, 0);
}

// Calculate total weight in inventory
export function calculateTotalWeight(items) {
  return Object.values(items).reduce((total, item) => {
    return total + (item.weight_kg * item.quantity);
  }, 0);
}

// Add item to inventory
export function addItem(inventory, location, itemId, quantity = 1) {
  const itemDef = getItemDefinition(itemId);
  if (!itemDef) {
    return { success: false, error: 'Item not found in database' };
  }

  const targetInventory = location === 'ship' ? inventory.ship : inventory.homebase;
  
  // Check if item already exists (for stackable items)
  const existingItem = Object.values(targetInventory.items).find(
    item => item.id === itemId
  );

  if (existingItem && existingItem.maxStack > 1) {
    // Stack with existing
    const newQuantity = Math.min(existingItem.quantity + quantity, existingItem.maxStack);
    const overflow = (existingItem.quantity + quantity) - newQuantity;
    
    existingItem.quantity = newQuantity;
    
    if (overflow > 0) {
      return { 
        success: true, 
        overflow, 
        message: `Added ${quantity - overflow}, ${overflow} overflow` 
      };
    }
  } else {
    // Create new item instance
    const instanceId = generateInstanceId();
    const newVolume = calculateTotalVolume(targetInventory.items) + (itemDef.size_m3 * quantity);
    const newWeight = calculateTotalWeight(targetInventory.items) + (itemDef.weight_kg * quantity);

    // Check capacity
    if (newVolume > targetInventory.capacity_m3) {
      return { success: false, error: 'Insufficient cargo space (m³)' };
    }
    if (newWeight > targetInventory.maxWeight_kg) {
      return { success: false, error: 'Exceeds weight limit (kg)' };
    }

    targetInventory.items[instanceId] = {
      ...itemDef,
      quantity: Math.min(quantity, itemDef.maxStack),
      instanceId
    };
  }

  return { success: true, message: `Added ${quantity}x ${itemDef.name}` };
}

// Remove item from inventory
export function removeItem(inventory, location, instanceId, quantity = 1) {
  const targetInventory = location === 'ship' ? inventory.ship : inventory.homebase;
  const item = targetInventory.items[instanceId];

  if (!item) {
    return { success: false, error: 'Item not found in inventory' };
  }

  if (item.quantity <= quantity) {
    // Remove entire stack
    delete targetInventory.items[instanceId];
    return { success: true, message: `Removed ${item.name}` };
  } else {
    // Reduce quantity
    item.quantity -= quantity;
    return { success: true, message: `Removed ${quantity}x ${item.name}` };
  }
}

// Transfer item from ship to homebase
export function transferToHomebase(inventory, instanceId, quantity = 1) {
  const shipItem = inventory.ship.items[instanceId];
  if (!shipItem) {
    return { success: false, error: 'Item not found in ship inventory' };
  }

  // Check if item is installed
  const isInstalled = Object.values(inventory.ship.installedComponents).some(
    slotArray => slotArray.some(comp => comp.instanceId === instanceId)
  );

  if (isInstalled) {
    return { success: false, error: 'Cannot transfer installed component. Uninstall first.' };
  }

  // Calculate homebase capacity
  const newVolume = calculateTotalVolume(inventory.homebase.items) + (shipItem.size_m3 * quantity);
  const newWeight = calculateTotalWeight(inventory.homebase.items) + (shipItem.weight_kg * quantity);

  if (newVolume > inventory.homebase.capacity_m3) {
    return { success: false, error: 'Homebase cargo full (m³)' };
  }
  if (newWeight > inventory.homebase.maxWeight_kg) {
    return { success: false, error: 'Homebase weight limit exceeded' };
  }

  // Remove from ship
  const removeResult = removeItem(inventory, 'ship', instanceId, quantity);
  if (!removeResult.success) return removeResult;

  // Add to homebase
  return addItem(inventory, 'homebase', shipItem.id, quantity);
}

// Transfer item from homebase to ship
export function transferToShip(inventory, instanceId, quantity = 1) {
  const homebaseItem = inventory.homebase.items[instanceId];
  if (!homebaseItem) {
    return { success: false, error: 'Item not found in homebase inventory' };
  }

  // Calculate ship capacity
  const newVolume = calculateTotalVolume(inventory.ship.items) + (homebaseItem.size_m3 * quantity);
  const newWeight = calculateTotalWeight(inventory.ship.items) + (homebaseItem.weight_kg * quantity);

  if (newVolume > inventory.ship.capacity_m3) {
    return { success: false, error: 'Ship cargo full (m³)' };
  }
  if (newWeight > inventory.ship.maxWeight_kg) {
    return { success: false, error: 'Ship weight limit exceeded' };
  }

  // Remove from homebase
  const removeResult = removeItem(inventory, 'homebase', instanceId, quantity);
  if (!removeResult.success) return removeResult;

  // Add to ship
  return addItem(inventory, 'ship', homebaseItem.id, quantity);
}

// Install component to ship slot
export function installComponent(inventory, instanceId, slotType, slotIndex = 0) {
  const shipItem = inventory.ship.items[instanceId];
  if (!shipItem) {
    return { success: false, error: 'Component not found in ship inventory' };
  }

  if (shipItem.slotType !== slotType) {
    return { success: false, error: `Component requires ${shipItem.slotType} slot` };
  }

  const availableSlots = inventory.ship.slots[slotType] || 0;
  const installedInSlot = inventory.ship.installedComponents[slotType] || [];

  if (slotIndex >= availableSlots) {
    return { success: false, error: `Slot index ${slotIndex} exceeds available ${slotType} slots` };
  }

  // Check if slot is occupied
  const existingComponent = installedInSlot.find(comp => comp.slotIndex === slotIndex);
  if (existingComponent) {
    return { success: false, error: `Slot ${slotIndex} already occupied. Uninstall first.` };
  }

  // Install component
  if (!inventory.ship.installedComponents[slotType]) {
    inventory.ship.installedComponents[slotType] = [];
  }

  inventory.ship.installedComponents[slotType].push({
    itemId: shipItem.id,
    instanceId: instanceId,
    slotIndex: slotIndex
  });

  return { success: true, message: `Installed ${shipItem.name} to ${slotType} slot ${slotIndex}` };
}

// Uninstall component from ship slot
export function uninstallComponent(inventory, slotType, slotIndex) {
  const installedComponents = inventory.ship.installedComponents[slotType] || [];
  const componentIndex = installedComponents.findIndex(comp => comp.slotIndex === slotIndex);

  if (componentIndex === -1) {
    return { success: false, error: `No component in ${slotType} slot ${slotIndex}` };
  }

  const component = installedComponents[componentIndex];
  inventory.ship.installedComponents[slotType].splice(componentIndex, 1);

  const itemDef = getItemDefinition(component.itemId);
  return { 
    success: true, 
    message: `Uninstalled ${itemDef?.name || 'component'} from ${slotType} slot ${slotIndex}`,
    instanceId: component.instanceId
  };
}

// Get installed components by slot type
export function getInstalledComponents(inventory, slotType = null) {
  if (slotType) {
    return inventory.ship.installedComponents[slotType] || [];
  }
  return inventory.ship.installedComponents;
}

// Calculate ship stats from installed components
export function calculateShipStats(inventory) {
  const stats = {
    weapons: [],
    totalDamage: 0,
    thrust: 0,
    powerOutput: 0,
    powerDraw: 0,
    scanRange: 0,
    armor: 0,
    shields: 0,
    cargoCapacity_m3: 200, // Base capacity
    modifiers: {}
  };

  // Iterate through all installed components
  Object.entries(inventory.ship.installedComponents).forEach(([slotType, components]) => {
    components.forEach(comp => {
      const itemDef = getItemDefinition(comp.itemId);
      if (!itemDef) return;

      // Aggregate attributes
      if (itemDef.attributes) {
        if (itemDef.attributes.damage) stats.weapons.push(itemDef.attributes.damage);
        if (itemDef.attributes.thrust) stats.thrust += itemDef.attributes.thrust;
        if (itemDef.attributes.powerOutput) stats.powerOutput += itemDef.attributes.powerOutput;
        if (itemDef.attributes.powerDraw) stats.powerDraw += itemDef.attributes.powerDraw;
        if (itemDef.attributes.scanRange) stats.scanRange = Math.max(stats.scanRange, itemDef.attributes.scanRange);
        if (itemDef.attributes.armorBonus) stats.armor += itemDef.attributes.armorBonus;
        if (itemDef.attributes.shieldCapacity) stats.shields += itemDef.attributes.shieldCapacity;
        if (itemDef.attributes.capacityBonus_m3) stats.cargoCapacity_m3 += itemDef.attributes.capacityBonus_m3;
      }

      // Aggregate modifiers
      if (itemDef.modifiers) {
        Object.entries(itemDef.modifiers).forEach(([key, value]) => {
          stats.modifiers[key] = (stats.modifiers[key] || 0) + value;
        });
      }
    });
  });

  stats.powerBalance = stats.powerOutput - stats.powerDraw;

  return stats;
}

// Create default inventory state
export function createDefaultInventory() {
  return {
    homebase: {
      items: {},
      capacity_m3: 1000,
      maxWeight_kg: 50000
    },
    ship: {
      items: {},
      capacity_m3: 200,
      maxWeight_kg: 10000,
      installedComponents: {
        weapon: [],
        thruster: [],
        sensor: [],
        internal: [],
        hull: [],
        mainframe: []
      },
      slots: {
        weapon: 2,
        thruster: 1,
        sensor: 2,
        internal: 4,
        hull: 1,
        mainframe: 1
      }
    }
  };
}

// Get inventory summary (for UI display)
export function getInventorySummary(inventory, location) {
  const targetInventory = location === 'ship' ? inventory.ship : inventory.homebase;
  
  return {
    itemCount: Object.keys(targetInventory.items).length,
    totalVolume_m3: calculateTotalVolume(targetInventory.items),
    totalWeight_kg: calculateTotalWeight(targetInventory.items),
    capacity_m3: targetInventory.capacity_m3,
    maxWeight_kg: targetInventory.maxWeight_kg,
    volumePercent: (calculateTotalVolume(targetInventory.items) / targetInventory.capacity_m3) * 100,
    weightPercent: (calculateTotalWeight(targetInventory.items) / targetInventory.maxWeight_kg) * 100
  };
}
