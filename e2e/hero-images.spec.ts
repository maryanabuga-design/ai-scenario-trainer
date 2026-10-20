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
  shown: number = size,
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
  // the displayed frame: its CSS size (280 shrinks with the screen height, never below 200)
  expect(Math.abs(info.box[0] - shown)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(info.box[1] - shown)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(info.frame[0] - shown)).toBeLessThanOrEqual(0.5);
  expect(Math.abs(info.frame[1] - shown)).toBeLessThanOrEqual(0.5);
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
    return {
      w: (x1 - x0 + 1) / frame,
      h: (y1 - y0 + 1) / frame,
      x0,
      y0,
      x1,
      y1,
    };
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

/** The 3D frame of Welcome and the onboarding: 280px, shrinking with the screen height (35dvh), never below 200px. */
const frameFor = (height: number) => Math.max(200, Math.min(280, 0.35 * height));

for (const viewport of viewports) {
  test.describe(`Pictures and centring at ${viewport.name}`, () => {
    test.use({
      viewport: { width: viewport.width, height: viewport.height },
      storageState: emptyBrowser,
    });

    test("Welcome: the 280 frame (200 at the least) fills with its picture", async ({ page }) => {
      // (Chromium reports layout shifts; the other engines return 0)
      const shift = await layoutShift(page, "/welcome");
      expect(shift).toBeLessThan(0.02);
      await checkPicture(
        page,
        page.locator("[data-centre] img"),
        "/heroes/welcome.webp",
        280,
        true,
        frameFor(viewport.height),
      );
      await expect(page.locator("[data-centre] [data-media3d]")).toHaveCount(0);
      const frame = (await page.locator("[data-centre] [data-picture-frame]").boundingBox())!;
      expect(frame.width).toBeGreaterThanOrEqual(200);
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

      test("each slide: the picture fills its frame", async ({ page }) => {
        await page.goto("/onboarding");
        for (const [index, slot] of slides.entries()) {
          if (index > 0) await page.getByRole("button", { name: "Next" }).click();
          await page.waitForTimeout(450);
          const image = page.locator("[data-centre] img");
          await checkPicture(
            page,
            image,
            `/heroes/${slot}.webp`,
            280,
            index === 0,
            frameFor(viewport.height),
          );
          await expect(page.locator(`[data-slide=${slot}]`)).toBeVisible();
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

    async function openVerify(page: Page) {
      await page.goto("/sign-up");
      await page.getByLabel("Full name").fill("Ana Test");
      await page.getByLabel("Work email").fill("ana@example.com");
      await page.getByRole("button", { name: "Continue" }).click();
      await expect(page).toHaveURL(/\/verify$/);
    }

    test("Verify: the picture fills its 120 by 120 frame and loads eagerly", async ({ page }) => {
      await openVerify(page);
      await checkPicture(
        page,
        page.locator("main [data-picture-frame] img"),
        "/heroes/verify.webp",
        120,
        true,
      );
      await expect(page.locator("main [data-media3d]")).toHaveCount(0);
    });

    test("Verify: everything under the header is centred", async ({ page }) => {
      await openVerify(page);
      const centre = viewport.width / 2;
      const middle = async (locator: Locator) => {
        const box = (await locator.boundingBox())!;
        return box.x + box.width / 2;
      };
      for (const [name, locator] of [
        ["slot", page.locator("main [data-picture-frame]")],
        ["title", page.getByRole("heading", { name: "Check your email" })],
        ["Change email", page.getByRole("button", { name: "Change email" })],
        ["resend row", page.getByText("Did not get a code?")],
      ] as const) {
        const x = await middle(locator);
        // (the resend row is a centred pair of items: its text sits left of centre by half the button)
        if (name === "resend row") expect(x).toBeLessThan(centre);
        else expect(Math.abs(x - centre), name).toBeLessThanOrEqual(2);
      }
      const resendRow = page.getByText("Did not get a code?").locator("..");
      expect(Math.abs((await middle(resendRow)) - centre)).toBeLessThanOrEqual(2);
      // the subtitle and the error message are centred text
      const subtitle = page.getByText("We sent a 6-digit code to");
      expect(await subtitle.evaluate((el) => getComputedStyle(el).textAlign)).toBe("center");
      expect(Math.abs((await middle(subtitle)) - centre)).toBeLessThanOrEqual(2);
      await page.getByLabel("Digit 1 of 6").focus();
      await page.keyboard.type("000000");
      const error = page.locator("#code-error");
      await expect(error).toContainText("That code is not correct");
      const align = await error.evaluate((el) => [
        getComputedStyle(el).textAlign,
        getComputedStyle(el).justifyContent,
      ]);
      expect(align).toEqual(["center", "center"]);
      // the demo card and the pinned Verify keep the full width
      const card = (await page.locator("[data-demo-code]").boundingBox())!;
      expect(Math.abs(card.x - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(card.width - (viewport.width - 32))).toBeLessThanOrEqual(0.5);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Verify: the six boxes fill the container width", async ({ page }) => {
      await openVerify(page);
      const group = (await page.getByRole("group", { name: "6-digit code" }).boundingBox())!;
      const boxes = await page.locator("main input[aria-label^=Digit]").all();
      let sum = 0;
      for (const box of boxes) {
        const b = (await box.boundingBox())!;
        expect(b.width).toBeGreaterThanOrEqual(44);
        expect(b.height).toBe(56);
        sum += b.width;
      }
      expect(Math.abs(sum + 5 * 8 - group.width)).toBeLessThanOrEqual(1);
      // about 48px at 360px and about 58px at 430px
      const first = (await boxes[0].boundingBox())!;
      expect(Math.abs(first.width - (group.width - 40) / 6)).toBeLessThanOrEqual(1);
    });

    test("Verify: the boxes still take a paste, auto-advance and Fill in code", async ({
      page,
    }) => {
      await openVerify(page);
      await expect(page.getByLabel("Digit 1 of 6")).toBeFocused();
      await page.keyboard.type("48");
      await expect(page.getByLabel("Digit 2 of 6")).toHaveValue("8");
      await expect(page.getByLabel("Digit 3 of 6")).toBeFocused();
      await page.getByRole("button", { name: "Fill in code" }).click();
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test("Create account: both role helpers are one line and both cards are 72px high", async ({
      page,
    }) => {
      await page.goto("/sign-up");
      for (const text of ["Practise and take exams", "Create and assign exams"]) {
        const info = await page.getByText(text, { exact: true }).evaluate((el) => ({
          cut: el.scrollWidth > el.clientWidth,
          height: el.getBoundingClientRect().height,
          line: parseFloat(getComputedStyle(el).lineHeight),
          overflow: getComputedStyle(el).textOverflow,
          nowrap: getComputedStyle(el).whiteSpace,
        }));
        expect(info.cut, text).toBe(false);
        expect(info.height, text).toBeCloseTo(info.line, 0);
        expect(info.overflow).toBe("ellipsis");
        expect(info.nowrap).toBe("nowrap");
        const card = (await page.locator("label", { hasText: text }).boundingBox())!;
        expect(card.height, text).toBe(72);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the autofill tint is switched off: the rule exists and the inputs are white with dark text", async ({
      page,
    }) => {
      await page.goto("/sign-up");
      const rule = await page.evaluate(() => {
        const found: string[] = [];
        for (const sheet of document.styleSheets) {
          let rules: CSSRuleList;
          try {
            rules = sheet.cssRules;
          } catch {
            continue;
          }
          for (const r of rules) {
            const text = r.cssText;
            if (/autofill/.test(text) && /inset/.test(text)) found.push(text);
          }
        }
        return found.join("\n");
      });
      expect(rule).toContain("autofill");
      expect(rule).toMatch(/inset/);
      expect(rule).toMatch(/-webkit-text-fill-color/);
      for (const label of ["Full name", "Work email"]) {
        const look = await page.getByLabel(label).evaluate((el) => {
          const css = getComputedStyle(el);
          return [css.backgroundColor, css.color];
        });
        expect(look[0]).toBe("rgb(255, 255, 255)");
        expect(look[1]).not.toBe("rgb(0, 0, 0)");
        expect(look[1]).not.toBe("rgba(0, 0, 0, 0)");
      }
    });
  });
}
