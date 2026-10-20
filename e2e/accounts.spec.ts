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

async function finishOnboarding(page: Page, role: Role = "Student") {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
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
        page.getByRole("heading", { name: "Train for real situations", level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByText("Short scenarios, quizzes and exams for building evacuation and first aid."),
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
      await expect(page.getByText("We sent a 6-digit code to ana@example.com.")).toBeVisible();
      // a wrong code, typed: the sixth digit submits at once
      await typeCode(page, "000000");
      await expect(
        page.getByText("That code is not correct. Check the code shown below."),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/verify$/);
      // the demo code card is still there
      await expect(page.locator("[data-demo-code]")).toContainText("482 913");
      // the boxes keep their digits, selected for retyping: the first box has the focus
      await expect(page.getByLabel("Digit 1 of 6")).toBeFocused();
      await expect(page.getByLabel("Digit 6 of 6")).toHaveValue("0");
      await typeCode(page, CODE);
      await finishOnboarding(page);
      await expect(page.getByRole("heading", { name: "Hi, Ana Test" })).toBeVisible();
      await expect(nav(page).getByRole("link")).toHaveCount(4);
    });

    test("signing up as an instructor reaches Instructor Home", async ({ page }) => {
      await signUp(page, "Ines Instructor", "ines@example.com", "Instructor");
      await finishOnboarding(page, "Instructor");
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
      await finishOnboarding(page, "Instructor");
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
      // she has seen the introduction: Home of a student
      await expect(page).toHaveURL(/\/$/);
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
      await expect(card).toContainText("Demo: no email is sent");
      await expect(card).toContainText("482 913");
      const resend = page.getByRole("button", { name: /^Resend code/ });
      await expect(resend).toBeDisabled();
      await expect(resend).toHaveText("Resend code (0:30)");
      await page.clock.runFor(10_000);
      await expect(resend).toHaveText("Resend code (0:20)");
      await page.clock.runFor(21_000);
      await expect(resend).toHaveText("Resend code");
      await expect(resend).toBeEnabled();
      await resend.click();
      await expect(page.getByText("A new code was sent")).toBeVisible();
      await expect(page.getByRole("button", { name: /^Resend code \(/ })).toBeDisabled();
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
      const check = async (path: string, primary: string | null, bottomMax = 24) => {
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
            expect(box.height).toBe(52);
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
        }
        // pinned: the last control sits one gutter above the bottom (the safe area is 0 here)
        const controls = await page.locator("main button:visible, main a:visible").all();
        const last = (await controls[controls.length - 1].boundingBox())!;
        // (a long page scrolls: look at the bottom of the page then)
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const scrolled = (await controls[controls.length - 1].boundingBox())!;
        const below = 800 - (scrolled.y + scrolled.height);
        void last;
        expect(below, path).toBeGreaterThanOrEqual(0);
        expect(below, path).toBeLessThanOrEqual(bottomMax);
        // tap targets are at least 44px (the 40px round Back of the header is the one exception)
        for (const control of controls) {
          const label = (await control.getAttribute("aria-label")) ?? "";
          if (label.startsWith("Back")) continue;
          expect((await control.boundingBox())!.height, `${path} ${label}`).toBeGreaterThanOrEqual(
            44,
          );
        }
      };
      // (Welcome ends with the 12px note under the buttons)
      await check("/welcome", null, 64);
      await check("/sign-up", "Continue");
      await check("/sign-in", "Continue");
      await startSignUp(page, "Ana Test", "ana@example.com");
      expect(await noSidewaysScroll(page)).toBe(true);
      const boxes = await page.locator("main input[aria-label^=Digit]").all();
      expect(boxes).toHaveLength(6);
      const first = (await boxes[0].boundingBox())!;
      const lastBox = (await boxes[5].boundingBox())!;
      // six boxes in one row, 56px high, 8px apart, inside the gutters (no overflow at 360px)
      for (const box of boxes) {
        const size = (await box.boundingBox())!;
        expect(size.height).toBe(56);
        expect(size.width).toBeLessThanOrEqual(52);
        expect(size.width).toBeGreaterThanOrEqual(44);
        expect(size.y).toBe(first.y);
      }
      expect(first.x).toBeGreaterThanOrEqual(16 - 0.5);
      expect(lastBox.x + lastBox.width).toBeLessThanOrEqual(width - 16 + 0.5);
      const second = (await boxes[1].boundingBox())!;
      expect(Math.abs(second.x - (first.x + first.width) - 8)).toBeLessThanOrEqual(0.5);
      const verify = (await page.getByRole("button", { name: "Verify" }).boundingBox())!;
      expect(verify.height).toBe(52);
      expect(Math.abs(verify.x - 16)).toBeLessThanOrEqual(0.5);
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

    test("Welcome: the hero panel, the 220 by 220 slot, the centred text and the pinned buttons", async ({
      page,
    }) => {
      await page.goto("/welcome");
      const panel = page.locator("[data-hero-panel]");
      await expect(panel).toBeVisible();
      const box = (await panel.boundingBox())!;
      // full-bleed to the top and both sides, the height within clamp(280px, 46dvh, 380px)
      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
      expect(box.width).toBe(width);
      const wanted = Math.min(380, Math.max(280, 0.46 * 800));
      expect(Math.abs(box.height - wanted)).toBeLessThanOrEqual(1);
      expect(box.height).toBeGreaterThanOrEqual(280);
      expect(box.height).toBeLessThanOrEqual(380);
      const look = await panel.evaluate((el) => {
        const css = getComputedStyle(el);
        return {
          bg: css.backgroundColor,
          border: [css.borderBottomWidth, css.borderBottomColor],
          radius: [
            css.borderBottomLeftRadius,
            css.borderBottomRightRadius,
            css.borderTopLeftRadius,
          ],
        };
      });
      expect(look.bg).toBe("rgb(240, 236, 230)");
      expect(look.border).toEqual(["1px", "rgb(228, 223, 213)"]);
      expect(look.radius).toEqual(["32px", "32px", "0px"]);
      // the 3D slot: exactly 220 by 220, centred in the panel (2px), a dashed decorative placeholder
      const slot = page.locator("[data-hero-panel] [data-media3d]");
      const s = (await slot.boundingBox())!;
      expect([s.width, s.height]).toEqual([220, 220]);
      expect(Math.abs(s.x + s.width / 2 - (box.x + box.width / 2))).toBeLessThanOrEqual(2);
      expect(Math.abs(s.y + s.height / 2 - (box.y + box.height / 2))).toBeLessThanOrEqual(2);
      expect(await slot.getAttribute("aria-hidden")).toBe("true");
      await expect(slot).toHaveText("3D");
      // the text is centred, the eyebrow above the title, no header and no navigation
      const eyebrow = (await page.locator("[data-eyebrow]").boundingBox())!;
      const title = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
      expect(eyebrow.y).toBeLessThan(title.y);
      for (const el of [eyebrow, title]) {
        expect(Math.abs(el.x + el.width / 2 - width / 2)).toBeLessThanOrEqual(1);
      }
      const subtitle = page.getByText("Short scenarios, quizzes and exams");
      const sub = (await subtitle.boundingBox())!;
      expect(sub.width).toBeLessThanOrEqual(320);
      expect(Math.abs(sub.x + sub.width / 2 - width / 2)).toBeLessThanOrEqual(1);
      await expect(page.getByRole("banner")).toHaveCount(0);
      await expect(nav(page)).toHaveCount(0);
      // both buttons are 52px high and pinned, 12px apart
      const create = (await page.getByRole("link", { name: "Create account" }).boundingBox())!;
      const have = (await page
        .getByRole("link", { name: "I already have an account" })
        .boundingBox())!;
      expect([create.height, have.height]).toEqual([52, 52]);
      expect(Math.abs(have.y - (create.y + create.height) - 12)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(create.x - 16)).toBeLessThanOrEqual(0.5);
      const note = (await page
        .getByText("For educational use. Demo data stays on this device.")
        .boundingBox())!;
      expect(note.y).toBeGreaterThan(have.y + have.height);
      expect(800 - (note.y + note.height)).toBeLessThanOrEqual(24 + 4);
      expect(await noSidewaysScroll(page)).toBe(true);
      // the secondary is the olive tint, the primary the deep olive
      expect(
        await page
          .getByRole("link", { name: "I already have an account" })
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe("rgb(224, 230, 214)");
      expect(
        await page
          .getByRole("link", { name: "Create account" })
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe("rgb(63, 70, 56)");
    });

    test("Create account: no autofocus, the header, the Student card preselected, keyboard selectable", async ({
      page,
    }) => {
      await page.goto("/sign-up");
      await expect(
        page.getByRole("heading", { name: "Create your account", level: 1 }),
      ).toBeVisible();
      await expect(page.getByText("It takes less than a minute.")).toBeVisible();
      await expect(page.locator("[data-form-step]:visible")).toHaveText("Step 1 of 2");
      expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
      const back = (await page.getByRole("link", { name: "Back to Welcome" }).boundingBox())!;
      expect([back.width, back.height]).toEqual([40, 40]);
      // the role cards: 72px high, Student preselected, Arrow keys move the choice
      const student = page.getByRole("radio", { name: /Student/ });
      const instructor = page.getByRole("radio", { name: /Instructor/ });
      await expect(student).toBeChecked();
      for (const card of await page
        .locator("label", { hasText: /Learn, practise|Create exams/ })
        .all()) {
        expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(72);
      }
      await student.focus();
      await page.keyboard.press("ArrowDown");
      await expect(instructor).toBeChecked();
      await page.keyboard.press("ArrowUp");
      await expect(student).toBeChecked();
      // the link under the button
      await expect(
        page.getByRole("link", { name: "Already have an account? Sign in" }),
      ).toBeVisible();
    });

    test("Sign in: the header, the title, the subtitle and the link to Create account", async ({
      page,
    }) => {
      await page.goto("/sign-in");
      await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
      await expect(page.getByText("Enter your work email. We will send you a code.")).toBeVisible();
      await expect(page.locator("[data-form-step]:visible")).toHaveText("Step 1 of 2");
      await page.getByRole("link", { name: "New here? Create an account" }).click();
      await expect(page).toHaveURL(/\/sign-up$/);
    });

    test("Verify: the first box has the focus, Fill in code fills and signs in, Verify needs six digits", async ({
      page,
    }) => {
      await startSignUp(page, "Ana Test", "ana@example.com");
      await expect(page.getByLabel("Digit 1 of 6")).toBeFocused();
      await expect(page.locator("[data-form-step]:visible")).toHaveText("Step 2 of 2");
      const verify = page.getByRole("button", { name: "Verify" });
      await expect(verify).toBeDisabled();
      // the 80 by 80 slot sits left aligned above the title
      const slot = (await page
        .locator("main [data-media3d]:visible:not([data-hero-panel] *)")
        .boundingBox())!;
      expect([slot.width, slot.height]).toEqual([80, 80]);
      expect(Math.abs(slot.x - 16)).toBeLessThanOrEqual(0.5);
      const title = (await page.getByRole("heading", { name: "Check your email" }).boundingBox())!;
      expect(slot.y + slot.height).toBeLessThanOrEqual(title.y);
      // some digits: still disabled; Fill in code fills all six and submits
      await page.keyboard.type("48");
      await expect(verify).toBeDisabled();
      const fillButton = page.getByRole("button", { name: "Fill in code" });
      expect((await fillButton.boundingBox())!.height).toBe(44);
      await fillButton.click();
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test("Verify: the Verify button submits the typed digits", async ({ page }) => {
      await startSignUp(page, "Ana Test", "ana@example.com");
      await page.getByLabel("Digit 1 of 6").focus();
      await page.keyboard.type("48291");
      await expect(page.getByRole("button", { name: "Verify" })).toBeDisabled();
      await page.getByLabel("Digit 6 of 6").fill("4");
      await expect(
        page.getByText("That code is not correct. Check the code shown below."),
      ).toBeVisible();
      for (let n = 1; n <= 6; n++) {
        await expect(page.getByLabel(`Digit ${n} of 6`)).toHaveAttribute("aria-invalid", "true");
      }
      // the error state uses the registered wrong border, an icon with the text
      const border = await page
        .getByLabel("Digit 1 of 6")
        .evaluate((el) => getComputedStyle(el).borderTopColor);
      expect(rgb(border).a).toBeGreaterThan(0);
      expect(border).not.toBe("rgb(0, 0, 0)");
      await expect(page.locator("#code-error svg")).toBeVisible();
    });

    test("Verify: filled digits have the olive border", async ({ page }) => {
      await startSignUp(page, "Ana Test", "ana@example.com");
      await page.getByLabel("Digit 1 of 6").focus();
      await page.keyboard.type("48");
      const filled = await page
        .getByLabel("Digit 1 of 6")
        .evaluate((el) => getComputedStyle(el).borderTopColor);
      const empty = await page
        .getByLabel("Digit 4 of 6")
        .evaluate((el) => getComputedStyle(el).borderTopColor);
      expect(filled).toBe("rgb(63, 70, 56)");
      expect(empty).not.toBe(filled);
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
