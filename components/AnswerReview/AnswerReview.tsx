"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { ReviewPager } from "@/components/ReviewPager/ReviewPager";
import type { Mark } from "@/components/ReviewPager/ReviewPager";
import { ReviewQuestion } from "@/components/ReviewQuestion/ReviewQuestion";
import type { Item } from "@/lib/items";

/**
 * The Answer review of one question after Finish: the pager, the situation and question, every
 * option with the right one marked and the person's choice marked, then Why and the Guide chips. No
 * verdict line and no Ask AI link for now. The pinned bottom area has Next question (Primary) over
 * Back to results (Secondary); on the last question only Back to results, as Primary.
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
  /** Whether each question of the session was answered right, in order: the pager shows it. */
  marks: Mark[];
  /** Opens the review of the question at this 0-based position. */
  onJump: (index: number) => void;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const last = position >= total;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-[44px_1fr_44px] items-center">
        <CircleBackButton href={backHref} label={backLabel} />
        <span className="type-small text-center text-text-secondary tabular-nums">
          Question {position} of {total}
        </span>
      </div>

      <ReviewPager marks={marks} current={position - 1} onSelect={onJump} />

      <ReviewQuestion
        item={item}
        choice={choice}
        saved={saved}
        onToggleSaved={onToggleSaved}
        showAskAi={false}
      />

      <ActionBar>
        {last ? (
          <ButtonLink href="/session/results">Back to results</ButtonLink>
        ) : (
          <>
            <ButtonLink href={hrefFor(position + 1)}>Next question</ButtonLink>
            <ButtonLink href="/session/results" variant="secondary">
              Back to results
            </ButtonLink>
          </>
        )}
      </ActionBar>
    </div>
  );
}
