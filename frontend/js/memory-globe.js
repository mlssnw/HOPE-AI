import { ApiError, getMemoryExplanation, getMemoryGraph, retrieveMemories } from "./api-client.js";
import { getOrCreateUserId } from "./storage.js";
import { applyGraphEvent, layoutGraph, normalizeGraph, relatedNodes, RING_ORDER, visibleScene } from "./memory-globe-core.js";
import { HopeRealtimeClient } from "./realtime.js";

const QUALITY = {
  low: { particles: 90, nodes: 400, segments: 48 },
  medium: { particles: 220, nodes: 1000, segments: 72 },
  high: { particles: 480, nodes: 2500, segments: 96 },
  ultra: { particles: 900, nodes: 6000, segments: 128 },
};

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
  float alpha = smoothstep(edge, edge * 0.18, distanceToCenter);
  float core = smoothstep(edge * 0.46, 0.0, distanceToCenter);
  gl_FragColor = vec4(v_color.rgb + core * vec3(0.42, 0.31, 0.12), v_color.a * alpha);
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
    const u = ((index * 16807) % 2147483647) / 2147483647;
    const v = ((index * 48271 + 31) % 2147483647) / 2147483647;
    const angle = u * Math.PI * 2; const radius = 3.1 + v * 2.8;
    points.push({
      x: Math.cos(angle) * radius,
      y: (v - .5) * 3.4,
      z: Math.sin(angle) * radius,
      size: .8 + (index % 4) * .35,
      color: [1, .58 + v * .25, .16, .16 + v * .24], shape: 3,
    });
  }
  return points;
}

export class MemoryGlobeRenderer {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas; this.callbacks = callbacks;
    this.gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!this.gl) throw new Error("WebGL não está disponível neste navegador.");
    this.program = createProgram(this.gl); this.layout = layoutGraph({});
    this.mode = "orbital"; this.quality = "high"; this.selectedId = null;
    this.highlightedIds = new Set(); this.hoveredId = null; this.drag = null;
    this.graphSnapshot = normalizeGraph({}); this.transitions = new Map(); this.aiState = "idle";
    this.camera = { yaw: -.35, pitch: -.13, zoom: 5.8, panX: 0, panY: 0 };
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.lastTime = 0; this.projected = []; this.particles = particleCloud(QUALITY.high.particles);
    this.locations = Object.fromEntries(["yaw", "pitch", "zoom", "pan", "viewport", "pixel_ratio", "points"].map(name => [name, this.gl.getUniformLocation(this.program, `u_${name}`)]));
    this.attributes = Object.fromEntries(["position", "color", "size", "shape"].map(name => [name, this.gl.getAttribLocation(this.program, `a_${name}`)]));
    this.buffers = Object.fromEntries(["position", "color", "size", "shape"].map(name => [name, this.gl.createBuffer()]));
    this.bind(); this.resize(); this.frame = requestAnimationFrame(time => this.draw(time));
  }

  bind() {
    addEventListener("resize", () => this.resize());
    this.canvas.addEventListener("contextmenu", event => event.preventDefault());
    this.canvas.addEventListener("pointerdown", event => {
      this.canvas.setPointerCapture(event.pointerId);
      this.drag = { x: event.clientX, y: event.clientY, pan: event.shiftKey || event.button === 2, moved: false };
    });
    this.canvas.addEventListener("pointermove", event => {
      if (this.drag) {
        const dx = event.clientX - this.drag.x; const dy = event.clientY - this.drag.y;
        this.drag.x = event.clientX; this.drag.y = event.clientY; this.drag.moved ||= Math.abs(dx) + Math.abs(dy) > 2;
        if (this.drag.pan) { this.camera.panX += dx / this.canvas.clientWidth * 2; this.camera.panY -= dy / this.canvas.clientHeight * 2; }
        else { this.camera.yaw += dx * .006; this.camera.pitch = Math.max(-1.15, Math.min(1.15, this.camera.pitch + dy * .005)); }
        return;
      }
      const node = this.pick(event.offsetX, event.offsetY);
      if (node?.id !== this.hoveredId) { this.hoveredId = node?.id || null; this.callbacks.onHover?.(node, event); }
    });
    this.canvas.addEventListener("pointerup", event => {
      const wasMoved = this.drag?.moved; this.drag = null;
      if (!wasMoved) this.callbacks.onSelect?.(this.pick(event.offsetX, event.offsetY));
    });
    this.canvas.addEventListener("pointerleave", () => { if (!this.drag) this.callbacks.onHover?.(null); });
    this.canvas.addEventListener("wheel", event => {
      event.preventDefault(); this.camera.zoom = Math.max(3.2, Math.min(12, this.camera.zoom + event.deltaY * .006));
    }, { passive: false });
    this.canvas.addEventListener("keydown", event => {
      const actions = { ArrowLeft: [-.12, 0], ArrowRight: [.12, 0], ArrowUp: [0, -.10], ArrowDown: [0, .10] };
      if (actions[event.key]) { event.preventDefault(); this.camera.yaw += actions[event.key][0]; this.camera.pitch += actions[event.key][1]; }
      if (["+", "="].includes(event.key)) { event.preventDefault(); this.camera.zoom = Math.max(3.2, this.camera.zoom - .4); }
      if (event.key === "-") { event.preventDefault(); this.camera.zoom = Math.min(12, this.camera.zoom + .4); }
      if (event.key === "Escape") this.callbacks.onSelect?.(null);
    });
  }

  resize() {
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, this.canvas.clientWidth); const height = Math.max(1, this.canvas.clientHeight);
    if (this.canvas.width !== Math.round(width * ratio) || this.canvas.height !== Math.round(height * ratio)) {
      this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio);
    }
    this.ratio = ratio; this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  setGraph(graph) { this.graphSnapshot = normalizeGraph(graph); this.layout = layoutGraph(this.graphSnapshot); this.transitions.clear(); }
  applyGraphMutation(graph, event) {
    this.graphSnapshot = normalizeGraph(graph);
    const now = performance.now(); const memoryId = event?.payload?.memory_id || event?.payload?.node?.id;
    if (event?.type === "MEMORY_DELETED" && memoryId && this.layout.nodeMap.has(memoryId)) {
      this.transitions.set(memoryId, { kind: "delete", startedAt: now, duration: 460 });
      setTimeout(() => {
        const transition = this.transitions.get(memoryId);
        if (transition?.kind === "delete") this.transitions.delete(memoryId);
        this.layout = layoutGraph(this.graphSnapshot);
      }, 480);
      return;
    }
    this.layout = layoutGraph(this.graphSnapshot);
    if (event?.type === "MEMORY_CREATED" && memoryId) this.transitions.set(memoryId, { kind: "birth", startedAt: now, duration: 720 });
    if (event?.type === "MEMORY_UPDATED" && memoryId) this.transitions.set(memoryId, { kind: "update", startedAt: now, duration: 520 });
  }
  setAiState(state) { this.aiState = ["thinking", "error"].includes(state) ? state : "idle"; }
  setMode(mode) { this.mode = ["orbital", "cluster", "memory"].includes(mode) ? mode : "orbital"; }
  setSelected(id) { this.selectedId = id || null; if (!id && this.mode === "memory") this.mode = "orbital"; }
  setHighlights(ids) { this.highlightedIds = new Set(ids || []); }
  setQuality(value) { this.quality = QUALITY[value] ? value : "high"; this.particles = particleCloud(QUALITY[this.quality].particles); }
  resetCamera() { Object.assign(this.camera, { yaw: -.35, pitch: -.13, zoom: 5.8, panX: 0, panY: 0 }); }
  focusOn(id) {
    const node = this.layout.nodeMap.get(id); if (!node) return;
    this.camera.yaw = -Math.atan2(node.x, node.z || .001);
    this.camera.pitch = Math.max(-.8, Math.min(.8, Math.atan2(node.y, Math.hypot(node.x, node.z))));
    this.camera.zoom = 4.25; this.camera.panX = 0; this.camera.panY = 0;
  }

  project(node) {
    const { yaw, pitch, zoom, panX, panY } = this.camera;
    const cy = Math.cos(yaw), sy = Math.sin(yaw); const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const rx = cy * node.x + sy * node.z; const rz = -sy * node.x + cy * node.z;
    const ry = cp * node.y - sp * rz; const z = sp * node.y + cp * rz;
    const depth = Math.max(1.2, zoom - z); const aspect = this.canvas.clientHeight / this.canvas.clientWidth;
    const ndcX = (rx * 2.55 / depth + panX) * aspect; const ndcY = ry * 2.55 / depth + panY;
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

  ring(index, time) {
    const items = []; const segments = QUALITY[this.quality].segments;
    const radius = 1.22 + index * .52; const tilt = index % 2 ? -.22 : .19;
    const drift = this.reducedMotion ? 0 : time * .000015 * (index % 2 ? -1 : 1);
    for (let step = 0; step < segments; step += 1) {
      const angle = step / segments * Math.PI * 2 + drift;
      items.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * Math.sin(.38 + tilt), z: Math.sin(angle) * radius * Math.cos(.38 + tilt), color: [1, .60 + index * .025, .14, index === 0 ? .45 : .24], size: index === 0 ? 1.7 : 1.15, shape: 0 });
    }
    this.drawItems(items, this.gl.LINE_LOOP);
    this.drawItems(items.filter((_, step) => step % 4 === index % 4), this.gl.POINTS, true);
  }

  draw(time) {
    this.resize(); const gl = this.gl; const elapsed = this.lastTime ? time - this.lastTime : 0; this.lastTime = time;
    if (!this.reducedMotion && !this.drag && this.mode !== "memory") this.camera.yaw += elapsed * .000035;
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.uniform1f(this.locations.yaw, this.camera.yaw); gl.uniform1f(this.locations.pitch, this.camera.pitch);
    gl.uniform1f(this.locations.zoom, this.camera.zoom); gl.uniform2f(this.locations.pan, this.camera.panX, this.camera.panY);
    gl.uniform2f(this.locations.viewport, this.canvas.width, this.canvas.height); gl.uniform1f(this.locations.pixel_ratio, this.ratio || 1);
    RING_ORDER.forEach((_, index) => this.ring(index, time));

    const scene = visibleScene(this.layout, this.mode, this.selectedId, this.highlightedIds);
    const maxNodes = QUALITY[this.quality].nodes;
    const nodes = [...scene.nodes].sort((a, b) => b.importance - a.importance).slice(0, maxNodes).map(node => {
      const selected = node.id === this.selectedId; const hovered = node.id === this.hoveredId;
      const transition = this.transitions.get(node.id); let scale = 1; let positionScale = 1;
      if (transition) {
        const progress = Math.max(0, Math.min(1, (time - transition.startedAt) / transition.duration));
        if (transition.kind === "birth") { scale = progress; positionScale = 1 - ((1 - progress) ** 3); }
        if (transition.kind === "delete") { scale = 1 - progress; positionScale = 1 - progress; }
        if (transition.kind === "update") scale = 1 + Math.sin(progress * Math.PI) * .48;
        if (progress >= 1 && transition.kind !== "delete") this.transitions.delete(node.id);
      }
      const color = selected ? [1, .98, .78, 1] : [...node.color]; color[3] *= Math.max(.04, scale);
      return { ...node, x: node.x * positionScale, y: node.y * positionScale, z: node.z * positionScale,
        size: node.size * (selected ? 1.65 : hovered ? 1.28 : 1) * Math.max(.04, scale),
        shape: node.source === "entity" ? 1 : 0, color };
    });
    const visibleIds = new Set(nodes.map(node => node.id));
    const lines = [];
    scene.connections.filter(edge => visibleIds.has(edge.source) && visibleIds.has(edge.target)).forEach(edge => {
      const source = this.layout.nodeMap.get(edge.source); const target = this.layout.nodeMap.get(edge.target);
      const alpha = .20 + Math.max(0, Math.min(1, edge.weight)) * .46;
      lines.push({ ...source, color: [1, .61, .15, alpha] }, { ...target, color: [1, .77, .32, alpha] });
    });
    this.drawItems(lines, gl.LINES);
    this.drawItems(this.particles, gl.POINTS, true);
    const activity = this.aiState === "thinking" ? 1.24 : this.aiState === "error" ? .88 : 1;
    const pulse = (this.reducedMotion ? 1 : 1 + Math.sin(time * (this.aiState === "thinking" ? .006 : .0022)) * .09) * activity;
    const coreColor = this.aiState === "error" ? [1, .22, .17, .96] : [1, .76, .24, .96];
    this.drawItems([{ x: 0, y: 0, z: 0, size: 154 * pulse, color: [1, .54, .08, .10], shape: 2 }], gl.POINTS, true);
    this.drawItems([{ x: 0, y: 0, z: 0, size: 88 * pulse, color: coreColor, shape: 2 }], gl.POINTS, true);
    this.drawItems(nodes, gl.POINTS, true);
    this.projected = nodes.map(node => ({ node, screen: this.project(node) })).sort((a, b) => a.screen.depth - b.screen.depth);
    this.frame = requestAnimationFrame(next => this.draw(next));
  }
}

function setText(element, text) { if (element) element.textContent = text; }
function countLabel(count, singular, plural) { return `${count} ${count === 1 ? singular : plural}`; }

export class MemoryGlobeController {
  constructor() {
    this.canvas = document.querySelector("#memory-globe"); if (!this.canvas) return;
    this.userId = getOrCreateUserId(); this.abortController = null; this.graph = normalizeGraph({}); this.layout = layoutGraph({});
    this.fallbackTimer = null; this.hasConnected = false; this.realtimeState = "idle";
    this.elements = {
      shell: document.querySelector("#memory-globe-shell"), status: document.querySelector("#globe-data-status"),
      count: document.querySelector("#globe-count"), empty: document.querySelector("#globe-empty"),
      tooltip: document.querySelector("#globe-tooltip"), inspector: document.querySelector("#memory-inspector"),
      inspectorTitle: document.querySelector("#memory-inspector-title"), inspectorKind: document.querySelector("#memory-inspector-kind"),
      inspectorBody: document.querySelector("#memory-inspector-body"), inspectorMeta: document.querySelector("#memory-inspector-meta"),
      related: document.querySelector("#memory-related"), search: document.querySelector("#globe-search-form"),
      query: document.querySelector("#globe-search"), expand: document.querySelector("#globe-expand"),
      quality: document.querySelector("#globe-quality"), memoryStatus: document.querySelector("#memory-status"),
    };
    try {
      this.renderer = new MemoryGlobeRenderer(this.canvas, {
        onHover: (node, event) => this.hover(node, event), onSelect: node => this.select(node),
      });
    } catch (error) { this.unavailable(error.message); return; }
    this.bind();
    this.realtime = new HopeRealtimeClient({
      userId: this.userId,
      onEvent: event => this.handleRealtimeEvent(event),
      onState: state => this.handleRealtimeState(state),
    });
    this.load().finally(() => this.realtime.start());
    addEventListener("beforeunload", () => this.realtime.stop(), { once: true });
  }

  bind() {
    document.querySelector("#globe-refresh")?.addEventListener("click", () => this.load());
    document.querySelector("#globe-reset")?.addEventListener("click", () => { this.renderer.resetCamera(); this.clearSelection(); });
    document.querySelector("#memory-inspector-close")?.addEventListener("click", () => this.clearSelection());
    document.querySelector("#memory-focus")?.addEventListener("click", () => { if (this.renderer.selectedId) { this.renderer.setMode("memory"); this.renderer.focusOn(this.renderer.selectedId); this.updateModeButtons("memory"); } });
    document.querySelector("#memory-ask")?.addEventListener("click", () => {
      const selected = this.layout.nodeMap.get(this.renderer.selectedId); if (!selected || selected.source !== "memory") return;
      const prompt = document.querySelector("#prompt"); prompt.value = `Explique o contexto e as relações desta memória: ${selected.data.title || selected.data.content}`; prompt.focus();
    });
    document.querySelectorAll("[data-globe-view]").forEach(button => button.addEventListener("click", () => {
      const mode = button.dataset.globeView;
      if (mode === "memory" && !this.renderer.selectedId) return setText(this.elements.status, "Selecione uma memória primeiro");
      this.renderer.setMode(mode); this.updateModeButtons(mode);
    }));
    this.elements.search?.addEventListener("submit", event => { event.preventDefault(); this.search(this.elements.query.value.trim()); });
    this.elements.query?.addEventListener("input", () => { if (!this.elements.query.value.trim()) { this.renderer.setHighlights([]); setText(this.elements.status, "Grafo sincronizado"); } });
    this.elements.quality?.addEventListener("change", () => this.renderer.setQuality(this.elements.quality.value));
    this.elements.expand?.addEventListener("click", () => {
      const expanded = this.elements.shell.classList.toggle("expanded");
      this.elements.expand.setAttribute("aria-pressed", String(expanded));
      this.elements.expand.textContent = expanded ? "Recolher" : "Expandir";
      setTimeout(() => this.renderer.resize(), 80);
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && this.elements.shell.classList.contains("expanded")) this.elements.expand.click(); });
  }

  async load() {
    this.abortController?.abort(); this.abortController = new AbortController();
    setText(this.elements.status, "Sincronizando memória…"); this.elements.empty.hidden = true;
    try {
      const graph = await getMemoryGraph(this.userId, this.abortController.signal);
      this.graph = normalizeGraph(graph); this.layout = layoutGraph(this.graph); this.renderer.setGraph(this.graph);
      this.updateReadout();
      setText(this.elements.status, this.layout.memories.length ? "Grafo sincronizado" : "Memória vazia");
      this.elements.empty.hidden = this.layout.memories.length > 0;
      this.elements.empty.dataset.state = "empty";
      setText(this.elements.empty.querySelector("strong"), "Nenhuma memória persistente ainda");
      setText(this.elements.empty.querySelector("span"), "Quando dados forem salvos, os nós aparecerão aqui.");
      if (!["disconnected", "reconnecting"].includes(this.realtimeState)) {
        this.elements.memoryStatus.dataset.state = "online"; this.elements.memoryStatus.title = "Memória conectada";
      }
    } catch (error) {
      const unavailable = error instanceof ApiError && error.status === 503;
      this.elements.empty.hidden = false; this.elements.empty.dataset.state = "offline";
      setText(this.elements.empty.querySelector("strong"), unavailable ? "Memória cloud não configurada" : "Não foi possível carregar o grafo");
      setText(this.elements.empty.querySelector("span"), unavailable ? "Configure DATABASE_URL e aplique as migrações para ativar os nós reais." : "Tente sincronizar novamente.");
      setText(this.elements.status, unavailable ? "Banco desconectado" : "Falha de sincronização");
      this.elements.memoryStatus.dataset.state = "offline"; this.elements.memoryStatus.title = "Memória indisponível";
    }
  }

  updateReadout() {
    const memoryCount = countLabel(this.layout.memories.length, "memória", "memórias");
    const entityCount = countLabel(this.layout.entities.length, "entidade", "entidades");
    setText(this.elements.count, `${memoryCount} · ${entityCount}`);
    this.canvas.setAttribute("aria-label", `Memory Globe com ${memoryCount} e ${entityCount}.`);
  }

  handleRealtimeEvent(event) {
    if (event.type === "AI_STATE_CHANGED") {
      this.renderer.setAiState(event.payload?.state);
      setText(this.elements.status, event.payload?.state === "thinking" ? "HOPE processando…" : "Tempo real conectado");
      return;
    }
    const nextGraph = applyGraphEvent(this.graph, event);
    this.graph = nextGraph; this.layout = layoutGraph(nextGraph);
    this.renderer.applyGraphMutation(nextGraph, event);
    if (event.type === "MEMORY_DELETED" && this.renderer.selectedId === event.payload?.memory_id) this.clearSelection();
    this.updateReadout(); this.elements.empty.hidden = this.layout.memories.length > 0;
    setText(this.elements.status, "Atualização em tempo real");
  }

  handleRealtimeState({ state }) {
    this.realtimeState = state;
    if (state === "connected") {
      const reconnect = this.hasConnected; this.hasConnected = true;
      clearInterval(this.fallbackTimer); this.fallbackTimer = null;
      this.elements.memoryStatus.dataset.state = "online";
      this.elements.memoryStatus.title = "Memória em tempo real conectada";
      setText(this.elements.status, "Tempo real conectado");
      if (reconnect) this.load();
      return;
    }
    if (["disconnected", "reconnecting"].includes(state)) {
      this.elements.memoryStatus.dataset.state = "degraded";
      this.elements.memoryStatus.title = "Tempo real desconectado; sincronização HTTP ativa";
      setText(this.elements.status, "Tempo real desconectado · HTTP disponível");
      if (!this.fallbackTimer) this.fallbackTimer = setInterval(() => this.load(), 30000);
    }
  }

  async search(query) {
    if (!query) { this.renderer.setHighlights([]); return; }
    setText(this.elements.status, "Buscando relações…");
    try {
      const hits = await retrieveMemories(this.userId, query);
      const ids = hits.map(hit => hit.memory?.id).filter(Boolean); this.renderer.setHighlights(ids);
      setText(this.elements.status, ids.length ? `${countLabel(ids.length, "memória encontrada", "memórias encontradas")}` : "Nenhuma memória relacionada");
      if (ids.length) { this.renderer.setMode("orbital"); this.renderer.focusOn(ids[0]); this.updateModeButtons("orbital"); }
    } catch (error) { setText(this.elements.status, error instanceof ApiError ? error.message : "Busca indisponível"); }
  }

  hover(node, event) {
    if (!node) { this.elements.tooltip.hidden = true; return; }
    this.elements.tooltip.hidden = false;
    this.elements.tooltip.style.left = `${event.offsetX + 14}px`; this.elements.tooltip.style.top = `${event.offsetY + 14}px`;
    setText(this.elements.tooltip, node.source === "entity" ? node.data.name : node.data.title || node.data.content);
  }

  async select(node) {
    if (!node) return this.clearSelection();
    this.renderer.setSelected(node.id); this.elements.inspector.hidden = false;
    setText(this.elements.inspectorTitle, node.source === "entity" ? node.data.name : node.data.title || "Memória");
    setText(this.elements.inspectorKind, node.source === "entity" ? `ENTIDADE · ${node.data.entity_type}` : `${node.data.kind} · ${node.data.memory_type}`);
    setText(this.elements.inspectorBody, node.source === "entity" ? "Cluster semântico ligado às memórias abaixo." : node.data.content);
    setText(this.elements.inspectorMeta, node.source === "entity" ? "" : `Importância ${Math.round(node.data.importance * 100)}% · confiança ${Math.round(node.data.confidence * 100)}% · ${node.data.mention_count} menções`);
    this.renderRelated(node.id);
    if (node.source === "memory") {
      try {
        const explanation = await getMemoryExplanation(this.userId, node.id);
        const sourceCount = explanation.sources?.length || 0; const entityCount = explanation.entities?.length || 0;
        setText(this.elements.inspectorMeta, `${this.elements.inspectorMeta.textContent} · ${sourceCount} fontes · ${entityCount} entidades`);
      } catch { /* O resumo local continua disponível. */ }
    }
  }

  renderRelated(id) {
    this.elements.related.replaceChildren();
    relatedNodes(this.layout, id).slice(0, 8).forEach(node => {
      const button = document.createElement("button"); button.type = "button";
      button.textContent = node.source === "entity" ? node.data.name : node.data.title || node.data.content;
      button.addEventListener("click", () => { this.select(node); this.renderer.focusOn(node.id); });
      this.elements.related.append(button);
    });
  }

  clearSelection() { this.renderer.setSelected(null); this.elements.inspector.hidden = true; }
  updateModeButtons(mode) { document.querySelectorAll("[data-globe-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.globeView === mode))); }
  unavailable(message) { this.elements.empty.hidden = false; setText(this.elements.empty.querySelector("strong"), "WebGL indisponível"); setText(this.elements.empty.querySelector("span"), message); }
}
