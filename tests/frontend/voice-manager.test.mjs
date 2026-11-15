import test from "node:test";
import assert from "node:assert/strict";

import { createDisplayResponse } from "../../frontend/js/response-presentation.js";
import { TurnManager } from "../../frontend/js/turn-manager.js";
import { VoiceStateManager } from "../../frontend/js/voice-state.js";
import { VoiceManager } from "../../frontend/js/voice-manager.js";

class FakeAudio {
  constructor() { this.listeners = new Map(); this.paused = false; this.playCalls = 0; }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  async play() { this.playCalls += 1; }
  pause() { this.paused = true; }
  emit(name) { this.listeners.get(name)?.(); }
}

test("speaking starts only on real playback and resets on end", async () => {
  const turns = new TurnManager({ sessionId: "voice" });
  const turn = turns.begin();
  const transitions = [];
  const playback = [];
  const states = new VoiceStateManager(turns, { onChange: value => transitions.push(value.state) });
  const audio = new FakeAudio();
  const manager = new VoiceManager({
    turnManager: turns,
    stateManager: states,
    requestSpeech: async () => ({ type: "audio/mpeg" }),
    audioFactory: () => audio,
    createObjectURL: () => "blob:test",
    revokeObjectURL: () => {},
    onPlaybackState: value => playback.push(value),
  });

  const result = await manager.speak(createDisplayResponse({ reply: "Resposta", sources: [] }), turn);
  assert.equal(result.started, true);
  assert.equal(states.current.state, "IDLE");
  audio.emit("playing");
  assert.equal(states.current.state, "SPEAKING");
  audio.emit("ended");
  assert.equal(states.current.state, "IDLE");
  assert.deepEqual(transitions, ["SPEAKING", "IDLE"]);
  assert.deepEqual(playback, ["preparing", "playing", "idle"]);
});

test("stale synthesis completion cannot create or play audio", async () => {
  const turns = new TurnManager({ sessionId: "voice" });
  const first = turns.begin();
  let resolveSpeech;
  const pending = new Promise(resolve => { resolveSpeech = resolve; });
  let audioCreated = 0;
  const manager = new VoiceManager({
    turnManager: turns,
    stateManager: new VoiceStateManager(turns),
    requestSpeech: () => pending,
    audioFactory: () => { audioCreated += 1; return new FakeAudio(); },
    createObjectURL: () => "blob:test",
    revokeObjectURL: () => {},
  });
  const operation = manager.speak(createDisplayResponse({ reply: "Antiga", sources: [] }), first);
  turns.begin();
  resolveSpeech({ type: "audio/mpeg" });

  assert.deepEqual(await operation, { started: false, reason: "stale" });
  assert.equal(audioCreated, 0);
});

test("an external playback pause is a terminal reset", async () => {
  const turns = new TurnManager({ sessionId: "voice" });
  const turn = turns.begin();
  const audio = new FakeAudio();
  let level = .5;
  const states = new VoiceStateManager(turns);
  const manager = new VoiceManager({
    turnManager: turns,
    stateManager: states,
    requestSpeech: async () => ({ type: "audio/mpeg" }),
    audioFactory: () => audio,
    createObjectURL: () => "blob:test",
    revokeObjectURL: () => {},
    onVoiceLevel: value => { level = value; },
  });
  await manager.speak(createDisplayResponse({ reply: "Pausa", sources: [] }), turn);
  audio.emit("playing");
  audio.emit("pause");
  assert.equal(states.current.state, "IDLE");
  assert.equal(level, 0);
  assert.equal(manager.active, null);
});

test("cancel aborts synthesis, pauses playback and resets amplitude", async () => {
  const turns = new TurnManager({ sessionId: "voice" });
  const turn = turns.begin();
  const audio = new FakeAudio();
  let level = .7;
  const manager = new VoiceManager({
    turnManager: turns,
    stateManager: new VoiceStateManager(turns),
    requestSpeech: async () => ({ type: "audio/mpeg" }),
    audioFactory: () => audio,
    createObjectURL: () => "blob:test",
    revokeObjectURL: () => {},
    onVoiceLevel: value => { level = value; },
  });
  await manager.speak(createDisplayResponse({ reply: "Pare", sources: [] }), turn);
  audio.emit("playing");
  manager.cancel(turn);

  assert.equal(audio.paused, true);
  assert.equal(level, 0);
  assert.equal(turns.isCurrent(turn), false);
});

test("oversized speech never calls the TTS transport", async () => {
  const turns = new TurnManager({ sessionId: "voice" });
  const turn = turns.begin();
  let calls = 0;
  const manager = new VoiceManager({
    turnManager: turns,
    stateManager: new VoiceStateManager(turns),
    requestSpeech: async () => { calls += 1; },
  });
  const result = await manager.speak(
    createDisplayResponse({ reply: "x".repeat(5001), sources: [] }), turn,
  );
  assert.deepEqual(result, { started: false, reason: "over-limit" });
  assert.equal(calls, 0);
});
