import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { prepare, routes } from "./routes";

/**
 * No horizontal scroll and no clipped or overlapping text in the header and the main content, at
 * seven widths (DESIGN.md: Responsive instructor). Simple heuristics, not pixels.
 */
const widths = [360, 430, 640, 768, 960, 1024, 1100, 1152, 1280, 1440, 1600, 1920];
const instructorRoutes = routes.filter((route) => route.role === "instructor");

async function problems(page: Page) {
  return page.evaluate(() => {
    const found: string[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth)
      found.push(`horizontal scroll ${root.scrollWidth} > ${root.clientWidth}`);
    const scope = document.querySelector("main") ?? document.body;
    const textNodes = Array.from(
      scope.querySelectorAll<HTMLElement>("h1,h2,h3,p,dt,dd,span,a,button,label"),
    )
      .filter(
        (el) =>
          el.offsetParent !== null &&
          !el.classList.contains("sr-only") &&
          el.children.length === 0 &&
          (el.textContent ?? "").trim().length > 2,
      )
      .slice(0, 400);
    for (const el of textNodes) {
      const css = getComputedStyle(el);
      const clips = css.overflow === "hidden" || css.overflowX === "hidden";
      const ellipsis = css.textOverflow === "ellipsis" || css.webkitLineClamp !== "none";
      if (clips && !ellipsis && el.scrollWidth > el.clientWidth + 1 && css.display !== "inline")
        found.push(`clipped text: ${(el.textContent ?? "").trim().slice(0, 40)}`);
      const box = el.getBoundingClientRect();
      if (box.right > root.clientWidth + 1 || box.left < -1)
        found.push(`outside the window: ${(el.textContent ?? "").trim().slice(0, 40)}`);
    }
    // the header band must not be wider than the window
    const band = document.querySelector<HTMLElement>("[data-page-header-band]");
    if (band && band.getBoundingClientRect().width > root.clientWidth + 1)
      found.push("header band wider than the window");
    return found;
  });
}

for (const width of widths) {
  test.describe(`no overflow at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    for (const route of instructorRoutes) {
      test(route.name, async ({ page }) => {
        await prepare(page, route.role);
        await route.setup?.(page);
        await page.goto(route.path);
        if (route.ready) await page.locator(route.ready).first().waitFor();
        await route.after?.(page);
        await page.waitForTimeout(300);
        expect(await problems(page)).toEqual([]);
      });
    }
  });
}
