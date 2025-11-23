/**
 * Event Trigger Service
 * 
 * Handles checking if events can be triggered based on game state and conditions.
 * This service determines which events are available for a given POI action.
 */

const { readJSON } = require('../utils/fileHandler');

/**
 * Check if a POI action can trigger an event
 * @param {Object} params - Parameters for trigger check
 * @param {string} params.poiType - Type of POI (e.g., 'BELT', 'STATION')
 * @param {string} params.action - Action being performed (e.g., 'survey', 'mine')
 * @param {Object} params.shipState - Current ship state including systems, inventory, etc.
 * @param {Object} params.clusterData - Current cluster data if applicable
 * @returns {Promise<Object|null>} - Event object if triggered, null otherwise
 */
async function checkPOIActionTrigger({ poiType, action, shipState, clusterData }) {
  try {
    console.log('[TRIGGER SERVICE] Checking POI action:', { poiType, action, clusterData });
    console.log('[TRIGGER SERVICE] shipState received:', JSON.stringify(shipState, null, 2));
    
    // Load POI events
    const events = await readJSON('events_poi.json');

    // Filter events by POI action type
    const candidateEvents = events.filter(event => {
      if (event.trigger?.type !== 'poi_action') return false;
      if (event.trigger?.action !== action) return false;
      if (!event.metadata?.enabled) return false;

      const conditions = event.trigger?.conditions || {};

      // Check POI type match - MUST match if specified in either conditions or request
      if (poiType) {
        // If request specifies poiType, event MUST have matching poiType condition
        if (!conditions.poiType || conditions.poiType !== poiType) {
          console.log('[TRIGGER SERVICE] Rejected event - poiType mismatch:', event.id, { required: conditions.poiType, provided: poiType });
          return false;
        }
      } else if (conditions.poiType) {
        // If event requires poiType but request doesn't specify, reject
        console.log('[TRIGGER SERVICE] Rejected event - no poiType provided:', event.id);
        return false;
      }

      // Check if required system is operational
      if (conditions.requiresSystem) {
        const system = shipState?.systems?.[conditions.requiresSystem];
        console.log('[TRIGGER SERVICE] Checking system requirement:', { 
          eventId: event.id,
          requiredSystem: conditions.requiresSystem, 
          systemFound: !!system, 
          health: system?.health,
          allSystems: Object.keys(shipState?.systems || {})
        });
        if (!system || system.health <= 0) {
          console.log('[TRIGGER SERVICE] Rejected event - system requirement failed:', event.id);
          return false;
        }
      }

      // Check scan status for survey actions
      if (conditions.notScanned !== undefined) {
        const isScanned = clusterData?.scanned || false;
        if (conditions.notScanned && isScanned) {
          return false;
        }
      }

      // Check if cluster is registered for mining actions
      if (conditions.clusterRegistered !== undefined) {
        const isRegistered = clusterData?.registered || false;
        if (conditions.clusterRegistered && !isRegistered) {
          return false;
        }
      }

      // Check if asteroids are available
      if (conditions.asteroidsAvailable !== undefined) {
        const asteroidsRemaining = clusterData?.asteroidsRemaining || 0;
        if (conditions.asteroidsAvailable && asteroidsRemaining <= 0) {
          return false;
        }
      }

      return true;
    });

    // If multiple events match, use weighted random selection
    if (candidateEvents.length === 0) {
      return null;
    }

    if (candidateEvents.length === 1) {
      return candidateEvents[0];
    }

    // Weight-based selection
    const totalWeight = candidateEvents.reduce((sum, e) => sum + (e.trigger?.weight || 1.0), 0);
    let random = Math.random() * totalWeight;

    for (const event of candidateEvents) {
      const weight = event.trigger?.weight || 1.0;
      random -= weight;
      if (random <= 0) {
        return event;
      }
    }

    return candidateEvents[0]; // Fallback
  } catch (error) {
    console.error('Error checking POI action trigger:', error);
    return null;
  }
}

/**
 * Get available POI actions for a given location
 * @param {Object} params - Parameters
 * @param {string} params.poiType - Type of POI
 * @param {Object} params.shipState - Current ship state
 * @param {Object} params.clusterData - Current cluster data if applicable
 * @returns {Promise<Array>} - Array of available actions
 */
async function getAvailablePOIActions({ poiType, shipState, clusterData }) {
  try {
    const events = await readJSON('events_poi.json');

    const availableActions = new Set();

    for (const event of events) {
      if (event.trigger?.type !== 'poi_action') continue;
      if (!event.metadata?.enabled) continue;

      const conditions = event.trigger?.conditions || {};

      // Check POI type
      if (conditions.poiType && conditions.poiType !== poiType) {
        continue;
      }

      // Check if required system is operational
      if (conditions.requiresSystem) {
        const system = shipState?.systems?.[conditions.requiresSystem];
        if (!system || system.health <= 0) {
          continue;
        }
      }

      // Check scan status
      if (conditions.notScanned !== undefined) {
        const isScanned = clusterData?.scanned || false;
        if (conditions.notScanned && isScanned) {
          continue;
        }
      }

      // Check cluster registration
      if (conditions.clusterRegistered !== undefined) {
        const isRegistered = clusterData?.registered || false;
        if (conditions.clusterRegistered && !isRegistered) {
          continue;
        }
      }

      // Check asteroids available
      if (conditions.asteroidsAvailable !== undefined) {
        const asteroidsRemaining = clusterData?.asteroidsRemaining || 0;
        if (conditions.asteroidsAvailable && asteroidsRemaining <= 0) {
          continue;
        }
      }

      availableActions.add(event.trigger.action);
    }

    return Array.from(availableActions);
  } catch (error) {
    console.error('Error getting available POI actions:', error);
    return [];
  }
}

module.exports = {
  checkPOIActionTrigger,
  getAvailablePOIActions
};
