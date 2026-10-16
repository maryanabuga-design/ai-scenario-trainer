"use client";

import { AskAiButton } from "@/components/AskAi/AskAi";
import { BookmarkButton } from "@/components/BookmarkButton/BookmarkButton";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { Media3D } from "@/components/Media3D/Media3D";
import { OptionResult } from "@/components/OptionCard/OptionCard";
import type { Item } from "@/lib/items";
import { optionState } from "@/lib/option-state";

/**
 * One question as it is shown after the session and in Saved: the picture, the situation, the
 * question with its bookmark, every option (the right one marked, and the person's choice when
 * there is one, in the colours, icons and labels of a checked option), then Why with the Guide chips. No verdict line.
 */
export function ReviewQuestion({
  item,
  choice,
  saved,
  onToggleSaved,
}: {
  item: Item;
  /** The option the person chose; null in Saved, where there is no choice. */
  choice: string | null;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  return (
    <>
      <section className="flex flex-col gap-4">
        {item.image && (
          <Media3D variant="step" src={item.image.src || undefined} alt={item.image.alt} />
        )}
        {item.situation && <p className="type-body">{item.situation}</p>}
        <div className="flex items-start justify-between gap-3">
          <h1 className="type-item-title pt-1.5">{item.question}</h1>
          <BookmarkButton saved={saved} onToggle={onToggleSaved} />
        </div>
      </section>

      <ul className="flex flex-col gap-3">
        {item.options.map((option) => (
          <OptionResult
            key={option.id}
            state={optionState({
              mode: "training",
              optionId: option.id,
              choice,
              checked: true,
              correctOptionId: item.correctOptionId,
            })}
          >
            {option.text}
          </OptionResult>
        ))}
      </ul>

      <section className="flex flex-col gap-2">
        <h2 className="type-label text-text-secondary">Why</h2>
        <p>{item.why}</p>
        <div className="flex flex-wrap gap-2">
          {item.guideRef.map((sectionId) => (
            <GuideChip key={sectionId} sectionId={sectionId} />
          ))}
        </div>
      </section>

      {item.kind === "step" && <AskAiButton step={item} />}
    </>
  );
}
