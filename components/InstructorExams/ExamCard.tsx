import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { Media3D } from "@/components/Media3D/Media3D";
import { closedLine, duePillText, resultsLine } from "@/lib/exam-detail";
import { dueLine } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { cardPictureFiles } from "@/lib/media-frames";

/**
 * The exam card (DESIGN.md: Date pills are neutral and exam cards use an icon tile). 88px: a 48px
 * icon tile (the Exams navigation icon, no 3D picture), a one-line title, ONE neutral date pill
 * ("Due 4 Nov" or "Closed 12 Oct", always neutral) and ONE result line "Passed 4 of 15", then the
 * chevron. The whole card opens the detail. `bare` is the row inside the Overview's EXAMS card: no
 * card chrome, the exam picture, a plain due line and "· n not started" after the result.
 */
export function ExamCard({
  exam,
  passed,
  total,
  notStarted,
  from,
  bare = false,
  tag,
  closed = false,
}: {
  exam: GroupExam;
  passed: number;
  total: number;
  /** The students who have not started it: "Passed 1 of 14 · 11 not started". */
  notStarted?: number;
  /** Where the card is shown, so the detail's Back returns there (the Overview). */
  from?: "overview";
  /** Inside another card (the Overview's EXAMS card): no card fill, border or shadow of its own. */
  bare?: boolean;
  /** The group name of the exam (All groups on the Overview), a small tag before the due line. */
  tag?: string;
  closed?: boolean;
}) {
  const counts = { passed, total, notStarted: notStarted ?? 0 };
  return (
    <Link
      href={`/instructor/exams/${exam.id}${from ? `?from=${from}` : ""}`}
      data-exam-card={exam.id}
      className={`flex h-[88px] items-center gap-3 px-3 has-focus-visible:outline-2 ${bare ? "" : "rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)"}`}
    >
      {bare ? (
        <Media3D variant="card" src={cardPictureFiles.examCard} />
      ) : (
        <span
          aria-hidden="true"
          data-exam-tile
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-chip-neutral-bg text-primary"
        >
          <ClipboardList size={24} strokeWidth={2} />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="type-body-strong w-full truncate">{exam.title}</span>
        {!bare ? (
          <span
            data-date-pill
            className="type-caption max-w-full truncate rounded-full bg-chip-neutral-bg px-2.5 py-0.5 text-chip-neutral-ink"
          >
            {closed ? closedLine(exam) : duePillText(exam)}
          </span>
        ) : (
          <span className="type-small flex w-full items-center gap-1.5 truncate text-text-secondary">
            {tag && (
              <Chip tone="sand" size="caption" className="max-w-[45%] shrink truncate">
                {tag}
              </Chip>
            )}
            <span className="truncate">{closed ? closedLine(exam) : dueLine(exam)}</span>
          </span>
        )}
        <span className="type-small w-full truncate text-text">
          {resultsLine({ ...counts, notPassed: 0, inProgress: 0, missed: 0 }, bare && !closed)}
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
