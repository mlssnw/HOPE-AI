import assert from "node:assert/strict";
import test from "node:test";

import { deleteMemory } from "../../frontend/js/api-client.js";
import { normalizeMemoryDeleteConfirmation } from "../../frontend/js/memory-confirmation.js";

const memoryId = "fd6fb1eb-e91a-4f2a-bc1b-c2c4e855eb1b";

test("confirmação de exclusão exige UUID e alvo legível", () => {
  assert.equal(normalizeMemoryDeleteConfirmation({ memory_id: "invalido", label: "alvo" }), null);
  assert.equal(normalizeMemoryDeleteConfirmation({ memory_id: memoryId, label: "   " }), null);
  assert.deepEqual(normalizeMemoryDeleteConfirmation({ memory_id: memoryId, label: " Preferência " }), {
    memory_id: memoryId,
    label: "Preferência",
    consequence: "A memória e suas relações serão removidas permanentemente.",
  });
});

test("cliente vincula a confirmação ao mesmo ID enviado na rota", async () => {
  let captured;
  globalThis.fetch = async (url, options) => {
    captured = { url, options };
    return { ok: true };
  };
  await deleteMemory("e5d19016-c1c8-49ae-a186-90b6507ebcde", memoryId);
  assert.equal(captured.url, `/api/memories/${memoryId}`);
  assert.equal(captured.options.method, "DELETE");
  assert.equal(captured.options.headers["X-Hope-Confirm-Memory-Id"], memoryId);
});
