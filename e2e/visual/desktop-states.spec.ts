import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { prepare, routes } from "./routes";

/** Hover, focus, disabled and motion on the desktop layer, and text and page zoom (DESIGN.md: Responsive instructor, step 7). */
const start = async (page: Page, width: number, path: string, ready?: string) => {
  await page.setViewportSize({ width, height: 900 });
  await prepare(page, "instructor");
  await page.goto(path);
  await page
    .locator(ready ?? "main h1")
    .first()
    .waitFor();
  await page.waitForTimeout(300);
};
test.describe("hover states", () => {
  test.use({ reducedMotion: "reduce" });

  test("a card that is a link: border and soft shadow, pointer cursor", async ({ page }) => {
    await start(page, 1280, "/instructor/exams", "[data-exam-card]");
    const card = page.locator("[data-exam-card]").first();
    const shadow = await card.evaluate((el) => getComputedStyle(el).boxShadow);
    await card.hover();
    await expect(card).toHaveCSS("border-top-color", "rgb(201, 211, 184)");
    await expect(card).toHaveCSS("cursor", "pointer");
    expect(await card.evaluate((el) => getComputedStyle(el).boxShadow)).not.toBe(shadow);
  });

  test("a table row and a side navigation item: the sand fill", async ({ page }) => {
    await start(page, 1280, "/instructor/students", "[data-students-table]");
    const row = page.locator("[data-table-row]").first();
    await row.hover();
    await expect(row).toHaveCSS("background-color", "rgb(246, 244, 240)");
    expect(await row.locator("a").evaluate((el) => getComputedStyle(el).cursor)).toBe("pointer");
    const exams = page.locator("[data-side-nav] nav a", { hasText: "Exams" });
    await exams.hover();
    await expect(exams).toHaveCSS("background-color", "rgb(239, 236, 230)");
  });

  test("a tab: the sand fill on hover", async ({ page }) => {
    await start(page, 1280, "/instructor/content/built-in/S1", "[data-tab-bar]");
    const tab = page.getByRole("tab").nth(1);
    await tab.hover();
    await expect(tab).toHaveCSS("background-color", "rgb(240, 236, 230)");
  });

  test("buttons use their pressed colours on hover, a disabled one does not change", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/exams", "[data-exam-card]");
    const primary = page.locator("[data-header-slot]").getByRole("link", { name: "Assign exam" });
    const plain = await primary.evaluate((el) => getComputedStyle(el).backgroundColor);
    await primary.hover();
    await expect
      .poll(() => primary.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(plain);
    expect(await primary.evaluate((el) => getComputedStyle(el).cursor)).toBe("pointer");
    await start(page, 1280, "/instructor/exams/new");
    const disabled = page
      .locator("[data-card-footer]")
      .getByRole("button", { name: "Assign exam" });
    await expect(disabled).toBeDisabled();
    await page.waitForTimeout(300);
    const off = await disabled.evaluate((el) => getComputedStyle(el).backgroundColor);
    await disabled.hover({ force: true });
    await page.waitForTimeout(300);
    expect(await disabled.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(off);
    expect(await disabled.evaluate((el) => getComputedStyle(el).cursor)).toBe("not-allowed");
  });
});

test.describe("motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("with reduced motion nothing animates: dropdown, tabs, closed-exams toggle, footer", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/students", "[data-students-table]");
    const durations = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll(
          "[data-filter-button-desk], [data-table-row], [data-side-nav] a, button, a",
        ),
      ).map((el) => parseFloat(getComputedStyle(el).transitionDuration)),
    );
    expect(Math.max(...durations)).toBeLessThanOrEqual(0.001);
    await start(page, 1280, "/instructor/content/built-in/S1", "[data-tab-bar]");
    const tab = await page
      .getByRole("tab")
      .first()
      .evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(parseFloat(tab)).toBeLessThanOrEqual(0.001);
  });
});

test.describe("zoom", () => {
  const instructor = routes.filter(
    (route) =>
      route.role === "instructor" &&
      [
        "instructor-overview",
        "instructor-students",
        "instructor-exam-active",
        "instructor-content-with-topic",
      ].includes(route.name),
  );
  // 200% on 1280 is a 640px window, 150% on 1440 is 960px, 125% on 1440 is 1152px
  for (const width of [640, 960, 1152]) {
    for (const route of instructor) {
      test(`${route.name} at an effective ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await prepare(page, route.role);
        await route.setup?.(page);
        await page.goto(route.path);
        if (route.ready) await page.locator(route.ready).first().waitFor();
        await route.after?.(page);
        await page.waitForTimeout(300);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(over).toBe(false);
      });
    }
  }

  test("text-only enlargement keeps the side navigation labels whole", async ({ page }) => {
    await start(page, 1280, "/instructor/students", "[data-students-table]");
    await page.addStyleTag({ content: "html { font-size: 22px !important; }" });
    await page.waitForTimeout(300);
    const clipped = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("[data-side-nav] a, [data-side-nav] p"))
        .filter(
          (el) =>
            el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).textOverflow !== "ellipsis",
        )
        .map((el) => el.innerText),
    );
    expect(clipped).toEqual([]);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(over).toBe(false);
  });
});
