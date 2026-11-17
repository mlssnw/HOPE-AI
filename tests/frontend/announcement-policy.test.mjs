import test from "node:test";
import assert from "node:assert/strict";

import { announcementTarget } from "../../frontend/js/announcement-policy.js";

test("routine status has one polite announcement target", () => {
  assert.deepEqual(announcementTarget("Resposta concluída."), {
    polite: "Resposta concluída.",
    alert: "",
  });
});

test("actionable failure has one alert target and no polite duplicate", () => {
  assert.deepEqual(announcementTarget("Não foi possível reproduzir.", true), {
    polite: "",
    alert: "Não foi possível reproduzir.",
  });
});
