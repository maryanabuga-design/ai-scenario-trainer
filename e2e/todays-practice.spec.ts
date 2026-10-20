import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Q = { id: string; section: string; correctOptionId: string; options: { id: string }[] };
const quiz: Q[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;
const profile = { direction: "building-evacuation", onboarded: true };

const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";

/** A fixed "now": noon on 23 Oct 2026 (local time of the browser). */
const NOON = new Date(2026, 9, 23, 12, 0).getTime();

const wrongOf = (q: Q) => q.options.find((o) => o.id !== q.correctOptionId)!.id;

function entry(ids: string[], rights: boolean[], finishedAt: number, mode = "today") {
  const items = ids.map((id) => quiz.find((q) => q.id === id)!);
  return {
    kind: "quiz",
    mode,
    topicIds: [...new Set(items.map((q) => q.section))],
    itemIds: ids,
    answers: items.map((q, i) => ({
      itemId: q.id,
      optionId: rights[i] ? q.correctOptionId : wrongOf(q),
    })),
    finishedAt,
  };
}

async function open(page: Page, history: object[] | null = null, at = NOON) {
  await page.clock.setFixedTime(at);
  await page.addInitScript(
    ([p, h]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (h) localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
    },
    [profile, history] as const,
  );
  await page.goto("/");
}

const card = (page: Page) => page.locator("[data-todays]:visible");
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** Answers the current question (the first option), checks it and moves on. */
async function answerAll(page: Page, count: number) {
  for (let i = 0; i < count; i++) {
    await page.locator("fieldset label").first().click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await page
      .getByRole("button", { name: i < count - 1 ? "Next" : "Finish", exact: true })
      .click();
  }
}

for (const width of [360, 430]) {
  test.describe(`Today's practice at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("the start state: title, 5 questions, a Primary Start practice and a Choose length link", async ({
      page,
    }) => {
      await open(page);
      await expect(card(page)).toHaveAttribute("data-todays", "start");
      await expect(card(page).getByRole("heading", { name: "Today's practice" })).toBeVisible();
      await expect(card(page).getByText("5 questions", { exact: true })).toBeVisible();
      const start = card(page).getByRole("button", { name: "Start practice" });
      expect(await bg(start)).toBe(PRIMARY);
      const s = (await start.boundingBox())!;
      expect(s.height).toBe(52);
      expect(s.width).toBe(width - 32 - 32);
      const link = card(page).getByRole("link", { name: "Choose length" });
      const l = (await link.boundingBox())!;
      expect(l.height).toBeGreaterThanOrEqual(44);
      expect(l.y).toBeGreaterThan(s.y + s.height - 1);
      expect(
        await link.evaluate(
          (el) => getComputedStyle(el.querySelector("span") ?? el).textDecorationLine,
        ),
      ).toContain("underline");
      // the clipboard picture in its 64 by 60 frame, centred on the text block
      const frame = (await card(page).locator("[data-picture-frame]").boundingBox())!;
      const text = (await card(page).locator("[data-todays-text]").boundingBox())!;
      expect([frame.width, frame.height]).toEqual([64, 60]);
      expect(Math.abs(frame.y + frame.height / 2 - (text.y + text.height / 2))).toBeLessThanOrEqual(
        2,
      );
      await expect(card(page).locator("img")).toHaveAttribute("src", "/heroes/icon-miniquiz.webp");
      const loaded = await card(page)
        .locator("img")
        .evaluate((el) => (el as HTMLImageElement).naturalWidth);
      expect(loaded).toBeGreaterThan(0);
      // no percent sign, no streak or pressure text
      await expect(card(page)).not.toContainText(/%|streak|don't miss|only \d+ left/i);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Start practice starts at once: 5 questions, the wrong ones first", async ({ page }) => {
      const wrongIds = ["S1", "S2", "S3"].map((s) => quiz.find((q) => q.section === s)!.id);
      await open(page, [entry(wrongIds, [false, false, false], NOON - 86_400_000, "practice")]);
      await card(page).getByRole("button", { name: "Start practice" }).click();
      await expect(page).toHaveURL(/\/session$/);
      await expect(page.getByText("Question 1 of 5", { exact: true })).toBeVisible();
      const saved = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.session.v1")!).value,
      );
      expect(saved.mode).toBe("today");
      expect(saved.kind).toBe("quiz");
      expect(saved.itemIds).toHaveLength(5);
      expect(new Set(saved.itemIds).size).toBe(5);
      for (const id of wrongIds) expect(saved.itemIds).toContain(id);
    });

    test("after 5 answers the card says Done for today with the count and a Secondary Practise more", async ({
      page,
    }) => {
      await open(page);
      await card(page).getByRole("button", { name: "Start practice" }).click();
      await answerAll(page, 5);
      await expect(page).toHaveURL(/\/session\/results$/);
      await page.goto("/");
      await expect(card(page)).toHaveAttribute("data-todays", "done");
      await expect(card(page).getByRole("heading", { name: "Done for today" })).toBeVisible();
      await expect(card(page).getByText(/^\d of 5 correct$/)).toBeVisible();
      await expect(card(page)).not.toContainText("%");
      await expect(card(page).getByRole("button", { name: "Start practice" })).toHaveCount(0);
      await expect(card(page).getByRole("link", { name: "Choose length" })).toHaveCount(0);
      const more = card(page).getByRole("link", { name: "Practise more" });
      expect(await bg(more)).toBe(OLIVE_TINT);
      expect((await more.boundingBox())!.height).toBe(52);
      await more.click();
      await expect(page).toHaveURL(/\/mini-quiz\?from=home$/);
    });

    test("the done state goes back to the start state the next calendar day (mocked date)", async ({
      page,
    }) => {
      const ids = quiz.slice(0, 5).map((q) => q.id);
      const done = entry(ids, [true, true, false, true, true], NOON - 60_000);
      await open(page, [done]);
      await expect(card(page)).toHaveAttribute("data-todays", "done");
      await expect(card(page).getByText("4 of 5 correct")).toBeVisible();
      // a minute after midnight is the next day; the same moment of the previous day is not
      await page.clock.setFixedTime(new Date(2026, 9, 24, 0, 1).getTime());
      await page.reload();
      await expect(card(page)).toHaveAttribute("data-todays", "start");
      await page.clock.setFixedTime(new Date(2026, 9, 23, 23, 59).getTime());
      await page.reload();
      await expect(card(page)).toHaveAttribute("data-todays", "done");
    });

    test("a mini-quiz from the picker does not make today's practice done", async ({ page }) => {
      const ids = quiz.slice(0, 5).map((q) => q.id);
      await open(page, [entry(ids, [true, true, true, true, true], NOON - 60_000, "mini-quiz")]);
      await expect(card(page)).toHaveAttribute("data-todays", "start");
    });

    test("Choose length opens the picker with 5 selected, and it still works", async ({ page }) => {
      await open(page);
      await card(page).getByRole("link", { name: "Choose length" }).click();
      await expect(page).toHaveURL(/\/mini-quiz\?from=home$/);
      await expect(page.getByLabel("5", { exact: true })).toBeChecked();
      await page.getByLabel("10", { exact: true }).check({ force: true });
      await expect(page.getByLabel("10", { exact: true })).toBeChecked();
      await page.getByRole("button", { name: "Start mini-quiz" }).click();
      await expect(page).toHaveURL(/\/session$/);
      await expect(page.getByText("Question 1 of 10", { exact: true })).toBeVisible();
      const saved = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.session.v1")!).value,
      );
      expect(saved.mode).toBe("mini-quiz");
    });

    test("the Training Quiz tab still opens the picker, with 5 selected", async ({ page }) => {
      await open(page);
      await page.goto("/training");
      await page.getByRole("radio", { name: "Quiz" }).check({ force: true });
      await page.getByRole("link", { name: /Mini-quiz/ }).click();
      await expect(page).toHaveURL(/\/mini-quiz\?from=training$/);
      await expect(page.getByLabel("5", { exact: true })).toBeChecked();
    });

    test("no external network request", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await open(page);
      await card(page).getByRole("button", { name: "Start practice" }).click();
      await expect(page).toHaveURL(/\/session$/);
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });
}
