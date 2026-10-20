import { describe, expect, it } from "vitest";
import { TOOLBAR_HEIGHT, placeToolbar } from "@/lib/toolbar-placement";

const viewport = { width: 360, height: 780 };
const base = { width: 180, viewport, gutter: 16, bottomLimit: 692, touch: true };
const rect = (top: number, bottom: number, left = 100, right = 200) => ({
  left,
  right,
  top,
  bottom,
});

describe("placing the toolbar", () => {
  it("goes below the selection on a touch device, centred on it", () => {
    const place = placeToolbar({ ...base, rect: rect(300, 320) });
    expect(place.side).toBe("below");
    // 8px gap plus 20px for the system selection handles
    expect(place.top).toBe(348);
    expect(place.left).toBe(60);
  });

  it("goes above the selection on a desktop when there is room", () => {
    const place = placeToolbar({ ...base, touch: false, rect: rect(300, 320) });
    expect(place.side).toBe("above");
    expect(place.top).toBe(300 - 8 - TOOLBAR_HEIGHT);
  });

  it("takes the other side when the preferred one has no room", () => {
    expect(placeToolbar({ ...base, touch: false, rect: rect(20, 40) }).side).toBe("below");
    expect(placeToolbar({ ...base, touch: true, rect: rect(620, 660) }).side).toBe("above");
  });

  it("stays between the gutters near the edges, and never ends under the bottom navigation", () => {
    const left = placeToolbar({ ...base, rect: rect(300, 320, 0, 30) });
    expect(left.left).toBe(16);
    const right = placeToolbar({ ...base, rect: rect(300, 320, 330, 360) });
    expect(right.left).toBe(360 - 16 - 180);
    const low = placeToolbar({ ...base, rect: rect(600, 640) });
    expect(low.top + TOOLBAR_HEIGHT).toBeLessThanOrEqual(692);
  });

  it("never covers the selection when there is room on either side", () => {
    for (const touch of [true, false]) {
      for (const top of [60, 200, 400, 600]) {
        const r = rect(top, top + 20);
        const place = placeToolbar({ ...base, touch, rect: r });
        const covers = place.top < r.bottom && place.top + TOOLBAR_HEIGHT > r.top;
        expect(covers, `top ${top} touch ${touch}`).toBe(false);
      }
    }
  });

  it("keeps clear of a header at the top: no room above means below", () => {
    const place = placeToolbar({ ...base, touch: false, topLimit: 56, rect: rect(70, 90) });
    expect(place.side).toBe("below");
    expect(placeToolbar({ ...base, touch: false, topLimit: 56, rect: rect(120, 140) }).top).toBe(
      120 - 8 - TOOLBAR_HEIGHT,
    );
  });
});
