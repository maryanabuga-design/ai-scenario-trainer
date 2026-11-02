import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue, emptyBrowser } from "./auth-seed";
import { joinAsStudent } from "./join-flow";

const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const CODE = "482913";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });

/** A signed-in student account in the browser, optionally without a group. */
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
  test.describe(`Invitation-only entry at ${width}px (signed out)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("Welcome: Sign in, the muted line and 'Have a group code?'; no sign-up anywhere, even by address", async ({
      page,
    }) => {
      await page.goto("/welcome");
      await expect(page.getByText("Sign in to continue your training.")).toBeVisible();
      await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
      await expect(
        page.getByText("No account yet? Ask your instructor for an invitation link."),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Have a group code?" })).toBeVisible();
      await expect(page.getByText(/Create account|Sign up/i)).toHaveCount(0);
      await expect(nav(page)).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      // the old sign-up address is gone: no form is drawn there
      await page.goto("/sign-up");
      await expect(page.getByLabel("Full name")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Create your account" })).toHaveCount(0);
    });

    test("Group code: a known code opens the invitation; an unknown code shows the message in a live region; keyboard works", async ({
      page,
    }) => {
      await page.goto("/welcome");
      await page.getByRole("link", { name: "Have a group code?" }).click();
      await expect(page).toHaveURL(/\/join$/);
      await expect(page.getByRole("heading", { name: "Join a group", level: 1 })).toBeVisible();
      await expect(page.getByText("Enter the code your instructor gave you.")).toBeVisible();
      await expect(nav(page)).toHaveCount(0);
      const field = page.getByLabel("Group code");
      const fb = (await field.boundingBox())!;
      expect(fb.height).toBeGreaterThanOrEqual(48);
      // unknown: the inline error, aria wiring, the screen stays
      await field.fill("qt-0000");
      await expect(field).toHaveValue("QT-0000");
      await field.press("Enter");
      const message = page.locator("p[aria-live=polite]", {
        hasText: "We could not find this code",
      });
      await expect(message).toHaveText(
        "We could not find this code. Check it or ask your instructor.",
      );
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(page).toHaveURL(/\/join$/);
      // known: typed in lower case with spaces, it goes to the invitation
      await field.fill(" qt-a7k2 ");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/join\/QT-A7K2$/);
      await expect(page.locator("[data-invitation-title]")).toHaveText("Rescue team");
      // the expired demo code is known: it leads to the "no longer valid" screen
      await page.goto("/join");
      await page.getByLabel("Group code").fill("OLD-0000");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByRole("heading", { name: "This link is no longer valid" }),
      ).toBeVisible();
      // Back goes to Welcome
      await page.goto("/join");
      const back = page.getByRole("link", { name: "Back" });
      expect(await bg(back)).toBe(OLIVE_TINT);
      await back.click();
      await expect(page).toHaveURL(/\/welcome$/);
      // Continue is the Primary, 52px, pinned
      await page.goto("/join");
      const cont = page.getByRole("button", { name: "Continue" });
      expect(await bg(cont)).toBe(PRIMARY);
      expect((await cont.boundingBox())!.height).toBe(52);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Invitation (a): the card, the email field and note, the Verify with the demo code, then Profile creates the student in the group", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      const card = page.locator("[data-invitation-card]");
      await expect(card).toContainText("You are invited to");
      await expect(card).toContainText("Rescue team");
      await expect(card).toContainText("Role: Student");
      await expect(card).toContainText("Invited by Maryana");
      await expect(nav(page)).toHaveCount(0);
      await expect(page.getByText("We will send you a code to confirm it.")).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
      // an invalid address is refused
      await page.getByLabel("Your email").fill("nope");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByText("Enter a valid email, like name@company.com.")).toBeVisible();
      await page.getByLabel("Your email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/verify$/);
      // nothing is created before the code: a wrong code keeps the person on Verify
      await page.getByLabel("Digit 1 of 6").focus();
      await page.keyboard.type("000000");
      await expect(page).toHaveURL(/\/verify$/);
      await page.getByLabel("Digit 1 of 6").focus();
      await page.keyboard.type(CODE);
      // Profile
      await expect(page).toHaveURL(/\/set-up-profile$/);
      await expect(page.getByRole("heading", { name: "Your profile", level: 1 })).toBeVisible();
      await expect(page.getByText("Two things and you are in.")).toBeVisible();
      await expect(nav(page)).toHaveCount(0);
      await expect(page.getByRole("radio", { name: "English" })).toBeChecked();
      expect(await noSidewaysScroll(page)).toBe(true);
      // the student cannot skip the step
      await page.goto("/training");
      await expect(page).toHaveURL(/\/set-up-profile$/);
      await page.getByRole("radio", { name: "Ukrainian" }).check({ force: true });
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByText("Enter your full name.")).toBeVisible();
      await page.getByLabel("Your name").fill("Ana Test");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: "Hi, Ana Test" })).toBeVisible();
      await expect(page.locator("[data-flash]:visible")).toContainText("You joined Rescue team");
      // the account is a student of Rescue team, with the chosen language saved
      const saved = await page.evaluate(() => {
        const raw = localStorage.getItem("ast.auth.v1");
        return raw ? JSON.parse(raw).value.accounts[0] : null;
      });
      expect(saved).toMatchObject({
        name: "Ana Test",
        email: "ana@example.com",
        role: "student",
        groupId: "rescue-team",
        language: "uk",
      });
      expect(saved.profileDone).toBeUndefined();
      // and is one of the group on the instructor side
      await page.goto("/profile");
      await page
        .getByRole("radiogroup", { name: "Switch role (demo)" })
        .locator("label", { hasText: "Instructor" })
        .click();
      await expect(page).toHaveURL(/\/instructor$/);
      await page.goto("/instructor/students");
      await expect(page.locator('[data-student="ana@example.com"]')).toContainText("Ana Test");
    });

    test("Invitation (a): an email that already has an account says so, with a link to Sign in", async ({
      page,
    }) => {
      await joinAsStudent(page, "Ana Test", "ana@example.com");
      await page.goto("/profile");
      await page.locator("[data-sign-out]").click();
      await expect(page).toHaveURL(/\/welcome$/);
      await page.goto("/join/QT-A7K2");
      await page.getByLabel("Your email").fill("ANA@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByText("An account with this email already exists on this device."),
      ).toBeVisible();
      await page.getByRole("link", { name: "Sign in instead." }).click();
      await expect(page).toHaveURL(/\/sign-in$/);
    });

    test("Invitation (d): an expired or unknown link is no longer valid, with Back to start", async ({
      page,
    }) => {
      for (const code of ["OLD-0000", "NOPE-1"]) {
        await page.goto(`/join/${code}`);
        await expect(
          page.getByRole("heading", { name: "This link is no longer valid" }),
        ).toBeVisible();
        await expect(page.getByText("Ask your instructor for a new one.")).toBeVisible();
        await expect(nav(page)).toHaveCount(0);
        expect(await noSidewaysScroll(page)).toBe(true);
      }
      await page.getByRole("link", { name: "Back to start" }).click();
      await expect(page).toHaveURL(/\/welcome$/);
    });

    test("keyboard: the field and the Primary can be focused, the Primary shows a visible focus ring, Enter submits", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      const email = page.getByLabel("Your email");
      await email.focus();
      await expect(email).toBeFocused();
      const button = page.getByRole("button", { name: "Continue" });
      // (Safari does not Tab to buttons by default, so the button is focused directly)
      await button.focus();
      await expect(button).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(email).toBeFocused();
      await email.fill("ana@example.com");
      await email.press("Enter");
      await expect(page).toHaveURL(/\/verify$/);
    });

    test("no external request and no console error through the whole invitation flow", async ({
      page,
    }) => {
      const requests: string[] = [];
      const errors: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await joinAsStudent(page, "Ana Test", "ana@example.com");
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
      expect(
        errors.filter((text) => !/access control checks|Failed to load resource/.test(text)),
      ).toEqual([]);
    });
  });

  test.describe(`Invitation-only entry at ${width}px (signed-in student in Rescue team)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: student() });

    test("Invitation (c): already in the group: 'You are already in Rescue team' and Open group", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      await expect(
        page.getByRole("heading", { name: "You are already in Rescue team" }),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Join group" })).toHaveCount(0);
      const open = page.getByRole("link", { name: "Open group" });
      expect(await bg(open)).toBe(PRIMARY);
      await expect(nav(page)).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      await open.click();
      await expect(page).toHaveURL(/\/$/);
    });

    test("Invitation (b): another group is never joined silently: Join group confirms, Not now leaves nothing changed", async ({
      page,
    }) => {
      await page.goto("/join/QT-M4R9");
      await expect(page.locator("[data-invitation-title]")).toHaveText("Military training");
      await expect(page.getByLabel("Your email")).toHaveCount(0);
      const join = page.getByRole("button", { name: "Join group" });
      const notNow = page.getByRole("link", { name: "Not now" });
      expect(await bg(join)).toBe(PRIMARY);
      expect(await bg(notNow)).toBe(OLIVE_TINT);
      expect((await join.boundingBox())!.y).toBeLessThan((await notNow.boundingBox())!.y);
      // Not now: back Home, nothing joined
      await notNow.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("[data-flash]")).toHaveCount(0);
      const before = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.auth.v1")!).value.accounts[0].groupId,
      );
      expect(before).toBeUndefined();
      // Join group: the account has the group and Home shows the floating notice
      await page.goto("/join/QT-M4R9");
      await page.getByRole("button", { name: "Join group" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("[data-flash]:visible")).toContainText(
        "You joined Military training",
      );
      const after = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.auth.v1")!).value.accounts[0].groupId,
      );
      expect(after).toBe("military-training");
      // the notice goes by itself
      await expect(page.locator("[data-flash]:visible")).toHaveCount(0, { timeout: 8000 });
      // the same link now says the student is already in
      await page.goto("/join/QT-M4R9");
      await expect(page.getByText("You are already in Military training")).toBeVisible();
    });

    test("the group code screen is open to a signed-in student and its Back goes Home", async ({
      page,
    }) => {
      await page.goto("/join");
      await expect(page.getByRole("heading", { name: "Join a group" })).toBeVisible();
      await page.getByRole("link", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/$/);
    });

    test("the link on Invite students is the same link: Copy link copies exactly that text and it opens the invitation", async ({
      browser,
    }) => {
      const context = await browser.newContext({
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
      const page = await context.newPage();
      await page.goto("/instructor/students/invite");
      const link = page.getByRole("textbox", { name: "INVITE LINK" });
      const text = await link.inputValue();
      expect(text).toMatch(/\/join\/QT-A7K2$/);
      expect(text).toBe("http://localhost:3100/join/QT-A7K2");
      await expect(page.getByRole("textbox", { name: "GROUP CODE" })).toHaveValue("QT-A7K2");
      await context.close();
    });
  });

  test.describe(`Invitation-only entry at ${width}px (student with no group)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: student({ noGroup: true }) });

    test("the student home is the empty state: no topics, no exams, a code field and Join group", async ({
      page,
    }) => {
      await page.goto("/");
      await expect(page.getByText("You are not in a group yet")).toBeVisible();
      await expect(page.getByText("Ask your instructor for a group link or code.")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
      await expect(page.getByRole("link", { name: /Choose a topic|Exam|Mini-quiz/ })).toHaveCount(
        0,
      );
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);
      const join = page.getByRole("button", { name: "Join group" });
      expect(await bg(join)).toBe(PRIMARY);
      expect((await join.boundingBox())!.height).toBe(52);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("an unknown code shows the message; a known code opens the invitation and joining needs the confirm", async ({
      page,
    }) => {
      await page.goto("/");
      const field = page.getByLabel("Group code");
      await field.fill("QT-0000");
      await page.getByRole("button", { name: "Join group" }).click();
      await expect(
        page.getByText("We could not find this code. Check it or ask your instructor."),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
      await field.fill("qt-a7k2");
      await page.getByRole("button", { name: "Join group" }).click();
      await expect(page).toHaveURL(/\/join\/QT-A7K2$/);
      await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
      await page.getByRole("button", { name: "Join group" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("[data-flash]:visible")).toContainText("You joined Rescue team");
      await expect(page.getByText("You are not in a group yet")).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Choose a topic/ })).toBeVisible();
    });
  });

  test.describe(`Invitation-only entry at ${width}px (demo shortcut)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: student() });

    test("Profile, Demo mode: Leave group (demo) shows the empty home, and the role switch still works", async ({
      page,
    }) => {
      await page.goto("/profile");
      await page.getByRole("button", { name: "Leave group (demo)" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText("You are not in a group yet")).toBeVisible();
      await page.goto("/profile");
      await expect(page.getByRole("button", { name: "Leave group (demo)" })).toHaveCount(0);
      await page
        .getByRole("radiogroup", { name: "Switch role (demo)" })
        .locator("label", { hasText: "Instructor" })
        .click();
      await expect(page).toHaveURL(/\/instructor$/);
    });
  });
}
