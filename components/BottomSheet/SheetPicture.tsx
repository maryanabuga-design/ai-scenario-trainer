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
 * The 72px picture slot of a sheet, always reserved so the text never runs under it. It draws the
 * picture (empty alt text) when the file exists; otherwise a plain sand tile, with no icon and no
 * text, that is hidden from assistive technology. The slot has the same size and place either way.
 */
export function SheetPicture({ kind }: { kind: SheetPictureKind }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <span
      data-sheet-slot={loaded ? "image" : "placeholder"}
      aria-hidden="true"
      className={`relative block h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl ${
        loaded ? "" : "bg-chip-neutral-bg"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- a decorative picture, no optimiser needed */}
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
        className={`absolute inset-0 h-full w-full object-contain ${loaded ? "" : "invisible"}`}
      />
    </span>
  );
}
