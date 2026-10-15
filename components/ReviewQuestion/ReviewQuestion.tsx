"use client";

import { Check, X } from "lucide-react";
import { AskAiButton } from "@/components/AskAi/AskAi";
import { BookmarkButton } from "@/components/BookmarkButton/BookmarkButton";
import { Chip } from "@/components/Chip/Chip";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import { Media3D } from "@/components/Media3D/Media3D";
import { optionLetters } from "@/components/QuestionScreen/QuestionScreen";
import type { Item } from "@/lib/items";

/** How an option looks in the review: the right one, the person's wrong one, or neither. */
export type OptionState = "correct" | "chosenWrong" | "plain";

export function optionState(item: Item, optionId: string, choice: string | null): OptionState {
  if (optionId === item.correctOptionId) return "correct";
  return optionId === choice ? "chosenWrong" : "plain";
}

const rowLook: Record<OptionState, string> = {
  correct: "border border-correct bg-correct-bg",
  chosenWrong: "border border-wrong bg-wrong-bg",
  plain: "border border-selectable-stroke bg-card",
};

/**
 * One question as it is shown after the session and in Saved: the picture, the situation, the
 * question with its bookmark, every option (the right one marked, and the person's choice when
 * there is one), then Why with the Guide chips. No verdict line.
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
        {item.options.map((option, index) => {
          const state = optionState(item, option.id, choice);
          const chosen = option.id === choice;
          return (
            <li
              key={option.id}
              data-state={state}
              className={`flex items-center gap-3 rounded-[20px] px-4 py-3 ${rowLook[state]}`}
            >
              <span
                aria-hidden="true"
                className="type-caption flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
              >
                {optionLetters[index]}
              </span>
              <span className="flex min-w-0 flex-1 flex-col items-start gap-2">
                <span>{option.text}</span>
                {(state === "correct" || chosen) && (
                  <span className="flex flex-wrap gap-2">
                    {state === "correct" && (
                      <Chip tone="green" ink="green" size="caption">
                        Correct answer
                      </Chip>
                    )}
                    {chosen && (
                      <Chip
                        tone={state === "correct" ? "green" : "rose"}
                        ink={state === "correct" ? "green" : "red"}
                        size="caption"
                      >
                        Your answer
                        {state === "correct" && (
                          <Check size={14} strokeWidth={2} aria-hidden="true" />
                        )}
                      </Chip>
                    )}
                  </span>
                )}
              </span>
              {state === "correct" && (
                <Check
                  size={20}
                  strokeWidth={2}
                  role="img"
                  aria-label="Correct"
                  className="shrink-0 text-correct"
                />
              )}
              {state === "chosenWrong" && (
                <X
                  size={20}
                  strokeWidth={2}
                  role="img"
                  aria-label="Not correct"
                  className="shrink-0 text-wrong"
                />
              )}
            </li>
          );
        })}
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
