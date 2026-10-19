"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { SectionList } from "@/components/SectionList/SectionList";
import type { SectionRow } from "@/components/SectionList/SectionList";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import { amountOptions } from "@/lib/mini-quiz";
import { questionCountLabel } from "@/lib/quiz-draw";

export const noTopicHint = "Select at least one topic";

/**
 * The Mini-quiz screen, the only place where the student configures a session: the topics (all
 * selected at first), how many questions (5, 10 or 15, limited by the pool of the selected topics)
 * and Start. The order is always random; there is no shuffle control.
 */
export function MiniQuizView({
  backHref,
  backLabel,
  topics,
  selected,
  onSelectedChange,
  pool,
  amount,
  onAmountChange,
  onStart,
}: {
  backHref: string;
  backLabel: string;
  /** One row per guide section, with the number of questions it holds. */
  topics: SectionRow[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  /** The number of quiz questions in the selected topics. */
  pool: number;
  /** The chosen amount, or null while there is nothing to choose. */
  amount: number | null;
  onAmountChange: (amount: number) => void;
  onStart: () => void;
}) {
  const options = amountOptions(pool);
  const none = selected.length === 0;

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center gap-3">
        <CircleBackButton href={backHref} label={backLabel} />
        <div className="flex min-w-0 flex-col">
          <h1 className="type-item-title">Mini-quiz</h1>
          <p className="type-small text-text-secondary">Pick topics and how many questions</p>
        </div>
      </div>

      <section className="rounded-card bg-card p-4 shadow-(--card-shadow)">
        <SectionList
          title="Topics"
          titleId="mini-topics"
          sections={topics}
          selected={selected}
          onChange={onSelectedChange}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-card bg-card p-4 shadow-(--card-shadow)">
        {options.length === 0 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="type-item-title mb-3">Questions</legend>
            <p className="type-small text-text-secondary">{noTopicHint}</p>
          </fieldset>
        ) : (
          <SegmentedControl
            name="amount"
            legend="Questions"
            options={options.map((option) => ({
              value: String(option.value),
              label: option.label,
            }))}
            value={String(amount)}
            onChange={(value) => onAmountChange(Number(value))}
          />
        )}
      </section>

      <p aria-live="polite" className="type-small text-text-secondary tabular-nums">
        {questionCountLabel(pool)} available in your selected topics
      </p>

      <ActionBar>
        {none && <p className="type-small text-center text-text-secondary">{noTopicHint}</p>}
        <Button disabled={none || amount === null} onClick={onStart}>
          Start mini-quiz
        </Button>
      </ActionBar>
    </div>
  );
}
