# Asteroid Mining System - Implementation Plan

## Overview
Implement a persistent, repeatable asteroid cluster mining system using the Dice Resolution Engine (DRE). Clusters function as instances that can be scanned, registered, mined, and recover over time.

---

## System Architecture

### 1. **DRE Integration** (`src/lib/dre/`)

#### A. New Tables (`tables.js`)
Add weighted outcome tables for asteroid operations:

```javascript
// Cluster scan results
export const CLUSTER_SIZE = [
  { value: 'tiny', weight: 20, asteroidCount: [3, 6], label: 'Tiny Cluster' },
  { value: 'small', weight: 35, asteroidCount: [6, 12], label: 'Small Cluster' },
  { value: 'medium', weight: 30, asteroidCount: [12, 20], label: 'Medium Cluster' },
  { value: 'large', weight: 12, asteroidCount: [20, 35], label: 'Large Cluster' },
  { value: 'massive', weight: 3, asteroidCount: [35, 60], label: 'Massive Cluster' }
];

export const CLUSTER_RARITY = [
  { value: 'common', weight: 50, qualityMod: 0, label: 'Common', lootBias: 'metals' },
  { value: 'uncommon', weight: 30, qualityMod: 1, label: 'Uncommon', lootBias: 'minerals' },
  { value: 'rare', weight: 15, qualityMod: 2, label: 'Rare', lootBias: 'chemicals' },
  { value: 'exotic', weight: 4, qualityMod: 3, label: 'Exotic', lootBias: 'exotic' },
  { value: 'mythic', weight: 1, qualityMod: 5, label: 'Mythic', lootBias: 'unique', darkZoneOnly: true }
];

export const CLUSTER_RECOVERY_RATE = [
  { value: 'veryFast', weight: 10, days: 1, label: '1 day/asteroid' },
  { value: 'fast', weight: 25, days: 2, label: '2 days/asteroid' },
  { value: 'normal', weight: 40, days: 3, label: '3 days/asteroid' },
  { value: 'slow', weight: 20, days: 5, label: '5 days/asteroid' },
  { value: 'verySlow', weight: 5, days: 7, label: '7 days/asteroid' }
];

// Individual asteroid rarity when mined
export const ASTEROID_RARITY = [
  { value: 'common', weight: 50, multiplier: 1.0, label: 'Common Asteroid' },
  { value: 'uncommon', weight: 30, multiplier: 1.5, label: 'Uncommon Asteroid' },
  { value: 'rare', weight: 15, multiplier: 2.0, label: 'Rare Asteroid' },
  { value: 'exotic', weight: 4, multiplier: 3.0, label: 'Exotic Asteroid' },
  { value: 'mythic', weight: 1, multiplier: 5.0, label: 'Mythic Asteroid', darkZoneOnly: true }
];

// Loot categories per rarity
export const ASTEROID_LOOT_TYPES = {
  metals: [
    { value: 'scrapMetal', weight: 50, label: 'Scrap Metal' },
    { value: 'ironOre', weight: 30, label: 'Iron Ore' },
    { value: 'titanium', weight: 15, label: 'Titanium' },
    { value: 'platinum', weight: 4, label: 'Platinum' },
    { value: 'iridium', weight: 1, label: 'Iridium' }
  ],
  minerals: [
    { value: 'silicon', weight: 40, label: 'Silicon' },
    { value: 'carbonFiber', weight: 30, label: 'Carbon Fiber' },
    { value: 'rareEarths', weight: 20, label: 'Rare Earth Elements' },
    { value: 'crystals', weight: 8, label: 'Energy Crystals' },
    { value: 'deuterium', weight: 2, label: 'Deuterium' }
  ],
  chemicals: [
    { value: 'water', weight: 35, label: 'Water Ice' },
    { value: 'helium3', weight: 30, label: 'Helium-3' },
    { value: 'volatiles', weight: 20, label: 'Volatiles' },
    { value: 'polymers', weight: 12, label: 'Exotic Polymers' },
    { value: 'antimatter', weight: 3, label: 'Antimatter Trace' }
  ],
  exotic: [
    { value: 'darkMatter', weight: 40, label: 'Dark Matter Residue' },
    { value: 'quantumCore', weight: 30, label: 'Quantum Core' },
    { value: 'nanotech', weight: 20, label: 'Nanotech Components' },
    { value: 'xenoAlloy', weight: 8, label: 'Xenotech Alloy' },
    { value: 'precursorFragment', weight: 2, label: 'Precursor Fragment' }
  ],
  unique: [
    { value: 'aiCoreFragment', weight: 35, label: 'AI Core Fragment' },
    { value: 'ancientTech', weight: 30, label: 'Ancient Technology' },
    { value: 'warpCore', weight: 20, label: 'Damaged Warp Core' },
    { value: 'alienArtifact', weight: 10, label: 'Alien Artifact' },
    { value: 'gEjarCoordinate', weight: 5, label: "G'ejar-Vale Coordinate Fragment" }
  ]
};

// Mining hazards
export const ASTEROID_MINING_HAZARDS = [
  { value: 'none', weight: 50, damage: 0, label: 'Clean extraction' },
  { value: 'debris', weight: 25, damage: 5, label: 'Minor debris impact' },
  { value: 'unstable', weight: 15, damage: 15, label: 'Unstable rotation' },
  { value: 'collision', weight: 8, damage: 30, label: 'Collision with fragments' },
  { value: 'explosion', weight: 2, damage: 50, statusEffect: 'Mining Laser Damaged', label: 'Volatile explosion' }
];
```

#### B. New Resolution Functions (`engine.js`)

```javascript
/**
 * SCAN_CLUSTER - Initial cluster discovery and classification
 */
function resolveScanCluster(context, rng) {
  const { difficulty = 'normal', galacticZone = 'Dark' } = context;
  
  const mods = collectModifiers('mining', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total;
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  if (!success) {
    return {
      actionType: 'scanCluster',
      result: 'fail',
      totalRoll,
      targetDifficulty,
      consequences: {
        message: 'Sensor sweep inconclusive. Unable to classify cluster density.'
      }
    };
  }
  
  // Determine cluster properties
  const clusterSize = selectFromTable(CLUSTER_SIZE, rng);
  let clusterRarity = selectFromTable(CLUSTER_RARITY, rng);
  
  // Filter mythic if not dark zone
  if (clusterRarity.darkZoneOnly && galacticZone !== 'Dark') {
    clusterRarity = CLUSTER_RARITY[2]; // fallback to rare
  }
  
  const recoveryRate = selectFromTable(CLUSTER_RECOVERY_RATE, rng);
  const asteroidCount = randInt(rng, clusterSize.asteroidCount[0], clusterSize.asteroidCount[1]);
  
  return {
    actionType: 'scanCluster',
    result: 'success',
    totalRoll,
    targetDifficulty,
    clusterData: {
      size: clusterSize.value,
      sizeLabel: clusterSize.label,
      rarity: clusterRarity.value,
      rarityLabel: clusterRarity.label,
      recoveryRateDays: recoveryRate.days,
      recoveryRateLabel: recoveryRate.label,
      currentAsteroids: asteroidCount,
      maxAsteroids: asteroidCount,
      lootBias: clusterRarity.lootBias,
      qualityModifier: clusterRarity.qualityMod
    },
    consequences: {
      wakeAdded: 0.1,
      message: `Cluster classified: ${clusterSize.label}, ${clusterRarity.label} composition. ${asteroidCount} asteroids detected. Recovery rate: ${recoveryRate.label}.`
    }
  };
}

/**
 * MINE_ASTEROID - Extract resources from an asteroid
 */
function resolveMineAsteroid(context, rng) {
  const { difficulty = 'normal', cluster, galacticZone = 'Dark' } = context;
  
  const mods = collectModifiers('mining', context);
  const baseRoll = rollD20(rng);
  const totalRoll = baseRoll.value + mods.total + (cluster?.qualityModifier || 0);
  const targetDifficulty = DIFFICULTY_TDS[difficulty];
  const success = totalRoll >= targetDifficulty;
  
  // Hazard check
  const hazard = selectFromTable(ASTEROID_MINING_HAZARDS, rng);
  
  if (!success) {
    return {
      actionType: 'mineAsteroid',
      result: 'fail',
      totalRoll,
      targetDifficulty,
      secondaryRolls: { hazard },
      consequences: {
        damageTaken: hazard.damage,
        message: `Mining operation failed. ${hazard.label}.`,
        wakeAdded: 0.05,
        statusEffects: hazard.statusEffect ? [hazard.statusEffect] : []
      }
    };
  }
  
  // Determine asteroid rarity
  let asteroidRarity = selectFromTable(ASTEROID_RARITY, rng);
  if (asteroidRarity.darkZoneOnly && galacticZone !== 'Dark') {
    asteroidRarity = ASTEROID_RARITY[2]; // fallback to rare
  }
  
  // Select loot type based on cluster bias
  const lootBias = cluster?.lootBias || 'metals';
  const lootTable = ASTEROID_LOOT_TYPES[lootBias] || ASTEROID_LOOT_TYPES.metals;
  const loot = selectFromTable(lootTable, rng);
  
  // Calculate yield quantity (base 1-6, modified by asteroid rarity)
  const baseYield = rollD6(rng);
  const finalYield = Math.floor(baseYield * asteroidRarity.multiplier);
  
  return {
    actionType: 'mineAsteroid',
    result: baseRoll.isCritSuccess ? 'crit_success' : 'success',
    totalRoll,
    targetDifficulty,
    asteroidRarity: asteroidRarity.label,
    secondaryRolls: {
      hazard,
      yield: { base: baseYield, multiplier: asteroidRarity.multiplier, final: finalYield }
    },
    consequences: {
      damageTaken: hazard.damage,
      lootGained: [{ item: loot.label, quantity: finalYield }],
      statusEffects: hazard.statusEffect ? [hazard.statusEffect] : [],
      wakeAdded: 0.15,
      message: `Extracted ${finalYield}x ${loot.label} from ${asteroidRarity.label}. ${hazard.label}.`,
      asteroidConsumed: true
    }
  };
}

/**
 * ASTEROID_RECOVERY_TICK - Periodic replenishment check
 */
function resolveAsteroidRecovery(context, rng) {
  const { cluster, daysPassed } = context;
  
  if (!cluster || daysPassed < cluster.recoveryRateDays) {
    return {
      actionType: 'asteroidRecovery',
      result: 'pending',
      consequences: { recovered: 0 }
    };
  }
  
  // Calculate how many asteroids should recover
  const cyclesCompleted = Math.floor(daysPassed / cluster.recoveryRateDays);
  const asteroidsToRecover = Math.min(
    cyclesCompleted,
    cluster.maxAsteroids - cluster.currentAsteroids
  );
  
  return {
    actionType: 'asteroidRecovery',
    result: 'success',
    consequences: {
      recovered: asteroidsToRecover,
      message: asteroidsToRecover > 0 
        ? `${asteroidsToRecover} asteroid(s) replenished in cluster.`
        : 'Cluster at maximum capacity.'
    }
  };
}
```

---

### 2. **Ship State Extension** (`src/lib/shipState.js`)

Add asteroid cluster registry to ship state:

```javascript
// In INITIAL_SHIP_STATE
asteroidClusters: [],  // Discovered/registered clusters

// Add to ShipStateManager class:

/**
 * Register a newly scanned asteroid cluster
 */
registerCluster(poiId, clusterData) {
  const cluster = {
    id: `CLUSTER_${poiId}_${Date.now()}`,
    poiId,                              // Reference to belt POI
    ...clusterData,                      // size, rarity, recovery, etc.
    lastMined: null,                     // Timestamp of last mining operation
    registeredAt: this.state.gameTime    // Game time when discovered
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
```

---

### 3. **Enhanced Terminal Modal** (`src/components/TerminalModal.jsx`)

Extend modal to support interactive mining flow:

```javascript
const TerminalModal = ({ 
  isOpen, 
  onClose, 
  content = [], 
  interactive = false,
  onChoice = null,  // Callback for user choices
  choices = []      // Array of choice buttons: [{ label, value, disabled }]
}) => {
  // ... existing code ...
  
  return (
    <div>
      {/* ... existing modal structure ... */}
      
      {/* Interactive Choice Buttons (if enabled) */}
      {interactive && choices.length > 0 && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(52, 224, 255, 0.3)',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          background: 'rgba(52, 224, 255, 0.05)'
        }}>
          {choices.map((choice, idx) => (
            <button
              key={idx}
              disabled={choice.disabled}
              onClick={() => onChoice && onChoice(choice.value)}
              style={{
                padding: '8px 16px',
                background: choice.disabled 
                  ? 'rgba(100, 100, 100, 0.2)' 
                  : 'rgba(52, 224, 255, 0.2)',
                border: '1px solid rgba(52, 224, 255, 0.6)',
                borderRadius: '4px',
                color: choice.disabled ? '#888' : '#34e0ff',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: choice.disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

---

### 4. **ShipCommandConsole Integration**

Add mining workflow to ship console:

```javascript
// In ShipCommandConsole.jsx

const [miningModalState, setMiningModalState] = useState({
  isOpen: false,
  content: [],
  phase: null,  // 'scan' | 'register' | 'mine'
  cluster: null,
  choices: []
});

/**
 * Handle mining action on belt POI
 */
const handleMiningAction = async (poiId) => {
  const poi = pois.find(p => p.id === poiId);
  if (!poi || poi.type !== 'BELT') return;
  
  // Check if already registered
  const existingCluster = shipState.getClusterByPOI(poiId);
  
  if (existingCluster) {
    // Skip scan, go straight to mining
    openMiningModal(existingCluster, 'mine');
  } else {
    // Start with cluster scan
    executeScanCluster(poiId);
  }
};

/**
 * Execute SCAN_CLUSTER DRE action
 */
const executeScanCluster = (poiId) => {
  const seed = `scan_cluster_${poiId}_${Date.now()}`;
  const galacticZone = system.galactic.zone;
  
  const context = {
    difficulty: 'normal',
    galacticZone,
    ship: {
      sensors: shipAttributes.sensorRange,
      hull: currentShipState.currentHull
    }
  };
  
  const result = resolveAction('scanCluster', context, seed);
  
  if (result.result === 'success') {
    // Show scan results and offer to register
    setMiningModalState({
      isOpen: true,
      phase: 'scan',
      content: [
        { type: 'prompt', text: `> ARIA: Initiating deep scan of asteroid cluster...` },
        { type: 'normal', text: result.consequences.message },
        { type: 'success', text: `> Cluster Size: ${result.clusterData.sizeLabel}` },
        { type: 'success', text: `> Rarity: ${result.clusterData.rarityLabel}` },
        { type: 'normal', text: `> Recovery Rate: ${result.clusterData.recoveryRateLabel}` },
        { type: 'normal', text: `> Asteroid Count: ${result.clusterData.currentAsteroids} / ${result.clusterData.maxAsteroids}` },
        { type: 'normal', text: `` },
        { type: 'prompt', text: `> ARIA: Register this cluster for future mining operations?` }
      ],
      cluster: result.clusterData,
      poiId,
      choices: [
        { label: 'Register Cluster', value: 'register' },
        { label: 'Cancel', value: 'cancel' }
      ]
    });
  } else {
    // Scan failed
    setMiningModalState({
      isOpen: true,
      phase: 'scan',
      content: [
        { type: 'error', text: `> ARIA: Scan failed. ${result.consequences.message}` }
      ],
      choices: [{ label: 'Close', value: 'cancel' }]
    });
  }
};

/**
 * Handle user choice in mining modal
 */
const handleMiningChoice = (choice) => {
  const { phase, cluster, poiId } = miningModalState;
  
  switch (phase) {
    case 'scan':
      if (choice === 'register') {
        // Register cluster in ship state
        const clusterId = shipState.registerCluster(poiId, cluster);
        const registered = shipState.getClusterByPOI(poiId);
        setMiningModalState(prev => ({
          ...prev,
          content: [
            ...prev.content,
            { type: 'success', text: `> ARIA: Cluster registered in navigation database.` },
            { type: 'prompt', text: `> Begin mining operations?` }
          ],
          phase: 'register',
          cluster: registered,
          choices: [
            { label: 'Start Mining', value: 'mine' },
            { label: 'Later', value: 'cancel' }
          ]
        }));
      } else {
        setMiningModalState({ isOpen: false, content: [], phase: null, cluster: null, choices: [] });
      }
      break;
      
    case 'register':
      if (choice === 'mine') {
        openMiningModal(cluster, 'mine');
      } else {
        setMiningModalState({ isOpen: false, content: [], phase: null, cluster: null, choices: [] });
      }
      break;
      
    case 'mine':
      if (choice === 'extract') {
        executeMineAsteroid(cluster);
      } else {
        setMiningModalState({ isOpen: false, content: [], phase: null, cluster: null, choices: [] });
      }
      break;
  }
};

/**
 * Open mining interface for registered cluster
 */
const openMiningModal = (cluster, phase) => {
  setMiningModalState({
    isOpen: true,
    phase,
    cluster,
    content: [
      { type: 'prompt', text: `> ARIA: Asteroid cluster detected.` },
      { type: 'normal', text: `> Size: ${cluster.sizeLabel}` },
      { type: 'normal', text: `> Rarity: ${cluster.rarityLabel}` },
      { type: 'normal', text: `> Available Asteroids: ${cluster.currentAsteroids} / ${cluster.maxAsteroids}` },
      { type: 'normal', text: `` },
      { type: 'prompt', text: cluster.currentAsteroids > 0 
        ? `> Proceed with extraction?`
        : `> ARIA: No asteroids available. Cluster replenishes at ${cluster.recoveryRateLabel}.` 
      }
    ],
    choices: cluster.currentAsteroids > 0 
      ? [
          { label: 'Extract Asteroid', value: 'extract' },
          { label: 'Cancel', value: 'cancel' }
        ]
      : [{ label: 'Close', value: 'cancel' }]
  });
};

/**
 * Execute MINE_ASTEROID DRE action
 */
const executeMineAsteroid = (cluster) => {
  const seed = `mine_asteroid_${cluster.id}_${Date.now()}`;
  const galacticZone = system.galactic.zone;
  
  const context = {
    difficulty: 'normal',
    galacticZone,
    cluster,
    ship: {
      sensors: shipAttributes.sensorRange,
      hull: currentShipState.currentHull
    }
  };
  
  const result = resolveAction('mineAsteroid', context, seed);
  
  if (result.result === 'success' || result.result === 'crit_success') {
    // Deduct asteroid from cluster
    shipState.mineClusterAsteroid(cluster.id);
    
    // Add loot to inventory
    result.consequences.lootGained.forEach(loot => {
      shipState.addInventoryItem({
        id: loot.item.toUpperCase().replace(/\s+/g, '_'),
        type: INVENTORY_TYPES.RESOURCE,
        name: loot.item,
        quantity: loot.quantity,
        stackable: true
      });
    });
    
    // Apply damage if any
    if (result.consequences.damageTaken > 0) {
      shipState.damageHull(result.consequences.damageTaken / 10); // Scale damage
    }
    
    setShipStateVersion(v => v + 1);
    
    const updatedCluster = shipState.getClusterByPOI(cluster.poiId);
    
    setMiningModalState({
      isOpen: true,
      phase: 'mine',
      cluster: updatedCluster,
      content: [
        { type: 'prompt', text: `> ARIA: Mining laser engaged...` },
        { type: 'success', text: `> ${result.asteroidRarity} successfully extracted!` },
        { type: 'success', text: `> Loot: ${result.consequences.lootGained.map(l => `${l.quantity}x ${l.item}`).join(', ')}` },
        result.consequences.damageTaken > 0 
          ? { type: 'warning', text: `> Hull damage: ${result.consequences.damageTaken}%` }
          : null,
        { type: 'normal', text: `` },
        { type: 'normal', text: `> Remaining asteroids: ${updatedCluster.currentAsteroids} / ${updatedCluster.maxAsteroids}` },
        { type: 'prompt', text: updatedCluster.currentAsteroids > 0 ? `> Continue mining?` : `> ARIA: Cluster depleted. Returns in ${updatedCluster.recoveryRateDays} days.` }
      ].filter(Boolean),
      choices: updatedCluster.currentAsteroids > 0
        ? [
            { label: 'Extract Another', value: 'extract' },
            { label: 'Finish', value: 'cancel' }
          ]
        : [{ label: 'Close', value: 'cancel' }]
    });
  } else {
    // Mining failed
    if (result.consequences.damageTaken > 0) {
      shipState.damageHull(result.consequences.damageTaken / 10);
      setShipStateVersion(v => v + 1);
    }
    
    setMiningModalState(prev => ({
      ...prev,
      content: [
        ...prev.content,
        { type: 'error', text: `> ${result.consequences.message}` }
      ],
      choices: [{ label: 'Close', value: 'cancel' }]
    }));
  }
};

// Render modal
<TerminalModal
  isOpen={miningModalState.isOpen}
  onClose={() => setMiningModalState({ isOpen: false, content: [], phase: null, cluster: null, choices: [] })}
  content={miningModalState.content}
  interactive={true}
  onChoice={handleMiningChoice}
  choices={miningModalState.choices}
/>
```

---

### 5. **Recovery System** (Time-based)

Add periodic recovery check (triggered on game time updates or system entry):

```javascript
// In ShipCommandConsole or gameTime manager

/**
 * Check all registered clusters for asteroid recovery
 */
const checkClusterRecovery = () => {
  const currentTime = shipState.getState().gameTime;
  const clusters = shipState.getState().asteroidClusters;
  
  clusters.forEach(cluster => {
    if (cluster.currentAsteroids >= cluster.maxAsteroids) return;
    if (!cluster.lastMined) return;
    
    const daysPassed = Math.floor((currentTime - cluster.lastMined) / (24 * 60 * 60)); // Convert to days
    
    if (daysPassed >= cluster.recoveryRateDays) {
      const seed = `recovery_${cluster.id}_${currentTime}`;
      const rng = makeRng(seed);
      const result = resolveAsteroidRecovery({ cluster, daysPassed }, rng);
      
      if (result.consequences.recovered > 0) {
        shipState.recoverClusterAsteroids(cluster.id, result.consequences.recovered);
        setTerminalLog(prev => [
          ...prev,
          `> ARIA: ${result.consequences.message} (Cluster ${cluster.poiId})`
        ]);
      }
    }
  });
};

// Call on system entry or periodic game tick
useEffect(() => {
  checkClusterRecovery();
}, [system]);
```

---

## Implementation Order

1. **Phase 1: DRE Foundation**
   - Add tables to `tables.js`
   - Implement resolution functions in `engine.js`
   - Test with standalone calls

2. **Phase 2: State Management**
   - Extend `shipState.js` with cluster registry
   - Add cluster CRUD methods
   - Test persistence

3. **Phase 3: UI Integration**
   - Enhance `TerminalModal.jsx` for interactivity
   - Wire mining actions to `ShipCommandConsole.jsx`
   - Test scan → register → mine flow

4. **Phase 4: Recovery System**
   - Implement time-based recovery logic
   - Add periodic checks
   - Test long-term cluster replenishment

5. **Phase 5: Polish**
   - Add ARIA voice lines
   - Visual feedback for mining operations
   - Balance loot tables and recovery rates

---

## Data Flow

```
User clicks Belt POI → 
  Check if registered → 
    NO: Run SCAN_CLUSTER → Show results → Register? →
      YES: Save to shipState → Open mining modal
      NO: Close
    YES: Open mining modal directly
      
Mining Modal Open →
  Asteroids available? →
    YES: Show "Extract" button → User clicks →
      Run MINE_ASTEROID → Update cluster count → Add loot → Show results →
        More asteroids? → Loop or Close
    NO: Show "Depleted" message → Close
```

---

## Testing Checklist

- [ ] Scan cluster (success/fail)
- [ ] Register cluster persistence
- [ ] Mine asteroid (success/fail/crit)
- [ ] Cluster depletion (0 asteroids)
- [ ] Recovery tick (time-based)
- [ ] Multiple clusters in same system
- [ ] Loot type distribution
- [ ] Damage application
- [ ] Dark zone mythic spawns
- [ ] UI state management
- [ ] ARIA narration flow

---

## Future Enhancements

- **Cluster Upgrades**: Install mining drones for passive income
- **Mining Efficiency**: Ship component upgrades affect yield
- **Cluster Events**: Random events (pirates, discoveries)
- **Visual Mining**: Animated laser effects on map
- **Cluster Trading**: Sell cluster coordinates to NPCs
- **Competitive Mining**: Other ships also mine clusters
