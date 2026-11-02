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

const HIGHLIGHT = "rgb(246, 244, 240)";
const WHITE = "rgb(255, 255, 255)";
const TRANSPARENT = "rgba(0, 0, 0, 0)";

/** Phones have no hover: the hover fill is only drawn where the device can hover. */
const canHover = (page: Page) => page.evaluate(() => matchMedia("(hover: hover)").matches);
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const box = async (loc: ReturnType<Page["locator"]>) => (await loc.first().boundingBox())!;

for (const width of [360, 430]) {
  test.describe(`Small instructor fixes at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("the exam ... menu: nothing is highlighted on a mouse opening; hover uses the one lighter fill; the keyboard row has the fill and a focus ring", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/seed-active");
      const more = page.getByRole("button", { name: "More actions" });
      await more.click();
      const items = page.getByRole("menuitem");
      await expect(items).toHaveCount(3);
      for (const item of await items.all()) expect(await bg(item)).toBe(TRANSPARENT);
      // the white card behind, with its dividers
      expect(await bg(page.locator("[data-menu]"))).toBe(WHITE);
      expect(await items.last().evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("1px");
      // hover: the page background colour, not the header band's sand
      if (await canHover(page)) {
        await items.nth(1).hover();
        expect(await bg(items.nth(1))).toBe(HIGHLIGHT);
      }
      await page.keyboard.press("Escape");
      // a keyboard opening marks the first row and gives it a focus ring
      await more.focus();
      await page.keyboard.press("Enter");
      await expect(items.first()).toBeVisible();
      expect(await bg(items.first())).toBe(HIGHLIGHT);
      expect(await items.first().evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
      expect(
        await items.first().evaluate((el) => parseFloat(getComputedStyle(el).outlineWidth)),
      ).toBe(2);
      await page.keyboard.press("ArrowDown");
      expect(await bg(items.nth(1))).toBe(HIGHLIGHT);
      expect(await bg(items.first())).toBe(TRANSPARENT);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the Overview group dropdown: the current group keeps its check and the same lighter fill, nothing else is marked on a mouse opening", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await page.locator("[data-group-pill]:visible").click();
      const current = page.locator('[data-group-option][aria-selected="true"]');
      await expect(current.locator("svg.lucide-check")).toHaveCount(1);
      expect(await bg(current)).toBe(HIGHLIGHT);
      const others = page.locator('[data-group-option][aria-selected="false"]');
      for (const row of await others.all()) expect(await bg(row)).toBe(TRANSPARENT);
      expect(await bg(page.locator("[data-group-list]"))).toBe(WHITE);
      if (await canHover(page)) {
        await others.first().hover();
        expect(await bg(others.first())).toBe(HIGHLIGHT);
      }
      // keyboard focus is still visible
      await page.keyboard.press("Escape");
      await page.locator("[data-group-pill]:visible").press("ArrowDown");
      const marked = page.locator("[data-group-option]").first();
      expect(await marked.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("solid");
    });

    test("Assign exam: the subtitle, a white specs card and Select all as a tertiary link that becomes Clear all", async ({
      page,
    }) => {
      await page.goto("/instructor/exams/new");
      await expect(page.getByText("Choose the topics and give the exam a title.")).toBeVisible();
      expect(await bg(page.locator("[data-specs-card]"))).toBe(WHITE);
      expect(
        await page
          .locator("[data-specs-card]")
          .evaluate((el) => getComputedStyle(el).borderTopWidth),
      ).toBe("1px");
      const link = page.getByRole("button", { name: "Select all" });
      expect(await bg(link)).toBe(TRANSPARENT);
      expect(await link.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("0px");
      expect(
        await link
          .locator("span")
          .first()
          .evaluate((el) => getComputedStyle(el).textDecorationLine),
      ).toBe("underline");
      expect((await box(link)).height).toBeGreaterThanOrEqual(44);
      const label = await box(page.getByRole("heading", { name: "TOPICS" }));
      const lb = await box(link);
      expect(lb.x).toBeGreaterThan(label.x + label.width);
      expect(Math.abs(lb.y + lb.height / 2 - (label.y + label.height / 2))).toBeLessThanOrEqual(12);
      await link.click();
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(10);
      await expect(page.getByRole("button", { name: "Clear all" })).toBeVisible();
      await page.getByRole("button", { name: "Clear all" }).click();
      await expect(page.locator("input[name=topics]:checked")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Select all" })).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the exam detail has the muted subtitle under the title", async ({ page }) => {
      await page.goto("/instructor/exams/seed-active");
      const title = page.locator("main h1:visible");
      const subtitle = page.getByText("Results by student and the hardest questions.");
      await expect(subtitle).toBeVisible();
      const t = await box(title);
      const s = await box(subtitle);
      expect(s.y).toBeGreaterThanOrEqual(t.y + t.height - 1);
      expect(await subtitle.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(92, 90, 85)");
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Overview: no demo line, and every section label sits 8px above its card with 24px above the label", async ({
      page,
    }) => {
      await page.goto("/instructor");
      await expect(page.locator("[data-demo-note]")).toHaveCount(0);
      await expect(page.getByText("Demo group")).toHaveCount(0);
      for (const labelledby of ["actions-title", "exams-title", "weakest-title"]) {
        const section = page.locator(`section[aria-labelledby="${labelledby}"]:visible`);
        await expect(section, labelledby).toHaveCount(1);
        const header = await section.locator("> div").first().boundingBox();
        const card = await section.locator("> :not(:first-child)").first().boundingBox();
        expect(Math.round(card!.y - (header!.y + header!.height)), labelledby).toBe(8);
      }
      // the larger gap above each label stays 24px
      const sections = page.locator("main section:visible");
      const n = await sections.count();
      for (let i = 1; i < n; i++) {
        const prev = await box(sections.nth(i - 1));
        const cur = await box(sections.nth(i));
        expect(Math.round(cur.y - (prev.y + prev.height))).toBe(24);
      }
      // the "All topics" link keeps its 44px tap area
      expect(
        (await box(page.getByRole("link", { name: "All topics" }))).height,
      ).toBeGreaterThanOrEqual(44);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("no 'Demo group' line on any instructor screen", async ({ page }) => {
      for (const path of [
        "/instructor",
        "/instructor/students",
        "/instructor/students?view=topics",
        "/instructor/students/topic/S3",
        "/instructor/students/maryana%40example.com",
        "/instructor/exams",
        "/instructor/exams/seed-active",
        "/instructor/exams/new",
        "/instructor/students/invite",
        "/instructor/content",
      ]) {
        await page.goto(path);
        await page.waitForTimeout(150);
        await expect(page.getByText("Demo group"), path).toHaveCount(0);
        await expect(
          page.locator("[data-demo-note]").filter({ hasText: "simulated" }),
          path,
        ).toHaveCount(0);
        expect(await noSidewaysScroll(page), path).toBe(true);
      }
    });
  });
}

for (const width of [360, 430]) {
  test.describe(`One assign icon at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: instructor });

    test("every assign-exam button has the same circled plus at the same size", async ({
      page,
    }) => {
      const places: [string, string][] = [
        ["/instructor/exams", "Assign exam"],
        ["/instructor", "Assign exam"],
        ["/instructor", "Assign exam on this topic"],
        ["/instructor/students?view=topics", "Assign exam on weakest topic"],
        ["/instructor/students/topic/S3", "Assign exam on this topic"],
        ["/instructor/exams/new", "Assign exam"],
      ];
      for (const [path, name] of places) {
        await page.goto(path);
        const control = page
          .locator("a:visible, button:visible")
          .filter({ hasText: new RegExp(`^${name}$`) });
        await expect(control, `${path} ${name}`).toHaveCount(1);
        const icon = control.locator("svg").first();
        await expect(icon, `${path} ${name}`).toHaveClass(/lucide-circle-plus/);
        const b = (await icon.boundingBox())!;
        expect([b.width, b.height], `${path} ${name}`).toEqual([18, 18]);
        // the same gap between the icon and the label on every button
        const gap = await control.evaluate((el) => {
          const svg = el.querySelector("svg")!.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(el);
          const text = Array.from(el.childNodes).find(
            (n) =>
              n.nodeType === 3 ||
              (n instanceof HTMLElement && !n.querySelector("svg") && n.tagName !== "svg"),
          );
          const target = text ? document.createRange() : range;
          if (text) target.selectNodeContents(text);
          return Math.round(target.getBoundingClientRect().left - svg.right);
        });
        expect(gap, `${path} ${name}`).toBe(8);
        expect(await noSidewaysScroll(page), path).toBe(true);
      }
    });

    test("the Overview exam row is the Exams list card: icon tile, neutral Due pill, one result line", async ({
      page,
    }) => {
      await page.goto("/instructor");
      const row = page.locator("[data-exams-card] [data-exam-card]").first();
      await expect(row.locator("img")).toHaveCount(0);
      const tile = row.locator("[data-exam-tile]");
      const t = (await tile.boundingBox())!;
      expect([t.width, t.height]).toEqual([48, 48]);
      expect(await bg(tile)).toBe("rgb(239, 236, 230)");
      const pill = row.locator("[data-date-pill]");
      await expect(pill).toHaveText(/^Due \d+ \w{3}$/);
      expect(await bg(pill)).toBe("rgb(239, 236, 230)");
      await expect(row).toContainText(/Passed \d+ of \d+$/);
      expect(await row.innerText()).not.toMatch(/not started|topics?\b/i);
      expect((await box(row)).height).toBe(88);
      // the same card as on the Exams screen
      const overview = await row.evaluate((el) =>
        el.className.replace(/rounded-card.*shadow-\(--card-shadow\)/, "").trim(),
      );
      await page.goto("/instructor/exams");
      const listCard = page.locator("[data-exam-card]:visible").first();
      const own = await listCard.evaluate((el) =>
        el.className.replace(/rounded-card.*shadow-\(--card-shadow\)/, "").trim(),
      );
      expect(own.replace(/\s+/g, " ")).toBe(overview.replace(/\s+/g, " "));
      expect(await noSidewaysScroll(page)).toBe(true);
    });
  });
}
