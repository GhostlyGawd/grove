import type { ReactNode } from "react";
import { cn } from "../cn";

export interface EmptyStateProps {
  /** Decorative icon (e.g. a Lucide glyph). */
  readonly icon?: ReactNode;
  readonly title: string;
  readonly description?: ReactNode;
  /** Primary action(s) — typically a Button. */
  readonly action?: ReactNode;
  /** Keyboard hint shown beneath the action. */
  readonly hint?: ReactNode;
  readonly className?: string;
}

/** The considered "nothing here yet" state — never a blank panel. */
export function EmptyState({ icon, title, description, action, hint, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-10 items-center justify-center rounded-lg border border-line bg-raised text-fg-subtle [&_svg]:size-5">
          {icon}
        </div>
      ) : null}
      <div className="flex max-w-xs flex-col gap-1">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {description ? <p className="text-xs text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1 flex items-center gap-2">{action}</div> : null}
      {hint ? <p className="text-2xs text-fg-subtle">{hint}</p> : null}
    </div>
  );
}
