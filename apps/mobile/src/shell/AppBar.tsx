import { ThemeToggle } from "@swarm/ui/react";
import { GroveMark } from "./GroveMark.tsx";

/**
 * Top app bar: the Grove wordmark on the left, the theme toggle on the right.
 * Reserves the top safe-area inset so the bar clears the notch / status bar
 * when the PWA runs in standalone, full-bleed display.
 */
export function AppBar() {
  return (
    <header className="shrink-0 border-b border-line bg-surface pt-[env(safe-area-inset-top)]">
      <div className="flex h-12 items-center justify-between gap-3 px-4">
        {/* The visible wordmark carries the document's accessible name. */}
        <h1 className="flex items-center gap-2">
          <GroveMark className="size-6 text-accent-fg" />
          <span className="text-base font-semibold tracking-tight text-fg">Grove</span>
        </h1>
        <ThemeToggle />
      </div>
    </header>
  );
}
