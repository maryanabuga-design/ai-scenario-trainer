import { Check, CircleAlert, CircleHelp, Clock, Contrast, Minus, UserCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { errorTypeText } from "@/lib/scoring";
import type { ErrorType } from "@/lib/scoring";

export type Status =
  ErrorType | "correct" | "wrong" | "partial" | "ready" | "processing" | "failed" | "marked";

const icons = {
  check: Check,
  cross: X,
  minus: Minus,
  clock: Clock,
  half: Contrast,
  question: CircleHelp,
  user: UserCheck,
  alert: CircleAlert,
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
    className: "bg-surface-muted text-text-secondary",
  },
  marked: {
    label: "Marked correct by you",
    icon: "user",
    className: "bg-surface-muted text-text-secondary",
  },
  ready: { label: "Ready", icon: "check", className: "bg-correct-bg text-correct" },
  processing: {
    label: "Processing",
    icon: "clock",
    className: "border border-secondary-sand-pressed bg-secondary-sand text-text",
  },
  failed: { label: "Failed", icon: "alert", className: "bg-wrong-bg text-wrong" },
  secure: {
    ...errorTypeText.secure,
    icon: "check",
    className: "bg-secure-bg text-secure",
  },
  guess: {
    ...errorTypeText.guess,
    icon: "question",
    className: "bg-surface-muted text-text-secondary",
  },
  knowledge_gap: {
    ...errorTypeText.knowledge_gap,
    icon: "minus",
    className: "bg-caution-bg text-caution",
  },
  misconception: {
    ...errorTypeText.misconception,
    icon: "cross",
    className: "bg-misconception-bg text-misconception",
  },
};

export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const Icon = icons[statuses[status].icon];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}

const statusText: Partial<Record<Status, string>> = {
  correct: "text-correct",
  wrong: "text-wrong",
};

/**
 * The one status chip (answer results, error types, material status). Icon + label + colour.
 * Never colour alone. onTint: a white chip, for the tinted Correct and
 * Incorrect rows on results, so the chip stands out from the row.
 */
export function StatusChip({ status, onTint = false }: { status: Status; onTint?: boolean }) {
  const { label, className } = statuses[status];
  const style = onTint ? `bg-surface ${statusText[status] ?? "text-text"}` : className;
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 type-caption whitespace-nowrap ${style}`}
    >
      <StatusIcon status={status} />
      {label}
    </span>
  );
}
