import { layoutGraph, normalizeAiState, normalizeGraph, relatedNodes, RING_ORDER, visibleScene } from "./memory-globe-core.js";

const QUALITY = {
  low: { particles: 90, nodes: 400, segments: 48, dpr: 1 },
  medium: { particles: 220, nodes: 1000, segments: 72, dpr: 1.5 },
  high: { particles: 480, nodes: 2500, segments: 96, dpr: 2 },
  ultra: { particles: 900, nodes: 6000, segments: 128, dpr: 2 },
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const DEFAULT_CAMERA = { yaw: -.35, pitch: -.13, zoom: 5.8, panX: 0, panY: 0 };

const VERTEX_SHADER = `
attribute vec3 a_position;
attribute vec4 a_color;
attribute float a_size;
attribute float a_shape;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_zoom;
uniform vec2 u_pan;
uniform vec2 u_viewport;
uniform float u_pixel_ratio;
varying vec4 v_color;
varying float v_shape;
void main() {
  float cy = cos(u_yaw), sy = sin(u_yaw);
  vec3 p = vec3(cy * a_position.x + sy * a_position.z, a_position.y, -sy * a_position.x + cy * a_position.z);
  float cp = cos(u_pitch), sp = sin(u_pitch);
  p = vec3(p.x, cp * p.y - sp * p.z, sp * p.y + cp * p.z);
  float depth = max(1.2, u_zoom - p.z);
  vec2 ndc = p.xy * (2.55 / depth) + u_pan;
  ndc.x *= u_viewport.y / max(1.0, u_viewport.x);
  gl_Position = vec4(ndc, clamp((depth - 5.0) / 8.0, -0.9, 0.9), 1.0);
  gl_PointSize = a_size * clamp(7.0 / depth, 0.55, 1.9) * u_pixel_ratio;
  v_color = a_color;
  v_shape = a_shape;
}`;

const FRAGMENT_SHADER = `
precision mediump float;
uniform bool u_points;
varying vec4 v_color;
varying float v_shape;
void main() {
  if (!u_points) { gl_FragColor = v_color; return; }
  vec2 point = gl_PointCoord - vec2(0.5);
  float distanceToCenter = v_shape > 0.5 && v_shape < 1.5
    ? abs(point.x) + abs(point.y)
    : length(point);
  float edge = v_shape > 0.5 && v_shape < 1.5 ? 0.48 : 0.5;
  float alpha = 1.0 - smoothstep(edge * 0.18, edge, distanceToCenter);
  float core = 1.0 - smoothstep(0.0, edge * 0.46, distanceToCenter);
  if (v_shape > 3.5) {
    alpha = 1.0 - smoothstep(0.018, 0.05, abs(length(point) - 0.39));
    core = 0.0;
  } else if (v_shape > 1.5 && v_shape < 2.5) {
    vec2 p = point * vec2(1.03, 0.88);
    float contour = length(p) * (1.0 + 0.12 * sin(atan(p.y, p.x) * 3.0 + 0.9));
    alpha = pow(max(0.0, 1.0 - contour * 2.0), 2.4);
    core = 0.0;
  }
  gl_FragColor = vec4(v_color.rgb + core * vec3(0.20, 0.17, 0.11), v_color.a * alpha);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

function createProgram(gl) {
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

function particleCloud(count) {
  const points = [];
  for (let index = 0; index < count; index += 1) {
    const u = (index * .61803398875) % 1;
    const v = (index * .754877666 + .17) % 1;
    const angle = u * Math.PI * 2; const radius = index % 3 ? .34 + v * .56 : 1.3 + v * 2.8;
    points.push({
      x: Math.cos(angle) * radius,
      y: (v - .5) * radius * .9,
      z: Math.sin(angle) * radius,
      size: .7 + v * .9,
      color: [1, .61 + v * .16, .23, index % 3 ? .12 + v * .18 : .08], shape: 3,
    });
  }
  return points;
}

export class MemoryGlobeRenderer {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas; this.callbacks = callbacks;
    this.gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!this.gl) throw new Error("WebGL não está disponível neste navegador.");
    this.program = createProgram(this.gl); this.layout = layoutGraph({});
    this.mode = "orbital"; this.quality = "high"; this.selectedId = null;
    this.highlightedIds = new Set(); this.hoveredId = null; this.drag = null;
    this.graphSnapshot = normalizeGraph({}); this.transitions = new Map(); this.aiState = "idle";
    this.camera = { ...DEFAULT_CAMERA }; this.cameraTransition = null;
    this.motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
    this.reducedMotion = this.motionPreference.matches; this.lastInteraction = 0; this.pointers = new Map();
    this.lastTime = 0; this.projected = []; this.particles = particleCloud(QUALITY.high.particles);
    this.locations = Object.fromEntries(["yaw", "pitch", "zoom", "pan", "viewport", "pixel_ratio", "points"].map(name => [name, this.gl.getUniformLocation(this.program, `u_${name}`)]));
    this.attributes = Object.fromEntries(["position", "color", "size", "shape"].map(name => [name, this.gl.getAttribLocation(this.program, `a_${name}`)]));
    this.buffers = Object.fromEntries(["position", "color", "size", "shape"].map(name => [name, this.gl.createBuffer()]));
    this.bind(); this.resize(); this.frame = requestAnimationFrame(time => this.draw(time));
  }

  interact() { this.lastInteraction = performance.now(); this.cameraTransition = null; }
  orbit(dx, dy) { this.interact(); this.camera.yaw += dx; this.camera.pitch = clamp(this.camera.pitch + dy, -1.15, 1.15); }
  pan(dx, dy) { this.interact(); this.camera.panX = clamp(this.camera.panX + dx, -.9, .9); this.camera.panY = clamp(this.camera.panY + dy, -.8, .8); }
  zoomBy(factor) { if (!Number.isFinite(factor) || factor <= 0) return; this.interact(); this.camera.zoom = clamp(this.camera.zoom * factor, 3.2, 12); }
  setReducedMotion(value) { this.reducedMotion = Boolean(value); this.cameraTransition = null; this.transitions.clear(); }
  setInspectorOpen(value) {
    this.inspectorOpen = Boolean(value); this.interact();
    const node = this.layout.nodeMap.get(this.selectedId);
    if (!this.inspectorOpen || !node || this.canvas.clientWidth < 560) return;
    const screen = this.project(node);
    const available = this.canvas.clientWidth - Math.min(356, this.canvas.clientWidth * .46);
    if (screen.x < 24 || screen.x > available - 24 || screen.y < 24 || screen.y > this.canvas.clientHeight - 24) this.focusOn(node.id);
  }

  bind() {
    this.resizeListener = () => this.resize();
    this.motionListener = event => this.setReducedMotion(event.matches);
    addEventListener("resize", this.resizeListener);
    this.motionPreference.addEventListener("change", this.motionListener);
    this.canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault(); this.contextLost = true; cancelAnimationFrame(this.frame);
      this.callbacks.onContextLost?.();
    });
    this.canvas.addEventListener("contextmenu", event => event.preventDefault());
    this.canvas.addEventListener("pointerenter", () => { this.pointerInside = true; });
    this.canvas.addEventListener("focus", () => { this.canvasFocused = true; });
    this.canvas.addEventListener("blur", () => { this.canvasFocused = false; this.interact(); });
    this.canvas.addEventListener("pointerdown", event => {
      this.interact(); this.canvas.setPointerCapture(event.pointerId);
      this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.drag = { x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 2, moved: this.pointers.size > 1 };
    });
    this.canvas.addEventListener("pointermove", event => {
      if (this.drag && this.pointers.has(event.pointerId)) {
        const before = [...this.pointers.values()];
        this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
        const after = [...this.pointers.values()];
        if (after.length > 1) {
          const distance = points => Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
          this.zoomBy(Math.max(1, distance(before)) / Math.max(1, distance(after)));
          this.pan((after[0].x + after[1].x - before[0].x - before[1].x) / this.canvas.clientHeight,
            -(after[0].y + after[1].y - before[0].y - before[1].y) / this.canvas.clientHeight);
          this.drag.moved = true;
        } else {
          const dx = event.clientX - this.drag.x; const dy = event.clientY - this.drag.y;
          this.drag.moved ||= Math.abs(dx) + Math.abs(dy) > 2;
          if (this.drag.pan) this.pan(dx / this.canvas.clientHeight * 2, -dy / this.canvas.clientHeight * 2);
          else this.orbit(dx * .006, dy * .005);
        }
        this.drag.x = event.clientX; this.drag.y = event.clientY;
        return;
      }
      const node = this.pick(event.offsetX, event.offsetY);
      if (node?.id !== this.hoveredId) { this.hoveredId = node?.id || null; this.callbacks.onHover?.(node, event); }
    });
    const release = (event, cancelled = false) => {
      const moved = this.drag?.moved; this.pointers.delete(event.pointerId);
      this.drag = this.pointers.size ? { ...this.drag, ...this.pointers.values().next().value, moved: true } : null;
      this.interact();
      if (!cancelled && !moved) this.callbacks.onSelect?.(this.pick(event.offsetX, event.offsetY));
    };
    this.canvas.addEventListener("pointerup", event => release(event));
    this.canvas.addEventListener("pointercancel", event => release(event, true));
    this.canvas.addEventListener("pointerleave", () => { this.pointerInside = false; this.hoveredId = null; this.callbacks.onHover?.(null); });
    this.canvas.addEventListener("dblclick", event => { const node = this.pick(event.offsetX, event.offsetY); if (node) this.focusOn(node.id); });
    this.canvas.addEventListener("wheel", event => { event.preventDefault(); this.zoomBy(Math.exp(clamp(event.deltaY, -300, 300) * .001)); }, { passive: false });
    this.canvas.addEventListener("keydown", event => {
      const actions = { ArrowLeft: [-.12, 0], ArrowRight: [.12, 0], ArrowUp: [0, -.10], ArrowDown: [0, .10] };
      if (actions[event.key]) { event.preventDefault(); this.orbit(...actions[event.key]); }
      if (["+", "="].includes(event.key)) { event.preventDefault(); this.zoomBy(.92); }
      if (event.key === "-") { event.preventDefault(); this.zoomBy(1.08); }
      if (event.key === "Enter") {
        event.preventDefault();
        const node = this.layout.nodeMap.get(this.hoveredId || this.selectedId) || this.projected[0]?.node;
        if (node) this.callbacks.onSelect?.(node);
      }
      // Escape is coordinated by the controller, which owns overlay order.
    });
  }

  resize() {
    if (this.contextLost || this.disposed) return;
    const ratio = Math.min(devicePixelRatio || 1, QUALITY[this.quality].dpr);
    const width = Math.max(1, this.canvas.clientWidth); const height = Math.max(1, this.canvas.clientHeight);
    if (this.canvas.width !== Math.round(width * ratio) || this.canvas.height !== Math.round(height * ratio)) {
      this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio);
    }
    this.ratio = ratio; this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  dispose() {
    this.disposed = true; cancelAnimationFrame(this.frame);
    removeEventListener("resize", this.resizeListener);
    this.motionPreference.removeEventListener("change", this.motionListener);
    if (!this.contextLost) {
      Object.values(this.buffers).forEach(buffer => this.gl.deleteBuffer(buffer));
      this.gl.deleteProgram(this.program);
    }
  }

  setGraph(graph) {
    this.graphSnapshot = normalizeGraph(graph); this.layout = layoutGraph(this.graphSnapshot);
    this.transitions.clear(); this.sceneCache = null;
  }
  applyGraphMutation(graph, event) {
    const memoryId = event?.payload?.memory_id || event?.payload?.node?.id;
    const deleted = event?.type === "MEMORY_DELETED" ? this.layout.nodeMap.get(memoryId) : null;
    const removedEdges = deleted ? this.layout.connections.filter(edge => edge.source === memoryId || edge.target === memoryId)
      .map(edge => [this.layout.nodeMap.get(edge.source), this.layout.nodeMap.get(edge.target)]) : [];
    this.graphSnapshot = normalizeGraph(graph); this.layout = layoutGraph(this.graphSnapshot); this.sceneCache = null;
    // A removed memory leaves interaction immediately; only a cosmetic afterimage remains.
    if (this.reducedMotion) { this.transitions.clear(); return; }
    const kind = { MEMORY_CREATED: "birth", MEMORY_UPDATED: "update", MEMORY_DELETED: "delete" }[event?.type];
    if (kind && memoryId) this.transitions.set(memoryId, {
      kind, node: deleted, removedEdges, startedAt: performance.now(), duration: kind === "birth" ? 720 : kind === "delete" ? 460 : 520,
    });
  }
  setAiState(state) { this.aiState = state === "listening" ? state : normalizeAiState(state); }
  setMode(mode) { this.mode = ["orbital", "cluster", "memory"].includes(mode) ? mode : "orbital"; this.sceneCache = null; this.interact(); }
  setSelected(id) { this.selectedId = this.layout.nodeMap.has(id) ? id : null; if (!this.selectedId && this.mode === "memory") this.mode = "orbital"; this.sceneCache = null; }
  setHighlights(ids) { this.highlightedIds = new Set(ids || []); this.sceneCache = null; }
  setQuality(value) { this.quality = QUALITY[value] ? value : "high"; this.particles = particleCloud(QUALITY[this.quality].particles); this.sceneCache = null; this.ringCache = null; this.resize(); }
  resetCamera() { this.interact(); Object.assign(this.camera, DEFAULT_CAMERA); }
  focusOn(id) {
    const node = this.layout.nodeMap.get(id); if (!node) return;
    this.interact();
    const target = { yaw: -Math.atan2(node.x, node.z || .001), pitch: clamp(Math.atan2(node.y, Math.hypot(node.x, node.z)), -.8, .8),
      zoom: this.reducedMotion ? this.camera.zoom : 4.8, panX: 0, panY: 0 };
    target.yaw = this.camera.yaw + Math.atan2(Math.sin(target.yaw - this.camera.yaw), Math.cos(target.yaw - this.camera.yaw));
    if (this.reducedMotion) Object.assign(this.camera, target);
    else this.cameraTransition = { from: { ...this.camera }, to: target, startedAt: performance.now(), duration: 400 };
  }

  viewPan() {
    const width = Math.max(1, this.canvas.clientWidth), height = Math.max(1, this.canvas.clientHeight);
    // Desktop inspector occupies the right 340px; mobile bottom sheet uses DOM layout.
    const offset = this.inspectorOpen && width >= 560 ? Math.min(356, width * .46) / height : 0;
    return { x: this.camera.panX - offset, y: this.camera.panY };
  }

  project(node) {
    const { yaw, pitch, zoom } = this.camera; const pan = this.viewPan();
    const cy = Math.cos(yaw), sy = Math.sin(yaw); const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rx = cy * node.x + sy * node.z; const rz = -sy * node.x + cy * node.z;
    const ry = cp * node.y - sp * rz; const z = sp * node.y + cp * rz;
    const depth = Math.max(1.2, zoom - z); const aspect = this.canvas.clientHeight / this.canvas.clientWidth;
    const ndcX = (rx * 2.55 / depth + pan.x) * aspect; const ndcY = ry * 2.55 / depth + pan.y;
    return { x: (ndcX * .5 + .5) * this.canvas.clientWidth, y: (1 - (ndcY * .5 + .5)) * this.canvas.clientHeight, depth, size: node.size * Math.max(.55, Math.min(1.9, 7 / depth)) };
  }

  pick(x, y) {
    let best = null; let distance = Infinity;
    for (const item of this.projected) {
      const candidate = Math.hypot(item.screen.x - x, item.screen.y - y);
      if (candidate <= Math.max(10, item.screen.size * .65) && candidate < distance) { best = item.node; distance = candidate; }
    }
    return best;
  }

  upload(attribute, values, size) {
    const gl = this.gl; gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[attribute]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.attributes[attribute]); gl.vertexAttribPointer(this.attributes[attribute], size, gl.FLOAT, false, 0, 0);
  }

  drawItems(items, mode, pointMode = false) {
    if (!items.length) return;
    const positions = []; const colors = []; const sizes = []; const shapes = [];
    for (const item of items) {
      positions.push(item.x, item.y, item.z); colors.push(...item.color);
      sizes.push(item.size || 1); shapes.push(item.shape || 0);
    }
    this.upload("position", positions, 3); this.upload("color", colors, 4);
    this.upload("size", sizes, 1); this.upload("shape", shapes, 1);
    this.gl.uniform1i(this.locations.points, pointMode ? 1 : 0);
    this.gl.drawArrays(mode, 0, items.length);
  }

  ring(index) {
    this.ringCache ||= new Map();
    if (!this.ringCache.has(index)) {
      const points = []; const segments = QUALITY[this.quality].segments;
      const radius = 1.22 + index * .52; const tilt = index % 2 ? -.22 : .19;
      for (let step = 0; step < segments; step += 1) {
        const angle = step / segments * Math.PI * 2;
        points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * Math.sin(.38 + tilt),
          z: Math.sin(angle) * radius * Math.cos(.38 + tilt), color: [1, .65, .26, .10 + (Math.sin(angle) + 1) * .025] });
      }
      this.ringCache.set(index, points);
    }
    this.drawItems(this.ringCache.get(index), this.gl.LINE_LOOP);
  }

  scene() {
    if (this.sceneCache) return this.sceneCache;
    // Search emphasizes matches without removing their surrounding context.
    const scene = visibleScene(this.layout, this.mode, this.selectedId);
    const selected = this.layout.nodeMap.get(this.selectedId);
    if (selected && !scene.nodes.some(node => node.id === selected.id)) scene.nodes.push(selected);
    const neighbors = new Set(relatedNodes(this.layout, this.selectedId).map(node => node.id));
    const priority = node => node.id === this.selectedId ? 4 : this.highlightedIds.has(node.id) ? 3 : neighbors.has(node.id) ? 2 : 1;
    const nodes = [...scene.nodes].sort((a, b) => priority(b) - priority(a) || b.importance - a.importance
      || String(b.data.updated_at || b.data.created_at || "").localeCompare(String(a.data.updated_at || a.data.created_at || "")) || a.id.localeCompare(b.id))
      .slice(0, QUALITY[this.quality].nodes);
    const ids = new Set(nodes.map(node => node.id));
    this.sceneCache = { nodes, connections: scene.connections.filter(edge => ids.has(edge.source) && ids.has(edge.target)) };
    return this.sceneCache;
  }

  drawCore(time) {
    const simple = this.reducedMotion || this.quality === "low";
    const motion = simple ? 0 : time * .00035;
    const state = this.aiState;
    const activity = { thinking: 1.15, searching: 1.10, speaking: 1.12, listening: 1.04, error: .88 }[state] || 1;
    const birthPulse = !simple && [...this.transitions.values()].some(item => item.kind === "birth" && time - item.startedAt < 180) ? 1.08 : 1;
    const pulse = activity * birthPulse * (simple ? 1 : 1 + Math.sin(motion * (state === "speaking" ? 7 : 2)) * .035);
    const tint = state === "error" ? [1, .30, .35] : [1, .69, .24];
    const sprite = (size, alpha, x = 0, y = 0) => ({ x, y, z: 0, size: size * pulse, color: [...tint, alpha], shape: 2 });
    this.drawItems([sprite(150, .12), sprite(104, .37, -.035, .025), sprite(74, .40, .035, -.022)], this.gl.POINTS, true);
    // Bounded filaments and incomplete arcs belong to the core, never to graph data.
    const filaments = [];
    const count = simple ? 2 : this.quality === "ultra" ? 8 : 5;
    const segments = Math.min(QUALITY[this.quality].segments, simple ? 24 : 72);
    for (let strand = 0; strand < count; strand += 1) {
      let previous;
      for (let step = 0; step <= segments; step += 1) {
        const progress = step / segments;
        const angle = progress * Math.PI * (1.35 + strand * .09) + strand * 1.8 + motion * (strand % 2 ? -.15 : .12);
        const radius = (.20 + Math.sin(progress * Math.PI) * .20 + strand * .011) * pulse;
        const point = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * (.60 + strand * .075),
          z: Math.sin(angle * 1.4 + strand) * radius * .65, color: [...tint, .20 + Math.sin(progress * Math.PI) * .27] };
        if (previous) filaments.push(previous, point);
        previous = point;
      }
    }
    this.drawItems(filaments, this.gl.LINES);
    const arcs = [];
    const arcCount = state === "searching" ? 3 : state === "error" ? 1 : 2;
    for (let arc = 0; arc < arcCount; arc += 1) {
      let previous;
      for (let step = 0; step <= segments; step += 1) {
        const angle = step / segments * Math.PI * (state === "listening" ? 1.05 : 1.32) + arc * 2.2 + .3;
        const radius = (.48 + arc * .055) * pulse;
        const point = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * (arc % 2 ? .8 : .32),
          z: Math.sin(angle) * radius * (arc % 2 ? -.36 : .72), color: [...tint, .27] };
        if (previous) arcs.push(previous, point);
        previous = point;
      }
    }
    this.drawItems(arcs, this.gl.LINES);
    if (!simple) this.drawItems(this.particles, this.gl.POINTS, true);
    this.drawItems([{ x: 0, y: 0, z: .02, size: 20 * pulse, shape: 0, color: [1, .91, .68, .92] },
      { x: .005, y: .003, z: .025, size: 7 * pulse, shape: 0, color: [1, .99, .94, 1] }], this.gl.POINTS, true);
  }

  draw(time) {
    if (this.contextLost || this.disposed) return;
    this.resize(); const gl = this.gl;
    const elapsed = this.lastTime ? Math.min(50, time - this.lastTime) : 0; this.lastTime = time;
    if (this.cameraTransition && !this.reducedMotion) {
      const transition = this.cameraTransition; const progress = clamp((time - transition.startedAt) / transition.duration, 0, 1);
      const eased = 1 - (1 - progress) ** 3;
      for (const key of Object.keys(transition.to)) this.camera[key] = transition.from[key] + (transition.to[key] - transition.from[key]) * eased;
      if (progress === 1) this.cameraTransition = null;
    } else if (!this.reducedMotion && this.quality !== "low" && !this.drag && !this.pointerInside && !this.canvasFocused
      && !this.inspectorOpen && this.mode !== "memory" && time - (this.lastInteraction || 0) > 4000) this.camera.yaw += elapsed * .000018;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program); gl.enable(gl.BLEND);
    // RGB is additive/premultiplied; coverage must not square source opacity.
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const pan = this.viewPan();
    gl.uniform1f(this.locations.yaw, this.camera.yaw); gl.uniform1f(this.locations.pitch, this.camera.pitch);
    gl.uniform1f(this.locations.zoom, this.camera.zoom); gl.uniform2f(this.locations.pan, pan.x, pan.y);
    gl.uniform2f(this.locations.viewport, this.canvas.width, this.canvas.height); gl.uniform1f(this.locations.pixel_ratio, this.ratio || 1);
    const scene = this.scene();
    const occupied = new Set(this.layout.memories.map(node => node.ringIndex));
    if (this.mode !== "memory") RING_ORDER.forEach((_, index) => { if (occupied.has(index)) this.ring(index); });
    const nodes = scene.nodes.map(node => {
      const selected = node.id === this.selectedId; const hovered = node.id === this.hoveredId;
      const transition = this.transitions.get(node.id); let scale = 1;
      if (transition && !this.reducedMotion) {
        const progress = clamp((time - transition.startedAt) / transition.duration, 0, 1);
        if (transition.kind === "birth") scale = .75 + .25 * progress;
        if (transition.kind === "update") scale = 1 + Math.sin(progress * Math.PI) * .35;
      }
      const dim = this.highlightedIds.size && !this.highlightedIds.has(node.id) && !selected;
      const color = selected ? [1, .98, .78, 1] : [...node.color]; color[3] *= dim ? .45 : 1;
      return { ...node, size: node.size * (selected ? 1.55 : hovered ? 1.2 : 1) * scale, shape: node.source === "entity" ? 1 : 0, color };
    });
    const lines = [];
    for (const edge of scene.connections) {
      const focal = edge.source === this.selectedId || edge.target === this.selectedId;
      const alpha = (focal ? .36 : .11) + clamp(edge.weight, 0, 1) * .12;
      lines.push({ ...this.layout.nodeMap.get(edge.source), color: [1, .65, .26, alpha] },
        { ...this.layout.nodeMap.get(edge.target), color: [1, .80, .45, alpha] });
    }
    this.drawItems(lines, gl.LINES); this.drawCore(time);
    const afterimages = [], transientLines = [], arrivals = [];
    for (const [id, transition] of this.transitions) {
      const progress = clamp((time - transition.startedAt) / transition.duration, 0, 1);
      if (progress >= 1 || this.reducedMotion) { this.transitions.delete(id); continue; }
      if (transition.kind === "delete" && transition.node) afterimages.push({ ...transition.node, id: undefined,
        size: transition.node.size * (1 - progress), color: [1, .7, .3, (1 - progress) * .55] });
      if (transition.kind === "delete") for (const [source,target] of transition.removedEdges || []) {
        const color = [1,.7,.3,(1-progress)*.35];
        transientLines.push({...source,color},{x:source.x+(target.x-source.x)*(1-progress),y:source.y+(target.y-source.y)*(1-progress),z:source.z+(target.z-source.z)*(1-progress),color});
      }
      if (transition.kind === "birth") {
        const node = this.layout.nodeMap.get(id); if (!node) continue;
        const travel = Math.min(1, progress / .75), tail = Math.max(0,travel-.12);
        const color = [1,.8,.4,(1-progress)*.8];
        const position = value => ({x:node.x*value,y:node.y*value,z:node.z*value,color});
        arrivals.push({...position(travel),size:4,shape:3});
        transientLines.push(position(tail),position(travel));
        // The semantic node stays at its final position and is pickable throughout.
      }
    }
    this.drawItems(transientLines, gl.LINES); this.drawItems(arrivals, gl.POINTS, true);
    this.drawItems(afterimages, gl.POINTS, true);
    this.drawItems(nodes.filter(node => node.id === this.selectedId || this.highlightedIds.has(node.id))
      .map(node => ({ ...node, size: node.size * 2.25, shape: 4, color: [1, .84, .49, .75] })), gl.POINTS, true);
    this.drawItems(nodes, gl.POINTS, true);
    this.projected = nodes.map(node => ({ node, screen: this.project(node) })).sort((a, b) => a.screen.depth - b.screen.depth);
    this.frame = requestAnimationFrame(next => this.draw(next));
  }
}
