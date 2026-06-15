import type { ReactNode } from "react";
import { cn } from "../cn";

export interface BottomNavItem {
  /** Stable identifier matched against `value`. */
  readonly id: string;
  /** Visible label beneath the icon (always shown — never icon-only). */
  readonly label: string;
  /** Decorative glyph (e.g. a Lucide icon); the label carries the name. */
  readonly icon: ReactNode;
}

export interface BottomNavProps {
  readonly items: readonly BottomNavItem[];
  /** The id of the active section. */
  readonly value: string;
  readonly onChange: (id: string) => void;
  readonly className?: string;
  /** Names the landmark for assistive tech (defaults to "Primary"). */
  readonly "aria-label"?: string;
}

/**
 * Phone bottom tab bar — the primary section switcher on small screens.
 *
 * A `<nav>` landmark of equal-width icon+label tabs: every target is at least
 * 44px tall and flexes to a comfortable width, the active tab carries an accent
 * pill plus `aria-current="page"`, and the bar reserves the bottom safe-area
 * inset so it floats clear of the home indicator. Token-styled, so it themes
 * with the rest of `@swarm/ui` via the `data-theme` swap.
 */
export function BottomNav({
  items,
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Primary",
}: BottomNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "shrink-0 border-t border-line bg-surface",
        "pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]",
        className,
      )}
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = item.id === value;
          return (
            <li key={item.id} className="flex flex-1">
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onChange(item.id)}
                className={cn(
                  "group flex min-h-[3.25rem] w-full flex-col items-center justify-center gap-1 px-1 pt-1.5 pb-1",
                  "text-2xs font-medium transition-colors duration-fast ease-standard",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                  active ? "text-accent-fg" : "text-fg-subtle hover:text-fg-muted",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-7 w-9 items-center justify-center rounded-full transition-colors duration-fast ease-standard [&_svg]:size-5",
                    active ? "bg-accent-bg" : "bg-transparent",
                  )}
                >
                  {item.icon}
                </span>
                <span className="leading-none">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
