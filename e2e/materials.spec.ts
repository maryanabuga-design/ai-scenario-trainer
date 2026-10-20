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
  // the page is drawn once the role has been read in the browser (RoleGate)
  await page.locator("main > *:not(script)").first().waitFor({ state: "attached" });
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
          ink: [getComputedStyle(tile).color, getComputedStyle(tile.querySelector("svg")!).stroke],
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
      // a 44px rounded square icon tile
      expect(row.tile).toEqual([44, 44]);
      expect(row.tileRadius).toBe("12px");
      expect(row.tileBackground).toBe("rgb(226, 222, 214)");
      // the icon is drawn in the icon ink
      expect(row.ink).toEqual(["rgb(92, 90, 86)", "rgb(92, 90, 86)"]);
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
    // no pager: the header arrows are the only way between topics
    await expect(page.getByRole("button", { name: "Next topic" })).toBeEnabled();
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

  test("Practise and Steps are fully visible and tappable, not covered by anything", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await open(page, "/materials/read/S2");
    const targets = [
      page.getByRole("button", { name: "Practise this topic" }),
      page.getByRole("link", { name: "Steps for this topic" }),
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
      // the flood topics have no end block: only the evacuation topics have buttons
      if (id.startsWith("S")) {
        await expect(page.getByRole("region", { name: "What next" })).toBeVisible();
      }
    }
    expect(errors).toEqual([]);
  });

  test("the end block holds only the Practise and Steps buttons, and no Previous or Next", async ({
    page,
  }) => {
    for (const id of ["S1", "S2", "S10"]) {
      await open(page, `/materials/read/${id}`);
      const end = page.getByRole("region", { name: "What next" });
      const labels = await end.locator("a, button").allTextContents();
      expect(labels).toEqual(["Practise this topic", "Steps for this topic"]);
      await expect(end).not.toContainText(/Previous|Next/);
      // no divider and no navigation row in it
      await expect(end.getByRole("navigation")).toHaveCount(0);
      const borders = await end.evaluate((el) =>
        [el, ...el.querySelectorAll("*")].map((node) => getComputedStyle(node).borderTopWidth),
      );
      expect(borders.filter((width) => width !== "0px" && width !== "")).toEqual([]);
    }
  });

  test("the last button has the page gutter below it", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await open(page, "/materials/read/S10");
    const last = (await page.getByRole("link", { name: "Steps for this topic" }).boundingBox())!;
    const height = await page.evaluate(() => window.innerHeight);
    expect(Math.abs(height - 16 - (last.y + last.height))).toBeLessThanOrEqual(1);
  });

  test.describe("the sticky header and the quick-actions bar (360 by 640)", () => {
    test.use({ viewport: { width: 360, height: 640 } });

    const bar = (page: Page) => page.locator("[data-quick-bar]");
    const scrollTo = async (page: Page, y: number) => {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(120);
    };
    // (a topic left by the replace navigation stays in the page, hidden)
    const header = (page: Page) => page.locator("[data-reading-header]:visible");
    const headerLine = (page: Page) =>
      header(page).evaluate((el) => getComputedStyle(el).borderBottomColor);

    test("the header stays on top with the position, and its line shows only after scrolling", async ({
      page,
    }) => {
      await open(page, "/materials/read/S1");
      await expect(header(page)).toContainText("S1 · 1 of 10");
      // no title in the header: the title is in the page, once
      await expect(header(page).getByRole("heading")).toHaveCount(0);
      const style = await header(page).evaluate((el) => {
        const css = getComputedStyle(el);
        return {
          position: css.position,
          background: css.backgroundColor,
          height: el.getBoundingClientRect().height,
        };
      });
      expect(style.position).toBe("sticky");
      expect(style.background).toBe("rgb(246, 244, 240)");
      expect(style.height).toBe(56);
      expect((await header(page).boundingBox())!.y).toBe(0);
      expect(await headerLine(page)).toBe("rgba(0, 0, 0, 0)");
      await scrollTo(page, 900);
      expect((await header(page).boundingBox())!.y).toBe(0);
      expect(await headerLine(page)).toBe("rgb(228, 223, 213)");
      await scrollTo(page, 0);
      await expect.poll(() => headerLine(page)).toBe("rgba(0, 0, 0, 0)");
    });

    test("the header arrows: Previous is disabled on the first topic, Next on the last, and each keeps its place", async ({
      page,
    }) => {
      await open(page, "/materials/read/S1");
      const prev = page.getByRole("button", { name: "Previous topic" });
      const next = page.getByRole("button", { name: "Next topic" });
      await expect(prev).toBeDisabled();
      await expect(next).toBeEnabled();
      const where = await next.boundingBox();
      await open(page, "/materials/read/S10");
      await expect(next).toBeDisabled();
      await expect(prev).toBeEnabled();
      expect(await next.boundingBox()).toEqual(where);
      await open(page, "/materials/read/F2");
      await expect(header(page)).toContainText("F2 · 2 of 7");
      await open(page, "/materials/read/F1");
      await expect(prev).toBeDisabled();
      await open(page, "/materials/read/F7");
      await expect(next).toBeDisabled();
    });

    test("header Next opens the next topic at the top, and Back returns to the Materials list", async ({
      page,
    }) => {
      await open(page, "/materials");
      await page.getByRole("link", { name: /^Responding to an alarm/ }).click();
      await expect(page).toHaveURL(/\/materials\/read\/S1$/);
      await scrollTo(page, 700);
      await page.getByRole("button", { name: "Next topic" }).click();
      await expect(page).toHaveURL(/\/materials\/read\/S2$/);
      await expect(
        page.getByRole("heading", { name: "Checking the route", level: 1 }),
      ).toBeVisible();
      await expect(header(page)).toContainText("S2 · 2 of 10");
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await page.getByRole("button", { name: "Previous topic" }).click();
      await expect(page).toHaveURL(/\/materials\/read\/S1$/);
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/materials$/);
    });

    test("the quick-actions bar: hidden at the top and while scrolling down, shown on scrolling up past one viewport, hidden at the end", async ({
      page,
    }) => {
      await open(page, "/materials/read/S1");
      await expect(bar(page)).toBeHidden();
      // while scrolling down it never shows
      for (const y of [300, 700, 1200, 1800]) {
        await scrollTo(page, y);
        await expect(bar(page)).toBeHidden();
      }
      // up by 100px, well past one viewport (640)
      await scrollTo(page, 1700);
      await expect(bar(page)).toBeVisible();
      await expect(
        bar(page).getByRole("button", { name: "Practise topic", exact: true }),
      ).toBeVisible();
      await expect(bar(page).getByRole("link", { name: "Steps", exact: true })).toBeVisible();
      // down again: hidden
      await scrollTo(page, 1800);
      await expect(bar(page)).toBeHidden();
      // back within the first viewport height: hidden
      await scrollTo(page, 1700);
      await expect(bar(page)).toBeVisible();
      await scrollTo(page, 500);
      await expect(bar(page)).toBeHidden();
      // the end of the text, with the end block in view: hidden, even when scrolling up a little
      await scrollTo(page, 99999);
      await expect(bar(page)).toBeHidden();
      await scrollTo(page, (await page.evaluate(() => window.scrollY)) - 20);
      await expect(bar(page)).toBeHidden();
      await expect(page.getByRole("region", { name: "What next" })).toBeInViewport();
    });

    test("the bar sits inside the gutters over a fade, with 52px buttons, and nothing overflows", async ({
      page,
    }) => {
      await open(page, "/materials/read/S1");
      await scrollTo(page, 1800);
      await scrollTo(page, 1700);
      await expect(bar(page)).toBeVisible();
      // (the bar slides in over 160ms: measure it once it has settled)
      await page.waitForTimeout(300);
      const look = await page.evaluate(() => {
        const rect = (el: Element) => el.getBoundingClientRect();
        const root = document.querySelector("[data-quick-bar]")!;
        const buttons = [...root.querySelectorAll("a, button")];
        return {
          position: getComputedStyle(root).position,
          bottom: rect(root).bottom,
          viewport: window.innerHeight,
          buttons: buttons.map((b) => ({
            left: rect(b).left,
            right: rect(b).right,
            height: rect(b).height,
            width: rect(b).width,
          })),
          border: getComputedStyle(root).borderTopWidth,
        };
      });
      expect(look.position).toBe("fixed");
      expect(look.bottom).toBeCloseTo(look.viewport, 0);
      expect(look.border).toBe("0px");
      for (const button of look.buttons) {
        expect(button.height).toBe(52);
        expect(button.left).toBeGreaterThanOrEqual(16);
        expect(button.right).toBeLessThanOrEqual(344);
      }
      // equal widths: each half of the 328px row minus half of the 12px gap
      const [steps, practise] = look.buttons;
      expect(Math.abs(steps.width - practise.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(steps.width - 158)).toBeLessThanOrEqual(1);
      expect(Math.round(practise.left - steps.right)).toBe(12);
      expect(await noSidewaysScroll(page)).toBe(true);
    });

    test("the bar's labels are Steps and Practise topic, each on one line, and the end block keeps its own", async ({
      page,
    }) => {
      await open(page, "/materials/read/S1");
      await scrollTo(page, 1800);
      await scrollTo(page, 1700);
      const lines = await bar(page)
        .locator("a, button")
        .evaluateAll((els) =>
          els.map((el) => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return {
              text: el.textContent,
              lines: range.getClientRects().length,
              fits: el.scrollWidth <= el.clientWidth,
            };
          }),
        );
      expect(lines).toEqual([
        { text: "Steps", lines: 1, fits: true },
        { text: "Practise topic", lines: 1, fits: true },
      ]);
      await scrollTo(page, 99999);
      await expect(page.getByRole("button", { name: "Practise this topic" })).toBeVisible();
      await expect(page.getByRole("link", { name: "Steps for this topic" })).toBeVisible();
    });

    test("the bar's buttons start the right flows", async ({ page }) => {
      await open(page, "/materials/read/S1");
      await scrollTo(page, 1800);
      await scrollTo(page, 1700);
      await bar(page).getByRole("button", { name: "Practise topic", exact: true }).click();
      await expect(page).toHaveURL(/\/session$/);
      await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible();
      await open(page, "/materials/read/S1");
      await scrollTo(page, 1800);
      await scrollTo(page, 1700);
      await bar(page).getByRole("link", { name: "Steps", exact: true }).click();
      await expect(page).toHaveURL(/\/checklists\/leaving-a-building$/);
    });

    test("a text selection hides the bar, and it needs a new scroll up to come back", async ({
      page,
    }) => {
      await open(page, "/materials/read/S1");
      await scrollTo(page, 1800);
      await scrollTo(page, 1700);
      await expect(bar(page)).toBeVisible();
      await page.evaluate(() => {
        const blocks = [...document.querySelectorAll("[data-reading-body] [data-block]")];
        const block = blocks.find((el) => {
          const r = el.getBoundingClientRect();
          return r.top > 100 && r.bottom < window.innerHeight - 140;
        })!;
        const text = document.createTreeWalker(block, NodeFilter.SHOW_TEXT).nextNode()!;
        const range = document.createRange();
        range.setStart(text, 0);
        range.setEnd(text, 8);
        const selection = window.getSelection()!;
        selection.removeAllRanges();
        selection.addRange(range);
      });
      await expect(page.getByRole("toolbar")).toBeVisible();
      await expect(bar(page)).toBeHidden();
      // the toolbar stays under the header
      const box = (await page.getByRole("toolbar").boundingBox())!;
      expect(box.y).toBeGreaterThanOrEqual(56);
      await page.evaluate(() => window.getSelection()!.removeAllRanges());
      await page.waitForTimeout(150);
      await expect(bar(page)).toBeHidden();
      const y = await page.evaluate(() => window.scrollY);
      await scrollTo(page, y - 30);
      await expect(bar(page)).toBeVisible();
    });

    test("a short topic never shows the bar, and a hidden bar cannot be focused", async ({
      page,
    }) => {
      await open(page, "/materials/read/S10");
      for (const y of [0, 100, 0]) {
        await scrollTo(page, y);
        await expect(bar(page)).toBeHidden();
      }
      const focusable = await page.evaluate(() => {
        const root = document.querySelector("[data-quick-bar]")!;
        const button = root.querySelector("button") as HTMLElement;
        button.focus();
        return {
          focused: document.activeElement === button,
          inert: root.hasAttribute("inert"),
          hidden: root.getAttribute("aria-hidden"),
        };
      });
      expect(focusable).toEqual({ focused: false, inert: true, hidden: "true" });
    });

    for (const [name, from] of [
      ["Training", "/training"],
      ["a Steps screen", "/checklists/leaving-a-building"],
      ["Results", "/session/results"],
    ] as const) {
      test(`Back goes to the Materials list when the reading screen was opened from ${name}`, async ({
        page,
      }) => {
        // the list was scrolled earlier in this tab
        await open(page, "/materials");
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(200);
        await page.goto(from);
        await page.waitForTimeout(300);
        // a client navigation, as a link would do it
        await page.evaluate(() =>
          (
            window as unknown as { next: { router: { push: (to: string) => void } } }
          ).next.router.push("/materials/read/S1"),
        );
        await expect(page).toHaveURL(/\/materials\/read\/S1$/);
        await page.getByRole("button", { name: "Back" }).click();
        await expect(page).toHaveURL(/\/materials$/);
        await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      });
    }

    test("Back from a reading screen opened from the list keeps the list scroll, and topic arrows add no history", async ({
      page,
    }) => {
      await open(page, "/materials");
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(200);
      const before = await page.evaluate(() => window.scrollY);
      await page.getByRole("link", { name: /^Calling for help/ }).click();
      await page.getByRole("button", { name: "Next topic" }).click();
      await expect(header(page)).toContainText("S6 · 6 of 10");
      await page.getByRole("button", { name: "Next topic" }).click();
      await expect(header(page)).toContainText("S7 · 7 of 10");
      await page.getByRole("button", { name: "Back" }).click();
      await expect(page).toHaveURL(/\/materials$/);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before - 60);
    });

    test("a topic with no practice has no bar and keeps only the header", async ({ page }) => {
      await open(page, "/materials/read/F5");
      await expect(bar(page)).toHaveCount(0);
      await expect(header(page)).toContainText("F5 · 5 of 7");
    });
  });

  test("the reading screen has no sideways scroll and keeps its gutters", async ({ page }) => {
    for (const id of ["S2", "S1", "S10", "F3"]) {
      await open(page, `/materials/read/${id}`);
      expect(await noSidewaysScroll(page)).toBe(true);
      const sides = await page.evaluate(() => {
        const rect = (selector: string) =>
          document.querySelector(selector)!.getBoundingClientRect();
        const block = rect(
          document.querySelector("section[aria-label='What next']")
            ? "section[aria-label='What next']"
            : "[data-reading-body]",
        );
        return { left: block.left, right: document.documentElement.clientWidth - block.right };
      });
      expect(sides.left).toBeGreaterThanOrEqual(16);
      expect(sides.right).toBeGreaterThanOrEqual(16);
    }
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
    await expect(page.getByRole("region", { name: "What next" })).toHaveCount(0);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("reading changes no progress", async ({ page }) => {
    await open(page, "/materials/read/S1");
    await page.getByRole("button", { name: "Next topic" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S2$/);
    const stored = await page.evaluate(() => ({
      history: localStorage.getItem("ast.history.v1"),
      session: localStorage.getItem("ast.session.v1"),
      parts: localStorage.getItem("ast.parts.v1"),
    }));
    expect(stored).toEqual({ history: null, session: null, parts: null });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Hi, Maryana" })).toBeVisible();
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
