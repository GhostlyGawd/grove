import type { SyncClientState } from "@swarm/sync";
import { Badge, type BadgeTone, ThemeToggle } from "@swarm/ui/react";
import { Plug, PlugZap, Unplug } from "lucide-react";
import { type HostState, effectiveStatus } from "./useHost.ts";

interface StatusBarProps {
  readonly host: HostState;
}

const SYNC_LABEL: Record<SyncClientState, { readonly label: string; readonly tone: BadgeTone }> = {
  idle: { label: "idle", tone: "idle" },
  connecting: { label: "connecting", tone: "running" },
  catching_up: { label: "catching up", tone: "running" },
  live: { label: "live", tone: "success" },
  reconnecting: { label: "reconnecting", tone: "attention" },
  closed: { label: "offline", tone: "idle" },
};

function countRunning(host: HostState): number {
  return host.workspaces.filter((ws) => effectiveStatus(ws, host.liveStatus) === "running").length;
}

/** Connection glyph + label for the bottom-left of the status bar. */
function ConnectionIndicator({ host }: StatusBarProps) {
  if (host.phase === "connected" && host.info) {
    return (
      <span className="flex items-center gap-1.5 text-fg-muted">
        <PlugZap className="size-3.5 text-success-fg" aria-hidden />
        <span className="font-mono text-2xs">{host.info.endpoint.replace(/^https?:\/\//, "")}</span>
      </span>
    );
  }
  if (host.phase === "connecting") {
    return (
      <span className="flex items-center gap-1.5 text-fg-muted">
        <Plug className="size-3.5" aria-hidden /> Connecting…
      </span>
    );
  }
  if (host.phase === "error") {
    return (
      <span className="flex items-center gap-1.5 text-error-fg">
        <Unplug className="size-3.5" aria-hidden /> Host unreachable
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-fg-subtle">
      <Unplug className="size-3.5" aria-hidden /> No host
    </span>
  );
}

/** The bottom status bar — host endpoint, live sync state, and worktree counts. */
export function StatusBar({ host }: StatusBarProps) {
  const sync = SYNC_LABEL[host.syncState];
  const total = host.workspaces.length;
  const running = countRunning(host);

  return (
    <footer
      data-testid="status-bar"
      className="flex h-7 shrink-0 items-center justify-between gap-4 border-t border-line bg-surface px-3 text-2xs text-fg-muted"
    >
      <div className="flex min-w-0 items-center gap-3">
        <ConnectionIndicator host={host} />
        {host.phase === "connected" ? (
          <span data-testid="sync-state">
            <Badge tone={sync.tone} dot>
              sync {sync.label}
            </Badge>
          </span>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-3 tabular-nums">
        {host.phase === "connected" ? (
          <>
            <span>
              {total} {total === 1 ? "worktree" : "worktrees"}
            </span>
            <span className="text-fg-subtle">·</span>
            <span>{running} running</span>
            {host.info ? (
              <>
                <span className="text-fg-subtle">·</span>
                <span className="font-mono">{host.info.os}</span>
                <span className="text-fg-subtle">·</span>
                <span className="font-mono">v{host.info.version}</span>
              </>
            ) : null}
          </>
        ) : null}
        <ThemeToggle className="size-6" />
      </div>
    </footer>
  );
}
