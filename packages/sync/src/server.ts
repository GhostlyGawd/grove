import { type IncomingMessage, type Server, createServer } from "node:http";
import type { Duplex } from "node:stream";
import type { HostId } from "@swarm/shared";
import { type RawData, type WebSocket, WebSocketServer } from "ws";
import type { EventLog } from "./event-log.ts";
import {
  type StoredEvent,
  type SyncFrame,
  decodeResumeToken,
  parseFrame,
  serializeFrame,
} from "./index.ts";

export interface SyncServerOptions {
  readonly log: EventLog;
  /** The host identity clients must present in their resume token. */
  readonly hostId: HostId;
  /** TCP port; 0 (default) binds an OS-assigned ephemeral port. Ignored when `server` is given. */
  readonly port?: number;
  /** Bind address; defaults to 127.0.0.1 (private-by-default, P11). */
  readonly host?: string;
  /** WS path; defaults to /sync. */
  readonly path?: string;
  /** Heartbeat PING interval in ms; 0 disables. Default 15000. */
  readonly heartbeatMs?: number;
  /** Max events per BATCH frame during catch-up. Default 512. */
  readonly batchSize?: number;
  /**
   * Attach to an existing Node HTTP server in `noServer` mode instead of opening
   * a dedicated one. The host engine passes its Hono server here so tRPC and the
   * WS sync hub share a single loopback port (architecture §1). `close()` then
   * detaches the hub without tearing down the host-owned server.
   */
  readonly server?: Server;
  /**
   * Gate every WS upgrade. Returning `false` rejects it with a 401 before the
   * handshake completes — the host wires a bearer-token check here so the sync
   * channel is as private as the tRPC surface (P11).
   */
  readonly authorize?: (req: IncomingMessage) => boolean;
}

export interface SyncServer {
  /** Resolved port (meaningful after the server is listening). */
  readonly port: number;
  readonly url: string;
  /** Live connection count. */
  clientCount(): number;
  /** Last seq each connected client has acked — the resume high-water marks. */
  clientCursors(): readonly number[];
  close(): Promise<void>;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PATH = "/sync";
const DEFAULT_HEARTBEAT_MS = 15_000;
const DEFAULT_BATCH_SIZE = 512;

function rawToString(data: RawData): string {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString("utf8");
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data).toString("utf8");
  }
  return (data as Buffer).toString("utf8");
}

function* chunk<T>(items: readonly T[], size: number): Generator<readonly T[]> {
  for (let i = 0; i < items.length; i += size) {
    yield items.slice(i, i + size);
  }
}

/**
 * Node-side WebSocket sync hub. Each connection: validates the HELLO resume
 * token's hostId (mismatch ⇒ RESET), replays missed events as BATCH frames,
 * sends CAUGHT_UP, then streams live EVENT frames as the host appends. Terminal
 * IO is intentionally NOT carried here — it rides an ephemeral topic (spec §4).
 *
 * Two modes: standalone (opens its own loopback HTTP server on `port`) or
 * attached (`server` given) where the host owns the server and the hub handles
 * upgrades for `path` in `noServer` mode behind an optional `authorize` gate.
 */
export function createSyncServer(opts: SyncServerOptions): Promise<SyncServer> {
  const host = opts.host ?? DEFAULT_HOST;
  const path = opts.path ?? DEFAULT_PATH;
  const heartbeatMs = opts.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  const batchSize = opts.batchSize ?? DEFAULT_BATCH_SIZE;
  const attached = opts.server;

  return new Promise((resolve, reject) => {
    // Standalone: own the HTTP server so close() can drop lingering sockets.
    // Attached: run noServer and route upgrades ourselves so the host keeps
    // ownership of the (shared) server's lifecycle.
    const httpServer = attached ?? createServer();
    const wss = attached
      ? new WebSocketServer({ noServer: true })
      : new WebSocketServer({ server: httpServer, path });
    const cursors = new Map<WebSocket, number>();

    wss.on("connection", (socket: WebSocket) => {
      cursors.set(socket, 0);
      let unsubscribe: (() => void) | undefined;
      let heartbeat: ReturnType<typeof setInterval> | undefined;

      const send = (frame: SyncFrame): void => {
        if (socket.readyState === socket.OPEN) {
          socket.send(serializeFrame(frame));
        }
      };

      const onLive = (stored: StoredEvent): void => {
        send({ t: "EVENT", seq: stored.seq, event: stored.event });
      };

      const cleanup = (): void => {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        if (heartbeat !== undefined) {
          clearInterval(heartbeat);
          heartbeat = undefined;
        }
        cursors.delete(socket);
      };

      const startStream = async (fromSeq: number): Promise<void> => {
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        unsubscribe = await opts.log.subscribeFrom(fromSeq, {
          onBatch: (events) => {
            for (const part of chunk(events, batchSize)) {
              send({ t: "BATCH", events: part.map((e) => e.event) });
            }
          },
          onCaughtUp: (seq) => send({ t: "CAUGHT_UP", seq }),
          onLive,
        });
      };

      socket.on("message", (raw: RawData) => {
        let frame: SyncFrame;
        try {
          frame = parseFrame(rawToString(raw));
        } catch {
          send({ t: "ERROR", code: "BAD_FRAME" });
          return;
        }

        switch (frame.t) {
          case "HELLO": {
            let fromSeq = 0;
            if (frame.resumeToken !== undefined) {
              try {
                const token = decodeResumeToken(frame.resumeToken);
                if (token.hostId !== opts.hostId) {
                  send({ t: "RESET" });
                  return; // client drops cache and re-HELLOs from seq 0.
                }
                fromSeq = token.seq;
              } catch {
                send({ t: "RESET" });
                return;
              }
            }
            cursors.set(socket, fromSeq);
            void startStream(fromSeq);
            break;
          }
          case "ACK": {
            cursors.set(socket, frame.seq);
            break;
          }
          case "PING": {
            send({ t: "PONG" });
            break;
          }
          default:
            break;
        }
      });

      socket.on("pong", () => {
        // Heartbeat reply; the connection is alive.
      });
      socket.on("error", () => {
        // The subsequent close event performs cleanup.
      });
      socket.on("close", cleanup);

      if (heartbeatMs > 0) {
        heartbeat = setInterval(() => send({ t: "PING" }), heartbeatMs);
      }
    });

    const resolvedPort = (): number => {
      const address = httpServer.address();
      return typeof address === "object" && address !== null ? address.port : (opts.port ?? 0);
    };

    let upgradeListener: ((req: IncomingMessage, socket: Duplex, head: Buffer) => void) | undefined;

    const buildHandle = (): SyncServer => {
      const port = resolvedPort();
      return {
        port,
        url: `ws://${host}:${port}${path}`,
        clientCount: () => wss.clients.size,
        clientCursors: () => Array.from(cursors.values()),
        close: () =>
          new Promise<void>((resolveClose) => {
            if (upgradeListener && attached) {
              attached.off("upgrade", upgradeListener);
            }
            for (const client of wss.clients) {
              client.terminate();
            }
            const finish = (): void => {
              if (attached) {
                // The host owns the shared server; only release the hub.
                resolveClose();
                return;
              }
              // Drop any lingering raw sockets so the listener can fully release.
              httpServer.closeAllConnections();
              // Under bun, wss.close() already stops the shared http server, so
              // only close it ourselves when it is still listening (node).
              if (httpServer.listening) {
                httpServer.close(() => resolveClose());
              } else {
                resolveClose();
              }
            };
            wss.close(() => finish());
          }),
      };
    };

    if (attached) {
      upgradeListener = (req: IncomingMessage, socket: Duplex, head: Buffer): void => {
        let pathname = "";
        try {
          pathname = new URL(req.url ?? "", "http://localhost").pathname;
        } catch {
          pathname = "";
        }
        if (pathname !== path) {
          // Not our path — leave it for any other listener, then ensure no hang.
          if (attached.listenerCount("upgrade") <= 1) {
            socket.destroy();
          }
          return;
        }
        if (opts.authorize && !opts.authorize(req)) {
          socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
          socket.destroy();
          return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
      };
      attached.on("upgrade", upgradeListener);
      resolve(buildHandle());
      return;
    }

    const onListenError = (error: Error): void => {
      reject(error);
    };
    httpServer.once("error", onListenError);
    httpServer.listen(opts.port ?? 0, host, () => {
      httpServer.off("error", onListenError);
      resolve(buildHandle());
    });
  });
}
