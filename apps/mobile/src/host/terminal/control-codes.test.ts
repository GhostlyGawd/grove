import { describe, expect, test } from "bun:test";
import { SPECIAL_KEYS, SYMBOL_KEYS, toControlCode } from "./control-codes.ts";

describe("toControlCode — the Ctrl-chord transform the accessory bar sends", () => {
  test("letters map to Ctrl-A..Ctrl-Z regardless of case", () => {
    expect(toControlCode("c")).toBe("\x03"); // Ctrl-C / SIGINT
    expect(toControlCode("C")).toBe("\x03");
    expect(toControlCode("a")).toBe("\x01");
    expect(toControlCode("z")).toBe("\x1a");
    expect(toControlCode("d")).toBe("\x04"); // Ctrl-D / EOF
    expect(toControlCode("l")).toBe("\x0c"); // Ctrl-L / clear
  });

  test("the C0 punctuation above the letters maps into 0x1b..0x1f", () => {
    expect(toControlCode("@")).toBe("\x00");
    expect(toControlCode("[")).toBe("\x1b"); // Ctrl-[ == Esc
    expect(toControlCode("\\")).toBe("\x1c");
    expect(toControlCode("]")).toBe("\x1d");
    expect(toControlCode("^")).toBe("\x1e");
    expect(toControlCode("_")).toBe("\x1f");
  });

  test("the special cases (? and space) map to DEL and NUL", () => {
    expect(toControlCode("?")).toBe("\x7f");
    expect(toControlCode(" ")).toBe("\x00");
  });

  test("a character with no Ctrl form is returned unchanged", () => {
    expect(toControlCode("1")).toBe("1");
    expect(toControlCode("")).toBe("");
    expect(toControlCode("ab")).toBe("ab");
  });
});

describe("accessory key tables", () => {
  test("arrows emit the standard CSI cursor sequences", () => {
    expect(SPECIAL_KEYS.arrowUp).toBe("\x1b[A");
    expect(SPECIAL_KEYS.arrowDown).toBe("\x1b[B");
    expect(SPECIAL_KEYS.arrowRight).toBe("\x1b[C");
    expect(SPECIAL_KEYS.arrowLeft).toBe("\x1b[D");
    expect(SPECIAL_KEYS.escape).toBe("\x1b");
    expect(SPECIAL_KEYS.tab).toBe("\t");
  });

  test("every symbol key carries a single char and a non-empty label", () => {
    for (const key of SYMBOL_KEYS) {
      expect(key.char.length).toBe(1);
      expect(key.label.length).toBeGreaterThan(0);
    }
    // The pipe is the headline CLI symbol — it must be present.
    expect(SYMBOL_KEYS.some((k) => k.char === "|")).toBe(true);
  });
});
