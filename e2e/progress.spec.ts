import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Item = {
  id: string;
  section: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
};
const quiz: Item[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;
const steps: Item[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;
const of = (section: string) => [...steps, ...quiz].filter((item) => item.section === section);

const profile = { direction: "building-evacuation", onboarded: true };

const answerOf = (item: Item, right: boolean) => ({
  itemId: item.id,
  optionId: right
    ? item.correctOptionId
    : item.options.find((option) => option.id !== item.correctOptionId)!.id,
});

const sessionOf = (
  items: Item[],
  rights: number,
  minutesAgo: number,
  extra: Record<string, unknown> = {},
) => ({
  kind: "quiz",
  mode: "practice",
  topicIds: [...new Set(items.map((item) => item.section))],
  itemIds: items.map((item) => item.id),
  answers: items.map((item, index) => answerOf(item, index < rights)),
  finishedAt: Date.now() - minutesAgo * 60_000,
  ...extra,
});

/**
 * Seeded progress: S1 all right (Ready), S2 half right (Needs work), S3 and S4 untouched (Not
 * started), S5 all right (Ready, in Other topics), a mini-quiz and an exam.
 */
const seeded = () => [
  sessionOf(of("S1"), of("S1").length, 60 * 24 * 5),
  sessionOf(of("S2"), Math.floor(of("S2").length / 2), 60 * 24 * 2),
  sessionOf(of("S5"), of("S5").length, 60 * 30, { mode: "mini-quiz" }),
  sessionOf(of("S5").slice(0, 2), 1, 20, {
    kind: "exam",
    mode: "exam",
    exam: { percent: 50, questions: 20, timeUsedSeconds: 300 },
  }),
];

async function open(page: Page, history: object[] | null) {
  await page.addInitScript(
    ([p, h]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (h) localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
    },
    [profile, history],
  );
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Progress", level: 1 })).toBeVisible();
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const rgb = (value: string) => {
  const match = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(value)!;
  return { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] };
};

for (const width of [360, 430]) {
  test.describe(`Progress at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("has the readiness card, By topic, Activity and Recent sessions in that order", async ({
      page,
    }) => {
      await open(page, seeded());
      const main = page.locator("main");
      const y = async (text: string | RegExp) =>
        (await main
          .getByText(text, { exact: typeof text === "string" })
          .first()
          .boundingBox())!.y;
      const order = [
        await y("Exam readiness"),
        await y("By topic"),
        await y(/^\d+ sessions? · \d+ answers?$/),
        await y("Recent sessions"),
      ];
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      await expect(
        main.getByText(/^Evacuation basics exam · Due \d+ \w+ · \d+ days left$/),
      ).toBeVisible();
      await expect(main.getByText("4 sessions · ", { exact: false })).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
      // the old cards are gone
      for (const gone of [
        "Result by session",
        "Guide sections",
        "Session history",
        "Weak topics",
      ]) {
        await expect(main.getByText(gone, { exact: true })).toHaveCount(0);
      }
    });

    test("shows one measured percentage (Readiness); topic and session rows have none", async ({
      page,
    }) => {
      await open(page, seeded());
      const main = page.locator("main");
      await expect(main.locator("[data-readiness-number]")).toHaveText(/^Readiness \d+%$/);
      const text = await main.innerText();
      // the number, the 80% marker and the 80% in the sentence are the readiness vocabulary
      const rest = text.replace(/Readiness \d+%/g, "").replace(/80%/g, "");
      expect(rest).not.toContain("%");
      for (const row of await main.locator("[data-topic-row]").all()) {
        expect(await row.innerText()).not.toContain("%");
      }
      const recent = main.locator("section[aria-labelledby=recent-sessions]");
      expect(await recent.innerText()).not.toContain("%");
    });

    test("the readiness card has the sentence and a full-width Primary button below it", async ({
      page,
    }) => {
      await open(page, seeded());
      const card = page.getByRole("region", { name: "Exam readiness" });
      const sentence = card.getByText(/^Not ready yet\. \d+ more correct answers? to reach 80%\.$/);
      await expect(sentence).toBeVisible();
      const button = card.getByRole("button", { name: "Repeat weak topics" });
      const [c, s, b] = [
        await card.boundingBox(),
        await sentence.boundingBox(),
        await button.boundingBox(),
      ];
      expect(b!.y).toBeGreaterThan(s!.y + s!.height);
      // the button fills the card's inner width: 16px padding on each side
      expect(Math.abs(b!.x - (c!.x + 16))).toBeLessThanOrEqual(1);
      expect(Math.abs(b!.width - (c!.width - 32))).toBeLessThanOrEqual(1);
      expect(b!.y + b!.height).toBeLessThanOrEqual(c!.y + c!.height - 15);
      // the page gutter is 16px
      expect(Math.abs(c!.x - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(width - (c!.x + c!.width) - 16)).toBeLessThanOrEqual(0.5);
      // the primary button is the olive fill
      const fill = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(fill).toBe("rgb(63, 70, 56)");
      // no red in the card
      for (const el of await card.locator("*").all()) {
        const { r, g, b: blue } = rgb(await el.evaluate((e) => getComputedStyle(e).color));
        expect(r > 170 && g < 90 && blue < 90).toBe(false);
      }
    });

    test("topic rows: one tap target of at least 56px, weakest first, with counts over all questions", async ({
      page,
    }) => {
      await open(page, seeded());
      const rows = page.locator("[data-topic-row]:visible");
      await expect(rows).toHaveCount(4);
      const ids = await rows.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-topic-row")),
      );
      // Not started (S3, S4), Needs work (S2), Ready (S1)
      expect(ids).toEqual(["S3", "S4", "S2", "S1"]);
      for (const row of await rows.all()) {
        const box = (await row.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(56);
        expect(await row.evaluate((el) => el.tagName)).toBe("BUTTON");
      }
      const s2 = of("S2");
      await expect(page.locator('[data-topic-row="S2"]')).toContainText(
        `${Math.floor(s2.length / 2)} of ${s2.length} correct`,
      );
      await expect(page.locator('[data-topic-row="S2"]')).toContainText("Needs work");
      await expect(page.locator('[data-topic-row="S3"]')).toContainText("Not started");
      await expect(page.locator('[data-topic-row="S1"]')).toContainText("Ready");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("status chips read their colours from the registered tokens: not transparent, not black, never red", async ({
      page,
    }) => {
      await open(page, seeded());
      const expected = {
        S3: ["rgb(226, 222, 214)", "rgb(92, 90, 86)"],
        S2: ["rgb(241, 228, 200)", "rgb(111, 81, 32)"],
        S1: ["rgb(225, 234, 218)", "rgb(68, 104, 58)"],
      } as const;
      for (const [id, [bg, ink]] of Object.entries(expected)) {
        const chip = page
          .locator(`[data-topic-row="${id}"]`)
          .locator("span.rounded-full", { hasText: /Not started|Needs work|Ready/ });
        const look = await chip.evaluate((el) => [
          getComputedStyle(el).backgroundColor,
          getComputedStyle(el).color,
        ]);
        expect(look[0]).toBe(bg);
        expect(look[1]).toBe(ink);
        expect(rgb(look[0]).a).toBeGreaterThan(0);
        expect(look[1]).not.toBe("rgb(0, 0, 0)");
        const { r, g, b } = rgb(look[0]);
        expect(r > 170 && g < 90 && b < 90).toBe(false);
      }
    });

    test("Other topics is collapsed by default and expands to the other six", async ({ page }) => {
      await open(page, seeded());
      const toggle = page.getByRole("button", { name: "Other topics (6)" });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator('[data-topic-row="S5"]')).toHaveCount(0);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("[data-topic-row]:visible")).toHaveCount(10);
      await expect(page.locator('[data-topic-row="S5"]')).toContainText("Ready");
      expect(await noSidewaysScroll(page)).toBe(true);
      await toggle.click();
      await expect(page.locator('[data-topic-row="S5"]')).toHaveCount(0);
    });

    test("tapping a topic row starts a practice session of that topic", async ({ page }) => {
      await open(page, seeded());
      await page.locator('[data-topic-row="S3"]').click();
      await expect(page).toHaveURL(/\/session$/);
      await expect(page.getByText(/Question 1 of|Step 1 of/)).toBeVisible();
    });

    test("recent sessions: the last 3 with mode, topic, count and date; See all opens the list", async ({
      page,
    }) => {
      await open(page, seeded());
      const recent = page.locator("section[aria-labelledby=recent-sessions]");
      const rows = recent.locator("ol > li");
      await expect(rows).toHaveCount(3);
      // newest first: the exam (20 minutes ago), the mini-quiz, then S2 practice
      await expect(rows.nth(0)).toContainText("Exam");
      await expect(rows.nth(0)).toContainText(/Today, \d{2}:\d{2}/);
      await expect(rows.nth(1)).toContainText("Mini-quiz");
      await expect(rows.nth(2)).toContainText("Practice");
      await expect(rows.nth(2)).toContainText(/\d+ of \d+ correct/);
      await expect(rows.nth(2)).toContainText(/\d{1,2} \w{3}|Yesterday/);
      // no results screen for these (none was finished in this browser): no link, no chevron
      await expect(recent.locator("ol a")).toHaveCount(0);
      await recent.getByRole("link", { name: "See all" }).click();
      await expect(page).toHaveURL(/\/progress\/sessions$/);
      await expect(page.getByRole("heading", { name: "Sessions", level: 1 })).toBeVisible();
      await expect(page.locator("main ol > li:visible")).toHaveCount(4);
      await expect(page.getByRole("button", { name: "See more" })).toHaveCount(0);
      await page.getByRole("link", { name: "Back to Progress" }).click();
      await expect(page).toHaveURL(/\/progress$/);
    });

    test("the list of sessions shows 10 at a time with See more", async ({ page }) => {
      const many = Array.from({ length: 23 }, (_, i) => sessionOf(of("S1").slice(0, 3), 2, i + 1));
      await open(page, many);
      await page.goto("/progress/sessions");
      await expect(page.locator("main ol > li")).toHaveCount(10);
      await page.getByRole("button", { name: "See more" }).click();
      await expect(page.locator("main ol > li")).toHaveCount(20);
      await page.getByRole("button", { name: "See more" }).click();
      await expect(page.locator("main ol > li")).toHaveCount(23);
      await expect(page.getByRole("button", { name: "See more" })).toHaveCount(0);
    });

    test("when ready, a Secondary Start exam replaces Repeat weak topics", async ({ page }) => {
      const all = ["S1", "S2", "S3", "S4"].flatMap(of);
      await open(page, [sessionOf(all, all.length, 10)]);
      const card = page.getByRole("region", { name: "Exam readiness" });
      await expect(card.getByText("You are ready for the exam.")).toBeVisible();
      await expect(card.getByRole("link", { name: "Start exam" })).toBeVisible();
      await expect(card.getByRole("button", { name: "Repeat weak topics" })).toHaveCount(0);
      await card.getByRole("link", { name: "Start exam" }).click();
      await expect(page).toHaveURL(/\/exam\?id=demo-evacuation-basics$/);
    });

    test("the last element is not hidden behind the bottom navigation", async ({ page }) => {
      await open(page, seeded());
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const nav = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
      const last = (await page
        .locator("section[aria-labelledby=recent-sessions] ol > li")
        .last()
        .boundingBox())!;
      expect(last.y + last.height).toBeLessThanOrEqual(nav.y);
    });

    test("an empty history shows the empty state with a Secondary button to Training", async ({
      page,
    }) => {
      await open(page, null);
      const main = page.locator("main");
      await expect(main.getByText("No sessions yet. Start with Choose a topic.")).toBeVisible();
      await expect(main.locator("[data-activity]")).toHaveCount(0);
      await expect(main.getByText("Recent sessions")).toHaveCount(0);
      await expect(main.locator("[data-readiness-number]")).toHaveText("Readiness 0%");
      const choose = main.getByRole("link", { name: "Choose a topic" });
      await expect(choose).toBeVisible();
      const fill = await choose.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(fill).not.toBe("rgb(63, 70, 56)");
      expect(await noSidewaysScroll(page)).toBe(true);
      await choose.click();
      await expect(page).toHaveURL(/\/training$/);
    });

    test("records saved before mode and topics show as Practice with no topic name", async ({
      page,
    }) => {
      const old = {
        kind: "quiz",
        itemIds: of("S1")
          .slice(0, 4)
          .map((item) => item.id),
        answers: of("S1")
          .slice(0, 4)
          .map((item, i) => answerOf(item, i < 3)),
        finishedAt: Date.now() - 3 * 60_000,
      };
      await open(page, [old]);
      const row = page.locator("section[aria-labelledby=recent-sessions] ol > li").first();
      await expect(row).toContainText("Practice");
      await expect(row).toContainText("3 of 4 correct");
      await expect(row).not.toContainText("·  ");
      await expect(row.locator("span.text-text-secondary").first()).not.toContainText("Responding");
    });
  });
}
