import test from "node:test";
import assert from "node:assert/strict";

const values = new Map();
globalThis.localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, value),
  removeItem: key => values.delete(key),
};

const storage = await import("../../frontend/js/storage.js");

test("histórico só persiste com consentimento", () => {
  storage.saveHistory([{ role: "user", content: "privado" }], false);
  assert.deepEqual(storage.loadHistory(true), []);
  storage.saveHistory([{ role: "user", content: "permitido" }], true);
  assert.equal(storage.loadHistory(true)[0].content, "permitido");
});

test("limpar histórico remove os dados locais", () => {
  storage.saveHistory([{ role: "assistant", content: "apagar" }], true);
  storage.clearHistory();
  assert.deepEqual(storage.loadHistory(true), []);
});

test("identidade local de desenvolvimento é estável e válida", () => {
  const first = storage.getOrCreateUserId();
  const second = storage.getOrCreateUserId();
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f-]{36}$/i);
});
