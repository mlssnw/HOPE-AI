import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const { chromium } = await import(process.env.HOPE_PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.HOPE_CHROME_PATH,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const base = process.env.HOPE_BASE_URL || "http://127.0.0.1:8767";
const output = process.env.HOPE_EVIDENCE_DIR || "docs/evidence/phase-7";
const results = [];
await mkdir(output, { recursive: true });

const installSyntheticVoice = async page => page.addInitScript(() => {
  window.__voiceLevels = [];
  addEventListener("hope:voice-level", event => window.__voiceLevels.push(event.detail.value));
  class FixtureAudio extends EventTarget {
    constructor(url) { super(); this.url = url; window.fixtureAudio = this; }
    async play() {
      if (window.__failNextPlay) { window.__failNextPlay = false; throw new DOMException("autoplay denied", "NotAllowedError"); }
      this.dispatchEvent(new Event("playing"));
    }
    pause() { this.dispatchEvent(new Event("pause")); }
  }
  class Node { connect() { return this; } disconnect() {} }
  class FixtureAnalyser extends Node {
    constructor() { super(); this.fftSize = 256; }
    getFloatTimeDomainData(samples) {
      for (let index = 0; index < samples.length; index += 1) samples[index] = index % 2 ? -.42 : .42;
    }
  }
  window.Audio = FixtureAudio;
  window.AudioContext = class {
    constructor() { this.destination = new Node(); }
    createMediaElementSource() { return new Node(); }
    createAnalyser() { return new FixtureAnalyser(); }
    close() {}
  };
});

async function screenshot(page, name) {
  await page.evaluate(() => {
    const label = document.createElement("small");
    label.id = "phase-7-evidence-label";
    label.textContent = "Fase 7 · harness local · dados sintéticos";
    label.style.cssText = "position:fixed;right:0;bottom:0;z-index:9999;background:#030609;color:#fff8e9;padding:3px 6px;font:11px sans-serif";
    document.body.append(label);
  });
  await page.screenshot({ path: `${output}/${name}.png`, fullPage: true, animations: "disabled" });
  await page.locator("#phase-7-evidence-label").evaluate(node => node.remove());
}

async function ready(page) {
  await page.waitForFunction(() => document.querySelector("#memory-globe-shell")?.dataset.state === "ready");
}

async function scenario(name, run, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [], assetFailures = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" && !/Failed to load resource.*(422|503)/.test(message.text())) errors.push(message.text());
  });
  page.on("response", response => {
    if (response.status() >= 400 && /\/(js|styles)\//.test(response.url())) assetFailures.push(`${response.status()} ${response.url()}`);
  });
  try {
    await run(page, context);
    assert.deepEqual(errors, [], `${name}: console/page errors`);
    assert.deepEqual(assetFailures, [], `${name}: asset failures`);
    results.push({ name, status: "PASS" });
    console.log("PASS", name);
  } finally {
    await context.close();
  }
}

try {
  await scenario("five axes, privacy history and exact request snapshot", async page => {
    const requests = [];
    let ttsRequests = 0;
    page.on("request", request => {
      if (request.url().endsWith("/api/chat")) requests.push(request.postDataJSON());
      if (request.url().endsWith("/api/tts")) ttsRequests += 1;
    });
    await page.goto(base); await ready(page);
    await page.locator("#self-knowledge summary").click();
    const selfKnowledge = await page.locator("#self-knowledge-content").textContent();
    assert.match(selfKnowledge, /HOPE/);
    assert.match(selfKnowledge, /IMPLEMENTED|UNAVAILABLE/);
    assert.doesNotMatch(selfKnowledge, /system prompt|credential|internal path/i);
    await page.locator("#self-knowledge summary").click();
    await page.locator("#persist-history").check();
    await page.locator("#memory-enabled").check();
    await page.locator("#prompt").fill("turno padrão");
    await page.locator("#prompt").press("Enter");
    await page.waitForFunction(() => document.querySelectorAll(".message.assistant").length === 1);
    await page.locator("#voice-toggle").click();

    await page.locator("#modes-control summary").click();
    await page.locator('input[name="mode-style"][value="FOCUS"]').check();
    await page.locator('input[name="mode-privacy"][value="PRIVATE"]').check();
    await page.locator('input[name="mode-output"][value="SILENT"]').check();
    await page.locator('input[name="mode-interruption"][value="DO_NOT_DISTURB"]').check();
    await page.locator('input[name="mode-audience"][value="PUBLIC"]').check();
    assert.equal(await page.locator(".message.assistant").count(), 1);
    assert.match(await page.locator("#modes-control summary").textContent(), /Foco.*Privado.*Sem voz.*Não perturbe.*Público/);
    assert.equal(await page.locator("#memory-enabled").isChecked(), false);
    assert.equal(await page.locator("#memory-enabled").isDisabled(), true);
    await screenshot(page, "modes-restrictions");
    await page.locator("#modes-control summary").click();
    await page.locator("#prompt").fill("aguarde turno privado");
    await page.locator("#prompt").press("Enter");
    await page.locator("#modes-control summary").click();
    await page.locator('input[name="mode-style"][value="NORMAL"]').check();
    await page.locator('input[name="mode-privacy"][value="STANDARD"]').check();
    await page.locator('input[name="mode-output"][value="VOICE"]').check();
    await page.locator('input[name="mode-interruption"][value="STANDARD"]').check();
    await page.locator('input[name="mode-audience"][value="PRIVATE"]').check();
    await page.locator("#modes-control summary").click();
    await page.waitForFunction(() => document.querySelectorAll(".message.assistant").length === 2);
    assert.equal(ttsRequests, 0);
    await page.locator("#voice-toggle").click();
    assert.deepEqual(Object.keys(requests[1]).sort(), [
      "history", "memory_enabled", "message", "presentation_mode", "use_vault", "use_web",
    ]);
    assert.equal(requests[1].presentation_mode, "FOCUS");
    assert.equal(requests[1].memory_enabled, false);
    let stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hope.history.v1")));
    assert.deepEqual(stored.map(item => item.content), ["turno padrão", requests[0] ? "Resposta **simulada** e segura. `<img src=x onerror=alert(1)>` permanece texto." : ""]);

    assert.equal(await page.locator("#memory-enabled").isChecked(), true);
    await page.locator("#prompt").fill("turno restaurado");
    await page.locator("#prompt").press("Enter");
    await page.waitForFunction(() => document.querySelectorAll(".message.assistant").length === 3);
    stored = await page.evaluate(() => JSON.parse(localStorage.getItem("hope.history.v1")));
    assert.equal(stored.some(item => item.content === "aguarde turno privado"), false);
    assert.equal(stored.some(item => item.content === "turno restaurado"), true);
    const storage = await page.evaluate(() => Object.values(localStorage));
    assert.equal(storage.some(value => /FOCUS|DO_NOT_DISTURB|presentation_mode/.test(value)), false);
  });

  await scenario("display survives TTS failure and playback uses local amplitude", async page => {
    await installSyntheticVoice(page);
    await page.goto(base); await ready(page);
    await page.locator("#prompt").fill("resposta para voz");
    await page.locator("#prompt").press("Enter");
    await page.waitForFunction(() => document.querySelector(".message.assistant"));
    const completeText = await page.locator(".message.assistant .message-body").textContent();
    await page.locator(".message-speech").click();
    await page.waitForFunction(() => document.querySelector("#hope-state").dataset.state === "speaking");
    await page.waitForFunction(() => window.__voiceLevels.some(value => value > 0));
    assert.equal(await page.locator(".message.assistant .message-body").textContent(), completeText);
    await screenshot(page, "voice-speaking-local-amplitude");
    await page.evaluate(() => window.fixtureAudio.dispatchEvent(new Event("ended")));
    await page.waitForFunction(() => document.querySelector("#hope-state").dataset.state === "idle");
    assert.equal((await page.evaluate(() => window.__voiceLevels.at(-1))), 0);

    await page.route("**/api/tts", route => route.fulfill({ status: 503, json: { detail: "Falha de voz simulada." } }));
    await page.locator(".message-speech").click();
    await page.waitForFunction(() => document.querySelector("#urgent-status").textContent.includes("Falha de voz simulada"));
    assert.equal(await page.locator(".message.assistant .message-body").textContent(), completeText);
    assert.equal(await page.locator("#hope-state").getAttribute("data-state"), "idle");
    assert.equal((await page.evaluate(() => window.__voiceLevels.at(-1))), 0);
    await screenshot(page, "voice-failure-display-preserved");
    await page.unroute("**/api/tts");
    await page.evaluate(() => { window.__failNextPlay = true; });
    await page.locator(".message-speech").click();
    await page.waitForFunction(() => document.querySelector("#urgent-status").textContent.includes("Não foi possível reproduzir"));
    assert.equal(await page.locator(".message.assistant .message-body").textContent(), completeText);
    await page.locator(".message-speech").click();
    await page.waitForFunction(() => document.querySelector("#hope-state").dataset.state === "speaking");
    await page.evaluate(() => window.fixtureAudio.dispatchEvent(new Event("ended")));
  });

  await scenario("recognition truth, Escape priority, cancel and stale guards", async page => {
    await page.addInitScript(() => {
      window.SpeechRecognition = class {
        constructor() { window.fixtureRecognition = this; }
        start() {}
        stop() { this.onend?.(); }
        abort() { this.onend?.(); }
      };
    });
    await installSyntheticVoice(page);
    await page.goto(base); await ready(page);
    await page.locator("#modes-control summary").click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#modes-control").getAttribute("open"), null);
    assert.equal(await page.locator("#modes-control summary").evaluate(node => node === document.activeElement), true);

    await page.locator("#mic-button").click();
    assert.notEqual(await page.locator("#hope-state").getAttribute("data-state"), "listening");
    await page.evaluate(() => window.fixtureRecognition.onstart());
    assert.equal(await page.locator("#hope-state").getAttribute("data-state"), "listening");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#hope-state").getAttribute("data-state"), "idle");
    await page.evaluate(() => window.fixtureRecognition.onresult({ results: [[{ transcript: "stale" }]] }));
    assert.equal(await page.locator("#prompt").inputValue(), "");

    await page.locator("#prompt").fill("aguarde");
    await page.locator("#prompt").press("Enter");
    await page.waitForFunction(() => !document.querySelector("#cancel-button").hidden);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.querySelector("#hope-state").dataset.state === "idle");
    await page.waitForTimeout(3200);
    assert.equal(await page.locator(".message.assistant").count(), 0);
    assert.match(await page.locator("#live-status").textContent(), /cancelada/i);
  });

  await scenario("no WebGL keeps complete voice and mode controls", async page => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        return type === "webgl" ? null : original.call(this, type, ...args);
      };
    });
    await page.goto(base); await ready(page);
    assert.equal(await page.locator("#webgl-fallback").isVisible(), true);
    await page.locator("#modes-control summary").click();
    assert.equal(await page.locator(".modes-sheet").isVisible(), true);
    await page.locator("#modes-control summary").click();
    await page.locator("#prompt").fill("chat sem WebGL");
    await page.locator("#prompt").press("Enter");
    await page.waitForFunction(() => document.querySelector(".message.assistant"));
    assert.equal(await page.locator(".message-speech").count(), 1);
    await screenshot(page, "no-webgl-conversation");
  });

  await scenario("viewports, zoom, larger text and reduced motion", async page => {
    const viewports = [[320,568],[390,844],[768,1024],[1024,768],[1280,720],[1440,900],[1920,1080]];
    for (const [width, height] of viewports) {
      await page.setViewportSize({ width, height });
      await page.goto(base); await ready(page);
      const geometry = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        width: innerWidth,
        composer: document.querySelector("#chat-form").getBoundingClientRect().bottom,
      }));
      assert.ok(geometry.scrollWidth <= width, `horizontal overflow at ${width}x${height}`);
      await page.locator("#modes-control summary").scrollIntoViewIfNeeded();
      assert.equal(await page.locator("#modes-control summary").isVisible(), true);
      await screenshot(page, `viewport-${width}x${height}`);
    }
    await page.setViewportSize({ width: 720, height: 450 });
    await page.goto(base); await ready(page);
    await page.evaluate(() => { document.documentElement.style.fontSize = "20.8px"; });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.locator("#modes-control summary").click();
    assert.equal(await page.locator(".modes-sheet").isVisible(), true);
    const snapshot = await page.locator("body").ariaSnapshot();
    assert.match(snapshot, /Modos da sessão/);
    await screenshot(page, "text-130-modes");
  }, { reducedMotion: "reduce" });

  await writeFile(
    `${output}/browser-results.json`,
    JSON.stringify({ browser: browser.version(), results, simulatedAudio: true, paidProviders: false }, null, 2),
  );
} finally {
  await browser.close();
}
