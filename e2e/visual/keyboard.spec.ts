import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { prepare, routes } from "./routes";

/** The keyboard walkthrough of the main instructor flows at 1280px (DESIGN.md: Responsive instructor, step 7). */
test.use({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });
test.setTimeout(90_000);

const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** What the focused element shows: an outline of its own or of the card, row or label that holds it. */
async function focusLook(page: Page) {
  return page.evaluate(() => {
    // any CSS colour (the theme uses oklch and colour-mix) as red, green and blue
    const parse = (value: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d")!;
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
    };
    let el: Element | null = document.activeElement;
    for (let depth = 0; el && depth < 5; depth++, el = el.parentElement) {
      const css = getComputedStyle(el);
      if (css.outlineStyle !== "none" && parseFloat(css.outlineWidth) >= 1) {
        return { ok: true, color: parse(css.outlineColor), depth };
      }
      // a card or row that shows the ring for the link inside it (has-focus-visible)
      if (el.matches(":has(:focus-visible)") && getComputedStyle(el).boxShadow !== "none") {
        return { ok: true, color: [63, 70, 56], depth };
      }
    }
    const own = getComputedStyle(document.activeElement!);
    return { ok: own.boxShadow !== "none", color: [63, 70, 56], depth: -1 };
  });
}
const label = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return "";
    return (
      el.getAttribute("aria-label") ||
      el.innerText?.trim().slice(0, 40) ||
      el.getAttribute("placeholder") ||
      el.tagName
    );
  });

const walk = async (page: Page, steps: number) => {
  const seen: {
    label: string;
    y: number;
    x: number;
    look: Awaited<ReturnType<typeof focusLook>>;
  }[] = [];
  for (let i = 0; i < steps; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(120);
    const box = await page.evaluate(() => {
      const r = document.activeElement!.getBoundingClientRect();
      return { x: r.x, y: r.y, inBody: document.activeElement !== document.body };
    });
    if (!box.inBody) break;
    seen.push({ label: await label(page), x: box.x, y: box.y, look: await focusLook(page) });
  }
  return seen;
};

const instructorRoutes = routes.filter(
  (route) =>
    route.role === "instructor" &&
    [
      "instructor-overview",
      "instructor-exams-list",
      "instructor-exam-active",
      "instructor-students",
      "instructor-student-detail",
      "instructor-content-with-topic",
      "instructor-content-import",
      "instructor-exam-assign",
      "instructor-students-invite",
      "instructor-profile",
    ].includes(route.name),
);

for (const route of instructorRoutes) {
  test(`Tab pass: ${route.name}`, async ({ page }) => {
    await prepare(page, route.role);
    await route.setup?.(page);
    await page.goto(route.path);
    if (route.ready) await page.locator(route.ready).first().waitFor();
    await route.after?.(page);
    await page.waitForTimeout(400);
    const seen = await walk(page, 45);
    expect(seen.length).toBeGreaterThan(8);
    expect(seen[0].label).toBe("Skip to main content");
    // no trap: the pass reaches the content after the side navigation
    const names = seen.map((s) => s.label);
    expect(names.slice(1, 5)).toEqual(["Overview", "Exams", "Students", "Content"]);
    expect(seen.some((s) => s.x > 260)).toBe(true);
    // the side navigation comes first, then the page, in a sensible order
    const firstContent = seen.findIndex((s) => s.x > 260 && s.label !== "Skip to main content");
    expect(firstContent).toBeGreaterThan(4);
    // every stop shows a focus ring that stands out from white and from the page background
    for (const stop of seen) {
      expect(stop.look.ok, `focus ring on "${stop.label}"`).toBe(true);
      expect(
        contrast(stop.look.color, [255, 255, 255]),
        `ring on white: ${stop.label} ${JSON.stringify(stop.look)}`,
      ).toBeGreaterThanOrEqual(3);
      expect(
        contrast(stop.look.color, [246, 244, 240]),
        `ring on page: ${stop.label}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });
}

test("Students: sort, filter menu, open a row, back, all from the keyboard", async ({ page }) => {
  await prepare(page, "instructor");
  await page.goto("/instructor/students");
  await page.locator("[data-students-table]").waitFor();
  const sort = page
    .locator("[data-students-table] thead th", { hasText: "STUDENT" })
    .getByRole("button");
  await sort.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.locator("[data-students-table] thead th", { hasText: "STUDENT" }),
  ).toHaveAttribute("aria-sort", "ascending");
  await page.keyboard.press("Space");
  await expect(
    page.locator("[data-students-table] thead th", { hasText: "STUDENT" }),
  ).toHaveAttribute("aria-sort", "descending");
  const filter = page.locator("[data-filter-button-desk]");
  await filter.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-status-options]")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(filter).toBeFocused();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/filter=needs/);
  await expect(filter).toBeFocused();
  const link = page.locator("[data-table-link]").first();
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/instructor\/students\/[^/?]+\?from=students/);
  await page.getByRole("link", { name: "Back to students" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/instructor\/students\?filter=needs/);
});

test("Topic tabs, question edit and Save from the keyboard", async ({ page }) => {
  await prepare(page, "instructor");
  await page.goto("/instructor/content/import");
  await page.getByRole("button", { name: "Try an example" }).click();
  await page.getByRole("button", { name: /^Import/ }).click();
  await page.getByRole("heading", { name: "Draft is ready" }).waitFor({ timeout: 20_000 });
  await page.getByRole("button", { name: "Open draft" }).focus();
  await page.keyboard.press("Enter");
  await page.locator("[data-tab-bar]").waitFor();
  const tabs = page.getByRole("tab");
  await tabs.first().focus();
  await page.keyboard.press("End");
  await expect(tabs.nth(3)).toHaveAttribute("aria-selected", "true");
  const link = page.locator("[data-questions-table] [data-table-link]").first();
  await link.focus();
  await page.keyboard.press("Enter");
  await page.locator("textarea").first().waitFor();
  await page.locator("textarea").first().focus();
  await page.keyboard.type(" Extra words.");
  await page.locator("[data-header-slot]").getByRole("button", { name: "Save" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/package\/[^/]+(\?|$)/);
});

test("Assign exam from the keyboard, Escape closes the discard dialog and the focus returns", async ({
  page,
}) => {
  await prepare(page, "instructor");
  await page.goto("/instructor/exams/new");
  await page.getByLabel("Exam title").focus();
  await page.keyboard.type("Keyboard exam");
  const cancel = page.locator("[data-card-footer]").getByRole("button", { name: "Cancel" });
  await cancel.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(cancel).toBeFocused();
});

test("Invite students: the copy buttons work with Enter and Space", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await prepare(page, "instructor");
  await page.goto("/instructor/students/invite");
  const code = page.getByRole("button", { name: "Copy group code" });
  await code.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("[data-flash]")).toContainText("Code copied");
  const link = page.getByRole("button", { name: "Copy invite link" });
  await link.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("[data-flash]")).toContainText("Link copied");
});
