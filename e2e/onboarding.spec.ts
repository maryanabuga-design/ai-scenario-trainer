import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { newAccount } from "./auth-seed";

const rgb = (value: string) => {
  const match = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(value)!;
  return {
    r: +match[1],
    g: +match[2],
    b: +match[3],
    a: match[4] === undefined ? 1 : +match[4],
  };
};

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const student = [
  ["Practise real situations", "Short scenarios and quizzes you can do in a few minutes."],
  ["Learn from your mistakes", "See why an answer is right, and ask AI to explain it."],
  ["Get ready for your exam", "Track your readiness and repeat the topics that need work."],
] as const;

const instructor = [
  ["Build an exam from topics", "Choose the topics your students need to know."],
  ["Assign it with a deadline", "Students see the exam and the due date straight away."],
  ["Students get notified", "A new exam appears in their notifications."],
] as const;

const title = (page: Page) => page.getByRole("heading", { level: 1 });

for (const width of [360, 430]) {
  test.describe(`Onboarding at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: newAccount() });

    test("slide 1: the 280 by 280 slot on the plain page, Skip in the top row, the text, the dots and the pinned Next", async ({
      page,
    }) => {
      await page.goto("/onboarding");
      await expect(title(page)).toHaveText(student[0][0]);
      // the entrance animation (250ms) is over
      await page.waitForTimeout(400);
      const slot = (await page.locator("[data-centre] [data-picture-frame]").boundingBox())!;
      expect([slot.width, slot.height]).toEqual([280, 280]);
      expect(Math.abs(slot.x + slot.width / 2 - width / 2)).toBeLessThanOrEqual(2);
      // Skip: top right, a 44px tap area, dark text
      const skip = page.getByRole("button", { name: "Skip" });
      const s = (await skip.boundingBox())!;
      expect(s.height).toBeGreaterThanOrEqual(44);
      expect(s.x + s.width).toBeLessThanOrEqual(width);
      expect(s.x).toBeGreaterThan(width / 2);
      expect(s.y).toBeLessThan(80);
      const skipColour = await skip.evaluate((el) => getComputedStyle(el).color);
      expect(rgb(skipColour).a).toBeGreaterThan(0);
      expect(skipColour).not.toBe("rgb(0, 0, 0)");
      // the text is centred, the subtitle at most 320px wide and 3 lines
      const t = (await title(page).boundingBox())!;
      expect(t.y).toBeGreaterThan(slot.y + slot.height);
      expect(Math.abs(t.x + t.width / 2 - width / 2)).toBeLessThanOrEqual(1);
      const body = page.getByText(student[0][1]);
      const b = (await body.boundingBox())!;
      expect(b.width).toBeLessThanOrEqual(320);
      const lineHeight = await body.evaluate((el) => parseFloat(getComputedStyle(el).lineHeight));
      expect(b.height).toBeLessThanOrEqual(lineHeight * 3 + 1);
      // the dots: three, the active one a 24 by 8 pill in deep olive, 24px above the Primary
      const dots = page.locator("[data-dot]");
      await expect(dots).toHaveCount(3);
      const active = (await page.locator("[data-dot=active]").boundingBox())!;
      expect([active.width, active.height]).toEqual([24, 8]);
      expect(
        await page
          .locator("[data-dot=active]")
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe("rgb(63, 70, 56)");
      const inactive = page.locator("[data-dot=inactive]").first();
      expect((await inactive.boundingBox())!.width).toBe(8);
      expect(await inactive.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgb(214, 221, 203)",
      );
      await expect(page.getByRole("img", { name: "Step 1 of 3" })).toBeVisible();
      const next = (await page.getByRole("button", { name: "Next" }).boundingBox())!;
      expect(next.height).toBe(52);
      expect(Math.abs(next.x - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(active.y + active.height + 24 - next.y)).toBeLessThanOrEqual(1);
      expect(800 - (next.y + next.height)).toBeGreaterThanOrEqual(16);
      expect(800 - (next.y + next.height)).toBeLessThanOrEqual(24);
      expect(await noSidewaysScroll(page)).toBe(true);
      // no Back button
      await expect(page.getByRole("button", { name: /Back/ })).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Back/ })).toHaveCount(0);
    });

    test("the slide semantics: a group, roledescription slide, labelled 1 of 3", async ({
      page,
    }) => {
      await page.goto("/onboarding");
      const slide = page.locator("[aria-roledescription=slide]");
      await expect(slide).toHaveAttribute("role", "group");
      await expect(slide).toHaveAttribute("aria-label", "1 of 3");
      await page.getByRole("button", { name: "Next" }).click();
      await expect(slide).toHaveAttribute("aria-label", "2 of 3");
      // the focus moves to the slide title
      await expect(title(page)).toBeFocused();
    });

    test("Next goes through the student slides; Next becomes Get started and Skip hides on slide 3", async ({
      page,
    }) => {
      await page.goto("/onboarding");
      for (const [index, [heading, body]] of student.entries()) {
        await expect(title(page)).toHaveText(heading);
        await expect(page.getByText(body)).toBeVisible();
        await expect(page.getByRole("img", { name: `Step ${index + 1} of 3` })).toBeVisible();
        if (index < 2) {
          await expect(page.getByRole("button", { name: "Skip" })).toBeVisible();
          await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
          await page.getByRole("button", { name: "Next" }).click();
        }
      }
      await expect(page.getByRole("button", { name: "Skip" })).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Next" })).toHaveCount(0);
      await page.getByRole("button", { name: "Get started" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
    });

    test("the arrow keys change the slide, and stop at both ends", async ({ page }) => {
      await page.goto("/onboarding");
      await page.keyboard.press("ArrowLeft");
      await expect(title(page)).toHaveText(student[0][0]);
      await page.keyboard.press("ArrowRight");
      await expect(title(page)).toHaveText(student[1][0]);
      await page.keyboard.press("ArrowRight");
      await expect(title(page)).toHaveText(student[2][0]);
      await page.keyboard.press("ArrowRight");
      await expect(title(page)).toHaveText(student[2][0]);
      await page.keyboard.press("ArrowLeft");
      await expect(title(page)).toHaveText(student[1][0]);
    });

    test("a horizontal swipe changes the slide; a short or vertical one does not", async ({
      page,
    }) => {
      await page.goto("/onboarding");
      const area = page.locator("[data-onboarding]");
      const swipe = async (dx: number, dy: number) => {
        await area.evaluate(
          (el, [x, y]) => {
            const fire = (type: string, cx: number, cy: number) =>
              el.dispatchEvent(
                new PointerEvent(type, {
                  clientX: cx,
                  clientY: cy,
                  bubbles: true,
                  pointerId: 1,
                }),
              );
            fire("pointerdown", 200, 400);
            fire("pointerup", 200 + x, 400 + y);
          },
          [dx, dy],
        );
      };
      await swipe(-30, 0);
      await expect(title(page)).toHaveText(student[0][0]);
      await swipe(-10, -150);
      await expect(title(page)).toHaveText(student[0][0]);
      await swipe(-80, 5);
      await expect(title(page)).toHaveText(student[1][0]);
      await swipe(80, 5);
      await expect(title(page)).toHaveText(student[0][0]);
      // the page can still be scrolled: the swipe area allows vertical panning
      expect(await area.evaluate((el) => getComputedStyle(el).touchAction)).toContain("pan-y");
    });

    test("the slide enters with a 250ms transition, and none with reduced motion", async ({
      page,
    }) => {
      await page.goto("/onboarding");
      await page.getByRole("button", { name: "Next" }).click();
      const section = page.locator("[aria-roledescription=slide]");
      const motion = await section.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.animationName, css.animationDuration];
      });
      expect(motion[0]).toBe("slide-in-next");
      expect(motion[1]).toBe("0.25s");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.getByRole("button", { name: "Next" }).click();
      const reduced = await page
        .locator("[aria-roledescription=slide]")
        .evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
      expect(reduced).toBeLessThan(0.001);
    });

    test("Skip opens Home and the onboarding is not shown again (once per account)", async ({
      page,
    }) => {
      await page.goto("/onboarding");
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.reload();
      await expect(page).toHaveURL(/\/$/);
      await page.goto("/profile");
      await expect(page).toHaveURL(/\/profile$/);
    });

    test("no external network request while going through the slides", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await page.goto("/onboarding");
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: "Next" }).click();
      await page.getByRole("button", { name: "Get started" }).click();
      await expect(page).toHaveURL(/\/$/);
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });

  test.describe(`Instructor onboarding at ${width}px`, () => {
    test.use({
      viewport: { width, height: 800 },
      storageState: newAccount("instructor"),
    });

    test("shows the instructor slides and Get started opens Instructor Home", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/onboarding$/);
      for (const [index, [heading, body]] of instructor.entries()) {
        await expect(title(page)).toHaveText(heading);
        await expect(page.getByText(body)).toBeVisible();
        if (index < 2) await page.getByRole("button", { name: "Next" }).click();
      }
      await page.getByRole("button", { name: "Get started" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await expect(page.locator("[data-group-readiness]")).toBeVisible();
    });

    test("Skip on an instructor slide opens Instructor Home", async ({ page }) => {
      await page.goto("/onboarding");
      await page.getByRole("button", { name: "Skip" }).click();
      await expect(page).toHaveURL(/\/instructor$/);
    });
  });
}
