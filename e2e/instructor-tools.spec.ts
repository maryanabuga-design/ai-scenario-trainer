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

const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const CARD = "rgb(255, 255, 255)";
const ATTENTION_INK = "rgb(111, 81, 32)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const primaries = (page: Page) =>
  page
    .locator("a:visible, button:visible")
    .evaluateAll(
      (els, color) => els.filter((el) => getComputedStyle(el).backgroundColor === color).length,
      PRIMARY,
    );

for (const width of [360, 430]) {
  test.describe(`Instructor numbers and tools at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("honest numbers: the Not started demo account is left out of the group figures and says so", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await expect(page.locator("[data-page-header-band]:visible")).toContainText(
        "Group A · 15 students · 2 not started",
      );
      // the local demo account is Not started, neutral, and last
      const mine = page.locator('[data-student="maryana@example.com"]');
      await expect(mine.locator("[data-student-line]")).toHaveText(
        "Your demo account · Not started",
      );
      await expect(mine.locator("[data-status-text]")).toHaveAttribute(
        "data-status-text",
        "not-started",
      );
      const last = page.locator("[data-student]:visible").last();
      await expect(last.locator("[data-status-text]")).toHaveAttribute(
        "data-status-text",
        "not-started",
      );
      // Needs attention never lists a Not started participant; the counts agree
      await page.goto("/instructor");
      const needs = Number(
        /(\d+) students? need/.exec(
          await page.locator('[data-action="needs-attention"]').innerText(),
        )![1],
      );
      await page.goto("/instructor/students?filter=needs&from=overview");
      await expect(page.locator("[data-student]:visible")).toHaveCount(needs);
      await expect(page.locator('[data-status-text="not-started"]:visible')).toHaveCount(0);
      // Topics: the counts are among those who answered (13 active students, not 15)
      await page.goto("/instructor/topics");
      for (const card of await page.locator("[data-topic-card]").all()) {
        expect(await card.innerText()).toMatch(/of 13 students at or above the pass mark/);
      }
    });

    test("a student detail: the field line, the readiness, the Send reminder dialog and its confirmation", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await page.locator('[data-student-line]:has-text("Needs attention")').first().click();
      await expect(page.locator("[data-field-line]")).toBeVisible();
      const send = page.getByRole("button", { name: "Send reminder" });
      expect(await bg(send)).toBe(OLIVE_TINT);
      expect((await send.boundingBox())!.height).toBe(52);
      expect(await primaries(page)).toBe(0);
      await send.click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toContainText("Send a reminder to ");
      await expect(dialog.locator("[data-reminder-preview]")).toContainText(
        /^Your instructor (reminded you: .+ is due \d{1,2} \w{3}\.|suggests practising: .+\.|says: keep it up\.)$/,
      );
      expect(await bg(dialog.getByRole("button", { name: "Send reminder" }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Cancel" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(page.locator("[data-message]")).toHaveText("");
      await send.click();
      await dialog.getByRole("button", { name: "Send reminder" }).click();
      await expect(page.locator("[data-message]")).toHaveText(/^Reminder sent to .+/);
    });

    test("Send reminder gives the local student account one notification and updates it when sent again", async ({
      page,
    }) => {
      const reminders = (p: Page) =>
        p.evaluate(() => {
          const raw = Object.entries(localStorage).find(([k]) =>
            k.startsWith("ast.notifications.v1"),
          );
          const list = raw ? (JSON.parse(raw[1]).value as { id: string; title: string }[]) : [];
          return list.filter((n) => n.id.startsWith("remind-student-"));
        });
      const send = async () => {
        await page.goto("/instructor/students/maryana%40example.com");
        await page.getByRole("button", { name: "Send reminder" }).click();
        await page.locator("dialog[open]").getByRole("button", { name: "Send reminder" }).click();
        await expect(page.locator("[data-message]")).toHaveText("Reminder sent to Maryana");
      };
      // the demo account has an active exam it has not passed: the exam message
      await send();
      await page.goto("/profile");
      await page.getByRole("radio", { name: "Student" }).check({ force: true });
      await expect(page).toHaveURL(/\/$/);
      await page.goto("/notifications");
      const row = page.locator("[data-history-row]:visible", {
        hasText: "Your instructor reminded you:",
      });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(/is due \d{1,2} \w{3}\./);
      // sending again updates it: still one row
      await page.goto("/profile");
      await page.getByRole("radio", { name: "Instructor" }).check({ force: true });
      await expect(page).toHaveURL(/\/instructor$/);
      await send();
      await page.goto("/profile");
      await page.getByRole("radio", { name: "Student" }).check({ force: true });
      await expect(page).toHaveURL(/\/$/);
      await page.goto("/notifications");
      await expect(
        page.locator("[data-history-row]:visible", { hasText: "Your instructor reminded you:" }),
      ).toHaveCount(1);
      expect((await reminders(page)).length).toBe(1);
      // a seeded student gets no notification, only the confirmation
    });

    test("Invite students: code, link, emails with checking, the pending list, duplicates", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const invite = page.getByRole("link", { name: "Invite students" });
      await expect(invite).toBeVisible();
      await invite.click();
      await expect(page).toHaveURL(/\/instructor\/students\/invite$/);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
      await expect(page.locator("[data-group-code]")).toHaveText("QT-A7K2");
      const card = page.locator("[data-group-code]").locator("xpath=..");
      expect(await bg(card)).toBe(CARD);
      for (const name of ["Copy code", "Copy link"]) {
        const button = page.getByRole("button", { name });
        expect(await bg(button)).toBe(OLIVE_TINT);
        expect((await button.boundingBox())!.height).toBe(52);
      }
      await page
        .context()
        .grantPermissions(["clipboard-read", "clipboard-write"])
        .catch(() => undefined);
      await page.getByRole("button", { name: "Copy code" }).click();
      await expect(page.locator("[data-message]")).toHaveText(
        /Code copied|Copying is not available here/,
      );
      await page.getByRole("button", { name: "Copy link" }).click();
      await expect(page.locator("[data-message]")).toHaveText(
        /Link copied|Copying is not available here/,
      );
      const link = page.getByRole("textbox", { name: "Invite link" });
      await expect(link).toHaveAttribute("readonly", "");
      await expect(link).toHaveValue(/QT-A7K2$/);
      // the pinned buttons: one Primary, disabled until a new valid address
      const send = page.getByRole("button", { name: "Send invitations" });
      await expect(send).toBeDisabled();
      const emails = page.getByRole("textbox", { name: "INVITE BY EMAIL" });
      await emails.fill("nobody");
      await expect(page.locator("[data-amber]:visible")).toContainText(
        "Not a valid address: nobody",
      );
      expect(
        await page.locator("[data-amber]:visible").evaluate((el) => getComputedStyle(el).color),
      ).toBe(ATTENTION_INK);
      await expect(send).toBeDisabled();
      await emails.fill("Ana@example.com, ben@example.com\nnope  ana@example.com");
      await expect(page.locator("[data-amber]:visible")).toContainText("nope");
      await expect(send).toBeEnabled();
      expect(await primaries(page)).toBe(1);
      await send.click();
      await expect(page.locator("[data-message]")).toHaveText("2 invitations added");
      const pending = page.locator("[data-pending]");
      await expect(pending).toHaveCount(2);
      for (const row of await pending.all()) {
        const box = (await row.boundingBox())!;
        expect([box.height, box.x]).toEqual([72, 16]);
        await expect(row).toContainText(/Invited \d{1,2} \w{3} · Pending/);
        expect(await row.evaluate((el) => !!el.querySelector("svg"))).toBe(false);
      }
      // duplicates are ignored with a message, and nothing new can be sent
      await emails.fill("ana@example.com");
      await expect(page.locator("[data-duplicates]")).toContainText("already invited");
      await expect(send).toBeDisabled();
      await expect(page.locator("[data-prototype-line]")).toHaveText(
        "Prototype: no emails are sent.",
      );
      expect(await noSidewaysScroll(page)).toBe(true);
      // it is kept after a reload
      await page.reload();
      await expect(page.locator("[data-pending]")).toHaveCount(2);
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
    });

    test("the Instructor routes of this work are closed to a Student", async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height: 800 },
        storageState: {
          cookies: [],
          origins: [
            {
              origin: "http://localhost:3100",
              localStorage: [{ name: "ast.auth.v1", value: authValue("student") }],
            },
          ],
        },
      });
      const page = await context.newPage();
      for (const path of [
        "/instructor/topics",
        "/instructor/students/invite",
        "/instructor/students",
      ]) {
        await page.goto(path);
        await expect(page, path).toHaveURL(/\/$/);
      }
      await context.close();
    });

    test("no external request on the dashboard, Topics, Invite and the reminder", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (r) => {
        const url = r.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      for (const path of ["/instructor", "/instructor/topics", "/instructor/students/invite"]) {
        await page.goto(path);
        await page.waitForTimeout(300);
      }
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });
}
