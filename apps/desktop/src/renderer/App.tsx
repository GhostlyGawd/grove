import { ThemeToggle } from "@swarm/ui/react";
import { useEffect, useMemo, useState } from "react";
import { ContentPane } from "./ContentPane.tsx";
import { StatusBar } from "./StatusBar.tsx";
import { WorkspaceRail } from "./WorkspaceRail.tsx";
import { useHost } from "./useHost.ts";

function GroveMark({ className }: { readonly className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden focusable="false">
      <title>Grove</title>
      <path
        d="M12 23V13M12 15L6 8.5M12 13.5L12 5M12 15L18 8.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="6" cy="8" r="1.8" fill="currentColor" />
      <circle cx="12" cy="4.5" r="1.8" fill="currentColor" />
      <circle cx="18" cy="8" r="1.8" fill="currentColor" />
    </svg>
  );
}

/** The desktop operator cockpit: identity bar, workspace rail, content pane,
 *  status bar — all driven by a real, live host connection. */
export function App() {
  const host = useHost();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  // Keep the selection valid: default to the first worktree, drop it if it vanishes.
  useEffect(() => {
    if (host.phase !== "connected") {
      return;
    }
    setSelectedId((current) => {
      if (current && host.workspaces.some((ws) => ws.id === current)) {
        return current;
      }
      return host.workspaces[0]?.id ?? null;
    });
  }, [host.phase, host.workspaces]);

  const selected = useMemo(
    () => host.workspaces.find((ws) => ws.id === selectedId) ?? null,
    [host.workspaces, selectedId],
  );

  return (
    <div className="grid h-full grid-rows-[auto_minmax(0,1fr)_auto] bg-base text-fg">
      <header
        data-testid="app-titlebar"
        className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3"
      >
        <span className="flex items-center gap-2">
          <GroveMark className="size-5 text-accent-fg" />
          <span className="text-sm font-semibold tracking-tight text-fg">Grove</span>
          <span className="font-mono text-2xs text-fg-subtle">mission control</span>
        </span>
        <ThemeToggle />
      </header>

      <div className="grid min-h-0 grid-cols-[16rem_minmax(0,1fr)]">
        <WorkspaceRail
          host={host}
          filter={filter}
          onFilter={setFilter}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
        />
        <ContentPane host={host} selected={selected} />
      </div>

      <StatusBar host={host} />
    </div>
  );
}
