/**
 * Combat Attributes System - Integration Example
 * 
 * Shows how Player Skills + AI Crew + Ship Components + Research
 * combine to produce final combat stats.
 */

import PlayerSkillManager, { PLAYER_BACKGROUNDS } from './playerSkills.js';
import AICrewManager, { AI_CREW } from './aiCrew.js';
import CombatAttributesCalculator, { COMBAT_COMPONENTS, RESEARCH_TREE } from './combatAttributes.js';

// ============================================================================
// EXAMPLE: Building a Combat-Ready Ship
// ============================================================================

export function exampleCombatBuild() {
  console.log('=== COMBAT ATTRIBUTES SYSTEM EXAMPLE ===\n');
  
  // STEP 1: Choose player background
  console.log('STEP 1: Player Background');
  const player = new PlayerSkillManager('VETERAN_PILOT');
  console.log(`Background: ${player.background.name}`);
  console.log(`Starting Skills:`, player.skills);
  console.log(`Perks:`, player.perks);
  console.log('');
  
  // STEP 2: Select AI crew (max 3 slots)
  console.log('STEP 2: AI Crew Selection');
  const aiCrew = new AICrewManager(3); // 3 AI slots
  aiCrew.equipAI('AI_FORGE');   // Engineering specialist (1 slot)
  aiCrew.equipAI('AI_GHOST');   // Sensors/ECM (1 slot)
  aiCrew.equipAI('AI_ARIA');    // Navigation (1 slot)
  
  console.log('Active AI:', aiCrew.activeAI.map(id => AI_CREW[id].name));
  console.log('Combined AI Stats:', aiCrew.getCombinedStats());
  console.log('Power Cost:', aiCrew.getPowerCost(), 'per turn');
  console.log('');
  
  // STEP 3: Equip ship components
  console.log('STEP 3: Ship Components');
  const shipComponents = [
    'PLASMA_CANNON_MK2',      // Weapon
    'SHIELD_GENERATOR_MK2',   // Defense
    'QUANTUM_DRIVE',          // Engine
    'TARGETING_COMPUTER',     // Sensors
    'ECM_SUITE'               // Countermeasures
  ];
  console.log('Equipped:', shipComponents.map(id => COMBAT_COMPONENTS[id].name));
  console.log('');
  
  // STEP 4: Research completed
  console.log('STEP 4: Research Unlocks');
  const research = [
    'ADVANCED_BALLISTICS',
    'SHIELD_HARMONICS',
    'THRUST_VECTORING',
    'COMBAT_ANALYTICS'
  ];
  console.log('Completed:', research.map(id => RESEARCH_TREE[id].name));
  console.log('');
  
  // ============================================================================
  // CALCULATE FINAL ATTRIBUTES
  // ============================================================================
  
  console.log('=== FINAL COMBAT ATTRIBUTES ===\n');
  const calculator = new CombatAttributesCalculator(player, aiCrew, shipComponents, research);
  const attrs = calculator.calculateAttributes();
  
  console.log('OFFENSIVE:');
  console.log(`  Gunnery: ${attrs.gunnery} (To Hit: +${Math.floor(attrs.gunnery / 2)})`);
  console.log(`  Damage Bonus: +${attrs.damageBonus}`);
  console.log(`  Tactics: ${attrs.tactics}`);
  console.log('');
  
  console.log('DEFENSIVE:');
  console.log(`  Evasion (AC): ${attrs.evasion}`);
  console.log(`  Hull: ${attrs.maxHull} HP`);
  console.log(`  Shields: ${attrs.maxShields} HP (Regen: ${calculator.getShieldRegen()}/turn)`);
  console.log(`  Piloting: ${attrs.piloting}`);
  console.log('');
  
  console.log('TECHNICAL:');
  console.log(`  Engineering: ${attrs.engineering} (Repair: ${10 + attrs.engineering * 2} HP/action)`);
  console.log(`  Science: ${attrs.science}`);
  console.log(`  Hacking: ${attrs.hacking} (DC: ${10 + Math.floor(attrs.hacking / 2)})`);
  console.log('');
  
  console.log('INITIATIVE:', calculator.getInitiativeBreakdown());
  console.log('');
  
  // ============================================================================
  // WEAPON BREAKDOWN
  // ============================================================================
  
  console.log('=== WEAPON ANALYSIS ===\n');
  const weapon = calculator.getAttackBreakdown('PLASMA_CANNON_MK2');
  console.log('Plasma Cannon Mk-II:');
  console.log(`  Damage: ${weapon.damage} + ${weapon.damageBonus}`);
  console.log(`  To Hit: +${weapon.toHit} (d20 + ${weapon.toHit})`);
  console.log(`  Range: ${weapon.range}`);
  console.log(`  Power Cost: ${weapon.powerCost}/shot`);
  console.log('');
  
  // ============================================================================
  // AI ABILITIES
  // ============================================================================
  
  console.log('=== AI ABILITIES ===\n');
  
  console.log('PASSIVE ABILITIES (Always Active):');
  const passives = aiCrew.getActivePassives();
  passives.forEach(p => {
    console.log(`  [${p.source}] ${p.name}: ${p.description}`);
  });
  console.log('');
  
  console.log('ACTIVE ABILITIES (Combat Actions):');
  const actives = aiCrew.getAvailableActives();
  actives.forEach(a => {
    console.log(`  [${a.source}] ${a.name} (${a.type}, CD: ${a.cooldown})`);
    console.log(`    ${a.description}`);
  });
  console.log('');
  
  // ============================================================================
  // COMBAT SUMMARY
  // ============================================================================
  
  console.log('=== COMBAT SUMMARY ===\n');
  const summary = calculator.getCombatSummary();
  console.log('Ready for combat with:');
  console.log(`  Initiative: +${summary.initiative}`);
  console.log(`  Attack: d20+${summary.offensive.toHitBonus} (${weapon.damage}+${summary.offensive.damageBonus})`);
  console.log(`  Defense: ${summary.defensive.evasion} AC, ${summary.defensive.hull} HP, ${summary.defensive.shields} Shields`);
  console.log(`  Repair: ${summary.technical.repairPerTurn} HP/turn`);
  console.log(`  Special: ${summary.specialAbilities.length} abilities`);
  console.log('');
  
  return { player, aiCrew, calculator, attrs };
}

// ============================================================================
// COMPARISON: Different Builds
// ============================================================================

export function compareBuild(backgroundId, aiSetup, components, research) {
  const player = new PlayerSkillManager(backgroundId);
  const aiCrew = new AICrewManager(3);
  
  aiSetup.forEach(aiId => aiCrew.equipAI(aiId));
  
  const calculator = new CombatAttributesCalculator(player, aiCrew, components, research);
  const summary = calculator.getCombatSummary();
  
  console.log(`\n=== ${PLAYER_BACKGROUNDS[backgroundId].name} BUILD ===`);
  console.log('AI Crew:', aiSetup.map(id => AI_CREW[id].name).join(', '));
  console.log('Attack: d20+' + summary.offensive.toHitBonus);
  console.log('Defense:', summary.defensive.evasion, 'AC');
  console.log('Hull:', summary.defensive.hull, '| Shields:', summary.defensive.shields);
  console.log('Initiative: +' + summary.initiative);
  
  return summary;
}

// Run example
if (typeof window === 'undefined') {
  // Node.js environment
  exampleCombatBuild();
  
  console.log('\n=== BUILD COMPARISON ===');
  
  // Tank build (Engineer + FORGE)
  compareBuild(
    'ENGINEER',
    ['AI_FORGE', 'AI_SENTINEL', 'AI_ARIA'],
    ['PLASMA_CANNON_MK1', 'SHIELD_GENERATOR_MK3', 'ION_DRIVE', 'POINT_DEFENSE_SYSTEM'],
    ['SHIELD_HARMONICS', 'REACTIVE_ARMOR']
  );
  
  // Glass cannon (Veteran + SENTINEL)
  compareBuild(
    'VETERAN_PILOT',
    ['AI_SENTINEL', 'AI_GHOST'],
    ['RAILGUN', 'SHIELD_GENERATOR_MK1', 'QUANTUM_DRIVE', 'TARGETING_COMPUTER'],
    ['ADVANCED_BALLISTICS', 'PLASMA_REFINEMENT', 'PREDICTIVE_TARGETING']
  );
  
  // Stealth/Hacker (Scavenger + GHOST + CIPHER)
  compareBuild(
    'SCAVENGER',
    ['AI_GHOST', 'AI_CIPHER', 'AI_ARIA'],
    ['PLASMA_CANNON_MK1', 'SHIELD_GENERATOR_MK2', 'PLASMA_DRIVE', 'ECM_SUITE', 'HACKING_MODULE'],
    ['QUANTUM_DECRYPTION', 'THRUST_VECTORING', 'COMBAT_ANALYTICS']
  );
}

export default exampleCombatBuild;
