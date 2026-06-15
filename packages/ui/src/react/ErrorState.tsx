import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../cn";

export interface ErrorStateProps {
  readonly title?: string;
  readonly description?: ReactNode;
  /** Recovery action — typically a "Retry" Button. */
  readonly action?: ReactNode;
  /** Collapsible technical detail (stderr, stack, exit code). */
  readonly detail?: ReactNode;
  readonly className?: string;
}

/** A recoverable failure surface: states what broke and offers a way forward. */
export function ErrorState({
  title = "Something went wrong",
  description,
  action,
  detail,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg border border-error-border bg-error-bg text-error-fg">
        <AlertTriangle aria-hidden className="size-5" />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <p className="text-sm font-semibold text-fg">{title}</p>
        {description ? <p className="text-xs text-fg-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1 flex items-center gap-2">{action}</div> : null}
      {detail ? (
        <pre className="mt-1 max-w-full overflow-auto rounded-md border border-line bg-inset px-3 py-2 text-left text-2xs text-fg-muted">
          {detail}
        </pre>
      ) : null}
    </div>
  );
}
