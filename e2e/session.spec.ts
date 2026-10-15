import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };
const scenario = {
  mode: "short",
  stepIds: ["s1", "s2", "s3"],
  index: 0,
  answers: [],
  finished: false,
};
const quiz = {
  kind: "quiz",
  mode: "quiz",
  sections: ["S1"],
  questionIds: ["q-s1-1", "q-s1-2"],
  index: 0,
  answers: [],
  finished: false,
};

async function start(page: Page, session: object) {
  await page.addInitScript(
    ([p, s]) => {
      // Set once, so a reload keeps whatever the page saved since.
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      localStorage.setItem("ast.session.v1", JSON.stringify(s));
    },
    [profile, session],
  );
  await page.goto("/session");
}

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true });
const finish = (page: Page) => page.getByRole("button", { name: "Finish", exact: true });

/** Chooses an option of the sample scenario's step 1 (b is the right one) and rates it. */
async function answerStep(page: Page, option: string, explanation = "") {
  await page.getByText(option).click();
  await page.getByText("Very confident", { exact: true }).click();
  if (explanation) await page.getByLabel(/Explain your choice/).fill(explanation);
}

const RIGHT = "Everyone leaves now by the stairs";
const WRONG = "Stay where you are until the alarm is confirmed as real.";

test.describe("a running session", () => {
  test("shows no verdict, and Next waits for an option and a confidence", async ({ page }) => {
    await start(page, scenario);
    await expect(next(page)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Previous step" })).toHaveCount(0);
    await page.getByText(RIGHT).click();
    await expect(next(page)).toBeDisabled();
    await page.getByText("Very confident", { exact: true }).click();
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Correct|Incorrect|Matches the guide|Better explanation/);
    expect(body).not.toMatch(/\bAI\b|\bbot\b/i);
  });

  test("has the step strip: states, jump and no right or wrong", async ({ page }) => {
    await start(page, scenario);
    await answerStep(page, RIGHT);
    await next(page).click();
    await expect(page.getByRole("button", { name: "Step 1, answered" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Step 2, current" })).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page.getByRole("button", { name: "Step 3, not answered" })).toBeVisible();
    await page.getByRole("button", { name: "Step 3, not answered" }).click();
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    await expect(page.getByRole("button", { name: "Step 3, current" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Step 2, not answered" })).toBeVisible();
  });

  test("fills the answer in again after Back, and a changed answer is saved", async ({ page }) => {
    await start(page, scenario);
    await answerStep(page, RIGHT, "The alarm is real, so we leave.");
    await next(page).click();
    await page.getByRole("button", { name: "Previous step" }).click();
    await expect(page.getByText("Step 1 of 3")).toBeVisible();
    await expect(page.getByLabel(RIGHT)).toBeChecked();
    await expect(page.getByLabel("Very confident", { exact: true })).toBeChecked();
    await expect(page.getByLabel(/Explain your choice/)).toHaveValue(
      "The alarm is real, so we leave.",
    );
    await page.getByText(WRONG).click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.answers).toHaveLength(1);
    expect(saved.answers[0].optionId).toBe("a");
    expect(saved.answers[0].explanation).toBe("The alarm is real, so we leave.");
  });

  test("asks before leaving and keeps the progress", async ({ page }) => {
    await start(page, scenario);
    await answerStep(page, RIGHT);
    await page.getByRole("button", { name: "Exit" }).click();
    await expect(page.getByRole("heading", { name: "Leave this session?" })).toBeVisible();
    await page.getByRole("button", { name: "Stay" }).click();
    await expect(page.getByRole("heading", { name: "Leave this session?" })).toBeHidden();
    await expect(page).toHaveURL(/\/session$/);
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave" }).click();
    await expect(page).toHaveURL(/\/$/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.finished).toBe(false);
    expect(saved.answers).toHaveLength(1);
  });

  test("finishes into Results with the final answers, a review and the marked explanation", async ({
    page,
  }) => {
    await start(page, scenario);
    // Step 1: first the wrong option, then back to change it to the right one.
    await answerStep(page, WRONG, "лбтдлюью");
    await next(page).click();
    await page.getByRole("button", { name: "Previous step" }).click();
    await page.getByText(RIGHT).click();
    await next(page).click();
    // Steps 2 and 3: any option.
    await page.locator("fieldset label").nth(2).click();
    await page.getByText("Very confident", { exact: true }).click();
    await next(page).click();
    await page.locator("fieldset label").nth(1).click();
    await page.getByText("Very confident", { exact: true }).click();
    await expect(finish(page)).toBeEnabled();
    await finish(page).click();

    await expect(page).toHaveURL(/\/session\/results$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Passed|Not passed yet/);
    await expect(page.getByText("Pass mark 80%")).toBeVisible();
    await expect(page.getByText("Outcome")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Your answers" })).toBeVisible();

    // The first answer is the changed one, with the unmatched explanation still there.
    await page.getByRole("link", { name: /The alarm sounds/ }).click();
    await expect(page).toHaveURL(/\/review\/1$/);
    await expect(page.getByText(RIGHT).first()).toBeVisible();
    await expect(page.getByText("Doesn't match the guide yet")).toBeVisible();
    await expect(page.getByText("Better explanation")).toBeVisible();
    await page.getByRole("button", { name: "My explanation is still correct" }).click();
    await expect(page.getByText("Marked as correct by you")).toBeVisible();
    await page.reload();
    await expect(page.getByText("Marked as correct by you")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(
      page.getByRole("button", { name: "My explanation is still correct" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "Back to results" }).last().click();
    await expect(page).toHaveURL(/\/session\/results$/);
  });
});

test.describe("a running quiz", () => {
  test("has letters, waits for an answer and ends in Results", async ({ page }) => {
    await start(page, quiz);
    await expect(page.getByText("Question 1 of 2")).toBeVisible();
    await expect(next(page)).toBeDisabled();
    await expect(page.locator("label span", { hasText: /^A$/ })).toBeVisible();
    await page.locator("fieldset label, label").filter({ hasText: /./ }).first().click();
    await expect(next(page)).toBeEnabled();
    await next(page).click();
    await expect(finish(page)).toBeDisabled();
    await page.getByLabel("True").check({ force: true });
    await finish(page).click();
    await expect(page).toHaveURL(/\/session\/results$/);
  });
});
