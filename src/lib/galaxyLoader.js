/**
 * Galaxy Loader
 * Loads galaxy data from static JSON files with spiral structure
 * Handles scanned attributes and dynamic POI generation
 */

import helixArm1 from '../data/helix_systems/helix_arm_1.json';
import helixArm2 from '../data/helix_systems/helix_arm_2.json';
import helixArm3 from '../data/helix_systems/helix_arm_3.json';
import helixArm4 from '../data/helix_systems/helix_arm_4.json';
import helixArm5 from '../data/helix_systems/helix_arm_5.json';
import { generateSystem } from './systemGenerator.js';

// Galaxy metadata
const GALAXY_METADATA = {
  'helix_nebula': {
    galaxyId: 'helix_nebula',
    galaxyName: 'Helix Nebula',
    type: 'spiral',
    centerX: 1000,
    centerY: 1000
  }
};

// Spiral arm files for multi-arm galaxies
const GALAXY_SYSTEM_ARMS = {
  'helix_nebula': [helixArm1, helixArm2, helixArm3, helixArm4, helixArm5]
};

/**
 * Load a galaxy from JSON
 * @param {string} galaxyId - Galaxy identifier
 * @param {object} shipState - Ship state to check for scanned systems
 * @returns {object} Galaxy data with processed systems
 */
export function loadGalaxy(galaxyId, shipState = null) {
  const metadata = GALAXY_METADATA[galaxyId];
  if (!metadata) {
    throw new Error(`Galaxy ${galaxyId} not found`);
  }

  // Merge systems from all arm files
  let allSystems = [];
  if (GALAXY_SYSTEM_ARMS[galaxyId]) {
    GALAXY_SYSTEM_ARMS[galaxyId].forEach(armData => {
      if (Array.isArray(armData)) {
        // If arm file is just an array of systems
        allSystems = allSystems.concat(armData);
      } else if (armData.systems) {
        // If arm file has a systems property
        allSystems = allSystems.concat(armData.systems);
      }
    });
  }

  // Build galaxy object
  const galaxy = {
    id: metadata.galaxyId,
    name: metadata.galaxyName,
    type: metadata.type,
    systems: allSystems.map(sys => {
      // If system has been scanned, populate scannedAttributes
      if (shipState && shipState.visitedSystems.includes(sys.id)) {
        if (!sys.scannedAttributes || !sys.scannedAttributes.scanned) {
          // Generate system data on first scan
          sys.scannedAttributes = generateScannedAttributes(sys);
        }
      }

      return sys;
    }),
    grids: [] // No grids in new system
  };

  return galaxy;
}

/**
 * Generate scanned attributes for a system
 * This is called when a system is scanned for the first time
 */
function generateScannedAttributes(system) {
  // For HOMEBASE, use the name from JSON
  if (system.id === 'HOMEBASE') {
    return {
      name: system.name,
      type: system.type,
      seed: system.seed,
      scanned: true,
      pois: null // Generated on visit
    };
  }

  // Use data from JSON
  return {
    name: system.name,
    type: system.type,
    seed: system.seed,
    scanned: true,
    pois: null // Generated on visit
  };
}

/**
 * Scan a system - marks it as scanned and generates attributes
 * @param {object} galaxy - Galaxy object
 * @param {string} systemId - System to scan
 * @param {object} shipState - Ship state manager
 * @returns {object} Updated system with scanned attributes
 */
export function scanSystem(galaxy, systemId, shipState) {
  const system = galaxy.systems.find(s => s.id === systemId);
  if (!system) return null;

  // Generate scanned attributes if not already scanned
  if (!system.scannedAttributes || !system.scannedAttributes.scanned) {
    system.scannedAttributes = generateScannedAttributes(system);
  }

  // Mark as visited in ship state
  if (shipState && !shipState.visitedSystems.includes(systemId)) {
    shipState.visitSystem(systemId);
  }

  return system;
}

/**
 * Generate POIs for a system (when player visits)
 * Uses the existing systemGenerator to create detailed POI data
 */
export function generateSystemPOIs(system) {
  if (!system.scannedAttributes || !system.scannedAttributes.seed) {
    return [];
  }

  const solarSystem = generateSystem(system.scannedAttributes.seed);
  
  // Extract POI list from generated system
  const pois = [
    ...solarSystem.orbits.map(orbit => ({
      id: `POI_${orbit.parent.id}`,
      name: orbit.parent.name,
      type: orbit.parent.type,
      distanceAU: orbit.distanceAU
    })),
    ...solarSystem.extras.map(extra => ({
      id: `POI_${extra.parent.id}`,
      name: extra.parent.name,
      type: extra.parent.type,
      distanceAU: extra.distanceAU
    }))
  ];

  // Update scanned attributes with POI data
  system.scannedAttributes.pois = pois;

  return pois;
}

/**
 * Get list of available galaxies
 */
export function getAvailableGalaxies() {
  return Object.keys(GALAXY_METADATA).map(id => {
    const metadata = GALAXY_METADATA[id];
    return {
      id: metadata.galaxyId,
      name: metadata.galaxyName
    };
  });
}
