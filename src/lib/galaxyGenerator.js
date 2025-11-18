// Galaxy Generator (v2)
// Generates systems in 2D space, then overlays grid zones
// Systems connect to each other, grids are just visual overlays

import { makeRng, randInt, lerp, pick, weighted } from './rng.js';
import { loadGalaxy } from './galaxyLoader.js';

const GALAXY_NAMES = [
  'Helix Nebula', 'Andromeda Reach', 'Carina Expanse', 
  'Orion Spur', 'Sagittarius Arm', 'Perseus Drift'
];

const ZONE_TYPES = ['Quiet', 'Dark', 'Static'];
const GRID_COLS = 6; // 6x5 = 30 grids (larger cells)
const GRID_ROWS = 5;
const GALAXY_WIDTH = 2000; // 2D space dimensions
const GALAXY_HEIGHT = 2000;

/**
 * Generate a single galaxy with 2D system layout and grid overlay
 * @param {string} galaxyId - Unique galaxy identifier
 * @param {number} systemCount - Number of systems to generate (300-500)
 * @returns {Object} Galaxy structure with systems, connections, and grid overlay
 */
export function generateGalaxy(galaxyId, systemCount = 400) {
  const rng = makeRng(galaxyId, 'galaxy');
  const name = pick(GALAXY_NAMES, rng);
  // Physical scale of this galaxy in Light Years (diameter approximation)
  const scaleLy = Math.round(lerp(600, 1200, rng()));
  // World-space mapping: our galaxy canvas uses 2000 world units across
  const unitsPerLy = GALAXY_WIDTH / scaleLy;
  
  const systems = [];
  
  // Step 1: Generate ALL systems in 2D space with minimum distance enforcement
  const tiersCount = 4;
  const systemsPerTier = Math.floor(systemCount / tiersCount);
  // Minimum distance between systems derived from galaxy scale (region ≈ scale/4)
  const minDistanceLy = Math.max(3, Math.round(scaleLy / 160)); // ~5 LY for 800 LY galaxy
  const MIN_DISTANCE = minDistanceLy * unitsPerLy; // convert to world units
  const MAX_ATTEMPTS = 50; // Max attempts to place a system
  
  let homebaseCreated = false;
  
  // Helper to check if position is valid (min distance from all existing systems)
  const isValidPosition = (pos, existingSystems) => {
    return existingSystems.every(sys => {
      const dx = pos.x - sys.position.x;
      const dy = pos.y - sys.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return dist >= MIN_DISTANCE;
    });
  };
  
  for (let tier = 1; tier <= tiersCount; tier++) {
    for (let i = 0; i < systemsPerTier; i++) {
      const systemIndex = systems.length;
      const tierNormalized = tier / tiersCount; // 0.25, 0.5, 0.75, 1.0
      
      // First Tier 1 system in GALAXY_0 becomes homebase
      const isHomebase = galaxyId === 'GALAXY_0' && !homebaseCreated && tier === 1 && i === 0;
      if (isHomebase) homebaseCreated = true;
      
      // Zone distribution: deeper tiers = more dangerous zones
      const zone = isHomebase ? 'Quiet' : rollZoneForTier(rng, tierNormalized);
      
      // Find valid position with minimum distance
      let position = null;
      let attempts = 0;
      
      while (!position && attempts < MAX_ATTEMPTS) {
        attempts++;
        
        // Distribute in 2D space - tier affects distance from center
        // Spread systems across wider bands for better spacing
        const angle = lerp(0, Math.PI * 2, rng());
        const radiusBase = (GALAXY_WIDTH / 2) * (tier / tiersCount);
        const radiusVariation = radiusBase * 0.4; // More spread
        const radius = radiusBase + lerp(-radiusVariation, radiusVariation, rng());
        
        const testPos = {
          x: GALAXY_WIDTH / 2 + radius * Math.cos(angle),
          y: GALAXY_HEIGHT / 2 + radius * Math.sin(angle)
        };
        
        // Check bounds and minimum distance
        if (testPos.x >= 100 && testPos.x <= GALAXY_WIDTH - 100 &&
            testPos.y >= 100 && testPos.y <= GALAXY_HEIGHT - 100 &&
            isValidPosition(testPos, systems)) {
          position = testPos;
        }
      }
      
      // Fallback: if can't find valid position, use best attempt
      if (!position) {
        const angle = lerp(0, Math.PI * 2, rng());
        const radiusBase = (GALAXY_WIDTH / 2) * (tier / tiersCount);
        const radius = radiusBase + lerp(-radiusBase * 0.4, radiusBase * 0.4, rng());
        position = {
          x: GALAXY_WIDTH / 2 + radius * Math.cos(angle),
          y: GALAXY_HEIGHT / 2 + radius * Math.sin(angle)
        };
      }
      
      // Decide star class and visual size (for map) based on class
      const starClass = isHomebase ? 'G' : randomStarClass(rng);
      const sizeMap = { O: 5, B: 4.5, A: 4, F: 3.5, G: 3, K: 2.5, M: 2 };
      const size = isHomebase ? 6 : (sizeMap[starClass] || 3);

      const system = {
        id: isHomebase ? 'HOMEBASE' : `SYS_${galaxyId}_${systemIndex}`,
        name: isHomebase ? 'Homebase' : generateSystemName(rng, systemIndex),
        zone,
        tier: isHomebase ? 0.25 : tierNormalized,
        seed: isHomebase ? 'SSG1-G:HOMEBASE:ALPHA7' : `SSG1-${starClass}:${galaxyId}:${systemIndex.toString(16).toUpperCase()}`,
        connections: { forward: [], backward: [], cross: [] },
        position,
        size,
        radiation: zoneToRadiation(zone),
        gridId: null // Will be assigned later
      };
      
      systems.push(system);
    }
  }
  
  // Step 2: Assign quadrants/grid overlay first so systems have gridId
  const grids = createGridOverlay(systems, rng);

  // Step 3: Create system-to-system connections (uses gridId for branch seeding)
  connectSystems(systems, rng);
  
  return {
    id: galaxyId,
    name,
    systemCount: systems.length,
    systems,
    grids,
    bounds: { width: GALAXY_WIDTH, height: GALAXY_HEIGHT },
    scaleLy,
    unitsPerLy,
  };
}

/**
 * Roll zone type based on tier (deeper = more dangerous)
 */
function rollZoneForTier(rng, tierNormalized) {
  // Tier 1 (0.25): Mostly Quiet
  // Tier 2 (0.5): Mix of Quiet/Dark
  // Tier 3 (0.75): Mostly Dark, some Static
  // Tier 4 (1.0): Mostly Static
  
  if (tierNormalized < 0.3) {
    return weighted([['Quiet', 80], ['Dark', 20], ['Static', 0]], rng);
  } else if (tierNormalized < 0.6) {
    return weighted([['Quiet', 40], ['Dark', 50], ['Static', 10]], rng);
  } else if (tierNormalized < 0.85) {
    return weighted([['Quiet', 10], ['Dark', 60], ['Static', 30]], rng);
  } else {
    return weighted([['Quiet', 0], ['Dark', 30], ['Static', 70]], rng);
  }
}

/**
 * Generate system name
 */
function generateSystemName(rng, index) {
  const prefixes = ['Kepler', 'Vega', 'Barnard', 'Sirius', 'Proxima', 'Altair', 'Deneb', 'Rigel', 'Betelgeuse', 'Antares'];
  const suffixes = ['Prime', 'Secondary', 'Refuge', 'Outpost', 'Haven', 'Station', 'Terminus', 'Gate', 'Nexus', 'Crossing'];
  
  if (rng() < 0.7) {
    return `${pick(prefixes, rng)}-${randInt(rng, 1, 999)}`;
  } else {
    return `${pick(prefixes, rng)}'s ${pick(suffixes, rng)}`;
  }
}

/**
 * Random star class for seed generation
 */
function randomStarClass(rng) {
  return weighted([
    ['O', 1], ['B', 2], ['A', 4], ['F', 8], 
    ['G', 20], ['K', 18], ['M', 16]
  ], rng);
}

/**
 * Create 4 quadrant overlay for galaxy (rugby ball shape with central black hole)
 * Quadrants: Top, Right, Bottom, Left
 */
function createGridOverlay(systems, rng) {
  const centerX = GALAXY_WIDTH / 2;
  const centerY = GALAXY_HEIGHT / 2;
  
  // Assign each system to a quadrant based on angle from center
  systems.forEach(sys => {
    const dx = sys.position.x - centerX;
    const dy = sys.position.y - centerY;
    const angle = Math.atan2(dy, dx) + Math.PI / 2; // Offset to start from top
    const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
    
    // Determine quadrant: 0=Top, 1=Right, 2=Bottom, 3=Left
    const quadrantIndex = Math.floor(normalizedAngle / (Math.PI / 2)) % 4;
    sys.gridId = `QUADRANT_${quadrantIndex}`;
  });
  
  // Create 4 quadrant regions
  const quadrantNames = ['Northern Quadrant', 'Eastern Quadrant', 'Southern Quadrant', 'Western Quadrant'];
  const grids = [];
  
  for (let i = 0; i < 4; i++) {
    const systemsInQuadrant = systems.filter(s => s.gridId === `QUADRANT_${i}`);
    
    // Calculate stats for this quadrant
    let zoneCounts = { Quiet: 0, Dark: 0, Static: 0 };
    let avgTier = 0;
    systemsInQuadrant.forEach(sys => {
      zoneCounts[sys.zone]++;
      avgTier += sys.tier;
    });
    if (systemsInQuadrant.length > 0) avgTier /= systemsInQuadrant.length;
    
    const dominantZone = Object.keys(zoneCounts).reduce(
      (a, b) => zoneCounts[a] > zoneCounts[b] ? a : b,
      'Dark'
    );
    
    const containsHomebase = systemsInQuadrant.some(s => s.id === 'HOMEBASE');
    
    // Quadrant center (midpoint of the arc)
    const midAngle = (i * Math.PI / 2) - Math.PI / 2 + Math.PI / 4; // Center of each quadrant
    const radiusX = 900;
    const radiusY = 700;
    const centerOffsetX = centerX + Math.cos(midAngle) * radiusX * 0.5;
    const centerOffsetY = centerY + Math.sin(midAngle) * radiusY * 0.5;
    
    grids.push({
      id: `QUADRANT_${i}`,
      name: quadrantNames[i],
      center: { x: centerOffsetX, y: centerOffsetY },
      systemCount: systemsInQuadrant.length,
      systemIds: systemsInQuadrant.map(s => s.id),
      zone: systemsInQuadrant.length > 0 ? dominantZone : 'Dark',
      tier: avgTier,
      surveyed: containsHomebase
    });
  }
  
  return grids;
}

function generateRegionName(rng) {
  const prefixes = ['Orion', 'Helix', 'Vela', 'Lyra', 'Cygnus', 'Draco', 'Carina', 'Perseus', 'Aquila', 'Phoenix'];
  const forms = ['Reach', 'Expanse', 'Refuge', 'Shroud', 'Drift', 'Ridge', 'Fold', 'Frontier', 'Veil', 'Basin'];
  const greek = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta'];
  const useGreek = rng() > 0.7;
  const name = `${pick(prefixes, rng)} ${pick(forms, rng)}`;
  return useGreek ? `${name} ${pick(greek, rng)}` : name;
}
 

/** Map zone to radiation level (game type). */
function zoneToRadiation(zone) {
  switch (zone) {
    case 'Dark':
      return 'Low';  // Sun-proximate, safe from Surge
    case 'Static':
      return 'High'; // Far from sun, extreme Surge
    case 'Quiet':
    default:
      return 'Medium'; // Mid-range
  }
}

/**
 * Create path-based connections between systems in 2D space
 */
function connectSystems(systems, rng) {
  // Build clear branching from HOMEBASE, 4 main branches (quadrants),
  // attach twigs, then add up to 3 bridges per branch, finally fix orphans.

  const center = { x: 1000, y: 1000 };
  const home = systems.find(s => s.id === 'HOMEBASE') || systems[0];

  const meta = systems.map(s => {
    const dx = s.position.x - center.x;
    const dy = s.position.y - center.y;
    return {
      sys: s,
      r: Math.hypot(dx, dy),
      ang: Math.atan2(dy, dx),
      quad: s.gridId || 'QUADRANT_0'
    };
  });

  const byQuad = new Map();
  meta.forEach(m => {
    if (!byQuad.has(m.quad)) byQuad.set(m.quad, []);
    byQuad.get(m.quad).push(m);
  });

  // Helper to connect two systems bidirectionally along the branch
  const linkForwardBackward = (a, b) => {
    if (!a.connections.forward.includes(b.id)) a.connections.forward.push(b.id);
    if (!b.connections.backward.includes(a.id)) b.connections.backward.push(a.id);
  };
  const linkCross = (a, b) => {
    if (!a.connections.cross.includes(b.id)) a.connections.cross.push(b.id);
    if (!b.connections.cross.includes(a.id)) b.connections.cross.push(a.id);
  };

  const branches = [];
  // Seed one trunk per quadrant using nearest Tier-1 (or nearest) system
  for (const [quad, nodes] of byQuad.entries()) {
    const tier1 = nodes.filter(n => n.sys.tier <= 0.3 && n.sys.id !== 'HOMEBASE');
    const pool = (tier1.length ? tier1 : nodes).filter(n => n.sys.id !== 'HOMEBASE');
    if (pool.length === 0) continue;
    const seed = pool.slice().sort((a, b) => a.r - b.r)[0];
    seed.sys.branchId = branches.length;
    // Connect homebase to seed
    linkForwardBackward(home, seed.sys);
    const trunk = [seed];

    // Grow trunk outward: always choose nearest farther node in same quadrant
    const minStep = 120; // world units minimal outward step
    let current = seed;
    while (true) {
      const candidates = nodes.filter(n => !n.sys.branchId && n.r > current.r + minStep);
      if (!candidates.length) break;
      const next = candidates.slice().sort((a, b) => (a.r - current.r) - (b.r - current.r))[0];
      next.sys.branchId = branches.length;
      linkForwardBackward(current.sys, next.sys);
      trunk.push(next);
      current = next;
      if (trunk.length > 80) break; // guard
    }
    branches.push({ id: branches.length, quad, trunk, bridges: 0 });
  }

  // Attach remaining systems as twigs to nearest trunk node in same quadrant
  const unassigned = meta.filter(m => !('branchId' in m.sys) && m.sys.id !== 'HOMEBASE');
  unassigned.forEach(m => {
    // Find nearest trunk node from any branch in same quadrant
    let best = null;
    branches.forEach(br => {
      if (br.quad !== m.sys.gridId) return;
      br.trunk.forEach(t => {
        const d = distance2D(m.sys.position, t.sys.position);
        if (!best || d < best.d) best = { br, t, d };
      });
    });
    if (best) {
      m.sys.branchId = best.br.id;
      // Make twig: connect back to parent trunk node
      linkForwardBackward(best.t.sys, m.sys);
    } else {
      // Fallback: attach to nearest of any system
      const nearest = systems
        .filter(s => s.id !== m.sys.id)
        .map(s => ({ s, d: distance2D(m.sys.position, s.position) }))
        .sort((a, b) => a.d - b.d)[0];
      if (nearest) linkForwardBackward(nearest.s, m.sys);
    }
  });

  // Add limited bridges between branches (<=3 per branch)
  const radiusTolerance = 200; // world units; prefer similar radial layer
  for (const br of branches) {
    if (br.bridges >= 3) continue;
    // pick 3 spread nodes along trunk (start/mid/end-ish)
    const picks = [0, Math.floor(br.trunk.length / 2), br.trunk.length - 1]
      .filter(i => i >= 0 && i < br.trunk.length)
      .map(i => br.trunk[i]);
    for (const node of picks) {
      if (br.bridges >= 3) break;
      // Find closest node from other branches with similar radius
      let best = null;
      branches.forEach(other => {
        if (other.id === br.id) return;
        other.trunk.forEach(t => {
          if (Math.abs(t.r - node.r) <= radiusTolerance) {
            const d = distance2D(node.sys.position, t.sys.position);
            if (!best || d < best.d) best = { other, t, d };
          }
        });
      });
      if (best && best.other.bridges < 3) {
        linkCross(node.sys, best.t.sys);
        br.bridges++;
        best.other.bridges++;
      }
    }
  }

  // Ensure global reachability from HOMEBASE
  const visited = new Set();
  const q = [home.id];
  const idToSys = new Map(systems.map(s => [s.id, s]));
  while (q.length) {
    const id = q.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const s = idToSys.get(id);
    const edges = [...s.connections.forward, ...s.connections.backward, ...s.connections.cross];
    edges.forEach(nid => { if (!visited.has(nid)) q.push(nid); });
  }
  systems.forEach(s => {
    if (!visited.has(s.id)) {
      // connect orphan to nearest visited node via cross
      const nearest = systems
        .filter(t => visited.has(t.id))
        .map(t => ({ t, d: distance2D(s.position, t.position) }))
        .sort((a, b) => a.d - b.d)[0];
      if (nearest) {
        if (!s.connections.cross.includes(nearest.t.id)) s.connections.cross.push(nearest.t.id);
        if (!nearest.t.connections.cross.includes(s.id)) nearest.t.connections.cross.push(s.id);
        visited.add(s.id);
      }
    }
  });
}

/**
 * Calculate 2D distance between two positions
 */
function distance2D(pos1, pos2) {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate entire universe (multiple galaxies with inter-galaxy connections)
 * @param {number} galaxyCount - Number of galaxies to generate
 * @returns {Object} Universe structure with galaxies and connections
 */
export function generateUniverse(galaxyCount = 1) {
  // For now, just load Helix Nebula
  const galaxy = loadGalaxy('helix_nebula', null);
  
  // Add visual position for universe map (center)
  galaxy.position = {
    x: 0,
    y: 0
  };
  
  // No inter-galaxy connections yet (single galaxy for now)
  return {
    galaxies: [galaxy],
    connections: [],
    homeGalaxyId: 'helix_nebula'
  };
}

/**
 * Find system by ID across all galaxies
 */
export function findSystem(galaxies, systemId) {
  for (const galaxy of galaxies) {
    const system = galaxy.systems.find(s => s.id === systemId);
    if (system) return { galaxy, system };
  }
  return null;
}

/**
 * Get accessible systems from current position
 */
export function getAccessibleSystems(galaxies, currentSystemId) {
  const result = findSystem(galaxies, currentSystemId);
  if (!result) return [];
  
  const { galaxy, system } = result;
  const accessible = [];
  
  // Collect all connected system IDs
  const connectedIds = [
    ...system.connections.forward,
    ...system.connections.backward,
    ...system.connections.cross
  ];
  
  // Find full system objects
  connectedIds.forEach(id => {
    const sys = galaxy.systems.find(s => s.id === id);
    if (sys) accessible.push(sys);
  });
  
  return accessible;
}

/**
 * Calculate distance between two systems (light-years) - 2D
 */
export function calculateDistance(system1, system2) {
  return distance2D(system1.position, system2.position) / 10; // Scale to light-years
}
