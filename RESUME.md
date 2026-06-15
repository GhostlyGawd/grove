# RESUME — fresh-chat handoff (Grove / Superset replica)

**Read this + `STATE.json` + `DECISIONS.md` + `PARITY.md` + `RUBRIC.md` + latest `evidence/` to re-derive everything. Do NOT rely on chat history.**

- Product: **Grove** — 1:1 cross-platform OSS replica of Superset (parallel CLI-agent orchestration over isolated git worktrees).
- Repo: `github.com/GhostlyGawd/superset-replica-build` · Linear project "SWARM — Superset Replica" (`a778bfa7-a33c-4069-b217-33169206345d`).
- Workspace: `D:/GitHub Projects/superset-replica-build`. Toolchain: bun, node 24, gh, rg, caddy (all installed). No Docker (PGlite substitutes — ADR-0003).

## Shipped
- **v0.1.0** Phase 0 (recon + architecture + skeleton; 3-OS CI green).
- **v0.2.0** Phase 1 (Grove brand + `@swarm/ui` design system; anti-slop Critic PASS).
- **v0.3.0** Phase 2 (cross-platform **host engine** — worktree isolation, node-pty agent supervision, adapters, PGlite persistence, WS sync, secure Hono+tRPC daemon; parallel-agents proof P01/P02/P04/P10/P11 + real dispatch P03 + lifecycle P07 **green on Windows+macOS+Linux**, run 27536255083; Critic review-3 PASS; zero quarantines). Linear P01-P04/P07/P10/P11 = Done.
- **v0.4.0** Phase 3 (**Desktop client** — Electron + React on `@swarm/ui`, wired to the REAL host: terminal P05, diff/editor P06, open-in-external P08 [host proc], nav + shortcuts/settings P09; host `settings`/`projects` routers, terminal-IO WS). **Green on Windows+macOS+Linux** run 27550630185 (verify matrix + new real-host `e2e (desktop)` job); independent Critic ALL-PASS incl §6.3; axe a11y 0 critical/serious; perf budgets recorded. Linear P05/P06/P08/P09 = Done. _Billing block (ADR-0012) resolved by making the repo public._

## CURRENT — Phase 4 (Mobile-native PWA), IN PROGRESS. **v0.4.0 shipped; CI is healthy again (repo public).**
Build `apps/mobile` as an installable, offline-first PWA giving **full agent-orchestration control from the phone**, on `@swarm/ui` + the REAL host (host already serves permissive CORS on `/trpc` for browser clients; manifest/bearer connection model as the desktop). Scope (§8 / P12): web app manifest + service worker (offline shell + cached app), **Web Push/VAPID** notifications, touch gestures, safe-area insets, 60fps; the core journeys — workspace list/switch, live agent status, terminal view (xterm over the `/terminal` WS), diff review, dispatch/quick-create — adapted to a phone layout. Gate: Playwright e2e at a phone viewport vs the real host; **independent Phase-4 Critic** incl the §6.3 design bar + phone screenshots → `evidence/phase-4/review.md` ALL-PASS → cut **v0.5.0** + move Linear P12 to Done.
- **Architecture + wave plan recorded in ADR-0014** (host serves the PWA same-origin; QR/single-use-code pairing → bearer in IndexedDB, never in QR/URL/SW-cache; LAN bind opt-in preserving P11; secure-context features [SW/install/push] BUILT in Phase 4 + validated at localhost via e2e, secure LAN/remote origin = Caddy/tunnel in Phase 5; Web Push via `web-push` MIT against the already-defined notifications router + tables; injectManifest SW; new `BottomNav`). **Waves: W1 app skeleton (ACTIVE) → W2 host static-serve + pair router + pairing screen → W3 read journeys → W4 terminal+dispatch → W5 offline SW + push → W6 e2e+evidence+Critic → v0.5.0.**
- Discipline reminders: REAL host (no mocks on user paths); record decisions in DECISIONS.md (never ask); delegate to subagent waves (return ≤40 lines + paths); no banned tokens; **gate every pushed HEAD with a clean install + confirm the 3-OS CI run** (cold `--force` ≠ CI ≠ clean-install; and re-gate AFTER adding evidence/QA specs — a QA spec slipped a TS error past a feature-scoped gate in Phase 3, caught only by the Critic).
- Note: the desktop shell intentionally does not reflow below ~16rem — that's fine for a desktop client; the phone experience is Phase 4's job. Open follow-ups to route via /retro: the billing-misdiagnosis rule + the re-gate-after-evidence rule (see harness state/followups).

## Remaining roadmap (§4)
- **Phase 4** Mobile-native PWA (installable, offline-first, Web Push/VAPID, gestures, safe-area, 60fps; full agent-orchestration control from the phone) → v0.5.0.
- **Phase 5** Platform & self/remote setup (one-command bootstrap on Win/mac/Linux; Electron installers NSIS/dmg/AppImage via electron-builder; phone-only remote path; cloudflared/localtunnel + Caddy) → v0.6.0.
- **Phase 6** Hardening & launch: full e2e green on 3 OSes; **produce the §6.2/§6.4 reports the Phase-2 Critic flagged as missing — performance report + recorded speed budgets (terminal-stream latency, interaction latency, cold start) + a license-audit report**; accessibility; security; docs incl phone-only path; `docs/demo.md`; **HANDOFF.md** → cut **v1.0.0** when all §9 exit conditions pass with evidence.

## Hard-won gate discipline (ADR-0011 + addendum)
- **Local `turbo --force` ≠ CI.** Gate app/desktop changes with a **CLEAN install** (rm node_modules + `*.tsbuildinfo` + `.turbo`, `bun install --frozen-lockfile`, then CI's exact steps). Always confirm the 3-OS CI run after pushing.
- Monorepo: explicit `.ts` import extensions + `allowImportingTsExtensions` (Node strip-types workers).
- Windows engine discipline: spawn agent processes **directly** in the PTY (node-pty) with `onExit`; resolve `node`→`process.execPath` (no PATH/`where` in spawned workers); run **batch** commands via `child_process` (not a PTY); test workers flush-then-`process.exit`; bounded `fs.rm({force,maxRetries})` + async-spawn/tree-kill; never rely on Node executing `.ts` or a shell forwarding a child's stdout through ConPTY on the GH Windows runner.
- Playwright: on Windows run via **node, not bun**; CI must `playwright install` browsers before any e2e. Electron: `ELECTRON_SKIP_BINARY_DOWNLOAD=1` in CI (build/typecheck only; GUI launch verified locally + packaged Phase 5).
- Every phase ends with an **independent Critic (fresh context, did NOT build it)**; for feature-UI phases include the §6.3 design bar + screenshots. No banned tokens; no mocks on user happy paths.

## Harness (recursive-harness) housekeeping
- Open predictions to score once resolved: `ec5bd054` (desktop foundation), `0dce6bdf` (B1 terminal/diff), `4927acf5` (B2 nav). Score with `python <harness>/bin/harness outcome <id> --result hit|miss --notes "..."`.
- Follow-up `7c07bf` (and queued in this file): run `/retro` → `/harness-pr` to route the CI-gate lessons (turbo-cache false-green → `--force`; **`--force` ≠ CI → clean-install gate**; Windows ConPTY discipline; fresh independent Critics catch fakes) into harness artifacts. Do at a clean phase boundary.
