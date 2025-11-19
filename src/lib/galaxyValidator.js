/**
 * Galaxy Connectivity Validator
 * Validates galaxy structure and connectivity
 */

/**
 * Validate galaxy connectivity and structure
 * @param {object} galaxy - Galaxy object with systems array
 * @returns {object} Validation report with errors, warnings, and stats
 */
export function validateGalaxy(galaxy) {
  const report = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      totalSystems: 0,
      reachableSystems: 0,
      orphanedSystems: [],
      homebaseFound: false,
      componentCount: 0,
      averageConnections: 0,
      maxDepth: 0
    }
  };

  if (!galaxy || !galaxy.systems) {
    report.valid = false;
    report.errors.push('Galaxy object missing or has no systems array');
    return report;
  }

  const systems = galaxy.systems;
  report.stats.totalSystems = systems.length;

  // Build ID lookup and validate system structure
  const systemMap = new Map();
  let totalConnections = 0;

  systems.forEach((sys, idx) => {
    // Check required fields
    if (!sys.id) {
      report.errors.push(`System at index ${idx} missing required 'id' field`);
      report.valid = false;
      return;
    }

    if (systemMap.has(sys.id)) {
      report.errors.push(`Duplicate system ID: ${sys.id}`);
      report.valid = false;
    }

    systemMap.set(sys.id, sys);

    // Validate connections structure
    if (!sys.connections) {
      report.warnings.push(`System ${sys.id} missing connections object`);
      sys.connections = { forward: [], backward: [], cross: [] };
    }

    const conn = sys.connections;
    if (!Array.isArray(conn.forward)) conn.forward = [];
    if (!Array.isArray(conn.backward)) conn.backward = [];
    if (!Array.isArray(conn.cross)) conn.cross = [];

    totalConnections += conn.forward.length + conn.backward.length + conn.cross.length;

    // Validate position
    if (!sys.position || typeof sys.position.x !== 'number' || typeof sys.position.y !== 'number') {
      report.warnings.push(`System ${sys.id} has invalid position`);
    }

    // Check for homebase
    if (sys.id === 'HOMEBASE' || sys.name === 'Homebase') {
      report.stats.homebaseFound = true;
    }
  });

  report.stats.averageConnections = systems.length > 0 
    ? (totalConnections / systems.length).toFixed(2) 
    : 0;

  // Validate connection references
  systems.forEach(sys => {
    const allConnections = [
      ...sys.connections.forward,
      ...sys.connections.backward,
      ...sys.connections.cross
    ];

    allConnections.forEach(targetId => {
      if (!systemMap.has(targetId)) {
        report.errors.push(`System ${sys.id} references non-existent system: ${targetId}`);
        report.valid = false;
      }
    });
  });

  // Find homebase or use first system
  let startSystem = systems.find(s => s.id === 'HOMEBASE' || s.name === 'Homebase');
  if (!startSystem && systems.length > 0) {
    startSystem = systems[0];
    report.warnings.push(`No HOMEBASE found; using ${startSystem.id} as start point for connectivity check`);
  }

  if (!startSystem) {
    report.errors.push('No systems available for connectivity analysis');
    report.valid = false;
    return report;
  }

  // BFS to find reachable systems and calculate max depth
  const visited = new Set();
  const depths = new Map();
  const queue = [{ id: startSystem.id, depth: 0 }];
  depths.set(startSystem.id, 0);
  let maxDepth = 0;

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    
    if (visited.has(id)) continue;
    visited.add(id);
    
    if (depth > maxDepth) maxDepth = depth;

    const sys = systemMap.get(id);
    if (!sys) continue;

    const neighbors = [
      ...sys.connections.forward,
      ...sys.connections.backward,
      ...sys.connections.cross
    ];

    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        if (!depths.has(neighborId)) {
          depths.set(neighborId, depth + 1);
        }
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    });
  }

  report.stats.reachableSystems = visited.size;
  report.stats.maxDepth = maxDepth;

  // Find orphaned systems
  systems.forEach(sys => {
    if (!visited.has(sys.id)) {
      report.stats.orphanedSystems.push(sys.id);
    }
  });

  if (report.stats.orphanedSystems.length > 0) {
    report.warnings.push(
      `${report.stats.orphanedSystems.length} orphaned system(s) unreachable from ${startSystem.id}`
    );
  }

  // Find connected components
  const componentMap = new Map();
  let componentId = 0;

  systems.forEach(sys => {
    if (componentMap.has(sys.id)) return;

    // BFS to find component
    const component = new Set();
    const q = [sys.id];

    while (q.length > 0) {
      const id = q.shift();
      if (component.has(id)) continue;
      component.add(id);
      componentMap.set(id, componentId);

      const s = systemMap.get(id);
      if (!s) continue;

      const neighbors = [
        ...s.connections.forward,
        ...s.connections.backward,
        ...s.connections.cross
      ];

      neighbors.forEach(nid => {
        if (!component.has(nid)) q.push(nid);
      });
    }

    componentId++;
  });

  report.stats.componentCount = componentId;

  if (componentId > 1) {
    report.warnings.push(`Galaxy has ${componentId} disconnected components`);
  }

  return report;
}

/**
 * Generate a human-readable report string
 */
export function formatValidationReport(report) {
  const lines = [];
  
  lines.push('=== GALAXY VALIDATION REPORT ===\n');
  
  if (report.errors.length > 0) {
    lines.push('ERRORS:');
    report.errors.forEach(err => lines.push(`  ✗ ${err}`));
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('WARNINGS:');
    report.warnings.forEach(warn => lines.push(`  ⚠ ${warn}`));
    lines.push('');
  }

  lines.push('STATISTICS:');
  lines.push(`  Total Systems: ${report.stats.totalSystems}`);
  lines.push(`  Reachable: ${report.stats.reachableSystems}`);
  lines.push(`  Orphaned: ${report.stats.orphanedSystems.length}`);
  lines.push(`  Connected Components: ${report.stats.componentCount}`);
  lines.push(`  Average Connections: ${report.stats.averageConnections}`);
  lines.push(`  Max Depth: ${report.stats.maxDepth}`);
  lines.push(`  Homebase: ${report.stats.homebaseFound ? 'Found' : 'Not Found'}`);

  if (report.stats.orphanedSystems.length > 0 && report.stats.orphanedSystems.length <= 10) {
    lines.push('\nOrphaned Systems:');
    report.stats.orphanedSystems.forEach(id => lines.push(`  - ${id}`));
  } else if (report.stats.orphanedSystems.length > 10) {
    lines.push(`\nOrphaned Systems: ${report.stats.orphanedSystems.slice(0, 10).join(', ')}... (${report.stats.orphanedSystems.length - 10} more)`);
  }

  lines.push('');
  lines.push(`STATUS: ${report.valid ? '✓ VALID' : '✗ INVALID'}`);

  return lines.join('\n');
}
