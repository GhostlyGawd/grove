import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Page, devices, expect, test } from "@playwright/test";
import { mintPairCode } from "./host-fixture.ts";
import { pairAndLand, readPairFixture } from "./pair-and-land.ts";

/**
 * Phase-4 performance measurement harness (spec §6.4 budgets, mobile surface). A
 * MEASUREMENT TOOL, not a product spec: it drives the real, paired phone shell against
 * the live host booted in `global-setup.ts` (real pairing + tRPC + `/sync` + PTY — no
 * mocks) and records timing distributions. It makes NO budget assertions — PASS/OVER
 * vs the budgets is evaluated honestly in `evidence/phase-4/perf-report.md`. The only
 * assertions are sanity guards that each measurement gathered its full sample set.
 *
 * Numbers land in a machine-readable JSON in the OS temp dir so the report is authored
 * from real data rather than transcribed by hand.
 */

declare global {
  interface Window {
    __coldMs?: number;
    __probe?: { hit: number | null };
  }
}

type Probe =
  | { readonly kind: "dialogOpen" }
  | { readonly kind: "textPresent"; readonly marker: string }
  | { readonly kind: "streamContains"; readonly marker: string };

const RESULTS_FILE = join(tmpdir(), "grove-mobile-perf-results.json");
const STREAM = '[data-testid="terminal-stream"]';

/** Nearest-rank-with-interpolation percentile over a sample set. */
function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    return Number.NaN;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  const loVal = sorted[lo];
  const hiVal = sorted[hi];
  if (loVal === undefined || hiVal === undefined) {
    return loVal ?? hiVal ?? Number.NaN;
  }
  return loVal + (hiVal - loVal) * (rank - lo);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function summarize(samples: readonly number[]) {
  return {
    n: samples.length,
    p50: round1(percentile(samples, 50)),
    p95: round1(percentile(samples, 95)),
    min: round1(Math.min(...samples)),
    max: round1(Math.max(...samples)),
    samples: samples.map(round1),
  };
}

function record(key: string, samples: readonly number[]): void {
  let store: Record<string, unknown> = {};
  try {
    store = JSON.parse(readFileSync(RESULTS_FILE, "utf8")) as Record<string, unknown>;
  } catch {
    store = {};
  }
  store[key] = summarize(samples);
  store.meta = { platform: process.platform, generatedAt: new Date().toISOString() };
  writeFileSync(RESULTS_FILE, JSON.stringify(store, null, 2), "utf8");
}

/** Arm an in-page rAF poller that stamps `performance.now()` the moment the probe's
 *  condition becomes true. Paired with a `start` captured just before the action so the
 *  measured span is action -> visible. (~single-digit ms of Playwright/CDP input
 *  dispatch is included and NOT subtracted — disclosed in the report.) */
async function armProbe(page: Page, probe: Probe): Promise<void> {
  await page.evaluate((p) => {
    window.__probe = { hit: null };
    const mainText = (): string => document.querySelector("main")?.textContent ?? "";
    const text = (sel: string): string => document.querySelector(sel)?.textContent ?? "";
    const done = (): boolean => {
      if (p.kind === "dialogOpen") {
        return Boolean(document.querySelector("dialog[open]"));
      }
      if (p.kind === "textPresent") {
        return mainText().includes(p.marker);
      }
      return text('[data-testid="terminal-stream"]').includes(p.marker);
    };
    const tick = (): void => {
      if (window.__probe && window.__probe.hit === null) {
        if (done()) {
          window.__probe.hit = performance.now();
          return;
        }
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  }, probe);
}

async function awaitProbe(page: Page, timeout: number): Promise<number> {
  await page.waitForFunction(() => window.__probe?.hit != null, undefined, { timeout });
  return page.evaluate(() => window.__probe?.hit ?? Number.NaN);
}

test.beforeAll(() => {
  writeFileSync(RESULTS_FILE, "{}", "utf8");
});

test.describe.configure({ mode: "serial" });

test.describe("Phase-4 mobile performance budgets (§6.4) — real host", () => {
  test("cold start: app boot -> paired live workspace list rendered", async ({ browser }) => {
    test.setTimeout(180_000);
    const { url, token } = readPairFixture();
    // Pair ONCE in a persistent context so the bearer lands in IndexedDB; thereafter
    // every navigation is a returning-user boot (read pairing -> connect -> list) —
    // the realistic installed-PWA cold start. (A first-ever pair additionally pays the
    // one-time redeem round-trip + manual tap; that is pairing latency, not cold start.)
    const context = await browser.newContext({ ...devices["Pixel 5"] });
    const page = await context.newPage();
    const code = await mintPairCode(url, token);
    await page.goto(`${url}/?code=${code}`);
    await page.getByRole("button", { name: "Link this phone" }).click();
    await page.getByText("diff-demo", { exact: true }).waitFor({ timeout: 30_000 });

    // Each fresh document re-runs this poller; it stamps when the list first renders.
    await page.addInitScript(() => {
      const poll = (): void => {
        const main = document.querySelector("main");
        if (main && (main.textContent ?? "").includes("diff-demo")) {
          window.__coldMs = performance.now();
          return;
        }
        requestAnimationFrame(poll);
      };
      requestAnimationFrame(poll);
    });

    const samples: number[] = [];
    const iterations = 10;
    for (let i = 0; i < iterations; i++) {
      await page.goto("/");
      await page.waitForFunction(() => window.__coldMs !== undefined, undefined, {
        timeout: 30_000,
      });
      samples.push(await page.evaluate(() => window.__coldMs ?? Number.NaN));
    }
    await context.close();
    record("coldStart", samples);
    expect(samples.length).toBe(iterations);
  });

  test("interaction latency: switch tab (Workspaces -> Settings)", async ({ page }) => {
    test.setTimeout(120_000);
    await pairAndLand(page);
    const settingsTab = page.getByRole("button", { name: "Settings" });
    const workspacesTab = page.getByRole("button", { name: "Workspaces" });
    const samples: number[] = [];
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
      // "Appearance" is unique to the Settings body (only the active tab is mounted).
      await armProbe(page, { kind: "textPresent", marker: "Appearance" });
      const start = await page.evaluate(() => performance.now());
      await settingsTab.click();
      samples.push((await awaitProbe(page, 5_000)) - start);
      await workspacesTab.click();
      await page.getByText("diff-demo", { exact: true }).waitFor({ timeout: 5_000 });
      await page.waitForTimeout(80);
    }
    record("tabSwitch", samples);
    expect(samples.length).toBe(iterations);
  });

  test("interaction latency: open the workspace-detail sheet", async ({ page }) => {
    test.setTimeout(120_000);
    await pairAndLand(page);
    const row = page.getByRole("button", { name: /diff-demo/ });
    const samples: number[] = [];
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
      await armProbe(page, { kind: "dialogOpen" });
      const start = await page.evaluate(() => performance.now());
      await row.click();
      samples.push((await awaitProbe(page, 5_000)) - start);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector("dialog[open]"), undefined, {
        timeout: 5_000,
      });
      await page.waitForTimeout(120);
    }
    record("sheetOpen", samples);
    expect(samples.length).toBe(iterations);
  });

  test("terminal-stream round-trip: send -> marker in xterm buffer", async ({ page }) => {
    test.setTimeout(180_000);
    await pairAndLand(page);
    await page.getByRole("button", { name: "Terminal" }).click();
    await expect(page.getByTestId("xterm-host")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("live", { exact: true })).toBeVisible({ timeout: 20_000 });

    // OUTPUT contains the marker contiguously; the TYPED text never does (split across
    // two literals the shell concatenates) — so detection times the true command ->
    // output round-trip, not the PTY's input echo.
    const isWindows = process.platform === "win32";
    const buildEcho = (marker: string): string => {
      const cut = Math.floor(marker.length / 2);
      const a = marker.slice(0, cut);
      const b = marker.slice(cut);
      return isWindows ? `echo ('${a}'+'${b}')` : `echo '${a}''${b}'`;
    };

    const xterm = page.getByTestId("xterm-host");
    await xterm.click();

    // Warm up so the interactive shell is live + echoing before we time it (the shell
    // cold-starts slowly; that is a tab-open cost, not stream latency).
    for (let w = 0; w < 2; w++) {
      const marker = `GROVEWARM${w}Z`;
      await page.keyboard.type(buildEcho(marker));
      await page.keyboard.press("Enter");
      await page.waitForFunction(
        (args) => (document.querySelector(args.sel)?.textContent ?? "").includes(args.mk),
        { sel: STREAM, mk: marker },
        { timeout: 30_000 },
      );
      await page.waitForTimeout(250);
    }

    const samples: number[] = [];
    const iterations = 25;
    for (let i = 0; i < iterations; i++) {
      const marker = `GROVEPERF${i}Z`;
      await page.keyboard.type(buildEcho(marker));
      await armProbe(page, { kind: "streamContains", marker });
      const start = await page.evaluate(() => performance.now());
      await page.keyboard.press("Enter");
      samples.push((await awaitProbe(page, 15_000)) - start);
      // Let the prompt return before the next send so inputs never interleave.
      await page.waitForTimeout(200);
    }
    record("terminalStream", samples);
    expect(samples.length).toBe(iterations);
  });
});
