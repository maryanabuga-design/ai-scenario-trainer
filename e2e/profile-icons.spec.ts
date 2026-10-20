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

const INK = "rgb(92, 90, 86)";
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
      const icon = el.querySelector("svg")!;
      const wrapper = icon.parentElement as HTMLElement;
      const box = wrapper.getBoundingClientRect();
      const iconBox = icon.getBoundingClientRect();
      const rowBox = el.getBoundingClientRect();
      const text = [...el.querySelectorAll("span")].find(
        (s) => s.textContent?.trim() === el.textContent?.trim(),
      )!;
      return {
        rowHeight: rowBox.height,
        wrapperBg: getComputedStyle(wrapper).backgroundColor,
        wrapperRadius: getComputedStyle(wrapper).borderTopLeftRadius,
        wrapper: [box.width, box.height],
        icon: [iconBox.width, iconBox.height],
        iconColor: getComputedStyle(icon).color,
        gap: text.getBoundingClientRect().left - box.right,
        leftInset: box.left - rowBox.left,
        chevron: el.querySelectorAll("svg.lucide-chevron-right").length,
        textColor: getComputedStyle(text).color,
        tap: [rowBox.width, rowBox.height],
      };
    });
    expect(info.rowHeight, label).toBeGreaterThanOrEqual(56);
    expect(info.tap[0], label).toBeGreaterThanOrEqual(44);
    // no tile: the wrapper is transparent and exactly as big as the icon
    expect(info.wrapperBg, label).toBe("rgba(0, 0, 0, 0)");
    expect(info.wrapperRadius, label).toBe("0px");
    expect(info.icon, label).toEqual([24, 24]);
    expect(info.wrapper, label).toEqual([24, 24]);
    expect(Math.abs(info.gap - 12), label).toBeLessThanOrEqual(1);
    // aligned with the row's 16px left padding
    expect(info.leftInset, label).toBe(16);
    expect(info.iconColor, label).toBe(label === "Delete account" ? WRONG : INK);
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
    test("Student: the four rows have a bare icon, no tile", async ({ page }) => {
      await check(page);
    });
  });
  test.describe(`Profile icons, Instructor, at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });
    test("Instructor: the four rows have a bare icon, no tile", async ({ page }) => {
      await check(page);
    });
  });
}
