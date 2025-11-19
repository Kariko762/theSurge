/**
 * Research Tree Modifiers
 * Bonuses from unlocked technologies
 */

export function getResearchModifiers(actionType, context) {
  const { researchTree } = context;
  if (!researchTree) return 0;
  
  let modifier = 0;
  
  // ============================================================================
  // MINING RESEARCH
  // ============================================================================
  if (actionType === 'mining') {
    if (researchTree.efficientMining) modifier += 3;
    if (researchTree.advancedLasers) modifier += 2;
    if (researchTree.mineralScanning) modifier += 1;
  }
  
  // ============================================================================
  // SCAVENGING RESEARCH
  // ============================================================================
  if (actionType === 'scavenging') {
    if (researchTree.advancedScanning) modifier += 2;
    if (researchTree.salvageProtocols) modifier += 2;
    if (researchTree.containerBypass) modifier += 1;
  }
  
  // ============================================================================
  // DERELICT INVESTIGATION RESEARCH
  // ============================================================================
  if (actionType === 'derelict') {
    if (researchTree.structuralAnalysis) modifier += 2;
    if (researchTree.hazardDetection) modifier += 2;
    if (researchTree.advancedScanning) modifier += 1;
  }
  
  // ============================================================================
  // AWAY TEAM RESEARCH
  // ============================================================================
  if (actionType === 'awayTeam') {
    if (researchTree.environmentalSuits) modifier += 3;
    if (researchTree.medicalProtocols) modifier += 2;
    if (researchTree.survivalTraining) modifier += 1;
  }
  
  // ============================================================================
  // COMBAT RESEARCH
  // ============================================================================
  if (actionType === 'combatAttack') {
    if (researchTree.combatTactics) modifier += 2;
    if (researchTree.weaponCalibration) modifier += 2;
    if (researchTree.targetingAlgorithms) modifier += 1;
  }
  
  if (actionType === 'combatInitiate') {
    if (researchTree.tacticalPrediction) modifier += 2;
    if (researchTree.combatTactics) modifier += 1;
  }
  
  if (actionType === 'combatFlee') {
    if (researchTree.evasiveManeuvers) modifier += 3;
    if (researchTree.emergencyJump) modifier += 2;
  }
  
  if (actionType === 'combatRepair') {
    if (researchTree.rapidRepair) modifier += 3;
    if (researchTree.nanobots) modifier += 2;
  }
  
  // ============================================================================
  // MISSION COMPLETION RESEARCH
  // ============================================================================
  if (actionType === 'missionCompletion') {
    if (researchTree.missionPlanning) modifier += 2;
    if (researchTree.riskAssessment) modifier += 1;
  }
  
  return modifier;
}
