import type { Workspace } from "@swarm/db";
import { Badge, EmptyState, Spinner, StatusBadge } from "@swarm/ui/react";
import { GitCompare, LayoutGrid, TerminalSquare } from "lucide-react";
import { type HostState, effectiveStatus } from "./useHost.ts";

interface ContentPaneProps {
  readonly host: HostState;
  readonly selected: Workspace | null;
}

/**
 * The main pane. For the foundation it shows the connection-aware shell of the
 * operator cockpit; the live terminal and diff viewer mount into the recessed
 * well in later Phase-3 waves.
 */
export function ContentPane({ host, selected }: ContentPaneProps) {
  const { phase, liveStatus } = host;

  return (
    <main data-testid="content-pane" className="flex min-w-0 flex-col bg-base">
      <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-line px-3">
        {selected ? (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-semibold text-fg">{selected.name}</span>
            <Badge tone="neutral">{selected.branch}</Badge>
            <StatusBadge status={effectiveStatus(selected, liveStatus)} />
          </div>
        ) : (
          <span className="text-sm text-fg-subtle">No worktree selected</span>
        )}
      </header>

      <div className="min-h-0 flex-1 p-3">
        <section className="flex h-full min-h-0 flex-col items-center justify-center overflow-hidden rounded-lg border border-line bg-inset">
          {phase === "connecting" ? (
            <div className="flex flex-col items-center gap-2 text-fg-muted">
              <Spinner size="lg" label="Connecting to host" />
              <span className="text-xs">Connecting to host…</span>
            </div>
          ) : phase === "connected" && selected ? (
            <EmptyState
              icon={<TerminalSquare />}
              title="Worktree ready"
              description="The live terminal and diff viewer for this worktree attach to this pane in the next Phase-3 wave."
              hint={
                <span className="flex items-center gap-3 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <TerminalSquare className="size-3" aria-hidden /> terminal
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <GitCompare className="size-3" aria-hidden /> diff
                  </span>
                </span>
              }
            />
          ) : phase === "connected" ? (
            <EmptyState
              icon={<LayoutGrid />}
              title="Select a worktree"
              description="Pick a worktree from the rail to inspect its terminal and diff."
            />
          ) : (
            <EmptyState
              icon={<TerminalSquare />}
              title="Not connected"
              description="Connect to a running Grove host to load its worktrees."
            />
          )}
        </section>
      </div>
    </main>
  );
}
