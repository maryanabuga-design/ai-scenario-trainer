import { readdirSync } from "node:fs";
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
test.use({ storageState: instructor });
test.setTimeout(60_000);

const DIR = "public/templates/sample-package";
const file = (name: string) => `${DIR}/${name}`;
const CLEAN = [
  "topic.csv",
  "guide.csv",
  "steps.csv",
  "scenario.csv",
  "questions.csv",
  "exit-sign.png",
  "assembly-point.png",
].map(file);

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

async function importFiles(page: Page, files: string[], title?: string) {
  await page.goto("/instructor/content/import");
  await page.locator("[data-file-input]").setInputFiles(files);
  await expect(page.locator("[data-recognised-row]").first()).toBeVisible();
  if (title) await page.getByLabel("Topic title").fill(title);
  await page.getByRole("button", { name: "Import and review" }).click();
  await expect(page).toHaveURL(/\/instructor\/content\/package\//, { timeout: 15000 });
}

async function asStudent(page: Page) {
  if (page.url() === "about:blank") await page.goto("/");
  await page.evaluate((value) => localStorage.setItem("ast.auth.v1", value), authValue("student"));
  await page.goto("/materials");
  await page.waitForLoadState("networkidle");
}

test("the sample package files exist and the zip is served", async ({ page, request }) => {
  expect(readdirSync(DIR).length).toBeGreaterThanOrEqual(9);
  const response = await request.get("/templates/sample-package.zip");
  expect(response.ok()).toBe(true);
  await page.goto("/instructor/content/import");
  await expect(page.getByRole("link", { name: "Download sample package" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download templates" })).toBeVisible();
});

test("the empty import screen fits, with a disabled Import and one Primary", async ({ page }) => {
  await page.goto("/instructor/content/import");
  await expect(page.getByRole("heading", { name: "Import content" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Import and review" })).toBeDisabled();
  expect(await noSidewaysScroll(page)).toBe(true);
});

test("the whole clean package: recognised parts, four tabs, coverage, publish, student view, unpublish", async ({
  page,
}) => {
  await page.goto("/instructor/content/import");
  await page.locator("[data-file-input]").setInputFiles(CLEAN);
  await expect(page.locator("[data-recognised-row]")).toHaveCount(6);
  await expect(page.locator('[data-row-pill="ready"]')).toHaveCount(6);
  await expect(page.getByLabel("Topic title")).toHaveValue("Evacuating a crowded hall");
  expect(await noSidewaysScroll(page)).toBe(true);
  await page.getByRole("button", { name: "Import and review" }).click();
  await expect(page).toHaveURL(/\/instructor\/content\/package\//, { timeout: 15000 });

  await expect(page.getByRole("heading", { name: "Evacuating a crowded hall" })).toBeVisible();
  await expect(page.getByText("Guide sections used: 4 of 4")).toBeVisible();
  await expect(page.getByText("Used by 1 step, 1 scenario step, 3 questions")).toBeVisible();
  await expect(page.locator("img").first()).toBeVisible();
  expect(await noSidewaysScroll(page)).toBe(true);

  // the selector fits on one line at any width
  const group = page.locator('[role="radiogroup"]:visible').first();
  const box = await group.boundingBox();
  expect(box!.height).toBeLessThan(60);

  for (const tab of ["Steps", "Scenario", "Quiz"]) {
    await page.getByRole("radio", { name: tab }).click({ force: true });
    await expect(page.getByRole("button", { name: "Publish" })).toBeEnabled();
    expect(await noSidewaysScroll(page)).toBe(true);
  }
  await page.getByRole("radio", { name: "Steps" }).click({ force: true });
  await page
    .getByRole("button", { name: /^Step 1/ })
    .first()
    .click();
  await page.locator("[data-guide-pill]:visible").first().click();
  await expect(page.getByRole("radio", { name: "Guide" })).toBeChecked();
  await expect(page.getByText("Guide sections used: 4 of 4")).toBeVisible();

  // publish
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Publish this demo topic?" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();

  // preview as student saves nothing
  const before = await page.evaluate(() =>
    Object.keys(localStorage)
      .filter((k) => k !== "ast.demo-topics.v1")
      .sort()
      .join("|"),
  );
  await page.getByRole("link", { name: "Preview as student" }).click();
  await expect(page.getByText("Previewing as student")).toBeVisible();
  await page.getByRole("link", { name: "Exit preview" }).click();
  expect(
    await page.evaluate(() =>
      Object.keys(localStorage)
        .filter((k) => k !== "ast.demo-topics.v1")
        .sort()
        .join("|"),
    ),
  ).toBe(before);

  // the student sees it, in its own section
  await asStudent(page);
  await expect(page.getByText("FROM YOUR INSTRUCTOR")).toBeVisible();
  const readinessBefore = await page.evaluate(() => localStorage.getItem("ast.history.v1"));
  await page.locator("[data-package-topic]").first().click();
  for (const label of [
    "Read the guide",
    "Read the step guide",
    "Practise the scenario",
    "Take the quiz",
  ]) {
    await expect(page.getByText(label)).toBeVisible();
  }
  await page.getByText("Take the quiz").click();
  await expect(page.getByRole("heading", { name: "Take the quiz", level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  for (let i = 0; i < 10; i += 1) {
    await page.locator('input[type="radio"]').first().check({ force: true });
    await page.getByRole("button", { name: i === 9 ? "Finish" : "Next" }).click();
  }
  await expect(page.locator("[data-result-text]")).toContainText(/of 10 correct/);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  expect(await noSidewaysScroll(page)).toBe(true);
  expect(await page.evaluate(() => localStorage.getItem("ast.history.v1"))).toBe(readinessBefore);

  // unpublish removes it from Materials
  await page.evaluate(
    (value) => localStorage.setItem("ast.auth.v1", value),
    authValue("instructor"),
  );
  await page.goto("/instructor/content");
  await page.locator("[data-package-card]").first().click();
  await page.getByRole("button", { name: "Unpublish" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Unpublish", exact: true }).click();
  await asStudent(page);
  await expect(page.getByText("FROM YOUR INSTRUCTOR")).toHaveCount(0);
});

test("questions with problems: four issues, Publish disabled until fixed", async ({ page }) => {
  await importFiles(
    page,
    [
      file("guide.csv"),
      file("questions-with-problems.csv"),
      file("exit-sign.png"),
      file("assembly-point.png"),
    ],
    "Problem topic",
  );
  await page.getByRole("radio", { name: "Quiz" }).click({ force: true });
  await expect(page.locator("[data-needs-attention]")).toHaveCount(4);
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();
  expect(await noSidewaysScroll(page)).toBe(true);
});

test("steps with problems: two issues, fixed by replacing the files", async ({ page }) => {
  await importFiles(
    page,
    [
      file("guide.csv"),
      file("steps-with-problems.csv"),
      file("exit-sign.png"),
      file("assembly-point.png"),
    ],
    "Steps topic",
  );
  await page.getByRole("radio", { name: "Steps" }).click({ force: true });
  await expect(page.locator("[data-needs-attention]")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Publish", exact: true })).toBeDisabled();
  await page.getByRole("link", { name: "Replace files" }).click();
  await page
    .locator("[data-file-input]")
    .setInputFiles([
      file("guide.csv"),
      file("steps.csv"),
      file("exit-sign.png"),
      file("assembly-point.png"),
    ]);
  await page.getByRole("button", { name: "Import and review" }).click();
  await expect(page).toHaveURL(/\/instructor\/content\/package\//, { timeout: 15000 });
  await page.getByRole("radio", { name: "Steps" }).click({ force: true });
  await expect(page.locator("[data-needs-attention]")).toHaveCount(0);
});

test("a wrong file type is left out with an amber message", async ({ page }) => {
  await page.goto("/instructor/content/import");
  await page
    .locator("[data-file-input]")
    .setInputFiles([{ name: "notes.pdf", mimeType: "application/pdf", buffer: Buffer.from("x") }]);
  await expect(page.getByText("notes.pdf is not a CSV file")).toBeVisible();
  await expect(page.locator("[data-recognised-row]")).toHaveCount(0);
});

test("a picture over 300 KB is rejected", async ({ page }) => {
  await page.goto("/instructor/content/import");
  await page
    .locator("[data-file-input]")
    .setInputFiles([{ name: "big.png", mimeType: "image/png", buffer: Buffer.alloc(320 * 1024) }]);
  await expect(page.getByText("big.png is larger than 300 KB.")).toBeVisible();
});

test("no external requests while importing and reading", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      !url.startsWith("http://localhost:3100") &&
      !url.startsWith("data:") &&
      !url.startsWith("blob:")
    )
      external.push(url);
  });
  await importFiles(page, CLEAN);
  expect(external).toEqual([]);
});

test("a student cannot open the instructor import", async ({ page }) => {
  await asStudent(page);
  await page.goto("/instructor/content/import");
  await expect(page).not.toHaveURL(/instructor\/content\/import/, { timeout: 15000 });
});
