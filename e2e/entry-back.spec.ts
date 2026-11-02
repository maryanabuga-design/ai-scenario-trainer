import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { emptyBrowser } from "./auth-seed";

const CODE = "482913";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const box = async (loc: ReturnType<Page["locator"]>) => (await loc.first().boundingBox())!;
const back = (page: Page) => page.locator("[data-back-button]:visible").first();

async function typeCode(page: Page, code: string) {
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(code);
}

/** A signed-in student account, in a group or not. */
const student = (extra: Record<string, unknown> = {}) => ({
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [
        {
          name: "ast.auth.v1",
          value: JSON.stringify({
            schema: 6,
            content: "seed",
            value: {
              accounts: [
                {
                  name: "Maryana",
                  email: "maryana@example.com",
                  role: "student",
                  createdAt: 1,
                  onboardingDone: true,
                  legacy: true,
                  ...extra,
                },
              ],
              session: { email: "maryana@example.com" },
              pending: null,
            },
          }),
        },
      ],
    },
  ],
});

for (const width of [360, 430]) {
  test.describe(`Back arrows on the entry screens at ${width}px (signed out)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("Welcome has no arrow; every other entry screen has the white round 40px arrow at the top left", async ({
      page,
    }) => {
      await page.goto("/welcome");
      await expect(page.locator("[data-back-button]")).toHaveCount(0);
      for (const path of ["/sign-in", "/join", "/join/QT-A7K2", "/join/OLD-0000"]) {
        await page.goto(path);
        const arrow = back(page);
        await expect(arrow, path).toBeVisible();
        const b = (await arrow.boundingBox())!;
        expect([b.width, b.height], path).toEqual([40, 40]);
        expect(b.x, path).toBeLessThanOrEqual(20);
        expect(b.y, path).toBeLessThan(40);
        expect(
          await arrow.evaluate((el) => getComputedStyle(el).borderTopLeftRadius),
          path,
        ).not.toBe("0px");
        expect(await noSidewaysScroll(page), path).toBe(true);
      }
      // the code screen and the Profile step too
      await page.goto("/join/QT-A7K2");
      await page.getByLabel("Your email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(back(page)).toBeVisible();
      await typeCode(page, CODE);
      await expect(page).toHaveURL(/\/set-up-profile$/);
      await expect(back(page)).toBeVisible();
      await expect(back(page)).toHaveAttribute("aria-label", "Back");
    });

    test("Join a group has only the Primary Continue: the arrow replaces the bottom Back button, and goes to Welcome", async ({
      page,
    }) => {
      await page.goto("/join");
      await expect(page.getByRole("link", { name: "Back", exact: true })).toHaveCount(1);
      // the arrow is the only "Back" and it is not the pinned Secondary
      const arrow = back(page);
      await expect(arrow).toHaveAttribute("aria-label", "Back");
      expect((await arrow.boundingBox())!.width).toBe(40);
      const buttons = page.locator("main form button, main form a");
      for (const el of await buttons.all()) {
        const label = (await el.getAttribute("aria-label")) ?? (await el.innerText());
        expect(label).toMatch(/^(Back|Continue)$/);
      }
      expect(await page.locator("main a:not([data-back-button]), main button").count()).toBe(1);
      await arrow.click();
      await expect(page).toHaveURL(/\/welcome$/);
    });

    test("Welcome back: the arrow goes to Welcome", async ({ page }) => {
      await page.goto("/welcome");
      await page.getByRole("link", { name: "Sign in", exact: true }).click();
      await back(page).click();
      await expect(page).toHaveURL(/\/welcome$/);
    });

    test("Invitation opened directly: Back goes to Welcome, never out of the app", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      await expect(page.locator("[data-entry-picture]")).toHaveAttribute(
        "src",
        "/images/entry/entry-invite.webp",
      );
      await back(page).click();
      await expect(page).toHaveURL(/\/welcome$/);
      // the same for a link that is no longer valid
      await page.goto("/join/OLD-0000");
      await back(page).click();
      await expect(page).toHaveURL(/\/welcome$/);
    });

    test("Invitation opened from Join a group: Back returns there and the typed code is still in the field", async ({
      page,
    }) => {
      await page.goto("/join");
      await page.getByLabel("Group code").fill("qt-a7k2");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/join\/QT-A7K2$/);
      await back(page).click();
      await expect(page).toHaveURL(/\/join$/);
      await expect(page.getByLabel("Group code")).toHaveValue("QT-A7K2");
    });

    test("the code screen goes back to the Invitation with the typed email still there", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      await page.getByLabel("Your email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/verify$/);
      await back(page).click();
      await expect(page).toHaveURL(/\/join\/QT-A7K2$/);
      await expect(page.getByLabel("Your email")).toHaveValue("ana@example.com");
      // and from Welcome back it goes to Welcome back with the email
      await page.goto("/sign-in");
      await page.getByLabel("Work email").fill("lena@example.org");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/verify$/);
      await back(page).click();
      await expect(page).toHaveURL(/\/sign-in$/);
      await expect(page.getByLabel("Work email")).toHaveValue("lena@example.org");
    });

    test("Your profile goes back to the code screen for the same email: no account exists until the profile is finished; the group is kept", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      await page.getByLabel("Your email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await typeCode(page, CODE);
      await expect(page).toHaveURL(/\/set-up-profile$/);
      await page.getByLabel("Your name").fill("Ana");
      await back(page).click();
      await expect(page).toHaveURL(/\/verify$/);
      await expect(page.getByText("We sent a 6-digit code to ana@example.com.")).toBeVisible();
      const state = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.auth.v1")!).value,
      );
      expect(state.accounts).toEqual([]);
      expect(state.session).toBeNull();
      // the code again: back on the Profile step, in the same group
      await typeCode(page, CODE);
      await expect(page).toHaveURL(/\/set-up-profile$/);
      await page.getByLabel("Your name").fill("Ana Test");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("[data-flash]:visible")).toContainText("You joined Rescue team");
    });
  });

  test.describe(`Back arrows on the Invitation at ${width}px (signed in)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: student() });

    test("states b, c and d: the picture and the arrow; Back opened directly goes Home; Not now stays on b", async ({
      page,
    }) => {
      for (const [path, marker] of [
        ["/join/QT-M4R9", "Join group"],
        ["/join/QT-A7K2", "Open group"],
        ["/join/OLD-0000", "Back to start"],
      ] as const) {
        await page.goto(path);
        await expect(page.locator("[data-entry-picture]"), path).toHaveAttribute(
          "src",
          "/images/entry/entry-invite.webp",
        );
        await expect(page.getByText(marker, { exact: true }), path).toBeVisible();
        await expect(back(page), path).toBeVisible();
      }
      await page.goto("/join/QT-M4R9");
      await expect(page.getByRole("link", { name: "Not now" })).toBeVisible();
      await back(page).click();
      await expect(page).toHaveURL(/\/$/);
    });
  });

  for (const height of [640, 560]) {
    test.describe(`Back arrows and the Primary on a short phone (${width} x ${height})`, () => {
      test.use({ viewport: { width, height }, storageState: emptyBrowser });

      for (const path of ["/join", "/join/QT-A7K2", "/join/OLD-0000"]) {
        test(`${path}: the arrow and the Primary or the Secondary stay in view`, async ({
          page,
        }) => {
          await page.route("**/images/entry/entry-group.webp", (route) => route.abort());
          await page.goto(path);
          await expect(back(page)).toBeVisible();
          const main =
            path === "/join/OLD-0000"
              ? page.getByRole("link", { name: "Back to start" })
              : page.getByRole("button", { name: "Continue" });
          const m = await box(main);
          expect(m.height).toBe(52);
          expect(m.y + m.height).toBeLessThanOrEqual(height);
          expect(await page.evaluate(() => window.scrollY)).toBe(0);
          expect(await noSidewaysScroll(page)).toBe(true);
        });
      }

      test("Your profile: the arrow and the Primary stay in view", async ({ page }) => {
        await page.goto("/join/QT-A7K2");
        await page.getByLabel("Your email").fill("ana@example.com");
        await page.getByRole("button", { name: "Continue" }).click();
        await typeCode(page, CODE);
        await expect(page).toHaveURL(/\/set-up-profile$/);
        await expect(back(page)).toBeVisible();
        const m = await box(page.getByRole("button", { name: "Continue" }));
        expect(m.y + m.height).toBeLessThanOrEqual(height);
        expect(await noSidewaysScroll(page)).toBe(true);
      });
    });
  }
}
