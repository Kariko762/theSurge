# POI Library → System Generator Integration Plan

## Current State Analysis

### POI Library Structure (Admin UI)
```javascript
{
  id: 'POI_PLANET_001',
  name: 'Terrestrial Planet',
  type: 'PLANET', // PLANET|MOON|BELT|ORBITAL|ANOMALY|HABITAT|CONFLICT|DISTRESS
  parentId: null, // or 'POI_PLANET_002' for children
  description: 'Rocky planet with atmosphere',
  size: 'Large', // 'Large'|'Medium'|'Small'
  properties: {} // Custom properties
}
```

### System Generator Structure (systemGeneratorV2.js)
```javascript
{
  id: 'poi_planet_0_1234567890',
  type: 'planet',
  name: 'Kepler-425B',
  x: 42.5, // AU coordinates
  y: -23.8,
  distanceAU: 48.2,
  angleRad: 2.4,
  size: 12, // numeric pixels
  parentId: null,
  orbitals: [] // nested children
}
```

### Game Console Requirements
The `ShipCommandConsole.jsx` expects:
- `poi.id` - unique identifier
- `poi.name` - display name
- `poi.type` - lowercase type (planet, belt, moon, etc.)
- `poi.distanceAU` - distance from star
- `poi.angleRad` - orbital angle
- `poi.size` - numeric size for rendering
- `poi.x`, `poi.y` - calculated from distanceAU and angleRad

---

## Integration Strategy

### Option 1: **Seed Injection** (Recommended)
Modify the system generator to check for POI Library entries and inject them into the seeded generation process.

**How it works:**
1. System generator runs normally with seed
2. Before returning, checks localStorage for POI Library entries
3. Filters POI Library by matching criteria (type, placement rules)
4. Injects library POIs into specific orbital slots or locations
5. Merges library POIs with procedurally generated ones

**Advantages:**
- ✅ Preserves deterministic seed-based generation
- ✅ Allows curated POIs to appear in specific contexts
- ✅ Events can target specific named POIs
- ✅ Minimal disruption to existing generator

**Additional POI Library Fields Needed:**
```javascript
{
  // Existing fields
  id: 'POI_PLANET_001',
  name: 'Terrestrial Planet',
  type: 'PLANET',
  parentId: null,
  description: 'Rocky planet with atmosphere',
  size: 'Large',
  properties: {},
  
  // NEW: Placement Rules
  placement: {
    // Seed injection rules
    seedPattern: 'SSG2-G:*:*', // which seeds to inject into (* = wildcard)
    orbitIndex: 3, // which orbit to place in (null = any available)
    replaceGenerated: false, // true = replace procedural POI, false = add alongside
    
    // Spatial placement (if not orbit-based)
    distanceAU: { min: 40, max: 60 }, // distance range from star
    angle: null, // specific angle in radians (null = random)
    
    // Conditional placement
    starClass: ['G', 'K'], // only in these star classes (null = any)
    galacticZone: null, // 'Quiet'|'Dark'|'Static' (null = any)
    probability: 1.0, // 0.0-1.0 chance to appear
  },
  
  // NEW: System Context
  systemRole: 'major', // 'major'|'minor'|'orbital'|'hidden'
  isUnique: true, // only one per system
  
  // NEW: Visual overrides
  visual: {
    sizeOverride: 15, // specific pixel size (null = use sizeRange from config)
    color: '#4A9EFF', // custom POI color
    icon: '🌍' // custom icon
  }
}
```

### Option 2: **Manual POI Pool**
Create a separate "manual POI pool" that supplements the seed generator.

**How it works:**
1. System generator creates procedural POIs as normal
2. Separate function loads POI Library and adds manual POIs
3. Both pools merged for final system

**Advantages:**
- ✅ Simple to implement
- ✅ Complete control over manual POI placement

**Disadvantages:**
- ❌ Not deterministic (same seed could have different POIs)
- ❌ Harder to maintain balance

### Option 3: **Template System**
POI Library becomes templates that influence procedural generation.

**How it works:**
1. POI Library entries define templates
2. System generator uses templates to create variations
3. "Terrestrial Planet" template → generates multiple instances with variations

**Advantages:**
- ✅ Maintains variety while having curated content
- ✅ Fully deterministic

**Disadvantages:**
- ❌ Events can't target specific unique POIs
- ❌ More complex implementation

---

## Recommended Implementation: Seed Injection

### Phase 1: Extend POI Library Schema
Add new fields to `POILibrary.jsx`:

1. **Placement Tab** in POI Editor Modal
   - Seed Pattern field (text input with wildcard support)
   - Orbit Index (number or "any")
   - Star Class filter (multi-select)
   - Galactic Zone filter (select)
   - Distance Range (min/max AU)
   - Probability slider (0-100%)

2. **Visual Tab** in POI Editor Modal
   - Size Override (number input)
   - Color Picker
   - Icon Picker

3. **System Role** field
   - Radio buttons: Major POI / Minor POI / Orbital / Hidden

### Phase 2: Modify System Generator
Update `systemGeneratorV2.js`:

```javascript
export function generateSystemV2(seedStr) {
  const { ver, starClassHint, label, payload, baseSeed } = parseSeed(seedStr);
  const rng = makeRng(baseSeed);
  
  // ... existing generation ...
  
  // Generate POIs
  const pois = generatePOIs(rng, systemRadiusAU);
  
  // INJECT POI LIBRARY ENTRIES
  const injectedPOIs = injectLibraryPOIs(seedStr, starClass, galacticZone, pois, rng);
  
  const system = {
    seed: seedStr,
    // ... existing fields ...
    pois: injectedPOIs, // use injected POIs instead of just generated
  };
  
  return system;
}

function injectLibraryPOIs(seedStr, starClass, galacticZone, generatedPOIs, rng) {
  // Load POI Library from localStorage
  const library = JSON.parse(localStorage.getItem('poi_library') || '[]');
  
  // Filter library POIs that match this system
  const matchingPOIs = library.filter(libraryPOI => {
    if (!libraryPOI.placement) return false;
    
    // Check seed pattern
    if (libraryPOI.placement.seedPattern) {
      if (!matchesSeedPattern(seedStr, libraryPOI.placement.seedPattern)) {
        return false;
      }
    }
    
    // Check star class
    if (libraryPOI.placement.starClass && libraryPOI.placement.starClass.length > 0) {
      if (!libraryPOI.placement.starClass.includes(starClass)) {
        return false;
      }
    }
    
    // Check galactic zone
    if (libraryPOI.placement.galacticZone) {
      if (libraryPOI.placement.galacticZone !== galacticZone) {
        return false;
      }
    }
    
    // Check probability
    if (libraryPOI.placement.probability < 1.0) {
      if (rng() > libraryPOI.placement.probability) {
        return false;
      }
    }
    
    return true;
  });
  
  // Convert library POIs to system POI format
  const convertedPOIs = matchingPOIs.map(libraryPOI => {
    const placement = libraryPOI.placement;
    
    // Determine position
    let distanceAU, angleRad;
    
    if (placement.orbitIndex !== null && placement.orbitIndex < generatedPOIs.length) {
      // Place at specific orbit
      const orbitPOI = generatedPOIs[placement.orbitIndex];
      distanceAU = orbitPOI.distanceAU;
      angleRad = orbitPOI.angleRad;
      
      if (placement.replaceGenerated) {
        // Remove the generated POI at this orbit
        generatedPOIs.splice(placement.orbitIndex, 1);
      }
    } else {
      // Place at random distance in range
      const minDist = placement.distanceAU?.min || 10;
      const maxDist = placement.distanceAU?.max || 100;
      distanceAU = minDist + rng() * (maxDist - minDist);
      angleRad = placement.angle !== null ? placement.angle : rng() * Math.PI * 2;
    }
    
    const x = distanceAU * Math.cos(angleRad);
    const y = distanceAU * Math.sin(angleRad);
    
    // Determine size
    let size;
    if (libraryPOI.visual?.sizeOverride) {
      size = libraryPOI.visual.sizeOverride;
    } else {
      const sizeMap = { Large: 15, Medium: 10, Small: 5 };
      size = sizeMap[libraryPOI.size] || 10;
    }
    
    return {
      id: libraryPOI.id,
      type: libraryPOI.type.toLowerCase(),
      name: libraryPOI.name,
      x,
      y,
      distanceAU,
      angleRad,
      size,
      parentId: libraryPOI.parentId,
      orbitals: [],
      // Preserve custom properties
      description: libraryPOI.description,
      properties: libraryPOI.properties,
      visual: libraryPOI.visual,
      isLibraryPOI: true // flag for debugging
    };
  });
  
  // Merge library POIs with generated POIs
  return [...generatedPOIs, ...convertedPOIs];
}

function matchesSeedPattern(seed, pattern) {
  // Convert pattern to regex (* = wildcard)
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(seed);
}
```

### Phase 3: Update Event System
Events can now target specific library POIs by ID:

```javascript
// In EventForm.jsx - POI dropdown already updated to show library POIs
{
  trigger: {
    type: 'poi_action',
    conditions: {
      poiType: 'POI_PLANET_001', // specific library POI ID
      action: 'mining'
    }
  }
}
```

When event triggers, it checks if the POI ID matches:
```javascript
// In eventEngine.js
function checkPOITrigger(poi, trigger) {
  const conditions = trigger.conditions;
  
  // Check if specific POI ID
  if (conditions.poiType && conditions.poiType.startsWith('POI_')) {
    return poi.id === conditions.poiType;
  }
  
  // Or check POI type (backward compatibility)
  if (conditions.poiType) {
    return poi.type === conditions.poiType;
  }
  
  return true; // "Any POI"
}
```

---

## Summary of Required POI Library Fields

### Core Fields (Already Exist)
- ✅ `id` - unique identifier
- ✅ `name` - display name
- ✅ `type` - POI type
- ✅ `parentId` - parent POI reference
- ✅ `description` - lore text
- ✅ `size` - Large/Medium/Small
- ✅ `properties` - custom data

### New Required Fields

#### Placement Object
```javascript
placement: {
  seedPattern: 'SSG2-G:*:*', // seed wildcard pattern
  orbitIndex: 3, // specific orbit (null = any)
  replaceGenerated: false, // replace vs add
  distanceAU: { min: 40, max: 60 }, // distance range
  angle: null, // specific angle (null = random)
  starClass: ['G', 'K'], // star class filter
  galacticZone: null, // zone filter
  probability: 1.0 // spawn chance
}
```

#### Visual Object
```javascript
visual: {
  sizeOverride: 15, // pixel size override
  color: '#4A9EFF', // custom color
  icon: '🌍' // custom icon
}
```

#### System Properties
```javascript
systemRole: 'major', // major|minor|orbital|hidden
isUnique: true // only one per system
```

---

## Benefits of This Approach

1. **Event Precision**: Events can trigger on specific named POIs
   - "Mining event at Kepler Mining Belt" vs "Event at any asteroid"

2. **Narrative Control**: Writers can place story-critical POIs in specific systems
   - "The abandoned station appears in all G-class systems"

3. **Deterministic**: Same seed + same library = same POIs every time

4. **Flexible**: Library POIs can replace OR supplement procedural generation

5. **Backward Compatible**: Existing events still work, new events can be specific

6. **Designer Friendly**: All configuration in Admin UI, no code changes needed

---

## Implementation Checklist

### Admin UI (POILibrary.jsx)
- [ ] Add `placement` object to POI data model
- [ ] Add Placement tab in POI Editor Modal
  - [ ] Seed Pattern input with wildcard help text
  - [ ] Orbit Index input
  - [ ] Star Class multi-select checkboxes
  - [ ] Galactic Zone select
  - [ ] Distance Range (min/max AU sliders)
  - [ ] Probability slider (0-100%)
  - [ ] Replace Generated checkbox
- [ ] Add Visual tab in POI Editor Modal
  - [ ] Size Override input
  - [ ] Color picker
  - [ ] Icon picker
- [ ] Add System Role radio buttons
- [ ] Add Is Unique checkbox
- [ ] Update default POIs to include placement data

### System Generator (systemGeneratorV2.js)
- [ ] Create `injectLibraryPOIs()` function
- [ ] Create `matchesSeedPattern()` helper
- [ ] Create `convertLibraryPOIToSystemPOI()` helper
- [ ] Modify `generateSystemV2()` to call injection
- [ ] Add collision detection for injected POIs
- [ ] Handle orbit replacement logic

### Event System (eventEngine.js)
- [ ] Update POI trigger matching to check POI IDs
- [ ] Add backward compatibility for type-based triggers
- [ ] Test with both library and procedural POIs

### Documentation
- [ ] Update SEED_SYSTEM.md with library integration
- [ ] Add examples of library POI configurations
- [ ] Document seed pattern syntax

---

## Example Use Cases

### Use Case 1: Story-Critical Station
```javascript
{
  id: 'POI_STATION_HAVEN',
  name: 'Haven Station',
  type: 'ORBITAL',
  description: 'The last bastion of humanity in this sector',
  size: 'Large',
  placement: {
    seedPattern: 'SSG2-G:HOMEBASE:*', // only in homebase system
    orbitIndex: 2, // second orbit
    replaceGenerated: true, // replace whatever was there
    starClass: ['G'], // only G-class
    probability: 1.0 // always appears
  },
  visual: {
    sizeOverride: 20,
    color: '#00FF88',
    icon: '🏢'
  },
  systemRole: 'major',
  isUnique: true
}
```

### Use Case 2: Random Encounter POI
```javascript
{
  id: 'POI_DERELICT_MYSTERY',
  name: 'Derelict Freighter',
  type: 'ORBITAL',
  description: 'An abandoned cargo vessel, still emitting weak power signatures',
  size: 'Medium',
  placement: {
    seedPattern: '*', // any system
    orbitIndex: null, // any orbit
    distanceAU: { min: 50, max: 90 }, // outer system
    starClass: null, // any star
    galacticZone: 'Dark', // only in dark zones
    probability: 0.15 // 15% chance
  },
  systemRole: 'minor'
}
```

### Use Case 3: Quest POI Chain
```javascript
// Parent POI
{
  id: 'POI_ANCIENT_RUINS',
  name: 'Ancient Ruins',
  type: 'ANOMALY',
  placement: {
    seedPattern: 'SSG2-*:SECTOR7:*',
    starClass: ['K', 'M'],
    probability: 1.0
  }
}

// Child POI (revealed after scanning parent)
{
  id: 'POI_VAULT_ENTRANCE',
  name: 'Sealed Vault',
  type: 'ANOMALY',
  parentId: 'POI_ANCIENT_RUINS',
  placement: {
    seedPattern: 'SSG2-*:SECTOR7:*',
    probability: 1.0
  }
}
```
