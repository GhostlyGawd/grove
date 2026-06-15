import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "../cn";
import type { ButtonVariant } from "./Button";

export type IconButtonSize = "sm" | "md";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: IconButtonSize;
  /** The icon node. */
  readonly children: ReactNode;
  /** Required: icon-only controls have no visible text, so they must be labelled. */
  readonly "aria-label": string;
}

const BASE =
  "inline-flex items-center justify-center shrink-0 rounded-md border transition-[background-color,border-color,color] duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:opacity-50 disabled:pointer-events-none";

const SIZES: Record<IconButtonSize, string> = {
  sm: "size-7 [&_svg]:size-3.5",
  md: "size-8 [&_svg]:size-4",
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-fg-on-accent border-transparent hover:brightness-110",
  secondary: "bg-raised text-fg border-line-strong hover:bg-overlay",
  ghost: "bg-transparent text-fg-muted border-transparent hover:bg-raised hover:text-fg",
  danger: "bg-transparent text-error-fg border-transparent hover:bg-error-bg",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = "ghost", size = "md", className, children, disabled, type, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type ?? "button"}
      disabled={disabled}
      className={cn(BASE, SIZES[size], VARIANTS[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
});
