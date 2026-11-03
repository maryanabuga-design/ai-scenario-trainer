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

    test("Preview as student opens the student version of the open tab with a small Preview label instead of a banner, and the back arrow returns to the same tab, also after a reload", async ({
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
      const back = (p: Page) =>
        p.getByRole("button", { name: /^(Back|Leave this practice)$/ }).first();
      for (const [tab, url, marker] of cases) {
        await page.goto(`${base}?tab=${tab}`);
        await page.getByRole("button", { name: "Preview as student" }).click();
        await expect(page).toHaveURL(url);
        await expect(page.locator(marker).first()).toBeVisible();
        // no banner and no Exit preview anywhere
        await expect(page.locator("[data-preview-bar]")).toHaveCount(0);
        await expect(page.getByText("Previewing as student")).toHaveCount(0);
        await expect(page.getByText("Exit preview").filter({ visible: true })).toHaveCount(0);
        // ONE small label "Preview": not a button, no focus stop, sand, muted, about 28px high
        const label = page.locator("[data-preview-label]");
        await expect(label).toHaveCount(1);
        await expect(label).toHaveText("Preview");
        await expect(label).toHaveAttribute("aria-label", "Preview mode");
        expect(await label.evaluate((el) => el.tabIndex)).toBe(-1);
        expect(await label.evaluate((el) => el.closest("a, button") === null)).toBe(true);
        const style = await label.evaluate((el) => {
          const css = getComputedStyle(el);
          return [css.backgroundColor, css.color, css.borderRadius, css.fontSize];
        });
        expect(style[0]).toBe("rgb(240, 236, 230)");
        expect(style[1]).toBe("rgb(92, 90, 85)");
        expect(parseFloat(style[3])).toBeGreaterThanOrEqual(12);
        expect(parseFloat(style[3])).toBeLessThanOrEqual(13);
        const l = (await label.boundingBox())!;
        expect(l.height).toBe(28);
        // in the row of the back arrow, aligned right, inside the screen, over nothing
        const b = (await back(page).boundingBox())!;
        expect(Math.abs(l.y + l.height / 2 - (b.y + b.height / 2))).toBeLessThanOrEqual(6);
        expect(l.x).toBeGreaterThan(b.x + b.width);
        expect(l.x + l.width).toBeLessThanOrEqual(width);
        expect(l.x + l.width).toBeGreaterThan(width / 2);
        const overlaps = await page.evaluate(() => {
          const el = document.querySelector("[data-preview-label]")!;
          const box = el.getBoundingClientRect();
          return Array.from(document.querySelectorAll("main button, main a, main h1, main p"))
            .filter((other) => other !== el && !el.contains(other) && other.getClientRects().length)
            .some((other) => {
              const r = other.getBoundingClientRect();
              return (
                r.left < box.right - 1 &&
                r.right > box.left + 1 &&
                r.top < box.bottom - 1 &&
                r.bottom > box.top + 1 &&
                !other.contains(el)
              );
            });
        });
        expect(overlaps, `${tab}: the label overlaps another element`).toBe(false);
        expect(await noSidewaysScroll(page)).toBe(true);
        // the screen starts with its normal header: the first control is the back arrow near the top
        expect(b.y).toBeLessThan(120);
        // a reload keeps the preview and its way back
        await page.reload();
        await expect(page.locator("[data-preview-label]")).toBeVisible();
        await back(page).click();
        const dialog = page.locator("dialog[open]");
        if (await dialog.count()) await dialog.getByRole("button", { name: "Leave" }).click();
        await expect(page).toHaveURL(new RegExp(`${base}\\?tab=${tab}$`));
      }
    });

    test("preview saves no student progress and the real student flow has no Preview label", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      const base = `/instructor/content/package/${id}`;
      const keys = () =>
        page.evaluate(() =>
          Object.keys(localStorage)
            .filter((k) => k !== "ast.demo-topics.v1")
            .sort()
            .join("|"),
        );
      const before = await keys();
      await page.goto(`${base}/preview/quiz?from=quiz`);
      await page.getByText("Find the two nearest exits", { exact: true }).click();
      await page.getByRole("button", { name: "Check", exact: true }).click();
      expect(await keys()).toBe(before);
      // published: the student's own screen has no label
      await page.goto(base);
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
      await page.evaluate((v) => localStorage.setItem("ast.auth.v1", v), authValue("student"));
      await page.goto(`/materials/package/${id}`);
      await expect(page.locator("[data-reading-header]")).toBeVisible();
      await expect(page.locator("[data-preview-label]")).toHaveCount(0);
    });

    test("the confirmation: a light 56px card with a check and one line, no close button, floating over the header without moving the content, gone by itself after about 4 seconds, a new one replaces the old", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      const base = `/instructor/content/package/${id}`;
      await page.goto(`${base}/edit/questions-0`);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${base}\\?tab=quiz$`));
      const flash = page.locator("[data-flash]");
      await expect(flash).toContainText("Changes saved");
      await expect(flash).toHaveAttribute("data-flash-state", "on");
      // no close button, no x
      await expect(flash.getByRole("button")).toHaveCount(0);
      await expect(flash.locator("[data-notice-close]")).toHaveCount(0);
      // look: the soft success tint, a darker green border, a 56px card, a check tile
      const card = flash.locator("div").first();
      expect(
        await card.evaluate((el) => {
          const css = getComputedStyle(el);
          return [css.backgroundColor, css.borderTopColor, css.borderRadius, css.height];
        }),
      ).toEqual(["rgb(237, 242, 233)", "rgb(200, 216, 190)", "14px", "56px"]);
      // the icon and the text sit on the same centre line
      const tile = (await flash.locator("span").first().boundingBox())!;
      const text = (await flash.locator("p").boundingBox())!;
      expect(Math.abs(tile.y + tile.height / 2 - (text.y + text.height / 2))).toBeLessThanOrEqual(
        1,
      );
      // it floats: fixed, 16px side margins inside the phone column, over the header
      const box = (await flash.boundingBox())!;
      expect(await flash.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
      expect(box.x).toBeGreaterThanOrEqual(16 - 1);
      expect(box.x + box.width).toBeLessThanOrEqual(width - 16 + 1);
      // 8px under the back button when the screen has one, otherwise 12px from the top
      const back = page.locator("[data-back-button]:visible");
      const backBox = (await back.count()) > 0 ? await back.first().boundingBox() : null;
      expect(Math.round(box.y)).toBe(backBox ? Math.round(backBox.y + backBox.height + 8) : 12);
      // it is a polite live region and never in the address
      await expect(page.locator("[data-flash-region]").first()).toHaveAttribute("role", "status");
      await expect(page.locator("[data-flash-region]").first()).toHaveAttribute(
        "aria-live",
        "polite",
      );
      expect(page.url()).not.toContain("saved");
      // the content does not move when it shows or hides
      const topOf = () =>
        page
          .locator("[data-package-status]")
          .first()
          .evaluate((el) => el.getBoundingClientRect().y);
      const shown = await topOf();
      await expect(flash).toHaveCount(0, { timeout: 7000 });
      expect(await topOf()).toBe(shown);
      // a new one replaces the old one: publishing shows its own message, one at a time
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.locator("[data-flash]")).toHaveCount(1);
      await expect(page.locator("[data-flash]")).toContainText("Topic published");
      await expect(page.locator("[data-flash]")).toHaveCount(0, { timeout: 7000 });
    });

    test("with reduced motion there is no fade and the confirmation still goes by itself after about 4 seconds", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const id = await exampleTopic(page);
      await page.goto(`/instructor/content/package/${id}/edit/questions-0`);
      await page.getByRole("button", { name: "Save", exact: true }).click();
      const flash = page.locator("[data-flash]");
      await expect(flash).toContainText("Changes saved");
      const duration = await flash.evaluate((el) => getComputedStyle(el).transitionDuration);
      expect(parseFloat(duration)).toBeLessThan(0.001);
      await page.waitForTimeout(2500);
      await expect(flash).toBeVisible();
      await expect(flash).toHaveCount(0, { timeout: 5000 });
    });

    test("Publish keeps the person on the topic screen, now Published: badge, no pencils, Preview as student over Unpublish, no 'All items checked' notice; Unpublish returns to Draft with its own confirmation", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      const base = `/instructor/content/package/${id}`;
      await expect(page.locator("#package-status")).toContainText("All items checked");
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${base}$`));
      await expect(page.locator("[data-flash]")).toContainText("Topic published");
      await expect(page.locator("[data-status-pill]")).toHaveText("Published");
      await expect(page.locator("[data-pencil]")).toHaveCount(0);
      // the draft notice is gone as soon as the topic is published, and stays gone
      await expect(page.locator("#package-status")).toHaveCount(0);
      await page.reload();
      await expect(page.locator("[data-status-pill]")).toHaveText("Published");
      await expect(page.locator("#package-status")).toHaveCount(0);
      const preview = page.getByRole("button", { name: "Preview as student" });
      const unpublish = page.getByRole("button", { name: "Unpublish" });
      expect(await bg(preview)).toBe("rgb(63, 70, 56)");
      expect(await bg(unpublish)).toBe("rgb(224, 230, 214)");
      expect((await preview.boundingBox())!.y).toBeLessThan((await unpublish.boundingBox())!.y);
      // Unpublish: back to Draft, "Topic unpublished", and the draft notice returns because it is true again
      await unpublish.click();
      await page.getByRole("dialog").getByRole("button", { name: "Unpublish" }).click();
      await expect(page.locator("[data-flash]")).toContainText("Topic unpublished");
      await expect(page.locator("[data-status-pill]")).toHaveText("Draft");
      await expect(page.locator("#package-status")).toContainText("All items checked");
      await expect(page.locator("[data-pencil]").first()).toBeVisible();
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

    test("quiz question edit: answers and the Guide section list are one card pattern; the letter is plain text, the text is a borderless field, the radio selects", async ({
      page,
    }) => {
      const id = await exampleTopic(page);
      await page.goto(`/instructor/content/package/${id}/edit/questions-0`);
      const cards = page.locator("[data-answer-card]");
      await expect(cards).toHaveCount(4);
      await expect(page.locator("main").getByText("Check the correct answer")).toBeVisible();
      for (const [i, card] of (await cards.all()).entries()) {
        const c = (await card.boundingBox())!;
        // one card: 64px high, the card radius, the radio inside on the right in a 44px tap area
        expect(c.height).toBe(64);
        const area = (await card.locator("[data-radio-area]").boundingBox())!;
        expect([area.width, area.height]).toEqual([44, 44]);
        expect(area.x + area.width).toBeLessThanOrEqual(c.x + c.width);
        expect(area.x).toBeGreaterThan(c.x + c.width / 2);
        // the letter is plain text at the start of the line, no badge or circle
        await expect(card.getByText(`${"ABCD"[i]}.`, { exact: true })).toBeVisible();
        expect(
          await card.getByText(`${"ABCD"[i]}.`, { exact: true }).evaluate((el) => {
            const css = getComputedStyle(el);
            return [css.backgroundColor, css.borderTopWidth];
          }),
        ).toEqual(["rgba(0, 0, 0, 0)", "0px"]);
        // the text is a borderless field with no background and no inner rectangle
        const field = card.locator("input:not([type=radio])");
        expect(
          await field.evaluate((el) => {
            const css = getComputedStyle(el);
            return [css.borderTopWidth, css.backgroundColor, css.outlineStyle];
          }),
        ).toEqual(["0px", "rgba(0, 0, 0, 0)", "none"]);
      }
      // tapping the text edits it and does not select the card
      const first = page.locator('[data-correct="a"]');
      await first.locator("input:not([type=radio])").click();
      await expect(first.locator("input[type=radio]")).not.toBeChecked();
      // and the card shows the focus ring while the text is focused
      expect(await first.evaluate((el) => el.matches(":has(:focus-visible)"))).toBe(true);
      expect(await first.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe("none");
      // tapping the radio selects it
      const third = page.locator('[data-correct="c"]');
      await third.locator("[data-radio-area]").click();
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
      // the same card as an answer: 64px high, the same radius, the radio inside on the right
      const guideCard = (await selected.first().boundingBox())!;
      expect(guideCard.height).toBe(64);
      expect(
        await selected.first().evaluate((el) => getComputedStyle(el).borderTopLeftRadius),
      ).toBe("24px");
      await expect(selected.first().locator("[data-radio-area]")).toHaveCount(1);
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });
}
