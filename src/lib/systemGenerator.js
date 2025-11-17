// Seeded System Generator (v1)
// Produces heliosphere, star, orbits, parents, zones, detection fields.

import { makeRng, randInt, lerp, pick, weighted } from './rng.js';

const STAR_CLASSES = ['O','B','A','F','G','K','M'];

function parseSeed(seedStr) {
  // Expect patterns like: SSG1-G:SECTOR:PAYLOAD  or  ANY_STRING
  const m = /^(?<ver>SSG\d)?-?(?<class>[OBAFGKM])?:?(?<sector>[^:]+)?:?(?<payload>.*)$/.exec(seedStr || '');
  const ver = m?.groups?.ver || 'SSG1';
  const starClassHint = m?.groups?.class || null;
  const label = m?.groups?.sector || '';
  const payload = (m?.groups?.payload || seedStr || 'DEFAULT').trim();
  const base = `${ver}:${starClassHint || ''}:${label}:${payload}`;
  return { ver, starClassHint, label, payload, baseSeed: base };
}

function rollStarClass(rng, hint) {
  if (hint && STAR_CLASSES.includes(hint)) return hint;
  // Weighted roll: G/K/M more common
  return weighted([
    ['O', 1], ['B', 2], ['A', 4], ['F', 8], ['G', 20], ['K', 18], ['M', 16]
  ], rng);
}

function classWeights(starClass, kind) {
  // Coarse tendencies per class
  const map = {
    planet: { O: 6, B: 8, A: 12, F: 18, G: 22, K: 18, M: 14 },
    belt:   { O: 4, B: 6, A:  8, F: 10, G: 12, K: 16, M: 12 },
    orbital:{ O: 3, B: 4, A:  5, F:  6, G:  7, K:  7, M:  6 },
    anomaly:{ O: 3, B: 4, A:  5, F:  6, G:  7, K:  7, M:  8 },
    habitat:{ O: 1, B: 1, A:  2, F:  3, G:  4, K:  4, M:  3 },
  };
  return map[kind][starClass] || 1;
}

function rollParentType(rng, starClass) {
  return weighted([
    ['planet',  classWeights(starClass,'planet')],
    ['belt',    classWeights(starClass,'belt')],
    ['orbital', classWeights(starClass,'orbital')],
    ['anomaly', classWeights(starClass,'anomaly')],
    ['habitat', classWeights(starClass,'habitat')], // O'Neill cylinders
    ['moon',    2], // moons appear on orbits but typically near planets
  ], rng);
}

function rollSize(rng, type) {
  // Larger bias for major bodies, smaller for orbitals/moons
  const w = type === 'planet' || type === 'habitat' ? [['Large', 3], ['Medium', 1]]
          : type === 'belt' ? [['Large', 2], ['Medium', 1]]
          : type === 'moon' ? [['Large', 1], ['Medium', 3]]
          : [['Large', 1], ['Medium', 2]]; // orbitals, anomalies
  return weighted(w, rng);
}

function rollLuminosity(rng, starClass) {
  // Rough ranges by class (arbitrary but stable)
  const ranges = {
    O: [2.4, 3.0], B: [2.0, 2.6], A: [1.6, 2.2], F: [1.2, 1.8],
    G: [0.9, 1.3], K: [0.7, 1.1], M: [0.3, 0.8]
  };
  const [a, b] = ranges[starClass] || [0.8, 1.2];
  return lerp(a, b, rng());
}

function makeZones(rng, lum, starClass) {
  // zone radii scale with luminosity
  const darkAU = lerp(0.2, 0.6, rng()) * lum;       // Surge-safe inner zone
  const staticAU = lerp(6.0, 12.0, rng()) * lum;    // high ambient radiation
  // seeded surge loci (angle, au, strength)
  const lociCount = randInt(rng, 2, 4);
  const surgeLoci = Array.from({ length: lociCount }, () => ({
    angle: lerp(0, Math.PI * 2, rng()),
    au: lerp(darkAU * 1.2, staticAU * 1.1, rng()),
    strength: lerp(0.6, 1.0, rng())
  }));
  return { darkAU, staticAU, surgeLoci };
}

function makeOrbits(rng, starClass) {
  const n = randInt(rng, 6, 12);
  const r = lerp(1.8, 2.6, rng()); // much wider spread ratio
  let d0 = lerp(1.0, 2.5, rng()); // start even further from sun
  const out = [];
  for (let i = 0; i < n; i++) {
    const eps = lerp(-0.08, 0.08, rng());
    const distanceAU = d0 * Math.pow(r, i) * (1 + eps);
    const angleRad = lerp(0, Math.PI * 2, rng());
    out.push({ index: i, distanceAU, angleRad });
  }
  return out;
}

function generateName(rng, type, size, index) {
  // Generate placeholder names based on orbit index - actual names revealed on investigation
  switch(type) {
    case 'planet':
      return `Planet ${index + 1}` + (size === 'Medium' ? '-M' : '');
    case 'moon':
      return `Moon ${index + 1}` + (size === 'Medium' ? '-M' : '');
    case 'belt':
      return `Belt ${index + 1}` + (size === 'Medium' ? '-M' : '');
    case 'orbital':
      return `Station ${index + 1}` + (size === 'Medium' ? '-M' : '');
    case 'anomaly':
      return `Anomaly ${index + 1}` + (size === 'Medium' ? '-M' : '');
    case 'habitat':
      return `Habitat ${index + 1}` + (size === 'Medium' ? '-M' : '');
    default:
      return type.toUpperCase();
  }
}

function parentForOrbit(rng, starClass, seedBase, orbit) {
  const type = rollParentType(rng, starClass);
  const size = rollSize(rng, type);
  const id = `${orbit.index}:${type}`;
  const name = generateName(rng, type, size, orbit.index);
  const tags = [];
  
  // Add planetary activity tags (hidden until investigation)
  if (type === 'planet' && rng() > 0.6) {
    const activities = ['habitable', 'industrial', 'mining', 'abandoned', 'contested', 'volcanic'];
    tags.push(pick(activities, rng));
  }
  
  // Rough base signal strength per type/size
  const baseSignal = (type === 'planet' ? 1.0 
                    : type === 'moon' ? 0.7
                    : type === 'belt' ? 0.8 
                    : type === 'habitat' ? 0.9 
                    : type === 'anomaly' ? 0.5 // anomalies are harder to detect
                    : 0.7) * (size === 'Large' ? 1.0 : 0.6);
  // Scan DC baselines
  const scanDC = size === 'Large' ? 10 : 12 + randInt(rng, 0, 4);
  return { id, type, size, name, tags, baseSignal, scanDC };
}

function detectionAtEdge(parent, distanceAU, sensorsPower, wake) {
  // Simple analytical invert for detectAtAU ~ sqrt(B/T)
  const T0 = 0.9; // base threshold
  const n2 = 1.0; // mean noise folded in
  const T = T0 / (1 + sensorsPower / 100) * (1 + wake / 140) * n2;
  const detectAtAU = Math.sqrt(Math.max(parent.baseSignal / T, 0.0001));
  const visibleAtEdge = detectAtAU >= distanceAU; // if edge distance <= detection range
  return { detectAtAU, visibleAtEdge };
}

export function generateSystem(seedStr, opts = {}) {
  const { baseSeed, starClassHint } = parseSeed(seedStr);
  const rngStar = makeRng(baseSeed, 'star');
  const rngOrbits = makeRng(baseSeed, 'orbits');
  const rngParents = makeRng(baseSeed, 'parents');
  const rngZones = makeRng(baseSeed, 'zones');
  const rngExtras = makeRng(baseSeed, 'extras');
  const rngLinks = makeRng(baseSeed, 'links');

  const starClass = rollStarClass(rngStar, starClassHint);
  const lum = rollLuminosity(rngStar, starClass);
  const flare = lerp(0, 1, rngStar());

  // Heliosphere radius scales with lum; outer boundary for first-pass visibility
  const heliosphere = { radiusAU: lerp(40, 120, rngStar()) * lum };

  const zones = makeZones(rngZones, lum, starClass);
  const orbits = makeOrbits(rngOrbits, starClass);

  // Build parents and detection hints (edge distance ~ heliosphere radius)
  const sensorsPower = opts.sensorsPower ?? 20; // baseline ship
  const wake = opts.wake ?? 20;                 // baseline wake

  let withParents = orbits.map(o => {
    const p = parentForOrbit(rngParents, starClass, baseSeed, o);
    const det = detectionAtEdge(p, heliosphere.radiusAU, sensorsPower, wake);
    return { ...o, parent: { ...p, ...det } };
  });

  // Anchor ORBITAL platforms and MOONS to nearest PLANET (or SUN) with slight angle offset
  const planetEntries = withParents.filter(w => w.parent.type === 'planet');
  withParents = withParents.map(entry => {
    if (entry.parent.type !== 'orbital' && entry.parent.type !== 'moon') return entry;
    let anchor = null;
    if (planetEntries.length > 0) {
      anchor = planetEntries.reduce((best, p) => {
        const d = Math.abs(p.distanceAU - entry.distanceAU);
        if (!best || d < best.dist) return { node: p, dist: d };
        return best;
      }, null)?.node;
    }
    const anchorId = anchor ? anchor.parent.id : 'SUN';
    const anchorDistance = anchor ? anchor.distanceAU : 0.0;
    const anchorAngle = anchor ? anchor.angleRad : 0.0;
    const angleJitter = (rngLinks() - 0.5) * (entry.parent.type === 'moon' ? 0.15 : 0.35); // moons closer to planet
    const newAngle = (anchorAngle + angleJitter + Math.PI * 2) % (Math.PI * 2);
    const parent = { ...entry.parent, anchorId };
    return { ...entry, distanceAU: anchorDistance, angleRad: newAngle, parent };
  });

  // System-level parents (extras): facilities, nebula, conflict, wake, distress
  const extraTypes = ['facility','nebula','conflict','wake','distress'];
  const extrasCount = randInt(rngExtras, 1, 3);
  const extras = Array.from({ length: extrasCount }, (_, i) => {
    const type = pick(extraTypes, rngExtras);
    // Conflict and wake can be Medium, others Large
    const size = (type === 'conflict' || type === 'wake') && rngExtras() > 0.6 ? 'Medium' : 'Large';
    const angleRad = lerp(0, Math.PI * 2, rngExtras());
    const au = lerp(zones.darkAU * 1.3, zones.staticAU * 1.05, rngExtras());
    const id = `X${i}:${type}`;
    
    // Generate placeholder names for extras - details revealed on investigation
    let name;
    switch(type) {
      case 'facility':
        name = `Facility ${i + 1}` + (size === 'Medium' ? '-M' : '');
        break;
      case 'nebula':
        name = `Nebula ${i + 1}` + (size === 'Medium' ? '-M' : '');
        break;
      case 'conflict':
        name = `Conflict Zone ${i + 1}` + (size === 'Medium' ? '-M' : '');
        break;
      case 'wake':
        name = `Wake ${i + 1}` + (size === 'Medium' ? '-M' : '');
        break;
      case 'distress':
        name = `Distress ${i + 1}` + (size === 'Medium' ? '-M' : '');
        break;
      default:
        name = type.toUpperCase();
    }
    
    const baseSignal = size === 'Large' ? 1.1 : 0.8; // coherent signature varies by size
    const scanDC = size === 'Large' ? 10 : 12;
    const parent = { id, type, size, name, tags: [], baseSignal, scanDC };
    const det = detectionAtEdge(parent, heliosphere.radiusAU, sensorsPower, wake);
    return { index: -1, distanceAU: au, angleRad, parent: { ...parent, ...det } };
  });

  return {
    seed: seedStr,
    heliosphere,
    star: { class: starClass, lum, flare },
    zones,
    orbits: withParents,
    extras,
  };
}

export function exampleSeeds() {
  return [
    'SSG1-G:SECTOR42:8421C9',
    'SSG1-K:ASH-DELTA:9KCM7Q',
    'SSG1-M:RED-GLARE:7F2Q9K',
  ];
}
