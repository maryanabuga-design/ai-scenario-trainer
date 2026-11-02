import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

const CODE = "482913";

/**
 * A new student through the invitation: the link of the group, the email, the demo code and the Profile
 * step; it ends on the student home. (There is no public sign-up.)
 */
export async function joinAsStudent(
  page: Page,
  name: string,
  email: string,
  link = "/join/QT-A7K2",
) {
  await page.goto(link);
  await page.getByLabel("Your email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
  await expect(page).toHaveURL(/\/set-up-profile$/);
  await page.getByLabel("Your name").fill(name);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/$/);
}

/** The demo shortcut for a role: Profile, Demo mode. */
export async function demoRole(page: Page, role: "Student" | "Instructor") {
  await page.goto("/profile");
  await page
    .getByRole("radiogroup", { name: "Switch role (demo)" })
    .locator("label", { hasText: role })
    .click();
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
}

/** Puts a signed-in account that still owes the Field of work step and the introduction into the browser, then opens Home. */
export async function seedNewAccount(
  page: Page,
  input: { name: string; email: string; role?: "student" | "instructor" },
) {
  const value = JSON.stringify({
    schema: 6,
    content: "seed",
    value: {
      accounts: [
        {
          name: input.name,
          email: input.email,
          role: input.role ?? "student",
          createdAt: 1,
          onboardingDone: false,
          fieldStepDone: (input.role ?? "student") !== "student",
        },
      ],
      session: { email: input.email },
      pending: null,
    },
  });
  await page.goto("/welcome");
  await page.evaluate((v) => localStorage.setItem("ast.auth.v1", v), value);
  // the app moves on to the introduction by itself; WebKit reports that redirect as an interrupted
  // load, which is expected here, so only that message is ignored and the address must still settle
  await page.goto("/").catch((error: Error) => {
    if (!/interrupted by another navigation/.test(error.message)) throw error;
  });
  await page.waitForURL((url) => url.pathname !== "/welcome" && url.pathname !== "/");
}
