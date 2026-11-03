import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BottomSheet } from "@/components/BottomSheet/BottomSheet";

/**
 * The preview as student draws the student screens inside a framed phone. Both sheets must sit in
 * the same layer, whose position comes from its containing block (the frame), never from the window.
 */
const feedback = renderToStaticMarkup(
  <BottomSheet
    variant="feedback"
    tone="correct"
    title="Correct"
    announcement="Correct"
    actions={<button type="button">Next</button>}
  >
    Why
  </BottomSheet>,
);
const hint = renderToStaticMarkup(
  <BottomSheet
    variant="hint"
    title="Hint"
    onClose={() => undefined}
    actions={<button>Got it</button>}
  >
    Look at the guide.
  </BottomSheet>,
);

describe("the bottom sheets", () => {
  it("the hint sheet and the answer sheet share one fixed layer as wide as the phone column", () => {
    const layer = "fixed inset-y-0 left-1/2 z-40 w-full max-w-app -translate-x-1/2";
    expect(feedback).toContain(layer);
    expect(hint).toContain(layer);
  });

  it("nothing in them is placed against the window by size: no vw, no viewport-wide width", () => {
    for (const html of [feedback, hint]) {
      expect(html).not.toMatch(/w-screen|\bvw\b|100vw|inset-x-\[|left-\[/);
    }
  });

  it("the hint sheet is a modal dialog with its scrim inside the same layer", () => {
    expect(hint).toContain('role="dialog"');
    expect(hint).toContain("aria-modal");
    const layerStart = hint.indexOf("fixed inset-y-0");
    expect(hint.indexOf("scrim", layerStart)).toBeGreaterThan(layerStart);
  });
});
