// Ship State Manager
// Tracks current ship loadout, inventory, power allocation, position, and status

import { DEFAULT_SHIP_LOADOUT, DEFAULT_POWER_ALLOCATION } from './shipComponents.js';

// Ship Inventory Item Types
export const INVENTORY_TYPES = {
  COMPONENT: 'component',
  RESOURCE: 'resource',
  ARTIFACT: 'artifact',
  DATA: 'data',
  CONSUMABLE: 'consumable'
};

// Initial ship state for SS-ARKOSE (Survey Frigate)
export const INITIAL_SHIP_STATE = {
  // Ship Identity
  name: 'SS-ARKOSE',
  class: 'Survey Frigate',
  hull: 'Ronin-class Light Frame',
  
  // Current Status
  currentHull: 89,        // % of max hull
  currentShields: 78,     // % of max shields
  fuel: 84,               // % of max fuel (legacy, kept for compatibility)
  fuelPellets: 1000,      // H3-Pellets (Helium-3 fuel pellets)
  maxFuelPellets: 1200,   // Maximum H3-Pellet storage capacity
  currentVelocity: 0,     // Current ship velocity in AU/hour
  
  // Installed Components (reference IDs from shipComponents.js)
  installedComponents: [...DEFAULT_SHIP_LOADOUT],
  
  // Power Allocation per component (%)
  powerAllocation: { ...DEFAULT_POWER_ALLOCATION },
  
  // Position & Navigation
  position: {
    system: null,         // Current system seed
    distanceAU: 0,        // Distance from system origin
    angleRad: 0,          // Polar angle
    x: 0,                 // Cartesian x
    y: 0                  // Cartesian y
  },
  
  // Cargo & Inventory
  inventory: [
    { id: 'SCRAP_METAL', type: INVENTORY_TYPES.RESOURCE, name: 'Scrap Metal', quantity: 12, stackable: true },
    { id: 'PLASMA_CORE', type: INVENTORY_TYPES.COMPONENT, name: 'Plasma Core', quantity: 1, stackable: false },
    { id: 'DATA_CACHE', type: INVENTORY_TYPES.DATA, name: 'Data Cache', quantity: 3, stackable: true },
    { id: 'MEDKIT', type: INVENTORY_TYPES.CONSUMABLE, name: 'Medkit', quantity: 2, stackable: true },
    { id: 'RFE_CRYSTAL', type: INVENTORY_TYPES.RESOURCE, name: 'RFE Crystal', quantity: 5, stackable: true }
  ],
  cargoCapacity: 40,      // Max cargo slots
  cargoMass: 7.2,         // Current mass (tons)
  
  // Exploration & Scan State
  scannedPOIs: [],        // IDs of POIs revealed by scans
  visitedPOIs: [],        // IDs of POIs that have been approached/surveyed
  visitedSystems: [],     // Seeds of visited systems
  scannedSystems: ['HOMEBASE'],  // System IDs that have been scanned (HOMEBASE pre-scanned)
  activeScan: null,       // { systemId, progress: 0-100, startTime } - currently scanning system
  
  // Mission & Progress
  gEjarValeFragments: 7,  // G'ejar-Vale coordinate fragments (out of 30)
  
  // Navigation & Route Planning
  navigator: {
    plannedRoute: [],      // Array of system IDs forming the route
    currentRouteIndex: 0,  // Current position in route
    routeStats: null,      // Cached stats: { totalLY, estimatedTravelTime, systems: [] }
  },
  
  // Asteroid Mining Registry
  asteroidClusters: [],    // Discovered/registered clusters
  
  // Game Time
  gameTime: 0,            // Total game ticks elapsed
};

// Ship State Manager Class
export class ShipStateManager {
  constructor(initialState = INITIAL_SHIP_STATE) {
    this.state = { ...initialState };
  }

  // Get current ship state
  getState() {
    return { ...this.state };
  }

  // Update ship position
  setPosition(distanceAU, angleRad) {
    this.state.position = {
      ...this.state.position,
      distanceAU,
      angleRad,
      x: distanceAU * Math.cos(angleRad),
      y: distanceAU * Math.sin(angleRad)
    };
  }

  // Install component
  installComponent(componentId) {
    if (!this.state.installedComponents.includes(componentId)) {
      this.state.installedComponents.push(componentId);
      this.state.powerAllocation[componentId] = 100; // default 100%
    }
  }

  // Uninstall component
  uninstallComponent(componentId) {
    this.state.installedComponents = this.state.installedComponents.filter(id => id !== componentId);
    delete this.state.powerAllocation[componentId];
  }

  // Set power allocation for a component
  setPowerAllocation(componentId, percent) {
    if (this.state.installedComponents.includes(componentId)) {
      this.state.powerAllocation[componentId] = Math.max(0, Math.min(200, percent));
    }
  }

  // Add item to inventory
  addInventoryItem(item) {
    // Handle both 'id' and 'itemId' properties for compatibility
    const itemId = item.id || item.itemId;
    const existing = this.state.inventory.find(i => (i.id || i.itemId) === itemId);
    if (existing && (item.stackable !== false)) {
      existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
    } else {
      // Normalize to use 'id' property
      const normalizedItem = { ...item, id: itemId };
      if (item.itemId && !item.id) {
        delete normalizedItem.itemId;
      }
      this.state.inventory.push(normalizedItem);
    }
  }

  // Remove item from inventory
  removeInventoryItem(itemId, quantity = 1) {
    const item = this.state.inventory.find(i => i.id === itemId);
    if (!item) return false;
    
    if (item.stackable) {
      item.quantity -= quantity;
      if (item.quantity <= 0) {
        this.state.inventory = this.state.inventory.filter(i => i.id !== itemId);
      }
    } else {
      this.state.inventory = this.state.inventory.filter(i => i.id !== itemId);
    }
    return true;
  }

  // Mark POI as scanned
  scanPOI(poiId) {
    if (!this.state.scannedPOIs.includes(poiId)) {
      this.state.scannedPOIs.push(poiId);
    }
  }

  // Mark POI as visited (approached or interacted)
  visitPOI(poiId) {
    if (!this.state.visitedPOIs.includes(poiId)) {
      this.state.visitedPOIs.push(poiId);
    }
  }

  // Record system visit
  visitSystem(systemSeed) {
    this.state.position.system = systemSeed;
    if (!this.state.visitedSystems.includes(systemSeed)) {
      this.state.visitedSystems.push(systemSeed);
    }
  }

  // Damage ship hull
  damageHull(amount) {
    this.state.currentHull = Math.max(0, this.state.currentHull - amount);
  }

  // Damage shields
  damageShields(amount) {
    this.state.currentShields = Math.max(0, this.state.currentShields - amount);
  }

  // Repair hull
  repairHull(amount) {
    this.state.currentHull = Math.min(100, this.state.currentHull + amount);
  }

  // Recharge shields
  rechargeShields(amount) {
    this.state.currentShields = Math.min(100, this.state.currentShields + amount);
  }

  // Use fuel (legacy percentage-based)
  consumeFuel(amount) {
    this.state.fuel = Math.max(0, this.state.fuel - amount);
  }

  // Consume H3-Pellets
  consumePellets(amount) {
    this.state.fuelPellets = Math.max(0, this.state.fuelPellets - amount);
    return this.state.fuelPellets;
  }

  // Add H3-Pellets (refueling)
  addPellets(amount) {
    this.state.fuelPellets = Math.min(this.state.maxFuelPellets, this.state.fuelPellets + amount);
    return this.state.fuelPellets;
  }

  // Update current velocity
  setVelocity(velocity) {
    this.state.currentVelocity = velocity;
  }

  // Add G'ejar-Vale fragment
  addFragment() {
    this.state.gEjarValeFragments = Math.min(30, this.state.gEjarValeFragments + 1);
  }

  // Navigator: Set planned route
  setPlannedRoute(routeSystemIds, stats) {
    this.state.navigator.plannedRoute = routeSystemIds;
    this.state.navigator.currentRouteIndex = 0;
    this.state.navigator.routeStats = stats;
  }

  // Navigator: Clear route
  clearRoute() {
    this.state.navigator.plannedRoute = [];
    this.state.navigator.currentRouteIndex = 0;
    this.state.navigator.routeStats = null;
  }

  // Navigator: Advance to next system in route
  advanceRoute() {
    if (this.state.navigator.currentRouteIndex < this.state.navigator.plannedRoute.length - 1) {
      this.state.navigator.currentRouteIndex++;
      return this.state.navigator.plannedRoute[this.state.navigator.currentRouteIndex];
    }
    return null;
  }

  // Navigator: Get current destination
  getCurrentDestination() {
    if (this.state.navigator.plannedRoute.length === 0) return null;
    return this.state.navigator.plannedRoute[this.state.navigator.currentRouteIndex];
  }

  // Game Time: Update
  setGameTime(ticks) {
    this.state.gameTime = ticks;
  }

  // Scan system methods
  isSystemScanned(systemId) {
    return this.state.scannedSystems.includes(systemId);
  }

  markSystemScanned(systemId) {
    if (!this.state.scannedSystems.includes(systemId)) {
      this.state.scannedSystems.push(systemId);
    }
  }

  startScan(systemId) {
    this.state.activeScan = {
      systemId,
      progress: 0,
      startTime: Date.now()
    };
  }

  updateScanProgress(progress) {
    if (this.state.activeScan) {
      this.state.activeScan.progress = Math.min(100, Math.max(0, progress));
    }
  }

  completeScan() {
    if (this.state.activeScan) {
      const systemId = this.state.activeScan.systemId;
      this.markSystemScanned(systemId);
      this.state.activeScan = null;
      return systemId;
    }
    return null;
  }

  cancelScan() {
    this.state.activeScan = null;
  }

  // ========================================================================
  // ASTEROID MINING REGISTRY
  // ========================================================================

  /**
   * Register a newly scanned asteroid cluster
   */
  registerCluster(poiId, clusterData) {
    const cluster = {
      id: `CLUSTER_${poiId}_${Date.now()}`,
      poiId,
      ...clusterData,
      lastMined: null,
      registeredAt: this.state.gameTime
    };
    
    this.state.asteroidClusters.push(cluster);
    return cluster.id;
  }

  /**
   * Get cluster by POI ID
   */
  getClusterByPOI(poiId) {
    return this.state.asteroidClusters.find(c => c.poiId === poiId);
  }

  /**
   * Get all registered clusters
   */
  getAllClusters() {
    return [...this.state.asteroidClusters];
  }

  /**
   * Update cluster asteroid count after mining
   */
  mineClusterAsteroid(clusterId) {
    const cluster = this.state.asteroidClusters.find(c => c.id === clusterId);
    if (cluster && cluster.currentAsteroids > 0) {
      cluster.currentAsteroids--;
      cluster.lastMined = this.state.gameTime;
      return true;
    }
    return false;
  }

  /**
   * Recover asteroids based on time passed
   */
  recoverClusterAsteroids(clusterId, asteroidsRecovered) {
    const cluster = this.state.asteroidClusters.find(c => c.id === clusterId);
    if (cluster) {
      cluster.currentAsteroids = Math.min(
        cluster.maxAsteroids,
        cluster.currentAsteroids + asteroidsRecovered
      );
      return cluster.currentAsteroids;
    }
    return 0;
  }

  // ========================================================================
  // GENERAL STATE MANAGEMENT
  // ========================================================================

  // General state update
  setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  // Export state for save/persistence
  exportState() {
    return JSON.stringify(this.state);
  }

  // Import state from save
  importState(jsonString) {
    try {
      this.state = JSON.parse(jsonString);
      return true;
    } catch (e) {
      console.error('Failed to import ship state:', e);
      return false;
    }
  }
}

// Singleton instance
let shipStateInstance = null;

export function getShipState() {
  if (!shipStateInstance) {
    shipStateInstance = new ShipStateManager();
  }
  return shipStateInstance;
}

export function resetShipState() {
  shipStateInstance = new ShipStateManager();
  return shipStateInstance;
}
