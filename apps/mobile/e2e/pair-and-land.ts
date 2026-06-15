import { readFileSync } from "node:fs";
import { type Page, expect } from "@playwright/test";
import { PAIR_FILE, type PairFixture, mintPairCode } from "./host-fixture.ts";

/** The minted code + host URL/token the globalSetup wrote for the specs. */
export function readPairFixture(): PairFixture {
  return JSON.parse(readFileSync(PAIR_FILE, "utf8")) as PairFixture;
}

/**
 * Pair the phone against the real seeded host and land on the live worktree list.
 * Each call mints its OWN fresh single-use code (codes are single-use, so specs must
 * not share one) — the browser still only receives the bearer via `pair.redeem`.
 */
export async function pairAndLand(page: Page): Promise<void> {
  const { url, token } = readPairFixture();
  const code = await mintPairCode(url, token);
  await page.goto(`${url}/?code=${code}`);
  await expect(page.getByRole("heading", { name: "Pair this phone" })).toBeVisible();
  await page.getByRole("button", { name: "Link this phone" }).click();
  // The real `workspaces.list` round-trip renders the seeded worktrees.
  await expect(page.getByText("diff-demo", { exact: true })).toBeVisible();
}
