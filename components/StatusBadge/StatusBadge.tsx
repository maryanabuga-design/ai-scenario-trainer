import { Check, CircleHelp, Clock, Contrast, Minus, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ErrorType } from "@/lib/scoring";

export type Status =
  ErrorType | "correct" | "wrong" | "partial" | "ready" | "processing" | "failed";

const icons = {
  check: Check,
  cross: X,
  minus: Minus,
  clock: Clock,
  half: Contrast,
  question: CircleHelp,
} satisfies Record<string, LucideIcon>;

export const statuses: Record<
  Status,
  { label: string; description?: string; icon: keyof typeof icons; className: string }
> = {
  correct: { label: "Correct", icon: "check", className: "bg-correct-bg text-correct" },
  wrong: { label: "Incorrect", icon: "cross", className: "bg-wrong-bg text-wrong" },
  partial: {
    label: "Partly correct",
    icon: "half",
    className: "border border-border bg-surface-muted text-text-secondary",
  },
  ready: { label: "Ready", icon: "check", className: "bg-correct-bg text-correct" },
  processing: {
    label: "Processing",
    icon: "clock",
    className: "border border-border bg-surface-muted text-text-secondary",
  },
  failed: { label: "Failed", icon: "cross", className: "bg-wrong-bg text-wrong" },
  secure: {
    label: "Secure",
    description: "Right answer, high confidence",
    icon: "check",
    className: "bg-correct-bg text-correct",
  },
  guess: {
    label: "Guess",
    description: "Right answer, but not sure",
    icon: "question",
    className: "border border-border bg-surface-muted text-text-secondary",
  },
  knowledge_gap: {
    label: "Knowledge gap",
    description: "Wrong answer, not sure",
    icon: "minus",
    className: "bg-caution-bg text-caution",
  },
  misconception: {
    label: "Misconception",
    description: "Wrong answer, high confidence",
    icon: "cross",
    className: "bg-wrong-bg text-wrong",
  },
};

export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const Icon = icons[statuses[status].icon];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}

/** Icon + label + colour. Never colour alone. */
export function StatusBadge({ status }: { status: Status }) {
  const { label, className } = statuses[status];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <StatusIcon status={status} />
      {label}
    </span>
  );
}
