"use client";

import { Media3D } from "@/components/Media3D/Media3D";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import type { Item } from "@/lib/items";

export const optionLetters = "ABCD";

/**
 * The one question screen for a scenario step and a quiz question: the media slot (only when the
 * item has an `image`), the situation (scenario only), the question and the lettered options. It
 * shows no verdict; that comes in the results.
 */
export function QuestionScreen({
  item,
  choice,
  onChoose,
}: {
  item: Item;
  choice: string | null;
  onChoose: (optionId: string) => void;
}) {
  return (
    <section
      aria-labelledby={`question-${item.id}`}
      className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-(--card-shadow)"
    >
      {item.image && <Media3D variant="step" src={item.image.src} alt={item.image.alt} />}
      {item.situation && <p className="type-body">{item.situation}</p>}
      <fieldset className="flex flex-col gap-3">
        <legend id={`question-${item.id}`} className="type-item-title">
          {item.question}
        </legend>
        <p className="type-small -mt-1 mb-1 text-text-secondary">Choose one answer</p>
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
    </section>
  );
}
