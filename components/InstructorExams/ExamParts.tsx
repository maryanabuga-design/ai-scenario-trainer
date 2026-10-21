import { Check, Circle, Clock, Minus, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ExamStatus } from "@/lib/cohort";

/**
 * The shared look of an exam status (DESIGN.md: Instructor, Exams rebuilt): an icon plus text in a
 * soft tone, never colour alone. Passed is the success tone, Not passed the attention tone (amber,
 * never red), In progress, Not started and Missed are neutral.
 */
export type StatusKind = ExamStatus["kind"];

export const statusLabel: Record<StatusKind, string> = {
  passed: "Passed",
  "not-passed": "Not passed",
  "in-progress": "In progress",
  "not-started": "Not started",
  missed: "Missed",
};

export const statusLook: Record<StatusKind, { icon: LucideIcon; tone: string }> = {
  passed: { icon: Check, tone: "bg-status-success-bg text-status-success-ink" },
  "not-passed": { icon: RotateCcw, tone: "bg-status-attention-bg text-status-attention-ink" },
  "in-progress": { icon: Clock, tone: "bg-secondary-sand text-text-secondary" },
  "not-started": { icon: Circle, tone: "bg-secondary-sand text-text-secondary" },
  missed: { icon: Minus, tone: "bg-secondary-sand text-text-secondary" },
};

/** The status pill: icon and words. */
export function StatusPill({ kind }: { kind: StatusKind }) {
  const { icon: Icon, tone } = statusLook[kind];
  return (
    <span
      data-status-pill={kind}
      className={`type-caption inline-flex w-fit shrink-0 items-center gap-1 rounded-full px-2 py-0.5 whitespace-nowrap ${tone}`}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden="true" />
      {statusLabel[kind]}
    </span>
  );
}

/** An initials avatar with the status badge in its bottom-right corner (check, retry arrow, dash, clock, empty circle). */
export function StatusAvatar({ initials, kind }: { initials: string; kind: StatusKind }) {
  const { icon: Icon, tone } = statusLook[kind];
  return (
    <span aria-hidden="true" className="relative flex h-11 w-11 shrink-0">
      <span className="type-body-strong flex h-11 w-11 items-center justify-center rounded-full bg-olive-tint text-primary">
        {initials}
      </span>
      <span
        data-avatar-badge={kind}
        className={`absolute -right-0.5 -bottom-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-card ${tone}`}
      >
        <Icon size={10} strokeWidth={3} />
      </span>
    </span>
  );
}
