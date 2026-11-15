import { DEFAULT_MODES, normalizeModes } from "./modes.js";

const LABELS = Object.freeze({
  FOCUS: "Foco",
  SUPPORTIVE: "Apoio",
  PRESENTATION: "Apresentação",
  PRIVATE: "Privado",
  SILENT: "Sem voz",
  DO_NOT_DISTURB: "Não perturbe",
  PUBLIC: "Público",
});

export function activeModeLabels(input = {}) {
  const modes = normalizeModes(input);
  return Object.entries(modes)
    .filter(([axis, value]) => value !== DEFAULT_MODES[axis])
    .map(([, value]) => LABELS[value]);
}

export class ModeController {
  constructor(root, { onChange = () => {} } = {}) {
    this.root = root;
    this.onChange = onChange;
    this.summary = root.querySelector("summary");
    this.active = root.querySelector("[data-mode-active]");
    this.resolution = root.querySelector("[data-mode-resolution]");
    root.addEventListener("change", () => this.update(true));
    root.addEventListener("keydown", event => {
      if (event.key !== "Escape" || !root.open) return;
      event.preventDefault(); event.stopPropagation(); this.close();
    });
    this.update(false);
  }

  snapshot() {
    const values = {};
    for (const axis of Object.keys(DEFAULT_MODES)) {
      values[axis] = this.root.querySelector(`input[name="mode-${axis}"]:checked`)?.value;
    }
    return normalizeModes(values);
  }

  update(notify) {
    const modes = this.snapshot();
    const labels = activeModeLabels(modes);
    this.active.textContent = labels.length ? labels.join(" · ") : "Padrão";
    const restrictions = [];
    if (modes.privacy === "PRIVATE") restrictions.push("sem memória e sem novo histórico local");
    if (modes.audience === "PUBLIC") restrictions.push("sem memória privada");
    if (modes.output === "SILENT") restrictions.push("sem síntese de voz");
    if (modes.interruption === "DO_NOT_DISTURB") restrictions.push("sem frases opcionais");
    this.resolution.textContent = restrictions.length
      ? `Para novos turnos: ${restrictions.join("; ")}.`
      : "Para novos turnos: preferências padrão da sessão.";
    if (notify) this.onChange(modes);
    return modes;
  }

  close() { this.root.open = false; this.summary.focus(); }
}
