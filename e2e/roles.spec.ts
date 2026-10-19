import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

type Seed = { role?: "student" | "instructor"; rawRole?: string };

/** Opens a page with a profile and, optionally, a saved role (set once, so a switch is kept). */
async function open(page: Page, path: string, seed: Seed = {}) {
  await page.addInitScript(
    ([p, s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (s.rawRole !== undefined) localStorage.setItem("ast.role.v1", s.rawRole);
      else if (s.role)
        localStorage.setItem(
          "ast.role.v1",
          JSON.stringify({ schema: 6, content: "x", value: { role: s.role } }),
        );
    },
    [profile, seed] as const,
  );
  await page.goto(path);
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const rgb = (value: string) => {
  const match = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(value)!;
  return { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] };
};

/** Page errors that are the app's (WebKit reports its own prefetch noise as errors). */
function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return () =>
    errors.filter((message) => !/access control checks|Failed to load resource/.test(message));
}

const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });
const roleGroup = (page: Page) => page.getByRole("radiogroup", { name: "Switch role (demo)" });

for (const width of [360, 430]) {
  test.describe(`Roles and Profile at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("the student Profile has the role label, Demo mode and Coming soon on three directions", async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await open(page, "/profile");
      await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
      const main = page.locator("main");
      await expect(main.locator("[data-role-label]")).toHaveText("Student");
      await expect(main.getByText("Maryana", { exact: true })).toBeVisible();
      // no email is shown, because the data has none
      expect(await main.innerText()).not.toContain("@");
      await expect(main.getByRole("heading", { name: "Demo mode" })).toBeVisible();
      const group = roleGroup(page);
      await expect(group).toBeVisible();
      await expect(group.getByRole("radio", { name: "Student" })).toBeChecked();
      await expect(group.getByRole("radio", { name: "Instructor" })).not.toBeChecked();
      await expect(
        main.getByText(
          "Demo only. In the real product your role comes from your organisation account.",
        ),
      ).toBeVisible();
      await expect(main.getByText("Coming soon", { exact: true })).toHaveCount(3);
      await expect(main.getByText("Not available in this prototype")).toHaveCount(0);
      await expect(main.getByRole("heading", { name: "Reset progress" })).toBeVisible();
      await expect(nav(page).getByRole("link")).toHaveCount(4);
      expect(await noSidewaysScroll(page)).toBe(true);
      expect(errors()).toEqual([]);
    });

    test("the cards keep the page gutter and the last element is not behind the navigation", async ({
      page,
    }) => {
      await open(page, "/profile");
      await expect(roleGroup(page)).toBeVisible();
      for (const card of await page.locator("main .rounded-card:visible").all()) {
        const box = (await card.boundingBox())!;
        expect(Math.abs(box.x - 16)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(width - (box.x + box.width) - 16)).toBeLessThanOrEqual(0.5);
      }
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const navBox = (await nav(page).boundingBox())!;
      const footer = (await page.locator("main footer").boundingBox())!;
      expect(footer.y + footer.height).toBeLessThanOrEqual(navBox.y);
    });

    test("the About row opens the four-line screen and Back returns to Profile", async ({
      page,
    }) => {
      await open(page, "/profile");
      await page.getByRole("link", { name: "About this prototype" }).click();
      await expect(page).toHaveURL(/\/about$/);
      await expect(
        page.getByRole("heading", { name: "About this prototype", level: 1 }),
      ).toBeVisible();
      const lines = page.locator("main ul li");
      await expect(lines).toHaveCount(4);
      await expect(lines.nth(0)).toHaveText("Your progress is saved on this device only.");
      await expect(lines.nth(1)).toHaveText(
        "AI answers are prepared examples; there is no live AI model.",
      );
      await expect(lines.nth(2)).toHaveText("All content is educational.");
      await expect(lines.nth(3)).toHaveText(/^Version \d+\.\d+\.\d+$/);
      await expect(nav(page)).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      await page.getByRole("link", { name: "Back to Profile" }).click();
      await expect(page).toHaveURL(/\/profile$/);
    });

    test("the role control is a radio group, each option at least 44px high, the selected one filled", async ({
      page,
    }) => {
      await open(page, "/profile");
      const group = roleGroup(page);
      await expect(group).toBeVisible();
      for (const label of ["Student", "Instructor"]) {
        const option = group.locator("label", { hasText: label });
        expect((await option.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      const selected = group.locator("label", { hasText: "Student" });
      const look = await selected.evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        getComputedStyle(el).color,
      ]);
      expect(look[0]).toBe("rgb(63, 70, 56)");
      expect(look[1]).toBe("rgb(255, 255, 255)");
      for (const color of look) {
        expect(rgb(color).a).toBeGreaterThan(0);
      }
      expect(look[0]).not.toBe("rgb(0, 0, 0)");
      const other = group.locator("label", { hasText: "Instructor" });
      expect(await other.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgba(0, 0, 0, 0)",
      );
    });

    test("the arrow keys change the role, and switching opens that role's Home", async ({
      page,
    }) => {
      await open(page, "/profile");
      const student = roleGroup(page).getByRole("radio", { name: "Student" });
      await student.focus();
      await page.keyboard.press("ArrowRight");
      await expect(page).toHaveURL(/\/instructor$/);
      await expect(page.getByRole("heading", { name: "Instructor", level: 1 })).toBeVisible();
      // and back with the keyboard from the instructor Profile
      await page.getByRole("link", { name: "Profile" }).click();
      await expect(page).toHaveURL(/\/profile$/);
      const instructor = roleGroup(page).getByRole("radio", { name: "Instructor" });
      await expect(instructor).toBeChecked();
      await instructor.focus();
      await page.keyboard.press("ArrowLeft");
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: /^Hi, / })).toBeVisible();
    });

    test("switching to Instructor opens Instructor Home with a two-item navigation", async ({
      page,
    }) => {
      await open(page, "/profile");
      await roleGroup(page).locator("label", { hasText: "Instructor" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      const main = page.locator("main");
      await expect(main.getByRole("heading", { name: "Instructor", level: 1 })).toBeVisible();
      await expect(main.getByText("No exams yet. Exam tools are coming next.")).toBeVisible();
      // no fake buttons or links on the stub
      await expect(main.getByRole("button")).toHaveCount(0);
      await expect(main.getByRole("link")).toHaveCount(0);
      const links = nav(page).getByRole("link");
      await expect(links).toHaveCount(2);
      await expect(links.nth(0)).toHaveText("Home");
      await expect(links.nth(1)).toHaveText("Profile");
      await expect(links.nth(0)).toHaveAttribute("aria-current", "page");
      for (const link of await links.all()) {
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the instructor Profile has the role label, no Direction and no Reset progress", async ({
      page,
    }) => {
      const errors = collectErrors(page);
      await open(page, "/profile", { role: "instructor" });
      const main = page.locator("main");
      await expect(main.locator("[data-role-label]")).toHaveText("Instructor");
      await expect(roleGroup(page).getByRole("radio", { name: "Instructor" })).toBeChecked();
      await expect(main.getByText("Direction", { exact: true })).toHaveCount(0);
      await expect(main.getByText("Coming soon")).toHaveCount(0);
      await expect(main.getByText("Reset progress")).toHaveCount(0);
      await expect(main.getByRole("link", { name: "How the app works" })).toBeVisible();
      await expect(main.getByRole("link", { name: "About this prototype" })).toBeVisible();
      await expect(nav(page).getByRole("link")).toHaveCount(2);
      expect(await noSidewaysScroll(page)).toBe(true);
      expect(errors()).toEqual([]);
    });

    test("switching back to Student returns to Home with the full navigation", async ({ page }) => {
      await open(page, "/profile", { role: "instructor" });
      await roleGroup(page).locator("label", { hasText: "Student" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(nav(page).getByRole("link")).toHaveCount(4);
      await expect(page.getByRole("heading", { name: /^Hi, / })).toBeVisible();
    });

    test("an instructor is sent from every student-only route to Instructor Home", async ({
      page,
    }) => {
      await open(page, "/", { role: "instructor" });
      await expect(page).toHaveURL(/\/instructor$/);
      for (const path of ["/training", "/materials", "/progress", "/exam", "/notifications"]) {
        await page.goto(path);
        await expect(page, path).toHaveURL(/\/instructor$/);
        await expect(page.getByRole("heading", { name: "Instructor", level: 1 })).toBeVisible();
      }
      // and may open Profile, About and the introduction
      for (const [path, pattern] of [
        ["/profile", /\/profile$/],
        ["/about", /\/about$/],
        ["/onboarding", /\/onboarding$/],
      ] as const) {
        await page.goto(path);
        await expect(page, path).toHaveURL(pattern);
      }
    });

    test("a student who opens Instructor Home is sent to Home", async ({ page }) => {
      await open(page, "/instructor");
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: /^Hi, / })).toBeVisible();
    });

    test("draws nothing of the student screens for an instructor while the role is read", async ({
      page,
    }) => {
      await open(page, "/materials", { role: "instructor" });
      // never the Materials heading, not even for a moment
      await expect(page.getByRole("heading", { name: "Materials", level: 1 })).toHaveCount(0);
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("the role is kept after a reload", async ({ page }) => {
      await open(page, "/profile");
      await roleGroup(page).locator("label", { hasText: "Instructor" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await page.reload();
      await expect(page).toHaveURL(/\/instructor$/);
      await expect(nav(page).getByRole("link")).toHaveCount(2);
      await page.getByRole("link", { name: "Profile" }).click();
      await expect(page.locator("[data-role-label]")).toHaveText("Instructor");
    });

    test("a broken saved role reads as Student, without errors", async ({ page }) => {
      const errors = collectErrors(page);
      await open(page, "/profile", { rawRole: "{not json" });
      await expect(page.locator("[data-role-label]")).toHaveText("Student");
      await expect(roleGroup(page).getByRole("radio", { name: "Student" })).toBeChecked();
      expect(errors()).toEqual([]);
    });
  });
}
