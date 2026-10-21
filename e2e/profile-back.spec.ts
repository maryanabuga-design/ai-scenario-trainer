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

const roles = [
  { role: "Student", home: /^http:\/\/localhost:3100\/$/, homePath: "/", state: undefined },
  { role: "Instructor", home: /\/instructor$/, homePath: "/instructor", state: instructor },
] as const;

const backHome = (page: Page) => page.getByRole("link", { name: /^Back to (Home|Overview)$/ });

async function atHome(page: Page, home: RegExp) {
  await expect(page).toHaveURL(home);
}

for (const width of [360, 430]) {
  for (const r of roles) {
    test.describe(`Back on Profile, ${r.role}, at ${width}px`, () => {
      test.use({
        viewport: { width, height: 800 },
        ...(r.state ? { storageState: r.state } : {}),
      });

      test("Back keeps its look and a 44px tap target, and is a link to Home", async ({ page }) => {
        await page.goto("/profile");
        const back = backHome(page);
        await expect(back).toBeVisible();
        await expect(back).toHaveAttribute("href", r.homePath);
        const box = (await back.boundingBox())!;
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
        // the white 40px circle of the band, inside a 44px tap area
        const look = await back.evaluate((el) => {
          const css = getComputedStyle(el);
          return [css.backgroundColor, css.borderTopLeftRadius, el.getBoundingClientRect().width];
        });
        expect(look[0]).toBe("rgb(255, 255, 255)");
        expect(parseFloat(String(look[1]))).toBeGreaterThan(10);
        expect(look[2]).toBe(40);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
          ),
        ).toBe(true);
      });

      test("opened from the navigation or the avatar, Back lands on Home", async ({ page }) => {
        await page.goto(r.homePath);
        if (r.role === "Student") {
          await page.goto("/materials");
          await page.locator("[data-page-header-band] [data-avatar]:visible").click();
        } else {
          // an Instructor opens Profile from the avatar of a tab (Exams), not from the navigation
          await page.goto("/instructor/exams");
          await page.locator("[data-page-header-band] [data-avatar]:visible").click();
        }
        await expect(page).toHaveURL(/\/profile$/);
        await backHome(page).click();
        await atHome(page, r.home);
      });

      test("opened directly by address, Back lands on Home (there is no history to go back to)", async ({
        page,
      }) => {
        await page.goto("/profile");
        await backHome(page).click();
        await atHome(page, r.home);
      });

      test("after a reload on Profile, Back lands on Home", async ({ page }) => {
        await page.goto("/profile");
        await page.reload();
        await expect(backHome(page)).toBeVisible();
        await backHome(page).click();
        await atHome(page, r.home);
      });

      test("opened from another screen, Back still lands on Home, not on that screen", async ({
        page,
      }) => {
        await page.goto(r.role === "Student" ? "/ask-ai" : "/instructor");
        await page.goto("/about");
        await page.getByRole("link", { name: "Back to Profile" }).click();
        await expect(page).toHaveURL(/\/profile$/);
        await backHome(page).click();
        await atHome(page, r.home);
      });

      test("Edit profile: Back goes to Profile, then Back goes to Home", async ({ page }) => {
        await page.goto("/profile");
        await page.locator("[data-user-card]").click();
        await expect(page).toHaveURL(/\/profile\/edit$/);
        await page.getByRole("link", { name: "Back to Profile" }).click();
        await expect(page).toHaveURL(/\/profile$/);
        await backHome(page).click();
        await atHome(page, r.home);
      });

      test("About: Back goes to Profile, then Back goes to Home", async ({ page }) => {
        await page.goto("/profile");
        await page.getByRole("link", { name: "About this prototype" }).click();
        await expect(page).toHaveURL(/\/about$/);
        await page.getByRole("link", { name: "Back to Profile" }).click();
        await expect(page).toHaveURL(/\/profile$/);
        await backHome(page).click();
        await atHome(page, r.home);
      });
    });
  }

  test.describe(`Back on the Student Profile sub-screens at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("Direction is on the Profile screen itself (no screen of its own), so Back from Profile goes to Home", async ({
      page,
    }) => {
      await page.goto("/profile");
      await expect(page.getByText("Direction", { exact: true })).toBeVisible();
      await page.getByRole("radio", { name: /Building evacuation/ }).check({ force: true });
      await expect(page).toHaveURL(/\/profile$/);
      await backHome(page).click();
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
    });

    test("Certificates: the list goes back to Profile, then Back goes to Home", async ({
      page,
    }) => {
      await page.goto("/profile");
      await page.locator("[data-certificates-row]").click();
      await expect(page).toHaveURL(/\/profile\/certificates$/);
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/profile$/);
      await backHome(page).click();
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
    });
  });
}
