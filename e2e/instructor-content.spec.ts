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

const HEADER =
  "topic,question,option_a,option_b,option_c,option_d,correct,explanation,guide_reference,image_url";
const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const CARD = "rgb(255, 255, 255)";
const SUCCESS_INK = "rgb(68, 104, 58)";
const ATTENTION_INK = "rgb(111, 81, 32)";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

/** A CSV with n questions; `bad` lists the 1-based rows to break and how. */
function makeCsv(n: number, bad: Record<number, "no-explanation" | "no-correct" | "xss"> = {}) {
  const rows = Array.from({ length: n }, (_, i) => {
    const k = i + 1;
    const kind = bad[k];
    const question =
      kind === "xss"
        ? `"<script>window.__xss=1</script><img src=x onerror=window.__xss=2>"`
        : `Question number ${k}?`;
    const correct = kind === "no-correct" ? "" : "B";
    const why = kind === "no-explanation" ? "" : `Because of reason ${k}.`;
    return `S3,${question},One ${k},Two ${k},Three ${k},,${correct},${why},S3,`;
  });
  return [HEADER, ...rows].join("\n");
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const colour = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).color);
const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });

/** Number of visible buttons and links on the page (bottom bar included) that have the Primary fill. */
const primaries = (page: Page) =>
  page
    .locator("a:visible, button:visible")
    .evaluateAll(
      (els, color) => els.filter((el) => getComputedStyle(el).backgroundColor === color).length,
      PRIMARY,
    );

/** Imports a CSV (or any file) through the screen and stops on the Review. */
async function importFile(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
  title = "Evacuation routes",
) {
  await page.goto("/instructor/content/import");
  await page.getByRole("textbox", { name: "Set title" }).fill(title);
  await page.getByText("Checking the route").first().click();
  await page.locator("[data-file-input]").setInputFiles(file);
  await page.getByRole("button", { name: "Read file" }).click();
  await expect(page).toHaveURL(/\/instructor\/content\/c[a-z0-9]+$/, { timeout: 10_000 });
}

const csvFile = (text: string, name = "questions.csv") => ({
  name,
  mimeType: "text/csv",
  buffer: Buffer.from(text, "utf8"),
});

const reviewId = (page: Page) => new URL(page.url()).pathname.split("/").pop()!;
const count = (page: Page, kind: "ready" | "attention") =>
  page.locator(`[data-count=${kind}] .tabular-nums`);

async function switchRole(page: Page, role: "Student" | "Instructor") {
  await page.goto("/profile");
  await page.getByRole("radio", { name: role }).check({ force: true });
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
}

for (const width of [360, 430]) {
  test.describe(`Instructor Content at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the tab: navigation, band, the one Primary, empty state, the built-in toggle and the note", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(nav(page).getByRole("link")).toHaveText([
        "Overview",
        "Exams",
        "Students",
        "Content",
        "Profile",
      ]);
      await nav(page).getByRole("link", { name: "Content" }).click();
      await expect(page).toHaveURL(/\/instructor\/content$/);
      await expect(nav(page).getByRole("link", { name: "Content" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(page.getByRole("heading", { name: "Content", level: 1 })).toBeVisible();
      const importLink = page.getByRole("link", { name: "Import questions" });
      expect(await bg(importLink)).toBe(PRIMARY);
      const b = (await importLink.boundingBox())!;
      expect([b.height, b.x, b.width]).toEqual([52, 16, width - 32]);
      const band = (await page.locator("[data-page-header-band]").boundingBox())!;
      expect(b.y - (band.y + band.height)).toBeLessThanOrEqual(20);
      await expect(
        page.getByText("No imported sets yet. Import questions from a file to create one."),
      ).toBeVisible();
      await expect(page.locator("[data-content-note]")).toHaveText(
        "Imported content stays in this browser (prototype).",
      );
      expect(await primaries(page)).toBe(1);
      expect(await noSidewaysScroll(page)).toBe(true);
      // the built-in toggle
      const toggle = page.getByRole("button", { name: "Show built-in topics (10)" });
      await toggle.click();
      await page.waitForTimeout(350);
      const rows = page.locator("[data-built-in]:visible");
      await expect(rows).toHaveCount(10);
      for (const row of await rows.all()) {
        expect((await row.boundingBox())!.height).toBe(72);
        expect(await bg(row)).toBe(CARD);
      }
      await expect(page.locator("[data-built-in] a, [data-built-in] svg")).toHaveCount(0);
      await expect(page.locator("[data-built-in]").first()).toContainText(/\d+ questions?/);
      await page.getByRole("button", { name: "Hide built-in topics" }).click();
      await page.waitForTimeout(350);
      await expect(page.locator("[data-built-in]:visible")).toHaveCount(0);
    });

    test("the CSV template downloads with the documented header row", async ({ page }) => {
      await page.goto("/instructor/content/import");
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("link", { name: "Download CSV template" }).click(),
      ]);
      expect(download.suggestedFilename()).toBe("question-template.csv");
      const path = await download.path();
      const text = readFileSync(path!, "utf8");
      expect(text.split("\n")[0]).toBe(HEADER);
    });

    test("Import: layout, heights, sections, validation of the file and Cancel", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await expect(page.getByRole("heading", { name: "Import questions", level: 1 })).toBeVisible();
      for (const label of ["SET TITLE", "TOPIC", "FILE"]) {
        await expect(
          page.getByRole("heading", { name: label, level: 2, exact: true }),
        ).toBeVisible();
      }
      expect((await page.getByRole("textbox", { name: "Set title" }).boundingBox())!.height).toBe(
        52,
      );
      const topicRows = page.locator("fieldset[aria-labelledby=topic-label] label");
      await expect(topicRows).toHaveCount(10);
      for (const row of await topicRows.all()) expect((await row.boundingBox())!.height).toBe(64);
      await expect(page.locator("[data-file-area]")).toContainText("CSV or Word file, up to 1 MB");
      await expect(page.getByText("How the file is read")).toBeVisible();
      await expect(page.getByText(/Word files are not read in this prototype/)).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
      const read = page.getByRole("button", { name: "Read file" });
      await expect(read).toBeDisabled();
      await page.getByRole("textbox", { name: "Set title" }).fill("Routes");
      await page.getByText("Checking the route").first().click();
      await expect(read).toBeDisabled();
      // wrong extension, empty and oversized files: amber text, no file row
      const input = page.locator("[data-file-input]");
      await input.setInputFiles({
        name: "q.xlsx",
        mimeType: "application/vnd.ms-excel",
        buffer: Buffer.from("x"),
      });
      await expect(page.locator("[data-amber]:visible")).toContainText(
        "Choose a .csv or .docx file.",
      );
      expect(await colour(page.locator("[data-amber]:visible"))).toBe(ATTENTION_INK);
      await expect(page.locator("[data-file-row]")).toHaveCount(0);
      await expect(read).toBeDisabled();
      await input.setInputFiles({ name: "q.csv", mimeType: "text/csv", buffer: Buffer.alloc(0) });
      await expect(page.locator("[data-amber]:visible")).toContainText("The file is empty.");
      await input.setInputFiles({
        name: "big.csv",
        mimeType: "text/csv",
        buffer: Buffer.alloc(1024 * 1024 + 1, "a"),
      });
      await expect(page.locator("[data-amber]:visible")).toContainText("larger than 1 MB");
      await expect(read).toBeDisabled();
      // a good file: name and size, Remove, and Read file is enabled
      await input.setInputFiles(csvFile(makeCsv(3)));
      await expect(page.locator("[data-amber]:visible")).toHaveCount(0);
      await expect(page.locator("[data-file-name]")).toHaveText("questions.csv");
      await expect(page.locator("[data-file-row]")).toContainText(/bytes|KB/);
      await expect(read).toBeEnabled();
      expect(await bg(read)).toBe(PRIMARY);
      expect(await primaries(page)).toBe(1);
      // Cancel: asks first because something was entered, then Discard leaves
      await page.getByRole("button", { name: "Cancel" }).click();
      const dialog = page.locator("dialog[open]");
      expect(await bg(dialog.getByRole("button", { name: "Discard" }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Keep editing" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Keep editing" }).click();
      await expect(page.getByRole("textbox", { name: "Set title" })).toHaveValue("Routes");
      await page.getByRole("button", { name: "Cancel" }).click();
      await dialog.getByRole("button", { name: "Discard" }).click();
      await expect(page).toHaveURL(/\/instructor\/content$/);
      // and with nothing entered Cancel leaves at once
      await page.goto("/instructor/content/import");
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/instructor\/content$/);
    });

    test("a valid CSV: Reading questions, then 20 ready; Publish, Unpublish and Delete set", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (r) => {
        const url = r.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await page.goto("/instructor/content/import");
      await page.getByRole("textbox", { name: "Set title" }).fill("Evacuation routes");
      await page.getByText("Checking the route").first().click();
      await page.locator("[data-file-input]").setInputFiles(csvFile(makeCsv(20)));
      await page.getByRole("button", { name: "Read file" }).click();
      await expect(page.locator("[data-reading]")).toHaveText("Reading questions...");
      await expect(page).toHaveURL(/\/instructor\/content\/c[a-z0-9]+$/, { timeout: 10_000 });
      await expect(count(page, "ready")).toHaveText("20");
      await expect(count(page, "attention")).toHaveText("0");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Evacuation routes");
      expect(await bg(page.locator("[data-count=ready] span").first())).toBe("rgb(225, 234, 218)");
      expect(await bg(page.locator("[data-count=attention] span").first())).toBe(
        "rgb(241, 228, 200)",
      );
      const rows = page.locator("[data-question-row]");
      await expect(rows).toHaveCount(20);
      expect((await rows.first().boundingBox())!.height).toBe(72);
      await expect(rows.first()).toContainText("Question number 1?");
      await expect(rows.first()).toContainText("Ready");
      expect(await noSidewaysScroll(page)).toBe(true);
      const publish = page.getByRole("button", { name: "Publish", exact: true });
      await expect(publish).toBeEnabled();
      expect(await bg(publish)).toBe(PRIMARY);
      expect(await primaries(page)).toBe(1);
      expect((await publish.boundingBox())!.height).toBe(52);
      await expect(page.locator("[data-publish-hint]")).toHaveCount(0);
      // the confirmation
      await publish.click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toContainText(
        /Publish 20 questions to S\d+ .+\? Students will see them in Training\./,
      );
      expect(await bg(dialog.getByRole("button", { name: "Publish" }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Keep editing" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Keep editing" }).click();
      await expect(page.locator("[data-message]")).toHaveText("");
      await publish.click();
      await dialog.getByRole("button", { name: "Publish" }).click();
      await expect(page.locator("[data-message]")).toHaveText(
        "Published. Students can practise these questions in Training.",
      );
      // read-only now: no chevrons, no links, only a Secondary Unpublish
      await expect(page.locator("[data-question-row] a")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
      const unpublish = page.getByRole("button", { name: "Unpublish" });
      expect(await bg(unpublish)).toBe(OLIVE_TINT);
      expect(await primaries(page)).toBe(0);
      // the Content tab shows it as Published (success tone) with 88px
      await page.goto("/instructor/content");
      const card = page.locator("[data-set-card]");
      expect((await card.boundingBox())!.height).toBe(88);
      expect(await bg(card)).toBe(CARD);
      await expect(card).toContainText(/S\d+ /);
      await expect(card).toContainText("· 20 questions");
      await expect(card.locator("[data-set-status]")).toHaveText("Published");
      expect(await colour(card.locator("[data-set-status]"))).toBe(SUCCESS_INK);
      await expect(card.locator("[data-picture-frame], img")).toHaveCount(0);
      expect(await primaries(page)).toBe(1);
      // unpublish returns it to Draft
      await card.click();
      await page.getByRole("button", { name: "Unpublish" }).click();
      await expect(page.locator("[data-message]")).toContainText("Unpublished");
      await page.goto("/instructor/content");
      await expect(page.locator("[data-set-status]")).toHaveText("Draft");
      // delete: Keep set first, then Delete set
      await page.locator("[data-set-card]").click();
      await page.getByRole("button", { name: "Delete set" }).click();
      await dialog.getByRole("button", { name: "Keep set" }).click();
      await expect(page.locator("[data-question-row]")).toHaveCount(20);
      await page.getByRole("button", { name: "Delete set" }).click();
      expect(await bg(dialog.getByRole("button", { name: "Delete set" }))).toBe(PRIMARY);
      await dialog.getByRole("button", { name: "Delete set" }).click();
      await expect(page).toHaveURL(/\/instructor\/content$/);
      await expect(page.locator("[data-set-card]")).toHaveCount(0);
      // nothing left the device
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });

    test("a CSV with problems: flags, the filter, a fix in Edit, and Publish only when all are fixed", async ({
      page,
    }) => {
      await importFile(page, csvFile(makeCsv(20, { 3: "no-explanation", 7: "no-correct" })));
      await expect(count(page, "ready")).toHaveText("18");
      await expect(count(page, "attention")).toHaveText("2");
      const publish = page.getByRole("button", { name: "Publish", exact: true });
      await expect(publish).toBeDisabled();
      await expect(page.locator("[data-publish-hint]")).toHaveText("Fix 2 questions to publish");
      await expect(page.locator(`[data-question-row="3"]`)).toContainText(
        "Needs attention: No explanation",
      );
      await expect(page.locator(`[data-question-row="7"]`)).toContainText(
        "Needs attention: No correct answer",
      );
      expect(await colour(page.locator(`[data-question-row="3"] [data-question-status]`))).toBe(
        ATTENTION_INK,
      );
      // the filter
      await page.getByText("Needs attention", { exact: true }).click();
      await expect(page.locator("[data-question-row]")).toHaveCount(2);
      await page.getByText("All", { exact: true }).click();
      await expect(page.locator("[data-question-row]")).toHaveCount(20);
      // fix the first one in Edit: the count changes
      await page.locator(`[data-question-row="3"]`).click();
      await expect(page).toHaveURL(/\/instructor\/content\/c[a-z0-9]+\/3$/);
      await expect(page.locator("[data-problems]:visible")).toContainText("No explanation");
      await page.locator("textarea[name=explanation]").fill("Because it keeps the route clear.");
      await expect(page.locator("[data-problems]:visible")).toHaveCount(0);
      await page.getByRole("button", { name: "Save question" }).click();
      await expect(page).toHaveURL(/\/instructor\/content\/c[a-z0-9]+$/);
      await expect(count(page, "ready")).toHaveText("19");
      await expect(page.locator("[data-publish-hint]")).toHaveText("Fix 1 question to publish");
      await expect(publish).toBeDisabled();
      // fix the second: choose the correct answer
      await page.locator(`[data-question-row="7"]`).click();
      await expect(page.locator("[data-problems]:visible")).toContainText("No correct answer");
      await page.locator("[data-correct=b]:visible").click();
      await expect(page.locator("[data-problems]:visible")).toHaveCount(0);
      await page.getByRole("button", { name: "Save question" }).click();
      await expect(count(page, "ready")).toHaveText("20");
      await expect(page.locator("[data-publish-hint]")).toHaveCount(0);
      await expect(publish).toBeEnabled();
    });

    test("Edit question: fields, heights, counter, live problems, delete question, not-found", async ({
      page,
    }) => {
      await importFile(page, csvFile(makeCsv(3)));
      const id = reviewId(page);
      await page.locator(`[data-question-row="2"]`).click();
      await expect(page.getByRole("heading", { name: "Question 2", level: 1 })).toBeVisible();
      await expect(page.locator("textarea[name=question]")).toHaveValue("Question number 2?");
      for (const letter of ["A", "B", "C", "D"]) {
        const field = page.getByLabel(`Answer ${letter}`);
        expect((await field.boundingBox())!.height).toBe(52);
      }
      await expect(page.getByLabel("Answer D")).toHaveValue("");
      await expect(page.locator("[data-correct=b] input")).toBeChecked();
      expect(
        (await page.locator("[data-correct=b]:visible").boundingBox())!.width,
      ).toBeGreaterThanOrEqual(44);
      await expect(page.locator("[data-counter]")).toHaveText("18 of 300");
      await page.locator("textarea[name=question]").fill("x".repeat(301));
      await expect(page.locator("[data-problems]:visible")).toContainText("longer than 300");
      await page.locator("textarea[name=question]").fill("");
      await expect(page.locator("[data-problems]:visible")).toContainText("No question text");
      await page.getByLabel("Answer A").fill("");
      await page.getByLabel("Answer B").fill("");
      await expect(page.locator("[data-problems]:visible")).toContainText("Fewer than 2 answers");
      const save = page.getByRole("button", { name: "Save question" });
      expect(await bg(save)).toBe(PRIMARY);
      expect(await primaries(page)).toBe(1);
      expect(await noSidewaysScroll(page)).toBe(true);
      // delete: Keep first, then delete; the set has 2 questions left
      await page.getByRole("button", { name: "Delete question" }).click();
      const dialog = page.locator("dialog[open]");
      await dialog.getByRole("button", { name: "Keep question" }).click();
      await page.getByRole("button", { name: "Delete question" }).click();
      await dialog.getByRole("button", { name: "Delete question" }).click();
      await expect(page).toHaveURL(new RegExp(`/instructor/content/${id}$`));
      await expect(page.locator("[data-question-row]")).toHaveCount(2);
      // not found: an unknown set and an unknown question
      await page.goto("/instructor/content/nope");
      await expect(page.getByRole("heading", { name: "Set not found" })).toBeVisible();
      expect(await bg(page.getByRole("link", { name: "Back to Content" }))).toBe(OLIVE_TINT);
      await page.goto(`/instructor/content/${id}/99`);
      await expect(page.getByRole("heading", { name: "Question not found" })).toBeVisible();
    });

    test("an image: Add image, preview, alt text is required, Remove image; stored with the set", async ({
      page,
    }) => {
      await importFile(page, csvFile(makeCsv(2)));
      const id = reviewId(page);
      await page.locator(`[data-question-row="1"]`).click();
      await page
        .locator("[data-image-input]")
        .setInputFiles({ name: "p.png", mimeType: "image/png", buffer: PNG });
      await expect(page.locator("[data-image-preview]")).toBeVisible();
      await expect(page.locator("[data-problems]:visible")).toContainText("Image has no alt text");
      await page.getByLabel("Alt text (a short description)").fill("A tiny test picture");
      await expect(page.locator("[data-problems]:visible")).toHaveCount(0);
      // a wrong type is refused in amber
      await page.getByRole("button", { name: "Remove image" }).click();
      await page
        .locator("[data-image-input]")
        .setInputFiles({ name: "p.gif", mimeType: "image/gif", buffer: PNG });
      await expect(page.locator("[data-amber]:visible")).toContainText("png, jpg or webp");
      // and one over 300 KB
      await page.locator("[data-image-input]").setInputFiles({
        name: "big.png",
        mimeType: "image/png",
        buffer: Buffer.alloc(300 * 1024 + 1, 1),
      });
      await expect(page.locator("[data-amber]:visible")).toContainText("png, jpg or webp");
      await page
        .locator("[data-image-input]")
        .setInputFiles({ name: "p.png", mimeType: "image/png", buffer: PNG });
      await page.getByLabel("Alt text (a short description)").fill("A tiny test picture");
      await page.getByRole("button", { name: "Save question" }).click();
      await expect(page).toHaveURL(new RegExp(`/instructor/content/${id}$`));
      const stored = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.content-sets.v1")!).value[0].questions[0].image,
      );
      expect(stored.alt).toBe("A tiny test picture");
      expect(stored.data).toMatch(/^data:image\/png;base64,/);
    });

    test("a Word file shows the prepared sample with its label; 18 ready and 2 need attention", async ({
      page,
    }) => {
      await importFile(page, {
        name: "notes.docx",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: Buffer.from("PK not really a document"),
      });
      await expect(page.locator("[data-sample-label]")).toHaveText(
        "Sample result. Word files are not read in this prototype.",
      );
      await expect(count(page, "ready")).toHaveText("18");
      await expect(count(page, "attention")).toHaveText("2");
      await expect(page.locator("[data-publish-hint]")).toHaveText("Fix 2 questions to publish");
    });

    test("drafts survive a reload, and a broken saved value never crashes", async ({ page }) => {
      await importFile(page, csvFile(makeCsv(4)), "Kept set");
      await page.goto("/instructor/content");
      await page.reload();
      await expect(page.locator("[data-set-card]")).toContainText("Kept set");
      await page.evaluate(() => localStorage.setItem("ast.content-sets.v1", "{not json"));
      await page.reload();
      await expect(page.getByText("No imported sets yet.")).toBeVisible();
    });

    test("markup in a file is shown as text and never runs", async ({ page }) => {
      await importFile(page, csvFile(makeCsv(2, { 1: "xss" })));
      await expect(page.locator(`[data-question-row="1"]`)).toContainText(
        "<script>window.__xss=1</script>",
      );
      await page.locator(`[data-question-row="1"]`).click();
      await expect(page.locator("textarea[name=question]")).toHaveValue(
        /<script>window\.__xss=1<\/script><img src=x onerror=window\.__xss=2>/,
      );
      expect(
        await page.evaluate(() => (window as unknown as { __xss?: number }).__xss),
      ).toBeUndefined();
      await expect(page.locator("main script, main img[src='x']")).toHaveCount(0);
    });

    test("the Student practises a published set in Training; readiness figures do not change", async ({
      page,
    }) => {
      await importFile(page, csvFile(makeCsv(5)), "Routes from the instructor");
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Publish" }).click();
      await expect(page.locator("[data-message]")).toContainText("Published.");
      await switchRole(page, "Student");
      await page.goto("/training?mode=quiz");
      const stats = await page.locator("[aria-label='Your progress']").innerText();
      const card = page.locator("[data-instructor-set]");
      await expect(card).toContainText("From your instructor: Routes from the instructor");
      await expect(card).toContainText("5 questions");
      // the Scenario mode has no such card
      await page.getByText("Scenario", { exact: true }).click();
      await expect(page.locator("[data-instructor-set]")).toHaveCount(0);
      await page.getByText("Quiz", { exact: true }).click();
      await card.getByRole("button", { name: /Practise/ }).click();
      await expect(page).toHaveURL(/\/session$/);
      for (let n = 0; n < 5; n++) {
        await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
        await page.getByRole("button", { name: "Check", exact: true }).click();
        const last = n === 4;
        await page.getByRole("button", { name: last ? "Finish" : "Next", exact: true }).click();
      }
      await expect(page).toHaveURL(/\/session\/results$/);
      // the answers are in the history, but the Training figures are unchanged
      await page.goto("/training?mode=quiz");
      expect(await page.locator("[aria-label='Your progress']").innerText()).toBe(stats);
      // and no imported question is a weak topic
      await page.goto("/weak-topics");
      await expect(page.getByText("Question number")).toHaveCount(0);
      // the instructor Unpublishes: the card is gone for the student
      await switchRole(page, "Instructor");
      await page.goto("/instructor/content");
      await page.locator("[data-set-card]").click();
      await page.getByRole("button", { name: "Unpublish" }).click();
      await switchRole(page, "Student");
      await page.goto("/training?mode=quiz");
      await expect(page.locator("[data-instructor-set]")).toHaveCount(0);
    });
  });
}

test.describe("Content and the Student", () => {
  test("a student is sent Home from every Content route", async ({ page }) => {
    for (const path of [
      "/instructor/content",
      "/instructor/content/import",
      "/instructor/content/abc",
      "/instructor/content/abc/1",
    ]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/$/);
    }
  });
});
