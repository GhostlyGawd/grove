/**
 * The byte sequences the touch accessory bar sends to the real PTY (W4).
 *
 * A phone soft keyboard cannot produce Ctrl/Esc/Tab/arrows or, reliably, the shell
 * punctuation a CLI needs. The accessory bar synthesizes the exact control bytes the
 * desktop terminal gets from a hardware keyboard, then writes them down the same
 * `/terminal` WebSocket as a normal keystroke — so to the host PTY there is no
 * difference between a tapped `Esc` and a pressed one.
 */

/** ANSI escape introducer. */
const ESC = "\x1b";

/** Fixed control sequences for the non-printable accessory keys. */
export const SPECIAL_KEYS = {
  escape: ESC,
  tab: "\t",
  enter: "\r",
  backspace: "\x7f",
  arrowUp: `${ESC}[A`,
  arrowDown: `${ESC}[B`,
  arrowRight: `${ESC}[C`,
  arrowLeft: `${ESC}[D`,
  home: `${ESC}[H`,
  end: `${ESC}[F`,
} as const;

export type SpecialKey = keyof typeof SPECIAL_KEYS;

/**
 * Translate a single character into its Ctrl-chord control byte, matching what a
 * hardware Ctrl+<key> emits over a PTY:
 *   - `A`–`Z` / `a`–`z` → 0x01–0x1A (Ctrl-A … Ctrl-Z; Ctrl-C is `\x03`, etc.)
 *   - `@ [ \ ] ^ _`     → 0x00, 0x1B–0x1F (the C0 block above the letters)
 *   - `?`               → 0x7F (Ctrl-? is DEL)
 *   - ` ` (space)       → 0x00 (Ctrl-Space → NUL)
 * Any other character has no Ctrl form, so it is sent unchanged (Ctrl is consumed).
 */
export function toControlCode(ch: string): string {
  if (ch.length !== 1) {
    return ch;
  }
  if (ch === "?") {
    return "\x7f";
  }
  if (ch === " ") {
    return "\x00";
  }
  const upper = ch.toUpperCase();
  const code = upper.charCodeAt(0);
  // `@`(64)..`_`(95) maps to 0..31 by masking off the top bits — the canonical
  // ASCII control-key transform. Letters live inside this range, so this single
  // rule covers A–Z and the @ [ \ ] ^ _ punctuation in one expression.
  if (code >= 64 && code <= 95) {
    return String.fromCharCode(code & 0x1f);
  }
  return ch;
}

/** A printable accessory key — sent literally, or as a Ctrl-chord when Ctrl is armed. */
export interface SymbolKey {
  /** The byte(s) typed when tapped (also the Ctrl-chord source for single chars). */
  readonly char: string;
  /** Accessible label (the glyph alone is ambiguous for some symbols). */
  readonly label: string;
}

/**
 * The punctuation row — the symbols a CLI leans on that phone keyboards bury behind
 * layers (pipes, redirection, home/tilde, flags, globs, subshells, path separators).
 */
export const SYMBOL_KEYS: readonly SymbolKey[] = [
  { char: "|", label: "Pipe" },
  { char: "~", label: "Tilde" },
  { char: "/", label: "Slash" },
  { char: "\\", label: "Backslash" },
  { char: "-", label: "Dash" },
  { char: "_", label: "Underscore" },
  { char: "$", label: "Dollar" },
  { char: "*", label: "Asterisk" },
  { char: "&", label: "Ampersand" },
  { char: ">", label: "Greater than" },
  { char: "`", label: "Backtick" },
  { char: '"', label: "Double quote" },
  { char: "'", label: "Single quote" },
];
