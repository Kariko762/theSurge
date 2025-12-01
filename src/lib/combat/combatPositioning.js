/**
 * Combat Positioning System
 * Tracks relative distances between all combatants in a battle
 * Replaces hex grid with simple distance-based positioning
 */

import { getDistanceBand, getDistanceBandKey, calculateNewDistance } from './distanceBands.js';

export class CombatPositioning {
  constructor() {
    // FTL-style lane positioning: 10 positions total
    // Positions 0-4: Player side (left)
    // Positions 5-9: Opponent side (right)
    // Map of ship ID to lane position (0-9)
    this.positions = new Map();
    
    // Map of ship IDs to faction/team
    this.factions = new Map();
    
    // Distance per position difference (in km)
    // Each position = 100km, so max distance (0 to 9) = 900km
    this.kmPerPosition = 100;
  }

  /**
   * Initialize positioning for a combat encounter
   * @param {Array} ships - Array of ship objects with id, faction, isPlayer
   * @param {number} initialDistance - Starting distance (unused, kept for compatibility)
   */
  initializeCombat(ships, initialDistance = 300) {
    this.positions.clear();
    this.factions.clear();

    // Assign starting positions based on faction
    // Player faction starts at position 2 (middle of player side)
    // Opponent faction starts at position 7 (middle of opponent side)
    ships.forEach(ship => {
      this.factions.set(ship.id, ship.faction || 'neutral');
      
      // Determine starting position
      if (ship.isPlayer || ship.faction === 'player') {
        this.positions.set(ship.id, 2); // Middle of player side (0-4)
      } else {
        this.positions.set(ship.id, 7); // Middle of opponent side (5-9)
      }
    });
  }

  /**
   * Get lane position for a ship
   * @param {string} shipId - Ship ID
   * @returns {number} Lane position (0-9)
   */
  getPosition(shipId) {
    const pos = this.positions.get(shipId);
    if (pos === undefined) {
      console.warn(`No position found for ${shipId}, defaulting to 5`);
      return 5; // Default to middle
    }
    return pos;
  }

  /**
   * Set lane position for a ship
   * @param {string} shipId - Ship ID
   * @param {number} position - Lane position (0-9)
   */
  setPosition(shipId, position) {
    // Clamp to valid range
    const clamped = Math.max(0, Math.min(9, Math.floor(position)));
    this.positions.set(shipId, clamped);
  }

  /**
   * Calculate distance in km between two ships based on their lane positions
   * @param {string} ship1Id - First ship ID
   * @param {string} ship2Id - Second ship ID
   * @returns {number} Distance in kilometers
   */
  getDistance(ship1Id, ship2Id) {
    const pos1 = this.getPosition(ship1Id);
    const pos2 = this.getPosition(ship2Id);
    const positionDiff = Math.abs(pos2 - pos1);
    return positionDiff * this.kmPerPosition;
  }

  /**
   * Get distance band between two ships
   * @param {string} ship1Id - First ship ID
   * @param {string} ship2Id - Second ship ID
   * @returns {object} Distance band object
   */
  getDistanceBand(ship1Id, ship2Id) {
    const distance = this.getDistance(ship1Id, ship2Id);
    return getDistanceBand(distance);
  }

  /**
   * Get distance band key between two ships
   * @param {string} ship1Id - First ship ID
   * @param {string} ship2Id - Second ship ID
   * @returns {string} Distance band key (POINT_BLANK, CLOSE, etc.)
   */
  getDistanceBandKey(ship1Id, ship2Id) {
    const distance = this.getDistance(ship1Id, ship2Id);
    return getDistanceBandKey(distance);
  }

  /**
   * Check if two ships are in the same faction
   * @param {string} ship1Id - First ship ID
   * @param {string} ship2Id - Second ship ID
   * @returns {boolean}
   */
  areSameFaction(ship1Id, ship2Id) {
    const faction1 = this.factions.get(ship1Id);
    const faction2 = this.factions.get(ship2Id);
    return faction1 === faction2;
  }

  /**
   * Move ship closer to target (decrease position difference)
   * @param {string} shipId - Moving ship ID
   * @param {string} targetId - Target ship ID
   * @param {number} movementPoints - Movement points to spend (unused, movement is 1 position per action)
   * @param {number} shipSpeed - Ship speed stat (unused, kept for compatibility)
   * @returns {object} Result with newDistance, oldDistance, bandChanged
   */
  moveCloser(shipId, targetId, movementPoints, shipSpeed = 100) {
    const oldPos = this.getPosition(shipId);
    const targetPos = this.getPosition(targetId);
    const oldDistance = this.getDistance(shipId, targetId);
    const oldBand = getDistanceBandKey(oldDistance);
    
    // Determine which direction is closer
    let newPos = oldPos;
    if (oldPos < targetPos) {
      // Target is to the right, move right (increase position)
      newPos = Math.min(oldPos + 1, 4); // Can't go past position 4 (player side limit)
    } else if (oldPos > targetPos) {
      // Target is to the left, move left (decrease position)
      newPos = Math.max(oldPos - 1, 5); // Can't go below position 5 (opponent side limit)
    }
    
    this.setPosition(shipId, newPos);
    const newDistance = this.getDistance(shipId, targetId);
    const newBand = getDistanceBandKey(newDistance);

    return {
      success: newDistance < oldDistance,
      oldDistance,
      newDistance,
      oldBand,
      newBand,
      oldPosition: oldPos,
      newPosition: newPos,
      bandChanged: oldBand !== newBand,
      distanceReduced: oldDistance - newDistance
    };
  }

  /**
   * Move ship farther from target (increase position difference)
   * @param {string} shipId - Moving ship ID
   * @param {string} targetId - Target ship ID
   * @param {number} movementPoints - Movement points to spend (unused)
   * @param {number} shipSpeed - Ship speed stat (unused)
   * @returns {object} Result with newDistance, oldDistance, bandChanged
   */
  moveFarther(shipId, targetId, movementPoints, shipSpeed = 100) {
    const oldPos = this.getPosition(shipId);
    const targetPos = this.getPosition(targetId);
    const oldDistance = this.getDistance(shipId, targetId);
    const oldBand = getDistanceBandKey(oldDistance);
    
    // Determine which direction is farther
    let newPos = oldPos;
    if (oldPos < targetPos) {
      // Target is to the right, move left (decrease position)
      newPos = Math.max(oldPos - 1, 0); // Can't go below position 0
    } else if (oldPos > targetPos) {
      // Target is to the left, move right (increase position)
      newPos = Math.min(oldPos + 1, 9); // Can't go past position 9
    }
    
    this.setPosition(shipId, newPos);
    const newDistance = this.getDistance(shipId, targetId);
    const newBand = getDistanceBandKey(newDistance);

    return {
      success: newDistance > oldDistance,
      oldDistance,
      newDistance,
      oldBand,
      newBand,
      oldPosition: oldPos,
      newPosition: newPos,
      bandChanged: oldBand !== newBand,
      distanceIncreased: newDistance - oldDistance
    };
  }

  /**
   * Get all distances from a specific ship
   * @param {string} shipId - Ship ID
   * @returns {Map<string, number>} Map of target IDs to distances
   */
  getAllDistancesFrom(shipId) {
    const result = new Map();
    const shipPos = this.getPosition(shipId);

    for (const [otherId, otherPos] of this.positions.entries()) {
      if (otherId !== shipId) {
        const distance = Math.abs(otherPos - shipPos) * this.kmPerPosition;
        result.set(otherId, distance);
      }
    }

    return result;
  }

  /**
   * Get all enemies within a certain distance band
   * @param {string} shipId - Ship ID
   * @param {Array<string>} enemyIds - Array of enemy ship IDs
   * @param {string} maxBandKey - Maximum distance band (inclusive)
   * @returns {Array<object>} Array of enemies with id, distance, band
   */
  getEnemiesInRange(shipId, enemyIds, maxBandKey = 'EXTREME') {
    const bandOrder = ['POINT_BLANK', 'CLOSE', 'MEDIUM', 'LONG', 'EXTREME'];
    const maxBandIndex = bandOrder.indexOf(maxBandKey);

    return enemyIds
      .map(enemyId => ({
        id: enemyId,
        distance: this.getDistance(shipId, enemyId),
        band: this.getDistanceBandKey(shipId, enemyId)
      }))
      .filter(enemy => {
        const bandIndex = bandOrder.indexOf(enemy.band);
        return bandIndex <= maxBandIndex;
      });
  }

  /**
   * Get closest enemy to a ship
   * @param {string} shipId - Ship ID
   * @param {Array<string>} enemyIds - Array of enemy ship IDs
   * @returns {object|null} Closest enemy with id, distance, band
   */
  getClosestEnemy(shipId, enemyIds) {
    if (!enemyIds || enemyIds.length === 0) return null;

    let closest = null;
    let closestDistance = Infinity;

    for (const enemyId of enemyIds) {
      const distance = this.getDistance(shipId, enemyId);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = {
          id: enemyId,
          distance,
          band: getDistanceBandKey(distance)
        };
      }
    }

    return closest;
  }

  /**
   * Get farthest enemy from a ship
   * @param {string} shipId - Ship ID
   * @param {Array<string>} enemyIds - Array of enemy ship IDs
   * @returns {object|null} Farthest enemy with id, distance, band
   */
  getFarthestEnemy(shipId, enemyIds) {
    if (!enemyIds || enemyIds.length === 0) return null;

    let farthest = null;
    let farthestDistance = -Infinity;

    for (const enemyId of enemyIds) {
      const distance = this.getDistance(shipId, enemyId);
      if (distance > farthestDistance) {
        farthestDistance = distance;
        farthest = {
          id: enemyId,
          distance,
          band: getDistanceBandKey(distance)
        };
      }
    }

    return farthest;
  }

  /**
   * Update distances for all ships after one ship moves
   * In multi-ship combat, moving affects distances to all other ships
   * For simplicity, this updates the primary target distance
   * (More complex geometry could be added later)
   * 
   * @param {string} shipId - Ship that moved
   * @param {string} primaryTargetId - Main target ship moved relative to
   * @param {number} newDistance - New distance to primary target
   */
  updateDistancesAfterMove(shipId, primaryTargetId, newDistance) {
    // Update primary target distance
    this.setDistance(shipId, primaryTargetId, newDistance);

    // Optional: Update distances to other ships based on geometry
    // For now, we keep it simple and only update the primary target
    // Future: Could calculate triangulation for multi-ship scenarios
  }

  /**
   * Get combat positioning summary for a ship
   * @param {string} shipId - Ship ID
   * @param {Array<string>} enemyIds - Enemy ship IDs
   * @returns {object} Summary with closest, farthest, average distance
   */
  getPositionSummary(shipId, enemyIds) {
    const closest = this.getClosestEnemy(shipId, enemyIds);
    const farthest = this.getFarthestEnemy(shipId, enemyIds);
    
    const distances = enemyIds.map(id => this.getDistance(shipId, id));
    const averageDistance = distances.length > 0 
      ? distances.reduce((a, b) => a + b, 0) / distances.length 
      : 0;

    return {
      closest,
      farthest,
      averageDistance,
      averageBand: getDistanceBandKey(averageDistance),
      enemyCount: enemyIds.length
    };
  }

  /**
   * Check if a ship is surrounded (enemies at multiple distance bands)
   * @param {string} shipId - Ship ID
   * @param {Array<string>} enemyIds - Enemy ship IDs
   * @returns {boolean} True if surrounded
   */
  isSurrounded(shipId, enemyIds) {
    const bands = new Set();
    
    enemyIds.forEach(enemyId => {
      const band = this.getDistanceBandKey(shipId, enemyId);
      bands.add(band);
    });

    // Surrounded if enemies in 3+ different bands
    return bands.size >= 3;
  }

  /**
   * Export positioning state (for save/load)
   * @returns {object} Serializable state
   */
  exportState() {
    return {
      distances: Array.from(this.distances.entries()),
      factions: Array.from(this.factions.entries()),
      facings: Array.from(this.facings.entries())
    };
  }

  /**
   * Import positioning state (for save/load)
   * @param {object} state - State from exportState()
   */
  importState(state) {
    this.distances = new Map(state.distances || []);
    this.factions = new Map(state.factions || []);
    this.facings = new Map(state.facings || []);
  }
}
