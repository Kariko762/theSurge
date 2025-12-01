/**
 * Distance Band System
 * Replaces hex grid complexity with simple distance-based bands
 * for space combat positioning and weapon range mechanics
 */

// Distance band definitions (in kilometers)
export const DISTANCE_BANDS = {
  POINT_BLANK: {
    name: 'Point Blank',
    min: 0,
    max: 50,
    description: 'Extreme close range - knife fighting distance',
    color: '#d0021b' // Red
  },
  CLOSE: {
    name: 'Close',
    min: 51,
    max: 150,
    description: 'Close combat range - optimal for most weapons',
    color: '#f5a623' // Orange
  },
  MEDIUM: {
    name: 'Medium',
    min: 151,
    max: 300,
    description: 'Medium range - balanced engagement',
    color: '#f8e71c' // Yellow
  },
  LONG: {
    name: 'Long',
    min: 301,
    max: 600,
    description: 'Long range - sniper distance',
    color: '#7ed321' // Green
  },
  EXTREME: {
    name: 'Extreme',
    min: 601,
    max: 1000,
    description: 'Extreme range - most weapons ineffective',
    color: '#4a90e2' // Blue
  }
};

/**
 * Get the distance band for a given distance value
 * @param {number} distance - Distance in kilometers
 * @returns {object} Distance band object with name, min, max, description, color
 */
export function getDistanceBand(distance) {
  // Clamp distance to valid range
  const clampedDistance = Math.max(0, Math.min(distance, 1000));

  // Find matching band
  for (const [key, band] of Object.entries(DISTANCE_BANDS)) {
    if (clampedDistance >= band.min && clampedDistance <= band.max) {
      return {
        key,
        ...band,
        currentDistance: clampedDistance
      };
    }
  }

  // Fallback (should never reach)
  return {
    key: 'EXTREME',
    ...DISTANCE_BANDS.EXTREME,
    currentDistance: clampedDistance
  };
}

/**
 * Get the band key for a distance (useful for comparisons)
 * @param {number} distance - Distance in kilometers
 * @returns {string} Band key (POINT_BLANK, CLOSE, MEDIUM, LONG, EXTREME)
 */
export function getDistanceBandKey(distance) {
  return getDistanceBand(distance).key;
}

/**
 * Calculate movement cost to change distance bands
 * Based on ship speed and number of bands to traverse
 * 
 * @param {string} currentBandKey - Current distance band key
 * @param {string} targetBandKey - Target distance band key
 * @param {number} shipSpeed - Ship speed stat (affects cost)
 * @returns {number} Movement points required
 */
export function getMovementCost(currentBandKey, targetBandKey, shipSpeed = 100) {
  const bandOrder = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
  
  const currentIndex = bandOrder.indexOf(currentBandKey);
  const targetIndex = bandOrder.indexOf(targetBandKey);
  
  if (currentIndex === -1 || targetIndex === -1) {
    console.error('Invalid band keys:', currentBandKey, targetBandKey);
    return Infinity;
  }

  // Calculate bands to traverse
  const bandsToTraverse = Math.abs(targetIndex - currentIndex);
  
  if (bandsToTraverse === 0) return 0; // Already at target band

  // Base cost per band (modified by ship speed)
  // Higher speed = lower cost
  const baseCostPerBand = 50;
  const speedModifier = 100 / Math.max(shipSpeed, 1);
  
  return Math.ceil(bandsToTraverse * baseCostPerBand * speedModifier);
}

/**
 * Check if a ship can reach a target band with remaining movement
 * @param {number} currentDistance - Current distance in km
 * @param {number} movementRemaining - Movement points remaining
 * @param {string} targetBandKey - Target distance band key
 * @param {number} shipSpeed - Ship speed stat
 * @returns {boolean} True if ship can reach target band
 */
export function canReachBand(currentDistance, movementRemaining, targetBandKey, shipSpeed = 100) {
  const currentBandKey = getDistanceBandKey(currentDistance);
  const cost = getMovementCost(currentBandKey, targetBandKey, shipSpeed);
  return movementRemaining >= cost;
}

/**
 * Get weapon range modifier for a specific distance band
 * Returns attack roll bonus/penalty based on weapon's optimal range
 * 
 * @param {object} weapon - Weapon object with rangeModifiers property
 * @param {string|number} distanceBandOrDistance - Distance band key or distance in km
 * @returns {number|null} Attack modifier (+/- to attack roll), or null if out of range
 */
export function getWeaponRangeModifier(weapon, distanceBandOrDistance) {
  if (!weapon) {
    console.error('No weapon provided to getWeaponRangeModifier');
    return null;
  }

  // Handle both band key and distance value
  let bandKey;
  if (typeof distanceBandOrDistance === 'string') {
    bandKey = distanceBandOrDistance;
  } else {
    bandKey = getDistanceBandKey(distanceBandOrDistance);
  }

  // Check if weapon has range modifiers
  if (!weapon.rangeModifiers) {
    console.warn('Weapon missing rangeModifiers:', weapon.name);
    // Default: effective at close/medium, penalty at long/extreme
    const defaultModifiers = {
      POINT_BLANK: 0,
      CLOSE: 0,
      MEDIUM: 0,
      LONG: -2,
      EXTREME: null
    };
    return defaultModifiers[bandKey] ?? null;
  }

  // Get modifier for this band
  const modifier = weapon.rangeModifiers[bandKey];
  
  // null means weapon cannot fire at this range
  if (modifier === null || modifier === undefined) {
    return null;
  }

  return modifier;
}

/**
 * Get all bands between current and target (for visualization/animation)
 * @param {string} currentBandKey - Current band
 * @param {string} targetBandKey - Target band
 * @returns {string[]} Array of band keys to traverse
 */
export function getBandPath(currentBandKey, targetBandKey) {
  const bandOrder = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
  
  const currentIndex = bandOrder.indexOf(currentBandKey);
  const targetIndex = bandOrder.indexOf(targetBandKey);
  
  if (currentIndex === -1 || targetIndex === -1) return [];

  const start = Math.min(currentIndex, targetIndex);
  const end = Math.max(currentIndex, targetIndex);
  
  return bandOrder.slice(start, end + 1);
}

/**
 * Calculate new distance after movement
 * @param {number} currentDistance - Current distance in km
 * @param {string} direction - 'CLOSER' or 'FARTHER'
 * @param {number} movementPoints - Movement points to spend
 * @param {number} shipSpeed - Ship speed stat
 * @returns {number} New distance in km
 */
export function calculateNewDistance(currentDistance, direction, movementPoints, shipSpeed = 100) {
  const currentBandKey = getDistanceBandKey(currentDistance);
  const bandOrder = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
  const currentIndex = bandOrder.indexOf(currentBandKey);

  // Calculate how many bands we can move
  const baseCostPerBand = 50;
  const speedModifier = 100 / Math.max(shipSpeed, 1);
  const costPerBand = baseCostPerBand * speedModifier;
  
  const bandsToMove = Math.floor(movementPoints / costPerBand);
  
  if (bandsToMove === 0) return currentDistance; // Not enough movement

  // Calculate target band index
  let targetIndex;
  if (direction === 'CLOSER') {
    targetIndex = Math.max(0, currentIndex - bandsToMove);
  } else if (direction === 'FARTHER') {
    targetIndex = Math.min(bandOrder.length - 1, currentIndex + bandsToMove);
  } else {
    console.error('Invalid direction:', direction);
    return currentDistance;
  }

  const targetBandKey = bandOrder[targetIndex];
  const targetBand = DISTANCE_BANDS[targetBandKey];

  // Return middle of target band
  return Math.floor((targetBand.min + targetBand.max) / 2);
}

/**
 * Get optimal range band for a weapon (band with best modifier)
 * @param {object} weapon - Weapon with rangeModifiers
 * @returns {string} Optimal distance band key
 */
export function getOptimalRangeBand(weapon) {
  if (!weapon?.rangeModifiers) return 'CLOSE';

  let bestBand = 'CLOSE';
  let bestModifier = -Infinity;

  for (const [bandKey, modifier] of Object.entries(weapon.rangeModifiers)) {
    if (modifier !== null && modifier > bestModifier) {
      bestModifier = modifier;
      bestBand = bandKey;
    }
  }

  return bestBand;
}

/**
 * Check if moving closer to target
 * @param {string} currentBandKey - Current band
 * @param {string} targetBandKey - Target band
 * @returns {boolean} True if should move to lower index (closer)
 */
export function shouldMoveCloser(currentBandKey, targetBandKey) {
  const bandOrder = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
  const currentIndex = bandOrder.indexOf(currentBandKey);
  const targetIndex = bandOrder.indexOf(targetBandKey);
  
  return targetIndex < currentIndex;
}
