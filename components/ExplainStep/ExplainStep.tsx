"use client";

import { useState } from "react";
import { AnswerDock } from "@/components/AnswerDock/AnswerDock";
import { SessionTopBar } from "@/components/SessionTopBar/SessionTopBar";
import type { Unit } from "@/components/SessionTopBar/SessionTopBar";
import type { Step } from "@/lib/scenario";
import type { Answer } from "@/lib/session";

/** Neutral on purpose, and the only question asked about a decision. */
export const explanationPrompt = "In one sentence, why did you choose this?";

/**
 * The Explain screen, after the decision: the choice as a quote with no verdict, the prompt and
 * the docked input. Once sent, the answer sheet rises over it.
 */
export function ExplainStep({
  step,
  answer,
  index,
  total,
  unit = "Step",
  submitted = false,
  onSend,
  onDontKnow,
}: {
  step: Step;
  answer: Answer;
  index: number;
  total: number;
  unit?: Unit;
  submitted?: boolean;
  onSend: (explanation: string) => void;
  onDontKnow: () => void;
}) {
  const [draft, setDraft] = useState("");
  const chosen = step.options.find((option) => option.id === answer.optionId);

  return (
    <div className="flex flex-col gap-6">
      <SessionTopBar index={index} total={total} unit={unit} />

      <section className="flex flex-col gap-2">
        <h2 className="type-label text-text-secondary">Your choice</h2>
        <blockquote className="rounded-panel border border-l-[3px] border-secondary-sand-pressed border-l-primary bg-secondary-sand px-4 py-3 text-text">
          {chosen?.text}
        </blockquote>
      </section>

      <h1 className="type-page-title">{explanationPrompt}</h1>

      {submitted &&
        (answer.skipped || !answer.explanation ? (
          <p className="type-small text-text-secondary">Skipped</p>
        ) : (
          <p className="max-w-[85%] self-end rounded-panel bg-surface-muted px-4 py-2">
            {answer.explanation}
          </p>
        ))}

      {!submitted && (
        <AnswerDock
          label={explanationPrompt}
          placeholder="Your answer"
          value={draft}
          onChange={setDraft}
          onSend={onSend}
          onDontKnow={onDontKnow}
        />
      )}
    </div>
  );
}
