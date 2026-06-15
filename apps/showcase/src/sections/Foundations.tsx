import {
  CONTRAST_CLAIMS,
  ELEVATION,
  MOTION,
  RADII,
  SPACE,
  TYPE_SCALE,
  darkColors,
  lightColors,
  ratio,
  useTheme,
} from "@swarm/ui/react";
import type { ThemeColors } from "@swarm/ui/react";
import { Section, Subsection, Swatch } from "../kit";

const TYPE_CLASS: Record<string, string> = {
  "2xs": "text-2xs",
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

function group(c: ThemeColors): ReadonlyArray<{ readonly label: string; readonly value: string }> {
  return [
    { label: "inset", value: c.insetBg },
    { label: "base", value: c.baseBg },
    { label: "surface", value: c.surfaceBg },
    { label: "raised", value: c.raisedBg },
    { label: "overlay", value: c.overlayBg },
    { label: "line", value: c.line },
    { label: "line-strong", value: c.lineStrong },
    { label: "fg", value: c.fg },
    { label: "fg-muted", value: c.fgMuted },
    { label: "fg-subtle", value: c.fgSubtle },
    { label: "accent", value: c.accent },
    { label: "idle", value: c.idle },
    { label: "running", value: c.running },
    { label: "attention", value: c.attention },
    { label: "error", value: c.error },
    { label: "success", value: c.success },
    { label: "info", value: c.info },
  ];
}

export function Foundations() {
  const { theme } = useTheme();
  const colors = theme === "light" ? lightColors : darkColors;
  const claims = CONTRAST_CLAIMS.filter((claim) => claim.theme === theme);

  return (
    <Section
      id="foundations"
      kicker="01 — Foundations"
      title="Tokens"
      description="One typed source of truth (tokens.ts) mirrored to CSS variables. Switching theme is a data-theme swap, not a rebuild. Every pair below is checked against WCAG AA in CI."
    >
      <Subsection title="Typeface — IBM Plex Sans + IBM Plex Mono">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="font-sans text-3xl text-fg">Grove</p>
            <p className="mt-1 font-sans text-sm text-fg-muted">
              IBM Plex Sans — the UI voice. 400 / 500 / 600.
            </p>
            <p className="mt-3 font-sans text-sm font-normal text-fg">Regular · interface body</p>
            <p className="font-sans text-sm font-medium text-fg">Medium · labels & controls</p>
            <p className="font-sans text-sm font-semibold text-fg">Semibold · titles</p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="font-mono text-3xl text-fg">{"{ }"}</p>
            <p className="mt-1 font-mono text-sm text-fg-muted">
              IBM Plex Mono — terminal, diff, metrics. Slashed zero.
            </p>
            <p className="mt-3 font-mono text-sm text-fg">{"const seq = 0o755 · 0123456789"}</p>
            <p className="font-mono text-sm text-running-fg">
              ▸ tabular · same superfamily skeleton
            </p>
          </div>
        </div>
      </Subsection>

      <Subsection title="Type scale (rem on a 16px root → respects user zoom)">
        <div className="divide-y divide-line-subtle rounded-lg border border-line bg-surface">
          {TYPE_SCALE.map((row) => (
            <div key={row.token} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <span className={`truncate text-fg ${TYPE_CLASS[row.token] ?? "text-sm"}`}>
                Orchestrate the swarm
              </span>
              <span className="shrink-0 text-right">
                <span className="font-mono text-xs text-fg-muted">{row.token}</span>
                <span className="ml-2 font-mono text-2xs tabular-nums text-fg-subtle">
                  {row.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </Subsection>

      <Subsection title="Palette">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-9">
          {group(colors).map((item) => (
            <Swatch key={item.label} name={item.label} value={item.value} />
          ))}
        </div>
      </Subsection>

      <Subsection title="Color contrast — WCAG AA, enforced by tokens.test.ts">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {claims.map((claim) => {
            const r = ratio(claim.fg, claim.bg);
            return (
              <div
                key={`${claim.theme}-${claim.label}`}
                className="flex items-center gap-3 rounded-md border border-line px-3 py-2"
                style={{ backgroundColor: claim.bg }}
              >
                <span
                  className="size-6 shrink-0 rounded-sm ring-1 ring-inset ring-line"
                  style={{ backgroundColor: claim.fg }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-2xs font-medium" style={{ color: claim.fg }}>
                    {claim.label}
                  </span>
                  <span className="font-mono text-2xs tabular-nums" style={{ color: claim.fg }}>
                    {r.toFixed(2)}:1 · need ≥{claim.min}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </Subsection>

      <Subsection title="Spacing — 4px grid">
        <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface p-4">
          {SPACE.filter((row) => row.value !== "0").map((row) => (
            <div key={row.token} className="flex items-center gap-3">
              <span className="w-8 shrink-0 font-mono text-2xs text-fg-subtle">{row.token}</span>
              <span className="h-3 rounded-xs bg-accent" style={{ width: row.value }} />
              <span className="font-mono text-2xs tabular-nums text-fg-subtle">{row.value}</span>
            </div>
          ))}
        </div>
      </Subsection>

      <Subsection title="Radii & elevation">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-surface p-4">
            {RADII.map((row) => (
              <div key={row.token} className="flex flex-col items-center gap-1.5">
                <span
                  className="size-12 border border-line-strong bg-raised"
                  style={{ borderRadius: row.value }}
                />
                <span className="font-mono text-2xs text-fg-subtle">{row.token}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-line bg-base p-4">
            <div className="flex size-16 items-center justify-center rounded-md bg-surface text-2xs text-fg-subtle shadow-sm">
              sm
            </div>
            <div className="flex size-16 items-center justify-center rounded-md bg-surface text-2xs text-fg-subtle shadow-md">
              md
            </div>
            <div className="flex size-16 items-center justify-center rounded-md bg-surface text-2xs text-fg-subtle shadow-lg">
              lg
            </div>
            <p className="w-full font-mono text-2xs text-fg-subtle">
              {ELEVATION.length} steps — lighter surface + border + soft shadow.
            </p>
          </div>
        </div>
      </Subsection>

      <Subsection title="Motion — purposeful, and it honors prefers-reduced-motion">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-4">
            <div className="flex flex-col gap-1.5">
              {MOTION.map((row) => (
                <div key={row.token} className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-2xs text-fg">{row.token}</span>
                  <span className="font-mono text-2xs text-fg-subtle">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-line bg-surface p-4">
            <div className="group size-20 rounded-md bg-raised ring-1 ring-inset ring-line transition-[transform,background-color,border-radius] duration-slow ease-standard hover:scale-105 hover:rounded-xl hover:bg-accent-bg" />
            <p className="ml-4 max-w-[14rem] text-xs text-fg-muted">
              Hover the tile — 240ms decelerate. Under reduced-motion it settles instantly.
            </p>
          </div>
        </div>
      </Subsection>
    </Section>
  );
}
