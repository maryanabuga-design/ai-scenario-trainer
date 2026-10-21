"use client";

import { Award, CircleCheck, CircleDashed, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button, ButtonLink } from "@/components/Button/Button";
import { Card } from "@/components/Card/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { IconTile } from "@/components/IconTile/IconTile";
import { ExamLine, StudentListRow } from "@/components/InstructorStudents/StudentRow";
import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { DEMO_NOTE, statusText } from "@/lib/cohort";
import type { ExamStatus, GroupCounts, StudentRow } from "@/lib/cohort";
import { rulesLine, shortDate, topicsLine } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";

const statusLook: Record<
  ExamStatus["kind"],
  { icon: LucideIcon; ink: string; tone: "success" | "attention" | "neutral" }
> = {
  certified: {
    icon: CircleCheck,
    ink: "text-status-success-ink",
    tone: "success",
  },
  "not-passed": {
    icon: RotateCcw,
    ink: "text-status-attention-ink",
    tone: "attention",
  },
  "not-started": {
    icon: CircleDashed,
    ink: "text-text-secondary",
    tone: "neutral",
  },
};

function CountTile({
  kind,
  label,
  count,
  icon: Icon,
}: {
  kind: string;
  label: string;
  count: number;
  icon: LucideIcon;
}) {
  const tone = kind === "certified" ? "success" : kind === "not-passed" ? "attention" : "neutral";
  return (
    <div
      data-count={kind}
      className="flex flex-col gap-2 rounded-card bg-card p-3 shadow-(--card-shadow)"
    >
      <IconTile tone={tone} className="h-9 w-9 rounded-full">
        <Icon size={18} strokeWidth={1.75} />
      </IconTile>
      <span className="flex flex-col">
        <span className="type-card-title tabular-nums">{count}</span>
        <span className="type-small text-text-secondary">{label}</span>
      </span>
    </div>
  );
}

/**
 * The Exam detail of the Instructor (DESIGN.md: Instructor, Exam detail): the band with Back and the
 * title, a summary card with three count tiles, the student rows (72px, not tappable yet) and the
 * actions Remind and Close exam. Counts only, no percentages.
 */
export function ExamDetailView({
  exam,
  active,
  counts,
  rows,
  titleOf,
  message,
  confirmingClose,
  onRemind,
  onAskClose,
  onCancelClose,
  fromOverview = false,
  onClose,
  dialogInline = false,
}: {
  exam: GroupExam;
  active: boolean;
  counts: GroupCounts;
  rows: StudentRow[];
  titleOf: (id: string) => string;
  /** A short confirmation ("Exam assigned…", "Reminder sent to 5 students"). */
  message: string;
  confirmingClose: boolean;
  onRemind: () => void;
  onAskClose: () => void;
  onCancelClose: () => void;
  /** Opened from the Overview: Back returns there. */
  fromOverview?: boolean;
  onClose: () => void;
  dialogInline?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <PageHeaderBand
        title={exam.title}
        back={
          fromOverview
            ? { label: "Back to Overview", href: "/instructor" }
            : { label: "Back to Exams", href: "/instructor/exams" }
        }
      />
      <p role="status" data-message className="type-body text-center not-empty:py-1">
        {message}
      </p>

      <Card className="flex flex-col gap-4">
        <dl className="type-small flex flex-col gap-1">
          <div className="flex justify-between gap-3">
            <dt className="text-text-secondary">{active ? "Due" : "Closed"}</dt>
            <dd data-due>{shortDate(exam.deadline)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-text-secondary">Topics</dt>
            <dd data-topics className="truncate text-right">
              {topicsLine(exam.topicIds, titleOf)}
            </dd>
          </div>
        </dl>
        <p data-rules className="type-small text-text-secondary">
          {rulesLine(exam)}
        </p>
        <div className="grid grid-cols-3 gap-2">
          <CountTile kind="certified" label="Certified" count={counts.certified} icon={Award} />
          <CountTile
            kind="not-passed"
            label="Not passed"
            count={counts.notPassed}
            icon={RotateCcw}
          />
          <CountTile
            kind="not-started"
            label="Not started"
            count={counts.notStarted}
            icon={CircleDashed}
          />
        </div>
      </Card>

      <section aria-labelledby="students-title" className="flex flex-col gap-3">
        <h2 id="students-title" className="type-label text-text-secondary">
          STUDENTS
        </h2>
        <ul className="flex flex-col gap-2">
          {rows.map(({ participant, status }) => {
            const look = statusLook[status.kind];
            return (
              <li key={participant.id} data-student-row={participant.id} data-status={status.kind}>
                <StudentListRow
                  id={participant.id}
                  href={`/instructor/students/${encodeURIComponent(participant.id)}?from=exam&exam=${exam.id}`}
                  name={participant.name}
                  initials={participant.initials}
                  second={
                    <ExamLine
                      tone={look.tone}
                      icon={look.icon}
                      text={`${participant.local ? "Your demo account · " : ""}${statusText(status)}`}
                    />
                  }
                />
              </li>
            );
          })}
        </ul>
      </section>

      {active && (
        <div className="flex flex-col gap-3">
          {counts.notStarted > 0 && (
            <Button variant="secondary" onClick={onRemind}>
              Remind students who have not started
            </Button>
          )}
          <Button variant="secondary" onClick={onAskClose}>
            Close exam now
          </Button>
        </div>
      )}

      <p data-demo-note className="type-small text-center text-text-secondary">
        {DEMO_NOTE}
      </p>

      {(confirmingClose || !dialogInline) && (
        <ConfirmDialog
          open={confirmingClose}
          inline={dialogInline}
          title="Close this exam now?"
          description="Students will no longer be able to start it."
          confirmLabel="Close exam"
          cancelLabel="Keep open"
          onConfirm={onClose}
          onCancel={onCancelClose}
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
