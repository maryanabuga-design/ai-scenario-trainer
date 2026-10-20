import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { emptyBrowser, newAccount } from "./auth-seed";

const viewports = [
  { name: "360 x 800", width: 360, height: 800 },
  { name: "430 x 932", width: 430, height: 932 },
  { name: "360 x 640", width: 360, height: 640 },
] as const;

type Box = { x: number; y: number; width: number; height: number };
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const box = async (page: Page, selector: string) =>
  (await page.locator(selector).first().boundingBox()) as Box;

/** No panel: nothing on the screen has the old card colour, a border or a 32px bottom radius. */
async function checkNoPanel(page: Page) {
  const found = await page.evaluate(() => {
    const bad: string[] = [];
    for (const el of document.querySelectorAll("main *")) {
      const css = getComputedStyle(el);
      if (css.backgroundColor === "rgb(240, 236, 230)") bad.push(`${el.tagName} sand`);
      if (css.borderBottomLeftRadius === "32px" || css.borderBottomRightRadius === "32px")
        bad.push(`${el.tagName} radius`);
      if (parseFloat(css.borderBottomWidth) > 0 && !(el instanceof HTMLAnchorElement))
        bad.push(`${el.tagName} border`);
    }
    return bad;
  });
  expect(found).toEqual([]);
  await expect(page.locator("[data-hero-panel]")).toHaveCount(0);
  // the centre group itself is transparent
  const centre = await page
    .locator("[data-centre]")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(centre).toBe("rgba(0, 0, 0, 0)");
}

/** Centre group centred in the free space between the top row and the bottom block (4px), and the
 * picture and the text centred on the column (2px). */
async function checkCentred(page: Page, width: number, textSelector: string) {
  const top = await box(page, "[data-top-row]");
  const bottom = await box(page, "[data-bottom]");
  const image = await box(page, "[data-centre] [data-picture-frame]");
  const text = await box(page, textSelector);
  const groupMid = (image.y + text.y + text.height) / 2;
  const freeMid = (top.y + top.height + bottom.y) / 2;
  expect(Math.abs(groupMid - freeMid)).toBeLessThanOrEqual(4);
  expect(Math.abs(image.x + image.width / 2 - width / 2)).toBeLessThanOrEqual(2);
  expect(Math.abs(text.x + text.width / 2 - width / 2)).toBeLessThanOrEqual(2);
  // 24px between the picture and the text, nothing overlaps
  expect(Math.abs(text.y - (image.y + image.height) - 24)).toBeLessThanOrEqual(1);
  expect(image.y).toBeGreaterThanOrEqual(top.y + top.height - 0.5);
  expect(text.y + text.height).toBeLessThanOrEqual(bottom.y + 0.5);
  expect(await noSidewaysScroll(page)).toBe(true);
}

async function checkFrame(page: Page, height: number) {
  const image = await box(page, "[data-centre] [data-picture-frame]");
  const expected = Math.max(200, Math.min(280, 0.35 * height));
  expect(Math.abs(image.width - expected)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(image.height - expected)).toBeLessThanOrEqual(0.5);
  if (height >= 800) expect([image.width, image.height]).toEqual([280, 280]);
  else expect(image.width).toBeGreaterThanOrEqual(200);
}

for (const viewport of viewports) {
  const { width, height } = viewport;

  test.describe(`Welcome layout at ${viewport.name}`, () => {
    test.use({ viewport: { width, height }, storageState: emptyBrowser });

    test("no panel, the picture and the text centred, the frame size, the buttons pinned", async ({
      page,
    }) => {
      await page.goto("/welcome");
      await expect(page.locator("[data-centre] img")).toBeVisible();
      await page.waitForTimeout(300);
      await checkNoPanel(page);
      await checkFrame(page, height);
      // the text block (eyebrow, title, subtitle) is one block under the picture
      await checkCentred(page, width, "[data-eyebrow] >> xpath=..");
      const create = await box(page, "a:has-text('Create account')");
      const bottom = await box(page, "[data-bottom]");
      expect(create.y).toBeGreaterThanOrEqual(bottom.y - 0.5);
      // the top row is an empty spacer, 44px high
      const top = await box(page, "[data-top-row]");
      expect(top.height).toBe(44);
      await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
    });
  });

  for (const role of ["student", "instructor"] as const) {
    test.describe(`Onboarding layout (${role}) at ${viewport.name}`, () => {
      test.use({ viewport: { width, height }, storageState: newAccount(role) });

      test("no panel, centred, and the picture and the title at the same place on all three slides", async ({
        page,
      }) => {
        await page.goto("/onboarding");
        const imageY: number[] = [];
        const titleY: number[] = [];
        for (const index of [0, 1, 2]) {
          if (index > 0) await page.getByRole("button", { name: "Next" }).click();
          await page.waitForTimeout(450);
          await checkNoPanel(page);
          await checkFrame(page, height);
          await checkCentred(page, width, "[data-slide]");
          imageY.push((await box(page, "[data-centre] [data-picture-frame]")).y);
          titleY.push((await box(page, "[data-slide] h1")).y);
          const top = await box(page, "[data-top-row]");
          expect(top.height).toBe(44);
          const skip = page.getByRole("button", { name: "Skip" });
          if (index < 2) {
            const s = (await skip.boundingBox()) as Box;
            expect(s.height).toBeGreaterThanOrEqual(44);
            expect(s.y).toBeGreaterThanOrEqual(top.y - 0.5);
            expect(s.y + s.height).toBeLessThanOrEqual(top.y + top.height + 0.5);
          } else {
            await expect(skip).toHaveCount(0);
          }
        }
        for (const y of imageY) expect(Math.abs(y - imageY[0])).toBeLessThanOrEqual(1);
        for (const y of titleY) expect(Math.abs(y - titleY[0])).toBeLessThanOrEqual(1);
      });
    });
  }
}
