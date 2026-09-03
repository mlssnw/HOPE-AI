const SUPPORTED_UI_EVENTS = new Set(["FOCUS_MEMORIES"]);

export function normalizeUiEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.flatMap(event => {
    if (!event || !SUPPORTED_UI_EVENTS.has(event.type) || !Array.isArray(event.ids)) return [];
    const ids = [...new Set(event.ids.filter(id => typeof id === "string" && id.length <= 80))].slice(0, 50);
    return ids.length ? [{ type: event.type, ids }] : [];
  });
}

export function dispatchUiEvents(events, target = globalThis) {
  for (const event of normalizeUiEvents(events)) {
    target.dispatchEvent(new CustomEvent("hope:ui-event", { detail: event }));
  }
}
