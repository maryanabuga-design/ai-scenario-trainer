import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/** The page side gutter in pixels (`--gutter`, 1rem). */
const GUTTER = 16;
const profile = { direction: "building-evacuation", onboarded: true };

const wrongAnswers = [
  { itemId: "q-scn-s01-001", optionId: "a" },
  { itemId: "s2", optionId: "a" },
  { itemId: "s4", optionId: "a" },
];
const history = [
  {
    kind: "scenario",
    itemIds: wrongAnswers.map((answer) => answer.itemId),
    answers: wrongAnswers,
    finishedAt: Date.now(),
  },
];
const running = {
  kind: "scenario",
  itemIds: ["q-scn-s01-001", "q-scn-s01-002", "q-scn-s01-003"],
  answers: [{ itemId: "q-scn-s01-001", optionId: "b" }],
  index: 0,
  finished: false,
};
const finished = { ...running, answers: wrongAnswers.slice(0, 1), finished: true, finishedAt: 1 };

/** Every main screen with the saved data that makes it show its content. */
const screens: { name: string; path: string; session?: object; saved?: string[] }[] = [
  { name: "Home", path: "/" },
  { name: "Training", path: "/training" },
  { name: "Weak topics", path: "/weak-topics" },
  { name: "Mini-quiz", path: "/mini-quiz?from=training" },
  { name: "Exam intro", path: "/exam" },
  { name: "Question with options", path: "/session", session: running },
  { name: "Results", path: "/session/results", session: finished },
  { name: "Materials", path: "/materials" },
  { name: "Steps", path: "/checklists" },
  { name: "Profile", path: "/profile" },
  { name: "Saved questions", path: "/saved", saved: ["q-scn-s01-001", "s2"] },
  { name: "Progress", path: "/progress" },
];

/**
 * Looks at everything visible on the page: the text, and every box with a fill or a border. Returns
 * what comes closer than the gutter to the left or right edge. Elements inside a `data-full-bleed`
 * wrapper (the scrollers and the background of the bottom bar) are left out.
 */
async function nearTheEdge(page: Page) {
  return page.evaluate((gutter) => {
    const width = document.documentElement.clientWidth;
    const found: string[] = [];
    const scope = [...document.querySelectorAll("main, nav[aria-label=Main], [data-full-bleed]")];
    const visibleRoots = scope.filter((root) => {
      const box = root.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && getComputedStyle(root).display !== "none";
    });
    const inside = new Set<Element>();
    for (const root of visibleRoots) {
      if (root.matches("[data-full-bleed]")) {
        // the content of the bottom bar must still respect the gutter; scrollers are exempt
        if (root.matches("ol, [role=group]")) continue;
        for (const child of root.querySelectorAll("*")) {
          // a wrapper marked full-bleed is exempt itself; its own content is added by its own pass
          if (child.matches("[data-full-bleed]")) continue;
          if (!child.closest("ol[data-full-bleed], [role=group][data-full-bleed]"))
            inside.add(child);
        }
        continue;
      }
      inside.add(root);
      for (const child of root.querySelectorAll("*")) inside.add(child);
    }
    const hidden = (element: Element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return (
        style.display === "none" ||
        style.visibility === "hidden" ||
        box.width === 0 ||
        box.height === 0 ||
        element.closest("[hidden], [aria-hidden=true][data-media3d], dialog:not([open])") !==
          null ||
        (style.position === "absolute" && box.width <= 1 && box.height <= 1) ||
        element.classList.contains("sr-only") ||
        element.closest(".sr-only") !== null
      );
    };
    const check = (label: string, left: number, right: number) => {
      if (left < gutter - 0.5 || right > width - gutter + 0.5) {
        found.push(`${label}: ${Math.round(left)}..${Math.round(right)} of ${width}`);
      }
    };
    for (const element of inside) {
      if (hidden(element)) continue;
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      const paints =
        style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
        parseFloat(style.borderTopWidth) > 0 ||
        parseFloat(style.borderLeftWidth) > 0;
      // an element that only fills the full width of the bottom bar is its background
      const barBackground = element.matches("[data-full-bleed] > *") && box.width >= width - 1;
      if (paints && !barBackground && !element.matches("main, nav")) {
        check(
          `<${element.tagName.toLowerCase()} class="${element.className.toString().slice(0, 60)}">`,
          box.left,
          box.right,
        );
      }
      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0)
          check(`text "${node.textContent.trim().slice(0, 30)}"`, rect.left, rect.right);
      }
    }
    // the page never scrolls sideways
    if (document.documentElement.scrollWidth > width)
      found.push(`horizontal scroll: ${document.documentElement.scrollWidth} > ${width}`);
    return found;
  }, GUTTER);
}

for (const width of [360, 430]) {
  test.describe(`page layout at ${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });
    test.beforeEach(({ browserName }, testInfo) => {
      // The layout is checked once, in Chromium.
      test.skip(
        browserName !== "chromium" || testInfo.project.name.includes("WebKit"),
        "checked in Chromium only",
      );
    });

    for (const screen of screens) {
      test(`${screen.name} keeps the side gutter and does not scroll sideways`, async ({
        page,
      }) => {
        await page.addInitScript(
          ([p, h, s, saved]) => {
            if (localStorage.getItem("ast.profile.v1")) return;
            localStorage.setItem("ast.profile.v1", JSON.stringify(p));
            localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
            if (s) localStorage.setItem("ast.session.v1", JSON.stringify({ schema: 6, value: s }));
            if (saved)
              localStorage.setItem("ast.saved.v1", JSON.stringify({ schema: 6, value: saved }));
          },
          [profile, history, screen.session ?? null, screen.saved ?? null],
        );
        await page.goto(screen.path);
        await expect(page.locator("main:visible").first()).toBeVisible();
        await page.waitForTimeout(400);
        // the page padding itself is the gutter, never zero
        const padding = await page
          .locator("main:visible")
          .first()
          .evaluate((main) => [
            getComputedStyle(main).paddingLeft,
            getComputedStyle(main).paddingRight,
          ]);
        expect(padding).toEqual([`${GUTTER}px`, `${GUTTER}px`]);
        expect(await nearTheEdge(page)).toEqual([]);
      });
    }

    test("a selectable row has the list-card radius and the gutter as padding", async ({
      page,
    }) => {
      await page.addInitScript(
        ([p, h]) => {
          if (localStorage.getItem("ast.profile.v1")) return;
          localStorage.setItem("ast.profile.v1", JSON.stringify(p));
          localStorage.setItem("ast.history.v1", JSON.stringify({ schema: 6, value: h }));
        },
        [profile, history],
      );
      await page.goto("/weak-topics");
      const row = page.locator("fieldset label:visible").first();
      await expect(row).toBeVisible();
      const style = await row.evaluate((element) => {
        const css = getComputedStyle(element);
        return {
          radius: css.borderTopLeftRadius,
          padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
          border: css.borderTopWidth,
          borderColor: css.borderTopColor,
        };
      });
      expect(style.radius).toBe("24px");
      expect(style.padding).toEqual(["16px", "16px", "16px", "16px"]);
      expect(style.border).toBe("1px");
      expect(style.borderColor).toBe("rgb(228, 223, 213)");
      const box = await row.boundingBox();
      expect(box!.x).toBeGreaterThanOrEqual(GUTTER);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width - GUTTER);
      // the sticky bottom button has the same side gutter
      const button = page.getByRole("button", { name: /Repeat selected/ });
      const buttonBox = await button.boundingBox();
      expect(buttonBox!.x).toBeGreaterThanOrEqual(GUTTER);
      expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(width - GUTTER);
    });
  });
}
