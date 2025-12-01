// System Generator V2 - Config-driven, outside-in POI placement
// Features:
// - 110 AU max radius cap
// - Oval heliosphere (radius + 10 AU buffer)
// - Outside-in generation with 5 AU collision detection
// - Nested POIs (planets with orbitals as children)
// - Configuration-driven parameters from POI Library (backend)

import { makeRng, randInt, lerp, pick, weighted } from './rng.js';
import config from './systemGenerator.config.json';
import { loadPOILibrary } from './poiLibraryLoader.js';

const STAR_CLASSES = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];

/**
 * Parse seed string format: SSG2-G:SECTOR:PAYLOAD
 */
function parseSeed(seedStr) {
  const m = /^(?<ver>SSG\d)?-?(?<class>[OBAFGKM])?:?(?<sector>[^:]+)?:?(?<payload>.*)$/.exec(seedStr || '');
  const ver = m?.groups?.ver || 'SSG2';
  const starClassHint = m?.groups?.class || null;
  const label = m?.groups?.sector || '';
  const payload = (m?.groups?.payload || seedStr || 'DEFAULT').trim();
  const baseSeed = `${ver}:${starClassHint || ''}:${label}:${payload}`;
  return { ver, starClassHint, label, payload, baseSeed };
}

/**
 * Roll star class with optional hint
 */
function rollStarClass(rng, hint) {
  if (hint && STAR_CLASSES.includes(hint)) return hint;
  return weighted([
    ['O', 1], ['B', 2], ['A', 4], ['F', 8], ['G', 20], ['K', 18], ['M', 16]
  ], rng);
}

/**
 * Roll galactic zone
 */
function rollGalacticZone(rng) {
  const zones = Object.entries(config.galacticZones).map(([name, data]) => [name, data.weight]);
  return weighted(zones, rng);
}

/**
 * Calculate stellar protection from galactic radiation
 */
function calculateStellarProtection(starClass, luminosity) {
  const classData = config.starClasses[starClass];
  return classData.protection * luminosity;
}

/**
 * Calculate galactic surge radiation
 */
function calculateGalacticSurge(galacticZone) {
  return config.galacticZones[galacticZone].surgeBase;
}

/**
 * Calculate encounter activity based on star
 */
function calculateEncounterActivity(starClass, luminosity) {
  const classData = config.starClasses[starClass];
  return classData.activity * luminosity;
}

/**
 * Generate random name for POI
 */
function generatePOIName(rng, type, index) {
  const typeNames = {
    PLANET: 'Planet',
    MOON: 'Moon',
    BELT: 'Asteroid Cluster',
    STATION: 'Station',
    HABITAT: 'Habitat',
    ANOMALY: 'Anomaly',
    CONFLICT: 'Conflict Zone',
    DISTRESS: 'Distress Signal',
    FACILITY: 'Facility',
    NEBULA: 'Nebula',
    WAKE: 'Wake Signature'
  };
  
  // Get type name (try uppercase first, then lowercase)
  const typeName = typeNames[type] || typeNames[type?.toUpperCase()] || 'Object';
  const suffix = String.fromCharCode(65 + (index % 26)); // A, B, C, etc.
  const number = Math.floor(randInt(rng, 100, 999));
  
  return `${typeName}-${number}${suffix}`;
}

/**
 * Check if position collides with existing POIs (5 AU minimum spacing)
 */
function checkCollision(x, y, existingPOIs, minSpacing = config.constraints.minPOISpacing) {
  for (const poi of existingPOIs) {
    const dx = x - poi.x;
    const dy = y - poi.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < minSpacing) {
      return true;
    }
  }
  return false;
}

/**
 * Generate POI at specific distance from star
 * @param {Function} rng - Random number generator
 * @param {string} type - POI type
 * @param {number} distance - Distance from star in AU
 * @param {number} angle - Angle in radians
 * @param {number} index - POI index
 * @param {string|null} parentId - Parent POI ID if orbital
 * @param {Object} typeConfig - Type configuration from POI library
 * @returns {Object} Generated POI
 */
function generatePOI(rng, type, distance, angle, index, parentId = null, typeConfig = null) {
  // Use type config if provided, otherwise fall back to default config
  const cfg = typeConfig || config.poiTypes[type] || {};
  const size = lerp(cfg.sizeRange[0], cfg.sizeRange[1], rng());
  
  const x = distance * Math.cos(angle);
  const y = distance * Math.sin(angle);
  
  return {
    id: `poi_${type}_${index}_${Date.now()}`,
    type,
    name: generatePOIName(rng, type, index),
    x,
    y,
    distanceAU: distance,
    angleRad: angle,
    size,
    parentId,
    orbitals: [], // Will be populated if this POI can have orbitals
    // Additional metadata from POI library
    orbitType: cfg.orbitType || 'circular',
    orbitSpeed: cfg.orbitSpeed || 1,
    tierMultiplier: cfg.tierMultiplier || 1,
    imagePool: cfg.imagePool || '',
    description: cfg.description || ''
  };
}

/**
 * Generate orbital POIs around a parent
 * @param {Function} rng - Random number generator
 * @param {Object} parent - Parent POI
 * @param {number} poiIndex - Starting index for orbitals
 * @param {Object} poiConfig - POI library configuration
 * @returns {Array} Generated orbital POIs
 */
function generateOrbitals(rng, parent, poiIndex, poiConfig) {
  const parentConfig = poiConfig.poiTypes[parent.type];
  if (!parentConfig || !parentConfig.canHaveOrbitals) return [];
  
  // Roll for orbitals
  if (rng() > parentConfig.orbitalProbability) return [];
  
  const numOrbitals = randInt(rng, 1, parentConfig.maxOrbitals);
  const orbitals = [];
  const orbitalDistance = 0.8; // AU offset from parent (close proximity)
  
  for (let i = 0; i < numOrbitals; i++) {
    const orbitalType = pick(poiConfig.orbitalTypes, rng);
    const orbitalConfig = poiConfig.poiTypes[orbitalType];
    
    if (!orbitalConfig) {
      console.warn(`[SystemGenV2] No config found for orbital type: ${orbitalType}`);
      continue;
    }
    
    const angle = (Math.PI * 2 / numOrbitals) * i; // Evenly spaced around parent
    
    const orbitalX = parent.x + orbitalDistance * Math.cos(angle);
    const orbitalY = parent.y + orbitalDistance * Math.sin(angle);
    const orbitalDist = Math.sqrt(orbitalX * orbitalX + orbitalY * orbitalY);
    const orbitalAngle = Math.atan2(orbitalY, orbitalX);
    
    const orbital = generatePOI(rng, orbitalType, orbitalDist, orbitalAngle, poiIndex + i, parent.id, orbitalConfig);
    orbitals.push(orbital);
  }
  
  return orbitals;
}

/**
 * Generate POIs using outside-in approach
 * Starts at max radius and works inward, ensuring 5 AU spacing
 * @param {Function} rng - Random number generator
 * @param {number} maxRadius - Maximum system radius in AU
 * @param {Object} poiConfig - POI library configuration (from loadPOILibrary)
 * @returns {Array} Generated POIs
 */
function generatePOIs(rng, maxRadius, poiConfig) {
  const pois = [];
  let poiIndex = 0;
  const typeCounters = {}; // Track how many of each type spawned
  
  // Determine total number of POIs based on system size
  const minPOIs = 8;
  const maxPOIs = 20;
  const targetPOICount = randInt(rng, minPOIs, maxPOIs);
  
  // Create weighted POI type selection from loaded config
  const poiTypeWeights = Object.entries(poiConfig.poiTypes)
    .filter(([type, cfg]) => !cfg.isOrbital) // Exclude orbital-only types
    .map(([type, cfg]) => [type, cfg.weight]);
  
  if (poiTypeWeights.length === 0) {
    console.warn('[SystemGenV2] No non-orbital POI types found in config!');
    return [];
  }
  
  // Outside-in generation: start at maxRadius, work toward center
  const attempts = targetPOICount * 10; // Allow multiple attempts to place each POI
  
  for (let attempt = 0; attempt < attempts && pois.length < targetPOICount; attempt++) {
    // Pick POI type
    const type = weighted(poiTypeWeights, rng);
    const typeConfig = poiConfig.poiTypes[type];
    
    // Check maxCount limit
    const currentCount = typeCounters[type] || 0;
    if (currentCount >= typeConfig.maxCount) {
      continue; // Skip this type, already at max
    }
    
    // Roll distance within valid range for this type
    const minDist = Math.max(typeConfig.minDistance, 5); // Never closer than 5 AU
    const maxDist = Math.min(typeConfig.maxDistance, maxRadius);
    
    if (minDist >= maxDist) continue; // Skip if no valid range
    
    // Bias toward outer regions early, inner regions later
    const distanceBias = 1 - (pois.length / targetPOICount); // 1.0 at start, 0.0 at end
    const distance = lerp(maxDist, minDist, Math.pow(rng(), 1 - distanceBias));
    const angle = rng() * Math.PI * 2;
    
    const x = distance * Math.cos(angle);
    const y = distance * Math.sin(angle);
    
    // Check collision with existing POIs
    if (checkCollision(x, y, pois)) continue;
    
    // Generate POI with config from library
    const poi = generatePOI(rng, type, distance, angle, poiIndex, null, typeConfig);
    
    // Generate orbitals if applicable (using loaded config)
    const orbitals = generateOrbitals(rng, poi, poiIndex + 1000, poiConfig);
    poi.orbitals = orbitals;
    
    pois.push(poi);
    poiIndex++;
    
    // Increment type counter
    typeCounters[type] = currentCount + 1;
  }
  
  return pois;
}

/**
 * Generate complete solar system
 * @param {string} seedStr - Seed string (format: SSG2-G:SECTOR:PAYLOAD)
 * @param {Object|null} poiConfig - Optional POI library config (from loadPOILibrary)
 * @returns {Object} Generated solar system
 */
export async function generateSystemV2(seedStr, poiConfig = null) {
  const { ver, starClassHint, label, payload, baseSeed } = parseSeed(seedStr);
  const rng = makeRng(baseSeed);
  
  // Load POI config if not provided
  if (!poiConfig) {
    console.log('[SystemGenV2] No POI config provided, loading from backend...');
    poiConfig = await loadPOILibrary();
  }
  
  // Star properties
  const starClass = rollStarClass(rng, starClassHint);
  const classData = config.starClasses[starClass];
  const luminosity = lerp(classData.luminosityRange[0], classData.luminosityRange[1], rng());
  
  // Galactic environment
  const galacticZone = rollGalacticZone(rng);
  const stellarProtection = calculateStellarProtection(starClass, luminosity);
  const galacticSurge = calculateGalacticSurge(galacticZone);
  const encounterActivity = calculateEncounterActivity(starClass, luminosity);
  
  // System size (capped at 110 AU)
  const baseRadius = lerp(40, config.constraints.maxRadiusAU, rng());
  const systemRadiusAU = Math.min(baseRadius, config.constraints.maxRadiusAU);
  
  // Heliosphere (oval shape: radius + 10 AU buffer, stretched 1.3x on one axis)
  const heliosphereRadiusAU = systemRadiusAU + config.constraints.heliosphereBuffer;
  
  // Generate POIs using loaded config
  const pois = generatePOIs(rng, systemRadiusAU, poiConfig);
  
  // Build system object
  const system = {
    seed: seedStr,
    version: ver,
    star: {
      class: starClass,
      luminosity,
      stellarProtection,
      encounterActivity
    },
    galactic: {
      zone: galacticZone,
      surgeBase: galacticSurge
    },
    heliosphere: {
      radiusAU: heliosphereRadiusAU,
      ovalRatio: config.constraints.heliosphereOvalRatio,
      shape: 'oval'
    },
    radius: systemRadiusAU,
    pois: pois,
    metadata: {
      generated: new Date().toISOString(),
      poiCount: pois.length,
      orbitalCount: pois.reduce((sum, poi) => sum + poi.orbitals.length, 0),
      usedPOIConfig: !!poiConfig // Flag whether custom config was used
    }
  };
  
  console.log(`[SystemGenV2] Generated system: ${starClass} star, ${pois.length} POIs, ${system.metadata.orbitalCount} orbitals, ${systemRadiusAU.toFixed(1)} AU radius`);
  
  return system;
}

/**
 * Flatten POI hierarchy for rendering (includes orbitals as separate entities)
 */
export function flattenPOIs(system) {
  const flattened = [];
  
  for (const poi of system.pois) {
    flattened.push(poi);
    
    // Add orbitals
    for (const orbital of poi.orbitals) {
      flattened.push(orbital);
    }
  }
  
  return flattened;
}
