const HISTORY_KEY = "hope.history.v1";
const PREFS_KEY = "hope.preferences.v1";
const USER_ID_KEY = "hope.user-id.v1";

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function loadPreferences() {
  const value = read(PREFS_KEY, {});
  return { persist: Boolean(value.persist), useWeb: Boolean(value.useWeb),
    useVault: Boolean(value.useVault), voice: Boolean(value.voice),
    memoryEnabled: Boolean(value.memoryEnabled) };
}

export function savePreferences(value) { localStorage.setItem(PREFS_KEY, JSON.stringify(value)); }
export function loadHistory(enabled) { return enabled ? read(HISTORY_KEY, []).slice(-40) : []; }
export function saveHistory(history, enabled) {
  if (enabled) localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-40)));
  else localStorage.removeItem(HISTORY_KEY);
}
export function clearHistory() { localStorage.removeItem(HISTORY_KEY); }

export function getOrCreateUserId() {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing || "")) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(USER_ID_KEY, created);
  return created;
}
