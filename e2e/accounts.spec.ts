import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { emptyBrowser } from "./auth-seed";

const CODE = "482913";

type Role = "Student" | "Instructor";

/** Creates an account through the screens and stops on Verify. */
async function startSignUp(page: Page, name: string, email: string, role: Role = "Student") {
  await page.goto("/welcome");
  await page.getByRole("link", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  if (role === "Instructor") await page.getByText("Instructor", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/verify$/);
}

/** Types the code into the boxes (typing moves from box to box). */
async function typeCode(page: Page, code: string) {
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(code);
}

async function signUp(page: Page, name: string, email: string, role: Role = "Student") {
  await startSignUp(page, name, email, role);
  await typeCode(page, CODE);
}

async function signIn(page: Page, email: string) {
  await page.goto("/welcome");
  await page.getByRole("link", { name: "I already have an account" }).click();
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await typeCode(page, CODE);
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const rgb = (value: string) => {
  const match = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(value)!;
  return { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] };
};

const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });

async function finishOnboarding(page: Page) {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByText("Skip", { exact: true }).first().click();
  await expect(page).toHaveURL(/\/$/);
}

test.use({ storageState: emptyBrowser });

for (const width of [360, 430]) {
  test.describe(`Accounts at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("a new visitor lands on Welcome from any route, with no navigation", async ({ page }) => {
      for (const path of [
        "/",
        "/training",
        "/progress",
        "/profile",
        "/instructor",
        "/notifications",
      ]) {
        await page.goto(path);
        await expect(page, path).toHaveURL(/\/welcome$/);
      }
      await expect(
        page.getByRole("heading", { name: "AI Scenario Trainer", level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Practise decisions in a scenario built from a study guide, then review your errors with links to the source.",
        ),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Create account" })).toBeVisible();
      await expect(page.getByRole("link", { name: "I already have an account" })).toBeVisible();
      await expect(nav(page)).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("signing up as a student: a wrong code, then the right code, the introduction and Home", async ({
      page,
    }) => {
      await startSignUp(page, "Ana Test", "Ana@Example.com");
      await expect(page.getByText("We sent a 6-digit code to ana@example.com")).toBeVisible();
      // a wrong code, typed: the sixth digit submits at once
      await typeCode(page, "000000");
      await expect(
        page.getByText("That code is not correct. Check the code shown above."),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/verify$/);
      // the demo code card is still there
      await expect(page.getByText("Demo: no email is sent. Your code is 482 913.")).toBeVisible();
      // fix the last digit: the right code
      await page.getByLabel("Digit 6 of 6").focus();
      await page.keyboard.press("Backspace");
      await page.keyboard.type("0".replace("0", "0"));
      for (let n = 1; n <= 6; n++) await page.getByLabel(`Digit ${n} of 6`).fill("");
      await typeCode(page, CODE);
      await finishOnboarding(page);
      await expect(page.getByRole("heading", { name: "Hi, Ana Test" })).toBeVisible();
      await expect(nav(page).getByRole("link")).toHaveCount(4);
    });

    test("signing up as an instructor reaches Instructor Home", async ({ page }) => {
      await signUp(page, "Ines Instructor", "ines@example.com", "Instructor");
      await expect(page).toHaveURL(/\/instructor$/);
      await expect(page.getByRole("heading", { name: "Instructor", level: 1 })).toBeVisible();
      await expect(nav(page).getByRole("link")).toHaveCount(2);
    });

    test("editing the name shows it on Profile and on Home", async ({ page }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await expect(page.locator("[data-user-name]")).toHaveText("Ana Test");
      await expect(page.locator("[data-user-email]")).toHaveText("ana@example.com");
      await expect(page.locator("[data-role-label]")).toHaveText("Student");
      await page.locator("[data-user-card]").click();
      await expect(page).toHaveURL(/\/profile\/edit$/);
      await expect(page.getByRole("heading", { name: "Edit profile", level: 1 })).toBeVisible();
      const save = page.getByRole("button", { name: "Save changes" });
      await expect(save).toBeDisabled();
      // the email and the role are read-only
      await expect(page.getByLabel("Work email")).toHaveJSProperty("readOnly", true);
      await expect(
        page.getByText("Email changes need verification and are not available in this demo."),
      ).toBeVisible();
      await expect(
        page.getByText(
          "Your role is set by your organisation. Use Demo mode in Profile to switch.",
        ),
      ).toBeVisible();
      await page.getByLabel("Full name").fill("Ana Maria");
      await expect(save).toBeEnabled();
      await save.click();
      await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.locator("[data-user-name]")).toHaveText("Ana Maria");
      await page.getByRole("link", { name: "Home" }).click();
      await expect(page.getByRole("heading", { name: "Hi, Ana Maria" })).toBeVisible();
    });

    test("leaving Edit profile with unsaved changes just goes back", async ({ page }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile/edit");
      await page.getByLabel("Full name").fill("Someone Else");
      await page.getByRole("link", { name: "Back to Profile" }).click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.locator("[data-user-name]")).toHaveText("Ana Test");
    });

    test("signing out keeps the data: signing in again with the same email gives the same account", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await page.locator("[data-sign-out]").click();
      await expect(page).toHaveURL(/\/welcome$/);
      await expect(page).toHaveURL(/\/welcome$/);
      await page.goto("/profile");
      await expect(page).toHaveURL(/\/welcome$/);
      // the same email, in other letters
      await signIn(page, "ANA@example.com");
      // no introduction again (her profile is saved) and the same name
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: "Hi, Ana Test" })).toBeVisible();
    });

    test("each account has its own progress: a second account starts fresh", async ({ page }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await page.locator("[data-sign-out]").click();
      await expect(page).toHaveURL(/\/welcome$/);
      await signUp(page, "Bob Test", "bob@example.com");
      // Bob has not seen the introduction
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test("an unknown email says so, with a link to Create account", async ({ page }) => {
      await page.goto("/sign-in");
      await page.getByLabel("Work email").fill("nobody@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByText("No account found on this device.", { exact: false }),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/sign-in$/);
      const link = page.getByRole("link", { name: "Create one." });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/sign-up$/);
    });

    test("signing up with an email that already has an account makes no duplicate", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await page.locator("[data-sign-out]").click();
      await expect(page).toHaveURL(/\/welcome$/);
      await page.goto("/sign-up");
      await page.getByLabel("Full name").fill("Another Ana");
      await page.getByLabel("Work email").fill(" ANA@example.com ");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByText("An account with this email already exists on this device."),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/sign-up$/);
      const link = page.getByRole("link", { name: "Sign in instead." });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(/\/sign-in$/);
    });

    test("Delete account: Cancel does nothing, Delete goes to Welcome and the account is gone", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await page.locator("[data-delete-account]").click();
      await expect(page.getByText("Delete account?")).toBeVisible();
      await expect(
        page.getByText(
          "Delete this account and its progress from this device? This cannot be undone.",
        ),
      ).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page.getByText("Delete account?")).not.toBeVisible();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.locator("[data-user-name]")).toHaveText("Ana Test");
      await page.locator("[data-delete-account]").click();
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await expect(page).toHaveURL(/\/welcome$/);
      await page.goto("/sign-in");
      await page.getByLabel("Work email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(
        page.getByText("No account found on this device.", { exact: false }),
      ).toBeVisible();
    });

    test("the instructor Profile has Delete account and Sign out, and the role switch still works", async ({
      page,
    }) => {
      await signUp(page, "Ines Instructor", "ines@example.com", "Instructor");
      await page.getByRole("link", { name: "Profile" }).click();
      await expect(page.locator("[data-delete-account]")).toBeVisible();
      await expect(page.locator("[data-sign-out]")).toBeVisible();
      await expect(page.getByText("Reset progress")).toHaveCount(0);
      await expect(page.getByText("Direction", { exact: true })).toHaveCount(0);
      // Demo mode: back to Student opens Home
      await page
        .getByRole("radiogroup", { name: "Switch role (demo)" })
        .locator("label", { hasText: "Student" })
        .click();
      // a new student has not seen the introduction yet
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test("the guards: a signed-in person is sent from the auth routes to their Home", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      for (const path of ["/welcome", "/sign-up", "/sign-in", "/verify"]) {
        await page.goto(path);
        await expect(page, path).toHaveURL(/\/$/);
      }
      await page.goto("/instructor");
      await expect(page).toHaveURL(/\/$/);
    });

    test("verify: pasting six digits fills the boxes and signs in", async ({ page }) => {
      await startSignUp(page, "Ana Test", "ana@example.com");
      await page.getByLabel("Digit 3 of 6").focus();
      await page.evaluate((code) => {
        const box = document.activeElement as HTMLInputElement;
        const data = new DataTransfer();
        data.setData("text", code);
        box.dispatchEvent(
          new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
        );
      }, CODE);
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test("verify: Backspace goes back and clears the previous box", async ({ page }) => {
      await startSignUp(page, "Ana Test", "ana@example.com");
      await page.getByLabel("Digit 1 of 6").focus();
      await page.keyboard.type("48");
      await expect(page.getByLabel("Digit 2 of 6")).toHaveValue("8");
      await expect(page.getByLabel("Digit 3 of 6")).toBeFocused();
      await page.keyboard.press("Backspace");
      await expect(page.getByLabel("Digit 2 of 6")).toBeFocused();
      await expect(page.getByLabel("Digit 2 of 6")).toHaveValue("");
      await expect(page.getByLabel("Digit 1 of 6")).toHaveValue("4");
    });

    test("verify: the demo code card is always visible, and Resend waits 30 seconds", async ({
      page,
    }) => {
      await page.clock.install();
      await startSignUp(page, "Ana Test", "ana@example.com");
      const card = page.locator("[data-demo-code]");
      await expect(card).toBeVisible();
      await expect(card).toContainText("Demo: no email is sent. Your code is 482 913.");
      const resend = page.getByRole("button", { name: /^Resend code/ });
      await expect(resend).toBeDisabled();
      await expect(resend).toHaveText("Resend code in 30 s");
      await page.clock.runFor(10_000);
      await expect(resend).toHaveText("Resend code in 20 s");
      await page.clock.runFor(21_000);
      await expect(resend).toHaveText("Resend code");
      await expect(resend).toBeEnabled();
      await resend.click();
      await expect(page.getByText("A new code was sent")).toBeVisible();
      await expect(page.getByRole("button", { name: /^Resend code in/ })).toBeDisabled();
      await expect(card).toBeVisible();
    });

    test("verify: Change email goes back with the typed values", async ({ page }) => {
      await startSignUp(page, "Ana Test", "ana@example.com", "Instructor");
      await page.getByRole("button", { name: "Change email" }).click();
      await expect(page).toHaveURL(/\/sign-up$/);
      await expect(page.getByLabel("Full name")).toHaveValue("Ana Test");
      await expect(page.getByLabel("Work email")).toHaveValue("ana@example.com");
      await expect(page.getByRole("radio", { name: /Instructor/ })).toBeChecked();
    });

    test("verify without a pending verification goes to Welcome", async ({ page }) => {
      await page.goto("/verify");
      await expect(page).toHaveURL(/\/welcome$/);
    });

    test("forms: Enter submits, errors show on blur and on submit with aria wiring", async ({
      page,
    }) => {
      await page.goto("/sign-up");
      const name = page.getByLabel("Full name");
      const email = page.getByLabel("Work email");
      // blur: a name of one character
      await name.fill("A");
      await email.focus();
      await expect(page.getByText("Your name needs at least 2 characters.")).toBeVisible();
      await expect(name).toHaveAttribute("aria-invalid", "true");
      const describedBy = await name.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      await expect(page.locator(`[id="${describedBy!.split(" ")[0]}"]`)).toContainText(
        "at least 2 characters",
      );
      // blur: a wrong email
      await email.fill("nope");
      await name.focus();
      await expect(page.getByText("Enter a valid email, like name@company.com.")).toBeVisible();
      await expect(email).toHaveAttribute("aria-invalid", "true");
      // the message has an icon (not colour alone) and a visible, non-black, non-transparent colour
      const message = page.locator("p[aria-live=polite]", { hasText: "valid email" });
      await expect(message.locator("svg")).toBeVisible();
      const colour = await message.evaluate((el) => getComputedStyle(el).color);
      expect(rgb(colour).a).toBeGreaterThan(0);
      expect(colour).not.toBe("rgb(0, 0, 0)");
      // Enter in a field submits: the invalid form focuses the first invalid field
      await name.fill("Ana Test");
      await email.fill("ana@example.com");
      await email.press("Enter");
      await expect(page).toHaveURL(/\/verify$/);
    });

    test("submitting an empty form shows both errors and focuses the name", async ({ page }) => {
      await page.goto("/sign-up");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByText("Enter your full name.")).toBeVisible();
      await expect(page.getByText("Enter your work email.")).toBeVisible();
      await expect(page.getByLabel("Full name")).toBeFocused();
      await expect(page).toHaveURL(/\/sign-up$/);
    });

    test("sign in: Enter submits and an invalid email is not accepted", async ({ page }) => {
      await page.goto("/sign-in");
      const email = page.getByLabel("Work email");
      await email.fill("bad");
      await email.press("Enter");
      await expect(page.getByText("Enter a valid email, like name@company.com.")).toBeVisible();
      await expect(page).toHaveURL(/\/sign-in$/);
    });

    test("layout: no sideways scroll, 16px gutters, 52px Primary pinned at the bottom, 44px tap targets, visible labels", async ({
      page,
    }) => {
      const check = async (path: string, primary: string | null) => {
        await page.goto(path);
        await page.waitForTimeout(300);
        expect(await noSidewaysScroll(page), path).toBe(true);
        for (const field of await page
          .locator("main input[type=text], main input[type=email]")
          .all()) {
          const box = (await field.boundingBox())!;
          if (box.width > 100) {
            expect(Math.abs(box.x - 16), path).toBeLessThanOrEqual(0.5);
            expect(Math.abs(width - (box.x + box.width) - 16), path).toBeLessThanOrEqual(0.5);
            expect(box.height).toBeGreaterThanOrEqual(48);
          }
        }
        // every field has a visible label
        for (const label of await page.locator("main label[for]").all()) {
          expect(await label.isVisible()).toBe(true);
        }
        if (primary) {
          const button = page.getByRole("button", { name: primary }).first();
          const box = (await button.boundingBox())!;
          expect(box.height).toBe(52);
          expect(Math.abs(box.x - 16)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(width - (box.x + box.width) - 16)).toBeLessThanOrEqual(0.5);
          // pinned: the gutter below it (the safe area is 0 here)
          const below = 800 - (box.y + box.height);
          expect(below, path).toBeGreaterThanOrEqual(16);
          expect(below, path).toBeLessThanOrEqual(24);
        }
        for (const control of await page.locator("main button:visible, main a:visible").all()) {
          expect((await control.boundingBox())!.height, path).toBeGreaterThanOrEqual(40);
        }
      };
      await check("/welcome", null);
      await check("/sign-up", "Continue");
      await check("/sign-in", "Continue");
      await startSignUp(page, "Ana Test", "ana@example.com");
      expect(await noSidewaysScroll(page)).toBe(true);
      for (const box of await page.locator("main input[aria-label^=Digit]").all()) {
        const size = (await box.boundingBox())!;
        expect(size.height).toBeGreaterThanOrEqual(48);
        expect(size.width).toBeGreaterThanOrEqual(40);
      }
      // the role cards are tall enough to tap
      await page.goBack();
    });

    test("layout: Edit profile and Profile keep the gutters, the pinned Save is 52px high", async ({
      page,
    }) => {
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile/edit");
      await page.getByLabel("Full name").fill("Ana Maria");
      const save = (await page.getByRole("button", { name: "Save changes" }).boundingBox())!;
      expect(save.height).toBe(52);
      expect(Math.abs(save.x - 16)).toBeLessThanOrEqual(0.5);
      const below = 800 - (save.y + save.height);
      expect(below).toBeGreaterThanOrEqual(16);
      expect(below).toBeLessThanOrEqual(24);
      expect(await noSidewaysScroll(page)).toBe(true);
      await page.goto("/profile");
      expect(await noSidewaysScroll(page)).toBe(true);
      const card = (await page.locator("[data-user-card]").boundingBox())!;
      expect(Math.abs(card.x - 16)).toBeLessThanOrEqual(0.5);
      expect(card.height).toBeGreaterThanOrEqual(44);
    });

    test("colours come from the registered tokens: the Primary and the code boxes are not transparent or black", async ({
      page,
    }) => {
      await page.goto("/welcome");
      const fill = await page
        .getByRole("link", { name: "Create account" })
        .evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(fill).toBe("rgb(63, 70, 56)");
      await startSignUp(page, "Ana Test", "ana@example.com");
      const box = await page
        .getByLabel("Digit 1 of 6")
        .evaluate((el) => [getComputedStyle(el).backgroundColor, getComputedStyle(el).color]);
      expect(box[0]).toBe("rgb(255, 255, 255)");
      expect(rgb(box[1]).a).toBeGreaterThan(0);
      expect(box[1]).not.toBe("rgb(0, 0, 0)");
    });

    test("no external network request during the whole flow", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await page.locator("[data-sign-out]").click();
      await expect(page).toHaveURL(/\/welcome$/);
      await signIn(page, "ana@example.com");
      const outside = requests.filter((url) => !url.startsWith("http://localhost:3100"));
      expect(outside).toEqual([]);
    });

    test("no console errors in the flow", async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await signUp(page, "Ana Test", "ana@example.com");
      await finishOnboarding(page);
      await page.goto("/profile");
      await page.locator("[data-user-card]").click();
      expect(
        errors.filter((message) => !/access control checks|Failed to load resource/.test(message)),
      ).toEqual([]);
    });
  });
}
