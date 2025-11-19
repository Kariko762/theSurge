/**
 * AI Crew Modifiers
 * Calculates bonuses from docked AI units
 */

export function getAIModifiers(actionType, context) {
  const { aiRoster } = context;
  if (!aiRoster || !Array.isArray(aiRoster)) return 0;
  
  let modifier = 0;
  
  // Only count docked and non-injured AI
  const activeAI = aiRoster.filter(ai => ai.docked && !ai.injured);
  
  for (const ai of activeAI) {
    // ============================================================================
    // MINING MODIFIERS
    // ============================================================================
    if (actionType === 'mining') {
      if (ai.role === 'engineer') modifier += 1;
      if (ai.role === 'fabricator') modifier += 1;
    }
    
    // ============================================================================
    // SCAVENGING MODIFIERS
    // ============================================================================
    if (actionType === 'scavenging') {
      if (ai.role === 'researcher') modifier += 2; // Best at identifying valuables
      if (ai.role === 'engineer') modifier += 1;
    }
    
    // ============================================================================
    // DERELICT INVESTIGATION MODIFIERS
    // ============================================================================
    if (actionType === 'derelict') {
      if (ai.role === 'engineer') modifier += 2; // Structural assessment
      if (ai.role === 'researcher') modifier += 1;
      if (ai.role === 'medic') modifier += 1; // Safety protocols
    }
    
    // ============================================================================
    // AWAY TEAM MODIFIERS
    // ============================================================================
    if (actionType === 'awayTeam') {
      if (ai.role === 'medic') modifier += 3; // Critical for survival
      if (ai.role === 'engineer') modifier += 2;
      if (ai.role === 'researcher') modifier += 1;
    }
    
    // ============================================================================
    // COMBAT MODIFIERS
    // ============================================================================
    if (actionType === 'combatAttack') {
      if (ai.role === 'tactical') modifier += 3;
      if (ai.role === 'engineer') modifier += 1; // Weapon systems
    }
    
    if (actionType === 'combatInitiate') {
      if (ai.role === 'navigator') modifier += 2;
      if (ai.role === 'tactical') modifier += 1;
    }
    
    if (actionType === 'combatFlee') {
      if (ai.role === 'navigator') modifier += 3;
      if (ai.role === 'engineer') modifier += 1; // Engine optimization
    }
    
    if (actionType === 'combatRepair') {
      if (ai.role === 'engineer') modifier += (ai.tier || 1) * 2;
      if (ai.role === 'fabricator') modifier += ai.tier || 1;
    }
    
    // ============================================================================
    // MISSION COMPLETION MODIFIERS
    // ============================================================================
    if (actionType === 'missionCompletion') {
      // All AI contribute to mission success
      if (ai.role === 'tactical') modifier += 2;
      if (ai.role === 'engineer') modifier += 1;
      if (ai.role === 'researcher') modifier += 1;
      if (ai.role === 'navigator') modifier += 1;
    }
    
    // ============================================================================
    // PERSONALITY MODIFIERS
    // ============================================================================
    if (ai.personality === 'reckless') {
      if (actionType === 'mining' || actionType === 'scavenging') {
        modifier += 2; // Higher yields, risky approach
      }
      if (actionType === 'combatFlee') {
        modifier -= 2; // Won't flee easily
      }
    }
    
    if (ai.personality === 'cautious') {
      if (actionType === 'mining' || actionType === 'scavenging') {
        modifier -= 1; // Lower yields, safer approach
      }
      if (actionType === 'derelict' || actionType === 'awayTeam') {
        modifier += 1; // Better hazard avoidance
      }
    }
    
    if (ai.personality === 'aggressive') {
      if (actionType === 'combatAttack') modifier += 2;
      if (actionType === 'combatFlee') modifier -= 3;
    }
    
    if (ai.personality === 'logical') {
      // Consistent, no extreme bonuses/penalties
      modifier += 1; // Reliable +1 to most actions
    }
  }
  
  return modifier;
}
