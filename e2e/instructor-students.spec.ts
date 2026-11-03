import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue, emptyBrowser, signedInStudent } from "./auth-seed";
import { demoRole, joinAsStudent } from "./join-flow";

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
const NEUTRAL_CHIP = "rgb(239, 236, 230)";
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
const filterButton = (page: Page) => page.locator("[data-filter-button]:visible");
const sheet = (page: Page) => page.locator("[data-filter-sheet]");
const option = (page: Page, value: string) =>
  page.locator(`[data-filter-sheet] label:has(input[value="${value}"])`);
const showButton = (page: Page) =>
  sheet(page).getByRole("button", { name: /^Show \d+ students?$/ });
const students = (n: number) => `Show ${n} ${n === 1 ? "student" : "students"}`;
/** Chooses a status in the filter sheet and applies it with the Primary button. */
const pick = async (page: Page, value: string) => {
  await filterButton(page).click();
  await option(page, value).click();
  await showButton(page).click();
};
/** Waits for the slide-up of the sheet to finish: its bottom edge rests on the bottom of the screen. */
const settled = (page: Page) =>
  page.waitForFunction(() => {
    const el = document.querySelector("[data-filter-sheet]");
    return (
      !!el &&
      el.getAnimations().length === 0 &&
      Math.round(el.getBoundingClientRect().bottom) === window.innerHeight
    );
  });
const filterLine = (page: Page) => page.locator("[data-status-line]:visible");
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

    test("the top: the band with the title, the muted subtitle and the avatar, no group chip; the Students | Topics switch; the Primary Invite students at the top; grouped spacing; the Status dropdown", async ({
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
      expect((await box(search)).height).toBe(48);
      await expect(page.locator("svg.lucide-search")).toBeVisible();
      await expect(page.getByRole("button", { name: "Clear search" })).toHaveCount(0);
      await expect(page.locator("[data-filter-chip], [aria-pressed]:visible")).toHaveCount(0);
      await expect(page.getByText("Status", { exact: true })).toHaveCount(0);
      const button = filterButton(page);
      await expect(button).toHaveCount(1);
      await expect(button).toHaveAttribute("aria-label", "Filter by status");
      await expect(button).toHaveAttribute("aria-haspopup", "dialog");
      await expect(button.locator("svg.lucide-sliders-horizontal")).toHaveCount(1);
      const bb = await box(button);
      expect([bb.width, bb.height]).toEqual([48, 48]);
      expect(await bg(button)).toBe(OLIVE_TINT);
      expect(await button.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("14px");
      // beside the search field, outside it, 12px away, the same height and the same row
      const sb = await box(search);
      expect(sb.height).toBe(48);
      expect(Math.round(bb.x - (sb.x + sb.width))).toBe(12);
      expect(Math.abs(bb.y - sb.y)).toBeLessThanOrEqual(1);
      expect(Math.round(bb.x + bb.width)).toBe(width - 16);
      const sw = await box(page.getByRole("radiogroup").first());
      const gap = (a: { y: number; height: number }, b: { y: number }) =>
        Math.round(b.y - (a.y + a.height));
      expect(gap(sw, await box(invite))).toBe(24);
      expect(gap(await box(invite), await box(search))).toBe(24);
      expect(await primaries(page)).toBe(1);
      expect((await box(invite)).y).toBeLessThan((await box(search)).y);
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
        // at least 72px: a long description wraps under the chip and the row grows
        expect(b.height).toBeGreaterThanOrEqual(72);
        expect([b.x, b.width]).toEqual([17, width - 34]);
        const avatar = row.locator("[data-initials-avatar]");
        const a = await box(avatar);
        expect([a.width, a.height]).toEqual([48, 48]);
        expect(await avatar.evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe("0px");
        const name = row.locator(".type-body-strong.truncate");
        const chip = row.locator("[data-status-chip]");
        // the chip sits under the name, never beside it, and fits on one line without cutting
        expect((await box(chip)).y).toBeGreaterThan((await box(name)).y + 10);
        expect((await box(chip)).height).toBe(24);
        expect(await chip.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        await expect(chip.locator("svg")).toHaveCount(0);
        expect(await chip.evaluate((el) => getComputedStyle(el).fontSize)).toBe("13px");
        expect(await chip.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("600");
        // nothing sticks out of the row
        expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
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
      expect(await bg(page.locator('[data-status-chip="not-started"]').first())).toBe(NEUTRAL_CHIP);
      expect(await bg(page.locator('[data-status-chip="almost"]').first())).toBe(NEUTRAL_CHIP);
      await expect(page.locator('[data-status-chip="needs"]').first()).toHaveText(
        "Needs attention",
      );
      await expect(page.locator('[data-status-chip="almost"]').first()).toHaveText("Almost ready");
    });

    test("the description '5 to review' follows the chip, 8px away on the same baseline, and wraps under it when there is no room; the chip never changes", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const needs = rows(page)
        .filter({ has: page.locator('[data-status-chip="needs"]') })
        .first();
      const muted = needs.locator("[data-description]");
      await expect(muted).toHaveText(/^\d+ to review$/);
      await expect(muted).toBeVisible();
      const chip = needs.locator("[data-status-chip]");
      const cb = await box(chip);
      const mb = await box(muted);
      if (mb.y < cb.y + cb.height - 4) {
        // beside the chip: 8px away, and the text sits on the chip's baseline (centres within 4px)
        expect(Math.round(mb.x - (cb.x + cb.width))).toBe(8);
        expect(Math.abs(mb.y + mb.height / 2 - (cb.y + cb.height / 2))).toBeLessThanOrEqual(4);
      } else {
        // wrapped under the chip, left-aligned with it
        expect(Math.abs(mb.x - cb.x)).toBeLessThanOrEqual(1);
      }
      // never for Ready and Not started; the demo account's own description names it
      await expect(
        rows(page)
          .filter({ has: page.locator('[data-status-chip="ready"]') })
          .first()
          .locator("[data-description]"),
      ).toHaveCount(0);
      await expect(
        page.locator('[data-student="maryana@example.com"] [data-description]'),
      ).toHaveText("Your demo account");
      expect(cb.width).toBeGreaterThan(80);
      await expect(chip).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the status filters, search matches names in any case, and they combine", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await pick(page, "needs");
      await expect(page).toHaveURL(/filter=needs/);
      await expectKinds(page, ["needs"]);
      const needsCount = await rows(page).count();
      expect(needsCount).toBeGreaterThan(0);
      await pick(page, "ready");
      await expectKinds(page, ["ready"]);
      await pick(page, "all");
      await expect(rows(page)).toHaveCount(15);
      // search: case-insensitive, inside the scope (Military students are not found here)
      const search = page.getByPlaceholder("Search students");
      await search.fill("MIRA");
      await expect(rows(page)).toHaveCount(1);
      await expect(rows(page).first()).toContainText("Mira Halden");
      await expect(page.getByRole("button", { name: "Clear search" })).toBeVisible();
      await search.fill("Eli Brandt");
      await expect(page.locator('[data-empty="search"]')).toBeVisible();
      // search with a chip: "ra" matches several; the status narrows them
      await search.fill("ra");
      const both = await rows(page).count();
      await pick(page, "needs");
      await expectKinds(page, ["needs"]);
      expect(await rows(page).count()).toBeLessThanOrEqual(both);
    });

    test("a search with no result: the card, the words and a Secondary 'Clear search' that resets the search AND the status to All", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await pick(page, "ready");
      await page.getByPlaceholder("Search students").fill("Zimmerman");
      const empty = page.locator('[data-empty="search"]');
      await expect(empty).toContainText("No students match this search.");
      await expect(empty).toContainText("Try another name or clear the filters.");
      expect(await bg(empty)).toBe(WHITE);
      // the picture: 140px, centred above the title, decorative
      const art = empty.locator("[data-no-results-art]");
      await expect(art).toHaveAttribute("src", "/images/instructor/students-no-results.webp");
      await expect(art).toHaveAttribute("alt", "");
      const a = (await box(art))!;
      const e = (await box(empty))!;
      expect([a.width, a.height]).toEqual([140, 140]);
      expect(Math.abs(a.x + a.width / 2 - (e.x + e.width / 2))).toBeLessThanOrEqual(1);
      expect(a.y).toBeLessThan((await box(empty.getByRole("heading")))!.y);
      await expect(empty.locator("[data-empty-tile]")).toHaveCount(0);
      // the spacing: picture to title 12px, title to line 6px, line to the button 24px
      const title = (await box(empty.locator("[data-empty-title]")))!;
      const line = (await box(empty.locator("[data-empty-text]")))!;
      const action = (await box(empty.locator("[data-empty-action]")))!;
      expect(Math.round(title.y - (a.y + a.height))).toBe(12);
      expect(Math.round(line.y - (title.y + title.height))).toBe(6);
      expect(Math.round(action.y - (line.y + line.height))).toBe(24);
      expect(await art.evaluate((el: HTMLImageElement) => el.naturalWidth > 0)).toBe(true);
      expect(await noSidewaysScroll(page)).toBe(true);
      const clear = empty.getByRole("button", { name: "Clear search" });
      expect(await bg(clear)).toBe(OLIVE_TINT);
      await clear.click();
      await expect(page.getByPlaceholder("Search students")).toHaveValue("");
      // both are reset: the status is All again and the whole list is back
      await expect(filterLine(page)).toHaveCount(0);
      await expect(rows(page)).toHaveCount(15);
      await expect(page.locator("[data-empty]")).toHaveCount(0);
      expect(((await page.locator("main").innerText()).match(/COHORT/gi) ?? []).length).toBe(0);
    });

    test("a status from another screen shows in the Status dropdown, with no filter line; a topic filter has the filter line and Clear filter; Back returns to where the list came from", async ({
      page,
    }) => {
      await page.goto("/instructor/students?filter=not-started&from=overview");
      await expect(page.locator("[data-filter-line]:visible")).toHaveCount(0);
      await expect(filterLine(page)).toContainText("Showing: Not started");
      expect(new Set(await chipKinds(page))).toEqual(new Set(["not-started"]));
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      // a topic filter from another screen
      await page.goto("/instructor/students?topic=S3&from=topics");
      const line = page.locator("[data-filter-line]:visible");
      await expect(line.locator("svg.lucide-funnel")).toHaveCount(1);
      await expect(page.locator("[data-showing]:visible")).toContainText(
        "Below pass mark in S3 · ",
      );
      expect((await box(line)).height).toBeGreaterThanOrEqual(44);
      const clear = line.getByRole("button", { name: "Clear filter" });
      expect(await bg(clear)).toBe("rgba(0, 0, 0, 0)");
      expect(
        await clear.locator("span").evaluate((el) => getComputedStyle(el).textDecorationLine),
      ).toBe("underline");
      await clear.click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
      await expect(rows(page)).toHaveCount(15);
    });

    test("the filter sheet: opens inside the phone column with five option cards and their counts; choosing filters and closes; the Showing line and Clear; it works with the search", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const button = filterButton(page);
      await expect(sheet(page)).toHaveCount(0);
      await expect(filterLine(page)).toHaveCount(0);
      await button.click();
      const panel = sheet(page);
      await expect(panel).toBeVisible();
      await settled(page);
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");
      await expect(panel.getByRole("heading", { name: "Filter by status" })).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      // inside the phone column: as wide as the screen up to 430, anchored to the bottom, 20px top corners
      const p = await box(panel);
      const viewportHeight = await page.evaluate(() => window.innerHeight);
      expect(Math.round(p.y + p.height)).toBe(viewportHeight);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(Math.round(p.width)).toBe(Math.min(width, 430));
      expect(await bg(panel)).toBe("rgb(246, 244, 240)");
      expect(await panel.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("20px");
      const scrim = page.locator("[data-sheet-scrim]");
      expect(await scrim.evaluate((el) => getComputedStyle(el).backgroundColor)).toMatch(
        /^(rgba\(26, 26, 26, 0\.4\)|color\(srgb 0\.1.* \/ 0\.4\))$/,
      );
      // the handle and the close x (a 44px tap area)
      await expect(page.locator("[data-sheet-handle]")).toBeVisible();
      const close = panel.getByRole("button", { name: "Close" });
      const cb = await box(close);
      expect([cb.width, cb.height]).toEqual([44, 44]);
      expect(await bg(close.locator("span").first())).toBe(SAND);
      // five cards in order, label then count in muted text, radio at the right, the chosen one outlined
      const cards = panel.locator("label");
      await expect(cards).toHaveText([
        /^All · 15$/,
        /^Needs attention · \d+$/,
        /^Almost ready · \d+$/,
        /^Ready · \d+$/,
        /^Not started · \d+$/,
      ]);
      const counts = (await panel.locator("[data-option-count]").allInnerTexts()).map((t) =>
        Number(t.replace(/\D/g, "")),
      );
      expect(counts.slice(1).reduce((a, c) => a + c, 0)).toBe(counts[0]);
      for (const card of await cards.all()) {
        expect(await bg(card)).toBe(WHITE);
        const cardBox = await box(card);
        const radio = await box(card.locator("[data-radio-area]"));
        expect(radio.x + radio.width).toBeGreaterThan(cardBox.x + cardBox.width - 20);
      }
      expect(await option(page, "all").evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(
        PRIMARY,
      );
      expect(
        await option(page, "needs").evaluate((el) => getComputedStyle(el).borderTopColor),
      ).toBe("rgb(228, 223, 213)");
      expect(await noSidewaysScroll(page)).toBe(true);
      // choosing only marks: the list stays, the sheet stays open; the Primary shows the count and applies
      await expect(showButton(page)).toHaveText(students(15));
      await option(page, "needs").click();
      await expect(sheet(page)).toBeVisible();
      await expect(showButton(page)).toHaveText(students(counts[1]));
      await expect(option(page, "needs").locator("input")).toBeChecked();
      expect(
        await option(page, "needs").evaluate((el) => getComputedStyle(el).borderTopColor),
      ).toBe(PRIMARY);
      await expect(rows(page)).toHaveCount(15);
      await expect(filterLine(page)).toHaveCount(0);
      expect(await bg(button)).toBe(OLIVE_TINT);
      // no Reset: marking All returns the draft to All, the sheet stays open and nothing is applied
      await expect(sheet(page).getByRole("button", { name: "Reset" })).toHaveCount(0);
      await expect(sheet(page).getByRole("button", { name: /^Show / })).toHaveCount(1);
      await option(page, "all").click();
      await expect(sheet(page)).toBeVisible();
      await expect(showButton(page)).toHaveText(students(15));
      await expect(option(page, "all").locator("input")).toBeChecked();
      await expect(rows(page)).toHaveCount(15);
      await page.keyboard.press("Escape");
      await expect(sheet(page)).toHaveCount(0);
      // each option filters by exactly its status once applied; the sheet closes; focus returns to the button
      const keys = ["needs", "almost", "ready", "not-started"];
      const words = ["Needs attention", "Almost ready", "Ready", "Not started"];
      for (let i = 0; i < keys.length; i++) {
        await button.click();
        await option(page, keys[i]).click();
        await expect(showButton(page)).toHaveText(students(counts[i + 1]));
        await showButton(page).click();
        await expect(sheet(page)).toHaveCount(0);
        await expect(button).toBeFocused();
        await expect(button).toHaveAttribute("aria-expanded", "false");
        await expectKinds(page, [keys[i]]);
        await expect(rows(page)).toHaveCount(counts[i + 1]);
        // the active button and the Showing line with Clear
        expect(await bg(button)).toBe("rgb(211, 220, 195)");
        await expect(button.locator("svg.lucide-sliders-horizontal")).toHaveCount(1);
        await expect(filterLine(page)).toContainText(`Showing: ${words[i]}`);
        const clear = filterLine(page).getByRole("button", { name: "Clear" });
        expect((await box(clear)).height).toBeGreaterThanOrEqual(44);
        expect(await bg(clear)).toBe("rgba(0, 0, 0, 0)");
        expect(
          await clear.locator("span").evaluate((el) => getComputedStyle(el).textDecorationLine),
        ).toBe("underline");
        const lb = await box(filterLine(page));
        const clearBox = await box(clear);
        expect(clearBox.x + clearBox.width).toBeGreaterThan(lb.x + lb.width - 24);
        expect(await noSidewaysScroll(page)).toBe(true);
      }
      // marking All and applying clears the filter from inside the sheet
      await button.click();
      await option(page, "all").click();
      await showButton(page).click();
      await expect(sheet(page)).toHaveCount(0);
      await expect(filterLine(page)).toHaveCount(0);
      await expect(rows(page)).toHaveCount(15);
      expect(await bg(button)).toBe(OLIVE_TINT);
      await pick(page, "not-started");
      // reopening starts from the applied status; Clear resets to All and hides the line
      await button.click();
      await expect(option(page, "not-started").locator("input")).toBeChecked();
      await expect(showButton(page)).toHaveText(students(counts[4]));
      await page.keyboard.press("Escape");
      await filterLine(page).getByRole("button", { name: "Clear" }).click();
      await expect(filterLine(page)).toHaveCount(0);
      await expect(rows(page)).toHaveCount(15);
      expect(await bg(button)).toBe(OLIVE_TINT);
      // together with the search
      await pick(page, "not-started");
      await page.getByPlaceholder("Search students").fill("Maryana");
      await expect(rows(page)).toHaveCount(1);
      await page.getByPlaceholder("Search students").fill("Mira");
      await expect(page.locator('[data-empty="search"]')).toContainText(
        "No students match this search.",
      );
    });

    test("closing the sheet by the x, the scrim, Escape or a swipe throws the draft away: nothing is applied and the next opening starts from the applied status", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const button = filterButton(page);
      const closers: Record<string, () => Promise<void>> = {
        x: () => sheet(page).getByRole("button", { name: "Close" }).click(),
        scrim: () => page.mouse.click(width / 2, 40),
        escape: () => page.keyboard.press("Escape"),
        swipe: async () => {
          const handle = await box(page.locator("[data-sheet-handle]"));
          const x = handle.x + handle.width / 2;
          const y = handle.y + handle.height / 2;
          await page.mouse.move(x, y);
          await page.mouse.down();
          await page.mouse.move(x, y + 30);
          await page.mouse.move(x, y + 90);
          await page.mouse.up();
        },
      };
      for (const close of Object.values(closers)) {
        await button.click();
        await settled(page);
        await option(page, "needs").click();
        await expect(option(page, "needs").locator("input")).toBeChecked();
        await close();
        await expect(sheet(page)).toHaveCount(0);
        await expect(button).toBeFocused();
        await expect(rows(page)).toHaveCount(15);
        await expect(filterLine(page)).toHaveCount(0);
        expect(await bg(button)).toBe(OLIVE_TINT);
      }
      // reopened: the draft starts from the applied status (All)
      await button.click();
      await expect(option(page, "all").locator("input")).toBeChecked();
      await expect(showButton(page)).toHaveText(students(15));
      await page.keyboard.press("Escape");
      // an applied status is the start of the next draft, and Escape afterwards keeps it
      await pick(page, "ready");
      await button.click();
      await expect(option(page, "ready").locator("input")).toBeChecked();
      await option(page, "all").click();
      await page.keyboard.press("Escape");
      await expect(filterLine(page)).toContainText("Showing: Ready");
      await button.click();
      await expect(option(page, "ready").locator("input")).toBeChecked();
    });

    test("on a 640px high phone the five options and the button fit without scrolling; the buttons stay pinned if the screen is lower", async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width, height: 640 },
        storageState: instructor,
      });
      const page = await context.newPage();
      await page.goto("/instructor/students");
      await filterButton(page).click();
      await settled(page);
      const options = page.locator("[data-sheet-options]");
      expect(await options.evaluate((el) => el.scrollHeight <= el.clientHeight + 1)).toBe(true);
      for (const card of await sheet(page).locator("label").all()) {
        expect((await box(card)).height).toBe(56);
      }
      const primary = await box(showButton(page));
      expect(primary.height).toBe(52);
      expect(await bg(showButton(page))).toBe(PRIMARY);
      expect(primary.y + primary.height).toBeLessThanOrEqual(640);
      const panel = await box(sheet(page));
      expect(panel.y).toBeGreaterThan(0);
      await expect(sheet(page).getByRole("button", { name: "Reset" })).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      // a lower screen: the options scroll, the buttons stay visible
      await page.setViewportSize({ width, height: 460 });
      await expect.poll(async () => (await box(showButton(page))).y + 52).toBeLessThanOrEqual(460);
      expect(await options.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
      expect((await box(showButton(page))).y).toBeGreaterThan(0);
      await context.close();
    });

    test("the filter sheet closes on the scrim, the x, Escape and a swipe down on the handle; focus stays inside and returns; the page does not scroll behind", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const button = filterButton(page);
      // the scrim
      await button.click();
      await expect(sheet(page)).toBeVisible();
      await page.mouse.click(width / 2, 40);
      await expect(sheet(page)).toHaveCount(0);
      await expect(button).toBeFocused();
      // the close x
      await button.click();
      await sheet(page).getByRole("button", { name: "Close" }).click();
      await expect(sheet(page)).toHaveCount(0);
      await expect(button).toBeFocused();
      // Escape
      await button.click();
      await page.keyboard.press("Escape");
      await expect(sheet(page)).toHaveCount(0);
      await expect(button).toBeFocused();
      // a swipe down on the handle
      await button.click();
      await settled(page);
      const handle = await box(page.locator("[data-sheet-handle]"));
      const x = handle.x + handle.width / 2;
      const y = handle.y + handle.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + 30);
      await page.mouse.move(x, y + 90);
      await page.mouse.up();
      await expect(sheet(page)).toHaveCount(0);
      await expect(button).toBeFocused();
      // a short drag does not close it
      await button.click();
      await settled(page);
      const h2 = await box(page.locator("[data-sheet-handle]"));
      await page.mouse.move(h2.x + h2.width / 2, h2.y + 10);
      await page.mouse.down();
      await page.mouse.move(h2.x + h2.width / 2, h2.y + 30);
      await page.mouse.up();
      await expect(sheet(page)).toBeVisible();
      // focus moves in, Tab stays inside (also backwards), the page behind does not scroll
      await expect(sheet(page)).toBeFocused();
      const inside = () => sheet(page).evaluate((el) => el.contains(document.activeElement));
      for (let i = 0; i < 9; i++) {
        await page.keyboard.press("Tab");
        expect(await inside()).toBe(true);
      }
      for (let i = 0; i < 9; i++) {
        await page.keyboard.press("Shift+Tab");
        expect(await inside()).toBe(true);
      }
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe(
        "hidden",
      );
      await page.keyboard.press("Escape");
      expect(
        await page.evaluate(() => getComputedStyle(document.documentElement).overflow),
      ).not.toBe("hidden");
    });

    test("the filter sheet slides up in about 200ms, and without animation when the person prefers reduced motion", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await filterButton(page).click();
      const name = await sheet(page).evaluate((el) => getComputedStyle(el).animationName);
      const time = await sheet(page).evaluate((el) => getComputedStyle(el).animationDuration);
      expect(name).toBe("sheet-in");
      expect(time).toBe("0.2s");
      await page.keyboard.press("Escape");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await filterButton(page).click();
      const reduced = await sheet(page).evaluate((el) => getComputedStyle(el).animationDuration);
      expect(parseFloat(reduced)).toBeLessThan(0.001);
    });

    test("no chips and no sideways scroll: default, sheet open and empty result; the sheet stays inside the phone column", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await expect(page.locator("[data-filter-chip]")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      await filterButton(page).click();
      expect(await noSidewaysScroll(page)).toBe(true);
      const l = await box(page.locator("[data-filter-sheet-layer]"));
      expect(l.x).toBeGreaterThanOrEqual(0);
      expect(l.x + l.width).toBeLessThanOrEqual(width + 0.5);
      await page.keyboard.press("Escape");
      await page.getByPlaceholder("Search students").fill("Zimmerman");
      await expect(page.locator('[data-empty="search"]')).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("on a wide screen the sheet and its scrim stay inside the 430px column", async ({
      browser,
    }) => {
      const context = await browser.newContext({
        viewport: { width: 900, height: 800 },
        storageState: instructor,
      });
      const page = await context.newPage();
      await page.goto("/instructor/students");
      await filterButton(page).click();
      const layer = await box(page.locator("[data-filter-sheet-layer]"));
      expect(Math.round(layer.width)).toBe(430);
      expect(Math.round(layer.x)).toBe(235);
      const panel = await box(sheet(page));
      expect(Math.round(panel.width)).toBe(430);
      await context.close();
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
        const line = card.locator("span.whitespace-nowrap.text-text-secondary");
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
      await expect(assign.locator("svg.lucide-circle-plus")).toHaveCount(1);
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

    test("the students below the pass mark in a topic: Back, the summary, the filter line, the rows with 'S3: 2 of 5 correct', Assign exam on this topic", async ({
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
        expect((await box(row)).height).toBeGreaterThanOrEqual(72);
        await expect(row.locator("[data-status-chip]")).toBeVisible();
        await expect(row.locator("[data-description]")).toHaveText(
          new RegExp(`^${id}: \\d+ of \\d+ correct$`),
        );
        expect(await row.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
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
      await expect(header.locator("[data-status-dot]")).toHaveCount(0);
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
        await expect(row.locator("[data-status-chip]")).toHaveCount(1);
        await expect(row.locator("[data-status-chip] svg")).toHaveCount(0);
        const pill = await box(row.locator("[data-status-chip]"));
        expect(pill.height).toBe(24);
        await expect(row.locator("svg.lucide-chevron-right")).toHaveCount(0);
      }
      // Send reminder is a Secondary button with a bell
      const send = page.getByRole("button", { name: "Send reminder" });
      expect(await bg(send)).toBe(OLIVE_TINT);
      await expect(send.locator("svg.lucide-bell")).toHaveCount(1);
      // one percentage on the whole screen
      // the headline figure and, in its pill, the comparison value ("Up from 45% last week")
      expect(((await page.locator("main").innerText()).match(/%/g) ?? []).length).toBe(2);
      await expect(page.getByText("Demo group")).toHaveCount(0);
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

    test("the invitation screen: the card for each group, an unknown code and the expired demo code say the link is no longer valid", async ({
      page,
    }) => {
      await page.goto("/join/QT-A7K2");
      await expect(page.locator("[data-invitation-title]")).toHaveText("Rescue team");
      await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
      expect(await bg(page.getByRole("button", { name: "Continue" }))).toBe(PRIMARY);
      expect(await noSidewaysScroll(page)).toBe(true);
      await page.goto("/join/QT-M4R9");
      await expect(page.locator("[data-invitation-title]")).toHaveText("Military training");
      for (const code of ["QT-0000", "OLD-0000"]) {
        await page.goto(`/join/${code}`);
        await expect(
          page.getByRole("heading", { name: "This link is no longer valid" }),
        ).toBeVisible();
        await expect(page.getByText("Ask your instructor for a new one.")).toBeVisible();
        await expect(page.getByLabel("Your email")).toHaveCount(0);
      }
      const back = page.getByRole("link", { name: "Back to start" });
      expect(await bg(back)).toBe(OLIVE_TINT);
      await back.click();
      await expect(page).toHaveURL(/\/welcome$/);
    });

    test("a Student who joins through the link is in that group; the invitation of the same address becomes Joined", async ({
      page,
    }) => {
      // 1. an instructor account invites an address to Military training (a student switched to Instructor with the demo shortcut)
      await joinAsStudent(page, "Ira Instructor", "ira@example.com");
      await demoRole(page, "Instructor");
      await chooseGroup(page, "Military training");
      await page.goto("/instructor/students/invite");
      await page.getByRole("combobox", { name: "INVITE BY EMAIL" }).fill("nina@example.com");
      await page.getByRole("combobox", { name: "INVITE BY EMAIL" }).press("Enter");
      await page.getByRole("button", { name: "Send invitations" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
      await page.goto("/instructor/students/invite");
      await expect(page.locator('[data-pending="nina@example.com"]')).toBeVisible();
      await expect(page.locator("main")).toContainText("PENDING INVITATIONS (1)");
      // 2. sign out, open the join link of that group and join as the invited Student
      await page.goto("/profile");
      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL(/\/welcome$/);
      await joinAsStudent(page, "Nina Student", "nina@example.com", "/join/QT-M4R9");
      await expect(page.locator("[data-flash]:visible")).toContainText(
        "You joined Military training",
      );
      // the student's Profile tells them that the instructor can see their progress
      await page.goto("/profile");
      await expect(page.locator("[data-instructor-sees]")).toHaveText(
        "Your instructor can see your progress and exam results.",
      );
      // a signed-in student who opens the link of another group is asked, never joined silently
      await page.goto("/join/QT-A7K2");
      await expect(page.getByRole("button", { name: "Join group" })).toBeVisible();
      await page.goto("/join/QT-M4R9");
      await expect(page.getByText("You are already in Military training")).toBeVisible();
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
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
    }
    // a signed-in student may open a join link (and confirm joining): it is no Students route
    await page.goto("/join/QT-A7K2");
    await expect(page).toHaveURL(/\/join\/QT-A7K2$/);
    await page.goto("/profile");
    await expect(page.locator("[data-instructor-sees]")).toBeVisible();
  });
});
