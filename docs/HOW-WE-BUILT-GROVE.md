# How We Built Grove

**An OSS dev tool, shipped v0.1.0 → v1.0.0 plus a live launch site, fully autonomously across 6 sessions over 4 days, with zero human in the per-step loop.**

This is an operator's account of a single build. Read it as one data point (N=1 for Grove specifically, N=2 for the underlying procedure), not a law. The product — Grove, mission control for a swarm of CLI coding agents over isolated git worktrees — is bespoke and largely disposable. The procedure is the part worth keeping. Where this document claims something worked, it cites the artifact that proves it: an ADR id, a CI run id, an evidence path. Where it didn't work, it says so and cites that too.

---

## 1. The premise

Model weights are frozen. The repo is the learnable layer. Improvement does not mean a smarter model next week; it means committed diffs to versioned artifacts that change how the next build runs. That constraint is the whole reason this retrospective exists as a file and not as a memory.

Grove was the second large autonomous build, after AgentOps Trust OS. One build proves nothing about repeatability. Two builds on deliberately different product classes — a compliance product, then an OSS developer tool — start to tell you whether "autonomous venture build" is a real procedure or a one-off that happened to land. Grove was run as that test: same kernel laws (predict first, route every learning, independent critique, never touch the enforcement layer), different domain, different stack, different surfaces.

The honest answer it returned: the core loop is the durable invariant. The product is incidental.

---

## 2. The problem that kills long builds — context resets

Six sessions over four days. No shared chat memory between them. Each session started cold, with the prior session's reasoning compacted or gone. This is the failure mode that ends most multi-session autonomous work: the build forgets where it is, re-litigates settled decisions, or — worse — believes it is further along than it is.

The load-bearing answer was **the blackboard**: a fixed set of append-only files on disk that fully reconstruct "where am I, why, and is it proven," so that no session ever depends on chat history.

- **`STATE.json`** — the canonical "where am I" pointer. Its own schema note says it plainly: *"Canonical pointer to where the build is. Re-derive context from this + blackboard files; do not scroll chat history."* Every phase line is a falsifiable provenance tuple — version + CI run id + independent-Critic verdict + evidence path + parity ids. For example, the Phase-2 line reads: `done (v0.3.0; CI run 27536255083 GREEN 3 OSes; Critic review-3 PASS; P01/P02/P03/P04/P07/P10/P11 proven incl Windows; no quarantines)`. You cannot fake that line — every claim in it points at an inspectable artifact.
- **`DECISIONS.md`** — an append-only ledger of 22 ADRs. Every ambiguity that a human would normally resolve was resolved here instead, in writing, with the rejected alternative recorded.
- **`PARITY.md`** — the 14-item parity checklist (P01–P14) that defined "feature-complete" against the target.
- **`RUBRIC.md`** — the versioned definition of "done," so done was never the builder's opinion.
- **`RESUME.md` / `HANDOFF.md` / `LAUNCH-HANDOFF.md`** — the session entry points. Each opens with the same instruction: re-derive from the blackboard, not from chat history.

Every session re-grounded purely from these files. That is the single most reusable lesson of the build, and it is exactly what the current venture-build skill lacks — its `ledger/` is a business cockpit (founder report, metrics, kill/pivot), with no fresh-context resume contract.

---

## 3. Deciding without a human — the ADR ledger

With no human in the per-step loop, every ambiguity had to be resolved on disk, autonomously, and reversibly. The rule was: each ADR records context, the decision, and **the rejected alternative** — so a later session (or a reviewer) can see what was traded away and re-open it if reality disagrees.

Representative decisions:

- **`ADR-0001` — own repo, not a worktree of the harness.** Grove lives at `github.com/GhostlyGawd/grove`, a fresh sibling repo, not inside `products/<slug>/` in the brain. Rejected: worktree/subdir of the harness. (Why this matters is its own ADR in the trunk — see §10.)
- **Docker → PGlite.** The host lacked a running Docker daemon (`STATE.json` toolchain: `"docker": "MISSING (daemon not running)"`). Rather than escalate, the build substituted embedded Postgres (PGlite, WASM) behind Drizzle ORM, with real Postgres kept as a documented-optional path.
- **Tauri → Electron**, and **native mobile → PWA-first** — same pattern: when a dependency wanted a toolchain the host didn't have, pick an OSS equivalent behind the same interface and keep the heavy path optional.
- **Astro → reuse the existing Vite/React/`@swarm/ui` stack** for the marketing site (`ADR-0021`), so the site is a working instance of the product, not a separate stack.

RISK-flagged ADRs got a later **OUTCOME** ADR. The node-pty decision is the cleanest example: it was opened as a risk, validated by actually running it, and the outcome was recorded — `ADR-0007a` — including the non-obvious truth it surfaced (see §8).

The build escalated to the human exactly once, and only for the one thing that is genuinely external account state: a GitHub Actions billing block (§7). Everything internal to the code or the design, it decided itself.

---

## 4. The design story — a judge-panel, not a single draft

This is the part the user singled out. The mechanism that kept design consistent across desktop, mobile, the showcase, and the marketing site was not one model drafting one page. It was a multi-agent design Workflow that reads as a judge-panel:

1. **Fan out 4 distinct, on-brand directions** — genuinely different takes, not four variations of one.
2. **Adversarially score them** on five explicit lenses (brand fidelity, anti-slop, launch credibility, interactivity, performance feasibility).
3. **Synthesize the winner into one frozen, per-section build spec** (`apps/site/DESIGN.md`), which separates the creative decision from the build so the builder cannot drift mid-implementation.
4. **Distill a brand book** (`docs/design-system.md`, `docs/brand/README.md`) with a stated original design thesis — POV, references, and a machine-greppable **AVOID-list** (specific hex values, banned hype words, forbidden APIs) — plus a **MOTION LAW**: *still until you act.* Nothing autoplays; every reveal is user-gated.
5. **Collapse to ONE typed token package** that every surface imports — desktop, mobile, showcase, and the marketing site — so the site reads as a working instance of the product rather than a page about it.

The discipline showed up in the enforceable details:

- **WCAG-AA enforced as a failing test** over all documented color pairs (`RUBRIC.md §6.3`). Contrast is not a review opinion; a bad pair fails the build.
- **State triple-encoded** — color + word + shape. When the brand green and the "done" semantic green deliberately collided, the build did not dilute the brand to fix it; it disambiguated on shape. Color is never the only signal.
- **Honesty labels.** Every forward-looking or not-yet-real element is labeled an illustrative sample. The only unlabeled claims are the ones that are literally true. The install copy on the live site reflects this: the real source path is unlabeled (it works); `brew` / `winget` / `grove.dev` are labeled launch markers because they are not live yet.

The independent design Critic (§5) re-ran its own greps against the AVOID-list and the MOTION LAW and returned ALL-PASS on the site: *"a working instance of the Grove cockpit, not a marketing page about it. No forbidden default is present... Brand AVOID-list is honored. The MOTION LAW holds."* (`evidence/site/review.md`). This whole pipeline is the one piece the converge verdict extracts as its own skill (§10) — it is self-contained and separately triggerable.

---

## 5. The anti-self-deception engine

The central trust failure of an unattended build is the builder grading its own work. Grove's defense had four parts:

- **"Done" lives in a versioned `RUBRIC.md`**, never on the builder's word. `§6.1` is the definition of done per phase; `§6.5` is the Critic protocol; `§6.2` makes evidence mandatory.
- **An independent Critic with fresh context that did NOT build the thing.** Per phase it writes `evidence/<phase>/review.md` with per-rubric PASS/FAIL and the proof it inspected, and it can reject and send the phase back. It re-ran build / axe / Playwright / greps / hand-computed contrast itself — it did not read the builder's prose. There are eight such review files (`evidence/phase-0..6` and `evidence/site`).
- **It did not rubber-stamp.** The site review surfaced an `axe`-incomplete blind spot and a gate-coverage observation as nits. A reviewer that only ever approves is not a reviewer; this one found things.
- **Every phase decomposed into build waves, each ending green**, and every "done" tied to a frozen, inspectable artifact — a CI run id, an axe report, a screenshot, a live-URL fetch. The operating rule: *no evidence ⇒ not done; the Critic checks the artifact, not the prose.*

---

## 6. Where local green lied

Local green and CI green diverged, twice, in instructive ways.

The **Turborepo cache returned false-green hits** — a cached task result reported success on inputs CI then failed cold. The fix became a non-negotiable **cold clean-install gate**: remove `node_modules`, `.turbo`, and `*.tsbuildinfo`; install with a frozen lockfile; then run CI's exact steps in order. A cached local run is never trusted as the proxy for CI.

Separately, a TypeScript error (a `TS2353`) slipped past a **feature-scoped** gate and was caught only when the Critic re-ran the full gate on the exact pushed HEAD. The rule that came out of it: **re-run the full cold gate on the exact pushed HEAD after adding any QA or evidence spec** — adding tests changes the typecheck surface, so a gate that ran before the spec was added is stale.

These are captured in `ADR-0011` and `ADR-0013`, and queued for the trunk as follow-ups.

---

## 7. The CI misdiagnosis that taught a rule

Phase 3 went red on all three OSes. A prior session looked at the red and hypothesized a clean-install **code defect** — and notably could not even fetch the job logs (they came back `BlobNotFound`).

The truth, recorded in `ADR-0012`: every job died in 2–3 seconds, never actually started, and the run annotation said so directly — **GitHub Actions billing exhaustion on a private repo**. A local cold repro came back all-green, which refuted the code hypothesis outright. The code was fine; the runner never ran.

The lesson, now a diagnostic checklist line: **a fast, zero-duration, all-OS red is infra/billing, not code — read the run annotation first.** A run where every OS job fails in 2–3s with `404`/`BlobNotFound` logs is almost never a code problem. The fix was to make the repo public (`ADR-0012`), which is also what later let it ship publicly (`ADR-0001`). This rule cannot be a clean hook — a hook can't read a GitHub run annotation at the decision moment — so it lives as a triage checklist, not enforcement.

---

## 8. Windows-first as a forcing function

The DONE bar was a green `windows-latest` + `macos-latest` + `ubuntu-latest` matrix, from Phase 0. `RUBRIC.md §6.1` states it without an escape hatch: *"A red OR skipped Windows job = NOT done."* A skipped Windows job counts as red. The dev's primary OS being green proves nothing about the OSes where POSIX assumptions break.

That bar forced a concrete Windows discipline:

- **Process supervision via `node-pty`/ConPTY + `tree-kill`** (`taskkill /T /F`), not a SIGTERM-tree that doesn't exist on Windows.
- **All task scripts in TypeScript run via Node/Bun**, never bash-only on a user-facing path.
- **Bounded, transient-ONLY git retries** on Windows file-lock contention (`index.lock`, in-use handles, AV interference) — an errno/stderr allowlist with ~5x backoff. Deterministic errors surface immediately; blanket retry would be wrong.

The decisive blocker was invisible until a runnable validation gate exposed it: **`node-pty` cannot run under Bun on Windows** — Bun tears down the ConPTY `net.Socket`. That is recorded in `STATE.json` and `ADR-0007a`: the PTY layer and host engine run under Node, not Bun. The lesson is that you don't design around the *feared* failure; you open the risky native dependency with a runnable gate and let the gate reveal the *real* one.

---

## 9. The false economy we caught ourselves making

A closed-overlay full-bleed quirk in the shared `@swarm/ui` package was worked around **per-consumer, three separate times** (B2 Dialog, W3 Sheet, and a third site) — each time with conditional mounting, each time parked — before it was fixed once at the source in Phase 6. This is the same-root-cause-different-site shape of being stuck: one defect in a shared primitive, independently patched at N call sites, where every consumer re-pays the cost. The build eventually self-corrected, which is the evidence the right move was the source fix — but the recurrence is what was expensive, and the current stuck-detection trigger (same identical failure twice) does not name this pattern. Reaching for the *second* per-site workaround of the same underlying defect should stop you and send you to the source.

---

## 10. The honest meta-retro

The build claimed it used the venture-build skill. A user push forced a check. **It hadn't.** None of venture-build's scaffold markers existed — no `VENTURE.md`, no `GOAL.md`, no `products/<slug>/`, no business `ledger/`. Grove shared only the **kernel laws**, and those live in `CLAUDE.md`, not in the skill. It built its own, better substrate.

So two divergent autonomous-build instances now exist: AgentOps Trust OS (which used the scaffold) and Grove (which did not). The verdict — recorded as ADRs in the trunk, not silently folded in — is **CONVERGE, do not fork**:

- **Converge into venture-build** the four layers Grove proved and the skill lacks: the resumable blackboard (§2); the per-phase/per-wave independent-Critic blocking gate (§5); the cold-clean-install CI discipline plus the misdiagnosis triage (§§6–7); and the cross-platform N-OS-green DONE bar plus the Windows checklist (§8).
- **Extract exactly one piece as a new sibling skill**: the design-fanout → brand-book → token-contract → AA-as-a-test → anti-slop-Critic pipeline (§4). It is self-contained and separately triggerable, and venture-build should *call* it as a phase, not inline it.
- **Record two structural contradictions as ADRs**: ship-grade ventures own their own repo and reject `products/<slug>/`; and the converge-not-fork verdict itself.

Forking a `grove-build` skill would split the trigger, rot both halves, and fork the brain — the exact failure the kernel's directive 6 and the harness-authoring guidance warn against. The strongest signal in the whole retro is that the same loop held across two unrelated product classes. That is what gets converged. The product does not.

---

## 11. The uncomfortable truth

Across this entire multi-day build, **`/retro` never fired once.** Zero retro-gate markers. The user — not the harness — had to start the learning extraction. The build optimized for shipping and starved its own meta-cadence: nothing in the build loop forces a retro, the user was away, and the existing per-session retro gate is a single-transcript touch file that structurally cannot do a multi-session retro anyway.

That gap is the most important thing the build surfaced. A long unattended build accumulates un-mined learnings and unscored prediction debt with no automatic trigger to convert them. The fix is an enforcement-layer mechanism (a session-count or idle trigger that fires a retro after N sessions or M commits without one, plus a multi-session retro that reads across transcripts) — which means it must be proposed via `/harness-pr` and merged by a human, never edited in directly. It is filed as a proposal, not a landed change.

There is also a calibration signal worth banking: the build systematically **over-predicted late-stage quality-gate friction** (the design passed 5/5 on the first Critic pass; all three launch-hardening friction points it feared were falsified) and **under-predicted Windows / native-process CI friction** (the Windows-only CI took roughly six iterations against a predicted one). Of seven scored prediction misses, four were "I expected a Critic-driven fix round that never came." A well-scoped brief and a strong agent clear a demanding bar on the first try more often than the build expected; cross-platform native process work bites harder than it expected.

---

## Closing

The product is bespoke. The procedure is what compounds. Grove's real deliverable to the trunk is not the cockpit — it is a hardened, twice-validated autonomous-build loop, and the evidence for which three mechanisms actually let an LLM ship unattended without lying to itself:

1. **The blackboard** — versioned files that reconstruct state, so no session depends on chat history.
2. **The independent Critic** — fresh context, did not build it, re-runs the evidence, can reject.
3. **The design-token contract** — one typed package every surface imports, with AA enforced as a test and an anti-slop AVOID-list a Critic can grep.

Limits, stated plainly: this is one build (N=1 for Grove, N=2 for the loop), reconstructed in part from artifacts rather than complete raw transcripts, on a host with a specific missing-toolchain profile that shaped several decisions. The mechanisms above are the parts that earned their place by being cited; everything else is one data point.
