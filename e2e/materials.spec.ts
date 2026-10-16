import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const profile = { direction: "building-evacuation", onboarded: true };

async function open(page: Page, path: string) {
  await page.addInitScript(
    ([p]) => {
      if (!localStorage.getItem("ast.profile.v1")) {
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
      }
    },
    [profile],
  );
  await page.goto(path);
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test.describe("Materials", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("lists every topic of both guides, grouped, with no Back button and the tab active", async ({
    page,
  }) => {
    await open(page, "/materials");
    await expect(page.getByRole("heading", { name: "Materials", level: 1 })).toBeVisible();
    await expect(
      page.getByText("Read the training guides, then practise what you read."),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Building Evacuation and Basic First Aid: Training Guide",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Flood Preparedness for Community Volunteers: Training Guide",
      }),
    ).toBeVisible();
    await expect(page.locator("main a[href^='/materials/read/']:visible")).toHaveCount(17);
    await expect(
      page.getByRole("link", { name: /^Responding to an alarm S1 · \d+ min read/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /^The dangers of floodwater F5 · \d+ min read/ }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Back/ })).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Materials" }),
    ).toHaveAttribute("aria-current", "page");
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("is a flat list: no cards, 1px dividers between rows and none after the last of a group", async ({
    page,
  }) => {
    await open(page, "/materials");
    const rows = page.locator("main li:visible", {
      has: page.locator("a[href^='/materials/read/']"),
    });
    await expect(rows).toHaveCount(17);
    const style = (index: number) =>
      rows.nth(index).evaluate((li) => {
        const link = li.querySelector("a")!;
        const tile = link.querySelector("span[aria-hidden]")!;
        const own = getComputedStyle(li);
        const inner = getComputedStyle(link);
        const box = tile.getBoundingClientRect();
        return {
          liBackground: own.backgroundColor,
          liRadius: own.borderTopLeftRadius,
          liShadow: own.boxShadow,
          liBorderBottom: own.borderBottomWidth,
          liBorderColor: own.borderBottomColor,
          liBorderTop: own.borderTopWidth,
          linkBackground: inner.backgroundColor,
          linkBorder: inner.borderTopWidth,
          linkRadius: inner.borderTopLeftRadius,
          linkShadow: inner.boxShadow,
          padding: [inner.paddingTop, inner.paddingBottom],
          tile: [box.width, box.height],
          tileRadius: getComputedStyle(tile).borderTopLeftRadius,
          tileBackground: getComputedStyle(tile).backgroundColor,
          width: li.getBoundingClientRect().width,
          left: li.getBoundingClientRect().left,
          height: link.getBoundingClientRect().height,
        };
      });
    for (const index of [0, 3, 9, 10, 16]) {
      const row = await style(index);
      // nothing around a row: it sits on the page
      expect(row.liBackground).toBe("rgba(0, 0, 0, 0)");
      expect(row.linkBackground).toBe("rgba(0, 0, 0, 0)");
      expect(row.liRadius).toBe("0px");
      expect(row.linkRadius).toBe("0px");
      expect(row.liShadow).toBe("none");
      expect(row.linkShadow).toBe("none");
      expect(row.linkBorder).toBe("0px");
      expect(row.liBorderTop).toBe("0px");
      // 16px above and below, at least 44px high
      expect(row.padding).toEqual(["16px", "16px"]);
      expect(row.height).toBeGreaterThanOrEqual(44);
      // a 44px rounded square in the olive tint
      expect(row.tile).toEqual([44, 44]);
      expect(row.tileRadius).toBe("12px");
      expect(row.tileBackground).toBe("rgb(224, 230, 214)");
      // the divider runs from the left gutter to the right gutter
      // (the app frame has a 1px side border, so the gutter measures 17px)
      expect(row.left).toBeGreaterThanOrEqual(16);
      expect(row.left).toBeLessThanOrEqual(17);
      expect(row.left * 2 + row.width).toBe(
        await page.evaluate(() => document.documentElement.clientWidth),
      );
    }
    // a divider after every row except the last of each group (S10 is the 10th, F7 the 17th)
    for (let index = 0; index < 17; index++) {
      const { liBorderBottom, liBorderColor } = await style(index);
      const last = index === 9 || index === 16;
      expect(liBorderBottom, `row ${index + 1}`).toBe(last ? "0px" : "1px");
      if (!last) expect(liBorderColor).toBe("rgb(228, 223, 213)");
    }
  });

  test("group headings are clear, with a count chip, and spaced 32px apart", async ({ page }) => {
    await open(page, "/materials");
    const headings = page.locator("main h2:visible");
    await expect(headings).toHaveCount(2);
    const look = (index: number) =>
      headings.nth(index).evaluate((h) => {
        const style = getComputedStyle(h);
        return {
          size: style.fontSize,
          weight: style.fontWeight,
          color: style.color,
          top: h.getBoundingClientRect().top,
          sectionTop: h.closest("section")!.getBoundingClientRect().top,
        };
      });
    const first = await look(0);
    expect(first).toMatchObject({ size: "18px", weight: "600", color: "rgb(26, 26, 26)" });
    await expect(page.getByText("10 topics", { exact: true })).toBeVisible();
    await expect(page.getByText("7 topics", { exact: true })).toBeVisible();
    // 12px between a heading and its first row; 32px between the groups
    const gaps = await page.evaluate(() => {
      const sections = [...document.querySelectorAll("main section")].filter(
        (s) => (s as HTMLElement).offsetParent !== null,
      );
      const rect = (el: Element) => el.getBoundingClientRect();
      const firstList = sections[0].querySelector("ul")!;
      const headingRow = sections[0].firstElementChild!;
      return {
        headingToList: Math.round(rect(firstList).top - rect(headingRow).bottom),
        betweenGroups: Math.round(rect(sections[1]).top - rect(sections[0]).bottom),
      };
    });
    expect(gaps).toEqual({ headingToList: 12, betweenGroups: 32 });
    // the subtitle is regular body text, clearly smaller than the group heading's weight
    const subtitle = await page
      .getByText("Read the training guides, then practise what you read.")
      .evaluate((p) => ({
        size: getComputedStyle(p).fontSize,
        weight: getComputedStyle(p).fontWeight,
      }));
    expect(subtitle).toEqual({ size: "16px", weight: "400" });
  });

  test("leaves room under the last row, before the bottom navigation", async ({ page }) => {
    await open(page, "/materials");
    const room = await page.evaluate(() => {
      const last = document.querySelector("a[href='/materials/read/F7']")!.getBoundingClientRect();
      return document.querySelector("main")!.getBoundingClientRect().bottom - last.bottom;
    });
    expect(room).toBeGreaterThanOrEqual(24);
  });

  test("opens the reading screen of S1 with its title, meta line, subsections and three actions", async ({
    page,
  }) => {
    await open(page, "/materials");
    await page.getByRole("link", { name: /^Responding to an alarm/ }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S1$/);
    await expect(
      page.getByRole("heading", { name: "Responding to an alarm", level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText(
        /^Building Evacuation and Basic First Aid: Training Guide · S1 · \d+ min read$/,
      ),
    ).toBeVisible();
    // the seven subsections are headings, and the topic heading is not repeated in the body
    await expect(page.locator("main h2:visible")).toHaveCount(7);
    await expect(page.getByRole("heading", { name: "Stairs, not elevators" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Responding to an alarm" })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Next: Checking the route" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Materials" }),
    ).toHaveAttribute("aria-current", "page");
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("Practise this topic opens Training at the topic", async ({ page }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("link", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/training\?mode=scenario&topic=S1$/);
    await expect(page.getByRole("heading", { name: "Training" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Scenario" })).toBeChecked();
    await expect(page.getByText("Responding to an alarm").first()).toBeInViewport();
    // a topic with no scenario parts opens in Quiz mode
    await open(page, "/materials/read/S3");
    await page.getByRole("link", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/training\?mode=quiz&topic=S3$/);
    await expect(page.getByRole("radio", { name: "Quiz" })).toBeChecked();
  });

  test("Steps for this topic opens the Steps, and a topic without steps has no such button", async ({
    page,
  }) => {
    await open(page, "/materials/read/S7");
    await page.getByRole("link", { name: "Steps for this topic" }).click();
    await expect(page).toHaveURL(/\/checklists\/severe-bleeding$/);
    await open(page, "/materials/read/S9");
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toBeVisible();
  });

  test("Next opens the next topic of the same guide, and Back returns to the Materials list", async ({
    page,
  }) => {
    await open(page, "/materials");
    await page.getByRole("link", { name: /^Responding to an alarm/ }).click();
    await page.getByRole("link", { name: "Next: Checking the route" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
    await expect(page.getByRole("heading", { name: "Checking the route", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S1$/);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials$/);
    await expect(page.getByRole("heading", { name: "Materials", level: 1 })).toBeVisible();
  });

  test("the last topic of a guide has no Next link", async ({ page }) => {
    await open(page, "/materials/read/S10");
    await expect(page.getByRole("link", { name: /^Next:/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toBeVisible();
    await open(page, "/materials/read/F7");
    await expect(page.getByRole("link", { name: /^Next:/ })).toHaveCount(0);
    await open(page, "/materials/read/F1");
    await expect(
      page.getByRole("link", { name: "Next: Prepare a plan and a grab bag" }),
    ).toBeVisible();
  });

  test("a flood topic reads from its guide: bold, lists, no Practise or Steps", async ({
    page,
  }) => {
    await open(page, "/materials/read/F5");
    await expect(
      page.getByRole("heading", { name: "The dangers of floodwater", level: 1 }),
    ).toBeVisible();
    await expect(page.locator("main strong", { hasText: "Depth and current." })).toBeVisible();
    await expect(page.locator("main li:visible")).toHaveCount(4);
    await expect(page.getByRole("link", { name: "Practise this topic" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Next: Getting help and helping others" }),
    ).toBeVisible();
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("reading changes no progress and no Today counter", async ({ page }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("link", { name: "Next: Checking the route" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
    const stored = await page.evaluate(() => ({
      history: localStorage.getItem("ast.history.v1"),
      session: localStorage.getItem("ast.session.v1"),
      parts: localStorage.getItem("ast.parts.v1"),
    }));
    expect(stored).toEqual({ history: null, session: null, parts: null });
    await page.goto("/");
    await expect(page.getByText("Today 0/5")).toBeVisible();
  });

  test("an unknown topic is not found, and the old contents screen is gone", async ({ page }) => {
    await page.goto("/materials/read/S99");
    await expect(page.getByText("could not be found")).toBeVisible();
    await open(page, "/materials/evacuation-guide");
    await expect(
      page.getByRole("heading", { name: "Responding to an alarm", level: 2 }),
    ).toHaveCount(0);
  });
});
