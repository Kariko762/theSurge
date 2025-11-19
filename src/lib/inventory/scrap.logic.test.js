// Logical test for DRE-based scrap yield
// Usage: node src/lib/inventory/scrap.logic.test.js

import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapItem, computeEfficiency, estimateItemValue } from './scrap.js';

const seed = 'LOGICAL-TEST';
const context = { seed, techLevel: 5, crewSkill: 4, wear: 0 };

async function loadDb() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.resolve(__dirname, '../../data/items/itemDatabase.json');
  const buf = await readFile(dbPath, 'utf-8');
  return JSON.parse(buf);
}

function pickItem(db, id) {
  const { components, aiCores, materials } = db;
  return (components?.[id] || aiCores?.[id] || materials?.[id]) ?? null;
}

function run(db, itemId) {
  const base = pickItem(db, itemId);
  if (!base) throw new Error(`Item not found: ${itemId}`);

  const item = { ...base, instanceId: 'test-instance' };
  const tier = item.tier || 0;
  const basePart = 0.55 + tier * 0.08 + (context.techLevel * 0.02) + (context.crewSkill * 0.015) - (item.wear ? Math.min(0.25, item.wear * 0.01) : 0);
  const eff = computeEfficiency(item, context);
  const variance = +(eff - basePart).toFixed(3);

  const res = scrapItem(item, context);

  // Fallback path math (when no scrapOutputs): qty = round(weight*0.5*(0.6+eff))
  const halfWeight = (item.weight_kg || 1) * 0.5;
  const qtyFormula = Math.round(halfWeight * (0.6 + eff));

  const iv = estimateItemValue(item);

  const hasTable = Array.isArray(item.scrapOutputs) && item.scrapOutputs.length > 0;
  const tableBreakdown = hasTable ? item.scrapOutputs.map(e => ({
    id: e.id,
    name: e.name,
    baseChance: e.chance,
    effectiveChance: +Math.min(1, e.chance * (0.7 + eff)).toFixed(3),
    min: e.min,
    max: e.max,
    scalingFactor: +(0.6 + eff * 0.7).toFixed(3),
    actual: res.outputs.find(o => o.id === e.id) || null
  })) : null;

  const report = {
    item: { id: item.id, name: item.name, tier: item.tier, weight_kg: item.weight_kg },
    steps: [
      {
        step: 1,
        action: 'Compute DRE efficiency',
        details: {
          base: 0.55,
          tierAdd: +(tier * 0.08).toFixed(3),
          techMod: +(context.techLevel * 0.02).toFixed(3),
          crewMod: +(context.crewSkill * 0.015).toFixed(3),
          wearPenalty: item.wear ? -Math.min(0.25, item.wear * 0.01) : 0,
          variance,
          efficiency: eff
        }
      },
      {
        step: 2,
        action: 'Select scrap path',
        details: {
          hasScrapTable: Array.isArray(item.scrapOutputs) && item.scrapOutputs.length > 0,
          path: (Array.isArray(item.scrapOutputs) && item.scrapOutputs.length > 0) ? 'table' : 'fallback: generic scrap_metal'
        }
      },
      hasTable ? {
        step: 3,
        action: 'Roll outputs (table path)',
        details: tableBreakdown
      } : {
        step: 3,
        action: 'Compute quantity (fallback)',
        details: {
          halfWeight,
          multiplier: +(0.6 + eff).toFixed(3),
          formula: 'round(weight*0.5*(0.6+eff))',
          expectedQty: qtyFormula,
          actualQty: res.outputs?.[0]?.quantity
        }
      },
      {
        step: 4,
        action: 'Value & Economy check',
        details: {
          intrinsicValue: iv,
          scrapValue: res.scrapValue,
          threshold: `${Math.round(iv * 0.65)} (65%)`,
          economical: res.economical
        }
      }
    ],
    result: res
  };

  return report;
}

// Example: Beam Laser Mk II (table path)
const db = await loadDb();
const out = run(db, 'beam_laser_mk2');
console.log(JSON.stringify(out, null, 2));
