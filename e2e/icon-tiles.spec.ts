import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { authValue } from "./auth-seed";
import { seedSet } from "./seed-set";

const TILE = "rgb(239, 236, 230)";
const INK = "rgb(26, 26, 26)";

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
const look = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => {
    const css = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    const svg = el.querySelector("svg")!.getBoundingClientRect();
    return {
      background: css.backgroundColor,
      color: css.color,
      radius: css.borderTopLeftRadius,
      size: [Math.round(box.width), Math.round(box.height)],
      icon: [Math.round(svg.width), Math.round(svg.height)],
      border: css.borderTopWidth,
    };
  });

for (const width of [360, 430]) {
  test.describe(`One icon tile, round codes and the note at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 }, storageState: instructor });

    test("the Overview rows and the Exams card use the same tile: lighter sand, radius 14, 48px, icon 24px in the text colour", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const rows = page.locator("[data-action] [data-icon-tile]");
      await expect(rows.first()).toBeVisible();
      const examTile = page.locator("[data-exam-card] [data-icon-tile=exam]").first();
      const reference = await look(examTile);
      expect(reference).toMatchObject({
        background: TILE,
        color: INK,
        radius: "14px",
        size: [48, 48],
        icon: [24, 24],
        border: "0px",
      });
      for (const tile of await rows.all()) {
        expect(await look(tile)).toEqual(reference);
        await expect(tile).toHaveAttribute("aria-hidden", "true");
      }
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the Weakest topic code is a circle, and every topic code is the same size, S10 included", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const weakest = page.locator("[data-weakest-topic] [data-topic-code]");
      const w = (await weakest.boundingBox())!;
      expect([Math.round(w.width), Math.round(w.height)]).toEqual([36, 36]);
      // a full circle: the radius is at least half of the 36px size
      expect(
        await weakest.evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius)),
      ).toBeGreaterThanOrEqual(18);
      expect(await weakest.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(TILE);
      await page.goto("/instructor/students?view=topics");
      const codes = page.locator("[data-topic-card] [data-topic-code]");
      await expect(codes).toHaveCount(10);
      const seen: string[] = [];
      for (const code of await codes.all()) {
        const box = (await code.boundingBox())!;
        expect([Math.round(box.width), Math.round(box.height)]).toEqual([36, 36]);
        expect(await code.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
        expect(await code.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe("nowrap");
        seen.push((await code.innerText()).trim());
      }
      expect(seen).toContain("S1");
      expect(seen).toContain("S2");
      expect(seen).toContain("S10");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the Exam detail with no results uses the shared note: a 40px round tile with the lightbulb, a divider and the text, centred", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await page.locator("fieldset label:visible", { hasText: "Responding to an alarm" }).click();
      await page.locator("fieldset label:visible", { hasText: "Checking the route" }).click();
      await page.getByText("In 1 week").click();
      await page.getByLabel("Exam title").fill("Exam: Note check");
      await page.getByRole("button", { name: "Assign exam" }).click();
      await expect(page).toHaveURL(/assigned=1/);
      const note = page.locator("[data-no-results]");
      await expect(note).toHaveText("No results yet. They appear when students start the exam.");
      await expect(note).toHaveAttribute("data-tip-note", "true");
      await expect(note.locator("svg.lucide-lightbulb")).toHaveCount(1);
      const tile = (await note.locator("span[aria-hidden]").first().boundingBox())!;
      expect([Math.round(tile.width), Math.round(tile.height)]).toEqual([40, 40]);
      const divider = (await note.locator("span[aria-hidden]").nth(1).boundingBox())!;
      expect(Math.round(divider.width)).toBe(1);
      const text = (await note.locator("p").boundingBox())!;
      // centred against the text block, and the text sits right of the divider
      expect(Math.abs(tile.y + tile.height / 2 - (text.y + text.height / 2))).toBeLessThanOrEqual(
        2,
      );
      expect(
        Math.abs(divider.y + divider.height / 2 - (text.y + text.height / 2)),
      ).toBeLessThanOrEqual(2);
      expect(text.x).toBeGreaterThan(divider.x + divider.width);
      // inside the Topics info card
      await expect(page.locator("[data-summary=active] [data-no-results]")).toHaveCount(1);
      expect(await note.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).toBe("14px");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the Content note is the same component", async ({ page }) => {
      await page.goto("/instructor/content");
      const note = page.locator("[data-content-note]");
      await expect(note).toHaveAttribute("data-tip-note", "true");
      await expect(note.locator("svg.lucide-lightbulb")).toHaveCount(1);
    });

    test("the Content empty state shows the 3D picture at 140px, loaded, with an empty alt text", async ({
      page,
    }) => {
      await page.goto("/instructor/content");
      const picture = page.locator("[data-empty-picture]");
      await expect(picture).toBeVisible();
      await expect(picture).toHaveAttribute("alt", "");
      await expect(picture).toHaveAttribute("src", "/images/instructor/content-empty.webp");
      expect(await picture.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
      const box = (await picture.boundingBox())!;
      expect([Math.round(box.width), Math.round(box.height)]).toEqual([140, 140]);
      expect(Math.round(box.x + box.width / 2)).toBe(Math.round(width / 2));
      expect(await picture.evaluate((el) => getComputedStyle(el).objectFit)).toBe("contain");
      await expect(
        page.locator("[data-empty-circle], [data-dashes], [data-empty-fallback]"),
      ).toHaveCount(0);
      // the texts, the button, the course card and the note stay
      await expect(page.getByRole("heading", { name: "You have no topics yet." })).toBeVisible();
      await expect(page.getByRole("link", { name: "Import content" })).toBeVisible();
      await expect(page.locator("[data-course-row]")).toContainText("Course topics (10)");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("a missing picture shows the earlier icon version: the sand circle, the flat icon and the dashes", async ({
      page,
    }) => {
      await page.route("**/images/instructor/content-empty.webp", (route) => route.abort());
      await page.goto("/instructor/content");
      await expect(page.locator("[data-empty-fallback]")).toBeVisible();
      const circle = (await page.locator("[data-empty-circle]").boundingBox())!;
      expect([circle.width, circle.height]).toEqual([140, 140]);
      await expect(page.locator("[data-dashes=left] span")).toHaveCount(3);
      await expect(page.locator("[data-empty-picture]")).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("no picture when the instructor already has topics", async ({ page }) => {
      await seedSet(page, {
        title: "my set",
        topic: "S2",
        questions: [
          {
            id: "q1",
            text: "What is safest?",
            options: ["Marked exit", "Lift", "Wait", ""],
            correct: "a",
            explanation: "The marked exit.",
            guideRef: "S2",
            imageUrl: "",
          },
        ],
      });
      await page.goto("/instructor/content");
      await expect(page.locator("[data-set-card]").first()).toBeVisible();
      await expect(page.locator("[data-empty-picture], [data-content-empty]")).toHaveCount(0);
    });
  });
}
