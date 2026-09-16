import { ApiError, deleteMemory, getMemoryExplanation, getMemoryGraph, retrieveMemories } from "./api-client.js";
import { applyGraphEvent, layoutGraph, normalizeGraph, relatedNodes, RING_LABELS } from "./memory-globe-core.js";
import { MemoryGlobeRenderer } from "./memory-globe.js";
import { getOrCreateUserId } from "./storage.js";
import { HopeRealtimeClient } from "./realtime.js";
import { normalizeMemoryDeleteConfirmation } from "./memory-confirmation.js";
import { displayedState, initialQuality, operationalState, stateLabel } from "./presentation-state.js";

const $ = id => document.getElementById(id);
const label = node => node.source === "entity" ? node.data.name : node.data.title || node.data.content;
const kinds = { fact:"Fato", event:"Evento", inference:"Inferência" };
export class MemoryGlobeController {
  constructor() {
    this.userId = getOrCreateUserId(); this.graph = normalizeGraph({}); this.layout = layoutGraph({});
    this.selectedId = null; this.mode = "orbital"; this.searchIds = null; this.searchIndex = 0; this.searchToken = 0;
    this.operation = { chat:"idle", voice:"idle", remote:"idle", cancelled:false };
    this.quality = initialQuality(innerWidth); $("globe-quality").value = this.quality;
    this.motionMedia = matchMedia("(prefers-reduced-motion:reduce)");
    try { this.manualMotion = localStorage.getItem("hope.reduced-motion") === "true"; } catch { this.manualMotion = false; }
    this.createRenderer(); this.bind(); this.updateMotion();
    this.realtime = new HopeRealtimeClient({
      userId:this.userId, onEvent:event => this.handleRealtimeEvent(event), onState:state => this.handleRealtimeState(state),
    });
    this.load().finally(() => this.realtime.start());
    addEventListener("beforeunload", () => { this.realtime.stop(); clearInterval(this.fallbackTimer); }, { once:true });
  }
  createRenderer() {
    this.renderer?.dispose();
    if (!$("webgl-fallback").hidden) {
      // A lost WebGL context cannot reliably be reused; preserve the canvas contract.
      const previous = $("memory-globe"); previous.replaceWith(previous.cloneNode(false));
    }
    try {
      this.renderer = new MemoryGlobeRenderer($("memory-globe"), { onHover:(node,event) => this.hover(node,event), onSelect:node => this.select(node), onContextLost:()=>this.showFallback() });
      this.renderer.setQuality(this.quality); this.renderer.setGraph(this.graph);
      this.renderer.setSelected(this.selectedId); this.renderer.setMode(this.mode);
      this.renderer.setReducedMotion?.(this.motionMedia.matches || this.manualMotion);
      $("webgl-fallback").hidden = true; $("memory-globe").hidden = false;
      $("memory-globe-shell").classList.remove("no-webgl");
      this.renderer.setAiState(displayedState(this.operation));
      this.renderer.setHighlights(this.searchIds || []);
      this.renderer.setInspectorOpen(!$("memory-inspector").hidden);
      this.setList(false);
    } catch { this.showFallback(); }
  }
  showFallback() {
    this.renderer?.dispose(); this.renderer = null;
    $("memory-globe").hidden = true; $("webgl-fallback").hidden = false;
    $("memory-globe-shell").classList.add("no-webgl"); this.setList(true);
  }
  bind() {
    $("globe-refresh").addEventListener("click", () => this.load());
    $("globe-reset").addEventListener("click", () => this.renderer?.resetCamera());
    $("webgl-retry").addEventListener("click", () => this.createRenderer());
    $("globe-list-toggle").addEventListener("click", () => this.setList($("memory-list-panel").hidden));
    $("memory-inspector-close").addEventListener("click", () => this.clearSelection());
    $("memory-focus").addEventListener("click", () => {
      this.setMode("memory"); this.renderer?.focusOn(this.selectedId);
      if (!this.renderer) this.setList(true);
    });
    $("memory-ask").addEventListener("click", () => {
      const node = this.layout.nodeMap.get(this.selectedId); if (!node) return;
      dispatchEvent(new CustomEvent("hope:show-surface", { detail:"conversation" }));
      $("prompt").value = "Explique o contexto e as relações desta memória: " + label(node);
      this.clearSelection(false); $("prompt").focus();
    });
    $("memory-forget").addEventListener("click", () => {
      const node = this.layout.nodeMap.get(this.selectedId);
      if (node?.source === "memory") this.openDeleteConfirmation({ memory_id:node.id, label:label(node) }, $("memory-forget"));
    });
    $("memory-delete-cancel").addEventListener("click", () => this.closeDeleteConfirmation());
    $("memory-delete-confirm").addEventListener("click", () => this.confirmDeletion());
    $("memory-delete-dialog").addEventListener("cancel", event => {
      event.preventDefault(); if (!this.deleting) this.closeDeleteConfirmation();
    });
    document.querySelectorAll("[data-globe-view]").forEach(button => button.addEventListener("click", () => this.setMode(button.dataset.globeView)));
    $("globe-quality").addEventListener("change", () => {
      this.quality = $("globe-quality").value; this.renderer?.setQuality(this.quality);
    });
    $("reduce-motion").addEventListener("change", () => {
      this.manualMotion = $("reduce-motion").checked;
      try { localStorage.setItem("hope.reduced-motion", String(this.manualMotion)); } catch { /* Session preference still works. */ }
      this.updateMotion();
    });
    this.motionMedia.addEventListener("change", () => this.updateMotion());
    $("globe-search-form").addEventListener("submit", event => { event.preventDefault(); this.search($("globe-search").value.trim()); });
    $("globe-search").addEventListener("input", () => { if (!$("globe-search").value.trim()) this.clearSearch(); });
    $("search-clear").addEventListener("click", () => { this.clearSearch(); $("globe-search").focus(); });
    $("search-next").addEventListener("click", () => this.stepSearch(1));
    $("search-previous").addEventListener("click", () => this.stepSearch(-1));
    $("realtime-retry").addEventListener("click", () => { this.realtime.stop(); this.realtime.start(); this.load(); });
    document.querySelectorAll("[data-camera]").forEach(button => button.addEventListener("click", () => {
      const action = button.dataset.camera;
      if (action.startsWith("zoom")) this.renderer?.zoomBy(action === "zoom-in" ? .85 : 1.15);
      else if (action.startsWith("pan")) this.renderer?.pan(action === "pan-left" ? -.2 : action === "pan-right" ? .2 : 0, action === "pan-up" ? .2 : action === "pan-down" ? -.2 : 0);
      else this.renderer?.orbit(action === "left" ? -.2 : action === "right" ? .2 : 0, action === "up" ? -.15 : action === "down" ? .15 : 0);
    }));
    $("memory-globe").addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.defaultPrevented) { this.setList(true); $("memory-list").querySelector("button")?.focus(); event.preventDefault(); }
    });
    $("memory-list").addEventListener("keydown", event => {
      if (!["ArrowDown","ArrowUp","Home","End"].includes(event.key)) return;
      const buttons = [...$("memory-list").querySelectorAll("button")]; const index = buttons.indexOf(document.activeElement);
      const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length-1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus(); event.preventDefault();
    });
    document.addEventListener("keydown", event => this.keyboard(event), true);
    addEventListener("hope:ui-event", event => {
      if (event.detail?.type !== "FOCUS_MEMORIES") return;
      const ids = event.detail.ids.filter(id => this.layout.nodeMap.has(id));
      this.renderer?.setHighlights(ids); if (ids.length) this.renderer?.focusOn(ids[0]);
    });
    addEventListener("hope:inspect-memory", event => {
      const node = this.layout.nodeMap.get(event.detail); if (!node) return;
      dispatchEvent(new CustomEvent("hope:show-surface", { detail:"memory" })); this.select(node);
    });
    addEventListener("hope:confirm-memory-delete", event => this.openDeleteConfirmation(event.detail));
    addEventListener("hope:operation", event => this.setOperation(event.detail));
  }
  updateMotion() {
    const reduced = this.motionMedia.matches || this.manualMotion;
    $("reduce-motion").checked = reduced; $("reduce-motion").disabled = this.motionMedia.matches;
    $("reduce-motion").title = this.motionMedia.matches ? "Preferência de movimento reduzido do sistema" : "Preferência salva neste navegador";
    document.body.dataset.reducedMotion = String(reduced); this.renderer?.setReducedMotion?.(reduced);
  }
  setOperation(event) {
    this.operation = operationalState(this.operation,event);
    const state = displayedState(this.operation);
    $("hope-state").textContent = stateLabel(state); $("hope-state").dataset.state = state;
    this.renderer?.setAiState(state);
  }
  setList(open) {
    open = open || !this.renderer;
    $("memory-list-panel").hidden = !open; $("globe-list-toggle").setAttribute("aria-expanded", String(open));
    this.renderList();
  }
  renderList() {
    const activeId = document.activeElement?.dataset.nodeId;
    const list = $("memory-list"); list.replaceChildren();
    let nodes = this.layout.nodes;
    if (this.searchIds !== null) nodes = nodes.filter(node => this.searchIds.includes(node.id));
    else if (this.mode === "memory" && this.selectedId) {
      const ids = new Set([this.selectedId,...relatedNodes(this.layout,this.selectedId).map(node=>node.id)]);
      nodes = nodes.filter(node=>ids.has(node.id));
    }
    for (const node of nodes) {
      const li = document.createElement("li"); const button = document.createElement("button"); button.type = "button";
      button.dataset.nodeId = node.id; button.setAttribute("aria-current", String(node.id === this.selectedId));
      const title = document.createElement("span"); title.textContent = label(node);
      const meta = document.createElement("small");
      meta.textContent = (node.source === "entity" ? "Entidade" : (kinds[node.data.kind] || "Memória") + " · " + RING_LABELS[node.ring]) + " · " + relatedNodes(this.layout,node.id).length + " relações";
      button.append(title,meta); button.addEventListener("click", () => this.select(node,button)); li.append(button); list.append(li);
    }
    if (!nodes.length) { const li = document.createElement("li"); li.textContent = this.searchIds !== null ? "Nenhuma memória relacionada a esta busca." : "Nenhum item disponível."; list.append(li); }
    if (activeId) [...list.querySelectorAll("button")].find(button=>button.dataset.nodeId === activeId)?.focus();
  }
  async load() {
    this.abortController?.abort(); const controller = new AbortController(); this.abortController = controller;
    $("globe-data-status").textContent = "Recuperando memórias…"; $("memory-globe-shell").dataset.state = "loading";
    $("globe-search").disabled = true;
    try {
      const payload = await getMemoryGraph(this.userId,controller.signal);
      if (controller.signal.aborted) return;
      this.graph = normalizeGraph(payload); this.layout = layoutGraph(this.graph); this.renderer?.setGraph(this.graph);
      this.available = true; this.updateReadout();
      if (this.selectedId && !this.layout.nodeMap.has(this.selectedId)) this.clearSelection();
      $("globe-data-status").textContent = this.layout.nodes.length ? "Grafo sincronizado" : "Memória vazia";
      $("memory-globe-shell").dataset.state = this.layout.nodes.length ? "ready" : "empty";
      this.showEmpty(!this.layout.nodes.length,"Nenhuma memória persistente ainda","Ative Memória no chat quando quiser recuperar e guardar contexto.");
    } catch (error) {
      if (error.name === "AbortError") return;
      this.available = false;
      const unavailable = error instanceof ApiError && error.status === 503;
      $("memory-globe-shell").dataset.state = unavailable ? "unavailable" : "error";
      $("globe-data-status").textContent = unavailable ? "Serviço de memória indisponível" : "Falha de sincronização";
      this.showEmpty(true,unavailable ? "Memória indisponível" : "Não foi possível atualizar as memórias","A conversa continua sem contexto persistente. Tente Sincronizar novamente.");
    } finally {
      if (this.abortController === controller) { $("globe-search").disabled = false; this.updateServiceStatus(); }
    }
  }
  showEmpty(show,title,detail) {
    $("globe-empty").hidden = !show; $("globe-empty").querySelector("strong").textContent = title;
    $("globe-empty").querySelector("span").textContent = detail;
  }
  updateServiceStatus() {
    $("memory-status").textContent = "Serviço de memória " + (this.available ? "disponível" : "indisponível");
    $("memory-status").dataset.state = this.available ? "online" : "offline";
  }
  updateReadout() {
    const text = this.layout.memories.length + " memórias · " + this.layout.entities.length + " entidades";
    $("globe-count").textContent = text; $("mobile-count").textContent = "· " + this.layout.memories.length;
    $("memory-globe").setAttribute("aria-label", "Globo de Memória com " + text + ". Explore todos os itens pela Lista.");
    $("ring-labels").replaceChildren();
    for (const ring of new Set(this.layout.memories.map(node=>node.ring))) {
      const tag = document.createElement("span"); tag.textContent = RING_LABELS[ring]; $("ring-labels").append(tag);
    }
    this.renderList();
  }
  handleRealtimeState({state}) {
    const connected = state === "connected"; const degraded = ["disconnected","reconnecting"].includes(state);
    $("realtime-status").textContent = connected ? "Sincronização em tempo real" : degraded ? "Sincronização periódica · tempo real desconectado" : "Conectando sincronização";
    $("realtime-retry").hidden = !degraded;
    if (connected) {
      clearInterval(this.fallbackTimer); this.fallbackTimer = null;
      if (this.hasConnected) this.load(); this.hasConnected = true;
    } else if (degraded && !this.fallbackTimer) this.fallbackTimer = setInterval(()=>this.load(),30000);
    // Connectivity never overwrites the database availability or chat's operational state.
  }
  handleRealtimeEvent(event) {
    if (event.type === "AI_STATE_CHANGED") { this.setOperation({source:"realtime",state:event.payload?.state}); return; }
    const selectedBefore = this.selectedId;
    this.graph = applyGraphEvent(this.graph,event); this.layout = layoutGraph(this.graph);
    this.renderer?.applyGraphMutation(this.graph,event);
    if (selectedBefore && !this.layout.nodeMap.has(selectedBefore)) {
      this.clearSelection(); $("globe-data-status").textContent = "Memória removida e relações atualizadas";
    } else if (selectedBefore && event.payload?.node?.id === selectedBefore) this.select(this.layout.nodeMap.get(selectedBefore),null,false);
    else if (selectedBefore) this.renderRelated(selectedBefore);
    if (this.searchIds) this.searchIds = this.searchIds.filter(id=>this.layout.nodeMap.has(id));
    this.updateReadout(); this.showEmpty(!this.layout.nodes.length,"Nenhuma memória persistente ainda","Ative Memória no chat quando quiser recuperar e guardar contexto.");
  }
  async search(query) {
    if (!query) { this.clearSearch(); return; }
    const token = ++this.searchToken;
    $("globe-data-status").textContent = "Buscando relações…";
    try {
      const hits = await retrieveMemories(this.userId,query);
      if (token !== this.searchToken) return;
      this.searchIds = [...new Set([...hits.map(hit=>hit.memory?.id),...this.layout.entities.filter(node=>node.data.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(node=>node.id)])].filter(id=>this.layout.nodeMap.has(id));
      this.searchIndex = 0; this.renderer?.setHighlights(this.searchIds); this.setList(true);
      $("search-results").hidden = false; this.stepSearch(0);
    } catch(error) { $("globe-data-status").textContent = error instanceof ApiError ? error.message : "Busca indisponível. Tente novamente."; }
  }
  stepSearch(delta) {
    const ids = this.searchIds || []; this.searchIndex = ids.length ? (this.searchIndex+delta+ids.length)%ids.length : 0;
    $("search-summary").textContent = ids.length ? ids.length + " resultados · " + (this.searchIndex+1) + " de " + ids.length : "Nenhuma memória relacionada a esta busca.";
    $("search-next").disabled = $("search-previous").disabled = ids.length < 2;
    if (ids.length) this.renderer?.focusOn(ids[this.searchIndex]);
  }
  clearSearch() {
    this.searchToken = (this.searchToken || 0)+1; this.searchIds = null; $("globe-search").value = "";
    $("search-results").hidden = true; this.renderer?.setHighlights([]); this.renderList();
  }
  hover(node,event) {
    $("globe-tooltip").hidden = !node;
    if (node) {
      $("globe-tooltip").textContent = label(node);
      $("globe-tooltip").style.left = Math.max(0,Math.min(event.offsetX+12,$("memory-globe").clientWidth-230)) + "px";
      $("globe-tooltip").style.top = Math.max(0,event.offsetY-40) + "px";
    }
  }
  setMode(mode) {
    if (mode === "memory" && !this.selectedId) return;
    this.mode = mode; this.renderer?.setMode(mode);
    document.querySelectorAll("[data-globe-view]").forEach(button=>{
      button.setAttribute("aria-pressed",String(button.dataset.globeView === mode));
      if (button.dataset.globeView === "memory") button.disabled = !this.selectedId;
    });
    this.renderList();
  }
  async select(node,trigger=document.activeElement,moveFocus=true) {
    if (!node) { this.clearSelection(); return; }
    if (trigger && !$("memory-inspector").contains(trigger)) this.selectionReturn = trigger;
    if (moveFocus && this.renderer) { this.selectionFromList = !$("memory-list-panel").hidden; this.setList(false); }
    this.selectedId = node.id; this.renderer?.setSelected(node.id); this.renderer?.setInspectorOpen?.(true);
    $("memory-inspector").hidden = false;
    $("memory-globe-shell").classList.add("has-inspector");
    $("memory-inspector-title").textContent = label(node);
    $("memory-inspector-kind").textContent = node.source === "entity" ? "Entidade" : (kinds[node.data.kind] || "Memória") + " · " + RING_LABELS[node.ring];
    $("memory-inspector-body").textContent = node.source === "entity" ? "Entidade ligada às memórias abaixo." : node.data.content;
    $("memory-inspector-meta").replaceChildren();
    if (node.source === "memory") {
      for (const [name,value] of [["Importância",node.data.importance == null ? null : Math.round(node.data.importance*100)+"%"],["Confiança",node.data.confidence == null ? null : Math.round(node.data.confidence*100)+"%"],["Menções",node.data.mention_count],["Origem",node.data.source],["Criada",node.data.created_at ? new Date(node.data.created_at).toLocaleDateString("pt-BR") : null],["Atualizada",node.data.updated_at ? new Date(node.data.updated_at).toLocaleDateString("pt-BR") : null]]) {
        if (value == null) continue;
        const dt=document.createElement("dt"),dd=document.createElement("dd"); dt.textContent=name;dd.textContent=String(value);$("memory-inspector-meta").append(dt,dd);
      }
    }
    $("memory-forget").hidden = $("memory-ask").hidden = node.source !== "memory";
    this.renderRelated(node.id); this.setMode(this.mode);
    $("memory-provenance").textContent = node.source === "memory" ? "Recuperando proveniência…" : "";
    if (moveFocus) $("memory-inspector-title").focus();
    if (node.source !== "memory") return;
    const token = this.explanationToken = (this.explanationToken || 0)+1;
    try {
      const explanation = await getMemoryExplanation(this.userId,node.id);
      if (this.selectedId !== node.id || token !== this.explanationToken) return;
      $("memory-provenance").replaceChildren();
      if (explanation.sources?.length) {
        const h=document.createElement("h3"); h.textContent="Proveniência"; const ul=document.createElement("ul");
        for(const source of explanation.sources) { const li=document.createElement("li"); li.textContent=[source.source_type,source.source_reference,source.excerpt].filter(Boolean).join(" · ");ul.append(li); }
        $("memory-provenance").append(h,ul);
      }
    } catch { if (this.selectedId === node.id && token === this.explanationToken) $("memory-provenance").textContent = "Não foi possível recuperar a proveniência. Selecione novamente para tentar."; }
  }
  renderRelated(id) {
    $("memory-related").replaceChildren();
    for (const node of relatedNodes(this.layout,id)) {
      const button=document.createElement("button");button.type="button";button.textContent=label(node);
      button.addEventListener("click",()=>{ this.select(node,button);this.renderer?.focusOn(node.id); });$("memory-related").append(button);
    }
    if (!$("memory-related").children.length) $("memory-related").textContent="Nenhuma relação retornada.";
  }
  clearSelection(restore=true) {
    this.selectedId=null; this.explanationToken=(this.explanationToken||0)+1;
    this.renderer?.setSelected(null);this.renderer?.setInspectorOpen?.(false);$("memory-inspector").hidden=true;
    $("memory-globe-shell").classList.remove("has-inspector");
    if (restore && this.selectionFromList) this.setList(true);
    if(this.mode==="memory")this.setMode("orbital");else this.setMode(this.mode);
    if(restore) {
      // List reconciliation replaces its buttons; restore by the stable graph ID.
      const original=this.selectionReturn;
      const target=original?.dataset.nodeId ? [...$("memory-list").querySelectorAll("button")].find(button=>button.dataset.nodeId===original.dataset.nodeId) : original;
      if(target?.isConnected && target.getClientRects().length) target.focus();else $("globe-list-toggle").focus();
    }
  }
  openDeleteConfirmation(value,trigger=$("prompt")) {
    const confirmation=normalizeMemoryDeleteConfirmation(value);if(!confirmation||this.deleting)return;
    this.pendingDeletion=confirmation;this.deleteReturn=trigger;
    $("memory-delete-target").textContent="Alvo: "+confirmation.label;
    $("memory-delete-consequence").textContent=confirmation.consequence;
    $("memory-delete-error").hidden=true;
    $("memory-delete-confirm").disabled=$("memory-delete-cancel").disabled=false;
    if(!$("memory-delete-dialog").open)$("memory-delete-dialog").showModal();
    $("memory-delete-cancel").focus();
  }
  closeDeleteConfirmation() {
    if(this.deleting)return;
    $("memory-delete-dialog").close();this.pendingDeletion=null;
    if(this.deleteReturn?.isConnected&&this.deleteReturn.getClientRects().length)this.deleteReturn.focus();
    else if($("prompt").getClientRects().length)$("prompt").focus();else $("globe-list-toggle").focus();
  }
  async confirmDeletion() {
    if(!this.pendingDeletion||this.deleting)return;
    const id=this.pendingDeletion.memory_id;this.deleting=true;
    $("memory-delete-confirm").disabled=$("memory-delete-cancel").disabled=true;
    try {
      await deleteMemory(this.userId,id);
      this.handleRealtimeEvent({type:"MEMORY_DELETED",payload:{memory_id:id}});
      this.deleting=false;this.closeDeleteConfirmation();
      $("globe-data-status").textContent="Memória esquecida e relações removidas";
    } catch(error) {
      this.deleting=false;$("memory-delete-error").textContent=error instanceof ApiError?error.message:"Não foi possível esquecer. Tente novamente.";
      $("memory-delete-error").hidden=false;$("memory-delete-confirm").disabled=$("memory-delete-cancel").disabled=false;
      $("memory-delete-cancel").focus();
    }
  }
  keyboard(event) {
    if($("memory-delete-dialog").open)return;
    const inspector=$("memory-inspector"),expanded=$("memory-globe-shell").classList.contains("expanded");
    if(event.key==="Tab"&&expanded){
      const buttons=[...$("memory-globe-shell").querySelectorAll('button:not(:disabled),input:not(:disabled),select,summary,a[href],[tabindex="0"]')].filter(el=>el.getClientRects().length);
      if(event.shiftKey&&document.activeElement===buttons[0]){buttons.at(-1)?.focus();event.preventDefault();}
      if(!event.shiftKey&&document.activeElement===buttons.at(-1)){buttons[0]?.focus();event.preventDefault();}
    }
    if(event.key!=="Escape")return;
    const details=$("memory-globe-shell").querySelector("details[open]");
    if(details){details.open=false;details.querySelector("summary").focus();event.preventDefault();return;}
    if(!inspector.hidden){this.clearSelection();event.preventDefault();return;}
    if(this.mode==="memory"){this.setMode("orbital");event.preventDefault();return;}
    if(!$("memory-list-panel").hidden&&this.renderer){this.setList(false);$("globe-list-toggle").focus();event.preventDefault();}
  }
}
