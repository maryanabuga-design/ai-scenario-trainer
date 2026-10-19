import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

type Tile = { bg: string; ink: string; size: number };

async function prepare(page: Page) {
  await page.addInitScript(
    ([p]) => {
      if (!localStorage.getItem("ast.profile.v1")) {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      }
    },
    [profile],
  );
}

/** Every icon tile on the page: a decorative box that holds an icon directly. */
async function iconTiles(page: Page): Promise<Tile[]> {
  return page.locator("main").evaluate((main) => {
    const tiles: Tile[] = [];
    for (const el of main.querySelectorAll<HTMLElement>('[aria-hidden="true"]')) {
      const icon = el.firstElementChild;
      if (!icon || icon.tagName.toLowerCase() !== "svg") continue;
      const box = el.getBoundingClientRect();
      if (box.width < 28 || box.width > 100) continue;
      const css = getComputedStyle(el);
      // a tile is a rounded box (a circle or a rounded square); a bare icon wrapper is not
      if (css.display === "inline" || css.borderTopLeftRadius === "0px") continue;
      tiles.push({ bg: css.backgroundColor, ink: css.color, size: Math.round(box.width) });
    }
    return tiles;
  });
}

const rgb = (value: string) => {
  const match = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(value)!;
  return { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] };
};
const luminance = (value: string) => {
  const { r, g, b } = rgb(value);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test.describe("one neutral icon tile", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  async function bookmark(page: Page): Promise<Tile> {
    await page.goto("/training");
    await page.getByText("Start", { exact: true }).first().click();
    const button = page.getByRole("button", { name: "Save question" });
    await expect(button).toBeVisible();
    return button.evaluate((el) => {
      const css = getComputedStyle(el);
      return {
        bg: css.backgroundColor,
        ink: css.color,
        size: Math.round(el.getBoundingClientRect().width),
      };
    });
  }

  for (const [name, path, minimum] of [
    ["Home", "/", 4],
    ["Materials", "/materials", 1],
  ] as const) {
    test(`${name}: every icon tile has the bookmark's colours, never transparent or black, contrast 3:1`, async ({
      page,
    }) => {
      await prepare(page);
      const reference = await bookmark(page);
      await page.goto(path);
      await page.waitForTimeout(500);
      const tiles = await iconTiles(page);
      expect(tiles.length).toBeGreaterThanOrEqual(minimum);
      for (const tile of tiles) {
        expect(tile.bg).toBe(reference.bg);
        expect(tile.ink).toBe(reference.ink);
        expect(rgb(tile.bg).a).toBeGreaterThan(0);
        expect(tile.bg).not.toBe("rgba(0, 0, 0, 0)");
        expect(tile.ink).not.toBe("rgb(0, 0, 0)");
        expect(contrast(tile.ink, tile.bg)).toBeGreaterThanOrEqual(3);
      }
    });
  }

  test("Home keeps its four circles at 36px", async ({ page }) => {
    await prepare(page);
    await page.goto("/");
    await page.waitForTimeout(500);
    const tiles = await iconTiles(page);
    expect(tiles.filter((tile) => tile.size === 36)).toHaveLength(4);
  });
});
