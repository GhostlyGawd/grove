import type { AppRouter as ApiRouterContract } from "@swarm/api";
import { DEFAULT_DATABASE_URL } from "@swarm/db";
import { APP_CODENAME, type HostId, asId } from "@swarm/shared";
import { SYNC_PROTOCOL_VERSION } from "@swarm/sync";
import { HOST_VERSION } from "./version.ts";

/**
 * @swarm/host — the headless engine. This entry is the LIGHT, dependency-thin
 * handle thin clients (CLI status, Electron renderer) build against; it pulls no
 * node-pty/PGlite/Hono. The running daemon — `startHost`/`runDaemon` + the
 * `Orchestrator` that drives the parallel-agent flow — lives behind
 * `@swarm/host/daemon` (Node-only), so importing `createHost` never loads native
 * modules. Loopback-by-default keeps the host private (P11).
 */

export { HOST_VERSION };

const DEFAULT_BIND = "127.0.0.1:8787";

export interface HostOptions {
  /** Address the engine binds; loopback by default for privacy (P11). */
  readonly bind?: string;
  /** PGlite or Postgres connection string; defaults to embedded PGlite (ADR-0003). */
  readonly databaseUrl?: string;
}

export interface HostStatus {
  readonly hostId: HostId;
  readonly version: string;
  readonly online: boolean;
  readonly boundTo: string;
  readonly databaseUrl: string;
  readonly protocolVersion: number;
}

export interface Host {
  readonly hostId: HostId;
  status(): HostStatus;
}

/** Create a lightweight engine handle with resolved bind + database settings. */
export function createHost(options: HostOptions = {}): Host {
  const boundTo = options.bind ?? DEFAULT_BIND;
  const databaseUrl = options.databaseUrl ?? DEFAULT_DATABASE_URL;
  const hostId = asId<"HostId">(`${APP_CODENAME.toLowerCase()}-${boundTo}`);
  return {
    hostId,
    status(): HostStatus {
      return {
        hostId,
        version: HOST_VERSION,
        online: true,
        boundTo,
        databaseUrl,
        protocolVersion: SYNC_PROTOCOL_VERSION,
      };
    },
  };
}

/** Re-export the full router contract so clients import host types from one place. */
export type { ApiRouterContract as AppRouterContract };
