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
test.use({ storageState: instructor });
test.setTimeout(90_000);

const FIXTURES = "e2e/fixtures/";
const PICTURES = [
  "public/templates/sample-package/exit-sign.png",
  "public/templates/sample-package/assembly-point.png",
];
const PRIMARY = "rgb(63, 70, 56)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
/** The visible Primary buttons (52px, olive): a screen has at most one. */
const primaries = (page: Page) =>
  page.locator("button:visible, a:visible").evaluateAll(
    (nodes, colour) =>
      nodes.filter((el) => {
        const style = getComputedStyle(el);
        return style.backgroundColor === colour && el.getBoundingClientRect().height >= 52;
      }).length,
    PRIMARY,
  );
const storedTopics = (page: Page) =>
  page.evaluate(() => localStorage.getItem("ast.demo-topics.v1"));
const choose = async (
  page: Page,
  file: string | { name: string; mimeType: string; buffer: Buffer },
) => {
  await page.locator("[data-file-input]").setInputFiles(file);
};
const importButton = (page: Page) => page.getByRole("button", { name: "Import and review" });

for (const width of [360, 430]) {
  test.describe(`Import one document at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("empty: one large dashed card, the muted line, two tertiary links, What to include collapsed, one disabled Primary", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await expect(page.getByRole("heading", { name: "Import content" })).toBeVisible();
      const card = page.locator("[data-drop-area]");
      await expect(card).toContainText("Choose a document");
      await expect(card).toContainText("Excel (.xlsx), up to 10 MB");
      expect(await card.evaluate((el) => getComputedStyle(el).borderStyle)).toBe("dashed");
      expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(120);
      for (const name of ["Download template", "Use sample document"]) {
        const link = page.getByRole("link", { name }).or(page.getByRole("button", { name }));
        const box = (await link.first().boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(
          await link
            .first()
            .locator("span")
            .evaluate((el) => getComputedStyle(el).textDecorationLine),
        ).toContain("underline");
      }
      await expect(page.getByText("IMAGES (OPTIONAL)")).toHaveCount(0);
      await expect(importButton(page)).toBeDisabled();
      expect(await primaries(page)).toBe(0);
      const row = page.getByRole("button", { name: "What to include" });
      await expect(row).toHaveAttribute("aria-expanded", "false");
      expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await row.click();
      const panel = page.locator("#include-panel");
      await expect(panel).toContainText("Guide");
      await expect(panel).toContainText("Required.");
      await expect(panel.locator("li")).toHaveCount(4);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("choose, remove and replace a file: one file card with a corner x, the Images row, Import enabled", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}clean.xlsx`);
      const fileCard = page.locator("[data-file-card]");
      await expect(fileCard).toContainText("clean.xlsx");
      await expect(fileCard).toContainText("KB");
      await expect(page.locator("[data-drop-area]")).toHaveCount(0);
      await expect(page.getByText("IMAGES (OPTIONAL)")).toBeVisible();
      await expect(page.getByText("You can also add them later.")).toBeVisible();
      await expect(importButton(page)).toBeEnabled();
      expect(await primaries(page)).toBe(1);
      const x = page.getByRole("button", { name: "Remove file" });
      const box = (await x.boundingBox())!;
      expect([box.width, box.height]).toEqual([44, 44]);
      expect((await x.locator("span").boundingBox())!.width).toBe(28);
      expect(await x.locator("span").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgb(226, 222, 214)",
      );
      // pictures are added here, and named
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await expect(page.locator("[data-images]")).toContainText(
        "2 images added: exit-sign.png, assembly-point.png",
      );
      // a wrong picture is refused with a plain line
      await page.locator("[data-image-input]").setInputFiles({
        name: "big.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(320 * 1024),
      });
      await expect(page.getByText("big.png is larger than 300 KB.")).toBeVisible();
      // replace: a second choice replaces the file
      await page.getByRole("button", { name: "Remove file" }).click();
      await expect(page.locator("[data-file-card]")).toHaveCount(0);
      await expect(page.locator("[data-drop-area]")).toBeVisible();
      await expect(importButton(page)).toBeDisabled();
      await choose(page, `${FIXTURES}problems.xlsx`);
      await expect(page.locator("[data-file-card]")).toContainText("problems.xlsx");
      await choose(page, `${FIXTURES}clean.xlsx`);
      await expect(page.locator("[data-file-card]")).toContainText("clean.xlsx");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("each check before analysing shows a plain message under the file card and blocks the Primary", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      const cases: [Parameters<typeof choose>[1], string][] = [
        [`${FIXTURES}notes.docx`, "This file type is not supported. Use an Excel file (.xlsx)."],
        [
          {
            name: "huge.xlsx",
            mimeType: "application/octet-stream",
            buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
          },
          "This file is too large (max 10 MB).",
        ],
        [`${FIXTURES}empty.xlsx`, "No content found in this file."],
        [
          `${FIXTURES}no-guide.xlsx`,
          "No Guide sheet found. Download the template to see the expected sheets.",
        ],
      ];
      for (const [file, message] of cases) {
        await choose(page, file);
        const line = page.locator("[data-amber]").first();
        await expect(line).toHaveText(message);
        expect((await line.boundingBox())!.y).toBeGreaterThan(
          (await page.locator("[data-file-card]").boundingBox())!.y,
        );
        await expect(importButton(page)).toBeDisabled();
        expect(await noSidewaysScroll(page)).toBe(true);
      }
      // a good file clears the message
      await choose(page, `${FIXTURES}clean.xlsx`);
      await expect(page.locator("#import-message")).toHaveCount(0);
      await expect(importButton(page)).toBeEnabled();
      // the old several-files wording is gone
      await expect(page.locator("main")).not.toContainText(
        /choose them together|CSV files|Word, Excel and PDF/,
      );
    });

    test("Download template and Use sample document use the two Excel files", async ({
      page,
      request,
    }) => {
      for (const path of ["/templates/guide-template.xlsx", "/templates/sample-document.xlsx"]) {
        const response = await request.get(path);
        expect(response.ok()).toBe(true);
        expect((await response.body()).length).toBeGreaterThan(2000);
      }
      await page.goto("/instructor/content/import");
      const template = page.getByRole("link", { name: "Download template" });
      await expect(template).toHaveAttribute("href", "/templates/guide-template.xlsx");
      await expect(template).toHaveAttribute("download", "guide-template.xlsx");
      await page.getByRole("button", { name: "Use sample document" }).click();
      await expect(page.locator("[data-file-card]")).toContainText("sample-document.xlsx");
      await expect(page.locator("[data-images]")).toContainText("2 images added");
      await expect(importButton(page)).toBeEnabled();
    });

    test("Analysing: five stages with real counts, then Draft is ready; the draft exists only after it finishes; Cancel saves nothing", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page.getByRole("button", { name: "Use sample document" }).click();
      await importButton(page).click();
      await expect(page).toHaveURL(/\/import\/analysing$/);
      await expect(page.getByRole("heading", { name: "Reading your document…" })).toBeVisible();
      await expect(page.locator("[data-file-name]").first()).toContainText("sample-document.xlsx");
      await expect(page.locator("[data-stages] li")).toHaveText([
        /Reading the text/,
        /Finding guide sections/,
        /Building steps and scenario/,
        /Preparing questions/,
        /Checking links to the guide/,
      ]);
      await expect(page.locator("[data-stage=current]")).toHaveCount(1);
      await expect(
        page.getByText("This is a draft. You will review everything before it is published."),
      ).toBeVisible();
      await expect(page.locator("main")).not.toContainText(/%|thinking/i);
      await expect(page.locator("[data-stage-result]").first()).toContainText("5 sheets read", {
        timeout: 4000,
      });
      // nothing is saved while the stages run
      expect(await storedTopics(page)).toBeNull();
      expect(await primaries(page)).toBe(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 8000,
      });
      await expect(page.locator("[data-stage=done]")).toHaveCount(5);
      await expect(page.locator("[data-stage-result]").nth(1)).toHaveText("4 found");
      await expect(page.locator("[data-stage-result]").nth(2)).toHaveText(
        "7 steps, 4 scenario steps",
      );
      await expect(page.locator("[data-stage-result]").nth(3)).toHaveText("10 questions");
      await expect(page.locator("[data-counts]")).toContainText("Guide sections4");
      await expect(page.locator("[data-counts]")).toContainText("Questions10");
      // the sample comes with its pictures: nothing to review, so Preview as student
      expect(await storedTopics(page)).toContain("Evacuating a crowded hall");
      await expect(page.getByRole("button", { name: "Preview as student" })).toBeVisible();
      expect(await primaries(page)).toBe(1);
      await expect(page.getByRole("button", { name: "Back to Content" })).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Cancel while reading returns to Import and saves nothing", async ({ page }) => {
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}clean.xlsx`);
      await importButton(page).click();
      await expect(page.getByRole("heading", { name: "Reading your document…" })).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/instructor\/content\/import$/);
      await page.waitForTimeout(4500);
      expect(await storedTopics(page)).toBeNull();
    });

    test("a finished draft with problems offers Review N items, which opens the guided review", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}problems.xlsx`);
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await importButton(page).click();
      // this document has no scenario sheet: the partial state first, then the finished draft
      await page.getByRole("button", { name: "Continue" }).click({ timeout: 10000 });
      const review = page.getByRole("button", { name: "Review 6 items" });
      await expect(review).toBeVisible();
      await expect(page.getByRole("button", { name: "Back to Content" })).toBeVisible();
      expect(await primaries(page)).toBe(1);
      await review.click();
      await expect(page).toHaveURL(/\/edit\/steps-0-2\?r=.*&i=0$/);
      await expect(page.locator("[data-page-header-band]:visible")).toContainText("Item 1 of 6");
    });

    test("partial: a missing part is said plainly; Continue saves the draft, Choose another file returns", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}no-questions.xlsx`);
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await importButton(page).click();
      await expect(page.locator("#draft-partial")).toContainText(
        "We could not find questions in this document.",
        {
          timeout: 10000,
        },
      );
      // the draft is not created yet
      expect(await storedTopics(page)).toBeNull();
      expect(await primaries(page)).toBe(1);
      expect(await noSidewaysScroll(page)).toBe(true);
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible();
      expect(await storedTopics(page)).not.toBeNull();
    });

    test("error: a file that looks like Excel but cannot be read; Choose another file returns to an empty Import", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}not-excel.xlsx`);
      await expect(importButton(page)).toBeEnabled();
      await importButton(page).click();
      await expect(page.locator("#draft-error")).toContainText(
        "We could not read this file. Try another file.",
      );
      expect(await storedTopics(page)).toBeNull();
      expect(await primaries(page)).toBe(1);
      await page.getByRole("button", { name: "Choose another file" }).click();
      await expect(page).toHaveURL(/\/instructor\/content\/import$/);
      await expect(page.locator("[data-drop-area]")).toBeVisible();
    });

    test("with reduced motion every stage shows at once", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}clean.xlsx`);
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await importButton(page).click();
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 1500,
      });
      await expect(page.locator("[data-stage=done]")).toHaveCount(5);
    });

    test("stage changes are announced in a polite live region", async ({ page }) => {
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}clean.xlsx`);
      await importButton(page).click();
      const live = page.locator("[data-announce]");
      await expect(live).toHaveAttribute("aria-live", "polite");
      await expect(live).toHaveText(/Reading the text/);
      await expect(live).toHaveText(/Finding guide sections/, { timeout: 3000 });
    });

    test("the topic menu: Edit title and summary saves plain text; Delete topic asks first", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page.getByRole("button", { name: "Use sample document" }).click();
      await importButton(page).click();
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 10000,
      });
      await page.getByRole("button", { name: "Back to Content" }).click();
      await page
        .getByRole("link", { name: /Evacuating a crowded hall/ })
        .first()
        .click();
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Edit title and summary" }).click();
      await expect(page.getByRole("heading", { name: "Edit title and summary" })).toBeVisible();
      await page.getByLabel("Title").fill("Leaving a hall <b>safely</b>");
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(
        "Leaving a hall <b>safely</b>",
      );
      await expect(page.locator("main b")).toHaveCount(0);
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Delete topic" }).click();
      await expect(page.getByRole("dialog")).toContainText("Delete this topic?");
      await page.getByRole("dialog").getByRole("button", { name: "Delete topic" }).click();
      await expect(page).toHaveURL(/\/instructor\/content$/);
    });

    test("no external requests while importing and analysing", async ({ page }) => {
      const external: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (
          !url.startsWith("http://localhost:3100") &&
          !url.startsWith("data:") &&
          !url.startsWith("blob:")
        )
          external.push(url);
      });
      await page.goto("/instructor/content/import");
      await page.getByRole("button", { name: "Use sample document" }).click();
      await importButton(page).click();
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 10000,
      });
      expect(external).toEqual([]);
    });
  });
}
