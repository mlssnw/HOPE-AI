import test from "node:test";
import assert from "node:assert/strict";

import {
  createDisplayResponse,
  formatSpokenResponse,
} from "../../frontend/js/response-presentation.js";
import { TurnManager } from "../../frontend/js/turn-manager.js";
import { VoiceStateManager } from "../../frontend/js/voice-state.js";
import { DEFAULT_MODES, resolveModes } from "../../frontend/js/modes.js";
import { PhraseLibrary, APPROVED_PHRASE_IDS, createPhraseContext } from "../../frontend/js/phrase-library.js";
import { publicSelfKnowledge } from "../../frontend/js/self-knowledge.js";
import { calculateVoiceLevel } from "../../frontend/js/voice-level.js";
import { activeModeLabels } from "../../frontend/js/mode-controller.js";
import { buildChatPayload } from "../../frontend/js/turn-request.js";

test("display stays canonical while spoken markdown is a separate representation", () => {
  const display = createDisplayResponse({
    reply: "**Atenção:** confirme `rm item` antes de apagar. Custo: R$ 25,00.",
    sources: [],
  }, { responseVersion: 3 });
  const spoken = formatSpokenResponse(display);

  assert.equal(display.text, "**Atenção:** confirme `rm item` antes de apagar. Custo: R$ 25,00.");
  assert.equal(spoken.text, "Atenção: confirme rm item antes de apagar. Custo: R$ 25,00.");
  assert.equal(spoken.responseVersion, 3);
  assert.equal(spoken.transformation.material, false);
});

test("speech refuses an oversized material warning instead of truncating it", () => {
  const warning = `AVISO: não apague o banco. ${"x".repeat(5000)}`;
  const spoken = formatSpokenResponse(createDisplayResponse({ reply: warning, sources: [] }));

  assert.equal(spoken.text, null);
  assert.equal(spoken.disabledReason, "over-limit");
  assert.equal(warning.endsWith("x"), true);
});

test("speech counts Unicode code points at the exact boundary", () => {
  const atLimit = `⚠${"a".repeat(4999)}`;
  const overLimit = `${atLimit}b`;
  assert.equal(formatSpokenResponse(createDisplayResponse({ reply: atLimit, sources: [] })).text, atLimit);
  assert.equal(formatSpokenResponse(createDisplayResponse({ reply: overLimit, sources: [] })).text, null);
});

test("speech preserves identifiers, URLs, dates, numbers and destructive confirmations", () => {
  const canonical = "Confirme antes de executar `rm file_name`. Alvo: https://example.com/a_b?x=1 em 2026-11-14. Custo: R$ 25,00.";
  const spoken = formatSpokenResponse(createDisplayResponse({ reply: canonical, sources: [] }));
  assert.equal(spoken.text, "Confirme antes de executar rm file_name. Alvo: https://example.com/a_b?x=1 em 2026-11-14. Custo: R$ 25,00.");
});

test("turn manager rejects stale sessions, attempts and response versions", () => {
  const turns = new TurnManager({ sessionId: "session-a" });
  const first = turns.begin();
  const retry = turns.retry(first);
  const second = turns.begin();

  assert.equal(first.turnId, 1);
  assert.equal(retry.attemptId, 2);
  assert.equal(turns.isCurrent(first), false);
  assert.equal(turns.isCurrent(retry), false);
  assert.equal(turns.isCurrent(second), true);
  assert.equal(turns.isCurrent({ ...second, sessionId: "session-b" }), false);
  assert.equal(turns.isCurrent({ ...second, responseVersion: 99 }), false);
  turns.cancel(second);
  assert.equal(turns.isCurrent(second), false);
});

test("voice state rejects executing, stale events and expired transitions", () => {
  const turns = new TurnManager({ sessionId: "voice-session" });
  const turn = turns.begin();
  const states = new VoiceStateManager(turns, { now: () => 100 });

  assert.equal(states.transition({ state: "THINKING", source: "chat", ...turn, timestamp: 90 }), true);
  assert.equal(states.current.state, "THINKING");
  assert.equal(states.transition({ state: "EXECUTING", source: "chat", ...turn, timestamp: 95 }), false);
  assert.equal(states.transition({ state: "SPEAKING", source: "playback", ...turn, attemptId: 99, timestamp: 96 }), false);
  assert.equal(states.transition({ state: "ALERT", source: "chat", ...turn, timestamp: 90, expiresAt: 99 }), false);
  assert.equal(states.current.state, "THINKING");
  const newer = turns.begin();
  states.transition({ state: "THINKING", source: "chat", ...newer, timestamp: 100 });
  assert.equal(states.reset("recognition", turn), false);
  assert.equal(states.current.state, "THINKING");
  assert.equal(states.transition({ state: "ALERT", source: "chat", ...newer, timestamp: 101 }), true);
  assert.equal(states.transition({ state: "THINKING", source: "chat", ...newer, timestamp: 102 }), false);
  assert.equal(states.current.state, "ALERT");
});

test("mode resolution is deterministic and restrictions beat style", () => {
  const resolved = resolveModes({
    style: "PRESENTATION",
    privacy: "PRIVATE",
    output: "VOICE",
    interruption: "DO_NOT_DISTURB",
    audience: "PUBLIC",
  }, { memoryRequested: true, historyRequested: true });

  assert.equal(resolved.presentationMode, "PRESENTATION");
  assert.equal(resolved.memoryEnabled, false);
  assert.equal(resolved.historyEligible, false);
  assert.equal(resolved.speechEnabled, true);
  assert.equal(resolved.phrasesAllowed, false);
  assert.deepEqual(resolveModes({}, {}).modes, DEFAULT_MODES);
});

test("silent output blocks speech without changing the selected style", () => {
  const resolved = resolveModes({ style: "FOCUS", output: "SILENT" }, {});
  assert.equal(resolved.presentationMode, "FOCUS");
  assert.equal(resolved.speechEnabled, false);
});

test("mode control summary exposes only active non-default restrictions", () => {
  assert.deepEqual(activeModeLabels(DEFAULT_MODES), []);
  assert.deepEqual(activeModeLabels({
    ...DEFAULT_MODES,
    style: "FOCUS",
    privacy: "PRIVATE",
    output: "SILENT",
  }), ["Foco", "Privado", "Sem voz"]);
});

test("turn request sends only the authorized style field and fails memory closed", () => {
  const payload = buildChatPayload({
    message: "dados",
    history: [{ role: "user", content: "antes" }],
    useWeb: true,
    useVault: false,
    memoryRequested: true,
    modes: { ...DEFAULT_MODES, style: "FOCUS", audience: "PUBLIC" },
  });
  assert.deepEqual(payload, {
    message: "dados",
    history: [{ role: "user", content: "antes" }],
    use_web: true,
    use_vault: false,
    memory_enabled: false,
    presentation_mode: "FOCUS",
  });
});

test("phrase library is fail-closed, exact and null by default", () => {
  const library = new PhraseLibrary();
  assert.deepEqual([...APPROVED_PHRASE_IDS], [
    "P7-PHRASE-006", "P7-PHRASE-007", "P7-PHRASE-008", "P7-PHRASE-009",
    "P7-PHRASE-010", "P7-PHRASE-011", "P7-PHRASE-012", "P7-PHRASE-013",
    "P7-PHRASE-014", "P7-PHRASE-015", "P7-PHRASE-016", "P7-PHRASE-017",
    "P7-PHRASE-018",
  ]);
  assert.equal(library.select({}), null);
  assert.equal(library.select({ candidateId: "P7-PHRASE-021", eligible: true }), null);
  assert.equal(library.select({ candidateId: "P7-PHRASE-013", eligible: true, substantiveReady: true }), null);
  const verified = createPhraseContext("P7-PHRASE-013", {
    rootCauseVerified: true, lowRisk: true,
  }, { eligibleTurn: 1 });
  assert.equal(library.select(verified).text, "Já achei o problema.");
  assert.equal(library.select(verified), null);
});

test("phrase suppression covers modes and serious contexts", () => {
  for (const context of [
    { interruption: "DO_NOT_DISTURB" }, { privacy: "PRIVATE" }, { audience: "PUBLIC" },
    { safetyCritical: true }, { seriousError: true }, { modeEntry: true }, { style: "FOCUS" },
  ]) {
    const library = new PhraseLibrary();
    const eligible = createPhraseContext("P7-PHRASE-010", {
      criteriaCompared: true, alternativeIdentified: true, lowRisk: true,
    }, { eligibleTurn: 1, ...context });
    assert.equal(library.select(eligible), null);
  }
});

test("phrase cooldown and session limit are enforced on trusted eligible turns", () => {
  const library = new PhraseLibrary();
  const evidence = { criteriaCompared: true, alternativeIdentified: true, lowRisk: true };
  const first = library.select(createPhraseContext("P7-PHRASE-010", evidence, { eligibleTurn: 1 }));
  const tooSoon = library.select(createPhraseContext("P7-PHRASE-010", evidence, { eligibleTurn: 8 }));
  const second = library.select(createPhraseContext("P7-PHRASE-010", evidence, { eligibleTurn: 9 }));
  const overSessionLimit = library.select(createPhraseContext("P7-PHRASE-010", evidence, { eligibleTurn: 20 }));
  assert.equal(first.text, "Tenho uma solução melhor.");
  assert.equal(tooSoon, null);
  assert.equal(second.text, "Tenho uma solução melhor.");
  assert.equal(overSessionLimit, null);
});

test("public self knowledge uses capability signals and exposes no protected fields", () => {
  const manifest = publicSelfKnowledge({ voice: false, memory: true, web: false });
  assert.equal(manifest.name, "HOPE");
  assert.equal(manifest.capabilities.memory.status, "IMPLEMENTED");
  assert.equal(manifest.capabilities.voice.status, "UNAVAILABLE");
  assert.equal(manifest.capabilities.web.status, "UNAVAILABLE");
  const encoded = JSON.stringify(manifest);
  for (const forbidden of ["system_prompt", "chain_of_thought", "secret", "credential", "owner_id", "internal_path"]) {
    assert.equal(encoded.includes(forbidden), false);
  }
});

test("public self knowledge distinguishes implemented, partial, planned and unavailable", () => {
  const manifest = publicSelfKnowledge({ chat: true, memory: true, voice: true, web: false });
  assert.equal(manifest.capabilities.chat.status, "IMPLEMENTED");
  assert.equal(manifest.capabilities.voice.status, "PARTIAL");
  assert.equal(manifest.capabilities.automations.status, "PLANNED");
  assert.equal(manifest.capabilities.web.status, "UNAVAILABLE");
});

test("synthetic PCM amplitude is clamped, smoothed and resettable", () => {
  const samples = new Float32Array([1, -1, 1, -1]);
  const first = calculateVoiceLevel(samples, 0);
  const second = calculateVoiceLevel(samples, first);
  assert.ok(first > 0 && first <= 1);
  assert.ok(second >= first && second <= 1);
  assert.equal(calculateVoiceLevel(new Float32Array(4), second, { reset: true }), 0);
});
