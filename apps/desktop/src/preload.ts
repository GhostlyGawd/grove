import { contextBridge, ipcRenderer } from "electron";

/** Mirrors the main-process shape; kept local so the preload bundles standalone. */
interface HostConnection {
  readonly endpoint: string;
  readonly token: string;
}

/**
 * The entire renderer ↔ main surface: ask the main process where the host is and
 * its bearer token, nothing more. With `contextIsolation` on, this is the only
 * privileged capability the renderer can see — no Node, no fs, no arbitrary IPC.
 */
contextBridge.exposeInMainWorld("grove", {
  getHostConnection: (): Promise<HostConnection | null> =>
    ipcRenderer.invoke("grove:host-connection"),
});
