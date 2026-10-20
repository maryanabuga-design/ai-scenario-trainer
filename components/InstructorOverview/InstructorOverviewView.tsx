"use client";

import Link from "next/link";
import { ClipboardList, Award } from "lucide-react";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { IconTile } from "@/components/IconTile/IconTile";
import { ExamCard } from "@/components/InstructorExams/ExamCard";
import { stepsCard } from "@/components/StepsView/StepCard";
import { DEMO_NOTE, GROUP_NAME } from "@/lib/cohort";
import type { GroupCounts } from "@/lib/cohort";
import type { GroupExam } from "@/lib/group-exams";
import { groupReadiness, needsAttention, weakestTopics } from "@/lib/overview";
import { groupLine, topicsToReview } from "@/lib/students";
import type { StudentProfile } from "@/lib/students";

export const ALL_ON_TRACK = "Everyone is on track";
export const NO_ACTIVE_EXAM = "No active exam";

/** The address of a student opened from the Overview, so Back returns there. */
export const overviewStudentHref = (id: string) =>
  `/instructor/students/${encodeURIComponent(id)}?from=overview`;

/**
 * The Instructor Overview (DESIGN.md: Instructor, Overview and consistency): the greeting header like Student
 * Home, the group readiness card (the ONE percentage), up to three students who need attention,
 * the three weakest topics (data, no chevron) and the nearest active exam. Read-only except for the
 * links; at most one Primary button on the screen.
 */
export function InstructorOverviewView({
  name,
  list,
  exam,
  counts,
  titleOf,
}: {
  name: string;
  /** The profiles of all participants. */
  list: StudentProfile[];
  /** The nearest Active exam and its group counts, or null without one. */
  exam: GroupExam | null;
  counts: GroupCounts | null;
  titleOf: (id: string) => string;
}) {
  const attention = needsAttention(list);
  const weakest = weakestTopics(list);

  return (
    <div className="flex flex-col gap-6 pb-4">
      <header className="flex flex-col gap-1 pt-1">
        <h1 className="type-page-title truncate">Hi, {name}</h1>
        <p className="type-body text-text-secondary">Here is how {GROUP_NAME} is doing.</p>
      </header>

      <section
        aria-labelledby="group-readiness"
        data-group-readiness
        className={`${stepsCard} flex h-[var(--list-card-height,80px)] flex-col justify-center gap-0.5 px-[var(--gutter,1rem)]`}
      >
        <h2 id="group-readiness" className="type-numeral tabular-nums">
          Group readiness {groupReadiness(list)}%
        </h2>
        <p data-group-line className="type-small text-text-secondary">
          {groupLine(GROUP_NAME, list.length)}
        </p>
      </section>

      <section aria-labelledby="needs-title" className="flex flex-col gap-3">
        <h2 id="needs-title" className="type-label text-text-secondary">
          NEEDS ATTENTION
        </h2>
        {attention.shown.length === 0 ? (
          <div
            data-on-track
            className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)"
          >
            <IconTile tone="success" className="h-10 w-10 rounded-full">
              <Award size={20} strokeWidth={2} />
            </IconTile>
            <p className="type-body-strong">{ALL_ON_TRACK}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {attention.shown.map((profile) => (
              <li key={profile.participant.id}>
                <Link
                  href={overviewStudentHref(profile.participant.id)}
                  data-attention={profile.participant.id}
                  className="flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow) has-focus-visible:outline-2"
                >
                  <span
                    aria-hidden="true"
                    className="type-body-strong flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary"
                  >
                    {profile.participant.initials}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="type-body-strong truncate">{profile.participant.name}</span>
                    <span className="type-small truncate text-text-secondary">
                      {topicsToReview(profile)} {topicsToReview(profile) === 1 ? "topic" : "topics"}{" "}
                      to review
                    </span>
                  </span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {attention.total > attention.shown.length && (
          <div className="-ml-3 self-start">
            <ButtonLink href="/instructor/students?filter=needs" variant="tertiary">
              See all ({attention.total})
            </ButtonLink>
          </div>
        )}
      </section>

      {weakest.length > 0 && (
        <section aria-labelledby="weakest-title" className="flex flex-col gap-3">
          <h2 id="weakest-title" className="type-label text-text-secondary">
            WEAKEST TOPICS
          </h2>
          <ul className="flex flex-col gap-3">
            {weakest.map((topic) => (
              <li
                key={topic.sectionId}
                data-weak-topic={topic.sectionId}
                className={`${stepsCard} flex h-[var(--list-card-height,80px)] items-center gap-3 px-[var(--gutter,1rem)]`}
              >
                <span
                  aria-hidden="true"
                  className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
                >
                  {topic.sectionId}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body truncate">
                    <span className="sr-only">{topic.sectionId} </span>
                    {titleOf(topic.sectionId)}
                  </span>
                  <span className="type-small truncate text-text-secondary tabular-nums">
                    {topic.passing} of {topic.total} students answered correctly
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="exams-title" className="flex flex-col gap-3">
        <h2 id="exams-title" className="type-label text-text-secondary">
          EXAMS
        </h2>
        {exam && counts ? (
          <>
            <ExamCard exam={exam} passed={counts.certified} total={counts.total} from="overview" />
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

      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}
