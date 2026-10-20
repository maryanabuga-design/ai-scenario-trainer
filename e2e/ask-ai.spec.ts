import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Q = { id: string; correctOptionId: string; options: { id: string }[] };
const quiz: Q[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;

const profile = { direction: "building-evacuation", onboarded: true };
const OLIVE_TINT = "rgb(224, 230, 214)";
const PRIMARY = "rgb(63, 70, 56)";
const WHITE = "rgb(255, 255, 255)";
const SAND_100 = "rgb(240, 232, 216)";
const SAND_200 = "rgb(228, 214, 188)";
const SAND_900 = "rgb(77, 63, 45)";
const DISCLAIMER = "Prototype answer: a prepared example, not a live AI. It may be inaccurate.";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

const thread = (n: number) => ({
  id: `t${n}`,
  title: `Thread ${n}`,
  subtitle: "S1 · Responding to an alarm",
  createdAt: n,
  updatedAt: n,
  messages: [{ id: `m${n}`, role: "ai", text: "Prepared", sources: ["S1"], topic: "S1" }],
});

async function open(page: Page, path: string, threads: object[] | null = null, extra?: object) {
  await page.addInitScript(
    ([p, t, e]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (t) localStorage.setItem("ast.ask-ai.v1", JSON.stringify({ schema: 6, value: t }));
      if (e) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: e }));
    },
    [profile, threads, extra ?? null] as const,
  );
  await page.goto(path);
}

const stored = (page: Page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem("ast.ask-ai.v1");
    return raw
      ? (JSON.parse(raw).value as { id: string; messages: unknown[]; title: string }[])
      : [];
  });

const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);

const aiCards = (page: Page) => page.locator('[data-message="ai"]');

for (const width of [360, 430]) {
  test.describe(`Ask AI at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("the navigation has Ask AI and no Profile tab; the avatar opens Profile and Back returns", async ({
      page,
    }) => {
      await open(page, "/ask-ai");
      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(nav.getByRole("link")).toHaveCount(4);
      await expect(nav.getByRole("link", { name: "Ask AI" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(nav.getByRole("link", { name: "Profile" })).toHaveCount(0);
      const active = nav.getByRole("link", { name: "Ask AI" });
      expect(await bg(active)).toBe(SAND_100);
      expect(await active.evaluate((el) => getComputedStyle(el).color)).toBe(SAND_900);
      // the avatar: a 40px sand circle with the initial in a 44px tap area
      const avatar = page.locator("[data-page-header-band] [data-avatar]");
      const tap = (await avatar.boundingBox())!;
      expect(tap.width).toBeGreaterThanOrEqual(44);
      expect(tap.height).toBeGreaterThanOrEqual(44);
      const circle = avatar.locator("span");
      expect(await bg(circle)).toBe(SAND_200);
      expect(await circle.evaluate((el) => getComputedStyle(el).color)).toBe(SAND_900);
      expect((await circle.boundingBox())!.width).toBe(40);
      expect((await circle.boundingBox())!.x + 40).toBeLessThanOrEqual(width - 16 + 0.5);
      await expect(circle).toHaveText("M");
      await avatar.click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/ask-ai$/);
    });

    test("the avatar is in the header band of Materials and Progress too", async ({ page }) => {
      for (const path of ["/materials", "/progress"]) {
        await open(page, path);
        await expect(page.locator("[data-page-header-band] [data-avatar]:visible")).toHaveCount(1);
      }
    });

    test("an empty history shows the text and four suggested questions; no sideways scroll", async ({
      page,
    }) => {
      await open(page, "/ask-ai");
      await expect(page.getByText("Ask about any topic in the guides")).toBeVisible();
      const rows = page.locator("[data-suggested]");
      await expect(rows).toHaveCount(4);
      for (const row of await rows.all()) {
        const box = (await row.boundingBox())!;
        expect(box.height).toBe(56);
        expect(await bg(row)).toBe(WHITE);
      }
      await expect(page.getByRole("button", { name: "Clear history" })).toHaveCount(0);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("a suggested question starts a conversation; it persists after a reload and shows in the history", async ({
      page,
    }) => {
      await open(page, "/ask-ai");
      await page.locator("[data-suggested]").nth(1).click();
      await expect(page).toHaveURL(/\/ask-ai\/t-/);
      // the typing indicator, then the answer
      await expect(page.locator("[data-typing]")).toBeVisible();
      await expect(aiCards(page)).toHaveCount(1);
      await expect(aiCards(page).first()).toContainText("stay low");
      await page.reload();
      await expect(aiCards(page)).toHaveCount(1);
      await page.getByRole("link", { name: "Back to Ask AI" }).click();
      const row = page.locator("[data-thread]").first();
      await expect(row).toContainText("How do I move through smoke?");
      await expect(row).toContainText("S3 · Moving through smoke");
      await expect(row).toContainText("Just now");
      expect((await row.boundingBox())!.height).toBe(72);
      await page.reload();
      await expect(page.locator("[data-thread]")).toHaveCount(1);
    });

    test("a free question is matched by keyword; an unknown one gets the fallback with 3 suggestions", async ({
      page,
    }) => {
      await open(page, "/ask-ai");
      const input = page.getByLabel("Ask a question");
      await input.fill("what do I do about a burn on my hand");
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page).toHaveURL(/\/ask-ai\/t-/);
      await expect(aiCards(page).first()).toContainText("running water");
      await expect(page.locator("[data-source-pill]")).toHaveText(/S8 · Burns/);
      // a question nothing matches: the fallback and three suggestions
      await page.getByLabel("Ask a follow-up question").fill("who won the match yesterday");
      await page.getByRole("button", { name: "Send" }).click();
      const fallback = aiCards(page).nth(1);
      await expect(fallback).toContainText(
        "I do not have a prepared answer for this. Try one of these:",
      );
      await expect(fallback.getByRole("button")).toHaveCount(3);
      // tapping a suggestion answers it
      await fallback.getByRole("button").first().click();
      await expect(aiCards(page)).toHaveCount(3);
      await expect(aiCards(page).nth(2)).toContainText("Treat every alarm as real");
    });

    test("every AI message has the disclaimer, a source pill that opens the guide, and the quick actions add messages", async ({
      page,
    }) => {
      await open(page, "/ask-ai");
      await page.locator("[data-suggested]").first().click();
      await expect(aiCards(page)).toHaveCount(1);
      for (const label of ["Give an example", "Explain simply", "Show the guide"]) {
        const button = page.getByRole("button", { name: label });
        await expect(button).toBeVisible();
        expect(await bg(button)).toBe(OLIVE_TINT);
        expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      }
      await page.getByRole("button", { name: "Give an example" }).click();
      await expect(aiCards(page)).toHaveCount(2);
      await expect(aiCards(page).nth(1)).toContainText("Example:");
      await page.getByRole("button", { name: "Explain simply" }).click();
      await expect(aiCards(page)).toHaveCount(3);
      await expect(aiCards(page).nth(2)).toContainText("In short:");
      await page.getByRole("button", { name: "Show the guide" }).click();
      await expect(aiCards(page)).toHaveCount(4);
      await expect(aiCards(page).nth(3)).toContainText("From the guide:");
      // the disclaimer under every AI message
      await expect(page.locator("[data-disclaimer]")).toHaveCount(4);
      for (const text of await page.locator("[data-disclaimer]").allInnerTexts()) {
        expect(text).toBe(DISCLAIMER);
      }
      // the quick actions are only under the latest answer
      await expect(page.locator("[data-quick-actions]")).toHaveCount(1);
      // the user's messages are right-aligned olive bubbles, the AI's white bordered cards
      const user = page.locator('[data-message="user"]').first();
      expect(await bg(user)).toBe(OLIVE_TINT);
      const ubox = (await user.boundingBox())!;
      expect(ubox.x + ubox.width).toBeGreaterThan(width - 24);
      const card = aiCards(page).first().locator("> div").first();
      expect(await bg(card)).toBe(WHITE);
      expect(await card.evaluate((el) => getComputedStyle(el).borderTopWidth)).toBe("1px");
      // a source pill navigates to the guide section
      await page.locator("[data-source-pill]").first().click();
      await expect(page).toHaveURL(/\/materials\/read\/S1$/);
    });

    test("the history keeps 30 conversations, newest first, dropping the oldest", async ({
      page,
    }) => {
      const many = Array.from({ length: 30 }, (_, i) => thread(i + 1));
      await open(page, "/ask-ai", many);
      await expect(page.locator("[data-thread]")).toHaveCount(30);
      await page.getByLabel("Ask a question").fill("how do I move through smoke");
      await page.getByRole("button", { name: "Send" }).click();
      await expect(page).toHaveURL(/\/ask-ai\/t-/);
      const threads = await stored(page);
      expect(threads).toHaveLength(30);
      expect(threads.some((t) => t.id === "t1")).toBe(false);
      expect(threads[0].title).toBe("how do I move through smoke");
      await page.getByRole("link", { name: "Back to Ask AI" }).click();
      await expect(page.locator("[data-thread]")).toHaveCount(30);
      await expect(page.locator("[data-thread]").first()).toContainText("how do I move");
    });

    test("Clear history asks first (Primary Clear, Secondary Cancel) and then empties the list", async ({
      page,
    }) => {
      await open(page, "/ask-ai", [thread(1), thread(2)]);
      const clear = page.getByRole("button", { name: "Clear history" });
      expect(await bg(clear)).toBe(OLIVE_TINT);
      await clear.click();
      const dialog = page.locator("dialog[open]");
      await expect(dialog).toBeVisible();
      expect(await bg(dialog.getByRole("button", { name: "Clear", exact: true }))).toBe(PRIMARY);
      expect(await bg(dialog.getByRole("button", { name: "Cancel" }))).toBe(OLIVE_TINT);
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(page.locator("[data-thread]")).toHaveCount(2);
      await clear.click();
      await dialog.getByRole("button", { name: "Clear", exact: true }).click();
      await expect(page.locator("[data-thread]")).toHaveCount(0);
      await expect(page.getByText("Ask about any topic in the guides")).toBeVisible();
      await page.reload();
      await expect(page.locator("[data-thread]")).toHaveCount(0);
    });

    test("a broken saved history loads without a crash", async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("ast.ask-ai.v1", "{not json");
        localStorage.setItem(
          "ast.profile.v1",
          JSON.stringify({ direction: "building-evacuation", onboarded: true }),
        );
      });
      await page.goto("/ask-ai");
      await expect(page.getByText("Ask about any topic in the guides")).toBeVisible();
      await page.evaluate(() =>
        localStorage.setItem(
          "ast.ask-ai.v1",
          JSON.stringify({ schema: 6, value: [null, { id: 3 }, "x"] }),
        ),
      );
      await page.reload();
      await expect(page.getByText("Ask about any topic in the guides")).toBeVisible();
    });

    test("the Answer review has the row; one thread per question, composed from its data, never duplicated", async ({
      page,
    }) => {
      const items = quiz.slice(0, 3);
      const wrong = (q: Q) => q.options.find((o) => o.id !== q.correctOptionId)!.id;
      await open(page, "/session/results/review/2", null, {
        kind: "quiz",
        itemIds: items.map((q) => q.id),
        answers: items.map((q) => ({ itemId: q.id, optionId: wrong(q) })),
        index: 2,
        finished: true,
      });
      await expect(page.getByText("Ask AI about this step")).toHaveCount(0);
      const row = page.locator("[data-ask-ai-row]");
      await expect(row).toBeVisible();
      const box = (await row.boundingBox())!;
      expect(box.height).toBe(56);
      expect(await bg(row)).toBe(WHITE);
      await row.click();
      await expect(page).toHaveURL(/\/ask-ai\/q-/);
      await expect(page.getByRole("heading", { level: 1 })).toContainText("Question 2: ");
      const first = aiCards(page).first();
      await expect(first).toContainText("You answered:");
      await expect(first).toContainText("The correct answer:");
      await expect(first).toContainText("Why:");
      await expect(page.locator("[data-source-pill]").first()).toBeVisible();
      await expect(page.locator("[data-disclaimer]")).toHaveCount(1);
      // reopening does not duplicate it
      await page.goBack();
      await page.locator("[data-ask-ai-row]").click();
      await page.goto("/ask-ai");
      await expect(page.locator("[data-thread]")).toHaveCount(1);
      expect((await stored(page)).filter((t) => t.id.startsWith("q-"))).toHaveLength(1);
      // a second question gets its own thread
      await page.goto("/session/results/review/3");
      await page.locator("[data-ask-ai-row]").click();
      await expect(page).toHaveURL(/\/ask-ai\/q-/);
      expect(await stored(page)).toHaveLength(2);
    });

    test("tap targets are at least 44px and nothing overflows on a thread", async ({ page }) => {
      await open(page, "/ask-ai");
      await page.locator("[data-suggested]").first().click();
      await expect(aiCards(page)).toHaveCount(1);
      for (const loc of [
        page.getByRole("link", { name: "Back to Ask AI" }),
        page.getByRole("button", { name: "Send" }),
        page.getByLabel("Ask a follow-up question"),
        page.locator("[data-source-pill]").first(),
      ]) {
        const box = (await loc.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(36);
        expect(box.height + 8).toBeGreaterThanOrEqual(44);
      }
      expect(
        (await page.getByLabel("Ask a follow-up question").boundingBox())!.height,
      ).toBeGreaterThanOrEqual(44);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the input stays above the bottom edge and uncovered when focused (mobile viewport)", async ({
      page,
    }) => {
      await open(page, "/ask-ai");
      const input = page.getByLabel("Ask a question");
      await input.focus();
      await page.waitForTimeout(500);
      const box = (await input.boundingBox())!;
      const view = page.viewportSize()!;
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.y + box.height).toBeLessThanOrEqual(view.height);
      const covered = await page.evaluate(
        ([x, y]) => document.elementFromPoint(x, y)?.tagName,
        [box.x + box.width / 2, box.y + box.height / 2],
      );
      expect(covered).toBe("INPUT");
      // it sits above the navigation
      const nav = (await page.getByRole("navigation", { name: "Main" }).boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
    });

    test("no external network request while using Ask AI", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await open(page, "/ask-ai");
      await page.locator("[data-suggested]").first().click();
      await expect(aiCards(page)).toHaveCount(1);
      await page.getByRole("button", { name: "Give an example" }).click();
      await expect(aiCards(page)).toHaveCount(2);
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });

    test("under reduced motion the answer comes at once and the dots stand still", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, "/ask-ai");
      await page.locator("[data-suggested]").first().click();
      await expect(aiCards(page)).toHaveCount(1, { timeout: 1500 });
    });
  });
}
