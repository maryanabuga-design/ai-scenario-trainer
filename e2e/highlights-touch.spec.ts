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

test.describe("highlights with touch (tap, not click)", () => {
  test("a selection shows the toolbar, tapping Highlight marks it, tapping the mark removes it", async ({
    page,
  }, testInfo) => {
    test.skip(!testInfo.project.use.hasTouch, "touch projects only");
    await open(page);
    await select(page, [1, 3], [1, 40]);
    await expect(toolbar(page)).toBeVisible();
    // the toolbar is on screen, inside the viewport, and its buttons can be tapped (nothing covers them)
    const bar = (await toolbar(page).boundingBox())!;
    const view = page.viewportSize()!;
    expect(bar.x).toBeGreaterThanOrEqual(0);
    expect(bar.x + bar.width).toBeLessThanOrEqual(view.width);
    expect(bar.y).toBeGreaterThanOrEqual(0);
    expect(bar.y + bar.height).toBeLessThanOrEqual(view.height);
    const highlight = toolbar(page).getByRole("button", { name: "Highlight" });
    const centre = await highlight.boundingBox();
    const covered = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest("button")?.textContent,
      [centre!.x + centre!.width / 2, centre!.y + centre!.height / 2],
    );
    expect(covered).toBe("Highlight");
    await highlight.tap();
    await expect(marks(page).first()).toBeVisible();
    await expect(toolbar(page)).toHaveCount(0);
    // it is saved: a reload keeps it
    await page.reload();
    await expect(marks(page).first()).toBeVisible();
    // tapping the highlighted text shows Unhighlight, and tapping that removes it
    await marks(page).first().tap();
    await expect(toolbar(page).getByRole("button", { name: "Unhighlight" })).toBeVisible();
    await toolbar(page).getByRole("button", { name: "Unhighlight" }).tap();
    await expect(marks(page)).toHaveCount(0);
    await page.reload();
    await expect(marks(page)).toHaveCount(0);
  });
});
