import assert from "node:assert/strict";
import test from "node:test";

import { normalizeUiEvents } from "../../frontend/js/ui-events.js";

test("normaliza FOCUS_MEMORIES sem aceitar eventos arbitrários", () => {
  assert.deepEqual(normalizeUiEvents([
    { type: "FOCUS_MEMORIES", ids: ["memory-1", "memory-1", 7, "memory-2"] },
    { type: "RUN_SCRIPT", ids: ["danger"] },
  ]), [{ type: "FOCUS_MEMORIES", ids: ["memory-1", "memory-2"] }]);
});

test("tolera ui_events ausentes ou inválidos", () => {
  assert.deepEqual(normalizeUiEvents(undefined), []);
  assert.deepEqual(normalizeUiEvents([{ type: "FOCUS_MEMORIES", ids: "memory-1" }]), []);
});
