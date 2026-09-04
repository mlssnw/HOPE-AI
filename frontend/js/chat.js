import { ApiError, getHealth, requestSpeech, sendChat } from "./api-client.js";
import { clearHistory, getOrCreateUserId, loadHistory, loadPreferences, saveHistory, savePreferences } from "./storage.js";
import { addMessage, announce, elements, resetMessages, setBusy, setServiceStatus, showSources } from "./ui.js";
import { dispatchUiEvents } from "./ui-events.js";
import { dispatchMemoryDeleteConfirmation } from "./memory-confirmation.js";
import { VoiceInput } from "./voice.js";

export class ChatController {
  constructor() {
    this.userId = getOrCreateUserId();
    this.preferences = loadPreferences();
    this.history = loadHistory(this.preferences.persist);
    this.abortController = null; this.audio = null; this.audioUrl = null;
    elements.persist.checked = this.preferences.persist;
    elements.memory.checked = this.preferences.memoryEnabled;
    elements.web.checked = this.preferences.useWeb;
    elements.vault.checked = this.preferences.useVault;
    elements.voice.setAttribute("aria-pressed", String(this.preferences.voice));
    this.history.forEach(item => addMessage(item.role, item.content));
    this.bind(); this.refreshHealth();
  }

  bind() {
    elements.form.addEventListener("submit", event => { event.preventDefault(); this.submit(); });
    elements.prompt.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); this.submit(); }
    });
    elements.cancel.addEventListener("click", () => this.cancel());
    elements.clear.addEventListener("click", () => {
      this.history = []; clearHistory(); resetMessages(); announce("Histórico apagado deste dispositivo.");
    });
    elements.voice.addEventListener("click", () => {
      const enabled = elements.voice.getAttribute("aria-pressed") !== "true";
      elements.voice.setAttribute("aria-pressed", String(enabled)); this.savePreferences();
      announce(enabled ? "Leitura em voz ativada." : "Leitura em voz desativada.");
    });
    for (const input of [elements.memory, elements.persist, elements.web, elements.vault]) {
      input.addEventListener("change", () => {
        this.savePreferences();
        if (input === elements.persist && !input.checked) saveHistory([], false);
      });
    }
    new VoiceInput(elements.mic, transcript => {
      elements.prompt.value = [elements.prompt.value, transcript].filter(Boolean).join(" ");
      elements.prompt.focus(); announce("Ditado adicionado à mensagem.");
    }, announce);
  }

  savePreferences() {
    this.preferences = { persist: elements.persist.checked, useWeb: elements.web.checked,
      useVault: elements.vault.checked, voice: elements.voice.getAttribute("aria-pressed") === "true",
      memoryEnabled: elements.memory.checked };
    savePreferences(this.preferences); saveHistory(this.history, this.preferences.persist);
  }

  async refreshHealth() {
    try {
      const health = await getHealth();
      setServiceStatus("claude-status", health.claude.configured, health.claude.available);
      setServiceStatus("vault-status", health.obsidian.configured, health.obsidian.available);
      setServiceStatus("web-status", health.tavily.configured, health.tavily.available);
      elements.web.disabled = !health.tavily.configured;
      elements.vault.disabled = !health.obsidian.configured || health.obsidian.available === false;
      elements.voice.disabled = !health.elevenlabs.configured;
    } catch { announce("O backend local não respondeu.", true); }
  }

  cancel() {
    this.abortController?.abort();
    if (this.audio) this.audio.pause();
    announce("Cancelando solicitação…");
  }

  async speak(text) {
    try {
      const controller = new AbortController(); const blob = await requestSpeech(text, controller.signal, this.userId);
      if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = URL.createObjectURL(blob); this.audio = new Audio(this.audioUrl);
      await this.audio.play();
    } catch (error) {
      announce(error instanceof ApiError ? error.message : "Não foi possível reproduzir a voz.", true);
    }
  }

  async submit() {
    const message = elements.prompt.value.trim();
    if (!message || this.abortController) return;
    elements.prompt.value = ""; addMessage("user", message); showSources([]);
    const previousHistory = this.history.slice(-20);
    this.history.push({ role: "user", content: message }); this.savePreferences();
    const controller = new AbortController();
    this.abortController = controller; setBusy(true); announce("Processando com segurança…");
    try {
      const result = await sendChat({ message, history: previousHistory,
        use_web: elements.web.checked, use_vault: elements.vault.checked,
        memory_enabled: elements.memory.checked }, controller.signal, this.userId);
      addMessage("assistant", result.reply); showSources(result.sources);
      dispatchUiEvents(result.ui_events);
      dispatchMemoryDeleteConfirmation(result.memory_delete_confirmation);
      this.history.push({ role: "assistant", content: result.reply }); this.savePreferences();
      announce("Resposta concluída.");
      if (elements.voice.getAttribute("aria-pressed") === "true") this.speak(result.reply);
    } catch (error) {
      if (error.name === "AbortError") announce("Solicitação cancelada.");
      else announce(error instanceof ApiError ? error.message : "Não foi possível concluir a solicitação.", true);
    } finally {
      if (this.abortController === controller) {
        this.abortController = null; setBusy(false); await this.refreshHealth(); elements.prompt.focus();
      }
    }
  }
}
