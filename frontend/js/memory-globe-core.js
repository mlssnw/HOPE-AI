export const RING_ORDER = ["identity", "temporal", "knowledge", "context", "applications", "long_term"];

export const RING_LABELS = {
  identity: "Identidade", temporal: "Temporal", knowledge: "Conhecimento",
  context: "Contexto", applications: "Aplicações", long_term: "Longo prazo",
};

const TYPE_TO_RING = {
  preference: "identity", relationship: "identity", episode: "temporal", task: "temporal",
  knowledge: "knowledge", fact: "knowledge", goal: "context", decision: "context",
  project: "context", person: "identity", system: "applications", temporal: "temporal",
  context: "context", integration: "applications",
};

const COLORS = {
  fact: [1, .69, .20, .96], event: [1, .86, .50, .98], inference: [.92, .72, .42, .72],
  entity: [.96, .91, .74, .92], selected: [1, .98, .82, 1], dim: [.42, .28, .10, .16],
};

export const REALTIME_EVENT_TYPES = new Set([
  "MEMORY_CREATED", "MEMORY_UPDATED", "MEMORY_DELETED",
  "MEMORY_RELATION_CREATED", "MEMORY_RELATION_DELETED", "AI_STATE_CHANGED",
]);

export function normalizeAiState(state) {
  return ["thinking", "searching", "speaking", "error"].includes(state) ? state : "idle";
}

export function aiStateLabel(state) {
  return {
    thinking: "HOPE processando…",
    searching: "Consultando memórias…",
    speaking: "HOPE falando…",
    error: "Falha temporária",
  }[state] || "Tempo real conectado";
}

export function hashUnit(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function finite(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function ringFor(memory) {
  const category = String(memory.category || "").toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  return RING_ORDER.includes(category) ? category : TYPE_TO_RING[memory.memory_type] || "long_term";
}

export function normalizeGraph(payload) {
  const graph = payload && typeof payload === "object" ? payload : {};
  const nodes = Array.isArray(graph.nodes) ? graph.nodes.filter(node => node && typeof node.id === "string" && typeof node.content === "string") : [];
  const ids = new Set(nodes.map(node => node.id));
  const entities = Array.isArray(graph.entities) ? graph.entities.filter(entity => entity && typeof entity.id === "string" && typeof entity.name === "string") : [];
  const entityIds = new Set(entities.map(entity => entity.id));
  const edges = Array.isArray(graph.edges) ? graph.edges.filter(edge => ids.has(edge?.source_memory_id) && ids.has(edge?.target_memory_id)) : [];
  const entityLinks = Array.isArray(graph.entity_links) ? graph.entity_links.filter(link => ids.has(link?.memory_id) && entityIds.has(link?.entity_id)) : [];
  return { nodes, edges, entities, entity_links: entityLinks };
}

function upsert(items, item, keyFor) {
  if (!item || typeof item !== "object") return items;
  const key = keyFor(item); if (!key) return items;
  const index = items.findIndex(existing => keyFor(existing) === key);
  if (index < 0) return [...items, item];
  const next = [...items]; next[index] = item; return next;
}

export function applyGraphEvent(payload, event) {
  const graph = normalizeGraph(payload);
  if (!event || !REALTIME_EVENT_TYPES.has(event.type)) return graph;
  const detail = event.payload && typeof event.payload === "object" ? event.payload : {};
  const next = {
    nodes: [...graph.nodes], edges: [...graph.edges], entities: [...graph.entities],
    entity_links: [...graph.entity_links],
  };

  if (["MEMORY_CREATED", "MEMORY_UPDATED"].includes(event.type)) {
    next.nodes = upsert(next.nodes, detail.node, item => item.id);
    for (const edge of Array.isArray(detail.edges) ? detail.edges : []) {
      next.edges = upsert(next.edges, edge, item => item.id);
    }
    for (const entity of Array.isArray(detail.entities) ? detail.entities : []) {
      next.entities = upsert(next.entities, entity, item => item.id);
    }
    for (const link of Array.isArray(detail.entity_links) ? detail.entity_links : []) {
      next.entity_links = upsert(
        next.entity_links,
        link,
        item => `${item.memory_id}:${item.entity_id}:${item.role || "mentioned_in"}`,
      );
    }
  }

  if (event.type === "MEMORY_DELETED" && typeof detail.memory_id === "string") {
    next.nodes = next.nodes.filter(node => node.id !== detail.memory_id);
    next.edges = next.edges.filter(edge => edge.source_memory_id !== detail.memory_id && edge.target_memory_id !== detail.memory_id);
    next.entity_links = next.entity_links.filter(link => link.memory_id !== detail.memory_id);
  }

  if (event.type === "MEMORY_RELATION_CREATED") {
    next.edges = upsert(next.edges, detail.edge, item => item.id);
  }

  if (event.type === "MEMORY_RELATION_DELETED" && typeof detail.relation_id === "string") {
    next.edges = next.edges.filter(edge => edge.id !== detail.relation_id);
  }

  return normalizeGraph(next);
}

export function layoutGraph(payload) {
  const graph = normalizeGraph(payload);
  const memories = graph.nodes.map(memory => {
    const ring = ringFor(memory); const ringIndex = RING_ORDER.indexOf(ring);
    const importance = Math.max(0, Math.min(1, finite(memory.importance, .5)));
    const access = Math.max(0, finite(memory.access_count));
    const angle = hashUnit(memory.id) * Math.PI * 2;
    const wobble = (hashUnit(`${memory.id}:w`) - .5) * .48;
    const radius = 1.22 + ringIndex * .52 - importance * .20 + wobble;
    const tilt = (ringIndex % 2 ? -.22 : .19) + (hashUnit(`${memory.id}:t`) - .5) * .18;
    return {
      id: memory.id, source: "memory", data: memory, ring, ringIndex,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius * Math.sin(.38 + tilt) + (hashUnit(`${memory.id}:y`) - .5) * .46,
      z: Math.sin(angle) * radius * Math.cos(.38 + tilt),
      size: 8 + importance * 13 + Math.min(6, Math.log2(access + 1) * 1.5),
      color: COLORS[memory.kind] || COLORS.fact,
      importance,
    };
  });
  const memoryMap = new Map(memories.map(node => [node.id, node]));
  const linksByEntity = new Map();
  for (const link of graph.entity_links) {
    if (!linksByEntity.has(link.entity_id)) linksByEntity.set(link.entity_id, []);
    linksByEntity.get(link.entity_id).push(link.memory_id);
  }
  const entities = graph.entities.map(entity => {
    const linked = (linksByEntity.get(entity.id) || []).map(id => memoryMap.get(id)).filter(Boolean);
    const seed = hashUnit(entity.id) * Math.PI * 2;
    const center = linked.length ? linked.reduce((sum, node) => ({ x: sum.x + node.x, y: sum.y + node.y, z: sum.z + node.z }), { x: 0, y: 0, z: 0 }) : { x: Math.cos(seed) * 2.1, y: (hashUnit(`${entity.id}:y`) - .5), z: Math.sin(seed) * 2.1 };
    const count = Math.max(1, linked.length);
    return {
      id: entity.id, source: "entity", data: entity, ring: "entities", ringIndex: -1,
      x: center.x / count, y: center.y / count + .16, z: center.z / count,
      size: 11 + Math.min(12, linked.length * 1.8), color: COLORS.entity,
      importance: Math.min(1, .45 + linked.length * .08),
    };
  });
  const nodeMap = new Map([...memories, ...entities].map(node => [node.id, node]));
  const connections = [
    ...graph.edges.map(edge => ({ id: edge.id || `${edge.source_memory_id}:${edge.target_memory_id}`, source: edge.source_memory_id, target: edge.target_memory_id, type: edge.relation_type, weight: finite(edge.weight, .5) })),
    ...graph.entity_links.map(link => ({ id: `${link.memory_id}:${link.entity_id}`, source: link.memory_id, target: link.entity_id, type: link.role || "mentioned_in", weight: finite(link.confidence, .7) })),
  ].filter(edge => nodeMap.has(edge.source) && nodeMap.has(edge.target));
  return { graph, memories, entities, nodes: [...memories, ...entities], nodeMap, connections };
}

export function visibleScene(layout, mode = "orbital", selectedId = null, highlightedIds = new Set()) {
  let allowed = new Set(layout.memories.map(node => node.id));
  if (mode === "cluster") allowed = new Set(layout.nodes.map(node => node.id));
  if (mode === "memory" && selectedId && layout.nodeMap.has(selectedId)) {
    allowed = new Set([selectedId]);
    layout.connections.forEach(edge => {
      if (edge.source === selectedId) allowed.add(edge.target);
      if (edge.target === selectedId) allowed.add(edge.source);
    });
  }
  if (highlightedIds.size) allowed = new Set([...allowed].filter(id => highlightedIds.has(id) || id === selectedId));
  return {
    nodes: layout.nodes.filter(node => allowed.has(node.id)),
    connections: layout.connections.filter(edge => allowed.has(edge.source) && allowed.has(edge.target)),
  };
}

export function colorFor(node, { selected = false, dimmed = false } = {}) {
  if (selected) return COLORS.selected;
  if (dimmed) return COLORS.dim;
  return node.color;
}

export function relatedNodes(layout, selectedId) {
  const related = new Set();
  layout.connections.forEach(edge => {
    if (edge.source === selectedId) related.add(edge.target);
    if (edge.target === selectedId) related.add(edge.source);
  });
  return [...related].map(id => layout.nodeMap.get(id)).filter(Boolean);
}
