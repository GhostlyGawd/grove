import type { WorkspaceStatus } from "@swarm/db";
import { AlertTriangle, CheckCircle2, Circle, Loader, XOctagon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../cn";
import { statusMeta } from "../status";
import type { StatusTone } from "../status";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "idle"
  | "running"
  | "attention"
  | "error"
  | "success"
  | "info";

export interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
  /** Render a leading state dot. */
  readonly dot?: boolean;
  readonly className?: string;
}

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-raised text-fg-muted border-line",
  accent: "bg-accent-bg text-accent-fg border-accent-border",
  idle: "bg-idle-bg text-idle-fg border-idle-border",
  running: "bg-running-bg text-running-fg border-running-border",
  attention: "bg-attention-bg text-attention-fg border-attention-border",
  error: "bg-error-bg text-error-fg border-error-border",
  success: "bg-success-bg text-success-fg border-success-border",
  info: "bg-info-bg text-info-fg border-info-border",
};

const DOT_TONES: Record<BadgeTone, string> = {
  neutral: "bg-fg-subtle",
  accent: "bg-accent",
  idle: "bg-idle",
  running: "bg-running",
  attention: "bg-attention",
  error: "bg-error",
  success: "bg-success",
  info: "bg-info",
};

export function Badge({ tone = "neutral", children, dot = false, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-0.5 text-2xs font-medium leading-none tabular-nums",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className={cn("size-1.5 rounded-full", DOT_TONES[tone])} /> : null}
      {children}
    </span>
  );
}

const TONE_BY_STATUS: Record<StatusTone, BadgeTone> = {
  idle: "idle",
  running: "running",
  attention: "attention",
  error: "error",
  success: "success",
};

const ICON_BY_TONE: Record<StatusTone, LucideIcon> = {
  idle: Circle,
  running: Loader,
  attention: AlertTriangle,
  error: XOctagon,
  success: CheckCircle2,
};

export interface StatusBadgeProps {
  readonly status: WorkspaceStatus;
  readonly className?: string;
}

/** Labelled, icon + color + text status — the non-color-reliant primary form. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = statusMeta(status);
  const Icon = ICON_BY_TONE[meta.tone];
  return (
    <Badge tone={TONE_BY_STATUS[meta.tone]} className={className}>
      <Icon className={cn("size-3", meta.tone === "running" && "animate-spin")} />
      {meta.label}
    </Badge>
  );
}
