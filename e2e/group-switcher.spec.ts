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
const CARD = "rgb(255, 255, 255)";
const NEUTRAL_TILE = "rgb(226, 222, 214)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const pill = (page: Page) => page.locator("[data-group-pill]:visible");
const list = (page: Page) => page.locator("[data-group-list]");
const option = (page: Page, text: string) => page.locator("[data-group-option]", { hasText: text });

for (const width of [360, 430]) {
  test.describe(`Group switcher at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("closed: a button with a neutral group icon, no green dot; open: a list under the pill that stays on the screen", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const button = pill(page);
      await expect(button).toHaveAttribute("aria-haspopup", "listbox");
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(button.locator("svg.lucide-users-round")).toHaveCount(1);
      expect(
        await button
          .locator("[data-icon-tile]")
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe(NEUTRAL_TILE);
      await expect(list(page)).toHaveCount(0);

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(list(page)).toBeVisible();
      await expect(list(page)).toHaveAttribute("role", "listbox");
      await expect(page.locator("[data-group-option]")).toHaveCount(3);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      // under the pill, left-aligned with it, white, radius 16, inside the screen minus 16px
      const p = (await button.boundingBox())!;
      const l = (await list(page).boundingBox())!;
      expect(l.y).toBeGreaterThanOrEqual(p.y + p.height - 1);
      expect(Math.abs(l.x - p.x)).toBeLessThanOrEqual(1);
      expect(l.x).toBeGreaterThanOrEqual(16);
      expect(l.x + l.width).toBeLessThanOrEqual(width - 16 + 0.5);
      expect(l.width).toBeLessThanOrEqual(320.5);
      expect(l.width).toBeGreaterThanOrEqual(p.width - 1);
      expect(await list(page).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(CARD);
      expect(await list(page).evaluate((el) => getComputedStyle(el).borderRadius)).toBe("16px");
      // rows at least 56px, counts and status words, a check on the current group, All groups last
      for (const row of await page.locator("[data-group-option]").all()) {
        expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(56);
      }
      await expect(option(page, "Rescue team")).toContainText("15 students · Almost ready");
      await expect(option(page, "Military training")).toContainText(
        "12 students · Needs attention",
      );
      await expect(option(page, "All groups")).toContainText("One card per group");
      await expect(option(page, "Rescue team")).toHaveAttribute("aria-selected", "true");
      await expect(option(page, "Rescue team").locator("svg.lucide-check")).toHaveCount(1);
      await expect(page.locator("[data-group-option]").last()).toContainText("All groups");
      expect(await list(page).innerText()).not.toContain("%");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("closes on a second tap, a tap outside and Escape (focus returns to the pill); a row switches at once", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await pill(page).click();
      await pill(page).click();
      await expect(list(page)).toHaveCount(0);
      await pill(page).click();
      await page.getByRole("heading", { level: 1 }).click();
      await expect(list(page)).toHaveCount(0);
      await expect(pill(page)).toHaveAttribute("aria-expanded", "false");
      await pill(page).click();
      await page.keyboard.press("Escape");
      await expect(list(page)).toHaveCount(0);
      await expect(pill(page)).toBeFocused();
      // a row: the numbers and the pill label change, the list closes
      await pill(page).click();
      await option(page, "Military training").click();
      await expect(list(page)).toHaveCount(0);
      await expect(pill(page)).toContainText("Military training");
      await expect(page.locator("[data-subtitle]")).toHaveText(
        "Here is how Military training is doing.",
      );
      await expect(page.locator("[data-group-line]")).toHaveText(
        "Military training · 12 students · 1 not started",
      );
      await page.reload();
      await expect(pill(page)).toContainText("Military training");
    });

    test("the keyboard moves through the rows: ArrowDown opens, Arrow keys move, Enter selects, Escape closes", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await pill(page).focus();
      await page.keyboard.press("ArrowDown");
      await expect(list(page)).toBeVisible();
      await expect(list(page)).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("ArrowUp");
      await page.keyboard.press("Enter");
      await expect(list(page)).toHaveCount(0);
      await expect(pill(page)).toBeFocused();
      await expect(pill(page)).toContainText("Military training");
      await pill(page).press("ArrowDown");
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await expect(pill(page)).toContainText("All groups");
      await pill(page).press("ArrowDown");
      await page.keyboard.press("Escape");
      await expect(pill(page)).toBeFocused();
      await expect(pill(page)).toContainText("All groups");
    });

    test("the trend line: up for Rescue team, down for Military training, none in All groups", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(page.locator("[data-trend]")).toHaveText("↑ Up from 66% last week");
      await pill(page).click();
      await option(page, "Military training").click();
      await expect(page.locator("[data-trend]")).toHaveText("↓ Down from 62% last week");
      await pill(page).click();
      await option(page, "All groups").click();
      await expect(page.locator("[data-trend]")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Students has the same dropdown in its band, inside the screen, and switching keeps the Topics view", async ({
      page,
    }) => {
      await page.goto("/instructor/students?view=topics");
      await pill(page).click();
      const l = (await list(page).boundingBox())!;
      expect(l.x).toBeGreaterThanOrEqual(15.5);
      expect(l.x + l.width).toBeLessThanOrEqual(width - 16 + 0.5);
      expect(await noSidewaysScroll(page)).toBe(true);
      await option(page, "Military training").click();
      await expect(page).toHaveURL(/\/instructor\/students\?view=topics$/);
      await expect(pill(page)).toContainText("Military training");
      await expect(page.locator("[data-topic-card]")).toHaveCount(10);
    });

    test("'All topics' sits in the Weakest topic header row and opens Students, Topics, for the current group", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const heading = page.getByRole("heading", { name: "WEAKEST TOPIC" });
      const all = page.getByRole("link", { name: "All topics" });
      const h = (await heading.boundingBox())!;
      const a = (await all.boundingBox())!;
      expect(Math.abs(h.y + h.height / 2 - (a.y + a.height / 2))).toBeLessThanOrEqual(24);
      expect(a.x).toBeGreaterThan(width / 2);
      expect(a.x + a.width).toBeLessThanOrEqual(width);
      expect(a.height).toBeGreaterThanOrEqual(44);
      expect(
        await all
          .locator("span")
          .first()
          .evaluate((el) => getComputedStyle(el).textDecorationLine),
      ).toContain("underline");
      // nothing under the card any more
      await expect(page.locator("[data-weakest-topic] >> text=All topics")).toHaveCount(0);
      await pill(page).click();
      await option(page, "Military training").click();
      await page.getByRole("link", { name: "All topics" }).click();
      await expect(page).toHaveURL(/\/instructor\/students\?view=topics$/);
      await expect(page.getByRole("radio", { name: "Topics" })).toBeChecked();
      await expect(pill(page)).toContainText("Military training");
      await expect(page.locator("[data-topic-card]")).toHaveCount(10);
    });

    test("one headline percentage plus the comparison value, one count for the group, no bottom sheet, no external request", async ({
      page,
    }) => {
      const external: string[] = [];
      page.on("request", (r) => {
        if (!r.url().startsWith("http://localhost:3100") && !r.url().startsWith("data:"))
          external.push(r.url());
      });
      await page.goto("/instructor");
      await expect(page.locator("[data-trend]")).toBeVisible();
      await expect(page.locator("[data-weakest-count]")).toBeVisible();
      const text = await page.locator("main").innerText();
      expect(text.match(/%/g)).toHaveLength(2);
      await expect(page.locator("[data-group-line]")).toContainText("15 students");
      await expect(page.locator("[data-exams-card]")).toContainText("of 15");
      await expect(page.locator("[data-weakest-count]")).toContainText(
        /of 13 who answered it are at or above the pass mark/,
      );
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await page.waitForLoadState("networkidle");
      expect(external).toEqual([]);
    });
  });
}
