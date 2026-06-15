import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../cn";

export function Table({ className, children, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn("w-full border-collapse text-left text-sm", className)} {...rest}>
      {children}
    </table>
  );
}

export function TableHead({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn("text-fg-subtle", className)} {...rest}>
      {children}
    </thead>
  );
}

export function TableBody({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={className} {...rest}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-line-subtle transition-colors duration-fast last:border-0 hover:bg-raised",
        className,
      )}
      {...rest}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  className,
  children,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "h-8 whitespace-nowrap border-b border-line px-3 text-2xs font-medium uppercase tracking-wide",
        className,
      )}
      {...rest}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className,
  children,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("h-9 px-3 align-middle text-fg", className)} {...rest}>
      {children}
    </td>
  );
}

export interface ListRowProps {
  readonly selected?: boolean;
  readonly onSelect?: () => void;
  /** Leading slot — typically an AgentStatusDot. */
  readonly leading?: ReactNode;
  /** Trailing slot — non-interactive meta (a Badge, time, count). */
  readonly trailing?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}

/**
 * Dense, selectable row for the workspace rail. Rendered as a button; the
 * trailing slot must stay non-interactive (no nested buttons).
 */
export function ListRow({
  selected = false,
  onSelect,
  leading,
  trailing,
  children,
  className,
}: ListRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface",
        selected
          ? "bg-accent-bg text-fg ring-1 ring-inset ring-accent-border"
          : "text-fg-muted hover:bg-raised hover:text-fg",
        className,
      )}
    >
      {leading ? <span className="flex shrink-0 items-center">{leading}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing ? <span className="flex shrink-0 items-center gap-1.5">{trailing}</span> : null}
    </button>
  );
}
