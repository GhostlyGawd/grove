import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { CONN_FILE } from "./host-fixture.ts";

interface Conn {
  readonly endpoint: string;
  readonly token: string;
}

function readConn(): Conn {
  return JSON.parse(readFileSync(CONN_FILE, "utf8")) as Conn;
}

test.describe("desktop shell foundation", () => {
  test("mounts the cockpit chrome and shows the connect state with no host", async ({ page }) => {
    await page.goto("/");

    // Shell chrome is present: identity, rail, status bar.
    await expect(page.getByTestId("app-titlebar")).toContainText("Grove");
    await expect(page.getByTestId("workspace-rail")).toBeVisible();
    await expect(page.getByTestId("status-bar")).toBeVisible();

    // With no host reachable, the rail shows a real connect state, not a crash.
    const connect = page.getByTestId("connect-state");
    await expect(connect).toBeVisible();
    await expect(connect.getByText("No host running")).toBeVisible();
    await expect(page.getByTestId("status-bar")).toContainText("No host");

    await page.screenshot({ path: "../../evidence/phase-3/desktop-shell-no-host.png" });
  });

  test("connects to a real host and renders the live workspace list", async ({ page }) => {
    const conn = readConn();
    await page.addInitScript((value) => {
      (window as Window & { __GROVE_HOST__?: Conn }).__GROVE_HOST__ = value;
    }, conn);

    await page.goto("/");

    // Real tRPC workspaces.list round-trip renders the seeded worktrees.
    const rail = page.getByTestId("workspace-rail");
    await expect(rail.getByText("feat/login-rework", { exact: true })).toBeVisible();
    await expect(rail.getByText("fix/api-timeout", { exact: true })).toBeVisible();

    // Status bar reflects the real loopback connection + live sync state.
    const statusBar = page.getByTestId("status-bar");
    await expect(statusBar).toContainText("127.0.0.1");
    await expect(page.getByTestId("sync-state")).toContainText(/live|catching up|connecting/i);

    // Selecting the first worktree drives the content pane header.
    await expect(page.getByTestId("content-pane")).toContainText("feat/login-rework");

    await page.screenshot({ path: "../../evidence/phase-3/desktop-shell-connected.png" });
  });
});
