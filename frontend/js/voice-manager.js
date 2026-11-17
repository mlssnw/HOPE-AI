import { formatSpokenResponse } from "./response-presentation.js";

const defaultCreateUrl = blob => URL.createObjectURL(blob);
const defaultRevokeUrl = url => URL.revokeObjectURL(url);
const defaultAudio = url => new Audio(url);

export class VoiceManager {
  constructor({
    turnManager,
    stateManager,
    requestSpeech,
    audioFactory = defaultAudio,
    createObjectURL = defaultCreateUrl,
    revokeObjectURL = defaultRevokeUrl,
    onVoiceLevel = () => {},
    onError = () => {},
    onPlaybackState = () => {},
    meterFactory = null,
  }) {
    this.turnManager = turnManager;
    this.stateManager = stateManager;
    this.requestSpeech = requestSpeech;
    this.audioFactory = audioFactory;
    this.createObjectURL = createObjectURL;
    this.revokeObjectURL = revokeObjectURL;
    this.onVoiceLevel = onVoiceLevel;
    this.onError = onError;
    this.onPlaybackState = onPlaybackState;
    this.meterFactory = meterFactory;
    this.active = null;
    this.audio = null;
    this.audioUrl = null;
    this.meter = null;
  }

  async speak(displayResponse, reference) {
    const spoken = formatSpokenResponse(displayResponse);
    if (!spoken.text) return { started: false, reason: spoken.disabledReason };
    if (!this.turnManager.isCurrent(reference)) return { started: false, reason: "stale" };

    this.stopSpeech();
    const controller = new AbortController();
    const active = { reference, controller, responseVersion: spoken.responseVersion };
    this.active = active;
    this.onPlaybackState("preparing");
    try {
      const blob = await this.requestSpeech(spoken.text, controller.signal);
      if (controller.signal.aborted || this.active !== active || !this.turnManager.isCurrent(reference)) {
        if (this.active === active) { this.active = null; this.onPlaybackState("idle"); }
        return { started: false, reason: "stale" };
      }
      this.audioUrl = this.createObjectURL(blob);
      const audio = this.audioFactory(this.audioUrl);
      this.audio = audio;
      const stillCurrent = () => this.active === active && !controller.signal.aborted
        && this.turnManager.isCurrent(reference);
      audio.addEventListener("playing", () => {
        if (!stillCurrent()) return;
        this.stateManager.transition({
          state: "SPEAKING", source: "playback", ...reference, timestamp: Date.now(),
        });
        this.onPlaybackState("playing");
        this.meter = this.meterFactory?.(audio, value => {
          if (stillCurrent()) this.onVoiceLevel(value);
        }) ?? null;
        this.meter?.start?.();
      });
      audio.addEventListener("ended", () => { if (stillCurrent()) this.finishPlayback(); }, { once: true });
      audio.addEventListener("pause", () => { if (stillCurrent()) this.finishPlayback(); });
      audio.addEventListener("error", () => {
        if (!stillCurrent()) return;
        this.stopSpeech();
        this.onError("Não foi possível reproduzir a voz. Tente a leitura novamente.");
      }, { once: true });
      await audio.play();
      return { started: true, spoken };
    } catch (error) {
      if (this.active !== active || controller.signal.aborted || error?.name === "AbortError") {
        return { started: false, reason: "stale" };
      }
      this.stopSpeech();
      this.onError(error);
      return { started: false, reason: "error", error };
    }
  }

  finishPlayback() {
    const reference = this.active?.reference;
    this.releasePlayback();
    this.active = null;
    this.stateManager.reset("playback", reference);
    this.onPlaybackState("idle");
  }

  releasePlayback() {
    this.meter?.stop?.();
    this.meter = null;
    this.onVoiceLevel(0);
    if (this.audioUrl) this.revokeObjectURL(this.audioUrl);
    this.audioUrl = null;
    this.audio = null;
  }

  stopSpeech() {
    const hadActivity = Boolean(this.active || this.audio || this.audioUrl || this.meter);
    const reference = this.active?.reference;
    this.active?.controller.abort();
    this.audio?.pause?.();
    this.releasePlayback();
    this.active = null;
    if (hadActivity) {
      this.stateManager.reset("playback", reference);
      this.onPlaybackState("idle");
    }
  }

  cancel(reference) {
    this.stopSpeech();
    this.turnManager.cancel(reference);
  }
}
