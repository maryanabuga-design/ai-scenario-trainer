"use client";

import { BookmarkButton } from "@/components/BookmarkButton/BookmarkButton";
import { HintCard } from "@/components/HintCard/HintCard";
import { Media3D } from "@/components/Media3D/Media3D";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import type { Hint, Item } from "@/lib/items";

export const optionLetters = "ABCD";

/**
 * The one question screen for a scenario step and a quiz question. A scenario: the step picture
 * (a placeholder without one), the situation card, the question. A quiz: the picture only when the
 * question has one. The question has a bookmark on its right, then the lettered options, then the
 * hint card when it is open. It shows no verdict; that comes in the results.
 */
export function QuestionScreen({
  item,
  choice,
  onChoose,
  saved,
  onToggleSaved,
  hint,
}: {
  item: Item;
  choice: string | null;
  onChoose: (optionId: string) => void;
  saved: boolean;
  onToggleSaved: () => void;
  /** The hint to show under the options; null while it is closed. */
  hint: Hint | null;
}) {
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
      <fieldset aria-labelledby={`question-${item.id}`} className="flex flex-col gap-3">
        <legend className="sr-only">{item.question}</legend>
        <p className="type-small -mt-2 text-text-secondary">Choose one answer</p>
        {item.options.map((option, position) => (
          <SelectableCard
            key={option.id}
            size="row"
            letter={optionLetters[position]}
            name={`option-${item.id}`}
            value={option.id}
            checked={choice === option.id}
            onChange={onChoose}
          >
            {option.text}
          </SelectableCard>
        ))}
      </fieldset>
      {hint && <HintCard hint={hint} />}
    </div>
  );
}
