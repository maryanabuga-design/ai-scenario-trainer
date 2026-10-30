"use client";

import { Bell, Clock, Flag, Repeat, Award } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { statusLabel } from "@/components/InstructorExams/ExamParts";
import { StatusChip, examTone } from "@/components/StatusChip/StatusChip";
import { StatusRow } from "@/components/StatusRow/StatusRow";
import { DeltaPill } from "@/components/InstructorOverview/OverviewBlocks";
import { InitialsAvatar } from "@/components/InstructorStudents/StudentRow";
import { TopicBadge } from "@/components/InstructorTopics/TopicsView";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { PASS_MARK } from "@/lib/config";
import { rosterLine } from "@/lib/exam-detail";
import {
  fieldLabel,
  lastActiveLong,
  readinessChange,
  readinessOf,
  topicNeedsReview,
} from "@/lib/students";
import type { StudentExamRow, StudentProfile } from "@/lib/students";

export const DETAIL_SUBTITLE = "Readiness and results for each topic.";

const card = "rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)";

/** "Practised 3 times this week", "Practised once this week", "No practice this week". */
export const practicedLine = (n: number) =>
  n === 0
    ? "No practice this week"
    : n === 1
      ? "Practised once this week"
      : `Practised ${n} times this week`;

/**
 * The Student detail of the Instructor (DESIGN.md: Instructor, Students rebuilt): READ-ONLY. Back and
 * the band "Student detail" (no avatar), the header card, READINESS (the ONE percentage of the
 * screen, with the week-over-week comparison), the topics in two groups NEEDS REVIEW and NOTHING TO REVIEW (80px cards, not tappable), EXAMS (hairline rows; only a
 * Passed row with a certificate opens it) and the Secondary "Send reminder" with its dialog.
 */
export function StudentDetailView({
  profile,
  groupName,
  now,
  backHref,
  backLabel,
  rows,
  titleOf,
  certificateHref,
  reminder,
  sentMessage = "",
  onSendReminder,
  confirmingInitially = false,
  dialogInline = false,
}: {
  profile: StudentProfile;
  groupName: string;
  now: number;
  backHref: string;
  backLabel: string;
  rows: StudentExamRow[];
  titleOf: (id: string) => string;
  /** The read-only certificate of an exam result, when there is one. */
  certificateHref: (row: StudentExamRow) => string | null;
  /** The reminder the Send reminder dialog would send (chosen from what the student has to do). */
  reminder: string;
  /** "Reminder sent to Ana", once it was sent. */
  sentMessage?: string;
  onSendReminder: () => void;
  confirmingInitially?: boolean;
  dialogInline?: boolean;
}) {
  const readiness = readinessOf(profile);
  const change = readinessChange(profile);
  const [confirming, setConfirming] = useState(confirmingInitially);
  // the topics in two groups, in their own order (an unpractised topic has nothing to review)
  const needsReview = profile.topics.filter(topicNeedsReview);
  const nothingToReview = profile.topics.filter((row) => !topicNeedsReview(row));
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title="Student detail"
        subtitle={<span className="text-text-secondary">{DETAIL_SUBTITLE}</span>}
        back={{ label: backLabel, href: backHref }}
      />
      <p role="status" data-message className="type-body text-center not-empty:py-1">
        {sentMessage}
      </p>

      <section
        data-student-header
        className={`${card} flex items-center gap-4 p-[var(--gutter,1rem)]`}
      >
        <InitialsAvatar initials={profile.participant.initials} size={64} />
        <div className="flex min-w-0 flex-col gap-1">
          <h2 data-student-name className="type-card-title truncate">
            {profile.participant.name}
          </h2>
          <p data-field-line className="type-small truncate text-text-secondary">
            {fieldLabel(profile.field)} · {groupName}
          </p>
          <p data-last-active className="type-small flex items-center gap-1.5 text-text-secondary">
            <Clock size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            {profile.lastActiveDaysAgo === null
              ? "No activity yet"
              : `Last active ${lastActiveLong(profile.lastActiveDaysAgo)}`}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="student-readiness"
        className={`${card} flex flex-col gap-3 p-[var(--gutter,1rem)]`}
      >
        <h2 id="student-readiness" className="type-label text-text-secondary">
          READINESS
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p data-readiness-number className="type-display tabular-nums">
            {readiness}%
          </p>
          {change !== null && <DeltaPill current={readiness} delta={change} />}
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-[14px] bg-secondary-sand p-3">
          <p data-pass-mark className="type-small flex items-center gap-2">
            <Flag
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-text-secondary"
            />
            <span>Pass mark: {PASS_MARK}</span>
          </p>
          <p data-practice className="type-small flex items-center gap-2">
            <Repeat
              size={16}
              strokeWidth={2}
              aria-hidden="true"
              className="shrink-0 text-text-secondary"
            />
            <span>{practicedLine(profile.practiceThisWeek)}</span>
          </p>
        </div>
      </section>

      {[
        { id: "review", label: "NEEDS REVIEW", rows: needsReview },
        { id: "clear", label: "NOTHING TO REVIEW", rows: nothingToReview },
      ]
        .filter((group) => group.rows.length > 0)
        .map((group) => (
          <section
            key={group.id}
            aria-labelledby={`student-topics-${group.id}`}
            data-topic-group={group.id}
            className="flex flex-col gap-3"
          >
            <h2 id={`student-topics-${group.id}`} className="type-label text-text-secondary">
              {group.label} · {group.rows.length}
            </h2>
            <ul className="flex flex-col gap-3">
              {group.rows.map((row) => (
                <li
                  key={row.sectionId}
                  data-topic-row={row.sectionId}
                  className={`${card} flex h-[var(--list-card-height,80px)] items-center gap-3 px-[var(--gutter,1rem)]`}
                >
                  <TopicBadge id={row.sectionId} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span data-topic-title className="type-body-strong truncate">
                      <span className="sr-only">{row.sectionId} </span>
                      {titleOf(row.sectionId)}
                    </span>
                    <span className="type-small text-text-secondary tabular-nums">
                      {row.answered === 0
                        ? "Not practised yet"
                        : `${row.correct} of ${row.answered} correct`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

      <section aria-labelledby="student-exams" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="student-exams" className="type-label text-text-secondary">
            EXAMS
          </h2>
          <span className="type-small text-text-secondary">{rows.length} total</span>
        </div>
        <ul className={`${card} divide-y divide-soft-divider`}>
          {rows.map((row) => {
            const href = certificateHref(row);
            const body = (
              <>
                <StatusRow
                  name={row.exam.title}
                  chip={
                    <StatusChip tone={examTone[row.status.kind]} value={row.status.kind}>
                      {statusLabel[row.status.kind]}
                    </StatusChip>
                  }
                  description={rosterLine(row.status, now)}
                  after={
                    href ? (
                      <Award
                        data-certificate-badge
                        size={16}
                        strokeWidth={2}
                        aria-label="Certificate"
                        className="shrink-0 text-status-success-ink"
                      />
                    ) : null
                  }
                />
                {href && <Chevron />}
              </>
            );
            const classes = "flex min-h-[72px] items-center gap-3 px-[var(--gutter,1rem)] py-3";
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

      <Button variant="secondary" icon={Bell} onClick={() => setConfirming(true)}>
        Send reminder
      </Button>

      {(confirming || !dialogInline) && (
        <ConfirmDialog
          open={confirming}
          inline={dialogInline}
          title={`Send a reminder to ${profile.participant.name}?`}
          description=""
          body={
            <p data-reminder-preview className="type-small rounded-[14px] bg-secondary-sand p-3">
              {reminder}
            </p>
          }
          confirmLabel="Send reminder"
          onConfirm={() => {
            setConfirming(false);
            onSendReminder();
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

/** The friendly screen for an unknown student. */
export function StudentNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">Student not found</h1>
      <p className="text-text-secondary">This student is not in your groups.</p>
      <ButtonLink href="/instructor/students" variant="secondary">
        Back to students
      </ButtonLink>
    </div>
  );
}
