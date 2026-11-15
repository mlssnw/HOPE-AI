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
