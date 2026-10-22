import { Check, Circle, Flag, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Chevron } from "@/components/Chevron/Chevron";
import { statusLabels } from "@/lib/students";
import type { StudentStatus } from "@/lib/students";

/**
 * The status of a student as a chip: icon plus words on ONE line, never wrapping or truncated
 * (DESIGN.md: Instructor, Students rebuilt). Ready is the success tone, Needs attention the
 * attention tone (amber, never red), Almost ready and Not started neutral.
 */
export const statusChipLook: Record<StudentStatus, { icon: LucideIcon; tone: string }> = {
  ready: { icon: Check, tone: "bg-status-success-bg text-status-success-ink" },
  almost: { icon: TrendingUp, tone: "bg-secondary-sand text-text" },
  needs: { icon: Flag, tone: "bg-status-attention-bg text-status-attention-ink" },
  "not-started": { icon: Circle, tone: "bg-secondary-sand text-text-secondary" },
};

export function StudentStatusChip({ status }: { status: StudentStatus }) {
  const { icon: Icon, tone } = statusChipLook[status];
  return (
    <span
      data-status-chip={status}
      className={`type-caption inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 whitespace-nowrap ${tone}`}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden="true" />
      {statusLabels[status]}
    </span>
  );
}

/** The 48px initials avatar of a row (no status dot: the chip under the name carries the status). */
export function InitialsAvatar({ initials, size = 48 }: { initials: string; size?: 48 | 64 }) {
  return (
    <span
      aria-hidden="true"
      data-initials-avatar
      className={`type-body-strong flex shrink-0 items-center justify-center rounded-full bg-olive-tint text-primary ${
        size === 48 ? "h-12 w-12" : "h-16 w-16 text-[length:var(--text-xl)]"
      }`}
    >
      {initials}
    </span>
  );
}

/** The one white card of student rows, separated by hairlines. */
export function StudentRowsCard({ children }: { children: ReactNode }) {
  return (
    <ul
      data-student-rows
      className="divide-y divide-soft-divider overflow-hidden rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)"
    >
      {children}
    </ul>
  );
}

/**
 * The one student row (Students list and the topic students list): a fixed 72px, the 48px initials
 * avatar, the name in bold on one line and under it the status chip with the muted text after it,
 * and only the chevron at the right. The muted text is dropped first when the middle is narrow
 * (a container query), then "Your demo account"; the chip never wraps. The whole row is the link.
 */
export function StudentRow({
  id,
  href,
  name,
  initials,
  status,
  muted,
  demo = false,
  longMuted = false,
}: {
  id: string;
  href: string;
  name: string;
  initials: string;
  status: StudentStatus;
  /** The muted text after the chip ("· 5 to review"), or null. */
  muted: string | null;
  /** The local demo account: "Your demo account" follows when there is room. */
  demo?: boolean;
  /** A longer muted text (the topic list's "· S3: 2 of 5 correct") needs more room before it is dropped. */
  longMuted?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        data-student={id}
        className="flex h-[72px] items-center gap-3 px-[var(--gutter,1rem)] has-focus-visible:outline-2"
      >
        <InitialsAvatar initials={initials} />
        <span className="@container flex min-w-0 flex-1 flex-col justify-center gap-1">
          <span className="type-body-strong truncate leading-tight">{name}</span>
          <span data-student-line className="type-small flex items-center gap-1.5 overflow-hidden">
            <StudentStatusChip status={status} />
            {muted && (
              <span
                data-muted
                className={`hidden whitespace-nowrap text-text-secondary ${
                  longMuted ? "@min-[256px]:inline" : "@min-[216px]:inline"
                }`}
              >
                {muted}
              </span>
            )}
            {demo && (
              <span
                data-demo-account
                className="hidden whitespace-nowrap text-text-secondary @min-[330px]:inline"
              >
                · Your demo account
              </span>
            )}
          </span>
        </span>
        <Chevron />
      </Link>
    </li>
  );
}
