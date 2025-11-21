/**
 * POI Action System
 * Manages hierarchical actions for Points of Interest with DRE integration
 */

import poiActionsData from '../data/poi_actions.json';

class POIActionSystem {
  constructor() {
    this.actionDefinitions = poiActionsData.actionDefinitions;
  }

  /**
   * Get all available actions for a POI type
   * @param {string} poiType - POI type (PLANET, MOON, BELT, etc.)
   * @param {Object} context - Context for evaluating requirements (shipState, skills, etc.)
   * @returns {Array} Array of enabled actions
   */
  getActionsForPOI(poiType, context = {}) {
    const definition = this.actionDefinitions[poiType];
    if (!definition) {
      console.warn(`No action definition found for POI type: ${poiType}`);
      return [];
    }

    return definition.actions.filter(action => {
      // Filter based on enabled flag and requirements
      if (!action.enabled) return false;
      if (action.requirements) {
        return this.checkRequirements(action.requirements, context);
      }
      return true;
    });
  }

  /**
   * Get child actions for a parent action
   * @param {string} poiType - POI type
   * @param {string} parentActionId - Parent action ID
   * @param {Object} context - Context for evaluating requirements
   * @returns {Array} Array of child actions
   */
  getChildActions(poiType, parentActionId, context = {}) {
    const definition = this.actionDefinitions[poiType];
    if (!definition) return [];

    const parentAction = definition.actions.find(a => a.id === parentActionId);
    if (!parentAction || !parentAction.children) return [];

    return parentAction.children.filter(child => {
      if (child.requirements) {
        return this.checkRequirements(child.requirements, context);
      }
      return true;
    });
  }

  /**
   * Get a specific action by ID
   * @param {string} poiType - POI type
   * @param {string} actionId - Action ID
   * @returns {Object|null} Action definition or null
   */
  getAction(poiType, actionId) {
    const definition = this.actionDefinitions[poiType];
    if (!definition) return null;

    // Check parent actions
    let action = definition.actions.find(a => a.id === actionId);
    if (action) return action;

    // Check child actions
    for (const parentAction of definition.actions) {
      if (parentAction.children) {
        action = parentAction.children.find(a => a.id === actionId);
        if (action) return action;
      }
    }

    return null;
  }

  /**
   * Check if requirements are met
   * @param {Object} requirements - Requirements object
   * @param {Object} context - Context containing shipState, inventory, skills, etc.
   * @returns {boolean} True if all requirements met
   */
  checkRequirements(requirements, context) {
    // Check ship systems
    if (requirements.shipSystems) {
      if (!context.shipSystems) return false;
      for (const system of requirements.shipSystems) {
        if (!context.shipSystems[system] || !context.shipSystems[system].operational) {
          return false;
        }
      }
    }

    // Check power level
    if (requirements.minPowerLevel) {
      if (!context.currentPower || context.currentPower < requirements.minPowerLevel) {
        return false;
      }
    }

    // Check inventory items
    if (requirements.inventory) {
      if (!context.inventory) return false;
      for (const item of requirements.inventory) {
        const available = context.inventory.getQuantity(item.itemId);
        if (available < item.quantity) {
          return false;
        }
      }
    }

    // Check skills
    if (requirements.skills) {
      if (!context.skills) return false;
      for (const skillReq of requirements.skills) {
        const skillLevel = context.skills[skillReq.name] || 0;
        if (skillLevel < skillReq.level) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get DRE table name for an action
   * @param {string} poiType - POI type
   * @param {string} actionId - Action ID
   * @returns {string|null} DRE table name or null
   */
  getDRETable(poiType, actionId) {
    const action = this.getAction(poiType, actionId);
    return action?.dreTable || null;
  }

  /**
   * Get action duration in seconds
   * @param {string} poiType - POI type
   * @param {string} actionId - Action ID
   * @returns {number} Duration in seconds, or 0 for immediate actions
   */
  getDuration(poiType, actionId) {
    const action = this.getAction(poiType, actionId);
    return action?.duration || 0;
  }

  /**
   * Check if action is immediate (no duration)
   * @param {string} poiType - POI type
   * @param {string} actionId - Action ID
   * @returns {boolean} True if immediate
   */
  isImmediate(poiType, actionId) {
    const action = this.getAction(poiType, actionId);
    return action?.immediate === true;
  }

  /**
   * Check if action has children
   * @param {string} poiType - POI type
   * @param {string} actionId - Action ID
   * @returns {boolean} True if has children
   */
  hasChildren(poiType, actionId) {
    const action = this.getAction(poiType, actionId);
    return action?.parent === true && action?.children?.length > 0;
  }

  /**
   * Get formatted action info for display
   * @param {string} poiType - POI type
   * @param {string} actionId - Action ID
   * @returns {Object} Formatted action info
   */
  getActionInfo(poiType, actionId) {
    const action = this.getAction(poiType, actionId);
    if (!action) return null;

    return {
      id: action.id,
      label: action.label,
      description: action.description,
      icon: action.icon,
      duration: action.duration || 0,
      immediate: action.immediate || false,
      hasChildren: action.parent === true,
      requirements: action.requirements || {},
      dreTable: action.dreTable || null
    };
  }

  /**
   * Get missing requirements for an action
   * @param {string} poiType - POI type
   * @param {string} actionId - Action ID
   * @param {Object} context - Context
   * @returns {Array} Array of missing requirement descriptions
   */
  getMissingRequirements(poiType, actionId, context) {
    const action = this.getAction(poiType, actionId);
    if (!action || !action.requirements) return [];

    const missing = [];
    const req = action.requirements;

    // Check ship systems
    if (req.shipSystems) {
      for (const system of req.shipSystems) {
        if (!context.shipSystems || !context.shipSystems[system]?.operational) {
          missing.push(`Requires ${system.replace(/_/g, ' ')}`);
        }
      }
    }

    // Check power
    if (req.minPowerLevel) {
      if (!context.currentPower || context.currentPower < req.minPowerLevel) {
        missing.push(`Requires ${req.minPowerLevel}% power (current: ${context.currentPower || 0}%)`);
      }
    }

    // Check inventory
    if (req.inventory) {
      for (const item of req.inventory) {
        const available = context.inventory?.getQuantity(item.itemId) || 0;
        if (available < item.quantity) {
          missing.push(`Requires ${item.quantity}x ${item.itemId} (have: ${available})`);
        }
      }
    }

    // Check skills
    if (req.skills) {
      for (const skillReq of req.skills) {
        const skillLevel = context.skills?.[skillReq.name] || 0;
        if (skillLevel < skillReq.level) {
          missing.push(`Requires ${skillReq.name} level ${skillReq.level} (current: ${skillLevel})`);
        }
      }
    }

    return missing;
  }

  /**
   * Get all POI types
   * @returns {Array} Array of POI type names
   */
  getAllPOITypes() {
    return Object.keys(this.actionDefinitions);
  }
}

// Singleton instance
const poiActionSystem = new POIActionSystem();

export default poiActionSystem;
