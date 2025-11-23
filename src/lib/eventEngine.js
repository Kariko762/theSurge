/**
 * Event Engine - Client Side
 * 
 * Handles event triggering and outcome processing on the frontend.
 * Interfaces with the backend event system and updates game state.
 */

const API_BASE = 'http://localhost:3001/api';

class EventEngine {
  constructor() {
    this.activeEvent = null;
    this.eventHistory = [];
  }

  /**
   * Trigger a POI action and check if it triggers an event
   * @param {Object} params - Action parameters
   * @param {string} params.poiType - Type of POI (e.g., 'BELT', 'STATION')
   * @param {string} params.action - Action to perform (e.g., 'survey', 'mine')
   * @param {Object} params.shipState - Current ship state
   * @param {Object} params.clusterData - Current cluster data (optional)
   * @returns {Promise<Object>} - Event trigger result
   */
  async triggerPOIAction({ poiType, action, shipState, clusterData = null }) {
    try {
      const response = await fetch(`${API_BASE}/events/trigger-poi-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poiType,
          action,
          shipState,
          clusterData
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to trigger POI action');
      }

      if (data.triggered && data.event) {
        this.activeEvent = data.event;
        return {
          triggered: true,
          event: data.event,
          scenario: data.event.scenario,
          branches: data.event.branches
        };
      }

      return {
        triggered: false,
        message: data.message
      };
    } catch (error) {
      console.error('Error triggering POI action:', error);
      throw error;
    }
  }

  /**
   * Get available actions for a POI
   * @param {Object} params - Parameters
   * @param {string} params.poiType - Type of POI
   * @param {Object} params.shipState - Current ship state
   * @param {Object} params.clusterData - Current cluster data (optional)
   * @returns {Promise<Array>} - Array of available action strings
   */
  async getAvailablePOIActions({ poiType, shipState, clusterData = null }) {
    try {
      const response = await fetch(`${API_BASE}/events/available-poi-actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          poiType,
          shipState,
          clusterData
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get available actions');
      }

      return data.actions || [];
    } catch (error) {
      console.error('Error getting available POI actions:', error);
      return [];
    }
  }

  /**
   * Execute an event branch
   * @param {Object} params - Execution parameters
   * @param {string} params.branchId - Branch ID to execute
   * @param {Object} params.shipState - Current ship state
   * @param {Object} params.clusterData - Current cluster data (optional)
   * @param {Object} params.rollResult - Challenge roll result (optional)
   * @returns {Promise<Object>} - Execution result with outcome and state changes
   */
  async executeBranch({ branchId, shipState, clusterData = null, rollResult = null }) {
    try {
      if (!this.activeEvent) {
        throw new Error('No active event to execute branch for');
      }

      const response = await fetch(`${API_BASE}/events/execute-branch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: this.activeEvent,
          branchId,
          shipState,
          clusterData,
          rollResult
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to execute branch');
      }

      // Store in history
      this.eventHistory.push({
        eventId: this.activeEvent.id,
        branchId,
        outcome: result.outcome,
        timestamp: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('Error executing branch:', error);
      throw error;
    }
  }

  /**
   * Apply outcome changes to game state
   * @param {Object} outcome - Outcome result from executeBranch
   * @param {Object} currentState - Current game state
   * @returns {Object} - Updated game state with encounter if present
   */
  applyOutcomeChanges(outcome, currentState) {
    const newState = { ...currentState };

    // Apply ship state changes
    if (outcome.changes?.shipState) {
      newState.ship = {
        ...newState.ship,
        ...outcome.changes.shipState
      };
    }

    // Apply cluster data changes
    if (outcome.changes?.clusterData) {
      newState.clusterData = {
        ...newState.clusterData,
        ...outcome.changes.clusterData
      };
    }

    // Add items to inventory
    if (outcome.outcome?.items && outcome.outcome.items.length > 0) {
      newState.inventory = newState.inventory || [];
      newState.inventory.push(...outcome.outcome.items);
    }

    // Include encounter data if present
    if (outcome.outcome?.encounter) {
      newState.activeEncounter = outcome.outcome.encounter;
      console.log('[EVENT ENGINE] Encounter triggered:', outcome.outcome.encounter.id);
    }

    return newState;
  }

  /**
   * Clear active event
   */
  clearActiveEvent() {
    this.activeEvent = null;
  }

  /**
   * Get event history
   * @returns {Array} - Array of past event executions
   */
  getHistory() {
    return [...this.eventHistory];
  }

  /**
   * Get active event
   * @returns {Object|null} - Current active event or null
   */
  getActiveEvent() {
    return this.activeEvent;
  }
}

// Create singleton instance
const eventEngine = new EventEngine();

export default eventEngine;
export { EventEngine };
