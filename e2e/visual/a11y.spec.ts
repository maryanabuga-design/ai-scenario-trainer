import { readFileSync, writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { prepare, routes } from "./routes";

/**
 * The accessibility audit (axe-core) of every instructor route at 1280px and 430px, and of the open
 * states, plus the checks that a screen with a phone copy and a desktop copy has only one in the
 * accessibility tree (DESIGN.md: Responsive instructor, step 7).
 */
test.use({ reducedMotion: "reduce" });
test.setTimeout(60_000);

const axeSource = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

type Found = { id: string; impact: string; nodes: number; first: string };
const all: Found[] = [];
async function audit(page: Page): Promise<Found[]> {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    // @ts-expect-error axe is added by the script above
    const out = await window.axe.run(document, { resultTypes: ["violations"] });
    return out.violations.map(
      (v: { id: string; impact: string; nodes: { target: unknown[] }[] }) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.length,
        first: String(v.nodes[0]?.target?.[0] ?? ""),
      }),
    );
  });
  all.push(...result);
  return result.filter((v: Found) => v.impact === "serious" || v.impact === "critical");
}

const instructorRoutes = routes.filter((route) => route.role === "instructor");
const report: Record<string, Found[]> = {};

for (const width of [1280, 430]) {
  test.describe(`axe at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const route of instructorRoutes) {
      test(route.name, async ({ page }) => {
        await prepare(page, route.role);
        await route.setup?.(page);
        await page.goto(route.path);
        if (route.ready) await page.locator(route.ready).first().waitFor();
        await route.after?.(page);
        await page.waitForTimeout(400);
        const found = await audit(page);
        report[`${route.name}@${width}`] = found;
        writeFileSync("/tmp/axe-report.json", JSON.stringify(report, null, 1));
        writeFileSync("/tmp/axe-all.json", JSON.stringify(all, null, 1));
        expect(found, JSON.stringify(found)).toEqual([]);
      });
    }
  });
}

test("the audit itself finds a missing image description (sanity check)", async ({ page }) => {
  await prepare(page, "instructor");
  await page.goto("/instructor");
  await page.locator("[data-weakest-topic]").waitFor();
  await page.evaluate(() => {
    const img = document.createElement("img");
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
    document.querySelector("main")!.appendChild(img);
  });
  const found = await audit(page);
  expect(found.map((f) => f.id)).toContain("image-alt");
});

/** What a screen reader and the keyboard get: visible headings, ids, landmarks and the title. */
async function structure(page: Page) {
  return page.evaluate(() => {
    const shown = (el: Element) => el.getClientRects().length > 0;
    const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
    const dupIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    const headings = Array.from(document.querySelectorAll("h1")).filter(shown);
    const mains = Array.from(document.querySelectorAll("main")).filter(shown);
    const navs = Array.from(document.querySelectorAll("nav")).filter(shown);
    const banners = Array.from(document.querySelectorAll("header")).filter(
      (el) => shown(el) && !el.closest("main, section, article, aside, nav"),
    );
    const dupHeadings = Array.from(document.querySelectorAll("h1, h2, h3")).filter(shown);
    const texts = dupHeadings.map((el) => (el as HTMLElement).innerText.trim());
    return {
      dupIds: Array.from(new Set(dupIds)),
      h1: headings.length,
      mains: mains.length,
      navs: navs.map((el) => el.getAttribute("aria-label")),
      banners: banners.length,
      headingsRepeated: texts.filter((t, i) => t !== "" && texts.indexOf(t) !== i),
      title: document.title,
    };
  });
}

for (const width of [1280, 430]) {
  test.describe(`structure at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const route of instructorRoutes) {
      test(route.name, async ({ page }) => {
        await prepare(page, route.role);
        await route.setup?.(page);
        await page.goto(route.path);
        if (route.ready) await page.locator(route.ready).first().waitFor();
        await route.after?.(page);
        await page.waitForTimeout(500);
        const s = await structure(page);
        expect(s.dupIds, "duplicate ids").toEqual([]);
        expect(s.h1, "visible h1").toBe(1);
        expect(s.mains, "visible main").toBe(1);
        expect(s.headingsRepeated, "repeated visible headings").toEqual([]);
        expect(s.title).toMatch(/ · AI Scenario Trainer$/);
        if (width === 1280) {
          expect(s.navs).toEqual(["Instructor"]);
          expect(s.banners).toBe(1);
        } else {
          expect(s.navs.length).toBeLessThanOrEqual(1);
          expect(s.banners).toBe(0);
        }
      });
    }
  });
}

test("the skip link is first in the tab order and the active item has aria-current", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto("/instructor/students");
  await page.locator("[data-students-table]").waitFor();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  await expect(page.locator('[data-side-nav] nav a[aria-current="page"]')).toHaveText("Students");
});

test.describe("axe on the open states at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("the status filter dropdown", async ({ page }) => {
    await prepare(page, "instructor");
    await page.goto("/instructor/students");
    await page.locator("[data-students-table]").waitFor();
    await page.locator("[data-filter-button-desk]").click();
    await page.locator("[data-status-options]").waitFor();
    expect(await audit(page)).toEqual([]);
  });

  test("a confirm dialog", async ({ page }) => {
    await prepare(page, "instructor");
    await page.goto("/instructor/exams/seed-active");
    await page.locator("[data-tried]").waitFor();
    await page.locator("[data-header-slot]").getByRole("button", { name: "Send reminder" }).click();
    await page.getByRole("dialog").waitFor();
    expect(await audit(page)).toEqual([]);
  });

  test("the Assign exam card with its discard dialog", async ({ page }) => {
    await prepare(page, "instructor");
    await page.goto("/instructor/exams/new");
    await page.getByLabel("Exam title").fill("Axe check");
    expect(await audit(page)).toEqual([]);
    await page.locator("[data-card-footer]").getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("dialog").waitFor();
    expect(await audit(page)).toEqual([]);
  });

  test("the preview frame", async ({ page }) => {
    await prepare(page, "instructor");
    await page.goto("/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await page.getByRole("button", { name: /^Import/ }).click();
    await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 20_000 });
    await page.getByRole("button", { name: "Open draft" }).click();
    await page.locator("[data-tab-bar]").waitFor();
    await page.goto(page.url().replace(/\?.*$/, "") + "/preview/quiz");
    await page.locator("[data-phone-frame]").waitFor();
    await page.waitForTimeout(500);
    expect(await audit(page)).toEqual([]);
  });
});
