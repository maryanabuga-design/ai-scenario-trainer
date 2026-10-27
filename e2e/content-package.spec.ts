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
test.use({ storageState: instructor });
test.setTimeout(90_000);

const DIR = "public/templates/sample-package/";
const f = (name: string) => `${DIR}${name}`;
const PICTURES = [f("exit-sign.png"), f("assembly-point.png")];
const FIXTURES = "e2e/fixtures/";
const CLEAN = [`${FIXTURES}clean.xlsx`, ...PICTURES];
const PROBLEMS = [`${FIXTURES}problems.xlsx`, ...PICTURES];
const ATTENTION_BG = "rgb(241, 228, 200)";
const ATTENTION_INK = "rgb(111, 81, 32)";
const WRONG_TEXT = "rgb(155, 44, 31)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);

/** Imports one document (and its pictures) through the Import and Analysing screens, then opens the new topic. */
async function importFiles(page: Page, files: string[]) {
  await page.goto("/instructor/content/import");
  await page.locator("[data-file-input]").setInputFiles(files[0]);
  if (files.length > 1) await page.locator("[data-image-input]").setInputFiles(files.slice(1));
  await page.getByRole("button", { name: "Import and review" }).click();
  await expect(page).toHaveURL(/\/import\/analysing/);
  // a document without every part stops at the partial state first
  const ready = page.getByRole("heading", { name: "Draft is ready" });
  const partial = page.getByRole("button", { name: "Continue" });
  await expect(ready.or(partial)).toBeVisible({ timeout: 15000 });
  if (await partial.isVisible()) await partial.click();
  await expect(ready).toBeVisible();
  const id = await page.evaluate(
    () => JSON.parse(localStorage.getItem("ast.demo-topics.v1")!).value[0].id as string,
  );
  await page.goto(`/instructor/content/package/${id}`);
  await expect(page.locator("[data-package-status]")).toBeVisible();
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

    test("review with issues: ONE white notice, small item pills and pencils, Primary 'Review 6 items' over Secondary Preview, Delete in the ⋯ menu", async ({
      page,
    }) => {
      await importFiles(page, PROBLEMS);
      await expect(page.locator("[data-package-status]")).toContainText(
        "Draft · Last edited today",
      );
      await expect(page.locator("main")).not.toContainText(/\bN\d\b/);
      // exactly one notice: white card, amber icon tile, text colour title, muted body, nothing clickable inside
      await expect(page.locator("[data-notice]:visible")).toHaveCount(1);
      const notice = page.locator("#package-status");
      await expect(notice).toContainText("6 items to review");
      await expect(notice).toContainText("Steps 2 · Quiz 4");
      expect(await bg(notice)).toBe("rgb(255, 255, 255)");
      expect(await bg(notice.locator("[data-notice-tile]"))).toBe(ATTENTION_BG);
      expect(
        await notice.locator("[data-notice-tile]").evaluate((el) => getComputedStyle(el).color),
      ).toBe(ATTENTION_INK);
      expect(await notice.locator("h2").evaluate((el) => getComputedStyle(el).color)).toBe(
        "rgb(26, 26, 26)",
      );
      await expect(notice.locator("a, button")).toHaveCount(0);
      // no dots, no per-tab banner; accessible names kept
      await expect(page.locator("[data-tab-dot], #tab-notice")).toHaveCount(0);
      await expect(page.getByRole("radio", { name: "Steps, 2 to review" })).toHaveCount(1);
      await expect(page.getByRole("radio", { name: "Quiz, 4 to review" })).toHaveCount(1);
      expect((await page.getByRole("radiogroup").boundingBox())!.height).toBeLessThan(60);
      // item cards: one small pill (the attention style), a pencil on every card, no To fix lists
      await page.getByRole("radio", { name: /^Steps/ }).click({ force: true });
      const pills = page.locator("[data-issue-pill]:visible");
      await expect(pills).toHaveCount(2);
      await expect(pills.first()).toHaveText("Guide section 7 does not exist");
      await expect(pills.nth(1)).toHaveText("No action");
      expect(await bg(pills.first())).toBe(ATTENTION_BG);
      await expect(page.getByText("To fix", { exact: true })).toHaveCount(0);
      await expect(page.locator("[data-pencil]:visible")).toHaveCount(7);
      for (const pencil of await page.locator("[data-pencil]:visible").all()) {
        const box = (await pencil.boundingBox())!;
        expect([box.width, box.height]).toEqual([44, 44]);
      }
      await page.getByRole("radio", { name: /^Quiz/ }).click({ force: true });
      await expect(page.locator("[data-issue-pill]:visible")).toHaveCount(4);
      await expect(page.locator("[data-pencil]:visible")).toHaveCount(10);
      await expect(page.getByRole("link", { name: "Edit question", exact: true })).toHaveCount(0);
      // pinned area: ONE Primary "Review 6 items" over the Secondary Preview; no Publish, no Delete
      await expect(page.getByRole("button", { name: "Review 6 items" })).toBeVisible();
      expect(await bg(page.getByRole("button", { name: "Review 6 items" }))).toBe(
        "rgb(63, 70, 56)",
      );
      expect(await bg(page.getByRole("button", { name: "Preview as student" }))).toBe(
        "rgb(224, 230, 214)",
      );
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Delete topic" })).toHaveCount(0);
      const ys = [
        (await page.getByRole("button", { name: "Review 6 items" }).boundingBox())!.y,
        (await page.getByRole("button", { name: "Preview as student" }).boundingBox())!.y,
      ];
      expect(ys[0]).toBeLessThan(ys[1]);
      // the meta row has no Replace link: it moved into the menu
      await expect(page.locator("[data-package-status]").getByRole("link")).toHaveCount(0);
      // the ⋯ button: 44px, opens the menu with three items; Delete is in the destructive colour; Escape returns the focus
      const more = page.getByRole("button", { name: "More actions" });
      expect((await more.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await more.click();
      await expect(page.getByRole("menuitem")).toHaveText([
        "Edit title and summary",
        "Replace document…",
        "Delete topic",
      ]);
      const item = page.getByRole("menuitem", { name: "Delete topic" });
      await expect(item).toBeVisible();
      expect(await item.evaluate((el) => getComputedStyle(el).color)).toBe(WRONG_TEXT);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
      await expect(more).toBeFocused();
      await more.click();
      await page.getByRole("menuitem", { name: "Delete topic" }).click();
      await expect(page.getByRole("dialog")).toContainText("Delete this topic?");
      await page.getByRole("dialog").getByRole("button", { name: "Keep it" }).click();
      expect(await noSidewaysScroll(page)).toBe(true);
      // Preview as student works while items are flagged
      await page.getByRole("button", { name: "Preview as student" }).click();
      await expect(page).toHaveURL(/\/preview$/);
      await expect(page.getByText("Previewing as student")).toBeVisible();
    });

    test("the guided review: 1 of N in order, Save and next, Skip keeps the item, Choose image (Save and next disabled until then), then the review summary with Publish", async ({
      page,
    }) => {
      await importFiles(page, PROBLEMS);
      await page.getByRole("button", { name: "Review 6 items" }).click();
      const header = page.locator("[data-page-header-band]:visible");
      const primary = (name: string) => page.getByRole("button", { name, exact: true });
      // 1 of 6: a step with a guide link to a section that does not exist
      await expect(page).toHaveURL(/\/edit\/steps-0-2\?r=.*&i=0$/);
      await expect(header).toContainText("1 of 6");
      await expect(header).toContainText("Step 3 of When the alarm sounds");
      await expect(primary("Save and next")).toBeVisible();
      // the guide link points at a section that does not exist: not passable yet, with its sentence
      await expect(primary("Save and next")).toBeDisabled();
      await expect(page.locator("[data-needs]:visible")).toHaveText(
        "Fix the point above to continue.",
      );
      expect(await bg(primary("Skip"))).toBe("rgb(224, 230, 214)");
      // leaving with unsaved changes asks first
      await page.getByRole("textbox", { name: "Action" }).fill("Walk steadily");
      await page.getByRole("button", { name: "Leave the review" }).click();
      await expect(page.getByRole("dialog")).toContainText("Discard your changes?");
      await page.getByRole("dialog").getByRole("button", { name: "Keep editing" }).click();
      await page
        .locator("fieldset[role=radiogroup] label", { hasText: "3. Help others safely" })
        .click();
      await expect(primary("Save and next")).toBeEnabled();
      expect(await bg(primary("Save and next"))).toBe("rgb(63, 70, 56)");
      await expect(page.locator("[data-needs]")).toHaveCount(0);
      await primary("Save and next").click();
      // 2 of 6: a step without an action
      await expect(header).toContainText("2 of 6");
      await page.getByRole("textbox", { name: "Action" }).fill("Tell staff about anyone missing");
      await primary("Save and next").click();
      // 3 of 6: a question without a correct answer
      await expect(header).toContainText("3 of 6");
      await expect(header).toContainText("Question 4");
      await page.getByRole("radio", { name: "Correct answer B" }).check({ force: true });
      await primary("Save and next").click();
      // 4 of 6: a question without text: skip it, it stays flagged
      await expect(header).toContainText("4 of 6");
      await expect(header).toContainText("Question 5");
      await primary("Skip").click();
      // 5 of 6: a question without an explanation
      await expect(header).toContainText("5 of 6");
      await page
        .getByRole("textbox", { name: "EXPLANATION" })
        .fill("A steady pace prevents falls.");
      await primary("Save and next").click();
      // 6 of 6: a question that names a picture that is not in the package: add it and describe it
      await expect(header).toContainText("6 of 6");
      await expect(page.locator("[data-image-missing]:visible")).toContainText(
        "door-check.png is not in the package yet.",
      );
      // it cannot be passed with Save and next: the button is disabled and one sentence says what is needed
      await expect(primary("Save and next")).toBeDisabled();
      await expect(page.locator("[data-needs]:visible")).toHaveText(
        "Choose the image file or remove the image to continue.",
      );
      await expect(page.getByRole("button", { name: "Choose image" })).toBeVisible();
      await page.locator("[data-image-input]:visible").setInputFiles({
        name: "door-check.png",
        mimeType: "image/png",
        buffer: readFileSync("public/templates/sample-package/exit-sign.png"),
      });
      await page.locator("input[name=alt]:visible").fill("A hand feeling a closed door");
      await expect(primary("Save and next")).toBeEnabled();
      await primary("Save and next").click();
      // the review ends on its summary, never silently on the topic: the skipped question is left
      await expect(page).toHaveURL(/\/package\/[a-z0-9]+\/review$/);
      await expect(page.locator("#review-summary")).toContainText(
        "1 item still needs your attention",
      );
      await expect(page.locator("[data-remaining] li")).toHaveCount(1);
      await expect(page.locator("[data-remaining]")).toContainText("Question 5");
      await expect(primary("Review remaining 1")).toBeVisible();
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
      await page.locator("button:visible", { hasText: "Back to topic" }).last().click();
      await expect(page.locator("#package-status")).toContainText("1 item to review");
      await expect(page.getByRole("button", { name: "Review 1 item" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
      // the next Review tap visits the skipped item again
      await page.getByRole("button", { name: "Review 1 item" }).click();
      await expect(header).toContainText("Item 1 of 1");
      await expect(header).toContainText("Question 5");
      await page
        .getByRole("textbox", { name: "QUESTION" })
        .fill("Who should you tell about a missing person?");
      await primary("Save and next").click();
      // all checked: the summary shows the success notice, Primary Publish over Secondary Preview
      await expect(page).toHaveURL(/\/package\/[a-z0-9]+\/review$/);
      await expect(page.locator("#review-summary")).toContainText("All items checked");
      expect(await bg(page.getByRole("button", { name: "Publish", exact: true }))).toBe(
        "rgb(63, 70, 56)",
      );
      await expect(page.getByRole("button", { name: "Preview as student" })).toBeVisible();
      await page.goto(page.url().replace(/\/review$/, ""));
      await expect(page.locator("#package-status")).toContainText("All items checked");
      await expect(page.locator("[data-issue-pill]:visible")).toHaveCount(0);
      expect(await bg(page.getByRole("button", { name: "Publish", exact: true }))).toBe(
        "rgb(63, 70, 56)",
      );
      await expect(page.getByRole("button", { name: "Preview as student" })).toBeVisible();
      await expect(page.getByRole("button", { name: /^Review/ })).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the pencil sits inside its card in the corner on the Guide, Steps, Scenario and Quiz tabs, never over the text", async ({
      page,
    }) => {
      await importFiles(page, CLEAN);
      const base = page.url().split("?")[0];
      for (const tab of ["Guide", "Steps", "Scenario", "Quiz"]) {
        await page.goto(`${base}?tab=${tab === "Quiz" ? "quiz" : tab.toLowerCase()}`);
        await expect(page.locator("[data-pencil]:visible").first()).toBeVisible();
        await page.waitForTimeout(300);
        const count = await page.locator("[data-pencil]:visible").count();
        expect(count, tab).toBeGreaterThan(0);
        for (let i = 0; i < count; i++) {
          const pencil = page.locator("[data-pencil]:visible").nth(i);
          await pencil.scrollIntoViewIfNeeded();
          const m = await pencil.evaluate((el) => {
            const rect = (node: Element) => node.getBoundingClientRect();
            const area = rect(el);
            const tile = rect(el.querySelector("span")!);
            const host = el.closest("[data-situation-card], li")!;
            const card = rect(host);
            const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
            let overlap = false;
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
              if (!node.textContent?.trim() || el.contains(node)) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const r of Array.from(range.getClientRects())) {
                if (
                  r.width > 0 &&
                  r.left < tile.right &&
                  r.right > tile.left &&
                  r.top < tile.bottom &&
                  r.bottom > tile.top
                )
                  overlap = true;
              }
            }
            return {
              area: [area.width, area.height],
              tile: [tile.width, tile.height],
              right: card.right - tile.right,
              top: tile.top - card.top,
              inside: tile.left >= card.left && tile.right <= card.right && tile.top >= card.top,
              centreY: tile.top + tile.height / 2,
              cardTop: card.top,
              overlap,
              host: host.tagName,
            };
          });
          expect(m.area, tab).toEqual([44, 44]);
          expect(m.tile, tab).toEqual([32, 32]);
          expect(m.inside, `${tab} ${i} inside`).toBe(true);
          expect(m.overlap, `${tab} ${i} text under the pencil`).toBe(false);
          if (tab !== "Steps") {
            // 12px from the inner edge of the card; the 1px border makes it 12 or 13 from the outer edge
            expect([12, 13]).toContain(Math.round(m.right));
            expect([12, 13]).toContain(Math.round(m.top));
          }
        }
        expect(await noSidewaysScroll(page), tab).toBe(true);
        if (tab === "Scenario") {
          // the STEP label stays above its situation card
          const label = (await page.getByText("STEP 1").first().boundingBox())!;
          const sit = (await page.locator("[data-situation-card]").first().boundingBox())!;
          expect(label.y + label.height).toBeLessThanOrEqual(sit.y);
        }
        if (tab === "Steps") {
          // a step card: the pencil is left of the chevron on the same centre line
          const first = page.locator("[data-pencil]:visible").first();
          const chevron = first
            .locator("xpath=ancestor::li[1]")
            .locator("svg.lucide-chevron-down")
            .first();
          const p = (await first.locator("span").boundingBox())!;
          const c = (await chevron.boundingBox())!;
          expect(p.x + p.width).toBeLessThanOrEqual(c.x);
          expect(Math.abs(p.y + p.height / 2 - (c.y + c.height / 2))).toBeLessThanOrEqual(1);
        }
      }
    });

    test("Please confirm: a neutral pill, Review 1 item, Mark as OK clears it and the topic can be published", async ({
      page,
    }) => {
      await importFiles(page, CLEAN);
      // a machine-made guide link: mark the second question as matched automatically
      await page.evaluate(() => {
        const raw = JSON.parse(localStorage.getItem("ast.demo-topics.v1")!);
        raw.value[0].questions[1].refAuto = true;
        localStorage.setItem("ast.demo-topics.v1", JSON.stringify(raw));
      });
      await page.reload();
      await page.getByRole("radio", { name: /^Quiz/ }).click({ force: true });
      const pill = page.locator("[data-issue-pill]:visible");
      await expect(pill).toHaveCount(1);
      await expect(pill).toHaveText("Please confirm");
      expect(await bg(pill)).toBe("rgb(226, 222, 214)");
      await expect(page.locator("#package-status")).toContainText("1 item to review");
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toHaveCount(0);
      await page.getByRole("button", { name: "Review 1 item" }).click();
      await expect(page.locator("[data-page-header-band]:visible")).toContainText("1 of 1");
      await expect(page.getByText(/was matched automatically/)).toBeVisible();
      await expect(page.getByRole("button", { name: "Save and next" })).toHaveCount(0);
      await page.getByRole("button", { name: "Mark as OK" }).click();
      await expect(page.locator("#review-summary")).toContainText("All items checked");
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeVisible();
      await page.goto(page.url().replace(/\/review$/, ""));
      await expect(page.locator("#package-status")).toContainText("All items checked");
      await expect(page.locator("[data-issue-pill]:visible")).toHaveCount(0);
    });

    test("Skip on a Please confirm item keeps it flagged", async ({ page }) => {
      await importFiles(page, CLEAN);
      await page.evaluate(() => {
        const raw = JSON.parse(localStorage.getItem("ast.demo-topics.v1")!);
        raw.value[0].questions[0].refAuto = true;
        localStorage.setItem("ast.demo-topics.v1", JSON.stringify(raw));
      });
      await page.reload();
      await page.getByRole("button", { name: "Review 1 item" }).click();
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await expect(page).toHaveURL(/\/package\/[a-z0-9]+\/review$/);
      await expect(page.locator("#review-summary")).toContainText(
        "1 item still needs your attention",
      );
      await page.locator("button:visible", { hasText: "Back to topic" }).last().click();
      await expect(page.getByRole("button", { name: "Review 1 item" })).toBeVisible();
    });

    test("Replace document (topic menu) reopens the import and analysing screens, keeps the topic and its title; the corrected document clears every item", async ({
      page,
    }) => {
      await importFiles(page, PROBLEMS);
      const id = topicId(page);
      await page.getByRole("button", { name: "More actions" }).click();
      await page.getByRole("menuitem", { name: "Replace document…" }).click();
      await expect(page).toHaveURL(/import\?replace=[a-z0-9]+$/);
      await expect(page.locator('[data-notice="info"]')).toContainText(
        "The new document replaces the content of Evacuating a crowded hall",
      );
      await page.locator("[data-file-input]").setInputFiles(CLEAN[0]);
      await page.locator("[data-image-input]").setInputFiles(PICTURES);
      await page.getByRole("button", { name: "Import and review" }).click();
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 15000,
      });
      await page.getByRole("button", { name: "Preview as student" }).click();
      await expect(page).toHaveURL(new RegExp(`/package/${id}/preview$`));
      await page.goto(`/instructor/content/package/${id}`);
      const success = page.locator("#package-status");
      await expect(success).toContainText("All items checked");
      await expect(success).toContainText("Preview as student, then publish.");
      expect(await bg(success)).toBe("rgb(255, 255, 255)");
      expect(await bg(success.locator("[data-notice-tile]"))).toBe("rgb(225, 234, 218)");
      await expect(page.locator("[data-tab-dot]")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeEnabled();
      await expect(page.getByRole("button", { name: "Preview as student" })).toBeEnabled();
      // the success notice closes with a small corner circle with a 44px tap area
      const close = success.getByRole("button", { name: /Close/ });
      const closeBox = (await close.boundingBox())!;
      expect([closeBox.width, closeBox.height]).toEqual([44, 44]);
      expect((await close.locator("[data-notice-close]").boundingBox())!.width).toBe(28);
      await close.click();
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
