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
      for (const [slot, size] of [
        [hero, 96],
        [row, 72],
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
        expect(info.widthAttr).toBe(String(size));
        expect(info.heightAttr).toBe(String(size));
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

    test("the hero title and subtitle do not overlap the picture, and nothing is cut off", async ({
      page,
    }) => {
      await openHome(page);
      const hero = page.getByRole("region", { name: "Training materials" });
      const box = async (locator: ReturnType<Page["locator"]>) => (await locator.boundingBox())!;
      const img = await box(hero.locator("img"));
      for (const text of [
        hero.getByRole("heading", { name: "Training materials" }),
        hero.getByText("Practical scenarios and theory quizzes, by topic"),
      ]) {
        const t = await box(text);
        expect(t.x + t.width, "text ends before the picture").toBeLessThanOrEqual(img.x);
        // the 12px gap of the title row
        expect(img.x - (t.x + t.width)).toBeGreaterThanOrEqual(0);
      }
      // the card keeps the page gutter and the picture stays inside it
      const card = await box(hero);
      expect(Math.abs(card.x - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(width - (card.x + card.width) - 16)).toBeLessThanOrEqual(0.5);
      expect(img.x + img.width).toBeLessThanOrEqual(card.x + card.width);
      expect(img.y).toBeGreaterThanOrEqual(card.y);
      // the mini-quiz row text sits right of its picture
      const row = page.getByRole("link", { name: /Mini-quiz/ });
      const rowImg = await box(row.locator("img"));
      const title = await box(row.getByText("Mini-quiz", { exact: true }));
      expect(title.x).toBeGreaterThanOrEqual(rowImg.x + rowImg.width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
    });
  });
}
