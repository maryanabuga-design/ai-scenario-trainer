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
    await expect(page.getByRole("button", { name: "Practise this topic" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toBeVisible();
    await expect(page.getByRole("link", { name: /^Next\s*Checking the route$/ })).toBeVisible();
    // the bottom navigation is not on a reading screen
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("Practise this topic starts the first scenario question of S1, not the Training list", async ({
    page,
  }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("button", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Training" })).toHaveCount(0);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.value.partId).toBe("scenario:S1:1");
    expect(saved.value.returnTo).toBe("/materials/read/S1");
  });

  test("a topic without scenario steps opens its quiz", async ({ page }) => {
    await open(page, "/materials/read/S3");
    await page.getByRole("button", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/session$/);
    await expect(page.getByText(/^Question 1 of \d+$/)).toBeVisible();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("ast.session.v1")!));
    expect(saved.value.partId).toBe("quiz:S3:1");
  });

  test("an unfinished session of the topic is resumed, with its answer and place", async ({
    page,
  }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("button", { name: "Practise this topic" }).click();
    await page
      .locator("label")
      .filter({ has: page.getByRole("radio") })
      .first()
      .click();
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText(/^Step 2 of \d+$/)).toBeVisible();
    await page.goto("/materials/read/S1");
    await page.getByRole("button", { name: "Practise this topic" }).click();
    await expect(page.getByText(/^Step 2 of \d+$/)).toBeVisible();
  });

  test("Exit from that session returns to the reading screen, and so does Back on Results", async ({
    page,
  }) => {
    await open(page, "/materials/read/S2");
    await page.getByRole("button", { name: "Practise this topic" }).click();
    await expect(page).toHaveURL(/\/session$/);
    await page.getByRole("button", { name: "Exit" }).click();
    await page.getByRole("button", { name: "Leave", exact: true }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
    await expect(page.getByRole("heading", { name: "Checking the route", level: 1 })).toBeVisible();
  });

  test("Steps for this topic opens the Steps, and a topic without steps has no such button", async ({
    page,
  }) => {
    await open(page, "/materials/read/S7");
    await page.getByRole("link", { name: "Steps for this topic" }).click();
    await expect(page).toHaveURL(/\/checklists\/severe-bleeding$/);
    await open(page, "/materials/read/S9");
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Practise this topic" })).toBeVisible();
  });

  test("Next opens the next topic of the same guide, and Back returns to the Materials list", async ({
    page,
  }) => {
    await open(page, "/materials");
    await page.getByRole("link", { name: /^Responding to an alarm/ }).click();
    await page.getByRole("link", { name: /^Next\s*Checking the route$/ }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
    await expect(page.getByRole("heading", { name: "Checking the route", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S1$/);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials$/);
    await expect(page.getByRole("heading", { name: "Materials", level: 1 })).toBeVisible();
  });

  test("a short topic keeps the action block at the very bottom of the screen, no navigation", async ({
    page,
  }) => {
    // the shortest topic (S10) on a 360 by 844 screen
    await page.setViewportSize({ width: 360, height: 844 });
    await open(page, "/materials/read/S10");
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    const block = (await page.getByRole("region", { name: "What next" }).boundingBox())!;
    const practise = (await page
      .getByRole("button", { name: "Practise this topic" })
      .boundingBox())!;
    const lastText = (await page.locator("main [data-reading-body]").boundingBox())!;
    const height = await page.evaluate(() => window.innerHeight);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(
      height,
    );
    // the block's bottom edge is the screen bottom minus the 16px gutter (no safe-area in a test browser)
    expect(Math.abs(height - 16 - (block.y + block.height))).toBeLessThanOrEqual(1);
    // ... and the primary button is far under the text, not directly below it
    expect(practise.y - (lastText.y + lastText.height)).toBeGreaterThan(100);
    expect(practise.height).toBe(52);
  });

  test("Practise, Steps and the pager are fully visible and tappable, not covered by anything", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await open(page, "/materials/read/S2");
    const targets = [
      page.getByRole("button", { name: "Practise this topic" }),
      page.getByRole("link", { name: "Steps for this topic" }),
      page.getByRole("link", { name: /^Previous\s/ }),
      page.getByRole("link", { name: /^Next\s/ }),
    ];
    for (const target of targets) {
      const box = (await target.boundingBox())!;
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      // the element at the centre of the target is the target itself (nothing sits on top of it)
      const covered = await target.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        const top = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return !el.contains(top);
      });
      expect(covered).toBe(false);
    }
  });

  test("Back returns to the Materials list with its navigation and the scroll position kept", async ({
    page,
  }) => {
    await open(page, "/materials");
    await page.evaluate(() => window.scrollTo(0, 500));
    const before = await page.evaluate(() => window.scrollY);
    expect(before).toBeGreaterThan(300);
    await page.getByRole("link", { name: /^Calling for help/ }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S5$/);
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials$/);
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 60);
  });

  test("a long topic lets the block follow the text and scroll with the page", async ({ page }) => {
    await open(page, "/materials/read/S1");
    const gap = await page.evaluate(() => {
      const text = document.querySelector("[data-reading-body]")!.getBoundingClientRect();
      const button = [...document.querySelectorAll("button")].find((b) =>
        b.textContent?.includes("Practise this topic"),
      )!;
      const top = button.getBoundingClientRect().top;
      return { gap: top - text.bottom, below: top > window.innerHeight };
    });
    // 24px of space at least between the text and the block, and the block is off the first screen
    expect(gap.gap).toBeGreaterThanOrEqual(24);
    expect(gap.gap).toBeLessThan(40);
    expect(gap.below).toBe(true);
    const before = (await page.getByRole("button", { name: "Practise this topic" }).boundingBox())!
      .y;
    await page.evaluate(() => window.scrollBy(0, 300));
    await expect
      .poll(
        async () =>
          (await page.getByRole("button", { name: "Practise this topic" }).boundingBox())!.y,
      )
      .toBeLessThan(before - 100);
  });

  test("the action block is in the page flow: nothing fixed or sticky, no background, shadow or border around it", async ({
    page,
  }) => {
    await open(page, "/materials/read/S2");
    const result = await page.evaluate(() => {
      const block = document.querySelector("section[aria-label='What next']")!;
      const chain: Element[] = [];
      for (
        let el: Element | null = block;
        el && el !== document.querySelector("main");
        el = el.parentElement
      )
        chain.push(el);
      const look = (el: Element) => {
        const style = getComputedStyle(el);
        return {
          position: style.position,
          background: style.backgroundColor,
          shadow: style.boxShadow,
          top: style.borderTopWidth,
          bottom: style.borderBottomWidth,
        };
      };
      return { block: look(block), parents: chain.map(look) };
    });
    for (const own of [result.block, ...result.parents]) {
      expect(own.position).not.toBe("fixed");
      expect(own.position).not.toBe("sticky");
      expect(own.background).toBe("rgba(0, 0, 0, 0)");
      expect(own.shadow).toBe("none");
    }
    expect(result.block.top).toBe("0px");
    expect(result.block.bottom).toBe("0px");
  });

  test("the pager: Previous and Next on a middle topic, only Next on the first, only Previous on the last", async ({
    page,
  }) => {
    await open(page, "/materials/read/S2");
    const previous = page.getByRole("link", { name: /^Previous\s*Responding to an alarm$/ });
    const next = page.getByRole("link", { name: /^Next\s*Moving through smoke$/ });
    await expect(previous).toBeVisible();
    await expect(next).toBeVisible();
    // two equal columns: the previous title on the left, the next one right-aligned
    const [a, b] = [(await previous.boundingBox())!, (await next.boundingBox())!];
    expect(Math.abs(a.width - b.width)).toBeLessThan(2);
    expect(a.x).toBeLessThan(b.x);
    expect(a.height).toBeGreaterThanOrEqual(44);
    expect(await next.evaluate((el) => getComputedStyle(el).textAlign)).toBe("right");
    expect(await previous.evaluate((el) => getComputedStyle(el).textAlign)).toBe("left");
    // a divider above the pager, none around it
    const divider = await page.getByRole("navigation", { name: "Topics" }).evaluate((nav) => {
      const parent = getComputedStyle(nav.parentElement!);
      const own = getComputedStyle(nav);
      return {
        top: parent.borderTopWidth,
        color: parent.borderTopColor,
        ownBorder: own.borderTopWidth,
      };
    });
    expect(divider).toEqual({ top: "1px", color: "rgb(228, 223, 213)", ownBorder: "0px" });
    await next.click();
    await expect(page).toHaveURL(/\/materials\/read\/S3$/);
    // the first topic of a guide: no Previous, and Next stays on the right
    await open(page, "/materials/read/S1");
    await expect(page.getByRole("link", { name: /^Previous\s/ })).toHaveCount(0);
    const only = (await page
      .getByRole("link", { name: /^Next\s*Checking the route$/ })
      .boundingBox())!;
    expect(only.x).toBeGreaterThan(170);
    // the last topic: no Next, and Previous stays on the left
    await open(page, "/materials/read/S10");
    await expect(page.getByRole("link", { name: /^Next\s/ })).toHaveCount(0);
    const left = (await page
      .getByRole("link", { name: /^Previous\s*Unresponsive person$/ })
      .boundingBox())!;
    expect(left.x).toBeLessThan(40);
    // the first topic of the flood guide has no Previous either: the guides do not run together
    await open(page, "/materials/read/F1");
    await expect(page.getByRole("link", { name: /^Previous\s/ })).toHaveCount(0);
  });

  test("every topic's reading page opens without console or page errors", async ({ page }) => {
    const errors: string[] = [];
    // WebKit reports a prefetch cancelled by the next navigation as an "access control" error
    const note = (text: string) => {
      if (!text.includes("access control checks")) errors.push(text);
    };
    page.on("pageerror", (error) => note(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") note(message.text());
    });
    const ids = [
      ...Array.from({ length: 10 }, (_, i) => `S${i + 1}`),
      ...["F1", "F2", "F3", "F4", "F5", "F6", "F7"],
    ];
    for (const id of ids) {
      await open(page, `/materials/read/${id}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("region", { name: "What next" })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("the reading screen has no sideways scroll and keeps its gutters", async ({ page }) => {
    for (const id of ["S2", "S1", "S10", "F3"]) {
      await open(page, `/materials/read/${id}`);
      expect(await noSidewaysScroll(page)).toBe(true);
      const sides = await page.evaluate(() => {
        const rect = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect();
        const block = rect("section[aria-label='What next']");
        return { left: block.left, right: document.documentElement.clientWidth - block.right };
      });
      expect(sides.left).toBeGreaterThanOrEqual(16);
      expect(sides.right).toBeGreaterThanOrEqual(16);
    }
  });

  test("the last topic of a guide has no Next link", async ({ page }) => {
    await open(page, "/materials/read/S10");
    await expect(page.getByRole("link", { name: /^Next\s/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Practise this topic" })).toBeVisible();
    await open(page, "/materials/read/F7");
    await expect(page.getByRole("link", { name: /^Next\s/ })).toHaveCount(0);
    await open(page, "/materials/read/F1");
    await expect(
      page.getByRole("link", { name: /^Next\s*Prepare a plan and a grab bag$/ }),
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
    await expect(page.getByRole("button", { name: "Practise this topic" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /^Next\s*Getting help and helping others$/ }),
    ).toBeVisible();
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("reading changes no progress and no Today counter", async ({ page }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("link", { name: /^Next\s*Checking the route$/ }).click();
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
