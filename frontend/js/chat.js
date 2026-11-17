import { ApiError, getHealth, requestSpeech, sendChat } from "./api-client.js";
import { ModeController } from "./mode-controller.js";
import { resolveModes } from "./modes.js";
import { createDisplayResponse } from "./response-presentation.js";
import { SessionHistory } from "./session-history.js";
import { publicSelfKnowledge, renderPublicSelfKnowledge } from "./self-knowledge.js";
import { clearHistory, getOrCreateUserId, loadHistory, loadPreferences, saveHistory, savePreferences } from "./storage.js";
import { addMessage, addSpeechAction, announce, elements, resetMessages, setBusy, setServiceStatus, showSources } from "./ui.js";
import { dispatchUiEvents } from "./ui-events.js";
import { dispatchMemoryDeleteConfirmation } from "./memory-confirmation.js";
import { TurnManager } from "./turn-manager.js";
import { buildChatPayload } from "./turn-request.js";
import { LocalAudioMeter } from "./voice-level.js";
import { VoiceManager } from "./voice-manager.js";
import { VoiceStateManager, VOICE_STATE_LABELS } from "./voice-state.js";
import { VoiceInput } from "./voice.js";
import { signalOperation } from "./presentation-state.js";

export class ChatController {
  constructor() {
    this.userId = getOrCreateUserId();
    this.preferences = loadPreferences();
    this.memoryPreference = this.preferences.memoryEnabled;
    this.sessionHistory = new SessionHistory(loadHistory(this.preferences.persist));
    this.abortController = null;
    this.activeTurn = null;
    this.turns = new TurnManager();
    this.states = new VoiceStateManager(this.turns, {
      onChange: state => this.presentVoiceState(state),
    });
    this.voiceManager = new VoiceManager({
      turnManager: this.turns,
      stateManager: this.states,
      requestSpeech: (text, signal) => requestSpeech(text, signal, this.userId),
      meterFactory: (audio, onLevel) => new LocalAudioMeter(audio, onLevel),
      onVoiceLevel: value => dispatchEvent(new CustomEvent("hope:voice-level", { detail: { value } })),
      onPlaybackState: state => { document.querySelector("#speech-stop").hidden = state === "idle"; },
      onError: error => announce(
        error instanceof ApiError ? error.message : "Não foi possível reproduzir a voz.",
        true,
      ),
    });

    elements.persist.checked = this.preferences.persist;
    elements.memory.checked = this.memoryPreference;
    elements.web.checked = this.preferences.useWeb;
    elements.vault.checked = this.preferences.useVault;
    elements.voice.setAttribute("aria-pressed", String(this.preferences.voice));
    this.sessionHistory.visible.forEach(item => addMessage(item.role, item.content));
    this.modeController = new ModeController(document.querySelector("#modes-control"), {
      onChange: modes => this.applyModes(modes, true),
    });
    this.currentModes = this.modeController.snapshot();
    renderPublicSelfKnowledge(document.querySelector("#self-knowledge-content"), publicSelfKnowledge({}));
    this.bind();
    this.applyModes(this.currentModes, false);
    this.refreshHealth();
  }

  presentVoiceState(state) {
    const source = ["recognition", "playback"].includes(state.source) ? "voice" : "chat";
    signalOperation(source, state.state.toLowerCase());
    if (!["IDLE", "ERROR"].includes(state.state)) announce(VOICE_STATE_LABELS[state.state]);
  }

  bind() {
    elements.form.addEventListener("submit", event => { event.preventDefault(); this.submit(); });
    elements.prompt.addEventListener("keydown", event => {
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
        event.preventDefault(); this.submit();
      }
    });
    elements.cancel.addEventListener("click", () => this.cancel());
    elements.clear.addEventListener("click", () => {
      this.sessionHistory.clear(); clearHistory(); resetMessages();
      announce("Histórico apagado deste dispositivo.");
    });
    elements.voice.addEventListener("click", () => {
      const enabled = elements.voice.getAttribute("aria-pressed") !== "true";
      elements.voice.setAttribute("aria-pressed", String(enabled)); this.savePreferences();
      if (!enabled) this.stopSpeech();
      announce(enabled ? "Leitura em voz ativada." : "Leitura em voz desativada.");
    });
    elements.memory.addEventListener("change", () => {
      this.memoryPreference = elements.memory.checked; this.savePreferences();
    });
    for (const input of [elements.persist, elements.web, elements.vault]) {
      input.addEventListener("change", () => {
        this.savePreferences();
        if (input === elements.persist && !input.checked) saveHistory([], false);
      });
    }
    document.querySelector("#speech-stop").addEventListener("click", () => {
      this.stopSpeech(); announce("Leitura interrompida. A resposta completa permanece na tela.");
      elements.prompt.focus();
    });
    this.voiceInput = new VoiceInput(
      elements.mic,
      transcript => {
        elements.prompt.value = [elements.prompt.value, transcript].filter(Boolean).join(" ");
        elements.prompt.focus(); announce("Ditado adicionado à mensagem.");
      },
      (message, error) => announce(message, error),
      {
        beforeStart: () => this.stopSpeech(),
        begin: () => this.turns.begin(),
        isCurrent: reference => this.turns.isCurrent(reference),
        invalidate: reference => this.turns.cancel(reference),
        onState: (state, reference) => {
          if (state === "LISTENING") {
            this.states.transition({ state, source: "recognition", ...reference, timestamp: Date.now() });
          } else this.states.reset("recognition", reference);
        },
      },
    );
    document.addEventListener("keydown", event => this.handleEscape(event));
  }

  handleEscape(event) {
    if (event.key !== "Escape" || event.defaultPrevented || document.querySelector("dialog[open]")) return;
    if (this.modeController.root.open) { event.preventDefault(); this.modeController.close(); return; }
    const topbarLayer = document.querySelector(".topbar details[open]");
    if (topbarLayer) {
      event.preventDefault(); topbarLayer.open = false;
      topbarLayer.querySelector("summary")?.focus(); return;
    }
    if (this.voiceManager.active) { event.preventDefault(); this.stopSpeech(); elements.prompt.focus(); return; }
    if (this.voiceInput?.isListening()) { event.preventDefault(); this.voiceInput.stop(); return; }
    if (this.abortController) { event.preventDefault(); this.cancel(); elements.prompt.focus(); }
  }

  applyModes(modes, announceChange) {
    this.currentModes = modes;
    const restricted = modes.privacy === "PRIVATE" || modes.audience === "PUBLIC";
    elements.memory.checked = restricted ? false : this.memoryPreference;
    elements.memory.disabled = Boolean(this.abortController) || restricted;
    elements.memory.closest("label")?.classList.toggle("is-restricted", restricted);
    if (announceChange) {
      announce("Modos atualizados para novos turnos. Permissões e capacidades não mudaram.");
    }
  }

  savePreferences() {
    this.preferences = {
      persist: elements.persist.checked,
      useWeb: elements.web.checked,
      useVault: elements.vault.checked,
      voice: elements.voice.getAttribute("aria-pressed") === "true",
      memoryEnabled: this.memoryPreference,
    };
    savePreferences(this.preferences);
    saveHistory(this.sessionHistory.persistable, this.preferences.persist);
  }

  async refreshHealth() {
    try {
      const health = await getHealth();
      setServiceStatus("claude-status", health.claude.configured, health.claude.available);
      setServiceStatus("vault-status", health.obsidian.configured, health.obsidian.available);
      setServiceStatus("web-status", health.tavily.configured, health.tavily.available);
      this.health = health;
      renderPublicSelfKnowledge(
        document.querySelector("#self-knowledge-content"),
        publicSelfKnowledge({
          chat: health.claude.configured && health.claude.available !== false,
          memory: health.database?.configured && health.database?.available !== false,
          voice: health.elevenlabs.configured && health.elevenlabs.available !== false,
          web: health.tavily.configured && health.tavily.available !== false,
          obsidian: health.obsidian.configured && health.obsidian.available !== false,
        }),
      );
      elements.web.disabled = Boolean(this.abortController) || !health.tavily.configured || health.tavily.available === false;
      elements.vault.disabled = Boolean(this.abortController) || !health.obsidian.configured || health.obsidian.available === false;
      elements.voice.disabled = !health.elevenlabs.configured || health.elevenlabs.available === false;
      this.applyModes(this.currentModes, false);
      const voiceStatus = document.querySelector("#voice-status");
      if (elements.mic.getAttribute("aria-pressed") !== "true") {
        voiceStatus.textContent = (elements.voice.disabled ? "Leitura indisponível." : "Leitura disponível.")
          + (elements.mic.disabled ? " Ditado não suportado neste navegador." : " Ditado depende da permissão do microfone.");
      }
    } catch { announce("O backend local não respondeu.", true); }
  }

  cancel() {
    this.abortController?.abort();
    if (this.activeTurn) this.voiceManager.cancel(this.activeTurn.reference);
    else this.voiceManager.stopSpeech();
    this.voiceInput?.cancel();
    signalOperation("chat", "cancelled");
    announce("Solicitação cancelada.");
  }

  stopSpeech() { this.voiceManager.stopSpeech(); }

  async speak(display, reference) {
    const result = await this.voiceManager.speak(display, reference);
    if (result.reason === "over-limit") {
      announce("A resposta excede o limite de leitura; o texto completo continua disponível.", true);
    }
    return result;
  }

  async submit() {
    const message = elements.prompt.value.trim();
    if (!message || this.abortController) return;
    this.stopSpeech();
    const reference = this.turns.begin();
    const modes = this.modeController.snapshot();
    const policy = resolveModes(modes, {
      memoryRequested: this.memoryPreference,
      historyRequested: this.preferences.persist,
    });
    const turn = Object.freeze({ reference, modes, policy });
    this.activeTurn = turn;
    const previousHistory = this.sessionHistory.recentFor(policy, 20);
    const publicTurn = policy.modes.audience === "PUBLIC" && policy.modes.privacy === "STANDARD";
    elements.prompt.value = "";
    addMessage("user", message);
    this.sessionHistory.append("user", message, policy, {
      trust: publicTurn ? "PUBLIC_SAFE" : "PRIVATE",
      audience: policy.modes.audience,
    });
    this.savePreferences();
    const controller = new AbortController();
    this.abortController = controller; setBusy(true); this.applyModes(this.currentModes, false);
    this.states.transition({ state: "THINKING", source: "chat", ...reference, timestamp: Date.now() });
    try {
      const result = await sendChat(buildChatPayload({
        message,
        history: previousHistory,
        useWeb: elements.web.checked,
        useVault: elements.vault.checked,
        memoryRequested: this.memoryPreference,
        modes,
      }), controller.signal, this.userId);
      if (controller.signal.aborted || !this.turns.isCurrent(reference)) return;
      const display = createDisplayResponse(result, { responseVersion: reference.responseVersion });
      const article = addMessage("assistant", display.text);
      showSources(display.sources, article, display.memoriesUsed);
      this.states.reset("chat", reference);
      dispatchUiEvents(result.ui_events);
      dispatchMemoryDeleteConfirmation(result.memory_delete_confirmation);
      this.sessionHistory.append("assistant", display.text, policy, {
        trust: publicTurn && display.memoriesUsed.length === 0 ? "PUBLIC_SAFE" : "PRIVATE",
        audience: policy.modes.audience,
        memoryDerived: display.memoriesUsed.length > 0,
      });
      this.savePreferences();
      addSpeechAction(article, {
        enabled: policy.speechEnabled && !elements.voice.disabled,
        onPlay: () => this.speak(display, reference),
      });
      announce("Resposta concluída.");
      if (policy.speechEnabled && !elements.voice.disabled
        && elements.voice.getAttribute("aria-pressed") === "true") {
        await this.speak(display, reference);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        signalOperation("chat", "cancelled"); announce("Solicitação cancelada.");
      } else if (this.turns.isCurrent(reference)) {
        this.states.transition({ state: "ERROR", source: "chat", ...reference, timestamp: Date.now() });
        announce(error instanceof ApiError ? error.message : "Não foi possível concluir a solicitação.", true);
      }
    } finally {
      if (this.abortController === controller) {
        this.abortController = null; setBusy(false); this.applyModes(this.currentModes, false);
        await this.refreshHealth();
        if (!document.querySelector("dialog[open]")) elements.prompt.focus();
      }
    }
  }
}
