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
 * Seeded progress: S1 all right, S2 half right, S3 and S4 untouched, S5 all right (in Other
 * topics), a mini-quiz and an exam.
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

/** The exam's readiness (S1 to S4) from a history: the latest answer per question over all of them. */
function readinessOf(history: ReturnType<typeof seeded>) {
  const scope = ["S1", "S2", "S3", "S4"].flatMap(of);
  const latest = new Map<string, boolean>();
  for (const entry of [...history].sort((a, b) => a.finishedAt - b.finishedAt)) {
    for (const answer of entry.answers as { itemId: string; optionId: string }[]) {
      const item = scope.find((candidate) => candidate.id === answer.itemId);
      if (item) latest.set(item.id, answer.optionId === item.correctOptionId);
    }
  }
  const correct = scope.filter((item) => latest.get(item.id) === true).length;
  return Math.floor((correct / scope.length) * 100 + 1e-9);
}

/** Two sessions, the older one storing the readiness that makes the change `delta` points. */
function withChange(delta: number | null) {
  const older = sessionOf(of("S1"), of("S1").length - 6, 60 * 24);
  const newer = sessionOf(of("S2"), Math.floor(of("S2").length / 2), 30);
  const current = readinessOf([older, newer]);
  return {
    current,
    history: [
      delta === null ? older : { ...older, readinessAfter: current - delta },
      { ...newer, readinessAfter: current },
    ],
  };
}

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

    test("has the readiness card, then By topic, and nothing about sessions", async ({ page }) => {
      await open(page, seeded());
      const main = page.locator("main");
      const y = async (text: string) =>
        (await main.getByText(text, { exact: true }).first().boundingBox())!.y;
      const order = [await y("Exam readiness"), await y("By topic"), await y("In your exam")];
      expect([...order].sort((a, b) => a - b)).toEqual(order);
      await expect(
        main.getByText(/^Evacuation basics exam · Due \d+ \w+ · \d+ days left$/),
      ).toBeVisible();
      for (const gone of [
        "Recent sessions",
        "See all",
        "Result by session",
        "Guide sections",
        "Session history",
        "No sessions yet",
        "Not started",
        "Needs work",
      ]) {
        await expect(main.getByText(gone, { exact: false })).toHaveCount(0);
      }
      await expect(main.getByText("Weak topics", { exact: true })).toHaveCount(0);
      expect(await main.innerText()).not.toMatch(/\d+ sessions? · \d+ answers?/);
      await expect(page.locator("a[href='/progress/sessions']")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("shows one measured percentage (Readiness); the topic cards have none", async ({
      page,
    }) => {
      await open(page, seeded());
      const main = page.locator("main");
      await expect(main.locator("[data-readiness-number]")).toHaveText(/^Readiness \d+%$/);
      const text = await main.innerText();
      // the number, the 80% marker and the 80% in the sentence are the readiness vocabulary
      expect(text.replace(/Readiness \d+%/g, "").replace(/80%/g, "")).not.toContain("%");
      for (const row of await main.locator("[data-topic-row]").all()) {
        expect(await row.innerText()).not.toContain("%");
      }
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
      const fill = await button.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(fill).toBe("rgb(63, 70, 56)");
      for (const el of await card.locator("*").all()) {
        const { r, g, b: blue } = rgb(await el.evaluate((e) => getComputedStyle(e).color));
        expect(r > 170 && g < 90 && blue < 90).toBe(false);
      }
    });

    for (const [delta, text, icon] of [
      [9, "+9 points since your last session", "up"],
      [0, "No change since your last session", "none"],
      [-4, "-4 points since your last session", "down"],
      [1, "+1 point since your last session", "up"],
    ] as const) {
      test(`the change line says "${text}" and uses neutral or success colours, never red`, async ({
        page,
      }) => {
        await open(page, withChange(delta).history);
        const card = page.getByRole("region", { name: "Exam readiness" });
        const line = card.locator("[data-readiness-change]");
        await expect(line).toHaveText(text);
        expect(await line.innerText()).not.toContain("%");
        await expect(line.locator("[data-change-icon]")).toHaveAttribute("data-change-icon", icon);
        const look = await line.evaluate((el) => {
          const svg = el.querySelector("svg")!;
          const label = el.querySelector("span")!;
          const box = el.getBoundingClientRect();
          return {
            icon: getComputedStyle(svg).color,
            text: getComputedStyle(el).color,
            size: getComputedStyle(label).fontSize,
            lineHeight: parseFloat(getComputedStyle(el).lineHeight),
            height: box.height,
            ellipsis: getComputedStyle(label).textOverflow,
          };
        });
        // success ink for a rise, neutral ink otherwise; the text is always neutral
        expect(look.icon).toBe(icon === "up" ? "rgb(68, 104, 58)" : "rgb(92, 90, 86)");
        expect(look.text).toBe("rgb(92, 90, 86)");
        for (const color of [look.icon, look.text]) {
          const { r, g, b, a } = rgb(color);
          expect(a).toBeGreaterThan(0);
          expect(color).not.toBe("rgb(0, 0, 0)");
          expect(r > 170 && g < 90 && b < 90).toBe(false);
        }
        // 14px, one line, cut with an ellipsis when too long
        expect(look.size).toBe("14px");
        expect(look.height).toBeLessThanOrEqual(look.lineHeight + 1);
        expect(look.ellipsis).toBe("ellipsis");
        // it sits between the bar and the sentence
        const [bar, row, sentence] = [
          await card.getByRole("progressbar").boundingBox(),
          await line.boundingBox(),
          await card.getByText(/^Not ready yet|^You are ready/).boundingBox(),
        ];
        expect(row!.y).toBeGreaterThanOrEqual(bar!.y + bar!.height - 1);
        expect(row!.y + row!.height).toBeLessThanOrEqual(sentence!.y);
        expect(await noSidewaysScroll(page)).toBe(true);
      });
    }

    test("the change line is hidden with one session and with older records that have no stored readiness", async ({
      page,
    }) => {
      await open(page, [sessionOf(of("S1"), 3, 30)]);
      await expect(page.locator("[data-readiness-change]")).toHaveCount(0);
      // old records: two sessions without readinessAfter load without errors, no line
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await open(
        page,
        withChange(null).history.map((entry) =>
          Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "readinessAfter")),
        ),
      );
      await expect(page.getByRole("region", { name: "Exam readiness" })).toBeVisible();
      await expect(page.locator("[data-readiness-change]")).toHaveCount(0);
      await expect(page.locator("[data-topic-row]:visible")).toHaveCount(4);
      // (WebKit reports its own prefetch noise as page errors; those are not the app's)
      expect(errors.filter((message) => !/access control checks/.test(message))).toEqual([]);
    });

    test("a broken stored readiness is ignored: no line, no crash", async ({ page }) => {
      const { history } = withChange(5);
      await open(page, [{ ...history[0], readinessAfter: "lots" }, history[1]]);
      await expect(page.getByRole("region", { name: "Exam readiness" })).toBeVisible();
      await expect(page.locator("[data-readiness-change]")).toHaveCount(0);
    });

    test("the title and the exam line use the full card width, with no 3D slot", async ({
      page,
    }) => {
      await open(page, null);
      const card = page.getByRole("region", { name: "Exam readiness" });
      await expect(card.locator("[data-media3d], [data-gauge-slot]")).toHaveCount(0);
      await expect(card.getByText("3D", { exact: true })).toHaveCount(0);
      const c = (await card.boundingBox())!;
      const exam = card.locator("[data-readiness-exam]");
      const e = (await exam.boundingBox())!;
      // the exam line spans the card's inner width: 16px padding on each side
      expect(Math.abs(e.x - (c.x + 16))).toBeLessThanOrEqual(1);
      expect(Math.abs(e.width - (c.width - 32))).toBeLessThanOrEqual(1);
      // one line, cut with an ellipsis when it does not fit
      const info = await exam.evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        line: parseFloat(getComputedStyle(el).lineHeight),
        ellipsis: getComputedStyle(el).textOverflow,
        nowrap: getComputedStyle(el).whiteSpace,
      }));
      expect(info.height).toBeCloseTo(info.line, 0);
      expect(info.ellipsis).toBe("ellipsis");
      expect(info.nowrap).toBe("nowrap");
      await expect(exam).toContainText("Evacuation basics exam");
      // the bar, the sentence and the button are full width below
      const bar = (await card.getByRole("progressbar").boundingBox())!;
      expect(Math.abs(bar.width - (c.width - 32))).toBeLessThanOrEqual(1);
    });

    test("the card is not taller than it was before the slot", async ({ page }) => {
      // without a previous session there is no change line, so the card has its old height
      await open(page, null);
      const card = page.getByRole("region", { name: "Exam readiness" });
      const before = width === 360 ? 335.17 : 315.17;
      expect((await card.boundingBox())!.height).toBeLessThanOrEqual(before + 1);
    });

    test("a finished session stores the readiness after it, and the line appears for the next one", async ({
      page,
    }) => {
      await open(page, [sessionOf(of("S1"), 20, 60)]);
      await page.goto("/exam");
      await page.getByRole("button", { name: /^Start exam/ }).click();
      for (let n = 0; n < 20; n++) {
        await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
        await page.getByRole("button", { name: n < 19 ? "Next" : "Finish", exact: true }).click();
      }
      await expect(page).toHaveURL(/\/exam\/results$/);
      const saved = await page.evaluate(() => {
        const raw = JSON.parse(localStorage.getItem("ast.history.v1")!) as {
          value: { kind: string; readinessAfter?: number }[];
        };
        return raw.value.map((entry) => [entry.kind, typeof entry.readinessAfter]);
      });
      // the seeded record has none (an old one); the finished exam stores a number
      expect(saved).toEqual([
        ["quiz", "undefined"],
        ["exam", "number"],
      ]);
      // with two sessions but no stored value in the older one, there is no line yet
      await page.goto("/progress");
      await expect(page.locator("[data-readiness-number]")).toBeVisible();
      await expect(page.locator("[data-readiness-change]")).toHaveCount(0);
    });

    test("there is still exactly one measured percentage: Readiness", async ({ page }) => {
      await open(page, withChange(9).history);
      const text = await page.locator("main").innerText();
      expect((text.match(/\d+%/g) ?? []).sort()).toEqual(
        [text.match(/Readiness (\d+%)/)![1], "80%", "80%"].sort(),
      );
    });

    test("every topic card is exactly 80px high, with a chevron inside it and no chip", async ({
      page,
    }) => {
      await open(page, seeded());
      await page.getByRole("button", { name: "Other topics (6)" }).click();
      const rows = page.locator("[data-topic-row]:visible");
      await expect(rows).toHaveCount(10);
      for (const row of await rows.all()) {
        const box = (await row.boundingBox())!;
        expect(box.height).toBe(80);
        expect(await row.evaluate((el) => el.tagName)).toBe("BUTTON");
        // the page gutter: the cards are 16px from both edges
        expect(Math.abs(box.x - 16)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(width - (box.x + box.width) - 16)).toBeLessThanOrEqual(0.5);
        // no status chip (a chip has horizontal padding and no fixed size)
        await expect(row.locator("[class*='px-2.5']")).toHaveCount(0);
        const text = await row.innerText();
        expect(text).not.toMatch(/Not started|Needs work|Ready/);
        // the chevron lies inside the card, vertically centred, with the card padding to its right
        const chevron = (await row.locator("svg.lucide-chevron-right").boundingBox())!;
        expect(chevron.x).toBeGreaterThan(box.x);
        expect(chevron.x + chevron.width).toBeLessThanOrEqual(box.x + box.width);
        expect(
          Math.abs(chevron.y + chevron.height / 2 - (box.y + box.height / 2)),
        ).toBeLessThanOrEqual(2);
        // the bar sits fully inside the card
        const bar = (await row.locator(".h-1\\.5").boundingBox())!;
        expect(bar.y).toBeGreaterThanOrEqual(box.y);
        expect(bar.y + bar.height).toBeLessThanOrEqual(box.y + box.height);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("a topic title is one line, cut with an ellipsis when it does not fit", async ({
      page,
    }) => {
      await open(page, seeded());
      await page.getByRole("button", { name: "Other topics (6)" }).click();
      const titles = page.locator("[data-topic-title]:visible");
      let truncated = 0;
      for (const title of await titles.all()) {
        const info = await title.evaluate((el) => {
          const css = getComputedStyle(el);
          return {
            height: el.getBoundingClientRect().height,
            line: parseFloat(css.lineHeight),
            nowrap: css.whiteSpace,
            ellipsis: css.textOverflow,
            overflow: css.overflow,
            cut: el.scrollWidth > el.clientWidth,
            text: el.textContent,
          };
        });
        expect(info.height, info.text!).toBeCloseTo(info.line, 0);
        expect(info.nowrap).toBe("nowrap");
        expect(info.ellipsis).toBe("ellipsis");
        expect(info.overflow).toBe("hidden");
        if (info.cut) truncated += 1;
      }
      // "Assembly point and headcount" does not fit at 360px: it is cut, and still 80px high
      if (width === 360) expect(truncated).toBeGreaterThan(0);
      const long = page.locator('[data-topic-row="S4"]');
      expect((await long.boundingBox())!.height).toBe(80);
      // the whole title is still in the text
      await expect(long).toContainText("Assembly point and headcount");
    });

    test("topics are in number order: S1 to S4 in the exam group, S5 to S10 in the other", async ({
      page,
    }) => {
      await open(page, seeded());
      const ids = () =>
        page
          .locator("[data-topic-row]:visible")
          .evaluateAll((els) => els.map((el) => el.getAttribute("data-topic-row")));
      expect(await ids()).toEqual(["S1", "S2", "S3", "S4"]);
      await page.getByRole("button", { name: "Other topics (6)" }).click();
      expect(await ids()).toEqual(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"]);
    });

    test("the counts are over all the topic's questions and use the latest answer", async ({
      page,
    }) => {
      await open(page, seeded());
      const s2 = of("S2");
      await expect(page.locator('[data-topic-row="S2"]')).toContainText(
        `${Math.floor(s2.length / 2)} of ${s2.length} correct`,
      );
      await expect(page.locator('[data-topic-row="S3"]')).toContainText(
        `0 of ${of("S3").length} correct`,
      );
      await expect(page.locator('[data-topic-row="S1"]')).toContainText(
        `${of("S1").length} of ${of("S1").length} correct`,
      );
    });

    test("Other topics (6) is an underlined text button: collapsed by default, opens and closes", async ({
      page,
    }) => {
      await open(page, seeded());
      const toggle = page.getByRole("button", { name: "Other topics (6)" });
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator('[data-topic-row="S5"]')).toHaveCount(0);
      const look = await toggle.evaluate((el) => {
        const css = getComputedStyle(el);
        const label = el.querySelector("span")!;
        return {
          background: css.backgroundColor,
          border: [css.borderTopWidth, css.borderLeftWidth],
          shadow: css.boxShadow,
          height: el.getBoundingClientRect().height,
          underline: getComputedStyle(label).textDecorationLine,
        };
      });
      expect(look.background).toBe("rgba(0, 0, 0, 0)");
      expect(look.border).toEqual(["0px", "0px"]);
      expect(look.shadow).toBe("none");
      expect(look.height).toBeGreaterThanOrEqual(44);
      expect(look.underline).toContain("underline");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("[data-topic-row]:visible")).toHaveCount(10);
      await expect(page.locator('[data-topic-row="S5"]')).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator('[data-topic-row="S5"]')).toHaveCount(0);
    });

    test("tapping a topic card starts a practice session of that topic", async ({ page }) => {
      await open(page, seeded());
      await page.locator('[data-topic-row="S3"]').click();
      await expect(page).toHaveURL(/\/session$/);
      await expect(page.getByText(/Question 1 of|Step 1 of/)).toBeVisible();
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

    test("the last card is not hidden behind the bottom navigation", async ({ page }) => {
      await open(page, seeded());
      await page.getByRole("button", { name: "Other topics (6)" }).click();
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);
      const nav = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
      const last = (await page.locator("[data-topic-row]:visible").last().boundingBox())!;
      expect(last.y + last.height).toBeLessThanOrEqual(nav.y);
    });

    test("with no sessions it still shows readiness and the topics, in order", async ({ page }) => {
      await open(page, null);
      const main = page.locator("main");
      await expect(main.locator("[data-readiness-number]")).toHaveText("Readiness 0%");
      await expect(page.locator("[data-topic-row]:visible")).toHaveCount(4);
      await expect(main.getByText("No sessions yet")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("records saved before mode and topics still count in the topic cards", async ({
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
      await expect(page.locator('[data-topic-row="S1"]')).toContainText(
        `3 of ${of("S1").length} correct`,
      );
    });
  });
}
