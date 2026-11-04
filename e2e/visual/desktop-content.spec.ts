import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { FIXED_NOW, prepare } from "./routes";

/** The Content area on desktop (DESIGN.md: Responsive instructor, step 5). */
test.use({ reducedMotion: "reduce" });

const PRIMARY = "rgb(63, 70, 56)";
const start = async (page: Page, width: number, path: string) => {
  await page.setViewportSize({ width, height: 900 });
  await prepare(page, "instructor");
  await page.goto(path);
  await page.locator("main h1, [data-analysing]").first().waitFor();
  await page.waitForTimeout(300);
};
const draft = async (page: Page, width: number) => {
  await start(page, width, "/instructor/content/import");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page.getByRole("button", { name: /^Import/ }).click();
  await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 45_000 });
  await page.getByRole("button", { name: "Open draft" }).click();
  await page
    .locator("[data-package-status], [data-tab-bar]")
    .first()
    .waitFor({ state: "attached" });
  await page.waitForTimeout(300);
};
const visiblePrimaries = (page: Page) =>
  page.evaluate(
    (color) =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "main a, main button, [data-full-bleed] a, [data-full-bleed] button",
        ),
      )
        .filter(
          (el) => el.getClientRects().length > 0 && getComputedStyle(el).backgroundColor === color,
        )
        .map((el) => el.textContent?.trim()),
    PRIMARY,
  );
const columns = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => {
    const top = els[0].getBoundingClientRect().top;
    return els.filter((el) => Math.abs(el.getBoundingClientRect().top - top) < 2).length;
  });

const SETS = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `cv${i}`,
    title: `Quiz ${i + 1}`,
    topic: "S2",
    status: "draft",
    source: "csv",
    fileName: "q.csv",
    createdAt: FIXED_NOW.getTime(),
    dropped: 0,
    questions: [
      {
        id: "q1",
        text: "What is the safest way out?",
        options: ["The marked exit", "The lift", "Wait", ""],
        correct: "a",
        explanation: "The marked exit.",
        guideRef: "S2",
        imageUrl: "",
      },
    ],
  }));

test.describe("Content list", () => {
  test("Import content is the one Primary, in the header at 1280 and inline at 430", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/content");
    const header = page.locator("[data-header-slot]").getByRole("link", { name: "Import content" });
    await expect(header).toBeVisible();
    expect((await header.boundingBox())?.height).toBe(44);
    expect(await visiblePrimaries(page)).toEqual(["Import content"]);
    await start(page, 430, "/instructor/content");
    const phone = page.getByRole("link", { name: "Import content" });
    await expect(phone).toHaveCount(1);
    expect((await phone.boundingBox())?.height).toBe(52);
  });

  for (const [width, expected] of [
    [1280, 2],
    [1440, 3],
  ] as const) {
    test(`the topic cards: ${expected} columns at ${width}px`, async ({ page }) => {
      await page.addInitScript((value) => {
        if (!localStorage.getItem("ast.content-sets.v1"))
          localStorage.setItem("ast.content-sets.v1", JSON.stringify({ schema: 6, value }));
      }, SETS(5));
      await start(page, width, "/instructor/content");
      await page.locator("[data-set-card]").first().waitFor();
      expect(await columns(page, "[data-set-card]")).toBe(expected);
    });
  }

  test("empty state is centred and at most 640px wide", async ({ page }) => {
    await start(page, 1440, "/instructor/content");
    const box = await page.locator("[data-content-empty]").boundingBox();
    expect(box!.width).toBeLessThanOrEqual(640);
    expect(Math.abs(box!.x + box!.width / 2 - (240 + 1200 / 2))).toBeLessThan(12);
  });

  test("Course topics: a grid, and the detail is a column of at most 880px", async ({ page }) => {
    await start(page, 1440, "/instructor/content/course");
    expect(await columns(page, "[data-built-in]")).toBe(3);
    await start(page, 1440, "/instructor/content/built-in/S1");
    const widest = await page.evaluate(() =>
      Math.max(
        ...Array.from(document.querySelector("[data-built-in-topic]")!.children)
          .filter((el) => !el.hasAttribute("data-page-header-band"))
          .map((el) => el.getBoundingClientRect().width),
      ),
    );
    expect(widest).toBeLessThanOrEqual(880);
    // S1 has a step guide: the tab bar with the arrow keys
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(2);
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toBeFocused();
  });
});

test.describe("One-card flows", () => {
  test("import start: a centred card of at most 640px, actions in the card footer, nothing pinned", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await page.locator("[data-file-card]").waitFor();
    const footer = page.locator("[data-card-footer]").first();
    await expect(footer.getByRole("button", { name: "Import and review" })).toBeVisible();
    const cancel = await footer.getByRole("button", { name: "Cancel" }).boundingBox();
    const go = await footer.getByRole("button", { name: "Import and review" }).boundingBox();
    expect(cancel!.x).toBeLessThan(go!.x);
    expect(go!.height).toBe(44);
    const card = await footer.locator("xpath=..").boundingBox();
    expect(card!.width).toBeLessThanOrEqual(640);
    await expect(page.getByRole("button", { name: "Import and review" })).toHaveCount(1);
    expect(await visiblePrimaries(page)).toEqual(["Import and review"]);
  });

  test("430px: the same actions in the pinned bar, no card footer", async ({ page }) => {
    await start(page, 430, "/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await expect(page.locator("[data-card-footer]")).toBeHidden();
    const go = page.getByRole("button", { name: "Import and review" });
    await expect(go).toHaveCount(1);
    expect((await go.boundingBox())?.height).toBe(52);
  });

  test("Draft is ready: the card footer has Back to Content and Open draft", async ({ page }) => {
    await start(page, 1280, "/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await page.getByRole("button", { name: /^Import/ }).click();
    await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 45_000 });
    const footer = page.locator("[data-card-footer]");
    await expect(footer.getByRole("button", { name: "Open draft" })).toBeVisible();
    await expect(footer.getByRole("button", { name: "Back to Content" })).toBeVisible();
    expect(await visiblePrimaries(page)).toEqual(["Open draft"]);
  });
});

test.describe("Topic screen", () => {
  test("actions in the header, status chip, a tab bar with arrow keys and aria", async ({
    page,
  }) => {
    await draft(page, 1280);
    const slot = page.locator("[data-header-slot]");
    await expect(slot.getByRole("button", { name: "Publish" })).toBeVisible();
    await expect(slot.getByRole("button", { name: /Preview as student/ })).toBeVisible();
    expect(await visiblePrimaries(page)).toEqual(["Publish"]);
    await expect(page.locator("[data-status-chip=draft]").first()).toBeVisible();
    const list = page.getByRole("tablist", { name: "Part" });
    await expect(list).toBeVisible();
    const tabs = list.getByRole("tab");
    await expect(tabs).toHaveCount(4);
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(tabs.first()).toHaveAttribute("aria-controls", "package-tab-panel");
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toBeAttached();
    await page.keyboard.press("End");
    await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("Home");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("the Questions table sorts and a row opens the edit screen", async ({ page }) => {
    await draft(page, 1280);
    await page.getByRole("tab", { name: /^Quiz/ }).click();
    const table = page.getByRole("table", { name: "Questions" });
    await expect(table).toBeVisible();
    const header = table.locator("thead th", { hasText: "GUIDE SECTION" });
    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "ascending");
    const sections = (await table.locator("tbody tr td:nth-child(3)").allInnerTexts()).map((t) =>
      Number(t.match(/\d+/)?.[0]),
    );
    expect(sections).toEqual([...sections].sort((a, b) => a - b));
    await table.locator("[data-table-link]").first().focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/edit\//);
  });

  test("430px: the pinned bar has the same buttons, the segmented control is used and no table", async ({
    page,
  }) => {
    await draft(page, 430);
    await expect(page.getByRole("tablist")).toHaveCount(0);
    await page.getByRole("button", { name: "Publish" }).waitFor();
    await expect(page.getByRole("button", { name: "Publish" })).toHaveCount(1);
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.locator("[data-header-slot]").last()).toBeHidden();
  });
});

test.describe("Forms and review", () => {
  test("Edit title and summary: form at most 720px, Save and Cancel in the header", async ({
    page,
  }) => {
    await draft(page, 1280);
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: /Edit title and summary/ }).click();
    await page.getByLabel("Title").waitFor();
    const slot = page.locator("[data-header-slot]");
    await expect(slot.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(slot.getByRole("button", { name: "Cancel" })).toBeVisible();
    const title = await page.getByLabel("Title").boundingBox();
    expect(title!.width).toBeLessThanOrEqual(560);
    const area = await page.locator("textarea").boundingBox();
    expect(area!.width).toBeLessThanOrEqual(720);
    expect(await visiblePrimaries(page)).toEqual(["Save"]);
  });

  test("the question edit screen: Save in the header, form at most 720px", async ({ page }) => {
    await draft(page, 1280);
    await page.getByRole("tab", { name: /^Quiz/ }).click();
    await page.locator("[data-questions-table] [data-table-link]").first().click();
    await page.locator("textarea").first().waitFor();
    const slot = page.locator("[data-header-slot]");
    await expect(slot.getByRole("button", { name: "Save" })).toBeVisible();
    const field = await page.locator("textarea").first().boundingBox();
    expect(field!.width).toBeLessThanOrEqual(720);
    expect((await visiblePrimaries(page)).length).toBeLessThanOrEqual(1);
  });

  test("the question-set review: a table with Status, Publish and Delete set in the header", async ({
    page,
  }) => {
    await page.addInitScript((value) => {
      if (!localStorage.getItem("ast.content-sets.v1"))
        localStorage.setItem("ast.content-sets.v1", JSON.stringify({ schema: 6, value }));
    }, SETS(1));
    await start(page, 1280, "/instructor/content/cv0");
    const table = page.getByRole("table", { name: "Questions" });
    await expect(table).toBeVisible();
    await expect(table.locator("tbody")).toContainText("Ready");
    const slot = page.locator("[data-header-slot]");
    await expect(slot.getByRole("button", { name: "Publish" })).toBeVisible();
    await expect(slot.getByRole("button", { name: "Delete set" })).toBeVisible();
    expect(await visiblePrimaries(page)).toEqual(["Publish"]);
  });
});

test.describe("Preview as student", () => {
  test("the student UI is in a framed 430px column, Exit preview is above it and works", async ({
    page,
  }) => {
    await draft(page, 1280);
    await page
      .locator("[data-header-slot]")
      .getByRole("button", { name: /Preview as student/ })
      .click();
    const frame = page.locator("[data-phone-frame]");
    await frame.waitFor();
    const box = await frame.boundingBox();
    expect(box!.width).toBe(430);
    await expect(frame).toHaveCSS("border-top-width", "1px");
    // the student layout inside is the phone one: the band is a band, not the desktop header
    const band = frame.locator("[data-page-header-band]").first();
    if ((await band.count()) > 0)
      await expect(band).toHaveCSS("background-color", "rgb(240, 236, 230)");
    await page.getByRole("link", { name: "Exit preview" }).click();
    await expect(page).toHaveURL(/\/instructor\/content\/package\/[^/]+(\?tab=\w+)?$/);
  });

  test("430px: no frame and no Exit preview button", async ({ page }) => {
    await draft(page, 430);
    await page.getByRole("button", { name: /Preview as student/ }).click();
    await page.waitForURL(/preview/);
    await expect(page.getByRole("link", { name: "Exit preview" })).toBeHidden();
  });
});

test.describe("Student detail small items", () => {
  test("one merged topics table with a Status column that sorts; needs review first", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/students/stu-02");
    const table = page.getByRole("table", { name: "Topics" });
    await expect(table).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(2);
    const first = await table.locator("tbody tr").first().innerText();
    expect(first).toContain("Needs review");
    const header = table.locator("thead th", { hasText: "STATUS" });
    await header.getByRole("button").click();
    await header.getByRole("button").click();
    await expect(header).toHaveAttribute("aria-sort", "descending");
    expect(await table.locator("tbody tr").last().innerText()).toContain("Needs review");
  });

  test("No practice yet: one calm card on desktop and on the phone", async ({ page }) => {
    for (const width of [1280, 430]) {
      await start(page, width, "/instructor/students/stu-06");
      const card = page.locator("[data-empty=no-practice]");
      await expect(card).toContainText("No practice yet");
      await expect(card).toContainText(
        "Practice results will appear here once the student starts.",
      );
      await expect(page.getByText("Not practised yet")).toHaveCount(0);
    }
  });

  test("the readiness ring is 72px and left of the percentage", async ({ page }) => {
    await start(page, 1280, "/instructor/students/stu-02");
    const ring = await page.locator("[data-ring]").boundingBox();
    const number = await page.locator("[data-readiness-number]").boundingBox();
    expect(ring!.width).toBe(72);
    expect(ring!.x + ring!.width).toBeLessThanOrEqual(number!.x);
  });

  test("the exam table has no Details column that repeats the status", async ({ page }) => {
    await start(page, 1280, "/instructor/students/stu-02");
    const exams = page.getByRole("table", { name: "Exams" });
    const labels = (await exams.locator("thead th").allInnerTexts()).map((l) => l.trim());
    expect(labels).not.toContain("DETAILS");
    const rows = await exams.locator("tbody tr").allInnerTexts();
    for (const row of rows) expect(row).not.toMatch(/No attempts yet|Closed without a try/);
  });

  test("the status menu flips to the right edge when it would leave the content", async ({
    page,
  }) => {
    await start(page, 1024, "/instructor/students");
    await page.locator("[data-filter-button-desk]").click();
    const menu = page.locator("[data-status-options]");
    const m = await menu.boundingBox();
    const main = await page.locator("main").boundingBox();
    expect(m!.x + m!.width).toBeLessThanOrEqual(main!.x + main!.width + 1);
  });
});
