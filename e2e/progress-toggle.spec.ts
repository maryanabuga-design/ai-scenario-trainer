import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Item = { id: string; section: string; options: { id: string }[]; correctOptionId: string };
const quiz: Item[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;
const s1 = quiz.filter((q) => q.section === "S1");

async function open(page: Page) {
  const history = [
    {
      kind: "quiz",
      mode: "practice",
      topicIds: ["S1"],
      itemIds: s1.map((q) => q.id),
      answers: s1.map((q) => ({ itemId: q.id, optionId: q.correctOptionId })),
      finishedAt: Date.now() - 3600_000,
    },
  ];
  await page.addInitScript(
    ([p, h]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 1, value: h }));
    },
    [{ direction: "building-evacuation", onboarded: true }, history] as const,
  );
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "By topic" })).toBeVisible();
}

const viewports = [
  { name: "360", width: 360, height: 800 },
  { name: "430", width: 430, height: 932 },
  { name: "desktop", width: 1280, height: 800 },
];

for (const viewport of viewports) {
  test.describe(`Other topics toggle at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test("collapsed: ONE toggle after the last exam card, cards hidden and not focusable", async ({
      page,
    }) => {
      await open(page);
      const toggle = page.getByRole("button", { name: "Show other topics (6)" });
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(toggle).toHaveAttribute("aria-controls", "other-topics");
      await expect(page.locator("button[aria-controls=other-topics]")).toHaveCount(1);
      await expect(toggle.locator("svg.lucide-chevron-down")).toBeVisible();
      // after the last exam card (S4), before nothing else
      const s4 = (await page.locator('[data-topic-row="S4"]').boundingBox())!;
      const t = (await toggle.boundingBox())!;
      expect(t.y).toBeGreaterThanOrEqual(s4.y + s4.height);
      expect(t.y - (s4.y + s4.height)).toBeLessThanOrEqual(32);
      // the other cards are hidden and cannot take focus
      await expect(page.locator('[data-topic-row="S5"]')).toBeHidden();
      const group = page.locator("#other-topics");
      expect(await group.evaluate((el) => el.hasAttribute("inert"))).toBe(true);
      await page.keyboard.press("Tab");
      const focusedInside = await page.evaluate(
        () => !!document.activeElement?.closest("#other-topics"),
      );
      expect(focusedInside).toBe(false);
      // collapsed by default
      expect(await page.locator("[data-topic-row]:visible").count()).toBe(4);
    });

    test("expanded: the caption, S5 to S10, then the toggle 'Hide other topics' after the last card", async ({
      page,
    }) => {
      await open(page);
      await page.getByRole("button", { name: "Show other topics (6)" }).click();
      const hide = page.getByRole("button", { name: "Hide other topics" });
      await expect(hide).toHaveAttribute("aria-expanded", "true");
      await expect(hide).toBeFocused();
      await expect(hide.locator("svg.lucide-chevron-down")).toHaveClass(/rotate-180/);
      await page.waitForTimeout(300);
      await expect(page.locator("[data-topic-row]:visible")).toHaveCount(10);
      // DOM order: exam cards, caption, other cards, toggle; one toggle only
      const order = await page.evaluate(() => {
        const all = [
          ...document.querySelectorAll("[data-topic-row], h3, button[aria-controls=other-topics]"),
        ].filter((el) => (el as HTMLElement).offsetParent !== null);
        return all.map((el) => el.getAttribute("data-topic-row") ?? el.textContent?.trim());
      });
      expect(order).toEqual([
        "In your exam",
        "S1",
        "S2",
        "S3",
        "S4",
        "Other topics",
        "S5",
        "S6",
        "S7",
        "S8",
        "S9",
        "S10",
        "Hide other topics",
      ]);
      await expect(page.locator("button[aria-controls=other-topics]")).toHaveCount(1);
      const caption = page.getByRole("heading", { name: "Other topics", level: 3 });
      await expect(caption).toBeVisible();
      const s4 = (await page.locator('[data-topic-row="S4"]').boundingBox())!;
      const c = (await caption.boundingBox())!;
      expect(c.y).toBeGreaterThan(s4.y + s4.height);
      const s10 = (await page.locator('[data-topic-row="S10"]').boundingBox())!;
      const h = (await hide.boundingBox())!;
      expect(h.y).toBeGreaterThanOrEqual(s10.y + s10.height);
      expect(await page.locator("#other-topics").evaluate((el) => el.hasAttribute("inert"))).toBe(
        false,
      );
    });

    test("after Hide the toggle stays inside the viewport and keeps focus", async ({ page }) => {
      await open(page);
      await page.getByRole("button", { name: "Show other topics (6)" }).click();
      await page.waitForTimeout(300);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(200);
      await page.getByRole("button", { name: "Hide other topics" }).click();
      await page.waitForTimeout(500);
      const show = page.getByRole("button", { name: "Show other topics (6)" });
      await expect(show).toBeFocused();
      const box = (await show.boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
      await expect(page.locator('[data-topic-row="S5"]')).toBeHidden();
    });

    test("no height transition under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page);
      const duration = await page
        .locator("#other-topics")
        .evaluate((el) => getComputedStyle(el).transitionDuration);
      expect(parseFloat(duration)).toBeLessThan(0.001);
    });

    test("with motion the group has a 200ms height transition", async ({ page }) => {
      await open(page);
      const look = await page
        .locator("#other-topics")
        .evaluate((el) => [
          getComputedStyle(el).transitionDuration,
          getComputedStyle(el).transitionProperty,
        ]);
      expect(look[0]).toContain("0.2s");
      expect(look[1]).toContain("grid-template-rows");
    });
  });
}
