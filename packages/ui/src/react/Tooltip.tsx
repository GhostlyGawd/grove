import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { cloneElement, useId, useState } from "react";
import { cn } from "../cn";

export type TooltipSide = "top" | "bottom";

export interface TooltipProps {
  /** The tooltip text/content. */
  readonly label: ReactNode;
  /** A single focusable trigger element. */
  readonly children: ReactElement;
  readonly side?: TooltipSide;
  readonly className?: string;
}

const SIDE: Record<TooltipSide, string> = {
  top: "bottom-full mb-1.5",
  bottom: "top-full mt-1.5",
};

/**
 * Tooltip shown on hover and keyboard focus, dismissed on blur, mouse-leave, or
 * Escape. The trigger is linked via aria-describedby. Tooltips supplement — they
 * never carry the only copy of essential information.
 */
export function Tooltip({ label, children, side = "top", className }: TooltipProps) {
  const tipId = useId();
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);
  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Escape") {
      hide();
    }
  };

  const describedProps: { "aria-describedby"?: string } = open ? { "aria-describedby": tipId } : {};

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onKeyDown={onKeyDown}
    >
      {cloneElement(children, describedProps)}
      {open ? (
        <span
          role="tooltip"
          id={tipId}
          className={cn(
            "grove-anim-fade pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-line-strong bg-overlay px-2 py-1 text-2xs font-medium text-fg shadow-md",
            SIDE[side],
            className,
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
