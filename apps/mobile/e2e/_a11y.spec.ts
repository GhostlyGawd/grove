import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Page, expect, test } from "@playwright/test";
import { BASE_URL } from "./host-fixture.ts";
import { pairAndLand } from "./pair-and-land.ts";

/**
 * Phase-4 accessibility audit (spec §6.2, mobile surface). A MEASUREMENT TOOL: it runs
 * an automated `axe-core` (MIT) audit against the real, PAIRED phone shell (workspace
 * list) and an open sheet (workspace detail), measures touch-target sizes on the
 * BottomNav + the terminal accessory bar + primary actions (≥44px), and checks the
 * pairing flow is keyboard/AT-reachable — all at the configured Pixel-5 viewport,
 * against the live host from `global-setup.ts`. Results are recorded to JSON; the
 * honest verdict is authored in `evidence/phase-4/a11y-report.md`.
 *
 * Touch-target + keyboard checks are RECORDED (pass/fail), not hard-asserted, so a real
 * gap is reported rather than aborting the audit; the only hard assertion is that axe ran.
 */

interface AxeNodeRaw {
  readonly target: readonly unknown[];
  readonly html: string;
  readonly failureSummary?: string | null;
}
interface AxeRuleRaw {
  readonly id: string;
  readonly impact: string | null;
  readonly help: string;
  readonly helpUrl: string;
  readonly nodes: readonly AxeNodeRaw[];
}
interface AxeResultsRaw {
  readonly violations: readonly AxeRuleRaw[];
  readonly passes: readonly { readonly id: string }[];
  readonly incomplete: readonly AxeRuleRaw[];
}
interface ViolationView {
  readonly id: string;
  readonly impact: string | null;
  readonly help: string;
  readonly helpUrl: string;
  readonly count: number;
  readonly targets: readonly string[];
}
interface AxeView {
  readonly violations: readonly ViolationView[];
  readonly incomplete: readonly ViolationView[];
  readonly passCount: number;
}

const nodeRequire = createRequire(import.meta.url);
const AXE_PATH = nodeRequire.resolve("axe-core");
const RESULTS_FILE = join(tmpdir(), "grove-mobile-a11y-results.json");
const MIN_TARGET = 44;

function record(key: string, value: unknown): void {
  let store: Record<string, unknown> = {};
  try {
    store = JSON.parse(readFileSync(RESULTS_FILE, "utf8")) as Record<string, unknown>;
  } catch {
    store = {};
  }
  store[key] = value;
  store.meta = {
    platform: process.platform,
    axePath: AXE_PATH,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(RESULTS_FILE, JSON.stringify(store, null, 2), "utf8");
}

/** Inject axe-core source and run it over the given context (or the whole document). */
async function runAxe(page: Page, contextSelector: string | null): Promise<AxeView> {
  await page.addScriptTag({ path: AXE_PATH });
  return page.evaluate(async (selector) => {
    const api = (
      window as unknown as {
        axe: { run: (ctx: Document | Element, opts: object) => Promise<AxeResultsRaw> };
      }
    ).axe;
    const ctx: Document | Element =
      (selector ? document.querySelector(selector) : null) ?? document;
    const res = await api.run(ctx, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
    });
    const view = (rules: readonly AxeRuleRaw[]): ViolationView[] =>
      rules.map((r) => ({
        id: r.id,
        impact: r.impact,
        help: r.help,
        helpUrl: r.helpUrl,
        count: r.nodes.length,
        targets: r.nodes.slice(0, 6).map((n) => n.target.map((t) => String(t)).join(" ")),
      }));
    return {
      violations: view(res.violations),
      incomplete: view(res.incomplete),
      passCount: res.passes.length,
    };
  }, contextSelector);
}

interface TargetView {
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly pass: boolean;
}

/** Measure each element matched by `accessibleNames` and grade it against ≥44px. */
async function measureTargets(page: Page, names: readonly string[]): Promise<TargetView[]> {
  const out: TargetView[] = [];
  for (const label of names) {
    const box = await page.getByRole("button", { name: label, exact: true }).first().boundingBox();
    if (box) {
      out.push({
        label,
        width: Math.round(box.width),
        height: Math.round(box.height),
        pass: box.width >= MIN_TARGET && box.height >= MIN_TARGET,
      });
    }
  }
  return out;
}

test.beforeAll(() => {
  writeFileSync(RESULTS_FILE, "{}", "utf8");
});

test.describe.configure({ mode: "serial" });

test.describe("Phase-4 mobile accessibility audit (§6.2) — real host", () => {
  test("axe-core: paired shell (workspace list)", async ({ page }) => {
    await pairAndLand(page);
    const result = await runAxe(page, null);
    record("shell", result);
    expect(result.passCount + result.violations.length).toBeGreaterThan(0);
  });

  test("axe-core: workspace-detail sheet open", async ({ page }) => {
    await pairAndLand(page);
    await page.getByRole("button", { name: /diff-demo/ }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    // Audit the populated sheet (git status + sessions landed), not a loading frame.
    await expect(sheet.getByText("In sync with main")).toBeVisible({ timeout: 15_000 });
    const scoped = await runAxe(page, "dialog[open]");
    const full = await runAxe(page, null);
    record("detailSheet", { scoped, full });
    expect(scoped.passCount + scoped.violations.length).toBeGreaterThan(0);
  });

  test("touch targets: BottomNav + accessory bar + primary actions (>=44px)", async ({ page }) => {
    await pairAndLand(page);

    // BottomNav — the five primary section tabs, plus the panel-header Dispatch action.
    const nav = await measureTargets(page, [
      "Workspaces",
      "Agents",
      "Terminal",
      "Diff",
      "Settings",
    ]);
    const dispatch = await measureTargets(page, ["Dispatch"]);

    // Accessory bar — open the Terminal so the touch keys mount, then measure them.
    await page.getByRole("button", { name: "Terminal" }).click();
    await expect(page.getByTestId("xterm-host")).toBeVisible({ timeout: 20_000 });
    const accessory = await measureTargets(page, [
      "Control modifier",
      "Escape",
      "Tab",
      "Arrow left",
      "Arrow up",
      "Arrow down",
      "Arrow right",
      "Enter",
    ]);

    const all = [...nav, ...dispatch, ...accessory];
    record("touchTargets", { nav, dispatch, accessory, undersized: all.filter((t) => !t.pass) });
    expect(all.length).toBeGreaterThan(0);
  });

  test("pairing flow is keyboard- and AT-reachable", async ({ browser }) => {
    // A clean (unpaired) context lands on the pairing screen.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/`);
    await expect(page.getByRole("heading", { name: "Pair this phone" })).toBeVisible();

    const checks: Array<{ check: string; pass: boolean; detail?: string }> = [];
    const soft = async (name: string, fn: () => Promise<void>): Promise<void> => {
      try {
        await fn();
        checks.push({ check: name, pass: true });
      } catch (err) {
        checks.push({
          check: name,
          pass: false,
          detail: err instanceof Error ? err.message : String(err),
        });
      }
    };
    const activeName = (): Promise<string> =>
      page.evaluate(() => {
        const el = document.activeElement;
        if (!el) {
          return "";
        }
        return (
          el.getAttribute("aria-label") ??
          (el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent : null) ??
          el.textContent ??
          el.tagName
        ).trim();
      });

    await soft("the pairing code field exposes an accessible label", async () => {
      await expect(page.getByLabel("Pairing code")).toBeVisible();
    });

    await soft("Tab reaches the pairing code input", async () => {
      const input = page.getByLabel("Pairing code");
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        if (await input.evaluate((el) => el === document.activeElement)) {
          return;
        }
      }
      throw new Error(`code input never received focus (last: ${await activeName()})`);
    });

    await soft("Tab then reaches the 'Link this phone' submit button", async () => {
      const button = page.getByRole("button", { name: "Link this phone" });
      for (let i = 0; i < 6; i++) {
        await page.keyboard.press("Tab");
        if (await button.evaluate((el) => el === document.activeElement)) {
          return;
        }
      }
      throw new Error(`submit button never received focus (last: ${await activeName()})`);
    });

    await soft("the form submits a typed code via the keyboard (Enter)", async () => {
      await page.getByLabel("Pairing code").focus();
      await page.keyboard.type("AB");
      // Too-short code: Enter submits the form and surfaces the inline validation error
      // (proving the form is operable by keyboard alone, no pointer required).
      await page.keyboard.press("Enter");
      await expect(page.getByText(/Enter the .*character code/)).toBeVisible({ timeout: 5_000 });
    });

    record("keyboard", checks);
    await context.close();
    expect(checks.length).toBeGreaterThan(0);
  });
});
