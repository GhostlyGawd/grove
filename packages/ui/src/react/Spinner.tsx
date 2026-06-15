import { Loader2 } from "lucide-react";
import type { HTMLAttributes } from "react";
import { cn } from "../cn";

export type SpinnerSize = "sm" | "md" | "lg";

export interface SpinnerProps {
  readonly size?: SpinnerSize;
  readonly className?: string;
  /** Accessible label announced to screen readers. */
  readonly label?: string;
}

const SIZES: Record<SpinnerSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
};

export function Spinner({ size = "md", className, label = "Loading" }: SpinnerProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: role="status" is the correct live-region pattern for a spinner; <output> carries form-result semantics we don't want
    <span role="status" aria-live="polite" className={cn("inline-flex text-fg-muted", className)}>
      <Loader2 aria-hidden className={cn("animate-spin", SIZES[size])} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Tailwind sizing utilities, e.g. "h-4 w-32". */
  readonly className?: string;
}

/** Shimmering shape used while real content streams in. */
export function Skeleton({ className, ...rest }: SkeletonProps) {
  return <div aria-hidden className={cn("grove-skeleton rounded-sm", className)} {...rest} />;
}
