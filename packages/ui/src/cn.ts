/**
 * Minimal class-name joiner. Falsy values drop out; truthy strings join with a
 * single space. Kept dependency-free on purpose — Grove ships no styling runtime,
 * only static utility strings the Tailwind scanner can see.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: readonly ClassValue[]): string {
  let out = "";
  for (const value of values) {
    if (!value && value !== 0) {
      continue;
    }
    out = out ? `${out} ${value}` : `${value}`;
  }
  return out;
}
