// DRE-based Scrap Processor
// Each item may define `scrapOutputs`: [{ id, name, min, max, chance, value }] where
//  - chance: base probability (0-1) modified by efficiency
//  - min/max: quantity range
//  - value: unit economic value (credits or abstract unit)
// Fallback: convert a fraction of weight to generic scrap metal if no table.

import { makeRng, randInt, noise } from '../rng.js';

function computeEfficiencyWithDetails(item, context = {}) {
  const base = 0.55;
  const tierAdd = (item.tier || 0) * 0.08;
  const techMod = context.techLevel ? (context.techLevel * 0.02) : 0;
  const crewMod = context.crewSkill ? (context.crewSkill * 0.015) : 0;
  const wearPenalty = item.wear ? -Math.min(0.25, item.wear * 0.01) : 0;
  const rng = makeRng(context.seed || 'SCRAP-SEED', item.id || item.name || 'ITEM');
  const variance = noise(rng, 0.05);
  let eff = base + tierAdd + techMod + crewMod + wearPenalty + variance;
  eff = Math.min(0.95, Math.max(0.2, eff));
  return {
    efficiency: eff,
    breakdown: { base, tierAdd, techMod, crewMod, wearPenalty, variance }
  };
}

export function computeEfficiency(item, context = {}) {
  // Base efficiency influenced by tier and context modifiers
  const base = 0.55 + (item.tier || 0) * 0.08; // tiers raise efficiency
  const techMod = context.techLevel ? (context.techLevel * 0.02) : 0;
  const crewSkill = context.crewSkill ? (context.crewSkill * 0.015) : 0;
  const wearPenalty = item.wear ? -Math.min(0.25, item.wear * 0.01) : 0; // wear expressed 0-100
  const rng = makeRng(context.seed || 'SCRAP-SEED', item.id || item.name || 'ITEM');
  const variance = noise(rng, 0.05); // small +/- fluctuation
  let eff = base + techMod + crewSkill + wearPenalty + variance;
  return Math.min(0.95, Math.max(0.2, eff));
}

export function scrapItem(item, context = {}) {
  const rng = makeRng(context.seed || 'SCRAP-SEED', `${item.id || item.name}-scrap`);
  const { efficiency, breakdown } = computeEfficiencyWithDetails(item, context);
  const outputs = [];
  const detailsEntries = [];

  if (Array.isArray(item.scrapOutputs) && item.scrapOutputs.length) {
    for (const entry of item.scrapOutputs) {
      const effectiveChance = Math.min(1, entry.chance * (0.7 + efficiency));
      const procRoll = rng();
      const hit = procRoll <= effectiveChance;
      let baseQty = 0;
      let qtyRoll = null;
      let finalQty = 0;
      const scalingFactor = 0.6 + efficiency * 0.7;
      if (hit) {
        qtyRoll = randInt(rng, entry.min, entry.max);
        baseQty = qtyRoll;
        const scaled = Math.round(baseQty * scalingFactor);
        finalQty = Math.max(entry.min, scaled);
        outputs.push({ id: entry.id, name: entry.name, quantity: finalQty, unitValue: entry.value });
      }
      detailsEntries.push({
        id: entry.id,
        name: entry.name,
        baseChance: entry.chance,
        effectiveChance,
        procRoll,
        hit,
        min: entry.min,
        max: entry.max,
        qtyRoll,
        baseQty,
        scalingFactor,
        finalQty,
        unitValue: entry.value
      });
    }
  } else {
    // Fallback generic scrap using item weight & tier
    const weight = item.weight_kg || 1;
    const baseQty = Math.round(weight * 0.5 * (0.6 + efficiency));
    outputs.push({ id: 'scrap_metal', name: 'Scrap Metal', quantity: Math.max(1, baseQty), unitValue: 1 });
  }

  // Value assessment
  const scrapValue = outputs.reduce((s, o) => s + o.quantity * (o.unitValue || 1), 0);
  const intrinsicValue = estimateItemValue(item);
  const economical = scrapValue >= intrinsicValue * 0.65; // threshold

  return {
    efficiency: Number(efficiency.toFixed(3)),
    intrinsicValue,
    scrapValue,
    economical,
    outputs,
    details: {
      efficiencyBreakdown: breakdown,
      path: Array.isArray(item.scrapOutputs) && item.scrapOutputs.length ? 'table' : 'fallback',
      entries: detailsEntries
    }
  };
}

export function estimateItemValue(item) {
  // Simple heuristic combining tier, weight, and attributes
  const tierFactor = 1 + (item.tier || 0) * 0.6;
  const weightFactor = (item.weight_kg || 1) * 0.8;
  let attrValue = 0;
  if (item.attributes) {
    for (const v of Object.values(item.attributes)) {
      if (typeof v === 'number') attrValue += v * 0.1;
    }
  }
  return Math.round((tierFactor * 10) + weightFactor + attrValue);
}
