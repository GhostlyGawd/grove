import { BottomNav, EmptyState, Panel, PanelBody, PanelHeader, PanelTitle } from "@swarm/ui/react";
import { useMemo, useState } from "react";
import { AppBar } from "./shell/AppBar.tsx";
import { ConnectAffordance, ConnectHint } from "./shell/ConnectAffordance.tsx";
import { SettingsPanel } from "./shell/SettingsPanel.tsx";
import { DEFAULT_TAB, NAV_TABS, TAB_BY_ID, type TabId } from "./shell/tabs.ts";

/**
 * The Grove phone shell (Phase-4 W1): a single-column, safe-area-aware PWA layout
 * on `@swarm/ui`. A top app bar, one live section panel, and a bottom tab bar.
 *
 * This wave is the static skeleton — the host connection, pairing, service worker
 * and push land in later waves (ADR-0014). Every section is honest about that:
 * Settings works locally today; the rest show a considered empty state with a
 * parked Connect affordance until a host is paired.
 */
export function App() {
  const [active, setActive] = useState<TabId>(DEFAULT_TAB);

  const tab = TAB_BY_ID[active];

  const navItems = useMemo(
    () => NAV_TABS.map(({ id, label, icon: Icon }) => ({ id, label, icon: <Icon /> })),
    [],
  );

  const TabIcon = tab.icon;

  return (
    <div className="grid h-[100dvh] grid-rows-[auto_minmax(0,1fr)_auto] bg-base text-fg">
      <AppBar />

      <main className="min-h-0 overflow-hidden px-3 pt-3 pb-2 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]">
        <Panel className="h-full">
          <PanelHeader>
            <PanelTitle icon={<TabIcon />}>{tab.heading}</PanelTitle>
          </PanelHeader>
          <PanelBody className="grid place-items-center">
            {tab.empty ? (
              <EmptyState
                icon={<TabIcon />}
                title={tab.empty.title}
                description={tab.empty.description}
                action={<ConnectAffordance />}
                hint={<ConnectHint />}
              />
            ) : (
              <div className="w-full self-start">
                <SettingsPanel />
              </div>
            )}
          </PanelBody>
        </Panel>
      </main>

      <BottomNav
        aria-label="Sections"
        items={navItems}
        value={active}
        onChange={(id) => setActive(id as TabId)}
      />
    </div>
  );
}
