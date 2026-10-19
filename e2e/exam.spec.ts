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
const TOPICS = ["S1", "S2", "S3", "S4"];
const scope = [...steps, ...quiz].filter((item) => TOPICS.includes(item.section));
const s1Steps = steps.filter((item) => item.section === "S1");

const profile = { direction: "building-evacuation", onboarded: true };

/** Opens a page with a profile, and optionally finished sessions in the history. */
async function open(page: Page, path: string, history?: object[]) {
  await page.addInitScript(
    ([p, h]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (h) localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
    },
    [profile, history ?? null],
  );
  await page.goto(path);
}

/** A finished session that answered every given item right (or wrong). */
const finished = (items: Item[], right: boolean) => ({
  kind: "quiz",
  itemIds: items.map((item) => item.id),
  answers: items.map((item) => ({
    itemId: item.id,
    optionId: right
      ? item.correctOptionId
      : item.options.find((option) => option.id !== item.correctOptionId)!.id,
  })),
  finishedAt: Date.now() - 60_000,
});

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe("Exam readiness", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("a fresh student sees the demo exam in Training with its deadline and no percentage", async ({
    page,
  }) => {
    await open(page, "/training");
    const exams = page
      .getByRole("region", { name: "Exams" })
      .or(page.locator("section[aria-labelledby=training-exams]"));
    await expect(exams.getByText("Evacuation basics exam")).toBeVisible();
    await expect(exams.getByText(/^Due \d{1,2} \w{3} · 7 days left$/)).toBeVisible();
    await expect(page.locator("main")).not.toContainText("%");
    await expect(page.locator("main [class*='lucide-lock'], main :text('Locked')")).toHaveCount(0);
    await exams.getByRole("link").click();
    await expect(page).toHaveURL(/\/exam\?id=demo-evacuation-basics$/);
  });

  test("the exam screen below 80% warns, shows the bar with its 80% tick, and the exam still starts", async ({
    page,
  }) => {
    await open(page, "/exam");
    await expect(page.getByRole("heading", { name: "Not ready yet" })).toBeVisible();
    await expect(page.getByText("Your readiness is 0%. The pass mark is 80%.")).toBeVisible();
    const bar = page.getByRole("progressbar", { name: /Readiness 0%, pass mark 80%/ });
    await expect(bar).toHaveAttribute("aria-valuenow", "0");
    await expect(page.locator("[data-readiness-tick-label]")).toHaveText("80%");
    // the band, with the exam title and who assigned it
    const band = page.locator("[data-page-header-band]:visible");
    await expect(band.getByRole("heading", { name: "Evacuation basics exam" })).toBeVisible();
    await expect(band).toContainText("Assigned by Instructor · Due");
    // a white card of the same family as the other two cards
    const card = page.getByRole("region", { name: "Readiness" }).locator("> div");
    expect(await card.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      "rgb(255, 255, 255)",
    );
    // the actions: Repeat weak topics (primary) and Start exam anyway (secondary)
    await expect(
      page.getByRole("button", { name: "Repeat weak topics", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start exam anyway", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Start exam", exact: true })).toHaveCount(0);
    // no sticky panel around the buttons
    const sticky = await page.evaluate(() =>
      [...document.querySelectorAll("main button")].some((button) => {
        for (let el: Element | null = button; el && el !== document.body; el = el.parentElement) {
          const position = getComputedStyle(el).position;
          if (position === "fixed" || position === "sticky") return true;
        }
        return false;
      }),
    );
    // (the band is sticky-free too, and the bottom area is the page's own flow)
    expect(sticky).toBe(false);
    await page.getByRole("button", { name: "Start exam anyway", exact: true }).click();
    await expect(page).toHaveURL(/\/exam\/session$/);
    await expect(page.getByText("Question 1 of 20").first()).toBeVisible();
  });

  test("Repeat weak topics raises Readiness, the summary shows the counts and one Readiness line, and Done returns to the exam", async ({
    page,
  }) => {
    await open(page, "/exam");
    await page.getByRole("button", { name: "Repeat weak topics", exact: true }).click();
    await expect(page).toHaveURL(/\/session$/);
    // the first 10 unanswered steps of S1, the weakest topic, in order
    const session = s1Steps.slice(0, 10);
    for (let n = 0; n < session.length; n++) {
      await expect(page.getByText(`Question ${n + 1} of 10`).first()).toBeVisible();
      const correct = session[n].options.find(
        (option) => option.id === session[n].correctOptionId,
      )!;
      await page.locator("fieldset label").filter({ hasText: correct.text }).first().click();
      await page.getByRole("button", { name: "Check", exact: true }).click();
      await expect(page.getByRole("region", { name: "Why" })).toBeVisible();
      await page
        .getByRole("button", { name: n < session.length - 1 ? "Next" : "Finish", exact: true })
        .click();
    }
    await expect(page).toHaveURL(/\/session\/results$/);
    const after = Math.floor((10 / scope.length) * 100);
    await expect(page.getByText("10 of 10 correct")).toBeVisible();
    await expect(page.getByText(`Readiness 0% → ${after}%`)).toBeVisible();
    // exactly two percentages: the one Readiness line
    expect(((await page.locator("main").innerText()).match(/%/g) ?? []).length).toBe(2);
    await page.getByRole("link", { name: "Done", exact: true }).click();
    await expect(page).toHaveURL(/\/exam\?id=demo-evacuation-basics$/);
    await expect(
      page.getByText(`Your readiness is ${after}%. The pass mark is 80%.`),
    ).toBeVisible();
  });

  test("Exit from a repeat session returns to the exam screen", async ({ page }) => {
    await open(page, "/exam");
    await page.getByRole("button", { name: "Repeat weak topics", exact: true }).click();
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(/\/exam\?id=demo-evacuation-basics$/);
  });

  test("at 80% or more the card says You're ready and the only button is Start exam", async ({
    page,
  }) => {
    await open(page, "/exam", [finished(scope, true)]);
    await expect(page.getByRole("heading", { name: "You're ready" })).toBeVisible();
    await expect(page.getByText("Your readiness is 100%.")).toBeVisible();
    await expect(page.getByRole("progressbar", { name: /Readiness 100%/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start exam", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Repeat weak topics|Start exam anyway/ }),
    ).toHaveCount(0);
    await expect(page.getByText("Not ready yet")).toHaveCount(0);
    await page.getByRole("button", { name: "Start exam", exact: true }).click();
    await expect(page).toHaveURL(/\/exam\/session$/);
  });

  test("failed exam answers become mistakes, readiness drops, and the results show a Score", async ({
    page,
  }) => {
    // 90% ready first
    const mostlyRight = scope.slice(0, Math.ceil(scope.length * 0.9));
    await open(page, "/exam", [finished(mostlyRight, true)]);
    await expect(page.getByRole("heading", { name: "You're ready" })).toBeVisible();
    await page.getByRole("button", { name: "Start exam", exact: true }).click();
    // answer the first option of each question: mostly wrong for a failed exam
    for (let n = 0; n < 20; n++) {
      await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
      await page.getByRole("button", { name: n < 19 ? "Next" : "Finish", exact: true }).click();
    }
    await expect(page).toHaveURL(/\/exam\/results$/);
    const main = page.locator("main");
    await expect(main.getByText(/^Score \d+%$/)).toBeVisible();
    // Score is the only percentage on the exam results
    expect(((await main.innerText()).match(/%/g) ?? []).length).toBe(1);
    await expect(main).toContainText("PASS MARK: 16 of 20");
    await expect(page.getByRole("heading", { name: /Passed|Not passed yet/ })).toBeVisible();
    if (await page.getByRole("heading", { name: "Not passed yet" }).isVisible()) {
      await expect(
        page.getByRole("button", { name: "Repeat weak topics", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Back to exam", exact: true })).toBeVisible();
      await page.getByRole("link", { name: "Back to exam", exact: true }).click();
      await expect(page).toHaveURL(/\/exam\?id=demo-evacuation-basics$/);
      // the wrong answers lowered readiness below the 90% it had
      await expect(page.getByText(/Your readiness is \d+%/)).not.toContainText("90%");
    } else {
      await expect(page.getByRole("link", { name: "Done", exact: true })).toBeVisible();
    }
  });

  test("Progress has the Exam readiness card on top, with the bar, the topic cards in number order and Repeat weak topics", async ({
    page,
  }) => {
    await open(page, "/progress", [
      finished(
        scope.filter((item) => item.section === "S2"),
        true,
      ),
    ]);
    const section = page.locator("section[aria-labelledby=exam-readiness]");
    await expect(section.getByRole("heading", { name: "Exam readiness" })).toBeVisible();
    await expect(
      section.getByRole("progressbar", { name: /Readiness \d+%, pass mark 80%/ }),
    ).toBeVisible();
    await expect(section.getByRole("button", { name: "Repeat weak topics" })).toBeVisible();
    // the topics are one list below it, in number order: S2 is the only topic answered (all right)
    const rows = page.locator("[data-topic-row]:visible");
    await expect(rows).toHaveCount(4);
    await expect(rows.nth(1)).toContainText("Checking the route");
    await expect(rows.nth(1)).toContainText(/(\d+) of \1 correct/);
    const top = (await section.boundingBox())!.y;
    const list = (await rows.first().boundingBox())!.y;
    expect(top).toBeLessThan(list);
  });

  test("Materials, Home, Training, Steps and the question screens have no % character", async ({
    page,
  }) => {
    for (const path of [
      "/",
      "/materials",
      "/training",
      "/training?mode=quiz",
      "/checklists",
      "/materials/read/S1",
    ]) {
      await open(page, path);
      await expect(page.locator("main").first()).toBeVisible();
      expect(await page.locator("main").first().innerText(), path).not.toContain("%");
    }
    // a question screen
    await open(page, "/training?mode=quiz");
    await page
      .getByRole("button", { name: /Part 1/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/session$/);
    expect(await page.locator("main").innerText()).not.toContain("%");
  });

  for (const width of [360, 430]) {
    test(`the new screens keep the 16px gutters and do not scroll sideways at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/exam", "/progress"]) {
        await open(page, path);
        await expect(page.locator("main").first()).toBeVisible();
        await page.waitForTimeout(300);
        expect(await noSidewaysScroll(page), path).toBe(true);
        const sides = await page.evaluate(() =>
          [
            ...document.querySelectorAll(
              "main > div > section, main > div > div:not([data-page-header-band])",
            ),
          ]
            .filter((el) => (el as HTMLElement).offsetParent !== null)
            .map((el) => {
              const box = el.getBoundingClientRect();
              return [box.left, document.documentElement.clientWidth - box.right];
            }),
        );
        for (const [left, right] of sides) {
          expect(Math.abs(left - 16), path).toBeLessThanOrEqual(0.5);
          expect(Math.abs(right - 16), path).toBeLessThanOrEqual(0.5);
        }
      }
    });
  }

  const tileLook = (page: Page) =>
    page
      .getByRole("region", { name: "Readiness" })
      .locator("span[aria-hidden]")
      .first()
      .evaluate((el) => {
        const css = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return {
          background: css.backgroundColor,
          ink: css.color,
          stroke: getComputedStyle(el.querySelector("svg")!).stroke,
          size: [box.width, box.height],
          radius: css.borderTopLeftRadius,
          icon: el
            .querySelector("svg")!
            .getAttribute("class")!
            .match(/lucide-[\w-]+/)![0],
        };
      });

  test("the status card is white with a muted sand-gold tile and the info icon when not ready", async ({
    page,
  }) => {
    await open(page, "/exam", [finished(scope.slice(0, Math.ceil(scope.length * 0.3)), true)]);
    await expect(page.getByRole("heading", { name: "Not ready yet" })).toBeVisible();
    const cards = page.locator("main h2:visible", {
      hasText: /Not ready yet|How it works|Your results/,
    });
    const backgrounds = await cards.evaluateAll((els) =>
      els.map((h) => {
        let el: Element | null = h;
        while (el && getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)")
          el = el.parentElement;
        const css = getComputedStyle(el!);
        return [
          css.backgroundColor,
          css.borderTopLeftRadius,
          css.boxShadow !== "none",
          css.paddingLeft,
        ];
      }),
    );
    expect(backgrounds).toHaveLength(3);
    // one family: the same fill, radius, shadow and padding
    expect(backgrounds[0]).toEqual(backgrounds[1]);
    expect(backgrounds[1]).toEqual(backgrounds[2]);
    expect(backgrounds[0][0]).toBe("rgb(255, 255, 255)");
    const tile = await tileLook(page);
    // never transparent, never plain black: a colour that was used but not registered draws neither
    expect(tile.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(tile.ink).not.toBe("rgb(0, 0, 0)");
    expect(tile.stroke).not.toBe("rgb(0, 0, 0)");
    expect(tile.background).toBe("rgb(241, 228, 200)");
    expect(tile.ink).toBe("rgb(111, 81, 32)");
    expect(tile.stroke).toBe("rgb(111, 81, 32)");
    expect(tile.size).toEqual([44, 44]);
    expect(tile.radius).toBe("12px");
    expect(tile.icon).toBe("lucide-info");
    // no red anywhere on the screen
    const red = await page.evaluate(() =>
      [...document.querySelectorAll("main *")].some((el) => {
        const css = getComputedStyle(el);
        return [css.color, css.backgroundColor, css.borderTopColor].some(
          (c) => c === "rgb(192, 57, 43)" || c === "rgb(251, 228, 225)",
        );
      }),
    );
    expect(red).toBe(false);
  });

  test("ready: a muted sage tile with the check-circle icon, not the info icon", async ({
    page,
  }) => {
    await open(page, "/exam", [finished(scope, true)]);
    await expect(page.getByRole("heading", { name: "You're ready" })).toBeVisible();
    const tile = await tileLook(page);
    expect(tile.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(tile.ink).not.toBe("rgb(0, 0, 0)");
    expect(tile.stroke).not.toBe("rgb(0, 0, 0)");
    expect(tile.background).toBe("rgb(225, 234, 218)");
    expect(tile.ink).toBe("rgb(68, 104, 58)");
    expect(tile.stroke).toBe("rgb(68, 104, 58)");
    expect(tile.size).toEqual([44, 44]);
    expect(tile.radius).toBe("12px");
    expect(tile.icon).toBe("lucide-circle-check");
    expect(tile.icon).not.toBe("lucide-info");
    await expect(page.getByText("Your readiness is 100%.")).toBeVisible();
  });

  for (const [name, history] of [
    ["not ready", [finished(scope.slice(0, Math.ceil(scope.length * 0.3)), true)]],
    ["ready", [finished(scope, true)]],
  ] as const) {
    test(`the buttons end the screen (${name}): at the bottom when short, after the content when long, never overlapping`, async ({
      page,
    }) => {
      const buttonsBox = async () => {
        const boxes = await page.locator("main button:visible").evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
          }),
        );
        return boxes;
      };
      const lastCardBottom = () =>
        page.evaluate(() => {
          const cards = [...document.querySelectorAll("main section, main > div > div")].filter(
            (el) => getComputedStyle(el).backgroundColor === "rgb(255, 255, 255)",
          );
          return cards[cards.length - 1].getBoundingClientRect().bottom;
        });

      // 1. a tall screen: short content, so the buttons are pinned to the bottom edge
      await page.setViewportSize({ width: 360, height: 1300 });
      await open(page, "/exam", [...history]);
      await expect(page.locator("main button:visible").first()).toBeVisible();
      let boxes = await buttonsBox();
      expect(Math.abs(1300 - 16 - boxes[boxes.length - 1].bottom)).toBeLessThanOrEqual(1);
      // a larger gap above the buttons than between them
      const between = boxes.length > 1 ? boxes[1].top - boxes[0].bottom : 0;
      const above = boxes[0].top - (await lastCardBottom());
      expect(above).toBeGreaterThan(between);
      expect(above).toBeGreaterThan(20);
      // no panel behind them: the wrapper has no background, border or shadow
      const wrapper = await page
        .locator("main button:visible")
        .first()
        .evaluate((el) => {
          const css = getComputedStyle(el.parentElement!);
          return [css.backgroundColor, css.borderTopWidth, css.boxShadow, css.position];
        });
      expect(wrapper).toEqual(["rgba(0, 0, 0, 0)", "0px", "none", "static"]);

      // 2. a normal phone: scrolled to the end, the last button is a gutter from the bottom
      await page.setViewportSize({ width: 360, height: 740 });
      await page.reload();
      await expect(page.locator("main button:visible").first()).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 99999));
      await page.waitForTimeout(200);
      boxes = await buttonsBox();
      expect(Math.abs(740 - 16 - boxes[boxes.length - 1].bottom)).toBeLessThanOrEqual(1);
      expect(await noSidewaysScroll(page)).toBe(true);
      for (const box of boxes) {
        expect(Math.abs(box.left - 16)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(360 - box.right - 16)).toBeLessThanOrEqual(0.5);
      }

      // 3. a short screen: the buttons are reachable by scrolling and nothing overlaps
      await page.setViewportSize({ width: 360, height: 500 });
      await page.reload();
      await expect(page.locator("main button:visible").first()).toBeVisible();
      await page.evaluate(() => window.scrollTo(0, 99999));
      await page.waitForTimeout(200);
      boxes = await buttonsBox();
      for (const box of boxes) expect(box.bottom).toBeLessThanOrEqual(500);
      for (let n = 1; n < boxes.length; n++)
        expect(boxes[n].top).toBeGreaterThanOrEqual(boxes[n - 1].bottom);
      expect(await lastCardBottom()).toBeLessThanOrEqual(boxes[0].top);
      const last = page.locator("main button:visible").last();
      await expect(last).toBeInViewport();
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  }

  test("the four rules sit in neutral warm grey circles, the same pair as the bookmark circle", async ({
    page,
  }) => {
    await open(page, "/exam");
    // the exam is seeded right after the first load: wait for the card before reading it
    await expect(page.getByRole("heading", { name: "How it works" })).toBeVisible();
    const circles = await page
      .locator("main h2:text('How it works') ~ ul li span[aria-hidden]")
      .evaluateAll((els) =>
        els.map((el) => {
          const css = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          return [
            css.backgroundColor,
            css.color,
            getComputedStyle(el.querySelector("svg")!).stroke,
            box.width,
            box.height,
            css.borderTopLeftRadius,
          ];
        }),
      );
    expect(circles).toHaveLength(4);
    for (const [background, ink, stroke, width, height, radius] of circles) {
      expect(background).toBe("rgb(226, 222, 214)");
      expect(ink).toBe("rgb(92, 90, 86)");
      expect(stroke).toBe("rgb(92, 90, 86)");
      expect([width, height]).toEqual([36, 36]);
      expect(String(radius)).not.toBe("0px");
    }
  });

  test("the bookmark circle beside a question has exactly the same two colours", async ({
    page,
  }) => {
    await open(page, "/training?mode=quiz");
    await page
      .getByRole("button", { name: /Part 1/ })
      .first()
      .click();
    const bookmark = page.getByRole("button", { name: "Save question" });
    await expect(bookmark).toBeVisible();
    expect(
      await bookmark.evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        getComputedStyle(el).color,
        getComputedStyle(el.querySelector("svg")!).stroke,
      ]),
    ).toEqual(["rgb(226, 222, 214)", "rgb(92, 90, 86)", "rgb(92, 90, 86)"]);
  });

  test("the Steps list tiles use the same neutral tile", async ({ page }) => {
    await open(page, "/checklists");
    const tile = page.locator("main ul li a span[aria-hidden]").first();
    await expect(tile).toBeVisible();
    expect(
      await tile.evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        getComputedStyle(el).color,
      ]),
    ).toEqual(["rgb(226, 222, 214)", "rgb(92, 90, 86)"]);
  });
});
