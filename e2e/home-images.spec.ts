import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

async function openHome(page: Page) {
  await page.addInitScript(
    ([p]) => {
      if (!localStorage.getItem("ast.profile.v1")) {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      }
    },
    [profile],
  );
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Training materials" })).toBeVisible();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("main img")].every((img) => (img as HTMLImageElement).complete),
  );
}

type Rect = { x: number; y: number; width: number; height: number };
const box = async (locator: Locator): Promise<Rect> => (await locator.boundingBox())!;
const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

for (const width of [360, 430]) {
  test.describe(`Home pictures at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("both pictures load, are decorative and fill fixed frames (76 by 60 and 64 by 60) with no background, border or shadow", async ({
      page,
    }) => {
      await openHome(page);
      const hero = page.getByRole("region", { name: "Training materials" });
      const row = page.getByRole("link", { name: /Mini-quiz/ });
      for (const [slot, [frameW, frameH]] of [
        [hero, [76, 60]],
        [row, [64, 60]],
      ] as const) {
        const img = slot.locator("img");
        await expect(img).toHaveCount(1);
        const info = await img.evaluate((el) => {
          const image = el as HTMLImageElement;
          const css = getComputedStyle(image);
          const frame = image.parentElement!;
          const frameCss = getComputedStyle(frame);
          return {
            natural: image.naturalWidth,
            alt: image.getAttribute("alt"),
            hidden: image.getAttribute("aria-hidden"),
            attrs: [image.getAttribute("width"), image.getAttribute("height")],
            layout: [image.offsetWidth, image.offsetHeight],
            frame: [frame.offsetWidth, frame.offsetHeight],
            frameOverflow: frameCss.overflow,
            spacing: [css.paddingTop, css.marginTop, css.paddingLeft, css.marginLeft],
            background: css.backgroundColor,
            frameBackground: frameCss.backgroundColor,
            border: [css.borderTopWidth, frameCss.borderTopWidth],
            shadow: [css.boxShadow, frameCss.boxShadow],
            fit: css.objectFit,
          };
        });
        expect(info.natural).toBeGreaterThan(0);
        expect(info.alt).toBe("");
        expect(info.hidden).toBe("true");
        expect(info.attrs).toEqual([String(frameW), String(frameH)]);
        expect(info.layout).toEqual([frameW, frameH]);
        expect(info.frame).toEqual([frameW, frameH]);
        expect(info.frameOverflow).toBe("hidden");
        expect(info.spacing).toEqual(["0px", "0px", "0px", "0px"]);
        expect(info.background).toBe("rgba(0, 0, 0, 0)");
        expect(info.frameBackground).toBe("rgba(0, 0, 0, 0)");
        expect(info.border).toEqual(["0px", "0px"]);
        expect(info.shadow).toEqual(["none", "none"]);
        expect(info.fit).toBe("contain");
      }
      await expect(page.locator("[data-media3d]:visible")).toHaveCount(0);
    });

    test("the visible artwork fills at least 90% of each frame height and nothing is cropped (measured from the pixels)", async ({
      page,
    }) => {
      await openHome(page);
      for (const [name, frameW, frameH] of [
        ["Training materials", 76, 60],
        ["Mini-quiz", 64, 60],
      ] as const) {
        const slot =
          name === "Mini-quiz"
            ? page.getByRole("link", { name: /Mini-quiz/ })
            : page.getByRole("region", { name });
        // lazy pictures below a short screen load only when scrolled to
        await slot.locator("img").scrollIntoViewIfNeeded();
        await expect
          .poll(() => slot.locator("img").evaluate((el) => (el as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
        const visible = await slot.locator("img").evaluate(
          (el, [w, h]: number[]) => {
            const image = el as HTMLImageElement;
            // draw the file the way the page shows it: contained (a square of the shorter side,
            // centred), then the same transform; sample at 4x for a precise box
            const k = 4;
            const canvas = document.createElement("canvas");
            canvas.width = w * k;
            canvas.height = h * k;
            const ctx = canvas.getContext("2d")!;
            const match = /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/.exec(
              image.style.transform,
            )!;
            const [tx, ty, scale] = [Number(match[1]), Number(match[2]), Number(match[3])];
            const side = Math.min(w, h);
            ctx.scale(k, k);
            ctx.translate(w / 2, h / 2);
            ctx.translate(tx, ty);
            ctx.scale(scale, scale);
            ctx.drawImage(image, -side / 2, -side / 2, side, side);
            const data = ctx.getImageData(0, 0, w * k, h * k).data;
            let top = h * k;
            let bottom = -1;
            let left = w * k;
            let right = -1;
            for (let y = 0; y < h * k; y++) {
              for (let x = 0; x < w * k; x++) {
                if (data[(y * w * k + x) * 4 + 3] > 16) {
                  top = Math.min(top, y);
                  bottom = Math.max(bottom, y);
                  left = Math.min(left, x);
                  right = Math.max(right, x);
                }
              }
            }
            return {
              height: (bottom - top + 1) / k,
              width: (right - left + 1) / k,
              top: top / k,
              left: left / k,
              bottom: (bottom + 1) / k,
              right: (right + 1) / k,
            };
          },
          [frameW, frameH],
        );
        expect(visible.height / frameH).toBeGreaterThanOrEqual(0.9);
        // nothing is cropped: the whole artwork lies inside the frame
        expect(visible.top).toBeGreaterThanOrEqual(0);
        expect(visible.left).toBeGreaterThanOrEqual(0);
        expect(visible.bottom).toBeLessThanOrEqual(frameH);
        expect(visible.right).toBeLessThanOrEqual(frameW);
      }
    });

    test("the hero card: text and button where they were, 16px spacing, frame never pushes anything", async ({
      page,
    }) => {
      await openHome(page);
      const hero = page.getByRole("region", { name: "Training materials" });
      const frame = await box(hero.locator("[data-picture-frame]"));
      const card = await box(hero);
      const title = await box(hero.getByRole("heading", { name: "Training materials" }));
      const subtitle = await box(
        hero.getByText("Practical scenarios and theory quizzes, by topic"),
      );
      const button = await box(hero.getByRole("link", { name: "Choose a topic" }));
      expect([frame.width, frame.height]).toEqual([76, 60]);
      // the frame is vertically centred on the text block, title top to subtitle bottom (2px)
      const blockTop = title.y;
      const blockBottom = Math.max(title.y + title.height, subtitle.y + subtitle.height);
      expect(
        Math.abs(frame.y + frame.height / 2 - (blockTop + blockBottom) / 2),
      ).toBeLessThanOrEqual(2);
      // the text never meets the frame: 8px gap at least (1px for rounding), no intersection
      expect(intersects(frame, title)).toBe(false);
      expect(intersects(frame, subtitle)).toBe(false);
      expect(frame.x - (title.x + title.width)).toBeGreaterThanOrEqual(8 - 1);
      expect(frame.x - (subtitle.x + subtitle.width)).toBeGreaterThanOrEqual(8 - 1);
      // the title keeps its left edge: card 8 + panel 16 + gutter 16
      expect(Math.abs(title.x - (16 + 8 + 16))).toBeLessThanOrEqual(1);
      const textBottom = blockBottom;
      const textHeight = textBottom - title.y;
      // the frame is never taller than the text block
      expect(frame.height).toBeLessThanOrEqual(textHeight + 4);
      // text block to button: 16px (+-1)
      expect(Math.abs(button.y - textBottom - 16)).toBeLessThanOrEqual(1);
      expect(button.y - (frame.y + frame.height)).toBeGreaterThanOrEqual(12);
      // card padding 16 above the text and below the button (inside the 8px card frame)
      expect(Math.abs(title.y - (card.y + 8 + 16))).toBeLessThanOrEqual(1);
      expect(
        Math.abs(card.y + card.height - 8 - 16 - (button.y + button.height)),
      ).toBeLessThanOrEqual(1);
      // right edge at the panel's inner padding, inside the card
      expect(Math.abs(card.x + card.width - 24 - (frame.x + frame.width))).toBeLessThanOrEqual(1);
      // height: never taller than with the dashed placeholder (an 80px box in the same row):
      // 8 + 16 + max(text block, 80) + 16 + button + 16 + 8
      const placeholder = 8 + 16 + Math.max(textHeight, 80) + 16 + button.height + 16 + 8;
      expect(card.height).toBeLessThanOrEqual(placeholder + 1);
      // gutters
      expect(Math.abs(card.x - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(width - (card.x + card.width) - 16)).toBeLessThanOrEqual(0.5);
    });

    test("the Mini-quiz row: 64 by 60 frame at the left, centred on the text, 12px to the text, no taller than before", async ({
      page,
    }) => {
      await openHome(page);
      const row = page.getByRole("link", { name: /Mini-quiz/ });
      const rowBox = await box(row);
      const frame = await box(row.locator("[data-picture-frame]"));
      const title = await box(row.getByText("Mini-quiz", { exact: true }));
      const description = await box(row.getByText("Pick topics and how many questions"));
      expect([frame.width, frame.height]).toEqual([64, 60]);
      expect(intersects(frame, title)).toBe(false);
      expect(intersects(frame, description)).toBe(false);
      const textLeft = Math.min(title.x, description.x);
      expect(textLeft - (frame.x + frame.width)).toBeCloseTo(12, 0);
      // the text starts where it did with the 72px placeholder (16px padding + 72 + 12), +4 at most
      expect(textLeft).toBeLessThanOrEqual(16 + 16 + 72 + 12 + 4);
      // centred on the text block (title top to description bottom) and in the row, 2px
      const blockCentre =
        (Math.min(title.y, description.y) +
          Math.max(title.y + title.height, description.y + description.height)) /
        2;
      expect(Math.abs(frame.y + frame.height / 2 - blockCentre)).toBeLessThanOrEqual(2);
      expect(
        Math.abs(frame.y + frame.height / 2 - (rowBox.y + rowBox.height / 2)),
      ).toBeLessThanOrEqual(2);
      // the row is not taller than with the placeholder (104px minimum), +4 at most
      expect(rowBox.height).toBeLessThanOrEqual(104 + 4);
      // the chevron stays on the right
      const chevron = await box(row.locator("svg").last());
      expect(chevron.x).toBeGreaterThan(description.x + description.width - 1);
      expect(chevron.x + chevron.width).toBeLessThanOrEqual(rowBox.x + rowBox.width);
      expect(Math.abs(rowBox.x - 16)).toBeLessThanOrEqual(0.5);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    });
  });
}
