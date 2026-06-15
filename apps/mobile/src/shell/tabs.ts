import { Bot, FileDiff, FolderGit2, Settings, SquareTerminal } from "lucide-react";
import type { ComponentType } from "react";

/** Bottom-nav sections — they mirror the desktop operator journeys (ADR-0013). */
export type TabId = "workspaces" | "agents" | "terminal" | "diff" | "settings";

export interface TabEmptyCopy {
  /** Honest pre-pairing headline — never a false promise. */
  readonly title: string;
  /** A sentence on what lands here once a host is paired. */
  readonly description: string;
}

export interface TabDef {
  readonly id: TabId;
  /** Short label under the nav icon. */
  readonly label: string;
  /** Full heading shown in the panel header. */
  readonly heading: string;
  readonly icon: ComponentType<{ readonly className?: string }>;
  /**
   * Pre-pairing empty-state copy. `null` for sections that already have real,
   * local content (Settings) and therefore render a populated panel instead.
   */
  readonly empty: TabEmptyCopy | null;
}

export const NAV_TABS: readonly TabDef[] = [
  {
    id: "workspaces",
    label: "Workspaces",
    heading: "Workspaces",
    icon: FolderGit2,
    empty: {
      title: "Pair a host to see your worktrees",
      description:
        "Your branches and the agent working each one appear here once this phone is linked to a Grove host.",
    },
  },
  {
    id: "agents",
    label: "Agents",
    heading: "Agents",
    icon: Bot,
    empty: {
      title: "Your agents, in your pocket",
      description:
        "Once a host is linked, every running agent shows up with live status and a flag when it needs you.",
    },
  },
  {
    id: "terminal",
    label: "Terminal",
    heading: "Terminal",
    icon: SquareTerminal,
    empty: {
      title: "Drive a live shell by touch",
      description:
        "Pair a host to attach to any worktree's terminal, complete with a touch keyboard accessory bar.",
    },
  },
  {
    id: "diff",
    label: "Diff",
    heading: "Diff",
    icon: FileDiff,
    empty: {
      title: "Review changes anywhere",
      description:
        "Inspect each worktree's diff and sign off on the work without reaching for your laptop.",
    },
  },
  {
    id: "settings",
    label: "Settings",
    heading: "Settings",
    icon: Settings,
    empty: null,
  },
] as const;

/** The default section shown on first paint. */
export const DEFAULT_TAB: TabId = "workspaces";

/** Lookup by id. A finite-key record, so access by a `TabId` is always defined. */
export const TAB_BY_ID: Record<TabId, TabDef> = Object.fromEntries(
  NAV_TABS.map((tab) => [tab.id, tab]),
) as Record<TabId, TabDef>;
