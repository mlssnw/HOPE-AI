import test from "node:test";
import assert from "node:assert/strict";
import { requestSpeech } from "../../frontend/js/api-client.js";

test("overlength speech is rejected before any network request", async () => {
  let calls = 0;
  const previous = globalThis.fetch;
  globalThis.fetch = async () => { calls++; return {ok:true, headers:new Headers({"content-type":"audio/mpeg"}), blob:async()=>new Blob()}; };
  try {
    await assert.rejects(requestSpeech("a".repeat(5000) + " warning"), /limite/i);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = previous; }
});

test("the complete exact-limit Unicode rendition reaches the existing path", async () => {
  let sent;
  const previous = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    sent = JSON.parse(options.body).text;
    return {ok:true, headers:new Headers({"content-type":"audio/mpeg"}), blob:async()=>new Blob()};
  };
  try {
    const text = "😀".repeat(5000);
    await requestSpeech(text);
    assert.equal(sent, text);
  } finally { globalThis.fetch = previous; }
});
