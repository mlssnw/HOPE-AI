const codePoints = value => Array.from(value).length;

export function createDisplayResponse(result, { responseVersion = 1 } = {}) {
  return Object.freeze({
    text: String(result?.reply ?? ""),
    sources: Array.isArray(result?.sources) ? result.sources : [],
    memoriesUsed: Array.isArray(result?.memories_used) ? result.memories_used : [],
    responseVersion,
  });
}

function plainSpokenText(markdown) {
  return markdown
    .replace(/```(?:[^\n]*)\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1, $2")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|[.,:;!?]|$)/g, "$1$2")
    .replace(/~~([^~\n]+)~~/g, "$1")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatSpokenResponse(
  display,
  { locale = "pt-BR", maxCodePoints = 5000 } = {},
) {
  const text = plainSpokenText(display?.text ?? "");
  const base = {
    locale,
    responseVersion: display?.responseVersion ?? 1,
    prosody: Object.freeze({ pace: "normal", emphasis: "semantic" }),
    pronunciation: Object.freeze([]),
    transformation: Object.freeze({ material: false, note: null }),
  };
  if (!text) return Object.freeze({ ...base, text: null, disabledReason: "empty" });
  if (codePoints(text) > maxCodePoints) {
    return Object.freeze({ ...base, text: null, disabledReason: "over-limit" });
  }
  return Object.freeze({ ...base, text, disabledReason: null });
}
