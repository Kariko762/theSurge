// POI Library Loader
// Loads POI definitions from backend and transforms them into system generator format

const POI_LIBRARY_API = 'http://localhost:3002/api/poi-library';

/**
 * Load POI library from backend and transform into generator format
 * @returns {Promise<Object>} POI configuration for system generator
 */
export async function loadPOILibrary() {
  try {
    const response = await fetch(POI_LIBRARY_API);
    const data = await response.json();
    
    if (!data.success) {
      console.error('[POI Loader] Failed to load POI library:', data.message);
      return getDefaultPOIConfig();
    }
    
    console.log(`[POI Loader] Loaded ${data.pois.length} POI definitions from backend`);
    return transformPOILibrary(data.pois);
  } catch (error) {
    console.error('[POI Loader] Error loading POI library:', error);
    console.warn('[POI Loader] Using default POI configuration');
    return getDefaultPOIConfig();
  }
}

/**
 * Transform backend POI library into generator config format
 * @param {Array} libraryPOIs - POI definitions from backend
 * @returns {Object} Generator-compatible config
 */
function transformPOILibrary(libraryPOIs) {
  const config = {
    poiTypes: {},
    orbitalTypes: []
  };
  
  for (const poi of libraryPOIs) {
    // Skip POIs with parents (they are orbital-only)
    // Handle both old parentId and new parentIds formats
    const parentIds = poi.parentIds || (poi.parentId ? [poi.parentId] : []);
    const isOrbital = parentIds.length > 0;
    
    // Convert POI library format to generator format
    config.poiTypes[poi.type] = {
      id: poi.id,
      name: poi.name,
      weight: poi.rarity || 10,
      sizeRange: getSizeRange(poi.size),
      minDistance: poi.orbitRadiusMin || 5,
      maxDistance: poi.orbitRadiusMax || 100,
      maxCount: poi.maxCount || 5,
      canHaveOrbitals: canTypeHaveOrbitals(poi.type),
      orbitalProbability: getOrbitalProbability(poi.type),
      maxOrbitals: getMaxOrbitals(poi.type),
      orbitType: poi.orbitType || 'circular',
      orbitSpeed: poi.orbitSpeed || 1,
      tierMultiplier: poi.tierMultiplier || 1,
      imagePool: poi.imagePool || '',
      isOrbital,
      description: poi.description || ''
    };
    
    // Track orbital types
    if (poi.type === 'STATION' || poi.type === 'MOON') {
      if (!config.orbitalTypes.includes(poi.type)) {
        config.orbitalTypes.push(poi.type);
      }
    }
  }
  
  console.log(`[POI Loader] Transformed ${Object.keys(config.poiTypes).length} POI types`);
  console.log('[POI Loader] Orbital types:', config.orbitalTypes);
  
  return config;
}

/**
 * Convert size string to numeric range
 * @param {string} sizeStr - 'Large', 'Medium', or 'Small'
 * @returns {Array<number>} [min, max] size range
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
 * Determine if POI type can have orbitals
 * @param {string} type - POI type
 * @returns {boolean}
 */
function canTypeHaveOrbitals(type) {
  const orbitalParents = ['PLANET', 'HABITAT', 'BELT'];
  return orbitalParents.includes(type);
}

/**
 * Get orbital spawn probability for POI type
 * @param {string} type - POI type
 * @returns {number} Probability 0.0-1.0
 */
function getOrbitalProbability(type) {
  const probabilities = {
    'PLANET': 0.7,
    'HABITAT': 0.4,
    'BELT': 0.3
  };
  return probabilities[type] || 0.0;
}

/**
 * Get maximum orbitals for POI type
 * @param {string} type - POI type
 * @returns {number}
 */
function getMaxOrbitals(type) {
  const maxOrbitals = {
    'PLANET': 4,
    'HABITAT': 2,
    'BELT': 1
  };
  return maxOrbitals[type] || 0;
}

/**
 * Fallback default config if library can't be loaded
 * @returns {Object} Default POI configuration
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
        maxOrbitals: 4,
        orbitType: 'circular',
        orbitSpeed: 1,
        tierMultiplier: 1,
        imagePool: 'planets',
        isOrbital: false,
        description: 'Randomly generated planets with varied properties'
      },
      MOON: {
        id: 'POI_MOON_DEFAULT',
        name: 'Procedural Moon',
        weight: 40,
        sizeRange: [3, 8],
        minDistance: 40,
        maxDistance: 90,
        maxCount: 3,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'circular',
        orbitSpeed: 2,
        tierMultiplier: 0.5,
        imagePool: '',
        isOrbital: true,
        description: 'Natural satellites orbiting planets'
      },
      BELT: {
        id: 'POI_BELT_DEFAULT',
        name: 'Asteroid Belt',
        weight: 30,
        sizeRange: [15, 30],
        minDistance: 20,
        maxDistance: 100,
        maxCount: 2,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'circular',
        orbitSpeed: 0.5,
        tierMultiplier: 1,
        imagePool: '',
        isOrbital: false,
        description: 'Dense asteroid fields with mining opportunities'
      },
      STATION: {
        id: 'POI_STATION_DEFAULT',
        name: 'Space Station',
        weight: 25,
        sizeRange: [4, 10],
        minDistance: 10,
        maxDistance: 95,
        maxCount: 5,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'circular',
        orbitSpeed: 1.5,
        tierMultiplier: 1.5,
        imagePool: '',
        isOrbital: true,
        description: 'Permanent orbital installations with services'
      },
      HABITAT: {
        id: 'POI_HABITAT_DEFAULT',
        name: 'Space Habitat',
        weight: 20,
        sizeRange: [6, 12],
        minDistance: 30,
        maxDistance: 85,
        maxCount: 4,
        canHaveOrbitals: true,
        orbitalProbability: 0.4,
        maxOrbitals: 2,
        orbitType: 'circular',
        orbitSpeed: 1.2,
        tierMultiplier: 1,
        imagePool: '',
        isOrbital: false,
        description: 'Civilian habitation structures'
      },
      ANOMALY: {
        id: 'POI_ANOMALY_DEFAULT',
        name: 'Spatial Anomaly',
        weight: 10,
        sizeRange: [5, 15],
        minDistance: 15,
        maxDistance: 105,
        maxCount: 2,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'eccentric',
        orbitSpeed: 0.3,
        tierMultiplier: 2,
        imagePool: '',
        isOrbital: false,
        description: 'Unexplained spacetime distortions'
      },
      CONFLICT: {
        id: 'POI_CONFLICT_DEFAULT',
        name: 'Conflict Zone',
        weight: 15,
        sizeRange: [6, 12],
        minDistance: 10,
        maxDistance: 90,
        maxCount: 3,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'elliptical',
        orbitSpeed: 1,
        tierMultiplier: 2.5,
        imagePool: '',
        isOrbital: false,
        description: 'Active combat zones with hostile forces'
      },
      DISTRESS: {
        id: 'POI_DISTRESS_DEFAULT',
        name: 'Distress Signal',
        weight: 12,
        sizeRange: [3, 6],
        minDistance: 5,
        maxDistance: 100,
        maxCount: 2,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'none',
        orbitSpeed: 0,
        tierMultiplier: 1.5,
        imagePool: '',
        isOrbital: false,
        description: 'Ships or stations sending emergency signals'
      },
      FACILITY: {
        id: 'POI_FACILITY_DEFAULT',
        name: 'Orbital Facility',
        weight: 18,
        sizeRange: [8, 16],
        minDistance: 15,
        maxDistance: 85,
        maxCount: 4,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'circular',
        orbitSpeed: 1,
        tierMultiplier: 1.5,
        imagePool: '',
        isOrbital: false,
        description: 'Industrial or research facilities'
      },
      NEBULA: {
        id: 'POI_NEBULA_DEFAULT',
        name: 'Nebula Cloud',
        weight: 8,
        sizeRange: [20, 40],
        minDistance: 30,
        maxDistance: 100,
        maxCount: 1,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'none',
        orbitSpeed: 0,
        tierMultiplier: 1,
        imagePool: '',
        isOrbital: false,
        description: 'Gas clouds affecting sensors and travel'
      },
      WAKE: {
        id: 'POI_WAKE_DEFAULT',
        name: 'FTL Wake',
        weight: 5,
        sizeRange: [2, 5],
        minDistance: 10,
        maxDistance: 90,
        maxCount: 1,
        canHaveOrbitals: false,
        orbitalProbability: 0,
        maxOrbitals: 0,
        orbitType: 'none',
        orbitSpeed: 0,
        tierMultiplier: 1,
        imagePool: '',
        isOrbital: false,
        description: 'Residual signatures from FTL jumps'
      }
    },
    orbitalTypes: ['STATION', 'MOON']
  };
}
