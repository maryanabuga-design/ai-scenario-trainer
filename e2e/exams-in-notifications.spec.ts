import { readFileSync } from "node:fs";
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

const bank: { id: string; correctOptionId: string }[] = [
  ...JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions,
  ...JSON.parse(readFileSync("content/scenario-building-evacuation.json", "utf8")).steps,
];
const correctOf = Object.fromEntries(bank.map((q) => [q.id, q.correctOptionId]));

const CARD_BG = "rgb(255, 255, 255)";
const PRIMARY = "rgb(63, 70, 56)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const bell = (page: Page) => page.getByRole("link", { name: /^Notifications, / });
const badge = async (page: Page) =>
  (await page.locator("[data-unread-badge]:visible").count()) === 0
    ? 0
    : Number(await page.locator("[data-unread-badge]:visible").innerText());

async function switchRole(page: Page, role: "Student" | "Instructor") {
  await page.goto("/profile");
  await page.getByRole("radio", { name: role }).check({ force: true });
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
}

/** Assigns an exam with the topics S1 and S2 and returns its id. */
async function assign(page: Page, title: string, preset: "In 3 days" | "In 1 week") {
  await page.goto("/instructor/exams/new");
  await page.getByText("Responding to an alarm", { exact: false }).first().click();
  await page.getByText("Checking the route").first().click();
  await page.getByText(preset).click();
  await page.getByLabel("Exam title").fill(title);
  await page.getByRole("button", { name: "Assign exam" }).click();
  await expect(page).toHaveURL(/assigned=1/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

async function closeExam(page: Page, id: string) {
  await page.goto(`/instructor/exams/${id}`);
  await page.getByRole("button", { name: "Close exam now" }).click();
  await page.locator("dialog[open]").getByRole("button", { name: "Close exam" }).click();
  await expect(page.getByRole("button", { name: "Close exam now" })).toHaveCount(0);
}

async function passExam(page: Page, id: string) {
  await page.goto(`/exam?id=${id}`);
  await page
    .getByRole("button", { name: /^Start exam/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/exam\/session$/);
  await page.evaluate((answerOf) => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("ast.exam.v1"))!;
    const stored = JSON.parse(localStorage.getItem(key)!);
    const answers = (stored.value.itemIds as string[]).map((itemId) => ({
      itemId,
      optionId: answerOf[itemId],
    }));
    stored.value.answers = answers;
    stored.value.index = answers.length - 1;
    localStorage.setItem(key, JSON.stringify(stored));
  }, correctOf);
  await page.reload();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Passed" })).toBeVisible();
}

for (const width of [360, 430]) {
  test.describe(`Assigned exams in Notifications at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("two assigned exams: no cards on Home, the badge counts history only, the cards live in Notifications", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (r) => {
        const url = r.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await page.goto("/instructor");
      await closeExam(page, "seed-active");
      const a = await assign(page, "Exam: A", "In 3 days");
      const b = await assign(page, "Exam: B", "In 1 week");
      await switchRole(page, "Student");

      // Home: no exam cards, the tile shows the count and the nearest date
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: /^Hi, / })).toBeVisible();
      await expect(page.getByRole("link", { name: /^Exam/ }).first()).toContainText(
        /2 assigned · due \d{1,2} \w{3}/,
      );
      expect(await noSidewaysScroll(page)).toBe(true);

      // the badge is the unread history: 4 demo messages and 2 assignments
      const count = await badge(page);
      expect(count).toBe(6);
      await expect(bell(page)).toHaveAttribute("aria-label", `Notifications, ${count} unread`);

      // Notifications: the two cards in due-date order, then the history
      await bell(page).click();
      await expect(page).toHaveURL(/\/notifications$/);
      const cards = page.locator("[data-assigned-exam]");
      await expect(cards).toHaveCount(2);
      await expect(cards.nth(0)).toHaveAttribute("data-assigned-exam", a);
      await expect(cards.nth(1)).toHaveAttribute("data-assigned-exam", b);
      for (const card of await cards.all()) {
        const box = (await card.boundingBox())!;
        expect(box.height).toBe(88);
        expect(box.x).toBe(16);
        expect(box.width).toBe(width - 32);
        expect(await bg(card)).toBe(CARD_BG);
        await expect(card.locator("[data-assigned-line]")).toContainText(
          /^Due \d{1,2} \w{3} · 20 questions · 20 minutes$/,
        );
        await expect(card.locator("img")).toHaveAttribute("src", /exam-card/);
      }
      await expect(page.getByRole("heading", { name: "EXAMS TO TAKE" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "EARLIER" })).toBeVisible();
      const rows = page.locator("[data-history-row]:visible");
      await expect(rows).toHaveCount(6);
      for (const row of await rows.all()) expect((await row.boundingBox())!.height).toBe(72);
      await expect(page.locator("[data-unread-dot]:visible")).toHaveCount(count);
      // (the small 40px Back circle is the established Back style, so it is not part of this check)
      for (const link of await page
        .locator("main a:visible:not([aria-label='Back to Home'])")
        .all()) {
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
      // no Primary button on this screen
      expect(
        await page
          .locator("main button:visible, main a:visible")
          .evaluateAll(
            (els, color) =>
              els
                .filter((el) => getComputedStyle(el).backgroundColor === color)
                .map((el) => el.outerHTML.slice(0, 200)),
            PRIMARY,
          ),
      ).toEqual([]);

      // reading clears the badge, the cards stay
      await page.getByRole("link", { name: "Back to Home" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, no unread");
      await page.goto("/notifications");
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(2);
      await expect(page.locator("[data-unread-dot]:visible")).toHaveCount(0);

      // a card opens the exam intro with the one Primary "Start exam"
      await cards.nth(0).click();
      await expect(page).toHaveURL(new RegExp(`/exam\\?id=${a}$`));
      // (below the pass mark the Primary is "Repeat weak topics" and "Start exam anyway" the Secondary)
      await expect(page.getByRole("button", { name: /^Start exam/ })).toHaveCount(1);
      const primaries = await page
        .locator("main button:visible")
        .evaluateAll(
          (els, color) => els.filter((el) => getComputedStyle(el).backgroundColor === color).length,
          PRIMARY,
        );
      expect(primaries).toBe(1);

      // the Exam screen lists the assigned exams first
      await page.goto("/exam");
      const section = page.getByRole("heading", { name: "ASSIGNED BY YOUR INSTRUCTOR" });
      await expect(section).toBeVisible();
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(2);
      const sectionBox = (await section.boundingBox())!;
      const readiness = (await page.getByRole("region", { name: "Readiness" }).boundingBox())!;
      expect(sectionBox.y).toBeLessThan(readiness.y);
      expect(
        await page
          .locator("main button:visible")
          .evaluateAll(
            (els, color) =>
              els.filter((el) => getComputedStyle(el).backgroundColor === color).length,
            PRIMARY,
          ),
      ).toBe(1);
      // the intro of one exam has no such section
      await page.goto(`/exam?id=${a}`);
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);

      // a reminder does not add a second row: it updates the one for the exam
      await switchRole(page, "Instructor");
      for (let n = 0; n < 2; n++) {
        await page.goto(`/instructor/exams/${b}`);
        await page.getByRole("button", { name: "Remind students who have not started" }).click();
        await expect(page.locator("[data-message]")).toContainText("Reminder sent to");
        await page.waitForTimeout(30);
      }
      await switchRole(page, "Student");
      await expect(bell(page)).toHaveAttribute("aria-label", "Notifications, 1 unread");
      await page.goto("/notifications");
      await expect(page.locator("[data-history-row]:visible")).toHaveCount(7);
      await expect(page.getByText("Reminder: Exam: B is due")).toHaveCount(1);
      // no duplicates after a reload
      await page.reload();
      await expect(page.locator("[data-history-row]:visible")).toHaveCount(7);
      await expect(page.getByText("Reminder: Exam: B is due")).toHaveCount(1);

      // passing an exam removes its card; closing one as the instructor removes the other
      await passExam(page, a);
      await page.goto("/notifications");
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(1);
      await expect(page.locator(`[data-assigned-exam="${a}"]`)).toHaveCount(0);
      // a history row of an exam that is no longer active is not tappable
      const assignedA = page.locator('[data-history-row="notice-' + a + '"]');
      expect(await assignedA.evaluate((el) => el.tagName)).toBe("A"); // still active (passed, not closed)
      await switchRole(page, "Instructor");
      await closeExam(page, b);
      await switchRole(page, "Student");
      await page.goto("/notifications");
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "EXAMS TO TAKE" })).toHaveCount(0);
      const closedRow = page.locator('[data-history-row="notice-' + b + '"]');
      expect(await closedRow.evaluate((el) => el.tagName)).toBe("DIV");
      await expect(closedRow.locator("svg.lucide-chevron-right")).toHaveCount(0);
      // the tile is back to the old text
      await page.goto("/");
      await expect(page.getByRole("link", { name: /^Exam/ }).first()).not.toContainText("assigned");

      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });
}
