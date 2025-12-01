import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../styles/AdminGlass.css';
import CombatHUD from '../combat/CombatHUD.jsx';
import { ShipManager } from '../../lib/ShipManager.js';
import { CombatStateManager } from '../../lib/combat/CombatStateManager.js';
import { CombatFlowController } from '../../lib/combat/CombatFlowController.js';

export default function DistanceBandCombat({ onClose }) {
  const [combat, setCombat] = useState(null);
  const [plan, setPlan] = useState(null);
  const [autoRun, setAutoRun] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const flowRef = useRef(null);

  const actor = useMemo(() => combat?.getCurrentShip?.(), [combat, refreshTick]);
  const enemies = useMemo(() => (actor && combat) ? combat.getEnemies(actor.id) : [], [combat, actor, refreshTick]);
  const target = enemies?.[0] || null;

  const initCombat = () => {
    const playerShip = new ShipManager('SURVEY_FRIGATE', [
      'NAV_ADVANCED','ENGINE_ION','SHIELD_MK2','POWER_RFE','SENSORS_LONG','WEAPON_PLASMA_CANNON','COMBAT_COMPUTER_MK1'
    ]);
    playerShip.id = 'Player-Frigate';

    const aiShip = new ShipManager('INTERCEPTOR', [
      'NAV_ADVANCED','ENGINE_PLASMA','SHIELD_MK1','POWER_FUSION','SENSORS_SHORT','WEAPON_PULSE_LASER','COMBAT_COMPUTER_MK2'
    ]);
    aiShip.id = 'Pirate-Interceptor';

    const mgr = new CombatStateManager();
    mgr.startCombat([
      { ship: playerShip, id: playerShip.id, faction: 'player', isPlayer: false, isAI: true, personality: 'TACTICAL', veteranRank: 'TRAINED' },
      { ship: aiShip, id: aiShip.id, faction: 'pirates', isPlayer: false, isAI: true, personality: 'TACTICAL', veteranRank: 'VETERAN' }
    ], 300);

    flowRef.current = new CombatFlowController(mgr);
    setCombat(mgr);
    setPlan(null);
  };

  const stepTurn = async () => {
    if (!combat || !flowRef.current) return;
    const currentId = combat.getCurrentShipId();
    const current = combat.getCurrentShip();
    // If it's an AI ship, let AI decide; if player, wait for manual action
    let p = null;
    if (current && current.isAI && !current.isPlayer) {
      p = await flowRef.current.executeTurn(currentId);
    }
    setPlan(p || null);
    // Advance to next combatant automatically
    combat.advanceTurn();
    // Avoid cloning CombatStateManager (would drop methods). Use a refresh tick.
    setRefreshTick(t => t + 1);
  };

  // Player action handlers: invoke flow controller directly
  const onPlayerMoveCloser = async () => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'MOVE_CLOSER', targetId: target?.id });
    setRefreshTick(t => t + 1);
  };

  const onPlayerMoveFarther = async () => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'MOVE_FARTHER', targetId: target?.id });
    setRefreshTick(t => t + 1);
  };

  const onPlayerEvasive = async () => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'EVASIVE_MANEUVERS' });
    setRefreshTick(t => t + 1);
  };

  const onPlayerBoostShields = async () => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'BOOST_SHIELDS' });
    setRefreshTick(t => t + 1);
  };

  const onPlayerFireWeapon = async (weaponId) => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'FIRE_WEAPON', targetId: target?.id, weaponId });
    setRefreshTick(t => t + 1);
  };

  const onPlayerScan = async () => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'SCAN_TARGET', targetId: target?.id });
    setRefreshTick(t => t + 1);
  };

  const onPlayerTargetLock = async () => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'TARGET_LOCK', targetId: target?.id });
    setRefreshTick(t => t + 1);
  };

  const onPlayerRepair = async () => {
    if (!combat || !flowRef.current) return;
    const actorId = combat.getCurrentShipId();
    await flowRef.current.executeManualAction(actorId, { type: 'EMERGENCY_REPAIR' });
    setRefreshTick(t => t + 1);
  };

  const onPlayerEndTurn = () => {
    if (!combat) return;
    combat.advanceTurn();
    setRefreshTick(t => t + 1);
  };

  useEffect(() => {
    if (!autoRun) return;
    if (!combat) return;
    let mounted = true;
    const run = async () => {
      // Run a few steps with a small delay
      await stepTurn();
      if (mounted) setTimeout(run, 250);
    };
    run();
    return () => { mounted = false; };
  }, [autoRun, combat]);

  useEffect(() => { initCombat(); }, []);

  return (
    <div className="admin-container" style={{ padding: 16 }}>
      <div className="glass-card" style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center', marginBottom: 16 }}>
        <button className="btn-neon btn-neon-danger" onClick={onClose}>Close</button>
        <button className="btn-neon" onClick={initCombat}>Reset Match</button>
        <button className="btn-neon" onClick={stepTurn} disabled={!combat}>Step Turn</button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--neon-cyan)' }}>
          <input type="checkbox" checked={autoRun} onChange={e => setAutoRun(e.target.checked)} /> Auto-run
        </label>
        <div style={{ marginLeft: 'auto' }}>
          {combat && (
            (() => {
              const currentId = typeof combat.getCurrentShipId === 'function'
                ? combat.getCurrentShipId()
                : (combat.turnOrder && typeof combat.turnIndex === 'number'
                    ? combat.turnOrder[combat.turnIndex]
                    : '—');
              return (
                <span>Round {combat.roundNumber} • Turn: <b>{currentId}</b></span>
              );
            })()
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {combat && actor && target ? (
          <CombatHUD
            combat={combat}
            actor={actor}
            target={target}
            plan={plan}
            onActions={{
              moveCloser: onPlayerMoveCloser,
              moveFarther: onPlayerMoveFarther,
              fireWeapon: onPlayerFireWeapon,
              evasive: onPlayerEvasive,
              boostShields: onPlayerBoostShields,
              scan: onPlayerScan,
              targetLock: onPlayerTargetLock,
              repair: onPlayerRepair,
              endTurn: onPlayerEndTurn,
            }}
          />
        ) : (
          <div style={{ padding: 16 }}>Initializing combat...</div>
        )}
      </div>
    </div>
  );
}
