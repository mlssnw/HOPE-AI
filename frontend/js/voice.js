export class VoiceInput {
  constructor(button, onResult, onStatus, lifecycle = {}) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.button = button;
    this.lifecycle = lifecycle;
    this.recognition = Recognition ? new Recognition() : null;
    this.reference = null;
    this.status = document.querySelector("#voice-status");
    if (!this.recognition) {
      button.disabled = true;
      button.title = "Ditado não suportado neste navegador";
      return;
    }
    this.recognition.lang = "pt-BR";
    this.recognition.interimResults = false;
    this.recognition.onstart = () => {
      if (!this.reference || !this.lifecycle.isCurrent?.(this.reference)) return;
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Parar ditado");
      button.querySelector("span").textContent = "Parar ditado";
      this.status.textContent = "Ouvindo. Toque em Parar ditado para encerrar.";
      this.lifecycle.onState?.("LISTENING", this.reference);
      onStatus("Ouvindo…");
    };
    this.recognition.onend = () => {
      const reference = this.reference;
      this.idle();
      if (reference) this.lifecycle.invalidate?.(reference);
      this.reference = null;
      if (this.status.textContent.startsWith("Ouvindo")) this.status.textContent = "Ditado encerrado.";
    };
    this.recognition.onerror = event => {
      const reference = this.reference;
      this.idle();
      if (reference) this.lifecycle.invalidate?.(reference);
      this.reference = null;
      const message = event.error === "not-allowed"
        ? "Microfone não autorizado. Permita o acesso nas configurações do navegador para tentar novamente."
        : "Não foi possível ouvir. Verifique o microfone e tente novamente.";
      this.status.textContent = message;
      onStatus(message, true);
    };
    this.recognition.onresult = event => {
      if (this.reference && this.lifecycle.isCurrent?.(this.reference)) {
        onResult(event.results[0][0].transcript);
      }
    };
    button.addEventListener("click", () => {
      if (this.isListening()) { this.stop(); return; }
      this.reference = this.lifecycle.begin?.() ?? null;
      try { this.recognition.start(); }
      catch {
        if (this.reference) this.lifecycle.invalidate?.(this.reference);
        this.reference = null;
        onStatus("Não foi possível iniciar o ditado. Tente novamente.", true);
      }
    });
  }

  idle() {
    this.button.setAttribute("aria-pressed", "false");
    this.button.setAttribute("aria-label", "Ditado por voz");
    this.button.querySelector("span").textContent = "Ditado";
    this.lifecycle.onState?.("IDLE", this.reference);
  }

  isListening() { return this.button.getAttribute("aria-pressed") === "true"; }
  stop() { this.recognition?.stop(); }
  cancel() {
    const reference = this.reference;
    this.recognition?.abort?.();
    this.idle();
    if (reference) this.lifecycle.invalidate?.(reference);
    this.reference = null;
  }
}
