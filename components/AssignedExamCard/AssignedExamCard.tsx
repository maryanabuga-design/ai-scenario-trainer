import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { Media3D } from "@/components/Media3D/Media3D";
import { shortDate } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { cardPictureFiles } from "@/lib/media-frames";

/**
 * The "Assigned exam" card on Student Home (DESIGN.md: Instructor, Student side): FIXED 88px, the
 * exam picture in its 56 by 56 slot, the title, "Due 25 Oct · 20 questions · 20 minutes" and a
 * chevron. The whole card opens the exam intro, where the Primary "Start exam" lives.
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
        <span className="type-small truncate text-text-secondary">
          Due {shortDate(exam.deadline)}
        </span>
        <span className="type-small truncate text-text-secondary">
          {exam.questionCount} questions · {exam.timeLimit} minutes
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
