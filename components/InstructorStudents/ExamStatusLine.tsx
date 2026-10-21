import type { ExamStatus } from "@/lib/cohort";
import { statusLook } from "@/components/InstructorExams/ExamParts";

const ink: Record<ExamStatus["kind"], string> = {
  passed: "text-status-success-ink",
  "not-passed": "text-status-attention-ink",
  "in-progress": "text-text-secondary",
  "not-started": "text-text-secondary",
  missed: "text-text-secondary",
};

/** An exam status as an icon plus text (shared by the Exam detail and the Student detail). */
export function ExamStatusLine({ status, text }: { status: ExamStatus; text: string }) {
  const { icon: Icon } = statusLook[status.kind];
  return (
    <span className={`type-small flex items-center gap-1.5 ${ink[status.kind]}`}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
}
