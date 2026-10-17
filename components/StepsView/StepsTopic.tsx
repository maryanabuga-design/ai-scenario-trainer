"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { StepCard, stepsCard } from "@/components/StepsView/StepCard";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { initialOpen, toggleOpen } from "@/lib/accordion";
import { stepCountLabel } from "@/lib/checklists";
import type { Checklist } from "@/lib/checklists";

/** The presentation of one topic's steps, with the open step passed in (the screen review page shows fixed states). */
export function StepsTopicView({
  checklist,
  open,
  onBack,
  onToggleOpen,
}: {
  checklist: Checklist;
  open: string | null;
  onBack: () => void;
  onToggleOpen: (stepId: string) => void;
}) {
  return (
    <div className="flex flex-col pb-[var(--gutter,1rem)]">
      <PageHeaderBand title={checklist.title} back={{ label: "Back", onClick: onBack }} overlap />

      <section
        aria-label="Summary"
        className="relative z-10 -mt-10 flex items-center gap-3 rounded-card border border-selectable-stroke bg-card p-[var(--gutter,1rem)]"
      >
        <TopicTile sectionId={checklist.topic} icon={checklist.icon} size="square48" tone="icon" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="type-body-strong">Step-by-step guide</p>
          <p className="type-small text-text-secondary tabular-nums">
            {stepCountLabel(checklist.steps.length)}
          </p>
        </div>
      </section>

      <ol className="mt-4 flex flex-col gap-3">
        {checklist.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            open={open === step.id}
            onToggleOpen={() => onToggleOpen(step.id)}
          />
        ))}
      </ol>

      {checklist.source && (
        <a
          href={checklist.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${stepsCard} mt-4 flex min-h-11 items-center gap-3 p-[var(--gutter,1rem)] active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="type-label text-text-secondary">Source</span>
            <span className="type-body-strong">{checklist.source.label}</span>
          </span>
          <ExternalLink size={20} strokeWidth={2} aria-hidden="true" className="text-primary" />
        </a>
      )}
    </div>
  );
}

/**
 * One topic's steps, informational only: the olive header frame with Back and the title, the
 * summary card over its edge, and an accordion of step cards (one open at a time, step 1 open at
 * first), then the optional Source row. No completion tracking and no action buttons.
 */
export function StepsTopic({ checklist }: { checklist: Checklist }) {
  const router = useRouter();
  const [open, setOpen] = useState(() => initialOpen(checklist.steps.map((step) => step.id)));

  return (
    <StepsTopicView
      checklist={checklist}
      open={open}
      onBack={() => (window.history.length > 1 ? router.back() : router.push("/checklists"))}
      onToggleOpen={(id) => setOpen((current) => toggleOpen(current, id))}
    />
  );
}
