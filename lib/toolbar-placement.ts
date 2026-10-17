/** Where the floating toolbar goes, in viewport coordinates. */

export const TOOLBAR_HEIGHT = 40;
const GAP = 8;

export type Placement = { left: number; top: number; side: "below" | "above" };

/**
 * The toolbar goes below the selection on touch devices (the system menu is above it) and above it
 * on a desktop when there is room. It is centred on the selection, kept between the gutters and
 * above the bottom navigation, and never covers the selection: when the preferred side has no
 * room it takes the other one.
 */
export function placeToolbar({
  rect,
  width,
  viewport,
  gutter,
  bottomLimit,
  topLimit = 0,
  touch,
}: {
  rect: { left: number; right: number; top: number; bottom: number };
  width: number;
  viewport: { width: number; height: number };
  gutter: number;
  /** The top of the bottom navigation: the toolbar must end above it. */
  bottomLimit: number;
  /** The bottom of a sticky header at the top: the toolbar must not go under it. */
  topLimit?: number;
  touch: boolean;
}): Placement {
  const centre = (rect.left + rect.right) / 2;
  const left = Math.min(
    Math.max(centre - width / 2, gutter),
    Math.max(gutter, viewport.width - gutter - width),
  );
  const below = rect.bottom + GAP;
  const above = rect.top - GAP - TOOLBAR_HEIGHT;
  const fitsBelow = below + TOOLBAR_HEIGHT <= bottomLimit - GAP;
  const fitsAbove = above >= topLimit + GAP;
  const preferBelow = touch;
  if (preferBelow ? fitsBelow : !fitsAbove && fitsBelow) return { left, top: below, side: "below" };
  if (preferBelow ? !fitsBelow && fitsAbove : fitsAbove) return { left, top: above, side: "above" };
  // neither side has room (a very tall selection): stay on screen, at the top, inside the text
  return {
    left,
    top: Math.max(topLimit + GAP, Math.min(above, bottomLimit - TOOLBAR_HEIGHT - GAP)),
    side: "above",
  };
}
