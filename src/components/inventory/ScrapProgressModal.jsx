import React, { useEffect, useState, useRef } from 'react';
import { scrapItem } from '../../lib/inventory/scrap';
import { makeRng, randInt } from '../../lib/rng';

const CYAN = '#00ffff';

function getScrapScript(item) {
  const base = (msg) => ({ type: 'log', msg });
  const rolls = (label) => ({ type: 'roll', label });
  const cat = (item.category || '').toLowerCase();
  if (cat.includes('weapon')) return [
    base('Disassembling emitter housing'),
    base('Stripping thermal shielding'),
    base('Extracting coil assemblies'),
    rolls('Crucible analysis'),
    base('Separating conductive alloys'),
    base('Final yield assessment')
  ];
  if (cat.includes('engine') || cat.includes('thruster')) return [
    base('Purging propellant lines'),
    base('Recovering magnetic nozzles'),
    base('Demagnetizing coil windings'),
    rolls('Spin integrity test'),
    base('Smelting heat-stressed alloys'),
    base('Final yield assessment')
  ];
  if (cat.includes('sensor')) return [
    base('Decoupling array mounts'),
    base('Recovering PCB substrates'),
    base('Sorting precision crystals'),
    rolls('Quantum noise calibration'),
    base('Extracting trace metals'),
    base('Final yield assessment')
  ];
  if (cat.includes('ai')) return [
    base('Isolating core lattice'),
    base('Defusing security fuses'),
    base('Stripping copper cabling'),
    rolls('Cipher entropy check'),
    base('Reclaiming rare earths'),
    base('Final yield assessment')
  ];
  // default
  return [
    base('Assessing structural integrity'),
    base('Breaking down assemblies'),
    base('Melting down composites'),
    rolls('Material purity assay'),
    base('Separating alloy fractions'),
    base('Final yield assessment')
  ];
}

export default function ScrapProgressModal({ item, onClose, onComplete }) {
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState([]);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const detailsRef = useRef(null);
  const [showDetails, setShowDetails] = useState(false);
  const sessionSeedRef = useRef(null);
  if (!sessionSeedRef.current) {
    sessionSeedRef.current = `SCRAP-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  useEffect(() => {
    let cancelled = false;
    const baseScript = getScrapScript(item);
    const seed = sessionSeedRef.current;
    const rng = makeRng(seed, item.instanceId || item.name);
    let i = 0;
    // Pre-compute actual scrap with details so rolls drive results
    const preRes = scrapItem(item, { seed, techLevel: 5, crewSkill: 4 });
    detailsRef.current = preRes.details || null;
    // Insert per-entry roll lines right after the first roll marker
    let script = [...baseScript];
    const rollIndex = script.findIndex(s => s.type === 'roll');
    if (rollIndex !== -1 && detailsRef.current && detailsRef.current.entries) {
      const extra = [];
      for (const e of detailsRef.current.entries) {
        const procPct = Math.round((e.procRoll ?? 0) * 100);
        const effPct = Math.round((e.effectiveChance ?? 0) * 100);
        extra.push({ type: 'detail', msg: `[PROC] ${e.name}: d100 ${procPct} vs ${effPct}% — ${e.hit ? 'SUCCESS' : 'FAIL'}` });
        if (e.hit) {
          const range = `${e.min}-${e.max}`;
          extra.push({ type: 'detail', msg: `[QTY] ${e.name}: range ${range}, roll ${e.qtyRoll} → base ${e.baseQty}, scale ×${(e.scalingFactor || 1).toFixed(3)} → ×${e.finalQty}` });
        }
      }
      script = [
        ...script.slice(0, rollIndex + 1),
        ...extra,
        ...script.slice(rollIndex + 1)
      ];
    }
    const total = script.length;

    const tick = () => {
      if (cancelled) return;
      if (i >= total) {
        // Use precomputed result so shown rolls match the outcome
        const res = preRes;
        setResult(res);
        setProgress(100);
        // Do not auto-complete; wait for user to press OK
        return;
      }
      const step = script[i++];
      if (step.type === 'log') {
        setLines(prev => [...prev, `> ${step.msg}...`]);
      } else if (step.type === 'roll') {
        const d100 = randInt(rng, 1, 100);
        setLines(prev => [...prev, `> ${step.label} (Roll: ${d100})`]);
      } else if (step.type === 'detail') {
        setLines(prev => [...prev, `> ${step.msg}`]);
      }
      setProgress(Math.min(99, Math.round((i / total) * 100)));
      timerRef.current = setTimeout(tick, 350 + randInt(rng, 0, 200));
    };
    timerRef.current = setTimeout(tick, 250);
    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [item?.instanceId || item?.name]);

  const handleCopy = async () => {
    if (!result) return;
    const logsText = lines.join("\n");
    const eff = (result.efficiency * 100).toFixed(1) + '%';
    const valueLine = `Value Ratio: ${result.scrapValue} / ${result.intrinsicValue} — ${result.economical ? 'ECONOMICAL' : 'NOT ECONOMICAL'}`;
    const yieldLines = result.outputs
      .map(o => `${o.name}\n×${o.quantity}`)
      .join("\n");
    const report = [
      logsText,
      '',
      'FINAL REPORT',
      `Efficiency: ${eff}`,
      valueLine,
      'Yield:',
      yieldLines
    ].join("\n");
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      // no-op; clipboard may be unavailable
    }
  };

  return (
    <div
      className="terminal-modal-overlay"
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,10,20,0.7)', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520,
          background: 'rgba(0, 10, 20, 0.96)',
          border: `2px solid ${CYAN}`,
          boxShadow: `0 0 30px ${CYAN}60, inset 0 0 30px rgba(0,255,255,0.06)`,
          padding: 18,
          margin: '10vh auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="holo-text" style={{ color: CYAN, letterSpacing: 2 }}>SCRAPPING: {item.name}</div>
          <button
            onClick={onClose}
            title="Cancel"
            style={{ width: 28, height: 28, background: 'transparent', border: `1px solid ${CYAN}66`, color: CYAN, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <div className="progress-bar" style={{ height: 10, border: `1px solid ${CYAN}55`, background: 'rgba(0,255,255,0.06)' }}>
          <div className="progress-bar-fill" style={{ width: `${progress}%`, background: `${CYAN}99`, height: '100%' }} />
        </div>
        <div
          style={{
            height: 150,
            overflowY: 'auto',
            background: 'rgba(0,255,255,0.03)',
            border: `1px solid ${CYAN}33`,
            padding: 10,
            fontSize: 11,
            color: 'rgba(200,255,255,0.9)',
            lineHeight: 1.6,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
          }}
          className="holo-scroll"
        >
          {lines.map((l, idx) => (
            <div key={idx}>{l}</div>
          ))}
        </div>
        {result && (
          <div style={{
            background: 'rgba(0,255,255,0.03)',
            border: `1px solid ${CYAN}33`,
            padding: 10
          }}>
            <div className="holo-text" style={{ color: CYAN, fontSize: 12, marginBottom: 6 }}>FINAL REPORT</div>
            <div style={{ fontSize: 11, color: 'rgba(200,255,255,0.9)', lineHeight: 1.8 }}>
              <div>Efficiency: <span style={{ color: CYAN }}>{(result.efficiency * 100).toFixed(1)}%</span></div>
              <div>Value Ratio: <span style={{ color: CYAN }}>{result.scrapValue}</span> / {result.intrinsicValue} — {result.economical ? 'ECONOMICAL' : 'NOT ECONOMICAL'}</div>
              <div style={{ marginTop: 6 }}>Yield:</div>
              {result.outputs.map(o => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ opacity: 0.9 }}>{o.name}</span>
                  <span style={{ color: CYAN, fontWeight: 600 }}>×{o.quantity}</span>
                </div>
              ))}
              {result.details && result.details.entries && (
                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => setShowDetails(v => !v)}
                    style={{
                      padding: '6px 8px',
                      border: `1px solid ${CYAN}44`,
                      background: 'rgba(0,255,255,0.03)',
                      color: CYAN,
                      cursor: 'pointer',
                      fontSize: 11
                    }}
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                  {showDetails && (
                    <div style={{ marginTop: 6, opacity: 0.9 }}>
                      <div style={{ marginBottom: 4 }}>Rolls:</div>
                      {result.details.entries.map(e => (
                        <div key={e.id} style={{ marginBottom: 4 }}>
                          <div>{e.name}: proc d100 {Math.round((e.procRoll || 0) * 100)} vs {Math.round((e.effectiveChance || 0) * 100)}% — {e.hit ? 'SUCCESS' : 'FAIL'}</div>
                          {e.hit && (
                            <div style={{ opacity: 0.9 }}>qty roll {e.qtyRoll} → base {e.baseQty}, scale ×{(e.scalingFactor || 1).toFixed(3)} → ×{e.finalQty}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          {result && (
            <button
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy Report'}
              style={{
                padding: '8px 10px',
                border: `1px solid ${CYAN}55`,
                background: 'rgba(0,255,255,0.04)',
                color: copied ? '#002' : CYAN,
                cursor: 'pointer',
                boxShadow: copied ? `0 0 10px ${CYAN}60 inset` : 'none'
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px 12px',
              border: `1px solid ${CYAN}55`,
              background: 'rgba(0,255,255,0.04)',
              color: CYAN,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
          <button
            onClick={() => result && onComplete && onComplete(result)}
            disabled={!result}
            style={{
              padding: '8px 16px',
              border: `1px solid ${CYAN}`,
              background: result ? 'rgba(0,255,255,0.12)' : 'rgba(0,255,255,0.03)',
              color: result ? CYAN : 'rgba(0,255,255,0.4)',
              cursor: result ? 'pointer' : 'not-allowed',
              boxShadow: result ? `0 0 12px ${CYAN}40` : 'none'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
