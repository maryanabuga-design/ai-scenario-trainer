"use client";

import { ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { ReviewQuestion } from "@/components/ReviewQuestion/ReviewQuestion";
import { StepStrip } from "@/components/StepStrip/StepStrip";
import type { Mark, StripState } from "@/components/StepStrip/StepStrip";
import type { Item } from "@/lib/items";

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
  marks,
  onJump,
  saved,
  onToggleSaved,
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
  /** Whether each question of the session was answered right, in order: the strip shows it. */
  marks: Mark[];
  /** Opens the review of the question at this 0-based position. */
  onJump: (index: number) => void;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const states: StripState[] = marks.map((_, index) =>
    index === position - 1 ? "current" : "answered",
  );
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <CircleBackButton href={backHref} label={backLabel} />
        <span className="type-small text-center text-text-secondary tabular-nums">
          Question {position} of {total}
        </span>
      </div>

      <StepStrip unit="Question" states={states} marks={marks} onSelect={onJump} />

      <ReviewQuestion item={item} choice={choice} saved={saved} onToggleSaved={onToggleSaved} />

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
