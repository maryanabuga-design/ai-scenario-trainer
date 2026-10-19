import { describe, expect, it } from "vitest";
import { HISTORY_PAGE, seeMore, visibleHistory } from "@/lib/history";

const sessions = (count: number) => Array.from({ length: count }, (_, index) => index);

describe("the full session list in pages of 10", () => {
  it("shows 10, then 20, then all 25, and the button goes away", () => {
    const all = sessions(25);
    let shown = HISTORY_PAGE;
    expect(HISTORY_PAGE).toBe(10);
    expect(visibleHistory(all, shown)).toEqual({ visible: all.slice(0, 10), hasMore: true });
    shown = seeMore(shown);
    expect(visibleHistory(all, shown)).toEqual({ visible: all.slice(0, 20), hasMore: true });
    shown = seeMore(shown);
    expect(visibleHistory(all, shown)).toEqual({ visible: all, hasMore: false });
  });

  it("has no button with 10 sessions or fewer", () => {
    expect(visibleHistory(sessions(10), HISTORY_PAGE).hasMore).toBe(false);
    expect(visibleHistory(sessions(3), HISTORY_PAGE)).toEqual({
      visible: sessions(3),
      hasMore: false,
    });
  });
});
