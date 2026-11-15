import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createServer } from "node:net";

const port = 8767;
await new Promise((accept, reject) => {
  const probe = createServer();
  probe.once("error", reject);
  probe.listen(port, "127.0.0.1", () => probe.close(accept));
});
const python = process.env.HOPE_PYTHON
  || resolve(process.platform === "win32" ? ".venv/Scripts/python.exe" : ".venv/bin/python");
const server = spawn(
  python,
  ["-m", "uvicorn", "tests.e2e_app:app", "--host", "127.0.0.1", "--port", String(port)],
  {
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DATABASE_URL: "",
      ANTHROPIC_API_KEY: "",
      ELEVENLABS_API_KEY: "",
      TAVILY_API_KEY: "",
      OBSIDIAN_API_KEY: "",
    },
  },
);
try {
  await new Promise((accept, reject) => {
    const timeout = setTimeout(() => reject(new Error("Phase 7 harness did not start")), 20000);
    const handle = data => {
      if (String(data).includes("Uvicorn running")) { clearTimeout(timeout); accept(); }
    };
    server.stdout.on("data", handle); server.stderr.on("data", handle);
    server.once("error", reject);
    server.once("exit", code => reject(new Error(`Harness exited before tests: ${code}`)));
  });
  await new Promise((accept, reject) => {
    const test = spawn(process.execPath, ["tests/browser/phase-7.mjs"], {
      windowsHide: true,
      stdio: "inherit",
      env: { ...process.env, HOPE_BASE_URL: `http://127.0.0.1:${port}` },
    });
    test.once("error", reject);
    test.once("exit", code => code === 0 ? accept() : reject(new Error(`phase-7: exit ${code}`)));
  });
  console.log("PASS complete Phase 7 browser package; disposable state and synthetic media only.");
} finally {
  server.kill();
}
