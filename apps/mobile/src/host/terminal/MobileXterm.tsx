import type { TerminalClientFrame, TerminalServerFrame } from "@swarm/host/daemon";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { HostConnection } from "../connection-store.ts";
import { terminalUrl } from "../host-client.ts";

/** Imperative handle the TerminalView drives (accessory-bar sends, refit, clear). */
export interface MobileXtermHandle {
  /** Write raw bytes straight to the PTY (accessory-bar control sequences). */
  send(data: string): void;
  focus(): void;
  fit(): void;
  clear(): void;
}

export type PaneStatus = "connecting" | "live" | "closed";

export interface MobileXtermProps {
  readonly conn: HostConnection;
  readonly workspaceId: string;
  readonly shell?: string;
  /** True when this is the visible session (its stream mirror carries the test id). */
  readonly active: boolean;
  /**
   * Local keystrokes typed into xterm. The parent applies the armed-Ctrl transform
   * and writes the result back via {@link MobileXtermHandle.send}, so a soft-keyboard
   * key and an accessory-bar Ctrl chord flow through one place.
   */
  readonly onLocalData: (data: string) => void;
  readonly onStatus?: (status: PaneStatus) => void;
}

/** Grove dark terminal theme, aligned with the design-system §3 tokens. */
const THEME = {
  background: "#0a0f0d",
  foreground: "#d6dbd8",
  cursor: "#7ee3b0",
  selectionBackground: "#1f6f4a55",
} as const;

/**
 * One real PTY session rendered with xterm.js on the phone (W4). Streams the host's
 * PTY over the ephemeral `/terminal` WebSocket: incoming `data` frames are written to
 * the terminal, local keystrokes are routed to the parent (which sends them back as
 * `data` frames after the Ctrl transform), and viewport changes are fit + reported as
 * `resize` frames. A single pane — no splits (those are desktop). The full received
 * stream is mirrored into a visually-hidden node (test id on the active session) so
 * the real host byte stream can be asserted directly by the e2e.
 */
export const MobileXterm = forwardRef<MobileXtermHandle, MobileXtermProps>(function MobileXterm(
  { conn, workspaceId, shell, active, onLocalData, onStatus },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [stream, setStream] = useState("");

  // The handle reads refs, so it stays stable while pointing at the live objects.
  useImperativeHandle(ref, () => ({
    send: (data: string) => {
      const socket = socketRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ t: "data", data } satisfies TerminalClientFrame));
      }
    },
    focus: () => termRef.current?.focus(),
    fit: () => {
      try {
        fitRef.current?.fit();
        const term = termRef.current;
        const socket = socketRef.current;
        if (term && socket && socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              t: "resize",
              cols: term.cols,
              rows: term.rows,
            } satisfies TerminalClientFrame),
          );
        }
      } catch {
        // a transient zero-size layout; the ResizeObserver fits again shortly.
      }
    },
    clear: () => termRef.current?.clear(),
  }));

  // Keep the latest onLocalData without re-opening the socket (mounted once).
  const onLocalDataRef = useRef(onLocalData);
  onLocalDataRef.current = onLocalData;

  // Mount the terminal + open the WS exactly once per session identity (the parent
  // remounts via React key to start a fresh session).
  // biome-ignore lint/correctness/useExhaustiveDependencies: a session is created once; conn/workspaceId/shell are fixed for its lifetime.
  useEffect(() => {
    const container = hostRef.current;
    if (!container) {
      return;
    }
    const term = new Terminal({
      fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      theme: THEME,
      scrollback: 5000,
      // Touch devices need momentum scrolling on the viewport, not the xterm canvas.
      macOptionIsMeta: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(container);
    termRef.current = term;
    fitRef.current = fit;
    try {
      fit.fit();
    } catch {
      // container not laid out yet; the ResizeObserver below fits shortly.
    }

    onStatus?.("connecting");
    const socket = new WebSocket(
      terminalUrl(conn, { workspaceId, shell, cols: term.cols, rows: term.rows }),
    );
    socketRef.current = socket;

    const sendClient = (frame: TerminalClientFrame): void => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(frame));
      }
    };

    socket.addEventListener("open", () => {
      onStatus?.("live");
      sendClient({ t: "resize", cols: term.cols, rows: term.rows });
    });
    socket.addEventListener("message", (event: MessageEvent) => {
      let frame: TerminalServerFrame;
      try {
        frame = JSON.parse(String(event.data)) as TerminalServerFrame;
      } catch {
        return;
      }
      if (frame.t === "data") {
        term.write(frame.data);
        setStream((prev) => (prev + frame.data).slice(-8000));
      } else if (frame.t === "exit") {
        term.write(`\r\n\x1b[2m[process exited with code ${frame.exitCode}]\x1b[0m\r\n`);
        onStatus?.("closed");
      } else if (frame.t === "error") {
        term.write(`\r\n\x1b[31m[terminal error: ${frame.message}]\x1b[0m\r\n`);
        onStatus?.("closed");
      }
    });
    socket.addEventListener("close", () => onStatus?.("closed"));
    socket.addEventListener("error", () => onStatus?.("closed"));

    // Route every local keystroke through the parent (armed-Ctrl transform), which
    // writes the bytes back via the handle. This keeps the soft keyboard and the
    // accessory bar on a single send path.
    const onInput = term.onData((data) => onLocalDataRef.current(data));

    const observer = new ResizeObserver(() => {
      try {
        fit.fit();
        sendClient({ t: "resize", cols: term.cols, rows: term.rows });
      } catch {
        // ignore transient layout-zero observations
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      onInput.dispose();
      socket.close();
      socketRef.current = null;
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full min-h-0 w-full">
      <div ref={hostRef} className="absolute inset-0" data-testid="xterm-host" />
      {/* Hidden mirror of the real host byte stream — robust target for the e2e. */}
      <span className="sr-only" data-testid={active ? "terminal-stream" : undefined}>
        {stream}
      </span>
    </div>
  );
});
