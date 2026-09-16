import { ApiError, getHealth, requestSpeech, sendChat } from "./api-client.js";
import { clearHistory, getOrCreateUserId, loadHistory, loadPreferences, saveHistory, savePreferences } from "./storage.js";
import { addMessage, announce, elements, resetMessages, setBusy, setServiceStatus, showSources } from "./ui.js";
import { dispatchUiEvents } from "./ui-events.js";
import { dispatchMemoryDeleteConfirmation } from "./memory-confirmation.js";
import { VoiceInput } from "./voice.js";
import { signalOperation } from "./presentation-state.js";

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
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) { event.preventDefault(); this.submit(); }
    });
    elements.cancel.addEventListener("click", () => this.cancel());
    elements.clear.addEventListener("click", () => {
      this.history = []; clearHistory(); resetMessages(); announce("Histórico apagado deste dispositivo.");
    });
    elements.voice.addEventListener("click", () => {
      const enabled = elements.voice.getAttribute("aria-pressed") !== "true";
      elements.voice.setAttribute("aria-pressed", String(enabled)); this.savePreferences();
      if (!enabled) this.stopSpeech();
      announce(enabled ? "Leitura em voz ativada." : "Leitura em voz desativada.");
    });
    for (const input of [elements.memory, elements.persist, elements.web, elements.vault]) {
      input.addEventListener("change", () => {
        this.savePreferences();
        if (input === elements.persist && !input.checked) saveHistory([], false);
      });
    }
    document.querySelector("#speech-stop").addEventListener("click", () => this.stopSpeech());
    this.voiceInput = new VoiceInput(elements.mic, transcript => {
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
      this.health = health;
      elements.web.disabled = Boolean(this.abortController) || !health.tavily.configured || health.tavily.available === false;
      elements.vault.disabled = Boolean(this.abortController) || !health.obsidian.configured || health.obsidian.available === false;
      elements.voice.disabled = !health.elevenlabs.configured || health.elevenlabs.available === false;
      const voiceStatus = document.querySelector("#voice-status");
      if (elements.mic.getAttribute("aria-pressed") !== "true") voiceStatus.textContent =
        (elements.voice.disabled ? "Leitura indisponível." : "Leitura disponível.") +
        (elements.mic.disabled ? " Ditado não suportado neste navegador." : " Ditado depende da permissão do microfone.");
    } catch { announce("O backend local não respondeu.", true); }
  }

  cancel() {
    this.abortController?.abort();
    signalOperation("chat", "cancelled");
    this.stopSpeech();
    announce("Solicitação cancelada.");
  }

  stopSpeech() {
    this.speechController?.abort();
    if (this.audio) this.audio.pause();
    this.audio = null;
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audioUrl = null;
    document.querySelector("#speech-stop").hidden = true;
    signalOperation("voice", "idle");
  }

  async speak(text) {
    this.stopSpeech();
    const controller = new AbortController(); this.speechController = controller;
    document.querySelector("#speech-stop").hidden = false;
    try {
      const blob = await requestSpeech(text, controller.signal, this.userId);
      if (controller.signal.aborted) return;
      if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = URL.createObjectURL(blob); this.audio = new Audio(this.audioUrl);
      this.audio.addEventListener("playing", () => { if (this.speechController === controller && !controller.signal.aborted) signalOperation("voice", "speaking"); });
      this.audio.addEventListener("ended", () => { if (this.speechController === controller) this.stopSpeech(); }, { once:true });
      this.audio.addEventListener("error", () => {
        if (this.speechController !== controller || controller.signal.aborted) return;
        this.stopSpeech(); announce("Não foi possível reproduzir a voz. Tente a leitura novamente.", true);
      }, { once:true });
      await this.audio.play();
    } catch (error) {
      if (this.speechController !== controller) return;
      this.stopSpeech();
      if (error.name === "AbortError") return;
      announce(error instanceof ApiError ? error.message : "Não foi possível reproduzir a voz.", true);
    }
  }

  async submit() {
    const message = elements.prompt.value.trim();
    if (!message || this.abortController) return;
    elements.prompt.value = ""; addMessage("user", message);
    const previousHistory = this.history.slice(-20);
    this.history.push({ role: "user", content: message }); this.savePreferences();
    const controller = new AbortController();
    this.abortController = controller; setBusy(true); announce("Processando com segurança…");
    signalOperation("chat", "started");
    try {
      const result = await sendChat({ message, history: previousHistory,
        use_web: elements.web.checked, use_vault: elements.vault.checked,
        memory_enabled: elements.memory.checked }, controller.signal, this.userId);
      if (controller.signal.aborted) return;
      const article = addMessage("assistant", result.reply); showSources(result.sources, article, result.memories_used);
      signalOperation("chat", "finished");
      dispatchUiEvents(result.ui_events);
      dispatchMemoryDeleteConfirmation(result.memory_delete_confirmation);
      this.history.push({ role: "assistant", content: result.reply }); this.savePreferences();
      announce("Resposta concluída.");
      if (!elements.voice.disabled && elements.voice.getAttribute("aria-pressed") === "true") this.speak(result.reply);
    } catch (error) {
      if (error.name === "AbortError") { signalOperation("chat", "cancelled"); announce("Solicitação cancelada."); }
      else { signalOperation("chat", "error"); announce(error instanceof ApiError ? error.message : "Não foi possível concluir a solicitação.", true); }
    } finally {
      if (this.abortController === controller) {
        this.abortController = null; setBusy(false);
        await this.refreshHealth();
        // A destructive confirmation owns focus until it closes.
        if (!document.querySelector("dialog[open]")) elements.prompt.focus();
      }
    }
  }
}
