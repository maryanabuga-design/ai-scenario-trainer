import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { newAccount } from "./auth-seed";

/** The content counts, read from the content files so the tests follow the content. */
const quizBank: { id: string; section: string }[] = JSON.parse(
  readFileSync("content/quiz-bank.json", "utf8"),
).questions;
const scenarioSteps: { id: string; section: string }[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;
const QUIZ_TOTAL = quizBank.length;
const PART_SIZE = 10;
const s1Quiz = quizBank.filter((question) => question.section === "S1").slice(0, PART_SIZE);
const SCENARIO_TOTAL = scenarioSteps.length;
const quizOf = (section: string) => quizBank.filter((question) => question.section === section);

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const profile = { direction: "building-evacuation", onboarded: true };
const scenario = {
  kind: "scenario",
  itemIds: ["q-scn-s01-001", "s2", "s3"],
  answers: [],
  index: 0,
  finished: false,
};

/** Seeds the browser once (so a reload keeps what the page saved since) and opens a page. */
async function start(page: Page, session: object | null, path = "/session") {
  await page.addInitScript(
    ([p, s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
    },
    [profile, session],
  );
  await page.goto(path);
}

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true });
const finish = (page: Page) => page.getByRole("button", { name: "Finish", exact: true });
const check = (page: Page) => page.getByRole("button", { name: "Check", exact: true });
const option = (page: Page, text: string | RegExp) => page.locator("label", { hasText: text });

// s1: b is right; s2: c; s3: a.
const S1_RIGHT = "Stop the session, tell everyone to leave now";
const S1_WRONG = "Tell everyone it is probably a test and carry on while you check.";

test.describe("a running session", () => {
  test("has the top row, the strip and one primary button, with no verdict before Check", async ({
    page,
  }) => {
    await start(page, scenario);
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Exit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Leave this session" })).toBeVisible();
    await expect(check(page)).toBeDisabled();
    await expect(next(page)).toHaveCount(0);
    // Back is in the top row only: nothing next to the primary button.
    await expect(page.getByRole("button", { name: "Previous step" })).toHaveCount(0);
    await option(page, S1_RIGHT).click();
    await expect(check(page)).toBeEnabled();
    await expect(page.locator("body")).not.toContainText(/Correct|Not quite/);
    await check(page).click();
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toHaveCount(1);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Correct|Not quite|Incorrect|Your answer|Why/);
    expect(body).not.toMatch(/\bAI\b|\bbot\b/i);
    expect(body).not.toMatch(/How sure|confident|Explain your choice/i);
  });

  test("has a strip that shows answered, current and unanswered, and jumps", async ({ page }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    // a question counts as answered once it is checked
    await expect(page.getByRole("button", { name: "Step 1, not answered" })).toHaveCount(0);
    await check(page).click();
    await next(page).click();
    await expect(page.getByRole("button", { name: "Step 1, answered" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Step 2, current" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page.getByRole("button", { name: "Step 3, not answered" })).toBeVisible();
    await page.getByRole("button", { name: "Step 3, not answered" }).click();
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Step 2, not answered" })).toBeVisible();
  });

  test("changes the choice freely until Check, then locks it and shows it again after Back", async ({
    page,
  }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await option(page, S1_WRONG).click();
    await expect(page.getByLabel(S1_WRONG)).toBeChecked();
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.schema).toBe(6);
    expect(saved.value.answers).toEqual([{ itemId: "q-scn-s01-001", optionId: "a" }]);
    await check(page).click();
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.value.answers).toEqual([
      { itemId: "q-scn-s01-001", optionId: "a", checked: true },
    ]);
    await next(page).click();
    await page.getByRole("button", { name: "Previous step" }).click();
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    // back on the locked question: the choice, its result and Why are shown, and nothing can change
    await expect(page.getByLabel(S1_WRONG)).toBeChecked();
    await expect(page.getByLabel(S1_WRONG)).toBeDisabled();
    await expect(page.locator("label[data-state=wrong]")).toContainText("Not quite");
    await expect(page.getByRole("region", { name: "Why" })).toBeVisible();
  });

  test("asks before leaving, from Exit and from Back on the first step, and keeps the answers", async ({
    page,
  }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await page.getByRole("button", { name: "Leave this session" }).click();
    await expect(page.getByRole("heading", { name: "Leave this session?" })).toBeVisible();
    await page.getByRole("button", { name: "Stay", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Leave this session?" })).toBeHidden();
    await expect(page).toHaveURL(/\/session$/);
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.value.finished).toBe(false);
    expect(saved.value.answers).toHaveLength(1);
  });

  test("goes Finish → Results → Answer review, and Weak topics → repeat round → Results", async ({
    page,
  }) => {
    await start(page, scenario);
    // s1 wrong first, then changed to wrong again on purpose: a wrong answer in S1.
    await option(page, S1_WRONG).click();
    await check(page).click();
    await next(page).click();
    await page.locator("fieldset label").nth(2).click(); // s2: c, right
    await check(page).click();
    await next(page).click();
    await page.locator("fieldset label").nth(1).click(); // s3: b, wrong
    await expect(finish(page)).toHaveCount(0); // Check comes first
    await check(page).click();
    await expect(finish(page)).toBeEnabled();
    await finish(page).click();

    await expect(page).toHaveURL(/\/session\/results$/);
    await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
    await expect(page.getByText("PASS MARK: 3 of 3")).toBeVisible();
    await expect(page.getByText("1 of 3 correct")).toBeVisible();
    // counts only: no percentage character on a practice session's results
    expect(await page.locator("main").innerText()).not.toContain("%");
    await expect(page.getByText("Your answers")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Back to Home", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Back to Home" })).toHaveCount(0);
    await expect(page.getByText(/Error types|Outcome/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Repeat weak topics" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review answers" })).toBeVisible();

    // (B) Review answers → Answer review → Next question / the pager → Back to results.
    await page.getByRole("link", { name: "Review answers" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.getByText("Question 1 of 3")).toBeVisible();
    // The strip marks every question right or wrong and jumps.
    await expect(page.getByRole("button", { name: "Question 1, wrong" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page.getByRole("button", { name: "Question 2, correct" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Question 3, wrong" })).toBeVisible();
    await page.getByRole("button", { name: "Question 3, wrong" }).click();
    await expect(page).toHaveURL(/\/review\/3$/);
    await expect(page.getByText("Question 3 of 3").first()).toBeVisible();
    await page.getByRole("button", { name: "Question 1, wrong" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.locator("li[data-state=revealed-correct]:visible")).toHaveCount(1);
    await expect(page.locator("li[data-state=revealed-correct]:visible")).toContainText(
      "Correct answer",
    );
    await expect(page.locator("li[data-state=wrong]:visible")).toContainText("Not quite");
    await page.getByRole("link", { name: "Next question" }).click();
    await expect(page).toHaveURL(/\/review\/2$/);
    await expect(page.locator("li[data-state=wrong]:visible")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Previous question" })).toHaveCount(0);
    await page.getByRole("button", { name: "Question 1, wrong" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await page.getByRole("link", { name: "Back to results", exact: true }).last().click();
    await expect(page).toHaveURL(/\/session\/results$/);

    // (A) Weak topics → choose → Repeat selected → repeat round → Results.
    await page
      .getByRole("link", { name: /Weak topics/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/weak-topics\?from=results$/);
    await expect(page.getByRole("button", { name: /Repeat selected/ })).toContainText("2");
    await page.getByRole("button", { name: /Repeat selected/ }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Question 1 of 2")).toBeVisible();
    await option(page, S1_RIGHT).click();
    await check(page).click();
    await next(page).click();
    await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
    await check(page).click();
    await finish(page).click();
    await expect(page).toHaveURL(/\/session\/results$/);
    await expect(page.getByText("Repeat round", { exact: true })).toBeVisible();
  });

  test("ignores a session saved by an older version, without crashing", async ({ page }) => {
    await page.addInitScript(
      ([p]) => {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        localStorage.setItem(
          "ast.session.v1",
          JSON.stringify({
            mode: "full",
            stepIds: ["q-scn-s01-001", "s2"],
            index: 0,
            phase: "decide",
            answers: [{ stepId: "q-scn-s01-001", optionId: "b", confidence: 3, explanation: "" }],
            finished: false,
          }),
        );
        localStorage.setItem("ast.history.v1", JSON.stringify([{ mode: "short", answers: [] }]));
      },
      [profile],
    );
    await page.goto("/session");
    await expect(page.getByRole("heading", { name: "No session in progress" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/progress");
    await expect(page.locator("[data-readiness-number]")).toHaveText("Readiness 0%");
    await page.goto("/session/results");
    await expect(page.getByRole("heading", { name: "No results yet" })).toBeVisible();
  });
});

test.describe("the question screen: hint and bookmark", () => {
  const quizSession = {
    kind: "quiz",
    itemIds: ["q-quiz-s01-002", "q-quiz-s01-001"],
    answers: [],
    index: 0,
    finished: false,
  };

  test("opens the hint card under the options, closes it, and closes it on the next question", async ({
    page,
  }) => {
    await start(page, scenario);
    await expect(page.getByRole("region", { name: "Hint" })).toHaveCount(0);
    const lightbulb = page.getByRole("button", { name: "Hint", exact: true });
    await expect(lightbulb).toHaveAttribute("aria-expanded", "false");
    await lightbulb.click();
    const card = page.getByRole("region", { name: "Hint" });
    await expect(card).toBeVisible();
    await expect(card).toContainText(
      "Think about what the sound of an alarm can and cannot tell you.",
    );
    await expect(card.getByRole("button", { name: /Guide · S1/ })).toBeVisible();
    // under the options, in the page, not a sheet (the page scrolls the card into view first)
    await page.waitForTimeout(700);
    const optionBox = await page.locator("fieldset label").last().boundingBox();
    const cardBox = await card.boundingBox();
    expect(cardBox!.y).toBeGreaterThan(optionBox!.y + optionBox!.height - 1);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await lightbulb.click();
    await expect(card).toBeHidden();
    await lightbulb.click();
    await expect(card).toBeVisible();
    await option(page, S1_RIGHT).click();
    // Check disables the hint button and closes an open hint card
    await check(page).click();
    await expect(lightbulb).toBeDisabled();
    await expect(card).toBeHidden();
    await next(page).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await expect(page.getByRole("region", { name: "Hint" })).toHaveCount(0);
    await expect(lightbulb).toBeEnabled();
  });

  test("records that a hint was used on the answer", async ({ page }) => {
    await start(page, scenario);
    await page.getByRole("button", { name: "Hint", exact: true }).click();
    await option(page, S1_RIGHT).click();
    await check(page).click();
    await next(page).click();
    await option(page, /Keep it closed/).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.schema).toBe(6);
    const [first, second] = saved.value.answers;
    expect(first).toEqual({
      itemId: "q-scn-s01-001",
      optionId: "b",
      hintUsed: true,
      checked: true,
    });
    expect(second.hintUsed).toBeUndefined();
  });

  test("has the hint button left of Check, and Check fills the rest", async ({ page }) => {
    await start(page, scenario);
    const hintBox = await page.getByRole("button", { name: "Hint", exact: true }).boundingBox();
    const nextBox = await check(page).boundingBox();
    expect(Math.round(hintBox!.width)).toBe(52);
    expect(Math.round(hintBox!.height)).toBe(52);
    expect(hintBox!.x + hintBox!.width).toBeLessThan(nextBox!.x);
    expect(Math.round(nextBox!.height)).toBe(52);
    await expect(check(page)).toBeDisabled();
  });

  test("shows a hint (the fallback) on a quiz question too, as Review: the section", async ({
    page,
  }) => {
    // q-s2-1 has no hint of its own, so the fallback "Review: <section>" is shown.
    await start(page, { ...quizSession, itemIds: ["q-s2-1"] });
    await page.getByRole("button", { name: "Hint", exact: true }).click();
    await expect(page.getByRole("region", { name: "Hint" })).toContainText("Review:");
  });

  test("renders a True/False question with 2 options, and a scenario question with 3", async ({
    page,
  }) => {
    await start(page, quizSession);
    await expect(page.locator("fieldset input[type=radio]")).toHaveCount(2);
    await expect(page.getByText("True", { exact: true })).toBeVisible();
    await expect(page.getByText("False", { exact: true })).toBeVisible();
    await expect(check(page)).toBeDisabled();
    await page.getByText("False", { exact: true }).click();
    await expect(check(page)).toBeEnabled();
    await check(page).click();
    await next(page).click();
    // the last question: Check first, no Next or Finish yet
    await expect(check(page)).toBeDisabled();
    await expect(next(page)).toHaveCount(0);
    await expect(finish(page)).toHaveCount(0);
  });

  test("true or false: a wrong answer shows Not quite and reveals the right option", async ({
    page,
  }) => {
    await start(page, quizSession);
    await page.getByText("True", { exact: true }).click();
    await check(page).click();
    await expect(page.locator("label[data-state=wrong]")).toContainText("Not quite");
    await expect(page.locator("label[data-state=revealed-correct]")).toContainText("False");
    await expect(page.locator("label[data-state=revealed-correct]")).toContainText(
      "Correct answer",
    );
    await expect(page.getByRole("region", { name: "Why" })).toBeVisible();
  });

  test("renders a scenario question with 3 options", async ({ page }) => {
    await start(page, scenario);
    await expect(page.locator("fieldset input[type=radio]")).toHaveCount(3);
  });

  test("toggles the bookmark and keeps it after a reload", async ({ page }) => {
    await start(page, scenario);
    const save = page.getByRole("button", { name: "Save question" });
    await expect(save).toHaveAttribute("aria-pressed", "false");
    await save.click();
    await expect(page.getByRole("button", { name: "Remove from saved" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove from saved" })).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.saved.v1")!));
    expect(stored).toMatchObject({ schema: 6, value: ["q-scn-s01-001"] });
    await page.getByRole("button", { name: "Remove from saved" }).click();
    await expect(page.getByRole("button", { name: "Save question" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Save question" })).toBeVisible();
  });
});

test.describe("saved questions", () => {
  test("is reachable from the Home tile, empty at first, with no Repeat saved", async ({
    page,
  }) => {
    await start(page, null, "/");
    await page.getByRole("link", { name: /Saved questions/ }).click();
    await expect(page).toHaveURL(/\/saved$/);
    await expect(page.getByRole("heading", { name: "Saved questions" })).toBeVisible();
    await expect(page.getByText("No saved questions yet.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Repeat saved/ })).toHaveCount(0);
  });

  test("lists a saved question, opens it, removes it, and repeats the saved ones", async ({
    page,
  }) => {
    await start(page, scenario);
    await page.getByRole("button", { name: "Save question" }).click();
    await option(page, S1_RIGHT).click();
    await check(page).click();
    await next(page).click();
    await page.getByRole("button", { name: "Save question" }).click();
    await page.goto("/saved");
    await expect(page.getByRole("link", { name: /What do you do first/ })).toBeVisible();
    await expect(page.locator("main li:visible")).toHaveCount(2);
    await expect(page.getByRole("button", { name: /Repeat saved/ })).toContainText("2");

    // One saved question on its own: all options, the correct one marked, Why, bookmark.
    await page.getByRole("link", { name: /What do you do first/ }).click();
    await expect(page).toHaveURL(/\/saved\/q-scn-s01-001$/);
    await expect(page.locator("li[data-state=revealed-correct]:visible")).toContainText(
      "Correct answer",
    );
    await expect(page.locator("li[data-state]:visible")).toHaveCount(3);
    await expect(page.getByText("Why", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Remove from saved" }).click();
    await expect(page.getByText("Removed from saved")).toBeVisible();
    await page.getByRole("link", { name: "Back to saved questions" }).click();
    await expect(page.locator("main li:visible")).toHaveCount(1);

    // Repeat saved starts a session from the saved questions.
    await page.getByRole("button", { name: /Repeat saved/ }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Question 1 of 1")).toBeVisible();
    await expect(check(page)).toBeDisabled();
  });

  test("has the bookmark on the Answer review too", async ({ page }) => {
    await start(
      page,
      {
        ...scenario,
        answers: [
          { itemId: "q-scn-s01-001", optionId: "a" },
          { itemId: "s2", optionId: "c" },
          { itemId: "s3", optionId: "b" },
        ],
        finished: true,
        finishedAt: 5,
      },
      "/session/results/review/1",
    );
    await page.getByRole("button", { name: "Save question" }).click();
    await expect(page.getByRole("button", { name: "Remove from saved" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Remove from saved" })).toBeVisible();
  });

  test("keeps the saved questions when progress is reset", async ({ page }) => {
    await start(page, scenario);
    await page.getByRole("button", { name: "Save question" }).click();
    await page.goto("/profile");
    await page.getByRole("button", { name: "Reset progress" }).first().click();
    await page.getByRole("button", { name: "Reset progress" }).last().click();
    await page.goto("/");
    await expect(page.getByText("1 saved")).toBeVisible();
  });
});

test.describe("Home", () => {
  const history = (answers: { itemId: string; optionId: string }[]) => [
    {
      kind: "quiz",
      itemIds: answers.map((a) => a.itemId),
      answers,
      finishedAt: 7,
    },
  ];

  async function home(page: Page, session: object | null, past?: object[]) {
    await page.addInitScript(
      ([p, s, h]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 3, value: s }));
        if (h) localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 3, value: h }));
      },
      [profile, session, past ?? null],
    );
    await page.goto("/");
  }

  test("the hero card has the title, the subtitle, the picture and one button, and no progress numbers", async ({
    page,
  }) => {
    await home(page, null);
    const hero = page.getByRole("region", { name: "Training materials" });
    await expect(hero.getByRole("heading", { name: "Training materials" })).toBeVisible();
    await expect(hero.getByText("Practical scenarios and theory quizzes, by topic")).toBeVisible();
    // the picture (no placeholder any more), and exactly one interactive element still
    await expect(hero.locator("img")).toBeVisible();
    await expect(hero.getByText("3D", { exact: true })).toHaveCount(0);
    // exactly one interactive element: the Primary button, opening Training as before
    expect(await hero.locator("a, button, input, select, textarea, [tabindex]").count()).toBe(1);
    await expect(hero.getByRole("link", { name: "Choose a topic" })).toHaveAttribute(
      "href",
      "/training",
    );
    // no bar, no captions, no numbers or percentages, no divider
    await expect(hero.getByRole("progressbar")).toHaveCount(0);
    await expect(hero.locator("ul, li, hr")).toHaveCount(0);
    expect(await hero.innerText()).not.toMatch(/Topics|Today|%|\d\/\d/);
    // the page keeps its gutters (16px from the screen edge) and does not scroll sideways
    const sides = await hero.evaluate((el) => {
      const box = el.getBoundingClientRect();
      return [box.left, document.documentElement.clientWidth - box.right];
    });
    expect(Math.abs(sides[0] - 16)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(sides[1] - 16)).toBeLessThanOrEqual(0.5);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("opens Training from the hero card on a first visit, with the tiles and no Progress numbers", async ({
    page,
  }) => {
    await home(page, null);
    await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
    await expect(page.getByText("Start with your first scenario.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Choose a topic" })).toBeVisible();
    await expect(page.getByText("Training materials")).toBeVisible();
    await expect(page.getByText("Practical scenarios and theory quizzes, by topic")).toBeVisible();
    await expect(page.getByRole("img")).toHaveCount(0);
    await expect(page.getByText(/Readiness|How it works|How the app works/)).toHaveCount(0);
    for (const text of ["Not taken yet", "Nothing to repeat", "0 saved", "3 checklists"]) {
      await expect(page.getByText(text, { exact: true })).toBeVisible();
    }
    await expect(page.getByText(/Average result|Session history|Sessions/)).toHaveCount(0);
    await page.getByRole("link", { name: "Choose a topic" }).click();
    await expect(page).toHaveURL(/\/training$/);
    await expect(page.getByRole("heading", { name: "Training" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Saved questions \(/ })).toHaveCount(0);
  });

  test("continues an unfinished session at the right question", async ({ page }) => {
    await home(page, {
      ...scenario,
      answers: [{ itemId: "q-scn-s01-001", optionId: "b" }],
      index: 1,
    });
    await expect(page.getByText("You stopped at question 2 of 3.")).toBeVisible();
    await expect(page.getByRole("region", { name: "Training materials" })).not.toContainText(
      "Continue",
    );
    await page.getByRole("link", { name: "Choose a topic" }).click();
    await expect(page).toHaveURL(/\/training$/);
    await expect(page.getByText("Scenario · Question 2 of 3")).toBeVisible();
    await page.getByRole("link", { name: /Continue your session/ }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
  });

  test("shows no readiness percentage on Home, even after finished sessions", async ({ page }) => {
    await home(
      page,
      null,
      history([
        { itemId: "q-scn-s01-001", optionId: "b" },
        { itemId: "s2", optionId: "c" },
        { itemId: "q-quiz-s01-001", optionId: "a" },
      ]),
    );
    await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
    await expect(page.getByRole("img")).toHaveCount(0);
    await expect(page.getByText(/Readiness|\d+%/)).toHaveCount(0);
  });

  test("shows the sections to repeat after a wrong answer, and opens Weak topics", async ({
    page,
  }) => {
    await home(page, null, history([{ itemId: "q-scn-s01-001", optionId: "a" }]));
    await expect(page.getByText("1 section to repeat")).toBeVisible();
    await page.getByRole("link", { name: /Weak topics/ }).click();
    await expect(page).toHaveURL(/\/weak-topics$/);
  });

  test("shows the same hero card whatever the progress, with one full-width button to Training", async ({
    page,
  }) => {
    await home(page, null, history([{ itemId: "q-scn-s01-001", optionId: "a" }]));
    await expect(page.getByText("1 topic needs another look.")).toBeVisible();
    const hero = page.getByRole("region", { name: "Training materials" });
    await expect(hero.getByRole("heading", { name: "Training materials" })).toBeVisible();
    await expect(hero.getByText("Practical scenarios and theory quizzes, by topic")).toBeVisible();
    await expect(hero).not.toContainText(/Your training|10 topics|Continue|Repeat weak topics/);
    await expect(hero.getByRole("link")).toHaveCount(1);
    const button = hero.getByRole("link", { name: "Choose a topic" });
    const heroBox = await hero.boundingBox();
    const buttonBox = await button.boundingBox();
    // full width of the card: only the 8px card padding and the 16px panel padding are left at the sides
    expect(buttonBox!.width).toBeGreaterThan(heroBox!.width - 2 * (8 + 16) - 2);
    await button.click();
    await expect(page).toHaveURL(/\/training$/);
  });

  test("opens Training from an empty area of the hero card", async ({ page }) => {
    await home(page, null);
    const hero = page.getByRole("region", { name: "Training materials" });
    await page.evaluate(() => window.scrollTo(0, 0));
    const box = await hero.boundingBox();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + 4);
    await expect(page).toHaveURL(/\/training$/);
  });

  test("has exactly four tiles and no Materials tile, while the Materials tab still works", async ({
    page,
  }) => {
    await home(page, null);
    const tiles = page.locator("main ul:visible a");
    await expect(tiles).toHaveCount(4);
    await expect(tiles).toContainText(["Exam", "Steps", "Weak topics", "Saved questions"]);
    await expect(page.locator("main a[href='/materials']:visible")).toHaveCount(0);
    await page.getByRole("link", { name: /Saved questions/ }).click();
    await expect(page).toHaveURL(/\/saved$/);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await page.getByRole("link", { name: /^Exam/ }).click();
    await expect(page).toHaveURL(/\/exam$/);
    await page.goto("/");
    await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link", { name: "Materials" })
      .click();
    await expect(page).toHaveURL(/\/materials$/);
  });

  test("opens the Mini-quiz screen from the Home row", async ({ page }) => {
    await home(page, null);
    await page.getByRole("link", { name: /Mini-quiz/ }).click();
    await expect(page).toHaveURL(/\/mini-quiz\?from=home$/);
    await expect(page.getByRole("heading", { name: "Mini-quiz" })).toBeVisible();
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("opens the Steps list, a topic screen, and goes back step by step", async ({ page }) => {
    await home(page, null);
    await page.getByRole("link", { name: /^Steps/ }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    await expect(page.getByRole("heading", { name: "Steps", level: 1 })).toBeVisible();
    await expect(page.locator("main li:visible")).toHaveCount(3);
    await page.getByRole("link", { name: /Severe bleeding/ }).click();
    await expect(page).toHaveURL(/\/checklists\/severe-bleeding$/);
    await expect(page.locator("main ol li:visible")).toHaveCount(6);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Training", () => {
  async function open(page: Page, path = "/training", past?: object[], session?: object | null) {
    await page.addInitScript(
      ([p, h, s]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        if (h) localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 4, value: h }));
        if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 4, value: s }));
      },
      [profile, past ?? null, session ?? null],
    );
    await page.goto(path);
  }

  test("shows the stats, the switch, the topic cards and no settings", async ({ page }) => {
    await open(page);
    await expect(page.getByText(`0/${SCENARIO_TOTAL}`)).toBeVisible();
    await expect(page.getByText("0/0", { exact: true })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Scenario" })).toBeChecked();
    await expect(page.locator("section[aria-labelledby^=topic-]")).toHaveCount(5);
    await expect(page.locator("section[aria-labelledby^=topic-] [data-pill]")).toHaveCount(5);
    await expect(page.getByText(/Shuffle|Only topics|Guide sections/)).toHaveCount(0);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("switches the mode, updates the whole list and remembers the mode", async ({ page }) => {
    await open(page);
    await page.getByText("Quiz", { exact: true }).click();
    await expect(page.getByText(`0/${QUIZ_TOTAL}`)).toBeVisible();
    await expect(page.locator("section[aria-labelledby^=topic-]")).toHaveCount(10);
    await expect(page.getByRole("link", { name: /Mini-quiz/ })).toBeVisible();
    await page.goto("/");
    await page.goto("/training");
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
    await page.getByText("Scenario", { exact: true }).click();
    await expect(page.getByRole("link", { name: /Mini-quiz/ })).toHaveCount(0);
  });

  test("opens the Mini-quiz screen from the Quiz card", async ({ page }) => {
    await open(page, "/training?mode=quiz");
    await page.getByRole("link", { name: /Mini-quiz/ }).click();
    await expect(page).toHaveURL(/\/mini-quiz\?from=training$/);
    await expect(page.getByRole("heading", { name: "Mini-quiz" })).toBeVisible();
  });

  test("starts a part at once, with no setup, and returns to Training from Results", async ({
    page,
  }) => {
    await open(page, "/training?mode=quiz");
    await page
      .getByRole("button", { name: /Part 1/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText(`Question 1 of ${s1Quiz.length}`).first()).toBeVisible();
    await expect(page.getByText("Responding to an alarm").first()).toBeVisible();
    const started = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(started.value.partId).toBe("quiz:S1:1");
    expect(started.value.itemIds).toEqual(s1Quiz.map((question) => question.id));

    // Leaving midway changes nothing in the stats: only a finished session counts.
    await option(page, /It is real until it is officially/).click();
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await page.goto("/training?mode=quiz");
    await expect(page.getByText(`0/${QUIZ_TOTAL}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(1);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(`Question 1 of ${s1Quiz.length}`).first()).toBeVisible();

    // Finish the part: answer every question (the first option) and finish.
    for (let n = 0; n < s1Quiz.length; n++) {
      await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
      await check(page).click();
      await (n < s1Quiz.length - 1 ? next(page) : finish(page)).click();
    }
    await expect(page).toHaveURL(/\/session\/results$/);
    await page.getByRole("link", { name: "Back to Training" }).click();
    await expect(page).toHaveURL(/\/training\?mode=quiz$/);
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
    await expect(page.getByText(`${s1Quiz.length}/${QUIZ_TOTAL}`)).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Part 1: \d+ of \d+ correct last time/ }).first(),
    ).toBeVisible();
    // part 1 is done, so the Start pill moves to part 2 of S1
    await expect(page.locator("section[aria-labelledby=topic-S1] [data-pill]")).toHaveCount(1);
    await expect(page.getByText(/\d to repeat/).first()).toBeVisible();
  });

  test("shows the rose chip only after wrong answers", async ({ page }) => {
    await open(page, "/training?mode=quiz", [
      {
        kind: "quiz",
        itemIds: ["q-quiz-s01-001", "q-s2-1"],
        answers: [
          { itemId: "q-quiz-s01-001", optionId: "b" },
          { itemId: "q-s2-1", optionId: "b" },
        ],
        finishedAt: 1,
      },
    ]);
    await expect(page.getByText("1 to repeat")).toHaveCount(1);
    await expect(page.locator("section[aria-labelledby=topic-S1]")).toContainText("1 to repeat");
    await expect(page.locator("section[aria-labelledby=topic-S2]")).not.toContainText("to repeat");
  });

  test("Home shows where you stopped and Training resumes the part", async ({ page }) => {
    await open(page, "/", undefined, {
      kind: "quiz",
      itemIds: ["q-quiz-s01-001", "q-quiz-s01-002", "q-quiz-s01-003", "q-quiz-s01-004"],
      answers: [{ itemId: "q-quiz-s01-001", optionId: "b" }],
      index: 1,
      finished: false,
      partId: "quiz:S1:1",
    });
    await expect(page.getByText("You stopped at question 2 of 4.")).toBeVisible();
    await page.getByRole("link", { name: "Choose a topic" }).click();
    await expect(page).toHaveURL(/\/training$/);
    // the Exams section pushes the switch down on a small screen: tap its label, scrolling into view
    await page.getByText("Quiz", { exact: true }).click();
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Question 2 of 4").first()).toBeVisible();
  });
});

test.describe("Mini-quiz", () => {
  async function open(page: Page, path: string, past?: object[]) {
    await page.addInitScript(
      ([p, h]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        if (h) localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 4, value: h }));
      },
      [profile, past ?? null],
    );
    await page.goto(path);
  }
  const amounts = (page: Page) => page.locator("fieldset input[type=radio]");

  test("selects every topic and the largest amount by default", async ({ page }) => {
    await open(page, "/mini-quiz?from=training");
    await expect(page.getByText("Pick topics and how many questions")).toBeVisible();
    await expect(page.locator("input[name=mini-topics]:checked")).toHaveCount(10);
    await expect(amounts(page)).toHaveCount(3);
    await expect(page.getByLabel("15", { exact: true })).toBeChecked();
    await expect(
      page.getByText(`${QUIZ_TOTAL} questions available in your selected topics`),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Start mini-quiz" })).toBeEnabled();
  });

  test("follows the topics: options and the line change, none disables Start", async ({ page }) => {
    await open(page, "/mini-quiz?from=training");
    await page.getByRole("button", { name: "Deselect all" }).click();
    await expect(page.getByRole("button", { name: "Start mini-quiz" })).toBeDisabled();
    await expect(page.getByText("Select at least one topic").first()).toBeVisible();
    await expect(amounts(page)).toHaveCount(0);
    await expect(page.getByText("0 questions available in your selected topics")).toBeVisible();
    await page.getByText("Responding to an alarm").click();
    const s1 = quizOf("S1").length;
    const s2 = quizOf("S2").length;
    await expect(page.getByText(`${s1} questions available in your selected topics`)).toBeVisible();
    await expect(amounts(page)).toHaveCount(s1 >= 15 ? 3 : s1 >= 10 ? 2 : 1);
    await page.getByText("Checking the route").click();
    await expect(
      page.getByText(`${s1 + s2} questions available in your selected topics`),
    ).toBeVisible();
    await expect(amounts(page)).toHaveCount(s1 + s2 >= 15 ? 3 : s1 + s2 >= 10 ? 2 : 1);
    await expect(page.getByLabel("5", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Select all" }).click();
    await expect(amounts(page)).toHaveCount(3);
    await expect(page.getByLabel("15", { exact: true })).toBeChecked();
  });

  test("starts the chosen number of distinct questions from the selected topics only", async ({
    page,
  }) => {
    await open(page, "/mini-quiz?from=training");
    await page.getByRole("button", { name: "Deselect all" }).click();
    await page.getByText("Responding to an alarm").click();
    await page.getByText("Checking the route").click();
    await page.getByText("Moving through smoke").click();
    await page.getByLabel("10", { exact: true }).check({ force: true });
    await page.getByRole("button", { name: "Start mini-quiz" }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Question 1 of 10").first()).toBeVisible();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    const ids: string[] = stored.value.itemIds;
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    ids.forEach((id) =>
      expect(["S1", "S2", "S3"]).toContain(
        quizBank.find((question) => question.id === id)?.section,
      ),
    );
    expect(stored.value.partId).toBeUndefined();
    expect(stored.value.returnTo).toBe("/training?mode=quiz");
  });

  test("counts toward the stats but not the part rings, and Back goes to where it started", async ({
    page,
  }) => {
    await open(page, "/mini-quiz?from=training");
    await page.getByRole("button", { name: "Start mini-quiz" }).click();
    for (let n = 0; n < 15; n++) {
      await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
      await check(page).click();
      await (n < 14 ? next(page) : finish(page)).click();
    }
    await expect(page).toHaveURL(/\/session\/results$/);
    await page.getByRole("link", { name: "Back to Training" }).click();
    await expect(page).toHaveURL(/\/training\?mode=quiz$/);
    await expect(page.getByText(`15/${QUIZ_TOTAL}`)).toBeVisible();
    await expect(page.getByRole("img", { name: /Part \d: last result/ })).toHaveCount(0);
    await expect(page.locator("[data-pill]")).toHaveCount(10);
  });

  test("goes back to Home from Results when it was started from Home", async ({ page }) => {
    await open(page, "/mini-quiz?from=home");
    await page.getByLabel("5", { exact: true }).check({ force: true });
    await page.getByRole("button", { name: "Start mini-quiz" }).click();
    for (let n = 0; n < 5; n++) {
      await page.locator("fieldset[aria-labelledby^=question-] label:visible").first().click();
      await check(page).click();
      await (n < 4 ? next(page) : finish(page)).click();
    }
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
  });
});

test.describe("Exam", () => {
  const exam = (extra: object) => ({
    itemIds: quizBank.slice(0, 20).map((question) => question.id),
    answers: [],
    index: 0,
    startedAt: Date.now() - 1000,
    finished: false,
    ...extra,
  });

  async function open(page: Page, path: string, seeded?: object, session?: object) {
    await page.addInitScript(
      ([p, e, s]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        if (e) localStorage.setItem("ast.exam.v1", JSON.stringify({ schema: 5, value: e }));
        if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 5, value: s }));
      },
      [profile, seeded ?? null, session ?? null],
    );
    await page.goto(path);
  }

  const visibleOption = (page: Page) =>
    page.locator("fieldset[aria-labelledby^=question-] label:visible").first();

  async function takeExam(page: Page) {
    for (let n = 0; n < 20; n++) {
      await visibleOption(page).click();
      await (n < 19 ? next(page) : finish(page)).click();
    }
  }

  test("shows the rules and no results the first time", async ({ page }) => {
    await open(page, "/exam");
    await expect(
      page.getByRole("heading", { name: "Evacuation basics exam", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText(/^Assigned by Instructor · Due /)).toBeVisible();
    for (const rule of [
      "20 questions from all topics",
      "20 minutes",
      "No hints or feedback during the exam",
      "Pass mark 80%",
    ]) {
      await expect(page.getByText(rule)).toBeVisible();
    }
    await expect(page.getByText("You have not taken the exam yet")).toBeVisible();
    // a fresh student is not ready: the exam can still be started
    await expect(page.getByRole("button", { name: "Start exam anyway" })).toBeVisible();
  });

  test("runs a timed exam with no hints, then shows Results, and Back goes to the intro", async ({
    page,
  }) => {
    await open(page, "/exam");
    await page.getByRole("button", { name: "Start exam" }).click();
    await expect(page).toHaveURL(/\/exam\/session$/);
    await expect(page.getByText("Question 1 of 20").first()).toBeVisible();
    await expect(page.getByRole("timer")).toContainText(/^(20:00|19:5\d)$/);
    await expect(page.getByRole("button", { name: "Hint" })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /^(Save|Saved|Bookmark)/i }).first(),
    ).toBeVisible();
    await takeExam(page);
    await expect(page).toHaveURL(/\/exam\/results$/);
    await expect(page.getByRole("heading", { name: /Passed|Not passed yet/ })).toBeVisible();
    await expect(page.getByText("Exam", { exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: "Review answers" }).click();
    await expect(page).toHaveURL(/\/exam\/results\/review\/1$/);
    await page.getByRole("link", { name: "Back to results" }).first().click();
    await page.getByRole("link", { name: "Back to Exam", exact: true }).first().click();
    await expect(page).toHaveURL(/\/exam(\?id=.*)?$/);
    await expect(page.getByText(/^Last/)).toBeVisible();
    await expect(page.getByText(/^Best/)).toBeVisible();
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page.getByRole("link", { name: /^Exam Best: \d+ of 20/ })).toBeVisible();
  });

  test("keeps the timer after a refresh", async ({ page }) => {
    await open(page, "/exam/session", exam({ endsAt: Date.now() + 5 * 60_000 }));
    await expect(page.getByRole("timer")).toContainText(/^0?[45]:\d\d$/);
    await page.reload();
    await expect(page.getByRole("timer")).toContainText(/^0?[45]:\d\d$/);
    await expect(page.getByText("Question 1 of 20").first()).toBeVisible();
  });

  test("turns the timer rose in the last two minutes", async ({ page }) => {
    await open(page, "/exam/session", exam({ endsAt: Date.now() + 90_000 }));
    await expect(page.getByRole("timer")).toHaveAttribute("data-warning", "true");
    await expect(page.getByRole("timer")).toHaveClass(/bg-primary/);
  });

  test("finishes by itself at 0:00, counting unanswered as incorrect", async ({ page }) => {
    await open(page, "/exam/session", exam({ endsAt: Date.now() + 2000 }));
    await expect(page).toHaveURL(/\/exam\/results$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
    await expect(page.getByText("20 answers need another look in the guide.")).toBeVisible();
    const history = await page.evaluate(
      () => JSON.parse(localStorage.getItem("ast.history.v1")!).value,
    );
    expect(history).toHaveLength(1);
    expect(history[0].exam).toMatchObject({ percent: 0, questions: 20, timeUsedSeconds: 3 });
  });

  test("asks before leaving, then saves nothing and leaves no unfinished session", async ({
    page,
  }) => {
    await open(page, "/exam");
    await page.getByRole("button", { name: "Start exam" }).click();
    await visibleOption(page).click();
    await page.getByRole("button", { name: "Exit" }).click();
    await expect(page.getByText("Leave the exam?")).toBeVisible();
    await expect(page.getByText("Your progress will be lost.")).toBeVisible();
    await page.getByRole("button", { name: "Stay", exact: true }).click();
    await expect(page).toHaveURL(/\/exam\/session$/);
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(/\/exam$/);
    const stored = await page.evaluate(() => ({
      exam: localStorage.getItem("ast.exam.v1"),
      history: localStorage.getItem("ast.history.v1"),
      session: localStorage.getItem("ast.session.v1"),
    }));
    expect(stored).toEqual({ exam: null, history: null, session: null });
    await page.goto("/");
    await expect(page.getByText("Start with your first scenario.")).toBeVisible();
    await page.goto("/training");
    await expect(page.getByText("Continue your session")).toHaveCount(0);
  });

  test("leaves the part rings alone", async ({ page }) => {
    await open(page, "/exam");
    await page.getByRole("button", { name: "Start exam" }).click();
    await takeExam(page);
    await expect(page).toHaveURL(/\/exam\/results$/);
    const parts = await page.evaluate(() => localStorage.getItem("ast.parts.v1"));
    expect(parts).toBeNull();
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
  });

  test("does not touch an unfinished normal session", async ({ page }) => {
    await open(page, "/exam", undefined, { ...scenario, answers: [], index: 1 });
    await page.getByRole("button", { name: "Start exam" }).click();
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(/\/exam$/);
    await page.goto("/");
    await expect(page.getByText("You stopped at question 2 of 3.")).toBeVisible();
  });
});

test.describe("old saved data", () => {
  /** What a browser holds from before the content was replaced: ids that no longer exist. */
  async function seed(page: Page) {
    await page.addInitScript(
      ([p]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        const old = (value: unknown) => JSON.stringify({ schema: 5, value });
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        localStorage.setItem(
          "ast.session.v1",
          old({
            kind: "scenario",
            itemIds: ["s1", "s7", "s2"],
            answers: [{ itemId: "s1", optionId: "b" }],
            index: 1,
            finished: false,
          }),
        );
        localStorage.setItem(
          "ast.history.v1",
          old([
            {
              kind: "quiz",
              itemIds: ["q-s1-1", "q-s1-2", "q-s2-1"],
              answers: [
                { itemId: "q-s1-1", optionId: "b" },
                { itemId: "q-s1-2", optionId: "b" },
                { itemId: "q-s2-1", optionId: "b" },
              ],
              finishedAt: Date.now(),
            },
            {
              kind: "exam",
              itemIds: ["s1", "q-s1-4"],
              answers: [{ itemId: "s1", optionId: "b" }],
              finishedAt: 5,
              exam: { percent: 90, questions: 20, timeUsedSeconds: 600 },
            },
          ]),
        );
        localStorage.setItem(
          "ast.parts.v1",
          old({
            "quiz:S1:1": {
              lastPercent: 100,
              attempts: 1,
              answeredIds: ["q-s1-1"],
              correctIds: ["q-s1-1"],
            },
            "scenario:S1:1": {
              lastPercent: 100,
              attempts: 1,
              answeredIds: ["s1"],
              correctIds: ["s1"],
            },
          }),
        );
        localStorage.setItem("ast.saved.v1", old(["s1", "q-s1-3", "q-s2-1"]));
        localStorage.setItem(
          "ast.exam.v1",
          old({
            itemIds: ["s1", "q-s1-1"],
            answers: [],
            index: 0,
            startedAt: 1,
            endsAt: 2,
            finished: true,
          }),
        );
      },
      [profile],
    );
  }

  test("opens Home, Training, the Exam and the other screens without errors, keeping only what is valid", async ({
    page,
  }) => {
    const errors: string[] = [];
    // WebKit reports the router's interrupted prefetches (_rsc) as page errors; they are not app errors.
    page.on("pageerror", (error) => {
      if (!error.message.includes("_rsc")) errors.push(error.message);
    });
    await seed(page);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
    // the broken unfinished session is gone, so Home does not offer to continue it
    await expect(page.getByText(/You stopped at/)).toHaveCount(0);
    // the one valid answer (q-s2-1) is still there: 1 right is not 0%
    await expect(page.getByText("Not taken yet")).toBeVisible();
    await expect(page.getByText("1 saved")).toBeVisible();

    await page.goto("/training");
    await expect(page.getByRole("heading", { name: "Training" })).toBeVisible();
    await expect(page.getByText("Continue your session")).toHaveCount(0);
    await page.goto("/training?mode=quiz");
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
    await expect(page.getByText(`1/${QUIZ_TOTAL}`)).toBeVisible();
    await expect(page.locator("section[aria-labelledby=topic-S1] [data-pill]")).toHaveCount(1);

    await page.goto("/exam");
    await expect(page.getByRole("heading", { name: "Exam" })).toBeVisible();
    await expect(page.getByText("You have not taken the exam yet")).toBeVisible();
    await page.getByRole("button", { name: "Start exam" }).click();
    await expect(page.getByText("Question 1 of 20").first()).toBeVisible();

    for (const path of ["/progress", "/saved", "/weak-topics", "/session/results", "/session"]) {
      await page.goto(path);
      await expect(page.locator("main")).toBeVisible();
    }
    expect(errors, errors.join(" / ")).toEqual([]);
  });

  test("starts empty and keeps working when the saved data is corrupted", async ({ page }) => {
    const errors: string[] = [];
    // WebKit reports the router's interrupted prefetches (_rsc) as page errors; they are not app errors.
    page.on("pageerror", (error) => {
      if (!error.message.includes("_rsc")) errors.push(error.message);
    });
    await page.addInitScript(
      ([p]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        for (const key of ["session", "history", "parts", "saved", "exam"]) {
          localStorage.setItem(`ast.${key}.v1`, "{this is not json");
        }
      },
      [profile],
    );
    await page.goto("/");
    await expect(page.getByText("Start with your first scenario.")).toBeVisible();
    await page.goto("/training");
    await expect(page.getByRole("heading", { name: "Training" })).toBeVisible();
    await page.goto("/exam");
    await expect(page.getByText("You have not taken the exam yet")).toBeVisible();
    expect(errors, errors.join(" / ")).toEqual([]);
  });
});

test.describe("the onboarding entry", () => {
  test.describe("a new account", () => {
    test.use({ storageState: newAccount() });

    test("sees the introduction first, from any route, and Skip opens Home", async ({ page }) => {
      await page.goto("/progress");
      await expect(page).toHaveURL(/\/onboarding$/);
      await expect(page.getByRole("heading", { name: "Practise real situations" })).toBeVisible();
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
      await expect(page.getByText(/How it works|How the app works/)).toHaveCount(0);
      // seen once: Home stays Home
      await page.goto("/");
      await expect(page).toHaveURL(/\/$/);
    });
  });

  test("is a row in Profile that opens the introduction again, and Skip returns to Profile", async ({
    page,
  }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: "Help" })).toBeVisible();
    await page.getByRole("link", { name: "How the app works" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByRole("heading", { name: "Practise real situations" })).toBeVisible();
    await page.getByRole("button", { name: "Skip" }).click();
    await expect(page).toHaveURL(/\/profile$/);
    // a replay changes nothing: it is still done
    await page.goto("/");
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("selectable rows", () => {
  const wrong = [
    { itemId: "q-scn-s01-001", optionId: "a" },
    { itemId: "s2", optionId: "a" },
  ];

  async function open(page: Page, path: string, past?: object[], session?: object) {
    await page.addInitScript(
      ([p, h, s]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        if (h) localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
        if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 6, value: s }));
      },
      [profile, past ?? null, session ?? null],
    );
    await page.goto(path);
  }

  /** What the person sees of a row: fill, border and the padding on its four sides. */
  const look = (row: ReturnType<Page["locator"]>) =>
    row.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        borderColor: style.borderTopColor,
        borderWidth: style.borderTopWidth,
        radius: style.borderTopLeftRadius,
        color: style.color,
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft],
      };
    });

  const gutter = (page: Page) =>
    page
      .locator("main:visible")
      .first()
      .evaluate((main) => getComputedStyle(main).paddingLeft);

  test("Weak topics: a selected row looks like an unselected one and the padding is the page gutter", async ({
    page,
  }) => {
    await open(page, "/weak-topics", [
      { kind: "scenario", itemIds: wrong.map((a) => a.itemId), answers: wrong, finishedAt: 1 },
    ]);
    const rows = page.locator("fieldset label:visible");
    await expect(rows).toHaveCount(2);
    // all rows start selected; clear the second one by tapping the text in the middle of it
    await rows
      .nth(1)
      .getByText(/to repeat/)
      .click();
    await expect(rows.nth(0).locator("input")).toBeChecked();
    await expect(rows.nth(1).locator("input")).not.toBeChecked();
    const [selected, unselected] = [await look(rows.nth(0)), await look(rows.nth(1))];
    expect(selected).toEqual(unselected);
    expect(selected.borderWidth).toBe("1px");
    expect(selected.borderColor).toBe("rgb(228, 223, 213)");
    const space = await gutter(page);
    expect(selected.padding).toEqual([space, space, space, space]);
    // the icon circle is the shared icon tile
    const circle = await rows
      .nth(0)
      .locator("span[aria-hidden=true]")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    expect(circle).toBe("rgb(226, 222, 214)");
    // a tap on the very edge of the row (the padding) toggles it too
    await rows.nth(1).click({ position: { x: 6, y: 30 } });
    await expect(rows.nth(1).locator("input")).toBeChecked();
    await page.mouse.move(0, 0);
  });

  test("Mini-quiz topics: the same look selected and unselected", async ({ page }) => {
    await open(page, "/mini-quiz?from=training");
    const rows = page.locator("[role=group]:visible label");
    await expect(rows).toHaveCount(10);
    await rows
      .nth(2)
      .getByText(/Moving through smoke/)
      .click();
    await expect(rows.nth(2).locator("input")).not.toBeChecked();
    await expect(rows.nth(3).locator("input")).toBeChecked();
    expect(await look(rows.nth(3))).toEqual(await look(rows.nth(2)));
    const space = await gutter(page);
    expect((await look(rows.nth(2))).padding).toEqual([space, space, space, space]);
    // every icon circle is the same olive tint
    const circles = await rows
      .locator("span[aria-hidden=true]")
      .evaluateAll((list) =>
        list
          .filter((element) => element.className.includes("rounded-full") && element.textContent)
          .map((element) => getComputedStyle(element).backgroundColor),
      );
    expect(new Set(circles)).toEqual(new Set(["rgb(224, 230, 214)"]));
    // the amounts stay a segmented control
    await expect(page.locator("fieldset:visible input[type=radio]")).toHaveCount(3);
  });
});

test.describe("answer options and instant feedback", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  const OLIVE = "rgb(63, 70, 56)";
  const IDLE = "rgb(228, 223, 213)";
  const GREEN = "rgb(46, 125, 79)";
  const RED = "rgb(192, 57, 43)";

  async function open(page: Page, session: object, path = "/session") {
    await page.addInitScript(
      ([p, s]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 6, value: s }));
      },
      [profile, session],
    );
    await page.goto(path);
  }

  const cards = (page: Page) => page.locator("label[data-state]:visible");
  const border = (card: ReturnType<Page["locator"]>) =>
    card.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        color: style.borderTopColor,
        width: style.borderTopWidth,
        background: style.backgroundColor,
        radius: style.borderTopLeftRadius,
        box: [element.getBoundingClientRect().width, element.getBoundingClientRect().height],
      };
    });

  test("Check is disabled until an option is selected, and only that option is highlighted", async ({
    page,
  }) => {
    await open(page, scenario);
    await expect(check(page)).toBeDisabled();
    await expect(cards(page)).toHaveCount(3);
    // no letters anywhere on the options
    await expect(page.locator("fieldset")).not.toContainText(/^[ABCD]$/);
    const before = await border(cards(page).nth(0));
    expect(before).toMatchObject({ color: IDLE, width: "2px", radius: "24px" });
    await cards(page).nth(1).click();
    await expect(check(page)).toBeEnabled();
    await expect(cards(page).nth(1)).toHaveAttribute("data-state", "selected");
    await expect(cards(page).nth(0)).toHaveAttribute("data-state", "idle");
    const selected = await border(cards(page).nth(1));
    expect(selected).toMatchObject({
      color: OLIVE,
      width: "2px",
      background: "rgb(255, 255, 255)",
    });
    // the size does not change when the state does
    expect(selected.box).toEqual(
      (await border(cards(page).nth(0))).box.map((n, i) => (i === 1 ? selected.box[1] : n)),
    );
    // nothing is revealed and nothing shifts sideways
    await expect(page.locator("main")).not.toContainText(/Correct|Not quite|Why/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test("the choice can be changed freely until Check", async ({ page }) => {
    await open(page, scenario);
    await cards(page).nth(0).click();
    await cards(page).nth(2).click();
    await expect(cards(page).nth(2)).toHaveAttribute("data-state", "selected");
    await expect(cards(page).nth(0)).toHaveAttribute("data-state", "idle");
    await cards(page).nth(1).click();
    await expect(cards(page).nth(1)).toHaveAttribute("data-state", "selected");
  });

  test("a right answer: green card, check icon, Correct, Why, and Next", async ({ page }) => {
    await open(page, scenario);
    await option(page, S1_RIGHT).click();
    await check(page).click();
    const right = page.locator("label[data-state=correct]");
    await expect(right).toHaveCount(1);
    await expect(right).toContainText("Correct");
    await expect(right.locator("svg.lucide-check")).toBeVisible();
    expect(await border(right)).toMatchObject({ color: GREEN, background: "rgb(227, 242, 232)" });
    await expect(page.locator("label[data-state=wrong]")).toHaveCount(0);
    const why = page.getByRole("region", { name: "Why" });
    await expect(why).toBeVisible();
    await expect(why).toContainText("treat every alarm as real");
    await expect(page.getByRole("status")).toContainText("Correct");
    await expect(check(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hint", exact: true })).toBeDisabled();
    // locked: the radios cannot change
    await expect(cards(page).nth(0).locator("input")).toBeDisabled();
    await next(page).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await expect(check(page)).toBeVisible();
  });

  test("a wrong answer: red card, cross, Not quite, the right one revealed, and Why", async ({
    page,
  }) => {
    await open(page, scenario);
    await option(page, S1_WRONG).click();
    await check(page).click();
    const wrong = page.locator("label[data-state=wrong]");
    await expect(wrong).toHaveCount(1);
    await expect(wrong).toContainText("Not quite");
    await expect(wrong.locator("svg.lucide-x")).toBeVisible();
    expect(await border(wrong)).toMatchObject({ color: RED, background: "rgb(251, 228, 225)" });
    const revealed = page.locator("label[data-state=revealed-correct]");
    await expect(revealed).toContainText("Stop the session");
    await expect(revealed).toContainText("Correct answer");
    expect(await border(revealed)).toMatchObject({ color: GREEN });
    await expect(page.locator("label[data-state=idle]")).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Why" })).toBeVisible();
    await expect(page.getByRole("status")).toContainText(
      "Not quite. The correct answer is: Stop the session",
    );
    // an idle option stays white with its empty radio
    expect(await border(page.locator("label[data-state=idle]"))).toMatchObject({ color: IDLE });
  });

  test("the last question says Finish only after Check, and the page keeps its gutter", async ({
    page,
  }) => {
    await open(page, { ...scenario, itemIds: ["q-scn-s01-001"] });
    await expect(finish(page)).toHaveCount(0);
    await option(page, S1_RIGHT).click();
    await check(page).click();
    await expect(finish(page)).toBeEnabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);
    const box = await cards(page).first().boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(16);
    expect(box!.x + box!.width).toBeLessThanOrEqual(344);
  });

  test("a reload restores the selected state and the checked state exactly", async ({ page }) => {
    await open(page, scenario);
    await option(page, S1_RIGHT).click();
    await page.reload();
    await expect(cards(page).nth(1)).toHaveAttribute("data-state", "selected");
    await expect(check(page)).toBeEnabled();
    await check(page).click();
    await page.reload();
    await expect(page.locator("label[data-state=correct]")).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Why" })).toBeVisible();
    await expect(next(page)).toBeVisible();
    await expect(page.getByRole("button", { name: "Hint", exact: true })).toBeDisabled();
  });

  test("Answer review shows the same colours, icons and labels, without a Check button", async ({
    page,
  }) => {
    await open(
      page,
      {
        ...scenario,
        answers: [{ itemId: "q-scn-s01-001", optionId: "a", checked: true }],
        finished: true,
        finishedAt: 1,
      },
      "/session/results/review/1",
    );
    await expect(page.locator("li[data-state=wrong]")).toContainText("Not quite");
    await expect(page.locator("li[data-state=wrong] svg.lucide-x")).toBeVisible();
    await expect(page.locator("li[data-state=revealed-correct]")).toContainText("Correct answer");
    await expect(page.locator("li[data-state=revealed-correct] svg.lucide-check")).toBeVisible();
    await expect(page.getByRole("button", { name: "Check" })).toHaveCount(0);
    await expect(page.getByText("Why", { exact: true })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/^[ABCD]$/);
  });

  test("the Exam has no Check, no colours and no Why, and the choice can change until Next", async ({
    page,
  }) => {
    await page.addInitScript(
      ([p]) => {
        if (!localStorage.getItem("ast.profile.v1")) {
          localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        }
      },
      [profile],
    );
    await page.goto("/exam");
    await page.getByRole("button", { name: "Start exam" }).click();
    await expect(check(page)).toHaveCount(0);
    await expect(next(page)).toBeDisabled();
    await cards(page).nth(0).click();
    await cards(page).nth(1).click();
    await expect(cards(page).nth(1)).toHaveAttribute("data-state", "selected");
    await expect(cards(page).nth(0)).toHaveAttribute("data-state", "idle");
    expect(await border(cards(page).nth(1))).toMatchObject({ color: OLIVE });
    await expect(page.locator("main")).not.toContainText(/Correct|Not quite|Why/);
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    // going back: still selected and still changeable, nothing revealed
    await page.getByRole("button", { name: "Previous question" }).click();
    await expect(cards(page).nth(1)).toHaveAttribute("data-state", "selected");
    await expect(cards(page).nth(1).locator("input")).toBeEnabled();
    await cards(page).nth(0).click();
    await expect(cards(page).nth(0)).toHaveAttribute("data-state", "selected");
    await expect(page.locator("label[data-state=correct], label[data-state=wrong]")).toHaveCount(0);
  });
});
