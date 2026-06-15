import { ChevronDown } from "lucide-react";
import type { ReactNode, SelectHTMLAttributes } from "react";
import { forwardRef, useId } from "react";
import { cn } from "../cn";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
  readonly hint?: ReactNode;
  readonly error?: ReactNode;
  readonly children: ReactNode;
}

const CONTROL =
  "w-full appearance-none rounded-md border bg-raised text-fg text-sm h-8 pl-2.5 pr-8 transition-[border-color,box-shadow] duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed";

/** Styled native `<select>` — keeps the OS picker and its accessibility intact. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, disabled, children, ...rest },
  ref,
) {
  const reactId = useId();
  const selectId = id ?? reactId;
  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={selectId} className="text-xs font-medium text-fg-muted">
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL,
            error
              ? "border-error focus-visible:ring-error"
              : "border-line-strong hover:border-fg-subtle focus-visible:ring-accent",
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2.5 size-3.5 text-fg-subtle"
        />
      </div>
      {error ? (
        <p id={errorId} className="text-2xs text-error-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-2xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
