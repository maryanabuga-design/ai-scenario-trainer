import { describe, expect, it } from "vitest";
import { initialQuickBar, nextQuickBar } from "@/lib/quick-bar";
import type { QuickBarState } from "@/lib/quick-bar";

const viewport = 640;
const free = { viewport, endNear: false, busy: false };
const run = (positions: number[], extra: Partial<typeof free> = {}) =>
  positions.reduce<QuickBarState>(
    (state, y) => nextQuickBar(state, { ...free, ...extra, y }),
    initialQuickBar,
  );

describe("the quick-actions bar rule", () => {
  it("is hidden at the top and while scrolling down", () => {
    expect(run([0]).visible).toBe(false);
    expect(run([0, 300, 700, 1200, 2000]).visible).toBe(false);
  });

  it("shows after scrolling up by 8px past one viewport, not before", () => {
    expect(run([0, 1500, 1495]).visible).toBe(false);
    expect(run([0, 1500, 1492]).visible).toBe(true);
    expect(run([0, 1500, 1400]).visible).toBe(true);
  });

  it("hides again on any step down", () => {
    expect(run([0, 1500, 1400, 1450]).visible).toBe(false);
  });

  it("stays hidden within the first viewport height, and hides when the page is back there", () => {
    expect(run([0, 600, 500]).visible).toBe(false);
    expect(run([0, 1500, 1400, 640]).visible).toBe(false);
    expect(run([0, 1500, 1400, 300]).visible).toBe(false);
  });

  it("hides near the end block and needs a new upward scroll afterwards", () => {
    let state = run([0, 1500, 1400]);
    expect(state.visible).toBe(true);
    state = nextQuickBar(state, { ...free, y: 1390, endNear: true });
    expect(state.visible).toBe(false);
    // the end block is far again but nothing scrolled: it stays hidden
    state = nextQuickBar(state, { ...free, y: 1390 });
    expect(state.visible).toBe(false);
    state = nextQuickBar(state, { ...free, y: 1370 });
    expect(state.visible).toBe(true);
  });

  it("hides during a selection and does not come back until the reader scrolls up again", () => {
    let state = run([0, 1500, 1400]);
    state = nextQuickBar(state, { ...free, y: 1400, busy: true });
    expect(state.visible).toBe(false);
    state = nextQuickBar(state, { ...free, y: 1400 });
    expect(state.visible).toBe(false);
    expect(nextQuickBar(state, { ...free, y: 1380 }).visible).toBe(true);
  });

  it("never shows on a short topic: the page cannot scroll a full viewport", () => {
    // a document 1.5 viewports high scrolls at most half a viewport
    expect(run([0, 100, 200, 320, 200, 100, 0]).visible).toBe(false);
  });
});
