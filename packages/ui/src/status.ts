import type { WorkspaceStatus } from "@swarm/db";

/**
 * Agent / workspace status semantics — framework-agnostic.
 *
 * State is *triple-encoded*: a semantic color token, a text label, and a shape
 * hint. Color is never the sole signal (WCAG 1.4.1), so the React layer renders
 * a distinct glyph per tone alongside the dot.
 */
export type StatusTone = "idle" | "running" | "attention" | "error" | "success";

/** Shape used to encode state without relying on color. */
export type StatusShape = "ring" | "pulse" | "alert" | "cross" | "check";

export interface StatusMeta {
  readonly tone: StatusTone;
  readonly label: string;
  readonly shape: StatusShape;
  /** One-line meaning for tooltips and the legend. */
  readonly description: string;
}

export const STATUS_META: Readonly<Record<WorkspaceStatus, StatusMeta>> = {
  idle: {
    tone: "idle",
    label: "Idle",
    shape: "ring",
    description: "No agent running; the worktree is at rest.",
  },
  running: {
    tone: "running",
    label: "Running",
    shape: "pulse",
    description: "An agent is actively working in this worktree.",
  },
  needs_attention: {
    tone: "attention",
    label: "Needs attention",
    shape: "alert",
    description: "The agent paused or is waiting on you.",
  },
  error: {
    tone: "error",
    label: "Error",
    shape: "cross",
    description: "The run failed; inspect the terminal and diff.",
  },
  done: {
    tone: "success",
    label: "Done",
    shape: "check",
    description: "Changes are ready to review and harvest.",
  },
};

export function statusMeta(status: WorkspaceStatus): StatusMeta {
  return STATUS_META[status];
}
