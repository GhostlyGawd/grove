# apps/site — independent §6.3 anti-slop Critic review

**Critic:** independent (did NOT build this page). Graded adversarially from the artifacts +
my own Read/Grep/Glob/Bash checks against `RUBRIC.md §6.3`, `docs/design-system.md`,
`docs/brand/README.md`, and `apps/site/DESIGN.md` (the MOTION LAW + honesty law).
**Date:** 2026-06-16.

## OVERALL VERDICT: ALL-PASS (ready to launch)

The page is a working instance of the Grove cockpit, not a marketing page about it. No
forbidden default is present (no centered hero, no purple/indigo gradient, no emoji feature
cards, no stock component defaults). Brand AVOID-list is honored. The MOTION LAW holds —
nothing autoplays; every reveal is user-gated; the only ambient motion is the honest rAF
wall-clock + the CSS cursor blink. Honesty labels are all present and truthful. Prerender,
axe, render specs, typecheck all pass under my own runs. Two trivial, non-blocking nits noted
below (one bare-span aria-label; one gate-coverage observation) — neither blocks launch.

## Per-area

| Area | Result | Key proof I inspected |
|---|---|---|
| §6.3 anti-slop (thesis + system + no forbidden defaults + craft) | **PASS** | `cockpit-desktop-top.png` + `swarm-dial-cranked.png`: dark substrate, pinned status rail/worktree rail/status strip, dense Plex-mono roster Table, tabular slashed-zero figures, hairline 1px borders, one leaf-green accent, status triple-encoded. No centered hero (top of doc IS the product chrome). No gradient/emoji/glass. Real empty states ("Nothing waiting on you.", phone "Locked"). |
| Brand-book AVOID | **PASS** | `rg gradient\|blur\|box-shadow\|glassmorph apps/site/src` → empty. `rg purple\|indigo\|#8b5cf6...` → empty. Only accent `#3fb950`/`accent-fg #57d364`; status hues = the documented semantic set. IBM Plex preloaded. Dark-first, ThemeToggle present. |
| MOTION LAW | **PASS** | Pulses gated on `interacted` (store `cockpit.tsx` reducer; `GroveMark` suppresses `.grove-pulse` until first interaction; `SwarmDial` `moved` gates `grove-pulse`+`grove-cell-in`). Terminal replay is pull-only — `RecordedTerminal.replay()` only fires from the ▶ onClick or palette `up` bus event; poster-frame = all lines via `useState(total)`. One shared rAF clock (`Clock` class), NOT N setIntervals. `prefers-reduced-motion` handled in 3 site files + `@swarm/ui` styles.css. No IntersectionObserver, no autoplay. |
| Honesty / launch-readiness | **PASS** | Terminal `recorded session` Badge. Phone QR `aria-label="Sample pairing QR — illustrative, not scannable"` + visible "Labeled sample — not a scannable code". Install sizes `~ — sample, set at release` + "Install URLs … are launch markers". Harvest reducer guards: amber/error agents return state unchanged; scoped to one `TARGET`; copy "never a fleet auto-merging". No fabricated stats. |
| Perf + a11y | **PASS** | Build OK; prerender wrote 127 kB real copy; one JS asset 84 kB gz, one CSS 7.3 kB gz. LCP==FCP ~0.4–0.56 s (perf-report, honest Playwright-not-Lighthouse fallback per DESIGN.md). My axe run: 4/4 pass, 0 critical/0 serious in `violations`. My render run: 22/22 desktop+phone. |

## Findings (none blocking)

1. **NIT — `aria-prohibited-attr` (axe-incomplete, serious-impact)** — `CockpitShell.tsx:144`
   `<span aria-label="Swarm clock">{clock}</span>`: a generic `<span>` with no role cannot
   legally take `aria-label`. axe lists it *incomplete* (not a violation), so the gate does
   not catch it; the clock value is visible text regardless, so nothing is lost for AT.
   **Does it block launch? No.** Cheapest fix: drop the `aria-label` (the text content is the
   accessible name) or add `role="timer"`.

2. **OBSERVATION — the axe gate is structurally blind to `incomplete`.** `a11y.spec.ts`
   `expectNoSeriousOrCritical` filters `view.violations` only; the serious-impact items in
   `a11y-results.json` live in `incomplete`. I verified those are axe-can't-compute false
   positives, NOT real failures: the 4 `text[y=]` items are the Isolation fork-diagram SVG
   `<text>` labels using `fill: var(--color-fg-subtle)` (`#8b958f`) — I computed 5.19–6.31:1
   on every substrate (clears AA 4.5:1); axe cannot resolve SVG `fill` contrast so it punts.
   The `.text-accent-fg` item is the terminal cursor block (`accent-fg` 9.8:1). **Does it
   block launch? No** — contrast is genuinely AA (backed by `tokens.test.ts`). Cheapest
   hardening: also assert `incomplete` count of serious is 0 OR annotate these known SVG
   exclusions, so a future real regression can't hide in `incomplete`.

3. **NIT — `page-has-heading-one` (moderate)** — intentional per the cockpit thesis (the 30px
   line is an inline `<h2>`, no centered `<h1>` hero by design). Documented in `a11y.md`.
   **Does it block launch? No.**

## @swarm/ui fidelity
The page composes real `@swarm/ui` primitives (Table, StatusBadge, AgentStatusDot, Tooltip,
Select, ListRow, DiffView, TerminalFrame, CodeBlock, BottomNav, EmptyState, Dialog, Tabs,
Toast, ThemeToggle) — not reinvented stock UI. The DiffView/TerminalFrame a11y change is
**additive** (git diff +53/-14: `tabIndex={0}` + `aria-label` on scroll regions for
keyboard-scrollability; no behavior removed/changed) — not a regression.

## Commands I ran (headline results)
- `rg -ni "TODO|FIXME|...|placeholder|lorem ipsum" apps/site` → empty (exit 1).
- `rg "revolutionary|magical|effortless|10x|...|supercharge" apps/site/src` → empty.
- `rg "!" apps/site/src/{sections,store,lib,components}` → only code operators, none in copy.
- `rg -ni "gradient|blur|box-shadow|glassmorph" apps/site/src` → empty (exit 1).
- `rg -ni "purple|indigo|violet|#8b5cf6|#6366f1|..." apps/site/src` → empty (exit 1).
- emoji scan → only box-drawing/arrows/`❯`/`$`/`▶` (TUI glyphs, `aria-hidden`), no emoji.
- `rg "autoplay|setInterval|IntersectionObserver" apps/site/src` → only comments asserting none.
- `bun run --filter @swarm/site build` → exit 0; "prerender: wrote dist/index.html … (127.1 kB)".
- prerender grep `dist/index.html` → all 8 section headlines present; `#root` filled; `app-html` placeholder gone.
- `node …/playwright/cli.js test a11y.spec.ts` → 4 passed (0 critical/0 serious).
- `node …/playwright/cli.js test render.spec.ts` → 22 passed (desktop+phone).
- `bun run typecheck` → exit 0.
- contrast computed by hand: fg-subtle 5.19–6.31:1; accent-fg 9.8:1; accent `#3fb950` 7.43:1.

Written to: `evidence/site/review.md`
