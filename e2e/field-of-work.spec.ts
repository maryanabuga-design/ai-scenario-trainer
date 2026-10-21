import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { emptyBrowser } from "./auth-seed";

const CODE = "482913";
const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const CARD = "rgb(255, 255, 255)";
const SAND_200 = "rgb(228, 214, 188)";
const SAND_900 = "rgb(77, 63, 45)";
const MUTED = "rgb(92, 90, 85)";
const DISCLAIMER = "Prototype answer: a prepared example, not a live AI. It may be inaccurate.";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const aiCards = (page: Page) => page.locator('[data-message="ai"]');
const account = (page: Page, email: string) =>
  page.evaluate((e) => {
    const raw = localStorage.getItem("ast.auth.v1");
    const state = raw ? JSON.parse(raw).value : null;
    return state?.accounts?.find((a: { email: string }) => a.email === e) ?? null;
  }, email);

async function signUp(page: Page, name: string, email: string, instructor = false) {
  await page.goto("/welcome");
  await page.getByRole("link", { name: "Create account" }).click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  if (instructor) await page.getByText("Instructor", { exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/verify$/);
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
}

/** A new student at the Field of work step. */
async function atStep(page: Page, email = "ana@example.com") {
  await signUp(page, "Ana Test", email);
  await expect(page).toHaveURL(/\/field-of-work$/);
}

async function finish(page: Page) {
  await expect(page).toHaveURL(/\/onboarding$/);
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
}

const pick = (page: Page, label: string) => page.getByText(label, { exact: true }).click();

/** Sets the field through the picker of Profile. */
async function setField(page: Page, label: string) {
  await page.goto("/profile/field");
  await pick(page, label);
  await expect(page.locator("[data-field]").first()).toBeVisible();
}

for (const width of [360, 430]) {
  test.describe(`Field of work at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    test("a new student sees the step after Verify: layout, Continue is disabled until a choice, then the introduction", async ({
      page,
    }) => {
      await atStep(page);
      await expect(
        page.getByRole("heading", { name: "Tell us about your work", level: 1 }),
      ).toBeVisible();
      await expect(
        page.getByText(
          "We use this to tune examples in Ask AI. You can change it later in Profile.",
        ),
      ).toBeVisible();
      // no picture, no Back, no navigation
      await expect(page.locator("main img, main [data-picture-frame]")).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Back/ })).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
      // five rows of 72px, none chosen, in the page gutters
      const rows = page.locator("fieldset[aria-labelledby=field-title] label");
      await expect(rows).toHaveCount(5);
      for (const row of await rows.all()) {
        const box = (await row.boundingBox())!;
        expect([box.height, box.x, box.width]).toEqual([72, 16, width - 32]);
        expect(await bg(row)).toBe(CARD);
      }
      await expect(page.locator("input[name=field-of-work]:checked")).toHaveCount(0);
      for (const label of [
        "Rescue and emergency services",
        "Paramedic or medical",
        "Military",
        "Civil protection or volunteer",
        "Other",
      ]) {
        await expect(page.getByText(label, { exact: true })).toBeVisible();
      }
      const note = page.locator("[data-field-note]");
      await expect(note).toHaveText("All content in this app is educational and non-combat.");
      expect(await note.evaluate((el) => getComputedStyle(el).color)).toBe(MUTED);
      expect(await note.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
      // the icons: decorative, in 40px sand-200 circles with a 24px sand-900 icon, a 12px gap before the text
      for (const field of ["rescue", "paramedic", "military", "civil", "other"]) {
        const circle = page.locator(`[data-field-icon=${field}]`);
        const cb = (await circle.boundingBox())!;
        expect([cb.width, cb.height]).toEqual([40, 40]);
        expect(await bg(circle)).toBe(SAND_200);
        expect(await circle.evaluate((el) => getComputedStyle(el).color)).toBe(SAND_900);
        expect(await circle.evaluate((el) => getComputedStyle(el).borderTopLeftRadius)).not.toBe(
          "0px",
        );
        await expect(circle).toHaveAttribute("aria-hidden", "true");
        const icon = (await circle.locator("svg").boundingBox())!;
        expect([icon.width, icon.height]).toEqual([24, 24]);
        const text = (await page.locator(`[data-field=${field}]`).boundingBox())!;
        expect(Math.round(text.x - (cb.x + cb.width))).toBe(12);
      }
      // the row text stays the accessible name (the icon is not part of it)
      await expect(page.getByRole("radio", { name: "Military" })).toBeAttached();
      // Skip: the tertiary action at the top right, like the onboarding's
      const skip = page.getByRole("button", { name: "Skip", exact: true });
      const sb = (await skip.boundingBox())!;
      expect(sb.height).toBeGreaterThanOrEqual(44);
      expect(sb.x + sb.width).toBeGreaterThan(width - 16 - 14);
      expect(sb.y).toBeLessThan(80);
      expect(await bg(skip)).toBe("rgba(0, 0, 0, 0)");
      expect(await skip.evaluate((el) => getComputedStyle(el).color)).toBe(PRIMARY);
      expect(
        await skip.locator("span").evaluate((el) => getComputedStyle(el).textDecorationLine),
      ).toBe("underline");
      // the pinned bottom area: only the Primary Continue, disabled until a choice
      await expect(page.getByRole("button", { name: "Skip for now" })).toHaveCount(0);
      const cont = page.getByRole("button", { name: "Continue" });
      await expect(cont).toBeDisabled();
      const c = (await cont.boundingBox())!;
      expect([c.height, c.x, c.width]).toEqual([52, 16, width - 32]);
      expect(c.y + c.height).toBeLessThanOrEqual(800 - 16 + 1);
      const bottomButtons = await page
        .locator("[data-full-bleed] button:visible")
        .evaluateAll((els) => els.map((el) => el.textContent));
      expect(bottomButtons).toEqual(["Continue"]);
      expect(await noSidewaysScroll(page)).toBe(true);
      // a choice enables Continue (the primary fill), which opens the introduction
      await pick(page, "Paramedic or medical");
      await expect(cont).toBeEnabled();
      expect(await bg(cont)).toBe(PRIMARY);
      await cont.click();
      await expect(page).toHaveURL(/\/onboarding$/);
      expect((await account(page, "ana@example.com")).field).toBe("paramedic");
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await expect(page).toHaveURL(/\/$/);
      // it persists after a reload and the step is not shown again
      await page.reload();
      expect((await account(page, "ana@example.com")).field).toBe("paramedic");
      await page.goto("/field-of-work");
      await expect(page).toHaveURL(/\/$/);
    });

    test("Skip for now stores nothing and continues; Profile says Not set", async ({ page }) => {
      await atStep(page);
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await finish(page);
      expect((await account(page, "ana@example.com")).field).toBeNull();
      await page.goto("/profile");
      await expect(page.locator("[data-field-value]")).toHaveText("Not set");
    });

    test("leaving the step once means it is not shown again before the introduction", async ({
      page,
    }) => {
      await atStep(page);
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await expect(page).toHaveURL(/\/onboarding$/);
      await page.goto("/field-of-work");
      await expect(page).toHaveURL(/\/onboarding$/);
    });

    test("an instructor does not see the step and has no Field of work row", async ({ page }) => {
      await signUp(page, "Ines Test", "ines@example.com", true);
      await expect(page).toHaveURL(/\/onboarding$/);
      await page.goto("/field-of-work");
      await expect(page).toHaveURL(/\/onboarding$/);
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await expect(page).toHaveURL(/\/instructor$/);
      await page.goto("/profile");
      await expect(page.locator("[data-field-row]")).toHaveCount(0);
      await page.goto("/profile/field");
      await expect(page).toHaveURL(/\/instructor$/);
    });

    test("Profile: the row below Direction, the picker applies at once, Clear selection, and the Backs", async ({
      page,
    }) => {
      await atStep(page);
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await finish(page);
      await page.goto("/profile");
      const row = page.locator("[data-field-row]");
      const box = (await row.boundingBox())!;
      expect([box.height, box.x, box.width]).toEqual([56, 16, width - 32]);
      expect(await bg(row)).toBe(CARD);
      await expect(row).toContainText("Field of work");
      await expect(row.locator("svg.lucide-chevron-right")).toHaveCount(1);
      const direction = (await page.getByText("Direction", { exact: true }).boundingBox())!;
      expect(box.y).toBeGreaterThan(direction.y);
      await row.click();
      await expect(page).toHaveURL(/\/profile\/field$/);
      await expect(page.getByRole("heading", { name: "Field of work", level: 1 })).toBeVisible();
      await expect(page.getByText("Used to tune examples in Ask AI.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Clear selection" })).toHaveCount(0);
      // the same icons in the same circles, and no Skip
      await expect(page.locator("[data-field-icon]:visible")).toHaveCount(5);
      expect(await bg(page.locator("[data-field-icon=rescue]:visible"))).toBe(SAND_200);
      expect(
        await page
          .locator("[data-field-icon=military]:visible")
          .evaluate((el) => getComputedStyle(el).color),
      ).toBe(SAND_900);
      await expect(page.getByRole("button", { name: "Skip", exact: true })).toHaveCount(0);
      await pick(page, "Military");
      await expect(page.locator("input[name=field-of-work]:checked")).toHaveCount(1);
      expect((await account(page, "ana@example.com")).field).toBe("military");
      const clear = page.getByRole("button", { name: "Clear selection" });
      expect(await bg(clear)).toBe(OLIVE_TINT);
      expect((await clear.boundingBox())!.height).toBe(52);
      for (const label of await page.locator("fieldset label:visible").all()) {
        expect((await label.boundingBox())!.height).toBe(72);
      }
      expect(await noSidewaysScroll(page)).toBe(true);
      await pick(page, "Other");
      expect((await account(page, "ana@example.com")).field).toBe("other");
      await page.getByRole("link", { name: "Back to Profile" }).click();
      await expect(page).toHaveURL(/\/profile$/);
      await expect(page.locator("[data-field-value]")).toHaveText("Other");
      await page.getByRole("link", { name: "Back to Home" }).click();
      await expect(page).toHaveURL(/\/$/);
      await page.goto("/profile/field");
      await clear.click();
      await expect(page.locator("input[name=field-of-work]:checked")).toHaveCount(0);
      await expect(clear).toHaveCount(0);
      expect((await account(page, "ana@example.com")).field).toBeNull();
    });

    test("Reset progress keeps the field; Restart demo clears it; Delete account removes it", async ({
      page,
    }) => {
      await atStep(page);
      await pick(page, "Rescue and emergency services");
      await page.getByRole("button", { name: "Continue" }).click();
      await finish(page);
      await page.goto("/profile");
      await expect(page.locator("[data-field-value]")).toHaveText("Rescue services");
      await page.getByRole("button", { name: "Reset progress" }).first().click();
      await page.locator("dialog[open]").getByRole("button", { name: "Reset progress" }).click();
      await expect(page.getByText(/Progress reset/)).toBeVisible();
      expect((await account(page, "ana@example.com")).field).toBe("rescue");
      await expect(page.locator("[data-field-value]")).toHaveText("Rescue services");
      // Delete account removes it with the account
      await page.locator("[data-delete-account]").click();
      await page.locator("dialog[open]").getByRole("button", { name: "Delete" }).click();
      await expect(page).toHaveURL(/\/welcome$/);
      expect(await account(page, "ana@example.com")).toBeNull();
      // Restart demo clears everything, the field included
      await signUp(page, "Bob Test", "bob@example.com");
      await pick(page, "Military");
      await page.getByRole("button", { name: "Continue" }).click();
      await finish(page);
      expect((await account(page, "bob@example.com")).field).toBe("military");
      await page.goto("/about");
      await page.getByRole("button", { name: "Restart demo" }).click();
      await page.getByRole("button", { name: "Restart", exact: true }).click();
      await expect(page).toHaveURL(/\/welcome$/);
      expect(await account(page, "bob@example.com")).toBeNull();
    });

    test("Ask AI: the tuned row, suggested questions and example lines follow the field; old threads keep their text", async ({
      page,
    }) => {
      const requests: string[] = [];
      page.on("request", (r) => {
        const url = r.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await atStep(page);
      await page.getByRole("button", { name: "Skip", exact: true }).click();
      await finish(page);
      // no field: the invitation, the general suggested questions
      await page.goto("/ask-ai");
      const tuned = page.locator("[data-tuned-row]");
      await expect(tuned).toContainText("Set your field to tune answers");
      const t = (await tuned.boundingBox())!;
      expect([t.height, t.x, t.width]).toEqual([44, 16, width - 32]);
      expect(await bg(tuned)).toBe(CARD);
      await expect(page.locator("[data-suggested]").first()).toContainText(
        "Why is every alarm treated as real?",
      );
      expect(await noSidewaysScroll(page)).toBe(true);
      // the row opens the picker and Back returns to Ask AI
      await tuned.click();
      await expect(page).toHaveURL(/\/profile\/field\?from=ask-ai$/);
      await page.getByRole("link", { name: "Back to Ask AI" }).click();
      await expect(page).toHaveURL(/\/ask-ai$/);
      // an old thread, made without a field
      await page.locator("[data-suggested]").first().click();
      await expect(aiCards(page)).toHaveCount(1);
      const oldText = await aiCards(page).first().innerText();
      expect(oldText).not.toContain("Example for");
      // rescue services
      await setField(page, "Rescue and emergency services");
      await page.goto("/ask-ai");
      await expect(page.locator("[data-tuned-row]")).toContainText(
        "Answers tuned for: Rescue services",
      );
      await expect(page.locator("[data-suggested]")).toHaveCount(4);
      await expect(page.locator("[data-suggested]").first()).toContainText(
        "How do I lead others out of a smoky corridor?",
      );
      await page.locator("[data-suggested]").first().click();
      await expect(aiCards(page)).toHaveCount(1);
      await expect(aiCards(page).first()).toContainText("Example for rescue services:");
      await page.getByRole("button", { name: "Give an example" }).click();
      await expect(aiCards(page)).toHaveCount(2);
      const rescue = await aiCards(page).nth(1).innerText();
      expect(rescue).toContain("Example for rescue services:");
      // civil protection gives another sentence for the same topic
      await setField(page, "Civil protection or volunteer");
      await page.goto("/ask-ai");
      await expect(page.locator("[data-tuned-row]")).toContainText(
        "Answers tuned for: Civil protection",
      );
      await page.locator("[data-suggested]").first().click();
      await expect(aiCards(page)).toHaveCount(1);
      await page.getByRole("button", { name: "Give an example" }).click();
      await expect(aiCards(page)).toHaveCount(2);
      const civil = await aiCards(page).nth(1).innerText();
      expect(civil).toContain("Example for civil protection:");
      expect(civil).not.toBe(rescue);
      // every AI message has the disclaimer under it
      await expect(page.locator("[data-disclaimer]")).toHaveCount(2);
      await expect(page.getByText(DISCLAIMER)).toHaveCount(2);
      // "Other" and no field use the general list again
      await setField(page, "Other");
      await page.goto("/ask-ai");
      await expect(page.locator("[data-suggested]").first()).toContainText(
        "Why is every alarm treated as real?",
      );
      // the thread made before any field kept its old text
      await page.locator("[data-thread]").last().click();
      await expect(aiCards(page).first()).toBeVisible();
      expect(await aiCards(page).first().innerText()).toBe(oldText);
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });

    test("a thread made from a review question adds the field's example line", async ({ page }) => {
      await atStep(page);
      await pick(page, "Paramedic or medical");
      await page.getByRole("button", { name: "Continue" }).click();
      await finish(page);
      // a finished session with one wrong answer, saved for this account
      await page.evaluate(() => {
        const ns = ":ana@example.com";
        const session = {
          kind: "quiz",
          itemIds: ["q-s3-3"],
          answers: [{ itemId: "q-s3-3", optionId: "zz" }],
          index: 0,
          finished: true,
        };
        localStorage.setItem(
          `ast.session.v1${ns}`,
          JSON.stringify({ schema: 6, content: "other", value: session }),
        );
      });
      await page.goto("/session/results/review/1");
      await page.locator("[data-ask-ai-row]").click();
      await expect(page).toHaveURL(/\/ask-ai\/q-/);
      await expect(aiCards(page).first()).toContainText("Example for paramedic:");
    });
  });
}
