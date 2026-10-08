"use client";

import { Button } from "@/components/Button/Button";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import type { ScoredItem } from "@/lib/scoring";
import { weakSections } from "@/lib/scoring";

/** Weak topics from the saved history, with a way to repeat the weak steps and questions. */
export function WeakTopics({
  weakItems,
  onRepeatSteps,
  onRepeatQuestions,
}: {
  weakItems: ScoredItem[];
  onRepeatSteps: (stepIds: string[]) => void;
  onRepeatQuestions: (questionIds: string[], sections: string[]) => void;
}) {
  const sections = weakSections(weakItems);
  const steps = weakItems.filter((item) => item.kind === "step");
  const questions = weakItems.filter((item) => item.kind === "question");

  return (
    <section aria-labelledby="weak-topics-title" className="flex flex-col gap-3">
      <h2 id="weak-topics-title" className="text-lg font-medium">
        Weak topics
      </h2>
      {sections.length === 0 ? (
        <p className="text-text-secondary">
          No weak topics yet. They appear here after a session or a quiz, for everything you got
          wrong, partly right or guessed.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {sections.map((sectionId) => (
              <SourceChip key={sectionId} sectionId={sectionId} showTitle />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {steps.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => onRepeatSteps(steps.map((item) => item.id))}
              >
                Repeat weak steps ({steps.length})
              </Button>
            )}
            {questions.length > 0 && (
              <Button
                variant="secondary"
                onClick={() =>
                  onRepeatQuestions(
                    questions.map((item) => item.id),
                    weakSections(questions),
                  )
                }
              >
                Repeat weak questions ({questions.length})
              </Button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
