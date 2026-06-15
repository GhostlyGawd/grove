import type { WorkspaceStatus } from "@swarm/db";
import { cn } from "../cn";
import { statusMeta } from "../status";
import type { StatusTone } from "../status";

export type StatusDotSize = "sm" | "md";

export interface AgentStatusDotProps {
  readonly status: WorkspaceStatus;
  readonly size?: StatusDotSize;
  readonly className?: string;
}

const SIZES: Record<StatusDotSize, string> = {
  sm: "size-2",
  md: "size-2.5",
};

/** Solid fill per tone; idle is hollow so state is not carried by color alone. */
const FILL: Record<StatusTone, string> = {
  idle: "bg-transparent ring-1 ring-inset ring-idle",
  running: "bg-running",
  attention: "bg-attention",
  error: "bg-error",
  success: "bg-success",
};

/**
 * Compact agent-state indicator. Carries an accessible name (role="img"); the
 * running state pulses (shape) and idle is hollow (shape) so the two most common
 * states differ without color. Use `StatusBadge` where status is the primary
 * signal and a text label belongs on screen.
 */
export function AgentStatusDot({ status, size = "md", className }: AgentStatusDotProps) {
  const meta = statusMeta(status);
  return (
    <span
      role="img"
      aria-label={`${meta.label}: ${meta.description}`}
      className={cn(
        "inline-block shrink-0 rounded-full",
        SIZES[size],
        FILL[meta.tone],
        meta.tone === "running" && "grove-pulse",
        className,
      )}
    />
  );
}
