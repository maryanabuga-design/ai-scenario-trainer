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

/** The hint card is on screen, above the pinned bottom bar, and stays put. */
async function expectHintShown(page: Page, text: string) {
  const card = page.locator('section[aria-label="Hint"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText(text);
  const view = page.viewportSize()!;
  await page.waitForTimeout(500);
  const box = (await card.boundingBox())!;
  const bar = (await page.locator("[data-full-bleed].border-t").last().boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(bar.y + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(view.height);
  // stable: still the same place and still open later
  await page.waitForTimeout(500);
  const again = (await card.boundingBox())!;
  expect(Math.abs(again.y - box.y)).toBeLessThanOrEqual(1);
  await expect(card).toBeVisible();
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
    await expect(hint).toHaveAttribute("aria-expanded", "true");
    await expectHintShown(page, step.hint!.slice(0, 20));
    // a second tap closes it (the existing toggle)
    await hint.tap();
    await expect(page.locator('section[aria-label="Hint"]')).toHaveCount(0);
  });

  test("a tap on the lightbulb shows the hint on a quiz question", async ({ page }, info) => {
    test.skip(!info.project.use.hasTouch, "touch projects only");
    const question = quiz.find((q) => q.hint)!;
    await open(page, "quiz", [question.id, quiz[1].id]);
    await page.getByRole("button", { name: "Hint" }).tap();
    await expectHintShown(page, question.hint!.slice(0, 20));
  });
});
