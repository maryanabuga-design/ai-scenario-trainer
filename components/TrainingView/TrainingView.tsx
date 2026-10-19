"use client";

import { Clock, ListChecks, Target } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { buttonClasses } from "@/components/Button/Button";
import { IconTile } from "@/components/IconTile/IconTile";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { Ring } from "@/components/Ring/Ring";
import { SegmentedControl } from "@/components/SegmentedControl/SegmentedControl";
import type { ModeStats, PartRecords, PartState } from "@/lib/part-progress";
import { partRing } from "@/lib/part-progress";
import type { Deadline } from "@/lib/exam-deadline";
import type { Part, TrainingMode } from "@/lib/parts";
import { questionCountLabel } from "@/lib/quiz-draw";

/** An assigned exam as the Training screen lists it: its title and deadline text. */
export type TrainingExam = { id: string; title: string; deadline: Deadline };

export const miniQuizPath = "/mini-quiz?from=training";

export type TrainingTopic = {
  sectionId: string;
  title: string;
  /** Questions in this section whose latest answer is wrong (in this mode). */
  toRepeat: number;
  parts: { part: Part; state: PartState; recommended: boolean }[];
};

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <IconTile className="h-9 w-9 rounded-full">
        <Icon size={18} strokeWidth={1.75} />
      </IconTile>
      <div className="flex min-w-0 flex-col">
        <span className="type-small text-text-secondary">{label}</span>
        <span className="type-numeral tabular-nums">{value}</span>
      </div>
    </div>
  );
}

/**
 * The Training screen: the stats of the mode, the Scenario/Quiz switch, the Mini-quiz card (Quiz
 * mode only) and a card per topic with its parts. Nothing is configured: a row starts its part.
 */
export function TrainingView({
  guideName,
  mode,
  onModeChange,
  stats,
  topics,
  records,
  onStartPart,
  resume,
  exams = [],
}: {
  guideName: string;
  mode: TrainingMode;
  onModeChange: (mode: TrainingMode) => void;
  stats: ModeStats;
  topics: TrainingTopic[];
  records: PartRecords | null;
  onStartPart: (part: Part) => void;
  /** An unfinished session: the one place Home sends people to pick it up again. */
  resume?: string;
  /** The assigned exams, nearest deadline first: each opens its exam screen. No percentage here. */
  exams?: TrainingExam[];
}) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <CircleBackButton href="/" label="Back to Home" />
      <header className="flex flex-col gap-0.5">
        <h1 className="type-page-title">Training</h1>
        <p className="type-small text-text-secondary">{guideName}</p>
      </header>

      {resume && (
        <Link
          href="/session"
          className="flex min-h-16 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="type-body-strong">Continue your session</span>
            <span className="type-small text-text-secondary">{resume}</span>
          </span>
          <Chevron />
        </Link>
      )}

      {exams.length > 0 && (
        <section aria-labelledby="training-exams" className="flex flex-col gap-3">
          <h2 id="training-exams" className="type-label text-text-secondary">
            Exams
          </h2>
          <ul className="flex flex-col gap-3">
            {exams.map((exam) => (
              <li key={exam.id}>
                <Link
                  href={`/exam?id=${encodeURIComponent(exam.id)}`}
                  className="flex min-h-16 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="type-body-strong">{exam.title}</span>
                    <Chip tone="sand" size="caption">
                      <Clock size={14} strokeWidth={2} aria-hidden="true" />
                      {exam.deadline.label}
                    </Chip>
                  </span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section
        aria-label="Your progress"
        className="flex items-center gap-4 rounded-[28px] bg-card p-5 shadow-(--card-shadow)"
      >
        <StatTile icon={ListChecks} label="Questions" value={`${stats.answered}/${stats.total}`} />
        <span aria-hidden="true" className="h-10 w-px shrink-0 bg-border" />
        <StatTile icon={Target} label="Correct" value={`${stats.correct}/${stats.answered}`} />
      </section>

      <SegmentedControl
        name="training-mode"
        legend="Mode"
        hideLegend
        options={[
          { value: "scenario", label: "Scenario" },
          { value: "quiz", label: "Quiz" },
        ]}
        value={mode}
        onChange={onModeChange}
      />

      {mode === "quiz" && (
        <Link
          href={miniQuizPath}
          className="flex min-h-16 items-center gap-3 rounded-card bg-card p-4 shadow-(--card-shadow) has-focus-visible:outline-2"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="type-body-strong">Mini-quiz</span>
            <span className="type-small text-text-secondary">
              Choose topics and 5, 10 or 15 questions
            </span>
          </span>
          <Chevron />
        </Link>
      )}

      {topics.map((topic) => (
        <section
          key={topic.sectionId}
          aria-labelledby={`topic-${topic.sectionId}`}
          className="flex flex-col rounded-card bg-card shadow-(--card-shadow)"
        >
          <header className="flex items-center gap-3 p-4">
            <span
              aria-hidden="true"
              className="type-small flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-olive-tint tabular-nums"
            >
              {topic.sectionId.slice(1)}
            </span>
            <h2
              id={`topic-${topic.sectionId}`}
              className="type-label min-w-0 flex-1 text-text-secondary"
            >
              <span className="sr-only">{topic.sectionId} </span>
              {topic.title}
            </h2>
            {topic.toRepeat > 0 && (
              <Chip tone="olive" size="caption">
                {topic.toRepeat} to repeat
              </Chip>
            )}
          </header>
          <ul className="flex flex-col border-t border-border">
            {topic.parts.map(({ part, state, recommended }, index) => {
              const ring = partRing(part, records);
              return (
                <li key={part.id} className={index > 0 ? "border-t border-border" : ""}>
                  <button
                    type="button"
                    onClick={() => onStartPart(part)}
                    className="flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-surface-muted"
                  >
                    <span className="flex flex-col">
                      <span className="type-body-strong">Part {part.n}</span>
                      <span className="type-small text-text-secondary">
                        {questionCountLabel(part.itemIds.length)}
                      </span>
                    </span>
                    {recommended ? (
                      <span
                        data-pill
                        className={buttonClasses({ variant: "primary", pill: true, wide: false })}
                      >
                        {state === "in progress" ? "Continue" : "Start"}
                      </span>
                    ) : (
                      <Ring
                        percent={ring.percent}
                        text={`${ring.correct}/${part.itemIds.length}`}
                        check={ring.passed}
                        muted={!ring.started}
                        label={
                          ring.started
                            ? `Part ${part.n}: ${ring.correct} of ${part.itemIds.length} correct last time`
                            : `Part ${part.n}: not started`
                        }
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
