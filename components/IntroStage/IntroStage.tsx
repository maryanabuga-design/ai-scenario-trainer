import type { ReactNode } from "react";
import { Media3D } from "@/components/Media3D/Media3D";

/**
 * The page of Welcome and of an onboarding slide (DESIGN.md: Welcome and onboarding layout), on the
 * plain page background: a top row (the corner button, or an empty spacer of the same 44px height),
 * a centre group that takes all the free space and centres the 3D picture, a 24px gap and the text
 * block, and the bottom block (dots and buttons). No panel, no colour behind the picture.
 */
export function IntroStage({
  slot,
  priority = false,
  slotKey,
  slotClassName = "",
  action,
  bottom,
  children,
}: {
  /** The picture file of the slot, when it exists; without one the dashed placeholder shows. */
  slot?: string;
  /** The picture loads at once (the first visible screen of a flow). */
  priority?: boolean;
  /** A new key replays the picture's entrance (the onboarding slides). */
  slotKey?: string | number;
  slotClassName?: string;
  /** The corner button (Skip); without one the row stays as an empty spacer. */
  action?: ReactNode;
  /** The pinned block under the centre group. */
  bottom: ReactNode;
  /** The text block under the picture. */
  children: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      {/* main pads the top by 24px; -8px makes the row start 16px under the safe area */}
      <div data-top-row className="-mt-2 flex h-11 shrink-0 items-center justify-end">
        {action}
      </div>
      <div data-centre className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
        <div key={`picture-${slotKey}`} className={slotClassName}>
          <Media3D variant="panel" src={slot} priority={priority} />
        </div>
        {children}
      </div>
      <div
        data-bottom
        className="flex flex-col gap-3 pb-[calc(var(--gutter,1rem)+env(safe-area-inset-bottom))]"
      >
        {bottom}
      </div>
    </div>
  );
}
