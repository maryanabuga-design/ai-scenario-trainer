import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { closedLine, duePillText, resultsLine } from "@/lib/exam-detail";
import type { GroupExam } from "@/lib/group-exams";

/**
 * The exam card (DESIGN.md: One assign icon, a round group chip and the same exam card on the
 * Overview): 88px, a 48px icon tile (the Exams navigation icon, no 3D picture), a one-line title,
 * ONE neutral date pill ("Due 4 Nov" or "Closed 12 Oct", always neutral) and ONE result line
 * "Passed 4 of 15", then the chevron. The whole card opens the detail. `bare` is the same card
 * inside the Overview's EXAMS card, without a card fill, border or shadow of its own.
 */
export function ExamCard({
  exam,
  passed,
  total,
  from,
  bare = false,
  closed = false,
}: {
  exam: GroupExam;
  passed: number;
  total: number;
  /** Where the card is shown, so the detail's Back returns there (the Overview). */
  from?: "overview";
  /** Inside another card (the Overview's EXAMS card): no card fill, border or shadow of its own. */
  bare?: boolean;
  closed?: boolean;
}) {
  const counts = { passed, total, notStarted: 0 };
  return (
    <Link
      href={`/instructor/exams/${exam.id}${from ? `?from=${from}` : ""}`}
      data-exam-card={exam.id}
      className={`flex h-[88px] items-center gap-3 px-3 has-focus-visible:outline-2 ${bare ? "" : "rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)"}`}
    >
      <span
        aria-hidden="true"
        data-exam-tile
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-chip-neutral-bg text-primary"
      >
        <ClipboardList size={24} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="type-body-strong w-full truncate">{exam.title}</span>
        <span
          data-date-pill
          className="type-caption max-w-full truncate rounded-full bg-chip-neutral-bg px-2.5 py-0.5 text-chip-neutral-ink"
        >
          {closed ? closedLine(exam) : duePillText(exam)}
        </span>
        <span className="type-small w-full truncate text-text">
          {resultsLine({ ...counts, notPassed: 0, inProgress: 0, missed: 0 }, false)}
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
