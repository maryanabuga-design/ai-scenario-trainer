"use client";

import { Award, CalendarClock, ClipboardList, FileText, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { IconTile } from "@/components/IconTile/IconTile";
import { ExamCard } from "@/components/InstructorExams/ExamCard";
import { ProfileAvatar } from "@/components/ProfileAvatar/ProfileAvatar";
import { stepsCard } from "@/components/StepsView/StepCard";
import { TileIcon } from "@/components/TileIcon/TileIcon";
import { DEMO_NOTE, GROUP_NAME } from "@/lib/cohort";
import type { GroupCounts } from "@/lib/cohort";
import { ALL_CAUGHT_UP } from "@/lib/actions";
import type { Action, ActionKind } from "@/lib/actions";
import type { GroupExam } from "@/lib/group-exams";
import { deltaLine, groupDelta, groupReadiness } from "@/lib/overview";
import type { TopicStanding } from "@/lib/overview";
import { groupLine, notStartedCount } from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

export const NO_ACTIVE_EXAM = "No active exam";

const actionIcons: Record<ActionKind, LucideIcon> = {
  "exam-not-started": CalendarClock,
  "needs-attention": RotateCcw,
  "draft-set": FileText,
  "no-exam": ClipboardList,
};

/** The address of Assign exam with the weakest topic chosen (the title is prefilled from it). */
export const assignOnTopicHref = (topicId: string) =>
  `/instructor/exams/new?topic=${topicId}&from=overview`;

/**
 * The Instructor Overview as an action dashboard (DESIGN.md: Instructor, action dashboard): the
 * avatar header, the group readiness with its weekly delta (the ONE percentage), "Needs your action"
 * (up to three rows, or "All caught up"), the nearest active exam and the weakest topic with a way to
 * act on it. At most one Primary button on the screen.
 */
export function InstructorOverviewView({
  name,
  list,
  actions,
  exam,
  counts,
  weakest,
  topicTitle,
}: {
  name: string;
  /** The profiles of all participants. */
  list: StudentProfile[];
  actions: Action[];
  /** The nearest Active exam and its group counts, or null without one. */
  exam: GroupExam | null;
  counts: GroupCounts | null;
  /** The weakest topic, or null without data (the section is then hidden). */
  weakest: TopicStanding | null;
  topicTitle: (id: string) => string;
}) {
  const delta = groupDelta(list);
  return (
    <div className="flex flex-col gap-6 pb-4">
      <header className="flex flex-col gap-1 pt-1">
        <div className="flex items-center gap-3">
          <ProfileAvatar />
          <h1 className="type-page-title min-w-0 flex-1 truncate">Hi, {name}</h1>
        </div>
        <p className="type-body text-text-secondary">Here is how {GROUP_NAME} is doing.</p>
      </header>

      <section
        aria-labelledby="group-readiness"
        data-group-readiness
        className={`${stepsCard} flex min-h-[var(--list-card-height,80px)] flex-col justify-center gap-0.5 px-[var(--gutter,1rem)] py-2`}
      >
        <h2 id="group-readiness" className="type-numeral tabular-nums">
          Group readiness {groupReadiness(list)}%
        </h2>
        <p data-group-line className="type-small text-text-secondary">
          {groupLine(GROUP_NAME, list.length, notStartedCount(list))}
        </p>
        {delta !== null && (
          <p
            data-delta
            className={`type-small ${delta < 0 ? "text-status-attention-ink" : "text-text-secondary"}`}
          >
            {deltaLine(delta)}
          </p>
        )}
      </section>

      <section aria-labelledby="actions-title" className="flex flex-col gap-3">
        <h2 id="actions-title" className="type-label text-text-secondary">
          NEEDS YOUR ACTION
        </h2>
        {actions.length === 0 ? (
          <div
            data-all-caught-up
            className="flex h-[72px] items-center gap-3 rounded-card bg-card px-3 shadow-(--card-shadow)"
          >
            <IconTile tone="success" className="h-9 w-9 rounded-full">
              <Award size={18} strokeWidth={1.75} />
            </IconTile>
            <p className="type-body-strong">{ALL_CAUGHT_UP}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {actions.map((action) => (
              <li key={action.kind}>
                <Link
                  href={action.href}
                  data-action={action.kind}
                  className="flex h-[72px] items-center gap-3 rounded-card bg-card px-3 shadow-(--card-shadow) has-focus-visible:outline-2"
                >
                  <TileIcon icon={actionIcons[action.kind]} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="type-body-strong line-clamp-2 leading-snug">
                      {action.title}
                    </span>
                    <span className="type-small truncate text-text-secondary">{action.reason}</span>
                  </span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="exams-title" className="flex flex-col gap-3">
        <h2 id="exams-title" className="type-label text-text-secondary">
          EXAMS
        </h2>
        {exam && counts ? (
          <>
            <ExamCard
              exam={exam}
              passed={counts.certified}
              total={counts.total}
              notStarted={counts.notStarted}
              from="overview"
            />
            <ButtonLink href="/instructor/exams/new?from=overview" variant="secondary">
              Assign exam
            </ButtonLink>
          </>
        ) : (
          <div
            data-no-exam
            className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-(--card-shadow)"
          >
            <div className="flex items-center gap-3">
              <IconTile className="h-10 w-10 rounded-full">
                <ClipboardList size={20} strokeWidth={2} />
              </IconTile>
              <p className="type-body-strong">{NO_ACTIVE_EXAM}</p>
            </div>
            <ButtonLink href="/instructor/exams/new?from=overview">Assign exam</ButtonLink>
          </div>
        )}
      </section>

      {weakest && (
        <section aria-labelledby="weakest-title" className="flex flex-col gap-3">
          <h2 id="weakest-title" className="type-label text-text-secondary">
            WEAKEST TOPIC
          </h2>
          <div
            data-weakest-topic={weakest.sectionId}
            className={`${stepsCard} flex h-[var(--list-card-height,80px)] items-center gap-3 px-[var(--gutter,1rem)]`}
          >
            <span
              aria-hidden="true"
              className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
            >
              {weakest.sectionId}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="type-body truncate">
                <span className="sr-only">{weakest.sectionId} </span>
                {topicTitle(weakest.sectionId)}
              </span>
              <span className="type-small line-clamp-2 leading-snug text-text-secondary tabular-nums">
                {weakest.passing} of {weakest.total} students at or above the pass mark
              </span>
            </span>
          </div>
          <ButtonLink href={assignOnTopicHref(weakest.sectionId)} variant="secondary">
            Assign exam on this topic
          </ButtonLink>
          <div className="-ml-3 self-start">
            <ButtonLink href="/instructor/topics" variant="tertiary">
              All topics
            </ButtonLink>
          </div>
        </section>
      )}

      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}
