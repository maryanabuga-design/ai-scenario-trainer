import { describe, expect, it } from "vitest";
import { HISTORY_PAGE, seeMore, visibleHistory } from "@/lib/history";

const sessions = (count: number) => Array.from({ length: count }, (_, index) => index);

describe("session history in pages of 5", () => {
  it("shows 5, then 10, then all 12, and the button goes away", () => {
    const all = sessions(12);
    let shown = HISTORY_PAGE;
    expect(visibleHistory(all, shown)).toEqual({ visible: all.slice(0, 5), hasMore: true });
    shown = seeMore(shown);
    expect(visibleHistory(all, shown)).toEqual({ visible: all.slice(0, 10), hasMore: true });
    shown = seeMore(shown);
    expect(visibleHistory(all, shown)).toEqual({ visible: all, hasMore: false });
  });

  it("has no button with 5 sessions or fewer", () => {
    expect(visibleHistory(sessions(5), HISTORY_PAGE).hasMore).toBe(false);
    expect(visibleHistory(sessions(3), HISTORY_PAGE)).toEqual({
      visible: sessions(3),
      hasMore: false,
    });
  });
});
