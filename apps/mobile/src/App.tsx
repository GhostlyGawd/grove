import {
  BottomNav,
  Button,
  Panel,
  PanelBody,
  PanelHeader,
  PanelTitle,
  Spinner,
} from "@swarm/ui/react";
import { Rocket } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ConnectedTabBody, tabBodyClassName } from "./host/ConnectedView.tsx";
import { DispatchSheet } from "./host/DispatchSheet.tsx";
import { PairingScreen } from "./host/PairingScreen.tsx";
import { WorkspaceDetailSheet } from "./host/WorkspaceDetailSheet.tsx";
import { useHost } from "./host/useHost.ts";
import { AppBar } from "./shell/AppBar.tsx";
import { DEFAULT_TAB, NAV_TABS, TAB_BY_ID, type TabId } from "./shell/tabs.ts";

/** AppBar + a centered status, used while loading IndexedDB / handshaking. */
function StatusFrame({ message }: { readonly message: string }) {
  return (
    <div className="grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)] bg-base text-fg">
      <AppBar />
      <main className="grid min-h-0 place-items-center p-6">
        <div className="flex flex-col items-center gap-3 text-fg-muted">
          <Spinner size="lg" />
          <p className="text-sm">{message}</p>
        </div>
      </main>
    </div>
  );
}

/**
 * The Grove phone shell (Phase-4): the PWA, connected to the REAL host (ADR-0014). It
 * resolves a stored pairing from IndexedDB and either shows the pairing screen or goes
 * LIVE — real `host.status` + `workspaces.list` + `/sync`, with a disconnect that
 * unlinks the device. The read journeys (worktree list + detail, cross-workspace
 * agents, read-only diff) and the W4 write journeys (touch terminal over the
 * `/terminal` WS, dispatch/quick-create) all layer onto this live connection.
 */
export function App() {
  const host = useHost();
  const [active, setActive] = useState<TabId>(DEFAULT_TAB);
  // The active worktree (read-journey focus) and the worktree whose detail sheet is
  // open. Both are client-side selection over the live list — no host writes (W4).
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  // Dispatch (W4): the quick-create Sheet is conditionally mounted; `dispatchNonce`
  // forces the Agents roll-up to refetch after a real dispatch lands.
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [dispatchNonce, setDispatchNonce] = useState(0);

  const navItems = useMemo(
    () => NAV_TABS.map(({ id, label, icon: Icon }) => ({ id, label, icon: <Icon /> })),
    [],
  );

  const openDetail = useCallback((id: string) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);
  const setActiveWorkspace = useCallback((id: string) => setActiveWorkspaceId(id), []);
  // From a detail sheet: focus the worktree, jump to the read-only Diff tab, close.
  const reviewDiff = useCallback((id: string) => {
    setActiveWorkspaceId(id);
    setActive("diff");
    setDetailId(null);
  }, []);

  // A real dispatch landed: focus the new worktree, pull it into the live list, and
  // jump to where it now shows up (the worktree list, or the live Agents roll-up).
  const refresh = host.refresh;
  const onDispatched = useCallback(
    ({ kind, workspaceId }: { kind: "worktree" | "agent"; workspaceId: string }) => {
      refresh();
      setActiveWorkspaceId(workspaceId);
      setDispatchNonce((n) => n + 1);
      setActive(kind === "worktree" ? "workspaces" : "agents");
    },
    [refresh],
  );

  if (host.phase === "loading") {
    return <StatusFrame message="Looking for a paired host…" />;
  }
  if (host.phase === "connecting") {
    return <StatusFrame message="Connecting to your host…" />;
  }

  if (host.phase !== "connected") {
    // unpaired (no stored pairing) or error (stored pairing unreachable).
    const isError = host.phase === "error";
    return (
      <div className="grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)] bg-base text-fg">
        <AppBar />
        <main className="min-h-0 overflow-hidden">
          <PairingScreen
            pair={host.pair}
            notice={
              isError
                ? "Couldn't reach the host you paired earlier — it may be offline or on another network."
                : null
            }
            onRetry={isError ? host.reconnect : undefined}
            onForget={isError ? () => void host.disconnect() : undefined}
          />
        </main>
      </div>
    );
  }

  const tab = TAB_BY_ID[active];
  const TabIcon = tab.icon;
  // Resolve the active worktree, defaulting to the first one so the Diff tab and
  // detail have a real target the moment the live list lands.
  const resolvedActiveId = activeWorkspaceId ?? host.workspaces[0]?.id ?? null;

  return (
    <div className="grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-base text-fg">
      <AppBar />

      <main className="min-h-0 overflow-hidden px-3 pt-3 pb-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <Panel className="h-full">
          <PanelHeader
            actions={
              tab.id !== "settings" ? (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Rocket className="size-3.5" />}
                  className="min-h-8"
                  onClick={() => setDispatchOpen(true)}
                >
                  Dispatch
                </Button>
              ) : undefined
            }
          >
            <PanelTitle icon={<TabIcon />}>{tab.heading}</PanelTitle>
          </PanelHeader>
          <PanelBody className={tabBodyClassName(tab.id)}>
            <ConnectedTabBody
              host={host}
              tab={tab}
              activeWorkspaceId={resolvedActiveId}
              onOpenWorkspace={openDetail}
              onSetActive={setActiveWorkspace}
              dispatchNonce={dispatchNonce}
            />
          </PanelBody>
        </Panel>
      </main>

      {/* Mounted only while open: the shared Sheet enters the top layer via
          `showModal`, and an always-mounted closed sheet variant would still
          paint full-bleed over the viewport (ADR-0014 W3 consequence). */}
      {detailId !== null ? (
        <WorkspaceDetailSheet
          host={host}
          workspaceId={detailId}
          activeWorkspaceId={resolvedActiveId}
          onClose={closeDetail}
          onSetActive={setActiveWorkspace}
          onReviewDiff={reviewDiff}
        />
      ) : null}

      {/* Conditionally mounted — a closed @swarm/ui overlay still paints full-bleed
          (ADR-0014 W3 consequence), so the dispatch Sheet is only in the tree while open. */}
      {dispatchOpen ? (
        <DispatchSheet
          host={host}
          onClose={() => setDispatchOpen(false)}
          onDispatched={onDispatched}
        />
      ) : null}

      <BottomNav
        aria-label="Sections"
        items={navItems}
        value={active}
        onChange={(id) => setActive(id as TabId)}
      />
    </div>
  );
}
