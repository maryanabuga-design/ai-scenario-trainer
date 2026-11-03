import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { FIXED_NOW, prepare } from "./routes";

/** The desktop layouts of the Overview and the Exams screens (DESIGN.md: Responsive instructor, step 2). */
test.use({ reducedMotion: "reduce" });

const exam = (n: number) => ({
  id: `grp-visual-${n}`,
  title: `Exam ${n}: Alarm and escape routes`,
  topicIds: ["S1", "S2"],
  groupIds: ["rescue-team"],
  attemptsAllowed: 3,
  questionCount: 20,
  timeLimit: 20,
  passMark: 80,
  deadline: "2026-11-10",
  createdAt: FIXED_NOW.getTime(),
  createdBy: "Instructor",
});

async function seedExams(page: Page, count: number) {
  await page.addInitScript(
    (value) => {
      if (!localStorage.getItem("ast.group-exams.v1"))
        localStorage.setItem("ast.group-exams.v1", JSON.stringify({ schema: 6, value }));
    },
    Array.from({ length: count }, (_, i) => exam(i + 1)),
  );
}

/** The x positions of the first row of the cards, so the columns can be counted. */
const columns = (page: Page, selector: string) =>
  page.locator(selector).evaluateAll((els) => {
    const top = els[0]?.getBoundingClientRect().top ?? 0;
    return els.filter((el) => Math.abs(el.getBoundingClientRect().top - top) < 2).length;
  });

test.describe("Overview", () => {
  const columnsOf = (page: Page) =>
    page.evaluate(() => {
      const actions = document.querySelector('[aria-labelledby="actions-title"]')!;
      const exams = document.querySelector('[aria-labelledby="exams-title"]')!;
      const a = actions.getBoundingClientRect();
      const e = exams.getBoundingClientRect();
      return { sameRow: Math.abs(a.top - e.top) < 2, aHeight: a.height, eHeight: e.height };
    });

  for (const [width, twoColumns] of [
    [1024, false],
    [1139, false],
    [1280, true],
    [1920, true],
  ] as const) {
    test(`${width}px: Needs your action and Exams ${twoColumns ? "side by side" : "stacked"}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await prepare(page, "instructor");
      await page.goto("/instructor");
      await page.locator("[data-weakest-topic]").waitFor();
      const result = await columnsOf(page);
      expect(result.sameRow).toBe(twoColumns);
      if (twoColumns) expect(Math.abs(result.aHeight - result.eHeight)).toBeLessThan(2);
    });
  }

  test("1280px: the group pill is left of the avatar, the readiness card is one row", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await prepare(page, "instructor");
    await page.goto("/instructor");
    await page.locator("[data-weakest-topic]").waitFor();
    const pill = await page.locator("[data-group-pill]").boundingBox();
    const avatar = await page.locator("main [data-avatar]").boundingBox();
    expect(pill && avatar && pill.x + pill.width <= avatar.x).toBe(true);
    const ready = await page.locator("[data-group-readiness]").boundingBox();
    const figure = await page.locator("[data-readiness-figure]").boundingBox();
    const strip = await page.locator("[data-readiness-strip]").boundingBox();
    expect(ready && figure && strip && figure.y > ready.y && strip.y < ready.y + 20).toBe(true);
    expect(strip && figure && strip.x > figure.x + 300).toBe(true);
  });

  test("430px: the Overview is still one column", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await prepare(page, "instructor");
    await page.goto("/instructor");
    await page.locator("[data-weakest-topic]").waitFor();
    expect((await columnsOf(page)).sameRow).toBe(false);
  });

  test("a linked card shows the hover look and keeps the focus ring", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams");
    const card = page.locator("[data-exam-card]").first();
    await card.hover();
    await expect(card).toHaveCSS("border-top-color", "rgb(201, 211, 184)");
    await expect(card).toHaveCSS("cursor", "pointer");
    await page.mouse.move(900, 700);
    await page.keyboard.press("Tab");
    await card.focus();
    await page.keyboard.press("Tab");
    await card.focus();
    await expect(card).toBeFocused();
  });
});

test.describe("Exams", () => {
  for (const [width, expected] of [
    [1024, 2],
    [1280, 2],
    [1339, 2],
    [1440, 3],
    [1920, 3],
  ] as const) {
    test(`${width}px: ${expected} columns of exam cards`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await prepare(page, "instructor");
      await seedExams(page, 7);
      await page.goto("/instructor/exams");
      await page.locator("[data-exam-card]").first().waitFor();
      expect(await columns(page, "[data-exam-card]")).toBe(expected);
    });
  }

  test("430px: one column and the full-width Assign exam button above the list", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await prepare(page, "instructor");
    await seedExams(page, 3);
    await page.goto("/instructor/exams");
    await page.locator("[data-exam-card]").first().waitFor();
    expect(await columns(page, "[data-exam-card]")).toBe(1);
    const assign = page.getByRole("link", { name: "Assign exam" });
    await expect(assign).toHaveCount(1);
    expect((await assign.boundingBox())?.width).toBeGreaterThan(300);
  });

  test("1280px: Assign exam is the one Primary, in the header; the closed toggle is a small inline link", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams");
    const assign = page.locator("[data-header-slot]").getByRole("link", { name: "Assign exam" });
    await expect(assign).toBeVisible();
    expect((await assign.boundingBox())?.height).toBe(44);
    const visibleAssign = await page
      .getByRole("link", { name: "Assign exam" })
      .evaluateAll((els) => els.filter((el) => el.getClientRects().length > 0).length);
    expect(visibleAssign).toBe(1);
    const toggle = page.getByRole("button", { name: /closed exams/ });
    const box = await toggle.boundingBox();
    expect(box && box.width < 260 && box.height >= 44).toBe(true);
    await expect(toggle).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await toggle.click();
    await expect(page.locator("#closed-exams [data-exam-card]")).toBeVisible();
    await expect(page.getByText("Closed 28 Oct")).toBeVisible();
  });

  test("430px: the closed toggle is still the full-width Secondary button", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams");
    const toggle = page.getByRole("button", { name: /closed exams/ });
    expect((await toggle.boundingBox())?.width).toBeGreaterThan(300);
    await expect(toggle).toHaveCSS("background-color", "rgb(224, 230, 214)");
  });
});

test.describe("Exam detail", () => {
  test("1280px: the info card is the sticky left column of 380px, the students are on the right", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 700 });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams/seed-active");
    await page.locator("[data-tried]").waitFor();
    const info = page.locator("[data-summary]");
    const box = await info.boundingBox();
    expect(box?.width).toBe(380);
    const students = await page.locator('[aria-labelledby="students-title"]').boundingBox();
    expect(box && students && students.x > box.x + box.width).toBe(true);
    await expect(info).toHaveCSS("position", "sticky");
    const before = (await info.boundingBox())?.y ?? 0;
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);
    const after = (await info.boundingBox())?.y ?? 0;
    expect(after).toBeGreaterThanOrEqual(23);
    expect(after).toBeLessThan(before);
    // the state pill sits in the header, the one below the header is hidden
    await expect(
      page.locator("[data-page-header-band]").getByText("Active · Due 9 Nov"),
    ).toBeVisible();
    await expect(page.locator("[data-state-pill]")).toBeHidden();
  });

  test("430px: the exam detail is the single column with the state pill below the header", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await prepare(page, "instructor");
    await page.goto("/instructor/exams/seed-active");
    await page.locator("[data-tried]").waitFor();
    await expect(page.locator("[data-state-pill]")).toBeVisible();
    const info = await page.locator("[data-summary]").boundingBox();
    const students = await page.locator('[aria-labelledby="students-title"]').boundingBox();
    expect(info && students && students.y > info.y + info.height - 1).toBe(true);
  });

  test("the Assign exam and Extend deadline forms are at most 560px wide", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await prepare(page, "instructor");
    for (const path of ["/instructor/exams/new", "/instructor/exams/seed-active/extend"]) {
      await page.goto(path);
      await page.locator("main h1").waitFor();
      const widest = await page.evaluate(() => {
        const root = document
          .querySelector("main h1")!
          .closest("[data-page-header-band]")!.parentElement!;
        return Math.max(
          ...Array.from(root.children)
            .filter((el) => !el.hasAttribute("data-page-header-band"))
            .map((el) => el.getBoundingClientRect().width),
        );
      });
      expect(widest).toBeLessThanOrEqual(560);
    }
  });

  test("one Primary on screen at 1280 and at 430 for the Exams screens", async ({ page }) => {
    for (const width of [1280, 430]) {
      await page.setViewportSize({ width, height: 900 });
      await prepare(page, "instructor");
      for (const path of ["/instructor/exams", "/instructor/exams/seed-active"]) {
        await page.goto(path);
        await page.waitForTimeout(500);
        const primaries = await page.evaluate(() =>
          Array.from(
            document.querySelectorAll<HTMLElement>(
              "main a, main button, [data-full-bleed] a, [data-full-bleed] button",
            ),
          )
            .filter(
              (el) =>
                el.getClientRects().length > 0 &&
                getComputedStyle(el).backgroundColor === "rgb(70, 81, 45)",
            )
            .map((el) => el.textContent?.trim()),
        );
        expect(primaries.length, `${path} at ${width}`).toBeLessThanOrEqual(1);
      }
    }
  });
});
