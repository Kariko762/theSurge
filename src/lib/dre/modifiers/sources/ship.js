/**
 * Ship Component Modifiers
 * Calculates bonuses from ship equipment
 */

export function getShipModifiers(actionType, context) {
  const { shipState, weapon, range } = context;
  if (!shipState?.components) return 0;
  
  let modifier = 0;
  
  // ============================================================================
  // MINING MODIFIERS
  // ============================================================================
  if (actionType === 'mining') {
    const laser = shipState.components.find(c => c.type === 'miningLaser');
    if (laser) modifier += laser.tier || 0;
    
    const scanner = shipState.components.find(c => c.type === 'scanner');
    if (scanner) modifier += Math.floor(scanner.tier / 2);
  }
  
  // ============================================================================
  // SCAVENGING MODIFIERS
  // ============================================================================
  if (actionType === 'scavenging') {
    const scanner = shipState.components.find(c => c.type === 'scanner');
    if (scanner) modifier += scanner.tier || 0;
    
    const cargo = shipState.components.find(c => c.type === 'cargoHold');
    if (cargo?.upgraded) modifier += 1;
  }
  
  // ============================================================================
  // DERELICT INVESTIGATION MODIFIERS
  // ============================================================================
  if (actionType === 'derelict') {
    const scanner = shipState.components.find(c => c.type === 'scanner');
    if (scanner) modifier += scanner.tier || 0;
    
    const hull = shipState.components.find(c => c.type === 'hull');
    if (hull) modifier += Math.floor(hull.tier / 2); // Structural protection
  }
  
  // ============================================================================
  // COMBAT MODIFIERS
  // ============================================================================
  if (actionType === 'combatAttack') {
    // Weapon tier
    if (weapon?.tier) modifier += weapon.tier;
    
    // Targeting computer
    const targeting = shipState.components.find(c => c.type === 'targeting');
    if (targeting) modifier += targeting.tier || 0;
    
    // Weapons array
    const weaponsArray = shipState.components.find(c => c.type === 'weaponsArray');
    if (weaponsArray) modifier += weaponsArray.tier || 0;
    
    // Range penalties
    if (range === 'long') modifier -= 2;
    else if (range === 'medium') modifier -= 1;
  }
  
  if (actionType === 'combatInitiate') {
    // Navigation systems for initiative
    const navigation = shipState.components.find(c => c.type === 'navigation');
    if (navigation) modifier += navigation.tier || 0;
  }
  
  if (actionType === 'combatFlee') {
    // Engine quality
    const engine = shipState.components.find(c => c.type === 'engine');
    if (engine) modifier += (engine.tier || 0) * 2;
    
    // Navigation aids escape
    const navigation = shipState.components.find(c => c.type === 'navigation');
    if (navigation) modifier += navigation.tier || 0;
  }
  
  if (actionType === 'combatRepair') {
    // Fabricator boosts repair speed
    const fabricator = shipState.components.find(c => c.type === 'fabricator');
    if (fabricator) modifier += fabricator.tier || 0;
    
    // Repair bay
    const repairBay = shipState.components.find(c => c.type === 'repairBay');
    if (repairBay) modifier += (repairBay.tier || 0) * 2;
  }
  
  // ============================================================================
  // DAMAGE PENALTIES (affects all actions)
  // ============================================================================
  if (shipState.hull && shipState.maxHull) {
    const hullPercent = shipState.hull / shipState.maxHull;
    if (hullPercent < 0.3) modifier -= 3; // Critical damage
    else if (hullPercent < 0.5) modifier -= 2;
    else if (hullPercent < 0.7) modifier -= 1;
  }
  
  return modifier;
}
