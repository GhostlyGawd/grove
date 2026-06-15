import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, expect, test } from "@playwright/test";
import { mintPairCode } from "./host-fixture.ts";
import { pairAndLand, readPairFixture } from "./pair-and-land.ts";

/**
 * Phase-4 evidence capture (spec §6.3) — a MEASUREMENT TOOL, not a product spec. It
 * drives each phone surface against the REAL seeded host booted in `global-setup.ts`
 * (genuine pairing + tRPC + `/sync` + PTY + git — no mocks) at the configured Pixel-5
 * viewport and writes intentional, real-data screenshots to `evidence/phase-4/`. Each
 * shot waits for real content to settle (no mid-frame spinners). Env-gated out of the
 * default behavioural run via the `_` prefix (lift with GROVE_E2E_MEASURE=1).
 *
 * It deliberately does NOT mutate host state (no dispatch submit, no worktree create),
 * so the seeded counts the read journeys assert stay pristine across the shared host.
 */

const EVIDENCE_DIR = fileURLToPath(new URL("../../../evidence/phase-4/", import.meta.url));

/** Stamp a phone-viewport screenshot under `evidence/phase-4/`. */
async function shot(page: Page, name: string): Promise<void> {
  // A short settle so sheet/overlay open animations finish before the frame.
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(EVIDENCE_DIR, name) });
}

test.describe("Phase-4 phone screenshots (§6.3) — real host, real data", () => {
  test("m-pairing: the pairing screen with a real minted code", async ({ page }) => {
    const { url, token } = readPairFixture();
    // A fresh single-use code so the field shows a genuine, unexpired pairing code.
    const code = await mintPairCode(url, token);
    await page.goto(`${url}/?code=${code}`);
    await expect(page.getByRole("heading", { name: "Pair this phone" })).toBeVisible();
    await expect(page.getByLabel("Pairing code")).toHaveValue(code);
    await shot(page, "m-pairing.png");
  });

  test("m-workspaces: the live worktree list", async ({ page }) => {
    await pairAndLand(page);
    await expect(page.getByText("feat/login-rework", { exact: true })).toBeVisible();
    await expect(page.getByText("fix/api-timeout", { exact: true })).toBeVisible();
    await expect(page.getByText("diff-demo", { exact: true })).toBeVisible();
    await shot(page, "m-workspaces.png");
  });

  test("m-workspace-detail: branch / ahead-behind / agents / sessions", async ({ page }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: /diff-demo/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("feat/diff-demo").first()).toBeVisible({ timeout: 15_000 });
    await expect(sheet.getByText("In sync with main")).toBeVisible({ timeout: 15_000 });
    await expect(sheet.getByText("Running agents")).toBeVisible();
    await expect(sheet.getByText("claude-code").first()).toBeVisible();
    await shot(page, "m-workspace-detail.png");
  });

  test("m-agents: the cross-workspace agents roll-up", async ({ page }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: "Agents" }).click();
    await expect(page.getByText("1 running · 1 total")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("claude-code")).toBeVisible();
    await shot(page, "m-agents.png");
  });

  test("m-diff: a real read-only file diff", async ({ page }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: "Diff", exact: true }).click();
    await page.getByLabel("Worktree").selectOption({ label: "diff-demo · feat/diff-demo" });
    const fileRow = page.getByRole("button", { name: /greeter\.ts/ });
    await expect(fileRow).toBeVisible({ timeout: 15_000 });
    await fileRow.click();
    await expect(page.getByText(/Hi,/).first()).toBeVisible({ timeout: 15_000 });
    await shot(page, "m-diff.png");
  });

  test("m-terminal: live PTY stream + the touch accessory bar", async ({ page }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: "Terminal" }).click();
    const xterm = page.getByTestId("xterm-host");
    await expect(xterm).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("live", { exact: true })).toBeVisible({ timeout: 20_000 });

    // Drive a deterministic command so the pane shows REAL streamed output. The marker
    // is split across two literals the shell concatenates, so the contiguous marker can
    // only come from the PTY output — never the echoed keystrokes.
    const marker = "GROVEMOBILESHOT";
    const cut = Math.floor(marker.length / 2);
    const a = marker.slice(0, cut);
    const b = marker.slice(cut);
    const cmd = process.platform === "win32" ? `echo ('${a}'+'${b}')` : `echo '${a}''${b}'`;
    await xterm.click();
    await page.keyboard.type(cmd);
    await page.getByRole("button", { name: "Enter" }).click();
    await expect(page.getByTestId("terminal-stream")).toContainText(marker, { timeout: 25_000 });
    await shot(page, "m-terminal.png");
  });

  test("m-dispatch: the dispatch sheet, populated (not submitted)", async ({ page }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: "Dispatch" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    // Populate the "Start agent" form so the shot looks intentional. Do NOT submit —
    // a real dispatch would mutate the shared host's session count.
    await sheet.getByLabel("Worktree").selectOption({ label: "diff-demo · feat/diff-demo" });
    await sheet.getByLabel("Adapter").selectOption("generic");
    await sheet.getByLabel("Command").fill(process.platform === "win32" ? "cmd" : "sh");
    await shot(page, "m-dispatch.png");
  });

  test("m-notifications: the inbox + push opt-in in Settings", async ({ page }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByText("Push notifications", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Enable notifications" })).toBeVisible();
    // The host recorded a real `needs_attention` row on startup; the inbox renders it.
    await expect(
      page.getByText("fix/api-timeout needs your attention", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });
    await page.getByText("Push notifications", { exact: true }).scrollIntoViewIfNeeded();
    await shot(page, "m-notifications.png");
  });
});
