"use client";

import { Check, X } from "lucide-react";
import { AskAiButton } from "@/components/AskAi/AskAi";
import { ButtonLink } from "@/components/Button/Button";
import { Chip } from "@/components/Chip/Chip";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
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
 * The Answer review of one question after Finish: the situation and question, every option with
 * the right one marked and the person's choice marked, then Why and the Guide chips. No verdict
 * line. The page ends with Back to results and Previous and Next question.
 */
export function AnswerReview({
  item,
  choice,
  position,
  total,
  backHref,
  backLabel,
  hrefFor,
}: {
  item: Item;
  /** The option the person chose. */
  choice: string | null;
  /** 1-based position in the session, and the number of questions. */
  position: number;
  total: number;
  backHref: string;
  backLabel: string;
  /** The review page of another position. */
  hrefFor: (position: number) => string;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <CircleBackButton href={backHref} label={backLabel} />
        <span className="type-small text-center text-text-secondary tabular-nums">
          Question {position} of {total}
        </span>
      </div>

      <section className="flex flex-col gap-4">
        {item.image && <Media3D variant="step" src={item.image.src} alt={item.image.alt} />}
        {item.situation && <p className="type-body">{item.situation}</p>}
        <h1 className="type-item-title">{item.question}</h1>
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

      <div className="flex flex-col gap-3 pb-6">
        <ButtonLink href="/session/results">Back to results</ButtonLink>
        <div className="flex items-center justify-between">
          {position > 1 ? (
            <ButtonLink href={hrefFor(position - 1)} variant="tertiary">
              Previous question
            </ButtonLink>
          ) : (
            <span />
          )}
          {position < total && (
            <ButtonLink href={hrefFor(position + 1)} variant="tertiary">
              Next question
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
