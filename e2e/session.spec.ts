import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };
const scenario = {
  kind: "scenario",
  itemIds: ["s1", "s2", "s3"],
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
const option = (page: Page, text: string | RegExp) => page.locator("label", { hasText: text });

// s1: b is right; s2: c; s3: a.
const S1_RIGHT = "Everyone leaves now by the stairs";
const S1_WRONG = "Stay where you are until the alarm is confirmed as real.";

test.describe("a running session", () => {
  test("has the top row, the strip and a single Next button, with no verdict", async ({ page }) => {
    await start(page, scenario);
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Exit" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Leave this session" })).toBeVisible();
    await expect(next(page)).toBeDisabled();
    // Back is in the top row only: nothing next to Next.
    await expect(page.getByRole("button", { name: "Previous step" })).toHaveCount(0);
    await option(page, S1_RIGHT).click();
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous step" })).toHaveCount(1);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Correct|Incorrect|Your answer|Why/);
    expect(body).not.toMatch(/\bAI\b|\bbot\b/i);
    expect(body).not.toMatch(/How sure|confident|Explain your choice/i);
  });

  test("has a strip that shows answered, current and unanswered, and jumps", async ({ page }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
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

  test("fills the choice in again after Back, and a changed answer is what counts", async ({
    page,
  }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await next(page).click();
    await page.getByRole("button", { name: "Previous step" }).click();
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    await expect(page.getByLabel(S1_RIGHT)).toBeChecked();
    await option(page, S1_WRONG).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.schema).toBe(3);
    expect(saved.value.answers).toEqual([{ itemId: "s1", optionId: "a" }]);
  });

  test("asks before leaving, from Exit and from Back on the first step, and keeps the answers", async ({
    page,
  }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await page.getByRole("button", { name: "Leave this session" }).click();
    await expect(page.getByRole("heading", { name: "Leave this session?" })).toBeVisible();
    await page.getByRole("button", { name: "Stay" }).click();
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
    await next(page).click();
    await page.locator("fieldset label").nth(2).click(); // s2: c, right
    await next(page).click();
    await page.locator("fieldset label").nth(1).click(); // s3: b, wrong
    await expect(finish(page)).toBeEnabled();
    await finish(page).click();

    await expect(page).toHaveURL(/\/session\/results$/);
    await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
    await expect(page.getByText("PASS MARK: 80%")).toBeVisible();
    await expect(page.getByText("33%")).toBeVisible();
    await expect(page.getByText("Your answers")).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Back to Home", exact: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Back to Home" })).toHaveCount(0);
    await expect(page.getByText(/Error types|Outcome/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Repeat weak topics" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Review answers" })).toBeVisible();

    // (B) Review answers → Answer review → Previous / Next → Back to results.
    await page.getByRole("link", { name: "Review answers" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.getByText("Question 1 of 3")).toBeVisible();
    // The strip marks every question right or wrong and jumps.
    await expect(page.getByRole("button", { name: "Question 1, incorrect" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page.getByRole("button", { name: "Question 2, correct" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Question 3, incorrect" })).toBeVisible();
    await page.getByRole("button", { name: "Question 3, incorrect" }).click();
    await expect(page).toHaveURL(/\/review\/3$/);
    await expect(page.getByText("Question 3 of 3").first()).toBeVisible();
    await page.getByRole("button", { name: "Question 1, incorrect" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.locator("li[data-state=correct]:visible")).toHaveCount(1);
    await expect(page.locator("li[data-state=correct]:visible")).toContainText("Correct answer");
    await expect(page.locator("li[data-state=chosenWrong]:visible")).toContainText("Your answer");
    await page.getByRole("link", { name: "Next question" }).click();
    await expect(page).toHaveURL(/\/review\/2$/);
    await expect(page.locator("li[data-state=chosenWrong]:visible")).toHaveCount(0);
    await page.getByRole("link", { name: "Previous question" }).click();
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
    await next(page).click();
    await page.locator("fieldset label").first().click();
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
            stepIds: ["s1", "s2"],
            index: 0,
            phase: "decide",
            answers: [{ stepId: "s1", optionId: "b", confidence: 3, explanation: "" }],
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
    await expect(page.getByText("No sessions yet.")).toBeVisible();
    await page.goto("/session/results");
    await expect(page.getByRole("heading", { name: "No results yet" })).toBeVisible();
  });
});

test.describe("the question screen: hint and bookmark", () => {
  const quizSession = {
    kind: "quiz",
    itemIds: ["q-s1-2", "q-s1-1"],
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
    await expect(card).toContainText("Think about what an alarm means");
    await expect(card.getByRole("button", { name: /Guide · S1/ })).toBeVisible();
    // under the options, in the page, not a sheet
    const optionBox = await page.locator("fieldset label").last().boundingBox();
    const cardBox = await card.boundingBox();
    expect(cardBox!.y).toBeGreaterThan(optionBox!.y + optionBox!.height - 1);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await lightbulb.click();
    await expect(card).toBeHidden();
    await lightbulb.click();
    await expect(card).toBeVisible();
    await option(page, S1_RIGHT).click();
    await next(page).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await expect(page.getByRole("region", { name: "Hint" })).toHaveCount(0);
  });

  test("records that a hint was used on the answer", async ({ page }) => {
    await start(page, scenario);
    await page.getByRole("button", { name: "Hint", exact: true }).click();
    await option(page, S1_RIGHT).click();
    await next(page).click();
    await option(page, /Keep it closed/).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.schema).toBe(3);
    const [first, second] = saved.value.answers;
    expect(first).toEqual({ itemId: "s1", optionId: "b", hintUsed: true });
    expect(second.hintUsed).toBeUndefined();
  });

  test("has the hint button left of Next, and Next fills the rest", async ({ page }) => {
    await start(page, scenario);
    const hintBox = await page.getByRole("button", { name: "Hint", exact: true }).boundingBox();
    const nextBox = await next(page).boundingBox();
    expect(Math.round(hintBox!.width)).toBe(52);
    expect(Math.round(hintBox!.height)).toBe(52);
    expect(hintBox!.x + hintBox!.width).toBeLessThan(nextBox!.x);
    expect(Math.round(nextBox!.height)).toBe(52);
    await expect(next(page)).toBeDisabled();
  });

  test("shows a hint (the fallback) on a quiz question too, as Review: the section", async ({
    page,
  }) => {
    await start(page, quizSession);
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
    await expect(next(page)).toBeDisabled();
    await page.getByText("False", { exact: true }).click();
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await expect(finish(page)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next", exact: true })).toHaveCount(0);
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
    expect(stored).toEqual({ schema: 3, value: ["s1"] });
    await page.getByRole("button", { name: "Remove from saved" }).click();
    await expect(page.getByRole("button", { name: "Save question" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Save question" })).toBeVisible();
  });
});

test.describe("session setup", () => {
  test("offers lengths from what the sections hold and starts a session", async ({ page }) => {
    await start(page, null, "/session/setup");
    await expect(page.getByText("YOUR ANSWERS")).toBeVisible();
    await page.getByText("Quiz", { exact: true }).click();
    await expect(page.getByText("30 questions")).toBeVisible();
    await expect(page.getByLabel("Shuffle questions")).toBeVisible();
    await page.getByRole("button", { name: /Guide sections/ }).click();
    await expect(page.getByRole("heading", { name: "Guide sections" })).toBeVisible();
    await page.getByRole("button", { name: "Deselect all" }).click();
    await expect(page.getByRole("button", { name: "Done" })).toBeDisabled();
    await page.getByRole("checkbox", { name: /^S1 / }).check({ force: true });
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText("All 4")).toBeVisible();
    await page.getByRole("button", { name: "Start session" }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Question 1 of 4")).toBeVisible();
  });
});

test.describe("the Results buttons", () => {
  const done = {
    kind: "scenario",
    itemIds: ["s1", "s2", "s3"],
    answers: [
      { itemId: "s1", optionId: "a" },
      { itemId: "s2", optionId: "c" },
      { itemId: "s3", optionId: "a" },
    ],
    index: 2,
    finished: true,
    finishedAt: 5,
  };
  const history = [
    { kind: "scenario", itemIds: done.itemIds, answers: done.answers, finishedAt: 5 },
  ];

  async function results(page: Page, session: object, past: object[], width: number) {
    await page.setViewportSize({ width, height: 800 });
    await page.addInitScript(
      ([p, s, h]) => {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
        localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 2, value: h }));
      },
      [profile, session, past],
    );
    await page.goto("/session/results");
  }

  const review = (page: Page) => page.getByRole("link", { name: "Review answers" });
  const repeat = (page: Page) => page.getByRole("button", { name: "Repeat weak topics" });

  test("stack at 360px: Repeat on top, Review below, both full width, labels on one line", async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    await results(page, done, history, 360);
    const [r, v] = [await repeat(page).boundingBox(), await review(page).boundingBox()];
    expect(r && v).toBeTruthy();
    expect(r!.y).toBeLessThan(v!.y);
    expect(Math.round(r!.width)).toBe(Math.round(v!.width));
    expect(Math.round(r!.width)).toBeGreaterThanOrEqual(326);
    expect(Math.round(r!.height)).toBe(52);
    expect(Math.round(v!.height)).toBe(52);
    expect(Math.round(v!.y - (r!.y + r!.height))).toBe(12);
    await context.close();
  });

  test("sit in one row at 430px: Review on the left, Repeat on the right, equal, one line", async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport: { width: 430, height: 800 } });
    const page = await context.newPage();
    await results(page, done, history, 430);
    const [r, v] = [await repeat(page).boundingBox(), await review(page).boundingBox()];
    expect(r && v).toBeTruthy();
    expect(v!.x).toBeLessThan(r!.x);
    expect(Math.abs(v!.y - r!.y)).toBeLessThan(2);
    expect(Math.abs(v!.width - r!.width)).toBeLessThan(2);
    expect(Math.round(r!.height)).toBe(52);
    expect(Math.round(r!.x - (v!.x + v!.width))).toBe(12);
    await context.close();
  });

  test("show Review answers alone, full width, when the person passed", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    const right = {
      ...done,
      answers: [
        { itemId: "s1", optionId: "b" },
        { itemId: "s2", optionId: "c" },
        { itemId: "s3", optionId: "a" },
      ],
    };
    await results(page, right, [{ ...history[0], answers: right.answers }], 360);
    await expect(page.getByRole("heading", { name: "Passed" })).toBeVisible();
    await expect(repeat(page)).toHaveCount(0);
    const v = await review(page).boundingBox();
    expect(Math.round(v!.width)).toBeGreaterThanOrEqual(326);
    await review(page).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.getByRole("button", { name: "Question 1, correct" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    await context.close();
  });

  test("have a Back arrow that goes Home", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 800 } });
    const page = await context.newPage();
    await results(page, done, history, 360);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await context.close();
  });
});
