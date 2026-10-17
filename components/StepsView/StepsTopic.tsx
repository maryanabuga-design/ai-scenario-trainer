"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { StepCard, stepsCard } from "@/components/StepsView/StepCard";
import { TopicTile } from "@/components/TopicTile/TopicTile";
import { initialOpen, toggleOpen } from "@/lib/accordion";
import type { Checklist } from "@/lib/checklists";
import { canPractise } from "@/lib/parts";
import { readingPath } from "@/lib/reading";
import { doneIds, doneLabel, toggleStep, useStepsProgress } from "@/lib/steps-progress";
import { usePractise } from "@/lib/use-practise";
import { topicIcon } from "@/lib/weak-topics";

/** The presentation of one topic's steps, with its state passed in (the screen review page shows fixed states). */
export function StepsTopicView({
  checklist,
  open,
  done,
  onBack,
  onToggleOpen,
  onToggleDone,
  onPractise,
}: {
  checklist: Checklist;
  open: string | null;
  done: string[];
  onBack: () => void;
  onToggleOpen: (stepId: string) => void;
  onToggleDone: (stepId: string) => void;
  onPractise: () => void;
}) {
  const total = checklist.steps.length;
  return (
    <div className="flex flex-col gap-4 pb-6">
      <CircleBackButton size="small" label="Back" onClick={onBack} />

      <section
        aria-label="Progress"
        className={`${stepsCard} flex flex-col gap-3 p-[var(--gutter,1rem)]`}
      >
        <div className="flex items-center gap-3">
          <TopicTile sectionId={checklist.topic} icon={topicIcon(checklist.topic)} tone="olive" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h1 className="type-item-title">{checklist.title}</h1>
            <p className="type-small text-text-secondary tabular-nums">
              {doneLabel(done.length, total)}
            </p>
          </div>
        </div>
        <div
          role="progressbar"
          aria-label="Steps done"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done.length}
          className="h-1.5 w-full overflow-hidden rounded-full bg-olive-tint"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 motion-reduce:transition-none"
            style={{ width: `${(done.length / total) * 100}%` }}
          />
        </div>
      </section>

      <ol className="flex flex-col gap-3">
        {checklist.steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            open={open === step.id}
            done={done.includes(step.id)}
            onToggleOpen={() => onToggleOpen(step.id)}
            onToggleDone={() => onToggleDone(step.id)}
          />
        ))}
      </ol>

      {checklist.source && (
        <a
          href={checklist.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${stepsCard} flex min-h-11 items-center gap-3 p-[var(--gutter,1rem)] active:bg-secondary-sand has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent`}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="type-label text-text-secondary">Source</span>
            <span className="type-body-strong">{checklist.source.label}</span>
          </span>
          <ExternalLink size={20} strokeWidth={2} aria-hidden="true" className="text-primary" />
        </a>
      )}

      <div className="flex flex-col gap-3">
        {canPractise(checklist.topic) && <Button onClick={onPractise}>Practise this topic</Button>}
        <ButtonLink href={readingPath(checklist.topic)} variant="secondary">
          Read the material
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * One topic's steps: a summary card (done count and progress bar) over an accordion of step cards
 * (one open at a time, step 1 open at first, a done-circle on each), the optional Source row, and
 * the buttons to practise and to read the material. Steps progress changes nothing else.
 */
export function StepsTopic({ checklist }: { checklist: Checklist }) {
  const router = useRouter();
  const progress = useStepsProgress();
  const saved = progress === "loading" ? null : progress;
  const [open, setOpen] = useState(() => initialOpen(checklist.steps.map((step) => step.id)));
  const practise = usePractise(checklist.topic);

  return (
    <StepsTopicView
      checklist={checklist}
      open={open}
      done={doneIds(saved, checklist)}
      onBack={() => (window.history.length > 1 ? router.back() : router.push("/checklists"))}
      onToggleOpen={(id) => setOpen((current) => toggleOpen(current, id))}
      onToggleDone={(id) => toggleStep(checklist, id)}
      onPractise={practise}
    />
  );
}
