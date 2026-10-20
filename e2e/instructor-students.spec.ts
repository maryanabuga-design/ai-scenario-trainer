import { readFileSync } from "node:fs";
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

type Q = { id: string; section: string; correctOptionId: string; options: { id: string }[] };
const quiz: Q[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;

const OLIVE_TINT = "rgb(224, 230, 214)";
const SUCCESS_INK = "rgb(68, 104, 58)";
const ATTENTION_INK = "rgb(111, 81, 32)";
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const navLinks = (page: Page) => page.getByRole("navigation", { name: "Main" }).getByRole("link");
const rows = (page: Page) => page.locator("[data-student]:visible");

/** The status of every visible row, in order. */
const statuses = (page: Page) =>
  rows(page).evaluateAll((els) =>
    els.map((el) => el.querySelector("[data-status-text]")!.getAttribute("data-status-text")!),
  );
const names = (page: Page) =>
  rows(page).evaluateAll((els) =>
    els.map((el) =>
      el.querySelector(".type-body-strong.truncate")!.childNodes[0].textContent!.trim(),
    ),
  );

const rank = { needs: 0, almost: 1, ready: 2 } as Record<string, number>;
const statusFor = (readiness: number) =>
  readiness >= 80 ? "ready" : readiness >= 60 ? "almost" : "needs";

for (const width of [360, 430]) {
  test.describe(`Instructor students at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the navigation is Overview, Exams, Students, Profile; the detail has no navigation", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await expect(navLinks(page)).toHaveText(["Overview", "Exams", "Students", "Profile"]);
      await expect(
        page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Students" }),
      ).toHaveAttribute("aria-current", "page");
      await rows(page).first().click();
      await expect(page).toHaveURL(/\/instructor\/students\/[^/]+\?from=students/);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    });

    test("the list: band, group line, selector, 72px rows with chevron, sorted by status, no percent", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await expect(page.getByRole("heading", { name: "Students", level: 1 })).toBeVisible();
      await expect(page.locator("[data-page-header-band]:visible")).toContainText(
        "Group A · 15 students",
      );
      const radios = page.getByRole("radio");
      await expect(radios).toHaveCount(3);
      await expect(page.getByRole("radio", { name: "All" })).toBeChecked();
      await expect(rows(page)).toHaveCount(15);
      for (const row of await rows(page).all()) {
        const box = (await row.boundingBox())!;
        expect(box.height).toBe(72);
        expect(box.x).toBe(16);
        expect(await row.evaluate((el) => !!el.querySelector("svg.lucide-chevron-right"))).toBe(
          true,
        );
        // the avatar, a one-line name and a muted line "Field · n topics to review"
        await expect(row.locator("[data-status-text]")).toBeVisible();
      }
      await expect(rows(page).first().locator("span.type-small.truncate").first()).toContainText(
        /(Rescue services|Paramedics|Military|Civil protection|Other|Not set) · (\d+ topics? to review|No topics to review)/,
      );
      const order = (await statuses(page)).map((s) => rank[s]);
      expect(order).toEqual([...order].sort((a, b) => a - b));
      // alphabetical inside each status
      const list = await names(page);
      const kinds = await statuses(page);
      for (let i = 1; i < list.length; i++) {
        if (kinds[i] === kinds[i - 1])
          expect(list[i - 1].localeCompare(list[i])).toBeLessThanOrEqual(0);
      }
      await expect(page.locator('[data-student="maryana@example.com"]')).toContainText(
        "Your demo account",
      );
      expect(await page.locator("main").innerText()).not.toContain("%");
      await expect(page.locator("[data-demo-note]:visible")).toHaveText(
        "Demo group. Student data on this screen is simulated.",
      );
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the status text and tokens: Needs attention is amber, Ready is success, each with an icon", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const needs = page.locator('[data-status-text="needs"]').first();
      const ready = page.locator('[data-status-text="ready"]').first();
      await expect(needs).toHaveText("Needs attention");
      await expect(ready).toHaveText("Ready");
      await expect(page.locator('[data-status-text="almost"]').first()).toHaveText("Almost ready");
      expect(await needs.evaluate((el) => getComputedStyle(el).color)).toBe(ATTENTION_INK);
      expect(await ready.evaluate((el) => getComputedStyle(el).color)).toBe(SUCCESS_INK);
      for (const status of [needs, ready]) {
        expect(await status.evaluate((el) => el.querySelectorAll("svg").length)).toBe(1);
      }
    });

    test("the filters: Needs attention and Certified, and the choice is in the address", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      await page.locator("label", { hasText: /^Needs attention$/ }).click();
      await expect(page).toHaveURL(/filter=needs$/);
      const needs = await statuses(page);
      expect(needs.length).toBeGreaterThan(0);
      expect(needs.every((s) => s === "needs")).toBe(true);
      await page.locator("label", { hasText: /^Certified$/ }).click();
      await expect(page).toHaveURL(/filter=certified$/);
      const certified = await rows(page).count();
      expect(certified).toBeGreaterThan(0);
      expect(certified).toBeLessThan(15);
      await page.locator("label", { hasText: /^All$/ }).click();
      await expect(rows(page)).toHaveCount(15);
      // a filter in the address is honoured on a fresh load
      await page.goto("/instructor/students?filter=needs");
      await expect(page.getByRole("radio", { name: "Needs attention" })).toBeChecked();
    });

    test("Back from a student returns to the same filter", async ({ page }) => {
      await page.goto("/instructor/students?filter=needs");
      const first = rows(page).first();
      const id = await first.getAttribute("data-student");
      await first.click();
      await expect(page).toHaveURL(/\/instructor\/students\/.+filter=needs/);
      await page.getByRole("link", { name: "Back to students" }).click();
      await expect(page).toHaveURL(/\/instructor\/students\?filter=needs$/);
      await expect(page.getByRole("radio", { name: "Needs attention" })).toBeChecked();
      await expect(page.locator(`[data-student="${id}"]:visible`)).toBeVisible();
    });

    test("the detail: readiness is the one percentage, By topic is S1 to S10 as 80px cards, read-only", async ({
      page,
    }) => {
      await page.goto("/instructor/students");
      const row = rows(page).filter({ hasText: "Needs attention" }).first();
      const listName = await row.locator(".type-body-strong.truncate").innerText();
      await row.click();
      await expect(
        page.getByRole("heading", { name: listName.split(" · ")[0].trim(), level: 1 }),
      ).toBeVisible();
      await expect(page.locator("[data-page-header-band]:visible")).toContainText("Group A");
      const number = await page.locator("[data-readiness-number]").innerText();
      const readiness = Number(/(\d+)%/.exec(number)![1]);
      // the list status follows the thresholds on this very figure
      expect(statusFor(readiness)).toBe("needs");
      await expect(page.locator("[data-pass-mark]")).toHaveText("Pass mark: 80");
      const text = await page.locator("main").innerText();
      expect(text.match(/%/g)).toHaveLength(1);
      const cards = page.locator("[data-topic-row]:visible");
      await expect(cards).toHaveCount(10);
      const ids = await cards.evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-topic-row")),
      );
      expect(ids).toEqual(Array.from({ length: 10 }, (_, i) => `S${i + 1}`));
      for (const card of await cards.all()) {
        expect((await card.boundingBox())!.height).toBe(80);
        expect(
          await card.evaluate((el) => el.querySelectorAll("svg.lucide-chevron-right").length),
        ).toBe(0);
        await expect(card).toContainText(/\d+ of \d+ correct/);
      }
      const review = page.locator("[data-needs-review]:visible").first();
      await expect(review).toHaveText("Needs review");
      expect(await review.evaluate((el) => getComputedStyle(el).color)).toBe(ATTENTION_INK);
      // read-only: no buttons on the screen
      await expect(page.locator("main button")).toHaveCount(0);
      for (const exam of await page.locator("[data-exam-row]:visible").all()) {
        expect((await exam.boundingBox())!.height).toBe(72);
      }
      await expect(page.locator("[data-demo-note]:visible")).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the exam rows match the Exam detail, and the link-up works in both directions", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-closed");
      const row = page.locator("[data-student-row]:visible").first();
      const id = await row.getAttribute("data-student-row");
      const status = await row.getAttribute("data-status");
      expect(await row.evaluate((el) => !!el.querySelector("svg.lucide-chevron-right"))).toBe(true);
      await row.click();
      await expect(page).toHaveURL(/\/instructor\/students\/.+from=exam&exam=seed-closed/);
      // the same exam, the same status as the Exam detail
      const examRow = page.locator('[data-exam-row="seed-closed"]:visible');
      await expect(examRow).toHaveAttribute("data-status", status!);
      // Back returns to the Exam detail (not to the list)
      await page.getByRole("link", { name: "Back to exam" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams\/seed-closed$/);
      await expect(page.locator(`[data-student-row="${id}"]:visible`)).toBeVisible();
      // and the other direction: the list opens the same student, Back goes to the list
      await page.goto("/instructor/students");
      await page.locator(`[data-student="${id}"]:visible`).click();
      await page.getByRole("link", { name: "Back to students" }).click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
    });

    test("a local account shows its real progress, and its Certified result opens the read-only certificate", async ({
      page,
    }) => {
      const s1 = quiz.filter((q) => q.section === "S1").slice(0, 12);
      const history = [
        {
          kind: "quiz",
          mode: "practice",
          topicIds: ["S1"],
          itemIds: s1.map((q) => q.id),
          answers: s1.map((q, i) => ({
            itemId: q.id,
            optionId:
              i < 8 ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id,
          })),
          finishedAt: Date.now() - 3600_000,
        },
      ];
      const attempts = [
        {
          examId: "seed-active",
          studentId: "maryana@example.com",
          correct: 18,
          total: 20,
          finishedAt: Date.now() - 1800_000,
          certificateId: "QT-2026-0007",
        },
      ];
      await page.addInitScript(
        ([h, a]) => {
          if (localStorage.getItem("ast.profile.v1")) return;
          localStorage.setItem(
            "ast.profile.v1",
            JSON.stringify({ direction: "building-evacuation", onboarded: true }),
          );
          localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
          localStorage.setItem("ast.group-attempts.v1", JSON.stringify({ schema: 6, value: a }));
        },
        [history, attempts] as const,
      );
      await page.goto("/instructor/students/maryana%40example.com");
      await expect(page.getByRole("heading", { name: "Maryana", level: 1 })).toBeVisible();
      await expect(page.locator("[data-page-header-band]:visible")).toContainText(
        "Not set · Group A",
      );
      // the real counts: 8 of the 40 questions of S1 are answered right (the Progress calculation)
      await expect(page.locator('[data-topic-row="S1"]')).toContainText("8 of 40 correct");
      // Certified with a certificate: the row opens the certificate, read-only
      const certified = page.locator('[data-exam-row="seed-active"]');
      await expect(certified).toContainText("Certified · 18 of 20 correct");
      expect(await certified.evaluate((el) => !!el.querySelector("svg.lucide-chevron-right"))).toBe(
        true,
      );
      await certified.locator("a").click();
      await expect(page).toHaveURL(/\/certificate\/seed-active$/);
      await expect(page.locator("[data-certificate-name]")).toHaveText("Maryana");
      await expect(page.locator("[data-certificate-result]")).toHaveText("18 of 20 correct");
      await expect(page.locator("[data-certificate-id]")).toHaveText("QT-2026-0007");
      await expect(page.getByRole("button", { name: "Save as PDF" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Share" })).toHaveCount(0);
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/instructor\/students\/maryana%40example\.com$/);
      // a Not started row is plain text without a chevron
      const plain = page.locator('[data-exam-row="seed-closed"]');
      await expect(plain).toHaveAttribute("data-status", "not-started");
      expect(
        await plain.evaluate((el) => el.querySelectorAll("a, svg.lucide-chevron-right").length),
      ).toBe(0);
    });

    test("an unknown student shows 'Student not found' with a Secondary Back to students", async ({
      page,
    }) => {
      await page.goto("/instructor/students/nobody");
      await expect(page.getByRole("heading", { name: "Student not found" })).toBeVisible();
      const back = page.getByRole("link", { name: "Back to students" });
      expect(await bg(back)).toBe(OLIVE_TINT);
      await back.click();
      await expect(page).toHaveURL(/\/instructor\/students$/);
    });

    test("no external network request", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await page.goto("/instructor/students");
      await rows(page).first().click();
      await expect(page.locator("[data-topic-row]").first()).toBeVisible();
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });
}

test.describe("Student role and the Students routes", () => {
  test("a student is sent Home from the Students routes", async ({ page }) => {
    for (const path of [
      "/instructor/students",
      "/instructor/students/stu-01",
      "/instructor/students/stu-01/certificate/seed-active",
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/^http:\/\/localhost:3100\/$/);
    }
  });
});
