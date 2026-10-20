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

const rgb = (value: string) => {
  const match = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/.exec(value)!;
  return { r: +match[1], g: +match[2], b: +match[3], a: match[4] === undefined ? 1 : +match[4] };
};

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const band = (page: Page) => page.locator("[data-page-header-band]:visible");

/** The band's own look, read from the computed styles (not transparent, not black). */
async function checkBand(
  page: Page,
  width: number,
  title: string,
  subtitle?: string,
  withBack = false,
) {
  await expect(band(page)).toHaveCount(1);
  const box = (await band(page).boundingBox())!;
  expect(box.x).toBe(0);
  expect(box.y).toBe(0);
  expect(box.width).toBe(width);
  const look = await band(page).evaluate((el) => {
    const css = getComputedStyle(el);
    return {
      bg: css.backgroundColor,
      border: [css.borderBottomWidth, css.borderBottomColor],
      radius: [css.borderBottomLeftRadius, css.borderTopLeftRadius],
      shadow: css.boxShadow,
      position: css.position,
    };
  });
  expect(look.bg).toBe("rgb(240, 236, 230)");
  expect(look.border).toEqual(["1px", "rgb(228, 223, 213)"]);
  expect(look.radius).toEqual(["0px", "0px"]);
  expect(look.shadow).toBe("none");
  expect(look.position).not.toBe("sticky");
  expect(look.position).not.toBe("fixed");
  // dark text: not transparent, not pure black
  const h1 = band(page).getByRole("heading", { level: 1, name: title });
  const colour = await h1.evaluate((el) => getComputedStyle(el).color);
  expect(rgb(colour).a).toBeGreaterThan(0);
  expect(colour).not.toBe("rgb(0, 0, 0)");
  // the title and the subtitle are inset by the 16px gutter
  const t = (await h1.boundingBox())!;
  expect(t.x).toBe(16);
  if (subtitle) {
    const s = (await band(page).getByText(subtitle).boundingBox())!;
    expect(s.x).toBe(16);
  }
  // no Back button, exactly one h1 on the page
  // (Profile has a Back to Home, a real link; the other tab bands have none)
  await expect(band(page).locator("a:not([data-avatar]), button")).toHaveCount(withBack ? 1 : 0);
  await expect(page.locator("main h1:visible")).toHaveCount(1);
  // the content starts 16px below the band
  const below = await band(page).evaluate((el) => {
    const next = el.nextElementSibling as HTMLElement;
    return next.getBoundingClientRect().top - el.getBoundingClientRect().bottom;
  });
  expect(Math.abs(below - 16)).toBeLessThanOrEqual(1);
  expect(await noSidewaysScroll(page)).toBe(true);
  return t.y;
}

for (const width of [360, 430]) {
  test.describe(`Tab header band at ${width}px (Student)`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("Materials, Progress and Ask AI have the band, with the title at the same height", async ({
      page,
    }) => {
      const tops: number[] = [];
      await page.goto("/materials");
      tops.push(
        await checkBand(page, width, "Materials", "Read the training guides, then practise"),
      );
      await page.goto("/progress");
      tops.push(await checkBand(page, width, "Progress", "How you are doing over time."));
      await page.goto("/ask-ai");
      tops.push(await checkBand(page, width, "Ask AI", "Prototype answers from the guides"));
      for (const top of tops) expect(Math.abs(top - tops[0])).toBeLessThanOrEqual(2);
    });

    test("the bottom navigation is unchanged and Student Home has no band", async ({ page }) => {
      for (const path of ["/materials", "/progress", "/ask-ai"]) {
        await page.goto(path);
        const nav = page.getByRole("navigation");
        await expect(nav.getByRole("link")).toHaveCount(4);
        const box = (await nav.boundingBox())!;
        expect(box.y + box.height).toBeGreaterThan(775);
      }
      await page.goto("/");
      await expect(page.getByRole("heading", { name: /^Hi, / })).toBeVisible();
      await expect(page.locator("[data-page-header-band]")).toHaveCount(0);
    });

    test("the band scrolls away with the page", async ({ page }) => {
      await page.goto("/materials");
      await expect(band(page)).toHaveCount(1);
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect
        .poll(async () => {
          const box = (await band(page).boundingBox())!;
          return box.y + box.height;
        })
        .toBeLessThanOrEqual(0);
    });

    test("Exam and Steps keep the band with its Back button; Edit profile and About are unchanged", async ({
      page,
    }) => {
      for (const path of ["/exam", "/checklists"]) {
        await page.goto(path);
        await expect(band(page)).toHaveCount(1);
        await expect(band(page).getByRole("link", { name: "Back to Home" })).toHaveCount(1);
        const bg = await band(page).evaluate((el) => getComputedStyle(el).backgroundColor);
        expect(bg, path).toBe("rgb(240, 236, 230)");
      }
      // these two never had the band: a plain page with the white Back circle
      for (const path of ["/profile/edit", "/about"]) {
        await page.goto(path);
        await expect(page.locator("[data-page-header-band]")).toHaveCount(0);
        await expect(page.getByRole("link", { name: "Back to Profile" })).toBeVisible();
      }
    });
  });

  test.describe(`Tab header band at ${width}px (Instructor)`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("Instructor Home and Profile have the band", async ({ page }) => {
      await page.goto("/instructor");
      const top = await checkBand(page, width, "Instructor");
      await expect(page.getByText("No exams yet. Exam tools are coming next.")).toBeVisible();
      await page.goto("/profile");
      // Profile has the band with its Back to Home (so its title sits lower than a tab's)
      const profileTop = await checkBand(page, width, "Profile", "Your account and settings", true);
      expect(profileTop).toBeGreaterThan(top);
      await expect(page.getByRole("navigation").getByRole("link")).toHaveCount(4);
    });
  });
}
