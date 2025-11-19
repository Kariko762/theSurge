/**
 * Dice Resolution Engine - Narrative Generator
 * Maps outcomes to narrative text
 */

/**
 * Generate narrative text for outcome
 * @param {Object} outcome - Result from resolveAction
 * @param {Object} context - Original action context
 * @returns {string} Formatted narrative text
 */
export function generateNarrative(outcome, context = {}) {
  const { actionType, result } = outcome;
  
  switch (actionType) {
    case 'mining':
      return generateMiningNarrative(outcome, context);
    case 'scavenging':
      return generateScavengingNarrative(outcome, context);
    case 'derelict':
      return generateDerelictNarrative(outcome, context);
    case 'awayTeam':
      return generateAwayTeamNarrative(outcome, context);
    case 'combatInitiate':
      return generateCombatInitiateNarrative(outcome, context);
    case 'combatAttack':
      return generateCombatAttackNarrative(outcome, context);
    case 'combatFlee':
      return generateCombatFleeNarrative(outcome, context);
    case 'combatRepair':
      return generateCombatRepairNarrative(outcome, context);
    case 'missionCompletion':
      return generateMissionNarrative(outcome, context);
    default:
      return `Action completed: ${result}`;
  }
}

function generateMiningNarrative(outcome, context) {
  const { result, consequences, secondaryRolls } = outcome;
  const lines = [];
  
  lines.push('⛏️ MINING OPERATION');
  
  if (result === 'crit_success') {
    lines.push('🌟 CRITICAL SUCCESS! Perfect extraction.');
  } else if (result === 'success') {
    lines.push(`✓ Mining laser penetrated asteroid core.`);
  } else {
    lines.push(`✗ Failed to extract usable material.`);
  }
  
  if (consequences.lootGained?.length > 0) {
    const loot = consequences.lootGained[0];
    lines.push(`Extracted: ${loot.item} (${loot.quality})`);
  }
  
  if (secondaryRolls.hazard?.outcome.damage > 0) {
    lines.push(`⚠️ ${secondaryRolls.hazard.outcome.label}: ${secondaryRolls.hazard.outcome.damage} damage`);
  }
  
  return lines.join('\n');
}

function generateScavengingNarrative(outcome, context) {
  const { result, consequences, secondaryRolls } = outcome;
  const lines = [];
  
  lines.push('📦 SCAVENGING');
  
  if (result === 'crit_success') {
    lines.push('🌟 Pristine components found!');
  } else if (result === 'success') {
    lines.push('✓ Salvageable items located.');
  } else {
    lines.push('✗ Nothing of value found.');
  }
  
  if (consequences.lootGained?.length > 0) {
    const loot = consequences.lootGained[0];
    lines.push(`Recovered: ${loot.item} (${loot.quality})`);
  }
  
  if (secondaryRolls.trap?.outcome.damage > 0) {
    lines.push(`💥 TRAP! ${secondaryRolls.trap.outcome.label}: ${secondaryRolls.trap.outcome.damage} damage`);
  }
  
  if (secondaryRolls.detection?.detected) {
    lines.push('🚨 WARNING: Alarm triggered. Hostiles may be inbound.');
  }
  
  return lines.join('\n');
}

function generateDerelictNarrative(outcome, context) {
  const { result, consequences, secondaryRolls } = outcome;
  const lines = [];
  
  lines.push('🏚️ DERELICT INVESTIGATION');
  
  if (result === 'crit_success') {
    lines.push('🌟 Major discovery!');
  } else if (result === 'success') {
    lines.push('✓ Investigation successful.');
  } else {
    lines.push('✗ Investigation yielded nothing.');
  }
  
  if (secondaryRolls.discovery?.outcome.value !== 'nothing') {
    lines.push(`Found: ${secondaryRolls.discovery.outcome.label}`);
  }
  
  if (secondaryRolls.structure?.outcome.damage > 0) {
    lines.push(`⚠️ ${secondaryRolls.structure.outcome.label}: ${secondaryRolls.structure.outcome.damage} damage`);
  }
  
  if (consequences.combatTriggered) {
    lines.push(`⚔️ HOSTILE CONTACT: ${secondaryRolls.ambush.outcome.label} detected!`);
  }
  
  return lines.join('\n');
}

function generateAwayTeamNarrative(outcome, context) {
  const { result, consequences, secondaryRolls } = outcome;
  const lines = [];
  
  lines.push('🚀 AWAY TEAM MISSION');
  
  if (result === 'critSuccess') {
    lines.push('🌟 MISSION SUCCESS! Exceptional performance.');
  } else if (result === 'success') {
    lines.push('✓ Mission objectives completed.');
  } else if (result === 'partial') {
    lines.push('⚠️ Partial success. Some objectives met.');
  } else {
    lines.push('✗ Mission failed.');
  }
  
  if (secondaryRolls.discovery?.outcome.value !== 'nothing') {
    lines.push(`Discovery: ${secondaryRolls.discovery.outcome.label}`);
  }
  
  if (secondaryRolls.hazard?.outcome.damage > 0) {
    lines.push(`💀 ${secondaryRolls.hazard.outcome.label}: ${secondaryRolls.hazard.outcome.damage} damage to team`);
  }
  
  if (consequences.statusEffects?.includes('AI Critically Injured')) {
    lines.push('🚑 CRITICAL: AI crew member injured!');
  }
  
  return lines.join('\n');
}

function generateCombatInitiateNarrative(outcome, context) {
  const { initiative } = outcome;
  const lines = [];
  
  lines.push('⚔️ COMBAT INITIATED');
  
  if (initiative.playerGoesFirst) {
    lines.push('✓ You have the initiative!');
    lines.push(`Your roll: ${initiative.playerRoll} vs Enemy: ${initiative.enemyRoll}`);
  } else {
    lines.push('⚠️ Enemy moves first!');
    lines.push(`Your roll: ${initiative.playerRoll} vs Enemy: ${initiative.enemyRoll}`);
  }
  
  return lines.join('\n');
}

function generateCombatAttackNarrative(outcome, context) {
  const { result, hitRoll, damageRoll, statusEffect } = outcome;
  const lines = [];
  
  if (result === 'crit_success') {
    lines.push('🌟 CRITICAL HIT!');
  } else if (hitRoll.hit) {
    lines.push('🎯 DIRECT HIT!');
  } else {
    lines.push('💨 MISS!');
  }
  
  if (damageRoll) {
    lines.push(`Damage: ${damageRoll.finalDamage} (${damageRoll.notation})`);
  }
  
  if (statusEffect.value === 'criticalHit') {
    lines.push('💥 DEVASTATING CRITICAL! Damage doubled!');
  } else if (statusEffect.value === 'weaponJammed') {
    lines.push('⚠️ WEAPON JAMMED! Repairs needed.');
  }
  
  return lines.join('\n');
}

function generateCombatFleeNarrative(outcome, context) {
  const { result, consequences } = outcome;
  const lines = [];
  
  lines.push('🚀 ATTEMPTING ESCAPE');
  
  if (result === 'success') {
    lines.push('✓ Emergency jump initiated!');
    lines.push('You broke contact. Hostile lost in surge wake.');
  } else {
    lines.push('✗ Failed to disengage!');
    lines.push('Enemy maintains pursuit.');
  }
  
  if (consequences.statusEffects?.includes('Damaged Engines')) {
    lines.push('⚠️ Engine stress detected. Repairs recommended.');
  }
  
  return lines.join('\n');
}

function generateCombatRepairNarrative(outcome, context) {
  const { result, repairAmount } = outcome;
  const lines = [];
  
  lines.push('🔧 EMERGENCY REPAIRS');
  
  if (result === 'success') {
    lines.push(`✓ Repairs successful! Restored ${repairAmount} integrity.`);
  } else {
    lines.push('✗ Repair attempt failed!');
  }
  
  return lines.join('\n');
}

function generateMissionNarrative(outcome, context) {
  const { result, consequences } = outcome;
  const lines = [];
  
  lines.push('📋 MISSION COMPLETE');
  
  if (result === 'critSuccess') {
    lines.push('🌟 OUTSTANDING SUCCESS!');
  } else if (result === 'success') {
    lines.push('✓ Mission objectives achieved.');
  } else if (result === 'partial') {
    lines.push('⚠️ Partial success.');
  } else {
    lines.push('✗ Mission failed.');
  }
  
  if (consequences.lootGained?.length > 0) {
    lines.push('\nRewards:');
    consequences.lootGained.forEach(item => {
      lines.push(`  • ${item.item} x${item.quantity}`);
    });
  }
  
  if (consequences.bonusReward) {
    lines.push(`\n🎁 BONUS: ${consequences.bonusReward[0].item}`);
  }
  
  if (consequences.storyUnlock) {
    lines.push('\n📖 Story progression unlocked!');
  }
  
  return lines.join('\n');
}

/**
 * Get short result icon/emoji
 * @param {string} result - Result type
 * @returns {string} Icon
 */
export function getResultIcon(result) {
  const icons = {
    'crit_success': '🌟',
    'success': '✓',
    'partial': '⚠️',
    'fail': '✗',
    'crit_fail': '💀'
  };
  
  return icons[result] || '•';
}

/**
 * Format modifier breakdown for display
 * @param {Object} breakdown - Modifier breakdown
 * @returns {string} Formatted text
 */
export function formatModifierBreakdown(breakdown) {
  const lines = ['Modifiers:'];
  
  for (const [source, value] of Object.entries(breakdown)) {
    const sign = value > 0 ? '+' : '';
    lines.push(`  ${source}: ${sign}${value}`);
  }
  
  return lines.join('\n');
}
