import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };
const scenario = {
  kind: "scenario",
  itemIds: ["q-scn-s01-001", "s2", "s3"],
  answers: [],
  index: 0,
  finished: false,
};
// s1: b is right ("Stop the session…"), a is wrong
const S1_RIGHT = "Stop the session, tell everyone to leave now";
const S1_WRONG = "Tell everyone it is probably a test and carry on while you check.";

async function start(page: Page, session: object, path = "/session") {
  await page.addInitScript(
    ([p, s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
    },
    [profile, session],
  );
  await page.goto(path);
}

const next = (page: Page) => page.getByRole("button", { name: "Next", exact: true });
const check = (page: Page) => page.getByRole("button", { name: "Check", exact: true });
const option = (page: Page, text: string | RegExp) => page.locator("label", { hasText: text });
const feedback = (page: Page) => page.locator("[data-bottom-sheet=feedback]");
/** The sheet slides up in 200 ms: measure it when it has arrived. */
const settled = (page: Page) => page.waitForTimeout(400);
const hintSheet = (page: Page) => page.getByRole("dialog", { name: "Hint" });
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const optionBoxes = async (page: Page) => {
  await expect(page.locator("fieldset label")).toHaveCount(3);
  return page.locator("fieldset label").evaluateAll((labels) =>
    labels.map((label) => {
      const { x, y, width, height } = label.getBoundingClientRect();
      return [x, y + window.scrollY, width, height].map(Math.round);
    }),
  );
};

for (const width of [360, 430]) {
  test.describe(`Practice sheets at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("Check is disabled until an option is picked, then the sheet opens and the options lock without moving", async ({
      page,
    }) => {
      await start(page, scenario);
      await expect(check(page)).toBeDisabled();
      await option(page, S1_WRONG).click();
      await expect(check(page)).toBeEnabled();
      const before = await optionBoxes(page);
      const heading = await page.getByRole("heading", { level: 1 }).boundingBox();
      await check(page).click();
      await expect(feedback(page)).toBeVisible();
      // nothing above the sheet moved or changed size, and nothing was inserted
      expect(await optionBoxes(page)).toEqual(before);
      expect(await page.getByRole("heading", { level: 1 }).boundingBox()).toEqual(heading);
      await expect(page.getByRole("region", { name: "Why" })).toHaveCount(0);
      // locked, olive (not red or green)
      for (const radio of await page.locator("fieldset input[type=radio]").all()) {
        await expect(radio).toBeDisabled();
        await expect(radio).toHaveAttribute("aria-disabled", "true");
      }
      await expect(page.locator("label[data-state=selected]")).toHaveCount(1);
      await expect(page.locator("label[data-state=correct], label[data-state=wrong]")).toHaveCount(
        0,
      );
      const chosen = page.locator("label[data-state=selected]");
      expect(await chosen.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe(
        await page.locator("html").evaluate(() => {
          const probe = document.createElement("i");
          probe.style.color = "var(--primary)";
          document.body.append(probe);
          const colour = getComputedStyle(probe).color;
          probe.remove();
          return colour;
        }),
      );
      // the pinned bar is covered: its Check and the hint button cannot be reached
      await expect(check(page)).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Hint", exact: true })).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("correct: Correct, the explanation, only Next; no scrim; focus on Next and a status for screen readers", async ({
      page,
    }) => {
      await start(page, scenario);
      await option(page, S1_RIGHT).click();
      await check(page).click();
      const sheet = feedback(page);
      await expect(sheet).toHaveAttribute("data-tone", "correct");
      await expect(sheet.getByRole("heading", { name: "Correct" })).toBeVisible();
      await expect(sheet).not.toContainText("Correct answer:");
      // one Primary and the Guide chip (a chip, not a Secondary button)
      await expect(sheet.getByRole("button", { name: "Next" })).toBeVisible();
      await expect(sheet.getByRole("button", { name: "Review the guide" })).toHaveCount(0);
      await expect(sheet.getByRole("button", { name: /^Guide · S1/ })).toBeVisible();
      await expect(sheet.getByRole("status")).toHaveText("Correct");
      await expect(sheet.getByRole("button", { name: "Next" })).toBeFocused();
      await expect(page.locator("[data-sheet-scrim]")).toHaveCount(0);
      // the question and the options stay visible above the sheet
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await sheet.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("1px");
      expect(await sheet.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("20px");
    });

    test("not right: Not quite, the correct answer, the explanation, the Guide chip above Next, and the chip opens the guide", async ({
      page,
    }) => {
      await start(page, scenario);
      await option(page, S1_WRONG).click();
      await check(page).click();
      const sheet = feedback(page);
      await settled(page);
      await expect(sheet).toHaveAttribute("data-tone", "wrong");
      await expect(sheet.getByRole("heading", { name: "Not quite" })).toBeVisible();
      await expect(sheet).toContainText(`Correct answer: ${S1_RIGHT}`);
      await expect(sheet.getByRole("status")).toContainText(
        `Not quite. The correct answer is: ${S1_RIGHT}`,
      );
      const review = sheet.getByRole("button", { name: /^Guide · S1/ });
      await expect(sheet.getByRole("button", { name: "Review the guide" })).toHaveCount(0);
      const nextButton = sheet.getByRole("button", { name: "Next" });
      const reviewBox = (await review.boundingBox())!;
      const nextBox = (await nextButton.boundingBox())!;
      expect(reviewBox.y + reviewBox.height).toBeLessThanOrEqual(nextBox.y);
      expect(Math.round(nextBox.height)).toBe(52);
      // the Primary is the lowest button and stays in view
      expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(800);
      await review.click();
      await expect(page.locator("dialog[open]")).toContainText("Guide · S1");
      await page.keyboard.press("Escape");
      await expect(page.locator("dialog[open]")).toHaveCount(0);
    });

    test("Next opens the next question and moves the focus to its heading", async ({ page }) => {
      await start(page, scenario);
      await option(page, S1_RIGHT).click();
      await check(page).click();
      await next(page).click();
      await expect(page.getByText("Step 2 of 3")).toBeVisible();
      await expect(feedback(page)).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
      await expect(check(page)).toBeDisabled();
    });

    test("the last question says See results and opens the results", async ({ page }) => {
      await start(page, { ...scenario, itemIds: ["s3"] });
      await option(page, /./).first().click();
      await check(page).click();
      await expect(feedback(page).getByRole("button", { name: "See results" })).toBeVisible();
      await expect(feedback(page).getByRole("button", { name: "Next" })).toHaveCount(0);
      await feedback(page).getByRole("button", { name: "See results" }).click();
      await expect(page).toHaveURL(/\/session\/results/);
    });

    test("true or false uses the same sheet", async ({ page }) => {
      await start(page, {
        kind: "quiz",
        itemIds: ["q-quiz-s01-002", "q-quiz-s01-001"],
        answers: [],
        index: 0,
        finished: false,
      });
      await expect(page.locator("fieldset input[type=radio]")).toHaveCount(2);
      await page.getByText("False", { exact: true }).click();
      await check(page).click();
      const sheet = feedback(page);
      await expect(sheet).toBeVisible();
      await expect(sheet.getByRole("heading")).toHaveText(/Correct|Not quite/);
      await expect(sheet.getByRole("button", { name: "Next" })).toBeVisible();
    });

    test("without a picture file nothing is drawn: no placeholder, no gap, the text uses the full width", async ({
      page,
    }) => {
      await start(page, scenario);
      await option(page, S1_WRONG).click();
      await check(page).click();
      await settled(page);
      const sheet = feedback(page);
      await expect(sheet.locator("[data-sheet-picture]")).toBeHidden();
      await expect(sheet.locator("[data-sheet-picture=placeholder], svg.lucide-x")).toHaveCount(0);
      // the title starts at the gutter, the same place as the buttons: nothing sits to its left
      const title = (await sheet.getByRole("heading", { name: "Not quite" }).boundingBox())!;
      const primary = (await sheet.getByRole("button", { name: "Next" }).boundingBox())!;
      expect(Math.abs(title.x - primary.x)).toBeLessThanOrEqual(1);
    });

    test("with a picture file the slot shows it with an empty alt text", async ({ page }) => {
      const picture = readFileSync("public/images/entry/entry-profile.webp");
      await page.route("**/images/student/*.webp", (route) =>
        route.fulfill({ contentType: "image/webp", body: picture }),
      );
      await start(page, scenario);
      await option(page, S1_RIGHT).click();
      await check(page).click();
      const slot = feedback(page).locator("[data-sheet-picture]");
      await expect(slot).toBeVisible();
      await expect(slot).toHaveAttribute("alt", "");
      const box = (await slot.boundingBox())!;
      expect([Math.round(box.width), Math.round(box.height)]).toEqual([72, 72]);
      // the text sits to the right of it
      const title = (await feedback(page).getByRole("heading").boundingBox())!;
      expect(title.x).toBeGreaterThan(box.x + box.width);
    });

    test("the hint sheet: a modal dialog with the text, the guide button and Got it; nothing moves; it closes four ways", async ({
      page,
    }) => {
      await page.route("**/images/student/*.webp", (route) => route.abort());
      await start(page, scenario);
      const lightbulb = page.getByRole("button", { name: "Hint", exact: true });
      const before = await optionBoxes(page);
      await lightbulb.click();
      const sheet = hintSheet(page);
      await expect(sheet).toBeVisible();
      await expect(sheet).toHaveAttribute("aria-modal", "true");
      await expect(sheet).toContainText("Think about what the sound of an alarm");
      await expect(sheet.getByRole("button", { name: /^Guide · S1/ })).toBeVisible();
      await expect(sheet.getByRole("button")).toHaveCount(2); // the Guide chip and Got it, nothing else
      await expect(sheet.locator("[data-sheet-picture]")).toBeHidden();
      await expect(sheet.locator("[data-sheet-handle]")).toBeVisible();
      await expect(page.locator("[data-sheet-scrim]")).toBeVisible();
      await expect(page.getByRole("heading", { name: "Hint" })).toBeVisible();
      // the page behind does not scroll and nothing moved
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
      expect(await optionBoxes(page)).toEqual(before);
      expect(await noSidewaysScroll(page)).toBe(true);
      // 1. Got it
      await sheet.getByRole("button", { name: "Got it" }).click();
      await expect(sheet).toHaveCount(0);
      await expect(lightbulb).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");
      // 2. the scrim
      await lightbulb.click();
      await page.locator("[data-sheet-scrim]").click({ position: { x: 20, y: 20 } });
      await expect(sheet).toHaveCount(0);
      await expect(lightbulb).toBeFocused();
      // 3. Escape
      await lightbulb.click();
      await expect(sheet).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(sheet).toHaveCount(0);
      await expect(lightbulb).toBeFocused();
      // 4. a swipe down on the handle
      await lightbulb.click();
      await settled(page);
      const handle = (await page.locator("[data-sheet-handle]").boundingBox())!;
      const x = handle.x + handle.width / 2;
      const y = handle.y + handle.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x, y + 40, { steps: 4 });
      await page.mouse.move(x, y + 120, { steps: 4 });
      await page.mouse.up();
      await expect(sheet).toHaveCount(0);
      await expect(lightbulb).toBeFocused();
    });

    test("the hint sheet keeps the focus inside while open, and the guide opens from it", async ({
      page,
    }) => {
      await start(page, scenario);
      await page.getByRole("button", { name: "Hint", exact: true }).click();
      const sheet = hintSheet(page);
      await expect(sheet).toBeFocused();
      for (let n = 0; n < 5; n++) {
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => !!document.activeElement?.closest("[role=dialog]"))).toBe(
          true,
        );
      }
      await sheet.getByRole("button", { name: /^Guide · S1/ }).click();
      await expect(page.locator("dialog[open]")).toContainText("Guide · S1");
    });

    test("one sand background for all three sheet states; the meaning is in the title colour only", async ({
      page,
    }) => {
      const SAND = "rgb(234, 229, 218)";
      const STROKE = "rgb(221, 214, 200)";
      const look = (sheet: ReturnType<Page["locator"]>) =>
        sheet.evaluate((el) => {
          const style = getComputedStyle(el);
          return {
            background: style.backgroundColor,
            border: style.borderTopColor,
            title: getComputedStyle(el.querySelector("h2")!).color,
          };
        });
      await start(page, scenario);
      await page.getByRole("button", { name: "Hint", exact: true }).click();
      await settled(page);
      expect(await look(hintSheet(page))).toEqual({
        background: SAND,
        border: STROKE,
        title: "rgb(26, 26, 26)",
      });
      await page.getByRole("button", { name: "Got it" }).click();
      await option(page, S1_RIGHT).click();
      await check(page).click();
      expect(await look(feedback(page))).toEqual({
        background: SAND,
        border: STROKE,
        title: "rgb(68, 104, 58)",
      });
      await next(page).click();
      await option(page, /Keep it closed|Open it slowly/)
        .first()
        .click();
      await check(page).click();
      expect(await look(feedback(page))).toEqual({
        background: SAND,
        border: STROKE,
        title: "rgb(155, 44, 31)",
      });
    });

    test("the lightbulb is gone from the bar once the answer is checked", async ({ page }) => {
      await start(page, scenario);
      await option(page, S1_RIGHT).click();
      await check(page).click();
      await expect(page.getByRole("button", { name: "Hint", exact: true })).toHaveCount(0);
    });
  });
}

test.describe("Practice sheets on small and reduced-motion screens", () => {
  test("the Primary of the wrong-answer sheet is in view at 360 x 640", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await start(page, scenario);
    await option(page, S1_WRONG).click();
    await check(page).click();
    await settled(page);
    const nextBox = (await feedback(page).getByRole("button", { name: "Next" }).boundingBox())!;
    expect(nextBox.y).toBeGreaterThanOrEqual(0);
    expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(640);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("the sheet does not slide with prefers-reduced-motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await check(page).click();
    const duration = await feedback(page).evaluate((el) => getComputedStyle(el).animationDuration);
    expect(parseFloat(duration)).toBeLessThan(0.001);
  });

  test("with motion the sheet slides in about 200 ms", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await start(page, scenario);
    await option(page, S1_RIGHT).click();
    await check(page).click();
    const duration = await feedback(page).evaluate((el) => getComputedStyle(el).animationDuration);
    expect(duration).toBe("0.2s");
  });

  test("the Exam is unchanged: no Check, no sheet, no hint, and the options show no result", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.addInitScript((p) => {
      if (!localStorage.getItem("ast.profile.v1"))
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
    }, profile);
    await page.goto("/exam");
    await page.getByRole("button", { name: "Start exam anyway", exact: true }).click();
    await expect(page).toHaveURL(/\/exam\/session/);
    await page.locator("fieldset label").first().click();
    await expect(page.getByRole("button", { name: "Check", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Hint", exact: true })).toHaveCount(0);
    await next(page).click();
    await expect(page.locator("[data-bottom-sheet]")).toHaveCount(0);
    await expect(page.locator("label[data-state=correct], label[data-state=wrong]")).toHaveCount(0);
    await expect(page.getByText(/Not quite|Correct answer/)).toHaveCount(0);
  });
});
