import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BrowserWindow, app, ipcMain } from "electron";

/** How the renderer reaches the host: a loopback HTTP base + its bearer token. */
export interface HostConnection {
  readonly endpoint: string;
  readonly token: string;
}

const here = dirname(fileURLToPath(import.meta.url));

/** Near-black, faintly green-leaning base from the Grove dark theme (design-system §3). */
const BASE_BG = "#0a0f0d";

/** Canonical, cross-platform manifest path the running host writes (`@swarm/host`). */
function manifestPath(): string {
  return join(homedir(), ".grove", "host", "manifest.json");
}

/**
 * Resolve the host connection for the renderer: the on-disk manifest the running
 * host writes (endpoint + bearer token), falling back to the dev env vars. Returns
 * `null` when no host is reachable, so the renderer renders its connect state
 * instead of crashing. The renderer never touches the filesystem itself — this
 * stays in the main process and crosses the contextBridge as plain data.
 */
export function resolveHostConnection(): HostConnection | null {
  try {
    const parsed = JSON.parse(readFileSync(manifestPath(), "utf8")) as Partial<HostConnection>;
    if (typeof parsed.endpoint === "string" && typeof parsed.token === "string") {
      return { endpoint: parsed.endpoint, token: parsed.token };
    }
  } catch {
    // No manifest (host not running / unreadable) — fall through to the env fallback.
  }
  const endpoint = process.env.GROVE_HOST_URL;
  const token = process.env.GROVE_HOST_TOKEN;
  if (endpoint && token) {
    return { endpoint, token };
  }
  return null;
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 920,
    minHeight: 560,
    backgroundColor: BASE_BG,
    autoHideMenuBar: true,
    show: false,
    title: "Grove",
    webPreferences: {
      preload: join(here, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  const devServer = process.env.VITE_DEV_SERVER_URL;
  if (devServer) {
    void win.loadURL(devServer);
  } else {
    void win.loadFile(join(here, "renderer", "index.html"));
  }
}

ipcMain.handle("grove:host-connection", (): HostConnection | null => resolveHostConnection());

void app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // macOS apps conventionally stay live until Cmd+Q; other platforms quit.
  if (process.platform !== "darwin") {
    app.quit();
  }
});
