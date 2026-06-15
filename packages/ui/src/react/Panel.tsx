import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../cn";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Recess the body (terminal/diff wells) instead of the default surface. */
  readonly inset?: boolean;
}

export function Panel({ className, inset = false, children, ...rest }: PanelProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border border-line shadow-sm",
        inset ? "bg-inset" : "bg-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

export interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly actions?: ReactNode;
}

export function PanelHeader({ className, actions, children, ...rest }: PanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-9 shrink-0 items-center justify-between gap-2 border-b border-line bg-surface px-3",
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 items-center gap-2">{children}</div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </header>
  );
}

export interface PanelTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  readonly icon?: ReactNode;
}

export function PanelTitle({ className, icon, children, ...rest }: PanelTitleProps) {
  return (
    <h2
      className={cn("flex min-w-0 items-center gap-2 text-sm font-semibold text-fg", className)}
      {...rest}
    >
      {icon ? (
        <span className="inline-flex shrink-0 text-fg-muted [&_svg]:size-4">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </h2>
  );
}

export function PanelBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-auto p-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <footer
      className={cn(
        "flex shrink-0 items-center justify-between gap-2 border-t border-line bg-surface px-3 py-2",
        className,
      )}
      {...rest}
    >
      {children}
    </footer>
  );
}
