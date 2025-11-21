/**
 * DRE Tables for POI Actions
 * Each action defined in poi_actions.json can reference a table here
 * These tables are used with the DRE (Dice Roll Engine) for narrative outcomes
 */

export const poiActionTables = {
  // ============================================================================
  // PLANET ACTIONS
  // ============================================================================
  
  atmospheric_scan: {
    name: "Atmospheric Scan",
    description: "Analyze planetary atmosphere",
    dice: "2d6",
    modifiers: [
      { source: "sensors", type: "shipSystem", bonus: 2 },
      { source: "science", type: "skill", bonus: 1 }
    ],
    outcomes: [
      {
        range: [2, 5],
        severity: "critical_failure",
        narrative: [
          "Sensor interference causes false readings. Atmospheric composition unknown.",
          "Massive electrical storm disrupts scan. Equipment temporarily offline.",
          "Unusual atmospheric anomaly detected - sensors overload. Minor system damage."
        ],
        effects: {
          damage: { system: "sensors", amount: 5 },
          data: { quality: "corrupted" }
        }
      },
      {
        range: [6, 8],
        severity: "partial_success",
        narrative: [
          "Basic atmospheric composition identified: {atmosphereType}. Detailed analysis incomplete.",
          "Scan reveals standard atmosphere with unusual trace elements. Further study needed.",
          "Preliminary data suggests {breathability} atmosphere. Confidence: 60%."
        ],
        effects: {
          data: { 
            quality: "partial",
            atmosphereType: ["nitrogen-oxygen", "carbon dioxide rich", "methane-heavy", "noble gases"],
            breathability: ["breathable", "toxic", "caustic", "inert"]
          }
        }
      },
      {
        range: [9, 11],
        severity: "success",
        narrative: [
          "Complete atmospheric scan: {atmosphereType}, pressure {pressure} kPa, {breathability}.",
          "Comprehensive analysis complete. Weather patterns mapped. Atmosphere is {breathability}.",
          "Detailed scan reveals complex atmosphere with {weatherPattern} weather systems."
        ],
        effects: {
          data: {
            quality: "complete",
            atmosphereType: ["nitrogen-oxygen", "carbon dioxide rich", "methane-heavy", "helium-hydrogen"],
            pressure: ["high (150+)", "standard (80-120)", "low (30-80)", "trace (<30)"],
            breathability: ["breathable", "respirator required", "hostile", "vacuum"],
            weatherPattern: ["stable", "volatile storms", "extreme winds", "calm"]
          },
          science: 25
        }
      },
      {
        range: [12, 14],
        severity: "critical_success",
        narrative: [
          "Exceptional scan quality! Atmosphere fully mapped. Discovered rare {gasType} deposits in upper atmosphere!",
          "Perfect atmospheric profile obtained. Identified optimal landing sites and {bonus} resource.",
          "Outstanding data! Atmosphere analyzed down to trace elements. Discovered {discovery}!"
        ],
        effects: {
          data: {
            quality: "exceptional",
            landing_sites: 3
          },
          loot: [
            { itemId: "atmospheric_sample_rare", quantity: 1, chance: 0.8 },
            { itemId: "helium3_canister", quantity: 2, chance: 0.5 }
          ],
          science: 50,
          discovery: ["thermal vents", "floating organisms", "crystalline formations"]
        }
      }
    ]
  },

  surface_scan: {
    name: "Surface Scan",
    description: "Scan planetary surface for features and resources",
    dice: "2d6",
    modifiers: [
      { source: "deep_scanner", type: "shipSystem", bonus: 2 },
      { source: "mining", type: "skill", bonus: 1 }
    ],
    outcomes: [
      {
        range: [2, 5],
        severity: "critical_failure",
        narrative: [
          "Dense mineral deposits interfere with sensors. Surface composition unknown.",
          "Scan reflects off crystalline formations - data corrupted.",
          "Tectonic activity disrupts scan. Seismic sensors damaged."
        ],
        effects: {
          damage: { system: "deep_scanner", amount: 10 },
          data: { quality: "failed" }
        }
      },
      {
        range: [6, 8],
        severity: "partial_success",
        narrative: [
          "Basic geological survey complete. Common minerals detected: {mineralType}.",
          "Surface mapping 40% complete. Some resource deposits identified.",
          "Preliminary scan reveals {terrain} terrain with scattered {resources}."
        ],
        effects: {
          data: {
            quality: "partial",
            mineralType: ["iron ore", "silicates", "carbon compounds", "water ice"],
            terrain: ["mountainous", "volcanic", "cratered", "plains"],
            resources: ["metal deposits", "mineral veins", "frozen volatiles"]
          },
          loot: [
            { itemId: "common_ore", quantity: 5, chance: 0.6 }
          ]
        }
      },
      {
        range: [9, 11],
        severity: "success",
        narrative: [
          "Complete surface scan. Identified {count} mining sites with {mineralType} deposits.",
          "Comprehensive geological map created. Rich {resource} deposits located.",
          "Full planetary survey complete. Surface features and resources catalogued."
        ],
        effects: {
          data: {
            quality: "complete",
            mining_sites: [2, 3, 4],
            mineralType: ["rare earths", "precious metals", "radioactives", "crystalline structures"]
          },
          loot: [
            { itemId: "rare_ore", quantity: 3, chance: 0.7 },
            { itemId: "mineral_sample", quantity: 5, chance: 0.9 }
          ],
          science: 30
        }
      },
      {
        range: [12, 14],
        severity: "critical_success",
        narrative: [
          "Exceptional scan! Discovered massive {rareResource} deposit - potential motherlode!",
          "Perfect resolution scan. Located ancient {structure} beneath surface!",
          "Outstanding geological data! Found {discovery} - could be extremely valuable!"
        ],
        effects: {
          data: {
            quality: "exceptional",
            mining_sites: [5, 6, 7]
          },
          loot: [
            { itemId: "exotic_mineral", quantity: 2, chance: 0.9 },
            { itemId: "rare_ore", quantity: 10, chance: 1.0 },
            { itemId: "artifact_fragment", quantity: 1, chance: 0.3 }
          ],
          science: 75,
          discovery: ["precursor ruins", "unique crystal formation", "subsurface ocean", "exotic matter"]
        }
      }
    ]
  },

  bio_scan: {
    name: "Biological Scan",
    description: "Detect signs of life or biosignatures",
    dice: "2d6",
    modifiers: [
      { source: "bio_scanner", type: "shipSystem", bonus: 2 },
      { source: "science", type: "skill", bonus: 1 }
    ],
    outcomes: [
      {
        range: [2, 5],
        severity: "critical_failure",
        narrative: [
          "Bio-scanner malfunction. False positives across all spectrums.",
          "Radiation interference. Bio-scan inconclusive and equipment damaged.",
          "Organic sensor contamination detected. Results unreliable."
        ],
        effects: {
          damage: { system: "bio_scanner", amount: 8 },
          data: { quality: "corrupted", contamination: true }
        }
      },
      {
        range: [6, 8],
        severity: "partial_success",
        narrative: [
          "Faint biosignatures detected. Classification: {bioType}. Confidence low.",
          "Possible organic compounds identified. Life signs inconclusive.",
          "Weak bio-readings in {location}. Requires closer investigation."
        ],
        effects: {
          data: {
            quality: "partial",
            bioType: ["microbial", "primitive", "complex", "unknown"],
            location: ["equatorial regions", "polar caps", "subsurface", "atmospheric"]
          }
        }
      },
      {
        range: [9, 11],
        severity: "success",
        narrative: [
          "Confirmed biosignatures: {lifeType} detected. {abundance} distribution.",
          "Life signs positive. Scanning reveals {organism} across {coverage}% of surface.",
          "Biological activity confirmed. {complexity} organisms identified."
        ],
        effects: {
          data: {
            quality: "complete",
            lifeType: ["microorganisms", "plant-analogs", "simple fauna", "diverse ecosystem"],
            abundance: ["sparse", "moderate", "abundant"],
            coverage: [5, 25, 50, 75],
            complexity: ["single-cell", "multicellular", "complex"]
          },
          loot: [
            { itemId: "biological_sample", quantity: 3, chance: 0.8 }
          ],
          science: 40
        }
      },
      {
        range: [12, 14],
        severity: "critical_success",
        narrative: [
          "Extraordinary discovery! {sentience} life forms detected - {discovery}!",
          "Unprecedented bio-diversity! Unique {organism} with {trait} - major scientific find!",
          "Remarkable! Complex ecosystem with {special} - potential for {application}!"
        ],
        effects: {
          data: {
            quality: "exceptional",
            major_discovery: true
          },
          loot: [
            { itemId: "exotic_organism", quantity: 1, chance: 0.7 },
            { itemId: "biological_sample", quantity: 10, chance: 1.0 },
            { itemId: "genetic_data", quantity: 1, chance: 0.5 }
          ],
          science: 100,
          discovery: ["intelligent species", "unique biochemistry", "extreme adaptation", "symbiotic network"],
          sentience: ["non-sentient", "possibly sentient", "clearly intelligent"]
        }
      }
    ]
  },

  // ============================================================================
  // ASTEROID BELT ACTIONS
  // ============================================================================

  asteroid_mining: {
    name: "Asteroid Mining",
    description: "Extract minerals from asteroid belt",
    dice: "2d6",
    modifiers: [
      { source: "mining_laser", type: "shipSystem", bonus: 2 },
      { source: "mining", type: "skill", bonus: 1 },
      { source: "asteroid_density", type: "environment", bonus: -1 }
    ],
    outcomes: [
      {
        range: [2, 5],
        severity: "critical_failure",
        narrative: [
          "Mining laser overheats! Asteroid fragments damage hull plating.",
          "Unstable asteroid - structural collapse! Debris storm causes damage.",
          "Mining operation fails catastrophically. Equipment offline and hull breached."
        ],
        effects: {
          damage: [
            { system: "mining_laser", amount: 15 },
            { type: "hull", amount: 10 }
          ],
          loot: []
        }
      },
      {
        range: [6, 8],
        severity: "partial_success",
        narrative: [
          "Modest mining yield. Collected {amount} tons of {oreType}.",
          "Difficult extraction. Retrieved some materials but operation inefficient.",
          "Basic mining complete. Gathered common ores: {oreList}."
        ],
        effects: {
          loot: [
            { itemId: "iron_ore", quantity: [3, 5], chance: 0.9 },
            { itemId: "nickel_ore", quantity: [2, 4], chance: 0.7 },
            { itemId: "common_ore", quantity: [5, 8], chance: 1.0 }
          ],
          oreType: ["iron", "nickel", "silicates"],
          amount: [5, 8, 12]
        }
      },
      {
        range: [9, 11],
        severity: "success",
        narrative: [
          "Productive mining operation! Extracted {amount} tons including {rareOre}.",
          "Excellent asteroid composition. Mined substantial {resource} deposits.",
          "Successful extraction. Rich yield of {materials} and bonus {rare}."
        ],
        effects: {
          loot: [
            { itemId: "iron_ore", quantity: [8, 12], chance: 1.0 },
            { itemId: "rare_ore", quantity: [2, 5], chance: 0.8 },
            { itemId: "platinum_ore", quantity: [1, 3], chance: 0.5 },
            { itemId: "crystal_shard", quantity: [1, 2], chance: 0.4 }
          ],
          amount: [15, 25],
          rareOre: ["platinum", "rare earths", "crystalline compounds"]
        }
      },
      {
        range: [12, 14],
        severity: "critical_success",
        narrative: [
          "Motherlode! Asteroid contains massive {exoticResource} deposit!",
          "Exceptional mining operation! Discovered {rarity} embedded in asteroid core!",
          "Outstanding yield! Extracted {amount} tons plus {bonus}!"
        ],
        effects: {
          loot: [
            { itemId: "exotic_ore", quantity: [3, 6], chance: 0.9 },
            { itemId: "platinum_ore", quantity: [5, 10], chance: 1.0 },
            { itemId: "crystal_shard", quantity: [3, 5], chance: 0.8 },
            { itemId: "rare_element", quantity: [1, 2], chance: 0.6 },
            { itemId: "artifact_fragment", quantity: 1, chance: 0.2 }
          ],
          amount: [30, 50],
          exoticResource: ["iridium vein", "crystallized exotic matter", "precursor alloy"],
          bonus: ["ancient artifact fragment", "unusual energy signature", "rare isotope"]
        }
      }
    ]
  },

  // ============================================================================
  // ORBITAL STATION ACTIONS
  // ============================================================================

  station_structural: {
    name: "Station Structural Scan",
    description: "Assess station integrity and damage",
    dice: "2d6",
    modifiers: [
      { source: "sensors", type: "shipSystem", bonus: 1 },
      { source: "engineering", type: "skill", bonus: 1 }
    ],
    outcomes: [
      {
        range: [2, 5],
        severity: "critical_failure",
        narrative: [
          "Scan triggers automated defense system! Taking fire!",
          "Structural scan causes power surge in station - explosion imminent!",
          "Sensor beam destabilizes damaged section - debris heading your way!"
        ],
        effects: {
          damage: { type: "hull", amount: 15 },
          data: { quality: "failed", threat: "active" }
        }
      },
      {
        range: [6, 8],
        severity: "partial_success",
        narrative: [
          "Basic structural assessment: {condition}. Major damage in {section} sectors.",
          "Partial scan reveals {integrity}% structural integrity. Life support {status}.",
          "Limited data obtained. Station appears {state} with {damage} damage."
        ],
        effects: {
          data: {
            quality: "partial",
            condition: ["heavily damaged", "partially intact", "deteriorating"],
            integrity: [25, 40, 60],
            status: ["offline", "failing", "minimal"],
            state: ["abandoned", "derelict", "compromised"]
          }
        }
      },
      {
        range: [9, 11],
        severity: "success",
        narrative: [
          "Complete structural analysis: {status}. {sections} sections accessible via {access}.",
          "Comprehensive scan complete. Station {age} with {condition}. Salvage potential: {value}.",
          "Full assessment obtained. Integrity at {percent}%. Safe docking points identified."
        ],
        effects: {
          data: {
            quality: "complete",
            status: ["stable derelict", "partially operational", "damaged but intact"],
            sections: [3, 5, 8],
            access: ["airlocks", "hull breaches", "docking ports"],
            salvage_value: ["low", "moderate", "high"]
          },
          salvage_sites: [2, 4]
        }
      },
      {
        range: [12, 14],
        severity: "critical_success",
        narrative: [
          "Exceptional scan! Station core intact - {discovery} still functional!",
          "Outstanding data! Located {valuable} in secure vault - appears accessible!",
          "Perfect analysis! Found {bonus} and mapped entire station layout!"
        ],
        effects: {
          data: {
            quality: "exceptional",
            complete_map: true,
            salvage_value: "very high"
          },
          loot: [
            { itemId: "station_data_core", quantity: 1, chance: 0.7 },
            { itemId: "advanced_component", quantity: [2, 4], chance: 0.8 }
          ],
          discovery: ["reactor core", "research data", "cargo hold", "medical supplies"],
          salvage_sites: [5, 8]
        }
      }
    ]
  },

  // ============================================================================
  // ANOMALY ACTIONS
  // ============================================================================

  anomaly_passive: {
    name: "Anomaly Passive Scan",
    description: "Long-range passive scan of anomaly",
    dice: "2d6",
    modifiers: [
      { source: "sensors", type: "shipSystem", bonus: 1 },
      { source: "science", type: "skill", bonus: 1 }
    ],
    outcomes: [
      {
        range: [2, 5],
        severity: "critical_failure",
        narrative: [
          "Anomaly emits unexpected energy pulse - sensors overloaded!",
          "Scan triggers anomalous reaction - shields under stress!",
          "Passive scan fails - anomaly appears to be {threat}!"
        ],
        effects: {
          damage: [
            { system: "sensors", amount: 10 },
            { type: "shields", amount: 15 }
          ],
          data: { quality: "failed", threat_level: "high" }
        }
      },
      {
        range: [6, 8],
        severity: "partial_success",
        narrative: [
          "Basic readings obtained: {type} anomaly, {energy} energy output.",
          "Preliminary data suggests {classification}. Origin unknown.",
          "Limited scan reveals {readings}. Further investigation advised with caution."
        ],
        effects: {
          data: {
            quality: "partial",
            type: ["spatial", "temporal", "energy", "exotic matter"],
            energy: ["low", "moderate", "high"],
            classification: ["natural", "artificial", "unknown"],
            threat_level: ["low", "moderate", "unknown"]
          }
        }
      },
      {
        range: [9, 11],
        severity: "success",
        narrative: [
          "Comprehensive passive scan: {anomaly_type} with {properties}.",
          "Detailed analysis complete. Anomaly classified as {classification} - {safety} to approach.",
          "Full passive data obtained. Anomaly exhibits {behavior} - {opportunity} detected."
        ],
        effects: {
          data: {
            quality: "complete",
            anomaly_type: ["wormhole fragment", "subspace rift", "dark matter concentration", "quantum fluctuation"],
            safety: ["safe", "risky", "dangerous"],
            opportunity: ["resource extraction possible", "scientific value", "navigational hazard"]
          },
          science: 50
        }
      },
      {
        range: [12, 14],
        severity: "critical_success",
        narrative: [
          "Extraordinary readings! Anomaly is {discovery} - unprecedented find!",
          "Perfect scan! Anomaly contains {resource} - extremely valuable!",
          "Outstanding data! Anomaly reveals {secret} - major discovery!"
        ],
        effects: {
          data: {
            quality: "exceptional",
            major_discovery: true
          },
          science: 100,
          discovery: ["stable wormhole", "exotic matter source", "precursor technology", "dimensional gateway"],
          loot: [
            { itemId: "exotic_particle", quantity: [1, 3], chance: 0.8 },
            { itemId: "anomaly_data", quantity: 1, chance: 1.0 }
          ]
        }
      }
    ]
  },

  // ============================================================================
  // DISTRESS BEACON ACTIONS  
  // ============================================================================

  distress_investigate: {
    name: "Investigate Distress Beacon",
    description: "Deploy to investigate distress signal source",
    dice: "2d6",
    modifiers: [
      { source: "eva_suit", type: "shipSystem", bonus: 1 },
      { source: "survival", type: "skill", bonus: 1 },
      { source: "distress_age", type: "environment", bonus: -1 }
    ],
    outcomes: [
      {
        range: [2, 5],
        severity: "critical_failure",
        narrative: [
          "Trap! Beacon was bait - {threat} ambush! Taking damage!",
          "Investigation goes wrong - {danger} encountered! Retreat!",
          "Beacon site is {hazard} - EVA team in danger!"
        ],
        effects: {
          damage: [
            { type: "hull", amount: 20 },
            { system: "eva_suit", amount: 15 }
          ],
          threat: ["pirate", "automated defense", "hostile creature"],
          danger: ["explosive decompression", "radiation leak", "structural collapse"],
          combat: true
        }
      },
      {
        range: [6, 8],
        severity: "partial_success",
        narrative: [
          "Found beacon source: {finding}. {condition} but salvageable.",
          "Investigation reveals {discovery}. Situation {status}.",
          "Beacon traced to {location}. Found {evidence} but no survivors."
        ],
        effects: {
          data: {
            finding: ["escape pod", "crashed shuttle", "damaged probe", "abandoned equipment"],
            condition: ["damaged", "deteriorated", "looted"],
            status: ["unclear", "suspicious", "tragic"]
          },
          loot: [
            { itemId: "salvage_component", quantity: [2, 4], chance: 0.7 },
            { itemId: "ship_log", quantity: 1, chance: 0.5 }
          ]
        }
      },
      {
        range: [9, 11],
        severity: "success",
        narrative: [
          "Successful investigation! Found {discovery} with {valuable}.",
          "Beacon source located: {finding}. Recovered {items} and {data}.",
          "Investigation complete. Discovered {result} - {salvage} retrieved."
        ],
        effects: {
          data: {
            finding: ["intact escape pod", "operational life raft", "emergency cache"],
            discovery: ["survivor evidence", "recent activity", "valuable cargo"]
          },
          loot: [
            { itemId: "emergency_supplies", quantity: [3, 6], chance: 0.9 },
            { itemId: "survival_gear", quantity: [2, 4], chance: 0.8 },
            { itemId: "data_chip", quantity: 1, chance: 0.6 },
            { itemId: "medical_supplies", quantity: [1, 3], chance: 0.5 }
          ]
        }
      },
      {
        range: [12, 14],
        severity: "critical_success",
        narrative: [
          "Survivors found! {count} people rescued - grateful and {reward}!",
          "Extraordinary find! Beacon led to {discovery} - jackpot!",
          "Perfect rescue! Found {survivors} plus {bonus}!"
        ],
        effects: {
          data: {
            survivors: [1, 2, 3],
            grateful: true
          },
          loot: [
            { itemId: "valuable_cargo", quantity: [2, 5], chance: 0.9 },
            { itemId: "medical_supplies", quantity: [5, 10], chance: 1.0 },
            { itemId: "rare_component", quantity: [1, 2], chance: 0.7 },
            { itemId: "credit_chip", quantity: 1, chance: 0.8 }
          ],
          discovery: ["intact ship wreck", "hidden cache", "research station"],
          reward: ["offering reward", "skilled specialist", "valuable intel"],
          reputation: 50
        }
      }
    ]
  }
};

export default poiActionTables;
