/** When the quick-actions bar of a reading screen shows (DESIGN.md: Quick-actions bar). */

/** The upward scroll, in pixels, that makes the bar appear. */
export const SHOW_AFTER_UP = 8;

export type QuickBarState = {
  visible: boolean;
  /** The furthest the page was scrolled since it last moved down. */
  peak: number;
  /** The scroll position the last step started from. */
  lastY: number;
};

export const initialQuickBar: QuickBarState = { visible: false, peak: 0, lastY: 0 };

/**
 * One step of the rule, per animation frame. The bar shows after scrolling up by at least 8px, when
 * the page is scrolled further than one viewport, the end block is not near and nothing is
 * selected; it hides on any step down, near the end block, during a selection and near the top.
 * After a hide by a selection or the end block it needs a new upward scroll to come back.
 */
export function nextQuickBar(
  state: QuickBarState,
  input: { y: number; viewport: number; endNear: boolean; busy: boolean },
): QuickBarState {
  const { y, viewport, endNear, busy } = input;
  let { peak, visible } = state;
  if (y > state.lastY) {
    peak = y;
    visible = false;
  } else if (y < state.lastY && peak - y >= SHOW_AFTER_UP) {
    visible = true;
  }
  if (busy || endNear || y <= viewport) {
    visible = false;
    if (y <= viewport) peak = y;
  }
  return { visible, peak, lastY: y };
}
