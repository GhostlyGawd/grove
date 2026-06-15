# Phase 1 — Brand & Design System (evidence)

Date: 2026-06-14 · Owner: Brand & Design Director · Product name: **Grove** (codename SWARM)

## What was built

**Brand** (`docs/brand/`)
- Final product name **Grove** chosen and justified (ADR-0010 in `DECISIONS.md`;
  `STATE.json.project.final_name = "Grove"`). Rationale: git worktrees are *trees* sharing one
  repo root — one root system, many trees = a grove; the swarm works the grove.
- `docs/brand/README.md` — name, positioning, voice & tone, logo concept.
- Hand-authored SVGs: `docs/brand/assets/grove-mark.svg` (branching app mark whose three nodes
  are the product's AgentStatusDots) and `docs/brand/assets/grove-wordmark.svg`.

**System doc** (`docs/design-system.md`)
- Stated thesis (POV + named references + explicit AVOID list), type scale + rationale, color
  system with documented AA ratios + state semantics, spacing/radii/elevation tokens, motion +
  reduced-motion, accessibility stance, usage, and run instructions.

**Code** (`packages/ui`, `@swarm/ui` v0.2.0)
- Framework-agnostic core: `tokens.ts` (typed token source), `tokens.css` (CSS variables,
  dark + light + `prefers-color-scheme` + reduced-motion), `styles.css` (base layer),
  `contrast.ts` (WCAG utilities), `status.ts`, `cn.ts`, `tailwind-preset.ts` (binds Tailwind
  utilities to the variables).
- React primitives (`@swarm/ui/react`): Button, IconButton, Input, Select, Panel(+parts), Tabs,
  Badge, StatusBadge, AgentStatusDot, Tooltip, Dialog, Sheet, Toast(+useToast), Table(+ListRow),
  Spinner, Skeleton, EmptyState, ErrorState, TerminalFrame, DiffView, CodeBlock, ThemeProvider.
- **AA is enforced, not asserted:** `packages/ui/src/tokens.test.ts` checks all 60 documented
  text/non-text pairs across both themes against WCAG thresholds; breaking AA fails `bun test`.

**Showcase** (`apps/showcase`, `@swarm/showcase`)
- Vite + React + Tailwind app rendering the tokens, every primitive with empty/loading/error
  states, and the composed Grove console at desktop width and a 390px phone frame, with a live
  dark/light theme toggle. Builds and runs.

## Local results (Windows, bun 1.3.14)

| Gate | Command | Result |
|---|---|---|
| Install (frozen) | `bun install --frozen-lockfile` | PASS — no changes, lockfile in sync |
| Lint (Biome) | `bun run lint` | PASS — 95 files checked, 0 errors |
| Typecheck (strict tsc) | `bun run typecheck` | PASS — 17/17 tasks |
| Build (turbo) | `bun run build` | PASS — 17/17 tasks (showcase `vite build` included) |
| Test (bun) | `bun test` | PASS — 64 pass / 0 fail (2 files: shared + ui tokens) |
| Banned tokens | `rg -ni "TODO\|FIXME\|XXX\|HACK\|not implemented\|coming soon\|placeholder\|lorem ipsum" apps packages docs` | CLEAN — exit 1, no matches |

Runtime smoke: `vite preview` served the built app at `http://localhost:4317/` → **HTTP 200**;
the compiled CSS contains the preset-generated, variable-bound utilities (`.bg-surface` →
`var(--color-bg-surface)`), both `[data-theme=dark]` and `[data-theme=light]` blocks, the
`prefers-reduced-motion` block, and `color-mix` tints computed to rgba by the CSS minifier.

## How to run the showcase

```sh
bun install
bun run --filter @swarm/showcase dev       # live at http://localhost:5173
# or against the production build:
bun run --filter @swarm/showcase build
bun run --filter @swarm/showcase preview    # serves dist/
```

## Screenshots

Not captured here (no headless browser provisioned in this environment). The showcase is
buildable and runnable as above; QA can capture desktop + 390px phone screenshots from
`bun run --filter @swarm/showcase preview` for the §6.2 evidence pack.
