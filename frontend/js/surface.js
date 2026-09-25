export class SurfaceController {
  constructor() {
    this.workspace = document.querySelector("#workspace");
    this.globe = document.querySelector("#memory-globe-shell");
    this.conversation = document.querySelector("#conversation");
    this.controls = document.querySelector("#surface-switcher");
    this.media = matchMedia("(max-width:980px)");
    this.surface = "conversation"; this.expanded = false;
    document.querySelector("#show-memory").addEventListener("click", event => this.show("memory", event.currentTarget));
    document.querySelector("#show-conversation").addEventListener("click", () => this.show("conversation"));
    document.querySelector("#globe-close").addEventListener("click", () => this.show("conversation"));
    document.querySelector("#globe-expand").addEventListener("click", event => this.expand(!this.expanded, event.currentTarget));
    document.querySelector(".skip-link").addEventListener("click", () => this.show("conversation", null, false));
    this.media.addEventListener("change", () => this.apply());
    globalThis.addEventListener("hope:show-surface", event => this.show(event.detail, document.activeElement));
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) return;
      if (!document.querySelector("#memory-inspector").hidden) return;
      const openDetails = document.querySelector("details[open]");
      if (openDetails) { openDetails.open = false; openDetails.querySelector("summary").focus(); event.preventDefault(); return; }
      if (this.expanded) { this.expand(false); event.preventDefault(); }
      else if (this.media.matches && this.surface === "memory") { this.show("conversation"); event.preventDefault(); }
    });
    this.apply();
  }
  show(surface, trigger = null, moveFocus = true) {
    if (trigger && surface === "memory") this.returnFocus = trigger;
    if (this.expanded && surface === "conversation") this.expand(false);
    this.surface = surface; this.apply();
    if (moveFocus) {
      const destination = surface === "memory" ? document.querySelector("#globe-search") : this.returnFocus || document.querySelector("#prompt");
      destination?.focus();
    }
  }
  expand(value, trigger) {
    this.expanded = value; if (trigger) this.expandTrigger = trigger;
    this.globe.classList.toggle("expanded", value);
    this.globe.setAttribute("role", value ? "dialog" : "region");
    if (value) this.globe.setAttribute("aria-modal", "true"); else this.globe.removeAttribute("aria-modal");
    this.conversation.inert = value; document.querySelector(".topbar").inert = value; this.controls.inert = value;
    const button = document.querySelector("#globe-expand");
    button.setAttribute("aria-pressed", String(value)); button.textContent = value ? "Recolher" : "Expandir";
    if (value) document.querySelector("#globe-search").focus(); else this.expandTrigger?.focus();
    globalThis.dispatchEvent(new Event("resize"));
  }
  apply() {
    this.workspace.dataset.surface = this.surface;
    // DOM order follows the actual reading order on each breakpoint.
    if (this.media.matches) { this.workspace.prepend(this.conversation); this.workspace.append(this.globe); }
    else { this.workspace.prepend(this.globe); this.workspace.append(this.controls); }
    document.querySelector("#show-memory").setAttribute("aria-pressed", String(this.surface === "memory"));
    document.querySelector("#show-conversation").setAttribute("aria-pressed", String(this.surface === "conversation"));
    globalThis.dispatchEvent(new Event("resize"));
  }
}
