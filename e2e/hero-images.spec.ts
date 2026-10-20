import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { emptyBrowser, newAccount } from "./auth-seed";

const viewports = [
  { name: "360 x 800", width: 360, height: 800 },
  { name: "430 x 932", width: 430, height: 932 },
  { name: "360 x 640", width: 360, height: 640 },
] as const;

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** The picture inside a frame: loaded, decorative, exactly the frame size, filling its frame. */
async function checkPicture(
  page: Page,
  image: Locator,
  file: string,
  size: number,
  eager: boolean,
) {
  await expect(image).toHaveAttribute("src", file);
  await expect
    .poll(() => image.evaluate((el) => (el as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  const info = await image.evaluate((el) => {
    const img = el as HTMLImageElement;
    const frame = img.parentElement!;
    const css = getComputedStyle(img);
    const box = img.getBoundingClientRect();
    const frameBox = frame.getBoundingClientRect();
    return {
      alt: img.getAttribute("alt"),
      hidden: img.getAttribute("aria-hidden"),
      frameHidden: frame.getAttribute("aria-hidden"),
      attrs: [img.getAttribute("width"), img.getAttribute("height")],
      box: [box.width, box.height],
      frame: [frameBox.width, frameBox.height],
      loading: img.getAttribute("loading"),
      fit: css.objectFit,
      shadow: [css.boxShadow, getComputedStyle(frame).boxShadow],
      background: [css.backgroundColor, getComputedStyle(frame).backgroundColor],
      natural: [img.naturalWidth, img.naturalHeight],
    };
  });
  expect(info.alt).toBe("");
  expect(info.hidden).toBe("true");
  expect(info.frameHidden).toBe("true");
  expect(info.attrs).toEqual([String(size), String(size)]);
  expect(info.box).toEqual([size, size]);
  expect(info.frame).toEqual([size, size]);
  expect(info.loading).toBe(eager ? "eager" : "lazy");
  expect(info.fit).toBe("contain");
  expect(info.shadow).toEqual(["none", "none"]);
  expect(info.background).toEqual(["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)"]);
  // the visible part (the box of the pixels with some alpha) fills at least 85% of the frame
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
    return { w: (x1 - x0 + 1) / frame, h: (y1 - y0 + 1) / frame, x0, y0, x1, y1 };
  }, size);
  expect(Math.max(fill.w, fill.h), file).toBeGreaterThanOrEqual(0.85);
  // nothing is cut by the frame: the pixels stay inside it, with the 4% padding
  expect(fill.x0).toBeGreaterThan(0);
  expect(fill.y0).toBeGreaterThan(0);
  expect(fill.x1).toBeLessThan(size - 1);
  expect(fill.y1).toBeLessThan(size - 1);
  expect(await noSidewaysScroll(page)).toBe(true);
}

/** The layout shift while a page loads: explicit sizes mean the pictures move nothing. */
async function layoutShift(page: Page, path: string) {
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as {
        value: number;
        hadRecentInput: boolean;
      }[])
        if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(path);
  await page.waitForTimeout(800);
  return page.evaluate(() => (window as unknown as { __cls: number }).__cls);
}

const mid = (box: { y: number; height: number }) => box.y + box.height / 2;

for (const viewport of viewports) {
  test.describe(`Pictures and centring at ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      storageState: emptyBrowser,
    });

    test("Welcome: the picture fills its 220 by 220 frame, loads eagerly and moves nothing", async ({
      page,
    }) => {
      // (Chromium reports layout shifts; the other engines return 0)
      const shift = await layoutShift(page, "/welcome");
      expect(shift).toBeLessThan(0.02);
      await checkPicture(
        page,
        page.locator("[data-hero-panel] img"),
        "/heroes/welcome.webp",
        220,
        true,
      );
      await expect(page.locator("[data-hero-panel] [data-media3d]")).toHaveCount(0);
    });

    test("Welcome: the text is centred vertically between the panel and the buttons", async ({
      page,
    }) => {
      await page.goto("/welcome");
      await page.waitForTimeout(400);
      const panel = (await page.locator("[data-hero-panel]").boundingBox())!;
      const eyebrow = (await page.locator("[data-eyebrow]").boundingBox())!;
      const subtitle = (await page.getByText("Short scenarios, quizzes and exams").boundingBox())!;
      const create = (await page.getByRole("link", { name: "Create account" }).boundingBox())!;
      const top = panel.y + panel.height;
      const text = { y: eyebrow.y, height: subtitle.y + subtitle.height - eyebrow.y };
      const gapAbove = text.y - top;
      const gapBelow = create.y - (text.y + text.height);
      // never closer than 16px, nothing overlaps
      expect(gapAbove).toBeGreaterThanOrEqual(16 - 0.5);
      expect(gapBelow).toBeGreaterThanOrEqual(16 - 0.5);
      // centred in the free space: the two gaps are equal (4px)
      expect(Math.abs(gapAbove - gapBelow)).toBeLessThanOrEqual(4);
      expect(Math.abs(mid(text) - (top + create.y) / 2)).toBeLessThanOrEqual(4);
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });

  for (const role of ["student", "instructor"] as const) {
    test.describe(`Onboarding (${role}) at ${viewport.name}`, () => {
      test.use({
        viewport: { width: viewport.width, height: viewport.height },
        storageState: newAccount(role),
      });

      const slides =
        role === "student"
          ? ["onboarding-practise", "onboarding-mistakes", "onboarding-exam"]
          : ["onboarding-practise", "onboarding-exam", "onboarding-mistakes"];

      test("each slide shows its picture in the 220 by 220 frame and centres its text above the dots", async ({
        page,
      }) => {
        await page.goto("/onboarding");
        for (const [index, slot] of slides.entries()) {
          if (index > 0) await page.getByRole("button", { name: "Next" }).click();
          await page.waitForTimeout(450);
          const image = page.locator("[data-hero-panel] img");
          await checkPicture(page, image, `/heroes/${slot}.webp`, 220, index === 0);
          await expect(page.locator(`[data-slide=${slot}]`)).toBeVisible();
          // the text block is centred in the free space between the panel and the dots
          const panel = (await page.locator("[data-hero-panel]").boundingBox())!;
          const block = (await page.locator("[data-slide]").boundingBox())!;
          const dots = (await page.getByRole("img", { name: /^Step \d of 3$/ }).boundingBox())!;
          const top = panel.y + panel.height;
          const gapAbove = block.y - top;
          const gapBelow = dots.y - (block.y + block.height);
          expect(gapAbove, `slide ${index + 1} above`).toBeGreaterThanOrEqual(16 - 0.5);
          expect(gapBelow, `slide ${index + 1} below`).toBeGreaterThanOrEqual(16 - 0.5);
          expect(Math.abs(gapAbove - gapBelow), `slide ${index + 1} centring`).toBeLessThanOrEqual(
            4,
          );
          expect(Math.abs(mid(block) - (top + dots.y) / 2)).toBeLessThanOrEqual(4);
          // nothing overlaps: the dots stay above the pinned button
          const button = (await page
            .getByRole("button", { name: /^(Next|Get started)$/ })
            .boundingBox())!;
          expect(dots.y + dots.height).toBeLessThanOrEqual(button.y);
          expect(await noSidewaysScroll(page)).toBe(true);
        }
      });
    });
  }

  test.describe(`Verify at ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      storageState: emptyBrowser,
    });

    test("Verify: the picture fills its 80 by 80 frame and loads eagerly", async ({ page }) => {
      await page.goto("/sign-up");
      await page.getByLabel("Full name").fill("Ana Test");
      await page.getByLabel("Work email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/verify$/);
      await checkPicture(
        page,
        page.locator("main [data-picture-frame] img"),
        "/heroes/verify.webp",
        80,
        true,
      );
      await expect(page.locator("main [data-media3d]")).toHaveCount(0);
    });
  });
}
