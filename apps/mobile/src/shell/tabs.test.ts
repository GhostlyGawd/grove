import { describe, expect, it } from "bun:test";
import { DEFAULT_TAB, NAV_TABS, TAB_BY_ID, type TabId } from "./tabs.ts";

describe("NAV_TABS", () => {
  it("exposes the five desktop-journey sections in order", () => {
    expect(NAV_TABS.map((tab) => tab.id)).toEqual([
      "workspaces",
      "agents",
      "terminal",
      "diff",
      "settings",
    ]);
  });

  it("has unique ids with a label and heading per section", () => {
    const ids = new Set<TabId>();
    for (const tab of NAV_TABS) {
      expect(ids.has(tab.id)).toBe(false);
      ids.add(tab.id);
      expect(tab.label.trim().length).toBeGreaterThan(0);
      expect(tab.heading.trim().length).toBeGreaterThan(0);
    }
    expect(ids.size).toBe(NAV_TABS.length);
  });

  it("ships substantial, trimmed empty-state copy where present", () => {
    for (const tab of NAV_TABS) {
      if (!tab.empty) {
        continue;
      }
      expect(tab.empty.title).toBe(tab.empty.title.trim());
      expect(tab.empty.title.length).toBeGreaterThan(8);
      expect(tab.empty.description).toBe(tab.empty.description.trim());
      expect(tab.empty.description.length).toBeGreaterThan(20);
    }
  });

  it("resolves every section by id and defaults to a real one", () => {
    for (const tab of NAV_TABS) {
      expect(TAB_BY_ID[tab.id]).toBe(tab);
    }
    expect(TAB_BY_ID[DEFAULT_TAB]).toBeDefined();
  });
});
