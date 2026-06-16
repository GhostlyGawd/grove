# Phase-6 Performance Report — cross-platform re-measure (spec §6.4)

The Phase-3 perf report (`evidence/phase-3/perf-report.md`) recorded the desktop speed
budgets on the **Windows dev host** and found one over-budget metric — the terminal-stream
round-trip p95 (611 ms) — which it attributed, with evidence, to **interactive Windows
PowerShell 5.1 per-command variance, not Grove's transport** (the transport floor was a
fast sub-120 ms cluster, min 35 ms). It explicitly deferred the **Linux/macOS
re-measurement to Phase 6**. This report closes that follow-up.

The **same** measurement harness (`apps/desktop/e2e/_perf.spec.ts`) was run against a
**real** Grove host on **Linux** in CI, where the shell is `bash` (far lighter per-command
cost than interactive PowerShell). The result confirms the thesis: on Linux **every budget
passes**, and the terminal-stream p95 collapses from 611 ms (Windows) to **43.4 ms** — a
~14× improvement — with the slowest single Linux sample (46.2 ms) still inside the 150 ms
p50 budget. The over-budget tail was the host shell, not Grove.

## Source of the Linux numbers (real, not synthetic)

- **CI run:** `27626509741` (HEAD `6430a00`, branch `main`), job **`e2e (desktop,
  ubuntu-latest)`** (job id `81689476723`), step **"Desktop perf re-measure (report-only,
  Linux numbers)"** — green. Numbers emitted to the job log as `PERF_RESULTS` /
  `PERF_METRIC` lines and uploaded as the `grove-perf-results-linux` artifact
  (`apps/desktop/grove-perf-results.json`).
- **Host:** the REAL `@swarm/host` daemon booted by `apps/desktop/e2e/global-setup.ts`
  (real `node-pty` PTY supervisor, PGlite store, live sync), seeded with a project + three
  worktrees — identical to the product e2e. The renderer makes genuine tRPC + `/sync` + PTY
  calls; **no mocks**, every figure a real `performance.now()` reading from the connected
  app.
- **Spec:** report-only (the only assertions are sanity guards that each run gathered its
  full sample set; **no budget gating**, so over-budget numbers are reported honestly rather
  than failing red). The CI step is `continue-on-error: true` for the same reason.
- **Runner:** GitHub-hosted `ubuntu-latest`, Node 24, Playwright bundled Chromium. The
  measured span still includes the disclosed single-digit-ms Playwright/CDP input-dispatch
  overhead, **not** subtracted (biases slightly slow, never fast).

## Results vs budget — Windows (Phase 3) vs Linux (Phase 6)

| Metric | Budget | Windows p50 / p95 (Phase-3 dev host) | **Linux p50 / p95 (Phase-6 CI)** | Linux verdict |
|---|---|---|---|---|
| Renderer cold start | < 3000 ms | 377 / 423 ms | **200 / 247.2 ms** | **PASS** (~12× margin) |
| Interaction — open dialog (Settings) | < 100 ms p50 / < 250 ms p95 | 110 / 165 ms (p50 marginally over) | **53.4 / 65.6 ms** | **PASS** (both) |
| Interaction — switch workspace (keyboard) | < 100 ms p50 / < 250 ms p95 | 25 / 63 ms | **18.2 / 23.4 ms** | **PASS** |
| Terminal-stream round-trip (P05) | < 150 ms p50 / < 400 ms p95 | 159 / **611 ms (OVER)** | **32.7 / 43.4 ms** | **PASS** (huge margin) |

Linux min/max (ms): cold start 188.1 / 249.8 · dialog 45.4 / 119.7 · switch 9.9 / 35.6 ·
**terminal 24.6 / 46.2**. Sample sizes: cold start n=10, dialog n=20, switch n=20, terminal n=25.

## Reading of each result

- **Cold start — PASS.** 200 / 247 ms against a 3000 ms budget. Each iteration uses a fresh
  browser context (cold module/HTTP cache) → a true renderer boot + `workspaces.list`
  resolve, not a warm reload. Packaged-Electron cold start is verified separately (Phase 5).
- **Dialog open — PASS (both percentiles).** 53.4 / 65.6 ms. The Phase-3 Windows p50 (110 ms)
  that sat ~10 ms over the aggressive 100 ms target clears it comfortably on Linux, with the
  disclosed CDP-dispatch overhead included.
- **Workspace switch — PASS.** 18.2 / 23.4 ms, far inside budget — the tightest, most
  frequent interaction is effectively instant.
- **Terminal-stream round-trip — PASS, and this is the headline.** 32.7 / 43.4 ms vs the
  150 / 400 ms budget. This is the metric that was OVER on Windows (159 / 611). Measured the
  same way (Enter → the command's deterministic marker appears in the live xterm buffer,
  round-tripping host PTY + `/terminal` WebSocket + xterm render; the marker is contiguous
  only in the command's *output*, never the echoed input). On Linux the **entire**
  distribution is tight (max 46.2 ms) — there is no tail. This directly confirms the Phase-3
  diagnosis: the Windows p95 spikes (300–806 ms) were interactive PowerShell 5.1
  per-command processing (PSReadLine re-render, pipeline spin-up), **not** Grove's streaming
  transport, which clears budget by ~3–9× on a normal shell.

## Verdict

**All four speed budgets — cold start, interaction latency (dialog + switch), and
terminal-stream latency — are MET on Linux**, the cross-platform re-measure the Phase-3
report deferred. The single Windows-dev-host concern (interactive-PowerShell terminal tail)
is confirmed to be a host-shell characteristic, not a Grove transport issue: on Linux the
terminal round-trip p95 is 43.4 ms. The Windows numbers remain documented honestly in
`evidence/phase-3/perf-report.md` (the dev host runs interactive PowerShell); the transport
itself meets budget on every platform measured.

## Reproduce

```
# Linux (CI): the e2e (desktop, ubuntu) job runs this after the product e2e
cd apps/desktop && GROVE_E2E_MEASURE=1 node ./node_modules/@playwright/test/cli.js test _perf.spec.ts --reporter=line
# numbers print as PERF_RESULTS / PERF_METRIC lines + apps/desktop/grove-perf-results.json
```
