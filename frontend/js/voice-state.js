export const VOICE_STATES = Object.freeze([
  "IDLE", "LISTENING", "THINKING", "SEARCHING", "SPEAKING", "ALERT", "ERROR",
]);

export const VOICE_STATE_LABELS = Object.freeze({
  IDLE: "HOPE disponível",
  LISTENING: "Ouvindo",
  THINKING: "Analisando",
  SEARCHING: "Recuperando contexto",
  SPEAKING: "HOPE falando",
  ALERT: "Atenção necessária",
  ERROR: "Falha — verifique a mensagem",
});

const PRECEDENCE = Object.freeze({
  IDLE: 0, LISTENING: 1, THINKING: 2, SEARCHING: 3,
  SPEAKING: 4, ALERT: 5, ERROR: 5,
});
const sameReference = (left, right) => left?.sessionId === right?.sessionId
  && left?.turnId === right?.turnId && left?.attemptId === right?.attemptId
  && left?.responseVersion === right?.responseVersion;

export class VoiceStateManager {
  constructor(turnManager, { now = () => Date.now(), onChange = () => {} } = {}) {
    this.turnManager = turnManager;
    this.now = now;
    this.onChange = onChange;
    this.current = Object.freeze({ state: "IDLE", source: "system", timestamp: this.now() });
  }

  transition(event) {
    if (!VOICE_STATES.includes(event?.state)) return false;
    if (event.expiresAt != null && event.expiresAt <= this.now()) return false;
    if (event.state !== "IDLE" && !this.turnManager.isCurrent(event)) return false;
    if (event.state === "SPEAKING" && event.source !== "playback") return false;
    if (event.state === "LISTENING" && event.source !== "recognition") return false;
    if (event.state === this.current.state && sameReference(this.current, event)) return false;
    if (sameReference(this.current, event)
      && PRECEDENCE[event.state] < PRECEDENCE[this.current.state]) return false;
    this.current = Object.freeze({ ...event });
    this.onChange(this.current);
    return true;
  }

  reset(source = "system", reference = null) {
    if (reference && !this.turnManager.isCurrent(reference)) return false;
    if (this.current.state === "IDLE") return false;
    this.current = Object.freeze({ state: "IDLE", source, timestamp: this.now() });
    this.onChange(this.current);
    return true;
  }
}
