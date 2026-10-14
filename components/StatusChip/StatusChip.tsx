import { Check, CircleAlert, CircleHelp, Clock, Contrast, Minus, UserCheck, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Chip } from "@/components/Chip/Chip";
import type { ChipInk, ChipTone } from "@/components/Chip/Chip";
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
  { label: string; description?: string; icon: keyof typeof icons; tone: ChipTone; ink?: ChipInk }
> = {
  correct: { label: "Correct", icon: "check", tone: "green", ink: "green" },
  wrong: { label: "Incorrect", icon: "cross", tone: "rose", ink: "red" },
  partial: { label: "Partly correct", icon: "half", tone: "sand", ink: "grey" },
  marked: { label: "Marked correct by you", icon: "user", tone: "sand", ink: "grey" },
  ready: { label: "Ready", icon: "check", tone: "green", ink: "green" },
  processing: { label: "Processing", icon: "clock", tone: "sand" },
  failed: { label: "Failed", icon: "alert", tone: "rose", ink: "red" },
  secure: { ...errorTypeText.secure, icon: "check", tone: "green", ink: "sage" },
  guess: { ...errorTypeText.guess, icon: "question", tone: "sand", ink: "taupe" },
  knowledge_gap: { ...errorTypeText.knowledge_gap, icon: "minus", tone: "yellow", ink: "amber" },
  misconception: { ...errorTypeText.misconception, icon: "cross", tone: "rose", ink: "pink" },
};

export function StatusIcon({ status, size = 14 }: { status: Status; size?: number }) {
  const Icon = icons[statuses[status].icon];
  return <Icon size={size} strokeWidth={2} aria-hidden="true" />;
}

/**
 * The one status chip (answer results, error types, material status), drawn by the shared Chip.
 * Icon + label + colour. Never colour alone.
 */
export function StatusChip({ status }: { status: Status }) {
  const { label, tone, ink } = statuses[status];
  return (
    <Chip tone={tone} ink={ink} size="caption">
      <StatusIcon status={status} />
      {label}
    </Chip>
  );
}
