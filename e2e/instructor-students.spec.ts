import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue, emptyBrowser, signedInStudent } from "./auth-seed";

const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};

type Q = { id: string; section: string; correctOptionId: string; options: { id: string }[] };
const quiz: Q[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;

// registered tokens as computed colours
const OLIVE_TINT = "rgb(224, 230, 214)";
const PRIMARY = "rgb(63, 70, 56)";
const SUCCESS_BG = "rgb(225, 234, 218)";
const ATTENTION_BG = "rgb(241, 228, 200)";
const SAND = "rgb(240, 236, 230)";
const WHITE = "rgb(255, 255, 255)";
const CODE = "482913";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const box = async (loc: ReturnType<Page["locator"]>) => (await loc.first().boundingBox())!;
const navLinks = (page: Page) => page.getByRole("navigation", { name: "Main" }).getByRole("link");
const rows = (page: Page) => page.locator("[data-student]:visible");
const chipKinds = (page: Page) =>
  rows(page).evaluateAll((els) =>
    els.map((el) => el.querySelector("[data-status-chip]")!.getAttribute("data-status-chip")!),
  );
const expectKinds = (page: Page, kinds: string[]) =>
  expect.poll(async () => [...new Set(await chipKinds(page))]).toEqual(kinds);
const order = { needs: 0, almost: 1, "not-started": 2, ready: 3 } as Record<string, number>;

/** The group is chosen on the Overview (the only screen with the group chip); Students then shows it. */
async function chooseGroup(page: Page, name: string) {
  await page.goto("/instructor");
  await page.locator("[data-group-pill]:visible").click();
  await page.locator("[data-group-option]", { hasText: name }).click();
  await expect(page.locator("[data-group-list]")).toHaveCount(0);
  await page.goto("/instructor/students");
  await expect(page.locator("[data-group-pill]")).toHaveCount(0);
}

/** The visible Primary buttons (52px, olive): a screen has one. */
const primaries = (page: Page) =>
  page
    .locator("button:visible, a:visible")
    .evaluateAll(
      (nodes, colour) =>
        nodes.filter(
          (el) =>
            getComputedStyle(el).backgroundColor === colour &&
            el.getBoundingClientRect().height >= 52,
        ).length,
      PRIMARY,
    );

async function verifyAs(page: Page) {
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
}

for (const width of [360, 430]) {
  test.describe(`Instructor students at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the navigation is Overview, Exams, Students, Content; the detail has no navigation", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await expect(navLinks(page)).toHaveText(["Overview", "Exams", "Students", "Content"]);
      await expect(navLinks(page).nth(2)).toHaveAttribute("aria-current", "page");
      await rows(page).first().click();
      await expect(page).toHaveURL(/\/instructor\/students\/.+/);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    });

    test("the top: the band with the title, the muted subtitle and the avatar, no group chip; the Students | Topics switch; the Primary Invite students at the top; grouped spacing; quiet chips", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Students");
      const band = page.locator("[data-page-header-band]:visible");
      expect(await bg(band)).toBe(SAND);
      // the subtitle: one muted sentence under the title (it may wrap on a narrow phone)
      const subtitle = band.getByText(
        "See how each student is doing and who needs your attention.",
      );
      await expect(subtitle).toBeVisible();
      expect(await subtitle.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(92, 90, 85)");
      const h1 = await box(page.getByRole("heading", { level: 1 }));
      expect((await box(subtitle)).y).toBeGreaterThan(h1.y + h1.height - 2);
      // no group chip; the avatar at the right
      await expect(page.locator("[data-group-pill]")).toHaveCount(0);
      const avatar = page.locator("[data-avatar]:visible");
      expect((await box(avatar)).x).toBeGreaterThan(width - 80);
      // the view switch
      await expect(page.getByRole("radio", { name: "Students" })).toBeChecked();
      await expect(page.getByRole("radio", { name: "Topics" })).toHaveCount(1);
      // the Primary Invite students with an icon at the top, the only Primary
      const invite = page.getByRole("link", { name: "Invite students" });
      expect(await bg(invite)).toBe(PRIMARY);
      expect((await box(invite)).height).toBe(52);
      await expect(invite.locator("svg.lucide-user-plus")).toHaveCount(1);
      const search = page.getByPlaceholder("Search students");
      expect((await box(search)).height).toBe(52);
      await expect(page.locator("svg.lucide-search")).toBeVisible();
      await expect(page.getByRole("button", { name: "Clear search" })).toHaveCount(0);
      const chips = page.locator("[data-filter-chip]");
      await expect(chips).toHaveCount(3);
      for (const chip of await chips.all()) {
        expect((await box(chip)).height).toBeGreaterThanOrEqual(44);
        expect((await box(chip.locator("span"))).height).toBe(40);
        await expect(chip).toHaveAttribute("aria-pressed", /true|false/);
        await expect(chip.locator("svg")).toHaveCount(0);
      }
      // active: tint fill, a 1px light green border, semi-bold; inactive: white, a 1px border, regular
      const active = page.locator('[data-filter-chip="all"]');
      await expect(active).toHaveAttribute("aria-pressed", "true");
      const look = (c: typeof active) =>
        c.locator("span").evaluate((el) => {
          const css = getComputedStyle(el);
          return [css.backgroundColor, css.borderTopColor, css.fontWeight];
        });
      expect(await look(active)).toEqual(["rgb(224, 230, 214)", "rgb(201, 211, 184)", "600"]);
      expect(
        await active.locator("span").evaluate((el) => getComputedStyle(el).borderTopWidth),
      ).toBe("1px");
      const inactive = page.locator('[data-filter-chip="needs"]');
      await expect(inactive).toHaveAttribute("aria-pressed", "false");
      const l = await look(inactive);
      expect(l[0]).toBe("rgb(255, 255, 255)");
      expect(l[1]).toBe("rgb(228, 223, 213)");
      expect(l[2]).toBe("400");
      // the spacing: switch, 24px, Invite, 24px, search, 12px, chips, then the list
      const sw = await box(page.getByRole("radiogroup").first());
      const gap = (a: { y: number; height: number }, b: { y: number }) =>
        Math.round(b.y - (a.y + a.height));
      expect(gap(sw, await box(invite))).toBe(24);
      expect(gap(await box(invite), await box(search))).toBe(24);
      const firstChip = await box(chips.first());
      expect(gap(await box(search), firstChip)).toBeLessThanOrEqual(12 + 2);
      expect(gap(await box(search), firstChip)).toBeGreaterThanOrEqual(12);
      expect(await primaries(page)).toBe(1);
      expect((await box(invite)).y).toBeLessThan((await box(search)).y);
      expect((await box(search)).y).toBeLessThan((await box(chips)).y);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the rows: one white card of 72px rows with hairlines; avatar 48px, bold name, the status chip UNDER the name on one line, only a chevron at the right; no dot, no last active", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await expect(rows(page)).toHaveCount(15);
      const card = page.locator("[data-student-rows]");
      expect(await bg(card)).toBe(WHITE);
      expect(((await card.innerText()).match(/%/g) ?? []).length).toBe(0);
      expect(await card.evaluate((el) => !!el.querySelector("[data-status-dot]"))).toBe(false);
      const kinds = (await chipKinds(page)).map((k) => order[k]);
      expect(kinds).toEqual([...kinds].sort((a, b) => a - b));
      for (const row of await rows(page).all()) {
        const b = await box(row);
        expect([b.height, b.x]).toEqual([72, 17]);
        expect(b.width).toBe(width - 34);
        const avatar = row.locator("[data-initials-avatar]");
        const a = await box(avatar);
        expect([a.width, a.height]).toEqual([48, 48]);
        expect(await avatar.evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe("0px");
        const name = row.locator(".type-body-strong.truncate");
        const chip = row.locator("[data-status-chip]");
        // the chip sits under the name, never beside it, and fits on one line without cutting
        expect((await box(chip)).y).toBeGreaterThan((await box(name)).y + 10);
        expect((await box(chip)).height).toBeLessThan(26);
        expect(await chip.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        await expect(chip.locator("svg")).toHaveCount(1);
        // only the chevron is at the right: it is the last thing, and no chip is right of it
        const chev = await box(row.locator("svg.lucide-chevron-right"));
        expect((await box(chip)).x + (await box(chip)).width).toBeLessThan(chev.x);
        await expect(row.locator("svg.lucide-chevron-right")).toHaveCount(1);
        await expect(row.locator("[data-status-chip]")).toHaveCount(1);
        expect(await row.evaluate((el) => el.tagName)).toBe("A");
        await expect(row).not.toContainText(/Last active|\d+d ago|today|yesterday/);
      }
      // tokens of the chips
      expect(await bg(page.locator('[data-status-chip="needs"]').first())).toBe(ATTENTION_BG);
      expect(await bg(page.locator('[data-status-chip="ready"]').first())).toBe(SUCCESS_BG);
      expect(await bg(page.locator('[data-status-chip="not-started"]').first())).toBe(SAND);
      await expect(page.locator('[data-status-chip="needs"]').first()).toHaveText(
        "Needs attention",
      );
      await expect(page.locator('[data-status-chip="almost"]').first()).toHaveText("Almost ready");
    });

    test("the muted text '· 5 to review' follows the chip when there is room and is dropped first when there is not; the chip never changes", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const needs = rows(page)
        .filter({ has: page.locator('[data-status-chip="needs"]') })
        .first();
      const muted = needs.locator("[data-muted]");
      await expect(muted).toHaveText(/^· \d+ to review$/);
      if (width === 360) await expect(muted).toBeHidden();
      else await expect(muted).toBeVisible();
      // never for Ready and Not started; "Your demo account" has no room on a phone
      await expect(
        rows(page)
          .filter({ has: page.locator('[data-status-chip="ready"]') })
          .first()
          .locator("[data-muted]"),
      ).toHaveCount(0);
      await expect(
        page.locator('[data-student="maryana@example.com"] [data-demo-account]'),
      ).toBeHidden();
      // the chip is the same width with or without the muted text
      const chip = needs.locator("[data-status-chip]");
      expect((await box(chip)).width).toBeGreaterThan(80);
      await expect(chip).toBeVisible();
    });

    test("chips filter, search matches names in any case, and they combine", async ({ page }) => {
      await page.goto("/instructor/students");
      await page.locator("[data-filter-chip=needs]").click();
      await expect(page).toHaveURL(/filter=needs/);
      await expectKinds(page, ["needs"]);
      const needsCount = await rows(page).count();
      expect(needsCount).toBeGreaterThan(0);
      await page.locator("[data-filter-chip=ready]").click();
      await expectKinds(page, ["ready"]);
      await page.locator("[data-filter-chip=all]").click();
      await expect(rows(page)).toHaveCount(15);
      // search: case-insensitive, inside the scope (Military students are not found here)
      const search = page.getByPlaceholder("Search students");
      await search.fill("MIRA");
      await expect(rows(page)).toHaveCount(1);
      await expect(rows(page).first()).toContainText("Mira Halden");
      await expect(page.getByRole("button", { name: "Clear search" })).toBeVisible();
      await search.fill("Eli Brandt");
      await expect(page.locator('[data-empty="search"]')).toBeVisible();
      // search with a chip: "ra" matches several; the chip narrows them
      await search.fill("ra");
      const both = await rows(page).count();
      await page.locator("[data-filter-chip=needs]").click();
      await expectKinds(page, ["needs"]);
      expect(await rows(page).count()).toBeLessThanOrEqual(both);
    });

    test("a search with no result: the card, the words and a Secondary 'Clear search' that clears only the search; a filter with no result has 'Clear filter'", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await page.locator("[data-filter-chip=ready]").click();
      await page.getByPlaceholder("Search students").fill("Zimmerman");
      const empty = page.locator('[data-empty="search"]');
      await expect(empty).toContainText("No students match this search.");
      await expect(empty).toContainText("Try another name or clear the filters.");
      expect(await bg(empty)).toBe(WHITE);
      // the picture: about 120px, centred above the title, decorative
      const art = empty.locator("[data-no-results-art]");
      await expect(art).toHaveAttribute("src", "/images/instructor/students-no-results.webp");
      await expect(art).toHaveAttribute("alt", "");
      const a = (await box(art))!;
      const e = (await box(empty))!;
      expect([a.width, a.height]).toEqual([120, 120]);
      expect(Math.abs(a.x + a.width / 2 - (e.x + e.width / 2))).toBeLessThanOrEqual(1);
      expect(a.y).toBeLessThan((await box(empty.getByRole("heading")))!.y);
      await expect(empty.locator("[data-empty-tile]")).toHaveCount(0);
      // the spacing: picture to title 16px, title to line 6px, line to the button 24px
      const title = (await box(empty.locator("[data-empty-title]")))!;
      const line = (await box(empty.locator("[data-empty-text]")))!;
      const action = (await box(empty.locator("[data-empty-action]")))!;
      expect(Math.round(title.y - (a.y + a.height))).toBe(16);
      expect(Math.round(line.y - (title.y + title.height))).toBe(6);
      expect(Math.round(action.y - (line.y + line.height))).toBe(24);
      expect(await art.evaluate((el: HTMLImageElement) => el.naturalWidth > 0)).toBe(true);
      expect(await noSidewaysScroll(page)).toBe(true);
      const clear = empty.getByRole("button", { name: "Clear search" });
      expect(await bg(clear)).toBe(OLIVE_TINT);
      await clear.click();
      await expect(page.getByPlaceholder("Search students")).toHaveValue("");
      // the chip is still Ready: only the search was cleared
      await expect(page.locator('[data-filter-chip="ready"]')).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(page.locator("[data-empty]")).toHaveCount(0);
      expect(((await page.locator("main").innerText()).match(/COHORT/gi) ?? []).length).toBe(0);
    });

    test("a status that is not a chip comes with the filter line and Clear filter; Back returns to where the list came from", async ({
      page,
    }) => {
      await page.goto("/instructor/students?filter=not-started&from=overview");
      const line = page.locator("[data-filter-line]:visible");
      await expect(line).toBeVisible();
      await expect(line.locator("svg.lucide-funnel")).toHaveCount(1);
      await expect(page.locator("[data-showing]:visible")).toHaveText("Showing: Not started");
      expect((await box(line)).height).toBeGreaterThanOrEqual(44);
      expect(new Set(await chipKinds(page))).toEqual(new Set(["not-started"]));
      await expect(page.locator("[data-filter-chip] input:checked")).toHaveCount(0);
      const clear = line.getByRole("button", { name: "Clear filter" });
      expect(await bg(clear)).toBe("rgba(0, 0, 0, 0)");
      expect(
        await clear.locator("span").evaluate((el) => getComputedStyle(el).textDecorationLine),
      ).toBe("underline");
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await page.goto("/instructor/students?filter=not-started&from=overview");
      await line.getByRole("button", { name: "Clear filter" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
      await expect(rows(page)).toHaveCount(15);
      // a topic filter from another screen
      await page.goto("/instructor/students?topic=S3&from=topics");
      await expect(page.locator("[data-showing]:visible")).toContainText(
        "Below pass mark in S3 · ",
      );
    });

    test("the Students | Topics switch: Topics shows the ten topics, weakest first, and Students returns", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await page.locator("label", { hasText: /^Topics$/ }).click();
      await expect(page).toHaveURL(/view=topics$/);
      const cards = page.locator("[data-topic-card]");
      await expect(cards).toHaveCount(10);
      const shares: number[] = [];
      for (const card of await cards.all()) {
        const b = await box(card);
        expect([b.height, b.x, b.width]).toEqual([80, 16, width - 32]);
        const m = /(\d+) of (\d+) at or above pass mark/.exec(await card.innerText());
        if (m) shares.push(Number(m[1]) / Number(m[2]));
        // the one-line count is never cut
        const line = card.locator("span.whitespace-nowrap");
        expect(await line.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        expect(await card.innerText()).not.toContain("%");
      }
      expect(shares).toEqual([...shares].sort((a, b) => a - b));
      await page.locator("label", { hasText: /^Students$/ }).click();
      await expect(rows(page)).toHaveCount(15);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Topics (Military training): the amber 'Needs review' tag, Assign exam on weakest topic with the topic, the title and the group", async ({
      page,
    }) => {
      await chooseGroup(page, "Military training");
      await page.goto("/instructor/students?view=topics");
      const tag = page.locator("[data-review-tag]:visible").first();
      await expect(tag).toHaveText("Needs review");
      expect(await bg(tag)).toBe(ATTENTION_BG);
      const first = page.locator("[data-topic-card]").first();
      const id = (await first.getAttribute("data-topic-card"))!;
      const name = (await first.locator("[data-topic-title]").innerText())
        .replace(/^S\d+\s*/, "")
        .trim();
      const assign = page.getByRole("link", { name: "Assign exam on weakest topic" });
      expect(await bg(assign)).toBe(OLIVE_TINT);
      await expect(assign.locator("svg.lucide-file-plus")).toHaveCount(1);
      await assign.click();
      await expect(page).toHaveURL(
        new RegExp(`/instructor/exams/new\\?topic=${id}&from=students$`),
      );
      await expect(page.getByLabel("Exam title")).toHaveValue(`Exam: ${name}`);
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(1);
      await expect(page.locator("input[name=topics][value=" + id + "]")).toBeChecked();
      await expect(page.locator("input[name=audience]:checked")).toHaveCount(1);
      await expect(page.getByRole("checkbox", { name: /Military training/ })).toBeChecked();
    });

    test("the students below the pass mark in a topic: Back, the summary, the filter line, the rows with '· S3: 2 of 5 correct', Assign exam on this topic", async ({
      page,
    }) => {
      await page.goto("/instructor/students?view=topics");
      const first = page.locator("[data-topic-card]").first();
      const id = (await first.getAttribute("data-topic-card"))!;
      const counts = /(\d+) of (\d+)/.exec(await first.innerText())!;
      await first.locator("a").click();
      await expect(page).toHaveURL(new RegExp(`/instructor/students/topic/${id}$`));
      await expect(page.getByRole("link", { name: "Back to Topics" })).toBeVisible();
      await expect(page.locator("[data-avatar]:visible")).toHaveCount(0);
      const summary = page.locator("[data-topic-summary]");
      await expect(summary).toContainText(
        `Pass mark: 80 · ${counts[1]} of ${counts[2]} students on track`,
      );
      // a white card like the student card of the detail screen, with "Topic S4" and no repeated name
      expect(await bg(summary)).toBe(WHITE);
      await expect(summary.locator("h2")).toHaveText(`Topic ${id}`);
      await expect(summary.locator("[data-initials-avatar]")).toHaveText(id);
      await expect(page.getByText("Students below the pass mark on this topic.")).toBeVisible();
      // no filter strip and no filter control
      await expect(page.locator("[data-showing], [data-filter-line]")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Clear filter" })).toHaveCount(0);
      const below = Number(counts[2]) - Number(counts[1]);
      await expect(page.locator("main")).toContainText(`${below} STUDENTS BELOW PASS MARK`);
      await expect(rows(page)).toHaveCount(below);
      for (const row of await rows(page).all()) {
        expect((await box(row)).height).toBe(72);
        await expect(row.locator("[data-status-chip]")).toBeVisible();
        const muted = row.locator("[data-muted]");
        if (await muted.isVisible())
          await expect(muted).toHaveText(new RegExp(`^· ${id}: \\d+ of \\d+ correct$`));
      }
      const assign = page.getByRole("link", { name: "Assign exam on this topic" });
      expect(await bg(assign)).toBe(OLIVE_TINT);
      await assign.click();
      await expect(page).toHaveURL(
        new RegExp(`/instructor/exams/new\\?topic=${id}&from=students$`),
      );
      // a student of the list opens the detail, and Back returns to the topic list
      await page.goto(`/instructor/students/topic/${id}`);
      await rows(page).first().click();
      await page.getByRole("link", { name: "Back to topic" }).click();
      await expect(page).toHaveURL(new RegExp(`/instructor/students/topic/${id}$`));
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the Student detail: the subtitle, the header card, READINESS, two topic groups, EXAMS, Send reminder; the only percentage is the Readiness figure", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await rows(page).first().click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Student detail");
      await expect(page.getByText("Readiness and results for each topic.")).toBeVisible();
      await expect(page.locator("[data-avatar]:visible")).toHaveCount(0);
      const header = page.locator("[data-student-header]");
      const avatar = header.locator("[data-initials-avatar]");
      expect((await box(avatar)).width).toBe(64);
      await expect(header.locator("[data-status-dot]")).toBeVisible();
      await expect(header.locator("[data-field-line]")).toHaveText(/^[A-Za-z ]+ · Rescue team$/);
      await expect(header.locator("[data-last-active]")).toHaveText(
        /^Last active (today|yesterday|\d+ days ago|\d+ weeks ago)$/,
      );
      await expect(header.locator("svg.lucide-clock")).toHaveCount(1);
      // READINESS
      await expect(page.locator("main")).toContainText("READINESS");
      await expect(page.locator("[data-readiness-number]")).toHaveText(/^\d+%$/);
      await expect(page.locator("[data-delta]")).toHaveText(
        /^(Up from \d+% last week|Down from \d+% last week|Same as last week)$/,
      );
      await expect(page.locator("[data-pass-mark]")).toHaveText("Pass mark: 80");
      await expect(page.locator("[data-practice]")).toHaveText(
        /^(Practised \d+ times this week|Practised once this week|No practice this week)$/,
      );
      // two labelled groups with counts, no BY TOPIC row, no per-row badges
      await expect(page.locator("main")).not.toContainText("BY TOPIC");
      await expect(page.locator("main")).not.toContainText("10 topics");
      const groupLabels = await page.locator("[data-topic-group] h2").allInnerTexts();
      expect(groupLabels[0]).toMatch(/^NEEDS REVIEW · \d+$/);
      expect(groupLabels[groupLabels.length - 1]).toMatch(
        /^(NOTHING TO REVIEW|NEEDS REVIEW) · \d+$/,
      );
      const topicRows = page.locator("[data-topic-row]");
      await expect(topicRows).toHaveCount(10);
      for (const row of await topicRows.all()) {
        expect((await box(row)).height).toBe(80);
        await expect(row.locator("svg")).toHaveCount(0);
        await expect(row.locator("[data-review-tag], [data-on-track]")).toHaveCount(0);
      }
      await expect(page.locator("[data-review-tag]")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      // EXAMS
      await expect(page.locator("main")).toContainText("2 total");
      const exams = page.locator("[data-exam-row]");
      await expect(exams).toHaveCount(2);
      for (const row of await exams.all()) {
        await expect(row.locator("[data-status-pill]")).toHaveCount(1);
        const pill = await box(row.locator("[data-status-pill]"));
        expect(pill.height).toBeLessThan(26);
        await expect(row.locator("svg.lucide-chevron-right")).toHaveCount(0);
      }
      // Send reminder is a Secondary button with a bell
      const send = page.getByRole("button", { name: "Send reminder" });
      expect(await bg(send)).toBe(OLIVE_TINT);
      await expect(send.locator("svg.lucide-bell")).toHaveCount(1);
      // one percentage on the whole screen
      // the headline figure and, in its pill, the comparison value ("Up from 45% last week")
      expect(((await page.locator("main").innerText()).match(/%/g) ?? []).length).toBe(2);
      await expect(page.locator("[data-demo-note]:visible")).toHaveText(
        "Demo group. Student data on this screen is simulated.",
      );
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("an unknown student shows 'Student not found' with a Secondary Back to students", async ({
      page,
    }) => {
      await page.goto("/instructor/students/nobody");
      await expect(page.getByRole("heading", { name: "Student not found" })).toBeVisible();
      const back = page.getByRole("link", { name: "Back to students" });
      expect(await bg(back)).toBe(OLIVE_TINT);
      await back.click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
    });

    test("no external request and tap targets of at least 44px on the Students screens", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      for (const path of [
        "/instructor/students",
        "/instructor/students?view=topics",
        "/instructor/students/topic/S3",
        "/instructor/students/stu-01",
        "/instructor/students/invite",
      ]) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(await noSidewaysScroll(page), path).toBe(true);
        const controls = page.locator(
          'main a:visible:not([aria-label^="Back"]), main button:visible:not([aria-label^="Back"]), main label:visible:not(.sr-only)',
        );
        for (const control of await controls.all()) {
          const b = await control.boundingBox();
          if (b) expect(b.height, path).toBeGreaterThanOrEqual(44);
        }
      }
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });

  test.describe(`Students with real progress at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("a local account shows its real progress, last active and practice, and its Passed result with a certificate opens the read-only certificate", async ({
      page,
    }) => {
      const s1 = quiz.filter((q) => q.section === "S1").slice(0, 12);
      const history = [
        {
          kind: "quiz",
          mode: "practice",
          topicIds: ["S1"],
          itemIds: s1.map((q) => q.id),
          answers: s1.map((q, i) => ({
            itemId: q.id,
            optionId:
              i < 8 ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id,
          })),
          finishedAt: Date.now() - 3600_000,
        },
      ];
      const attempts = [
        {
          examId: "seed-active",
          studentId: "maryana@example.com",
          startedAt: Date.now() - 1900_000,
          correct: 18,
          total: 20,
          finishedAt: Date.now() - 1800_000,
          certificateId: "QT-2026-0007",
          answers: {},
        },
      ];
      await page.addInitScript(
        ([h, a]) => {
          if (localStorage.getItem("ast.profile.v1")) return;
          localStorage.setItem(
            "ast.profile.v1",
            JSON.stringify({ direction: "building-evacuation", onboarded: true }),
          );
          localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
          localStorage.setItem("ast.group-attempts.v1", JSON.stringify({ schema: 6, value: a }));
        },
        [history, attempts] as const,
      );
      await page.goto("/instructor/students/maryana%40example.com");
      await expect(page.locator("[data-student-name]")).toHaveText("Maryana");
      await expect(page.locator("[data-field-line]")).toHaveText("Not set · Rescue team");
      // her last activity was within the hour: today, one practice session this week, no weekly change
      await expect(page.locator("[data-last-active]")).toHaveText("Last active today");
      await expect(page.locator("[data-practice]")).toHaveText("Practised once this week");
      await expect(page.locator("[data-delta]")).toHaveCount(0);
      await expect(page.locator('[data-topic-row="S1"]')).toContainText("8 of 12 correct");
      await expect(page.locator('[data-topic-group="review"] [data-topic-row="S1"]')).toHaveCount(
        1,
      );
      // the Passed exam with a certificate: a certificate badge, a chevron, and it opens the certificate
      const passed = page.locator('[data-exam-row="seed-active"]');
      await expect(passed).toContainText("Passed");
      await expect(passed).toContainText("18 of 20 correct · 1 attempt");
      await expect(passed.locator("[data-certificate-badge]")).toHaveCount(1);
      await expect(passed.locator("svg.lucide-chevron-right")).toHaveCount(1);
      await passed.locator("a").click();
      await expect(page).toHaveURL(/\/certificate\/seed-active$/);
      await expect(page.locator("[data-certificate-name]")).toHaveText("Maryana");
      await expect(page.locator("[data-certificate-result]")).toHaveText("18 of 20 correct");
      await expect(page.getByRole("button", { name: "Save as PDF" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Share" })).toHaveCount(0);
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/instructor\/students\/maryana%40example\.com$/);
      // the closed exam she never tried: Missed, plain text, no chevron
      const plain = page.locator('[data-exam-row="seed-closed"]');
      await expect(plain).toHaveAttribute("data-status", "missed");
      await expect(plain.locator("a")).toHaveCount(0);
      await expect(plain).toContainText("Closed without a try");
    });

    test("the numbers on the Student detail come from the same helpers as the student's own Progress: the correct answers per topic and the all-topics Readiness", async ({
      page,
    }) => {
      const s1 = quiz.filter((q) => q.section === "S1").slice(0, 12);
      const history = [
        {
          kind: "quiz",
          mode: "practice",
          topicIds: ["S1"],
          itemIds: s1.map((q) => q.id),
          answers: s1.map((q, i) => ({
            itemId: q.id,
            optionId:
              i < 9 ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id,
          })),
          finishedAt: Date.now() - 3600_000,
        },
      ];
      await page.addInitScript((h) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem(
          "ast.profile.v1",
          JSON.stringify({ direction: "building-evacuation", onboarded: true }),
        );
        localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
      }, history);
      await page.goto("/instructor/students/maryana%40example.com");
      // 9 right answers over the 77 questions of the ten topics: the Readiness of the whole guide
      await expect(page.locator("[data-readiness-number]")).toHaveText(
        `${Math.floor((9 * 100) / 77)}%`,
      );
      await expect(page.locator('[data-topic-row="S1"]')).toContainText("9 of 12 correct");
      await page.goto("/profile");
      await page.getByRole("radio", { name: "Student" }).check({ force: true });
      await expect(page).toHaveURL(/\/$/);
      // the student's own Progress counts the same 9 correct answers in S1
      await page.goto("/progress");
      await expect(page.locator("main")).toContainText("9 of 40 correct");
      await expect(page.locator("main")).toContainText("Readiness 16%");
    });
  });

  test.describe(`Join link and invitations at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("the join screen: 'You are invited to Rescue team' with Create account and Sign in; an unknown code says so", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      await expect(page.locator("[data-join-title]")).toHaveText("You are invited to Rescue team");
      const create = page.getByRole("link", { name: "Create account" });
      expect(await bg(create)).toBe(PRIMARY);
      expect(await bg(page.getByRole("link", { name: "Sign in" }))).toBe(OLIVE_TINT);
      expect(await noSidewaysScroll(page)).toBe(true);
      await page.goto("/join/QT-M4R9");
      await expect(page.locator("[data-join-title]")).toHaveText(
        "You are invited to Military training",
      );
      await page.goto("/join/QT-0000");
      await expect(page.locator("[data-join-title]")).toHaveText(
        "This invitation link is not valid.",
      );
      await expect(page.getByRole("link", { name: "Create account" })).toHaveCount(0);
      const back = page.getByRole("link", { name: "Back to welcome" });
      expect(await bg(back)).toBe(OLIVE_TINT);
      await back.click();
      await expect(page).toHaveURL(/\/welcome$/);
    });

    test("Create account tells a student that the instructor can see their progress", async ({
      page,
    }) => {
      await page.goto("/sign-up");
      await expect(page.locator("[data-instructor-sees]")).toHaveText(
        "Your instructor can see your progress and exam results.",
      );
    });

    test("a Student who creates an account through the link joins that group; the invitation of the same address becomes Joined", async ({
      page,
    }) => {
      // 1. an instructor account invites an address to Military training
      await page.goto("/sign-up");
      await page.getByLabel("Full name").fill("Ira Instructor");
      await page.getByLabel("Work email").fill("ira@example.com");
      await page.getByText("Instructor", { exact: true }).click();
      await page.getByRole("button", { name: "Continue" }).click();
      await verifyAs(page);
      await expect(page).toHaveURL(/\/onboarding$/);
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await chooseGroup(page, "Military training");
      await page.goto("/instructor/students/invite");
      await page.getByRole("combobox", { name: "INVITE BY EMAIL" }).fill("nina@example.com");
      await page.getByRole("combobox", { name: "INVITE BY EMAIL" }).press("Enter");
      await page.getByRole("button", { name: "Send invitations" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
      await page.goto("/instructor/students/invite");
      await expect(page.locator('[data-pending="nina@example.com"]')).toBeVisible();
      await expect(page.locator("main")).toContainText("PENDING INVITATIONS (1)");
      // 2. sign out, open the join link of that group and create the Student account
      await page.goto("/profile");
      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL(/\/welcome$/);
      await page.goto("/join/QT-M4R9");
      await expect(page.locator("[data-join-title]")).toHaveText(
        "You are invited to Military training",
      );
      await page.getByRole("link", { name: "Create account" }).click();
      await expect(page).toHaveURL(/\/sign-up$/);
      await page.getByLabel("Full name").fill("Nina Student");
      await page.getByLabel("Work email").fill("nina@example.com");
      await page.getByText("Student", { exact: true }).click();
      await page.getByRole("button", { name: "Continue" }).click();
      await verifyAs(page);
      await expect(page).toHaveURL(/\/field-of-work$/);
      await page.getByRole("button", { name: "Skip" }).click();
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(page).toHaveURL(/\/$/);
      // the student's Profile tells them that the instructor can see their progress
      await page.goto("/profile");
      await expect(page.locator("[data-instructor-sees]")).toHaveText(
        "Your instructor can see your progress and exam results.",
      );
      // a signed-in person who opens a join link goes Home
      await page.goto("/join/QT-A7K2");
      await expect(page).toHaveURL(/\/$/);
      // 3. back to the instructor: the invitation is Joined, and Nina is in the Military training list
      await page.goto("/profile");
      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL(/\/welcome$/);
      await page.goto("/sign-in");
      await page.getByLabel("Work email").fill("ira@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await verifyAs(page);
      await expect(page).toHaveURL(/\/instructor$/);
      await page.waitForLoadState("networkidle");
      await page.goto("/instructor/students/invite");
      await expect(page.locator('[data-pending="nina@example.com"]')).toHaveCount(0);
      await expect(page.locator("[data-pending]")).toHaveCount(0);
      await page.goto("/instructor/students");
      await expect(page.locator("[data-group-pill]")).toHaveCount(0);
      await expect(rows(page)).toHaveCount(13);
      await expect(page.locator('[data-student="nina@example.com"]')).toContainText("Nina Student");
      await expect(
        page.locator('[data-student="nina@example.com"] [data-status-chip]'),
      ).toHaveAttribute("data-status-chip", "not-started");
    });
  });
}

test.describe("Student and the Students routes", () => {
  test.use({ storageState: signedInStudent });

  test("a student is sent Home from every Students route; a student sees the sentence about the instructor on Profile", async ({
    page,
  }) => {
    for (const path of [
      "/instructor/students",
      "/instructor/students/topic/S3",
      "/instructor/students/stu-01",
      "/instructor/students/invite",
      "/instructor/topics",
      "/join/QT-A7K2",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
    }
    await page.goto("/profile");
    await expect(page.locator("[data-instructor-sees]")).toBeVisible();
  });
});
