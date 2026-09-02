import test from "node:test";
import assert from "node:assert/strict";
import { safeUrl, tokenizeInline } from "../../frontend/js/renderer-core.js";

test("HTML e SVG permanecem texto inerte", () => {
  const payload = '<img src=x onerror="globalThis.pwned=true"><svg onload=alert(1)>';
  assert.deepEqual(tokenizeInline(payload), [{ type: "text", value: payload }]);
});

test("protocolos executáveis são rejeitados", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("data:text/html,<script>alert(1)</script>"), null);
  assert.match(safeUrl("https://example.com/a"), /^https:/);
});

test("markdown seguro produz tokens sem interpretar HTML", () => {
  assert.deepEqual(tokenizeInline("Olá **Hope** e `código`"), [
    { type: "text", value: "Olá " }, { type: "strong", value: "Hope" },
    { type: "text", value: " e " }, { type: "code", value: "código" },
  ]);
});
