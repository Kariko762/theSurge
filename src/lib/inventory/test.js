/**
 * Inventory System Test Suite
 * 
 * Tests all inventory operations: adding, removing, transferring, installing components
 */

import {
  createDefaultInventory,
  addItem,
  removeItem,
  transferToShip,
  transferToHomebase,
  installComponent,
  uninstallComponent,
  calculateShipStats,
  getInventorySummary,
  getInstalledComponents
} from './inventoryManager.js';

console.log('🧪 INVENTORY SYSTEM TEST SUITE\n');
console.log('='.repeat(60));

// Test 1: Create default inventory
console.log('\n📦 Test 1: Create Default Inventory');
const inventory = createDefaultInventory();
console.log('✓ Homebase capacity:', inventory.homebase.capacity_m3, 'm³');
console.log('✓ Ship capacity:', inventory.ship.capacity_m3, 'm³');
console.log('✓ Ship weapon slots:', inventory.ship.slots.weapon);

// Test 2: Add items to homebase
console.log('\n📦 Test 2: Add Items to Homebase');
let result = addItem(inventory, 'homebase', 'beam_laser_mk1', 1);
console.log('✓ Added beam_laser_mk1:', result.message);

result = addItem(inventory, 'homebase', 'mining_laser_mk1', 1);
console.log('✓ Added mining_laser_mk1:', result.message);

result = addItem(inventory, 'homebase', 'mag_thruster_mk1', 1);
console.log('✓ Added mag_thruster_mk1:', result.message);

result = addItem(inventory, 'homebase', 'scanner_mk1', 1);
console.log('✓ Added scanner_mk1:', result.message);

result = addItem(inventory, 'homebase', 'power_core_mk1', 1);
console.log('✓ Added power_core_mk1:', result.message);

result = addItem(inventory, 'homebase', 'ai_core_engineer_mk1', 1);
console.log('✓ Added ai_core_engineer_mk1:', result.message);

result = addItem(inventory, 'homebase', 'scrap_metal', 50);
console.log('✓ Added scrap_metal x50:', result.message);

result = addItem(inventory, 'homebase', 'titanium_alloy', 25);
console.log('✓ Added titanium_alloy x25:', result.message);

// Test 3: Check homebase summary
console.log('\n📦 Test 3: Homebase Inventory Summary');
const homebaseSummary = getInventorySummary(inventory, 'homebase');
console.log('✓ Total items:', homebaseSummary.itemCount);
console.log('✓ Volume used:', homebaseSummary.totalVolume_m3.toFixed(1), 'm³');
console.log('✓ Weight:', homebaseSummary.totalWeight_kg.toFixed(0), 'kg');
console.log('✓ Capacity:', homebaseSummary.volumePercent.toFixed(1), '%');

// Test 4: Transfer items to ship
console.log('\n🚀 Test 4: Transfer Items to Ship');
const laserInstance = Object.keys(inventory.homebase.items)[0]; // First item
result = transferToShip(inventory, laserInstance, 1);
console.log('✓ Transferred to ship:', result.message);

const thrusterInstance = Object.keys(inventory.homebase.items).find(
  key => inventory.homebase.items[key].id === 'mag_thruster_mk1'
);
result = transferToShip(inventory, thrusterInstance, 1);
console.log('✓ Transferred to ship:', result.message);

const scannerInstance = Object.keys(inventory.homebase.items).find(
  key => inventory.homebase.items[key].id === 'scanner_mk1'
);
result = transferToShip(inventory, scannerInstance, 1);
console.log('✓ Transferred to ship:', result.message);

const reactorInstance = Object.keys(inventory.homebase.items).find(
  key => inventory.homebase.items[key].id === 'power_core_mk1'
);
result = transferToShip(inventory, reactorInstance, 1);
console.log('✓ Transferred to ship:', result.message);

const aiInstance = Object.keys(inventory.homebase.items).find(
  key => inventory.homebase.items[key].id === 'ai_core_engineer_mk1'
);
result = transferToShip(inventory, aiInstance, 1);
console.log('✓ Transferred to ship:', result.message);

// Test 5: Check ship summary
console.log('\n🚀 Test 5: Ship Inventory Summary');
const shipSummary = getInventorySummary(inventory, 'ship');
console.log('✓ Total items:', shipSummary.itemCount);
console.log('✓ Volume used:', shipSummary.totalVolume_m3.toFixed(1), 'm³');
console.log('✓ Weight:', shipSummary.totalWeight_kg.toFixed(0), 'kg');

// Test 6: Install components
console.log('\n🔧 Test 6: Install Components to Ship Slots');
const shipLaserInstance = Object.keys(inventory.ship.items).find(
  key => inventory.ship.items[key].id === 'beam_laser_mk1'
);
result = installComponent(inventory, shipLaserInstance, 'weapon', 0);
console.log('✓ Installed weapon:', result.message);

const shipThrusterInstance = Object.keys(inventory.ship.items).find(
  key => inventory.ship.items[key].id === 'mag_thruster_mk1'
);
result = installComponent(inventory, shipThrusterInstance, 'thruster', 0);
console.log('✓ Installed thruster:', result.message);

const shipScannerInstance = Object.keys(inventory.ship.items).find(
  key => inventory.ship.items[key].id === 'scanner_mk1'
);
result = installComponent(inventory, shipScannerInstance, 'sensor', 0);
console.log('✓ Installed sensor:', result.message);

const shipReactorInstance = Object.keys(inventory.ship.items).find(
  key => inventory.ship.items[key].id === 'power_core_mk1'
);
result = installComponent(inventory, shipReactorInstance, 'internal', 0);
console.log('✓ Installed reactor:', result.message);

const shipAIInstance = Object.keys(inventory.ship.items).find(
  key => inventory.ship.items[key].id === 'ai_core_engineer_mk1'
);
result = installComponent(inventory, shipAIInstance, 'mainframe', 0);
console.log('✓ Installed AI core:', result.message);

// Test 7: Check installed components
console.log('\n🔧 Test 7: List Installed Components');
const weaponComps = getInstalledComponents(inventory, 'weapon');
console.log('✓ Weapon slots filled:', weaponComps.length);

const thrusterComps = getInstalledComponents(inventory, 'thruster');
console.log('✓ Thruster slots filled:', thrusterComps.length);

const sensorComps = getInstalledComponents(inventory, 'sensor');
console.log('✓ Sensor slots filled:', sensorComps.length);

const internalComps = getInstalledComponents(inventory, 'internal');
console.log('✓ Internal slots filled:', internalComps.length);

const mainframeComps = getInstalledComponents(inventory, 'mainframe');
console.log('✓ Mainframe slots filled:', mainframeComps.length);

// Test 8: Calculate ship stats
console.log('\n📊 Test 8: Calculate Ship Stats');
const stats = calculateShipStats(inventory);
console.log('✓ Weapons:', stats.weapons);
console.log('✓ Thrust:', stats.thrust);
console.log('✓ Power Output:', stats.powerOutput);
console.log('✓ Power Draw:', stats.powerDraw);
console.log('✓ Power Balance:', stats.powerBalance);
console.log('✓ Scan Range:', stats.scanRange);
console.log('✓ Cargo Capacity:', stats.cargoCapacity_m3, 'm³');
console.log('✓ Modifiers:', stats.modifiers);

// Test 9: Uninstall component
console.log('\n🔧 Test 9: Uninstall Component');
result = uninstallComponent(inventory, 'weapon', 0);
console.log('✓ Uninstalled:', result.message);

const weaponCompsAfter = getInstalledComponents(inventory, 'weapon');
console.log('✓ Weapon slots filled after uninstall:', weaponCompsAfter.length);

// Test 10: Transfer back to homebase
console.log('\n📦 Test 10: Transfer Back to Homebase');
const uninstalledWeapon = Object.keys(inventory.ship.items).find(
  key => inventory.ship.items[key].id === 'beam_laser_mk1'
);
result = transferToHomebase(inventory, uninstalledWeapon, 1);
console.log('✓ Transferred to homebase:', result.message);

// Test 11: Try to transfer installed component (should fail)
console.log('\n⚠️  Test 11: Try to Transfer Installed Component (Should Fail)');
result = transferToHomebase(inventory, shipThrusterInstance, 1);
if (!result.success) {
  console.log('✓ Correctly blocked:', result.error);
} else {
  console.log('✗ ERROR: Should not allow transfer of installed component');
}

// Test 12: Capacity overflow test
console.log('\n⚠️  Test 12: Test Capacity Limits');
// Try to add huge item
result = addItem(inventory, 'ship', 'hull_plating_mk1', 10);
if (!result.success) {
  console.log('✓ Correctly blocked overflow:', result.error);
} else {
  console.log('✗ ERROR: Should not allow capacity overflow');
}

// Test 13: Invalid slot type
console.log('\n⚠️  Test 13: Try Invalid Slot Type (Should Fail)');
result = installComponent(inventory, shipReactorInstance, 'weapon', 0);
if (!result.success) {
  console.log('✓ Correctly blocked:', result.error);
} else {
  console.log('✗ ERROR: Should not allow wrong slot type');
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 FINAL INVENTORY STATE\n');

const finalHomebaseSummary = getInventorySummary(inventory, 'homebase');
const finalShipSummary = getInventorySummary(inventory, 'ship');
const finalStats = calculateShipStats(inventory);

console.log('🏠 HOMEBASE:');
console.log('   Items:', finalHomebaseSummary.itemCount);
console.log('   Volume:', finalHomebaseSummary.totalVolume_m3.toFixed(1), '/', finalHomebaseSummary.capacity_m3, 'm³');
console.log('   Weight:', finalHomebaseSummary.totalWeight_kg.toFixed(0), '/', finalHomebaseSummary.maxWeight_kg, 'kg');

console.log('\n🚀 SHIP:');
console.log('   Cargo Items:', finalShipSummary.itemCount);
console.log('   Volume:', finalShipSummary.totalVolume_m3.toFixed(1), '/', finalShipSummary.capacity_m3, 'm³');
console.log('   Weight:', finalShipSummary.totalWeight_kg.toFixed(0), '/', finalShipSummary.maxWeight_kg, 'kg');

console.log('\n🔧 INSTALLED COMPONENTS:');
Object.entries(inventory.ship.installedComponents).forEach(([slotType, comps]) => {
  if (comps.length > 0) {
    console.log(`   ${slotType}: ${comps.length}/${inventory.ship.slots[slotType]}`);
    comps.forEach(comp => {
      const item = inventory.ship.items[comp.instanceId];
      console.log(`      - Slot ${comp.slotIndex}: ${item?.name || comp.itemId}`);
    });
  }
});

console.log('\n📊 SHIP STATS:');
console.log('   Weapons:', finalStats.weapons.join(', ') || 'None');
console.log('   Thrust:', finalStats.thrust);
console.log('   Power:', finalStats.powerOutput, '/', finalStats.powerDraw, '(Balance:', finalStats.powerBalance + ')');
console.log('   Scan Range:', finalStats.scanRange);
console.log('   Armor:', finalStats.armor);
console.log('   Shields:', finalStats.shields);
console.log('   Cargo:', finalStats.cargoCapacity_m3, 'm³');

console.log('\n⚙️  MODIFIERS:');
Object.entries(finalStats.modifiers).forEach(([key, value]) => {
  console.log(`   ${key}: ${value > 0 ? '+' : ''}${value}`);
});

console.log('\n✅ ALL TESTS COMPLETED\n');
