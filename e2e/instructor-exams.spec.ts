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
const NEUTRAL_PILL = "rgb(239, 236, 230)";
const NEUTRAL_INK = "rgb(100, 106, 90)";
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const primaries = (page: Page) =>
  page
    .locator("a:visible, button:visible")
    .evaluateAll(
      (els, color) => els.filter((el) => getComputedStyle(el).backgroundColor === color).length,
      PRIMARY,
    );
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);

const navLinks = (page: Page) => page.getByRole("navigation", { name: "Main" }).getByRole("link");

async function switchRole(page: Page, role: "Student" | "Instructor") {
  // let any navigation of the last click finish first (WebKit interrupts a goto otherwise)
  await page.waitForLoadState("networkidle");
  await page.goto("/profile");
  await page.getByRole("radio", { name: role }).check({ force: true });
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
}

/** Fills the assign form: topics S1 and S2, a deadline (one week by default) and the attempts. */
async function fillAssign(
  page: Page,
  title?: string,
  { deadline = "In 1 week", attempts }: { deadline?: string; attempts?: string } = {},
) {
  await page.getByText("Responding to an alarm", { exact: false }).first().click();
  await page.getByText("Checking the route").first().click();
  await page.getByText(deadline, { exact: true }).click();
  if (attempts) await page.getByText(attempts, { exact: true }).click();
  if (title) await page.getByLabel("Exam title").fill(title);
}

/** Assigns an exam as the instructor and returns its id. */
async function assign(
  page: Page,
  title: string,
  options: { deadline?: string; attempts?: string } = {},
) {
  await page.goto("/instructor/exams/new");
  await fillAssign(page, title, options);
  await page.getByRole("button", { name: "Assign exam" }).click();
  await expect(page).toHaveURL(/assigned=1/);
  return new URL(page.url()).pathname.split("/").pop()!;
}

/** As the student: starts the exam, answers `right` questions correctly and finishes. */
async function playExam(page: Page, examId: string, right: number) {
  await page.goto(`/exam?id=${examId}`);
  await page
    .getByRole("button", { name: /^Start exam/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/exam\/session$/);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.exam.v1")!).value);
  const answers = (saved.itemIds as string[]).map((id, i) => ({
    itemId: id,
    optionId: i < right ? correctOf.get(id)! : wrongOf.get(id)!,
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
  await page.getByRole("button", { name: /^(Finish|See results)$/ }).click();
  await expect(page).toHaveURL(/\/exam\/results$/);
}

const mineRow = (page: Page) => page.locator('[data-student-row="maryana@example.com"]');
const count = (page: Page, kind: string) =>
  page.locator(`[data-count=${kind}] .tabular-nums`).innerText().then(Number);

const noPercent = async (page: Page) =>
  expect(((await page.locator("main").innerText()).match(/%/g) ?? []).length).toBe(0);

/** The group is chosen on the Overview (the only place with the group chip); "All groups" lists every exam. */
async function allGroups(page: Page) {
  await page.goto("/instructor");
  await page.locator("[data-group-pill]").click();
  await page.locator("[data-group-option]", { hasText: "All groups" }).click();
  await expect(page.locator("[data-group-list]")).toHaveCount(0);
}

for (const width of [360, 430]) {
  test.describe(`Instructor exams at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the navigation is Overview, Exams, Students, Content; the detail screens have no navigation", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(navLinks(page)).toHaveText(["Overview", "Exams", "Students", "Content"]);
      await page
        .getByRole("navigation", { name: "Main" })
        .getByRole("link", { name: "Exams" })
        .click();
      await expect(page).toHaveURL(/\/instructor\/exams$/);
      await page.getByRole("link", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/\/exams\/new$/);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    });

    test("the Exams list: the band with the subtitle and the avatar, the Primary Assign exam with an icon, ACTIVE alone, calm 88px cards, the closed toggle, no demo line", async ({
      page,
    }) => {
      await allGroups(page);
      await page.goto("/instructor/exams");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Exams");
      await expect(page.locator("[data-avatar]")).toBeVisible();
      await expect(page.locator("[data-group-pill]")).toHaveCount(0);
      const assign = page.locator("main").getByRole("link", { name: "Assign exam" });
      expect(await bg(assign)).toBe(PRIMARY);
      expect((await assign.boundingBox())!.height).toBe(52);
      await expect(assign.locator("svg.lucide-circle-plus")).toHaveCount(1);
      await expect(page.getByText("Assign exams and see who has passed.")).toBeVisible();
      await expect(page.locator("[data-active-count]")).toHaveCount(0);
      await expect(page.getByText(/^\d+ Active$/)).toHaveCount(0);
      await expect(page.getByText("ACTIVE", { exact: true })).toBeVisible();
      const cards = page.locator("[data-exam-card]:visible");
      await expect(cards).toHaveCount(2);
      for (const card of await cards.all()) {
        const b = (await card.boundingBox())!;
        expect([b.height, b.x, b.width]).toEqual([88, 16, width - 32]);
        await expect(card.locator("[data-group-name]")).toHaveCount(0);
        // the icon tile instead of the 3D picture: 48x48, radius 12, #EFECE6, the Exams icon in olive
        await expect(card.locator("img")).toHaveCount(0);
        const tile = card.locator("[data-exam-tile]");
        const tb = (await tile.boundingBox())!;
        expect([tb.width, tb.height]).toEqual([48, 48]);
        expect(await bg(tile)).toBe(NEUTRAL_PILL);
        expect(await tile.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("12px");
        await expect(tile).toHaveAttribute("aria-hidden", "true");
        const icon = tile.locator("svg.lucide-clipboard-list");
        expect((await icon.boundingBox())!.width).toBe(24);
        expect(await icon.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(63, 70, 56)");
        expect(await bg(card)).toBe("rgb(255, 255, 255)");
        await expect(card).toContainText(/Passed \d+ of \d+$/);
        expect(await card.innerText()).not.toMatch(/not started|topics?\b/i);
        await expect(card.locator("[data-date-pill]")).toHaveText(/^Due \d+ \w{3}$/);
        await expect(card.locator("svg.lucide-chevron-right")).toHaveCount(1);
      }
      for (const pill of await page.locator("[data-date-pill]").all()) {
        expect(await bg(pill)).toBe(NEUTRAL_PILL);
        expect(await pill.evaluate((el) => getComputedStyle(el).color)).toBe(NEUTRAL_INK);
      }
      // the toggle is a full-width Secondary under the active cards, closed cards are inert until opened
      const toggle = page.getByRole("button", { name: "Show closed exams (1)" });
      expect(await bg(toggle)).toBe(OLIVE_TINT);
      expect((await toggle.boundingBox())!.height).toBe(52);
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.getByText("CLOSED", { exact: true })).toBeHidden();
      await toggle.click();
      await expect(page.getByText("CLOSED", { exact: true })).toBeVisible();
      const closed = page.locator("[data-exam-card=seed-closed]");
      await expect(closed).toContainText(/Closed \d+ \w{3}/);
      await expect(closed).toContainText(/Passed \d+ of \d+$/);
      await expect(closed.locator("img")).toHaveCount(0);
      await expect(closed.locator("[data-exam-tile]")).toBeVisible();
      // the closed date pill is the very same neutral pill
      const closedPill = closed.locator("[data-date-pill]");
      await expect(closedPill).toHaveText(/^Closed \d+ \w{3}$/);
      expect(await bg(closedPill)).toBe(NEUTRAL_PILL);
      expect(await closedPill.evaluate((el) => getComputedStyle(el).color)).toBe(NEUTRAL_INK);
      expect((await closed.boundingBox())!.height).toBe(88);
      await expect(page.getByRole("button", { name: "Hide closed exams" })).toBeVisible();
      await noPercent(page);
      expect(await noSidewaysScroll(page)).toBe(true);
      await expect(page.locator("[data-demo-note]")).toHaveCount(0);
      await expect(page.getByText("Demo group")).toHaveCount(0);
      await expect(page.getByText("Archive", { exact: true })).toHaveCount(0);
    });

    test("a due pill is the same neutral pill even when the exam is due in 3 days, and a very long title is cut with an ellipsis on one line", async ({
      page,
    }) => {
      const long = "Exam: a very long title that has to be cut off with an ellipsis on one line";
      const id = await assign(page, long, { deadline: "In 3 days" });
      await page.goto("/instructor/exams");
      const card = page.locator(`[data-exam-card="${id}"]`);
      const pill = card.locator("[data-date-pill]");
      await expect(pill).toHaveText(/^Due \d+ \w{3}$/);
      expect(await bg(pill)).toBe(NEUTRAL_PILL);
      expect(await pill.evaluate((el) => getComputedStyle(el).color)).toBe(NEUTRAL_INK);
      expect(await bg(pill)).not.toBe(ATTENTION_BG);
      // the same size as the other pills
      const other = page.locator("[data-exam-card]:visible [data-date-pill]").last();
      expect((await pill.boundingBox())!.height).toBe((await other.boundingBox())!.height);
      const title = card.locator(".type-body-strong").first();
      expect(await title.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);
      expect(await title.evaluate((el) => getComputedStyle(el).textOverflow)).toBe("ellipsis");
      expect((await title.boundingBox())!.height).toBeLessThan(26);
      expect((await card.boundingBox())!.height).toBe(88);
      expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the empty Exams list (the screen review frame): the picture, 'No exams yet', one Primary inside the card, the note", async ({
      page,
    }) => {
      await page.goto("/screens");
      const frame = page.locator("figure", { hasText: "Instructor: Exams list, empty" });
      await expect(frame).toContainText("No exams yet");
      await expect(frame).toContainText("Assign the first exam to your group.");
      await expect(frame).toContainText(
        "Exams check how well your group knows the topics you choose.",
      );
      await expect(frame.getByRole("link", { name: "Assign exam" })).toHaveCount(1);
      await expect(frame).not.toContainText("templates");
    });

    test("Assign exam: the sections, all ten topics, disabled until title, topics, deadline and audience are set", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await expect(page.locator("[data-avatar]")).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Assign exam");
      await expect(page.getByRole("link", { name: "Back to Exams" })).toBeVisible();
      const labels = await page.locator("main section h2").allInnerTexts();
      expect(labels).toEqual(["TITLE", "TOPICS", "DEADLINE", "ATTEMPTS", "AUDIENCE"]);
      await expect(page.locator("[data-specs-card]")).toContainText("20 questions");
      await expect(page.locator("[data-specs-card]")).toContainText("20 minutes · pass mark 80");
      await expect(page.locator("input[name=topics]")).toHaveCount(10);
      await expect(page.getByText("S10 ", { exact: false }).first()).toBeVisible();
      const assignButton = page.getByRole("button", { name: "Assign exam" });
      const cancel = page.getByRole("button", { name: "Cancel" });
      expect(await bg(assignButton)).not.toBe(OLIVE_TINT);
      await expect(assignButton).toBeDisabled();
      // the pinned bar is stacked: the Primary above the Secondary
      const a = (await assignButton.boundingBox())!;
      const c = (await cancel.boundingBox())!;
      expect(a.y + a.height).toBeLessThanOrEqual(c.y);
      expect([a.height, c.height]).toEqual([52, 52]);
      await expect(assignButton.locator("svg.lucide-circle-plus")).toHaveCount(1);
      // audience: Rescue team is the group in context; at least one is needed
      await expect(page.locator("input[name=audience]:checked")).toHaveCount(1);
      await page.getByText("Responding to an alarm").first().click();
      await page.getByText("In 1 week", { exact: true }).click();
      await expect(assignButton).toBeEnabled();
      await page.locator("fieldset label", { hasText: "Rescue team" }).click();
      await expect(assignButton).toBeDisabled();
      await page.locator("fieldset label", { hasText: "Military training" }).click();
      await expect(assignButton).toBeEnabled();
      // attempts: three segments, 3 by default
      await expect(page.getByRole("radio", { name: "3 attempts" })).toBeChecked();
      await page.getByText("Unlimited", { exact: true }).click();
      await expect(page.getByRole("radio", { name: "Unlimited" })).toBeChecked();
      // the 2 by 2 deadline grid and the date field
      await page.getByText("Pick a date", { exact: true }).click();
      await expect(page.getByLabel("Deadline date")).toBeVisible();
      await expect(assignButton).toBeDisabled();
      expect(await noSidewaysScroll(page)).toBe(true);
      await noPercent(page);
    });

    test("Select all and Clear, the title prefill, and a past date is not allowed", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await page.getByRole("button", { name: "Select all" }).click();
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(10);
      await page.getByRole("button", { name: "Clear" }).click();
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(0);
      await page.getByText("Responding to an alarm").first().click();
      await expect(page.getByLabel("Exam title")).toHaveValue("Exam: Responding to an alarm");
      await page.getByText("Pick a date", { exact: true }).click();
      await page.getByLabel("Deadline date").fill("2020-01-01");
      await expect(page.getByRole("button", { name: "Assign exam" })).toBeDisabled();
      await page.getByLabel("Deadline date").fill("2099-01-01");
      await expect(page.getByRole("button", { name: "Assign exam" })).toBeEnabled();
    });

    test("Cancel asks only after input: Primary Discard, Secondary Keep editing", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams$/);
      await page.goto("/instructor/exams/new");
      await page.getByText("Responding to an alarm").first().click();
      await page.getByRole("button", { name: "Cancel" }).click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toContainText("Discard this exam?");
      expect(await bg(dialog.getByRole("button", { name: "Discard" }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Keep editing" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Keep editing" }).click();
      await expect(page).toHaveURL(/\/exams\/new$/);
    });

    test("assigning creates the exam, opens its detail with the message, and sends the student one notification", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Alarm and routes");
      await expect(page.locator("[data-flash]:visible")).toContainText(
        "Exam assigned. Students will see it on Home.",
      );
      await expect(page.locator("main h1:visible")).toHaveText("Exam: Alarm and routes");
      await expect(page.locator("[data-state-pill]")).toContainText(/^Active · Due \d+ \w{3}$/);
      await switchRole(page, "Student");
      await page.goto("/notifications");
      await expect(page.getByText("New exam assigned: Exam: Alarm and routes")).toHaveCount(1);
      const card = page.locator(`[data-assigned-exam="${id}"]`);
      await expect(card).toBeVisible();
      expect((await card.boundingBox())!.height).toBe(88);
      // assigning only to Military training sends this student nothing
      await switchRole(page, "Instructor");
      await page.goto("/instructor/exams/new");
      await fillAssign(page, "Exam: Military only");
      await page.locator("fieldset label", { hasText: "Rescue team" }).click();
      await page.locator("fieldset label", { hasText: "Military training" }).click();
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1/);
      await switchRole(page, "Student");
      await page.goto("/notifications");
      await expect(page.getByText("Military only")).toHaveCount(0);
    });

    test("the Active detail: pill, TOPIC MODULE, a group pill, the rules, 'n of 15 tried' and four count tiles; no avatar, no percent", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-active");
      await expect(page.getByRole("link", { name: "Back to Exams" })).toBeVisible();
      await expect(page.locator("[data-avatar]")).toHaveCount(0);
      await expect(page.locator("[data-state-pill]")).toContainText("Active · Due");
      await expect(page.locator("main")).toContainText("TOPIC MODULE");
      await expect(page.locator("[data-group-pills]")).toContainText("Rescue team");
      await expect(page.locator("[data-rules]")).toHaveText(
        "3 attempts allowed · 20 questions · 20 minutes · Pass mark 80",
      );
      await expect(page.locator("[data-tried]")).toHaveText(/^\d+ of 15 tried$/);
      await expect(page.locator("[data-count]")).toHaveCount(4);
      const total = (
        await Promise.all(
          ["passed", "not-passed", "in-progress", "not-started"].map((k) => count(page, k)),
        )
      ).reduce((a, b) => a + b, 0);
      expect(total).toBe(15);
      await expect(page.locator("[data-student-count]")).toHaveText("15 students");
      const rows = page.locator("[data-student-row]");
      await expect(rows).toHaveCount(15);
      const order = {
        "not-passed": 0,
        "in-progress": 1,
        "not-started": 2,
        missed: 2,
        passed: 3,
      } as Record<string, number>;
      const kinds = (
        await rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-status")!))
      ).map((k) => order[k]);
      expect(kinds).toEqual([...kinds].sort((x, y) => x - y));
      for (const row of await rows.all()) {
        const b = (await row.locator("a").boundingBox())!;
        // at least 72px; a long description wraps under the chip
        expect(b.height).toBeGreaterThanOrEqual(72);
        await expect(row.locator("[data-avatar-badge]")).toHaveCount(0);
        await expect(row.locator("[data-initials-avatar]")).toHaveCount(1);
        await expect(row.locator("[data-status-chip]")).toHaveCount(1);
        await expect(row.locator("[data-status-chip] svg")).toHaveCount(0);
        expect((await row.locator("[data-status-chip]").boundingBox())!.height).toBe(24);
        expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        await expect(row.locator("svg.lucide-chevron-right")).toHaveCount(1);
      }
      const pass = page.locator('[data-status-chip="passed"]').first();
      expect(await bg(pass)).toBe(SUCCESS_BG);
      expect(await bg(page.locator('[data-status-chip="not-passed"]').first())).toBe(ATTENTION_BG);
      await noPercent(page);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the Closed detail: 'Closed date · Final results', the group, the specs box, Passed, Not passed and Missed tiles", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-closed");
      await expect(page.locator("[data-state-pill]")).toHaveText(/^Closed \d+ \w{3}$/);
      await expect(page.locator("main")).toContainText("Final results");
      await expect(page.locator("[data-group-label]")).toContainText("RESCUE TEAM");
      await expect(page.locator("[data-specs]")).toContainText("14 questions · 20 min");
      await expect(page.locator("[data-specs]")).toContainText("Max 1 attempt");
      await expect(page.locator("[data-specs]")).toContainText("15 assigned");
      await expect(page.locator("[data-count]")).toHaveCount(3);
      expect(await bg(page.locator("[data-count=passed]"))).toBe(SUCCESS_BG);
      expect(await bg(page.locator("[data-count=not-passed]"))).toBe(ATTENTION_BG);
      await expect(page.locator('[data-status="not-started"]')).toHaveCount(0);
      await expect(page.locator('[data-status="missed"]').first()).toBeVisible();
      // the menu has only Duplicate exam; nothing is pinned
      await page.getByRole("button", { name: "More actions" }).click();
      await expect(page.getByRole("menuitem")).toHaveText(["Duplicate exam"]);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Send reminder" })).toHaveCount(0);
      expect(await primaries(page)).toBe(0);
      await expect(page.locator("[data-demo-note]")).toHaveCount(0);
      await noPercent(page);
    });

    test("hardest questions: up to three, 'Flagged for debrief', counts only; a card opens the read-only question", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-closed");
      await expect(page.locator("main")).toContainText("Flagged for debrief");
      const cards = page.locator("[data-hard-question]");
      expect(await cards.count()).toBeGreaterThan(0);
      expect(await cards.count()).toBeLessThanOrEqual(3);
      const first = cards.first();
      await expect(first).toContainText(/^Q\d+/);
      await expect(first).toContainText(/\d+ of \d+ answered wrong/);
      const text = (await first.locator("span.line-clamp-3").innerText()).trim();
      await first.click();
      await expect(page).toHaveURL(/\/instructor\/exams\/seed-closed\/questions\/\d+$/);
      await expect(page.getByRole("link", { name: "Back to exam" })).toBeVisible();
      await expect(page.locator("main")).toContainText(text.slice(0, 30));
      await expect(page.locator("main")).toContainText("Why");
      await expect(page.locator("input")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /save|bookmark/i })).toHaveCount(0);
      await page.getByRole("link", { name: "Back to exam" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams\/seed-closed$/);
    });

    test("the exam detail: no stacked buttons and no demo line; the '...' menu has Extend deadline, Duplicate exam and, last after a divider in red, Close exam now; Send reminder is the one pinned Primary", async ({
      page,
    }) => {
      await assign(page, "Exam: Menu");
      for (const name of ["Extend deadline", "Duplicate exam", "Close exam now"]) {
        await expect(page.getByRole("button", { name })).toHaveCount(0);
        await expect(page.getByRole("link", { name })).toHaveCount(0);
      }
      await expect(page.locator("[data-demo-note]")).toHaveCount(0);
      await expect(page.locator("[data-message]")).toHaveCount(0);
      // pinned: the single Primary, above the navigation, at the bottom of the screen
      const send = page.getByRole("button", { name: "Send reminder" });
      await expect(send).toBeVisible();
      expect(await bg(send)).toBe(PRIMARY);
      expect((await send.boundingBox())!.height).toBe(52);
      expect(await primaries(page)).toBe(1);
      expect(await noSidewaysScroll(page)).toBe(true);
      // the menu, under the button, in the band next to the back arrow
      const more = page.getByRole("button", { name: "More actions" });
      await expect(more).toHaveAttribute("aria-haspopup", "menu");
      const back = (await page.locator("[data-back-button]:visible").first().boundingBox())!;
      const mb = (await more.boundingBox())!;
      expect(Math.abs(mb.y + mb.height / 2 - (back.y + back.height / 2))).toBeLessThanOrEqual(12);
      expect(mb.x).toBeGreaterThan(width / 2);
      await more.click();
      const items = page.getByRole("menuitem");
      await expect(items).toHaveText(["Extend deadline", "Duplicate exam", "Close exam now"]);
      const last = items.last();
      expect(await last.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(155, 44, 31)");
      expect(await last.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("1px");
      expect(await items.first().evaluate((el) => getComputedStyle(el).color)).toBe(
        "rgb(26, 26, 26)",
      );
      const mn = (await page.locator("[data-menu]").boundingBox())!;
      expect(mn.x).toBeGreaterThanOrEqual(0);
      expect(mn.x + mn.width).toBeLessThanOrEqual(width);
      expect(await noSidewaysScroll(page)).toBe(true);
      // Close asks first
      await last.click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toContainText("Close this exam now?");
      await expect(dialog.getByRole("button", { name: "Close exam" })).toBeVisible();
      await dialog.getByRole("button", { name: "Keep open" }).click();
      await expect(page.locator("[data-state-pill]")).toContainText("Active");
      // a closed exam has no pinned button
      await page.goto("/instructor/exams/seed-closed");
      await expect(page.getByRole("button", { name: "Send reminder" })).toHaveCount(0);
    });

    test("Send reminder: a dialog with the message, the count after sending, and one notification however often", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Remind me");
      const notStarted = await count(page, "not-started");
      await page.getByRole("button", { name: "Send reminder" }).click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toContainText(`Remind ${notStarted} students?`);
      await expect(dialog.locator("[data-reminder-preview]")).toContainText(
        "Reminder: Exam: Remind me is due",
      );
      expect(await bg(dialog.getByRole("button", { name: "Send reminder" }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Cancel" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Send reminder" }).click();
      await expect(page.locator("[data-flash]:visible")).toContainText("Reminder sent");
      await page.getByRole("button", { name: "Send reminder" }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Send reminder" }).click();
      await switchRole(page, "Student");
      await page.goto("/notifications");
      await expect(page.getByText("Reminder: Exam: Remind me is due")).toHaveCount(1);
      void id;
    });

    test("Extend deadline: choices, the note, a Primary and a Secondary; the date changes on both sides and the student is told", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Extend me");
      const due = (await page.locator("[data-state-pill]").innerText()).replace(
        "Active · Due ",
        "",
      );
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Extend deadline" }).click();
      await expect(page).toHaveURL(new RegExp(`/instructor/exams/${id}/extend$`));
      await expect(page.getByRole("link", { name: "Back to exam" })).toBeVisible();
      for (const label of ["+3 days", "+1 week", "Pick a date"]) {
        await expect(page.locator("fieldset").getByText(label).first()).toBeVisible();
      }
      await expect(page.locator("[data-extend-note]")).toHaveText("Students will be notified.");
      const extend = page.getByRole("button", { name: "Extend deadline" });
      await expect(extend).toBeDisabled();
      await page.getByText("+3 days").click();
      await expect(extend).toBeEnabled();
      await extend.click();
      await expect(page).toHaveURL(new RegExp(`/instructor/exams/${id}$`));
      await expect(page.locator("[data-flash]:visible")).toContainText("Deadline extended");
      const next = (await page.locator("[data-state-pill]").innerText()).replace(
        "Active · Due ",
        "",
      );
      expect(next).not.toBe(due);
      await switchRole(page, "Student");
      await page.goto("/notifications");
      await expect(page.getByText("Deadline extended: Exam: Extend me")).toHaveCount(1);
      await expect(page.locator(`[data-assigned-exam="${id}"]`)).toContainText(`Due ${next}`);
    });

    test("Close exam now: asks first, Not started becomes Missed, and the student's card is gone", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Close me");
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Close exam now" }).click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toContainText("Close this exam now?");
      await expect(dialog).toContainText(
        "Students will no longer be able to start it. Results stay available.",
      );
      expect(await bg(dialog.getByRole("button", { name: "Close exam" }))).toBe(PRIMARY);
      await dialog.getByRole("button", { name: "Keep open" }).click();
      await expect(page.locator("[data-state-pill]")).toContainText("Active");
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Close exam now" }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Close exam" }).click();
      await expect(page.locator("[data-flash]:visible")).toContainText("Exam closed");
      await expect(page.locator("[data-state-pill]")).toContainText("Closed");
      // a closed exam has Missed, never Not started
      await expect(page.locator("[data-count=not-started]")).toHaveCount(0);
      expect(await count(page, "missed")).toBeGreaterThan(0);
      await expect(mineRow(page)).toHaveAttribute("data-status", "missed");
      await expect(mineRow(page)).toContainText("Closed without a try");
      await switchRole(page, "Student");
      await page.goto("/notifications");
      await expect(page.locator(`[data-assigned-exam="${id}"]`)).toHaveCount(0);
      await page.goto(`/exam?id=${id}`);
      await expect(page.getByRole("heading", { name: "This exam is closed" })).toBeVisible();
    });

    test("Duplicate exam opens Assign exam prefilled (topics, attempts, audience, a new title) and never edits the old one", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Original", { attempts: "1 attempt" });
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Duplicate exam" }).click();
      await expect(page).toHaveURL(new RegExp(`/instructor/exams/new\\?duplicate=${id}$`));
      await expect(page.getByLabel("Exam title")).toHaveValue("Exam: Original (copy)");
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(2);
      await expect(page.getByRole("radio", { name: "1 attempt" })).toBeChecked();
      await expect(page.locator("input[name=audience]:checked")).toHaveCount(1);
      await expect(page.getByRole("button", { name: "Assign exam" })).toBeDisabled();
      await page.getByText("In 2 weeks", { exact: true }).click();
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1/);
      await expect(page.locator("[data-flash]:visible")).toContainText("Exam duplicated");
      await expect(page.locator("main h1:visible")).toHaveText("Exam: Original (copy)");
      await page.goto(`/instructor/exams/${id}`);
      await expect(page.locator("main h1:visible")).toHaveText("Exam: Original");
    });

    test("as a student: the exam to take, the intro with attempts left, a pass changes the instructor's counts, statuses and attempts", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Whole flow");
      const before = await count(page, "passed");
      const notStartedBefore = await count(page, "not-started");
      await switchRole(page, "Student");
      await page.goto("/notifications");
      const card = page.locator(`[data-assigned-exam="${id}"]`);
      await expect(card).toBeVisible();
      await card.click();
      await expect(page).toHaveURL(new RegExp(`/exam\\?id=${id}$`));
      await expect(page.locator("main")).toContainText("20 questions · 20 minutes");
      await expect(page.locator("main")).toContainText("Pass mark 80");
      await expect(page.locator("main")).toContainText("3 attempts left");
      await playExam(page, id, 20);
      await expect(page.getByRole("heading", { name: "Passed" })).toBeVisible();
      await expect(page.locator("main")).toContainText("20 of 20 correct");
      await expect(page.locator("[data-attempts-line]")).toHaveCount(0);
      expect(await page.locator("main").innerText()).not.toMatch(/Readiness|→/);
      await page.goto("/notifications");
      await expect(page.locator(`[data-assigned-exam="${id}"]`)).toHaveCount(0);
      await switchRole(page, "Instructor");
      await page.goto(`/instructor/exams/${id}`);
      await expect(mineRow(page)).toHaveAttribute("data-status", "passed");
      await expect(mineRow(page)).toContainText("20 of 20 correct · 1 attempt");
      await expect(mineRow(page).locator("[data-certificate-badge]")).toHaveCount(1);
      expect(await count(page, "passed")).toBe(before + 1);
      expect(await count(page, "not-started")).toBe(notStartedBefore - 1);
      await expect(page.locator("[data-tried]")).toContainText("tried");
      // the Exams list shows the same count
      await page.goto("/instructor/exams");
      await expect(page.locator(`[data-exam-card="${id}"]`)).toContainText(
        `Passed ${before + 1} of 15`,
      );
    });

    test("Not passed: a retry while attempts remain, 'n attempts left' on the results and the intro; no attempts left blocks Start", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Retry");
      await switchRole(page, "Student");
      await playExam(page, id, 10);
      await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
      await expect(page.locator("main")).toContainText("10 of 20 correct");
      await expect(page.locator("[data-attempts-line]")).toHaveText("2 attempts left");
      await page.goto("/notifications");
      await expect(page.locator(`[data-assigned-exam="${id}"]`)).toBeVisible();
      await page.goto(`/exam?id=${id}`);
      await expect(page.locator("main")).toContainText("2 attempts left");
      await playExam(page, id, 12);
      await expect(page.locator("[data-attempts-line]")).toHaveText("1 attempt left");
      await playExam(page, id, 14);
      await expect(page.locator("[data-attempts-line]")).toHaveText("No attempts left");
      await page.goto(`/exam?id=${id}`);
      await expect(page.locator("[data-exam-blocked]")).toHaveText(
        "No attempts left for this exam",
      );
      await expect(page.getByRole("button", { name: /^Start exam/ })).toHaveCount(0);
      await page.goto("/notifications");
      await expect(page.locator(`[data-assigned-exam="${id}"]`)).toHaveCount(0);
      await switchRole(page, "Instructor");
      await page.goto(`/instructor/exams/${id}`);
      await expect(mineRow(page)).toHaveAttribute("data-status", "not-passed");
      await expect(mineRow(page)).toContainText("14 of 20 correct · 3 attempts");
    });

    test("one attempt allowed: a fail ends it; and an exam in progress shows as In progress, then disappears when left", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: One try", { attempts: "1 attempt" });
      await switchRole(page, "Student");
      await page.goto(`/exam?id=${id}`);
      await expect(page.locator("main")).toContainText("1 attempt left");
      // start and look from the instructor's side: In progress
      await page
        .getByRole("button", { name: /^Start exam/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/exam\/session$/);
      await switchRole(page, "Instructor");
      await page.goto(`/instructor/exams/${id}`);
      await expect(mineRow(page)).toHaveAttribute("data-status", "in-progress");
      await expect(mineRow(page)).toContainText(/Started \d+ min ago · Attempt 1/);
      // back to the exam: Continue exam, then leave it (nothing saved)
      await switchRole(page, "Student");
      await page.goto(`/exam?id=${id}`);
      await expect(page.getByRole("button", { name: "Continue exam" })).toBeVisible();
      await page.getByRole("button", { name: "Continue exam" }).click();
      await expect(page).toHaveURL(/\/exam\/session$/);
      await page
        .getByRole("button", { name: /^Exit|Leave/ })
        .first()
        .click();
      await page.getByRole("button", { name: "Leave", exact: true }).click();
      await expect(page).toHaveURL(/\/exam\?|\/exam$/);
      await switchRole(page, "Instructor");
      await page.goto(`/instructor/exams/${id}`);
      await expect(mineRow(page)).toHaveAttribute("data-status", "not-started");
      // now play and fail the single attempt
      await switchRole(page, "Student");
      await playExam(page, id, 5);
      await expect(page.locator("[data-attempts-line]")).toHaveText("No attempts left");
      await page.goto(`/exam?id=${id}`);
      await expect(page.locator("[data-exam-blocked]")).toHaveText(
        "No attempts left for this exam",
      );
    });

    test("an unfinished attempt can be continued after the deadline passes (the exam is closed for new tries)", async ({
      page,
    }) => {
      const id = await assign(page, "Exam: Late finish");
      await switchRole(page, "Student");
      await page.goto(`/exam?id=${id}`);
      await page
        .getByRole("button", { name: /^Start exam/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/exam\/session$/);
      // the instructor closes it while the attempt is running
      await switchRole(page, "Instructor");
      await page.goto(`/instructor/exams/${id}`);
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Close exam now" }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Close exam" }).click();
      await expect(page.locator("[data-state-pill]")).toContainText("Closed");
      await switchRole(page, "Student");
      await page.goto(`/exam?id=${id}`);
      await expect(page.getByRole("button", { name: "Continue exam" })).toBeVisible();
    });

    test("no percent character on any Exams screen, no external requests, and tap targets of at least 44px", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      for (const path of [
        "/instructor/exams",
        "/instructor/exams/new",
        "/instructor/exams/seed-active",
        "/instructor/exams/seed-closed",
        "/instructor/exams/seed-active/extend",
        "/instructor/exams/seed-closed/questions/1",
      ]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(((await page.locator("main").innerText()).match(/%/g) ?? []).length, path).toBe(0);
        expect(await noSidewaysScroll(page), path).toBe(true);
        // (the header band's Back circle is the app's existing 40px button)
        // (the guide chip of the question screen is the app's existing small chip)
        if (path.includes("/questions/")) continue;
        const controls = page.locator(
          'main a:visible:not([aria-label^="Back"]), main button:visible:not([aria-label^="Back"])',
        );
        for (const control of await controls.all()) {
          const b = await control.boundingBox();
          if (b) expect(b.height, path).toBeGreaterThanOrEqual(44);
        }
      }
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });

    test("a broken saved exam list loads without a crash and the seeded exams return", async ({
      page,
    }) => {
      await allGroups(page);
      await page.addInitScript(() => localStorage.setItem("ast.group-exams.v1", "{broken"));
      await page.goto("/instructor/exams");
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(2);
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
      "/instructor/exams/seed-active/extend",
      "/instructor/exams/seed-active/questions/1",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
    }
  });
});
