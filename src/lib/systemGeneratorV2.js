// System Generator V2 - Config-driven, outside-in POI placement
// Features:
// - 110 AU max radius cap
// - Oval heliosphere (radius + 10 AU buffer)
// - Outside-in generation with 5 AU collision detection
// - Nested POIs (planets with orbitals as children)
// - Configuration-driven parameters

import { makeRng, randInt, lerp, pick, weighted } from './rng.js';
import config from './systemGenerator.config.json';

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
  const prefixes = {
    planet: ['Kepler', 'Gliese', 'Proxima', 'Ross', 'Wolf', 'Lacaille'],
    belt: ['Kuiper', 'Oort', 'Scattered', 'Trojan', 'Greek', 'Main'],
    moon: ['Luna', 'Io', 'Europa', 'Titan', 'Callisto', 'Ganymede'],
    station: ['Outpost', 'Station', 'Waypoint', 'Hub', 'Gateway', 'Beacon'],
    habitat: ['Cylinder', 'Torus', 'Colony', 'Haven', 'Ark', 'Refuge'],
    anomaly: ['Signal', 'Rift', 'Anomaly', 'Nexus', 'Vortex', 'Echo']
  };
  
  const prefix = pick(prefixes[type] || ['Object'], rng);
  const suffix = String.fromCharCode(65 + (index % 26)); // A, B, C, etc.
  const number = Math.floor(randInt(rng, 100, 999));
  
  return `${prefix}-${number}${suffix}`;
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
 */
function generatePOI(rng, type, distance, angle, index, parentId = null) {
  const typeConfig = config.poiTypes[type];
  const size = lerp(typeConfig.sizeRange[0], typeConfig.sizeRange[1], rng());
  
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
    orbitals: [] // Will be populated if this POI can have orbitals
  };
}

/**
 * Generate orbital POIs around a parent
 */
function generateOrbitals(rng, parent, poiIndex) {
  const parentConfig = config.poiTypes[parent.type];
  if (!parentConfig.canHaveOrbitals) return [];
  
  // Roll for orbitals
  if (rng() > parentConfig.orbitalProbability) return [];
  
  const numOrbitals = randInt(rng, 1, parentConfig.maxOrbitals);
  const orbitals = [];
  const orbitalDistance = 0.8; // AU offset from parent (close proximity)
  
  for (let i = 0; i < numOrbitals; i++) {
    const orbitalType = pick(config.orbitalTypes, rng);
    const angle = (Math.PI * 2 / numOrbitals) * i; // Evenly spaced around parent
    
    const orbitalX = parent.x + orbitalDistance * Math.cos(angle);
    const orbitalY = parent.y + orbitalDistance * Math.sin(angle);
    const orbitalDist = Math.sqrt(orbitalX * orbitalX + orbitalY * orbitalY);
    const orbitalAngle = Math.atan2(orbitalY, orbitalX);
    
    const orbital = generatePOI(rng, orbitalType, orbitalDist, orbitalAngle, poiIndex + i, parent.id);
    orbitals.push(orbital);
  }
  
  return orbitals;
}

/**
 * Generate POIs using outside-in approach
 * Starts at max radius and works inward, ensuring 5 AU spacing
 */
function generatePOIs(rng, maxRadius) {
  const pois = [];
  let poiIndex = 0;
  
  // Determine total number of POIs based on system size
  const minPOIs = 8;
  const maxPOIs = 20;
  const numPOIs = randInt(rng, minPOIs, maxPOIs);
  
  // Create weighted POI type selection
  const poiTypeWeights = Object.entries(config.poiTypes)
    .filter(([type, cfg]) => !cfg.isOrbital) // Exclude orbital-only types
    .map(([type, cfg]) => [type, cfg.weight]);
  
  // Outside-in generation: start at maxRadius, work toward center
  const attempts = numPOIs * 10; // Allow multiple attempts to place each POI
  
  for (let attempt = 0; attempt < attempts && pois.length < numPOIs; attempt++) {
    // Pick POI type
    const type = weighted(poiTypeWeights, rng);
    const typeConfig = config.poiTypes[type];
    
    // Roll distance within valid range for this type
    const minDist = Math.max(typeConfig.minDistance, 5); // Never closer than 5 AU
    const maxDist = Math.min(typeConfig.maxDistance, maxRadius);
    
    if (minDist >= maxDist) continue; // Skip if no valid range
    
    // Bias toward outer regions early, inner regions later
    const distanceBias = 1 - (pois.length / numPOIs); // 1.0 at start, 0.0 at end
    const distance = lerp(maxDist, minDist, Math.pow(rng(), 1 - distanceBias));
    const angle = rng() * Math.PI * 2;
    
    const x = distance * Math.cos(angle);
    const y = distance * Math.sin(angle);
    
    // Check collision with existing POIs
    if (checkCollision(x, y, pois)) continue;
    
    // Generate POI
    const poi = generatePOI(rng, type, distance, angle, poiIndex);
    
    // Generate orbitals if applicable
    const orbitals = generateOrbitals(rng, poi, poiIndex + 1000);
    poi.orbitals = orbitals;
    
    pois.push(poi);
    poiIndex++;
  }
  
  return pois;
}

/**
 * Generate complete solar system
 */
export function generateSystemV2(seedStr) {
  const { ver, starClassHint, label, payload, baseSeed } = parseSeed(seedStr);
  const rng = makeRng(baseSeed);
  
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
  
  // Generate POIs
  const pois = generatePOIs(rng, systemRadiusAU);
  
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
      orbitalCount: pois.reduce((sum, poi) => sum + poi.orbitals.length, 0)
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
