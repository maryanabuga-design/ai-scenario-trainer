"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { AskAiButton } from "@/components/AskAi/AskAi";
import { Button } from "@/components/Button/Button";
import { ChoiceCard } from "@/components/ChoiceCard/ChoiceCard";
import { ConfidenceSelector } from "@/components/ConfidenceSelector/ConfidenceSelector";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import type { Confidence, Step } from "@/lib/scenario";

export type Draft = {
  optionId: string | null;
  confidence: Confidence | null;
};

export const emptyDraft: Draft = { optionId: null, confidence: null };

function blockingHint(draft: Draft) {
  if (!draft.optionId) return "Choose an action to continue.";
  if (!draft.confidence) return "Say how sure you are to continue.";
  return null;
}

/** Situation and decision with progressive reveal: options, then confidence. The explanation follows on its own screen. */
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
        <h1 className="type-page-title">{step.title}</h1>
        <p className="type-body">{step.narrative}</p>
        <div className="flex flex-wrap gap-2">
          {step.sources.map((sectionId) => (
            <GuideChip key={sectionId} sectionId={sectionId} />
          ))}
        </div>
        <AskAiButton step={step} phase="decide" />
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="type-item-title mb-3">{step.question}</legend>
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

      <ActionBar>
        {hint && <p className="type-small text-center text-text-secondary">{hint}</p>}
        <Button disabled={hint !== null} onClick={onSubmit}>
          Continue
        </Button>
      </ActionBar>
    </div>
  );
}
