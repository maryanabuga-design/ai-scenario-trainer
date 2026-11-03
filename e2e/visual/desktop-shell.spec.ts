import { expect, test } from "@playwright/test";
import { prepare } from "./routes";

/** The desktop shell of the instructor (DESIGN.md: Responsive instructor): shown from 1024px, CSS only. */
test.use({ reducedMotion: "reduce" });

const sideNav = "[data-side-nav]";
const bottomBar = 'nav[aria-label="Main"]';
const frameWidth = (page: import("@playwright/test").Page) =>
  page.locator("[data-shell-frame]").evaluate((el) => el.getBoundingClientRect().width);

test("instructor at 1280px: side navigation, no bottom bar, no phone column", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto("/instructor");
  await expect(page.locator(sideNav)).toBeVisible();
  await expect(page.locator(bottomBar)).toBeHidden();
  const box = await page.locator(sideNav).boundingBox();
  expect(box?.width).toBe(240);
  expect(box?.x).toBe(0);
  expect(await frameWidth(page)).toBe(1280);
  await expect(page.locator("[data-shell-frame]")).toHaveCSS("border-left-width", "0px");
  // the content is a centred column of at most 1200px; the header band and the pinned bar run edge to edge
  const content = await page.locator("main").evaluate((el) => {
    const css = getComputedStyle(el);
    return el.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
  });
  expect(content).toBeLessThanOrEqual(1200);
  const names = await page.locator(`${sideNav} nav a`).allInnerTexts();
  expect(names).toEqual(["Overview", "Exams", "Students", "Content"]);
  await expect(page.locator(`${sideNav} nav a[aria-current="page"]`)).toHaveText("Overview");
  await expect(page.getByRole("navigation", { name: "Instructor" })).toBeVisible();
});

test("instructor at 430px: bottom bar, no side navigation", async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 900 });
  await prepare(page, "instructor");
  await page.goto("/instructor");
  await expect(page.locator(bottomBar)).toBeVisible();
  await expect(page.locator(sideNav)).toBeHidden();
});

test("the phone column is kept from 640 to 1023px", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await prepare(page, "instructor");
  await page.goto("/instructor");
  await expect(page.locator(bottomBar)).toBeVisible();
  await expect(page.locator(sideNav)).toBeHidden();
  expect(await frameWidth(page)).toBe(430);
});

test("student at 1280px keeps the 430px column and the bottom bar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "student");
  await page.goto("/");
  await expect(page.locator(bottomBar)).toBeVisible();
  await expect(page.locator(sideNav)).toHaveCount(0);
  expect(await frameWidth(page)).toBe(430);
});

test("the instructor's Profile uses the desktop shell", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto("/profile");
  await expect(page.locator(sideNav)).toBeVisible();
});

test("resizing 1440 to 430 to 1440 keeps the page and what was typed", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await prepare(page, "instructor");
  await page.goto("/instructor/students");
  const search = page.getByPlaceholder(/search/i).first();
  await search.fill("Ada");
  await page.setViewportSize({ width: 430, height: 900 });
  await expect(page.locator(bottomBar)).toBeVisible();
  await expect(page.locator(sideNav)).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(sideNav)).toBeVisible();
  await expect(search).toHaveValue("Ada");
  expect(new URL(page.url()).pathname).toBe("/instructor/students");
});

test("side navigation: hover, keyboard focus and the skip link", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto("/instructor");
  const exams = page.locator(`${sideNav} nav a`, { hasText: "Exams" });
  await exams.hover();
  await expect(exams).toHaveCSS("background-color", "rgb(239, 236, 230)");
  expect((await exams.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  await page.mouse.move(700, 500);
  // the first Tab stop is the skip link, then the side navigation, then the content
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to main content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Tab");
  const first = page.locator(`${sideNav} nav a`).first();
  await expect(first).toBeFocused();
  await expect(first).not.toHaveCSS("outline-style", "none");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});
