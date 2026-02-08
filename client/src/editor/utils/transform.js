// ── Transform utilities for LockStep Scenario Editor ──

/* ──────────────── VALIDATION ──────────────── */

/**
 * Validate the graph can be deployed / exported.
 * Returns an array of human-readable error strings (empty = valid).
 */
export function validateGraph(nodes, edges) {
  const errors = [];

  if (nodes.length === 0) {
    errors.push('Canvas is empty — add at least one node.');
    return errors;
  }

  // Identify terminal nodes (endpoint_node or legacy win/fail)
  const endpointNodes = nodes.filter(n => n.type === 'endpoint_node');
  const winNodes   = nodes.filter(n => n.type === 'win_node' || (n.type === 'endpoint_node' && n.data.outcome === 'win'));
  const failNodes  = nodes.filter(n => n.type === 'fail_node' || (n.type === 'endpoint_node' && n.data.outcome === 'fail'));
  const startNodes = nodes.filter(n => n.type === 'start_node');

  if (winNodes.length === 0) {
    errors.push('Missing a Win endpoint — every scenario needs at least one good ending.');
  }
  if (startNodes.length === 0) {
    errors.push('Missing a Start node — every scenario needs exactly one start node.');
  } else if (startNodes.length > 1) {
    errors.push(`Multiple Start nodes found (${startNodes.map(n => n.data.id || n.id).join(', ')}). Only one is allowed.`);
  }

  // Check start / puzzle nodes have nextNodeId
  for (const n of nodes) {
    if (n.type === 'start_node' && !n.data.nextNodeId) {
      errors.push(`Start node "${n.data.id || n.id}" has no nextNodeId — connect it to the first puzzle or choice node.`);
    }
    if (n.type === 'puzzle_node' && !n.data.nextNodeId) {
      errors.push(`Puzzle node "${n.data.id || n.id}" has no nextNodeId — connect it to another node.`);
    }
    if (n.type === 'choice_node') {
      const choices = n.data.choices || [];
      if (choices.length === 0) {
        errors.push(`Choice node "${n.data.id || n.id}" has no choices.`);
      }
      for (const c of choices) {
        if (!c.nextNodeId) {
          errors.push(`Choice "${c.label || c.id}" in node "${n.data.id || n.id}" has no nextNodeId.`);
        }
      }
    }
  }

  // Check for orphan nodes (no edges at all — not source, not target — and not the only node)
  if (nodes.length > 1) {
    const connectedIds = new Set();
    for (const e of edges) { connectedIds.add(e.source); connectedIds.add(e.target); }
    for (const n of nodes) {
      if (!connectedIds.has(n.id)) {
        errors.push(`Node "${n.data.id || n.id}" is disconnected from the graph.`);
      }
    }
  }

  return errors;
}

/* ──────────────── EXPORT ──────────────── */

export function exportToMvpJson(nodes, edges, globalSettings = {}) {
  // Build a lookup to derive nextNodeId from edges for puzzle nodes
  const edgesBySource = {};
  for (const e of edges) {
    if (!edgesBySource[e.source]) edgesBySource[e.source] = [];
    edgesBySource[e.source].push(e.target);
  }

  // Determine start node (explicit start_node, or fallback to no-incoming)
  const startNode = nodes.find(n => n.type === 'start_node')
    || (() => { const tIds = new Set(edges.map(e => e.target)); return nodes.find(n => !tIds.has(n.id) && n.type !== 'win_node' && n.type !== 'fail_node'); })();

  const jsonNodes = nodes.map(n => {
    const base = {
      id:       n.data.id || n.id,
      type:     n.type,
      location: n.data.location || '',
      story:    n.data.story || { title: '', text: '', narrationText: '' },
    };

    if (n.type === 'start_node') {
      const edgeNext = edgesBySource[n.id]?.[0];
      return { ...base, nextNodeId: edgeNext || n.data.nextNodeId || '' };
    }
    if (n.type === 'puzzle_node') {
      // Prefer edge-derived nextNodeId, fallback to data
      const edgeNext = edgesBySource[n.id]?.[0];
      return {
        ...base,
        roleClues:  n.data.roleClues || [],
        puzzles:    n.data.puzzles   || [],
        autoEffects: n.data.autoEffects || undefined,
        nextNodeId: edgeNext || n.data.nextNodeId || '',
      };
    }
    if (n.type === 'choice_node') {
      return { ...base, choices: n.data.choices || [] };
    }
    // endpoint_node — export as win_node or fail_node based on outcome
    if (n.type === 'endpoint_node') {
      const outcome = n.data.outcome || 'win';
      return { ...base, type: outcome === 'win' ? 'win_node' : 'fail_node', mediaUrl: n.data.mediaUrl || '' };
    }
    // legacy win_node / fail_node — base + mediaUrl
    if (n.type === 'win_node' || n.type === 'fail_node') {
      return { ...base, mediaUrl: n.data.mediaUrl || '' };
    }
    return base;
  });

  // Build vars object from globalSettings.resources
  const vars = {};
  if (globalSettings?.resources && Array.isArray(globalSettings.resources)) {
    for (const res of globalSettings.resources) {
      vars[res.id] = res.initialValue || 0;
    }
  }
  // Add defaults if not present
  if (!vars.oxygen && !vars.water) {
    vars.oxygen = 100;
    vars.water = 0;
  }

  // Build fail conditions from resources
  const failConditions = [];
  if (globalSettings?.resources && Array.isArray(globalSettings.resources)) {
    for (const res of globalSettings.resources) {
      // Most resources fail when they hit 0 or below (like oxygen)
      // But water-like resources that increase might fail when >= 100
      if (res.continuousIncrease > 0) {
        failConditions.push({
          type: 'gte',
          var: res.id,
          value: 100,
          reason: `${res.label} reached critical levels!`
        });
      } else {
        failConditions.push({
          type: 'lte',
          var: res.id,
          value: 0,
          reason: `You ran out of ${res.label}!`
        });
      }
    }
  }

  // Add timer fail condition if timeLimit is set
  if (globalSettings?.timeLimit && globalSettings.timeLimit > 0) {
    failConditions.push({
      type: 'timerExpired',
      reason: 'You ran out of time!'
    });
  }

  return {
    version: '1.0',
    globalSettings: globalSettings || {},
    gameId: 'editor_export',
    roles: [
      { id: 'builder',     name: 'Builder',     tagline: 'Fixes systems and restores function.' },
      { id: 'pathfinder',  name: 'Pathfinder',  tagline: 'Navigates routes and commits team choices.' },
      { id: 'decoder',     name: 'Decoder',     tagline: 'Interprets clues, patterns, and logs.' },
      { id: 'coordinator', name: 'Coordinator', tagline: 'Manages risk, resources, and stabilization.' },
    ],
    scenarios: [{
      scenarioId:  'edited_scenario',
      title:       'Edited Scenario',
      description: 'Exported from LockStep Scenario Editor',
      globals: {
        vars: vars,
        failConditions: failConditions,
        timerSeconds: (globalSettings?.timeLimit || 0) * 60,
        resourceMetadata: globalSettings?.resources || []
      },
      startNodeId: startNode?.id || nodes[0]?.id || '',
      nodes: jsonNodes,
    }],
  };
}

/* ──────────────── IMPORT ──────────────── */

/**
 * Simple auto-layout: place nodes in topological layers.
 * Falls back to grid if cycle detected.
 */
function autoLayout(nodes, edges) {
  const NODE_W = 280;
  const NODE_H = 140;
  const GAP_X  = 100;
  const GAP_Y  = 60;

  const adjOut  = {};
  const inDeg   = {};
  const idSet   = new Set(nodes.map(n => n.id));

  for (const n of nodes) { adjOut[n.id] = []; inDeg[n.id] = 0; }
  for (const e of edges) {
    if (idSet.has(e.source) && idSet.has(e.target)) {
      adjOut[e.source].push(e.target);
      inDeg[e.target]++;
    }
  }

  // Kahn's topological sort into layers
  let queue = nodes.filter(n => inDeg[n.id] === 0).map(n => n.id);
  const layers = [];
  const visited = new Set();

  while (queue.length > 0) {
    layers.push([...queue]);
    queue.forEach(id => visited.add(id));
    const next = [];
    for (const id of queue) {
      for (const t of adjOut[id]) {
        inDeg[t]--;
        if (inDeg[t] === 0 && !visited.has(t)) next.push(t);
      }
    }
    queue = next;
  }

  // Any remaining nodes (cycles) go into a final layer
  const remaining = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
  if (remaining.length > 0) layers.push(remaining);

  // Assign positions
  const posMap = {};
  for (let col = 0; col < layers.length; col++) {
    const layer = layers[col];
    for (let row = 0; row < layer.length; row++) {
      posMap[layer[row]] = { x: 60 + col * (NODE_W + GAP_X), y: 60 + row * (NODE_H + GAP_Y) };
    }
  }

  return nodes.map(n => ({ ...n, position: posMap[n.id] || { x: 60, y: 60 } }));
}

export function importFromMvpJson(json) {
  const scenario = json.scenarios?.[0];
  if (!scenario) throw new Error('No scenario found');

  const rawNodes = scenario.nodes || [];

  const nodes = rawNodes.map(n => {
    // Convert legacy win_node/fail_node to endpoint_node
    let nodeType = n.type || 'puzzle_node';
    let extraData = {};
    if (nodeType === 'win_node') {
      nodeType = 'endpoint_node';
      extraData = { outcome: 'win' };
    } else if (nodeType === 'fail_node') {
      nodeType = 'endpoint_node';
      extraData = { outcome: 'fail' };
    }

    // Ensure puzzle nodes have puzzles array
    if (nodeType === 'puzzle_node') {
      if (!n.puzzles) extraData.puzzles = [];
      if (!n.roleClues) extraData.roleClues = [];
    }

    // Ensure choice nodes have choices array
    if (nodeType === 'choice_node') {
      if (!n.choices) extraData.choices = [];
    }

    // Ensure story object exists
    if (!n.story) {
      extraData.story = { title: '', text: '', narrationText: '' };
    }

    return {
      id:   n.id,
      type: nodeType,
      position: { x: 0, y: 0 }, // will be set by autoLayout
      data: { ...n, ...extraData, type: nodeType },
    };
  });

  const edges = [];
  for (const n of rawNodes) {
    if (n.type === 'start_node' && n.nextNodeId) {
      edges.push({ id: `e-${n.id}-${n.nextNodeId}`, source: n.id, target: n.nextNodeId, animated: true, markerEnd: { type: 'arrowclosed' }, style: { stroke: '#a855f7' } });
    }
    if ((n.type === 'puzzle_node' || !n.type) && n.nextNodeId) {
      edges.push({ id: `e-${n.id}-${n.nextNodeId}`, source: n.id, target: n.nextNodeId, animated: true, markerEnd: { type: 'arrowclosed' }, style: { stroke: '#3b82f6' } });
    }
    if (n.type === 'choice_node' && Array.isArray(n.choices)) {
      for (const c of n.choices) {
        if (c.nextNodeId) {
          edges.push({ id: `e-${n.id}-${c.nextNodeId}-${c.id}`, source: n.id, target: c.nextNodeId, animated: true, markerEnd: { type: 'arrowclosed' }, style: { stroke: '#f59e0b' } });
        }
      }
    }
  }

  const laidOut = autoLayout(nodes, edges);
  return { 
    nodes: laidOut, 
    edges,
    globalSettings: json.globalSettings || { timeLimit: 0, resources: [] }
  };
}
