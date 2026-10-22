"use client";

import { Bell, Check, Clock, Flag, Repeat, Award } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { StatusPill } from "@/components/InstructorExams/ExamParts";
import { DeltaPill } from "@/components/InstructorOverview/OverviewBlocks";
import { statusChipLook, InitialsAvatar } from "@/components/InstructorStudents/StudentRow";
import { ReviewTag, TopicBadge } from "@/components/InstructorTopics/TopicsView";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { DEMO_NOTE } from "@/lib/cohort";
import { PASS_MARK } from "@/lib/config";
import { rosterLine } from "@/lib/exam-detail";
import {
  fieldLabel,
  lastActiveLong,
  profileStatus,
  readinessChange,
  readinessOf,
  topicNeedsReview,
} from "@/lib/students";
import type { StudentExamRow, StudentProfile } from "@/lib/students";

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
 * screen, with the weekly change), BY TOPIC (80px cards, not tappable), EXAMS (hairline rows; only a
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
  const status = profileStatus(profile);
  const [confirming, setConfirming] = useState(confirmingInitially);
  const dot = statusChipLook[status].tone;
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand title="Student detail" back={{ label: backLabel, href: backHref }} />
      <p role="status" data-message className="type-body text-center not-empty:py-1">
        {sentMessage}
      </p>

      <section
        data-student-header
        className={`${card} flex items-center gap-4 p-[var(--gutter,1rem)]`}
      >
        <span className="relative flex shrink-0">
          <InitialsAvatar initials={profile.participant.initials} size={64} />
          <span
            aria-hidden="true"
            data-status-dot={status}
            className={`absolute right-0 bottom-0 h-4 w-4 rounded-full border-2 border-card ${dot}`}
          />
        </span>
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
          {change !== null && <DeltaPill delta={change} />}
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

      <section aria-labelledby="student-topics" className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="student-topics" className="type-label text-text-secondary">
            BY TOPIC
          </h2>
          <span className="type-small text-text-secondary">{profile.topics.length} topics</span>
        </div>
        <ul className="flex flex-col gap-3">
          {profile.topics.map((row) => {
            const review = topicNeedsReview(row);
            const passed = row.answered > 0 && !review;
            return (
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
                {review && (
                  <span data-needs-review>
                    <ReviewTag />
                  </span>
                )}
                {passed && (
                  <span
                    data-on-track
                    role="img"
                    aria-label="At or above the pass mark"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success-ink"
                  >
                    <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

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
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="type-body-strong truncate">{row.exam.title}</span>
                    <StatusPill kind={row.status.kind} />
                    {href && (
                      <Award
                        data-certificate-badge
                        size={16}
                        strokeWidth={2}
                        aria-label="Certificate"
                        className="shrink-0 text-status-success-ink"
                      />
                    )}
                  </span>
                  <span className="type-small truncate text-text-secondary">
                    {rosterLine(row.status, now)}
                  </span>
                </span>
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
      <p className="text-text-secondary">This student is not in your groups.</p>
      <ButtonLink href="/instructor/students" variant="secondary">
        Back to students
      </ButtonLink>
    </div>
  );
}
