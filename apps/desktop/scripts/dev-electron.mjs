// Local Electron dev launcher (node-executed, ADR-0011): start the Vite renderer
// dev server, wait until it answers, then launch Electron pointed at it. CI never
// runs this — it only typechecks/builds + Playwright-tests the renderer headlessly.
import { spawn } from "node:child_process";
import process from "node:process";

const PORT = 5173;
const URL = `http://localhost:${PORT}`;

function run(command, args, env) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return true;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  return false;
}

const vite = run("vite", ["--port", String(PORT), "--strictPort"]);

const ready = await waitForServer(URL, 30_000);
if (!ready) {
  console.error(`Vite dev server did not start on ${URL}`);
  vite.kill();
  process.exit(1);
}

const electron = run("electron", ["."], { VITE_DEV_SERVER_URL: URL });

const shutdown = () => {
  electron.kill();
  vite.kill();
};
electron.on("exit", () => {
  vite.kill();
  process.exit(0);
});
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
