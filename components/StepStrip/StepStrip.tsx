"use client";

import { Check, X } from "lucide-react";
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

/** In the Answer review only: whether each question was answered right. */
export type Mark = "correct" | "incorrect";

const markLooks: Record<Mark, string> = {
  correct: "bg-correct-bg text-text",
  incorrect: "bg-wrong-bg text-text",
};

/**
 * The step strip: a row of small rounded squares with the item numbers, one per step or question.
 * It scrolls sideways when it does not fit and keeps the current square in view. Each square jumps
 * to its item.
 */
export function StepStrip({
  unit,
  states,
  marks,
  onSelect,
}: {
  unit: string;
  states: StripState[];
  /** The Answer review passes these: each square then shows a check or a cross, never otherwise. */
  marks?: Mark[];
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
            aria-label={`${unit} ${position + 1}, ${marks ? marks[position] : names[state]}`}
            aria-current={state === "current" ? "step" : undefined}
            onClick={() => onSelect(position)}
            className="flex h-11 w-11 items-center justify-center"
          >
            <span
              aria-hidden="true"
              className={`type-small relative flex h-8 w-8 items-center justify-center rounded-[10px] tabular-nums ${
                marks
                  ? `${markLooks[marks[position]]} ${state === "current" ? "outline-2 outline-offset-0 outline-primary" : ""}`
                  : looks[state]
              }`}
            >
              {position + 1}
              {marks &&
                (marks[position] === "correct" ? (
                  <Check
                    size={10}
                    strokeWidth={3}
                    className="absolute right-0.5 bottom-0.5 text-correct"
                  />
                ) : (
                  <X
                    size={10}
                    strokeWidth={3}
                    className="absolute right-0.5 bottom-0.5 text-wrong"
                  />
                ))}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}
