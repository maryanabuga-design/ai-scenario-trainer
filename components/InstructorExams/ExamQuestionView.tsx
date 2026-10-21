import { PageHeaderBand } from "@/components/PageHeaderBand/PageHeaderBand";
import { ReviewQuestion } from "@/components/ReviewQuestion/ReviewQuestion";
import { wrongLine } from "@/lib/exam-detail";
import type { HardQuestion } from "@/lib/exam-detail";
import type { Item } from "@/lib/items";

/**
 * One question of an exam, read-only (DESIGN.md: Instructor, Exams rebuilt): Back, the shared
 * question card with the right option marked, "Why" and the guide chip. No editing.
 */
export function ExamQuestionView({
  item,
  number,
  stats,
  examId,
}: {
  item: Item;
  number: number;
  /** How many answered it wrong (counts), when the exam has results for it. */
  stats: Pick<HardQuestion, "wrong" | "answered"> | null;
  examId: string;
}) {
  return (
    <div className="flex flex-col gap-6 pb-4">
      <PageHeaderBand
        title={`Question ${number}`}
        subtitle={stats && stats.answered > 0 ? wrongLine(stats) : undefined}
        back={{ label: "Back to exam", href: `/instructor/exams/${examId}` }}
      />
      <ReviewQuestion
        item={item}
        choice={null}
        saved={false}
        onToggleSaved={() => undefined}
        readOnly
      />
    </div>
  );
}
