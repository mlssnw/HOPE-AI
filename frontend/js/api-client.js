export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = "ApiError"; this.status = status; }
}

async function parseError(response) {
  try { const body = await response.json(); return body.detail || "A solicitação falhou."; }
  catch { return "A solicitação falhou."; }
}

export async function getHealth() {
  const response = await fetch("/api/health", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return response.json();
}

function memoryHeaders(userId) {
  return { Accept: "application/json", "X-Hope-User-Id": userId };
}

export async function getMemoryGraph(userId, signal) {
  const response = await fetch("/api/memories/graph?limit=500", {
    signal, headers: memoryHeaders(userId),
  });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return response.json();
}

export async function retrieveMemories(userId, query, signal) {
  const params = new URLSearchParams({ q: query, limit: "50" });
  const response = await fetch(`/api/memories/retrieve?${params}`, {
    signal, headers: memoryHeaders(userId),
  });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return response.json();
}

export async function getMemoryExplanation(userId, memoryId, signal) {
  const response = await fetch(`/api/memories/${encodeURIComponent(memoryId)}/explanation`, {
    signal, headers: memoryHeaders(userId),
  });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  return response.json();
}

export async function sendChat(payload, signal, userId) {
  const response = await fetch("/api/chat", {
    method: "POST", signal, headers: {
      "Content-Type": "application/json", Accept: "application/json",
      ...(userId ? { "X-Hope-User-Id": userId } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  const body = await response.json();
  if (!body || typeof body.reply !== "string" || !Array.isArray(body.sources)) {
    throw new ApiError("O servidor retornou uma resposta inesperada.");
  }
  body.ui_events = Array.isArray(body.ui_events) ? body.ui_events : [];
  body.memories_used = Array.isArray(body.memories_used) ? body.memories_used : [];
  return body;
}

export async function requestSpeech(text, signal, userId) {
  const response = await fetch("/api/tts", {
    method: "POST", signal, headers: {
      "Content-Type": "application/json",
      ...(userId ? { "X-Hope-User-Id": userId } : {}),
    },
    body: JSON.stringify({ text: text.slice(0, 5000) }),
  });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);
  if (!response.headers.get("content-type")?.startsWith("audio/")) {
    throw new ApiError("O serviço de voz não retornou áudio válido.");
  }
  return response.blob();
}
