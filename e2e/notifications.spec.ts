import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

/** Opens a page with a profile; optionally with the saved notifications already empty. */
async function open(page: Page, path: string, options: { empty?: boolean } = {}) {
  await page.addInitScript(
    ([p, empty]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (empty) {
        localStorage.setItem(
          "ast.notifications.v1",
          JSON.stringify({ schema: 6, content: "other", value: [] }),
        );
      }
    },
    [profile, options.empty ?? false] as const,
  );
  await page.goto(path);
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const bell = (page: Page) =>
  page.getByRole("link", { name: /^Notifications, / }).filter({ visible: true });

test.describe("Notifications (demo data, no backend)", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("Home shows the avatar, the greeting and the bell with the unread count in one row", async ({
    page,
  }) => {
    await open(page, "/");
    const avatar = page.locator("[data-avatar]:visible");
    const heading = page.getByRole("heading", { name: "Hi, Maryana" });
    await expect(avatar).toHaveText("M");
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, 4 unread");
    await expect(bell(page).locator("[data-unread-badge]")).toHaveText("4");
    const a = (await avatar.boundingBox())!;
    const h = (await heading.boundingBox())!;
    const b = (await bell(page).boundingBox())!;
    expect([a.width, a.height]).toEqual([44, 44]);
    expect([b.width, b.height]).toEqual([44, 44]);
    // avatar, then greeting, then bell, on one line (centres within 2px)
    expect(a.x + a.width).toBeLessThanOrEqual(h.x);
    expect(h.x + h.width).toBeLessThanOrEqual(b.x + 1);
    expect(Math.abs(a.y + a.height / 2 - (b.y + b.height / 2))).toBeLessThanOrEqual(2);
    expect(Math.abs(a.y + a.height / 2 - (h.y + h.height / 2))).toBeLessThanOrEqual(4);
    // the page gutter is 16px on both sides
    expect(Math.abs(a.x - 16)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(360 - (b.x + b.width) - 16)).toBeLessThanOrEqual(0.5);
    // the sentence is full width, below the row
    const sentence = (await page.getByText("Start with your first scenario.").boundingBox())!;
    expect(sentence.y).toBeGreaterThanOrEqual(a.y + a.height);
    expect(Math.abs(sentence.x - 16)).toBeLessThanOrEqual(0.5);
    // the avatar looks like the Profile card's circle: olive tint, deep olive letter
    const look = await avatar.evaluate((el) => {
      const css = getComputedStyle(el);
      return [css.backgroundColor, css.color, css.borderRadius];
    });
    expect(look[0]).toBe("rgb(224, 230, 214)");
    expect(look[1]).toBe("rgb(63, 70, 56)");
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("the avatar opens Profile", async ({ page }) => {
    await open(page, "/");
    await page.locator("[data-avatar]:visible").click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
  });

  test("the bell opens Notifications with the four demo messages under New", async ({ page }) => {
    await open(page, "/");
    await bell(page).click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole("heading", { name: "Notifications", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Earlier", level: 2 })).toHaveCount(0);
    const cards = page.locator("main ul li:visible");
    await expect(cards).toHaveCount(4);
    await expect(page.locator("[data-unread-dot]:visible")).toHaveCount(4);
    await expect(page.getByText("Welcome to your training")).toBeVisible();
    await expect(
      page.getByText("Reminder: continue Part 1 of Responding to an alarm"),
    ).toBeVisible();
    await expect(page.getByText("New material available: Checking the route")).toBeVisible();
    await expect(page.getByText("Reminder: take the mock exam this week")).toBeVisible();
    // newest first: the exam reminder (45 min ago) is on top
    await expect(cards.first()).toContainText("take the mock exam");
    await expect(cards.first()).toContainText("45 min ago");
    // no bottom navigation, no sideways scroll, the card padding is the 16px gutter
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    expect(await noSidewaysScroll(page)).toBe(true);
    const card = cards.first().locator("a, button").first();
    const style = await card.evaluate((el) => {
      const css = getComputedStyle(el);
      return {
        bg: css.backgroundColor,
        border: [css.borderTopWidth, css.borderTopColor],
        padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
      };
    });
    expect(style.bg).toBe("rgb(250, 247, 244)");
    expect(style.border).toEqual(["1px", "rgb(228, 223, 213)"]);
    expect(style.padding).toEqual(["16px", "16px", "16px", "16px"]);
    // the back button is the 40px white circle
    const back = (await page.getByRole("link", { name: "Back to Home" }).boundingBox())!;
    expect([back.width, back.height]).toEqual([40, 40]);
  });

  test("tapping a card removes its dot and opens its target; the read state is kept", async ({
    page,
  }) => {
    await open(page, "/notifications");
    const unreadBg = await page
      .locator("main ul li a")
      .first()
      .evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        getComputedStyle(el).borderTopColor,
      ]);
    await page.getByRole("link", { name: /take the mock exam/ }).click();
    await expect(page).toHaveURL(/\/exam$/);
    await page.goto("/notifications");
    await expect(page.locator("[data-unread-dot]:visible")).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "Earlier", level: 2 })).toBeVisible();
    // a read card has the same background and border as an unread one
    const readCard = page.getByRole("region", { name: "Earlier" }).locator("a").first();
    expect(
      await readCard.evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        getComputedStyle(el).borderTopColor,
      ]),
    ).toEqual(unreadBg);
    // the bell on Home counts 3 now
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, 3 unread");
  });

  test("other targets open the Training screen and a Materials reading screen", async ({
    page,
  }) => {
    await open(page, "/notifications");
    await page.getByRole("link", { name: /continue Part 1/ }).click();
    await expect(page).toHaveURL(/\/training$/);
    await page.goto("/notifications");
    await page.getByRole("link", { name: /Checking the route/ }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
  });

  test("a card with no target only marks itself as read and stays on the page", async ({
    page,
  }) => {
    await open(page, "/notifications");
    await page.getByRole("button", { name: /Welcome to your training/ }).click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.locator("[data-unread-dot]:visible")).toHaveCount(3);
    await expect(
      page.getByRole("region", { name: "Earlier" }).getByText("Welcome to your training"),
    ).toBeVisible();
  });

  test("Mark all as read clears the dots and the indicator on Home", async ({ page }) => {
    await open(page, "/notifications");
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(page.locator("[data-unread-dot]:visible")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "New", level: 2 })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Earlier", level: 2 })).toBeVisible();
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, no unread");
    await expect(page.locator("[data-unread-badge]:visible")).toHaveCount(0);
    // it is saved: a reload keeps it
    await page.reload();
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, no unread");
  });

  test("an empty list shows the friendly empty state", async ({ page }) => {
    await open(page, "/notifications", { empty: true });
    await expect(page.getByText("No notifications yet")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
    await expect(page.locator("main ul li:visible")).toHaveCount(0);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("finishing an exam adds one result notification, which opens the exam results", async ({
    page,
  }) => {
    await open(page, "/exam");
    await page.getByRole("button", { name: /^Start exam/ }).click();
    for (let n = 0; n < 20; n++) {
      await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
      await page.getByRole("button", { name: n < 19 ? "Next" : "Finish", exact: true }).click();
    }
    await expect(page).toHaveURL(/\/exam\/results$/);
    await page.goto("/");
    await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, 5 unread");
    await bell(page).click();
    const cards = page.locator("main ul li:visible");
    await expect(cards).toHaveCount(5);
    await expect(cards.first()).toContainText(/Exam result: \d+% · (passed|not passed)/);
    await cards.first().getByRole("link").click();
    await expect(page).toHaveURL(/\/exam\/results$/);
    // visiting the results again does not add another one
    await page.goto("/notifications");
    await expect(page.locator("main ul li:visible")).toHaveCount(5);
  });

  test("a broken saved value never crashes: the demo messages come back", async ({ page }) => {
    await page.addInitScript(
      ([p]) => {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        localStorage.setItem("ast.notifications.v1", "{not json");
      },
      [profile],
    );
    await page.goto("/notifications");
    await expect(page.locator("main ul li:visible")).toHaveCount(4);
  });
});
