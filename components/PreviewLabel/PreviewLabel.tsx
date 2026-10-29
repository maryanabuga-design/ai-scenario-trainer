"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";

const PreviewContext = createContext(false);

/** Wraps the student screens shown in preview mode (the Instructor's Preview as student). */
export function PreviewProvider({ children }: { children: ReactNode }) {
  return <PreviewContext.Provider value>{children}</PreviewContext.Provider>;
}

/**
 * The small non-interactive label "Preview" in the row of the back arrow, aligned right (DESIGN.md:
 * Result card, one single-choice pattern, a floating confirmation): sand background, muted text, full
 * radius, about 28px high. Nothing in the real student flow, no button and no focus stop.
 */
export function PreviewLabel() {
  if (!useContext(PreviewContext)) return null;
  return (
    <span
      role="note"
      aria-label="Preview mode"
      data-preview-label
      className="type-caption inline-flex h-7 shrink-0 items-center rounded-full bg-secondary-sand px-2.5 text-text-secondary"
    >
      Preview
    </span>
  );
}
