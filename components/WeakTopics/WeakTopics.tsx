"use client";

import { Button } from "@/components/Button/Button";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import type { ScoredAnswer } from "@/lib/scoring";
import { weakSections } from "@/lib/scoring";

/** Weak topics from the saved history, with a way to practise them. */
export function WeakTopics({
  weakAnswers,
  onPractise,
}: {
  weakAnswers: ScoredAnswer[];
  onPractise: (stepIds: string[]) => void;
}) {
  const sections = weakSections(weakAnswers);

  return (
    <section aria-labelledby="weak-topics-title" className="flex flex-col gap-3">
      <h2 id="weak-topics-title" className="text-lg font-medium">
        Weak topics
      </h2>
      {sections.length === 0 ? (
        <p className="text-text-secondary">
          No weak topics yet. They appear here after a session, for every step you got wrong or
          guessed.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {sections.map((sectionId) => (
              <SourceChip key={sectionId} sectionId={sectionId} showTitle />
            ))}
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => onPractise(weakAnswers.map((answer) => answer.step.id))}
            >
              Practise weak topics ({weakAnswers.length}{" "}
              {weakAnswers.length === 1 ? "step" : "steps"})
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
