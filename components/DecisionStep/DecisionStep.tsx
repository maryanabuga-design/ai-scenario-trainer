"use client";

import { useId } from "react";
import { ContentImage } from "@/components/ContentImage/ContentImage";
import { SelectableCard } from "@/components/SelectableCard/SelectableCard";
import { ConfidenceSelector } from "@/components/ConfidenceSelector/ConfidenceSelector";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import type { Step } from "@/lib/scenario";
import type { StepDraft } from "@/lib/session-draft";

export const explanationLabel = "Explain your choice in your own words (optional)";

const letters = "ABCDEFGH";

/**
 * One scenario step: the situation, the options with letter badges, the confidence and the
 * optional explanation. It shows no verdict; that comes in the results.
 */
export function DecisionStep({
  step,
  draft,
  onDraftChange,
}: {
  step: Step;
  draft: StepDraft;
  onDraftChange: (draft: StepDraft) => void;
}) {
  const fieldId = useId();
  return (
    <div className="flex flex-col gap-6">
      <ContentImage image={step.image} />
      <section className="flex flex-col gap-3">
        <h1 className="type-page-title">{step.title}</h1>
        <p className="type-body">{step.narrative}</p>
        <div className="flex flex-wrap gap-2">
          {step.sources.map((sectionId) => (
            <GuideChip key={sectionId} sectionId={sectionId} />
          ))}
        </div>
      </section>

      <fieldset className="flex flex-col gap-3">
        <legend className="type-item-title">{step.question}</legend>
        <p className="type-small -mt-1 mb-1 text-text-secondary">Choose one answer</p>
        {step.options.map((option, position) => (
          <SelectableCard
            key={option.id}
            size="row"
            letter={letters[position]}
            name={`option-${step.id}`}
            value={option.id}
            checked={draft.optionId === option.id}
            onChange={(optionId) => onDraftChange({ ...draft, optionId })}
          >
            {option.text}
          </SelectableCard>
        ))}
      </fieldset>

      {draft.optionId && (
        <ConfidenceSelector
          name={`confidence-${step.id}`}
          value={draft.confidence}
          onChange={(confidence) => onDraftChange({ ...draft, confidence })}
        />
      )}

      {draft.confidence && (
        <div className="flex flex-col gap-2">
          <label htmlFor={fieldId} className="type-body-strong">
            {explanationLabel}
          </label>
          <textarea
            id={fieldId}
            rows={3}
            value={draft.explanation}
            onChange={(event) => onDraftChange({ ...draft, explanation: event.target.value })}
            placeholder="Your answer"
            autoComplete="off"
            className="type-body min-h-24 w-full resize-y rounded-card border border-border-strong bg-surface p-3 placeholder:text-text-secondary"
          />
        </div>
      )}
    </div>
  );
}
