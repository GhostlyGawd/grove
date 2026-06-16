# Phase-6 CI evidence — full 3-OS green (spec §6.1 / §6.2)

The §6.1 "cross-platform CI green" gate: `windows-latest` + `macos-latest` + `ubuntu-latest`
all pass build / lint / typecheck / unit+integration / e2e — **a red OR skipped Windows job =
NOT done.** Phase 6 introduced one product code change (the `@swarm/ui` a11y source fixes,
Wave 1) plus the launch-hardening additions (MIT LICENSE, a real `grove` bin, the CI Linux
perf step); both landed 3-OS-green.

## Authoritative Phase-6 run — HEAD `6430a00` (all launch-hardening code)

**CI run `27626509741`** (branch `main`, push) — **conclusion: success**, all **8 jobs green**:

| Job | OS | Result | Time |
|---|---|---|---|
| verify | windows-latest | ✅ success | ~3m |
| verify | macos-latest | ✅ success | 1m20s |
| verify | ubuntu-latest | ✅ success | 1m04s |
| e2e (desktop) | ubuntu-latest | ✅ success (+ Linux perf re-measure step) | 1m17s |
| e2e (mobile) | ubuntu-latest | ✅ success | 48s |
| package | windows-latest | ✅ success | 2m31s |
| package | macos-latest | ✅ success | 1m05s |
| package | ubuntu-latest | ✅ success | 32s |

- `verify` (×3 OS) runs the real gate: `bun install --frozen-lockfile` → Biome lint → `tsc
  --noEmit` typecheck → `turbo build` → `bun test` (real PTY/host/worktree/diff integration,
  Node-pinned PTY layer per ADR-0007a) — **green incl. `windows-latest`.**
- `e2e (desktop)` drives the real desktop renderer against a REAL seeded host (P05 terminal,
  P06 diff, P08 open-external, P09 nav/shortcuts) and then runs the report-only **Linux perf
  re-measure** (job `81689476723` → `evidence/phase-6/perf-report.md`).
- `e2e (mobile)` drives the real PWA at a phone viewport against a REAL host (pairing, read
  journeys, touch terminal, dispatch, offline SW + push opt-in) — P12.
- `package` (×3 OS) validates the electron-builder packaging config cold (`electron-builder
  --dir`, real Electron binary, asserts the packed `app.asar` carries main/preload/renderer)
  — P14.

The only annotations on the run are GitHub's Node-20-runner deprecation notices (informational;
they concern the hosted-runner action runtime, not Grove's code or build).

## Wave-1 a11y code — HEAD `9655025`

**CI run `27623871151`** — **success**, all 8 jobs green (same matrix). This validated the
`@swarm/ui` a11y SOURCE fixes (token AA on raised+overlay, Dialog/Sheet closed=display:none,
TerminalFrame `showFind`/`showSplit`) across all three OSes. Evidence:
`evidence/phase-6/a11y-report.md` (axe 0 critical / 0 serious, desktop + mobile).

## Local cold-gate (the pre-push CI proxy, ADR-0011/0012)

Each pushed HEAD was gated locally with a **clean install** before pushing (rm `node_modules`
+ `.turbo` + `*.tsbuildinfo` → `bun install --frozen-lockfile` → lint → typecheck → build →
test — the exact CI steps, cache-disabled): both `9655025` and `6430a00` were green cold
(install 1387 pkgs · lint 254 files · typecheck 17/17 · build 17/17 · test 11/11 task groups,
incl. `@swarm/ui` 69/69 and the real `grove` daemon lifecycle in `@swarm/cli` 18/18) before
the push that produced the green CI runs above.

## Verdict

§6.1 cross-platform CI green is satisfied for the Phase-6 product at HEAD `6430a00`
(run `27626509741`), Windows included, with the real user journeys (desktop + mobile e2e) and
packaging validated on all three OSes. The v1.0.0 release commit adds only docs / CHANGELOG /
blackboard / the tag (zero product code over `6430a00`); its release CI run re-confirms green
at the cut.
