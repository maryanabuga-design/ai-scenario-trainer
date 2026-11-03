import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { prepare } from "./routes";

/** The student detail, the topic students table and the small leftovers (DESIGN.md: Responsive instructor, step 4). */
test.use({ reducedMotion: "reduce" });

const detail = "/instructor/students/stu-02";
const open = async (page: Page, width: number, path: string, ready = "[data-student-header]") => {
  await page.setViewportSize({ width, height: 900 });
  await prepare(page, "instructor");
  await page.goto(path);
  await page.locator(ready).first().waitFor();
  await page.waitForTimeout(300);
};
const summary = (page: Page) =>
  page.evaluate(() => ({
    name: document.querySelector("[data-student-name]")?.textContent,
    field: document.querySelector("[data-field-line]")?.textContent,
    last: document.querySelector("[data-last-active]")?.textContent,
    readiness: document.querySelector("[data-readiness-number]")?.textContent,
    pass: document.querySelector("[data-pass-mark]")?.textContent,
    practice: document.querySelector("[data-practice]")?.textContent,
  }));

test.describe("Student detail", () => {
  test("1280px: two columns, the left one 340px wide, the name as the title, the status chip", async ({
    page,
  }) => {
    await open(page, 1280, detail);
    const left = await page.locator("[data-student-header]").boundingBox();
    const right = await page.locator("[data-topic-group]").first().boundingBox();
    expect(left?.width).toBe(340);
    expect(left && right && right.x >= left.x + left.width + 23).toBe(true);
    await expect(page.locator("main h1")).toHaveText(/Tomas Verel/, { useInnerText: true });
    await expect(
      page
        .locator(
          "[data-page-header-band] [data-status-chip], [data-page-header-band] .type-caption",
        )
        .first(),
    ).toBeVisible();
    await expect(
      page.locator("[data-header-slot]").getByRole("button", { name: "Send reminder" }),
    ).toBeVisible();
  });

  test("the left column is sticky", async ({ page }) => {
    await open(page, 1280, detail);
    const card = page.locator("[data-student-header]");
    const column = card.locator("xpath=..");
    await expect(column).toHaveCSS("position", "sticky");
    const before = (await card.boundingBox())!.y;
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(200);
    const after = (await card.boundingBox())!.y;
    expect(after).toBeLessThan(before);
    expect(after).toBeGreaterThanOrEqual(23);
  });

  test("the summary shows the same values as the phone screen", async ({ page }) => {
    await open(page, 430, detail);
    const phone = await summary(page);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(200);
    expect(await summary(page)).toEqual(phone);
    expect(phone.name).toBe("Tomas Verel");
    expect(phone.readiness).toMatch(/%$/);
  });

  test("only one version is in the accessibility tree: tables at 1280, rows at 430", async ({
    page,
  }) => {
    await open(page, 1280, detail);
    await expect(page.getByRole("table")).toHaveCount(3);
    await expect(page.locator("[data-topic-row]:visible")).toHaveCount(0);
    await expect(page.locator("[data-exam-row]:visible")).toHaveCount(0);
    await open(page, 430, detail);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.locator("[data-topic-row]:visible").first()).toBeVisible();
    await expect(page.locator("main h1")).toHaveText("Student detail", { useInnerText: true });
    await expect(page.getByRole("button", { name: "Send reminder" })).toHaveCount(1);
  });

  test("the topic and exam tables sort, and the rows without an address are plain", async ({
    page,
  }) => {
    await open(page, 1280, detail);
    const table = page.getByRole("table", { name: /needs review/i });
    const results = async () => table.locator("tbody tr td:nth-child(2)").allInnerTexts();
    const ratio = (text: string) => {
      const [a, b] = text.match(/\d+/g)!.map(Number);
      return a / b;
    };
    await table.getByRole("button", { name: /Result/i }).click();
    await expect(table.locator("thead th", { hasText: "RESULT" })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    const asc = (await results()).map(ratio);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    await table.getByRole("button", { name: /Result/i }).click();
    const desc = (await results()).map(ratio);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
    // a topic row has no link and no hover look
    await expect(table.locator("tbody a")).toHaveCount(0);
    const exams = page.getByRole("table", { name: "Exams" });
    await expect(exams.locator("thead th", { hasText: "STATUS" })).toBeVisible();
  });

  test("a student with no activity: the table keeps the 'Not practised yet' message", async ({
    page,
  }) => {
    await open(page, 1280, "/instructor/students/stu-06");
    await expect(page.getByText("Not practised yet").first()).toBeVisible();
    await expect(page.locator("[data-last-active]")).toContainText("No activity yet");
  });

  test("no Primary in the header and nothing wider than its column", async ({ page }) => {
    for (const width of [1024, 1280, 1920]) {
      await open(page, width, detail);
      const primaries = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("main a, main button"))
          .filter(
            (el) =>
              el.getClientRects().length > 0 &&
              getComputedStyle(el).backgroundColor === "rgb(63, 70, 56)",
          )
          .map((el) => el.textContent?.trim()),
      );
      expect(primaries.length, `Primary at ${width}`).toBeLessThanOrEqual(1);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(over).toBe(false);
    }
  });
});

test.describe("Topic students table", () => {
  const path = "/instructor/students/topic/S1";
  test("1280px: a table with Status, In this topic and Readiness; rows open with the keyboard", async ({
    page,
  }) => {
    await open(page, 1280, path, "[data-topic-summary]");
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    const labels = (await table.locator("thead th").allInnerTexts()).map((l) => l.trim());
    expect(labels).toEqual(
      expect.arrayContaining(["STUDENT", "STATUS", "IN THIS TOPIC", "READINESS"]),
    );
    await expect(page.locator("[data-student]:visible")).toHaveCount(0);
    const link = page.locator("[data-table-link]").first();
    await link.focus();
    await expect(page.locator("[data-table-row]").first()).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/topic=S1&origin=topics/);
    await expect(page.locator("[data-header-slot]")).toHaveCount(1);
  });

  test("Assign exam on this topic is in the header; 430px keeps rows and the full-width button", async ({
    page,
  }) => {
    await open(page, 1280, path, "[data-topic-summary]");
    const header = page.locator("[data-header-slot]").getByRole("link", {
      name: "Assign exam on this topic",
    });
    await expect(header).toBeVisible();
    expect((await header.boundingBox())?.height).toBe(44);
    await open(page, 430, path, "[data-topic-summary]");
    await expect(page.getByRole("table")).toHaveCount(0);
    const phone = page.getByRole("link", { name: "Assign exam on this topic" });
    await expect(phone).toHaveCount(1);
    expect((await phone.boundingBox())?.width).toBeGreaterThan(300);
  });
});

test.describe("Leftovers", () => {
  test("Clear search is a centred button of auto width on desktop and full width on the phone", async ({
    page,
  }) => {
    await open(page, 1280, "/instructor/students", "[data-students-table]");
    await page.getByPlaceholder("Search students").fill("Zimmerman");
    const button = page.getByRole("button", { name: "Clear search" }).last();
    await expect(button).toBeVisible();
    const box = (await button.boundingBox())!;
    const card = (await page.locator("[data-empty=search]").boundingBox())!;
    expect(box.width).toBeLessThan(260);
    expect(Math.abs(box.x + box.width / 2 - (card.x + card.width / 2))).toBeLessThan(2);
    await open(page, 430, "/instructor/students", "[data-student]");
    await page.getByPlaceholder("Search students").fill("Zimmerman");
    const phone = page.getByRole("button", { name: "Clear search" }).last();
    expect((await phone.boundingBox())!.width).toBeGreaterThan(250);
  });

  test("the thresholds follow the width of the table: Weak topic from 800px, Last active from 960px", async ({
    page,
  }) => {
    for (const window of [1040, 1100, 1160, 1220, 1280, 1440]) {
      await open(page, window, "/instructor/students", "[data-students-table]");
      const width = await page
        .locator("[data-students-table]")
        .evaluate((el) => el.getBoundingClientRect().width);
      const labels = (await page.locator("[data-students-table] thead th").allInnerTexts()).map(
        (l) => l.trim(),
      );
      expect(labels.includes("WEAK TOPIC"), `weak at ${window} (${width}px)`).toBe(width >= 800);
      expect(labels.includes("LAST ACTIVE"), `last at ${window} (${width}px)`).toBe(width >= 960);
    }
  });

  test("growing past 1024px closes the phone filter sheet and keeps the filter", async ({
    page,
  }) => {
    await open(page, 430, "/instructor/students?filter=needs", "[data-student]");
    await page.locator("[data-filter-button]").click();
    const sheet = page.getByRole("dialog", { name: "Filter by status" });
    await expect(sheet).toBeVisible();
    // a draft that was not applied
    await sheet.getByText("Ready", { exact: false }).first().click();
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page).toHaveURL(/filter=needs/);
    await expect(page.locator("[data-status-filter-chip]")).toContainText("Needs attention");
    await expect(page.locator("[data-status-menu]")).toBeVisible();
    await page.setViewportSize({ width: 430, height: 900 });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-status-line]")).toContainText("Needs attention");
  });

  test("Overview: one action does not stretch or leave a gap", async ({ page }) => {
    await open(page, 1280, "/instructor", "[data-weakest-topic]");
    const card = await page.locator('[aria-labelledby="actions-title"] ul').boundingBox();
    expect(card!.height).toBeLessThan(120);
    const actions = await page.locator('[aria-labelledby="actions-title"]').boundingBox();
    const exams = await page.locator('[aria-labelledby="exams-title"]').boundingBox();
    expect(Math.abs(actions!.y - exams!.y)).toBeLessThan(2);
  });
});
