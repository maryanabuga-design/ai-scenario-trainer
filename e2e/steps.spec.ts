import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

async function open(page: Page, path: string) {
  await page.addInitScript(
    ([p]) => {
      if (!localStorage.getItem("ast.profile.v1")) {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      }
    },
    [profile],
  );
  await page.goto(path);
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** The accordion headers of the visible topic screen. */
const headers = (page: Page) => page.locator("main ol button[aria-expanded]:visible");
const done = (page: Page, n: number) =>
  page
    .locator("main ol li:visible")
    .nth(n - 1)
    .locator("button[aria-pressed]");

test.describe("Steps", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("the list shows every topic with its step count, as flat-bordered cards inside the gutters", async ({
    page,
  }) => {
    await open(page, "/");
    await page.getByRole("link", { name: /^Steps/ }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    await expect(page.getByRole("heading", { name: "Steps", level: 1 })).toBeVisible();
    await expect(page.getByText("Short step-by-step guides for each topic.")).toBeVisible();
    const cards = page.locator("main ul li:visible a");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText("Leaving a building during an alarm");
    await expect(cards.nth(0)).toContainText("6 steps · 0 done");
    await expect(cards.nth(1)).toContainText("Severe bleeding");
    await expect(cards.nth(2)).toContainText("5 steps · 0 done");
    const look = await cards.first().evaluate((card) => {
      const css = getComputedStyle(card);
      const box = card.getBoundingClientRect();
      return {
        background: css.backgroundColor,
        border: [css.borderTopWidth, css.borderTopColor],
        radius: css.borderTopLeftRadius,
        padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
        height: box.height,
        left: box.left,
        right: document.documentElement.clientWidth - box.right,
        shadow: css.boxShadow,
      };
    });
    expect(look.background).toBe("rgb(250, 247, 244)");
    expect(look.border).toEqual(["1px", "rgb(228, 223, 213)"]);
    expect(look.radius).toBe("24px");
    expect(look.padding).toEqual(["16px", "16px", "16px", "16px"]);
    expect(look.height).toBeGreaterThanOrEqual(44);
    expect(look.left).toBeGreaterThanOrEqual(16);
    expect(look.right).toBeGreaterThanOrEqual(16);
    expect(look.shadow).toBe("none");
    expect(await noSidewaysScroll(page)).toBe(true);
    // Back goes Home
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("a topic opens with its title, 0 done and step 1 expanded; opening step 2 collapses step 1", async ({
    page,
  }) => {
    await open(page, "/checklists");
    await page.getByRole("link", { name: /Severe bleeding/ }).click();
    await expect(page).toHaveURL(/\/checklists\/severe-bleeding$/);
    await expect(page.getByRole("heading", { name: "Severe bleeding", level: 1 })).toBeVisible();
    await expect(page.getByText("0 of 6 steps done")).toBeVisible();
    await expect(headers(page)).toHaveCount(6);
    await expect(headers(page).nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(headers(page).nth(1)).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Check that the scene is safe first.")).toBeVisible();
    await headers(page).nth(1).click();
    await expect(headers(page).nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(headers(page).nth(0)).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Call 112 or the local emergency number.").first()).toBeVisible();
    // the closed step's details are not visible and cannot be focused
    await expect(page.getByText("Check that the scene is safe first.")).toBeHidden();
    // tapping the open step closes it: nothing is open
    await headers(page).nth(1).click();
    await expect(page.locator("main ol button[aria-expanded=true]")).toHaveCount(0);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("the done-circle changes the count without opening or closing, and survives a reload", async ({
    page,
  }) => {
    await open(page, "/checklists/severe-bleeding");
    await headers(page).nth(1).click();
    await expect(headers(page).nth(1)).toHaveAttribute("aria-expanded", "true");
    await done(page, 2).click();
    await expect(page.getByText("1 of 6 steps done")).toBeVisible();
    await expect(done(page, 2)).toHaveAttribute("aria-pressed", "true");
    // the open state is unchanged
    await expect(headers(page).nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(headers(page).nth(0)).toHaveAttribute("aria-expanded", "false");
    // ticking a closed step does not open it
    await done(page, 4).click();
    await expect(page.getByText("2 of 6 steps done")).toBeVisible();
    await expect(headers(page).nth(3)).toHaveAttribute("aria-expanded", "false");
    await done(page, 4).click();
    await expect(page.getByText("1 of 6 steps done")).toBeVisible();
    const filled = await done(page, 2)
      .locator("span")
      .evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.backgroundColor, el.querySelector("svg") !== null];
      });
    expect(filled).toEqual(["rgb(63, 70, 56)", true]);
    // the bar
    const bar = page.getByRole("progressbar");
    await expect(bar).toHaveAttribute("aria-valuenow", "1");
    // saved on this device
    await page.reload();
    await expect(page.getByText("1 of 6 steps done")).toBeVisible();
    await expect(done(page, 2)).toHaveAttribute("aria-pressed", "true");
    // the list card says so
    await page.goto("/checklists");
    await expect(page.getByRole("link", { name: /Severe bleeding/ })).toContainText(
      "6 steps · 1 done",
    );
  });

  test("steps progress changes nothing else: not Today, not readiness", async ({ page }) => {
    await open(page, "/checklists/burns");
    await done(page, 1).click();
    await done(page, 2).click();
    await page.goto("/");
    await expect(page.getByText("Today 0/5")).toBeVisible();
    const stored = await page.evaluate(() => ({
      history: localStorage.getItem("ast.history.v1"),
      session: localStorage.getItem("ast.session.v1"),
      parts: localStorage.getItem("ast.parts.v1"),
    }));
    expect(stored).toEqual({ history: null, session: null, parts: null });
  });

  test("broken or old saved data never breaks the screens", async ({ page }) => {
    await page.addInitScript(
      ([p]) => {
        // seeded once: a reload must not put the old data back
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        localStorage.setItem(
          "ast.steps.v1",
          JSON.stringify({
            schema: 6,
            content: "old",
            value: { burns: ["ghost", "burns-s2", 7], nothing: ["x"], "severe-bleeding": "no" },
          }),
        );
      },
      [profile],
    );
    await page.goto("/checklists");
    await expect(page.getByRole("link", { name: /^Burns/ })).toContainText("5 steps · 1 done");
    await page.getByRole("link", { name: /^Burns/ }).click();
    await expect(page.getByText("1 of 5 steps done")).toBeVisible();
    await page.evaluate(() => localStorage.setItem("ast.steps.v1", "{broken"));
    await page.reload();
    await expect(page.getByText("0 of 5 steps done")).toBeVisible();
  });

  test("Read the material and Practise this topic open the right screens", async ({ page }) => {
    await open(page, "/checklists/leaving-a-building");
    const read = page.getByRole("link", { name: "Read the material" });
    const practise = page.getByRole("button", { name: "Practise this topic" });
    await expect(read).toBeVisible();
    await expect(practise).toBeVisible();
    // Primary on top, Secondary under it, both full width
    const [a, b] = [(await practise.boundingBox())!, (await read.boundingBox())!];
    expect(a.y).toBeLessThan(b.y);
    expect(a.width).toBe(b.width);
    expect(a.height).toBe(52);
    await read.click();
    await expect(page).toHaveURL(/\/materials\/read\/S1$/);
    await open(page, "/checklists/leaving-a-building");
    await page.getByRole("button", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible();
  });

  test("Back goes to the Steps list from the list, and to the reading screen from Steps for this topic", async ({
    page,
  }) => {
    await open(page, "/checklists");
    await page.getByRole("link", { name: /^Burns/ }).click();
    await expect(page).toHaveURL(/\/checklists\/burns$/);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    // from the reading screen
    await page.goto("/materials/read/S8");
    await page.getByRole("link", { name: "Steps for this topic" }).click();
    await expect(page).toHaveURL(/\/checklists\/burns$/);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S8$/);
  });

  test("a topic without a step guide has no Steps button, and the Source row is hidden", async ({
    page,
  }) => {
    await open(page, "/materials/read/S9");
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
    await open(page, "/checklists/burns");
    await expect(page.getByText("Source", { exact: true })).toHaveCount(0);
  });

  test("the end of a topic screen keeps the gutters and does not scroll sideways", async ({
    page,
  }) => {
    await open(page, "/checklists/leaving-a-building");
    for (let n = 2; n <= 6; n++) {
      await headers(page)
        .nth(n - 1)
        .click();
      await expect(headers(page).nth(n - 1)).toHaveAttribute("aria-expanded", "true");
      expect(await noSidewaysScroll(page)).toBe(true);
    }
    const sides = await page.evaluate(() =>
      [...document.querySelectorAll("main ol > li, main section")].map((el) => {
        const box = el.getBoundingClientRect();
        return [box.left, document.documentElement.clientWidth - box.right];
      }),
    );
    for (const [left, right] of sides) {
      expect(left).toBeGreaterThanOrEqual(16);
      expect(right).toBeGreaterThanOrEqual(16);
    }
  });

  test("the header is a button for the keyboard: it opens with Enter", async ({ page }) => {
    await open(page, "/checklists/burns");
    await headers(page).nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(headers(page).nth(2)).toHaveAttribute("aria-expanded", "true");
    await expect(headers(page).nth(2)).toHaveAttribute("aria-controls", "burns-s3-panel");
  });
});
