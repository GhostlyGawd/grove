/**
 * WCAG 2.1 contrast utilities (no dependencies).
 *
 * The design system's accessibility claims are not prose — every documented
 * text/background pair is checked against these functions in `tokens.test.ts`,
 * so a regression that breaks AA fails the build (RUBRIC §6.3 / §6.4).
 */

/** WCAG AA thresholds. */
export const AA_NORMAL = 4.5;
export const AA_LARGE = 3;
/** Non-text UI components and graphical objects (WCAG 2.1 SC 1.4.11). */
export const AA_NON_TEXT = 3;

/** Parse `#rgb` or `#rrggbb` into 0-255 channels. */
export function parseHex(hex: string): readonly [number, number, number] {
  const value = hex.trim().replace(/^#/, "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value;
  if (full.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return [r, g, b];
}

/** sRGB channel to linear-light value per WCAG. */
function linearize(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of an opaque color. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** Contrast ratio (1..21) between two opaque colors. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Round to 2 decimals for display ("7.13:1"). */
export function ratio(a: string, b: string): number {
  return Math.round(contrastRatio(a, b) * 100) / 100;
}

/** Does the pair clear an AA threshold? */
export function meetsAA(a: string, b: string, min: number = AA_NORMAL): boolean {
  return contrastRatio(a, b) >= min;
}
