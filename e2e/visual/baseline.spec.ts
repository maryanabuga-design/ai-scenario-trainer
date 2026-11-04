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
        // the invitation link prints the web address: show the same address whatever port runs the test
        await page.evaluate((fixed) => {
          const here = location.origin;
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          for (let node = walker.nextNode(); node; node = walker.nextNode())
            if (node.nodeValue?.includes(here))
              node.nodeValue = node.nodeValue.replaceAll(here, fixed);
          document.querySelectorAll("input").forEach((input) => {
            if (input.value.includes(here)) input.value = input.value.replaceAll(here, fixed);
          });
        }, "http://localhost:3100");
        // pictures (the 3D ones) must have finished loading, also when the machine is busy
        await page.waitForFunction(() =>
          Array.from(document.images).every((image) => image.complete),
        );
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
