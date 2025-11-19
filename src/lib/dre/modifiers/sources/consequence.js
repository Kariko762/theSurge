/**
 * Consequence Modifiers
 * Wake, time pressure, fatigue effects
 */

export function getConsequenceModifiers(actionType, context) {
  const { wake, timeElapsed, fatigue } = context;
  let modifier = 0;
  
  // ============================================================================
  // WAKE PENALTY
  // ============================================================================
  // Higher wake = more difficult outcomes to maintain tension
  if (wake !== undefined) {
    if (wake > 0.8) modifier -= 3; // Very high wake
    else if (wake > 0.6) modifier -= 2;
    else if (wake > 0.4) modifier -= 1;
  }
  
  // ============================================================================
  // TIME PRESSURE
  // ============================================================================
  // Long missions accumulate fatigue
  if (timeElapsed !== undefined) {
    if (timeElapsed > 10) modifier -= 2; // Over 10 hours
    else if (timeElapsed > 6) modifier -= 1;
  }
  
  // ============================================================================
  // FATIGUE
  // ============================================================================
  if (fatigue !== undefined) {
    if (fatigue > 80) modifier -= 3;
    else if (fatigue > 60) modifier -= 2;
    else if (fatigue > 40) modifier -= 1;
  }
  
  return modifier;
}
