/**
 * Skill Modifiers
 * Player/crew skill bonuses (placeholder for future crew system)
 */

export function getSkillModifiers(actionType, context) {
  const { skills } = context;
  if (!skills) return 0;
  
  let modifier = 0;
  
  // ============================================================================
  // SKILL-BASED BONUSES
  // ============================================================================
  
  if (actionType === 'mining' && skills.mining) {
    modifier += skills.mining || 0;
  }
  
  if (actionType === 'scavenging' && skills.scavenging) {
    modifier += skills.scavenging || 0;
  }
  
  if (actionType === 'combat' && skills.combat) {
    modifier += skills.combat || 0;
  }
  
  if (actionType === 'navigation' && skills.navigation) {
    modifier += skills.navigation || 0;
  }
  
  if (actionType === 'engineering' && skills.engineering) {
    modifier += skills.engineering || 0;
  }
  
  // Universal skill bonuses
  if (skills.luck) {
    modifier += Math.floor(skills.luck / 2); // Half value to all actions
  }
  
  return modifier;
}
