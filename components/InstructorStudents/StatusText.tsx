import { Award, CircleDashed, RotateCcw } from "lucide-react";
import type { StudentStatus } from "@/lib/students";
import { statusLabels } from "@/lib/students";

const look: Record<StudentStatus, { icon: typeof Award; ink: string }> = {
  ready: { icon: Award, ink: "text-status-success-ink" },
  almost: { icon: CircleDashed, ink: "text-text-secondary" },
  needs: { icon: RotateCcw, ink: "text-status-attention-ink" },
};

/** A student's status as an icon plus text (never colour alone): Ready, Almost ready, Needs attention. */
export function StatusText({
  status,
  wrap = false,
}: {
  status: StudentStatus;
  /** Let the words wrap onto two lines (the list rows, where the name needs the room). */
  wrap?: boolean;
}) {
  const { icon: Icon, ink } = look[status];
  return (
    <span
      data-status-text={status}
      className={`type-small flex gap-1.5 ${wrap ? "items-start" : "items-center"} ${ink}`}
    >
      <Icon
        size={14}
        strokeWidth={2}
        aria-hidden="true"
        className={`shrink-0 ${wrap ? "mt-[3px]" : ""}`}
      />
      <span className={wrap ? "leading-tight" : "truncate"}>{statusLabels[status]}</span>
    </span>
  );
}
