import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { shortDate } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { cardPictureFiles } from "@/lib/media-frames";

/**
 * The assigned exam card (DESIGN.md: Assigned exams move into Notifications), shown under "Exams to
 * take" on Notifications and "Assigned by your instructor" on the Exam screen: FIXED 88px, the exam
 * picture in its 56 by 56 slot, the title on one line, "Due 25 Oct · 20 questions · 20 minutes" on
 * one line and a chevron. The whole card opens the exam intro, where the Primary "Start exam" lives.
 */
export function AssignedExamCard({ exam }: { exam: GroupExam }) {
  return (
    <Link
      href={`/exam?id=${encodeURIComponent(exam.id)}`}
      data-assigned-exam={exam.id}
      aria-label={`Assigned exam: ${exam.title}`}
      className="flex h-[88px] items-center gap-3 rounded-card bg-card px-3 shadow-(--card-shadow) has-focus-visible:outline-2"
    >
      <Media3D variant="card" src={cardPictureFiles.examCard} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-body-strong truncate">{exam.title}</span>
        <span
          data-assigned-line
          className="type-small line-clamp-2 leading-snug text-text-secondary"
        >
          Due {shortDate(exam.deadline)} · {exam.questionCount} questions · {exam.timeLimit} minutes
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
