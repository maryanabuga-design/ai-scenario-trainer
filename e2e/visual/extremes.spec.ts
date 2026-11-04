import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { prepare } from "./routes";

/** Long names, long titles and 200 students (a test dataset that exists only here), DESIGN.md: Responsive instructor, step 7. */
test.use({ reducedMotion: "reduce" });
test.setTimeout(90_000);

const LONG = "Alexandria-Wilhelmina Konstantinopolous-Featherstonehaugh";

/** 200 local student accounts with long names, added to the signed-in instructor's browser. */
async function withStudents(page: Page, count: number) {
  await page.addInitScript(
    ([n, long]) => {
      const raw = localStorage.getItem("ast.auth.v1");
      if (!raw) return;
      const state = JSON.parse(raw);
      if (state.value.accounts.length > 1) return;
      for (let i = 0; i < Number(n); i++) {
        state.value.accounts.push({
          name: i % 3 === 0 ? `${long} ${i}` : `Student ${String(i).padStart(3, "0")}`,
          email: `student${i}@example.org`,
          role: "student",
          createdAt: 2 + i,
          onboardingDone: true,
        });
      }
      localStorage.setItem("ast.auth.v1", JSON.stringify(state));
    },
    [String(count), LONG],
  );
}

test.describe("200 students", () => {
  for (const width of [1024, 1280, 1920]) {
    test(`the Students table at ${width}px: no overflow, long names cut, sticky header`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await prepare(page, "instructor");
      await withStudents(page, 200);
      await page.goto("/instructor/students");
      await page.locator("[data-students-table]").waitFor();
      await expect(page.locator("[data-student-count]")).toContainText(/2\d\d students/);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(over).toBe(false);
      const cut = await page.evaluate(() => {
        const names = Array.from(
          document.querySelectorAll<HTMLElement>("[data-table-link] span.truncate"),
        );
        const long = names.find((el) => el.textContent!.startsWith("Alexandria"));
        if (!long) return null;
        return {
          scroll: long.scrollWidth,
          client: long.clientWidth,
          ellipsis: getComputedStyle(long).textOverflow,
        };
      });
      expect(cut).not.toBeNull();
      expect(cut!.ellipsis).toBe("ellipsis");
      // the header row stays at the top of the window while the rows scroll under it
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(300);
      const th = await page.locator("[data-students-table] thead th").first().boundingBox();
      expect(th!.y).toBeGreaterThanOrEqual(-1);
      expect(th!.y).toBeLessThan(40);
      const rows = await page.locator("[data-table-row]").count();
      expect(rows).toBeGreaterThan(190);
    });
  }

  test("the phone list with 200 students keeps its width at 430px", async ({ page }) => {
    await page.setViewportSize({ width: 430, height: 900 });
    await prepare(page, "instructor");
    await withStudents(page, 200);
    await page.goto("/instructor/students");
    await page.locator("[data-student]").first().waitFor();
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(over).toBe(false);
  });

  test("sorting 200 rows by name keeps the table intact", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await prepare(page, "instructor");
    await withStudents(page, 200);
    await page.goto("/instructor/students");
    await page.locator("[data-students-table]").waitFor();
    await page
      .locator("[data-students-table] thead th", { hasText: "STUDENT" })
      .getByRole("button")
      .click();
    const names = (
      await page.locator('[data-students-table] tbody th[scope="row"]').allInnerTexts()
    ).map((text) => text.split("\n").pop()!.trim());
    // the browser's own collation, the same one the table sorts with
    const sorted = await page.evaluate(
      (list) => [...list].sort((a, b) => a.localeCompare(b)),
      names,
    );
    const at = names.findIndex((n, i) => n !== sorted[i]);
    expect(
      at < 0
        ? "same"
        : `${at}: ${JSON.stringify(names.slice(at, at + 3))} vs ${JSON.stringify(sorted.slice(at, at + 3))}`,
    ).toBe("same");
  });
});

test("a long exam title and a long topic name do not break the exam detail at 1280px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await prepare(page, "instructor");
  await page.addInitScript(
    (title) => {
      if (localStorage.getItem("ast.group-exams.v1")) return;
      localStorage.setItem(
        "ast.group-exams.v1",
        JSON.stringify({
          schema: 6,
          value: [
            {
              id: "grp-long",
              title,
              topicIds: ["S1", "S2", "S3", "S4", "S5", "S6"],
              groupIds: ["rescue-team"],
              attemptsAllowed: 3,
              questionCount: 20,
              timeLimit: 20,
              passMark: 80,
              deadline: "2026-11-10",
              createdAt: 1,
              createdBy: "Instructor",
            },
          ],
        }),
      );
    },
    `Final comprehensive assessment of evacuation, first aid, communication and coordination ${"in a crisis ".repeat(6)}`,
  );
  for (const path of ["/instructor/exams", "/instructor/exams/grp-long"]) {
    await page.goto(path);
    await page.locator("main h1").waitFor();
    await page.waitForTimeout(300);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(over, path).toBe(false);
  }
});
