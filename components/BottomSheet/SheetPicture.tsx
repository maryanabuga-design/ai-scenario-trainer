"use client";

import { Check, Lightbulb, X } from "lucide-react";
import { useState } from "react";

export type SheetPictureKind = "correct" | "wrong" | "hint";

/** The pictures of the practice sheets (DESIGN.md: Practice: answer feedback and hint as bottom sheets). */
const SOURCES: Record<SheetPictureKind, string> = {
  correct: "/images/student/feedback-correct.webp",
  wrong: "/images/student/feedback-wrong.webp",
  hint: "/images/student/hint.webp",
};

const TILES: Record<SheetPictureKind, { look: string; icon: typeof Check }> = {
  correct: { look: "bg-correct text-primary-text", icon: Check },
  wrong: { look: "bg-wrong text-primary-text", icon: X },
  hint: { look: "bg-secondary-sand text-text", icon: Lightbulb },
};

/**
 * The 72px decorative picture slot of a sheet (empty alt text). While the file is missing or fails
 * to load it shows a placeholder: a round tile with a check (green), a cross (red) or a lightbulb
 * (sand).
 */
export function SheetPicture({ kind }: { kind: SheetPictureKind }) {
  const [failed, setFailed] = useState(false);
  const tile = TILES[kind];
  if (failed) {
    const Icon = tile.icon;
    return (
      <span
        data-sheet-picture="placeholder"
        aria-hidden="true"
        className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full ${tile.look}`}
      >
        <Icon size={36} strokeWidth={3} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a decorative picture, no optimiser needed
    <img
      ref={(el) => {
        // an error that happened before hydration is not reported by onError
        if (el && el.complete && el.naturalWidth === 0) setFailed(true);
      }}
      data-sheet-picture="image"
      src={SOURCES[kind]}
      alt=""
      width={72}
      height={72}
      onError={() => setFailed(true)}
      className="h-[72px] w-[72px] shrink-0 object-contain"
    />
  );
}
