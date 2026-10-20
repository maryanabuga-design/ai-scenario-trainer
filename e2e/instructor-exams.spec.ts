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

const quizBank: { id: string; correctOptionId: string; options: { id: string }[] }[] = JSON.parse(
  readFileSync("content/quiz-bank.json", "utf8"),
).questions;
const stepBank: { id: string; correctOptionId: string; options: { id: string }[] }[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;
const correctOf = new Map([...quizBank, ...stepBank].map((q) => [q.id, q.correctOptionId]));
const wrongOf = new Map(
  [...quizBank, ...stepBank].map((q) => [
    q.id,
    q.options.find((o) => o.id !== q.correctOptionId)!.id,
  ]),
);

const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const SUCCESS_BG = "rgb(225, 234, 218)";
const ATTENTION_BG = "rgb(241, 228, 200)";
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);

const navLinks = (page: Page) => page.getByRole("navigation", { name: "Main" }).getByRole("link");

async function switchRole(page: Page, role: "Student" | "Instructor") {
  await page.goto("/profile");
  await page.getByRole("radio", { name: role }).check({ force: true });
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
}

/** Fills the assign form: topics S1 and S2 and a one-week deadline. */
async function fillAssign(page: Page, title?: string) {
  await page.getByText("Responding to an alarm", { exact: false }).first().click();
  await page.getByText("Checking the route").first().click();
  await page.getByText("In 1 week").click();
  if (title) await page.getByLabel("Exam title").fill(title);
}

for (const width of [360, 430]) {
  test.describe(`Instructor exams at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the navigation is Overview, Exams, Students, Profile; the detail screens have no navigation", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(navLinks(page)).toHaveCount(4);
      await expect(navLinks(page)).toHaveText(["Overview", "Exams", "Students", "Profile"]);
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Exams" })
        .click();
      await expect(page).toHaveURL(/\/instructor\/exams$/);
      await expect(
        page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Exams" }),
      ).toHaveAttribute("aria-current", "page");
      await page.getByRole("link", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/\/exams\/new$/);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    });

    test("the Exams list: band, Primary Assign exam, ACTIVE card (88px), closed toggle (Other topics pattern)", async ({
      page,
    }) => {
      await page.goto("/instructor/exams");
      await expect(page.getByRole("heading", { name: "Exams", level: 1 })).toBeVisible();
      const assign = page.getByRole("link", { name: "Assign exam" });
      expect(await bg(assign)).toBe(PRIMARY);
      const a = (await assign.boundingBox())!;
      expect(a.height).toBe(52);
      expect(a.width).toBe(width - 32);
      const band = (await page.locator("[data-page-header-band]").boundingBox())!;
      expect(a.y).toBeGreaterThan(band.y + band.height);
      expect(a.y - (band.y + band.height)).toBeLessThanOrEqual(20);
      await expect(page.getByRole("heading", { name: "ACTIVE" })).toBeVisible();
      const cards = page.locator("[data-exam-card]:visible");
      await expect(cards).toHaveCount(1);
      const card = cards.first();
      expect((await card.boundingBox())!.height).toBe(88);
      await expect(card.locator("img")).toHaveAttribute("src", "/heroes/exam-card.webp");
      const frame = (await card.locator("[data-picture-frame]").boundingBox())!;
      expect([frame.width, frame.height]).toEqual([56, 56]);
      await expect(card).toContainText(/Due \d{1,2} \w{3} · 4 topics/);
      await expect(card).toContainText(/Passed \d+ of 15/);
      expect(await card.evaluate((el) => !!el.querySelector("svg.lucide-chevron-right"))).toBe(
        true,
      );
      // the closed exams: one toggle after the list, closed by default
      const toggle = page.getByRole("button", { name: "Show closed exams (1)" });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByRole("heading", { name: "CLOSED" })).toBeHidden();
      await toggle.click();
      const hide = page.getByRole("button", { name: "Hide closed exams" });
      await expect(hide).toHaveAttribute("aria-expanded", "true");
      await expect(hide).toBeFocused();
      await page.waitForTimeout(300);
      await expect(page.getByRole("heading", { name: "CLOSED" })).toBeVisible();
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(2);
      await expect(page.locator("button[aria-controls=closed-exams]")).toHaveCount(1);
      // the demo note ends the screen, and no percent sign in the lists
      await expect(page.locator("[data-demo-note]:visible")).toHaveText(
        "Demo group. Student data on this screen is simulated.",
      );
      expect(await page.locator("main").innerText()).not.toContain("%");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Assign exam: disabled until valid, Select all and Clear, title prefill, deadline presets and date", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      const assign = page.getByRole("button", { name: "Assign exam" });
      await expect(assign).toBeDisabled();
      expect((await assign.boundingBox())!.height).toBe(52);
      const rows = page.locator("label:has(input[name=topics])");
      await expect(rows).toHaveCount(10);
      for (const row of await rows.all()) expect((await row.boundingBox())!.height).toBe(64);
      // the title is prefilled from the first topics and stays editable
      await page.getByText("Responding to an alarm").first().click();
      await expect(page.getByLabel("Exam title")).toHaveValue(/^Exam: Responding to an alarm/);
      await expect(assign).toBeDisabled();
      await page.getByText("In 3 days").click();
      await expect(assign).toBeEnabled();
      // Select all / Clear
      await page.getByRole("button", { name: "Select all" }).click();
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(10);
      await expect(page.locator("[data-info-rules]")).toHaveText(
        "20 questions · 20 minutes · pass mark 80",
      );
      await page.getByRole("button", { name: "Clear" }).click();
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(0);
      await expect(assign).toBeDisabled();
      // the read-only info card
      await expect(page.locator("[data-info-audience]")).toHaveText(
        "Audience: all students in Group A",
      );
      // the date field only for "Pick a date", and no past date
      await page.getByText("Responding to an alarm").first().click();
      await expect(page.getByLabel("Deadline date")).toHaveCount(0);
      await page.getByText("Pick a date").click();
      const date = page.getByLabel("Deadline date");
      await expect(date).toBeVisible();
      expect((await date.boundingBox())!.height).toBe(52);
      await expect(assign).toBeDisabled();
      await date.fill("2020-01-01");
      await expect(assign).toBeDisabled();
      const future = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
      await date.fill(future);
      await expect(assign).toBeEnabled();
      await page.getByLabel("Exam title").fill("   ");
      await expect(assign).toBeDisabled();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the minimum-question rule: topics with fewer than 10 questions cannot be assigned", async ({
      page,
    }) => {
      const quiz: { section: string }[] = JSON.parse(
        readFileSync("content/quiz-bank.json", "utf8"),
      ).questions;
      const steps: { section: string }[] = JSON.parse(
        readFileSync("content/scenario-building-evacuation.json", "utf8"),
      ).steps;
      const count = (s: string) => [...quiz, ...steps].filter((q) => q.section === s).length;
      const small = Array.from({ length: 10 }, (_, i) => `S${i + 1}`).find((s) => count(s) < 10);
      test.skip(!small, "every topic holds at least 10 questions");
      await page.goto("/instructor/exams/new");
      await page
        .locator(`input[name=topics][value=${small}]`)
        .evaluate((el) => (el as HTMLElement).click());
      await page.getByText("In 3 days").click();
      await expect(page.getByRole("button", { name: "Assign exam" })).toBeDisabled();
      await expect(page.locator("[data-info-rules]")).toContainText(`${count(small!)} questions`);
    });

    test("Cancel leaves at once when nothing was entered, and asks first when something was", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams$/);
      await page.getByRole("link", { name: "Assign exam" }).click();
      await page.getByText("Responding to an alarm").first().click();
      await page.getByRole("button", { name: "Cancel" }).click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toBeVisible();
      expect(await bg(dialog.getByRole("button", { name: "Discard" }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Keep editing" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Keep editing" }).click();
      await expect(page).toHaveURL(/\/exams\/new$/);
      await page.getByRole("button", { name: "Cancel" }).click();
      await dialog.getByRole("button", { name: "Discard" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams$/);
    });

    test("assigning saves the exam, opens its detail with the message, and sends the students a notice", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await fillAssign(page, "Exam: Alarm and routes");
      const assign = page.getByRole("button", { name: "Assign exam" });
      expect(await bg(assign)).toBe(PRIMARY);
      await assign.click();
      await expect(page).toHaveURL(/\/instructor\/exams\/grp-[^?]+\?assigned=1$/);
      await expect(
        page.getByRole("heading", { name: "Exam: Alarm and routes", level: 1 }),
      ).toBeVisible();
      await expect(page.locator("[data-message]")).toHaveText(
        "Exam assigned. Students will see it on Home.",
      );
      await expect(page.locator("[data-rules]")).toContainText(
        "20 questions · 20 minutes · pass mark 80",
      );
      await expect(page.locator("[data-student-row]")).toHaveCount(15);
      // it is in the list, as Active
      await page.goto("/instructor/exams");
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(2);
      await expect(page.getByText("Exam: Alarm and routes")).toBeVisible();
      const notices = await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ast.group-notices.v1")!).value as { title: string }[],
      );
      expect(notices[0].title).toMatch(/^New exam assigned: Exam: Alarm and routes$/);
    });

    test("the detail: three count tiles, 72px student rows that open the student (chevron), sorted, tokens", async ({
      page,
    }) => {
      await page.goto("/instructor/exams");
      await page.locator("[data-exam-card]:visible").first().click();
      await expect(page).toHaveURL(/\/instructor\/exams\/seed-active$/);
      await expect(page.getByRole("link", { name: "Back to Exams" })).toBeVisible();
      const tiles = page.locator("[data-count]");
      await expect(tiles).toHaveCount(3);
      const counts = await tiles.evaluateAll((els) =>
        els.map((el) => Number(el.querySelector(".tabular-nums")!.textContent)),
      );
      expect(counts.reduce((a, b) => a + b, 0)).toBe(15);
      const tone = (name: string) =>
        bg(page.locator(`[data-count=${name}] [aria-hidden=true]`).first());
      expect(await tone("certified")).toBe(SUCCESS_BG);
      expect(await tone("not-passed")).toBe(ATTENTION_BG);
      const rows = page.locator("[data-student-row]");
      await expect(rows).toHaveCount(15);
      for (const row of await rows.all()) {
        expect((await row.boundingBox())!.height).toBe(72);
        expect(
          await row.evaluate((el) => el.querySelectorAll("svg.lucide-chevron-right").length),
        ).toBe(1);
      }
      // the rows match the tiles, and are sorted Not passed, Not started, Certified
      const kinds = await rows.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-status")!),
      );
      const order = { "not-passed": 0, "not-started": 1, certified: 2 } as Record<string, number>;
      expect(kinds.map((k) => order[k])).toEqual(
        [...kinds.map((k) => order[k])].sort((a, b) => a - b),
      );
      expect(kinds.filter((k) => k === "certified")).toHaveLength(counts[0]);
      expect(kinds.filter((k) => k === "not-passed")).toHaveLength(counts[1]);
      expect(kinds.filter((k) => k === "not-started")).toHaveLength(counts[2]);
      // "Not passed · 14 of 20 correct" wording, status as text plus icon
      const notPassed = page.locator('[data-status="not-passed"]').first();
      if ((await notPassed.count()) > 0) {
        await expect(notPassed).toContainText(/Not passed · \d+ of \d+ correct/);
        // the status icon, and the chevron of the row that opens the student
        expect(await notPassed.evaluate((el) => el.querySelectorAll("svg").length)).toBe(2);
      }
      await expect(page.locator('[data-student-row="maryana@example.com"]')).toContainText(
        "Your demo account",
      );
      await expect(page.locator("[data-demo-note]:visible")).toBeVisible();
      // the actions are Secondary
      for (const name of ["Remind students who have not started", "Close exam now"]) {
        expect(await bg(page.getByRole("button", { name }))).toBe(OLIVE_TINT);
        expect((await page.getByRole("button", { name }).boundingBox())!.height).toBe(52);
      }
      expect(await page.locator("main").innerText()).not.toContain("%");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Remind shows the count and sends a notice; Close exam asks first and closes it", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-active");
      const notStarted = Number(
        await page.locator("[data-count=not-started] .tabular-nums").innerText(),
      );
      expect(notStarted).toBeGreaterThan(0);
      await page.getByRole("button", { name: "Remind students who have not started" }).click();
      await expect(page.locator("[data-message]")).toHaveText(
        `Reminder sent to ${notStarted} ${notStarted === 1 ? "student" : "students"}`,
      );
      const notices = await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("ast.group-notices.v1")!).value as { title: string }[],
      );
      expect(notices.some((n) => n.title.startsWith("Reminder:"))).toBe(true);
      // close: a dialog with Primary Close exam and Secondary Keep open
      await page.getByRole("button", { name: "Close exam now" }).click();
      const dialog = page.locator("dialog[open]");
      expect(await bg(dialog.getByRole("button", { name: "Close exam" }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Keep open" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Keep open" }).click();
      await expect(page.getByRole("button", { name: "Close exam now" })).toBeVisible();
      await page.getByRole("button", { name: "Close exam now" }).click();
      await dialog.getByRole("button", { name: "Close exam" }).click();
      await expect(page.getByRole("button", { name: "Close exam now" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Remind students/ })).toHaveCount(0);
      await page.goto("/instructor/exams");
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(0);
      await page.getByRole("button", { name: "Show closed exams (2)" }).click();
      await page.waitForTimeout(300);
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(2);
    });

    test("an unknown exam id shows 'Exam not found' with a Secondary button back to Exams", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/nope");
      await expect(page.getByRole("heading", { name: "Exam not found" })).toBeVisible();
      const back = page.getByRole("link", { name: "Back to Exams" });
      expect(await bg(back)).toBe(OLIVE_TINT);
      await back.click();
      await expect(page).toHaveURL(/\/instructor\/exams$/);
    });

    test("a broken saved list loads without a crash and the seeded exams return", async ({
      page,
    }) => {
      await page.addInitScript(() => localStorage.setItem("ast.group-exams.v1", "{broken"));
      await page.goto("/instructor/exams");
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(1);
    });

    test("the whole flow: assign, the student gets the notice and the card, passes, the instructor sees Certified", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await fillAssign(page, "Exam: Alarm and routes");
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1/);
      const examId = new URL(page.url()).pathname.split("/").pop()!;
      const before = Number(await page.locator("[data-count=certified] .tabular-nums").innerText());
      // as a student: the bell has an unread badge, the notice, and the Assigned exam card
      await switchRole(page, "Student");
      const bell = page.getByRole("link", { name: /^Notifications, \d+ unread$/ });
      await expect(bell).toBeVisible();
      expect((await bell.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await expect(page.locator("[data-unread-badge]")).toBeVisible();
      // Home has no exam cards; the card is under EXAMS TO TAKE on Notifications
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);
      await bell.click();
      await expect(page).toHaveURL(/\/notifications$/);
      const card = page.locator(`[data-assigned-exam="${examId}"]`);
      await expect(card).toBeVisible();
      expect((await card.boundingBox())!.height).toBe(88);
      await expect(card).toContainText("Exam: Alarm and routes");
      await expect(card).toContainText(/Due \d{1,2} \w{3}/);
      await expect(card).toContainText("20 questions · 20 minutes");
      await expect(page.getByRole("button", { name: "Start exam" })).toHaveCount(0);
      await expect(page.getByText("New exam assigned: Exam: Alarm and routes")).toBeVisible();
      // the card opens the exam intro, where the Primary Start exam lives
      await card.click();
      await expect(page).toHaveURL(new RegExp(`/exam\\?id=${examId}$`));
      await page
        .getByRole("button", { name: /^Start exam/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/exam\/session$/);
      // the attempt is recorded against the exam; answer everything right and finish
      const saved = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.exam.v1")!).value,
      );
      expect(saved.examId).toBe(examId);
      expect(saved.itemIds).toHaveLength(20);
      const answers = (saved.itemIds as string[]).map((id) => ({
        itemId: id,
        optionId: correctOf.get(id)!,
      }));
      await page.evaluate(
        ([a]) => {
          const stored = JSON.parse(localStorage.getItem("ast.exam.v1")!);
          stored.value.answers = a;
          stored.value.index = a.length - 1;
          localStorage.setItem("ast.exam.v1", JSON.stringify(stored));
        },
        [answers] as const,
      );
      await page.reload();
      await page.getByRole("button", { name: "Finish", exact: true }).click();
      await expect(page).toHaveURL(/\/exam\/results$/);
      await expect(page.getByRole("heading", { name: "Passed" })).toBeVisible();
      // the card is gone from Notifications once it is passed
      await page.goto("/notifications");
      await expect(page.locator(`[data-assigned-exam="${examId}"]`)).toHaveCount(0);
      // back as the instructor: this account is Certified for the exam, and the counts followed
      await switchRole(page, "Instructor");
      await page.goto(`/instructor/exams/${examId}`);
      const mine = page.locator('[data-student-row="maryana@example.com"]');
      await expect(mine).toHaveAttribute("data-status", "certified");
      await expect(mine).toContainText("Certified");
      const after = Number(await page.locator("[data-count=certified] .tabular-nums").innerText());
      expect(after).toBe(before + 1);
    });

    test("a failed attempt marks Not passed with the count, and a retry is possible until the deadline", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await fillAssign(page, "Exam: Retry");
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1/);
      const examId = new URL(page.url()).pathname.split("/").pop()!;
      await switchRole(page, "Student");
      await page.goto(`/exam?id=${examId}`);
      await page
        .getByRole("button", { name: /^Start exam/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/exam\/session$/);
      const saved = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.exam.v1")!).value,
      );
      const answers = (saved.itemIds as string[]).map((id, i) => ({
        itemId: id,
        optionId: i < 10 ? correctOf.get(id)! : wrongOf.get(id)!,
      }));
      await page.evaluate(
        ([a]) => {
          const stored = JSON.parse(localStorage.getItem("ast.exam.v1")!);
          stored.value.answers = a;
          stored.value.index = a.length - 1;
          localStorage.setItem("ast.exam.v1", JSON.stringify(stored));
        },
        [answers] as const,
      );
      await page.reload();
      await page.getByRole("button", { name: "Finish", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
      // still assigned: the card stays and the exam can be started again
      await page.goto("/notifications");
      await expect(page.locator(`[data-assigned-exam="${examId}"]`)).toBeVisible();
      await switchRole(page, "Instructor");
      await page.goto(`/instructor/exams/${examId}`);
      const mine = page.locator('[data-student-row="maryana@example.com"]');
      await expect(mine).toHaveAttribute("data-status", "not-passed");
      await expect(mine).toContainText("Not passed · 10 of 20 correct");
    });

    test("a closed exam cannot be started by a student", async ({ page }) => {
      await page.goto("/instructor/exams/seed-active");
      await page.getByRole("button", { name: "Close exam now" }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Close exam" }).click();
      await switchRole(page, "Student");
      await page.goto("/notifications");
      await expect(page.locator('[data-assigned-exam="seed-active"]')).toHaveCount(0);
      await page.goto("/exam?id=seed-active");
      await expect(page.getByRole("heading", { name: "This exam is closed" })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Start exam/ })).toHaveCount(0);
    });

    test("no external network request on the Instructor screens", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await page.goto("/instructor/exams");
      await page.locator("[data-exam-card]:visible").first().click();
      await expect(page.locator("[data-student-row]").first()).toBeVisible();
      await page.goto("/instructor/exams/new");
      await expect(page.getByLabel("Exam title")).toBeVisible();
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });

    test("an instructor cannot open student-only routes", async ({ page }) => {
      for (const path of ["/exam", "/ask-ai", "/training", "/notifications"]) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/instructor$/);
      }
    });
  });
}

test.describe("Student and the Instructor routes", () => {
  test("a student is sent Home from every /instructor route", async ({ page }) => {
    for (const path of [
      "/instructor",
      "/instructor/exams",
      "/instructor/exams/new",
      "/instructor/exams/seed-active",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
    }
  });
});
