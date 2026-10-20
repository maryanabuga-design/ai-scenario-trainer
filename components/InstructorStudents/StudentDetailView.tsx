import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { ExamStatusLine } from "@/components/InstructorStudents/ExamStatusLine";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ReadinessBar } from "@/components/ReadinessBar/ReadinessBar";
import { stepsCard } from "@/components/StepsView/StepCard";
import { DEMO_NOTE, GROUP_NAME } from "@/lib/cohort";
import { PASS_MARK } from "@/lib/config";
import { fieldLabel, readinessOf, statusDetail, topicNeedsReview } from "@/lib/students";
import type { StudentExamRow, StudentProfile } from "@/lib/students";

/**
 * The Student detail of the Instructor (DESIGN.md: Instructor, Students): READ-ONLY. The band with Back
 * and the name, the readiness card (the ONE percentage of the screen), the "By topic" cards of Progress
 * (80px, not tappable, no chevron), and the Exams rows of 72px.
 */
export function StudentDetailView({
  profile,
  backHref,
  backLabel,
  rows,
  titleOf,
  certificateHref,
}: {
  profile: StudentProfile;
  backHref: string;
  backLabel: string;
  rows: StudentExamRow[];
  titleOf: (id: string) => string;
  /** The read-only certificate of an exam result, when there is one. */
  certificateHref: (row: StudentExamRow) => string | null;
}) {
  const readiness = readinessOf(profile);
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title={profile.participant.name}
        subtitle={
          <span className="type-body">
            {fieldLabel(profile.field)} · {GROUP_NAME}
          </span>
        }
        back={{ label: backLabel, href: backHref }}
      />

      <section
        aria-labelledby="student-readiness"
        className="flex flex-col gap-4 rounded-card bg-card p-4 shadow-(--card-shadow)"
      >
        <h2 id="student-readiness" className="type-item-title">
          Readiness
        </h2>
        <p className="type-numeral tabular-nums" data-readiness-number>
          Readiness {readiness}%
        </p>
        <ReadinessBar percent={readiness} markText={String(PASS_MARK)} />
        <p data-pass-mark className="type-body">
          Pass mark: {PASS_MARK}
        </p>
      </section>

      <section aria-labelledby="student-topics" className="flex flex-col gap-4">
        <h2 id="student-topics" className="type-item-title">
          By topic
        </h2>
        <ul className="flex flex-col gap-3">
          {profile.topics.map((row) => {
            const share = row.total === 0 ? 0 : (row.correct / row.total) * 100;
            const review = topicNeedsReview(row);
            return (
              <li
                key={row.sectionId}
                data-topic-row={row.sectionId}
                className={`${stepsCard} flex h-[var(--list-card-height,80px)] items-center gap-3 px-[var(--gutter,1rem)]`}
              >
                <span
                  aria-hidden="true"
                  className="type-caption flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
                >
                  {row.sectionId}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span data-topic-title className="type-body truncate">
                    <span className="sr-only">{row.sectionId} </span>
                    {titleOf(row.sectionId)}
                  </span>
                  <span className="type-small flex items-center gap-1.5 text-text-secondary tabular-nums">
                    {row.correct} of {row.total} correct
                    {review && (
                      <span
                        data-needs-review
                        className="flex shrink-0 items-center gap-1 text-status-attention-ink"
                      >
                        <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
                        Needs review
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="h-1.5 overflow-hidden rounded-full bg-secondary-sand"
                  >
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="student-exams" className="flex flex-col gap-3">
        <h2 id="student-exams" className="type-item-title">
          Exams
        </h2>
        <ul className="flex flex-col gap-2">
          {rows.map((row) => {
            const href = certificateHref(row);
            const body = (
              <>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-body-strong truncate">{row.exam.title}</span>
                  <ExamStatusLine status={row.status} text={statusDetail(row.status)} />
                </span>
                {href && <Chevron />}
              </>
            );
            const classes =
              "flex h-[72px] items-center gap-3 rounded-card bg-card px-4 shadow-(--card-shadow)";
            return (
              <li key={row.exam.id} data-exam-row={row.exam.id} data-status={row.status.kind}>
                {href ? (
                  <Link href={href} className={`${classes} has-focus-visible:outline-2`}>
                    {body}
                  </Link>
                ) : (
                  <div className={classes}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>
    </div>
  );
}

/** The friendly screen for an unknown student. */
export function StudentNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">Student not found</h1>
      <p className="text-text-secondary">This student is not in Group A.</p>
      <ButtonLink href="/instructor/students" variant="secondary">
        Back to students
      </ButtonLink>
    </div>
  );
}
