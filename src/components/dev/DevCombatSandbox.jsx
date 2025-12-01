import React, { useEffect, useState, useCallback } from 'react';
import CombatWindow from '../combat/CombatWindow.jsx';
import { ShipManager } from '../../lib/ShipManager.js';
import { CombatStateManager } from '../../lib/combat/CombatStateManager.js';
import { CombatFlowController } from '../../lib/combat/CombatFlowController.js';

export default function DevCombatSandbox() {
  const [combat, setCombat] = useState(null);
  const [actor, setActor] = useState(null);
  const [target, setTarget] = useState(null);
  const [plan, setPlan] = useState(null);

  const setupAndRun = useCallback(async () => {
    // Create ships
    const playerShip = new ShipManager('SURVEY_FRIGATE', [
      'NAV_ADVANCED', 'ENGINE_ION', 'SHIELD_MK2', 'POWER_RFE', 'SENSORS_LONG', 'WEAPON_PLASMA_CANNON', 'COMBAT_COMPUTER_MK1'
    ]);
    playerShip.id = 'Player-Frigate';

    const aiShip = new ShipManager('INTERCEPTOR', [
      'NAV_ADVANCED', 'ENGINE_PLASMA', 'SHIELD_MK1', 'POWER_FUSION', 'SENSORS_SHORT', 'WEAPON_PULSE_LASER', 'COMBAT_COMPUTER_MK2'
    ]);
    aiShip.id = 'Pirate-Interceptor';

    const mgr = new CombatStateManager();
    const combatants = [
      { ship: playerShip, id: playerShip.id, faction: 'player', isPlayer: true },
      { ship: aiShip, id: aiShip.id, faction: 'pirates', isPlayer: false, isAI: true, personality: 'TACTICAL', veteranRank: 'VETERAN' }
    ];
    mgr.startCombat(combatants, 300);

    // Force AI turn for demo
    const aiIndex = mgr.initiativeOrder.indexOf(aiShip.id);
    if (aiIndex !== -1) mgr.currentTurnIndex = aiIndex;

    const flow = new CombatFlowController(mgr);
    const p = await flow.executeTurn(aiShip.id);

    setCombat(mgr);
    setActor(mgr.getCurrentShip()); // after execution it remains AI's phase
    setTarget(mgr.getEnemies(aiShip.id)[0]);
    setPlan(p);
  }, []);

  useEffect(() => { setupAndRun(); }, [setupAndRun]);

  return (
    <div style={{ color: '#ddd', background: '#0b0b0f', minHeight: '100vh' }}>
      <div style={{ padding: 16, display: 'flex', gap: 8 }}>
        <button onClick={setupAndRun}>Re-run AI Turn</button>
      </div>
      <CombatWindow combat={combat} actor={actor} target={target} plan={plan} />
    </div>
  );
}
