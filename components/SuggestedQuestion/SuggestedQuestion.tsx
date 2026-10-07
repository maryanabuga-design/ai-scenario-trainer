"use client";

import { useState } from "react";
import { SourceChip } from "@/components/SourceChip/SourceChip";
import type { SuggestedQuestion as Question } from "@/lib/scenario";

/** A question the trainee can tap. The guide does not answer it, and the AI says so. */
export function SuggestedQuestion({
  question,
  defaultAsked = false,
}: {
  question: Question;
  defaultAsked?: boolean;
}) {
  const [asked, setAsked] = useState(defaultAsked);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-text">Ask about this step</h2>
      <button
        type="button"
        disabled={asked}
        aria-expanded={asked}
        onClick={() => setAsked(true)}
        className="min-h-11 self-start rounded-full border border-border bg-surface px-4 py-2 text-left text-sm text-text hover:bg-surface-muted disabled:cursor-default disabled:hover:bg-surface"
      >
        {question.question}
      </button>
      {asked && (
        <div className="flex flex-col gap-2 text-sm">
          <p className="text-text">This is not covered by the material.</p>
          <p>Closest sections in the guide:</p>
          <div className="flex flex-wrap gap-2">
            {question.closestSources.map((sectionId) => (
              <SourceChip key={sectionId} sectionId={sectionId} showTitle />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
