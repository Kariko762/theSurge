/**
 * Dice Resolution Engine - Terminal Output Integration
 * Formats DRE outcomes for terminal display with AI speech hooks
 */

import { generateNarrative, getResultIcon, formatModifierBreakdown } from './narrative.js';

/**
 * Format outcome for terminal display
 * @param {Object} outcome - DRE outcome object
 * @param {Object} context - Original context
 * @param {Object} options - Display options
 * @returns {Object} Terminal-ready output
 */
export function emitToTerminal(outcome, context = {}, options = {}) {
  const {
    showModifiers = true,
    showRolls = true,
    showAIAnalysis = true,
    animated = true
  } = options;
  
  const output = {
    timestamp: Date.now(),
    actionType: outcome.actionType,
    result: outcome.result,
    icon: getResultIcon(outcome.result),
    narrative: generateNarrative(outcome, context),
    sections: []
  };
  
  // Main result section
  output.sections.push({
    type: 'result',
    content: `${output.icon} ${outcome.result.toUpperCase().replace('_', ' ')}`,
    color: getResultColor(outcome.result)
  });
  
  // Dice roll section
  if (showRolls && outcome.totalRoll !== undefined) {
    output.sections.push({
      type: 'roll',
      content: `Roll: ${outcome.totalRoll} vs ${outcome.targetDifficulty} (${outcome.margin >= 0 ? '+' : ''}${outcome.margin})`,
      color: '#34e0ff'
    });
  }
  
  // Modifier breakdown section
  if (showModifiers && outcome.modifierBreakdown) {
    output.sections.push({
      type: 'modifiers',
      content: formatModifierBreakdown(outcome.modifierBreakdown),
      color: '#888'
    });
  }
  
  // Consequences section
  if (outcome.consequences) {
    const consLines = [];
    
    if (outcome.consequences.lootGained?.length > 0) {
      consLines.push('Loot:');
      outcome.consequences.lootGained.forEach(item => {
        consLines.push(`  • ${item.item}${item.quantity ? ` x${item.quantity}` : ''}`);
      });
    }
    
    if (outcome.consequences.damageTaken > 0) {
      consLines.push(`Damage Taken: ${outcome.consequences.damageTaken}`);
    }
    
    if (outcome.consequences.wakeAdded) {
      consLines.push(`Wake: +${(outcome.consequences.wakeAdded * 100).toFixed(0)}%`);
    }
    
    if (consLines.length > 0) {
      output.sections.push({
        type: 'consequences',
        content: consLines.join('\n'),
        color: '#ffaa00'
      });
    }
  }
  
  // AI speech hook
  if (showAIAnalysis) {
    output.aiSpeech = generateAISpeech(outcome, context);
  }
  
  // Animation data (for future dice roll animation)
  if (animated && outcome.totalRoll !== undefined) {
    output.animation = {
      type: 'diceRoll',
      dieType: 'd20',
      result: outcome.totalRoll,
      duration: 1500 // ms
    };
  }
  
  return output;
}

/**
 * Get color for result type
 * @param {string} result - Result type
 * @returns {string} Hex color
 */
function getResultColor(result) {
  const colors = {
    'crit_success': '#00ff88',
    'success': '#34e0ff',
    'partial': '#ffaa00',
    'fail': '#ff6b6b',
    'crit_fail': '#ff1a1a'
  };
  
  return colors[result] || '#ffffff';
}

/**
 * Generate AI spoken commentary for outcome
 * @param {Object} outcome - DRE outcome
 * @param {Object} context - Action context
 * @returns {string} AI speech text
 */
function generateAISpeech(outcome, context) {
  const { actionType, result } = outcome;
  
  // Placeholder for AI personality-based speech
  // Future: integrate with AI character personality
  
  const templates = {
    mining: {
      crit_success: "Exceptional extraction, Captain. Mining efficiency exceeded projections.",
      success: "Ore secured. Proceeding to cargo bay.",
      fail: "Mining operation unsuccessful. Recommend repositioning."
    },
    scavenging: {
      crit_success: "Remarkable find, Captain. These components are pristine.",
      success: "Salvage recovered. Quality is acceptable.",
      fail: "Nothing of value detected in this debris field."
    },
    combatAttack: {
      crit_success: "Direct hit! Enemy shields critical!",
      success: "Target struck. Damage confirmed.",
      fail: "Shot wide. Recalculating firing solution."
    },
    combatFlee: {
      success: "Jump successful. We've cleared the combat zone.",
      fail: "Unable to disengage. Enemy maintains lock."
    }
  };
  
  const typeTemplates = templates[actionType];
  if (typeTemplates) {
    return typeTemplates[result] || typeTemplates.success || "Action complete.";
  }
  
  return "Action resolved, Captain.";
}

/**
 * Format outcome for log/history
 * @param {Object} outcome - DRE outcome
 * @returns {Object} Condensed log entry
 */
export function formatForLog(outcome) {
  return {
    timestamp: Date.now(),
    action: outcome.actionType,
    result: outcome.result,
    roll: outcome.totalRoll,
    loot: outcome.consequences?.lootGained || [],
    damage: outcome.consequences?.damageTaken || 0
  };
}

/**
 * Batch multiple outcomes for terminal display
 * @param {Array<Object>} outcomes - Array of outcomes
 * @returns {Array<Object>} Formatted outputs
 */
export function batchOutputs(outcomes) {
  return outcomes.map(outcome => emitToTerminal(outcome));
}
