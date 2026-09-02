import { renderMarkdown, renderPlainText, renderSources } from "./renderer.js";

export const elements = {
  form: document.querySelector("#chat-form"), prompt: document.querySelector("#prompt"),
  messages: document.querySelector("#messages"), empty: document.querySelector("#empty-state"),
  sources: document.querySelector("#sources"), sourceList: document.querySelector("#sources-list"),
  send: document.querySelector("#send-button"), cancel: document.querySelector("#cancel-button"),
  clear: document.querySelector("#clear-history"), mic: document.querySelector("#mic-button"),
  voice: document.querySelector("#voice-toggle"), web: document.querySelector("#use-web"),
  vault: document.querySelector("#use-vault"), persist: document.querySelector("#persist-memory"),
  live: document.querySelector("#live-status"), clock: document.querySelector("#clock"),
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
}

export function resetMessages() {
  elements.messages.querySelectorAll(".message").forEach(node => node.remove());
  elements.empty.hidden = false; renderSources(elements.sources, elements.sourceList, []);
}
export function showSources(sources) { renderSources(elements.sources, elements.sourceList, sources); }
export function setBusy(busy) {
  elements.send.disabled = busy; elements.prompt.disabled = busy; elements.cancel.hidden = !busy;
  elements.web.disabled = busy; elements.vault.disabled = busy;
}
export function announce(message, error = false) {
  elements.live.textContent = message; elements.live.classList.toggle("error", error);
}
export function setServiceStatus(id, configured, available = null) {
  const element = document.querySelector(`#${id}`);
  const online = configured && available !== false;
  element.dataset.state = online ? "online" : "offline";
  element.title = !configured ? "Não configurado" : available === false ? "Indisponível" : "Configurado";
}
