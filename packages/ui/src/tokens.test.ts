import { describe, expect, test } from "bun:test";
import { AA_LARGE, AA_NORMAL, contrastRatio, parseHex, ratio } from "./contrast";
import {
  CONTRAST_CLAIMS,
  RADII,
  SPACE,
  THEMES,
  TYPE_SCALE,
  darkColors,
  lightColors,
} from "./tokens";

describe("contrast math", () => {
  test("black/white is the canonical 21:1", () => {
    expect(Math.round(contrastRatio("#000000", "#ffffff"))).toBe(21);
  });

  test("identical colors are 1:1", () => {
    expect(contrastRatio("#3fb950", "#3fb950")).toBeCloseTo(1, 5);
  });

  test("shorthand hex parses like longhand", () => {
    expect(parseHex("#abc")).toEqual(parseHex("#aabbcc"));
  });

  test("rejects malformed hex", () => {
    expect(() => parseHex("#12")).toThrow();
  });
});

describe("WCAG AA is enforced for every documented pair", () => {
  for (const claim of CONTRAST_CLAIMS) {
    test(`[${claim.theme}] ${claim.label} ≥ ${claim.min}:1`, () => {
      const actual = ratio(claim.fg, claim.bg);
      // Surfaced on failure so the offending pair + its real ratio is visible.
      expect(actual).toBeGreaterThanOrEqual(claim.min);
    });
  }
});

describe("token scales are well-formed", () => {
  test("both themes expose an identical role set", () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });

  test("AA thresholds match the spec", () => {
    expect(AA_NORMAL).toBe(4.5);
    expect(AA_LARGE).toBe(3);
  });

  test("scales are non-empty and uniquely keyed", () => {
    for (const scale of [SPACE, RADII, TYPE_SCALE]) {
      const tokenNames = scale.map((row) => row.token);
      expect(tokenNames.length).toBeGreaterThan(0);
      expect(new Set(tokenNames).size).toBe(tokenNames.length);
    }
  });

  test("every theme color is a valid hex", () => {
    for (const theme of Object.values(THEMES)) {
      for (const value of Object.values(theme)) {
        expect(() => parseHex(value)).not.toThrow();
      }
    }
  });
});
