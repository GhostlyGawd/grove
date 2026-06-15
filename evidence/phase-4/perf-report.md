# Phase-4 Performance Report (spec §6.4 — mobile PWA)

Recorded speed budgets for the Grove **mobile PWA** (`apps/mobile` — React on `@swarm/ui`,
paired to a REAL host), measured against a **real** Grove host. No mocks, no synthetic
numbers: the PWA is served same-origin by the host booted in the e2e `global-setup.ts`,
the phone redeems a real single-use pairing code, and every figure below is a real
`performance.now()` reading from the live, paired app at a phone viewport.

## Methodology

- **Harness:** `apps/mobile/e2e/_perf.spec.ts` — an assertion-light measurement tool (the
  only assertions are sanity guards that each run gathered its full sample set; no budget
  gates, so over-budget numbers would be reported honestly rather than failing red).
- **Host:** booted by `e2e/global-setup.ts` — a real `@swarm/host` daemon that **also
  serves the built PWA same-origin** (ADR-0014), seeded over the engine's own store with a
  project + three worktrees (one a real on-disk git checkout with a live `claude-code`
  session), a real `@swarm/pty-supervisor` PTY, and a live `/sync` log. The browser loads
  the PWA from the host origin and makes genuine `pair.redeem` + tRPC + `/sync` + `/terminal`
  WebSocket calls — exactly like the product specs.
- **Viewport:** Playwright's **Pixel 5** device — 393×727 CSS px at devicePixelRatio 2.75,
  `isMobile`/`hasTouch` on — the same phone profile the screenshots use.
- **Timing technique:** an in-page `requestAnimationFrame` poller stamps `performance.now()`
  the instant the observable transition occurs (list populated / tab body mounted / sheet
  `dialog[open]` / marker present in the xterm buffer); `start` is captured with
  `performance.now()` immediately before the Playwright action. The measured span therefore
  includes **a few ms of Playwright/CDP input-dispatch overhead, which is NOT subtracted** —
  disclosed here rather than massaged out. This biases results slightly slow (never fast),
  the safe direction.
- **Machine (Windows dev host):** Windows 10 `10.0.19045`, Node `v24.14.1`, Playwright
  `1.60.0` with its bundled Chromium.
- **Scope:** a single Windows developer host, phone **viewport** in desktop Chromium — not a
  real device, not a real network. **Cross-platform and true on-device re-measurement
  (real Android/iOS hardware, cellular/Wi-Fi RTT, installed standalone PWA) is a Phase-6
  follow-up;** these numbers characterize the dev host only and are not an on-device
  guarantee.

### Cold-start definition (disclosed)

"Cold start" here is the **returning-user, installed-PWA boot**: the device already holds a
paired bearer in IndexedDB, so each iteration is `navigate → read stored pairing → connect →
real workspaces.list rendered`. The phone is paired once up front; the service worker has
precached the app shell (the realistic installed condition, W5). A **first-ever** pairing
additionally pays a one-time `pair.redeem` round-trip plus the manual "Link this phone" tap —
that is pairing latency, deliberately excluded from cold-start. Iterations reuse one context
so IndexedDB persists; the shell is SW-warm while the connect round-trip is genuinely re-run.

## Results vs budget

| Metric | n | p50 | p95 | Budget | Verdict |
|---|---|---|---|---|---|
| Cold start — boot → paired live workspace list | 10 | **115 ms** | **229 ms** | < 3000 ms | **PASS** (≈26× margin on p50) |
| Interaction — switch tab (Workspaces → Settings) | 20 | **55 ms** | **64 ms** | < 100 ms p50 / < 250 ms p95 | **PASS** |
| Interaction — open workspace-detail sheet | 20 | **58 ms** | **74 ms** | < 100 ms p50 / < 250 ms p95 | **PASS** |
| Terminal-stream round-trip (send → marker in xterm) | 25 | **45 ms** | **57 ms** | < 150 ms p50 / < 400 ms p95 | **PASS** |

Min/max (ms): cold start 81 / 231 · tab switch 46 / 81 · sheet open 50 / 92 · terminal 30 / 63.

## Reading of each result

### Cold start — PASS (large margin)

Measured navigation start → the real `workspaces.list` resolved and the seeded worktrees
(`diff-demo`) rendered. p50 115 ms / p95 229 ms against a 3000 ms budget — a ~26× margin.
The service worker serves the precached shell, so this isolates React boot + IndexedDB read +
the live host connect + first list paint. **First-ever-pair cold start (redeem round-trip +
manual tap) and packaged/standalone install start are not measured here** — the installed-app
returning-user path is what budget §6.4 targets and it clears comfortably.

### Interaction — switch tab — PASS

Tap the BottomNav `Settings` tab → the Settings body mounts (its "Appearance" section is
unique to that tab, so its appearance is the transition signal). p50 55 ms / p95 64 ms, well
inside the 100/250 ms budget. Pure client-side section swap; no host read on this path.

### Interaction — open workspace-detail sheet — PASS

Tap a worktree row → the native `<dialog>` (`@swarm/ui` Sheet) reaches `showModal()` /
`[open]`. p50 58 ms / p95 74 ms, inside budget. The span includes the disclosed CDP
tap-dispatch plus a React commit and the dialog's first paint; the sheet's git-status and
sessions reads stream in afterward and are intentionally not part of the open-latency signal.

### Terminal-stream round-trip — PASS

Measured Enter-press → the command's deterministic marker appearing in the live xterm buffer,
round-tripping through the host PTY + `/terminal` WebSocket + xterm render. To avoid timing
the input echo, the typed command splits the marker across two string literals the shell
concatenates, so the marker is **contiguous only in the command's output**, never in the
echoed input. Two warm-up iterations spin the interactive shell up first (that cold-spawn is a
tab-open cost, not stream latency). p50 45 ms / p95 57 ms against a 150/400 ms budget — the
distribution is tight (min 30, max 63; no long tail), so the WebSocket + PTY + xterm path
clears budget on this host with margin to spare.

## Raw samples (ms)

- **coldStart** (n=10): 231.2, 194.2, 225.5, 82.3, 81.1, 101.2, 114.6, 144.1, 111.8, 116.2
- **tabSwitch** (n=20): 81.4, 52.9, 55.4, 48.9, 52.2, 46.4, 60.0, 54.9, 46.5, 47.8, 46.8,
  58.0, 62.6, 59.0, 57.2, 55.3, 57.1, 55.5, 56.3, 58.4
- **sheetOpen** (n=20): 92.4, 72.5, 57.3, 53.5, 54.2, 52.7, 50.6, 62.2, 56.5, 64.2, 59.1,
  67.2, 60.2, 50.8, 59.6, 50.2, 66.9, 55.8, 55.8, 58.9
- **terminalStream** (n=25): 30.3, 57.0, 49.6, 40.3, 43.6, 44.1, 54.0, 45.4, 42.1, 63.3,
  32.1, 39.8, 54.9, 48.1, 51.8, 35.0, 51.0, 51.7, 47.3, 46.1, 44.1, 48.6, 29.9, 45.2, 38.5

## Verdict

- **All four metrics PASS** their §6.4 budgets on this Windows dev host, every one with
  comfortable margin (cold start ~26×; both interactions ~1.5–1.8× inside the p50 line;
  terminal-stream ~3× inside p50 and ~7× inside p95).
- No over-budget items to disclose. Notably, the mobile terminal-stream tail is far tighter
  than the desktop Phase-3 reading on the same shell — the single live phone pane streams a
  short deterministic `echo` with no bimodal PowerShell spikes in this sample.
- The only honesty caveat is scope: phone **viewport** in Chromium on one Windows host, not
  real hardware/network. Real-device + cross-platform re-measurement is the Phase-6 perf
  follow-up.

Reproduce: from `apps/mobile`,
`GROVE_E2E_MEASURE=1 node ./node_modules/@playwright/test/cli.js test _perf.spec.ts`
(the env flag lifts the default `testIgnore` on `_*.spec.ts`; numbers are written to a
machine-readable `grove-mobile-perf-results.json` in the OS temp dir).
