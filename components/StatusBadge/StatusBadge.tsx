import type { ErrorType } from "@/lib/scoring";

export type Status =
  ErrorType | "correct" | "wrong" | "partial" | "ready" | "processing" | "failed";

const paths = {
  check: <path d="M5 12.5 10 17l9-10" />,
  cross: <path d="M7 7l10 10M17 7 7 17" />,
  minus: <path d="M6 12h12" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  half: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16" />
    </>
  ),
  question: (
    <>
      <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6" />
      <path d="M12 17.5h.01" />
    </>
  ),
};

export const statuses: Record<
  Status,
  { label: string; description?: string; icon: keyof typeof paths; className: string }
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
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[statuses[status].icon]}
    </svg>
  );
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
