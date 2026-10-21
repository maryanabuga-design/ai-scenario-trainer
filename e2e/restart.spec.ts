import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue, emptyBrowser } from "./auth-seed";

const CODE = "482913";

async function signUp(page: Page, name: string, email: string) {
  await page.goto("/welcome");
  await page.getByRole("link", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
}

async function finishOnboarding(page: Page) {
  // a new student first sees the Field of work step
  await expect(page).toHaveURL(/\/field-of-work$/);
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page).toHaveURL(/\/$/);
}

const appKeys = (page: Page) =>
  page.evaluate(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      if (key.startsWith("ast.")) keys.push(key);
    }
    return keys;
  });

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** Some practice: a part started and one question answered and checked. */
async function practise(page: Page) {
  await page.goto("/training");
  await page.getByText("Start", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/session$/);
  await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
  await page.getByRole("button", { name: "Check" }).click();
}

for (const width of [360, 430]) {
  test.describe(`Restart demo at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("About this prototype has the helper and a 44px or higher Secondary button, and no sideways scroll", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await page.getByRole("link", { name: "About this prototype" }).click();
      await expect(page).toHaveURL(/\/about$/);
      const helper = page.getByText(
        "Clears all demo data on this device (accounts, progress, exams, notifications) and starts from the beginning.",
      );
      const button = page.getByRole("button", { name: "Restart demo" });
      await expect(helper).toBeVisible();
      const h = (await helper.boundingBox())!;
      const b = (await button.boundingBox())!;
      expect(h.y + h.height).toBeLessThanOrEqual(b.y);
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(Math.abs(b.x - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(width - (b.x + b.width) - 16)).toBeLessThanOrEqual(0.5);
      // the olive-tint Secondary
      expect(await button.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgb(224, 230, 214)",
      );
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Restart: Welcome appears, the account is gone, and a new account sees the onboarding again", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await practise(page);
      // her progress is saved under her own keys
      const before = await appKeys(page);
      expect(before.some((key) => key.includes("ana@example.com"))).toBe(true);
      expect(before.length).toBeGreaterThan(2);
      await page.goto("/about");
      await page.getByRole("button", { name: "Restart demo" }).click();
      await expect(page.getByText("Restart the demo?")).toBeVisible();
      await expect(
        page.getByText(
          "This deletes all demo data on this device and returns to the welcome screen.",
        ),
      ).toBeVisible();
      await page.getByRole("button", { name: "Restart", exact: true }).click();
      await expect(page).toHaveURL(/\/welcome$/);
      await expect(page.getByRole("heading", { name: "Train for real situations" })).toBeVisible();
      // no data of the old demo is left: only the empty sign-in store a first visit makes
      await expect
        .poll(async () => (await appKeys(page)).filter((key) => key !== "ast.auth.v1"))
        .toEqual([]);
      const auth = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("ast.auth.v1") ?? "null"),
      );
      expect(auth?.value?.accounts ?? []).toEqual([]);
      // the same email now says there is no account
      await page.getByRole("link", { name: "I already have an account" }).click();
      await page.getByLabel("Work email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByText("No account found on this device.", { exact: false }),
      ).toBeVisible();
      // a new account with that email starts at the onboarding, with no old progress
      await signUp(page, "Ana Again", "ana@example.com");
      // (a new student first sees the Field of work step)
      await expect(page).toHaveURL(/\/field-of-work$/);
      await finishOnboarding(page);
      await expect(page.getByRole("heading", { name: "Hi, Ana Again" })).toBeVisible();
      await page.goto("/training");
      await expect(page.getByText("0/", { exact: false }).first()).toBeVisible();
    });

    test("Cancel keeps everything", async ({ page }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await practise(page);
      const before = await appKeys(page);
      await page.goto("/about");
      await page.getByRole("button", { name: "Restart demo" }).click();
      await expect(page.getByText("Restart the demo?")).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByText("Restart the demo?")).not.toBeVisible();
      await expect(page).toHaveURL(/\/about$/);
      expect(await appKeys(page)).toEqual(before);
      await page.goto("/profile");
      await expect(page.locator("[data-user-name]")).toHaveText("Ana Test");
    });

    test("/welcome?restart=1 clears everything once, with no dialog, and removes the query", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await practise(page);
      await page.goto("/welcome?restart=1");
      await expect(page).toHaveURL(/\/welcome$/);
      expect(new URL(page.url()).search).toBe("");
      await expect(page.getByRole("heading", { name: "Train for real situations" })).toBeVisible();
      await expect
        .poll(async () => (await appKeys(page)).filter((key) => key !== "ast.auth.v1"))
        .toEqual([]);
      // the account is gone
      await page.goto("/sign-in");
      await page.getByLabel("Work email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByText("No account found on this device.", { exact: false }),
      ).toBeVisible();
      // once: with the query gone, going to Welcome again clears nothing
      await signUp(page, "Bob Test", "bob@example.com");
      await finishOnboarding(page);
      await page.reload();
      await page.goto("/welcome");
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: "Hi, Bob Test" })).toBeVisible();
    });

    test("the shortcut also works for a person who is signed in", async ({ page }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/welcome?restart=1");
      await expect(page).toHaveURL(/\/welcome$/);
      await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
    });
  });

  test.describe(`Restart demo for an instructor at ${width}px`, () => {
    test.use({
      viewport: { width, height: 800 },
      storageState: {
        cookies: [],
        origins: [
          {
            origin: "http://localhost:3100",
            localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
          },
        ],
      },
    });

    test("an instructor has Restart demo on About this prototype too", async ({ page }) => {
      await page.goto("/about");
      await expect(page).toHaveURL(/\/about$/);
      await expect(page.getByRole("button", { name: "Restart demo" })).toBeVisible();
    });
  });
}
