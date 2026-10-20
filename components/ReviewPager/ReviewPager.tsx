"use client";

import { useEffect, useRef } from "react";

/** Whether each question of the reviewed session was answered right. */
export type Mark = "correct" | "wrong";

/** Colours only when the list is mixed: with every result the same, every chip is neutral. */
export function isMixed(marks: Mark[]): boolean {
  return marks.includes("correct") && marks.includes("wrong");
}

const stateLook: Record<Mark, string> = {
  correct: "border-correct/35 bg-correct-bg",
  wrong: "border-wrong/35 bg-wrong-bg",
};

/**
 * The Answer review pager (DESIGN.md: Button hierarchy, Results and Answer review): one 36 by 36
 * chip per question in a 44px tap area, the background showing right or wrong (only when the list is
 * mixed), a 2px olive ring and a semibold number on the active one. It scrolls sideways with the
 * scrollbar hidden, keeps the first chip 16px from the screen edge and 16px after the last (12px of padding on the scroll container plus 4px around each chip, which is what makes the 44px tap area), and scrolls the active chip
 * into the middle whenever the question changes.
 */
export function ReviewPager({
  marks,
  current,
  onSelect,
}: {
  marks: Mark[];
  /** The 0-based position of the question on screen. */
  current: number;
  onSelect: (index: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const mixed = isMixed(marks);

  useEffect(() => {
    const list = listRef.current;
    const chip = list?.children[current] as HTMLElement | undefined;
    if (!list || !chip) return;
    const listBox = list.getBoundingClientRect();
    const chipBox = chip.getBoundingClientRect();
    const target =
      list.scrollLeft + (chipBox.left - listBox.left) - (listBox.width - chipBox.width) / 2;
    list.scrollLeft = Math.max(0, target);
  }, [current]);

  return (
    <ol
      ref={listRef}
      aria-label="Questions"
      data-review-pager
      data-full-bleed
      className="relative -mx-[var(--gutter,1rem)] flex overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {marks.map((mark, index) => {
        const active = index === current;
        return (
          <li key={index} className="shrink-0">
            <button
              type="button"
              aria-label={`Question ${index + 1}${mixed ? (mark === "correct" ? ", correct" : ", wrong") : ""}`}
              aria-current={active ? "step" : undefined}
              onClick={() => onSelect(index)}
              className="flex h-11 min-w-11 items-center justify-center px-1"
            >
              <span
                aria-hidden="true"
                data-chip={mixed ? mark : "neutral"}
                className={`flex h-9 w-9 items-center justify-center rounded-[10px] border tabular-nums text-text ${
                  mixed ? stateLook[mark] : "border-selectable-stroke bg-surface"
                } ${active ? "type-small-strong outline-2 outline-offset-0 outline-primary" : "type-small"}`}
              >
                {index + 1}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
