"use client";

import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { GuideChip } from "@/components/GuideChip/GuideChip";
import type { Checklist } from "@/lib/checklists";

/** One checklist: its steps, numbered, and the guide sections they come from. */
export function ChecklistDetail({ checklist }: { checklist: Checklist }) {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <CircleBackButton href="/checklists" label="Back to checklists" />
      <h1 className="type-page-title">{checklist.title}</h1>
      <ol className="flex flex-col gap-4">
        {checklist.steps.map((step, index) => (
          <li key={step} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="type-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive-tint tabular-nums"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">
              <span className="sr-only">Step {index + 1}: </span>
              {step}
            </span>
          </li>
        ))}
      </ol>
      <section className="flex flex-col gap-2">
        <h2 className="type-label text-text-secondary">From the guide</h2>
        <div className="flex flex-wrap gap-2">
          {checklist.guideRef.map((sectionId) => (
            <GuideChip key={sectionId} sectionId={sectionId} />
          ))}
        </div>
      </section>
    </div>
  );
}
