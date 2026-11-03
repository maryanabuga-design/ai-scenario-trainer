import { expect, test } from "@playwright/test";
import { prepare, routes } from "./routes";

/**
 * Pixel baseline of the phone layout (DESIGN.md: Responsive instructor). Every instructor route and a
 * list of student routes at 360 and 430px, with a fixed clock, seeded demo data, reduced motion and
 * animations off. Zero differing pixels are tolerated: run `npm run test:visual`.
 */
for (const width of [360, 430]) {
  test.describe(`visual baseline at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
    for (const route of routes) {
      test(route.name, async ({ page }) => {
        await prepare(page, route.role);
        await route.setup?.(page);
        await page.goto(route.path);
        if (route.ready) await page.locator(route.ready).first().waitFor();
        await route.after?.(page);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(400);
        await expect(page).toHaveScreenshot(`${route.name}-${width}.png`, {
          fullPage: true,
          animations: "disabled",
          caret: "hide",
          threshold: 0,
          maxDiffPixels: 0,
        });
      });
    }
  });
}
