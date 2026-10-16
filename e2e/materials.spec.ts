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

test.describe("Materials", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("lists every topic of both guides, grouped, with no Back button and the tab active", async ({
    page,
  }) => {
    await open(page, "/materials");
    await expect(page.getByRole("heading", { name: "Materials", level: 1 })).toBeVisible();
    await expect(
      page.getByText("Read the training guides, then practise what you read."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Building Evacuation and Basic First Aid: Training Guide",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Flood Preparedness for Community Volunteers: Training Guide",
      }),
    ).toBeVisible();
    await expect(page.locator("main a[href^='/materials/read/']:visible")).toHaveCount(17);
    await expect(
      page.getByRole("link", { name: /^Responding to an alarm S1 · \d+ min read/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^The dangers of floodwater F5 · \d+ min read/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Back/ })).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Materials" }),
    ).toHaveAttribute("aria-current", "page");
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("opens the reading screen of S1 with its title, meta line, subsections and three actions", async ({
    page,
  }) => {
    await open(page, "/materials");
    await page.getByRole("link", { name: /^Responding to an alarm/ }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S1$/);
    await expect(
      page.getByRole("heading", { name: "Responding to an alarm", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(
        /^Building Evacuation and Basic First Aid: Training Guide · S1 · \d+ min read$/,
      ),
    ).toBeVisible();
    // the seven subsections are headings, and the topic heading is not repeated in the body
    await expect(page.locator("main h2:visible")).toHaveCount(7);
    await expect(page.getByRole("heading", { name: "Stairs, not elevators" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Responding to an alarm" })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Next: Checking the route" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Materials" }),
    ).toHaveAttribute("aria-current", "page");
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("Practise this topic opens Training at the topic", async ({ page }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("link", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/training\?mode=scenario&topic=S1$/);
    await expect(page.getByRole("heading", { name: "Training" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Scenario" })).toBeChecked();
    await expect(page.getByText("Responding to an alarm").first()).toBeInViewport();
    // a topic with no scenario parts opens in Quiz mode
    await open(page, "/materials/read/S3");
    await page.getByRole("link", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/training\?mode=quiz&topic=S3$/);
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
  });

  test("Steps for this topic opens the Steps, and a topic without steps has no such button", async ({
    page,
  }) => {
    await open(page, "/materials/read/S7");
    await page.getByRole("link", { name: "Steps for this topic" }).click();
    await expect(page).toHaveURL(/\/checklists\/severe-bleeding$/);
    await open(page, "/materials/read/S9");
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toBeVisible();
  });

  test("Next opens the next topic of the same guide, and Back returns to the Materials list", async ({
    page,
  }) => {
    await open(page, "/materials");
    await page.getByRole("link", { name: /^Responding to an alarm/ }).click();
    await page.getByRole("link", { name: "Next: Checking the route" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
    await expect(page.getByRole("heading", { name: "Checking the route", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S1$/);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials$/);
    await expect(page.getByRole("heading", { name: "Materials", level: 1 })).toBeVisible();
  });

  test("the last topic of a guide has no Next link", async ({ page }) => {
    await open(page, "/materials/read/S10");
    await expect(page.getByRole("link", { name: /^Next:/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toBeVisible();
    await open(page, "/materials/read/F7");
    await expect(page.getByRole("link", { name: /^Next:/ })).toHaveCount(0);
    await open(page, "/materials/read/F1");
    await expect(
      page.getByRole("link", { name: "Next: Prepare a plan and a grab bag" }),
    ).toBeVisible();
  });

  test("a flood topic reads from its guide: bold, lists, no Practise or Steps", async ({
    page,
  }) => {
    await open(page, "/materials/read/F5");
    await expect(
      page.getByRole("heading", { name: "The dangers of floodwater", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("main strong", { hasText: "Depth and current." })).toBeVisible();
    await expect(page.locator("main li:visible")).toHaveCount(4);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Next: Getting help and helping others" }),
    ).toBeVisible();
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("reading changes no progress and no Today counter", async ({ page }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("link", { name: "Next: Checking the route" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
    const stored = await page.evaluate(() => ({
      history: localStorage.getItem("ast.history.v1"),
      session: localStorage.getItem("ast.session.v1"),
      parts: localStorage.getItem("ast.parts.v1"),
    }));
    expect(stored).toEqual({ history: null, session: null, parts: null });
    await page.goto("/");
    await expect(page.getByText("Today 0/5")).toBeVisible();
  });

  test("an unknown topic is not found, and the old contents screen is gone", async ({ page }) => {
    await page.goto("/materials/read/S99");
    await expect(page.getByText("could not be found")).toBeVisible();
    await open(page, "/materials/evacuation-guide");
    await expect(
      page.getByRole("heading", { name: "Responding to an alarm", level: 2 }),
    ).toHaveCount(0);
  });
});
