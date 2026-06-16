# Phase-6 Critic Review — Grove v1.0.0 launch-hardening (independent, did NOT build it)

Critic: independent (fresh context; no builder narrative used). Graded from the ARTIFACTS per the
section 6.5 protocol. No builder reasoning/chat history was provided — this verdict is from
request + artifacts only. Date 2026-06-16.

Scope reminder: HANDOFF.md + CHANGELOG [1.0.0] + the v1.0.0 tag are the orchestrator's CUT step
done AFTER this ALL-PASS, so their absence is NOT graded (per the assignment).

---

## Commands I actually ran (not read) + headline results

- Banned tokens (exact 6.1 regex over apps packages README.md docs evidence/phase-6): EMPTY
  (exit 0, zero matches).
- UI contrast/Dialog suite, cd packages/ui && bun test: 69 pass / 0 fail (64 token + 5 Dialog),
  137 expects.
- fgSubtle ratios, independently computed via the repo's own ratio(): new #8b958f gives overlay
  4.87 / raised 5.35 / surface 5.79 (all >= 4.5); old #828d88 overlay 4.38 (confirms the bug was
  real).
- tokens.ts vs tokens.css mirror: dark #8b958f in BOTH (ts:78, css:31); light #677069 in BOTH —
  mirror holds.
- Dialog closed=hidden (Dialog.tsx:78 + Dialog.test.tsx): open ? "flex" : "hidden" +
  useLayoutEffect; test asserts closed -> hidden/not-flex, open -> flex/not-hidden.
- TerminalFrame props: showFind/showSplit added (default true); mobile TerminalView.tsx:240-241
  passes false/false.
- CI green, gh run view 27626509741: conclusion=success; all 8 jobs success incl. verify(windows),
  package(windows), verify(mac/ubuntu), e2e desktop+mobile, package(mac/ubuntu) — no skipped/red
  Windows job.
- Perf numbers real, gh run view --job 81689476723 --log | grep PERF: log PERF_RESULTS matches the
  report exactly: cold 200/247.2, dialog 53.4/65.6, switch 18.2/23.4, terminal 32.7/43.4.
- grove bin works, node apps/cli/src/index.ts status: "grove daemon: STOPPED (no manifest)" —
  honest, exit 0, no crash.
- Mock gate enforced (orchestrator.ts:272-273 + mock-adapter.ts:27-34): throws unless enable:true
  or env SWARM_ENABLE_MOCK_ADAPTER; listAdapters/BUILTIN_ADAPTERS exclude mock.
- Generic requires command (orchestrator.ts:286): throws when command absent.
- No shell injection, rg "shell:\s*true" apps packages: EMPTY (exit 1) — confirms security-review
  section 8.
- License: no copyleft shipped (.bun grep + direct reads): zero GPL/AGPL/LGPL; spot-reads hono MIT,
  zod MIT, web-push MPL-2.0, axe-core MPL-2.0 (the 2 flagged MPL real + correctly classified).
- LICENSE + root license: MIT License file present; root "license": "MIT".
- Docs honest (verbs exist): all documented verbs (up/start/stop/status/host/pair) in
  CLI_COMMANDS; docs use bun link / from-repo node — no fake published-npm claim.

---

## 6.1 — Definition of Done: PASS

- Builds/lint/typecheck clean: ci-green.md records the cold gate (install 1387 / lint 254 /
  typecheck 17/17 / build 17/17 / test 11 groups) AND the green CI verify matrix runs Biome +
  tsc --noEmit + build + bun test on all 3 OS. Run confirmed green via gh.
- Real tests + e2e of actual journeys: UI bun test 69/69 verified live. e2e specs exist for
  desktop (shell/content/b2) and mobile (pairing/read-journeys/terminal/z-dispatch/pwa/push) with
  substantive assertion counts (b2:16, read-journeys:15, shell:11, terminal:9) — not
  assertion-free smoke. b2 drives a real open-external-on-host path + keyboard worktree nav.
- It actually runs: node apps/cli/src/index.ts status returns an honest status.
- No banned tokens: the exact 6.1 regex is EMPTY.
- Cross-platform CI green: run 27626509741 = success, all 8 jobs green INCLUDING both Windows jobs.
  No skipped/red Windows job.
- No mock masquerading: mock is double-gated (env/explicit, throws otherwise), absent from
  listAdapters/BUILTIN_ADAPTERS; generic hard-requires a command. Verified at source.

## 6.2 — Prove-it (evidence, not prose): PASS

Every completion claim is backed by an inspected artifact under evidence/phase-6/:
a11y-report.md (corroborated by live bun test 69/69 + my own ratio recomputation — the report's
numbers are exactly correct); ci-green.md (corroborated by gh run view 27626509741);
perf-report.md (corroborated by the CI job-log PERF_RESULTS, matching to the decimal);
license-audit.md (corroborated by direct .bun license reads + the zero-copyleft grep);
security-review.md (cited file:line spot-checked: bind host, bearer, mock gate, shell:true,
generic-requires-command — all hold).

## 6.3 — Anti-slop design bar (the a11y UI changes): PASS

The only product-code change is the @swarm/ui a11y hardening; it strengthens the already-passed
system rather than introducing slop: the color system is now provably AA on raised+overlay
(deterministically enforced by tokens.test.ts for BOTH themes, so regression fails the build);
the closed-overlay Dialog/Sheet quirk is killed at the source (real state: display:none when
closed) instead of per-consumer workarounds; the inert mobile Find/Split buttons are gone (no decorative
dead controls). axe = 0 critical / 0 serious / 0 moderate / 0 minor on desktop + mobile, including
the overlay surfaces the fix targets. No new feature UI; coherence/craft preserved.

## 6.4 — Quality dimensions >= ship: PASS

Frontend/UX (a11y system fix, real states); backend (loopback-default, bearer-gated, no
shell:true); tooling (Biome/tsc/turbo, clean cold gate); functionality (real CLI bin, honest
status); performance (4/4 budgets MET on Linux from a REAL host e2e: cold 200/247.2 < 3000; dialog
53.4/65.6 + switch 18.2/23.4 < 100p50/250p95; terminal 32.7/43.4 < 150p50/400p95 — the Phase-3
Windows p95 tail shown to be PowerShell variance, not transport); accessibility (axe 0/0; touch
targets >= 44px; keyboard reachability); security (7 PASS areas, 4 findings all Low/Info accepted,
no High/Critical, no blocker); mobile-native (PWA + touch terminal/accessory bar); docs (README +
getting-started incl phone-only path + demo.md, all honest about the real grove invocation paths).

---

## Findings (severity)

- F1 (Info, does NOT block cut): web-push@3.6.7 (MPL-2.0) is the one copyleft dep on a SHIPPED
  runtime path. MPL-2.0 is file-level weak copyleft, consumed unmodified — correctly classified
  non-triggering by license-audit.md.
- F2 (Info, does NOT block cut): SEC-1/SEC-2 (default-permissive CORS; bearer in WS ?token= query)
  are accepted residuals; the 256-bit bearer is the real gate and the host is loopback-by-default.
  Verified at origin-allowlist.ts + server.ts:112-122.
- F3 (Info, does NOT block cut): SEC-4 installers unsigned (no paid cert); SmartScreen/Gatekeeper
  disclosed in PACKAGING.md with mitigations.

No defect found is falsifiable as a launch blocker. The single non-reverted a11y case (the
WorkspaceRail selected-row label on bg-accent-bg, kept at text-fg-muted because #8b958f = 4.46
there) is the correct, honest call — that surface is an accent-bg dodge, not raised/overlay, and
axe still reports 0 serious.

---

## OVERALL VERDICT: ALL-PASS — ready to cut v1.0.0

6.1 PASS / 6.2 PASS / 6.3 PASS / 6.4 PASS. Every claim I could verify mechanically (banned-tokens,
UI tests, contrast ratios, tokens.ts/css mirror, Dialog hide, TerminalFrame props, CI conclusion +
per-job, perf log vs report, mock/generic gating, shell-injection grep, license reads, LICENSE/bin,
grove status, doc-verb existence) verified TRUE and matched the evidence. No fake, no unproven
claim, no over-budget metric, no banned token, no mocked user path. The orchestrator may proceed to
the CUT step (tag + CHANGELOG [1.0.0] + HANDOFF.md).
