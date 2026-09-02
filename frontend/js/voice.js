export class VoiceInput {
  constructor(button, onResult, onStatus) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.button = button; this.recognition = Recognition ? new Recognition() : null;
    if (!this.recognition) { button.disabled = true; button.title = "Ditado não suportado neste navegador"; return; }
    this.recognition.lang = "pt-BR"; this.recognition.interimResults = false;
    this.recognition.onstart = () => { button.setAttribute("aria-pressed", "true"); onStatus("Ouvindo…"); };
    this.recognition.onend = () => { button.setAttribute("aria-pressed", "false"); };
    this.recognition.onerror = event => onStatus(`Não foi possível ouvir: ${event.error}.`, true);
    this.recognition.onresult = event => onResult(event.results[0][0].transcript);
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") this.recognition.stop();
      else this.recognition.start();
    });
  }
}
