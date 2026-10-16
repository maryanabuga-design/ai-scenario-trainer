import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

declare global {
  interface Window {
    __copied?: string;
  }
}

async function open(page: Page, path = "/materials/read/S1") {
  await page.addInitScript(
    ([p]) => {
      if (!localStorage.getItem("ast.profile.v1")) {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      }
      // the clipboard is a stub: it keeps what was copied
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            window.__copied = text;
          },
        },
      });
    },
    [profile],
  );
  await page.goto(path);
  await expect(page.locator("[data-reading-body] [data-block]").first()).toBeVisible();
}

/** Selects text from an offset of one block to an offset of another (or the same) block. */
async function select(page: Page, from: [number, number], to: [number, number] = from) {
  await page.evaluate(
    ([a, b]) => {
      const locate = (block: number, offset: number): [Node, number] => {
        const element = document.querySelector(`[data-reading-body] [data-block="${block}"]`)!;
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let left = offset;
        let node = walker.nextNode();
        while (node) {
          const length = node.textContent!.length;
          if (left <= length) return [node, left];
          left -= length;
          node = walker.nextNode();
        }
        return [element, element.childNodes.length];
      };
      const range = document.createRange();
      const [startNode, startOffset] = locate(a[0], a[1]);
      const [endNode, endOffset] = locate(b[0], b[1]);
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    },
    [from, to] as const,
  );
}

const toolbar = (page: Page) => page.getByRole("toolbar", { name: "Text actions" });
const marks = (page: Page) => page.locator("[data-reading-body] mark");
const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe("highlights in the reading screen", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("selecting text shows exactly Highlight and Copy, and no Ask AI", async ({ page }) => {
    await open(page);
    await expect(toolbar(page)).toHaveCount(0);
    await select(page, [0, 6], [0, 17]);
    await expect(toolbar(page)).toBeVisible();
    await expect(toolbar(page).getByRole("button")).toHaveText(["Highlight", "Copy"]);
    await expect(page.getByRole("button", { name: "Ask AI" })).toHaveCount(0);
  });

  test("a selection of one character shows no toolbar", async ({ page }) => {
    await open(page);
    await select(page, [0, 6], [0, 7]);
    await expect(toolbar(page)).toHaveCount(0);
  });

  test("Highlight paints the text, clears the selection and survives a reload", async ({
    page,
  }) => {
    await open(page);
    await select(page, [0, 6], [0, 17]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await expect(marks(page)).toHaveCount(1);
    await expect(marks(page)).toHaveText("every alarm");
    await expect(toolbar(page)).toHaveCount(0);
    expect(await page.evaluate(() => window.getSelection()!.isCollapsed)).toBe(true);
    // the text did not change
    await expect(page.locator('[data-reading-body] [data-block="0"]')).toHaveText(
      "Treat every alarm as real until it is officially confirmed otherwise.",
    );
    const stored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ast.highlights.v1")!),
    );
    expect(stored.schema).toBe(6);
    expect(stored.value.S1).toHaveLength(1);
    expect(stored.value.S1[0]).toMatchObject({ block: 0, start: 6, end: 17, quote: "every alarm" });
    await page.reload();
    await expect(marks(page)).toHaveText("every alarm");
    // the marker colour
    const background = await marks(page)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(background).toBe("rgb(255, 233, 160)");
  });

  test("tapping a highlight shows Unhighlight and Copy; Unhighlight removes only that one", async ({
    page,
  }) => {
    await open(page);
    await select(page, [0, 6], [0, 17]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await select(page, [1, 0], [1, 30]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await expect(marks(page)).toHaveCount(2);
    await marks(page).first().click();
    await expect(toolbar(page).getByRole("button")).toHaveText(["Unhighlight", "Copy"]);
    await toolbar(page).getByRole("button", { name: "Unhighlight" }).click();
    await expect(marks(page)).toHaveCount(1);
    await expect(toolbar(page)).toHaveCount(0);
    await expect(marks(page)).not.toHaveText("every alarm");
    // a tap elsewhere closes the toolbar of a highlight
    await marks(page).first().click();
    await expect(toolbar(page)).toBeVisible();
    await page.getByRole("heading", { level: 1 }).click();
    await expect(toolbar(page)).toHaveCount(0);
  });

  test("a selection across paragraphs makes one highlight in each", async ({ page }) => {
    await open(page);
    await select(page, [0, 30], [2, 12]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    const ids = await marks(page).evaluateAll((list) => [
      ...new Set(list.map((el) => el.getAttribute("data-highlight"))),
    ]);
    expect(ids).toHaveLength(3);
    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem("ast.highlights.v1")!).value.S1,
    );
    expect(stored.map((h: { block: number }) => h.block)).toEqual([0, 1, 2]);
  });

  test("a selection that overlaps a highlight merges with it", async ({ page }) => {
    await open(page);
    await select(page, [0, 6], [0, 17]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await select(page, [0, 12], [0, 31]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    const stored = await page.evaluate(
      () => JSON.parse(localStorage.getItem("ast.highlights.v1")!).value.S1,
    );
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ start: 6, end: 31 });
    await expect(marks(page)).toHaveText("every alarm as real until");
  });

  test("a highlight inside bold text keeps the bold and the text", async ({ page }) => {
    await open(page, "/materials/read/F5");
    await select(page, [0, 0], [0, 20]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await expect(marks(page).first().locator("strong")).toHaveCount(1);
    await expect(page.locator('[data-reading-body] [data-block="0"]')).toContainText(
      "Depth and current. Moving water",
    );
  });

  test("a selection that starts in the title or ends outside the body is ignored", async ({
    page,
  }) => {
    await open(page);
    await page.evaluate(() => {
      const title = document.querySelector("h1")!.firstChild!;
      const paragraph = document
        .createTreeWalker(
          document.querySelector('[data-reading-body] [data-block="0"]')!,
          NodeFilter.SHOW_TEXT,
        )
        .nextNode()!;
      const range = document.createRange();
      range.setStart(title, 2);
      range.setEnd(paragraph, 10);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await page.waitForTimeout(300);
    await expect(toolbar(page)).toHaveCount(0);
    await page.evaluate(() => {
      const title = document.querySelector("h1")!.firstChild!;
      const range = document.createRange();
      range.setStart(title, 0);
      range.setEnd(title, 6);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      document.dispatchEvent(new Event("selectionchange"));
    });
    await page.waitForTimeout(300);
    await expect(toolbar(page)).toHaveCount(0);
  });

  test("Copy copies the text, says Copied and closes the toolbar", async ({ page }) => {
    await open(page);
    await select(page, [0, 6], [0, 17]);
    await toolbar(page).getByRole("button", { name: "Copy" }).click();
    await expect(toolbar(page).getByRole("button", { name: "Copied" })).toBeVisible();
    expect(await page.evaluate(() => window.__copied)).toBe("every alarm");
    await expect(toolbar(page)).toHaveCount(0, { timeout: 4000 });
    // copying a highlight copies its text
    await select(page, [0, 6], [0, 17]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await marks(page).first().click();
    await toolbar(page).getByRole("button", { name: "Copy" }).click();
    expect(await page.evaluate(() => window.__copied)).toBe("every alarm");
  });

  test("the toolbar fits between the gutters, on one line, without covering the text, inside the screen", async ({
    page,
  }) => {
    await open(page);
    await select(page, [0, 6], [0, 17]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await marks(page).first().click();
    await expect(toolbar(page)).toBeVisible();
    await page.waitForTimeout(250);
    const bar = (await toolbar(page).boundingBox())!;
    expect(bar.x).toBeGreaterThanOrEqual(16);
    expect(bar.x + bar.width).toBeLessThanOrEqual(344);
    expect(bar.height).toBe(40);
    for (const button of await toolbar(page).getByRole("button").all()) {
      const box = (await button.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBe(40);
    }
    const mark = (await marks(page).first().boundingBox())!;
    expect(bar.y + bar.height <= mark.y || bar.y >= mark.y + mark.height).toBe(true);
    // the reading screen has no bottom navigation; the toolbar stays inside the screen
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    expect(bar.y).toBeGreaterThanOrEqual(0);
    expect(bar.y + bar.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await noSidewaysScroll(page)).toBe(true);
    // the page keeps its gutters
    const gutters = await page
      .locator("main")
      .evaluate((main) => [
        getComputedStyle(main).paddingLeft,
        getComputedStyle(main).paddingRight,
      ]);
    expect(gutters).toEqual(["16px", "16px"]);
  });

  test("a tip shows once under the meta line and goes after the first highlight", async ({
    page,
  }) => {
    await open(page);
    const tip = page.getByRole("button", { name: "Tip: select text to highlight it." });
    await expect(tip).toBeVisible();
    await select(page, [0, 6], [0, 17]);
    await toolbar(page).getByRole("button", { name: "Highlight" }).click();
    await expect(tip).toHaveCount(0);
    await page.reload();
    await expect(tip).toHaveCount(0);
  });

  test("the tip goes when it is tapped, and stays gone on another topic", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Tip: select text to highlight it." }).click();
    await expect(page.getByText("Tip: select text to highlight it.")).toHaveCount(0);
    await page.goto("/materials/read/S2");
    await expect(page.getByText("Tip: select text to highlight it.")).toHaveCount(0);
  });

  test("broken saved highlights never break the page", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("ast.highlights.v1", "{not json");
    });
    await open(page);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(marks(page)).toHaveCount(0);
    await page.evaluate(() => {
      localStorage.setItem(
        "ast.highlights.v1",
        JSON.stringify({
          schema: 6,
          value: {
            S1: [{ id: "x", block: 0, start: 2, end: 5, quote: "gone", before: "", after: "" }, 5],
          },
        }),
      );
    });
    await page.reload();
    // the quote is not in the text, so the highlight is dropped silently
    await expect(marks(page)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
