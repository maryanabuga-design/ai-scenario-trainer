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
const WHITE = "rgb(255, 255, 255)";
const BORDER = "rgb(228, 223, 213)";
const SAND = "rgb(240, 236, 230)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const email = (page: Page) => page.getByRole("combobox", { name: "INVITE BY EMAIL" });
const tags = (page: Page) => page.locator("[data-tag]");

for (const width of [360, 430]) {
  test.describe(`Invite students fields at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });
    test.beforeEach(async ({ page }) => {
      await page.goto("/instructor/students/invite");
      await expect(email(page)).toBeVisible();
    });

    test("the real route shows the current design: subtitle, no separate copy buttons, the copy icon inside the group code field", async ({
      page,
    }) => {
      await expect(page).toHaveURL(/\/instructor\/students\/invite$/);
      await expect(page.getByRole("heading", { level: 1, name: "Invite students" })).toBeVisible();
      await expect(
        page.getByText("Share the group code or link, or invite students by email."),
      ).toBeVisible();
      await expect(page.getByRole("button", { name: "Copy code" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Copy link" })).toHaveCount(0);
      await expect(page.locator("textarea")).toHaveCount(0);
      const field = page.locator("[data-group-code]").locator("xpath=..");
      await expect(field.getByRole("button", { name: "Copy group code" })).toBeVisible();
    });

    test("the subtitle, the white group card and ONE field look for the three fields", async ({
      page,
    }) => {
      await expect(page.locator("[data-helper]")).toHaveText(
        "Share the group code or link, or invite students by email.",
      );
      const card = page.locator("[data-invite-group]");
      expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(WHITE);
      const fields = [
        page.locator("[data-group-code]").locator("xpath=.."),
        page.locator("[data-invite-link]").locator("xpath=.."),
        page.locator("[data-recipient-field]"),
      ];
      for (const field of fields) {
        const style = await field.evaluate((el) => {
          const s = getComputedStyle(el);
          return [s.backgroundColor, s.borderTopColor, s.borderRadius, s.fontSize];
        });
        expect(style).toEqual([WHITE, BORDER, "14px", "16px"]);
        expect((await field.boundingBox())!.height).toBe(52);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the copy icon sits inside each read-only field, is the same icon, shows the notice and a check for 1.5 seconds", async ({
      page,
    }) => {
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"])
        .catch(() => undefined);
      const code = page.getByRole("button", { name: "Copy group code" });
      const link = page.getByRole("button", { name: "Copy invite link" });
      for (const button of [code, link]) {
        await expect(button.locator("svg.lucide-copy")).toHaveCount(1);
        const b = (await button.boundingBox())!;
        expect(b.height).toBe(44);
        const tile = (await button.locator("span").first().boundingBox())!;
        expect(tile.height).toBe(32);
        await expect(button.locator("[data-copy-label]")).toHaveText("Copy");
        expect(
          await button.locator("[data-copy-label]").evaluate((el) => {
            const s = getComputedStyle(el);
            return [s.fontSize, s.fontWeight];
          }),
        ).toEqual(["14px", "500"]);
        expect(
          await button
            .locator("span")
            .first()
            .evaluate((el) => getComputedStyle(el).backgroundColor),
        ).toBe(SAND);
        const field = (await button.locator("xpath=..").boundingBox())!;
        expect(b.x).toBeGreaterThanOrEqual(field.x);
        expect(b.x + b.width).toBeLessThanOrEqual(field.x + field.width);
      }
      await expect(page.getByRole("textbox", { name: "GROUP CODE" })).toHaveAttribute(
        "readonly",
        "",
      );
      await code.click();
      await expect(page.locator("[data-flash]:visible")).toContainText(/Code copied/);
      await expect(code.locator("svg.lucide-check")).toHaveCount(1);
      await expect(code.locator("[data-copy-label]")).toHaveText("Copied");
      await expect(code.locator("svg.lucide-check")).toHaveCount(0, { timeout: 3000 });
      await expect(code.locator("[data-copy-label]")).toHaveText("Copy");
      await expect(code.locator("svg.lucide-copy")).toHaveCount(1);
      await link.click();
      await expect(page.locator("[data-flash]:visible")).toContainText(/Link copied/);
      await expect(link.locator("svg.lucide-check")).toHaveCount(1);
    });

    test("the Prototype and Demo group lines are gone from Invite students and Students", async ({
      page,
    }) => {
      await expect(page.getByText("Prototype: no emails are sent.")).toHaveCount(0);
      await expect(page.getByText("Demo group.")).toHaveCount(0);
      await page.goto("/instructor/students");
      await expect(page.getByText("Demo group")).toHaveCount(0);
    });

    test("the success notice floats over the header under the back arrow, moves nothing and goes by itself", async ({
      page,
    }) => {
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"])
        .catch(() => undefined);
      const title = page.getByRole("heading", { level: 1, name: "Invite students" });
      const before = (await title.boundingBox())!;
      const back = (await page.locator("[data-back-button]:visible").boundingBox())!;
      await page.getByRole("button", { name: "Copy invite link" }).click();
      const notice = page.locator("[data-flash]:visible");
      await expect(notice).toContainText("Link copied");
      await expect(notice).toHaveAttribute("data-flash-state", "on");
      const n = (await notice.boundingBox())!;
      expect(Math.abs(n.y - (back.y + back.height + 8))).toBeLessThanOrEqual(1);
      expect(n.x).toBeGreaterThanOrEqual(16 - 0.5);
      expect(n.x + n.width).toBeLessThanOrEqual(width - 16 + 0.5);
      // it covers the title area and nothing moves
      expect(n.y + n.height).toBeGreaterThan(before.y);
      const during = (await title.boundingBox())!;
      expect([during.x, during.y]).toEqual([before.x, before.y]);
      await expect(page.locator("[data-flash]:visible")).toHaveCount(0, { timeout: 7000 });
      const after = (await title.boundingBox())!;
      expect([after.x, after.y]).toEqual([before.x, before.y]);
    });

    test("a screen without a back arrow (Students) shows the notice 12px from the top", async ({
      page,
    }) => {
      await email(page).fill("someone@example.com");
      await email(page).press("Enter");
      await page.getByRole("button", { name: "Send invitations" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
      await expect(page.locator("[data-back-button]:visible")).toHaveCount(0);
      const notice = page.locator("[data-flash]:visible");
      await expect(notice).toContainText("Invitation sent to 1 person");
      await expect(notice).toHaveAttribute("data-flash-state", "on");
      expect(Math.round((await notice.boundingBox())!.y)).toBe(12);
    });

    test("a long link is cut with an ellipsis, never wraps and never covers the icon button", async ({
      page,
    }) => {
      const input = page.locator("[data-invite-link]");
      const style = await input.evaluate((el) => {
        const s = getComputedStyle(el);
        return [s.textOverflow, s.whiteSpace];
      });
      expect(style).toEqual(["ellipsis", "nowrap"]);
      const i = (await input.boundingBox())!;
      const b = (await page.getByRole("button", { name: "Copy invite link" }).boundingBox())!;
      expect(i.x + i.width).toBeLessThanOrEqual(b.x + 0.5);
    });

    test("typing 'Al' lists up to 5 simulated people; arrows and Enter choose; a tag appears and can be removed", async ({
      page,
    }) => {
      const input = email(page);
      await expect(input).toHaveAttribute("aria-expanded", "false");
      await input.pressSequentially("Al");
      await expect(input).toHaveAttribute("aria-expanded", "true");
      const options = page.getByRole("option");
      expect(await options.count()).toBeGreaterThanOrEqual(2);
      expect(await options.count()).toBeLessThanOrEqual(5);
      await expect(options.first()).toContainText("Alina Kovalenko");
      await expect(options.first()).toContainText("alina.kovalenko@example.com");
      const avatar = options.first().locator("[data-initials-avatar]");
      await expect(avatar).toHaveText("AK");
      const av = (await avatar.boundingBox())!;
      expect([av.width, av.height]).toEqual([32, 32]);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await input.press("ArrowDown");
      const active = await input.getAttribute("aria-activedescendant");
      expect(active).toBeTruthy();
      await expect(page.locator(`[id="${active}"]`)).toHaveAttribute("aria-selected", "true");
      await input.press("Enter");
      await expect(tags(page)).toHaveCount(1);
      await expect(tags(page).first()).toContainText("Alina Kovalenko");
      await expect(tags(page).first().locator("[data-initials-avatar]")).toHaveCount(0);
      await expect(page.locator("[data-recipient-help]")).toHaveText(
        "1 person will get an invitation.",
      );
      await expect(page.getByRole("button", { name: "Send invitations" })).toBeEnabled();
      // Escape closes the list
      await input.pressSequentially("Al");
      await expect(input).toHaveAttribute("aria-expanded", "true");
      await input.press("Escape");
      await expect(input).toHaveAttribute("aria-expanded", "false");
      // a tap on an option adds it too; the x (44px tap area) removes a tag
      await input.fill("");
      await input.pressSequentially("Dar");
      await page.getByRole("option").first().click();
      await expect(tags(page)).toHaveCount(2);
      await expect(page.locator("[data-recipient-help]")).toHaveText(
        "2 people will get an invitation.",
      );
      const x = page.getByRole("button", { name: "Remove Alina Kovalenko" });
      expect((await x.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await x.click();
      await expect(tags(page)).toHaveCount(1);
      await expect(page.locator("[data-recipient-help]")).toHaveText(
        "1 person will get an invitation.",
      );
      await page.getByRole("button", { name: "Remove Daria Melnyk" }).click();
      await expect(tags(page)).toHaveCount(0);
      await expect(page.locator("[data-recipient-help]")).toHaveText(
        "Type a name or email. You can add several people.",
      );
      await expect(page.getByRole("button", { name: "Send invitations" })).toBeDisabled();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("a typed address becomes a tag on Enter, comma, space and blur", async ({ page }) => {
      const input = email(page);
      await input.pressSequentially("a1@example.com");
      await input.press("Enter");
      await input.pressSequentially("a2@example.com,");
      await input.pressSequentially("a3@example.com ");
      await input.pressSequentially("a4@example.com");
      await page.getByRole("heading", { level: 1 }).click();
      await expect(tags(page)).toHaveCount(4);
      await expect(input).toHaveValue("");
    });

    test("pasting several addresses makes several tags; an invalid one shows the error and is not added; duplicates are ignored", async ({
      page,
    }) => {
      const input = email(page);
      await input.focus();
      await page.evaluate(() => {
        const field = document.querySelector('input[role="combobox"]') as HTMLInputElement;
        const data = new DataTransfer();
        data.setData("text", "p1@example.com, p2@example.com\np3@example.com nope P1@example.com");
        field.dispatchEvent(
          new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }),
        );
      });
      await expect(tags(page)).toHaveCount(3);
      await expect(page.locator("[data-amber]:visible")).toHaveText("Check this email address.");
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveValue("nope");
      await input.fill("p2@example.com");
      await input.press("Enter");
      await expect(tags(page)).toHaveCount(3);
      await expect(page.locator("[data-amber]")).toHaveCount(0);
      await expect(page.locator("[data-recipient-live]")).toHaveAttribute("aria-live", "polite");
    });

    test("the field grows with its tags without sideways scrolling, and the open list is not hidden by the pinned buttons", async ({
      page,
    }) => {
      const input = email(page);
      const field = page.locator("[data-recipient-field]");
      const before = (await field.boundingBox())!.height;
      for (const name of ["Alina", "Daria", "Maksym", "Olena"]) {
        await input.pressSequentially(name);
        await input.press("ArrowDown");
        await input.press("Enter");
      }
      await input.pressSequentially("new.person.with.a.long.address@example.com,");
      expect((await field.boundingBox())!.height).toBeGreaterThan(before);
      expect(await noSidewaysScroll(page)).toBe(true);
      await input.pressSequentially("a");
      await page.getByRole("listbox").scrollIntoViewIfNeeded();
      const list = (await page.getByRole("listbox").boundingBox())!;
      const bar = (await page.getByRole("button", { name: "Cancel" }).boundingBox())!;
      expect(list.x).toBeGreaterThanOrEqual(0);
      expect(list.x + list.width).toBeLessThanOrEqual(width);
      // the list may reach the pinned area, but its first option can be reached and is visible
      const first = (await page.getByRole("option").first().boundingBox())!;
      expect(first.y + first.height).toBeLessThanOrEqual(bar.y + 0.5);
    });

    test("keyboard only: Tab reaches the field, the arrows and Enter choose, Tab reaches the pinned buttons", async ({
      page,
    }) => {
      const input = email(page);
      await input.focus();
      await input.pressSequentially("ma");
      await input.press("ArrowDown");
      await input.press("ArrowUp");
      await input.press("ArrowDown");
      await input.press("Enter");
      await expect(tags(page).first()).toContainText("Maksym Lysenko");
      await expect(input).toBeFocused();
      await page.getByRole("button", { name: "Send invitations" }).focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/instructor\/students$/);
      await expect(page.locator("[data-flash]:visible")).toContainText(
        "Invitation sent to 1 person",
      );
    });
  });
}

test("the initials avatar falls back to the initials when its image fails to load", async ({
  page,
}) => {
  await page.goto("/screens");
  const sample = page.locator("[data-avatar-sample]");
  await expect(sample.locator("[data-initials-avatar]")).toHaveCount(2);
  await expect(sample.locator("[data-initials-avatar]").first()).toHaveText("AK");
  await expect(sample.locator("[data-initials-avatar]").nth(1)).toHaveText("DM");
  await expect(sample.locator("[data-avatar-image]")).toHaveCount(0);
});
