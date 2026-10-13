import { describe, expect, it } from "vitest";
import { HISTORY_PAGE, showMore, visibleHistory } from "@/lib/history";

const sessions = (count: number) => Array.from({ length: count }, (_, index) => count - index);

describe("session history paging", () => {
  it("shows 5 of 12, then 10, then all 12 and hides the button", () => {
    const all = sessions(12);
    let shown = HISTORY_PAGE;
    expect(visibleHistory(all, shown)).toEqual({ visible: all.slice(0, 5), hasMore: true });
    shown = showMore(shown);
    expect(visibleHistory(all, shown)).toEqual({ visible: all.slice(0, 10), hasMore: true });
    shown = showMore(shown);
    expect(visibleHistory(all, shown)).toEqual({ visible: all, hasMore: false });
  });

  it("keeps the newest first", () => {
    expect(visibleHistory(sessions(12), HISTORY_PAGE).visible).toEqual([12, 11, 10, 9, 8]);
  });

  it("has no button with 5 sessions or fewer", () => {
    expect(visibleHistory(sessions(3), HISTORY_PAGE)).toEqual({
      visible: [3, 2, 1],
      hasMore: false,
    });
    expect(visibleHistory(sessions(5), HISTORY_PAGE).hasMore).toBe(false);
  });
});
