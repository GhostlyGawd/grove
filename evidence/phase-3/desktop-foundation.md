# Phase 3 — Desktop client FOUNDATION (`apps/desktop`)

Date: 2026-06-15 · Status: built, green locally (gate ×2 + final), e2e green.

A real, connected Electron + Vite-React app shell on `@swarm/ui` — a dense, dark-first
operator cockpit (workspace rail · content pane · status bar) wired to the **real** host
engine. This is the foundation; the terminal, diff viewer, and workspace nav land in later
Phase-3 waves.

## What was built

```
apps/desktop/
  src/main.ts            Electron main: secure BrowserWindow, resolves the host connection
  src/preload.ts         contextBridge ("grove.getHostConnection"), contextIsolation, sandbox
  src/host-client.ts     typed tRPC client (@trpc/client) + browser WebSocket sync transport
  src/host-client.test.ts  unit tests for connection precedence + sync-URL derivation (bun)
  src/renderer/          Vite + React shell: App, WorkspaceRail, ContentPane, StatusBar, useHost
  index.html, vite.config.ts, tailwind.config.ts   renderer (mirrors apps/showcase)
  e2e/                   Playwright: real-host global-setup/teardown + shell smoke spec
  playwright.config.ts   builds the renderer + previews it; chromium headless via node
  scripts/dev-electron.mjs  local GUI dev launcher (node)
```

`@swarm/ui/react` primitives are reused verbatim (ThemeProvider, ListRow, AgentStatusDot,
StatusBadge, Badge, Input, Button, EmptyState, ErrorState, Skeleton, Panel) — no restyling.
Dark-first; every phase renders a real empty/loading/error state (never a blank panel).

## Host-connection approach (real, not stubbed)

- **Discovery + auth.** The Electron **main** process reads `~/.grove/host/manifest.json`
  (`{endpoint, token}`, cross-platform via `node:os` homedir), with a dev fallback to
  `GROVE_HOST_URL` / `GROVE_HOST_TOKEN`. The renderer never touches the filesystem — the
  resolved `{endpoint, token}` crosses the **preload contextBridge** (`window.grove`) as plain
  data. `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- **Typed tRPC.** `createTRPCClient<AppRouter>` over `httpBatchLink` at `${endpoint}/trpc`,
  bearer token on every call. `AppRouter` is imported **type-only** from `@swarm/host/daemon`
  → full end-to-end type safety, zero engine code in the renderer bundle (erased at build).
- **Live sync.** A browser-`WebSocket` `SyncTransport` (the engine's own `ws` transport is
  Node-only; the `SyncClient` core is transport-agnostic) connects to `ws://…/sync?token=…`
  (the host authorizes the upgrade via the `token` query param). On launch the renderer makes
  a real `host.status` + `workspaces.list` round-trip, then subscribes and folds
  `workspace.status_changed` events into a live status overlay (verified: the seeded
  `fix/api-timeout` flips to amber/needs-attention from a live event; status bar shows "sync
  live").
- **Graceful "no host".** No manifest/bridge/env ⇒ `pickConnection` returns null ⇒ the rail
  shows a real **connect state** ("No host running" + retry), the status bar shows "No host".
  Connection failures land in an `ErrorState` with retry. No crashes.

## Electron-in-CI handling

- `electron` + `@playwright/test` added to **`apps/desktop` only** (`bun add --dev`), with
  `ELECTRON_SKIP_BINARY_DOWNLOAD=1`.
- `.github/workflows/ci.yml` gains a top-level `env: ELECTRON_SKIP_BINARY_DOWNLOAD: "1"` so no
  runner pulls the ~150MB binary. Electron is **not** in `trustedDependencies` (bun blocks its
  postinstall by default), so CI never downloads or launches the GUI — it only
  typechecks/builds + Playwright-tests the renderer headlessly. The packaged GUI launch lands
  in Phase 5 (ADR-0005).
- Build splits cleanly: `vite build` → `dist/renderer/**`; `bun build` → `dist/main.js` (ESM)
  + `dist/preload.cjs` (CJS), `electron` external.

## Two cross-cutting fixes this wave required

1. **Host CORS (`apps/host/src/server.ts`).** Browser-based clients (this renderer's
   dev-server / file origin, and the Phase-4 PWA) reach the host cross-origin, so the tRPC
   surface now answers CORS preflight (`hono/cors`, mounted BEFORE the bearer guard so the
   credential-less OPTIONS is not 401'd). Safe because the **token**, not the origin, is the
   gate. Host unit/integration tests stay green (12 pass).
2. **`@types/node` override (root `package.json`).** Electron pins `@types/node@^24`, which
   collided with the `@types/node@25.9.3` that `bun-types` expects — two copies broke
   `ChildProcess`'s `EventEmitter` methods and reddened the host typecheck. Pinned to a single
   `25.9.3` via `overrides`, restoring a green tree.

## Playwright smoke — REAL host (preferred path)

`e2e/global-setup.ts` starts a **real** Grove host on a loopback port (`startHost` + a real
PGlite store + `PtySupervisor`, driven by node), seeds a project + two worktrees directly over
the store, and appends one `workspace.status_changed` event so the sync subscribe path is
exercised. The connected spec injects the live `{endpoint, token}` and the renderer makes
genuine tRPC + WebSocket calls — no stubbed happy path. Driven via **node** (not bun;
Playwright+bun is unreliable on Windows, per evidence/phase-1), chromium headless.

```
Running 2 tests using 1 worker
  ✓ mounts the cockpit chrome and shows the connect state with no host (544ms)
  ✓ connects to a real host and renders the live workspace list (559ms)
  2 passed (13.5s)
```

Screenshots: `evidence/phase-3/desktop-shell-connected.png` (rail + live data + "sync live" +
"2 worktrees · 1 running · windows · v0.1.0") and `desktop-shell-no-host.png` (connect state).

## Gate (ADR-0011) — local, cache-disabled, run twice + final

- `bun run lint` (Biome) → clean (159 files), all three runs.
- `bunx turbo run typecheck build test --force` → **43/43 successful** on every run (incl.
  `@swarm/desktop` typecheck + renderer `vite build` + `dist/main.js`/`preload.cjs` + 6 unit
  tests; host tests still 12 pass).
- Banned-token scan over `apps packages docs` → clean (exit 1, zero matches).
- `apps/desktop` unit tests: 6 pass / 0 fail.

## Not done here (later Phase-3 waves)

Terminal (P05), diff viewer + inline edit (P06), open-in-external (P08), workspace nav +
hotkeys + settings (P09), and the full real-host journey e2e. The packaged Electron GUI launch
+ installer is Phase 5. Local GUI launch is available via `bun run --filter @swarm/desktop
dev:electron` once the Electron binary is present (skipped in CI).
