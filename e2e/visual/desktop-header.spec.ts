import { expect, test } from "@playwright/test";
import { prepare } from "./routes";

/** The shared desktop page header and the page actions declared once (DESIGN.md: Responsive instructor, step 2). */
test.use({ reducedMotion: "reduce" });

const examPath = "/instructor/exams/seed-active";

test("1280px: no band, the divider, the actions at the right of the header", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto(examPath);
  const band = page.locator("[data-page-header-band]");
  await expect(band).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(band).toHaveCSS("border-bottom-width", "1px");
  await expect(band).toHaveCSS("border-bottom-color", "rgb(228, 223, 213)");
  const slot = page.locator("[data-header-slot]");
  await expect(slot.getByRole("button", { name: "Send reminder" })).toBeVisible();
  const send = await slot.getByRole("button", { name: "Send reminder" }).boundingBox();
  const more = await page.getByRole("button", { name: "More actions" }).boundingBox();
  expect(send && more && send.x + send.width <= more.x).toBe(true);
  expect(send?.height).toBe(44);
  // the pinned bar is hidden at this width
  await expect(
    page.locator('[data-full-bleed]:has(button:text("Send reminder"))').last(),
  ).toBeHidden();
  // one visible Primary
  const visible = await page
    .getByRole("button", { name: "Send reminder" })
    .evaluateAll((els) => els.filter((el) => el.getClientRects().length > 0).length);
  expect(visible).toBe(1);
});

test("430px: the pinned bar shows the button in the same place, the header area is empty", async ({
  page,
}) => {
  await page.setViewportSize({ width: 430, height: 900 });
  await prepare(page, "instructor");
  await page.goto(examPath);
  const send = page.getByRole("button", { name: "Send reminder" });
  await expect(send).toHaveCount(1);
  const box = await send.boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  expect(box?.height).toBe(52);
  await expect(page.locator("[data-header-slot]")).toBeHidden();
  const band = page.locator("[data-page-header-band]");
  await expect(band).toHaveCSS("background-color", "rgb(240, 236, 230)");
});

test("an action declared once does the same in both places", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto(examPath);
  await page.locator("[data-header-slot]").getByRole("button", { name: "Send reminder" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("the floating notice appears under the header and not over the title", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto(examPath);
  await page.locator("[data-header-slot]").getByRole("button", { name: "Send reminder" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Send reminder" }).click();
  const flash = page.locator("[data-flash]");
  await flash.waitFor();
  await page.waitForTimeout(400);
  const notice = await flash.boundingBox();
  const title = await page.locator("h1").boundingBox();
  const header = await page.locator("[data-page-header-band]").boundingBox();
  expect(notice && header && notice.y >= header.y + header.height).toBe(true);
  expect(notice && title && notice.y >= title.y + title.height).toBe(true);
  const centre = (notice?.x ?? 0) + (notice?.width ?? 0) / 2;
  expect(Math.abs(centre - 760)).toBeLessThan(2);
});

test("keyboard order: the header actions come before the content", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.goto(examPath);
  const order = await page.evaluate(() => {
    const focusable = Array.from(
      document.querySelectorAll<HTMLElement>("main a[href], main button"),
    ).filter((el) => el.getClientRects().length > 0);
    return focusable
      .slice(0, 4)
      .map((el) => el.getAttribute("aria-label") ?? el.textContent?.trim());
  });
  expect(order[0]).toMatch(/Back to/);
  expect(order[1]).toBe("Send reminder");
  expect(order[2]).toBe("More actions");
});
