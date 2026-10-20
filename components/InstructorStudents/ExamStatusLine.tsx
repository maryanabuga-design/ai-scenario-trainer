import { CircleCheck, CircleDashed, RotateCcw } from "lucide-react";
import type { ExamStatus } from "@/lib/cohort";

const look = {
  certified: { icon: CircleCheck, ink: "text-status-success-ink" },
  "not-passed": { icon: RotateCcw, ink: "text-status-attention-ink" },
  "not-started": { icon: CircleDashed, ink: "text-text-secondary" },
} as const;

/** An exam status as an icon plus text (shared by the Exam detail and the Student detail). */
export function ExamStatusLine({ status, text }: { status: ExamStatus; text: string }) {
  const { icon: Icon, ink } = look[status.kind];
  return (
    <span className={`type-small flex items-center gap-1.5 ${ink}`}>
      <Icon size={14} strokeWidth={2} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{text}</span>
    </span>
  );
}
