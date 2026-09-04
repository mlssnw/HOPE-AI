const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeMemoryDeleteConfirmation(value) {
  if (!value || !UUID_PATTERN.test(value.memory_id || "")) return null;
  const label = typeof value.label === "string" ? value.label.trim().slice(0, 160) : "";
  if (!label) return null;
  const consequence = typeof value.consequence === "string" && value.consequence.trim()
    ? value.consequence.trim().slice(0, 300)
    : "A memória e suas relações serão removidas permanentemente.";
  return { memory_id: value.memory_id, label, consequence };
}

export function dispatchMemoryDeleteConfirmation(value, target = globalThis) {
  const confirmation = normalizeMemoryDeleteConfirmation(value);
  if (confirmation) {
    target.dispatchEvent(new CustomEvent("hope:confirm-memory-delete", { detail: confirmation }));
  }
}
