"use client";

import { BookmarkButton } from "@/components/BookmarkButton/BookmarkButton";
import { Media3D } from "@/components/Media3D/Media3D";
import { SituationCard } from "@/components/SituationCard/SituationCard";
import { OptionCard } from "@/components/OptionCard/OptionCard";
import type { Item } from "@/lib/items";

/**
 * The one question screen for a scenario step and a quiz question. A scenario: the step picture
 * (a placeholder without one), the situation card, the question. A quiz: the picture only when the
 * question has one. The question has a bookmark on its right, then the options (radio on the
 * left, no letters). The options are never recoloured: once the answer is checked (`locked`) they
 * cannot be changed and the selected one keeps its olive border; the result and the hint are
 * bottom sheets drawn by the caller (DESIGN.md: Practice: answer feedback and hint as bottom
 * sheets), so nothing is inserted into the page.
 */
export function QuestionScreen({
  item,
  choice,
  onChoose,
  saved,
  onToggleSaved,
  locked = false,
  bookmark = true,
}: {
  item: Item;
  choice: string | null;
  onChoose: (optionId: string) => void;
  saved: boolean;
  onToggleSaved: () => void;
  /** The answer was checked (practice only): the options cannot be changed any more. */
  locked?: boolean;
  /** False where nothing can be saved (the practice of a demo topic): no bookmark is drawn. */
  bookmark?: boolean;
}) {
  const scenario = item.kind === "step";
  const image = item.image ?? (scenario ? { src: "", alt: "" } : undefined);
  return (
    <div className="flex flex-col gap-4">
      {image && <Media3D variant="step" src={image.src || undefined} alt={image.alt} />}
      {item.situation && <SituationCard text={item.situation} />}
      <div className="flex items-start justify-between gap-3">
        <h1 id={`question-${item.id}`} tabIndex={-1} className="type-item-title pt-1.5">
          {item.question}
        </h1>
        {bookmark && <BookmarkButton saved={saved} onToggle={onToggleSaved} />}
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
            state={choice === option.id ? "selected" : "idle"}
            locked={locked}
            onChange={onChoose}
          >
            {option.text}
          </OptionCard>
        ))}
      </fieldset>
    </div>
  );
}
