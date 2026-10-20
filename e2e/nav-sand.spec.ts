import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue } from "./auth-seed";

const SAND_100 = "rgb(240, 232, 216)";
const SAND_900 = "rgb(77, 63, 45)";
const YELLOW = "rgb(248, 242, 204)";

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = (css: string) => {
  const [r, g, b] = /\d+/g.exec(css) ? css.match(/\d+/g)!.map(Number) : [0, 0, 0];
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};

async function checkActive(page: Page, path: string, label: string) {
  await page.goto(path);
  const nav = page.getByRole("navigation", { name: "Main" });
  const active = nav.locator('a[aria-current="page"]');
  await expect(active).toHaveCount(1);
  await expect(active).toContainText(label);
  const look = await active.evaluate((el) => {
    const css = getComputedStyle(el);
    const icon = el.querySelector("svg")!;
    return {
      bg: css.backgroundColor,
      color: css.color,
      weight: css.fontWeight,
      icon: getComputedStyle(icon).color,
    };
  });
  expect(look.bg, `${label} pill`).toBe(SAND_100);
  expect(look.bg).not.toBe("rgba(0, 0, 0, 0)");
  expect(look.bg).not.toBe(YELLOW);
  expect(look.color).toBe(SAND_900);
  expect(look.icon).toBe(SAND_900);
  expect(Number(look.weight)).toBeGreaterThanOrEqual(600);
  expect(contrast(look.color, look.bg)).toBeGreaterThanOrEqual(4.5);
  // the inactive items keep their colours (no sand fill)
  const others = await nav
    .locator("a:not([aria-current])")
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor));
  for (const bg of others) expect(bg).toBe("rgba(0, 0, 0, 0)");
}

for (const width of [360, 430]) {
  test.describe(`Active navigation item at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    for (const [path, label] of [
      ["/", "Home"],
      ["/materials", "Materials"],
      ["/progress", "Progress"],
      ["/ask-ai", "Ask AI"],
    ]) {
      test(`Student: ${label} is a sand pill`, async ({ page }) => {
        await checkActive(page, path, label);
      });
    }
  });

  test.describe(`Active navigation item, Instructor, at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    for (const [path, label] of [
      ["/instructor", "Overview"],
      ["/instructor/exams", "Exams"],
      ["/profile", "Profile"],
    ]) {
      test(`Instructor: ${label} is a sand pill`, async ({ page }) => {
        await checkActive(page, path, label);
      });
    }
  });
}
