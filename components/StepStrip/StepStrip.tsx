"use client";

import { useEffect, useRef } from "react";

export type StripState = "current" | "answered" | "unanswered";

/** The state of each square: the current one, then answered or not. Never right or wrong. */
export function stripStates(answered: boolean[], current: number): StripState[] {
  return answered.map((done, position) =>
    position === current ? "current" : done ? "answered" : "unanswered",
  );
}

const looks: Record<StripState, string> = {
  current: "bg-primary text-primary-text",
  answered: "bg-olive-tint text-text",
  unanswered: "border-[1.5px] border-secondary-sand-pressed text-text",
};

const names: Record<StripState, string> = {
  current: "current",
  answered: "answered",
  unanswered: "not answered",
};

/**
 * The step strip: a row of small rounded squares with the item numbers, one per step or question.
 * It scrolls sideways when it does not fit and keeps the current square in view. Each square jumps
 * to its item.
 */
export function StepStrip({
  unit,
  states,
  onSelect,
}: {
  unit: string;
  states: StripState[];
  onSelect: (position: number) => void;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const current = states.indexOf("current");

  useEffect(() => {
    const list = listRef.current;
    const item = list?.children[current] as HTMLElement | undefined;
    if (!list || !item) return;
    list.scrollLeft = item.offsetLeft - (list.clientWidth - item.clientWidth) / 2;
  }, [current]);

  return (
    <ol
      ref={listRef}
      aria-label={`${unit}s`}
      className="-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {states.map((state, position) => (
        <li key={position} className="shrink-0">
          <button
            type="button"
            aria-label={`${unit} ${position + 1}, ${names[state]}`}
            aria-current={state === "current" ? "step" : undefined}
            onClick={() => onSelect(position)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span
              aria-hidden="true"
              className={`type-small flex h-8 w-8 items-center justify-center rounded-[8px] tabular-nums ${looks[state]}`}
            >
              {position + 1}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
