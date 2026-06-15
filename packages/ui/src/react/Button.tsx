import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** Show a spinner and block interaction without collapsing layout. */
  readonly loading?: boolean;
  /** Decorative leading icon (already sized by the caller). */
  readonly icon?: ReactNode;
}

const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none rounded-md border font-medium transition-[background-color,border-color,color,filter] duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-50 disabled:pointer-events-none";

const SIZES: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs gap-1",
  md: "h-8 px-3 text-sm",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-fg-on-accent border-transparent hover:brightness-110 active:brightness-95",
  secondary: "bg-raised text-fg border-line-strong hover:bg-overlay",
  ghost: "bg-transparent text-fg-muted border-transparent hover:bg-raised hover:text-fg",
  danger: "bg-error-bg text-error-fg border-error-border hover:bg-error hover:text-fg-on-accent",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    icon,
    className,
    children,
    disabled,
    type,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, SIZES[size], VARIANTS[variant], className)}
      {...rest}
    >
      {loading ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : icon}
      {children}
    </button>
  );
});
