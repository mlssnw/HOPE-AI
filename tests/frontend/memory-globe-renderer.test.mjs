import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryGlobeRenderer } from '../../frontend/js/memory-globe.js';
import { layoutGraph, normalizeGraph } from '../../frontend/js/memory-globe-core.js';

// WebGL is a browser boundary; retain scene/camera/event logic and inspect the
// vertex batches it submits, without pretending Node provides a GPU context.
function renderer(graph = {}) {
  const instance = Object.create(MemoryGlobeRenderer.prototype);
  const batches = [];
  Object.assign(instance, {
    canvas: { clientWidth: 900, clientHeight: 600, width: 900, height: 600 },
    gl: { POINTS: 0, LINES: 1, LINE_LOOP: 2, LINE_STRIP: 3, clearColor() {}, clear() {}, useProgram() {}, enable() {}, blendFuncSeparate() {}, uniform1f() {}, uniform2f() {} },
    locations: {}, quality: 'high', mode: 'orbital', selectedId: null,
    layout: layoutGraph(graph), graphSnapshot: normalizeGraph(graph),
    highlightedIds: new Set(), transitions: new Map(), particles: [],
    aiState: 'idle', reducedMotion: false, lastTime: 1000,
    camera: { yaw: -.35, pitch: -.13, zoom: 5.8, panX: 0, panY: 0 },
    projected: [], callbacks: {}, pointers: new Map(),
    resize() {}, drawItems(items, mode) { batches.push({ items, mode }); },
  });
  return { instance, batches };
}

globalThis.requestAnimationFrame = () => 1;
const memory = (id, importance = .5) => ({ id, content: id, importance, memory_type: 'fact' });

test('LOW never rotates the camera automatically', () => {
  const { instance } = renderer();
  instance.quality = 'low';
  instance.draw(6016);
  assert.equal(instance.camera.yaw, -.35);
});

test('hover and focus pause automatic rotation', () => {
  for (const field of ['pointerInside', 'canvasFocused']) {
    const { instance } = renderer();
    instance[field] = true;
    instance.draw(6016);
    assert.equal(instance.camera.yaw, -.35, field);
  }
});

test('reduced motion focuses a real node without automatic zoom', () => {
  const { instance } = renderer({ nodes: [memory('one')] });
  instance.reducedMotion = true;
  instance.focusOn('one');
  assert.equal(instance.camera.zoom, 5.8);
  assert.equal(instance.cameraTransition ?? null, null);
});

test('LOD keeps a selected low-importance item visible and pickable', () => {
  const nodes = Array.from({ length: 405 }, (_, i) => memory(`item-${i}`, 1));
  nodes.push(memory('selected', 0));
  const { instance } = renderer({ nodes });
  instance.quality = 'low'; instance.selectedId = 'selected';
  instance.draw(1016);
  assert.equal(instance.projected.length, 400);
  assert.ok(instance.projected.some(item => item.node.id === 'selected'));
  assert.equal(instance.graphSnapshot.nodes.length, 406);
});

test('empty graph does not render semantic category rings', () => {
  const { instance, batches } = renderer();
  instance.draw(1016);
  assert.equal(batches.filter(batch => batch.mode === instance.gl.LINE_LOOP).length, 0);
  assert.equal(instance.projected.length, 0);
});

test('new memories remain pickable at their final position immediately', () => {
  const { instance } = renderer();
  const now = performance.now();
  instance.applyGraphMutation({ nodes: [memory('new')] }, { type: 'MEMORY_CREATED', payload: { node: memory('new') } });
  instance.reducedMotion = true;
  instance.draw(now);
  const item = instance.projected.find(item => item.node.id === 'new');
  assert.ok(item);
  assert.ok(item.screen.size >= 8);
  assert.equal(instance.pick(item.screen.x, item.screen.y).id, 'new');
});

test('reduced motion produces a static core across successive frames', () => {
  const { instance, batches } = renderer();
  instance.reducedMotion = true;
  instance.aiState = 'thinking';
  instance.draw(1200);
  const first = structuredClone(batches);
  batches.length = 0;
  instance.draw(8200);
  assert.deepEqual(batches, first);
});

test('manual camera controls stay bounded and pause background movement', () => {
  const { instance } = renderer();
  instance.orbit(0, 50); instance.pan(100, -100); instance.zoomBy(100);
  assert.equal(instance.camera.pitch, 1.15);
  assert.equal(instance.camera.panX, .9);
  assert.equal(instance.camera.panY, -.8);
  assert.equal(instance.camera.zoom, 12);
  instance.zoomBy(.001);
  assert.equal(instance.camera.zoom, 3.2);
  instance.zoomBy(NaN);
  assert.equal(instance.camera.zoom, 3.2);
  const yaw = instance.camera.yaw;
  instance.draw(instance.lastInteraction + 100);
  assert.equal(instance.camera.yaw, yaw);
});

test('deleted memories become unpickable before their cosmetic fade completes', () => {
  const { instance } = renderer({ nodes: [memory('gone')] });
  instance.draw(1016);
  instance.applyGraphMutation({}, { type: 'MEMORY_DELETED', payload: { memory_id: 'gone' } });
  instance.draw(performance.now());
  assert.equal(instance.projected.length, 0);
  assert.equal(instance.layout.nodeMap.has('gone'), false);
});

test('inspector camera offset and picking share the same projected position', () => {
  const { instance } = renderer({ nodes: [memory('one')] });
  const center = { x: 0, y: 0, z: 0, size: 10 };
  assert.equal(instance.project(center).x, 450);
  instance.setInspectorOpen(true);
  assert.equal(instance.project(center).x, 272);
  instance.draw(1016);
  const projected = instance.projected[0];
  assert.equal(instance.pick(projected.screen.x, projected.screen.y).id, 'one');
});

test('opening the inspector brings an obscured selection into the available scene', () => {
  const { instance } = renderer({ nodes: [memory('one')] });
  Object.assign(instance.layout.nodeMap.get('one'), { x: 3, y: 0, z: 0 });
  instance.setSelected('one'); instance.setInspectorOpen(true);
  assert.ok(instance.cameraTransition);
  instance.draw(instance.cameraTransition.startedAt + 400);
  const selected = instance.projected[0];
  assert.ok(selected.screen.x > 24 && selected.screen.x < 520);
});

test('search highlights retain the surrounding graph for dim context', () => {
  const { instance } = renderer({nodes:[memory('match'),memory('context')]});
  instance.setHighlights(['match']);
  instance.draw(1016);
  assert.equal(instance.projected.length,2);
  assert.ok(instance.projected.find(item=>item.node.id==='context').node.color[3] < .5);
});

test('a real local listening signal reaches the core without accepting unknown states', () => {
  const {instance}=renderer();
  instance.setAiState('listening');
  assert.equal(instance.aiState,'listening');
  instance.setAiState('executing');
  assert.equal(instance.aiState,'idle');
});

test('creation travels from the core while the final memory is already pickable', () => {
  const {instance,batches}=renderer();
  instance.applyGraphMutation({nodes:[memory('created')]},{type:'MEMORY_CREATED',payload:{node:memory('created')}});
  const started=instance.transitions.get('created').startedAt;
  instance.draw(started);
  assert.ok(batches.some(batch=>batch.mode===instance.gl.POINTS&&batch.items.some(point=>point.size===4&&point.x===0&&point.y===0&&point.z===0)));
  const target=instance.projected.find(item=>item.node.id==='created');
  assert.equal(instance.pick(target.screen.x,target.screen.y).id,'created');
  batches.length=0;instance.draw(started+900);
  assert.equal(instance.transitions.size,0);
});
