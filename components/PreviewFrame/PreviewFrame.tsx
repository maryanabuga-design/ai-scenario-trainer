"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { FrameBarContext } from "@/components/ActionBar/ActionBar";

/**
 * The framed phone of the desktop preview as student (DESIGN.md: Responsive instructor, step 5 and
 * 6): from 1024px in the instructor shell the student screen is drawn in a 430px column with a
 * border and a soft shadow, and its pinned bar (Check, Next, ...) is drawn at the bottom INSIDE the
 * frame. Below 1024px the frame is invisible (`contents`) and nothing changes. Inside it the phone
 * layout is kept: the `idesk:` variant is never true inside `[data-phone-frame]`.
 */
export function PreviewFrame({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <FrameBarContext.Provider value={slot}>
      <div
        data-phone-frame
        className="contents idesk:mx-auto idesk:flex idesk:h-[calc(100dvh-7.5rem)] idesk:min-h-[640px] idesk:w-full idesk:max-w-[430px] idesk:flex-col idesk:overflow-clip idesk:rounded-[24px] idesk:border idesk:border-selectable-stroke idesk:bg-bg idesk:transform-gpu idesk:shadow-(--card-shadow) idesk:[--gutter:1rem]"
      >
        {/* the screen scrolls inside the frame like on a phone; the pinned bar stays under it */}
        <div className="contents desk:block desk:min-h-0 desk:flex-1 desk:overflow-y-auto desk:px-4 desk:pt-6 desk:pb-4">
          {children}
        </div>
        {/* plain `desk:` here: the instructor variant is switched off inside the frame */}
        <div ref={setSlot} data-frame-bar className="hidden desk:block desk:empty:hidden" />
      </div>
    </FrameBarContext.Provider>
  );
}
