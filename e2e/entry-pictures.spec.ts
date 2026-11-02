import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { emptyBrowser } from "./auth-seed";

const CODE = "482913";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const box = async (loc: ReturnType<Page["locator"]>) => (await loc.first().boundingBox())!;

/** An invited student up to the Profile step. */
async function toProfile(page: Page) {
  await page.goto("/join/QT-A7K2");
  await page.getByLabel("Your email").fill("ana@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
  await expect(page).toHaveURL(/\/set-up-profile$/);
}

for (const width of [360, 430]) {
  test.describe(`Entry pictures at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("Welcome back: the envelope picture, decorative, 112px, left-aligned, under the back row, 16px above the title", async ({
      page,
    }) => {
      await page.goto("/sign-in");
      const img = page.locator("[data-entry-picture]");
      await expect(img).toHaveAttribute("src", "/images/entry/entry-signin.webp");
      await expect(img).toHaveAttribute("alt", "");
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
      const b = await box(img);
      expect([b.width, b.height]).toEqual([112, 112]);
      expect(Math.abs(b.x - 16)).toBeLessThanOrEqual(0.5);
      const title = await box(page.getByRole("heading", { name: "Welcome back", level: 1 }));
      expect(Math.abs(title.x - b.x)).toBeLessThanOrEqual(0.5);
      expect(Math.round(title.y - (b.y + b.height))).toBe(16);
      const back = await box(page.getByRole("link", { name: "Back to Welcome" }));
      expect(b.y).toBeGreaterThan(back.y + back.height);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Your profile: the ID badge picture, one field only, the new subtitle, no language choice", async ({
      page,
    }) => {
      await toProfile(page);
      const img = page.locator("[data-entry-picture]");
      await expect(img).toHaveAttribute("src", "/images/entry/entry-profile.webp");
      await expect(img).toHaveAttribute("alt", "");
      await expect
        .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
      const b = await box(img);
      expect([b.width, b.height]).toEqual([112, 112]);
      const title = await box(page.getByRole("heading", { name: "Your profile", level: 1 }));
      expect(Math.abs(title.x - b.x)).toBeLessThanOrEqual(0.5);
      expect(Math.round(title.y - (b.y + b.height))).toBe(16);
      await expect(
        page.getByText("Add your name so your instructor can recognise you."),
      ).toBeVisible();
      await expect(page.locator("main input")).toHaveCount(1);
      await expect(page.getByLabel("Your name")).toBeVisible();
      await expect(page.getByText(/Language|Ukrainian|English/)).toHaveCount(0);
      await expect(page.getByRole("radio")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("a missing picture leaves no empty space: the title sits one gap under the back row", async ({
      page,
    }) => {
      await page.route("**/images/entry/*.webp", (route) => route.abort());
      await page.goto("/sign-in");
      await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
      await expect(page.locator("[data-entry-picture]")).toHaveCount(0);
      const back = await box(page.getByRole("link", { name: "Back to Welcome" }));
      const title = await box(page.getByRole("heading", { name: "Welcome back", level: 1 }));
      // the 24px gap of the form, nothing more
      expect(Math.round(title.y - (back.y + back.height))).toBe(24);
      await toProfile(page);
      await expect(page.locator("[data-entry-picture]")).toHaveCount(0);
      const heading = await box(page.getByRole("heading", { name: "Your profile", level: 1 }));
      expect(heading.y).toBeLessThan(110);
    });
  });

  test.describe(`Entry pictures on a short phone (${width} x 640)`, () => {
    test.use({ viewport: { width, height: 640 }, storageState: emptyBrowser });

    test("the picture is 88px and the Primary stays in view on both screens", async ({ page }) => {
      await page.goto("/sign-in");
      const img = page.locator("[data-entry-picture]");
      await expect.poll(async () => (await img.boundingBox())?.width).toBe(88);
      const cont = await box(page.getByRole("button", { name: "Continue" }));
      expect(cont.y + cont.height).toBeLessThanOrEqual(640);
      expect(cont.height).toBe(52);
      await toProfile(page);
      await expect.poll(async () => (await img.boundingBox())?.width).toBe(88);
      const next = await box(page.getByRole("button", { name: "Continue" }));
      expect(next.y + next.height).toBeLessThanOrEqual(640);
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });
}
