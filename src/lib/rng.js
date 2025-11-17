// Deterministic RNG + Hash + Substreams
// Lightweight, no external deps.

// 32-bit string hash (xmur3 variant)
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

// Mulberry32 PRNG: returns [0,1)
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Create a 32-bit seed from a base seed and a label path
export function deriveSeed(base, label) {
  const h = xmur3(`${base}::${label}`);
  return h();
}

// Create a RNG substream by label
export function makeRng(seedString, label) {
  const base = xmur3(seedString)();
  const s = deriveSeed(base, label);
  return mulberry32(s);
}

// Helpers
export function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

export function weighted(pairs, rng) {
  // pairs: [[value, weight], ...]
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [v, w] of pairs) {
    if ((r -= w) <= 0) return v;
  }
  return pairs[0][0];
}

export function noise(rng, amp = 1, bias = 0) {
  return (rng() * 2 - 1) * amp + bias;
}
