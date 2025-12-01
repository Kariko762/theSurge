import React, { useMemo, useState } from 'react';
import '../../styles/AdminGlass.css';

import BattlespaceStrip from './BattlespaceStrip.jsx';
import CombatWindow from './CombatWindow.jsx';
import { ACTION_TYPES, getAvailableActions } from '../../lib/combat/combatActions.js';

export default function CombatHUD({ combat, actor, target, plan, onActions }) {
  if (!combat || !actor || !target) return null;

  const isPlayerTurn = !!actor.isPlayer;
  const [open, setOpen] = useState({ move: true, attack: true, utility: true });
  const remaining = combat.getActionsRemaining(actor.id) || { actions: 0, bonusActions: 0, movement: 0, reactions: 0 };
  const available = useMemo(() => getAvailableActions(actor, combat), [actor, combat, combat.phase]);
  const stats = actor.ship.calculateCombatStats();
  const weapons = stats.weapons || [];

  const can = (type) => combat.canPerformAction(actor.id, type);
  const costLabel = (typeKey) => {
    const def = ACTION_TYPES[typeKey];
    if (!def) return '';
    const c = def.cost || {};
    if (c.actions) return `(${c.actions} AP)`;
    if (c.bonusActions) return `(Bonus)`;
    if (c.reactions) return `(Reaction)`;
    if (c.movement) return `(MP)`;
    return '';
  };

  return (
    <div className="admin-container" style={{ padding: 16 }}>
      {/* Top HUD Bar */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 700, letterSpacing: 2, color: 'var(--neon-cyan)' }}>ENGAGEMENT CONTROL</div>
          <div style={{ opacity: 0.8 }}>
            Round {combat.roundNumber} • Phase {combat.phase} • Turn: <b>{combat.getCurrentShipId?.() || '—'}</b>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <span className="btn-neon" style={{ padding: '0.5rem 1rem' }}>{combat.positioning.getDistanceBandKey(actor.id, target.id)}</span>
        </div>
      </div>

      {/* Main Grid: Battlespace + Status + Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: 16 }}>
          <BattlespaceStrip combat={combat} actor={actor} opponents={[target]} />
          <CombatWindow combat={combat} actor={actor} target={target} plan={plan} />
        </div>

        {/* Action Panel */}
        <div className="glass-card" style={{ padding: 12 }}>
          <h3 className="neon-title" style={{ marginTop: 0 }}>Actions</h3>
          <div style={{ color: 'var(--neon-cyan)', fontSize: 12, marginBottom: 8 }}>
            Actions: {remaining.actions} • Bonus: {remaining.bonusActions} • Move: {remaining.movement} • React: {remaining.reactions}
          </div>
          {isPlayerTurn ? (
            <div>
              {/* Movement */}
              <Section title="Movement" open={open.move} onToggle={() => setOpen(o => ({ ...o, move: !o.move }))}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button className="btn-neon" disabled={!can('movement') || !available.includes('MOVE_CLOSER')} onClick={onActions.moveCloser}>
                    Move Closer {costLabel('MOVE_CLOSER')}
                  </button>
                  <button className="btn-neon" disabled={!can('movement') || !available.includes('MOVE_FARTHER')} onClick={onActions.moveFarther}>
                    Move Farther {costLabel('MOVE_FARTHER')}
                  </button>
                </div>
              </Section>

              {/* Attack */}
              <Section title="Attack" open={open.attack} onToggle={() => setOpen(o => ({ ...o, attack: !o.attack }))}>
                {weapons.length === 0 ? (
                  <div style={{ color: 'var(--neon-cyan)', fontSize: 12 }}>No weapons installed.</div>
                ) : (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {weapons.map((w, idx) => (
                      <button
                        key={w.id || idx}
                        className="btn-neon"
                        disabled={!can('action') || !available.includes('FIRE_WEAPON')}
                        onClick={() => onActions.fireWeapon(w.id)}
                        title={`Damage: ${w.damage}`}
                      >
                        {w.name} • {w.damage} {costLabel('FIRE_WEAPON')}
                      </button>
                    ))}
                    <button className="btn-neon" disabled={!can('action') || !available.includes('EVASIVE_MANEUVERS')} onClick={onActions.evasive}>
                      Evasive Maneuvers {costLabel('EVASIVE_MANEUVERS')}
                    </button>
                    <button className="btn-neon" disabled={!can('action') || !available.includes('SCAN_TARGET')} onClick={onActions.scan}>
                      Scan Target {costLabel('SCAN_TARGET')}
                    </button>
                  </div>
                )}
              </Section>

              {/* Utility */}
              <Section title="Utility" open={open.utility} onToggle={() => setOpen(o => ({ ...o, utility: !o.utility }))}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <button className="btn-neon" disabled={!can('bonusAction') || !available.includes('BOOST_SHIELDS')} onClick={onActions.boostShields}>
                    Boost Shields {costLabel('BOOST_SHIELDS')}
                  </button>
                  <button className="btn-neon" disabled={!can('bonusAction') || !available.includes('TARGET_LOCK')} onClick={onActions.targetLock}>
                    Target Lock {costLabel('TARGET_LOCK')}
                  </button>
                  <button className="btn-neon" disabled={!can('action') || !available.includes('EMERGENCY_REPAIR')} onClick={onActions.repair}>
                    Emergency Repair {costLabel('EMERGENCY_REPAIR')}
                  </button>
                </div>
              </Section>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn-neon" onClick={onActions.endTurn}>End Turn</button>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--neon-cyan)' }}>Awaiting enemy actions… Use Step Turn.</div>
          )}
        </div>
      </div>

      {/* Bottom Log */}
      <div className="glass-card" style={{ marginTop: 16, padding: 12 }}>
        <h3 className="neon-title" style={{ marginTop: 0 }}>Combat Log</h3>
        <div style={{ maxHeight: 160, overflow: 'auto', background: 'rgba(0,0,0,0.35)', borderRadius: 8, padding: 8 }}>
          {combat.combatLog.slice(-20).map((entry, i) => (
            <div key={i} style={{ fontSize: 12 }}>
              <span style={{ color: 'var(--neon-cyan)' }}>[R{entry.round}:{entry.phase}]</span> {entry.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={onToggle}>
        <span style={{ color: 'var(--neon-cyan)', letterSpacing: 1 }}>{open ? '▾' : '▸'}</span>
        <span className="neon-title">{title}</span>
      </div>
      {open ? <div style={{ marginTop: 8 }}>{children}</div> : null}
    </div>
  );
}
