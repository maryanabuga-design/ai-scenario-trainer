import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type Q = { id: string; correctOptionId: string; options: { id: string }[] };
const steps: Q[] = JSON.parse(
  readFileSync("content/scenario-building-evacuation.json", "utf8"),
).steps;
const three = steps.slice(0, 3);

const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const DISABLED = "rgb(240, 236, 230)";

const session = (finished: boolean, extra: object = {}) => ({
  kind: "scenario",
  itemIds: three.map((s) => s.id),
  answers: three.map((s) => ({
    itemId: s.id,
    optionId: s.options.find((o) => o.id !== s.correctOptionId)!.id,
  })),
  index: finished ? 2 : 0,
  finished,
  ...extra,
});

async function seed(page: Page, value: object | null) {
  await page.addInitScript(
    ([s]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem(
        "ast.profile.v1",
        JSON.stringify({ direction: "building-evacuation", onboarded: true }),
      );
      if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 2, value: s }));
    },
    [value],
  );
}

/** Every action in the area is a real button or link with a Primary, Secondary or disabled fill and no underline. */
async function expectFilledActions(area: Locator, where: string) {
  const actions = await area.locator("button:visible, a[href]:visible").evaluateAll((els) =>
    els.map((el) => {
      const css = getComputedStyle(el);
      const underlined = [el, ...el.querySelectorAll("*")].some((node) =>
        getComputedStyle(node).textDecorationLine.includes("underline"),
      );
      return {
        label: (el.textContent ?? "").trim(),
        bg: css.backgroundColor,
        underlined,
        disabled: (el as HTMLButtonElement).disabled === true,
      };
    }),
  );
  expect(actions.length, `${where}: has actions`).toBeGreaterThan(0);
  for (const action of actions) {
    const allowed = [PRIMARY, OLIVE_TINT, ...(action.disabled ? [DISABLED] : [])];
    expect(allowed, `${where}: "${action.label}" is filled (${action.bg})`).toContain(action.bg);
    expect(action.underlined, `${where}: "${action.label}" is not underlined`).toBe(false);
  }
}

const bottomArea = (page: Page) => page.locator("[data-full-bleed].border-t").last();
const dialog = (page: Page) => page.locator("dialog[open]");

for (const width of [360, 430]) {
  test.describe(`Button hierarchy guard at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    const pinned: [string, string, object | null][] = [
      ["Results", "/session/results", session(true)],
      [
        "Results (exam repeat)",
        "/session/results",
        session(true, { kind: "repeat", examId: "demo-evacuation-basics", returnTo: "/exam" }),
      ],
      ["Answer review", "/session/results/review/1", session(true)],
      ["Answer review, last question", "/session/results/review/3", session(true)],
      ["Question session", "/session", session(false)],
      ["Materials: material page", "/materials/evacuation-guide", null],
      ["Mini-quiz", "/mini-quiz", null],
    ];
    for (const [name, path, value] of pinned) {
      test(`${name}: the pinned bottom action area has only filled buttons`, async ({ page }) => {
        await seed(page, value);
        await page.goto(path);
        const area = bottomArea(page);
        await expect(area).toBeVisible();
        await expectFilledActions(area, name);
      });
    }

    test("dialogs: Leave this session (Stay Primary, Leave Secondary)", async ({ page }) => {
      await seed(page, session(false));
      await page.goto("/session");
      await page.getByRole("button", { name: "Exit" }).click();
      await expect(dialog(page)).toBeVisible();
      await expectFilledActions(dialog(page), "Leave this session");
      expect(
        await dialog(page)
          .getByRole("button", { name: "Stay" })
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe(PRIMARY);
      expect(
        await dialog(page)
          .getByRole("button", { name: "Leave" })
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      ).toBe(OLIVE_TINT);
    });

    test("dialogs: Profile (Reset progress, Delete account) and About (Restart demo)", async ({
      page,
    }) => {
      await seed(page, null);
      await page.goto("/profile");
      await page.getByRole("button", { name: "Reset progress" }).first().click();
      await expect(dialog(page)).toBeVisible();
      await expectFilledActions(dialog(page), "Reset progress");
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.locator("[data-delete-account]").click();
      await expect(dialog(page)).toBeVisible();
      await expectFilledActions(dialog(page), "Delete account");
      await page.getByRole("button", { name: "Cancel" }).click();
      await page.goto("/about");
      await page.getByRole("button", { name: "Restart demo" }).click();
      await expect(dialog(page)).toBeVisible();
      await expectFilledActions(dialog(page), "Restart the demo");
    });
  });
}
