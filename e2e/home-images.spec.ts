import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

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
  // wait until both pictures have loaded
  await page.waitForFunction(() =>
    [...document.querySelectorAll("main img")].every((img) => (img as HTMLImageElement).complete),
  );
}

for (const width of [360, 430]) {
  test.describe(`Home pictures at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("both pictures load, are decorative, have fixed sizes and no background, border or shadow", async ({
      page,
    }) => {
      await openHome(page);
      const hero = page.getByRole("region", { name: "Training materials" });
      const row = page.getByRole("link", { name: /Mini-quiz/ });
      // 400px and wider: 120 and 76; narrower: 104 and 72 (the attributes carry the wide size)
      const wide = width >= 400;
      for (const [slot, size, attr] of [
        [hero, wide ? 120 : 104, 120],
        [row, wide ? 76 : 72, 76],
      ] as const) {
        const img = slot.locator("img");
        await expect(img).toHaveCount(1);
        const info = await img.evaluate((el) => {
          const image = el as HTMLImageElement;
          const css = getComputedStyle(image);
          const box = image.getBoundingClientRect();
          return {
            natural: image.naturalWidth,
            alt: image.getAttribute("alt"),
            hidden: image.getAttribute("aria-hidden"),
            widthAttr: image.getAttribute("width"),
            heightAttr: image.getAttribute("height"),
            box: [box.width, box.height],
            background: css.backgroundColor,
            border: [css.borderTopWidth, css.borderTopStyle],
            shadow: css.boxShadow,
            fit: css.objectFit,
            parentBackground: getComputedStyle(image.parentElement!).backgroundColor,
          };
        });
        expect(info.natural).toBeGreaterThan(0);
        expect(info.alt).toBe("");
        expect(info.hidden).toBe("true");
        expect(info.widthAttr).toBe(String(attr));
        expect(info.heightAttr).toBe(String(attr));
        expect(info.box).toEqual([size, size]);
        expect(info.background).toBe("rgba(0, 0, 0, 0)");
        expect(info.border[0]).toBe("0px");
        expect(info.shadow).toBe("none");
        expect(info.fit).toBe("contain");
      }
      // the dashed placeholder text is gone from both slots
      await expect(hero.getByText("3D", { exact: true })).toHaveCount(0);
      await expect(row.getByText("3D", { exact: true })).toHaveCount(0);
      await expect(page.locator("[data-media3d]:visible")).toHaveCount(0);
    });

    test("the pictures fill their slots, never touch the text or the button, and stay inside their cards", async ({
      page,
    }) => {
      await openHome(page);
      const box = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!;
      const intersects = (
        a: { x: number; y: number; width: number; height: number },
        b: { x: number; y: number; width: number; height: number },
      ) =>
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      const hero = page.getByRole("region", { name: "Training materials" });
      const img = await box(hero.locator("img"));
      const card = await box(hero);
      const title = await box(hero.getByRole("heading", { name: "Training materials" }));
      const subtitle = await box(
        hero.getByText("Practical scenarios and theory quizzes, by topic"),
      );
      const button = await box(hero.getByRole("link", { name: "Choose a topic" }));
      const size = width >= 400 ? 120 : 104;
      expect([img.width, img.height]).toEqual([size, size]);
      // no overlap, and at least 8px between the text and the picture
      expect(intersects(img, title)).toBe(false);
      expect(intersects(img, subtitle)).toBe(false);
      expect(img.x - (title.x + title.width)).toBeGreaterThanOrEqual(8);
      expect(img.x - (subtitle.x + subtitle.width)).toBeGreaterThanOrEqual(8);
      // at least 12px above the button
      expect(button.y - (img.y + img.height)).toBeGreaterThanOrEqual(12);
      // top aligned with the title block (at most 8px above it), inside the card
      expect(Math.abs(img.y - title.y)).toBeLessThanOrEqual(8);
      expect(img.y).toBeGreaterThanOrEqual(card.y);
      expect(img.x + img.width).toBeLessThanOrEqual(card.x + card.width);
      // the right edge is at the card's inner padding: 8px card padding + 16px panel padding
      expect(Math.abs(card.x + card.width - 24 - (img.x + img.width))).toBeLessThanOrEqual(1);
      // the card keeps the page gutter
      expect(Math.abs(card.x - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(width - (card.x + card.width) - 16)).toBeLessThanOrEqual(0.5);
      // the title and subtitle are fully inside the card (nothing cut off)
      for (const text of [title, subtitle]) {
        expect(text.x).toBeGreaterThanOrEqual(card.x);
        expect(text.x + text.width).toBeLessThanOrEqual(img.x);
      }

      // the Mini-quiz row: picture on the left, centred, 12px to the text, inside the row
      const row = page.getByRole("link", { name: /Mini-quiz/ });
      const rowBox = await box(row);
      const rowImg = await box(row.locator("img"));
      const text = await box(row.getByText("Mini-quiz", { exact: true }));
      const description = await box(row.getByText("Pick topics and how many questions"));
      const small = width >= 400 ? 76 : 72;
      expect([rowImg.width, rowImg.height]).toEqual([small, small]);
      expect(intersects(rowImg, text)).toBe(false);
      expect(intersects(rowImg, description)).toBe(false);
      expect(Math.min(text.x, description.x) - (rowImg.x + rowImg.width)).toBeCloseTo(12, 0);
      expect(
        Math.abs(rowImg.y + rowImg.height / 2 - (rowBox.y + rowBox.height / 2)),
      ).toBeLessThanOrEqual(1);
      expect(rowImg.x).toBeGreaterThanOrEqual(rowBox.x + 16 - 1);
      expect(rowImg.y).toBeGreaterThanOrEqual(rowBox.y + 16 - 1);
      expect(rowImg.y + rowImg.height).toBeLessThanOrEqual(rowBox.y + rowBox.height - 16 + 1);
      expect(Math.abs(rowBox.x - 16)).toBeLessThanOrEqual(0.5);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    });
  });
}
