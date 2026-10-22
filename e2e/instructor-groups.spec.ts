import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue, signedInStudent } from "./auth-seed";

const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};

// registered tokens as computed colours
const PRIMARY = "rgb(63, 70, 56)";
const SAND = "rgb(240, 236, 230)";
const WHITE = "rgb(255, 255, 255)";
const SUCCESS_BG = "rgb(225, 234, 218)";
const ATTENTION_BG = "rgb(241, 228, 200)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const NEUTRAL_TILE = "rgb(226, 222, 214)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const box = async (loc: ReturnType<Page["locator"]>) => (await loc.first().boundingBox())!;

const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });
// a SelectableRow is a label around a hidden input: a tap on its text toggles it
const row = (page: Page, text: string) => page.locator("fieldset label", { hasText: text });

async function choose(page: Page, name: string) {
  await page.goto("/instructor");
  await page.locator("[data-group-pill]").click();
  await expect(page).toHaveURL(/\/instructor\/groups\?from=overview$/);
  await page.getByRole("radio", { name }).check({ force: true });
  await expect(page).toHaveURL(/\/instructor$/);
}

for (const width of [360, 430]) {
  test.describe(`Instructor groups at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the five blocks are in the reference order with its structure and our tokens", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Maryana");
      await expect(page.locator("[data-subtitle]")).toHaveText("Here is how Rescue team is doing.");
      const main = page.locator("main");
      const labels = await main.locator("h2").allInnerTexts();
      expect(labels).toEqual(["GROUP READINESS", "NEEDS YOUR ACTION", "EXAMS", "WEAKEST TOPIC"]);
      // the pill: 40px high inside a 44px tap target, sand fill, under the subtitle
      const pill = page.locator("[data-group-pill]");
      expect((await box(pill)).height).toBeGreaterThanOrEqual(44);
      expect((await box(pill.locator("span").first())).height).toBe(40);
      expect(await bg(pill.locator("span").first())).toBe(SAND);
      await expect(pill).toContainText("Rescue team");
      expect((await box(pill)).y).toBeGreaterThan((await box(page.locator("[data-subtitle]"))).y);
      // readiness card: white, the figure, the soft success pill with an arrow, the ring, the strip
      const card = page.locator("[data-group-readiness]");
      expect(await bg(card)).toBe(WHITE);
      await expect(page.locator("[data-readiness-figure]")).toHaveText(/^\d+%$/);
      const delta = page.locator("[data-delta]");
      await expect(delta).toHaveText("+4 points this week");
      expect(await bg(delta)).toBe(SUCCESS_BG);
      await expect(delta.locator("svg.lucide-arrow-up")).toHaveCount(1);
      await expect(page.locator("[data-ring]")).toHaveAttribute("aria-hidden", "true");
      expect(
        await page
          .locator("[data-ring] circle")
          .last()
          .evaluate((el) => getComputedStyle(el).stroke),
      ).toBe(PRIMARY);
      const strip = page.locator("[data-readiness-strip]");
      expect(await bg(strip)).toBe(SAND);
      expect((await box(strip)).height).toBeGreaterThanOrEqual(44);
      await expect(strip).toHaveText("Rescue team · 15 students · 2 not started");
      // actions: one card, 72px rows, the neutral 44px rounded tile
      const rows = page.locator("[data-action]");
      expect(await rows.count()).toBeLessThanOrEqual(3);
      for (const row of await rows.all()) {
        expect((await box(row)).height).toBe(72);
        const tile = row.locator("[data-icon-tile]");
        expect([(await box(tile)).width, (await box(tile)).height]).toEqual([44, 44]);
        expect(await bg(tile)).toBe(NEUTRAL_TILE);
      }
      // exams: ONE card, the exam row, a Secondary Assign exam with an icon
      await expect(page.locator("[data-exams-card]")).toHaveCount(1);
      expect((await box(page.locator("[data-exam-card]"))).height).toBe(88);
      const assign = page.locator("[data-exams-card]").getByRole("link", { name: "Assign exam" });
      expect(await bg(assign)).toBe(OLIVE_TINT);
      expect((await box(assign)).height).toBe(52);
      await expect(assign.locator("svg.lucide-circle-plus")).toHaveCount(1);
      await expect(page.locator("[data-block-note]")).toHaveText("1 Active");
      // weakest topic: card with the badge, a Secondary and a centred underlined link
      const weak = page.locator("[data-weakest-topic]");
      expect(await bg(weak)).toBe(WHITE);
      await expect(weak.getByRole("link", { name: "All topics" })).toBeVisible();
      // the single-percentage rule, no sideways scroll, nothing external
      expect(((await main.innerText()).match(/%/g) ?? []).length).toBe(1);
      expect(await noSidewaysScroll(page)).toBe(true);
      const primaries = await page
        .locator("main a, main button")
        .evaluateAll(
          (els, c) => els.filter((e) => getComputedStyle(e).backgroundColor === c).length,
          PRIMARY,
        );
      expect(primaries).toBe(0);
      await expect(page.locator("[data-demo-note]")).toHaveText(
        "Demo group. Student data on this screen is simulated.",
      );
    });

    test("a decrease shows amber with a down arrow, never red (Military training)", async ({
      page,
    }) => {
      await choose(page, "Military training");
      const delta = page.locator("[data-delta]");
      await expect(delta).toHaveText("-3 points this week");
      expect(await bg(delta)).toBe(ATTENTION_BG);
      await expect(delta.locator("svg.lucide-arrow-down")).toHaveCount(1);
    });

    test("the pill opens the picker; the choice applies at once, persists after a reload and follows into Students and Exams", async ({
      page,
    }) => {
      await choose(page, "Military training");
      await expect(page.locator("[data-subtitle]")).toHaveText(
        "Here is how Military training is doing.",
      );
      await expect(page.locator("[data-group-pill]")).toContainText("Military training");
      await expect(page.locator("[data-group-line]")).toHaveText(
        "Military training · 12 students · 1 not started",
      );
      await page.reload();
      await expect(page.locator("[data-group-pill]")).toContainText("Military training");
      // Students follows the scope
      await nav(page).getByRole("link", { name: "Students" }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Students");
      await expect(page.locator("[data-group-pill]:visible")).toContainText("Military training");
      await expect(page.locator("[data-student]:visible")).toHaveCount(12);
      // Exams lists the exams of every group (no group switcher there)
      await nav(page).getByRole("link", { name: "Exams" }).click();
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(2);
      await expect(page.locator("[data-exam-card]:visible").last()).toContainText(
        "Military training",
      );
    });

    test("the picker has Back, the band, 'All groups' and each group with its student count; no bottom sheet", async ({
      page,
    }) => {
      await page.goto("/instructor/groups?from=exams");
      await expect(page.locator("[data-page-header-band]:visible")).toContainText("Groups");
      await expect(page.getByRole("link", { name: "Back to Exams" })).toBeVisible();
      await expect(page.getByRole("radio")).toHaveCount(3);
      await expect(page.locator("label", { hasText: "All groups" })).toContainText(
        "2 groups · 27 students",
      );
      await expect(page.locator("label", { hasText: "Rescue team" })).toContainText("15 students");
      await expect(page.locator("label", { hasText: "Military training" })).toContainText(
        "12 students",
      );
      await expect(page.getByRole("radio", { name: /Rescue team/ })).toBeChecked();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      for (const label of await page.locator("fieldset label").all()) {
        expect((await box(label)).height).toBe(72);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
      // choosing returns to where it was opened from
      await page.getByRole("radio", { name: /All groups/ }).check({ force: true });
      await expect(page).toHaveURL(/\/instructor\/exams$/);
      await expect(page.locator("[data-exam-card]:visible")).toHaveCount(2);
    });

    test("the readiness strip opens Students for the same group", async ({ page }) => {
      await page.goto("/instructor");
      await page.locator("[data-readiness-strip]").click();
      await expect(page).toHaveURL(/\/instructor\/students/);
      await expect(page.locator("[data-group-pill]:visible")).toContainText("Rescue team");
      await expect(page.locator("[data-student]:visible")).toHaveCount(15);
    });

    test("All groups: a GROUPS card instead of one average, group prefixes, a tag on each exam, no Weakest topic, no percent", async ({
      page,
    }) => {
      await choose(page, "All groups");
      await expect(page.locator("[data-subtitle]")).toHaveText(
        "Here is how your groups are doing.",
      );
      await expect(page.locator("[data-groups-card]")).toBeVisible();
      await expect(page.locator("[data-group-readiness]")).toHaveCount(0);
      await expect(page.locator("[data-ring]")).toHaveCount(0);
      await expect(page.locator("[data-weakest-topic]")).toHaveCount(0);
      expect(((await page.locator("main").innerText()).match(/%/g) ?? []).length).toBe(0);
      await expect(page.locator('[data-group-row="rescue-team"]')).toContainText(
        /15 students · \d+ need/,
      );
      await expect(page.locator('[data-group-row="military-training"]')).toContainText(
        /12 students · \d+ needs? attention/,
      );
      for (const row of await page.locator("[data-action]").all()) {
        await expect(row).toContainText(/^(Rescue team|Military training) · |imported set/);
      }
      const cards = page.locator("[data-exam-card]");
      await expect(cards).toHaveCount(2);
      await expect(cards.nth(0)).toContainText("Rescue team");
      await expect(cards.nth(1)).toContainText("Military training");
      await expect(page.locator("[data-block-note]")).toHaveText("2 Active");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("All groups: a group row selects that group and opens its students; an action row selects its group first", async ({
      page,
    }) => {
      await choose(page, "All groups");
      await page.locator('[data-group-row="military-training"]').click();
      await expect(page).toHaveURL(/\/instructor\/students/);
      await expect(page.locator("[data-group-pill]:visible")).toContainText("Military training");
      await expect(page.locator("[data-student]:visible")).toHaveCount(12);
      await page.goto("/instructor");
      await expect(page.locator("[data-group-pill]")).toContainText("Military training");
      await choose(page, "All groups");
      const action = page.locator('[data-action="needs-attention"]').last();
      await action.click();
      await expect(page).toHaveURL(/\/instructor\/students\?filter=needs/);
      await expect(page.locator("[data-group-pill]:visible")).toContainText("Military training");
    });

    test("Students in All groups lists every student; the Topics view asks for a group first", async ({
      page,
    }) => {
      await choose(page, "All groups");
      await nav(page).getByRole("link", { name: "Students" }).click();
      await expect(page.locator("[data-group-pill]:visible")).toContainText("All groups");
      await expect(page.locator("[data-student]:visible")).toHaveCount(27);
      await page.getByText("Topics", { exact: true }).click();
      await expect(page.locator('[data-empty="all-groups"]')).toContainText(
        "Select a group to see topic results.",
      );
      await expect(page.locator("[data-topic-card]")).toHaveCount(0);
      await page.getByRole("link", { name: "Choose group" }).click();
      await expect(page).toHaveURL(/\/instructor\/groups\?from=students$/);
      await page.getByRole("radio", { name: /Military training/ }).check({ force: true });
      await expect(page).toHaveURL(/\/instructor\/students$/);
    });

    test("the action rows, the exam card, Assign exam, Assign exam on this topic and All topics go to the right place", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await page.locator('[data-action="needs-attention"]').click();
      await expect(page).toHaveURL(/\/instructor\/students\?filter=needs&from=overview$/);
      await page.goto("/instructor");
      await page.locator("[data-exam-card]").click();
      await expect(page).toHaveURL(/\/instructor\/exams\/seed-active\?from=overview$/);
      await expect(page.locator("[data-group-pills]")).toContainText("Rescue team");
      await page.goto("/instructor");
      await page.locator("[data-exams-card]").getByRole("link", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams\/new\?from=overview$/);
      // the audience is the selected group
      await expect(page.locator("input[name=audience]:checked")).toHaveCount(1);
      await expect(page.getByRole("checkbox", { name: /Rescue team/ })).toBeChecked();
      await page.goto("/instructor");
      await page.getByRole("link", { name: "Assign exam on this topic" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams\/new\?topic=S\d+&from=overview$/);
      await page.goto("/instructor");
      await page.getByRole("link", { name: "All topics" }).click();
      await expect(page).toHaveURL(/\/instructor\/students\?view=topics$/);
    });

    test("Assign exam needs an audience: none is chosen in All groups, and one group is enough", async ({
      page,
    }) => {
      await choose(page, "All groups");
      await page.goto("/instructor/exams/new");
      await expect(page.locator("input[name=audience]:checked")).toHaveCount(0);
      await page.getByText("Responding to an alarm").first().click();
      await page.getByText("In 1 week").click();
      const assign = page.getByRole("button", { name: "Assign exam" });
      await expect(assign).toBeDisabled();
      await row(page, "Military training").click();
      await expect(page.locator("input[name=audience]:checked")).toHaveCount(1);
      await expect(assign).toBeEnabled();
      await row(page, "Rescue team").click();
      await expect(page.locator("input[name=audience]:checked")).toHaveCount(2);
      await row(page, "Military training").click();
      await row(page, "Rescue team").click();
      await expect(assign).toBeDisabled();
      // assign to Military training only: the Exam detail lists exactly those 12 students
      await row(page, "Military training").click();
      await assign.click();
      await expect(page).toHaveURL(/\/instructor\/exams\/grp-/);
      await expect(page.locator("[data-group-pills]")).toContainText("Military training");
      await expect(page.locator("[data-student]")).toHaveCount(12);
    });

    test("Invite students uses the selected group's code, and in All groups asks which group first", async ({
      page,
    }) => {
      await page.goto("/instructor/students/invite");
      await expect(page.locator("[data-group-code]")).toHaveText("QT-A7K2");
      await choose(page, "All groups");
      await page.goto("/instructor/students/invite");
      await expect(page.locator("[data-choose-group]")).toBeVisible();
      await expect(page.locator("[data-group-code]")).toHaveCount(0);
      await page.getByRole("radio", { name: "Military training" }).check({ force: true });
      await expect(page.locator("[data-group-code]")).toHaveText("QT-M4R9");
      await expect(page.locator('input[name="invite-link"]')).toHaveValue(/QT-M4R9$/);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the Instructor Profile lists both groups, read-only", async ({ page }) => {
      await page.goto("/profile");
      await expect(page.locator("[data-group-row]")).toContainText(
        "Rescue team, Military training",
      );
    });

    test("makes no external request and a student cannot open the picker", async ({
      browser,
      page,
    }) => {
      const external: string[] = [];
      page.on("request", (r) => {
        if (!r.url().startsWith("http://localhost:3100") && !r.url().startsWith("data:"))
          external.push(r.url());
      });
      for (const path of [
        "/instructor",
        "/instructor/groups",
        "/instructor/students",
        "/instructor/exams",
      ]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
      }
      expect(external).toEqual([]);
      const context = await browser.newContext({
        storageState: signedInStudent,
        viewport: { width, height: 800 },
      });
      const student = await context.newPage();
      await student.goto("http://localhost:3100/instructor/groups");
      await expect(student).toHaveURL("http://localhost:3100/");
      await context.close();
    });
  });
}
