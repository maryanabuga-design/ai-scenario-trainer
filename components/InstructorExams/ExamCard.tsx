import { ListChecks } from "lucide-react";
import Link from "next/link";
import { Chevron } from "@/components/Chevron/Chevron";
import { Chip } from "@/components/Chip/Chip";
import { IconTile } from "@/components/IconTile/IconTile";
import { Media3D } from "@/components/Media3D/Media3D";
import { closedLine, duePill, resultsLine } from "@/lib/exam-detail";
import { dueLine } from "@/lib/group-exams";
import type { GroupExam } from "@/lib/group-exams";
import { cardPictureFiles } from "@/lib/media-frames";

/**
 * The exam card (DESIGN.md: Instructor, Exams rebuilt). ACTIVE, 88px: the exam picture in its 56 by
 * 56 slot, a one-line title, the soft due pill ("Due in 2 days · 1 topic", amber within 3 days) and
 * "Passed 1 of 14 · 11 not started". CLOSED: the neutral checklist tile instead of the picture,
 * "Closed 12 Oct" and "Passed 12 of 14". With several groups the card adds the group name under
 * the title and is a fixed 104px. The whole card opens the detail. `bare` is the row inside the
 * Overview's EXAMS card: no card chrome and a plain due line.
 */
export function ExamCard({
  exam,
  passed,
  total,
  notStarted,
  from,
  bare = false,
  tag,
  now,
  closed = false,
  groupName,
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
  /** The moment the due pill is worked out at (the list). */
  now?: number;
  closed?: boolean;
  /** Several groups: the group name as a muted line under the title (the card is then 104px). */
  groupName?: string;
}) {
  const pill = !bare && !closed && now !== undefined ? duePill(exam, now) : null;
  const counts = { passed, total, notStarted: notStarted ?? 0 };
  return (
    <Link
      href={`/instructor/exams/${exam.id}${from ? `?from=${from}` : ""}`}
      data-exam-card={exam.id}
      className={`flex items-center gap-3 px-3 has-focus-visible:outline-2 ${
        groupName ? "h-[104px]" : "h-[88px]"
      } ${bare ? "" : "rounded-card border border-selectable-stroke bg-card shadow-(--card-shadow)"}`}
    >
      {closed ? (
        <IconTile className="h-14 w-14 rounded-[16px]">
          <ListChecks size={24} strokeWidth={2} />
        </IconTile>
      ) : (
        <Media3D variant="card" src={cardPictureFiles.examCard} />
      )}
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span className="type-body-strong w-full truncate">{exam.title}</span>
        {groupName && (
          <span data-group-name className="type-small w-full truncate text-text-secondary">
            {groupName}
          </span>
        )}
        {pill ? (
          <span
            data-due-pill={pill.tone}
            className={`type-caption max-w-full truncate rounded-full px-2.5 py-0.5 ${
              pill.tone === "amber"
                ? "bg-status-attention-bg text-status-attention-ink"
                : "bg-secondary-sand text-text-secondary"
            }`}
          >
            {pill.text}
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
          {resultsLine({ ...counts, notPassed: 0, inProgress: 0, missed: 0 }, !closed)}
        </span>
      </span>
      <Chevron />
    </Link>
  );
}
