# System Generation Refactor - Config-Driven POI Generation

## Goal
Transform the solar system generation from hard-coded POI types to a fully config-driven system that reads from the POI Library (backend data). This allows designers to control:
- **Number of POIs** per system (via rarity weights and maxCount)
- **Orbital placement** (via orbitRadiusMin/Max ranges)
- **POI variety** (via POI library definitions)

---

## Current State

### Hard-Coded System (systemGeneratorV2.js)
- POI types defined in `systemGenerator.config.json`
- Fixed weights, size ranges, distance ranges
- No connection to Admin Panel POI Library
- Orbitals are hard-coded station/moon types

### POI Library (backend/data/poi_library.json)
- Contains rich POI definitions with:
  - `rarity` (spawn weight 0-100)
  - `maxCount` (max instances per system)
  - `orbitRadiusMin/Max` (orbit placement range in AU)
  - `orbitSpeed` (animation/movement speed)
  - `orbitType` (circular, elliptical, eccentric, none)
  - `tierMultiplier` (difficulty scaling)
  - `imagePool` (visual asset reference)
- **Currently not used by generator**

---

## Architecture Plan

### Phase 1: POI Library Loader (Frontend)

**Create:** `src/lib/poiLibraryLoader.js`

```javascript
/**
 * Load POI library from backend and transform into generator format
 */
export async function loadPOILibrary() {
  try {
    const response = await fetch('http://localhost:3002/api/poi-library');
    const data = await response.json();
    
    if (!data.success) {
      console.error('Failed to load POI library:', data.message);
      return getDefaultPOIConfig();
    }
    
    return transformPOILibrary(data.pois);
  } catch (error) {
    console.error('Error loading POI library:', error);
    return getDefaultPOIConfig();
  }
}

/**
 * Transform backend POI library into generator config format
 */
function transformPOILibrary(libraryPOIs) {
  const config = {
    poiTypes: {},
    orbitalTypes: []
  };
  
  for (const poi of libraryPOIs) {
    // Convert POI library format to generator format
    config.poiTypes[poi.type] = {
      id: poi.id,
      name: poi.name,
      weight: poi.rarity || 10,
      sizeRange: getSizeRange(poi.size), // Convert 'Large', 'Medium', 'Small' to numbers
      minDistance: poi.orbitRadiusMin || 5,
      maxDistance: poi.orbitRadiusMax || 100,
      maxCount: poi.maxCount || 5,
      canHaveOrbitals: poi.type === 'PLANET' || poi.type === 'HABITAT',
      orbitalProbability: 0.6,
      maxOrbitals: 3,
      orbitType: poi.orbitType || 'circular',
      orbitSpeed: poi.orbitSpeed || 1,
      tierMultiplier: poi.tierMultiplier || 1,
      imagePool: poi.imagePool || '',
      isOrbital: poi.parentId !== null // POIs with parents are orbital-only
    };
    
    // Track orbital types
    if (poi.type === 'STATION' || poi.type === 'MOON') {
      config.orbitalTypes.push(poi.type);
    }
  }
  
  return config;
}

/**
 * Convert size string to numeric range
 */
function getSizeRange(sizeStr) {
  const sizes = {
    'Large': [12, 20],
    'Medium': [6, 12],
    'Small': [3, 8]
  };
  return sizes[sizeStr] || [6, 12];
}

/**
 * Fallback default config if library can't be loaded
 */
function getDefaultPOIConfig() {
  return {
    poiTypes: {
      PLANET: {
        id: 'POI_PLANET_DEFAULT',
        name: 'Procedural Planet',
        weight: 60,
        sizeRange: [8, 20],
        minDistance: 5,
        maxDistance: 80,
        maxCount: 8,
        canHaveOrbitals: true,
        orbitalProbability: 0.7,
        maxOrbitals: 4
      },
      BELT: {
        id: 'POI_BELT_DEFAULT',
        name: 'Asteroid Belt',
        weight: 30,
        sizeRange: [15, 30],
        minDistance: 20,
        maxDistance: 100,
        maxCount: 2,
        canHaveOrbitals: false
      }
      // ... other defaults
    },
    orbitalTypes: ['STATION', 'MOON']
  };
}
```

---

### Phase 2: Update systemGeneratorV2.js

**Changes:**
1. Import POI library loader
2. Accept POI config as parameter (optional, falls back to default)
3. Respect `maxCount` per POI type
4. Use `rarity` as weight for type selection
5. Use `orbitRadiusMin/Max` instead of fixed ranges

**Modified generatePOIs() function:**

```javascript
function generatePOIs(rng, maxRadius, poiConfig) {
  const pois = [];
  let poiIndex = 0;
  const typeCounters = {}; // Track how many of each type we've created
  
  // Determine total number of POIs
  const minPOIs = 8;
  const maxPOIs = 20;
  const targetPOICount = randInt(rng, minPOIs, maxPOIs);
  
  // Create weighted POI type selection from loaded config
  const poiTypeWeights = Object.entries(poiConfig.poiTypes)
    .filter(([type, cfg]) => !cfg.isOrbital) // Exclude orbital-only types
    .map(([type, cfg]) => [type, cfg.weight]);
  
  const attempts = targetPOICount * 10;
  
  for (let attempt = 0; attempt < attempts && pois.length < targetPOICount; attempt++) {
    // Pick POI type
    const type = weighted(poiTypeWeights, rng);
    const typeConfig = poiConfig.poiTypes[type];
    
    // Check maxCount limit
    if (typeCounters[type] >= typeConfig.maxCount) continue;
    
    // Roll distance within valid range for this type
    const minDist = Math.max(typeConfig.minDistance, 5);
    const maxDist = Math.min(typeConfig.maxDistance, maxRadius);
    
    if (minDist >= maxDist) continue;
    
    // ... rest of generation logic ...
    
    // Increment type counter
    typeCounters[type] = (typeCounters[type] || 0) + 1;
  }
  
  return pois;
}
```

---

### Phase 3: Integration with ShipCommandConsole

**Update:** `src/components/ShipCommandConsole.jsx`

```javascript
import { generateSystemV2, flattenPOIs } from '../lib/systemGeneratorV2.js';
import { loadPOILibrary } from '../lib/poiLibraryLoader.js';

// In component initialization
useEffect(() => {
  async function loadConfig() {
    const poiConfig = await loadPOILibrary();
    setPoiConfig(poiConfig);
  }
  loadConfig();
}, []);

// When generating system
const handleGenerateSystem = () => {
  if (!poiConfig) {
    console.warn('POI config not loaded yet, using defaults');
  }
  const generated = generateSystemV2(seedInput, poiConfig);
  setSystem(generated);
};
```

---

## Data Flow Diagram

```
┌──────────────────────┐
│ Backend POI Library  │
│ poi_library.json     │
└──────────┬───────────┘
           │
           │ HTTP GET /api/poi-library
           ▼
┌──────────────────────┐
│ poiLibraryLoader.js  │
│ transformPOILibrary()│
└──────────┬───────────┘
           │
           │ Returns config object
           ▼
┌──────────────────────┐
│ systemGeneratorV2.js │
│ generateSystemV2()   │
└──────────┬───────────┘
           │
           │ Returns system object with POIs
           ▼
┌──────────────────────┐
│ ShipCommandConsole   │
│ Renders solar system │
└──────────────────────┘
```

---

## Benefits

### For Designers (Admin Panel)
✅ **Full control over POI variety** - Add new POI types without touching code
✅ **Adjust spawn rates** - Change rarity values to make POIs more/less common
✅ **Control distribution** - Set max counts to limit certain POI types
✅ **Configure orbits** - Customize orbital ranges for each POI type
✅ **Immediate feedback** - Changes apply on next system generation

### For Players
✅ **More variety** - As POI library grows, systems become more diverse
✅ **Better balance** - Designers can tune resource distribution
✅ **Consistent rules** - Same seed + same library = same POIs (deterministic)

### For Development
✅ **Separation of concerns** - Data separate from logic
✅ **No code changes** - Add content via Admin UI
✅ **Easy testing** - Test different POI configs without rebuilding

---

## Implementation Checklist

### Backend (No Changes Needed)
- [x] POI library API endpoint (`/api/poi-library`)
- [x] POI library CRUD operations
- [x] Default POI initialization

### Frontend Library Loader
- [ ] Create `src/lib/poiLibraryLoader.js`
- [ ] Implement `loadPOILibrary()` function
- [ ] Implement `transformPOILibrary()` function
- [ ] Implement `getSizeRange()` helper
- [ ] Implement `getDefaultPOIConfig()` fallback

### System Generator Updates
- [ ] Modify `generateSystemV2()` to accept `poiConfig` parameter
- [ ] Update `generatePOIs()` to use dynamic config
- [ ] Add `maxCount` tracking per POI type
- [ ] Use `rarity` for weight calculation
- [ ] Use `orbitRadiusMin/Max` from config
- [ ] Add `orbitType` and `orbitSpeed` to generated POIs

### ShipCommandConsole Integration
- [ ] Import `loadPOILibrary()`
- [ ] Add state for `poiConfig`
- [ ] Load POI config on mount
- [ ] Pass `poiConfig` to `generateSystemV2()`
- [ ] Handle loading states gracefully

### POI Library Admin UI
- [ ] Ensure all required fields are editable
- [ ] Add validation for `orbitRadiusMin` < `orbitRadiusMax`
- [ ] Add tooltips explaining each field's effect
- [ ] Test adding/editing/deleting POI types

### Testing
- [ ] Generate systems with default POI library
- [ ] Modify POI rarity values and verify spawn rates change
- [ ] Set `maxCount=1` for a POI type, verify only 1 spawns
- [ ] Change `orbitRadiusMin/Max`, verify POI placement changes
- [ ] Test with missing POI library (fallback works)
- [ ] Verify same seed produces same system

---

## Example Config Transformation

### Backend POI Library Entry
```json
{
  "id": "POI_PLANET_DEFAULT",
  "name": "Procedural Planet",
  "type": "PLANET",
  "parentId": null,
  "description": "Randomly generated planets with varied properties",
  "size": "Large",
  "rarity": 60,
  "maxCount": 8,
  "orbitType": "circular",
  "orbitSpeed": 1,
  "orbitRadiusMin": 0.5,
  "orbitRadiusMax": 30,
  "tierMultiplier": 1,
  "imagePool": "planets"
}
```

### Transformed Generator Config
```javascript
{
  poiTypes: {
    PLANET: {
      id: "POI_PLANET_DEFAULT",
      name: "Procedural Planet",
      weight: 60,              // from rarity
      sizeRange: [12, 20],     // from size="Large"
      minDistance: 0.5,        // from orbitRadiusMin
      maxDistance: 30,         // from orbitRadiusMax
      maxCount: 8,             // from maxCount
      canHaveOrbitals: true,   // derived from type=PLANET
      orbitType: "circular",   // from orbitType
      orbitSpeed: 1,           // from orbitSpeed
      tierMultiplier: 1,       // from tierMultiplier
      imagePool: "planets"     // from imagePool
    }
  }
}
```

---

## Future Enhancements

### Phase 4: Seed-Based POI Injection (Optional)
Allow POI library entries to specify seed patterns for guaranteed spawns:

```javascript
{
  id: "POI_HOMEBASE_STATION",
  placement: {
    seedPattern: "SSG2-G:HOMEBASE:*", // Only in homebase systems
    orbitIndex: 1,                    // Specific orbit
    guaranteed: true                  // Always spawns
  }
}
```

### Phase 5: Conditional Placement (Optional)
Allow POIs to spawn based on star class, galactic zone, etc.:

```javascript
{
  id: "POI_GAS_GIANT_HOT",
  placement: {
    starClass: ["F", "G", "K"],      // Only near certain stars
    galacticZone: ["Dark", "Static"], // Only in dangerous zones
    probability: 0.3                  // 30% chance even if conditions met
  }
}
```

---

## Timeline Estimate

- **Phase 1 (POI Loader):** 30 minutes
- **Phase 2 (Generator Update):** 45 minutes
- **Phase 3 (Integration):** 20 minutes
- **Testing & Validation:** 30 minutes

**Total:** ~2 hours

---

## Notes

- Keep `systemGenerator.config.json` as fallback for star classes, galactic zones
- POI library should be loaded once at app start, cached in state
- If backend is unavailable, gracefully fall back to hard-coded defaults
- Ensure determinism: same seed + same POI library = same system
- Consider adding version field to POI library for compatibility tracking
