import { renderMarkdown, renderPlainText, renderSources } from "./renderer.js";
import { announcementTarget } from "./announcement-policy.js";

export const elements = {
  form: document.querySelector("#chat-form"), prompt: document.querySelector("#prompt"),
  messages: document.querySelector("#messages"), empty: document.querySelector("#empty-state"),
  sources: document.querySelector("#sources"), sourceList: document.querySelector("#sources-list"),
  send: document.querySelector("#send-button"), cancel: document.querySelector("#cancel-button"),
  clear: document.querySelector("#clear-history"), mic: document.querySelector("#mic-button"),
  voice: document.querySelector("#voice-toggle"), web: document.querySelector("#use-web"),
  vault: document.querySelector("#use-vault"), memory: document.querySelector("#memory-enabled"),
  persist: document.querySelector("#persist-history"),
  live: document.querySelector("#live-status"), urgent: document.querySelector("#urgent-status"),
  clock: document.querySelector("#clock"),
};

export function addMessage(role, text) {
  elements.empty.hidden = true;
  const article = document.createElement("article"); article.className = `message ${role}`;
  const meta = document.createElement("p"); meta.className = "message-meta";
  meta.textContent = role === "user" ? "Você" : "HOPE";
  const body = document.createElement("div"); body.className = "message-body";
  if (role === "assistant") renderMarkdown(body, text); else renderPlainText(body, text);
  article.append(meta, body); elements.messages.append(article);
  elements.messages.scrollTop = elements.messages.scrollHeight;
  return article;
}

export function resetMessages() {
  elements.messages.querySelectorAll(".message").forEach(node => node.remove());
  elements.empty.hidden = false;
}
export function showSources(sources, article, memoryIds = []) {
  if (!article || (!sources.length && !memoryIds.length)) return;
  const panel = document.createElement("details"); panel.className = "message-context";
  const summary = document.createElement("summary"); summary.textContent = "Fontes e memórias desta resposta";
  const list = document.createElement("ul"); panel.append(summary,list);
  renderSources(panel,list,sources);
  for (const id of memoryIds) {
    const item=document.createElement("li"),button=document.createElement("button");button.type="button";
    button.textContent="Ver memória usada";
    button.addEventListener("click",()=>dispatchEvent(new CustomEvent("hope:inspect-memory",{detail:id})));
    item.append(button);list.append(item);
  }
  panel.hidden=false;article.append(panel);
}
export function addSpeechAction(article, { enabled, onPlay }) {
  if (!article) return null;
  const actions = document.createElement("div"); actions.className = "message-actions";
  const button = document.createElement("button"); button.type = "button";
  button.className = "message-speech"; button.textContent = "Ouvir resposta";
  button.disabled = !enabled;
  button.title = enabled ? "Reproduzir esta resposta" : "Leitura em voz indisponível para este turno";
  button.addEventListener("click", onPlay);
  actions.append(button); article.append(actions);
  return button;
}
export function setBusy(busy) {
  elements.send.disabled = busy; elements.prompt.disabled = busy; elements.cancel.hidden = !busy;
  elements.web.disabled = busy; elements.vault.disabled = busy; elements.memory.disabled = busy;
  elements.persist.disabled = busy;
}
export function announce(message, error = false) {
  const target = announcementTarget(message, error);
  elements.live.textContent = target.polite;
  elements.live.classList.toggle("error", false);
  elements.urgent.textContent = target.alert;
}
export function setServiceStatus(id, configured, available = null) {
  const element = document.querySelector(`#${id}`);
  const online = configured && available !== false;
  element.dataset.state = online ? "online" : "offline";
  element.title = !configured ? "Não configurado" : available === false ? "Indisponível" : "Configurado";
  element.textContent = ({ "claude-status":"Chat", "vault-status":"Obsidian", "web-status":"Web" }[id] || id) + ": " + (online ? "disponível" : "indisponível");
}
