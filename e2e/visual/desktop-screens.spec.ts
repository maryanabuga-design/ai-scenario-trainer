import { test } from "@playwright/test";
import { prepare, routes } from "./routes";

/**
 * Review pictures of the desktop instructor (docs/screens/desktop). Not a check: it only runs with
 * SCREENS=1 (`npm run screens:desktop`), so nothing is rewritten by accident.
 */
test.skip(!process.env.SCREENS, "pictures are made on request (SCREENS=1)");
test.use({ reducedMotion: "reduce" });

const out = (name: string, width: number) => `docs/screens/desktop/${name}-${width}.png`;
const shown = [
  "instructor-overview",
  "instructor-exams-list",
  "instructor-students",
  "instructor-content-empty",
  "instructor-content-with-topic",
  "instructor-student-detail",
  "instructor-content-import-result",
];

for (const width of [1024, 1280, 1440, 1920]) {
  test.describe(`desktop ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    for (const route of routes.filter((r) => shown.includes(r.name))) {
      test(route.name, async ({ page }) => {
        await prepare(page, route.role);
        await route.setup?.(page);
        await page.goto(route.path);
        if (route.ready) await page.locator(route.ready).first().waitFor();
        await route.after?.(page);
        await page.waitForTimeout(400);
        await page.screenshot({ path: out(route.name, width), animations: "disabled" });
      });
    }
  });
}

test.describe("dialog and notice at 1280px", () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  test("dialog and floating notice", async ({ page }) => {
    const route = routes.find((r) => r.name === "instructor-exam-active")!;
    await prepare(page, "instructor");
    await page.goto(route.path);
    await page.getByRole("button", { name: "Send reminder" }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: out("instructor-dialog", 1280), animations: "disabled" });
    await page.getByRole("dialog").getByRole("button", { name: "Send reminder" }).click();
    await page.locator("[data-flash]").waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: out("instructor-notice", 1280), animations: "disabled" });
  });
});
