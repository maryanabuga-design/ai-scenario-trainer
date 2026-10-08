"use client";

import { useAskAi } from "@/components/AskAi/AskAi";
import type { Step } from "@/lib/scenario";

/** "Ask about this step": opens the Ask AI sheet with the guide's not-covered answer already there. */
export function SuggestedQuestion({ step }: { step: Step }) {
  const { open } = useAskAi();
  if (!step.suggestedQuestion) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text">Ask about this step</h2>
      <button
        type="button"
        onClick={() => open(step, "feedback", { answerNotCovered: true })}
        className="min-h-11 self-start rounded-full border border-border bg-surface px-4 py-2 text-left text-sm text-text hover:bg-surface-muted"
      >
        {step.suggestedQuestion.question}
      </button>
    </section>
  );
}
