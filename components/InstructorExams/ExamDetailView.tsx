"use client";

import {
  Award,
  Lock,
  ListChecks,
  LockKeyhole,
  RotateCw,
  Shield,
  Star,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { DataTable } from "@/components/DataTable/DataTable";
import type { Column } from "@/components/DataTable/DataTable";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { DropdownMenu } from "@/components/DropdownMenu/DropdownMenu";
import { FlashNotice } from "@/components/FlashNotice/FlashNotice";
import { statusLabel } from "@/components/InstructorExams/ExamParts";
import { InitialsAvatar } from "@/components/InitialsAvatar/InitialsAvatar";
import { StatusChip, examTone } from "@/components/StatusChip/StatusChip";
import { StatusRow } from "@/components/StatusRow/StatusRow";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { TipNote } from "@/components/TipNote/TipNote";
import { triedCount } from "@/lib/cohort";
import type { ExamStatus, GroupCounts, StudentRow } from "@/lib/cohort";
import {
  closedLine,
  detailRulesLine,
  hasNoAttempts,
  rosterLine,
  triedLine,
  wrongLine,
} from "@/lib/exam-detail";
import type { HardQuestion } from "@/lib/exam-detail";
import { shortDate, topicsLine } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { groupNames, groups } from "@/lib/groups";
import { studentsCount } from "@/lib/overview";

export const EXAM_DETAIL_SUBTITLE = "Results by student and the hardest questions.";
export const EXAM_DETAIL_SUBTITLE_EMPTY = "Results will appear here once students start.";
export const NO_RESULTS_LINE = "No results yet. They appear when students start the exam.";

export type DetailDialog = "remind" | "close" | null;

/** From 1024px the info card is the left column, 380px wide, sticky at the top beside the students. */
const infoColumn = "idesk:sticky idesk:top-6 idesk:col-start-1 idesk:row-span-2 idesk:row-start-2";

type ExamTableRow = {
  id: string;
  name: string;
  initials: string;
  href: string;
  status: ExamStatus;
};

/** The order of the Status column: the ones that need a look first, Passed last. */
const statusOrder: Record<ExamStatus["kind"], number> = {
  "not-passed": 0,
  "in-progress": 1,
  "not-started": 2,
  missed: 3,
  passed: 4,
};

const percentOf = (status: ExamStatus) =>
  status.kind === "passed" || status.kind === "not-passed"
    ? Math.round((status.correct * 100) / status.total)
    : null;

const dash = <span className="text-text-secondary">—</span>;

/** The columns of the desktop table of the exam's students (only what the status has). */
const examColumns: Column<ExamTableRow>[] = [
  {
    id: "status",
    header: "Status",
    width: "180px",
    sortValue: ({ status }) => statusOrder[status.kind],
    cell: ({ status }) => (
      <StatusChip tone={examTone[status.kind]} value={status.kind}>
        {statusLabel[status.kind]}
      </StatusChip>
    ),
  },
  {
    id: "result",
    header: "Result",
    width: "140px",
    align: "right",
    sortValue: ({ status }) => percentOf(status) ?? -1,
    cell: ({ status }) => {
      const percent = percentOf(status);
      if (percent === null || (status.kind !== "passed" && status.kind !== "not-passed"))
        return dash;
      return (
        <span className="flex flex-col items-end">
          <span className="type-body-strong">{percent}%</span>
          <span className="text-text-secondary">
            {status.correct} of {status.total}
          </span>
        </span>
      );
    },
  },
  {
    id: "attempts",
    header: "Attempts",
    width: "110px",
    align: "right",
    sortValue: ({ status }) =>
      status.kind === "passed" || status.kind === "not-passed"
        ? status.attempts
        : status.kind === "in-progress"
          ? status.attempt
          : 0,
    cell: ({ status }) =>
      status.kind === "passed" || status.kind === "not-passed"
        ? status.attempts
        : status.kind === "in-progress"
          ? status.attempt
          : dash,
  },
];

const card = "rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)";

/** The soft status pill at the top: "Active · Due 23 Oct", or "Closed 12 Oct" with "Final results" and a lock. */
function StatePill({
  exam,
  active,
  header = false,
}: {
  exam: GroupExam;
  active: boolean;
  /** The copy in the desktop header: it has no hook of its own and the one below the header is hidden. */
  header?: boolean;
}) {
  return (
    <div className={header ? "flex items-center gap-3" : "flex items-center gap-3 idesk:hidden"}>
      <span
        {...(header ? {} : { "data-state-pill": active ? "active" : "closed" })}
        className="type-small-strong inline-flex items-center gap-2 rounded-full bg-secondary-sand px-3 py-1.5"
      >
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
        {active ? `Active · Due ${shortDate(exam.deadline)}` : closedLine(exam)}
      </span>
      {!active && (
        <>
          <span className="type-small min-w-0 flex-1 text-text-secondary">Final results</span>
          <Lock
            size={18}
            strokeWidth={2}
            aria-hidden="true"
            className="shrink-0 text-text-secondary"
          />
        </>
      )}
    </div>
  );
}

/** A count tile: the count in large type and its word; counts only. */
function CountTile({
  kind,
  label,
  count,
  tone = "neutral",
  icon: Icon,
}: {
  kind: string;
  label: string;
  count: number;
  tone?: "success" | "attention" | "neutral";
  icon?: LucideIcon;
}) {
  const look =
    tone === "success"
      ? "bg-status-success-bg text-status-success-ink"
      : tone === "attention"
        ? "bg-status-attention-bg text-status-attention-ink"
        : "bg-secondary-sand text-text";
  return (
    <div
      data-count={kind}
      className={`flex min-w-0 flex-col items-start gap-1 rounded-[14px] p-3 ${look}`}
    >
      {Icon && <Icon size={16} strokeWidth={2} aria-hidden="true" />}
      <span className="type-card-title tabular-nums">{count}</span>
      <span className="type-caption truncate">{label}</span>
    </div>
  );
}

function Spec({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <li className="type-small flex min-w-0 items-center gap-2">
      <Icon size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-text-secondary" />
      <span className="truncate">{text}</span>
    </li>
  );
}

/**
 * The Exam detail of the Instructor (DESIGN.md: Instructor, Exams rebuilt): the state pill, the
 * summary card (Active: topics, groups, rules, the "3 of 14 tried" bar and four count tiles;
 * Closed: group, title, specs box and Passed, Not passed, Missed), the STUDENTS roster with
 * status badges, HARDEST QUESTIONS, the "..." menu and the pinned "Send reminder". Counts only, never a percentage.
 */
export function ExamDetailView({
  exam,
  active,
  now,
  counts,
  rows,
  hardest,
  titleOf,
  dialog,
  onAskRemind,
  onRemind,
  onAskClose,
  onClose,
  onCancelDialog,
  onExtend,
  onDuplicate,
  fromOverview = false,
  dialogInline = false,
  menuOpen = false,
}: {
  exam: GroupExam;
  active: boolean;
  now: number;
  counts: GroupCounts;
  rows: StudentRow[];
  hardest: HardQuestion[];
  titleOf: (id: string) => string;
  dialog: DetailDialog;
  onAskRemind: () => void;
  onRemind: () => void;
  onAskClose: () => void;
  onClose: () => void;
  onCancelDialog: () => void;
  /** The menu items that open another screen. */
  onExtend: () => void;
  onDuplicate: () => void;
  /** Opened from the Overview: Back returns there. */
  fromOverview?: boolean;
  dialogInline?: boolean;
  /** For the review page: the "..." menu drawn open. */
  menuOpen?: boolean;
}) {
  const tried = triedCount(counts);
  // an Active exam nobody has started shows no results at all, only who it is assigned to
  const empty = hasNoAttempts(counts, active);
  const reminderText = `Reminder: ${exam.title} is due ${shortDate(exam.deadline)}. You have not started this exam yet.`;
  const examGroups = exam.groupIds.map((id) => groups.find((g) => g.id === id)?.name ?? id);
  return (
    <div className="flex flex-col gap-4 pb-4 idesk:grid idesk:grid-cols-[380px_minmax(0,1fr)] idesk:items-start idesk:gap-x-6 idesk:gap-y-6">
      <PageHeaderBand
        title={exam.title}
        meta={<StatePill exam={exam} active={active} header />}
        subtitle={
          <span className="text-text-secondary">
            {empty ? EXAM_DETAIL_SUBTITLE_EMPTY : EXAM_DETAIL_SUBTITLE}
          </span>
        }
        back={
          fromOverview
            ? { label: "Back to Overview", href: "/instructor" }
            : { label: "Back to Exams", href: "/instructor/exams" }
        }
        action={
          <DropdownMenu
            label="More actions"
            initiallyOpen={menuOpen}
            items={
              active
                ? [
                    { id: "extend", label: "Extend deadline", onSelect: onExtend },
                    { id: "duplicate", label: "Duplicate exam", onSelect: onDuplicate },
                    {
                      id: "close",
                      label: "Close exam now",
                      destructive: true,
                      dividerAbove: true,
                      onSelect: onAskClose,
                    },
                  ]
                : [{ id: "duplicate", label: "Duplicate exam", onSelect: onDuplicate }]
            }
          />
        }
      />
      <FlashNotice />

      <StatePill exam={exam} active={active} />

      {active ? (
        <section
          data-summary="active"
          className={`${card} flex flex-col gap-4 p-[var(--gutter,1rem)] ${infoColumn}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <p className="type-label text-text-secondary">TOPICS</p>
              <p data-topics className="type-card-title">
                {topicsLine(exam.topicIds, titleOf)}
              </p>
            </div>
          </div>
          <div data-group-pills className="flex flex-wrap gap-2">
            {examGroups.map((name) => (
              <Chip key={name} tone="sand" size="caption">
                <UsersRound size={14} strokeWidth={2} aria-hidden="true" />
                {name}
              </Chip>
            ))}
          </div>
          <p data-rules className="type-small text-text-secondary">
            {detailRulesLine(exam)}
          </p>
          {empty ? (
            <TipNote noteId="no-results">{NO_RESULTS_LINE}</TipNote>
          ) : (
            <>
              <div className="flex flex-col gap-2 rounded-[14px] bg-secondary-sand p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="type-label text-text-secondary">COMPLETION</span>
                  <span data-tried className="type-small-strong">
                    {triedLine(counts)}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className="h-1.5 overflow-hidden rounded-full bg-secondary-sand-pressed"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${counts.total === 0 ? 0 : (tried * 100) / counts.total}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 idesk:grid-cols-2">
                <CountTile kind="passed" label="Passed" count={counts.passed} />
                <CountTile kind="not-passed" label="Not passed" count={counts.notPassed} />
                <CountTile kind="in-progress" label="In progress" count={counts.inProgress} />
                <CountTile kind="not-started" label="Not started" count={counts.notStarted} />
              </div>
            </>
          )}
        </section>
      ) : (
        <section
          data-summary="closed"
          className={`${card} flex flex-col gap-4 p-[var(--gutter,1rem)] ${infoColumn}`}
        >
          <p data-group-label className="type-label flex items-center gap-2 text-text-secondary">
            <Shield size={16} strokeWidth={2} aria-hidden="true" />
            {groupNames(exam.groupIds).toUpperCase()}
          </p>
          <p data-exam-title className="type-card-title">
            {exam.title}
          </p>
          <p data-topics className="type-small text-text-secondary">
            {topicsLine(exam.topicIds, titleOf)}
          </p>
          <ul
            data-specs
            className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-[14px] bg-secondary-sand p-3 idesk:grid-cols-1"
          >
            <Spec
              icon={ListChecks}
              text={`${exam.questionCount} questions · ${exam.timeLimit} min`}
            />
            <Spec icon={Star} text={`Pass mark ${exam.passMark}%`} />
            <Spec
              icon={RotateCw}
              text={
                exam.attemptsAllowed === null
                  ? "Unlimited attempts"
                  : `Max ${exam.attemptsAllowed} attempts`
              }
            />
            <Spec icon={UsersRound} text={`${counts.total} assigned`} />
          </ul>
          <div className="grid grid-cols-3 gap-2">
            <CountTile
              kind="passed"
              label="Passed"
              count={counts.passed}
              tone="success"
              icon={Award}
            />
            <CountTile
              kind="not-passed"
              label="Not passed"
              count={counts.notPassed}
              tone="attention"
              icon={RotateCw}
            />
            <CountTile kind="missed" label="Missed" count={counts.missed} icon={LockKeyhole} />
          </div>
        </section>
      )}

      <section
        aria-labelledby="students-title"
        className="flex flex-col gap-3 idesk:col-start-2 idesk:row-start-2"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="students-title" className="type-label text-text-secondary">
            STUDENTS
          </h2>
          <span data-student-count className="type-small text-text-secondary">
            {studentsCount(rows.length)}
          </span>
        </div>
        <DataTable
          label="Students"
          dataAttribute="data-exam-table"
          columns={empty ? [] : examColumns}
          rows={rows.map(({ participant, status }) => ({
            id: participant.id,
            name: participant.name,
            initials: participant.initials,
            href: `/instructor/students/${encodeURIComponent(participant.id)}?from=exam&exam=${exam.id}`,
            status,
          }))}
        />
        <ul className={`${card} divide-y divide-soft-divider idesk:hidden`}>
          {rows.map(({ participant, status }) => (
            <li key={participant.id} data-student-row={participant.id} data-status={status.kind}>
              <Link
                href={`/instructor/students/${encodeURIComponent(participant.id)}?from=exam&exam=${exam.id}`}
                data-student={participant.id}
                className="flex min-h-[72px] items-center gap-3 px-[var(--gutter,1rem)] py-3 has-focus-visible:outline-2"
              >
                <InitialsAvatar initials={participant.initials} />
                {empty ? (
                  <span data-roster-name className="type-body-strong min-w-0 flex-1 truncate">
                    {participant.name}
                  </span>
                ) : (
                  <StatusRow
                    name={participant.name}
                    chip={
                      <StatusChip tone={examTone[status.kind]} value={status.kind}>
                        {statusLabel[status.kind]}
                      </StatusChip>
                    }
                    description={`${participant.local ? "Your demo account · " : ""}${rosterLine(status, now)}`}
                    after={
                      status.kind === "passed" && status.certificateId ? (
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
                )}
                <Chevron />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {!empty && hardest.length > 0 && (
        <section
          aria-labelledby="hardest-title"
          className="flex flex-col gap-3 idesk:col-start-2 idesk:row-start-3"
        >
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="hardest-title" className="type-label text-text-secondary">
              HARDEST QUESTIONS
            </h2>
            <span className="type-small text-text-secondary">Flagged for debrief</span>
          </div>
          <ul className="flex flex-col gap-3">
            {hardest.map((question) => (
              <li key={question.id}>
                <Link
                  href={`/instructor/exams/${exam.id}/questions/${question.number}`}
                  data-hard-question={question.number}
                  className={`${card} flex items-start gap-3 p-[var(--gutter,1rem)] has-focus-visible:outline-2`}
                >
                  <span
                    aria-hidden="true"
                    className="type-caption-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-secondary-sand"
                  >
                    Q{question.number}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="type-body-strong line-clamp-3">{question.text}</span>
                    <span className="type-small flex items-center gap-2 text-text-secondary">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full bg-status-attention-ink"
                      />
                      {wrongLine(question)}
                    </span>
                  </span>
                  <Chevron />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {active && counts.notStarted > 0 && (
        <ActionBar inHeader>
          <Button onClick={onAskRemind}>Send reminder</Button>
        </ActionBar>
      )}

      {(dialog === "remind" || !dialogInline) && (
        <ConfirmDialog
          open={dialog === "remind"}
          inline={dialogInline}
          title={`Remind ${studentsCount(counts.notStarted)}?`}
          description="They will get this message in their notifications."
          body={
            <p data-reminder-preview className="type-small rounded-[14px] bg-secondary-sand p-3">
              {reminderText}
            </p>
          }
          confirmLabel="Send reminder"
          onConfirm={onRemind}
          onCancel={onCancelDialog}
        />
      )}
      {(dialog === "close" || !dialogInline) && (
        <ConfirmDialog
          open={dialog === "close"}
          inline={dialogInline}
          title="Close this exam now?"
          description="Students will no longer be able to start it. Results stay available."
          confirmLabel="Close exam"
          cancelLabel="Keep open"
          onConfirm={onClose}
          onCancel={onCancelDialog}
        />
      )}
    </div>
  );
}

/** The friendly screen for an unknown or broken exam. */
export function ExamNotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="type-page-title">Exam not found</h1>
      <p className="text-text-secondary">It may have been removed from this browser.</p>
      <ButtonLink href="/instructor/exams" variant="secondary">
        Back to Exams
      </ButtonLink>
    </div>
  );
}
