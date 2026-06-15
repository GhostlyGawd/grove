# Phase-4 Accessibility Report (spec §6.2 — mobile PWA)

> **Post-fix re-audit (2026-06-15): 0 critical / 0 serious; touch targets all ≥44px.** The
> two blockers found in the first pass were fixed and re-verified (`_a11y.spec.ts` 4/4):
> (1) the serious `color-contrast` on the sheet/panel section `<h3>` labels — `SectionLabel`
> in `WorkspaceDetailSheet.tsx` + `SettingsPanel.tsx` and the Notifications "Inbox" heading
> raised from `text-fg-subtle` → the AA-passing `text-fg-muted`; (2) the Dispatch header
> button enlarged `min-h-8` → `min-h-11` (44px). The systemic `text-fg-subtle`-on-raised/overlay
> question remains a Phase-6 token-sweep follow-up. Original findings recorded below.

Automated `axe-core` audit plus touch-target sizing and a keyboard/AT-reachability pass for
the Grove **mobile PWA** (`apps/mobile`), run against the **real**, paired phone shell (real
host: `pair.redeem` + tRPC + `/sync` + PTY, no mocks) at a phone viewport. The phone is a
touch-first surface, so beyond the rule audit this report grades touch-target sizes (≥44px)
and confirms the pairing flow is operable by keyboard / assistive tech.

## Methodology

- **Harness:** `apps/mobile/e2e/_a11y.spec.ts` — a measurement tool that injects the
  `axe-core` source (`page.addScriptTag({ path: require.resolve("axe-core") })`) and runs
  `axe.run()` against the live DOM, then measures touch targets and exercises the pairing
  keyboard journey, recording pass/fail (so a real gap is reported, not aborted on; the only
  hard assertion is that axe ran).
- **Engine:** `axe-core` 4.12.1 (MIT), rule set `wcag2a, wcag2aa, wcag21a, wcag21aa,
  best-practice`.
- **Viewport:** Playwright's **Pixel 5** device — 393×727 CSS px at devicePixelRatio 2.75,
  `isMobile`/`hasTouch` on.
- **Surfaces audited:** (1) the **paired shell** — the live workspace list once connected;
  (2) the **workspace-detail sheet open** (real branch + git status + live agent), both
  scoped to `dialog[open]` and as a full-page run.
- **Machine:** Windows 10 `10.0.19045`, Chromium via Playwright `1.60.0`. Real host booted by
  `e2e/global-setup.ts`.

## axe-core results — violations by impact

### Paired shell (workspace list) — 27 rules pass, 0 violations

No violations, no `incomplete` (needs-review) items. The live worktree list, BottomNav
landmark, AppBar, and Dispatch action are all clean at the phone viewport.

### Workspace-detail sheet open — 1 violation (serious)

| Impact | Rule | Nodes | Where |
|---|---|---|---|
| **serious** | `color-contrast` | 4 | the four sheet section headings `<h3>` — "Status", "Branch", "Running agents", "Session history" |

- Scoped to the dialog: **24 rules pass, 1 violation** (the 4 contrast nodes above).
- Full-page with the modal open: **28 rules pass, the same 1 violation** (4 nodes). The native
  `<dialog>` `showModal()` makes the background `inert`, so the full-page run surfaces only the
  sheet's own nodes — a positive signal (the modal correctly removes the backdrop from the a11y
  tree).
- `incomplete` buckets are empty in every context.

**0 critical, 1 serious, 0 moderate, 0 minor.**

## Touch-target sizes (≥44px)

Measured `boundingBox()` of each control at the Pixel-5 viewport:

| Group | Control(s) | Size (w×h px) | Verdict |
|---|---|---|---|
| BottomNav | Workspaces, Agents, Terminal, Diff, Settings | 79×53 each | **PASS** |
| Accessory bar | Ctrl, Esc, Tab, ←, ↑, ↓, →, Enter | 44–73 × **44** each | **PASS** (meets 44 exactly) |
| Primary action | **Dispatch** (panel-header button) | 90×**32** | **FAIL** — 32 px tall, below the 44 px minimum |

The BottomNav (min-h `3.25rem`) and every accessory-bar key (`h-11`/`min-w-11`) clear the 44 px
floor. The lone miss is the **panel-header "Dispatch" button**, rendered 32 px tall — it is a
frequently-tapped primary action and should be enlarged.

## Keyboard / AT reachability — pairing flow

All four checks pass against the real pairing screen (clean, unpaired context):

- The pairing-code field exposes an accessible label ("Pairing code") — **pass**.
- `Tab` reaches the pairing-code input — **pass**.
- `Tab` then reaches the "Link this phone" submit button — **pass**.
- Typing a code and pressing **Enter** submits the form (the too-short-code inline validation
  fires), proving the flow is operable by keyboard alone with no pointer — **pass**.

The pairing surface is built from a labelled `@swarm/ui` Input + a real `<form>`/submit button,
so screen-reader labelling and keyboard submission work without bespoke handling. **No
keyboard-reachability gaps were found in the pairing flow.**

## Verdict — one serious blocker + one touch-target fix

There **is** a blocking-tier violation: **1 serious** (`color-contrast`, the workspace-detail
sheet's section headings). Per §6.2 this blocks ship-quality sign-off and must be fixed. The
under-sized Dispatch touch target is not an axe rule but is a real touch-ergonomics defect and
should ship-block alongside it for a touch-first surface. Concrete fixes:

1. **SERIOUS — `color-contrast` on the sheet section headings.** Root cause is the shared
   `SectionLabel` in `apps/mobile/src/host/WorkspaceDetailSheet.tsx` (≈ line 28–34): the `<h3>`
   uses `text-fg-subtle` uppercase `text-2xs`, which fails the AA 4.5:1 small-text threshold on
   the sheet surface. **Fix:** raise it to `text-fg-muted` (the exact token + ratio the desktop
   client adopted for the same issue in Phase 3 — `text-fg-subtle` ~4.4:1 → `text-fg-muted`
   ~7:1). Existing `@swarm/ui` token; no new hex.
   - **Sibling to verify:** the same `text-fg-subtle` `SectionLabel` pattern appears in
     `apps/mobile/src/shell/SettingsPanel.tsx` (≈ line 6–12) and the `NotificationsCard` "Inbox"
     label. The shell (workspace-list) audit was clean because that view renders no section
     `<h3>`, but Settings/Notifications carry the same low-contrast label — fix them in the same
     pass (or promote a shared section-label component with the accessible token).

2. **TOUCH TARGET — panel-header "Dispatch" button is 32 px tall.**
   `apps/mobile/src/App.tsx` (≈ line 127–135) renders the Dispatch `Button` with
   `className="min-h-8"` (32 px). **Fix:** use `min-h-11` (44 px) so the primary dispatch
   action meets the touch-target minimum, matching the BottomNav and accessory-bar keys.

## Summary

- Automated axe audit: **0 critical, 1 serious, 0 moderate, 0 minor**; 27 (shell) / 24 (sheet
  scoped) / 28 (sheet full) rules pass; `incomplete` empty everywhere.
- Touch targets: BottomNav + accessory bar **PASS** (≥44 px); panel-header **Dispatch 32 px →
  FAIL**.
- Keyboard / AT: pairing flow **fully reachable — all 4 checks pass**.
- Ship-quality call: fix the 1 serious contrast issue (sheet section headings, plus the
  Settings/Notifications siblings sharing the token) and enlarge the 32 px Dispatch button;
  there are no critical violations and no keyboard-reachability gaps.

Reproduce: from `apps/mobile`,
`GROVE_E2E_MEASURE=1 node ./node_modules/@playwright/test/cli.js test _a11y.spec.ts`
(the env flag lifts the default `testIgnore` on `_*.spec.ts`; violations + touch-target +
keyboard results are written to `grove-mobile-a11y-results.json` in the OS temp dir).
