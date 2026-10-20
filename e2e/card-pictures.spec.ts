import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const steps: { id: string; correctOptionId: string; options: { id: string }[] }[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;
const three = steps.slice(0, 3);
const profile = { direction: "building-evacuation", onboarded: true };

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** A session of three scenario steps, answered: all right (passed) or all wrong (not passed yet). */
const session = (right: boolean, finished = true) => ({
  kind: "scenario",
  itemIds: three.map((step) => step.id),
  answers: three.map((step) => ({
    itemId: step.id,
    optionId: right
      ? step.correctOptionId
      : step.options.find((option) => option.id !== step.correctOptionId)!.id,
  })),
  index: finished ? 2 : 1,
  finished,
});

async function seed(page: Page, value: object | null) {
  await page.addInitScript(
    ([p, s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
    },
    [profile, value],
  );
}

/** The picture in a frame: loaded, decorative, exactly the frame, filling at least 85% of it. */
async function checkPicture(page: Page, image: Locator, file: string, size: number) {
  await expect(image).toHaveAttribute("src", file);
  await expect
    .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  const info = await image.evaluate((el) => {
    const img = el as HTMLImageElement;
    const frame = img.parentElement!;
    const box = img.getBoundingClientRect();
    const css = getComputedStyle(img);
    return {
      alt: img.getAttribute("alt"),
      hidden: [img.getAttribute("aria-hidden"), frame.getAttribute("aria-hidden")],
      attrs: [img.getAttribute("width"), img.getAttribute("height")],
      box: [box.width, box.height],
      fit: css.objectFit,
      shadow: [css.boxShadow, getComputedStyle(frame).boxShadow],
      background: [css.backgroundColor, getComputedStyle(frame).backgroundColor],
      loading: img.getAttribute("loading"),
    };
  });
  expect(info.alt).toBe("");
  expect(info.hidden).toEqual(["true", "true"]);
  expect(info.attrs).toEqual([String(size), String(size)]);
  expect(Math.abs(info.box[0] - size)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(info.box[1] - size)).toBeLessThanOrEqual(0.5);
  expect(info.fit).toBe("contain");
  expect(info.shadow).toEqual(["none", "none"]);
  expect(info.background).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
  expect(info.loading).toBe("eager");
  const fill = await image.evaluate((el, frame) => {
    const img = el as HTMLImageElement;
    const canvas = document.createElement("canvas");
    canvas.width = frame;
    canvas.height = frame;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, frame, frame);
    const data = ctx.getImageData(0, 0, frame, frame).data;
    let x0 = frame,
      y0 = frame,
      x1 = -1,
      y1 = -1;
    for (let y = 0; y < frame; y++)
      for (let x = 0; x < frame; x++)
        if (data[(y * frame + x) * 4 + 3] > 12) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
          y0 = Math.min(y0, y);
          y1 = Math.max(y1, y);
        }
    return { w: (x1 - x0 + 1) / frame, h: (y1 - y0 + 1) / frame };
  }, size);
  expect(Math.max(fill.w, fill.h), file).toBeGreaterThanOrEqual(0.85);
  expect(await noSidewaysScroll(page)).toBe(true);
}

for (const width of [360, 430]) {
  test.describe(`Card and result pictures at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("Training: the Continue card and the Exam card show their 56 by 56 pictures", async ({
      page,
    }) => {
      await seed(page, session(true, false));
      await page.goto("/training");
      await expect(page.getByRole("link", { name: /Continue your session/ })).toBeVisible();
      await checkPicture(
        page,
        page.getByRole("link", { name: /Continue your session/ }).locator("img"),
        "/heroes/continue-session.webp",
        56,
      );
      await checkPicture(
        page,
        page.locator('a[href^="/exam?id="]').first().locator("img"),
        "/heroes/exam-card.webp",
        56,
      );
      await expect(page.locator("main [data-media3d]")).toHaveCount(0);
    });

    test("Training: the pictures move nothing while the page loads", async ({ page }) => {
      await seed(page, session(true, false));
      await page.addInitScript(() => {
        (window as unknown as { __cls: number }).__cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as {
            value: number;
            hadRecentInput: boolean;
          }[])
            if (!entry.hadRecentInput)
              (window as unknown as { __cls: number }).__cls += entry.value;
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/training");
      await page.waitForTimeout(800);
      const shift = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
      expect(shift).toBeLessThan(0.02);
    });

    test("Results: a passed result shows the medal, 200 by 200", async ({ page }) => {
      await seed(page, session(true));
      await page.goto("/session/results");
      await expect(page.getByRole("heading", { name: "Passed" })).toBeVisible();
      await checkPicture(
        page,
        page.locator("#result-title").locator("xpath=..").locator("img"),
        "/heroes/result-pass.webp",
        200,
      );
    });

    test("Results: a not-passed result shows the open book with the repeat arrow", async ({
      page,
    }) => {
      await seed(page, session(false));
      await page.goto("/session/results");
      await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
      await checkPicture(
        page,
        page.locator("#result-title").locator("xpath=..").locator("img"),
        "/heroes/result-retry.webp",
        200,
      );
    });
  });
}
