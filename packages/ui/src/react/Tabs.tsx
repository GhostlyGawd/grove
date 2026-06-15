import type { KeyboardEvent, ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { cn } from "../cn";

export interface TabItem {
  readonly value: string;
  readonly label: string;
  readonly icon?: ReactNode;
  readonly content?: ReactNode;
}

export interface TabsProps {
  readonly items: readonly TabItem[];
  /** Controlled active value. */
  readonly value?: string;
  /** Uncontrolled initial value. */
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly className?: string;
  /** Render the active panel beneath the list (default true). */
  readonly renderPanel?: boolean;
}

/**
 * Accessible tabs: roving tabindex, ArrowLeft/Right + Home/End navigation with
 * automatic activation, and wired aria-controls/aria-labelledby. Works
 * controlled or uncontrolled.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  renderPanel = true,
}: TabsProps) {
  const baseId = useId();
  const firstValue = items[0]?.value ?? "";
  const [internal, setInternal] = useState(defaultValue ?? firstValue);
  const active = value ?? internal;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const select = (next: string) => {
    if (value === undefined) {
      setInternal(next);
    }
    onValueChange?.(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = items.findIndex((item) => item.value === active);
    if (currentIndex < 0) {
      return;
    }
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    }
    if (nextIndex === null) {
      return;
    }
    event.preventDefault();
    const nextItem = items[nextIndex];
    if (!nextItem) {
      return;
    }
    select(nextItem.value);
    tabRefs.current[nextIndex]?.focus();
  };

  const activeItem = items.find((item) => item.value === active);

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="flex items-center gap-1 border-b border-line"
      >
        {items.map((item, index) => {
          const selected = item.value === active;
          return (
            <button
              key={item.value}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.value}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.value)}
              className={cn(
                "relative -mb-px inline-flex h-8 items-center gap-1.5 rounded-t-sm border-b-2 px-2.5 text-sm font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-surface [&_svg]:size-3.5",
                selected
                  ? "border-accent text-fg"
                  : "border-transparent text-fg-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
      {renderPanel && activeItem ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeItem.value}`}
          aria-labelledby={`${baseId}-tab-${activeItem.value}`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: ARIA APG gives a tabpanel tabindex=0 so keyboard users can focus and scroll the panel itself
          tabIndex={0}
          className="min-h-0 flex-1 pt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {activeItem.content}
        </div>
      ) : null}
    </div>
  );
}
