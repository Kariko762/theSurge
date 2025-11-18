// Graph helpers for galaxy/system connections
// All functions are pure and work on the existing galaxy object shape
// Systems keep connections in three arrays: forward, backward, cross (by id)

/** Build an adjacency map for systems in a galaxy.
 * @param {Object} galaxy - Galaxy with systems[]
 * @param {Object} [opts]
 * @param {boolean} [opts.directed=false] - If true, keep edge direction; else undirected
 * @returns {Map<string, Set<string>>} id -> neighbor ids
 */
export function buildSystemGraph(galaxy, opts = {}) {
  const { directed = false } = opts;
  const adj = new Map();
  if (!galaxy?.systems) return adj;

  for (const s of galaxy.systems) {
    if (!adj.has(s.id)) adj.set(s.id, new Set());
    const add = (from, to) => {
      if (!adj.has(from)) adj.set(from, new Set());
      adj.get(from).add(to);
    };

    // Forward edges
    for (const tid of s.connections?.forward || []) {
      add(s.id, tid);
      if (!directed) add(tid, s.id);
    }
    // Backward edges
    for (const tid of s.connections?.backward || []) {
      add(s.id, tid);
      if (!directed) add(tid, s.id);
    }
    // Cross edges (always bidirectional by construction, but keep option)
    for (const tid of s.connections?.cross || []) {
      add(s.id, tid);
      if (!directed) add(tid, s.id);
    }
  }
  return adj;
}

/** Get connections for a specific system id. */
export function getSystemConnections(galaxy, systemId) {
  const s = galaxy?.systems?.find(x => x.id === systemId);
  if (!s) return { forward: [], backward: [], cross: [], all: [] };
  const forward = [...(s.connections?.forward || [])];
  const backward = [...(s.connections?.backward || [])];
  const cross = [...(s.connections?.cross || [])];
  const all = Array.from(new Set([...forward, ...backward, ...cross]));
  return { forward, backward, cross, all };
}

/** BFS shortest path between two systems (by id). */
export function findSystemPathBFS(galaxy, startId, goalId, opts = {}) {
  const adj = buildSystemGraph(galaxy, { directed: false, ...opts });
  if (!adj.has(startId) || !adj.has(goalId)) return [];
  const q = [startId];
  const prev = new Map();
  const seen = new Set([startId]);

  while (q.length) {
    const u = q.shift();
    if (u === goalId) break;
    for (const v of adj.get(u) || []) {
      if (!seen.has(v)) {
        seen.add(v);
        prev.set(v, u);
        q.push(v);
      }
    }
  }

  if (!seen.has(goalId)) return [];
  const path = [];
  for (let at = goalId; at !== undefined; at = prev.get(at)) {
    path.push(at);
    if (at === startId) break;
  }
  path.reverse();
  return path;
}

/** Reachability report from HOMEBASE. */
export function getReachabilityFromHome(galaxy) {
  const home = galaxy?.systems?.find(s => s.id === 'HOMEBASE') || galaxy?.systems?.[0];
  const adj = buildSystemGraph(galaxy);
  const visited = new Set();
  if (home && adj.has(home.id)) {
    const q = [home.id];
    while (q.length) {
      const u = q.shift();
      if (visited.has(u)) continue;
      visited.add(u);
      for (const v of adj.get(u) || []) if (!visited.has(v)) q.push(v);
    }
  }
  const allIds = new Set((galaxy?.systems || []).map(s => s.id));
  const unreachable = [...allIds].filter(id => !visited.has(id));
  return { visited, unreachable };
}

/** Group systems by branchId if present. */
export function getBranchGroups(galaxy) {
  const groups = new Map();
  for (const s of galaxy.systems || []) {
    const key = s.branchId ?? 'unassigned';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s.id);
  }
  return groups;
}
