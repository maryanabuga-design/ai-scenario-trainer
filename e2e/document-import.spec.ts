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

    test("empty: one large dashed card, the muted line, two plain links, no What to include, one disabled Primary", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await expect(page.getByRole("heading", { name: "Import content" })).toBeVisible();
      const card = page.locator("[data-drop-area]");
      await expect(card).toContainText("Choose a document");
      await expect(card).toContainText("Excel (.xlsx), up to 10 MB");
      expect(await card.evaluate((el) => getComputedStyle(el).borderStyle)).toBe("dashed");
      expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(120);
      await expect(page.getByText("IMAGES (OPTIONAL)")).toHaveCount(0);
      await expect(importButton(page)).toBeDisabled();
      expect(await primaries(page)).toBe(0);
      await expect(page.locator("main")).not.toContainText("What to include");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the helper line is in the header band; the two plain underlined links are in one row with their edges on the content edges, 44px tap areas, no icons, border or fill; no What to include anywhere", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      const helper = page.locator("[data-page-header-band] [data-helper]");
      await expect(helper).toHaveText(
        "Upload one Excel document. We will read it and prepare a draft topic for you to review.",
      );
      expect(await helper.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(92, 90, 85)");
      const title = (await page.getByRole("heading", { name: "Import content" }).boundingBox())!;
      const h = (await helper.boundingBox())!;
      expect(Math.round(h.y - (title.y + title.height))).toBe(8);
      const download = page.getByRole("link", { name: "Download blank template" });
      const example = page.getByRole("button", { name: "Try an example" });
      await expect(download).toHaveText("Download blank template");
      await expect(example).toHaveText("Try an example");
      const [a, b] = [(await download.boundingBox())!, (await example.boundingBox())!];
      expect(a.height).toBeGreaterThanOrEqual(44);
      expect(b.height).toBeGreaterThanOrEqual(44);
      expect(a.y).toBe(b.y);
      for (const link of [download, example]) {
        const style = await link.evaluate((el) => {
          const css = getComputedStyle(el);
          const label = getComputedStyle(el.querySelector("span")!);
          return [css.backgroundColor, css.borderTopWidth, label.textDecorationLine];
        });
        expect(style).toEqual(["rgba(0, 0, 0, 0)", "0px", "underline"]);
        await expect(link.locator("svg")).toHaveCount(0);
      }
      // the text edges sit on the content edges (16px gutter): the first on the left, the second on the right
      const textBox = async (locator: typeof download) =>
        (await locator.locator("span").boundingBox())!;
      const [ta, tb] = [await textBox(download), await textBox(example)];
      expect(Math.round(ta.x)).toBe(16);
      expect(Math.round(tb.x + tb.width)).toBe(width - 16);
      expect(await noSidewaysScroll(page)).toBe(true);
      expect(await primaries(page)).toBe(0);
      await choose(page, `${FIXTURES}clean.xlsx`);
      await expect(page.locator("main")).not.toContainText("What to include");
      await expect(page.getByText("IMAGES (OPTIONAL)")).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the template downloads and the example loads and continues to Analysing", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("link", { name: "Download blank template" }).click(),
      ]);
      expect(download.suggestedFilename()).toBe("guide-template.xlsx");
      await page.getByRole("button", { name: "Try an example" }).click();
      await expect(page.locator("[data-file-card]")).toContainText("sample-document.xlsx");
      await importButton(page).click();
      await expect(page).toHaveURL(/\/import\/analysing$/);
      await expect(page.getByRole("heading", { name: "Reading your document…" })).toBeVisible();
      // saved and read back, the example still has its pictures: nothing is flagged on the topic
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 10000,
      });
      const id = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.demo-topics.v1")!).value[0].id as string,
      );
      await page.goto(`/instructor/content/package/${id}`);
      await expect(page.locator("#package-status")).toContainText("All items checked");
    });

    test("the old Import questions route redirects to Import content; Content has the new labels and empty state", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import/questions");
      await expect(page).toHaveURL(/\/instructor\/content\/import$/);
      await expect(page.getByRole("heading", { name: "Import content" })).toBeVisible();
      await page.goto("/instructor/content");
      await expect(page.getByRole("heading", { name: "YOUR TOPICS" })).toBeVisible();
      await expect(page.getByText("Import a document to create your first topic.")).toBeVisible();
      await expect(
        page.locator('a[href*="import/questions"], a[href*="import/topic"]'),
      ).toHaveCount(0);
      expect(await primaries(page)).toBe(1);
      await page.locator("[data-course-row]").click();
      await expect(page.getByRole("heading", { name: "Course topics", level: 1 })).toBeVisible();
      await expect(page.locator("[data-built-in-label]:visible")).toHaveText(
        Array(10).fill("Course topic · read-only"),
      );
      await expect(page.locator("main")).not.toContainText(
        /IMPORTED SETS|BUILT-IN TOPICS|Show course topics/,
      );
      expect(await primaries(page)).toBe(0);
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
      expect((await x.locator("span").boundingBox())!.width).toBe(32);
      expect(await x.locator("span").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgb(226, 222, 214)",
      );
      // pictures are added here, and named
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await expect(page.locator("[data-image-row]")).toHaveText([
        "exit-sign.png",
        "assembly-point.png",
      ]);
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

    test("Download template and Try an example use the two Excel files", async ({
      page,
      request,
    }) => {
      for (const path of ["/templates/guide-template.xlsx", "/templates/sample-document.xlsx"]) {
        const response = await request.get(path);
        expect(response.ok()).toBe(true);
        expect((await response.body()).length).toBeGreaterThan(2000);
      }
      await page.goto("/instructor/content/import");
      const template = page.getByRole("link", { name: "Download blank template" });
      await expect(template).toHaveAttribute("href", "/templates/guide-template.xlsx");
      await expect(template).toHaveAttribute("download", "guide-template.xlsx");
      await page.getByRole("button", { name: "Try an example" }).click();
      await expect(page.locator("[data-file-card]")).toContainText("sample-document.xlsx");
      await expect(page.locator("[data-image-row]")).toHaveCount(2);
      await expect(importButton(page)).toBeEnabled();
    });

    test("Analysing: five stages with real counts, then Draft is ready; the draft exists only after it finishes; Cancel saves nothing", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page.getByRole("button", { name: "Try an example" }).click();
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
      // everything is centred: the picture, the title, the file name and the stage rows
      const centre = async (selector: string) => {
        const box = (await page.locator(selector).first().boundingBox())!;
        return Math.round(box.x + box.width / 2);
      };
      for (const selector of ["[data-art]", "h1", "[data-file-name]", "[data-stages]"]) {
        expect(Math.abs((await centre(selector)) - width / 2), selector).toBeLessThanOrEqual(1);
      }
      const art = (await page.locator("[data-art]").boundingBox())!;
      expect([art.width, art.height]).toEqual([160, 160]);
      await expect(page.locator("[data-art]")).toHaveAttribute(
        "src",
        "/images/instructor/import-analysing.webp",
      );
      const stages = (await page.locator("[data-stages]").boundingBox())!;
      expect(stages.width).toBeLessThanOrEqual(360);
      // the stages tick in order with their real results
      await expect(page.locator("[data-stage-result]").first()).toContainText("5 sheets read", {
        timeout: 4000,
      });
      await expect(page.locator("[data-stage-result]").nth(1)).toHaveText("4 found", {
        timeout: 4000,
      });
      await expect(page.locator("[data-stage-result]").nth(2)).toHaveText(
        "7 steps, 4 scenario steps",
        { timeout: 4000 },
      );
      await expect(page.locator("[data-stage-result]").nth(3)).toHaveText("10 questions", {
        timeout: 4000,
      });
      // nothing is saved while the stages run
      expect(await storedTopics(page)).toBeNull();
      expect(await primaries(page)).toBe(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 8000,
      });
      // finished: the stage rows collapse, the success picture and ONE summary card with its badge
      await expect(page.locator("[data-stages]")).toHaveCount(0);
      await expect(page.locator("[data-art]")).toHaveAttribute(
        "src",
        "/images/instructor/import-success.webp",
      );
      const card = page.locator("[data-summary]");
      const c = (await card.boundingBox())!;
      // as wide as the content and the pinned buttons
      const open = (await page
        .getByRole("button", { name: "Open draft", exact: true })
        .boundingBox())!;
      expect(Math.abs(c.x - open.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(c.x + c.width - (open.x + open.width))).toBeLessThanOrEqual(1);
      expect(
        await card.evaluate((el) => {
          const css = getComputedStyle(el);
          return [css.backgroundColor, css.borderTopWidth, css.borderTopColor, css.borderRadius];
        }),
      ).toEqual(["rgb(255, 255, 255)", "1px", "rgb(228, 223, 213)", "16px"]);
      // no badge: the card starts directly with the rows
      await expect(page.locator("[data-badge]")).toHaveCount(0);
      const first = (await card.locator("dl > div").first().boundingBox())!;
      expect(first.y - c.y).toBeLessThanOrEqual(20);
      await expect(card.locator("dt")).toHaveText([
        "Guide sections",
        "Steps",
        "Scenario steps",
        "Questions",
        "Links to the guide",
      ]);
      await expect(card.locator("dd")).toHaveText(["4", "7", "4", "10", "All linked"]);
      // every row: a round 36px tile with its own 18px icon (1.5px stroke, muted ink), a plain value
      const icons = ["book-open", "layers", "mountain-snow", "message-circle-question", "link"];
      const rows = card.locator("dl > div");
      const edge = (await card.boundingBox())!;
      let dividers = 0;
      for (let n = 0; n < 5; n++) {
        const row = rows.nth(n);
        const tile = row.locator("[data-icon-tile]");
        await expect(tile).toHaveAttribute("aria-hidden", "true");
        await expect(tile.locator(`svg.lucide-${icons[n]}`)).toHaveCount(1);
        const t = (await tile.boundingBox())!;
        expect([Math.round(t.width), Math.round(t.height)]).toEqual([36, 36]);
        const look = await tile.evaluate((el) => {
          const css = getComputedStyle(el);
          const svg = el.querySelector("svg")!;
          const box = svg.getBoundingClientRect();
          const widthAttr = Number(svg.getAttribute("stroke-width"));
          return {
            background: css.backgroundColor,
            radius: parseFloat(css.borderTopLeftRadius) >= 18,
            border: css.borderTopWidth,
            ink: getComputedStyle(svg).stroke,
            icon: [Math.round(box.width), Math.round(box.height)],
            // the stroke as drawn: attribute x rendered size / 24
            stroke: Math.round(widthAttr * (box.width / 24) * 100) / 100,
          };
        });
        expect(look).toEqual({
          background: "rgb(239, 236, 230)",
          radius: true,
          border: "0px",
          ink: "rgb(107, 112, 98)",
          icon: [18, 18],
          stroke: 1.5,
        });
        // 16px from the card edge to the tile, 16px from the value to the right edge
        expect(Math.abs(t.x - (edge.x + 16) - 1)).toBeLessThanOrEqual(1);
        const v = (await row.locator("dd").boundingBox())!;
        expect(Math.abs(edge.x + edge.width - 1 - (v.x + v.width) - 16)).toBeLessThanOrEqual(1);
        expect(Math.round((await row.boundingBox())!.height)).toBeGreaterThanOrEqual(56);
        const value = row.locator("dd");
        expect(
          await value.evaluate((el) => {
            const css = getComputedStyle(el);
            return [css.backgroundColor, css.borderTopWidth, css.fontWeight];
          }),
        ).toEqual(["rgba(0, 0, 0, 0)", "0px", "600"]);
        // exactly one divider between neighbours: none above the first, one above each of the others;
        // it starts at the label (tile + 12px gap) and ends at the right padding edge
        const line = await row.evaluate((el) => {
          const css = getComputedStyle(el, "::before");
          const label = el.querySelector("dt")!.getBoundingClientRect();
          const rowBox = el.getBoundingClientRect();
          return {
            height: css.height,
            colour: css.backgroundColor,
            content: css.content,
            left: Math.round(label.left - rowBox.left),
            right: css.right,
          };
        });
        if (n === 0) {
          expect(["none", "normal", '""']).toContain(line.content);
        } else {
          dividers += 1;
          expect(line).toMatchObject({
            height: "1px",
            colour: "rgb(228, 223, 213)",
            right: "0px",
            left: 48,
          });
        }
      }
      expect(dividers).toBe(4);
      // the Links value is plain success text, with no background
      const links = card.locator("[data-links-row] dd");
      expect(await links.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(68, 104, 58)");
      expect(await noSidewaysScroll(page)).toBe(true);
      // the draft is saved; the result screen offers Open draft
      expect(await storedTopics(page)).toContain("Evacuating a crowded hall");
      await expect(page.getByRole("button", { name: "Open draft", exact: true })).toBeVisible();
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

    test("a finished draft offers Open draft, which opens the topic screen that holds the review", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}problems.xlsx`);
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await importButton(page).click();
      // this document has no scenario sheet: the partial state first, then the finished draft
      await page.getByRole("button", { name: "Continue" }).click({ timeout: 10000 });
      // the result screen has Open draft (the Primary) and Back to Content; no Review or Preview here
      const open = page.getByRole("button", { name: "Open draft", exact: true });
      await expect(open).toBeVisible();
      await expect(page.getByRole("button", { name: "Back to Content" })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /Review \d+ items|Preview as student/ }),
      ).toHaveCount(0);
      expect(await primaries(page)).toBe(1);
      await open.click();
      // the topic screen holds the review
      await expect(page).toHaveURL(/\/instructor\/content\/package\/[a-z0-9]+$/);
      await page.getByRole("button", { name: "Review 6 items" }).click();
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
      // centred in the same layout, with the neutral icon instead of a picture
      await expect(page.locator("[data-art-fallback]")).toBeVisible();
      const f = (await page.locator("[data-art-fallback]").boundingBox())!;
      expect(Math.abs(f.x + f.width / 2 - width / 2)).toBeLessThanOrEqual(1);
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
      await expect(page.locator("[data-art-fallback]")).toBeVisible();
      const f = (await page.locator("[data-art-fallback]").boundingBox())!;
      expect(Math.abs(f.x + f.width / 2 - width / 2)).toBeLessThanOrEqual(1);
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
      await expect(page.locator("[data-stages]")).toHaveCount(0);
      await expect(page.locator("[data-summary]")).toBeVisible();
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

    test("when a picture is missing the neutral icon shows instead, centred, while reading and when finished", async ({
      page,
    }) => {
      await page.route("**/images/instructor/import-*.webp", (route) => route.abort());
      await page.goto("/instructor/content/import");
      await choose(page, `${FIXTURES}clean.xlsx`);
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await importButton(page).click();
      await expect(page.locator("[data-art-fallback]")).toBeVisible();
      await expect(page.locator("[data-art]")).toHaveCount(0);
      const f = (await page.locator("[data-art-fallback]").boundingBox())!;
      expect(Math.abs(f.x + f.width / 2 - width / 2)).toBeLessThanOrEqual(1);
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 8000,
      });
      await expect(page.locator("[data-art-fallback]")).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the topic menu: Edit title and summary saves plain text; Delete topic asks first", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page.getByRole("button", { name: "Try an example" }).click();
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
      await page.getByRole("button", { name: "Try an example" }).click();
      await importButton(page).click();
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 10000,
      });
      expect(external).toEqual([]);
    });
  });
}
