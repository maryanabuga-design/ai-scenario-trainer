import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { emptyBrowser } from "./auth-seed";

const CODE = "482913";

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const box = async (loc: ReturnType<Page["locator"]>) => (await loc.first().boundingBox())!;
const centreX = (b: { x: number; width: number }) => b.x + b.width / 2;

/**
 * `entry-group.webp` is added to the repository by the designer; until it is there the tests stand
 * in the profile picture for it, so the layout is checked either way.
 */
const standIn = readFileSync("public/images/entry/entry-profile.webp");
async function withGroupPicture(page: Page) {
  await page.route("**/images/entry/entry-group.webp", (route) =>
    route.fulfill({ contentType: "image/webp", body: standIn }),
  );
}

/** An invited student up to the Profile step. */
async function toProfile(page: Page) {
  await page.goto("/join/QT-A7K2");
  await page.getByLabel("Your email").fill("ana@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Digit 1 of 6").focus();
  await page.keyboard.type(CODE);
  await expect(page).toHaveURL(/\/set-up-profile$/);
}

type Screen = {
  name: string;
  open: (page: Page) => Promise<void>;
  picture: string;
  title: string;
  /** The text under the title, when it is outside the card. */
  subtitle?: string;
  /** The first element under the title block. */
  next: (page: Page) => ReturnType<Page["locator"]>;
  primary: string;
};

const screens: Screen[] = [
  {
    name: "Welcome back",
    open: (page) => page.goto("/sign-in").then(() => undefined),
    picture: "/images/entry/entry-signin.webp",
    title: "Welcome back",
    subtitle: "Enter your work email. We will send you a code.",
    next: (page) => page.locator("label", { hasText: "Work email" }),
    primary: "Continue",
  },
  {
    name: "Join a group",
    open: (page) => page.goto("/join").then(() => undefined),
    picture: "/images/entry/entry-group.webp",
    title: "Join a group",
    subtitle: "Enter the code your instructor gave you.",
    next: (page) => page.locator("label", { hasText: "Group code" }),
    primary: "Continue",
  },
  {
    name: "Your profile",
    open: toProfile,
    picture: "/images/entry/entry-profile.webp",
    title: "Your profile",
    subtitle: "Add your name so your instructor can recognise you.",
    next: (page) => page.locator("label", { hasText: "Your name" }),
    primary: "Continue",
  },
  {
    name: "Invitation",
    open: (page) => page.goto("/join/QT-A7K2").then(() => undefined),
    picture: "/images/entry/entry-group.webp",
    title: "Rescue team",
    next: (page) => page.locator("[data-invitation-card]"),
    primary: "Continue",
  },
];

for (const width of [360, 430]) {
  test.describe(`Onboarding-style entry at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 }, storageState: emptyBrowser });

    for (const screen of screens) {
      test(`${screen.name}: the picture is centred and 160px, the title and subtitle are centred, the form follows 24px lower with left-aligned labels`, async ({
        page,
      }) => {
        await withGroupPicture(page);
        await screen.open(page);
        const img = page.locator("[data-entry-picture]");
        await expect(img).toHaveAttribute("src", screen.picture);
        await expect(img).toHaveAttribute("alt", "");
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
          .toBeGreaterThan(0);
        const p = await box(img);
        expect([p.width, p.height]).toEqual([160, 160]);
        expect(Math.abs(centreX(p) - width / 2)).toBeLessThanOrEqual(1);
        // the title, 16px under the picture (the Invitation's title is inside its card)
        const heading = page.getByRole("heading", { level: 1 }).first();
        await expect(heading).toContainText(screen.title);
        const h = await box(heading);
        if (screen.subtitle) {
          expect(Math.round(h.y - (p.y + p.height))).toBe(16);
          expect(await heading.evaluate((el) => getComputedStyle(el).textAlign)).toBe("center");
          const sub = page.getByText(screen.subtitle);
          expect(await sub.evaluate((el) => getComputedStyle(el).textAlign)).toBe("center");
          const s = await box(sub);
          expect(Math.abs(centreX(h) - width / 2)).toBeLessThanOrEqual(1);
          expect(Math.abs(centreX(s) - width / 2)).toBeLessThanOrEqual(1);
          // the form is 24px under the subtitle
          const next = await box(screen.next(page));
          expect(Math.round(next.y - (s.y + s.height))).toBe(24);
          // labels left-aligned at the gutter, fields full width
          expect(Math.abs(next.x - 16)).toBeLessThanOrEqual(0.5);
          expect(await screen.next(page).evaluate((el) => getComputedStyle(el).textAlign)).not.toBe(
            "center",
          );
          const field = await box(page.locator("main input").first());
          expect(Math.abs(field.x - 16)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(width - (field.x + field.width) - 16)).toBeLessThanOrEqual(0.5);
        } else {
          // the Invitation: the card (title, role, inviter) is centred 16px under the picture
          const card = await box(screen.next(page));
          expect(Math.round(card.y - (p.y + p.height))).toBe(16);
          expect(Math.abs(centreX(card) - width / 2)).toBeLessThanOrEqual(1);
          expect(await heading.evaluate((el) => getComputedStyle(el).textAlign)).toBe("center");
        }
        expect(await noSidewaysScroll(page)).toBe(true);
      });
    }

    test("Welcome back keeps its top row: the back arrow at the left and 'Step 1 of 2' at the right", async ({
      page,
    }) => {
      await page.goto("/sign-in");
      const back = await box(page.getByRole("link", { name: "Back to Welcome" }));
      const step = await box(page.locator("[data-form-step]"));
      expect(back.x).toBeLessThan(width / 2);
      expect(step.x).toBeGreaterThan(width / 2);
      expect(back.y).toBeLessThan(80);
      expect(Math.abs(back.y + back.height / 2 - (step.y + step.height / 2))).toBeLessThanOrEqual(
        2,
      );
      const img = await box(page.locator("[data-entry-picture]"));
      expect(img.y).toBeGreaterThan(back.y + back.height);
    });

    test("a missing picture leaves no empty space on any of the four screens", async ({ page }) => {
      await page.route("**/images/entry/*.webp", (route) => route.abort());
      await page.goto("/sign-in");
      await expect(page.getByRole("heading", { name: "Welcome back", level: 1 })).toBeVisible();
      await expect(page.locator("[data-entry-picture]")).toHaveCount(0);
      const back = await box(page.getByRole("link", { name: "Back to Welcome" }));
      const title = await box(page.getByRole("heading", { name: "Welcome back", level: 1 }));
      expect(Math.round(title.y - (back.y + back.height))).toBe(24);
      await page.goto("/join");
      await expect(page.locator("[data-entry-picture]")).toHaveCount(0);
      expect((await box(page.getByRole("heading", { name: "Join a group" }))).y).toBeLessThan(80);
      await page.goto("/join/QT-A7K2");
      await expect(page.locator("[data-entry-picture]")).toHaveCount(0);
      expect((await box(page.locator("[data-invitation-card]"))).y).toBeLessThan(60);
      await toProfile(page);
      await expect(page.locator("[data-entry-picture]")).toHaveCount(0);
      expect((await box(page.getByRole("heading", { name: "Your profile" }))).y).toBeLessThan(80);
    });
  });

  for (const height of [640, 560]) {
    test.describe(`Onboarding-style entry on a short phone (${width} x ${height})`, () => {
      test.use({ viewport: { width, height }, storageState: emptyBrowser });

      for (const screen of screens) {
        test(`${screen.name}: the picture shrinks to ${height === 640 ? 120 : 96}px and the Primary stays in view`, async ({
          page,
        }) => {
          await withGroupPicture(page);
          await screen.open(page);
          const img = page.locator("[data-entry-picture]");
          await expect
            .poll(async () => (await img.boundingBox())?.width)
            .toBe(height === 640 ? 120 : 96);
          const primary = await box(page.getByRole("button", { name: screen.primary }));
          expect(primary.height).toBe(52);
          expect(primary.y).toBeGreaterThanOrEqual(0);
          expect(primary.y + primary.height).toBeLessThanOrEqual(height);
          expect(await noSidewaysScroll(page)).toBe(true);
          // nothing needs scrolling to reach the Primary
          expect(await page.evaluate(() => window.scrollY)).toBe(0);
        });
      }
    });
  }
}
