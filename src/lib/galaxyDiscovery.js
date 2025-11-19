/**
 * Dynamic Galaxy Discovery
 * Auto-discover galaxy JSON files without hardcoded imports
 */

/**
 * Get list of available galaxies from metadata
 * This is the runtime discovery function that can be extended
 */
export function discoverGalaxies() {
  // For now, return known galaxies
  // Future: could use dynamic import() or fetch() for user-uploaded files
  const knownGalaxies = [
    {
      id: 'helix_nebula',
      name: 'Helix Nebula',
      type: 'spiral',
      source: 'builtin',
      armCount: 5
    },
    {
      id: 'untitled_galaxy',
      name: 'Untitled Galaxy',
      type: 'custom',
      source: 'user-created',
      systemCount: null // Will be loaded dynamically
    }
  ];

  return knownGalaxies;
}

/**
 * Load galaxy by ID with dynamic import support
 * @param {string} galaxyId - Galaxy identifier
 * @returns {Promise<object>} Galaxy metadata and loader function
 */
export async function loadGalaxyDynamic(galaxyId) {
  // Map known galaxies to their file paths
  const galaxyPaths = {
    'helix_nebula': {
      arms: [
        '../data/helix_systems/helix_arm_1.json',
        '../data/helix_systems/helix_arm_2.json',
        '../data/helix_systems/helix_arm_3.json',
        '../data/helix_systems/helix_arm_4.json',
        '../data/helix_systems/helix_arm_5.json'
      ],
      metadata: {
        galaxyId: 'helix_nebula',
        galaxyName: 'Helix Nebula',
        type: 'spiral',
        centerX: 1000,
        centerY: 1000
      }
    },
    'untitled_galaxy': {
      arms: ['../data/helix_systems/untitled_galaxy.json'],
      metadata: {
        galaxyId: 'untitled_galaxy',
        galaxyName: 'Untitled Galaxy',
        type: 'custom',
        centerX: 1000,
        centerY: 1000
      }
    }
  };

  const config = galaxyPaths[galaxyId];
  if (!config) {
    throw new Error(`Galaxy ${galaxyId} not found in discovery registry`);
  }

  return {
    id: config.metadata.galaxyId,
    name: config.metadata.galaxyName,
    type: config.metadata.type,
    armPaths: config.arms,
    metadata: config.metadata,
    // Loader function that uses dynamic imports
    async load() {
      const allSystems = [];
      
      for (const path of config.arms) {
        try {
          // Dynamic import for ESM modules
          const armData = await import(path, { assert: { type: 'json' } });
          const data = armData.default;
          
          if (Array.isArray(data)) {
            allSystems.push(...data);
          } else if (data.systems) {
            allSystems.push(...data.systems);
          }
        } catch (error) {
          console.warn(`Failed to load arm ${path}:`, error.message);
        }
      }

      return {
        id: config.metadata.galaxyId,
        name: config.metadata.galaxyName,
        type: config.metadata.type,
        systems: allSystems,
        grids: []
      };
    }
  };
}

/**
 * Register a new user-created galaxy
 * This allows runtime registration without code changes
 * @param {object} galaxyInfo - Galaxy metadata and file path
 */
const userGalaxies = new Map();

export function registerUserGalaxy(galaxyInfo) {
  if (!galaxyInfo.id || !galaxyInfo.filePath) {
    throw new Error('Galaxy registration requires id and filePath');
  }

  userGalaxies.set(galaxyInfo.id, {
    id: galaxyInfo.id,
    name: galaxyInfo.name || galaxyInfo.id,
    type: galaxyInfo.type || 'custom',
    source: 'user-uploaded',
    filePath: galaxyInfo.filePath,
    metadata: galaxyInfo
  });

  console.log(`Registered user galaxy: ${galaxyInfo.id}`);
}

/**
 * Get all registered galaxies including user-created ones
 */
export function getAllGalaxies() {
  const builtin = discoverGalaxies();
  const user = Array.from(userGalaxies.values());
  
  return [...builtin, ...user];
}

/**
 * Check if a galaxy exists
 */
export function galaxyExists(galaxyId) {
  const all = getAllGalaxies();
  return all.some(g => g.id === galaxyId);
}
