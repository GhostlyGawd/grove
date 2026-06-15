import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronUp, CornerDownLeft } from "lucide-react";
import type { ReactNode } from "react";
import { SPECIAL_KEYS, SYMBOL_KEYS } from "./control-codes.ts";

interface AccessoryBarProps {
  /** Whether the sticky Ctrl modifier is armed (the next key is sent as a chord). */
  readonly ctrlArmed: boolean;
  /** Toggle the sticky Ctrl modifier. */
  readonly onToggleCtrl: () => void;
  /** Send a fixed control sequence verbatim (Esc / Tab / arrows). */
  readonly onSpecial: (sequence: string) => void;
  /** Send a printable char — Ctrl-chorded when the modifier is armed. */
  readonly onChar: (ch: string) => void;
}

/** A ≥44px touch key. `onMouseDown` preventDefault keeps focus on the terminal so the
 *  soft keyboard never dismisses when a key is tapped. */
function KeyButton({
  label,
  onPress,
  pressed,
  wide,
  children,
}: {
  readonly label: string;
  readonly onPress: () => void;
  readonly pressed?: boolean;
  readonly wide?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPress}
      className={`inline-flex h-11 ${
        wide ? "min-w-[3.25rem] px-3" : "min-w-11 px-2"
      } shrink-0 items-center justify-center rounded-md border font-mono text-sm transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
        pressed
          ? "border-accent-border bg-accent-bg text-accent-fg"
          : "border-line-strong bg-raised text-fg active:bg-overlay"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * The touch input-accessory toolbar (W4) — the key mobile-terminal UX. A soft keyboard
 * cannot reach Ctrl/Esc/Tab/arrows or, easily, shell punctuation, so this bar
 * synthesizes the exact PTY control bytes a hardware keyboard would (see
 * `control-codes.ts`). `Ctrl` is a sticky modifier: arm it, then the next key — from
 * this bar OR the soft keyboard — is sent as a Ctrl chord (e.g. Ctrl+C → `\x03`). It
 * sits above the keyboard, respects the safe-area inset, and uses ≥44px targets.
 */
export function AccessoryBar({ ctrlArmed, onToggleCtrl, onSpecial, onChar }: AccessoryBarProps) {
  return (
    <div
      // The toolbar must not steal focus from the terminal on tap.
      onMouseDown={(e) => e.preventDefault()}
      className="shrink-0 border-t border-line bg-surface px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]"
    >
      {/* Control + navigation row (always visible). */}
      <div className="flex items-center gap-1.5">
        <KeyButton label="Control modifier" pressed={ctrlArmed} wide onPress={onToggleCtrl}>
          <ChevronUp aria-hidden className="size-4" />
          <span className="ml-0.5 text-xs">Ctrl</span>
        </KeyButton>
        <KeyButton label="Escape" wide onPress={() => onSpecial(SPECIAL_KEYS.escape)}>
          <span className="text-xs">Esc</span>
        </KeyButton>
        <KeyButton label="Tab" wide onPress={() => onSpecial(SPECIAL_KEYS.tab)}>
          <span className="text-xs">Tab</span>
        </KeyButton>
        <div className="ml-auto flex items-center gap-1.5">
          <KeyButton label="Arrow left" onPress={() => onSpecial(SPECIAL_KEYS.arrowLeft)}>
            <ArrowLeft aria-hidden className="size-4" />
          </KeyButton>
          <KeyButton label="Arrow up" onPress={() => onSpecial(SPECIAL_KEYS.arrowUp)}>
            <ArrowUp aria-hidden className="size-4" />
          </KeyButton>
          <KeyButton label="Arrow down" onPress={() => onSpecial(SPECIAL_KEYS.arrowDown)}>
            <ArrowDown aria-hidden className="size-4" />
          </KeyButton>
          <KeyButton label="Arrow right" onPress={() => onSpecial(SPECIAL_KEYS.arrowRight)}>
            <ArrowRight aria-hidden className="size-4" />
          </KeyButton>
        </div>
      </div>

      {/* Symbol row — horizontally scrollable so it never wraps or clips on a phone. */}
      <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {SYMBOL_KEYS.map((key) => (
          <KeyButton key={key.char} label={key.label} onPress={() => onChar(key.char)}>
            <span aria-hidden>{key.char}</span>
          </KeyButton>
        ))}
        <KeyButton label="Enter" wide onPress={() => onSpecial(SPECIAL_KEYS.enter)}>
          <CornerDownLeft aria-hidden className="size-4" />
        </KeyButton>
      </div>
    </div>
  );
}
