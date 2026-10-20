import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue } from "./auth-seed";

const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};

const TILE_BG = "rgb(226, 222, 214)";
const TILE_INK = "rgb(92, 90, 86)";
const WRONG = "rgb(192, 57, 43)";

async function check(page: Page) {
  await page.goto("/profile");
  const rows: [string, string, boolean][] = [
    ["How the app works", "a", false],
    ["About this prototype", "a", false],
    ["Delete account", "button", true],
    ["Sign out", "button", true],
  ];
  for (const [label, tag, noChevron] of rows) {
    const row = page.locator(`${tag}:has-text("${label}")`).last();
    await row.scrollIntoViewIfNeeded();
    const info = await row.evaluate((el) => {
      const tile = el.querySelector("span[aria-hidden=true]") as HTMLElement;
      const icon = tile.querySelector("svg")!;
      const tileCss = getComputedStyle(tile);
      const box = tile.getBoundingClientRect();
      const text = [...el.querySelectorAll("span")].find(
        (s) => s.textContent?.trim() === el.textContent?.trim(),
      )!;
      return {
        rowHeight: el.getBoundingClientRect().height,
        tile: [box.width, box.height],
        tileBg: tileCss.backgroundColor,
        radius: tileCss.borderTopLeftRadius,
        iconColor: getComputedStyle(icon).color,
        icon: [icon.getBoundingClientRect().width, icon.getBoundingClientRect().height],
        gap: text.getBoundingClientRect().left - box.right,
        chevron: el.querySelectorAll("svg.lucide-chevron-right").length,
        textColor: getComputedStyle(text).color,
      };
    });
    expect(info.rowHeight, label).toBeGreaterThanOrEqual(56);
    expect(info.tile, label).toEqual([40, 40]);
    expect(info.tileBg, label).toBe(TILE_BG);
    expect(info.tileBg).not.toBe("rgba(0, 0, 0, 0)");
    expect(info.radius).not.toBe("0px");
    expect(info.icon, label).toEqual([20, 20]);
    expect(Math.abs(info.gap - 12), label).toBeLessThanOrEqual(1);
    expect(info.iconColor, label).toBe(label === "Delete account" ? WRONG : TILE_INK);
    expect(info.iconColor).not.toBe("rgb(0, 0, 0)");
    if (label === "Delete account") expect(info.textColor).toBe(WRONG);
    expect(info.chevron, label).toBe(noChevron ? 0 : 1);
  }
  await expect(page.locator("main")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
}

for (const width of [360, 430]) {
  test.describe(`Profile icons at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });
    test("Student: the four rows have the neutral icon tile", async ({ page }) => {
      await check(page);
    });
  });
  test.describe(`Profile icons, Instructor, at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });
    test("Instructor: the four rows have the neutral icon tile", async ({ page }) => {
      await check(page);
    });
  });
}
