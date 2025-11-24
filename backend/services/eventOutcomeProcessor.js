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
 * Normalize array-like objects (with numeric keys) to actual arrays
 */
function normalizeToArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (!obj || typeof obj !== 'object') return [];
  
  // Check if it's an object with numeric keys (serialized array)
  const keys = Object.keys(obj);
  const isNumericKeys = keys.every(k => !isNaN(parseInt(k)));
  
  if (isNumericKeys && keys.length > 0) {
    // Convert to array, preserving order
    return keys.sort((a, b) => parseInt(a) - parseInt(b)).map(k => obj[k]);
  }
  
  return obj;
}

/**
 * Normalize pool data structure (handles both array and object formats)
 */
function normalizePool(pool) {
  if (!pool) return null;
  
  const normalized = { ...pool };
  
  // Normalize arrays
  if (normalized.entries) normalized.entries = normalizeToArray(normalized.entries);
  if (normalized.grades) normalized.grades = normalizeToArray(normalized.grades);
  if (normalized.tags) normalized.tags = normalizeToArray(normalized.tags);
  
  // Normalize each grade
  if (normalized.grades) {
    normalized.grades = normalized.grades.map(grade => {
      const normalizedGrade = { ...grade };
      
      if (normalizedGrade.guaranteedItems) {
        normalizedGrade.guaranteedItems = normalizeToArray(normalizedGrade.guaranteedItems);
      }
      
      if (normalizedGrade.filters) {
        if (normalizedGrade.filters.tiers) {
          normalizedGrade.filters.tiers = normalizeToArray(normalizedGrade.filters.tiers);
        }
        if (normalizedGrade.filters.tags) {
          normalizedGrade.filters.tags = normalizeToArray(normalizedGrade.filters.tags);
        }
      }
      
      return normalizedGrade;
    });
  }
  
  return normalized;
}

/**
 * Resolve a loot pool to get specific items
 * @param {string} poolId - Loot pool ID
 * @returns {Promise<Object>} - Object with items array and containerData
 */
async function resolveLootPool(poolId) {
  try {
    const config = await readJSON('config.json');
    
    // Check both locations for pools
    let pool = null;
    if (config.lootTables?.pools) {
      pool = config.lootTables.pools.find(p => p.id === poolId);
    }
    
    // Also check lootPools (admin-saved pools)
    if (!pool && config.lootPools) {
      const lootPoolsArray = normalizeToArray(config.lootPools);
      pool = lootPoolsArray.find(p => p.id === poolId);
    }

    if (!pool) {
      return { items: [], containerData: null };
    }
    
    // Normalize the pool structure
    pool = normalizePool(pool);

    // Use items from config.json lootTables.items
    const itemDatabase = {};
    if (config.lootTables?.items) {
      config.lootTables.items.forEach(item => {
        itemDatabase[item.id] = item;
      });
    }

    let items = [];
    let containerData = null;

    // NEW: Check if pool has grades (tiered container system)
    if (pool.grades && pool.grades.length > 0) {
      // Roll for grade based on weight
      const totalWeight = pool.grades.reduce((sum, g) => sum + (g.weight || 0), 0);
      const gradeRoll = Math.random() * totalWeight;
      
      let currentWeight = 0;
      let selectedGrade = null;
      
      for (const grade of pool.grades) {
        currentWeight += grade.weight || 0;
        if (gradeRoll <= currentWeight) {
          selectedGrade = grade;
          break;
        }
      }

      if (selectedGrade) {
        containerData = {
          gradeId: selectedGrade.id,
          displayName: selectedGrade.displayName,
          ...selectedGrade.containerData
        };

        // Add guaranteed items first
        if (selectedGrade.guaranteedItems && selectedGrade.guaranteedItems.length > 0) {
          for (const guaranteedItem of selectedGrade.guaranteedItems) {
            const itemDef = itemDatabase[guaranteedItem.itemId];
            items.push({
              itemId: guaranteedItem.itemId,
              name: itemDef?.name || guaranteedItem.itemId,
              quantity: guaranteedItem.quantity || 1,
              category: itemDef?.category || 'resource',
              tier: itemDef?.tier || 'common',
              value: itemDef?.value || 0,
              guaranteed: true
            });
          }
        }

        // Determine loot source: either specific entries OR tag-based from all items
        let filteredEntries = [];
        
        if (pool.entries && pool.entries.length > 0) {
          // MODE 1: Use specific pool entries, filtered by grade criteria
          filteredEntries = pool.entries.filter(entry => {
            const itemDef = itemDatabase[entry.itemId];
            if (!itemDef) return false;

            // Check tier filter
            if (selectedGrade.filters.tiers && selectedGrade.filters.tiers.length > 0) {
              if (!selectedGrade.filters.tiers.includes(itemDef.tier)) {
                return false;
              }
            }

            // Check tag filter
            if (selectedGrade.filters.tags && selectedGrade.filters.tags.length > 0) {
              // Handle tags as array or object (from JSON storage)
              let itemTags = itemDef.tags || [];
              if (!Array.isArray(itemTags)) {
                itemTags = Object.values(itemTags);
              }
              const hasMatchingTag = selectedGrade.filters.tags.some(tag => itemTags.includes(tag));
              if (!hasMatchingTag) {
                return false;
              }
            }

            return true;
          });
        } else {
          // MODE 2: No specific entries - generate from ALL items matching grade filters
          const allItemIds = Object.keys(itemDatabase);
          const matchingItems = allItemIds.filter(itemId => {
            const itemDef = itemDatabase[itemId];
            if (!itemDef) return false;

            // Check tier filter
            if (selectedGrade.filters.tiers && selectedGrade.filters.tiers.length > 0) {
              if (!selectedGrade.filters.tiers.includes(itemDef.tier)) {
                return false;
              }
            }

            // Check tag filter
            if (selectedGrade.filters.tags && selectedGrade.filters.tags.length > 0) {
              // Handle tags as array or object (from JSON storage)
              let itemTags = itemDef.tags || [];
              if (!Array.isArray(itemTags)) {
                itemTags = Object.values(itemTags);
              }
              const hasMatchingTag = selectedGrade.filters.tags.some(tag => itemTags.includes(tag));
              if (!hasMatchingTag) {
                return false;
              }
            }

            return true;
          });

          // Create synthetic entries from matching items with equal weight
          filteredEntries = matchingItems.map(itemId => ({
            itemId,
            weight: itemDatabase[itemId].weight || 1,
            minQuantity: 1,
            maxQuantity: 3
          }));
        }

        // Determine how many items to roll
        const rollSettings = selectedGrade.rollSettings || { minItems: 2, maxItems: 4, bonusRolls: 0 };
        const baseItemCount = Math.floor(
          Math.random() * (rollSettings.maxItems - rollSettings.minItems + 1)
        ) + rollSettings.minItems;

        // Roll base items
        const itemCounts = {};
        for (let i = 0; i < baseItemCount; i++) {
          if (filteredEntries.length === 0) break;
          
          const totalEntryWeight = filteredEntries.reduce((sum, e) => sum + (e.weight || 0), 0);
          const itemRoll = Math.random() * totalEntryWeight;
          
          let currentEntryWeight = 0;
          for (const entry of filteredEntries) {
            currentEntryWeight += entry.weight || 0;
            if (itemRoll <= currentEntryWeight) {
              const min = entry.minQuantity || 1;
              const max = entry.maxQuantity || 1;
              const quantity = Math.floor(Math.random() * (max - min + 1)) + min;
              
              itemCounts[entry.itemId] = (itemCounts[entry.itemId] || 0) + quantity;
              break;
            }
          }
        }

        // Bonus rolls
        for (let i = 0; i < (rollSettings.bonusRolls || 0); i++) {
          if (filteredEntries.length === 0 || Math.random() > 0.5) continue; // 50% chance per bonus roll
          
          const totalEntryWeight = filteredEntries.reduce((sum, e) => sum + (e.weight || 0), 0);
          const itemRoll = Math.random() * totalEntryWeight;
          
          let currentEntryWeight = 0;
          for (const entry of filteredEntries) {
            currentEntryWeight += entry.weight || 0;
            if (itemRoll <= currentEntryWeight) {
              const min = entry.minQuantity || 1;
              const max = entry.maxQuantity || 1;
              const quantity = Math.floor(Math.random() * (max - min + 1)) + min;
              
              itemCounts[entry.itemId] = (itemCounts[entry.itemId] || 0) + quantity;
              break;
            }
          }
        }

        // Convert to item objects
        for (const [itemId, quantity] of Object.entries(itemCounts)) {
          const itemDef = itemDatabase[itemId];
          items.push({
            itemId,
            name: itemDef?.name || itemId,
            quantity,
            category: itemDef?.category || 'resource',
            tier: itemDef?.tier || 'common',
            value: itemDef?.value || 0,
            guaranteed: false
          });
        }
      }
    } else {
      // OLD: Legacy pool without grades - use original logic
      if (!pool.entries || pool.entries.length === 0) {
        return { items: [], containerData: null };
      }

      const itemCounts = {};

      // Roll for each entry
      for (const entry of pool.entries) {
        const roll = Math.random() * 100;
        if (roll <= entry.weight) {
          const min = entry.minQuantity || entry.quantityRange?.min || 1;
          const max = entry.maxQuantity || entry.quantityRange?.max || 1;
          const quantity = Math.floor(Math.random() * (max - min + 1)) + min;
          itemCounts[entry.itemId] = (itemCounts[entry.itemId] || 0) + quantity;
        }
      }

      // Convert to item objects
      for (const [itemId, quantity] of Object.entries(itemCounts)) {
        const itemDef = itemDatabase[itemId];
        items.push({
          itemId,
          name: itemDef?.name || itemId,
          quantity,
          category: itemDef?.category || 'resource',
          tier: itemDef?.tier || 'common',
          value: itemDef?.value || 0
        });
      }
    }

    return { items, containerData };
  } catch (error) {
    console.error('Error resolving loot pool:', error);
    return { items: [], containerData: null };
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
      const lootResult = await resolveLootPool(outcome.rewards.lootPool);
      changes.items = lootResult.items;
      changes.containerData = lootResult.containerData; // NEW: Include container presentation data
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
