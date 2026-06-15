# Phase 2 — Host daemon + parallel isolated agents (P01/P02/P04/P10/P11)

The headless host engine is wired and the core capability is **proven by an
integration test that starts the REAL host and runs 4 mock agents** (3 in
parallel programmatically + 1 via the tRPC command path), each isolated in its
own git worktree, with live status streamed over the sync channel and persisted
to PGlite.

## What the host exposes

`startHost()` (and `runDaemon()` for `grove host`) stand up one Hono HTTP server
bound to **127.0.0.1** on an ephemeral port (private-by-default, P11):

- **tRPC** under `/trpc` via `@hono/trpc-server` + `@trpc/server` v11. Routers:
  `host.{status,info}`, `workspaces.{list,get,create}`, `agents.{listAdapters,start,stop}`,
  `sessions.list` — a real slice of the architecture §3.1 surface over a shared
  `HostServices` context (the host is the single writer).
- **WebSocket sync hub** mounted on the **same port** at `/sync`. `@swarm/sync`'s
  `createSyncServer` gained an attached/`noServer` mode so the host owns the
  server and gates every WS upgrade.
- **Bearer-token auth (P11):** a 256-bit token is generated on start; a Hono
  middleware rejects `/trpc/*` without `Authorization: Bearer <token>` (401), and
  the WS upgrade is rejected unless the token is presented (header or `?token=`).
- **Manifest:** `<os.homedir()>/.grove/host/manifest.json` =
  `{ endpoint, token, pid, startedAt }` (cross-platform path via `node:path`/`os.homedir`).
  No telemetry, nothing leaves loopback.

The light `createHost()` handle stays in `@swarm/host`; the heavy Node-only
surface (`startHost`, `runDaemon`, `Orchestrator`, `PgliteEventLogStore`,
`createAppRouter`) lives behind `@swarm/host/daemon` so thin clients never load
node-pty/PGlite/Hono.

## Orchestration flow (`apps/host/src/orchestrator.ts`)

Per task: `createWorkspace` cuts an **isolated git worktree (branch-per-task)**
via `WorktreeEngine` over a shared `.git`, inserts the `workspaces` row, and
appends `workspace.created`. `startAgent` launches the agent on a **real PTY**
(under Node) through the adapter, and maps the adapter's `AgentStatus` stream to
`DomainEvent`s: first `running` → `session.started` + `workspace.status_changed(running)`;
terminal `done`/`error` → `workspace.status_changed(done)` + `session.exited`,
updating the `workspaces`/`sessions` projections. Events are appended to the sync
`EventLog`, backed by `PgliteEventLogStore` (a host-owned adapter from the sync
`EventLogStore` seam onto `@swarm/db`'s PGlite store — sync never imports db).

## The integration test — 4 assertions (all PASS)

`apps/host/src/host-integration.test.ts` (bun) creates a temp git fixture (path
contains a space — the Windows hazard), spawns `host-worker.ts` under **Node**
(node-pty cannot run under Bun, ADR-0007a), then parses the worker's JSON report
**and adds its own independent on-disk checks**. 8 tests / 71 assertions pass.

- **Isolation (P02) — PASS.** Each agent runs on its own branch
  (`grove/agent-{alpha,bravo,charlie}`) + working dir. The bun test reads each
  agent's output file from its own worktree (present), asserts that file is
  **absent in every other agent's worktree**, and that the **base repo is
  untouched**: on `main`, `git status --porcelain` empty, none of the agent files
  present.
- **Parallelism (P01) — PASS.** Interval sweep over the timestamped
  running→done records: **maxConcurrent = 3** (all three simultaneously running),
  wall-clock 2420 ms vs summed run time 6193 ms ⇒ **concurrency ratio ≈ 2.56**
  (serialized would be ≈ 1.0). The live stream shows all three reach `running`
  (seq 7,8,9) before any reaches `done` (seq 10,12,14).
- **Live status (P04) — PASS.** A `SyncClient` over the real WS socket receives
  every `workspace.status_changed`; for each agent `running.seq < done.seq`, and
  the client caught up to the durable head (`lastSeq == head == maxSeq == 20`).
  An in-process `EventLog.subscribe` recorder corroborates the order.
- **Persistence (P10) — PASS.** After the run, events are queried back from
  PGlite: 20 total (4 agents × 4 workspace-attributed events + 4 `session.exited`
  indexed by `session_id`); each agent's session is `done`/exit 0.
- **Auth (P11) — PASS.** Unauthenticated `host.status` → **401**; with the bearer
  token → **200** (correct `hostId`); an unauthenticated WS connect is **rejected**
  (never reaches `live`).

### Key output

```
WORKER_DETAIL parallel(max=3,ratio=2.56) auth(401/200,ws=true) events=20 liveOrdered=true wsCaughtUp=true
HOST_RESULT=PASS
```

```jsonc
{
  "endpoint": "http://127.0.0.1:63963",
  "wsUrl": "ws://127.0.0.1:63963/sync",
  "manifest": { "endpoint": "http://127.0.0.1:63963", "token": "…43 chars…", "pid": 18480, "startedAt": "2026-06-15T05:06:08.923Z" },
  "auth": { "httpNoToken": 401, "httpWithToken": 200, "httpHostId": "grove-host-it", "wsRejectedNoToken": true },
  "parallel": { "wallMs": 2420, "sumMs": 6193, "concurrencyRatio": 2.56, "maxConcurrent": 3, "agentCount": 3 },
  "liveOverWs": {
    "lastSeq": 20, "head": 20,
    "statusEvents": [ {"seq":7,"status":"running"}, {"seq":8,"status":"running"}, {"seq":9,"status":"running"},
                      {"seq":10,"status":"done"}, {"seq":12,"status":"done"}, {"seq":14,"status":"done"},
                      {"seq":18,"status":"running"}, {"seq":19,"status":"done"} ]
  },
  "persistence": { "maxSeq": 20, "totalEvents": 20, "sessionExitedCount": 4 },
  "delta": { "status": "done", "eventCount": 4 }  // 4th agent via the tRPC command path
}
```

```
@swarm/host:test:  8 pass  0 fail  71 expect() calls  Ran 8 tests [16.00s]
```

## Deps added (per package, via `bun add` in the owning package)

- `apps/host`: `hono@4`, `@hono/node-server@2`, `@hono/trpc-server@0.4`,
  `@trpc/server@11`, `zod@4`, plus workspace deps `@swarm/{core-engine,git-worktree,pty-supervisor,agent-adapters}`.
- `apps/cli`: none (uses `@swarm/host` + `@swarm/host/daemon`); build target set to node.

## Windows / Node-vs-Bun issues + fixes

1. **node-pty under Bun (ADR-0007a):** the host + PTYs run under **Node**; the bun
   test orchestrates and spawns `host-worker.ts` via `node` (same pattern as the
   pty-supervisor/mock-adapter integration tests).
2. **`@swarm/sync` / `@swarm/db` were not Node-loadable:** their relative imports
   were extensionless (Node ESM can't resolve) and two classes used TS
   **parameter properties** (Node strip-only mode rejects). Fixed by aligning
   their imports to the repo's dominant explicit-`.ts` convention and converting
   `EventLog`/`SyncClient` to plain field declarations. Sync's WS server stays a
   single implementation, now usable both standalone and attached to a host server.
3. **`allowImportingTsExtensions`** added to `tsconfig.base.json` (valid under
   `noEmit`): the repo already relies on `.ts` imports (agent-adapters/pty-supervisor),
   which made `@swarm/api`'s typecheck red at HEAD; the base flag fixes it tree-wide.
4. **Browser-target builds:** `createHost` no longer eagerly pulls node-pty/PGlite
   (split into `@swarm/host` light + `@swarm/host/daemon` heavy), so `apps/desktop`
   builds unchanged; `apps/cli` build switched to `--target node --packages external`.

## Full-tree gate (Windows, bun 1.3.14 + node 24.14.1) — GREEN

`bun install --frozen-lockfile` (no changes) · `bun run lint` (134 files, clean) ·
`bun run typecheck` (17/17) · `bun run build` (17/17) · `bun run test`
(8/8 tasks; sync 10, host 8, +others) · banned-token scan over `apps packages docs`
(empty) · `bunx @biomejs/biome check --write .` applied.
