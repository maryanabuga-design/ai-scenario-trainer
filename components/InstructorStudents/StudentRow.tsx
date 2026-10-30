import Link from "next/link";
import type { ReactNode } from "react";
import { Chevron } from "@/components/Chevron/Chevron";
import { StatusChip, studentTone } from "@/components/StatusChip/StatusChip";
import { StatusRow } from "@/components/StatusRow/StatusRow";
import { statusLabels } from "@/lib/students";
import type { StudentStatus } from "@/lib/students";

import { InitialsAvatar } from "@/components/InitialsAvatar/InitialsAvatar";

export { InitialsAvatar };

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
 * The one student row (Students list and the topic students list): at least 72px, the 48px initials
 * avatar (plain initials, no badge), the name in bold and under it the status chip with the muted
 * description after it (a wrapping row, DESIGN.md: One status chip for the whole app), and only the
 * chevron at the right. The whole row is the link.
 */
export function StudentRow({
  id,
  href,
  name,
  initials,
  status,
  muted,
  demo = false,
}: {
  id: string;
  href: string;
  name: string;
  initials: string;
  status: StudentStatus;
  /** The muted description after the chip ("5 to review"), or null. */
  muted: string | null;
  /** The local demo account: "Your demo account" is part of the description. */
  demo?: boolean;
}) {
  const description = [muted, demo ? "Your demo account" : null].filter(Boolean).join(" · ");
  return (
    <li>
      <Link
        href={href}
        data-student={id}
        className="flex min-h-[72px] items-center gap-3 px-[var(--gutter,1rem)] py-3 has-focus-visible:outline-2"
      >
        <InitialsAvatar initials={initials} />
        <StatusRow
          name={name}
          chip={
            <StatusChip tone={studentTone[status]} value={status}>
              {statusLabels[status]}
            </StatusChip>
          }
          description={description || null}
        />
        <Chevron />
      </Link>
    </li>
  );
}
