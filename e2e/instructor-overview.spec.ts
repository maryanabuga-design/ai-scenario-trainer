import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue, emptyBrowser } from "./auth-seed";

const quizBank: { id: string; correctOptionId: string }[] = JSON.parse(
  readFileSync("content/quiz-bank.json", "utf8"),
).questions;
const stepBank: { id: string; correctOptionId: string }[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;
const correctOf = new Map([...quizBank, ...stepBank].map((q) => [q.id, q.correctOptionId]));

const CODE = "482913";
const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";

const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const nav = (page: Page) => page.getByRole("navigation", { name: "Main" });

async function switchRole(page: Page, role: "Student" | "Instructor") {
  await page.goto("/profile");
  await page.getByRole("radio", { name: role }).check({ force: true });
  await expect(page).toHaveURL(role === "Student" ? /\/$/ : /\/instructor$/);
}

async function signUpInstructor(page: Page) {
  await page.goto("/welcome");
  await page.getByRole("link", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill("Ira Instructor");
  await page.getByLabel("Work email").fill("ira@example.com");
  await page.getByText("Instructor", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page).toHaveURL(/\/instructor$/);
}

const passedOf = async (page: Page, examId: string) => {
  const text = await page.locator(`[data-exam-card="${examId}"]`).innerText();
  return Number(/Passed (\d+) of (\d+)/.exec(text)![1]);
};

for (const width of [360, 430]) {
  test.describe(`Instructor Overview at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("layout: greeting header, 80px readiness card, 72px rows, 80px topic cards, 88px exam card", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Maryana");
      await expect(page.locator("[data-page-header-band]")).toHaveCount(0);
      await expect(page.locator("[data-avatar]")).toHaveCount(0);
      await expect(page.locator("[data-group-readiness]")).toContainText(/Group readiness \d+%/);
      await expect(page.locator("[data-group-line]")).toHaveText("Group A · 15 students");
      expect(await noSidewaysScroll(page)).toBe(true);
      const box = async (selector: string) => (await page.locator(selector).first().boundingBox())!;
      expect((await box("[data-group-readiness]")).height).toBe(80);
      expect((await box("[data-attention]")).height).toBe(72);
      expect((await box("[data-weak-topic]")).height).toBe(80);
      expect((await box("[data-exam-card]")).height).toBe(88);
      // 16px gutters
      for (const selector of ["[data-group-readiness]", "[data-attention]", "[data-exam-card]"]) {
        const b = await box(selector);
        expect(b.x).toBe(16);
        expect(b.width).toBe(width - 32);
      }
      // one percentage on the whole screen
      const text = await page.locator("main").innerText();
      expect(text.match(/%/g)).toHaveLength(1);
      // up to 3 attention rows and 3 weakest topics
      expect(await page.locator("[data-attention]").count()).toBeLessThanOrEqual(3);
      expect(await page.locator("[data-weak-topic]").count()).toBeLessThanOrEqual(3);
      // weakest topics are data: no links, no chevrons
      await expect(page.locator("[data-weak-topic] a, [data-weak-topic] svg")).toHaveCount(0);
      await expect(page.locator("[data-demo-note]")).toHaveText(
        "Demo group. Student data on this screen is simulated.",
      );
      await expect(nav(page).getByRole("link")).toHaveText([
        "Overview",
        "Exams",
        "Students",
        "Profile",
      ]);
      await expect(nav(page).getByRole("link", { name: "Overview" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    test("button hierarchy: a Secondary Assign exam under the exam card, no Primary on the screen", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const assign = page.getByRole("link", { name: "Assign exam" });
      await expect(assign).toHaveCount(1);
      expect(await bg(assign)).toBe(OLIVE_TINT);
      const a = (await assign.boundingBox())!;
      expect(a.height).toBe(52);
      const card = (await page.locator("[data-exam-card]").boundingBox())!;
      expect(a.y).toBeGreaterThan(card.y + card.height);
      const primaries = await page
        .locator("main a, main button")
        .evaluateAll(
          (els, color) => els.filter((el) => getComputedStyle(el).backgroundColor === color).length,
          PRIMARY,
        );
      expect(primaries).toBe(0);
    });

    test("every tap target is at least 44px and every link goes somewhere", async ({ page }) => {
      await page.goto("/instructor");
      for (const link of await page.locator("main a:visible").all()) {
        expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        expect(await link.getAttribute("href")).toMatch(/^\/instructor/);
      }
    });

    test("See all opens Students with the Needs attention filter; a row opens the student and Back returns to the Overview", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const seeAll = page.getByRole("link", { name: /^See all \(\d+\)$/ });
      await expect(seeAll).toBeVisible();
      const total = Number(/\((\d+)\)/.exec(await seeAll.innerText())![1]);
      await seeAll.click();
      await expect(page).toHaveURL(/\/instructor\/students\?filter=needs$/);
      await expect(page.locator("[data-student]:visible")).toHaveCount(total);
      await page.goto("/instructor");
      await page.locator("[data-attention]").first().click();
      await expect(page).toHaveURL(/\/instructor\/students\/[^/]+\?from=overview$/);
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("the exam card opens the Exam detail with the same count, and Back returns to the Overview", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const id = (await page.locator("[data-exam-card]").getAttribute("data-exam-card"))!;
      const passed = await passedOf(page, id);
      await page.locator("[data-exam-card]").click();
      await expect(page).toHaveURL(new RegExp(`/instructor/exams/${id}\\?from=overview$`));
      await expect(page.locator("[data-count=certified] .tabular-nums")).toHaveText(String(passed));
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("Assign exam from the Overview: Back and Cancel return to the Overview", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await page.getByRole("link", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/\/instructor\/exams\/new\?from=overview$/);
      await expect(page.getByRole("link", { name: "Back to Overview" })).toBeVisible();
      await page.getByRole("button", { name: "Cancel" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("with no active exam the Overview says so and the one Primary Assign exam appears", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-active");
      await page.getByRole("button", { name: "Close exam now" }).click();
      await page.locator("dialog[open]").getByRole("button", { name: "Close exam" }).click();
      await expect(page.getByRole("button", { name: "Close exam now" })).toHaveCount(0);
      await page.goto("/instructor");
      await expect(page.locator("[data-no-exam]")).toContainText("No active exam");
      await expect(page.locator("[data-exam-card]")).toHaveCount(0);
      const assign = page.getByRole("link", { name: "Assign exam" });
      await expect(assign).toHaveCount(1);
      expect(await bg(assign)).toBe(PRIMARY);
    });

    test("the Instructor Profile has Group A (read-only), Demo mode, About and Sign out, but no Direction or Certificates", async ({
      page,
    }) => {
      await page.goto("/profile");
      await expect(page.locator("[data-group-row]")).toContainText("Group A");
      await expect(page.locator("[data-group-row] a, [data-group-row] svg")).toHaveCount(0);
      await expect(page.getByRole("link", { name: "About this prototype" })).toBeVisible();
      await expect(page.locator("[data-sign-out]")).toBeVisible();
      await expect(page.getByRole("group", { name: "Direction" })).toHaveCount(0);
      await expect(page.locator("[data-certificates-row]")).toHaveCount(0);
      await expect(page.getByText("Reset progress")).toHaveCount(0);
    });

    test("no external network request on the Overview", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await page.goto("/instructor");
      await expect(page.locator("[data-group-readiness]")).toBeVisible();
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });

  test.describe(`The full Instructor journey at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("sign up as Instructor, assign an exam, a student passes it, and every screen shows the same counts", async ({
      page,
    }) => {
      await signUpInstructor(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hi, Ira Instructor");
      await expect(page.locator("[data-group-line]")).toHaveText("Group A · 15 students");

      // assign an exam from the Overview (3 days: the nearest deadline)
      await page.getByRole("link", { name: "Assign exam" }).click();
      await page.getByText("Responding to an alarm", { exact: false }).first().click();
      await page.getByText("Checking the route").first().click();
      await page.getByText("In 3 days").click();
      await page.getByLabel("Exam title").fill("Exam: Journey");
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1&from=overview/);
      const examId = new URL(page.url()).pathname.split("/").pop()!;
      await page.getByRole("link", { name: "Back to Overview" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await expect(page.locator(`[data-exam-card="${examId}"]`)).toContainText("Exam: Journey");
      const before = await passedOf(page, examId);

      // as a student: the notification and the Assigned exam card, then pass it
      await switchRole(page, "Student");
      await expect(page.locator("[data-assigned-exam]")).toHaveCount(0);
      await page.getByRole("link", { name: /^Notifications, \d+ unread$/ }).click();
      await expect(page.getByText("New exam assigned: Exam: Journey")).toBeVisible();
      await page.locator(`[data-assigned-exam="${examId}"]`).click();
      await page
        .getByRole("button", { name: /^Start exam/ })
        .first()
        .click();
      await expect(page).toHaveURL(/\/exam\/session$/);
      await page.evaluate((answerOf) => {
        const key = Object.keys(localStorage).find((k) => k.startsWith("ast.exam.v1"))!;
        const stored = JSON.parse(localStorage.getItem(key)!);
        const answers = (stored.value.itemIds as string[]).map((id) => ({
          itemId: id,
          optionId: answerOf[id],
        }));
        stored.value.answers = answers;
        stored.value.index = answers.length - 1;
        localStorage.setItem(key, JSON.stringify(stored));
      }, Object.fromEntries(correctOf));
      await page.reload();
      await page.getByRole("button", { name: "Finish", exact: true }).click();
      await expect(page).toHaveURL(/\/exam\/results$/);
      await expect(page.getByRole("heading", { name: "Passed" })).toBeVisible();

      // back as the instructor: the same number everywhere
      await switchRole(page, "Instructor");
      await expect(page.locator(`[data-exam-card="${examId}"]`)).toBeVisible();
      expect(await passedOf(page, examId)).toBe(before + 1);
      await page.goto(`/instructor/exams/${examId}`);
      await expect(page.locator("[data-count=certified] .tabular-nums")).toHaveText(
        String(before + 1),
      );
      const mine = page.locator('[data-student-row="ira@example.com"]');
      await expect(mine).toHaveAttribute("data-status", "certified");
      await page.goto("/instructor/students/ira%40example.com");
      await expect(page.locator(`[data-exam-row="${examId}"]`)).toHaveAttribute(
        "data-status",
        "certified",
      );
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });
}
