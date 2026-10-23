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

const DIR = "public/templates/sample-package/";
const f = (name: string) => `${DIR}${name}`;
const CSVS = ["topic.csv", "guide.csv", "steps.csv", "scenario.csv", "questions.csv"].map(f);
const PICTURES = [f("exit-sign.png"), f("assembly-point.png")];
const CLEAN = [...CSVS, ...PICTURES];
const PROBLEMS = [
  f("guide.csv"),
  f("steps-with-problems.csv"),
  f("questions-with-problems.csv"),
  ...PICTURES,
];
const ATTENTION_BG = "rgb(241, 228, 200)";
const ATTENTION_INK = "rgb(111, 81, 32)";
const WRONG_TEXT = "rgb(155, 44, 31)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);

async function importFiles(page: Page, files: string[], title = "") {
  await page.goto("/instructor/content/import");
  await page.locator("[data-file-input]").setInputFiles(files);
  await expect(page.locator("[data-recognised-row]").first()).toBeVisible();
  if (title) await page.getByLabel("Topic title").fill(title);
  await page.getByRole("button", { name: "Import and review" }).click();
  await expect(page).toHaveURL(/\/instructor\/content\/package\/[a-z0-9]+(\?.*)?$/, {
    timeout: 15000,
  });
}

const topicId = (page: Page) => /package\/([a-z0-9]+)/.exec(page.url())![1];

async function asStudent(page: Page) {
  if (page.url() === "about:blank") await page.goto("/");
  await page.evaluate((v) => localStorage.setItem("ast.auth.v1", v), authValue("student"));
}
async function asInstructor(page: Page) {
  await page.evaluate((v) => localStorage.setItem("ast.auth.v1", v), authValue("instructor"));
}

for (const width of [360, 430]) {
  test.describe(`Content package at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("the sample package files exist and the zip is served", async ({ page, request }) => {
      const response = await request.get("/templates/sample-package.zip");
      expect(response.ok()).toBe(true);
      await page.goto("/instructor/content/import");
      await expect(page.getByRole("link", { name: "Download sample package" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Download templates" })).toBeVisible();
    });

    test("the empty import screen: the info Notice says Word, Excel and PDF are not read, the tertiary link sits under it, no sideways scroll", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await expect(page.getByRole("heading", { name: "Import content" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Import and review" })).toBeDisabled();
      const info = page.locator('[data-notice="info"]:visible');
      await expect(info).toContainText("Word, Excel and PDF files are not read in this prototype.");
      expect(await bg(info)).toBe("rgb(255, 255, 255)");
      const link = page.getByRole("link", { name: "Import questions to a built-in topic" });
      expect(
        await link.evaluate((el) => getComputedStyle(el.querySelector("span")!).textDecorationLine),
      ).toContain("underline");
      expect(await bg(link)).toBe("rgba(0, 0, 0, 0)");
      const a = (await info.boundingBox())!;
      const b = (await link.boundingBox())!;
      expect(b.y).toBeGreaterThan(a.y + a.height - 1);
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      // the summary is a two-line text area
      await expect(page.locator("textarea[name=topic-summary]")).toHaveAttribute("rows", "2");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("images missing: the Images row is amber 'N to add' with 'Missing: ...', never Ready; rows are three lines with 44px icon Remove buttons", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page.locator("[data-file-input]").setInputFiles(CSVS);
      const images = page.locator('[data-recognised-row="images"]');
      await expect(images).toContainText("Images · 0 of 2 found");
      await expect(images.locator("[data-row-pill]")).toHaveText("2 to add");
      expect(await bg(images.locator("[data-row-pill]"))).toBe(ATTENTION_BG);
      await expect(images.locator("[data-missing]")).toHaveText(
        "Missing: exit-sign.png, assembly-point.png",
      );
      await expect(images).not.toContainText("Ready");
      await expect(page.locator("[data-fix-in-review]")).toHaveText(
        "You can import now and fix the issues in the review.",
      );
      // one picture added: one still missing
      await page.locator("[data-file-input]").setInputFiles(PICTURES[0]);
      await expect(images.locator("[data-row-pill]")).toHaveText("1 to add");
      await expect(images.locator("[data-missing]")).toHaveText("Missing: assembly-point.png");
      // both: Ready
      await page.locator("[data-file-input]").setInputFiles(PICTURES);
      await expect(images.locator("[data-row-pill]")).toHaveText("Ready");
      await expect(page.locator("[data-fix-in-review]")).toHaveCount(0);
      // layout of a row: label, pill, file name; the remove button is a 44px icon named after the file
      const row = page.locator('[data-recognised-row="scenario"]');
      const label = (await row.getByText("Scenario · 4 steps").boundingBox())!;
      const pill = (await row.locator("[data-row-pill]").boundingBox())!;
      const name = (await row.locator("[data-file-name]").boundingBox())!;
      expect(pill.y).toBeGreaterThan(label.y);
      expect(name.y).toBeGreaterThan(pill.y);
      const remove = row.getByRole("button", { name: "Remove scenario.csv" });
      const box = (await remove.boundingBox())!;
      expect([box.width, box.height]).toEqual([44, 44]);
      expect(await bg(remove)).toBe("rgb(226, 222, 214)");
      await expect(row.getByText("Remove", { exact: true })).toHaveCount(0);
      await remove.click();
      await expect(page.locator('[data-recognised-row="scenario"]')).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("problems: part pills 'N to fix', the Import button stays enabled", async ({ page }) => {
      await page.goto("/instructor/content/import");
      await page.locator("[data-file-input]").setInputFiles(PROBLEMS);
      await expect(page.locator('[data-recognised-row="steps"] [data-row-pill]')).toHaveText(
        "2 to fix",
      );
      await page.getByLabel("Topic title").fill("Problem topic");
      await expect(page.locator('[data-recognised-row="questions"] [data-row-pill]')).toHaveText(
        "4 to fix",
      );
      expect(await bg(page.locator('[data-recognised-row="steps"] [data-row-pill]'))).toBe(
        ATTENTION_BG,
      );
      await expect(page.locator("main")).not.toContainText("Needs attention");
      await expect(page.getByRole("button", { name: "Import and review" })).toBeEnabled();
    });

    test("review with issues: the to fix Notice, tab dots with names, Publish and Preview disabled, destructive Delete link, one Primary", async ({
      page,
    }) => {
      await importFiles(page, PROBLEMS, "Problem topic");
      await expect(page.locator("[data-package-status]")).toContainText(
        "Draft · Last edited today",
      );
      await expect(page.locator("main")).not.toContainText(/\bN\d\b/);
      const notice = page.locator("#package-status");
      await expect(notice).toContainText("6 to fix before you can publish");
      await expect(notice).toContainText("Preview and Publish unlock when everything is fixed.");
      expect(await bg(notice)).toBe(ATTENTION_BG);
      expect(await notice.evaluate((el) => getComputedStyle(el).color)).toBe(ATTENTION_INK);
      await expect(notice.getByRole("button", { name: "Close" })).toHaveCount(0);
      await expect(page.getByRole("radio", { name: "Steps, 2 to fix" })).toHaveCount(1);
      await expect(page.getByRole("radio", { name: "Quiz, 4 to fix" })).toHaveCount(1);
      await expect(page.locator("[data-tab-dot]")).toHaveCount(2);
      // the four-option selector fits on one line
      expect((await page.getByRole("radiogroup").boundingBox())!.height).toBeLessThan(60);
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Preview as student" })).toBeDisabled();
      const del = page.getByRole("button", { name: "Delete demo topic" });
      expect(await del.evaluate((el) => getComputedStyle(el).color)).toBe(WRONG_TEXT);
      expect(await bg(del)).toBe("rgba(0, 0, 0, 0)");
      expect(
        await del.evaluate((el) => getComputedStyle(el.querySelector("span")!).textDecorationLine),
      ).toContain("underline");
      expect((await del.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      // order in the pinned area: Publish, Preview as student, Delete
      const ys = [
        (await page.getByRole("button", { name: "Publish", exact: true }).boundingBox())!.y,
        (await page.getByRole("button", { name: "Preview as student" }).boundingBox())!.y,
        (await del.boundingBox())!.y,
      ];
      expect([...ys].sort((x, y) => x - y)).toEqual(ys);
      // one Primary (Publish, disabled while anything is to fix): its look is the Primary's
      const primaries = await page
        .locator("button:visible, a:visible")
        .evaluateAll(
          (els) => els.filter((el) => /h-\[52px\] bg-primary/.test(el.className)).length,
        );
      expect(primaries).toBe(1);
      expect(await noSidewaysScroll(page)).toBe(true);
      // typing the preview address does not open it either
      await page.goto(`/instructor/content/package/${topicId(page)}/preview`);
      await expect(page).toHaveURL(/\/instructor\/content\/package\/[a-z0-9]+$/);
    });

    test("Show next issue visits all six issues in order, switches the tab, focuses and outlines the item for 2 seconds, and wraps around", async ({
      page,
    }) => {
      await importFiles(page, PROBLEMS, "Problem topic");
      const next = page.getByRole("button", { name: "Show next issue" });
      const seen: { tab: string; ids: string }[] = [];
      for (let n = 0; n < 7; n += 1) {
        await next.click();
        const active = page.locator("[data-flash=true]");
        await expect(active).toHaveCount(1);
        const ids = (await active.getAttribute("data-issue-ids")) ?? "";
        const tab = await page
          .getByRole("radio", { checked: true })
          .evaluate((el) => (el.closest("label")?.textContent ?? "").trim());
        seen.push({ tab, ids });
        // moved into view and focused, outlined in amber
        await expect(active).toBeFocused();
        // brought into view (the scroll may still be settling)
        await expect
          .poll(async () => {
            const box = await active.boundingBox();
            return box ? box.y >= 0 && box.y + box.height <= 800 : false;
          })
          .toBe(true);
        expect(await active.evaluate((el) => getComputedStyle(el).outlineColor)).toBe(
          ATTENTION_INK,
        );
        expect(await active.evaluate((el) => getComputedStyle(el).outlineWidth)).toBe("2px");
        if (n === 0) {
          await page.waitForTimeout(2300);
          await expect(page.locator("[data-flash=true]")).toHaveCount(0);
        }
      }
      expect(seen.slice(0, 6).map((s) => s.tab)).toEqual([
        "Steps",
        "Steps",
        "Quiz",
        "Quiz",
        "Quiz",
        "Quiz",
      ]);
      expect(new Set(seen.slice(0, 6).map((s) => s.ids)).size).toBe(6);
      // the seventh click wraps to the first issue again
      expect(seen[6]).toEqual(seen[0]);
    });

    test("a tab with issues has its own notice: 'N to fix in this tab' with Replace files for the files, Edit question for questions", async ({
      page,
    }) => {
      await importFiles(page, PROBLEMS, "Problem topic");
      await page.getByRole("radio", { name: /^Steps/ }).click({ force: true });
      const notice = page.locator("#tab-notice");
      await expect(notice).toContainText("2 to fix in this tab");
      await expect(notice.getByRole("link", { name: "Replace files" })).toBeVisible();
      await expect(page.locator("[data-to-fix]")).toHaveCount(2);
      await expect(page.locator("[data-to-fix]").first()).toContainText("To fix");
      await expect(
        page.getByText("Fix this in the files, then replace them.").first(),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Edit question" })).toHaveCount(0);
      await page.getByRole("radio", { name: /^Quiz/ }).click({ force: true });
      await expect(page.locator("#tab-notice")).toContainText("4 to fix in this tab");
      await expect(page.locator("[data-to-fix]")).toHaveCount(4);
      await expect(page.getByRole("link", { name: "Edit question" })).toHaveCount(3);
      // question 4 has no correct answer; question 5 has one, so its editor also carries the check notice
      const edit = page.getByRole("link", { name: "Edit question" }).nth(1);
      expect((await edit.boundingBox())!.height).toBe(52);
      expect(await bg(edit)).toBe("rgb(224, 230, 214)");
      await edit.click();
      await expect(page).toHaveURL(/\/question\/\d+\/edit$/);
      await expect(page.locator("[data-problems]:visible [data-notice]")).toContainText(
        "to fix in this question",
      );
      await expect(page.locator('[data-notice="info"]:visible')).toContainText(
        "Check the correct answer",
      );
      await expect(page.locator('[data-notice="info"]:visible')).toContainText(
        /Option [A-D] is marked as correct\. Change it if that is wrong\./,
      );
    });

    test("Replace files reopens the import with the title kept and says what to fix; the corrected files clear every issue", async ({
      page,
    }) => {
      await importFiles(page, PROBLEMS, "Problem topic");
      await page.getByRole("radio", { name: /^Steps/ }).click({ force: true });
      await page.locator("#tab-notice").getByRole("link", { name: "Replace files" }).click();
      await expect(page).toHaveURL(/import\?replace=[a-z0-9]+&fix=steps$/);
      const notice = page.locator('[data-notice="to-fix"]');
      await expect(notice).toContainText("Guide section 7 does not exist");
      await expect(notice).toContainText("The new files replace the files of Problem topic");
      await expect(page.getByLabel("Topic title")).toHaveValue("Problem topic");
      await page.locator("[data-file-input]").setInputFiles(CLEAN);
      await page.getByRole("button", { name: "Import and review" }).click();
      await expect(page).toHaveURL(/\/instructor\/content\/package\//, { timeout: 15000 });
      const success = page.locator("#package-status");
      await expect(success).toContainText("Nothing to fix");
      await expect(success).toContainText("Preview as student, then publish.");
      expect(await bg(success)).toBe("rgb(225, 234, 218)");
      await expect(page.locator("[data-tab-dot]")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Preview as student" })).toBeEnabled();
      // the success notice can be closed
      await success.getByRole("button", { name: /Close/ }).click();
      await expect(page.locator("#package-status")).toHaveCount(0);
    });

    test("Preview as student is the student's screens: the same text, pictures and buttons for the guide, the step guide, the scenario and the quiz", async ({
      page,
    }) => {
      await importFiles(page, CLEAN);
      const id = topicId(page);
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Preview as student" })).toBeEnabled();

      const read = async (path: string, preview: boolean) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await expect(page.locator("main h1:visible, main h2:visible").first()).toBeVisible();
        const info = await page.evaluate(() => {
          const main =
            [...document.querySelectorAll<HTMLElement>("main")].find(
              (m) => m.offsetParent !== null,
            ) ?? document.body;
          const lines = (main.innerText ?? "")
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line && line !== "Previewing as student" && line !== "Exit preview");
          const controls = [...main.querySelectorAll("button, a")]
            .filter(
              (el) =>
                (el as HTMLElement).offsetParent !== null &&
                !(el as HTMLElement).closest("[data-preview-bar]"),
            )
            .map((el) => (el.textContent ?? "").trim())
            .filter(Boolean);
          const alts = [...main.querySelectorAll("img")].map((img) => img.getAttribute("alt"));
          const heads = [...main.querySelectorAll("h1, h2, h3")].map(
            (h) => `${h.tagName}:${(h.textContent ?? "").trim()}`,
          );
          return {
            lines,
            controls,
            alts,
            heads,
            bar: !!document.querySelector("[data-preview-bar]"),
          };
        });
        expect(info.bar).toBe(preview);
        return info;
      };

      // preview first (instructor), then the same screens as a student
      const previewBase = `/instructor/content/package/${id}/preview`;
      const studentBase = `/materials/package/${id}`;
      const pairs: [string, string][] = [
        [previewBase, studentBase],
        [`${previewBase}/steps`, `${studentBase}/steps`],
        [`${previewBase}/scenario`, `${studentBase}/scenario`],
        [`${previewBase}/quiz`, `${studentBase}/quiz`],
      ];
      const previews = [];
      for (const [p] of pairs) previews.push(await read(p, true));
      await asStudent(page);
      for (let n = 0; n < pairs.length; n += 1) {
        const student = await read(pairs[n][1], false);
        expect(student.lines, pairs[n][1]).toEqual(previews[n].lines);
        expect(student.heads).toEqual(previews[n].heads);
        expect(student.alts).toEqual(previews[n].alts);
        expect(student.controls).toEqual(previews[n].controls);
        expect(student.lines.length).toBeGreaterThan(5);
        expect(await noSidewaysScroll(page)).toBe(true);
      }
    });

    test("the student's Materials card opens the reading screen directly; Practise this topic runs the shared question screens and saves nothing", async ({
      page,
    }) => {
      await importFiles(page, CLEAN);
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
      await asStudent(page);
      await page.goto("/materials");
      await page.waitForLoadState("networkidle");
      await page.locator("[data-package-topic]").first().click();
      // straight into the reading screen, like a built-in topic: no hub screen with parts
      await expect(page).toHaveURL(/\/materials\/package\/[a-z0-9]+$/);
      await expect(page.locator("[data-reading-header]")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Evacuating a crowded hall", level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(/^From your instructor · \d+ min read$/)).toBeVisible();
      await expect(page.locator("[data-package-part], [data-part-group]")).toHaveCount(0);
      const practise = page.getByRole("button", { name: "Practise this topic" });
      const steps = page.getByRole("link", { name: "Step guide for this topic" });
      expect(await bg(practise)).toBe("rgb(63, 70, 56)");
      expect(await bg(steps)).toBe("rgb(224, 230, 214)");
      expect((await practise.boundingBox())!.height).toBe(52);
      expect(await noSidewaysScroll(page)).toBe(true);
      const before = await page.evaluate(() =>
        JSON.stringify(
          Object.fromEntries(
            Object.entries(localStorage).filter(([k]) => k !== "ast.demo-topics.v1"),
          ),
        ),
      );
      // the step guide
      await steps.click();
      await expect(page).toHaveURL(/\/steps$/);
      await expect(page.getByText("Step-by-step guide")).toBeVisible();
      await expect(page.locator("input[type=checkbox]")).toHaveCount(0);
      await page.getByRole("button", { name: "Back" }).click();
      // the practice
      await page.getByRole("button", { name: "Practise this topic" }).click();
      await expect(page).toHaveURL(/\/practise$/);
      await page.waitForLoadState("networkidle");
      let guard = 0;
      for (;;) {
        await expect(page.getByText("Choose one answer").locator("visible=true")).toBeVisible();
        await page.locator("fieldset[role=radiogroup]:visible label").first().click();
        await page.getByRole("button", { name: "Check" }).click();
        await expect(page.getByRole("region", { name: "Why" })).toBeVisible();
        const finish = page.getByRole("button", { name: "Finish" });
        if (await finish.count()) {
          await finish.click();
          break;
        }
        await page.getByRole("button", { name: "Next" }).click();
        guard += 1;
        expect(guard).toBeLessThan(20);
      }
      await expect(page.getByText(/of 14 correct/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Review answers" })).toHaveCount(0);
      // nothing but the demo topic itself is saved
      expect(
        await page.evaluate(() =>
          JSON.stringify(
            Object.fromEntries(
              Object.entries(localStorage).filter(([k]) => k !== "ast.demo-topics.v1"),
            ),
          ),
        ),
      ).toBe(before);
      await page.getByRole("link", { name: "Done" }).click();
      await expect(page).toHaveURL(/\/materials\/package\/[a-z0-9]+$/);
      // unpublish removes the card
      await asInstructor(page);
      await page.goto("/instructor/content");
      await page.locator("[data-package-card]").first().click();
      await page.getByRole("button", { name: "Unpublish" }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Unpublish", exact: true })
        .click();
      await asStudent(page);
      await page.goto("/materials");
      await expect(page.getByText("FROM YOUR INSTRUCTOR")).toHaveCount(0);
    });

    test("a wrong file type and an oversize picture are left out with an amber message", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page
        .locator("[data-file-input]")
        .setInputFiles([
          { name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") },
        ]);
      await expect(page.getByText("notes.pdf is not a CSV file")).toBeVisible();
      await page
        .locator("[data-file-input]")
        .setInputFiles([
          { name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(320 * 1024) },
        ]);
      await expect(page.getByText("big.png is larger than 300 KB.")).toBeVisible();
    });

    test("no external requests while importing and reading", async ({ page }) => {
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
      await importFiles(page, CLEAN);
      await page.goto(`/instructor/content/package/${topicId(page)}/preview`);
      await page.waitForLoadState("networkidle");
      expect(external).toEqual([]);
    });

    test("a student cannot open the instructor import", async ({ page }) => {
      await asStudent(page);
      await page.goto("/instructor/content/import");
      await expect(page).not.toHaveURL(/instructor\/content\/import/, { timeout: 15000 });
    });
  });
}
