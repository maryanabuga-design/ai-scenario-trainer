import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Q = { id: string; correctOptionId: string; options: { id: string }[] };
const quiz: Q[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;
const ids = quiz.filter((q) => q.id.startsWith("q-quiz-s01")).slice(0, 5);
const answer = (q: Q, right: boolean) => ({
  itemId: q.id,
  optionId: right ? q.correctOptionId : q.options.find((o) => o.id !== q.correctOptionId)!.id,
  checked: true,
});

const account = (extra: object = {}) =>
  JSON.stringify({
    schema: 6,
    content: "seed",
    value: {
      accounts: [
        {
          name: "Maryana",
          email: "maryana@example.com",
          role: "student",
          createdAt: 1,
          onboardingDone: true,
          legacy: true,
          ...extra,
        },
      ],
      session: { email: "maryana@example.com" },
      pending: null,
    },
  });

/** Opens a page with a finished practice session (`right` of 5 answered right) in the browser. */
async function finished(page: Page, right: number, returnTo?: string, partId?: string) {
  const session = {
    kind: "quiz",
    itemIds: ids.map((q) => q.id),
    answers: ids.map((q, n) => answer(q, n < right)),
    index: 0,
    finished: true,
    finishedAt: Date.now(),
    ...(returnTo && { returnTo }),
    ...(partId && { partId }),
  };
  await page.addInitScript(
    ([s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem(
        "ast.profile.v1",
        JSON.stringify({ direction: "building-evacuation", onboarded: true }),
      );
      localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
      localStorage.setItem(
        "ast.history.v1",
        JSON.stringify({
          schema: 6,
          value: [{ kind: "quiz", itemIds: s.itemIds, answers: s.answers, finishedAt: Date.now() }],
        }),
      );
    },
    [session],
  );
  await page.goto("/session/results");
  await expect(page.getByRole("heading", { name: /Passed|Not passed yet/ })).toBeVisible();
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

for (const width of [360, 430]) {
  test.describe(`Student polish at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("a passed result: one Primary Done and the Secondary Review answers; the title has the focus", async ({
      page,
    }) => {
      await finished(page, 5, "/materials/read/S1");
      await expect(page.getByRole("heading", { name: "Results", level: 1 })).toBeFocused();
      const done = page.getByRole("link", { name: "Done", exact: true });
      await expect(done).toBeVisible();
      await expect(page.getByRole("link", { name: "Review answers", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Repeat weak topics" })).toHaveCount(0);
      const primaries = await page
        .locator("a, button")
        .evaluateAll(
          (els) =>
            els.filter((el) => getComputedStyle(el).backgroundColor === "rgb(63, 70, 56)").length,
        );
      expect(primaries).toBe(1);
      expect(Math.round((await done.boundingBox())!.height)).toBe(52);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("a result that is not passed is unchanged: Repeat weak topics and Review answers, no Done", async ({
      page,
    }) => {
      await finished(page, 2, "/materials/read/S1");
      await expect(page.getByRole("button", { name: "Repeat weak topics" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Review answers", exact: true })).toBeVisible();
      await expect(page.getByRole("link", { name: "Done", exact: true })).toHaveCount(0);
      await expect(page.getByText("40%", { exact: true })).toBeVisible();
    });

    for (const [name, origin, url] of [
      ["the topic screen", "/materials/read/S1", /\/materials\/read\/S1$/],
      ["the Training list", "/training?mode=quiz", /\/training\?mode=quiz$/],
      ["the Materials list", "/materials", /\/materials$/],
    ] as const) {
      test(`Done and the Back arrow both return to ${name}`, async ({ page }) => {
        await finished(page, 5, origin);
        await page.getByRole("link", { name: "Done", exact: true }).click();
        await expect(page).toHaveURL(url);
        await page.goBack();
        await expect(page).toHaveURL(/\/session\/results$/);
        await page.getByRole("link", { name: /^Back to/ }).click();
        await expect(page).toHaveURL(url);
      });
    }

    test("an unknown origin goes to the topic's reading screen, then Materials, never Home", async ({
      page,
    }) => {
      await finished(page, 5, undefined, "quiz:S1:1");
      await page.getByRole("link", { name: "Done", exact: true }).click();
      await expect(page).toHaveURL(/\/materials\/read\/S1$/);
      await page.goto("/");
      await page.evaluate(() => {
        const raw = JSON.parse(localStorage.getItem("ast.session.v1")!);
        delete raw.value.partId;
        localStorage.setItem("ast.session.v1", JSON.stringify(raw));
      });
      await page.goto("/session/results");
      await page.getByRole("link", { name: "Done", exact: true }).click();
      await expect(page).toHaveURL(/\/materials$/);
    });

    test("going back with the browser from Results does not reopen the finished quiz for answering", async ({
      page,
    }) => {
      await page.goto("/");
      await finished(page, 5, "/materials/read/S1");
      await page.goto("/session");
      await expect(page.locator("fieldset input[type=radio]")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "No session in progress" })).toBeVisible();
    });

    test("the Primary Done and Review answers are in view at 360 x 640", async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 640 });
      await finished(page, 5, "/materials/read/S1");
      const done = (await page.getByRole("link", { name: "Done", exact: true }).boundingBox())!;
      const review = (await page.getByRole("link", { name: "Review answers" }).boundingBox())!;
      for (const box of [done, review]) {
        expect(box.y).toBeGreaterThanOrEqual(0);
        expect(box.y + box.height).toBeLessThanOrEqual(640);
      }
    });

    test("the Materials selector reads Topics and Step guides without numbers, and still switches", async ({
      page,
    }) => {
      await page.addInitScript(
        ([a]) => {
          if (localStorage.getItem("ast.profile.v1")) return;
          localStorage.setItem(
            "ast.profile.v1",
            JSON.stringify({ direction: "building-evacuation", onboarded: true }),
          );
          localStorage.setItem("ast.auth.v1", a);
        },
        [account()],
      );
      await page.goto("/materials");
      const group = page.getByRole("radiogroup");
      await expect(group.getByRole("radio", { name: "Topics", exact: true })).toBeChecked();
      await expect(
        group.getByRole("radio", { name: "Step guides", exact: true }),
      ).not.toBeChecked();
      expect(((await group.innerText()).match(/\d/g) ?? []).length).toBe(0);
      await group.getByText("Step guides", { exact: true }).click();
      await expect(page).toHaveURL(/view=steps$/);
      await expect(group.getByRole("radio", { name: "Step guides", exact: true })).toBeChecked();
      await group.getByText("Topics", { exact: true }).click();
      await expect(group.getByRole("radio", { name: "Topics", exact: true })).toBeChecked();
      // the count stays where it already was (beside the section title)
      await expect(page.getByText(/\d+ topics/).first()).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("Ask AI has no sector row; the group's sector tunes the answers silently; a saved field still wins", async ({
      page,
    }) => {
      await page.addInitScript(
        ([a]) => {
          if (localStorage.getItem("ast.profile.v1")) return;
          localStorage.setItem(
            "ast.profile.v1",
            JSON.stringify({ direction: "building-evacuation", onboarded: true }),
          );
          localStorage.setItem("ast.auth.v1", a);
        },
        [account({ groupId: "military-training" })],
      );
      await page.goto("/ask-ai");
      await expect(page.locator("[data-tuned-row]")).toHaveCount(0);
      await expect(page.getByText(/Answers tuned for|Set your field/)).toHaveCount(0);
      await expect(page.getByText("Prototype answers from the guides")).toBeVisible();
      await expect(page.getByText("Suggested questions")).toBeVisible();
      expect(await noSidewaysScroll(page)).toBe(true);
      // the group's field (military) is used silently
      await page.locator("[data-suggested]").first().click();
      await expect(page.locator("main")).toContainText("Example for military");
    });

    test("old saved data without a field or group still loads, and a saved field is used", async ({
      page,
    }) => {
      await page.addInitScript(
        ([a]) => {
          if (localStorage.getItem("ast.profile.v1")) return;
          localStorage.setItem(
            "ast.profile.v1",
            JSON.stringify({ direction: "building-evacuation", onboarded: true }),
          );
          localStorage.setItem("ast.auth.v1", a);
        },
        [account({ field: "paramedic", groupId: "military-training" })],
      );
      await page.goto("/ask-ai");
      await page.locator("[data-suggested]").first().click();
      await expect(page.locator("main")).toContainText("Example for paramedic");
    });
  });
}
