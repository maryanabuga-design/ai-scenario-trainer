import { Award, CircleDashed, RotateCcw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Chevron } from "@/components/Chevron/Chevron";
import { rowParts, statusLabels } from "@/lib/students";
import type { StudentProfile, StudentStatus } from "@/lib/students";

const look: Record<StudentStatus, { icon: LucideIcon; ink: string }> = {
  ready: { icon: Award, ink: "text-status-success-ink" },
  almost: { icon: CircleDashed, ink: "text-text-secondary" },
  needs: { icon: RotateCcw, ink: "text-status-attention-ink" },
  "not-started": { icon: CircleDashed, ink: "text-text-secondary" },
};

/** The status as an icon plus its words in its tone (never colour alone), inside a running line. */
export function StatusWords({ status }: { status: StudentStatus }) {
  const { icon: Icon, ink } = look[status];
  return (
    <span data-status-text={status} className={ink}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" className="mr-1 -mt-0.5 inline" />
      {statusLabels[status]}
    </span>
  );
}

/**
 * The second line of a student row (DESIGN.md: Student row): "Needs attention · 4 to review",
 * "Ready · all topics on track", "Not started", "Your demo account · Not started". One line, never
 * wrapping (the long status words use the short "4 to review").
 */
export function StudentLine({ profile }: { profile: StudentProfile }) {
  const { status, tail } = rowParts(profile);
  return (
    <span data-student-line className="type-small block truncate text-text-secondary">
      {profile.participant.local && <>Your demo account · </>}
      <StatusWords status={status} />
      {tail && <> · {tail}</>}
    </span>
  );
}

/**
 * The one student row (Students, the Overview's Needs attention and the Exam detail): FIXED 72px, the
 * initials avatar, the name on one line, a second line and only a chevron on the right.
 */
export function StudentListRow({
  href,
  name,
  initials,
  second,
  id,
}: {
  href: string;
  name: string;
  initials: string;
  second: ReactNode;
  /** The participant id, for tests. */
  id: string;
}) {
  return (
    <Link
      href={href}
      data-student={id}
      className="flex h-[72px] items-center gap-3 rounded-card bg-card px-3 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <span
        aria-hidden="true"
        className="type-body-strong flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary"
      >
        {initials}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="type-body-strong truncate">{name}</span>
        {second}
      </span>
      <Chevron />
    </Link>
  );
}

/** The exam status of a student as the second line of the Exam detail row. */
export function ExamLine({
  tone,
  icon: Icon,
  text,
}: {
  tone: "success" | "attention" | "neutral";
  icon: LucideIcon;
  text: string;
}) {
  const ink =
    tone === "success"
      ? "text-status-success-ink"
      : tone === "attention"
        ? "text-status-attention-ink"
        : "text-text-secondary";
  return (
    <span className={`type-small block truncate ${ink}`}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" className="mr-1 -mt-0.5 inline" />
      {text}
    </span>
  );
}
