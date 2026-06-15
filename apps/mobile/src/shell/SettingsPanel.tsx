import { Badge, useTheme } from "@swarm/ui/react";
import { Moon, Sun } from "lucide-react";
import { MOBILE_VERSION } from "../version.ts";
import { ConnectAffordance, ConnectHint } from "./ConnectAffordance.tsx";

function SectionLabel({ children }: { readonly children: string }) {
  return (
    <h3 className="px-1 text-2xs font-semibold uppercase tracking-wide text-fg-subtle">
      {children}
    </h3>
  );
}

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

function ThemeChoice() {
  const { theme, setTheme } = useTheme();
  return (
    <div aria-label="Theme" className="flex gap-1 rounded-lg border border-line bg-inset p-1">
      {THEMES.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`${label} theme`}
            onClick={() => setTheme(value)}
            className={
              active
                ? "flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line-strong bg-raised px-3 py-2 text-sm font-medium text-fg [&_svg]:size-4"
                : "flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-2 text-sm font-medium text-fg-subtle transition-colors duration-fast ease-standard hover:text-fg-muted [&_svg]:size-4"
            }
          >
            <Icon aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Settings section content — real, local, and working today (no host required). */
export function SettingsPanel() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <SectionLabel>Appearance</SectionLabel>
        <ThemeChoice />
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>Connection</SectionLabel>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-fg">Host</span>
            <Badge tone="idle" dot>
              Not paired
            </Badge>
          </div>
          <p className="text-xs text-fg-muted">
            This phone is not linked to a Grove host yet. Pair one to drive your worktrees, agents,
            and terminals from here.
          </p>
          <div className="flex flex-col items-start gap-1.5">
            <ConnectAffordance />
            <p className="text-2xs text-fg-subtle">
              <ConnectHint />
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <SectionLabel>About</SectionLabel>
        <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-fg">Grove for phone</span>
            <span className="text-xs text-fg-muted">Mission control, in your pocket.</span>
          </div>
          <span className="font-mono text-xs text-fg-subtle">v{MOBILE_VERSION}</span>
        </div>
      </section>
    </div>
  );
}
