const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^\s)]+\)|\*[^*\n]+\*)/g;

export function safeUrl(value) {
  try {
    const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(value, origin);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function tokenizeInline(text) {
  const tokens = [];
  let cursor = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    if (match.index > cursor) tokens.push({ type: "text", value: text.slice(cursor, match.index) });
    const value = match[0];
    if (value.startsWith("**")) tokens.push({ type: "strong", value: value.slice(2, -2) });
    else if (value.startsWith("`")) tokens.push({ type: "code", value: value.slice(1, -1) });
    else if (value.startsWith("[")) {
      const parts = value.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      tokens.push(parts && safeUrl(parts[2])
        ? { type: "link", value: parts[1], href: safeUrl(parts[2]) }
        : { type: "text", value });
    } else tokens.push({ type: "em", value: value.slice(1, -1) });
    cursor = match.index + value.length;
  }
  if (cursor < text.length) tokens.push({ type: "text", value: text.slice(cursor) });
  return tokens;
}
