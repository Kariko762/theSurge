/**
 * Event Outcome Processor Service
 * 
 * Handles event outcomes and applies special effects to game state.
 * Handles narrative pool resolution, loot pool resolution, and special flags.
 */

const { readJSON, writeJSON } = require('../utils/fileHandler');
const fs = require('fs');
const path = require('path');

// Telemetry logging helper
async function logTelemetry(eventId, branchId, outcome, duration = 0) {
  try {
    const telemetryPath = path.join(__dirname, '../data/telemetry.json');
    let telemetryData = { events: [] };
    
    if (fs.existsSync(telemetryPath)) {
      const rawData = fs.readFileSync(telemetryPath, 'utf8');
      telemetryData = JSON.parse(rawData);
    }
    
    telemetryData.events.push({
      eventId,
      scenarioId: branchId,
      timestamp: new Date().toISOString(),
      duration,
      playerChoice: branchId,
      outcome: outcome.type || outcome.outcomeType,
      rewards: {
        items: outcome.items || [],
        xp: outcome.rewards?.xp || 0,
        credits: outcome.rewards?.credits || 0
      }
    });
    
    fs.writeFileSync(telemetryPath, JSON.stringify(telemetryData, null, 2));
  } catch (error) {
    console.error('Failed to log telemetry:', error);
    // Don't throw - telemetry failure shouldn't break event execution
  }
}

/**
 * Resolve a narrative pool to get a specific narrative
 * @param {string} poolId - Narrative pool ID
 * @returns {Promise<Object|null>} - Resolved narrative entry or null
 */
async function resolveNarrativePool(poolId) {
  try {
    const config = await readJSON('config.json');
    const pool = config.narrativeLibrary?.pools?.find(p => p.id === poolId);

    if (!pool || !pool.entries || pool.entries.length === 0) {
      return null;
    }

    // Weight-based random selection
    const totalWeight = pool.entries.reduce((sum, entry) => sum + entry.weight, 0);
    let random = Math.random() * totalWeight;

    for (const entry of pool.entries) {
      random -= entry.weight;
      if (random <= 0) {
        return {
          title: entry.title,
          message: entry.message,
          systemMessage: entry.systemMessage,
          tone: entry.tone,
          assignDefinition: entry.assignDefinition
        };
      }
    }

    // Fallback to first entry
    const first = pool.entries[0];
    return {
      title: first.title,
      message: first.message,
      systemMessage: first.systemMessage,
      tone: first.tone,
      assignDefinition: first.assignDefinition
    };
  } catch (error) {
    console.error('Error resolving narrative pool:', error);
    return null;
  }
}

/**
 * Resolve an encounter based on disposition and tags
 * @param {Object} encounterSpec - Encounter specification from outcome
 * @param {string} encounterSpec.disposition - 'hostile', 'neutral', or 'positive'
 * @param {Array<string>} encounterSpec.tags - Tags to filter encounters (optional)
 * @param {string} encounterSpec.id - Specific encounter ID (optional)
 * @returns {Promise<Object|null>} - Matched encounter or null
 */
async function resolveEncounter(encounterSpec) {
  try {
    const encounters = await readJSON('encounters.json');
    
    // If specific ID provided, return that encounter
    if (encounterSpec.id) {
      const specific = encounters.find(e => e.id === encounterSpec.id);
      return specific?.enabled ? specific : null;
    }

    // Filter by disposition and enabled status
    let candidates = encounters.filter(e => 
      e.enabled && 
      (!encounterSpec.disposition || e.disposition === encounterSpec.disposition)
    );

    // Further filter by tags if specified
    if (encounterSpec.tags && encounterSpec.tags.length > 0) {
      candidates = candidates.filter(e => 
        e.tags && encounterSpec.tags.some(tag => e.tags.includes(tag))
      );
    }

    if (candidates.length === 0) {
      return null;
    }

    // Weight-based random selection
    const totalWeight = candidates.reduce((sum, e) => sum + (e.weight || 1.0), 0);
    let random = Math.random() * totalWeight;

    for (const encounter of candidates) {
      const weight = encounter.weight || 1.0;
      random -= weight;
      if (random <= 0) {
        return encounter;
      }
    }

    // Fallback to first candidate
    return candidates[0];
  } catch (error) {
    console.error('Error resolving encounter:', error);
    return null;
  }
}

/**
 * Resolve a loot pool to get specific items
 * @param {string} poolId - Loot pool ID
 * @returns {Promise<Array>} - Array of item objects with full details
 */
async function resolveLootPool(poolId) {
  try {
    const config = await readJSON('config.json');
    const pool = config.lootTables?.pools?.find(p => p.id === poolId);

    if (!pool || !pool.entries || pool.entries.length === 0) {
      return [];
    }

    // Load item database for full item details
    let itemDatabase = {};
    try {
      const dbData = await readJSON('items/itemDatabase.json');
      itemDatabase = dbData.items || {};
    } catch (error) {
      console.warn('Could not load item database, using itemId only');
    }

    const items = [];
    const itemCounts = {}; // Track quantities per item type

    // Roll for each entry
    for (const entry of pool.entries) {
      const roll = Math.random() * 100; // Roll 0-100 for weight-based selection
      if (roll <= entry.weight) {
        // Determine quantity
        const min = entry.minQuantity || entry.quantityRange?.min || 1;
        const max = entry.maxQuantity || entry.quantityRange?.max || 1;
        const quantity = Math.floor(Math.random() * (max - min + 1)) + min;

        // Accumulate quantities
        itemCounts[entry.itemId] = (itemCounts[entry.itemId] || 0) + quantity;
      }
    }

    // Convert to item objects with full details
    for (const [itemId, quantity] of Object.entries(itemCounts)) {
      const itemDef = itemDatabase[itemId];
      
      items.push({
        itemId,
        name: itemDef?.name || itemId,
        quantity,
        category: itemDef?.category || 'resource',
        rarity: itemDef?.rarity || 'common',
        value: itemDef?.value || 0
      });
    }

    return items;
  } catch (error) {
    console.error('Error resolving loot pool:', error);
    return [];
  }
}

/**
 * Process outcome effects and apply to ship state
 * @param {Object} outcome - Event outcome object
 * @param {Object} shipState - Current ship state
 * @param {Object} clusterData - Current cluster data (if applicable)
 * @returns {Promise<Object>} - Updated state with changes applied
 */
async function processOutcomeEffects(outcome, shipState, clusterData = null) {
  const changes = {
    shipState: { ...shipState },
    clusterData: clusterData ? { ...clusterData } : null,
    narrative: null,
    items: [],
    experience: [],
    encounter: null
  };

  try {
    // Resolve encounter if present
    if (outcome.encounter) {
      changes.encounter = await resolveEncounter(outcome.encounter);
      console.log('[EVENT OUTCOME] Encounter resolved:', changes.encounter?.id || 'none');
    }

    // Resolve narrative pool if present
    if (outcome.narrativePool) {
      changes.narrative = await resolveNarrativePool(outcome.narrativePool);
    } else if (outcome.narrative) {
      // Use direct narrative if provided
      changes.narrative = {
        title: outcome.narrative.title || 'Event',
        message: outcome.narrative.description || outcome.narrative,
        systemMessage: outcome.narrative.systemMessage || outcome.systemMessage,
        tone: 'neutral'
      };
    }

    // Resolve loot pool if present
    if (outcome.rewards?.lootPool) {
      changes.items = await resolveLootPool(outcome.rewards.lootPool);
    } else if (outcome.rewards?.items) {
      // Use direct items if provided
      changes.items = outcome.rewards.items;
    }

    // Process special effects
    const effects = outcome.rewards?.effects || {};

    // Cluster data registration (for survey events)
    if (effects.clusterData?.register && changes.clusterData) {
      changes.clusterData.registered = true;
      changes.clusterData.scanned = true;
      
      // If narrative assigned a POI definition, store it
      if (changes.narrative?.assignDefinition) {
        changes.clusterData.poiDefinition = changes.narrative.assignDefinition;
      }
    }

    // Asteroid consumption (for mining events)
    if (effects.asteroidConsumed && changes.clusterData) {
      changes.clusterData.asteroidsRemaining = 
        Math.max(0, (changes.clusterData.asteroidsRemaining || 0) - 1);
    }

    // System damage
    if (effects.damage) {
      const systemName = effects.damage.system;
      const amount = effects.damage.amount || 10;

      if (changes.shipState.systems && changes.shipState.systems[systemName]) {
        changes.shipState.systems[systemName].health = Math.max(
          0,
          changes.shipState.systems[systemName].health - amount
        );
      }
    }

    // Experience gain
    if (effects.experience) {
      changes.experience.push({
        skill: effects.experience.skill,
        amount: effects.experience.amount
      });
    }

    // XP rewards
    if (outcome.rewards?.xp) {
      changes.shipState.experience = (changes.shipState.experience || 0) + outcome.rewards.xp;
    }

    // Credit rewards
    if (outcome.rewards?.credits) {
      changes.shipState.credits = (changes.shipState.credits || 0) + outcome.rewards.credits;
    }

    return changes;
  } catch (error) {
    console.error('Error processing outcome effects:', error);
    return changes;
  }
}

/**
 * Execute a branch and process its outcome
 * @param {Object} params - Execution parameters
 * @param {Object} params.event - Event object
 * @param {string} params.branchId - Branch ID to execute
 * @param {Object} params.shipState - Current ship state
 * @param {Object} params.clusterData - Current cluster data (if applicable)
 * @param {Object} params.rollResult - Challenge roll result (if applicable)
 * @returns {Promise<Object>} - Execution result with outcome and changes
 */
async function executeBranch({ event, branchId, shipState, clusterData, rollResult }) {
  const startTime = Date.now();
  
  try {
    const branch = event.branches?.find(b => b.id === branchId);
    if (!branch) {
      throw new Error(`Branch ${branchId} not found in event ${event.id}`);
    }

    // Determine outcome based on challenge result or subScenarios
    let outcome = null;

    if (branch.subScenarios && branch.subScenarios.length > 0) {
      // Use subScenarios with weighted random selection
      const totalWeight = branch.subScenarios.reduce((sum, s) => sum + s.weight, 0);
      let random = Math.random() * totalWeight;

      for (const subScenario of branch.subScenarios) {
        random -= subScenario.weight;
        if (random <= 0) {
          outcome = {
            ...subScenario,
            narrative: subScenario.narrative,
            narrativePool: subScenario.narrativePool,
            systemMessage: subScenario.narrative?.systemMessage || subScenario.systemMessage,
            rewards: subScenario.rewards
          };
          break;
        }
      }

      // Fallback to first subScenario
      if (!outcome) {
        const first = branch.subScenarios[0];
        outcome = {
          ...first,
          narrative: first.narrative,
          narrativePool: first.narrativePool,
          systemMessage: first.narrative?.systemMessage || first.systemMessage,
          rewards: first.rewards
        };
      }
    } else if (branch.outcomes && branch.outcomes.length > 0) {
      // Use outcomes array (old format compatibility)
      outcome = branch.outcomes[0];
    }

    if (!outcome) {
      throw new Error(`No outcome found for branch ${branchId}`);
    }

    // Process the outcome effects
    const changes = await processOutcomeEffects(outcome, shipState, clusterData);

    const result = {
      success: true,
      outcome: {
        type: outcome.outcomeType || outcome.type,
        narrative: changes.narrative,
        items: changes.items,
        experience: changes.experience,
        rewards: outcome.rewards,
        encounter: changes.encounter
      },
      changes: {
        shipState: changes.shipState,
        clusterData: changes.clusterData
      },
      nextBranch: outcome.nextBranch || null
    };

    // Log to telemetry
    const duration = Date.now() - startTime;
    await logTelemetry(event.id, branchId, result.outcome, duration);

    return result;
  } catch (error) {
    console.error('Error executing branch:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  resolveNarrativePool,
  resolveLootPool,
  resolveEncounter,
  processOutcomeEffects,
  executeBranch
};
