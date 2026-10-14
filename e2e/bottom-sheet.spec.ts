import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };
const scenario = {
  mode: "short",
  stepIds: ["s1", "s2", "s3"],
  index: 0,
  phase: "decide",
  answers: [],
  finished: false,
};
const quiz = {
  kind: "quiz",
  mode: "quiz",
  sections: ["S2"],
  questionIds: ["q-s2-1"],
  index: 0,
  phase: "decide",
  answers: [],
  finished: false,
};

async function start(page: Page, session: object) {
  await page.addInitScript(
    ([p, s]) => {
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      localStorage.setItem("ast.session.v1", JSON.stringify(s));
    },
    [profile, session],
  );
  await page.goto("/session");
}

/** Choose an option, rate it, Continue, then send an explanation: the answer sheet opens. */
async function openScenarioSheet(page: Page) {
  await start(page, scenario);
  await page.getByText("Everyone leaves now by the stairs").click();
  await page.getByText("Very confident", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByPlaceholder("Your answer").fill("asdf qwer zxcv");
  await page.getByRole("button", { name: "Send" }).click();
  await page.waitForSelector("dialog[open]");
  await page.waitForTimeout(500); // the slide-up
}

/** The sheet, its scrolling content area and the viewport, measured in the page. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const dialog = document.querySelector("dialog[open]") as HTMLElement;
    const area = dialog.querySelector(".sheet-content") as HTMLElement;
    const box = dialog.getBoundingClientRect();
    return {
      viewport: window.innerHeight,
      top: box.top,
      bottom: box.bottom,
      height: box.height,
      overflowY: getComputedStyle(area).overflowY,
      areaHeight: area.clientHeight,
      areaScrolls: area.scrollHeight > area.clientHeight,
    };
  });
}

test.describe("answer sheet on a phone", () => {
  test("a scenario step: tall enough, scrolls, every block reachable", async ({ page }) => {
    await openScenarioSheet(page);
    const m = await measure(page);
    // (a) at least half of the screen, (e) never taller than the visible viewport
    expect(m.height).toBeGreaterThanOrEqual(m.viewport * 0.5);
    expect(m.top).toBeGreaterThanOrEqual(0);
    expect(m.bottom).toBeLessThanOrEqual(m.viewport + 1);
    // (b) the content area scrolls and "Your choice" is fully visible
    expect(m.overflowY).toBe("auto");
    expect(m.areaHeight).toBeGreaterThan(120);
    const choice = page.locator("dialog[open] h3", { hasText: "Your choice" });
    await expect(choice).toBeInViewport({ ratio: 1 });
    const choiceBox = await page.locator("dialog[open] .sheet-content > div").first().boundingBox();
    expect(choiceBox).not.toBeNull();
    // (c) the last block can be scrolled into view
    const last = page.locator("dialog[open] h3", { hasText: "What happened" });
    await last.scrollIntoViewIfNeeded();
    await expect(last).toBeInViewport({ ratio: 1 });
    // (d) Continue is visible and clickable
    const next = page.locator("dialog[open]").getByRole("button", { name: "Continue" });
    await expect(next).toBeInViewport({ ratio: 1 });
    await next.click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("a short-text quiz question: the same", async ({ page }) => {
    await start(page, quiz);
    await page.getByPlaceholder("A few words").fill("With my knuckles");
    await page.getByRole("button", { name: "Send" }).click();
    await page.waitForSelector("dialog[open]");
    await page.waitForTimeout(500);
    const m = await measure(page);
    expect(m.height).toBeGreaterThanOrEqual(m.viewport * 0.5);
    expect(m.bottom).toBeLessThanOrEqual(m.viewport + 1);
    expect(m.overflowY).toBe("auto");
    await expect(page.locator("dialog[open] h3", { hasText: "Your answer" })).toBeInViewport({
      ratio: 1,
    });
    const why = page.locator("dialog[open] h3", { hasText: "Why" });
    await why.scrollIntoViewIfNeeded();
    await expect(why).toBeInViewport({ ratio: 1 });
    const next = page.locator("dialog[open]").getByRole("button", { name: /Continue|See results/ });
    await expect(next).toBeInViewport({ ratio: 1 });
  });

  test("the Explain screen: prompt, choice and the answer field fit in view", async ({ page }) => {
    await start(page, scenario);
    await page.getByText("Everyone leaves now by the stairs").click();
    await page.getByText("Very confident", { exact: true }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    const prompt = page.getByRole("heading", { name: /why did you choose this/i });
    await expect(prompt).toBeInViewport({ ratio: 1 });
    const field = page.getByPlaceholder("Your answer");
    await expect(field).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("button", { name: "Send" })).toBeInViewport({ ratio: 1 });
    const viewport = await page.evaluate(() => window.innerHeight);
    const box = await field.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport + 1);
  });
});
