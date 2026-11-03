import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue } from "./auth-seed";

const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const box = async (loc: ReturnType<Page["locator"]>) => (await loc.boundingBox())!;
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(2);

for (const width of [360, 430]) {
  test.describe(`Empty state spacing at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 }, storageState: instructor });

    test("Content: 16px above the picture, 12px to the title, 6px to the line, 24px to the next block; centred; 140px", async ({
      page,
    }) => {
      await page.goto("/instructor/content");
      const picture = await box(page.locator("[data-empty-picture]"));
      const label = await box(page.getByRole("heading", { name: "YOUR TOPICS" }));
      const title = await box(page.locator("[data-content-empty] [data-empty-title]"));
      const line = await box(page.locator("[data-content-empty] [data-empty-text]"));
      const next = await box(page.locator("[data-course-row]"));
      expect([Math.round(picture.width), Math.round(picture.height)]).toEqual([140, 140]);
      near(picture.y - (label.y + label.height), 16);
      near(title.y - (picture.y + picture.height), 12);
      near(line.y - (title.y + title.height), 6);
      near(next.y - (line.y + line.height), 24);
      // the group is centred and the text is at most 280px wide
      for (const part of [picture, title, line]) near(part.x + part.width / 2, width / 2);
      expect(title.width).toBeLessThanOrEqual(280);
      expect(line.width).toBeLessThanOrEqual(280);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Content fallback (the flat icon version) has the same gaps", async ({ page }) => {
      await page.route("**/images/instructor/content-empty.webp", (route) => route.abort());
      await page.goto("/instructor/content");
      const circle = await box(page.locator("[data-empty-circle]"));
      const label = await box(page.getByRole("heading", { name: "YOUR TOPICS" }));
      const title = await box(page.locator("[data-content-empty] [data-empty-title]"));
      const line = await box(page.locator("[data-content-empty] [data-empty-text]"));
      const next = await box(page.locator("[data-course-row]"));
      expect([Math.round(circle.width), Math.round(circle.height)]).toEqual([140, 140]);
      near(circle.y - (label.y + label.height), 16);
      near(title.y - (circle.y + circle.height), 12);
      near(line.y - (title.y + title.height), 6);
      near(next.y - (line.y + line.height), 24);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Students no results: 12px, 6px and 24px, the picture at 140px", async ({ page }) => {
      await page.goto("/instructor/students");
      await page.getByPlaceholder("Search students").fill("Zimmerman");
      const empty = page.locator('[data-empty="search"]');
      await expect(empty).toBeVisible();
      const art = await box(empty.locator("[data-no-results-art]"));
      const title = await box(empty.locator("[data-empty-title]"));
      const line = await box(empty.locator("[data-empty-text]"));
      const action = await box(empty.locator("[data-empty-action]"));
      expect([Math.round(art.width), Math.round(art.height)]).toEqual([140, 140]);
      near(title.y - (art.y + art.height), 12);
      near(line.y - (title.y + title.height), 6);
      near(action.y - (line.y + line.height), 24);
      expect(title.width).toBeLessThanOrEqual(280);
      expect(line.width).toBeLessThanOrEqual(280);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("nothing else on the Content screen moved: the Import button, the course card and the note keep their sizes", async ({
      page,
    }) => {
      await page.goto("/instructor/content");
      const importLink = await box(page.getByRole("link", { name: "Import content" }));
      expect([Math.round(importLink.height), Math.round(importLink.x)]).toEqual([52, 16]);
      expect(Math.round((await box(page.locator("[data-course-row]"))).height)).toBe(72);
      await expect(page.locator("[data-content-note]")).toContainText(
        "Your topics stay in this browser (prototype).",
      );
    });
  });
}
