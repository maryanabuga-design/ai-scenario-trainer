import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue, emptyBrowser } from "./auth-seed";

const quizBank: { id: string; correctOptionId: string }[] = JSON.parse(
  readFileSync("content/quiz-bank.json", "utf8"),
).questions;
const stepBank: { id: string; correctOptionId: string }[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;
const correctOf = new Map([...quizBank, ...stepBank].map((q) => [q.id, q.correctOptionId]));

const CODE = "482913";
const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const SAND_200 = "rgb(228, 214, 188)";
const SAND_900 = "rgb(77, 63, 45)";
const MUTED = "rgb(92, 90, 85)";

const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });

async function switchRole(page: Page, role: "Student" | "Instructor") {
  await page.goto("/profile");
  await page.getByRole("radio", { name: role }).check({ force: true });
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
}

async function signUpInstructor(page: Page) {
  await page.goto("/welcome");
  await page.getByRole("link", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("Ira Instructor");
  await page.getByLabel("Work email").fill("ira@example.com");
  await page.getByText("Instructor", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page).toHaveURL(/\/instructor$/);
}

const passedOf = async (page: Page, examId: string) => {
  const text = await page.locator(`[data-exam-card="${examId}"]`).innerText();
  return Number(/Passed (\d+) of (\d+)/.exec(text)![1]);
};

for (const width of [360, 430]) {
  test.describe(`Instructor Overview at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("layout: the avatar header, the readiness card with its delta, the action rows, the exam card, the weakest topic; no tiles", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Maryana");
      await expect(page.locator("[data-page-header-band]")).toHaveCount(0);
      const avatar = page.locator("[data-avatar]:visible");
      const ab = (await avatar.boundingBox())!;
      expect([ab.width, ab.height]).toEqual([44, 44]);
      const circle = avatar.locator("span");
      expect((await circle.boundingBox())!.width).toBe(40);
      expect(await bg(circle)).toBe(SAND_200);
      expect(await circle.evaluate((el) => getComputedStyle(el).color)).toBe(SAND_900);
      await expect(page.locator("[data-group-readiness]")).toContainText(/Group readiness \d+%/);
      await expect(page.locator("[data-group-line]")).toHaveText(
        "Group A · 15 students · 2 not started",
      );
      await expect(page.locator("[data-delta]")).toHaveText("+4 points since last week");
      expect(await page.locator("[data-delta]").evaluate((el) => getComputedStyle(el).color)).toBe(
        MUTED,
      );
      expect(await noSidewaysScroll(page)).toBe(true);
      // the old tiles are gone
      await expect(page.locator("[data-tile]")).toHaveCount(0);
      for (const label of ["Weakest topics", "Certified", "Not started"]) {
        await expect(page.locator("main").getByText(label, { exact: true })).toHaveCount(0);
      }
      // heights and gutters
      const box = async (selector: string) => (await page.locator(selector).first().boundingBox())!;
      expect((await box("[data-group-readiness]")).height).toBeGreaterThanOrEqual(80);
      expect((await box("[data-exam-card]")).height).toBe(88);
      expect((await box("[data-weakest-topic]")).height).toBe(80);
      const rows = page.locator("[data-action]");
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThanOrEqual(3);
      for (const row of await rows.all()) {
        const b = (await row.boundingBox())!;
        expect([b.height, b.x, b.width]).toEqual([72, 16, width - 32]);
        expect(await bg(row)).toBe("rgb(255, 255, 255)");
        expect(await row.evaluate((el) => !!el.querySelector("svg.lucide-chevron-right"))).toBe(
          true,
        );
      }
      // the rows that apply with the seeded group: students below the pass mark, then the sets
      await expect(rows.first()).toHaveAttribute("data-action", "needs-attention");
      await expect(rows.first()).toContainText(/\d+ students need attention/);
      await expect(rows.first()).toContainText("Below the pass mark");
      // one percentage on the whole screen
      const text = await page.locator("main").innerText();
      expect(text.match(/%/g)).toHaveLength(1);
      await expect(page.locator("[data-demo-note]")).toHaveText(
        "Demo group. Student data on this screen is simulated.",
      );
      await expect(nav(page).getByRole("link")).toHaveText([
        "Overview",
        "Exams",
        "Students",
        "Content",
      ]);
      await expect(nav(page).getByRole("link", { name: "Profile" })).toHaveCount(0);
    });

    test("the avatar opens Profile and Back lands on the Overview; Profile has no navigation", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await page.locator("[data-avatar]:visible").click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(nav(page)).toHaveCount(0);
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      for (const path of ["/instructor/exams", "/instructor/students", "/instructor/content"]) {
        await page.goto(path);
        await page.locator("[data-page-header-band] [data-avatar]").click();
        await expect(page).toHaveURL(/\/profile$/);
        await page.getByRole("link", { name: "Back to Overview" }).click();
        await expect(page).toHaveURL(/\/instructor$/);
      }
    });

    test("an action row opens the filtered Students list with the same count; Clear filter and Back work", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const row = page.locator('[data-action="needs-attention"]');
      const n = Number(/(\d+) students need attention/.exec(await row.innerText())![1]);
      await row.click();
      await expect(page).toHaveURL(/\/instructor\/students\?filter=needs&from=overview$/);
      await expect(page.locator("[data-showing]:visible")).toHaveText("Showing: Needs attention");
      await expect(page.locator("[data-student]:visible")).toHaveCount(n);
      for (const line of await page.locator("[data-student-line]:visible").all()) {
        await expect(line).toContainText("Needs attention");
      }
      await page.getByRole("button", { name: "Clear filter" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
      await expect(page.locator("[data-student]:visible")).toHaveCount(15);
      await page.goto("/instructor");
      await row.click();
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("the weakest topic: a data card without a chevron, Assign exam on this topic with the topic and title prefilled, All topics", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const card = page.locator("[data-weakest-topic]");
      const id = (await card.getAttribute("data-weakest-topic"))!;
      await expect(card).toContainText(/\d+ of 13 students at or above the pass mark/);
      expect(await card.evaluate((el) => !!el.querySelector("svg.lucide-chevron-right"))).toBe(
        false,
      );
      expect(await card.evaluate((el) => el.tagName)).toBe("DIV");
      const name = (await card.locator("span.type-body").innerText())
        .replace(/^S\d+\s*/, "")
        .trim();
      const assign = page.getByRole("link", { name: "Assign exam on this topic" });
      expect(await bg(assign)).toBe(OLIVE_TINT);
      expect((await assign.boundingBox())!.height).toBe(52);
      await assign.click();
      await expect(page).toHaveURL(
        new RegExp(`/instructor/exams/new\\?topic=${id}&from=overview$`),
      );
      await expect(page.getByLabel("Exam title")).toHaveValue(`Exam: ${name}`);
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(1);
      await expect(page.locator("input[name=topics][value=" + id + "]")).toBeChecked();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect.poll(() => page.url()).toMatch(/\/instructor(\/exams\/new.*)?$/);
      await page.goto("/instructor");
      // the underlined inline link opens Topics, whose first card is the same topic
      const all = page.getByRole("link", { name: "All topics" });
      expect(await all.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgba(0, 0, 0, 0)",
      );
      await all.click();
      await expect(page).toHaveURL(/\/instructor\/topics$/);
      await expect(page.locator("[data-topic-card]").first()).toHaveAttribute(
        "data-topic-card",
        id,
      );
    });

    test("Topics: all ten, weakest first, cards open the topic filter; Back and Clear filter work", async ({
      page,
    }) => {
      await page.goto("/instructor/topics");
      await expect(page.getByRole("heading", { name: "Topics", level: 1 })).toBeVisible();
      const cards = page.locator("[data-topic-card]");
      await expect(cards).toHaveCount(10);
      const shares: number[] = [];
      for (const card of await cards.all()) {
        const b = (await card.boundingBox())!;
        expect([b.height, b.x, b.width]).toEqual([80, 16, width - 32]);
        const m = /(\d+) of (\d+) students at or above the pass mark/.exec(await card.innerText());
        if (m) shares.push(Number(m[1]) / Number(m[2]));
        expect(await card.innerText()).not.toContain("%");
      }
      expect(shares).toEqual([...shares].sort((a, b) => a - b));
      await expect(page.locator("[data-demo-note]:visible")).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
      const first = cards.first();
      const id = (await first.getAttribute("data-topic-card"))!;
      const passing = /(\d+) of (\d+)/.exec(await first.innerText())!;
      await first.locator("a").click();
      await expect(page).toHaveURL(new RegExp(`/instructor/students\\?topic=${id}&from=topics$`));
      await expect(page.locator("[data-showing]:visible")).toContainText(
        `Below pass mark in ${id} · `,
      );
      await expect(page.locator("[data-student]:visible")).toHaveCount(
        Number(passing[2]) - Number(passing[1]),
      );
      await page.getByRole("link", { name: "Back to Topics" }).click();
      await expect(page).toHaveURL(/\/instructor\/topics$/);
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await page.goto("/instructor/topics");
      await cards.first().locator("a").click();
      await page.getByRole("button", { name: "Clear filter" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
    });

    test("an exam due soon with students not started is the first row; Remind removes it", async ({
      page,
    }) => {
      // assign an exam due in 3 days: nobody has started it
      await page.goto("/instructor/exams/new");
      await page.locator("fieldset label:visible", { hasText: "Responding to an alarm" }).click();
      await page.locator("fieldset label:visible", { hasText: "Checking the route" }).click();
      await page.getByText("In 3 days").click();
      await page.getByLabel("Exam title").fill("Exam: Soon");
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1/);
      const id = new URL(page.url()).pathname.split("/").pop()!;
      await page.goto("/instructor");
      const row = page.locator('[data-action="exam-not-started"]');
      await expect(row).toBeVisible();
      await expect(page.locator("[data-action]").first()).toHaveAttribute(
        "data-action",
        "exam-not-started",
      );
      await expect(row).toContainText(/\d+ students have not started Exam: Soon/);
      await expect(row).toContainText("Due in 3 days");
      // it opens the Exam detail, where Remind students is
      await row.click();
      await expect(page).toHaveURL(new RegExp(`/instructor/exams/${id}\\?from=overview$`));
      await page.getByRole("button", { name: "Remind students who have not started" }).click();
      await expect(page.locator("[data-message]")).toContainText("Reminder sent to");
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      // the condition is resolved: the row is gone, the others stay
      await expect(page.locator('[data-action="exam-not-started"]')).toHaveCount(0);
      await expect(page.locator('[data-action="needs-attention"]')).toBeVisible();
      // the exam is the nearest one in EXAMS, with its not started count
      await expect(page.locator(`[data-exam-card="${id}"]`)).toContainText(
        /Passed \d+ of 15 · \d+ not started/,
      );
    });

    test("a draft set is a row that opens its Review; publishing it removes the row", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      const csv =
        "topic,question,option_a,option_b,option_c,option_d,correct,explanation,guide_reference,image_url\nS2,What is safest?,Marked exit,Lift,Wait,,A,The marked exit.,S2,";
      await page
        .locator("[data-file-input]")
        .setInputFiles({ name: "my set.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
      await page.getByRole("button", { name: "Import and review" }).click();
      await expect(page).toHaveURL(/\/instructor\/content\/c[a-z0-9]+$/, { timeout: 10_000 });
      const reviewUrl = page.url();
      await page.goto("/instructor");
      const row = page.locator('[data-action="draft-set"]');
      await expect(row).toContainText("1 imported set is not published");
      await expect(row).toContainText("my set");
      await row.click();
      await expect(page).toHaveURL(reviewUrl);
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Publish" }).click();
      await expect(page.locator("[data-message]")).toContainText("Published.");
      await page.goto("/instructor");
      await expect(page.locator('[data-action="draft-set"]')).toHaveCount(0);
    });

    test("button hierarchy: a Secondary Assign exam under the exam card, no Primary on the screen", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const assign = page.getByRole("link", { name: "Assign exam", exact: true });
      await expect(assign).toHaveCount(1);
      expect(await bg(assign)).toBe(OLIVE_TINT);
      const a = (await assign.boundingBox())!;
      expect(a.height).toBe(52);
      const card = (await page.locator("[data-exam-card]").boundingBox())!;
      expect(a.y).toBeGreaterThan(card.y + card.height);
      const primaries = await page
        .locator("main a, main button")
        .evaluateAll(
          (els, color) => els.filter((el) => getComputedStyle(el).backgroundColor === color).length,
          PRIMARY,
        );
      expect(primaries).toBe(0);
    });

    test("every tap target is at least 44px and every link goes somewhere", async ({ page }) => {
      await page.goto("/instructor");
      for (const link of await page.locator("main a:visible").all()) {
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        expect(await link.getAttribute("href")).toMatch(/^\/(instructor|profile)/);
      }
    });

    test("the exam card opens the Exam detail with the same count, and Back returns to the Overview", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const id = (await page.locator("[data-exam-card]").getAttribute("data-exam-card"))!;
      const passed = await passedOf(page, id);
      await page.locator("[data-exam-card]").click();
      await expect(page).toHaveURL(new RegExp(`/instructor/exams/${id}\\?from=overview$`));
      await expect(page.locator("[data-count=certified] .tabular-nums")).toHaveText(String(passed));
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("Assign exam from the Overview: Back and Cancel return to the Overview", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await page.getByRole("link", { name: "Assign exam", exact: true }).click();
      await expect(page).toHaveURL(/\/instructor\/exams\/new\?from=overview$/);
      await expect(page.getByRole("link", { name: "Back to Overview" })).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("with no active exam the Overview says so and the one Primary Assign exam appears", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-active");
      await page.getByRole("button", { name: "Close exam now" }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Close exam" }).click();
      await expect(page.getByRole("button", { name: "Close exam now" })).toHaveCount(0);
      await page.goto("/instructor");
      await expect(page.locator("[data-no-exam]")).toContainText("No active exam");
      // and the row "No active exam / Assign an exam to your group" opens Assign exam
      const noExamRow = page.locator('[data-action="no-exam"]');
      await expect(noExamRow).toContainText("Assign an exam to your group");
      await expect(page.locator("[data-exam-card]")).toHaveCount(0);
      const assign = page.getByRole("link", { name: "Assign exam", exact: true });
      await expect(assign).toHaveCount(1);
      expect(await bg(assign)).toBe(PRIMARY);
      // the row opens Assign exam; assigning an exam resolves it (the row and the empty card go)
      await noExamRow.click();
      await expect(page).toHaveURL(/\/instructor\/exams\/new\?from=overview$/);
      await page.locator("fieldset label:visible", { hasText: "Responding to an alarm" }).click();
      await page.locator("fieldset label:visible", { hasText: "Checking the route" }).click();
      await page.getByText("In 1 week").click();
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1&from=overview/);
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await expect(page.locator('[data-action="no-exam"]')).toHaveCount(0);
      await expect(page.locator("[data-no-exam]")).toHaveCount(0);
      await expect(page.locator("[data-exam-card]")).toHaveCount(1);
    });

    test("the Instructor Profile has Group A (read-only), Demo mode, About and Sign out, but no Direction or Certificates", async ({
      page,
    }) => {
      await page.goto("/profile");
      await expect(page.locator("[data-group-row]")).toContainText("Group A");
      await expect(page.locator("[data-group-row] a, [data-group-row] svg")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "About this prototype" })).toBeVisible();
      await expect(page.locator("[data-sign-out]")).toBeVisible();
      await expect(page.getByRole("group", { name: "Direction" })).toHaveCount(0);
      await expect(page.locator("[data-certificates-row]")).toHaveCount(0);
      await expect(page.getByText("Reset progress")).toHaveCount(0);
    });

    test("no external network request on the Overview", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await page.goto("/instructor");
      await expect(page.locator("[data-group-readiness]")).toBeVisible();
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });

  test.describe(`The full Instructor journey at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("sign up as Instructor, assign an exam, a student passes it, and every screen shows the same counts", async ({
      page,
    }) => {
      await signUpInstructor(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Ira Instructor");
      await expect(page.locator("[data-group-line]")).toHaveText(
        "Group A · 15 students · 2 not started",
      );

      // assign an exam from the Overview (3 days: the nearest deadline)
      await page.getByRole("link", { name: "Assign exam", exact: true }).click();
      await page.locator("fieldset label:visible", { hasText: "Responding to an alarm" }).click();
      await page.locator("fieldset label:visible", { hasText: "Checking the route" }).click();
      await page.getByText("In 3 days").click();
      await page.getByLabel("Exam title").fill("Exam: Journey");
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1&from=overview/);
      const examId = new URL(page.url()).pathname.split("/").pop()!;
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await expect(page.locator(`[data-exam-card="${examId}"]`)).toContainText("Exam: Journey");
      const before = await passedOf(page, examId);

      // as a student: the notification and the Assigned exam card, then pass it
      await switchRole(page, "Student");
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);
      await page.getByRole("link", { name: /^Notifications, \d+ unread$/ }).click();
      await expect(page.getByText("New exam assigned: Exam: Journey")).toBeVisible();
      await page.locator(`[data-assigned-exam="${examId}"]`).click();
      await page
        .getByRole("button", { name: /^Start exam/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/exam\/session$/);
      await page.evaluate((answerOf) => {
        const key = Object.keys(localStorage).find((k) => k.startsWith("ast.exam.v1"))!;
        const stored = JSON.parse(localStorage.getItem(key)!);
        const answers = (stored.value.itemIds as string[]).map((id) => ({
          itemId: id,
          optionId: answerOf[id],
        }));
        stored.value.answers = answers;
        stored.value.index = answers.length - 1;
        localStorage.setItem(key, JSON.stringify(stored));
      }, Object.fromEntries(correctOf));
      await page.reload();
      await page.getByRole("button", { name: "Finish", exact: true }).click();
      await expect(page).toHaveURL(/\/exam\/results$/);
      await expect(page.getByRole("heading", { name: "Passed" })).toBeVisible();

      // back as the instructor: the same number everywhere
      await switchRole(page, "Instructor");
      await expect(page.locator(`[data-exam-card="${examId}"]`)).toBeVisible();
      expect(await passedOf(page, examId)).toBe(before + 1);
      await page.goto(`/instructor/exams/${examId}`);
      await expect(page.locator("[data-count=certified] .tabular-nums")).toHaveText(
        String(before + 1),
      );
      const mine = page.locator('[data-student-row="ira@example.com"]');
      await expect(mine).toHaveAttribute("data-status", "certified");
      await page.goto("/instructor/students/ira%40example.com");
      await expect(page.locator(`[data-exam-row="${examId}"]`)).toHaveAttribute(
        "data-status",
        "certified",
      );
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });
}
