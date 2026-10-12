"use client";

import { useState } from "react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { ExplanationField } from "@/components/ExplanationField/ExplanationField";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { formatSelfCheck, prefillSelfCheck } from "@/lib/explanation-match";
import type { Step } from "@/lib/scenario";
import type { Answer } from "@/lib/session";

/** Neutral on purpose: the step's follow-up question can assume the choice was right. */
export const explanationPrompt = "In one sentence, why did you choose this?";

function Label({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-medium tracking-[0.04em] text-text-secondary uppercase">
      {children}
    </h2>
  );
}

/**
 * The Explain screen, after the decision and before feedback. The user writes one sentence, then
 * judges it against the key points; a keyword match only pre-checks the boxes.
 */
export function ExplainStep({
  step,
  answer,
  index,
  total,
  unit = "Step",
  onCheck,
  onSelfCheckChange,
  onSkip,
  onSeeFeedback,
}: {
  step: Step;
  answer: Answer;
  index: number;
  total: number;
  unit?: Unit;
  onCheck: (explanation: string, selfCheck: boolean[]) => void;
  onSelfCheckChange: (selfCheck: boolean[]) => void;
  onSkip: () => void;
  onSeeFeedback: () => void;
}) {
  const [draft, setDraft] = useState(answer.explanation);
  const chosen = step.options.find((option) => option.id === answer.optionId);
  const boxes = answer.selfCheck;

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit={unit} />
      <h1 className="font-serif text-2xl">Explain your choice</h1>

      <section className="flex flex-col gap-2">
        <Label>Your choice</Label>
        <blockquote className="rounded-panel border-l-2 border-border-strong bg-surface-muted px-4 py-3">
          {chosen?.text}
        </blockquote>
      </section>

      {boxes === undefined ? (
        <>
          <ExplanationField label={explanationPrompt} value={draft} onChange={setDraft} />
          <ActionBar>
            {!draft.trim() && (
              <p className="text-center text-sm text-text-secondary">
                Write one sentence to check it.
              </p>
            )}
            <Button
              disabled={!draft.trim()}
              onClick={() => onCheck(draft.trim(), prefillSelfCheck(step, draft))}
            >
              Check my explanation
            </Button>
            <Button variant="text" onClick={onSkip}>
              Skip
            </Button>
          </ActionBar>
        </>
      ) : (
        <>
          <section className="flex flex-col gap-2">
            <Label>Your explanation</Label>
            <Card>
              <p>{answer.explanation}</p>
            </Card>
          </section>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-lg font-medium">Points a strong answer covers</legend>
            <p className="text-sm text-text-secondary tabular-nums" aria-live="polite">
              {formatSelfCheck({
                covered: boxes.filter(Boolean).length,
                total: boxes.length,
              })}
            </p>
            {step.explanationKeyBeats.map((beat, position) => (
              <ChoiceCard
                key={beat}
                type="checkbox"
                name={`self-check-${step.id}`}
                value={String(position)}
                checked={boxes[position] ?? false}
                onChange={() =>
                  onSelfCheckChange(
                    step.explanationKeyBeats.map((_, other) =>
                      other === position ? !boxes[other] : (boxes[other] ?? false),
                    ),
                  )
                }
              >
                <span className="flex flex-col gap-1">
                  <span>{beat}</span>
                  <span className="text-sm text-text-secondary">My answer covers this</span>
                </span>
              </ChoiceCard>
            ))}
            <p className="text-sm text-text-secondary">
              Pre-checked by a simple keyword match. You decide.
            </p>
          </fieldset>

          <ActionBar>
            <Button
              variant="secondary"
              onClick={() => onSelfCheckChange(step.explanationKeyBeats.map(() => true))}
            >
              My answer covers all points
            </Button>
            <Button onClick={onSeeFeedback}>See feedback</Button>
          </ActionBar>
        </>
      )}
    </div>
  );
}
