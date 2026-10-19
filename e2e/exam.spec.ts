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

  test("a fresh learner sees the demo exam in Training with its deadline and no percentage", async ({
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
    await expect(band).toContainText("Assigned by Admin · Due");
    // not red, not yellow: the neutral card (sand fill, the normal border)
    const card = page.getByRole("region", { name: "Readiness" });
    expect(
      await card.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.backgroundColor, css.borderTopColor, css.borderTopWidth];
      }),
    ).toEqual(["rgb(240, 236, 230)", "rgb(228, 223, 213)", "1px"]);
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

  test("Progress has the Exam readiness section on top, with the bar, the topics weakest first and Repeat weak topics", async ({
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
    const rows = section.locator("ul li");
    await expect(rows).toHaveCount(4);
    // weakest first: S2 is the only topic answered, so it comes last
    await expect(rows.last()).toContainText("Checking the route");
    const percents = await rows.allInnerTexts();
    const values = percents.map((row) => Number(/(\d+)%/.exec(row)![1]));
    expect(values).toEqual([...values].sort((a, b) => a - b));
    await expect(section.getByRole("button", { name: "Repeat weak topics" })).toBeVisible();
    // the section is above the rest of Progress
    const top = (await section.boundingBox())!.y;
    const summary = (await page.getByText("Correct answers").first().boundingBox())?.y ?? Infinity;
    expect(top).toBeLessThan(summary);
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
});
