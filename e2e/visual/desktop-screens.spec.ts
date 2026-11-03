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
  "instructor-content-course",
  "instructor-content-built-in",
  "instructor-content-set-review",
  "instructor-content-question-edit",
  "instructor-student-detail",
  "instructor-content-import-result",
  "instructor-exam-active",
  "instructor-exam-closed",
  "instructor-exam-new-no-results",
  "instructor-exams-list-new",
  "instructor-exam-assign",
  "instructor-exam-extend",
  "instructor-topic-students",
  "instructor-students-invite",
  "instructor-profile",
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

for (const width of [1024, 1280, 1440, 1920]) {
  test(`exams: closed exams open, ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams");
    await page.getByRole("button", { name: /Show closed exams/ }).click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: out("instructor-exams-closed-open", width),
      animations: "disabled",
    });
    await page.close();
  });
}

for (const width of [1024, 1280, 1440, 1920]) {
  test(`students states, ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await prepare(page, "instructor");
    await page.goto("/instructor/students");
    await page.locator("[data-students-table]").waitFor();
    await page
      .getByRole("button", { name: "Filter by status" })
      .and(page.locator("[data-filter-button-desk]"))
      .click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-students-filter-open", width),
      animations: "disabled",
    });
    await page.keyboard.press("Escape");
    await page.goto("/instructor/students?filter=needs");
    await page.locator("[data-status-filter-chip]").waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-students-filtered", width),
      animations: "disabled",
    });
    await page.goto("/instructor/students");
    await page.getByPlaceholder("Search students").fill("Zimmerman");
    await page.locator("[data-empty=search]").waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-students-no-results", width),
      animations: "disabled",
    });
    await page.goto("/instructor/students?view=topics");
    await page.locator("[data-topic-card]").first().waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-students-topics", width),
      animations: "disabled",
    });
    await page.close();
  });
}

for (const width of [1024, 1280, 1440, 1920]) {
  test(`student detail states, ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await prepare(page, "instructor");
    await page.goto("/instructor/students");
    await page.locator("[data-table-link]").first().click();
    await page.locator("[data-student-header]").waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: out("instructor-student-detail-needs", width),
      animations: "disabled",
    });
    await page.goto("/instructor/students/stu-06");
    await page.locator("[data-student-header]").waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: out("instructor-student-detail-new", width),
      animations: "disabled",
    });
    await page.close();
  });
}

for (const width of [1024, 1280, 1440, 1920]) {
  test(`content states, ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await prepare(page, "instructor");
    await page.goto("/instructor/content");
    await page.locator("[data-content-empty]").waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({ path: out("instructor-content-empty", width), animations: "disabled" });
    await page.goto("/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await page.getByText("sample-document.xlsx").first().waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-content-import-file", width),
      animations: "disabled",
    });
    await page.getByRole("button", { name: /^Import/ }).click();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: out("instructor-content-analysing", width),
      animations: "disabled",
    });
    await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 20_000 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-content-draft-ready", width),
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Open draft" }).click();
    await page
      .locator("[data-tab-bar], [data-package-status]")
      .first()
      .waitFor({ state: "attached" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: out("instructor-topic-guide", width), animations: "disabled" });
    for (const tab of ["Steps", "Scenario", "Quiz"]) {
      await page.getByRole("tab", { name: new RegExp(`^${tab}`) }).click();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: out(`instructor-topic-${tab.toLowerCase()}`, width),
        animations: "disabled",
      });
    }
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: /Edit title and summary/ }).click();
    await page.getByLabel("Title").waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-topic-details-edit", width),
      animations: "disabled",
    });
    await page.goBack();
    await page
      .getByRole("tab", { name: /^Quiz/ })
      .click()
      .catch(() => undefined);
    await page.locator("[data-questions-table] [data-table-link]").first().click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: out("instructor-topic-item-edit", width),
      animations: "disabled",
    });
    await page.goBack();
    await page
      .locator("[data-header-slot]")
      .getByRole("button", { name: /Preview as student/ })
      .or(page.locator("[data-header-slot]").getByRole("link", { name: /Preview as student/ }))
      .first()
      .click()
      .catch(() => undefined);
    await page.waitForTimeout(700);
    await page.screenshot({ path: out("instructor-topic-preview", width), animations: "disabled" });
    await page.close();
  });
}

for (const width of [1024, 1280, 1440, 1920]) {
  test(`forms, review and preview, ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
    });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams/new");
    await page.getByLabel("Exam title").fill("Evacuation basics");
    await page.getByText("S1 Responding to an alarm", { exact: true }).click();
    await page.getByText("S2 Checking the route", { exact: true }).click();
    await page.getByText("In 1 week", { exact: true }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out("instructor-assign-filled", width), animations: "disabled" });
    await page.locator("[data-card-footer]").getByRole("button", { name: "Cancel" }).click();
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-assign-discard", width),
      animations: "disabled",
    });
    await page.goto("/profile/edit");
    await page.getByLabel("Full name").waitFor();
    await page.waitForTimeout(300);
    await page.screenshot({ path: out("instructor-profile-edit", width), animations: "disabled" });
    await page.goto("/instructor/content/import");
    await page.locator("[data-file-input]").setInputFiles("e2e/fixtures/problems.xlsx");
    await page.getByRole("button", { name: "Import and review" }).click();
    const ready = page.getByRole("heading", { name: "Draft is ready" });
    const partial = page.getByRole("button", { name: "Continue" });
    await ready.or(partial).waitFor({ timeout: 15000 });
    if (await partial.isVisible()) await partial.click();
    await ready.waitFor();
    await page.getByRole("button", { name: "Open draft" }).click();
    await page.locator("[data-tab-bar]").waitFor();
    const topicUrl = page.url().replace(/\?.*$/, "");
    await page
      .locator("[data-header-slot]")
      .getByRole("button", { name: /^Review \d+ items?/ })
      .click();
    await page.locator("[data-review-progress]").waitFor();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: out("instructor-review-walkthrough", width),
      animations: "disabled",
    });
    await page.goto(`${topicUrl}/preview/quiz`);
    await page.locator("[data-phone-frame]").waitFor();
    await page.waitForTimeout(700);
    await page.screenshot({
      path: out("instructor-preview-framed", width),
      animations: "disabled",
    });
    await page.close();
  });
}

for (const width of [1100, 1600]) {
  test(`intermediate widths, ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await prepare(page, "instructor");
    for (const [name, path, ready] of [
      ["overview", "/instructor", "[data-weakest-topic]"],
      ["exams", "/instructor/exams", "[data-exam-card]"],
      ["exam-detail", "/instructor/exams/seed-active", "[data-tried]"],
      ["students", "/instructor/students", "[data-students-table]"],
      ["student-detail", "/instructor/students/stu-02", "[data-student-header]"],
      ["course", "/instructor/content/course", "[data-built-in]"],
    ] as const) {
      await page.goto(path);
      await page.locator(ready).first().waitFor();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: out(`instructor-width-${name}`, width),
        animations: "disabled",
      });
    }
  });
}

for (const width of [1280, 1920]) {
  test(`focus, sticky footer and docked sheet, ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams");
    await page.locator("[data-exam-card]").first().waitFor();
    await page.locator("[data-exam-card]").first().focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    await page.screenshot({ path: out("instructor-focus-card", width), animations: "disabled" });
    await page.goto("/instructor/students");
    await page.locator("[data-table-link]").first().waitFor();
    await page.locator("[data-table-link]").nth(1).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    await page.screenshot({ path: out("instructor-focus-row", width), animations: "disabled" });
    await page.locator("[data-side-nav] nav a", { hasText: "Exams" }).focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    await page.screenshot({ path: out("instructor-focus-sidenav", width), animations: "disabled" });
    await page.goto("/instructor/exams/new");
    await page.getByLabel("Exam title").fill("Evacuation basics");
    await page.getByText("S1 Responding to an alarm", { exact: true }).click();
    await page.getByText("S3 Moving through smoke", { exact: true }).click();
    await page.locator("[data-card-footer]").getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Tab");
    await page.waitForTimeout(300);
    await page.screenshot({ path: out("instructor-focus-dialog", width), animations: "disabled" });
    await page.keyboard.press("Escape");
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(300);
    await page.screenshot({
      path: out("instructor-assign-sticky-footer", width),
      animations: "disabled",
    });
    await page.goto("/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await page.getByRole("button", { name: /^Import/ }).click();
    await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 20000 });
    await page.getByRole("button", { name: "Open draft" }).click();
    await page.locator("[data-tab-bar]").waitFor();
    await page.goto(page.url().replace(/\?.*$/, "") + "/preview/quiz");
    const frame = page.locator("[data-phone-frame]");
    await frame.waitFor();
    await page.waitForTimeout(500);
    await frame.getByText("Find the two nearest exits").click();
    await frame.getByRole("button", { name: "Check" }).click();
    await page.locator(".bottom-sheet").first().waitFor();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: out("instructor-preview-feedback-sheet", width),
      animations: "disabled",
    });
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
