# Seeded Solar System Generation (v1)

This document defines the deterministic, seed-based generator that produces a star system layout, detection characteristics, and time-based dynamic events for the game.

## Goals
- Reproducible systems from a single human-friendly seed string
- Immediate visibility of large-scale structures from the heliosphere edge
- Proximity and sensor-power–gated discovery of medium/smaller features
- Time-evolving dynamic stream (Surge spikes, distress, wakes, conflicts)

---

## Seed Schema

Seed string (example): `SSG1-G:SECTOR42:8421C9`
- `SSG1`: generator version
- `G`: star class (one of O/B/A/F/G/K/M). If omitted, the generator rolls class from the payload.
- `SECTOR42`: free-text label included in hashes; optional
- `8421C9`: base36/hex payload (any length). Drives RNG substreams.

Helpers split the final seed into deterministic substreams:
- `star`: class/luminosity/flare
- `orbits`: orbit count, spacing, jitter
- `parents`: one primary POI per orbit (planet/belt/orbital/anomaly/etc.)
- `zones`: dark/static/surge extents and intensities
- `children`: hidden sub-POIs per parent (revealed by scan)
- `dynamics`: time-based events: Surge spike windows, conflict escalations, new distress, moving wakes

Determinism: All outputs must be functions of `(seed, path)` where `path` is a unique identifier like `orbits/3/parent`.

---

## Parents (Seed-Defined)

Large-scale features (visible at heliosphere edge unless noted otherwise):
- HELIOSPHERE (system radius – sets scale and initial detection distance)
- SUN (star class + luminosity + flare profile)
- LARGE SOLAR FACILITIES (e.g., Dyson sphere/swarms)
- PLANETS
- PLANETARY ACTIVITY (LARGE) — e.g., global storms/auroras/megavolcanism (visible at range)
- MOONS (LARGE)
- MOON (MEDIUM) — proximity/sensors-gated
- ORBITAL PLATFORMS (UNIDENTIFIED) — large visible, smaller proximity-gated
- ASTEROID FIELDS (UNSURVEYED)
- CONFLICT ZONE (LARGE)
- CONFLICT ZONE (MEDIUM) — proximity-gated
- DISTRESS SIGNALS — baseline seeded beacons (dynamics add new ones)
- PLASMA WAKE DISTURBANCES (LARGE WAKE)
- O'NEILL CYLINDERS
- NEBULA/CLOUD FORMATIONS
- SURGE ZONES (ZONES OF HIGH RADIATION)

Each orbit has exactly one primary parent POI. Children (ruins, caches, sub-decks) are pre-rolled and hidden until Scan/Investigate.

---

## Star Classes (Effects)
- O/B: very bright, rare, high radiation, very high RFE yields; fewer habitable planets
- A/F: bright, balanced; moderate-high RFE; good variety
- G: baseline mix and yields
- K: calmer; more belts; better salvage density
- M: low constant radiation but frequent flares; larger Dark Zone; more Surge windows

---

## Zones & RFE
- Dark Zone (near sun): low ambient radiation; Surge-safe; low-mid RFE
- Static Zone (outer system): high ambient radiation; high passive RFE; damage risk
- Surge Zones: localized spikes in space/time; extreme radiation & RFE

RFE yield formula (illustrative):
- `Y = α_class × β_zone × clamp(noise, 0.5, 1.5)`

---

## Detection Model (Plasma/Magnetic Sensing)
Sensors read perturbations in plasma and magnetic solar winds.
- Signal strength `S` depends on object scale and distance: `S = B_obj × Z_mod × (1 + n1) / d^2`, `n1 ∈ [-0.15, 0.15]`
- Threshold `T` depends on sensors power, interference, and ship wake: `T = T0 / (1 + P_sens/100) × (1 + n2) × (1 + Wake/140)`
- Visibility: object is visible iff `S ≥ T`
- Large objects: high `B_obj` → visible from heliosphere edge
- Medium objects: require approach or more sensor power

Outputs we store per parent:
- `detectAtAU`: approximate AU distance where `S ≈ T` for baseline sensors
- `visibleAtEdge: boolean` for default ship configuration

---

## Generation Pipeline
1) Seed & Substreams: `(hash(seedStr)) → rng`, derive per-domain RNGs
2) Heliosphere: radius via star luminosity and noise → sets map extents
3) Sun: class, luminosity, flare profile (drives zones & Surge cadence)
4) Orbits: count `N` and distances `d_n = d0 × r^n × (1 + ε)`
5) Parents per orbit: weighted by class; assign type/tags/size (Large/Medium)
6) Zones: Dark/Static/Surge extents and baselines
7) Children: hidden sub-POIs with scan thresholds & loot keys
8) Detection fields: compute `detectAtAU`, `visibleAtEdge`
9) Dynamics: time stream of Surge spikes, moving wakes, conflicts, distress

---

## Data Model (Sketch)
```ts
System {
  seed: string
  heliosphere: { radiusAU: number }
  star: { class: 'O'|'B'|'A'|'F'|'G'|'K'|'M', lum: number, flare: number }
  zones: { darkAU: number, staticAU: number, surgeLoci: Array<{angle:number, au:number, strength:number}> }
  orbits: Orbit[]
}

Orbit {
  index: number
  distanceAU: number
  parent: Parent
}

Parent {
  id: string
  type: 'planet'|'belt'|'orbital'|'anomaly'|'facility'|'habitat'|'nebula'|'conflict'|'wake'|'distress'
  size: 'Large'|'Medium'
  name: string
  tags: string[]
  baseSignal: number
  detectAtAU: number
  visibleAtEdge: boolean
  scanDC: number
  children?: Child[]
}
```

---

## UI Integration
- System Map: plot parents by orbit distance & angle
- POI Table: list parents; reveal children after Scan/Investigate
- Status Bars: reflect zones & radiation
- Actions: use `{POI_NAME}` from selected parent; children unlock with scans

---

## Examples
- `SSG1-G:SECTOR42:8421C9` — G-class, balanced; 8–10 orbits; belts mid/outer; static zone strong
- `SSG1-K:ASH-DELTA:9KCM7Q` — K-class, calmer; more belts; salvage-rich
- `SSG1-M:RED-GLARE:7F2Q9K` — M-class, frequent flares; larger dark zone; volatile Surge windows
