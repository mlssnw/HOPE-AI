const BASE = Object.freeze({
  version: "phase-7.1",
  name: "HOPE",
  identity: "Assistente pessoal de IA original para um único owner.",
  inspirations: Object.freeze([
    "inteligência estratégica e elegância científica",
    "inventividade, rapidez e humor seco",
    "pragmatismo, lealdade e franqueza",
  ]),
  limitations: Object.freeze([
    "Não possui consciência ou emoções humanas.",
    "Não executa ferramentas, automações ou efeitos externos nesta fase.",
    "Não possui wake word, verificação de locutor ou operação entre dispositivos.",
  ]),
});

const capability = (available, implemented = true) => Object.freeze({
  status: available ? (implemented ? "IMPLEMENTED" : "PARTIAL") : "UNAVAILABLE",
  available: Boolean(available),
});

export function publicSelfKnowledge(signals = {}) {
  return Object.freeze({
    ...BASE,
    capabilities: Object.freeze({
      chat: capability(signals.chat !== false),
      memory: capability(signals.memory),
      voice: capability(signals.voice, false),
      web: capability(signals.web),
      obsidian: capability(signals.obsidian),
      automations: Object.freeze({ status: "PLANNED", available: false }),
    }),
  });
}

export function renderPublicSelfKnowledge(container, manifest) {
  container.replaceChildren();
  const identity = document.createElement("p");
  identity.textContent = `${manifest.name} — ${manifest.identity}`;
  const list = document.createElement("dl");
  for (const [name, capabilityValue] of Object.entries(manifest.capabilities)) {
    const term = document.createElement("dt"); term.textContent = name;
    const detail = document.createElement("dd"); detail.textContent = capabilityValue.status;
    list.append(term, detail);
  }
  const limitationTitle = document.createElement("strong");
  limitationTitle.textContent = "Limitações atuais";
  const limitations = document.createElement("ul");
  for (const value of manifest.limitations) {
    const item = document.createElement("li"); item.textContent = value; limitations.append(item);
  }
  container.append(identity, list, limitationTitle, limitations);
}
