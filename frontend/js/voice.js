import { signalOperation } from "./presentation-state.js";
export class VoiceInput {
  constructor(button,onResult,onStatus) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.button=button; this.recognition=Recognition ? new Recognition() : null;
    const status=document.querySelector("#voice-status");
    if(!this.recognition){button.disabled=true;button.title="Ditado não suportado neste navegador";return;}
    this.recognition.lang="pt-BR"; this.recognition.interimResults=false;
    const idle=()=>{
      button.setAttribute("aria-pressed","false");button.setAttribute("aria-label","Ditado por voz");
      button.querySelector("span").textContent="Ditado";signalOperation("voice","idle");
    };
    this.recognition.onstart=()=>{
      button.setAttribute("aria-pressed","true");button.setAttribute("aria-label","Parar ditado");
      button.querySelector("span").textContent="Parar ditado";status.textContent="Ouvindo. Toque em Parar ditado para encerrar.";
      signalOperation("voice","listening");onStatus("Ouvindo…");
    };
    this.recognition.onend=()=>{idle();if(status.textContent.startsWith("Ouvindo"))status.textContent="Ditado encerrado.";};
    this.recognition.onerror=event=>{
      idle();
      const message=event.error==="not-allowed" ? "Microfone não autorizado. Permita o acesso nas configurações do navegador para tentar novamente." : "Não foi possível ouvir. Verifique o microfone e tente novamente.";
      status.textContent=message;onStatus(message,true);
    };
    this.recognition.onresult=event=>onResult(event.results[0][0].transcript);
    button.addEventListener("click",()=>{
      try { if(button.getAttribute("aria-pressed")==="true")this.recognition.stop();else this.recognition.start(); }
      catch { onStatus("Não foi possível iniciar o ditado. Tente novamente.",true); }
    });
  }
}
