"use client";

import { useState } from "react";

export type SheetPictureKind = "correct" | "wrong" | "hint";

/** The optional pictures of the practice sheets (DESIGN.md: Quiz feedback and hint sheets). */
const SOURCES: Record<SheetPictureKind, string> = {
  correct: "/images/student/feedback-correct.webp",
  wrong: "/images/student/feedback-wrong.webp",
  hint: "/images/student/hint.webp",
};

/**
 * The 72px decorative picture of a sheet (empty alt text), left of the text. It is optional: while
 * the file is missing (or has not loaded yet) nothing is drawn, so the text uses the full width and
 * there is no empty gap and no broken image icon.
 */
export function SheetPicture({ kind }: { kind: SheetPictureKind }) {
  const [loaded, setLoaded] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a decorative picture, no optimiser needed
    <img
      ref={(el) => {
        // a picture that finished loading before hydration is not reported by onLoad
        if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
      }}
      data-sheet-picture
      src={SOURCES[kind]}
      alt=""
      width={72}
      height={72}
      onLoad={() => setLoaded(true)}
      className={loaded ? "h-[72px] w-[72px] shrink-0 object-contain" : "hidden"}
    />
  );
}
