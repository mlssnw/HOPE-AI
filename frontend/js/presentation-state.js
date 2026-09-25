export function initialQuality(width) {
  return width <= 680 ? "low" : width < 1280 ? "medium" : "high";
}
export function operationalState(current, event) {
  const next = { ...current };
  if (event.source === "chat") {
    if (event.state === "started") { next.cancelled = false; next.chat = "thinking"; }
    if (event.state === "cancelled") { next.cancelled = true; next.chat = "idle"; next.remote = "idle"; }
    if (event.state === "finished") { next.chat = "idle"; next.remote = "idle"; }
    if (event.state === "error") { next.chat = "error"; next.remote = "idle"; }
  } else if (event.source === "voice") {
    next.voice = ["listening", "speaking"].includes(event.state) ? event.state : "idle";
  } else if (event.source === "realtime" && !next.cancelled) {
    next.remote = ["thinking", "searching", "speaking", "error"].includes(event.state) ? event.state : "idle";
  }
  return next;
}
export function stateLabel(state) {
  return { thinking:"Analisando", searching:"Recuperando contexto", speaking:"HOPE falando", listening:"Ouvindo", error:"Falha — verifique a mensagem" }[state] || "HOPE disponível";
}
export function displayedState(state) {
  return [state.chat, state.voice, state.remote].sort((a,b) =>
    ["idle","listening","thinking","searching","speaking","error"].indexOf(b) -
    ["idle","listening","thinking","searching","speaking","error"].indexOf(a))[0] || "idle";
}
export function signalOperation(source, state) {
  globalThis.dispatchEvent(new CustomEvent("hope:operation", { detail:{ source, state } }));
}
