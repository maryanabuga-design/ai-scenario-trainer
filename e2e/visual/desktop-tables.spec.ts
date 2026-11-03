import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { FIXED_NOW, prepare } from "./routes";

/** The Students table, the status menu and the exam students table (DESIGN.md: Responsive instructor, step 3). */
test.use({ reducedMotion: "reduce" });

const table = "[data-students-table] table";
const names = (page: Page) =>
  page.locator('[data-students-table] tbody th[scope="row"]').allInnerTexts();
const open = async (page: Page, width: number, path = "/instructor/students") => {
  await page.setViewportSize({ width, height: 900 });
  await prepare(page, "instructor");
  await page.goto(path);
  await page.locator("main h1").first().waitFor();
  await page
    .locator("[data-students-table], [data-exam-table], [data-topic-card], [data-empty]")
    .first()
    .waitFor({ state: "attached" });
  await page.waitForTimeout(300);
};
const noSideScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe("Students table", () => {
  test("1280px: the table is drawn and the phone list is not in the accessibility tree", async ({
    page,
  }) => {
    await open(page, 1280);
    await expect(page.getByRole("table", { name: "Students" })).toBeVisible();
    await expect(page.locator("[data-student]").first()).toBeHidden();
    expect(await page.getByRole("link", { name: "Alva Renn" }).count()).toBe(1);
  });

  test("430px: the phone list is drawn and there is no table", async ({ page }) => {
    await open(page, 430);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.locator("[data-student]").first()).toBeVisible();
    expect(await page.getByRole("link", { name: /Alva Renn/ }).count()).toBe(1);
  });

  test("semantic markup: caption, column headers and row headers", async ({ page }) => {
    await open(page, 1280);
    const heads = await page
      .locator(`${table} thead th`)
      .evaluateAll((els) => els.map((el) => el.getAttribute("scope")));
    expect(heads.every((scope) => scope === "col")).toBe(true);
    await expect(page.locator(`${table} caption`)).toHaveText("Students");
    const rowHeads = await page
      .locator(`${table} tbody th`)
      .evaluateAll((els) => els.every((el) => el.getAttribute("scope") === "row"));
    expect(rowHeads).toBe(true);
    const labels = await page.locator(`${table} thead th`).allInnerTexts();
    expect(labels.map((l) => l.trim())).toEqual(
      expect.arrayContaining(["STUDENT", "STATUS", "READINESS", "TO REVIEW", "WEAK TOPIC"]),
    );
    const radius = await page.locator("[data-students-table]").evaluate((el) => {
      const css = getComputedStyle(el);
      return [css.borderTopLeftRadius, css.borderTopColor];
    });
    expect(radius).toEqual(["16px", "rgb(228, 223, 213)"]);
    const row = await page.locator(`${table} tbody tr`).first().boundingBox();
    expect(row!.height).toBeGreaterThanOrEqual(64);
    expect(row!.height).toBeLessThanOrEqual(65);
  });

  test("sorting by name, status and result with aria-sort", async ({ page }) => {
    await open(page, 1280);
    const initial = await names(page);
    const header = (name: string) => page.locator(`${table} thead th`, { hasText: name });
    await header("STUDENT").getByRole("button").click();
    await expect(header("STUDENT")).toHaveAttribute("aria-sort", "ascending");
    const asc = await names(page);
    expect(asc).toEqual([...initial].sort((a, b) => a.localeCompare(b)));
    await header("STUDENT").getByRole("button").click();
    await expect(header("STUDENT")).toHaveAttribute("aria-sort", "descending");
    expect(await names(page)).toEqual([...asc].reverse());
    await header("READINESS").getByRole("button").click();
    await expect(header("READINESS")).toHaveAttribute("aria-sort", "ascending");
    await expect(header("STUDENT")).not.toHaveAttribute("aria-sort", /.+/);
    const percents = (
      await page
        .locator(`${table} tbody tr`)
        .evaluateAll((rows) => rows.map((row) => row.textContent?.match(/(\d+)%/)?.[1] ?? "-1"))
    ).map(Number);
    expect(percents).toEqual([...percents].sort((a, b) => a - b));
    await header("STATUS").getByRole("button").click();
    await expect(header("STATUS")).toHaveAttribute("aria-sort", "ascending");
    const first = await page.locator(`${table} tbody tr`).first().innerText();
    expect(first).toContain("Needs attention");
  });

  test("a row opens with the keyboard", async ({ page }) => {
    await open(page, 1280);
    const link = page.locator("[data-table-link]").first();
    await link.focus();
    await expect(page.locator("[data-table-row]").first()).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/instructor\/students\/[^/?]+\?from=students/);
  });

  test("a click anywhere on the row opens it, and the row has a hover look", async ({ page }) => {
    await open(page, 1280);
    const row = page.locator("[data-table-row]").first();
    await row.hover();
    await expect(row).toHaveCSS("background-color", "rgb(246, 244, 240)");
    const box = await row.boundingBox();
    await page.mouse.click(box!.x + box!.width - 120, box!.y + 30);
    await expect(page).toHaveURL(/\/instructor\/students\/[^/?]+\?from=students/);
  });

  test("columns are hidden by the width of the table, with no sideways scroll", async ({
    page,
  }) => {
    for (const [width, weak, last] of [
      [1024, false, false],
      [1280, true, true],
      [1440, true, true],
      [1920, true, true],
    ] as const) {
      await open(page, width);
      const labels = (await page.locator(`${table} thead th`).allInnerTexts()).map((l) => l.trim());
      expect(labels.includes("WEAK TOPIC"), `weak topic at ${width}`).toBe(weak);
      expect(labels.includes("LAST ACTIVE"), `last active at ${width}`).toBe(last);
      expect(await noSideScroll(page), `scroll at ${width}`).toBe(true);
    }
  });

  test("the Invite students Primary is in the header and the only Primary", async ({ page }) => {
    await open(page, 1280);
    const invite = page
      .locator("[data-header-slot]")
      .getByRole("link", { name: "Invite students" });
    await expect(invite).toBeVisible();
    expect((await invite.boundingBox())?.height).toBe(44);
    const primaries = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>("main a, main button"))
        .filter(
          (el) =>
            el.getClientRects().length > 0 &&
            getComputedStyle(el).backgroundColor === "rgb(63, 70, 56)",
        )
        .map((el) => el.textContent?.trim()),
    );
    expect(primaries).toEqual(["Invite students"]);
    await open(page, 430);
    const phone = page.getByRole("link", { name: "Invite students" });
    await expect(phone).toHaveCount(1);
    expect((await phone.boundingBox())?.height).toBe(52);
  });

  test("the Students | Topics control is 280px wide and left aligned", async ({ page }) => {
    await open(page, 1280);
    const box = await page.locator('fieldset[role="radiogroup"]').boundingBox();
    expect(box?.width).toBe(280);
    expect(box?.x).toBe(272);
  });

  test("the search combines with the status filter and shows the no-results state", async ({
    page,
  }) => {
    await open(page, 1280);
    await page.getByPlaceholder("Search students").fill("a");
    const all = (await names(page)).length;
    await page.locator("[data-filter-button-desk]").click();
    await page.locator('[data-status-option="needs"]').click();
    const some = (await names(page)).length;
    expect(some).toBeGreaterThan(0);
    expect(some).toBeLessThan(all);
    await page.getByPlaceholder("Search students").fill("Zimmerman");
    await expect(page.locator("[data-empty=search]")).toBeVisible();
    await expect(page.locator("[data-students-table]")).toHaveCount(0);
    await expect(page.locator("[data-student-count]")).toHaveText("0 students");
  });

  for (const [width, expected] of [
    [1280, 2],
    [1440, 3],
  ] as const) {
    test(`Topics view: ${expected} columns at ${width}px`, async ({ page }) => {
      await open(page, width, "/instructor/students?view=topics");
      await page.locator("[data-topic-card]").first().waitFor();
      const columns = await page.locator("[data-topic-card]").evaluateAll((els) => {
        const top = els[0].getBoundingClientRect().top;
        return els.filter((el) => Math.abs(el.getBoundingClientRect().top - top) < 2).length;
      });
      expect(columns).toBe(expected);
    });
  }
});

test.describe("Status menu", () => {
  const button = (page: Page) => page.locator("[data-filter-button-desk]");

  test("opens under the button with the five options and counts, and applies at once", async ({
    page,
  }) => {
    await open(page, 1280);
    await button(page).click();
    const menu = page.locator("[data-status-options]");
    await expect(menu).toBeVisible();
    const b = await button(page).boundingBox();
    const m = await menu.boundingBox();
    expect(m && b && m.y >= b.y + b.height && Math.abs(m.x - b.x) < 2).toBe(true);
    expect(m?.width).toBe(280);
    const labels = await menu.getByRole("menuitemradio").allInnerTexts();
    expect(labels.map((l) => l.replace(/\s+/g, " ").trim())).toEqual([
      "All · 15",
      "Needs attention · 4",
      "Almost ready · 5",
      "Ready · 4",
      "Not started · 2",
    ]);
    await expect(menu.getByRole("menuitemradio", { name: /^All/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await menu.getByRole("menuitemradio", { name: /Needs attention/ }).click();
    await expect(menu).toHaveCount(0);
    await expect(button(page)).toBeFocused();
    await expect.poll(async () => (await names(page)).length).toBe(4);
    await expect(page).toHaveURL(/filter=needs/);
    const chip = page.locator("[data-status-filter-chip]");
    await expect(chip).toContainText("Status: Needs attention");
    await expect(button(page)).toHaveCSS("background-color", "rgb(211, 220, 195)");
    await chip.getByRole("button", { name: /Remove the status filter/ }).click();
    await expect.poll(async () => (await names(page)).length).toBe(15);
    await expect(chip).toHaveCount(0);
  });

  test("Escape and a click outside close it and the focus returns to the button", async ({
    page,
  }) => {
    await open(page, 1280);
    await button(page).click();
    await expect(page.locator("[data-status-options]")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-status-options]")).toHaveCount(0);
    await expect(button(page)).toBeFocused();
    await button(page).click();
    await page.mouse.click(900, 600);
    await expect(page.locator("[data-status-options]")).toHaveCount(0);
  });

  test("the arrow keys move between the options and Enter chooses", async ({ page }) => {
    await open(page, 1280);
    await button(page).focus();
    await page.keyboard.press("Enter");
    const all = page.getByRole("menuitemradio", { name: /^All/ });
    await expect(all).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitemradio", { name: /Needs attention/ })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/filter=needs/);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("the filter survives a resize between 1440 and 430", async ({ page }) => {
    await open(page, 1440, "/instructor/students?filter=almost");
    expect((await names(page)).length).toBe(5);
    await page.setViewportSize({ width: 430, height: 900 });
    await expect(page.locator("[data-status-line]")).toContainText("Almost ready");
    await expect(page.locator("[data-student]:visible")).toHaveCount(5);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator("[data-status-filter-chip]")).toContainText("Almost ready");
    expect((await names(page)).length).toBe(5);
  });

  test("430px: the phone filter is still the sheet with the Show button", async ({ page }) => {
    await open(page, 430);
    await page.locator("[data-filter-button]").click();
    await expect(page.getByRole("dialog", { name: "Filter by status" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Show \d+ students?$/ })).toBeVisible();
    await expect(page.locator("[data-status-menu]")).toBeHidden();
  });
});

test.describe("Exam students table", () => {
  const examTable = "[data-exam-table] table";
  test("with results: Student, Status, Result, Attempts; sorted by result", async ({ page }) => {
    await open(page, 1280, "/instructor/exams/seed-active");
    await page.locator(examTable).waitFor();
    const labels = (await page.locator(`${examTable} thead th`).allInnerTexts()).map((l) =>
      l.trim(),
    );
    expect(labels.filter(Boolean)).toEqual(["STUDENT", "STATUS", "RESULT", "ATTEMPTS", "Open"]);
    await expect(page.getByRole("table", { name: "Students" })).toBeVisible();
    await expect(page.locator("[data-student-row]").first()).toBeHidden();
    const first = await page.locator(`${examTable} tbody tr`).first().innerText();
    expect(first).toMatch(/\d+%/);
    await page.locator(`${examTable} thead th`, { hasText: "RESULT" }).getByRole("button").click();
    await expect(page.locator(`${examTable} thead th`, { hasText: "RESULT" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(await noSideScroll(page)).toBe(true);
  });

  test("no results yet: the names only", async ({ page }) => {
    await page.addInitScript(
      (value) => {
        if (!localStorage.getItem("ast.group-exams.v1"))
          localStorage.setItem("ast.group-exams.v1", JSON.stringify({ schema: 6, value }));
      },
      [
        {
          id: "grp-visual-1",
          title: "Exam: Alarm and escape routes",
          topicIds: ["S1", "S2"],
          groupIds: ["rescue-team"],
          attemptsAllowed: 3,
          questionCount: 20,
          timeLimit: 20,
          passMark: 80,
          deadline: "2026-11-10",
          createdAt: FIXED_NOW.getTime(),
          createdBy: "Instructor",
        },
      ],
    );
    await open(page, 1280, "/instructor/exams/grp-visual-1");
    await page.locator(examTable).waitFor();
    const labels = (await page.locator(`${examTable} thead th`).allInnerTexts())
      .map((l) => l.trim())
      .filter(Boolean);
    expect(labels).toEqual(["STUDENT", "Open"]);
    await expect(page.locator(`${examTable} tbody .type-small`)).toHaveCount(0);
  });

  test("430px: the exam students are still the phone rows", async ({ page }) => {
    await open(page, 430, "/instructor/exams/seed-active");
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.locator("[data-student-row]").first()).toBeVisible();
  });
});
