import type { ReactNode } from "react";

/**
 * The one status chip (DESIGN.md: One status chip for the whole app): a pill 24px high with 10px side
 * padding, 13px semi-bold text and NO icon. The text is always the status word. Only three tones
 * exist: positive, attention and neutral; each screen maps its own statuses to them below.
 */
export type StatusTone = "positive" | "attention" | "neutral";

const tones: Record<StatusTone, string> = {
  positive: "bg-status-success-bg text-status-success-ink",
  attention: "bg-status-attention-bg text-status-attention-ink",
  neutral: "bg-chip-neutral-bg text-chip-neutral-ink",
};

/** Ready is positive, Needs attention attention, Almost ready and Not started neutral. */
export const studentTone = {
  ready: "positive",
  needs: "attention",
  almost: "neutral",
  "not-started": "neutral",
} as const satisfies Record<string, StatusTone>;

/** Passed is positive, Not passed and Missed attention, In progress and Not started neutral. */
export const examTone = {
  passed: "positive",
  "not-passed": "attention",
  missed: "attention",
  "in-progress": "neutral",
  "not-started": "neutral",
} as const satisfies Record<string, StatusTone>;

/** A material: Ready is positive, Failed attention, Processing neutral. */
export const materialTone = {
  ready: "positive",
  failed: "attention",
  processing: "neutral",
} as const satisfies Record<string, StatusTone>;

export const materialLabel = {
  ready: "Ready",
  processing: "Processing",
  failed: "Failed",
} as const;

export function StatusChip({
  tone,
  value,
  children,
}: {
  tone: StatusTone;
  /** The status key, for tests and the screen review (`data-status-chip`). */
  value: string;
  /** The status word. */
  children: ReactNode;
}) {
  return (
    <span
      data-status-chip={value}
      data-tone={tone}
      className={`type-chip inline-flex h-6 w-fit shrink-0 items-center rounded-full px-2.5 whitespace-nowrap ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
