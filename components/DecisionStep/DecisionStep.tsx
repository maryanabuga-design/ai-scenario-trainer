"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { AskAiButton } from "@/components/AskAi/AskAi";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { ConfidenceSelector } from "@/components/ConfidenceSelector/ConfidenceSelector";
import { ExplanationField } from "@/components/ExplanationField/ExplanationField";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import type { Confidence, Step } from "@/lib/scenario";

export type Draft = {
  optionId: string | null;
  confidence: Confidence | null;
  explanation: string;
};

export const emptyDraft: Draft = { optionId: null, confidence: null, explanation: "" };

/** Neutral on purpose: the step's follow-up question can assume the choice was right. */
export const explanationPrompt = "In one sentence, why did you choose this?";

function blockingHint(draft: Draft) {
  if (!draft.optionId) return "Choose an action to continue.";
  if (!draft.confidence) return "Say how sure you are to continue.";
  if (!draft.explanation.trim()) return "Write one sentence to continue.";
  return null;
}

/** Situation and decision with progressive reveal: options, then confidence, then explanation. */
export function DecisionStep({
  step,
  index,
  total,
  unit = "Step",
  draft,
  onDraftChange,
  onSubmit,
}: {
  step: Step;
  index: number;
  total: number;
  unit?: Unit;
  draft: Draft;
  onDraftChange: (draft: Draft) => void;
  onSubmit: () => void;
}) {
  const hint = blockingHint(draft);

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit={unit} />
      <section className="flex flex-col gap-3">
        <h1 className="font-serif text-2xl">{step.title}</h1>
        <p className="font-serif text-lg">{step.narrative}</p>
        <div className="flex flex-wrap gap-2">
          {step.sources.map((sectionId) => (
            <SourceChip key={sectionId} sectionId={sectionId} />
          ))}
        </div>
        <AskAiButton step={step} phase="decide" />
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-lg font-medium">{step.question}</legend>
        {step.options.map((option) => (
          <ChoiceCard
            key={option.id}
            name={`option-${step.id}`}
            value={option.id}
            checked={draft.optionId === option.id}
            onChange={(optionId) => onDraftChange({ ...draft, optionId })}
          >
            {option.text}
          </ChoiceCard>
        ))}
      </fieldset>

      {draft.optionId && (
        <ConfidenceSelector
          name={`confidence-${step.id}`}
          value={draft.confidence}
          onChange={(confidence) => onDraftChange({ ...draft, confidence })}
        />
      )}

      {draft.optionId && draft.confidence && (
        <ExplanationField
          label={explanationPrompt}
          value={draft.explanation}
          onChange={(explanation) => onDraftChange({ ...draft, explanation })}
        />
      )}

      <ActionBar>
        {hint && <p className="text-center text-sm text-text-secondary">{hint}</p>}
        <Button disabled={hint !== null} onClick={onSubmit}>
          Check my answer
        </Button>
      </ActionBar>
    </div>
  );
}
