import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { dueLine } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { cardPictureFiles } from "@/lib/media-frames";

/**
 * The exam card of the Exams list (DESIGN.md: Instructor, Exams): FIXED 88px, the exam picture in its
 * 56 by 56 slot, the title on one line, "Due 25 Oct · 6 topics" and "Passed 12 of 18" in muted text and
 * a chevron (the whole card opens the detail).
 */
export function ExamCard({
  exam,
  passed,
  total,
  notStarted,
  from,
}: {
  exam: GroupExam;
  passed: number;
  total: number;
  /** The students who have not started it: "Passed 1 of 15 · 11 not started". */
  notStarted?: number;
  /** Where the card is shown, so the detail's Back returns there (the Overview). */
  from?: "overview";
}) {
  return (
    <Link
      href={`/instructor/exams/${exam.id}${from ? `?from=${from}` : ""}`}
      data-exam-card={exam.id}
      className="flex h-[88px] items-center gap-3 rounded-card bg-card px-3 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <Media3D variant="card" src={cardPictureFiles.examCard} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-body-strong truncate">{exam.title}</span>
        <span className="type-small truncate text-text-secondary">{dueLine(exam)}</span>
        <span className="type-small truncate text-text-secondary">
          Passed {passed} of {total}
          {notStarted !== undefined && ` · ${notStarted} not started`}
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
