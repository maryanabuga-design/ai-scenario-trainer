import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

type Q = { id: string; correctOptionId: string; options: { id: string }[] };
const quiz: Q[] = JSON.parse(readFileSync("content/quiz-bank.json", "utf8")).questions;
const twenty = quiz.slice(0, 20);
const wrongOf = (q: Q) => q.options.find((o) => o.id !== q.correctOptionId)!.id;

const profile = { direction: "building-evacuation", onboarded: true };
const PRIMARY = "rgb(63, 70, 56)";
const OLIVE_TINT = "rgb(224, 230, 214)";
const SAND_50 = "rgb(248, 245, 237)";
const SAND_200 = "rgb(228, 214, 188)";

/** A running exam on its last question with `right` of 20 answered correctly. */
function runningExam(right: number) {
  const now = Date.now();
  return {
    itemIds: twenty.map((q) => q.id),
    answers: twenty.map((q, i) => ({
      itemId: q.id,
      optionId: i < right ? q.correctOptionId : wrongOf(q),
    })),
    index: 19,
    startedAt: now - 5 * 60_000,
    endsAt: now + 15 * 60_000,
    finished: false,
  };
}

const ANA = {
  schema: 6,
  content: "seed",
  value: {
    accounts: [
      {
        name: "Ana Test",
        email: "ana@example.com",
        role: "student",
        createdAt: 1,
        onboardingDone: true,
      },
    ],
    session: { email: "ana@example.com" },
    pending: null,
  },
};

async function open(
  page: Page,
  path: string,
  exam: object | null = null,
  extra: Record<string, string> = {},
) {
  await page.addInitScript(
    ([p, e, more]) => {
      if (localStorage.getItem("ast.profile.v1")) return;
      localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      if (e) localStorage.setItem("ast.exam.v1", JSON.stringify({ schema: 6, value: e }));
      for (const [key, value] of Object.entries(more)) localStorage.setItem(key, value);
    },
    [profile, exam, extra] as const,
  );
  await page.goto(path);
}

const stored = (page: Page, key = "ast.certificates.v1") =>
  page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw
      ? (JSON.parse(raw).value as {
          id: string;
          correct: number;
          total: number;
          accountId: string;
          examTitle: string;
        }[])
      : [];
  }, key);

const bg = (loc: ReturnType<Page["locator"]>) =>
  loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** Finishes the seeded exam and lands on Results. */
async function finishExam(page: Page, right: number) {
  await open(page, "/exam/session", runningExam(right));
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(page).toHaveURL(/\/exam\/results$/);
}

for (const width of [360, 430]) {
  test.describe(`Certificates at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("a passed exam creates ONE certificate and Results shows the card with View certificate", async ({
      page,
    }) => {
      await finishExam(page, 17);
      const card = page.locator("[data-certificate-card]");
      await expect(card).toBeVisible();
      await expect(card.getByRole("heading", { name: "Certificate earned" })).toBeVisible();
      const view = card.getByRole("link", { name: "View certificate" });
      expect(await bg(view)).toBe(OLIVE_TINT);
      expect((await view.boundingBox())!.height).toBe(52);
      const list = await stored(page);
      expect(list).toHaveLength(1);
      expect(list[0]).toMatchObject({ correct: 17, total: 20, accountId: "maryana@example.com" });
      expect(list[0].id).toMatch(/^QT-\d{4}-0001$/);
      // reloading Results must not create another one
      await page.reload();
      expect(await stored(page)).toHaveLength(1);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("a failed exam creates none and shows no card", async ({ page }) => {
      await finishExam(page, 12);
      await expect(page.getByRole("heading", { name: "Not passed yet" })).toBeVisible();
      await expect(page.locator("[data-certificate-card]")).toHaveCount(0);
      expect(await stored(page)).toHaveLength(0);
      await page.goto("/profile/certificates");
      await expect(page.getByText("Pass an exam to earn a certificate.")).toBeVisible();
      await expect(page.locator("[data-certificate-row]")).toHaveCount(0);
    });

    test("the certificate shows the name and the numbers, in a light card with Save as PDF and Share", async ({
      page,
    }) => {
      await finishExam(page, 17);
      await page.getByRole("link", { name: "View certificate" }).click();
      await expect(page).toHaveURL(/\/profile\/certificates\/QT-\d{4}-0001$/);
      const cert = page.locator("[data-certificate]");
      await expect(cert).toContainText("Training completion certificate");
      await expect(page.locator("[data-certificate-name]")).toHaveText("Maryana");
      await expect(cert).toContainText("has passed");
      await expect(cert).toContainText("Evacuation basics exam");
      await expect(page.locator("[data-certificate-result]")).toHaveText("17 of 20 correct");
      await expect(page.locator("[data-certificate-id]")).toHaveText(/^QT-\d{4}-0001$/);
      await expect(page.locator("[data-certificate-date]")).toHaveText(/^\d{1,2} \w{3} \d{4}$/);
      await expect(cert).toContainText("Prototype certificate, not an official document.");
      // tokens: sand-50 fill, 1px sand-200 border, generous padding, inside the gutters
      expect(await bg(cert)).toBe(SAND_50);
      const look = await cert.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.borderTopWidth, css.borderTopColor, css.paddingTop, css.borderTopLeftRadius];
      });
      expect(look[0]).toBe("1px");
      expect(look[1]).toBe(SAND_200);
      expect(parseFloat(look[2])).toBeGreaterThanOrEqual(32);
      const box = (await cert.boundingBox())!;
      expect(box.x).toBe(16);
      expect(box.x + box.width).toBe(width - 16);
      const save = page.getByRole("button", { name: "Save as PDF" });
      const share = page.getByRole("button", { name: "Share" });
      expect(await bg(save)).toBe(PRIMARY);
      expect(await bg(share)).toBe(OLIVE_TINT);
      for (const b of [save, share]) expect((await b.boundingBox())!.height).toBe(52);
      expect(await noSidewaysScroll(page)).toBe(true);
      await expect(page.getByRole("button", { name: "Back" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    });

    test("the print style shows only the card (no navigation, band or buttons)", async ({
      page,
    }) => {
      await finishExam(page, 17);
      await page.getByRole("link", { name: "View certificate" }).click();
      await expect(page.locator("[data-certificate]")).toBeVisible();
      await page.emulateMedia({ media: "print" });
      await expect(page.locator("[data-certificate]")).toBeVisible();
      await expect(page.getByRole("button", { name: "Save as PDF" })).toBeHidden();
      await expect(page.getByRole("button", { name: "Share" })).toBeHidden();
      await expect(page.locator("[data-page-header-band]")).toBeHidden();
      // everything else on the page is not drawn
      const visibleOutside = await page.evaluate(() => {
        const card = document.querySelector("[data-certificate]")!;
        return [...document.querySelectorAll("body *")].filter((el) => {
          if (card.contains(el) || el.contains(card)) return false;
          const css = getComputedStyle(el);
          return (
            css.visibility === "visible" &&
            css.display !== "none" &&
            el.children.length === 0 &&
            (el.textContent ?? "").trim() !== ""
          );
        }).length;
      });
      expect(visibleOutside).toBe(0);
    });

    test("Share copies the address with a confirmation when the browser cannot share", async ({
      page,
    }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: async (text: string) =>
              ((window as unknown as { __copied: string }).__copied = text),
          },
        });
      });
      await finishExam(page, 17);
      await page.getByRole("link", { name: "View certificate" }).click();
      await page.getByRole("button", { name: "Share" }).click();
      await expect(page.getByRole("status").filter({ hasText: "Link copied" })).toBeVisible();
      const copied = await page.evaluate(
        () => (window as unknown as { __copied: string }).__copied,
      );
      expect(copied).toMatch(/\/profile\/certificates\/QT-\d{4}-0001$/);
    });

    test("Share uses the Web Share API when there is one", async ({ page }) => {
      await page.addInitScript(() => {
        (navigator as unknown as { share: (data: object) => Promise<void> }).share = async (
          data,
        ) => {
          (window as unknown as { __shared: object }).__shared = data;
        };
      });
      await finishExam(page, 17);
      await page.getByRole("link", { name: "View certificate" }).click();
      await page.getByRole("button", { name: "Share" }).click();
      await expect
        .poll(() =>
          page.evaluate(() => (window as unknown as { __shared?: { url: string } }).__shared?.url),
        )
        .toMatch(/\/profile\/certificates\/QT-/);
    });

    test("Profile has the Certificates row with the count; the list has 72px rows and survives a reload", async ({
      page,
    }) => {
      await finishExam(page, 18);
      await page.goto("/profile");
      const row = page.locator("[data-certificates-row]");
      await expect(row).toBeVisible();
      expect((await row.boundingBox())!.height).toBe(56);
      expect(await bg(row)).toBe("rgb(255, 255, 255)");
      await expect(page.locator("[data-certificates-count]")).toHaveText("1");
      const colour = await page
        .locator("[data-certificates-count]")
        .evaluate((el) => getComputedStyle(el).color);
      expect(colour).not.toBe("rgb(0, 0, 0)");
      await row.click();
      await expect(page).toHaveURL(/\/profile\/certificates$/);
      const item = page.locator("[data-certificate-row]");
      await expect(item).toHaveCount(1);
      expect((await item.boundingBox())!.height).toBe(72);
      await expect(item).toContainText("Evacuation basics exam");
      await page.reload();
      await expect(page.locator("[data-certificate-row]")).toHaveCount(1);
      await item.click();
      await expect(page.locator("[data-certificate-result]")).toHaveText("18 of 20 correct");
    });

    test("Reset progress keeps the certificates", async ({ page }) => {
      await finishExam(page, 17);
      await page.goto("/profile");
      await page.getByRole("button", { name: "Reset progress" }).first().click();
      await page.locator("dialog[open]").getByRole("button", { name: "Reset progress" }).click();
      await expect(page.getByText(/Progress reset/)).toBeVisible();
      expect(await stored(page)).toHaveLength(1);
      await expect(page.locator("[data-certificates-count]")).toHaveText("1");
    });

    test("Delete account removes the certificates of that account", async ({ page }) => {
      const suffix = ":ana@example.com";
      await page.addInitScript(
        ([auth, p, e, sfx]) => {
          // seeded once per tab, so signing out and deleting is not undone by the next page load
          if (sessionStorage.getItem("seeded")) return;
          sessionStorage.setItem("seeded", "1");
          localStorage.setItem("ast.auth.v1", auth);
          localStorage.setItem("ast.profile.v1" + sfx, p);
          localStorage.setItem("ast.exam.v1" + sfx, e);
        },
        [
          JSON.stringify(ANA),
          JSON.stringify(profile),
          JSON.stringify({ schema: 6, value: runningExam(17) }),
          suffix,
        ] as const,
      );
      await page.goto("/exam/session");
      await page.getByRole("button", { name: "Finish", exact: true }).click();
      await expect(page).toHaveURL(/\/exam\/results$/);
      expect(await stored(page, "ast.certificates.v1" + suffix)).toHaveLength(1);
      await page.goto("/profile");
      await page.locator("[data-delete-account]").click();
      await page
        .locator("dialog[open]")
        .getByRole("button", { name: "Delete", exact: true })
        .click();
      await expect(page).toHaveURL(/\/welcome$/);
      const keys = await page.evaluate(() =>
        Object.keys(localStorage).filter((k) => k.includes("certificates")),
      );
      expect(keys).toEqual([]);
    });

    test("an instructor has no Certificates row", async ({ page }) => {
      await open(page, "/profile", null, {
        "ast.auth.v1": JSON.stringify({
          ...ANA,
          value: {
            ...ANA.value,
            accounts: [{ ...ANA.value.accounts[0], role: "instructor" }],
          },
        }),
      });
      await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
      await expect(page.locator("[data-certificates-row]")).toHaveCount(0);
    });

    test("no external network request", async ({ page }) => {
      const requests: string[] = [];
      page.on("request", (request) => {
        const url = request.url();
        if (!url.startsWith("data:") && !url.startsWith("blob:")) requests.push(url);
      });
      await finishExam(page, 17);
      await page.getByRole("link", { name: "View certificate" }).click();
      await expect(page.locator("[data-certificate]")).toBeVisible();
      expect(requests.filter((url) => !url.startsWith("http://localhost:3100"))).toEqual([]);
    });
  });
}
