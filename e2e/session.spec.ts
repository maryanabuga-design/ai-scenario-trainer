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
      if (s)
        localStorage.setItem(
          "ast.session.v1",
          JSON.stringify({ schema: 2, value: s }),
        );
    },
    [profile, session],
  );
  await page.goto(path);
}

const next = (page: Page) =>
  page.getByRole("button", { name: "Next", exact: true });
const finish = (page: Page) =>
  page.getByRole("button", { name: "Finish", exact: true });
const option = (page: Page, text: string | RegExp) =>
  page.locator("label", { hasText: text });

// s1: b is right; s2: c; s3: a.
const S1_RIGHT = "Everyone leaves now by the stairs";
const S1_WRONG = "Stay where you are until the alarm is confirmed as real.";

test.describe("a running session", () => {
  test("has the top row, the strip and a single Next button, with no verdict", async ({
    page,
  }) => {
    await start(page, scenario);
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Exit" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Leave this session" }),
    ).toBeVisible();
    await expect(next(page)).toBeDisabled();
    // Back is in the top row only: nothing next to Next.
    await expect(
      page.getByRole("button", { name: "Previous step" }),
    ).toHaveCount(0);
    await option(page, S1_RIGHT).click();
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Previous step" }),
    ).toHaveCount(1);
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Correct|Incorrect|Your answer|Why/);
    expect(body).not.toMatch(/\bAI\b|\bbot\b/i);
    expect(body).not.toMatch(/How sure|confident|Explain your choice/i);
  });

  test("has a strip that shows answered, current and unanswered, and jumps", async ({
    page,
  }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await next(page).click();
    await expect(
      page.getByRole("button", { name: "Step 1, answered" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 2, current" }),
    ).toHaveAttribute("aria-current", "step");
    await expect(
      page.getByRole("button", { name: "Step 3, not answered" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Step 3, not answered" }).click();
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Step 2, not answered" }),
    ).toBeVisible();
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
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ast.session.v1")!),
    );
    expect(saved.schema).toBe(4);
    expect(saved.value.answers).toEqual([{ itemId: "s1", optionId: "a" }]);
  });

  test("asks before leaving, from Exit and from Back on the first step, and keeps the answers", async ({
    page,
  }) => {
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await page.getByRole("button", { name: "Leave this session" }).click();
    await expect(
      page.getByRole("heading", { name: "Leave this session?" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Stay" }).click();
    await expect(
      page.getByRole("heading", { name: "Leave this session?" }),
    ).toBeHidden();
    await expect(page).toHaveURL(/\/session$/);
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ast.session.v1")!),
    );
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
    await expect(
      page.getByRole("heading", { name: "Not passed yet" }),
    ).toBeVisible();
    await expect(page.getByText("PASS MARK: 80%")).toBeVisible();
    await expect(page.getByText("33%")).toBeVisible();
    await expect(page.getByText("Your answers")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Back to Home", exact: true }),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Back to Home" }),
    ).toHaveCount(0);
    await expect(page.getByText(/Error types|Outcome/)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Repeat weak topics" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Review answers" }),
    ).toBeVisible();

    // (B) Review answers → Answer review → Previous / Next → Back to results.
    await page.getByRole("link", { name: "Review answers" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.getByText("Question 1 of 3")).toBeVisible();
    // The strip marks every question right or wrong and jumps.
    await expect(
      page.getByRole("button", { name: "Question 1, incorrect" }),
    ).toHaveAttribute("aria-current", "step");
    await expect(
      page.getByRole("button", { name: "Question 2, correct" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Question 3, incorrect" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Question 3, incorrect" }).click();
    await expect(page).toHaveURL(/\/review\/3$/);
    await expect(page.getByText("Question 3 of 3").first()).toBeVisible();
    await page.getByRole("button", { name: "Question 1, incorrect" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.locator("li[data-state=correct]:visible")).toHaveCount(1);
    await expect(page.locator("li[data-state=correct]:visible")).toContainText(
      "Correct answer",
    );
    await expect(
      page.locator("li[data-state=chosenWrong]:visible"),
    ).toContainText("Your answer");
    await page.getByRole("link", { name: "Next question" }).click();
    await expect(page).toHaveURL(/\/review\/2$/);
    await expect(
      page.locator("li[data-state=chosenWrong]:visible"),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Previous question" }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await page
      .getByRole("link", { name: "Back to results", exact: true })
      .last()
      .click();
    await expect(page).toHaveURL(/\/session\/results$/);

    // (A) Weak topics → choose → Repeat selected → repeat round → Results.
    await page
      .getByRole("link", { name: /Weak topics/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/weak-topics\?from=results$/);
    await expect(
      page.getByRole("button", { name: /Repeat selected/ }),
    ).toContainText("2");
    await page.getByRole("button", { name: /Repeat selected/ }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Question 1 of 2")).toBeVisible();
    await option(page, S1_RIGHT).click();
    await next(page).click();
    await page
      .locator("fieldset[aria-labelledby^=question-] label:visible")
      .first()
      .click();
    await finish(page).click();
    await expect(page).toHaveURL(/\/session\/results$/);
    await expect(page.getByText("Repeat round", { exact: true })).toBeVisible();
  });

  test("ignores a session saved by an older version, without crashing", async ({
    page,
  }) => {
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
            answers: [
              { stepId: "s1", optionId: "b", confidence: 3, explanation: "" },
            ],
            finished: false,
          }),
        );
        localStorage.setItem(
          "ast.history.v1",
          JSON.stringify([{ mode: "short", answers: [] }]),
        );
      },
      [profile],
    );
    await page.goto("/session");
    await expect(
      page.getByRole("heading", { name: "No session in progress" }),
    ).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/progress");
    await expect(page.getByText("No sessions yet.")).toBeVisible();
    await page.goto("/session/results");
    await expect(
      page.getByRole("heading", { name: "No results yet" }),
    ).toBeVisible();
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
    await expect(
      card.getByRole("button", { name: /Guide · S1/ }),
    ).toBeVisible();
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
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ast.session.v1")!),
    );
    expect(saved.schema).toBe(4);
    const [first, second] = saved.value.answers;
    expect(first).toEqual({ itemId: "s1", optionId: "b", hintUsed: true });
    expect(second.hintUsed).toBeUndefined();
  });

  test("has the hint button left of Next, and Next fills the rest", async ({
    page,
  }) => {
    await start(page, scenario);
    const hintBox = await page
      .getByRole("button", { name: "Hint", exact: true })
      .boundingBox();
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
    await expect(page.getByRole("region", { name: "Hint" })).toContainText(
      "Review:",
    );
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
    await expect(
      page.getByRole("button", { name: "Next", exact: true }),
    ).toHaveCount(0);
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
    await expect(
      page.getByRole("button", { name: "Remove from saved" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Remove from saved" }),
    ).toBeVisible();
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ast.saved.v1")!),
    );
    expect(stored).toEqual({ schema: 4, value: ["s1"] });
    await page.getByRole("button", { name: "Remove from saved" }).click();
    await expect(
      page.getByRole("button", { name: "Save question" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Save question" }),
    ).toBeVisible();
  });
});

test.describe("saved questions", () => {
  test("is reachable from the Home tile, empty at first, with no Repeat saved", async ({
    page,
  }) => {
    await start(page, null, "/");
    await page.getByRole("link", { name: /Saved questions/ }).click();
    await expect(page).toHaveURL(/\/saved$/);
    await expect(
      page.getByRole("heading", { name: "Saved questions" }),
    ).toBeVisible();
    await expect(page.getByText("No saved questions yet.")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Repeat saved/ }),
    ).toHaveCount(0);
  });

  test("lists a saved question, opens it, removes it, and repeats the saved ones", async ({
    page,
  }) => {
    await start(page, scenario);
    await page.getByRole("button", { name: "Save question" }).click();
    await option(page, S1_RIGHT).click();
    await next(page).click();
    await page.getByRole("button", { name: "Save question" }).click();
    await page.goto("/saved");
    await expect(
      page.getByRole("link", { name: /What is your first instruction/ }),
    ).toBeVisible();
    await expect(page.locator("main li:visible")).toHaveCount(2);
    await expect(
      page.getByRole("button", { name: /Repeat saved/ }),
    ).toContainText("2");

    // One saved question on its own: all options, the correct one marked, Why, bookmark.
    await page
      .getByRole("link", { name: /What is your first instruction/ })
      .click();
    await expect(page).toHaveURL(/\/saved\/s1$/);
    await expect(page.locator("li[data-state=correct]:visible")).toContainText(
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
    await expect(finish(page)).toBeDisabled();
  });

  test("has the bookmark on the Answer review too", async ({ page }) => {
    await start(
      page,
      {
        ...scenario,
        answers: [
          { itemId: "s1", optionId: "a" },
          { itemId: "s2", optionId: "c" },
          { itemId: "s3", optionId: "b" },
        ],
        finished: true,
        finishedAt: 5,
      },
      "/session/results/review/1",
    );
    await page.getByRole("button", { name: "Save question" }).click();
    await expect(
      page.getByRole("button", { name: "Remove from saved" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Remove from saved" }),
    ).toBeVisible();
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
        if (s)
          localStorage.setItem(
            "ast.session.v1",
            JSON.stringify({ schema: 3, value: s }),
          );
        if (h)
          localStorage.setItem(
            "ast.history.v1",
            JSON.stringify({ schema: 3, value: h }),
          );
      },
      [profile, session, past ?? null],
    );
    await page.goto("/");
  }

  test("starts training on a first visit, with 0% readiness, the tiles and no Progress numbers", async ({
    page,
  }) => {
    await home(page, null);
    await expect(
      page.getByRole("heading", { name: "Hi, Maryana" }),
    ).toBeVisible();
    await expect(
      page.getByText("Start with your first scenario."),
    ).toBeVisible();
    await expect(page.getByText("Today: 0/5 questions")).toBeVisible();
    await expect(page.getByText("Start training")).toBeVisible();
    await expect(page.getByText("Choose a scenario or a quiz")).toBeVisible();
    await expect(page.getByRole("img", { name: "Readiness 0%" })).toBeVisible();
    for (const text of [
      "2 scenarios",
      "43 questions",
      "Nothing to repeat",
      "0 saved",
      "3 checklists",
    ]) {
      await expect(page.getByText(text)).toBeVisible();
    }
    await expect(
      page.getByText(/Average result|Session history|Sessions/),
    ).toHaveCount(0);
    await page.getByRole("link", { name: /Start training/ }).click();
    await expect(page).toHaveURL(/\/training$/);
    await expect(page.getByRole("heading", { name: "Training" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Saved questions \(/ }),
    ).toHaveCount(0);
  });

  test("continues an unfinished session at the right question", async ({
    page,
  }) => {
    await home(page, {
      ...scenario,
      answers: [{ itemId: "s1", optionId: "b" }],
      index: 1,
    });
    await expect(page.getByText("Continue", { exact: true })).toBeVisible();
    await expect(page.getByText("Scenario · Question 2 of 3")).toBeVisible();
    await page.getByRole("link", { name: /Continue/ }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
  });

  test("updates readiness after a finished session", async ({ page }) => {
    await home(
      page,
      null,
      history([
        { itemId: "s1", optionId: "b" },
        { itemId: "s2", optionId: "c" },
        { itemId: "q-s1-1", optionId: "b" },
      ]),
    );
    // 3 right of 43 questions in the guide's sections: 6%.
    await expect(page.getByRole("img", { name: "Readiness 6%" })).toBeVisible();
  });

  test("shows the sections to repeat after a wrong answer, and opens Weak topics", async ({
    page,
  }) => {
    await home(page, null, history([{ itemId: "s1", optionId: "a" }]));
    await expect(page.getByText("1 section to repeat")).toBeVisible();
    await page.getByRole("link", { name: /Weak topics/ }).click();
    await expect(page).toHaveURL(/\/weak-topics$/);
  });

  test("repeats weak topics from the big card after a wrong answer", async ({
    page,
  }) => {
    await home(page, null, history([{ itemId: "s1", optionId: "a" }]));
    await expect(page.getByText("1 topic needs another look.")).toBeVisible();
    await page.getByRole("link", { name: /Repeat weak topics/ }).click();
    await expect(page).toHaveURL(/\/weak-topics$/);
  });

  test("starts the next part from the big card when nothing is weak", async ({
    page,
  }) => {
    await home(page, null, history([{ itemId: "s1", optionId: "b" }]));
    await expect(
      page.getByText(/\d more questions? to reach today's goal\./),
    ).toBeVisible();
    await page.getByRole("button", { name: /Next: / }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(
      page
        .getByText(/(Question|Step) 1 of \d/)
        .filter({ visible: true })
        .first(),
    ).toBeVisible();
  });

  test("sends each tile to its screen (Training in the right mode)", async ({
    page,
  }) => {
    await home(page, null);
    await page.getByRole("link", { name: /Scenarios/ }).click();
    await expect(page).toHaveURL(/\/training\?mode=scenario/);
    await expect(page.getByRole("radio", { name: "Scenario" })).toBeChecked();
    await expect(
      page.getByText("Mini-quiz").filter({ visible: true }),
    ).toHaveCount(0);
    await page.goBack();
    await page.getByRole("link", { name: /^Quiz/ }).click();
    await expect(page).toHaveURL(/mode=quiz/);
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
    await expect(page.getByRole("link", { name: /Mini-quiz/ })).toBeVisible();
    await page.goto("/");
    await page.getByRole("link", { name: /Saved questions/ }).click();
    await expect(page).toHaveURL(/\/saved$/);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await page.getByRole("link", { name: /^Guide/ }).click();
    await expect(page).toHaveURL(/\/materials$/);
  });

  test("opens the Mini-quiz screen from the Home row", async ({ page }) => {
    await home(page, null);
    await page.getByRole("link", { name: /Mini-quiz/ }).click();
    await expect(page).toHaveURL(/\/mini-quiz\?from=home$/);
    await expect(
      page.getByRole("heading", { name: "Mini-quiz" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("opens the Quick checklists, a checklist, and goes back step by step", async ({
    page,
  }) => {
    await home(page, null);
    await page.getByRole("link", { name: /Quick checklists/ }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    await expect(
      page.getByRole("heading", { name: "Quick checklists" }),
    ).toBeVisible();
    await expect(page.locator("main li:visible")).toHaveCount(3);
    await page.getByRole("link", { name: /Severe bleeding/ }).click();
    await expect(page).toHaveURL(/\/checklists\/severe-bleeding$/);
    await expect(page.locator("main ol li:visible")).toHaveCount(6);
    await page.getByRole("link", { name: "Back to checklists" }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe("Training", () => {
  async function open(
    page: Page,
    path = "/training",
    past?: object[],
    session?: object | null,
  ) {
    await page.addInitScript(
      ([p, h, s]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        if (h)
          localStorage.setItem(
            "ast.history.v1",
            JSON.stringify({ schema: 4, value: h }),
          );
        if (s)
          localStorage.setItem(
            "ast.session.v1",
            JSON.stringify({ schema: 4, value: s }),
          );
      },
      [profile, past ?? null, session ?? null],
    );
    await page.goto(path);
  }

  test("shows the stats, the switch, the topic cards and no settings", async ({
    page,
  }) => {
    await open(page);
    await expect(page.getByText("0/10")).toBeVisible();
    await expect(page.getByText("0%", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("radio", { name: "Scenario" })).toBeChecked();
    await expect(page.locator("section[aria-labelledby^=topic-]")).toHaveCount(
      5,
    );
    await expect(page.getByRole("button", { name: "Start" })).toHaveCount(5);
    await expect(
      page.getByText(/Shuffle|Only topics|Guide sections/),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("switches the mode, updates the whole list and remembers the mode", async ({
    page,
  }) => {
    await open(page);
    await page.getByText("Quiz", { exact: true }).click();
    await expect(page.getByText("0/33")).toBeVisible();
    await expect(page.locator("section[aria-labelledby^=topic-]")).toHaveCount(
      10,
    );
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
    await expect(
      page.getByRole("heading", { name: "Mini-quiz" }),
    ).toBeVisible();
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
    await expect(page.getByText("Question 1 of 4").first()).toBeVisible();
    await expect(
      page.getByText("Responding to an alarm").first(),
    ).toBeVisible();
    const started = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ast.session.v1")!),
    );
    expect(started.value.partId).toBe("quiz:S1:1");
    expect(started.value.itemIds).toEqual([
      "q-s1-1",
      "q-s1-2",
      "q-s1-3",
      "q-s1-4",
    ]);

    // Leaving midway changes nothing in the stats: only a finished session counts.
    await option(page, /As real until/).click();
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await page.goto("/training?mode=quiz");
    await expect(page.getByText("0/33")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(1);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText("Question 1 of 4").first()).toBeVisible();

    // Finish the part: answer every question (the first option) and finish.
    for (let n = 0; n < 4; n++) {
      await page
        .locator("fieldset[aria-labelledby^=question-] label:visible")
        .first()
        .click();
      await (n < 3 ? next(page) : finish(page)).click();
    }
    await expect(page).toHaveURL(/\/session\/results$/);
    await page.getByRole("link", { name: "Back to Training" }).click();
    await expect(page).toHaveURL(/\/training\?mode=quiz$/);
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
    await expect(page.getByText("4/33")).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Part 1: last result \d+%/ }).first(),
    ).toBeVisible();
    await expect(
      page.locator("section[aria-labelledby=topic-S1] [data-pill]"),
    ).toHaveCount(0);
    await expect(page.getByText(/\d to repeat/).first()).toBeVisible();
  });

  test("shows the rose chip only after wrong answers", async ({ page }) => {
    await open(page, "/training?mode=quiz", [
      {
        kind: "quiz",
        itemIds: ["q-s1-1", "q-s2-1"],
        answers: [
          { itemId: "q-s1-1", optionId: "a" },
          { itemId: "q-s2-1", optionId: "b" },
        ],
        finishedAt: 1,
      },
    ]);
    await expect(page.getByText("1 to repeat")).toHaveCount(1);
    await expect(
      page.locator("section[aria-labelledby=topic-S1]"),
    ).toContainText("1 to repeat");
    await expect(
      page.locator("section[aria-labelledby=topic-S2]"),
    ).not.toContainText("to repeat");
  });

  test("Home resumes an unfinished part, and Start training opens Training", async ({
    page,
  }) => {
    await open(page, "/", undefined, {
      kind: "quiz",
      itemIds: ["q-s1-1", "q-s1-2", "q-s1-3", "q-s1-4"],
      answers: [{ itemId: "q-s1-1", optionId: "b" }],
      index: 1,
      finished: false,
      partId: "quiz:S1:1",
    });
    await expect(page.getByText("Quiz · Question 2 of 4")).toBeVisible();
    await page.getByRole("link", { name: /Continue/ }).click();
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
        if (h)
          localStorage.setItem(
            "ast.history.v1",
            JSON.stringify({ schema: 4, value: h }),
          );
      },
      [profile, past ?? null],
    );
    await page.goto(path);
  }
  const amounts = (page: Page) => page.locator("fieldset input[type=radio]");

  test("selects every topic and the largest amount by default", async ({
    page,
  }) => {
    await open(page, "/mini-quiz?from=training");
    await expect(
      page.getByText("Pick topics and how many questions"),
    ).toBeVisible();
    await expect(page.locator("input[name=mini-topics]:checked")).toHaveCount(
      10,
    );
    await expect(amounts(page)).toHaveCount(3);
    await expect(page.getByLabel("15", { exact: true })).toBeChecked();
    await expect(
      page.getByText("33 questions available in your selected topics"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Start mini-quiz" }),
    ).toBeEnabled();
  });

  test("follows the topics: options and the line change, none disables Start", async ({
    page,
  }) => {
    await open(page, "/mini-quiz?from=training");
    await page.getByRole("button", { name: "Deselect all" }).click();
    await expect(
      page.getByRole("button", { name: "Start mini-quiz" }),
    ).toBeDisabled();
    await expect(
      page.getByText("Select at least one topic").first(),
    ).toBeVisible();
    await expect(amounts(page)).toHaveCount(0);
    await expect(
      page.getByText("0 questions available in your selected topics"),
    ).toBeVisible();
    await page.getByText("Responding to an alarm").click();
    await expect(
      page.getByText("4 questions available in your selected topics"),
    ).toBeVisible();
    await expect(amounts(page)).toHaveCount(1);
    await expect(page.getByText("All 4")).toBeVisible();
    await page.getByText("Checking the route").click();
    await expect(
      page.getByText("7 questions available in your selected topics"),
    ).toBeVisible();
    await expect(amounts(page)).toHaveCount(1);
    await expect(page.getByText("5", { exact: true })).toBeVisible();
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
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ast.session.v1")!),
    );
    const ids: string[] = stored.value.itemIds;
    expect(ids).toHaveLength(10);
    expect(new Set(ids).size).toBe(10);
    ids.forEach((id) => expect(id).toMatch(/^q-s[123]-/));
    expect(stored.value.partId).toBeUndefined();
    expect(stored.value.returnTo).toBe("/training?mode=quiz");
  });

  test("counts toward the stats but not the part rings, and Back goes to where it started", async ({
    page,
  }) => {
    await open(page, "/mini-quiz?from=training");
    await page.getByRole("button", { name: "Start mini-quiz" }).click();
    for (let n = 0; n < 15; n++) {
      await page
        .locator("fieldset[aria-labelledby^=question-] label:visible")
        .first()
        .click();
      await (n < 14 ? next(page) : finish(page)).click();
    }
    await expect(page).toHaveURL(/\/session\/results$/);
    await page.getByRole("link", { name: "Back to Training" }).click();
    await expect(page).toHaveURL(/\/training\?mode=quiz$/);
    await expect(page.getByText("15/33")).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Part \d: last result/ }),
    ).toHaveCount(0);
    await expect(page.locator("[data-pill]")).toHaveCount(10);
  });

  test("goes back to Home from Results when it was started from Home", async ({
    page,
  }) => {
    await open(page, "/mini-quiz?from=home");
    await page.getByLabel("5", { exact: true }).check({ force: true });
    await page.getByRole("button", { name: "Start mini-quiz" }).click();
    for (let n = 0; n < 5; n++) {
      await page
        .locator("fieldset[aria-labelledby^=question-] label:visible")
        .first()
        .click();
      await (n < 4 ? next(page) : finish(page)).click();
    }
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole("img", { name: /Readiness \d+%/ }),
    ).toBeVisible();
  });
});
