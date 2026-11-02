import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Item = { id: string; hint?: string };
const quiz: Item[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;
const steps: Item[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;

async function open(page: Page, kind: "scenario" | "quiz", ids: string[]) {
  await page.addInitScript(
    ([p, s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
    },
    [
      { direction: "building-evacuation", onboarded: true },
      { kind, itemIds: ids, answers: [], index: 0, finished: false },
    ] as const,
  );
  await page.goto("/session");
}

/** The hint sheet is open (a modal dialog) and stays put. */
async function expectHintShown(page: Page, text: string) {
  const sheet = page.getByRole("dialog", { name: "Hint" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText(text);
  await page.waitForTimeout(400);
  const box = (await sheet.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.waitForTimeout(300);
  const again = (await sheet.boundingBox())!;
  expect(Math.abs(again.y - box.y)).toBeLessThanOrEqual(1);
}

test.describe("Hint with a finger (tap, not click)", () => {
  test("a tap on the lightbulb shows the hint on a scenario step", async ({ page }, info) => {
    test.skip(!info.project.use.hasTouch, "touch projects only");
    const step = steps[0];
    await open(
      page,
      "scenario",
      steps.slice(0, 3).map((s) => s.id),
    );
    const hint = page.getByRole("button", { name: "Hint" });
    const box = (await hint.boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    // nothing covers the button
    const covered = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.getAttribute("aria-label"),
      [box.x + box.width / 2, box.y + box.height / 2],
    );
    expect(covered).toBe("Hint");
    await hint.tap();
    await expectHintShown(page, step.hint!.slice(0, 20));
    // a second tap closes it (the existing toggle)
    await page.getByRole("button", { name: "Got it" }).tap();
    await expect(page.getByRole("dialog", { name: "Hint" })).toHaveCount(0);
  });

  test("a tap on the lightbulb shows the hint on a quiz question", async ({ page }, info) => {
    test.skip(!info.project.use.hasTouch, "touch projects only");
    const question = quiz.find((q) => q.hint)!;
    await open(page, "quiz", [question.id, quiz[1].id]);
    await page.getByRole("button", { name: "Hint" }).tap();
    await expectHintShown(page, question.hint!.slice(0, 20));
  });
});
