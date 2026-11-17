import test from "node:test";
import assert from "node:assert/strict";

import { SessionHistory } from "../../frontend/js/session-history.js";

test("a private turn never enters the persisted subset after mode restoration", () => {
  const history = new SessionHistory([{ role: "assistant", content: "anterior" }]);
  const privateTurn = { historyEligible: false };
  history.append("user", "segredo", privateTurn);
  history.append("assistant", "resposta privada", privateTurn);
  const laterTurn = { historyEligible: true };
  history.append("user", "público depois", laterTurn);
  history.append("assistant", "resposta depois", laterTurn);

  assert.deepEqual(history.visible.map(item => item.content), [
    "anterior", "segredo", "resposta privada", "público depois", "resposta depois",
  ]);
  assert.deepEqual(history.persistable.map(item => item.content), [
    "anterior", "público depois", "resposta depois",
  ]);
});

test("switching to private preserves records saved before the switch", () => {
  const history = new SessionHistory([
    { role: "user", content: "já salvo" },
    { role: "assistant", content: "já salva" },
  ]);
  history.append("user", "não salvar", { historyEligible: false });
  assert.deepEqual(history.persistable, [
    { role: "user", content: "já salvo" },
    { role: "assistant", content: "já salva" },
  ]);
});

test("public history projection fails closed for legacy, private and memory-derived records", () => {
  const history = new SessionHistory([
    { role: "user", content: "legacy sem proveniência" },
    { role: "assistant", content: "resposta legacy" },
  ]);
  const privatePolicy = { modes: { audience: "PRIVATE", privacy: "STANDARD" } };
  const publicPolicy = { modes: { audience: "PUBLIC", privacy: "STANDARD" } };

  history.append("user", "segredo atual", privatePolicy, {
    trust: "PRIVATE",
    audience: "PRIVATE",
  });
  history.append("assistant", "resposta derivada de memória", privatePolicy, {
    trust: "PRIVATE",
    audience: "PRIVATE",
    memoryDerived: true,
  });
  history.append("user", "pergunta pública", publicPolicy, {
    trust: "PUBLIC_SAFE",
    audience: "PUBLIC",
  });
  history.append("assistant", "resposta pública", publicPolicy, {
    trust: "PUBLIC_SAFE",
    audience: "PUBLIC",
  });

  assert.deepEqual(history.recentFor(publicPolicy, 20), [
    { role: "user", content: "pergunta pública" },
    { role: "assistant", content: "resposta pública" },
  ]);
  assert.equal(history.visible.length, 6);
  assert.equal(history.persistable.length, 6);
  assert.deepEqual(Object.keys(history.persistable[0]).sort(), ["content", "role"]);
});

test("public projection never trusts a public label without explicit safe provenance", () => {
  const publicPolicy = { modes: { audience: "PUBLIC", privacy: "STANDARD" } };
  const history = new SessionHistory();
  history.append("user", "sem marca confiável", publicPolicy);
  history.append("assistant", "contaminada", publicPolicy, {
    trust: "PUBLIC_SAFE",
    audience: "PUBLIC",
    memoryDerived: true,
  });

  assert.deepEqual(history.recentFor(publicPolicy), []);
  assert.deepEqual(history.recentFor({ modes: { audience: "PUBLIC", privacy: "PRIVATE" } }), []);
});
