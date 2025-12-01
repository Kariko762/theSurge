import React from 'react';
import '../../styles/AdminGlass.css';
import '../../styles/DesignSystem.css';

// Simple combat UI panel to display SR/TN and AI rationale
export default function CombatWindow({ combat, actor, target, plan }) {
  if (!combat || !actor || !target) {
    return <div style={{ padding: 12 }}>Combat data unavailable</div>;
  }

  const distance = combat.positioning.getDistance(actor.id, target.id);
  const band = combat.positioning.getDistanceBandKey(actor.id, target.id);

  const targetStats = target.ship.calculateCombatStats();
  const actorStats = actor.ship.calculateCombatStats();
  const sr = targetStats.signatureRadius;
  const SR_BASE = 18;
  const BASE_TN = 15;
  const tn = BASE_TN + (SR_BASE - sr);

  return (
    <div className="admin-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
      <section className="glass-card" style={{ padding: 16 }}>
        <h3 className="neon-title" style={{ margin: 0, marginBottom: 8 }}>Engagement</h3>
        <div>Actor: <b>{actor.id}</b></div>
        <div>Target: <b>{target.id}</b></div>
        <div>Distance: {distance} km</div>
        <div>Band: {band}</div>
      </section>

      <section className="glass-card" style={{ padding: 16 }}>
        <h3 className="neon-title" style={{ margin: 0, marginBottom: 8 }}>Defense (SR/TN)</h3>
        <div>Target SR: <b>{sr}</b> (lower = harder to hit)</div>
        <div>Computed TN: <b>{tn}</b> (TN = {BASE_TN} + ({SR_BASE} - SR))</div>
      </section>

      <section className="glass-card" style={{ gridColumn: '1 / span 2', padding: 16 }}>
        <h3 className="neon-title" style={{ margin: 0, marginBottom: 8 }}>Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--neon-cyan)' }}>Player</div>
            <Bar label="Hull" value={actor.ship.currentHull ?? actorStats.maxHull} max={actorStats.maxHull} color="var(--neon-pink)" />
            <Bar label="Shields" value={actor.ship.currentShields ?? actorStats.maxShields} max={actorStats.maxShields} color="var(--neon-blue)" />
          </div>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--neon-cyan)' }}>Enemy</div>
            <Bar label="Hull" value={target.ship.currentHull ?? targetStats.maxHull} max={targetStats.maxHull} color="var(--neon-pink)" />
            <Bar label="Shields" value={target.ship.currentShields ?? targetStats.maxShields} max={targetStats.maxShields} color="var(--neon-blue)" />
          </div>
        </div>
      </section>

      <section className="glass-card" style={{ gridColumn: '1 / span 2', padding: 16 }}>
        <h3 className="neon-title" style={{ margin: 0, marginBottom: 8 }}>AI Plan</h3>
        <div>Movement: {plan?.movement ? `${plan.movement.action} → ${plan.movement.targetId}` : 'None'}</div>
        <div>Actions: {plan?.actions?.length ? plan.actions.join(', ') : 'None'}</div>
        <div>Bonus: {plan?.bonusActions?.length ? plan.bonusActions.join(', ') : 'None'}</div>

        {plan?.scores && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>Scores:</div>
            <pre style={{ margin: 0, background: 'var(--glass-background-dark)', padding: 8, borderRadius: 6 }}>
              {JSON.stringify(plan.scores, null, 2)}
            </pre>
          </div>
        )}

        {plan?.reasons?.length ? (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600 }}>Rationale:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {plan.reasons.map((r, i) => (
                <li key={i} style={{ marginBottom: 6 }}><code>{JSON.stringify(r)}</code></li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Bar({ label, value, max, color }) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'var(--neon-cyan)' }}>{label}</span>
        <span style={{ color: 'var(--neon-cyan)' }}>{value}/{max}</span>
      </div>
      <div style={{ height: 10, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
    </div>
  );
}
