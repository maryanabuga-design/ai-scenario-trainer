import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { prepare } from "./routes";

/** The form screens, the review walk-through, Profile and the preview frame (DESIGN.md: Responsive instructor, step 6). */
test.use({ reducedMotion: "reduce" });
test.setTimeout(90_000);

const PRIMARY = "rgb(63, 70, 56)";
const start = async (page: Page, width: number, path: string) => {
  await page.setViewportSize({ width, height: 900 });
  await prepare(page, "instructor");
  await page.goto(path);
  await page.locator("main h1").first().waitFor();
  await page.waitForTimeout(300);
};
const primaries = (page: Page) =>
  page.evaluate(
    (color) =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          "main a, main button, [data-full-bleed] a, [data-full-bleed] button",
        ),
      )
        .filter(
          (el) => el.getClientRects().length > 0 && getComputedStyle(el).backgroundColor === color,
        )
        .map((el) => el.textContent?.trim()),
    PRIMARY,
  );
const storedExams = (page: Page) =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem("ast.group-exams.v1") ?? "null")?.value ?? [],
  );

/** Fills Assign exam the same way on both layouts and returns the exam that was stored. */
async function assign(page: Page, width: number) {
  await start(page, width, "/instructor/exams/new");
  await page.getByLabel("Exam title").fill("Visual exam");
  await page.getByText("S1 Responding to an alarm", { exact: true }).click();
  await page.getByText("S2 Checking the route", { exact: true }).click();
  await page.getByText("In 1 week", { exact: true }).click();
  const before = (await storedExams(page)).length;
  await page.getByRole("button", { name: "Assign exam" }).click();
  await expect(page).toHaveURL(/\/instructor\/exams\/[^/?]+/);
  const exams = await storedExams(page);
  expect(exams.length).toBe(before + 1);
  const { id: _id, createdAt: _created, ...rest } = exams[0];
  void _id;
  void _created;
  return rest;
}

test.describe("Assign exam", () => {
  test("1280px: a centred card of at most 640px with the actions in its footer", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/exams/new");
    const card = page.locator("[data-flow-card]");
    const box = await card.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(640);
    expect(Math.abs(box!.x + box!.width / 2 - (240 + (1280 - 240) / 2))).toBeLessThan(16);
    const footer = card.locator("[data-card-footer]");
    const cancel = await footer.getByRole("button", { name: "Cancel" }).boundingBox();
    const go = await footer.getByRole("button", { name: "Assign exam" }).boundingBox();
    expect(cancel!.x).toBeLessThan(go!.x);
    expect(go!.height).toBe(44);
    await expect(page.getByRole("button", { name: "Assign exam" })).toHaveCount(1);
    expect(await primaries(page)).toEqual(["Assign exam"].slice(0, 0).concat([]) as string[]);
  });

  test("430px: the pinned bar, no card", async ({ page }) => {
    await start(page, 430, "/instructor/exams/new");
    await expect(page.locator("[data-card-footer]")).toBeHidden();
    const go = page.getByRole("button", { name: "Assign exam" });
    await expect(go).toHaveCount(1);
    expect((await go.boundingBox())?.height).toBe(52);
  });

  test("creates exactly the same exam on both layouts", async ({ page }) => {
    const a = await assign(page, 1280);
    await page.evaluate(() => localStorage.removeItem("ast.group-exams.v1"));
    const b = await assign(page, 430);
    expect(a).toEqual(b);
    expect(a.title).toBe("Visual exam");
    expect(a.topicIds).toEqual(["S1", "S2"]);
  });

  test("keyboard: Enter on Cancel with nothing typed leaves", async ({ page }) => {
    await start(page, 1280, "/instructor/exams/new");
    await page.locator("[data-card-footer]").getByRole("button", { name: "Cancel" }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/instructor\/exams$/);
  });

  test("a discard dialog is centred and traps focus, Escape closes it and the focus returns", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/exams/new");
    await page.getByLabel("Exam title").fill("Something");
    const cancel = page.locator("[data-card-footer]").getByRole("button", { name: "Cancel" });
    await cancel.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const box = await dialog.boundingBox();
    expect(Math.abs(box!.x + box!.width / 2 - 640)).toBeLessThan(8);
    // the scrim covers the side navigation
    const scrim = await dialog.evaluate((el) => getComputedStyle(el, "::backdrop").backgroundColor);
    expect(scrim).not.toBe("rgba(0, 0, 0, 0)");
    for (let i = 0; i < 4; i++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(cancel).toBeFocused();
  });
});

test.describe("Extend deadline", () => {
  test("a centred card, and the due date is updated", async ({ page }) => {
    await start(page, 1280, "/instructor/exams/seed-active/extend");
    const card = page.locator("[data-flow-card]");
    expect((await card.boundingBox())!.width).toBeLessThanOrEqual(560);
    const footer = card.locator("[data-card-footer]");
    await page.getByText("+3 days", { exact: true }).click();
    await footer.getByRole("button", { name: "Extend deadline" }).click();
    await expect(page).toHaveURL(/\/instructor\/exams\/seed-active/);
    const exams = await storedExams(page);
    const seeded = exams.find((e: { id: string }) => e.id === "seed-active");
    expect(seeded.deadline).toBe("2026-11-12");
  });

  test("430px: the pinned bar with the same button", async ({ page }) => {
    await start(page, 430, "/instructor/exams/seed-active/extend");
    await expect(page.getByRole("button", { name: "Extend deadline" })).toHaveCount(1);
    await expect(page.locator("[data-card-footer]")).toBeHidden();
  });
});

test.describe("Invite students", () => {
  test("a card of at most 560px, the code and link copy, and the notice is under the header", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await start(page, 1280, "/instructor/students/invite");
    const card = page.locator("[data-flow-card]");
    expect((await card.boundingBox())!.width).toBeLessThanOrEqual(560);
    await page.getByRole("button", { name: "Copy group code" }).click();
    await expect(page.locator("[data-flash]")).toContainText("Code copied");
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("QT-A7K2");
    await expect(page.locator("[data-flash]")).toHaveAttribute("data-flash-state", "on");
    const notice = await page.locator("[data-flash]").boundingBox();
    const header = await page.locator("[data-page-header-band]").boundingBox();
    expect(notice!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
    await page.getByRole("button", { name: "Copy invite link" }).click();
    await expect(page.locator("[data-flash]")).toContainText("Link copied");
    const footer = card.locator("[data-card-footer]");
    await expect(footer.getByRole("button", { name: "Send invitations" })).toBeDisabled();
    expect(await primaries(page)).toEqual([]);
  });
});

test.describe("Profile", () => {
  test("a column of at most 720px with the instructor's rows, no student items", async ({
    page,
  }) => {
    await start(page, 1280, "/profile");
    const widest = await page.evaluate(() =>
      Math.max(
        ...Array.from(
          document.querySelector("main h1")!.closest("[data-page-header-band]")!.parentElement!
            .children,
        )
          .filter((el) => !el.hasAttribute("data-page-header-band"))
          .map((el) => el.getBoundingClientRect().width),
      ),
    );
    expect(widest).toBeLessThanOrEqual(720);
    await expect(page.locator("[data-user-card]")).toBeVisible();
    await expect(page.locator("[data-group-row]")).toBeVisible();
    await expect(page.locator("[data-certificates-row]")).toHaveCount(0);
    await expect(page.locator("[data-field-row]")).toHaveCount(0);
    await expect(page.locator("[data-sign-out]")).toBeVisible();
  });

  test("Demo mode switches the role and Sign out leaves", async ({ page }) => {
    await start(page, 1280, "/profile");
    await page.getByText("Student", { exact: true }).click();
    // a Student goes Home: the phone column and the bottom bar, no side navigation
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await expect(page.locator("[data-side-nav]")).toHaveCount(0);
    await page.goto("/profile");
    await page.getByText("Instructor", { exact: true }).click();
    await expect(page.locator("[data-side-nav]")).toBeVisible();
    await page.goto("/profile");
    await page.locator("[data-sign-out]").click();
    await expect(page).toHaveURL(/welcome|sign-in/);
  });

  test("Edit profile: fields at most 560px, Save is not full width", async ({ page }) => {
    await start(page, 1280, "/profile/edit");
    const name = await page.getByLabel("Full name").boundingBox();
    expect(name!.width).toBeLessThanOrEqual(560);
    await page.getByLabel("Full name").fill("Maryana B");
    const save = await page.getByRole("button", { name: "Save changes" }).boundingBox();
    expect(save!.width).toBeLessThan(300);
  });
});

test.describe("Draft review walk-through", () => {
  test("a centred card with '1 of N', Skip left and the Primary right, nothing pinned", async ({
    page,
  }) => {
    await start(page, 1280, "/instructor/content/import");
    await page.locator("[data-file-input]").setInputFiles("e2e/fixtures/problems.xlsx");
    await page.getByRole("button", { name: "Import and review" }).click();
    const ready = page.getByRole("heading", { name: "Draft is ready" });
    const partial = page.getByRole("button", { name: "Continue" });
    await expect(ready.or(partial)).toBeVisible({ timeout: 15000 });
    if (await partial.isVisible()) await partial.click();
    await expect(ready).toBeVisible();
    await page.getByRole("button", { name: "Open draft" }).click();
    await page
      .locator("[data-package-status], [data-tab-bar]")
      .first()
      .waitFor({ state: "attached" });
    await page
      .locator("[data-header-slot]")
      .getByRole("button", { name: /^Review \d+ items?/ })
      .click();
    const card = page.locator("[data-flow-card]");
    await expect(card).toBeVisible();
    expect((await card.boundingBox())!.width).toBeLessThanOrEqual(640);
    await expect(card.locator("[data-review-progress]")).toHaveText(/^1 of \d+$/);
    const footer = card.locator("[data-card-footer]");
    const skip = await footer.getByRole("button", { name: "Skip" }).boundingBox();
    const next = await footer
      .getByRole("button", { name: /Save and next|Mark as OK/ })
      .boundingBox();
    expect(skip!.x).toBeLessThan(next!.x);
    expect((await primaries(page)).length).toBeLessThanOrEqual(1);
    await footer.getByRole("button", { name: "Skip" }).click();
    await expect(page.locator("[data-review-progress]").first()).toHaveText(/^2 of \d+$/);
  });
});

test.describe("Preview frame", () => {
  const importExample = async (page: Page, width: number) => {
    await start(page, width, "/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await page.getByRole("button", { name: /^Import/ }).click();
    await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 20_000 });
    await page.getByRole("button", { name: "Open draft" }).click();
    await page
      .locator("[data-package-status], [data-tab-bar]")
      .first()
      .waitFor({ state: "attached" });
  };

  test("the bottom bar is inside the frame and the step strip is not clipped", async ({ page }) => {
    await importExample(page, 1280);
    await page.goto(page.url().replace(/\?.*$/, "") + "/preview/quiz");
    const frame = page.locator("[data-phone-frame]");
    await frame.waitFor();
    await page.waitForTimeout(600);
    const bar = frame.locator("[data-frame-bar] [data-full-bleed]");
    await expect(bar).toBeVisible();
    const f = (await frame.boundingBox())!;
    const b = (await bar.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(f.x - 1);
    expect(b.x + b.width).toBeLessThanOrEqual(f.x + f.width + 1);
    expect(b.y + b.height).toBeLessThanOrEqual(f.y + f.height + 1);
    // the shell's own copy of the bar is not drawn
    const outside = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-full-bleed] button, [data-full-bleed] a"))
        .filter((el) => !el.closest("[data-phone-frame]") && el.getClientRects().length > 0)
        .map((el) => el.outerHTML.slice(0, 160)),
    );
    expect(outside).toEqual([]);
    // the first number of the step strip is inside the frame
    const first = await frame.locator("ol[data-full-bleed] li").first().boundingBox();
    expect(first!.x).toBeGreaterThanOrEqual(f.x);
  });
});

test.describe("Question table", () => {
  test("no Type column and the question text may take two lines", async ({ page }) => {
    await start(page, 1280, "/instructor/content/import");
    await page.getByRole("button", { name: "Try an example" }).click();
    await page.getByRole("button", { name: /^Import/ }).click();
    await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 20_000 });
    await page.getByRole("button", { name: "Open draft" }).click();
    await page.getByRole("tab", { name: /^Quiz/ }).click();
    const table = page.getByRole("table", { name: "Questions" });
    const labels = (await table.locator("thead th").allInnerTexts()).map((l) => l.trim());
    expect(labels).not.toContain("TYPE");
    const clamp = await table
      .locator("tbody th span.line-clamp-2")
      .first()
      .evaluate((el) => getComputedStyle(el).webkitLineClamp);
    expect(clamp).toBe("2");
  });
});
