import { expect, test } from "@playwright/test";
import { pairAndLand } from "./pair-and-land.ts";

/**
 * Prefixed `z-` so it runs LAST in this serial (workers:1), single-shared-host suite:
 * a real dispatch mutates host state (it starts a genuine agent → a new row in
 * `sessions.list`), which would otherwise break the pristine-seed count + single-row
 * assertions in `read-journeys.spec.ts`. Running it last keeps every earlier spec on
 * the untouched seed while still proving real dispatch end-to-end.
 */

/** A deterministic, always-present generic command per host OS (resolved by the host
 *  via where.exe/which before the direct PTY spawn). */
const GENERIC_COMMAND = process.platform === "win32" ? "cmd" : "sh";

test.describe("Grove PWA — W4 dispatch / quick-create (phone viewport, real host)", () => {
  test("dispatches a real generic agent that shows up live in the Agents roll-up", async ({
    page,
  }) => {
    await pairAndLand(page);

    // Open the dispatch Sheet from the panel header.
    await page.getByRole("button", { name: "Dispatch" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    // Default mode is "Start agent". Target the git-backed worktree (its cwd exists on
    // disk), pick the generic adapter, and supply the required command.
    await sheet.getByLabel("Worktree").selectOption({ label: "diff-demo · feat/diff-demo" });
    await sheet.getByLabel("Adapter").selectOption("generic");
    await sheet.getByLabel("Command").fill(GENERIC_COMMAND);

    // Real `agents.start` against the host — a genuine PTY-backed agent, no mock.
    await sheet.getByRole("button", { name: "Dispatch" }).click();

    // The dispatch lands the app on the live Agents roll-up; the new generic session
    // appears alongside the seeded claude-code one (refetched after the start). Scope
    // to `main` so the match is the live agent row, not the success toast's text.
    await expect(sheet).toBeHidden();
    const roster = page.getByRole("main");
    await expect(roster.getByText("generic")).toBeVisible({ timeout: 20_000 });
    await expect(roster.getByText(/running · \d+ total/)).toBeVisible();

    await page.screenshot({ path: "../../evidence/phase-4/mobile-dispatch.png" });
  });
});
