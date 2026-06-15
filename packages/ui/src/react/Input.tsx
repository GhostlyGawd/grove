import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef, useId } from "react";
import { cn } from "../cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Visible label — Grove fields are always labelled, never label-by-hint. */
  readonly label?: string;
  /** Helper text rendered beneath the control. */
  readonly hint?: ReactNode;
  /** Error message; sets aria-invalid and the error border when present. */
  readonly error?: ReactNode;
  /** Decorative icon rendered inside the field's leading edge. */
  readonly leadingIcon?: ReactNode;
}

const CONTROL =
  "w-full rounded-md border bg-raised text-fg text-sm h-8 px-2.5 transition-[border-color,box-shadow] duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leadingIcon, className, id, disabled, ...rest },
  ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  return (
    <div className="flex flex-col gap-1">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-medium text-fg-muted">
          {label}
        </label>
      ) : null}
      <div className="relative flex items-center">
        {leadingIcon ? (
          <span className="pointer-events-none absolute left-2.5 inline-flex text-fg-subtle [&_svg]:size-3.5">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            CONTROL,
            leadingIcon ? "pl-8" : null,
            error
              ? "border-error focus-visible:ring-error"
              : "border-line-strong hover:border-fg-subtle focus-visible:ring-accent",
            className,
          )}
          {...rest}
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
