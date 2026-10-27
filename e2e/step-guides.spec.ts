import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue } from "./auth-seed";
import { seedSet } from "./seed-set";

const profile = { direction: "building-evacuation", onboarded: true };
const instructor = {
  cookies: [],
  origins: [
    {
      origin: "http://localhost:3100",
      localStorage: [{ name: "ast.auth.v1", value: authValue("instructor") }],
    },
  ],
};
const NEUTRAL_TILE = "rgb(226, 222, 214)";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

async function open(page: Page, path: string) {
  await page.addInitScript(
    ([p]) => {
      if (!localStorage.getItem("ast.profile.v1")) {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      }
    },
    [profile],
  );
  await page.goto(path);
}

for (const width of [360, 430]) {
  test.describe(`Home grid at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("is a 2 by 2 grid of Exam, Mini-quiz, Weak topics and Saved questions: no Steps tile, no Mini-quiz row", async ({
      page,
    }) => {
      await open(page, "/");
      const tiles = page.locator("main ul:visible a");
      await expect(tiles).toHaveCount(4);
      await expect(tiles).toContainText(["Exam", "Mini-quiz", "Weak topics", "Saved questions"]);
      await expect(page.getByRole("link", { name: /^Steps/ })).toHaveCount(0);
      await expect(page.locator("[data-mini-quiz]")).toHaveCount(0);
      const boxes = [];
      for (const tile of await tiles.all()) boxes.push((await tile.boundingBox())!);
      // two columns, two rows
      expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThanOrEqual(1);
      expect(Math.abs(boxes[2].y - boxes[3].y)).toBeLessThanOrEqual(1);
      expect(boxes[2].y).toBeGreaterThan(boxes[0].y + boxes[0].height - 1);
      expect(boxes[1].x).toBeGreaterThan(boxes[0].x + boxes[0].width - 1);
      for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44);
      // the second lines never wrap to more than two lines
      for (const tile of await tiles.all()) {
        const lines = await tile
          .locator("span.type-small")
          .evaluate(
            (el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight),
          );
        expect(lines).toBeLessThanOrEqual(2.05);
      }
      await expect(tiles.nth(0)).toContainText(
        /^Exam1 assigned · due \d{1,2} \w{3}$|^ExamNo exams assigned$/,
      );
      await expect(tiles.nth(1)).toContainText("Choose topics and length");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the tiles open their screens: Exam, the Mini-quiz picker, Weak topics, Saved questions", async ({
      page,
    }) => {
      await open(page, "/");
      const tiles = page.locator("main ul:visible a");
      await expect(tiles.nth(0)).toHaveAttribute("href", "/exam");
      await expect(tiles.nth(1)).toHaveAttribute("href", "/mini-quiz?from=home");
      await expect(tiles.nth(2)).toHaveAttribute("href", "/weak-topics");
      await expect(tiles.nth(3)).toHaveAttribute("href", "/saved");
      await tiles.nth(1).click();
      await expect(page).toHaveURL(/\/mini-quiz\?from=home$/);
      await expect(page.getByRole("heading", { name: "Mini-quiz" })).toBeVisible();
    });

    test("the Mini-quiz tile uses the same neutral icon tile as the others", async ({ page }) => {
      await open(page, "/");
      const circles = page.locator("main ul:visible a span[aria-hidden]");
      for (let n = 0; n < 4; n++) {
        expect(await circles.nth(n).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
          NEUTRAL_TILE,
        );
      }
      await expect(
        page.locator("main ul:visible a").nth(1).locator("svg.lucide-clipboard-check"),
      ).toHaveCount(1);
    });
  });

  test.describe(`Materials step guides at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("the selector fits on one line, Topics is the default and the view is kept in the URL", async ({
      page,
    }) => {
      await open(page, "/materials");
      const group = page.getByRole("radiogroup");
      await expect(page.getByRole("radio", { name: /^Topics \(17\)$/ })).toBeChecked();
      await expect(page.getByRole("radio", { name: /^Step guides \(3\)$/ })).toHaveCount(1);
      expect((await group.boundingBox())!.height).toBeLessThan(60);
      await expect(page.locator("a[href^='/materials/read/']:visible").first()).toBeVisible();
      await page.getByRole("radio", { name: /Step guides/ }).click({ force: true });
      await expect(page).toHaveURL(/\/materials\?view=steps$/);
      await expect(page.locator("[data-step-guide]:visible")).toHaveCount(3);
      await expect(page.locator("a[href^='/materials/read/']:visible")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
      // a deep link and the back button
      await page.reload();
      await expect(page.getByRole("radio", { name: /Step guides/ })).toBeChecked();
      await page.getByRole("radio", { name: /^Topics/ }).click({ force: true });
      await expect(page).toHaveURL(/\/materials$/);
      await page.goBack();
      await expect(page).toHaveURL(/\/materials\?view=steps$/);
      await expect(page.locator("[data-step-guide]:visible")).toHaveCount(3);
    });

    test("each row opens its own guide", async ({ page }) => {
      await open(page, "/materials?view=steps");
      for (const [name, id] of [
        [/Leaving a building/, "leaving-a-building"],
        [/Severe bleeding/, "severe-bleeding"],
        [/^Burns/, "burns"],
      ] as const) {
        await page.getByRole("link", { name }).click();
        await expect(page).toHaveURL(new RegExp(`/checklists/${id}$`));
        await page.getByRole("button", { name: "Back" }).click();
        await expect(page).toHaveURL(/\/materials\?view=steps$/);
      }
    });

    test("'Step guide for this topic' shows only on S1, S7 and S8", async ({ page }) => {
      for (const id of ["S1", "S7", "S8"]) {
        await open(page, `/materials/read/${id}`);
        await expect(page.getByRole("link", { name: "Step guide for this topic" })).toBeVisible();
      }
      for (const id of ["S2", "S3", "S4", "S5", "S6", "S9", "S10"]) {
        await open(page, `/materials/read/${id}`);
        await expect(page.getByRole("button", { name: "Practise this topic" })).toBeVisible();
        await expect(page.getByRole("link", { name: "Step guide for this topic" })).toHaveCount(0);
      }
    });

    test("the word checklist is not in the visible text of the screens", async ({ page }) => {
      for (const path of [
        "/",
        "/materials",
        "/materials?view=steps",
        "/checklists",
        "/checklists/leaving-a-building",
        "/materials/read/S1",
      ]) {
        await open(page, path);
        await page.waitForLoadState("networkidle");
        expect(await page.locator("body").innerText(), path).not.toMatch(/checklist/i);
      }
    });

    test("a notification for the step guides opens Materials with that view", async ({ page }) => {
      await page.addInitScript(
        ([p]) => {
          localStorage.setItem("ast.profile.v1", JSON.stringify(p));
          localStorage.setItem(
            "ast.notifications.v1",
            JSON.stringify({
              schema: 6,
              value: [
                {
                  id: "n-steps",
                  type: "message",
                  title: "New step guides",
                  text: "Read them in Materials.",
                  target: "/checklists",
                  createdAt: Date.now() - 1000,
                  read: false,
                },
              ],
            }),
          );
        },
        [profile],
      );
      await page.goto("/notifications");
      await page.getByText("New step guides").click();
      await expect(page).toHaveURL(/\/materials\?view=steps$/);
      await expect(page.locator("[data-step-guide]:visible")).toHaveCount(3);
    });
  });
}

for (const width of [360, 430]) {
  test.describe(`Instructor content at ${width}px (built-in topics, imported set cards)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("built-in topics are labelled and open a detail with a Steps tab only for S1, S7 and S8", async ({
      page,
    }) => {
      await page.goto("/instructor/content");
      await expect(page.locator("[data-page-header-band]:visible")).toContainText(
        "Materials for your students",
      );
      await page.locator("[data-course-row]").click();
      await expect(page).toHaveURL(/\/instructor\/content\/course$/);
      await expect(page.locator("[data-built-in-label]:visible")).toHaveCount(10);
      for (const id of ["S1", "S7", "S8"]) {
        await page.goto(`/instructor/content/built-in/${id}`);
        await expect(page.locator("[data-page-header-band]:visible")).toContainText(
          `${id} · Course topic · read-only`,
        );
        await page.getByRole("radio", { name: "Steps" }).check({ force: true });
        const steps = page.locator("[data-built-in-steps]:visible > li");
        expect(await steps.count()).toBeGreaterThanOrEqual(5);
        await expect(page.locator("[data-built-in-steps] input[type=checkbox]")).toHaveCount(0);
        expect(await noSidewaysScroll(page)).toBe(true);
      }
      for (const id of ["S2", "S3", "S4", "S5", "S6", "S9", "S10"]) {
        await page.goto(`/instructor/content/built-in/${id}`);
        await expect(page.locator("[data-built-in-overview]:visible")).toBeVisible();
        await expect(page.getByRole("radio", { name: "Steps" })).toHaveCount(0);
      }
    });

    test("an imported set card uses the neutral icon tile, not the dashed 3D placeholder", async ({
      page,
    }) => {
      await seedSet(page, {
        title: "Evacuation routes",
        questions: [
          {
            id: "q1",
            text: "What is safest?",
            options: ["Marked exit", "Lift", "Wait", ""],
            correct: "a",
            explanation: "The marked exit.",
            guideRef: "S3",
            imageUrl: "",
          },
        ],
      });
      await page.goto("/instructor/content");
      // no dashed placeholder anywhere on the screen
      await expect(page.locator("[data-media3d]:visible")).toHaveCount(0);
    });
  });
}

for (const width of [360, 430]) {
  test.describe(`From your instructor at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the demo topic opens its reading screen directly (no hub), its step guide has no tick and writes nothing", async ({
      page,
    }) => {
      await page.goto("/instructor/content/import");
      await page.getByRole("button", { name: "Try an example" }).click();
      await page.getByRole("button", { name: "Import and review" }).click();
      await expect(page.getByRole("heading", { name: "Draft is ready" })).toBeVisible({
        timeout: 15000,
      });
      const id = await page.evaluate(
        () => JSON.parse(localStorage.getItem("ast.demo-topics.v1")!).value[0].id as string,
      );
      await page.goto(`/instructor/content/package/${id}`);
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Publish", exact: true }).click();
      await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
      await page.evaluate(
        (value) => localStorage.setItem("ast.auth.v1", value),
        authValue("student"),
      );
      await page.goto("/materials");
      await page.waitForLoadState("networkidle");
      await page.locator("[data-package-topic]").first().click();
      await expect(page.locator("[data-reading-header]")).toBeVisible();
      await expect(page.locator("[data-package-part], [data-part-group]")).toHaveCount(0);
      await page.waitForLoadState("networkidle");
      const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
      await page.getByRole("link", { name: "Step guide for this topic" }).click();
      await expect(page.getByText("Step-by-step guide")).toBeVisible();
      await expect(page.locator("input[type=checkbox]")).toHaveCount(0);
      await page.locator("main ol li button[aria-expanded]").first().click();
      expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(before);
      expect(await page.locator("body").innerText()).not.toMatch(/checklist/i);
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });
}
