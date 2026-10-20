import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Q = { id: string; correctOptionId: string; options: { id: string }[] };
const quiz: Q[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;
const steps: Q[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;

const profile = { direction: "building-evacuation", onboarded: true };
const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const WHITE = "rgb(255, 255, 255)";

const wrongOf = (q: Q) => q.options.find((o) => o.id !== q.correctOptionId)!.id;

/** A finished session of these questions; `rights[i]` says whether question i was answered right. */
function finished(
  kind: "quiz" | "scenario" | "repeat",
  items: Q[],
  rights: boolean[],
  extra: object = {},
) {
  return {
    kind,
    itemIds: items.map((q) => q.id),
    answers: items.map((q, i) => ({
      itemId: q.id,
      optionId: rights[i] ? q.correctOptionId : wrongOf(q),
    })),
    index: items.length - 1,
    finished: true,
    ...extra,
  };
}

async function seed(page: Page, value: object) {
  await page.addInitScript(
    ([p, s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
    },
    [profile, value],
  );
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const ten = quiz.slice(0, 10);
const mixed = [false, true, false, true, true, false, true, true, false, true];
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);

for (const width of [360, 430]) {
  test.describe(`Results and Answer review at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("Results (exam repeat): Done is Primary and Review answers is Secondary, stacked, full width, no readiness line", async ({
      page,
    }) => {
      await seed(
        page,
        finished("repeat", ten, [true, true, true, false, true, true, true, true, false, true], {
          examId: "demo-evacuation-basics",
          returnTo: "/exam?id=demo-evacuation-basics",
        }),
      );
      await page.goto("/session/results");
      const done = page.getByRole("link", { name: "Done", exact: true });
      const review = page.getByRole("link", { name: "Review answers" });
      await expect(done).toBeVisible();
      expect(await bg(done)).toBe(PRIMARY);
      expect(await bg(review)).toBe(OLIVE_TINT);
      const d = (await done.boundingBox())!;
      const r = (await review.boundingBox())!;
      expect([d.height, r.height]).toEqual([52, 52]);
      expect(r.width).toBe(d.width);
      expect(d.width).toBe(width - 32);
      expect(Math.abs(r.y - (d.y + d.height) - 12)).toBeLessThanOrEqual(0.5);
      expect(await review.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
      // no readiness line and no percentage at all
      const text = await page.locator("main").innerText();
      expect(text).not.toMatch(/Readiness|Exam readiness|→|%/);
      await expect(page.getByText("8 of 10 correct")).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Results (practice, no exam): Review answers is Secondary, no readiness line, no percentage", async ({
      page,
    }) => {
      await seed(page, finished("quiz", ten, mixed));
      await page.goto("/session/results");
      await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
      expect(await bg(page.getByRole("link", { name: "Review answers" }))).toBe(OLIVE_TINT);
      expect(await page.locator("main").innerText()).not.toMatch(/Readiness|%/);
    });

    test("pager: a mixed list colours the chips, with a 1px border and no icons", async ({
      page,
    }) => {
      await seed(page, finished("quiz", ten, mixed));
      await page.goto("/session/results/review/1");
      const chips = page.locator("[data-review-pager] [data-chip]");
      await expect(chips).toHaveCount(10);
      const info = await chips.evaluateAll((els) =>
        els.map((el) => {
          const css = getComputedStyle(el);
          return {
            kind: el.getAttribute("data-chip"),
            bg: css.backgroundColor,
            border: css.borderTopWidth,
            borderColor: css.borderTopColor,
            icons: el.querySelectorAll("svg").length,
            size: [el.getBoundingClientRect().width, el.getBoundingClientRect().height],
            radius: css.borderTopLeftRadius,
          };
        }),
      );
      for (const [i, chip] of info.entries()) {
        expect(chip.kind).toBe(mixed[i] ? "correct" : "wrong");
        expect(chip.bg).toBe(mixed[i] ? "rgb(227, 242, 232)" : "rgb(251, 228, 225)");
        expect(chip.border).toBe("1px");
        expect(chip.borderColor).not.toBe("rgba(0, 0, 0, 0)");
        expect(chip.icons).toBe(0);
        expect(chip.size).toEqual([36, 36]);
        expect(chip.radius).toBe("10px");
      }
      // no corner marks anywhere in the pager
      await expect(page.locator("[data-review-pager] svg")).toHaveCount(0);
    });

    test("pager: all wrong and all correct lists are neutral", async ({ page }) => {
      for (const rights of [ten.map(() => false), ten.map(() => true)]) {
        const fresh = await page.context().newPage();
        await seed(fresh, finished("quiz", ten, rights));
        await fresh.goto("/session/results/review/1");
        const chips = fresh.locator("[data-review-pager] [data-chip]");
        await expect(chips).toHaveCount(10);
        const info = await chips.evaluateAll((els) =>
          els.map((el) => [
            el.getAttribute("data-chip"),
            getComputedStyle(el).backgroundColor,
            getComputedStyle(el).borderTopColor,
          ]),
        );
        for (const [kind, background, border] of info) {
          expect(kind).toBe("neutral");
          expect(background).toBe(WHITE);
          expect(border).toBe("rgb(228, 223, 213)");
        }
        await expect(fresh.getByRole("button", { name: "Question 1", exact: true })).toBeVisible();
        await fresh.close();
      }
    });

    test("pager: the active chip has a 2px olive ring and weight 600; names and aria-current", async ({
      page,
    }) => {
      await seed(page, finished("quiz", ten, mixed));
      await page.goto("/session/results/review/2");
      const active = page.getByRole("button", { name: "Question 2, correct" });
      await expect(active).toHaveAttribute("aria-current", "step");
      const chip = active.locator("[data-chip]");
      const look = await chip.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.outlineWidth, css.outlineColor, css.fontWeight, css.backgroundColor];
      });
      expect(look[0]).toBe("2px");
      expect(look[1]).toBe(PRIMARY);
      expect(Number(look[2])).toBeGreaterThanOrEqual(600);
      // the state fill stays visible under the ring
      expect(look[3]).toBe("rgb(227, 242, 232)");
      await expect(page.getByRole("button", { name: "Question 1, wrong" })).not.toHaveAttribute(
        "aria-current",
        "step",
      );
      expect(
        await page
          .getByRole("button", { name: "Question 1, wrong" })
          .locator("[data-chip]")
          .evaluate((el) => getComputedStyle(el).outlineStyle),
      ).toBe("none");
    });

    test("pager: the first chip is 16px from the edge, the tap area is 44 by 44, the last chip has 16px after it", async ({
      page,
    }) => {
      await seed(page, finished("quiz", ten, mixed));
      await page.goto("/session/results/review/1");
      const first = page.getByRole("button", { name: "Question 1, wrong" });
      const chip = (await first.locator("[data-chip]").boundingBox())!;
      expect(chip.x).toBeGreaterThanOrEqual(16);
      expect(chip.x).toBeLessThanOrEqual(20);
      const tap = (await first.boundingBox())!;
      expect(tap.width).toBeGreaterThanOrEqual(44);
      expect(tap.height).toBeGreaterThanOrEqual(44);
      // the visual size and the tap area are separate
      expect(chip.width).toBe(36);
      // the scrollbar is hidden, the row scrolls sideways, and ends 16px after the last chip
      const list = page.locator("[data-review-pager]");
      const info = await list.evaluate((el) => {
        const css = getComputedStyle(el);
        const lastChip = el.querySelector("li:last-child [data-chip]")!.getBoundingClientRect();
        el.scrollLeft = el.scrollWidth;
        const after =
          el.getBoundingClientRect().right -
          el.querySelector("li:last-child [data-chip]")!.getBoundingClientRect().right;
        void lastChip;
        return { overflowX: css.overflowX, scrollbar: css.scrollbarWidth, after };
      });
      expect(info.overflowX).toBe("auto");
      expect(info.scrollbar).toBe("none");
      expect(info.after).toBeGreaterThanOrEqual(15.5);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("pager: the active chip scrolls into view when the question changes (10 chips)", async ({
      page,
    }) => {
      await seed(page, finished("quiz", ten, mixed));
      await page.goto("/session/results/review/1");
      for (const n of [10, 6, 1]) {
        await page.getByRole("button", { name: new RegExp(`^Question ${n}(,|$)`) }).click();
        await expect(page).toHaveURL(new RegExp(`/review/${n}$`));
        await page.waitForTimeout(150);
        const visible = await page
          .getByRole("button", { name: new RegExp(`^Question ${n}(,|$)`) })
          .evaluate((el) => {
            const box = el.getBoundingClientRect();
            return box.left >= 0 && box.right <= window.innerWidth;
          });
        expect(visible, `question ${n}`).toBe(true);
      }
      // on question 6 the chip is centred when possible
      await page.getByRole("button", { name: /^Question 6(,|$)/ }).click();
      await page.waitForTimeout(150);
      const box = (await page.getByRole("button", { name: /^Question 6(,|$)/ }).boundingBox())!;
      expect(Math.abs(box.x + box.width / 2 - width / 2)).toBeLessThanOrEqual(24);
    });

    test("review question: the situation sits in the shared white card, no Ask AI, Next question Primary over Back to results Secondary", async ({
      page,
    }) => {
      await seed(page, finished("scenario", steps.slice(0, 3), [false, true, false]));
      await page.goto("/session/results/review/1");
      const card = page.locator("[data-situation-card]");
      await expect(card).toContainText("You are presenting to 14 participants");
      const look = await card.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.backgroundColor, css.borderTopLeftRadius];
      });
      expect(look[0]).toBe(WHITE);
      expect(parseFloat(look[1])).toBeGreaterThan(0);
      await expect(page.getByText("Ask AI about this step")).toHaveCount(0);
      await expect(page.getByRole("button", { name: /Ask AI/ })).toHaveCount(0);
      // the pinned area: Next question (Primary) over Back to results (Secondary)
      const next = page.getByRole("link", { name: "Next question" });
      expect(await bg(next)).toBe(PRIMARY);
      const area = page.locator("[data-full-bleed].border-t");
      const results = area.getByRole("link", { name: "Back to results" });
      expect(await bg(results)).toBe(OLIVE_TINT);
      const n = (await next.boundingBox())!;
      const b = (await results.boundingBox())!;
      expect([n.height, b.height]).toEqual([52, 52]);
      expect(b.y).toBeGreaterThan(n.y);
      expect(await next.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
      await expect(page.getByRole("link", { name: "Previous question" })).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("review question: the answering screen uses the same situation card", async ({ page }) => {
      await seed(page, {
        kind: "scenario",
        itemIds: steps.slice(0, 3).map((s) => s.id),
        answers: [],
        index: 0,
        finished: false,
      });
      await page.goto("/session");
      const card = page.locator("[data-situation-card]");
      await expect(card).toBeVisible();
      expect(await bg(card)).toBe(WHITE);
    });

    test("review question: on the last question only Back to results is shown, as Primary", async ({
      page,
    }) => {
      await seed(page, finished("scenario", steps.slice(0, 3), [false, true, false]));
      await page.goto("/session/results/review/3");
      const area = page.locator("[data-full-bleed].border-t");
      await expect(area.getByRole("link")).toHaveCount(1);
      const only = area.getByRole("link", { name: "Back to results" });
      expect(await bg(only)).toBe(PRIMARY);
      await expect(page.getByRole("link", { name: "Next question" })).toHaveCount(0);
    });
  });
}
