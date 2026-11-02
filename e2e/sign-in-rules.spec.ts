import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { emptyBrowser } from "./auth-seed";

const CODE = "482913";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });

async function signInWith(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
}

async function typeCode(page: Page, code: string) {
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(code);
}

const pendingOf = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem("ast.auth.v1");
    return raw ? JSON.parse(raw).value.pending : null;
  });

for (const width of [360, 430]) {
  test.describe(`Sign-in rules at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("lena@example.org: an active student in Rescue team: the code screen, then the student home (matching ignores case and spaces)", async ({
      page,
    }) => {
      await signInWith(page, "  LENA@Example.org ");
      await expect(page).toHaveURL(/\/verify$/);
      await expect(page.getByText("We sent a 6-digit code to lena@example.org.")).toBeVisible();
      await typeCode(page, CODE);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: "Hi, Lena" })).toBeVisible();
      await expect(page.getByText("You are not in a group yet")).toHaveCount(0);
      await expect(nav(page).getByRole("link")).toHaveCount(4);
    });

    test("kofi@example.org: an active student with no group: the code works and the home is the empty state", async ({
      page,
    }) => {
      await signInWith(page, "kofi@example.org");
      await expect(page).toHaveURL(/\/verify$/);
      await typeCode(page, CODE);
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText("You are not in a group yet")).toBeVisible();
      await expect(page.getByText("Ask your instructor for a group link or code.")).toBeVisible();
      await expect(page.getByLabel("Group code")).toBeVisible();
      await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("pavel@example.org: deactivated: no code is sent, the screen stays on the email step", async ({
      page,
    }) => {
      await signInWith(page, "PAVEL@example.org");
      await expect(
        page.getByText("This account is not active. Contact your administrator."),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/sign-in$/);
      expect(await pendingOf(page)).toBeNull();
      // the field says so with the error wiring
      await expect(page.getByLabel("Work email")).toHaveAttribute("aria-invalid", "true");
      await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
      // typing again clears the message
      await page.getByLabel("Work email").fill("lena@example.org");
      await expect(page.getByText("This account is not active.")).toHaveCount(0);
    });

    test("any other email is unknown, with the new wording and no second group code link; an invalid address asks for a check", async ({
      page,
    }) => {
      await signInWith(page, "nobody@example.org");
      await expect(
        page.getByText(
          "We could not find an account for this email. Ask your instructor for an invitation link.",
        ),
      ).toBeVisible();
      await expect(page).toHaveURL(/\/sign-in$/);
      expect(await pendingOf(page)).toBeNull();
      // "Have a group code?" appears once, under Continue
      const link = page.getByRole("link", { name: "Have a group code?" });
      await expect(link).toHaveCount(1);
      const button = await page.getByRole("button", { name: "Continue" }).boundingBox();
      const l = (await link.boundingBox())!;
      expect(l.y).toBeGreaterThan(button!.y + button!.height - 1);
      expect(l.height).toBeGreaterThanOrEqual(44);
      expect(await noSidewaysScroll(page)).toBe(true);
      // an invalid address
      await page.getByLabel("Work email").fill("lena@");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByText("Check this email address.")).toBeVisible();
      await expect(page).toHaveURL(/\/sign-in$/);
    });

    test("the entry screens never say device, browser or storage", async ({ page }) => {
      for (const path of ["/welcome", "/sign-in", "/join", "/join/QT-A7K2", "/join/OLD-0000"]) {
        await page.goto(path);
        const text = await page.locator("main").innerText();
        expect(text, path).not.toMatch(/\b(device|browser|storage)\b/i);
      }
      // the messages that appear on them
      await signInWith(page, "nobody@example.org");
      expect(await page.locator("main").innerText()).not.toMatch(/\b(device|browser|storage)\b/i);
      await page.goto("/join/QT-A7K2");
      await page.getByLabel("Your email").fill("lena@example.org");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/verify$/);
      expect(await page.locator("main").innerText()).not.toMatch(/\b(device|browser|storage)\b/i);
    });

    test("the code screen: the muted line under the boxes, the demo code and the resend wording", async ({
      page,
    }) => {
      await signInWith(page, "lena@example.org");
      const line = page.getByText("The code proves this email is yours.");
      await expect(line).toBeVisible();
      const boxes = (await page.getByLabel("Digit 6 of 6").boundingBox())!;
      const lineBox = (await line.boundingBox())!;
      expect(lineBox.y).toBeGreaterThan(boxes.y + boxes.height);
      await expect(page.locator("[data-demo-code]")).toContainText("482 913");
      await expect(page.getByRole("button", { name: /^Resend code/ })).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("five wrong codes lock the boxes for a minute with a countdown; a screen reader hears it every 10 seconds at most; the field works again after", async ({
      page,
    }) => {
      await page.clock.install();
      await signInWith(page, "lena@example.org");
      await expect(page).toHaveURL(/\/verify$/);
      // four wrong codes: the usual message, the boxes stay open
      for (let n = 1; n <= 4; n++) {
        await typeCode(page, `${n}00000`);
        await expect(
          page.getByText("That code is not correct. Check the code shown below."),
        ).toBeVisible();
        await expect(page.getByLabel("Digit 1 of 6")).toBeEnabled();
      }
      // the fifth locks
      await typeCode(page, "500000");
      await expect(page.getByText("Too many attempts. Try again in a minute.")).toBeVisible();
      for (let n = 1; n <= 6; n++) await expect(page.getByLabel(`Digit ${n} of 6`)).toBeDisabled();
      await expect(page.getByRole("button", { name: "Verify" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Fill in code" })).toBeDisabled();
      await expect(page).toHaveURL(/\/verify$/);
      expect(await noSidewaysScroll(page)).toBe(true);
      // the countdown is visible and goes down; the live line changes at most every 10 seconds
      const countdown = page.locator("[data-lock-countdown]");
      const live = page.locator("[data-lock-live]");
      await expect(live).toHaveAttribute("aria-live", "polite");
      await expect(countdown).toHaveAttribute("aria-hidden", "true");
      const seen: string[] = [];
      const heard: string[] = [];
      for (let second = 1; second <= 55; second++) {
        await page.clock.runFor(1000);
        seen.push(await countdown.innerText());
        heard.push(await live.innerText());
      }
      expect(new Set(seen).size).toBeGreaterThanOrEqual(54);
      expect(seen[0]).toMatch(/^(1:00|0:5\d)$/);
      expect(new Set(heard).size).toBeLessThanOrEqual(7);
      const changes = heard.filter((text, i) => i > 0 && text !== heard[i - 1]).length;
      expect(changes).toBeLessThanOrEqual(6);
      // still locked a few seconds before the end, open after the minute
      await expect(page.getByLabel("Digit 1 of 6")).toBeDisabled();
      await page.clock.runFor(6000);
      await expect(page.getByLabel("Digit 1 of 6")).toBeEnabled();
      await expect(page.getByLabel("Digit 1 of 6")).toBeFocused();
      await expect(page.getByText("Too many attempts.")).toHaveCount(0);
      await expect(page.locator("[data-lock-countdown]")).toHaveCount(0);
      // the right code works again
      await typeCode(page, CODE);
      await expect(page).toHaveURL(/\/$/);
    });

    test("a correct code on the 5th try still works", async ({ page }) => {
      await signInWith(page, "lena@example.org");
      for (let n = 1; n <= 4; n++) await typeCode(page, `${n}00000`);
      await expect(page.getByLabel("Digit 1 of 6")).toBeEnabled();
      await typeCode(page, CODE);
      await expect(page).toHaveURL(/\/$/);
    });
  });
}
