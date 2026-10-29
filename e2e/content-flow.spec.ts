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
test.use({ storageState: instructor });
test.setTimeout(90_000);

const FIXTURES = "e2e/fixtures/";
const PICTURES = [
  "public/templates/sample-package/exit-sign.png",
  "public/templates/sample-package/assembly-point.png",
];
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);

/** Imports the example document and opens its topic screen. */
async function exampleTopic(page: Page) {
  await page.goto("/instructor/content/import");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page.getByRole("button", { name: "Import and review" }).click();
  await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Open draft", exact: true }).click();
  await expect(page).toHaveURL(/\/instructor\/content\/package\/[a-z0-9]+$/);
  return /package\/([a-z0-9]+)/.exec(page.url())![1];
}

for (const width of [360, 430]) {
  test.describe(`Content flow polish at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("Import: images are compact rows with a thumbnail and a small x, no sentence; the file card is one aligned row", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page.locator("[data-file-input]").setInputFiles(`${FIXTURES}clean.xlsx`);
      await expect(page.locator("[data-image-row]")).toHaveCount(0);
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      const rows = page.locator("[data-image-row]");
      await expect(rows).toHaveCount(2);
      await expect(page.locator("main")).not.toContainText(/images? added/);
      for (const row of await rows.all()) {
        const thumb = (await row.locator("img").boundingBox())!;
        expect([thumb.width, thumb.height]).toEqual([40, 40]);
        const x = (await row.getByRole("button").boundingBox())!;
        expect([x.width, x.height]).toEqual([44, 44]);
        expect((await row.getByRole("button").locator("span").boundingBox())!.width).toBe(32);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
      // remove one with its x
      await rows.first().getByRole("button").click();
      await expect(rows).toHaveCount(1);
      await rows.first().getByRole("button").click();
      await expect(rows).toHaveCount(0);

      // the file card: 12px padding, one row, everything centred, the x 12px from the right edge
      const card = page.locator("[data-file-card]");
      const c = (await card.boundingBox())!;
      const icon = (await card.locator("span").first().boundingBox())!;
      const name = (await card.locator("[data-file-name]").locator("xpath=..").boundingBox())!;
      const xTile = (await card
        .getByRole("button", { name: "Remove file" })
        .locator("span")
        .boundingBox())!;
      expect(Math.round(icon.x - c.x)).toBe(13); // 12px padding + the 1px border
      expect(Math.round(c.x + c.width - (xTile.x + xTile.width))).toBe(13);
      const centre = (b: { y: number; height: number }) => b.y + b.height / 2;
      expect(Math.abs(centre(icon) - centre(c))).toBeLessThanOrEqual(1);
      expect(Math.abs(centre(name) - centre(c))).toBeLessThanOrEqual(1);
      expect(Math.abs(centre(xTile) - centre(c))).toBeLessThanOrEqual(1);
      const radii = await page.evaluate(() => [
        getComputedStyle(document.querySelector("[data-file-card]")!).borderRadius,
      ]);
      expect(radii[0]).toBe("24px");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Open draft opens the topic screen; the new draft is at once in Content, Your topics, with a Draft badge, and opens; a published topic opens too", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      await page.goto("/instructor/content");
      const card = page.locator(`[data-package-card="${id}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator("[data-status-pill]")).toHaveText("Draft");
      await card.click();
      await expect(page).toHaveURL(new RegExp(`/package/${id}$`));
      // publish it: the published card opens as well
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.locator("[data-flash]")).toContainText("Topic published");
      await page.goto("/instructor/content");
      await expect(card.locator("[data-status-pill]")).toHaveText("Published");
      await card.click();
      await expect(page).toHaveURL(new RegExp(`/package/${id}$`));
    });

    test("Preview as student opens the student version of the open tab, shows the white preview card and returns to the same tab, also after a reload", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      const base = `/instructor/content/package/${id}`;
      const cases: [string, RegExp, string][] = [
        ["guide", new RegExp(`${base}/preview\\?from=guide$`), "[data-reading-header]"],
        ["steps", new RegExp(`${base}/preview/steps\\?from=steps$`), "text=Step-by-step guide"],
        ["scenario", new RegExp(`${base}/preview/scenario\\?from=scenario$`), "text=Step 1 of"],
        ["quiz", new RegExp(`${base}/preview/quiz\\?from=quiz$`), "text=Question 1 of"],
      ];
      for (const [tab, url, marker] of cases) {
        await page.goto(`${base}?tab=${tab}`);
        await page.getByRole("button", { name: "Preview as student" }).click();
        await expect(page).toHaveURL(url);
        await expect(page.locator(marker).first()).toBeVisible();
        // the white card, not a dark band
        const bar = page.locator("[data-preview-bar]");
        await expect(bar).toContainText("Previewing as student");
        expect(await bg(bar)).toBe("rgb(255, 255, 255)");
        expect(
          await bar.evaluate((el) => {
            const css = getComputedStyle(el);
            return [css.borderTopWidth, css.borderTopColor, css.borderRadius, css.position];
          }),
        ).toEqual(["1px", "rgb(228, 223, 213)", "14px", "static"]);
        await expect(bar.locator("svg").first()).toBeVisible();
        // the label stays on one line
        expect((await bar.locator("p").boundingBox())!.height).toBeLessThan(30);
        const exit = bar.getByRole("link", { name: "Exit preview" });
        expect((await exit.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        expect(
          await exit.locator("span").evaluate((el) => getComputedStyle(el).textDecorationLine),
        ).toBe("underline");
        expect(await noSidewaysScroll(page)).toBe(true);
        // the card is the first thing in the content
        const first = await page.evaluate(
          () => document.querySelector("main")!.querySelector("[data-preview-bar]") !== null,
        );
        expect(first).toBe(true);
        // a reload keeps the preview and its way back
        await page.reload();
        await expect(page.locator("[data-preview-bar]")).toBeVisible();
        await page
          .locator("[data-preview-bar]")
          .getByRole("link", { name: "Exit preview" })
          .click();
        await expect(page).toHaveURL(new RegExp(`${base}\\?tab=${tab}$`));
      }
      // the back arrow does the same as Exit preview
      await page.goto(`${base}?tab=quiz`);
      await page.getByRole("button", { name: "Preview as student" }).click();
      await expect(page).toHaveURL(/preview\/quiz\?from=quiz$/);
      await page
        .getByRole("button", { name: /Back|Leave|Exit/i })
        .first()
        .click();
      const dialog = page.locator("dialog[open]");
      if (await dialog.count()) await dialog.getByRole("button", { name: /Leave|Exit/i }).click();
      await expect(page).toHaveURL(new RegExp(`${base}\\?tab=quiz$`));
    });

    test("the success Notice: after Save it shows on the screen the person lands on, in a polite live region, closes after 6 seconds, and a new one replaces the old", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      const base = `/instructor/content/package/${id}`;
      await page.goto(`${base}/edit/questions-0`);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${base}\\?tab=quiz$`));
      const flash = page.locator("[data-flash]");
      await expect(flash).toContainText("Changes saved");
      // it is the compact success Notice with a tile and a small x
      await expect(flash.locator('[data-notice="success"]')).toBeVisible();
      await expect(flash.locator("[data-notice-close]")).toBeVisible();
      expect(
        (await flash.getByRole("button", { name: /Close/ }).boundingBox())!.height,
      ).toBeGreaterThanOrEqual(44);
      await expect(page.locator("[data-flash-region]").first()).toHaveAttribute(
        "aria-live",
        "polite",
      );
      // never in the address
      expect(page.url()).not.toContain("saved");
      // only one at a time: publishing replaces it
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.locator("[data-flash]")).toHaveCount(1);
      await expect(page.locator("[data-flash]")).toContainText("Topic published");
      // it closes itself after 6 seconds
      await expect(page.locator("[data-flash]")).toHaveCount(0, { timeout: 8000 });
    });

    test("with reduced motion the Notice stays until its x closes it", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const id = await exampleTopic(page);
      await page.goto(`/instructor/content/package/${id}/edit/questions-0`);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      const flash = page.locator("[data-flash]");
      await expect(flash).toContainText("Changes saved");
      await page.waitForTimeout(7000);
      await expect(flash).toBeVisible();
      await flash.getByRole("button", { name: /Close/ }).click();
      await expect(flash).toHaveCount(0);
    });

    test("the Notice follows the other actions: title and summary, image added and removed, topic deleted", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      const base = `/instructor/content/package/${id}`;
      // title and summary
      await page.goto(`${base}/details`);
      await page.getByLabel("Title").fill("Leaving a hall");
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${base}$`));
      await expect(page.locator("[data-flash]")).toContainText("Title and summary saved");
      // image added and removed on an edit screen
      await page.goto(`${base}/edit/guide-1`);
      await page.locator("[data-image-input]:visible").setInputFiles(PICTURES[0]);
      await expect(page.locator("[data-flash]")).toContainText("Image added");
      await page.getByRole("button", { name: "Remove image" }).click();
      await expect(page.locator("[data-flash]")).toContainText("Image removed");
      await expect(page.locator("[data-flash]")).toHaveCount(1);
      // delete: shown on Content
      await page.goto(base);
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Delete topic" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Delete topic" }).click();
      await expect(page).toHaveURL(/\/instructor\/content$/);
      await expect(page.locator("[data-flash]")).toContainText("Topic deleted");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("quiz question edit: the answers are cards with the radio inside, the whole card selects, the selected card has a 1.5px olive border", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      await page.goto(`/instructor/content/package/${id}/edit/questions-0`);
      const cards = page.locator("[data-answer-card]");
      await expect(cards).toHaveCount(4);
      await expect(page.locator("main").getByText("Check the correct answer")).toBeVisible();
      for (const card of await cards.all()) {
        const c = (await card.boundingBox())!;
        const ring = (await card.locator("span[aria-hidden=true]").last().boundingBox())!;
        expect(ring.x + ring.width).toBeLessThanOrEqual(c.x + c.width);
        expect(ring.x).toBeGreaterThan(c.x + c.width / 2);
        expect(ring.y).toBeGreaterThanOrEqual(c.y);
      }
      const third = page.locator('[data-correct="c"]');
      await third.click({ position: { x: 6, y: 6 } });
      await expect(third.locator("input[type=radio]")).toBeChecked();
      // 1.5px (the screen may round it to whole device pixels, so the class and the colour are checked)
      expect(
        await third.evaluate((el) => [
          el.className.includes("border-[1.5px]"),
          getComputedStyle(el).borderTopColor,
        ]),
      ).toEqual([true, "rgb(63, 70, 56)"]);
      expect(
        await page
          .locator('[data-correct="a"]')
          .evaluate((el) => getComputedStyle(el).borderTopColor),
      ).toBe("rgb(228, 223, 213)");
      // the Guide section list uses the same selected look
      await page.goto(`/instructor/content/package/${id}/edit/steps-0-0`);
      const selected = page
        .locator("fieldset[role=radiogroup] label")
        .filter({ has: page.locator("input:checked") });
      expect(await selected.first().evaluate((el) => el.className.includes("border-[1.5px]"))).toBe(
        true,
      );
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });
}
