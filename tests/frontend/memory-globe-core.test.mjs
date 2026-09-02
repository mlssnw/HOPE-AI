import test from "node:test";
import assert from "node:assert/strict";

import { layoutGraph, normalizeGraph, relatedNodes, visibleScene } from "../../frontend/js/memory-globe-core.js";

const graph = {
  nodes: [
    { id: "m1", content: "Prefere interfaces escuras", title: "Interface", memory_type: "preference", kind: "fact", category: "identity", importance: .9, access_count: 7 },
    { id: "m2", content: "Reunião amanhã", title: "Reunião", memory_type: "task", kind: "event", category: "temporal", importance: .7, access_count: 1 },
  ],
  edges: [{ id: "r1", source_memory_id: "m1", target_memory_id: "m2", relation_type: "related_to", weight: .6 }],
  entities: [{ id: "e1", name: "HOPE AI", entity_type: "technology", attributes: {}, created_at: "2026-01-01", updated_at: "2026-01-01" }],
  entity_links: [{ memory_id: "m1", entity_id: "e1", role: "mentioned_in", confidence: .9 }],
};

test("layout usa somente nós e relações persistidos", () => {
  const layout = layoutGraph(graph);
  assert.deepEqual(layout.memories.map(node => node.id), ["m1", "m2"]);
  assert.deepEqual(layout.entities.map(node => node.id), ["e1"]);
  assert.equal(layout.connections.length, 2);
  assert.equal(layout.nodeMap.has("decorative-node"), false);
  assert.ok(layout.nodes.every(node => Number.isFinite(node.x) && Number.isFinite(node.z)));
});

test("normalização remove relações órfãs e entradas inválidas", () => {
  const normalized = normalizeGraph({ ...graph, edges: [...graph.edges, { source_memory_id: "missing", target_memory_id: "m1" }], nodes: [...graph.nodes, { id: "broken" }] });
  assert.equal(normalized.nodes.length, 2);
  assert.equal(normalized.edges.length, 1);
});

test("níveis orbital, cluster e memória preservam significado", () => {
  const layout = layoutGraph(graph);
  assert.equal(visibleScene(layout, "orbital").nodes.length, 2);
  assert.equal(visibleScene(layout, "cluster").nodes.length, 3);
  const focused = visibleScene(layout, "memory", "m1");
  assert.deepEqual(new Set(focused.nodes.map(node => node.id)), new Set(["m1", "m2", "e1"]));
  assert.deepEqual(new Set(relatedNodes(layout, "m1").map(node => node.id)), new Set(["m2", "e1"]));
});

test("busca filtra a cena sem inventar resultados", () => {
  const layout = layoutGraph(graph);
  const filtered = visibleScene(layout, "orbital", null, new Set(["m2"]));
  assert.deepEqual(filtered.nodes.map(node => node.id), ["m2"]);
  assert.equal(filtered.connections.length, 0);
});
