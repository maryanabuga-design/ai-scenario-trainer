import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

async function measure(page: Page, selector = "a[data-mini-quiz]:visible") {
  const link = page.locator(selector);
  await expect(link).toBeVisible();
  const image = link.locator("img");
  await expect
    .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await expect(image).toHaveAttribute("src", "/heroes/icon-miniquiz.webp");
  const frame = (await link.locator("[data-picture-frame]").boundingBox())!;
  const text = (await link.locator("[data-mini-quiz-text], [data-todays-text]").first().boundingBox())!;
  const row = (await link.boundingBox())!;
  return { frame, text, row };
}

for (const width of [360, 430]) {
  test.describe(`Mini-quiz picture at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("Home row and the Training Quiz card show the same picture, frame and centring", async ({
      page,
    }) => {
      await page.addInitScript(
        ([p]) => {
          if (!localStorage.getItem("ast.profile.v1"))
            localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        },
        [profile],
      );
      await page.goto("/");
      const home = await measure(page, "[data-todays]:visible");
      await page.getByRole("link", { name: "Choose a topic" }).click();
      await expect(page).toHaveURL(/\/training$/);
      await page.getByRole("radio", { name: "Quiz" }).check({ force: true });
      const training = await measure(page);
      for (const shown of [home, training]) {
        expect([shown.frame.width, shown.frame.height]).toEqual([64, 60]);
        expect(
          Math.abs(shown.frame.y + shown.frame.height / 2 - (shown.text.y + shown.text.height / 2)),
        ).toBeLessThanOrEqual(2);
        // the same gap between the picture and the text
        expect(
          Math.abs(shown.text.x - (shown.frame.x + shown.frame.width) - 12),
        ).toBeLessThanOrEqual(1);
        // the text starts at the same distance from the card's left edge
        expect(shown.frame.x - shown.row.x).toBe(16);
      }
      expect(training.text.x - training.row.x).toBe(home.text.x - home.row.x);
      // Home keeps its 104px row; Training grows only as far as the 60px picture needs
      expect(home.row.height).toBeGreaterThanOrEqual(104);
      expect(training.row.height).toBeLessThanOrEqual(100);
      const scroll = await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      );
      expect(scroll).toBe(true);
    });
  });
}
