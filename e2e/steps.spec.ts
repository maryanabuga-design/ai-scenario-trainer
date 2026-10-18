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

/** The accordion headers of the visible topic screen. */
const headers = (page: Page) => page.locator("main ol button[aria-expanded]:visible");

test.describe("Steps", () => {
  test.use({ viewport: { width: 360, height: 800 } });

  test("the list shows every topic with only its step count, as bordered cards inside the gutters", async ({
    page,
  }) => {
    await open(page, "/");
    await page.getByRole("link", { name: /^Steps/ }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    // the band: the hero-card colour, edge to edge, dark text, with Back, the title and the subtitle inside
    const band = page.locator("[data-page-header-band]:visible");
    const box = (await band.boundingBox())!;
    expect(await band.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      "rgb(240, 236, 230)",
    );
    // a 1px hairline in the normal border colour closes the band
    expect(
      await band.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.borderBottomWidth, css.borderBottomStyle, css.borderBottomColor];
      }),
    ).toEqual(["1px", "solid", "rgb(228, 223, 213)"]);
    // the title and the subtitle are dark, Back is a white circle
    expect(
      await band.evaluate((el) => [
        getComputedStyle(el.querySelector("h1")!).color,
        getComputedStyle(el.querySelector("p")!).color,
        getComputedStyle(el.querySelector("a")!).backgroundColor,
      ]),
    ).toEqual(["rgb(26, 26, 26)", "rgb(26, 26, 26)", "rgb(255, 255, 255)"]);
    expect(box.y).toBe(0);
    expect(box.x).toBeLessThanOrEqual(1);
    expect(box.x + box.width).toBeGreaterThanOrEqual(359);
    await expect(band.getByRole("link", { name: "Back to Home" })).toBeVisible();
    await expect(band.getByRole("heading", { name: "Steps", level: 1 })).toBeVisible();
    await expect(band.getByText("Short step-by-step guides for each topic.")).toBeVisible();
    const inside = await band.evaluate((el) =>
      [...el.querySelectorAll("a, h1, p")].map((node) => node.getBoundingClientRect().left),
    );
    for (const left of inside) expect(left).toBeGreaterThanOrEqual(16);
    // the cards start below the band, one gutter lower
    const cards = page.locator("main ul li:visible a");
    await expect(cards).toHaveCount(3);
    expect((await cards.first().boundingBox())!.y - (box.y + box.height)).toBeCloseTo(16, 0);
    // every card is 80px high, with a 44px rounded-square olive tile, the text after a 12px gap
    const icons: string[] = [];
    for (let n = 0; n < 3; n++) {
      const card = cards.nth(n);
      const look = await card.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const tile = el.querySelector("span[aria-hidden]")!;
        const tileBox = tile.getBoundingClientRect();
        const tileCss = getComputedStyle(tile);
        const text = el.querySelector("span.truncate")!.parentElement!.getBoundingClientRect();
        const chevron = el.querySelector("span[aria-hidden]:last-of-type")!.getBoundingClientRect();
        return {
          height: box.height,
          tile: [
            tileBox.width,
            tileBox.height,
            tileCss.borderTopLeftRadius,
            tileCss.backgroundColor,
          ],
          tileLeft: tileBox.left - box.left,
          gap: text.left - tileBox.right,
          tileCenter: tileBox.top + tileBox.height / 2 - (box.top + box.height / 2),
          chevronInside: chevron.right <= box.right,
          icon: tile.querySelector("svg")!.getAttribute("class"),
          ink: [getComputedStyle(tile).color, getComputedStyle(tile.querySelector("svg")!).stroke],
        };
      });
      expect(look.height).toBe(80);
      expect(look.tile).toEqual([44, 44, "12px", "rgb(234, 237, 223)"]);
      // the icon is drawn in the icon ink
      expect(look.ink).toEqual(["rgb(91, 105, 56)", "rgb(91, 105, 56)"]);
      expect(look.tileLeft).toBeCloseTo(17, 0);
      expect(look.gap).toBe(12);
      expect(Math.abs(look.tileCenter)).toBeLessThanOrEqual(1);
      expect(look.chevronInside).toBe(true);
      icons.push(look.icon!);
    }
    // three different icons
    expect(new Set(icons).size).toBe(3);
    await expect(cards.nth(0)).toContainText("Leaving a building during an alarm");
    await expect(cards.nth(0)).toContainText("6 steps");
    await expect(cards.nth(1)).toContainText("Severe bleeding");
    await expect(cards.nth(2)).toContainText("5 steps");
    for (const text of await cards.allTextContents()) expect(text).not.toMatch(/done|·/);
    const look = await cards.first().evaluate((card) => {
      const css = getComputedStyle(card);
      const box = card.getBoundingClientRect();
      return {
        background: css.backgroundColor,
        border: [css.borderTopWidth, css.borderTopColor],
        radius: css.borderTopLeftRadius,
        padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
        height: box.height,
        left: box.left,
        right: document.documentElement.clientWidth - box.right,
        shadow: css.boxShadow,
      };
    });
    expect(look.background).toBe("rgb(250, 247, 244)");
    expect(look.border).toEqual(["1px", "rgb(228, 223, 213)"]);
    expect(look.radius).toBe("24px");
    expect(look.padding[1]).toBe("16px");
    expect(look.padding[3]).toBe("16px");
    expect(look.height).toBe(80);
    expect(look.left).toBeGreaterThanOrEqual(16);
    expect(look.right).toBeGreaterThanOrEqual(16);
    expect(look.shadow).toBe("none");
    expect(await noSidewaysScroll(page)).toBe(true);
    await page.getByRole("link", { name: "Back to Home" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("a very long title stays on one line with an ellipsis: the card keeps 80px and the chevron stays inside", async ({
    page,
  }) => {
    await open(page, "/checklists");
    const cards = page.locator("main ul li:visible a");
    await expect(cards).toHaveCount(3);
    const result = await cards.first().evaluate((card) => {
      const title = card.querySelector("span.truncate")!;
      title.textContent =
        "A very long title of a step guide that goes on and on and on and on and on and on and on";
      const box = card.getBoundingClientRect();
      const chevron = card.querySelector("span[aria-hidden]:last-of-type")!.getBoundingClientRect();
      const css = getComputedStyle(title);
      return {
        length: title.textContent!.length,
        height: box.height,
        chevronInside: chevron.right <= box.right && chevron.left >= box.left,
        ellipsis: css.textOverflow,
        whiteSpace: css.whiteSpace,
        truncated: title.scrollWidth > title.clientWidth,
        lineHeight: title.getBoundingClientRect().height,
        sideways: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      };
    });
    expect(result.length).toBeGreaterThan(80);
    expect(result.height).toBe(80);
    expect(result.chevronInside).toBe(true);
    expect(result.ellipsis).toBe("ellipsis");
    expect(result.whiteSpace).toBe("nowrap");
    expect(result.truncated).toBe(true);
    expect(result.lineHeight).toBeLessThan(30);
    expect(result.sideways).toBe(true);
    // the real cards keep their full title for assistive technology
    await expect(page.getByRole("link", { name: "Burns, 5 steps" })).toBeVisible();
  });

  test("the topic screen has the olive band edge to edge with the summary card over its bottom edge", async ({
    page,
  }) => {
    await open(page, "/checklists");
    await page.getByRole("link", { name: /Severe bleeding/ }).click();
    await expect(page).toHaveURL(/\/checklists\/severe-bleeding$/);
    const frame = page.locator("[data-page-header-band]:visible");
    const card = page.getByRole("region", { name: "Summary" });
    const f = (await frame.boundingBox())!;
    const c = (await card.boundingBox())!;
    expect(await frame.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      "rgb(240, 236, 230)",
    );
    expect(await frame.evaluate((el) => el.hasAttribute("data-full-bleed"))).toBe(true);
    // edge to edge (the app column has a 1px side border) and up to the top of the screen
    expect(f.x).toBeLessThanOrEqual(1);
    expect(f.x + f.width).toBeGreaterThanOrEqual(359);
    expect(f.y).toBe(0);
    // the card's top is inside the frame, about half the card's height above the frame's bottom
    expect(c.y).toBeGreaterThan(f.y);
    expect(c.y).toBeLessThan(f.y + f.height);
    expect(Math.abs(f.y + f.height - c.y - 40)).toBeLessThanOrEqual(1);
    expect(c.y + c.height).toBeGreaterThan(f.y + f.height);
    // inside the frame: Back (40px) and the large title, both inside the gutters
    const back = (await frame.getByRole("button", { name: "Back" }).boundingBox())!;
    expect([back.width, back.height]).toEqual([40, 40]);
    expect(back.x).toBeGreaterThanOrEqual(16);
    const title = page.getByRole("heading", { name: "Severe bleeding", level: 1 });
    await expect(frame.getByRole("heading", { level: 1 })).toHaveText("Severe bleeding");
    expect(
      await title.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.fontSize, css.color];
      }),
    ).toEqual(["28px", "rgb(26, 26, 26)"]);
    expect((await title.boundingBox())!.x).toBeGreaterThanOrEqual(16);
    // the card: white, 1px border, 24px radius, 16px padding all round, no shadow
    const look = await card.evaluate((el) => {
      const css = getComputedStyle(el);
      return {
        background: css.backgroundColor,
        border: [css.borderTopWidth, css.borderTopColor],
        radius: css.borderTopLeftRadius,
        padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
        shadow: css.boxShadow,
      };
    });
    expect(look).toEqual({
      background: "rgb(255, 255, 255)",
      border: ["1px", "rgb(228, 223, 213)"],
      radius: "24px",
      padding: ["16px", "16px", "16px", "16px"],
      shadow: "none",
    });
    await expect(card).toContainText("Step-by-step guide");
    await expect(card).toContainText("6 steps");
    // the tile is a rounded square, not a circle
    const tile = await card
      .locator("span[aria-hidden]")
      .first()
      .evaluate((el) => {
        const css = getComputedStyle(el);
        const box = el.getBoundingClientRect();
        return [
          box.width,
          box.height,
          css.borderTopLeftRadius,
          css.backgroundColor,
          getComputedStyle(el.querySelector("svg")!).stroke,
        ];
      });
    expect(tile).toEqual([48, 48, "12px", "rgb(234, 237, 223)", "rgb(91, 105, 56)"]);
    // informational only: no progress, no done text, no checkbox, no done-circle
    await expect(page.getByRole("progressbar")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/done/i);
    await expect(page.locator("main [aria-pressed], main input[type=checkbox]")).toHaveCount(0);
    expect(await noSidewaysScroll(page)).toBe(true);
  });

  test("the accordion starts with step 1 open and keeps one open at a time", async ({ page }) => {
    await open(page, "/checklists/severe-bleeding");
    await expect(headers(page)).toHaveCount(6);
    await expect(headers(page).nth(0)).toHaveAttribute("aria-expanded", "true");
    await expect(headers(page).nth(1)).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Check that the scene is safe first.")).toBeVisible();
    await headers(page).nth(1).click();
    await expect(headers(page).nth(1)).toHaveAttribute("aria-expanded", "true");
    await expect(headers(page).nth(0)).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByText("Call 112 or the local emergency number.").first()).toBeVisible();
    // the closed step's details are not visible and cannot be focused
    await expect(page.getByText("Check that the scene is safe first.")).toBeHidden();
    await headers(page).nth(2).click();
    await expect(page.locator("main ol button[aria-expanded=true]")).toHaveCount(1);
    await expect(headers(page).nth(2)).toHaveAttribute("aria-expanded", "true");
    // tapping the open step closes it: nothing is open
    await headers(page).nth(2).click();
    await expect(page.locator("main ol button[aria-expanded=true]")).toHaveCount(0);
  });

  test("a step card is a caption, a title and a chevron with equal padding, and no circle", async ({
    page,
  }) => {
    await open(page, "/checklists/severe-bleeding");
    const first = page.locator("main ol li:visible").first();
    const look = await first.evaluate((li) => {
      const css = getComputedStyle(li);
      const button = li.querySelector("button")!;
      const text = li.querySelector("button > span")!.getBoundingClientRect();
      const box = li.getBoundingClientRect();
      const pad = getComputedStyle(button);
      return {
        background: css.backgroundColor,
        border: [css.borderTopWidth, css.borderTopColor],
        radius: css.borderTopLeftRadius,
        padding: [pad.paddingTop, pad.paddingRight, pad.paddingBottom, pad.paddingLeft],
        // the text starts at the left padding (the 1px border plus 16px), with no empty space
        textLeft: text.left - box.left,
        buttons: li.querySelectorAll("button").length,
        inputs: li.querySelectorAll("input").length,
      };
    });
    // a standard card: the card fill and the normal border, not green
    expect(look.background).toBe("rgb(255, 255, 255)");
    expect(look.border).toEqual(["1px", "rgb(228, 223, 213)"]);
    expect(look.radius).toBe("24px");
    expect(look.padding).toEqual(["16px", "16px", "16px", "16px"]);
    expect(look.textLeft).toBeCloseTo(17, 0);
    expect(look.buttons).toBe(1);
    expect(look.inputs).toBe(0);
    // the caption reads "STEP 1" (set in capitals by its style), in green (step-caption)
    const caption = first.getByText("Step 1", { exact: true });
    expect(
      await caption.evaluate((el) => [
        getComputedStyle(el).textTransform,
        getComputedStyle(el).color,
      ]),
    ).toEqual(["uppercase", "rgb(63, 107, 42)"]);
    // the title and the chevron are dark
    const title = first.getByText("Check the scene is safe", { exact: true });
    expect(await title.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(26, 26, 26)");
    expect(
      await first
        .locator("svg")
        .first()
        .evaluate((el) => getComputedStyle(el).color),
    ).toBe("rgb(26, 26, 26)");
    // the open step's body text is dark on the same fill
    const body = first.getByText("Check that the scene is safe first.");
    expect(await body.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(26, 26, 26)");
    expect(await first.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      "rgb(255, 255, 255)",
    );
    // the summary card is white, not green
    expect(
      await page
        .getByRole("region", { name: "Summary" })
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(255, 255, 255)");
    await expect(first).toContainText("Check the scene is safe");
  });

  test("nothing but the steps and the optional Source row is below the summary: no buttons", async ({
    page,
  }) => {
    await open(page, "/checklists/leaving-a-building");
    await expect(page.getByRole("button", { name: "Practise this topic" })).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: /Steps for this topic|Read the material/ }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Back" })).toHaveCount(1);
    // the only buttons in the page are Back and the step headers
    expect(await page.locator("main button:visible").count()).toBe(1 + 6);
    // and the only links: none
    await expect(page.locator("main a:visible")).toHaveCount(0);
    await expect(page.getByText("Source", { exact: true })).toHaveCount(0);
  });

  test("old saved 'steps done' data is ignored and nothing about it is shown", async ({ page }) => {
    await page.addInitScript(
      ([p]) => {
        if (localStorage.getItem("ast.profile.v1")) return;
        localStorage.setItem("ast.profile.v1", JSON.stringify(p));
        localStorage.setItem(
          "ast.steps.v1",
          JSON.stringify({ schema: 6, content: "old", value: { burns: ["burns-s2"] } }),
        );
      },
      [profile],
    );
    await page.goto("/checklists");
    await expect(page.getByRole("link", { name: /^Burns/ })).toContainText("5 steps");
    await expect(page.locator("main")).not.toContainText(/done/i);
    await page.getByRole("link", { name: /^Burns/ }).click();
    await expect(page.getByRole("heading", { name: "Burns", level: 1 })).toBeVisible();
    await expect(page.locator("main")).not.toContainText(/done/i);
    await page.evaluate(() => localStorage.setItem("ast.steps.v1", "{broken"));
    await page.reload();
    await expect(page.getByRole("heading", { name: "Burns", level: 1 })).toBeVisible();
  });

  test("Back goes to the Steps list from the list, and to the reading screen from Steps for this topic", async ({
    page,
  }) => {
    await open(page, "/checklists");
    await page.getByRole("link", { name: /^Burns/ }).click();
    await expect(page).toHaveURL(/\/checklists\/burns$/);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/checklists$/);
    await page.goto("/materials/read/S8");
    await page.getByRole("link", { name: "Steps for this topic" }).click();
    await expect(page).toHaveURL(/\/checklists\/burns$/);
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page).toHaveURL(/\/materials\/read\/S8$/);
  });

  test("a topic without a step guide has no Steps button on its reading screen", async ({
    page,
  }) => {
    await open(page, "/materials/read/S9");
    await expect(page.getByRole("link", { name: "Steps for this topic" })).toHaveCount(0);
  });

  test("the whole screen keeps the gutters outside the frame and does not scroll sideways", async ({
    page,
  }) => {
    await open(page, "/checklists/leaving-a-building");
    for (let n = 2; n <= 6; n++) {
      await headers(page)
        .nth(n - 1)
        .click();
      await expect(headers(page).nth(n - 1)).toHaveAttribute("aria-expanded", "true");
      expect(await noSidewaysScroll(page)).toBe(true);
    }
    const sides = await page.evaluate(() =>
      [...document.querySelectorAll("main ol > li, main section")].map((el) => {
        const box = el.getBoundingClientRect();
        return [box.left, document.documentElement.clientWidth - box.right];
      }),
    );
    expect(sides.length).toBeGreaterThan(6);
    for (const [left, right] of sides) {
      expect(left).toBeGreaterThanOrEqual(16);
      expect(right).toBeGreaterThanOrEqual(16);
    }
    // the bottom gap below the last card is at least the gutter
    await page.evaluate(() => window.scrollTo(0, 99999));
    const gap = await page.evaluate(() => {
      const last = [...document.querySelectorAll("main ol > li")].pop()!;
      return (
        document.querySelector("main")!.getBoundingClientRect().bottom -
        last.getBoundingClientRect().bottom
      );
    });
    expect(gap).toBeGreaterThanOrEqual(16);
  });

  test("the header button works with the keyboard: Enter opens it", async ({ page }) => {
    await open(page, "/checklists/burns");
    await headers(page).nth(2).focus();
    await page.keyboard.press("Enter");
    await expect(headers(page).nth(2)).toHaveAttribute("aria-expanded", "true");
    await expect(headers(page).nth(2)).toHaveAttribute("aria-controls", "burns-s3-panel");
  });

  for (const width of [360, 430]) {
    test(`the gutters are exactly 16px from the screen edge at ${width}px, on both Steps screens`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      // the list: Back and every card
      await open(page, "/checklists");
      await expect(page.locator("main ul li a")).toHaveCount(3);
      const list = await page.evaluate(() => {
        const left = (el: Element) => el.getBoundingClientRect().left;
        const right = (el: Element) =>
          document.documentElement.clientWidth - el.getBoundingClientRect().right;
        const band = document.querySelector("[data-page-header-band]")!;
        return {
          band: [left(band), right(band)],
          back: left(band.querySelector("a")!),
          title: left(band.querySelector("h1")!),
          cards: [...document.querySelectorAll("main ul li a")].map((a) => [left(a), right(a)]),
        };
      });
      expect(list.band).toEqual([0, 0]);
      expect(list.back).toBeCloseTo(16, 0);
      expect(Math.abs(list.back - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(list.title - 16)).toBeLessThanOrEqual(0.5);
      expect(list.cards).toHaveLength(3);
      for (const [left, right] of list.cards) {
        expect(Math.abs(left - 16)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(right - 16)).toBeLessThanOrEqual(0.5);
      }
      // the topic screen: Back, the summary card and every step card
      await open(page, "/checklists/severe-bleeding");
      await expect(page.getByRole("region", { name: "Summary" })).toBeVisible();
      await expect(page.locator("main ol > li")).toHaveCount(6);
      const topic = await page.evaluate(() => {
        const left = (el: Element) => el.getBoundingClientRect().left;
        const right = (el: Element) =>
          document.documentElement.clientWidth - el.getBoundingClientRect().right;
        const band = document.querySelector("[data-page-header-band]")!;
        return {
          band: [left(band), right(band)],
          back: left(band.querySelector("button")!),
          title: left(band.querySelector("h1")!),
          summary: [
            left(document.querySelector("section[aria-label=Summary]")!),
            right(document.querySelector("section[aria-label=Summary]")!),
          ],
          steps: [...document.querySelectorAll("main ol > li")].map((li) => [left(li), right(li)]),
        };
      });
      expect(topic.band).toEqual([0, 0]);
      expect(Math.abs(topic.back - 16)).toBeLessThanOrEqual(0.5);
      expect(Math.abs(topic.title - 16)).toBeLessThanOrEqual(0.5);
      for (const [left, right] of [topic.summary, ...topic.steps]) {
        expect(Math.abs(left - 16)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(right - 16)).toBeLessThanOrEqual(0.5);
      }
      expect(topic.steps).toHaveLength(6);
    });
  }

  test("what the browser really shows: band, step cards and borders are never default black", async ({
    page,
  }) => {
    for (const path of ["/checklists", "/checklists/severe-bleeding"]) {
      await open(page, path);
      const band = page.locator("[data-page-header-band]:visible");
      expect(await band.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
        "rgb(240, 236, 230)",
      );
      const box = (await band.boundingBox())!;
      expect(box.width).toBe(360);
      await expect(
        band.getByRole(path === "/checklists" ? "link" : "button", { name: /Back/ }),
      ).toBeVisible();
      await expect(band.getByRole("heading", { level: 1 })).toBeVisible();
    }
    // every visible border on the topic screen has a named, non-black colour
    const black = await page.evaluate(() =>
      [...document.querySelectorAll("main *")]
        .filter((el) => (el as HTMLElement).offsetParent !== null)
        .filter((el) => parseFloat(getComputedStyle(el).borderTopWidth) > 0)
        .filter((el) =>
          ["rgb(0, 0, 0)", "rgb(26, 26, 26)"].includes(getComputedStyle(el).borderTopColor),
        )
        .map((el) => el.tagName + "." + el.className.toString().slice(0, 40)),
    );
    expect(black).toEqual([]);
    const cards = page.locator("main ol > li:visible");
    await expect(cards).toHaveCount(6);
    for (let n = 0; n < 6; n++) {
      const card = cards.nth(n);
      const look = await card.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.backgroundColor, css.borderTopColor, css.borderTopWidth];
      });
      expect(look).toEqual(["rgb(255, 255, 255)", "rgb(228, 223, 213)", "1px"]);
      const caption = await card
        .locator(".type-label")
        .first()
        .evaluate((el) => getComputedStyle(el).color);
      expect(caption).toBe("rgb(63, 107, 42)");
    }
    // the summary card's top edge is inside the band's box
    const band = (await page.locator("[data-page-header-band]:visible").boundingBox())!;
    const summary = (await page.getByRole("region", { name: "Summary" }).boundingBox())!;
    expect(summary.y).toBeGreaterThan(band.y);
    expect(summary.y).toBeLessThan(band.y + band.height);
  });

  test("the band is exactly the colour of the Home hero card, on both screens", async ({
    page,
  }) => {
    await open(page, "/");
    const hero = await page
      .getByRole("heading", { name: "Training materials" })
      .evaluate((heading) => {
        // the nearest ancestor with a painted background is the hero card's inner panel
        let el: Element | null = heading;
        while (el && getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)")
          el = el.parentElement;
        return getComputedStyle(el!).backgroundColor;
      });
    expect(hero).toBe("rgb(240, 236, 230)");
    for (const path of ["/checklists", "/checklists/severe-bleeding"]) {
      await open(page, path);
      const band = page.locator("[data-page-header-band]:visible");
      await expect(band).toBeVisible();
      const look = await band.evaluate((el) => {
        const css = getComputedStyle(el);
        return [css.backgroundColor, css.borderBottomWidth, css.borderBottomColor];
      });
      expect(look[0]).toBe(hero);
      expect(look.slice(1)).toEqual(["1px", "rgb(228, 223, 213)"]);
      expect((await band.boundingBox())!.width).toBe(360);
    }
  });

  test("the white Back circle stays visible on the band, and the summary card sits above the hairline", async ({
    page,
  }) => {
    await open(page, "/checklists/severe-bleeding");
    const back = page
      .locator("[data-page-header-band]:visible")
      .getByRole("button", { name: "Back" });
    const look = await back.evaluate((el) => {
      const css = getComputedStyle(el);
      return [css.backgroundColor, css.boxShadow !== "none"];
    });
    expect(look).toEqual(["rgb(255, 255, 255)", true]);
    const summary = page.getByRole("region", { name: "Summary" });
    const z = await summary.evaluate((el) => [
      getComputedStyle(el).position,
      getComputedStyle(el).zIndex,
    ]);
    expect(z).toEqual(["relative", "10"]);
  });
});
