/**
 * Environment Modifiers
 * Calculates effects from system radiation, zones, etc.
 */

export function getEnvironmentModifiers(actionType, context) {
  const { location } = context;
  if (!location) return 0;
  
  let modifier = 0;
  
  // ============================================================================
  // RADIATION EFFECTS
  // ============================================================================
  if (location.radiation === 'high') {
    modifier -= 2; // All actions harder in high radiation
    
    if (actionType === 'awayTeam') modifier -= 1; // Extra penalty for away teams
  } else if (location.radiation === 'medium') {
    modifier -= 1;
  }
  
  // ============================================================================
  // ZONE EFFECTS
  // ============================================================================
  if (location.zone === 'static') {
    // Static zones: harder to scan, better loot
    if (actionType === 'scavenging' || actionType === 'derelict') {
      modifier += 3; // Better quality finds
    }
    if (actionType === 'combatAttack') {
      modifier -= 3; // Targeting disruption
    }
  }
  
  if (location.zone === 'dark') {
    // Dark zones: general difficulty increase, encounter risk
    modifier -= 2;
  }
  
  if (location.zone === 'quiet') {
    // Quiet zones: safer, less loot
    if (actionType === 'scavenging' || actionType === 'mining') {
      modifier -= 1; // Lower yields
    }
  }
  
  // ============================================================================
  // ASTEROID FIELD / DEBRIS
  // ============================================================================
  if (location.hazards?.includes('asteroidField')) {
    if (actionType === 'combatFlee') {
      modifier -= 2; // Harder to escape through debris
    }
    if (actionType === 'mining') {
      modifier += 1; // But better for mining
    }
  }
  
  // ============================================================================
  // SYSTEM STABILITY
  // ============================================================================
  if (location.stability === 'unstable') {
    if (actionType === 'mining' || actionType === 'derelict') {
      modifier -= 1; // Structural risks
    }
  }
  
  // ============================================================================
  // ATMOSPHERIC PRESSURE (for away teams)
  // ============================================================================
  if (actionType === 'awayTeam' && location.atmosphere) {
    if (location.atmosphere === 'hostile') modifier -= 3;
    else if (location.atmosphere === 'thin') modifier -= 1;
    else if (location.atmosphere === 'breathable') modifier += 2;
  }
  
  return modifier;
}
