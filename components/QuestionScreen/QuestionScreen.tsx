"use client";

import { useEffect, useRef } from "react";
import { BookmarkButton } from "@/components/BookmarkButton/BookmarkButton";
import { HintCard } from "@/components/HintCard/HintCard";
import { Media3D } from "@/components/Media3D/Media3D";
import { OptionCard } from "@/components/OptionCard/OptionCard";
import type { Hint, Item } from "@/lib/items";
import { checkAnnouncement, optionState } from "@/lib/option-state";
import type { QuestionMode } from "@/lib/option-state";

/**
 * The one question screen for a scenario step and a quiz question. A scenario: the step picture
 * (a placeholder without one), the situation card, the question. A quiz: the picture only when the
 * question has one. The question has a bookmark on its right, then the options (radio on the
 * left, no letters), then the hint card when it is open. In a training mode, once the answer is
 * checked, the options show the result and a "Why" card appears; in the exam nothing is revealed.
 */
export function QuestionScreen({
  item,
  choice,
  onChoose,
  saved,
  onToggleSaved,
  hint,
  mode = "training",
  checked = false,
}: {
  item: Item;
  choice: string | null;
  onChoose: (optionId: string) => void;
  saved: boolean;
  onToggleSaved: () => void;
  /** The hint to show under the options; null while it is closed. */
  hint: Hint | null;
  mode?: QuestionMode;
  /** The answer was checked (training modes only): it is locked and its feedback shows. */
  checked?: boolean;
}) {
  // Feedback exists in the training modes only, and only after Check.
  const shown = mode === "training" && checked;
  const whyRef = useRef<HTMLElement>(null);
  const wasShown = useRef(shown);
  useEffect(() => {
    // After Check the Why card scrolls into view; a restored, already checked question does not.
    if (shown && !wasShown.current) {
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      whyRef.current?.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "nearest" });
    }
    wasShown.current = shown;
  }, [shown]);
  const scenario = item.kind === "step";
  const image = item.image ?? (scenario ? { src: "", alt: "" } : undefined);
  return (
    <div className="flex flex-col gap-4">
      {image && <Media3D variant="step" src={image.src || undefined} alt={image.alt} />}
      {item.situation && (
        <section className="rounded-card bg-card p-4 shadow-(--card-shadow)">
          <p className="type-body">{item.situation}</p>
        </section>
      )}
      <div className="flex items-start justify-between gap-3">
        <h1 id={`question-${item.id}`} className="type-item-title pt-1.5">
          {item.question}
        </h1>
        <BookmarkButton saved={saved} onToggle={onToggleSaved} />
      </div>
      <fieldset
        role="radiogroup"
        aria-labelledby={`question-${item.id}`}
        className="flex flex-col gap-3"
      >
        <legend className="sr-only">{item.question}</legend>
        <p className="type-small -mt-2 text-text-secondary">Choose one answer</p>
        {item.options.map((option) => (
          <OptionCard
            key={option.id}
            name={`option-${item.id}`}
            value={option.id}
            state={optionState({
              mode,
              optionId: option.id,
              choice,
              checked: shown,
              correctOptionId: item.correctOptionId,
            })}
            locked={shown}
            onChange={onChoose}
          >
            {option.text}
          </OptionCard>
        ))}
      </fieldset>
      {shown && choice && (
        <>
          <p role="status" aria-live="polite" className="sr-only">
            {checkAnnouncement(item, choice)}
          </p>
          <section
            ref={whyRef}
            aria-label="Why"
            className="flex scroll-mb-40 flex-col gap-2 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)]"
          >
            <h2 className="type-label text-text-secondary">Why</h2>
            <p>{item.why}</p>
          </section>
        </>
      )}
      {hint && <HintCard hint={hint} />}
    </div>
  );
}
