import { expect, test } from "@playwright/test";
import { pairAndLand } from "./pair-and-land.ts";

/**
 * Build an `echo` whose OUTPUT contains the marker contiguously while the TYPED text
 * does NOT (the marker is split across two quoted literals the shell concatenates).
 * So the contiguous marker can only appear in the real command output streamed back
 * from the PTY — not as a false positive from the PTY echoing the keystrokes.
 */
function buildEcho(marker: string): string {
  const cut = Math.floor(marker.length / 2);
  const a = marker.slice(0, cut);
  const b = marker.slice(cut);
  return process.platform === "win32" ? `echo ('${a}'+'${b}')` : `echo '${a}''${b}'`;
}

test.describe("Grove PWA — W4 touch terminal (phone viewport, real host PTY)", () => {
  test("opens a terminal and streams real PTY output, sending Enter from the accessory bar", async ({
    page,
  }) => {
    await pairAndLand(page);

    // Switch to the Terminal section — the xterm pane mounts and opens the real
    // `/terminal` WebSocket for the active worktree's shell.
    await page.getByRole("button", { name: "Terminal" }).click();
    const xterm = page.getByTestId("xterm-host");
    await expect(xterm).toBeVisible({ timeout: 20_000 });

    // The TerminalFrame footer flips to "live" once the WS upgrade completes — only
    // then is the PTY ready to receive input.
    await expect(page.getByText("live", { exact: true })).toBeVisible({ timeout: 20_000 });

    // Focus the pane and type a deterministic command, then press Enter from the
    // touch ACCESSORY BAR (proving it sends a real control sequence the PTY acts on).
    const marker = "GROVEMOBILESTREAMOK";
    await xterm.click();
    await page.keyboard.type(buildEcho(marker));
    await page.getByRole("button", { name: "Enter" }).click();

    // The real streamed bytes from the host PTY land in the active terminal buffer.
    await expect(page.getByTestId("terminal-stream")).toContainText(marker, { timeout: 25_000 });

    await page.screenshot({ path: "../../evidence/phase-4/mobile-terminal.png" });
  });

  test("the accessory bar sends real symbol bytes the PTY echoes, and arms Ctrl", async ({
    page,
  }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: "Terminal" }).click();
    await expect(page.getByTestId("xterm-host")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("live", { exact: true })).toBeVisible({ timeout: 20_000 });

    // The sticky Ctrl modifier arms/disarms visibly (the next key would be a chord).
    const ctrl = page.getByRole("button", { name: "Control modifier" });
    await expect(ctrl).toHaveAttribute("aria-pressed", "false");
    await ctrl.click();
    await expect(ctrl).toHaveAttribute("aria-pressed", "true");
    await ctrl.click();
    await expect(ctrl).toHaveAttribute("aria-pressed", "false");

    // Tapping the punctuation keys writes those exact bytes down the WS; the real
    // interactive shell echoes them back, so a sequence the prompt never contains
    // proves the accessory bar drives the live PTY (no keyboard letters involved).
    await page.getByTestId("xterm-host").click();
    for (const name of ["Tilde", "Slash", "Dash"]) {
      await page.getByRole("button", { name, exact: true }).click();
    }
    await expect(page.getByTestId("terminal-stream")).toContainText("~/-", { timeout: 25_000 });
  });
});
