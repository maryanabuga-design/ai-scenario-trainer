"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { StepStrip } from "@/components/StepStrip/StepStrip";
import type { StripState } from "@/components/StepStrip/StepStrip";

export type Unit = "Question" | "Step";

/**
 * The top of a session screen: the white circular Back, "Question 3 of 10" in the middle, Exit on
 * the right, and the step strip under them. Back goes to the previous question; on the first one it
 * asks the same question as Exit. Leaving keeps the saved answers.
 */
export function SessionTopBar({
  index,
  total,
  unit = "Question",
  states,
  subtitle,
  onJump,
  onBack,
  onLeave,
  trailing,
  leave = {
    title: "Leave this session?",
    description: "Your answers are saved. You can continue from Home.",
  },
}: {
  index: number;
  total: number;
  unit?: Unit;
  states: StripState[];
  /** Under the position: the section name of a Training part. */
  subtitle?: string;
  onJump: (position: number) => void;
  onBack: () => void;
  onLeave: () => void;
  /** Right-aligned under the top row: the exam timer. */
  trailing?: ReactNode;
  /** The texts of the confirmation that Exit and Back on the first question open. */
  leave?: { title: string; description: string };
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[40px_1fr_auto] items-center gap-2">
        <CircleBackButton
          size="small"
          label={index > 0 ? `Previous ${unit.toLowerCase()}` : leave.title.replace("?", "")}
          onClick={index > 0 ? onBack : () => setConfirming(true)}
        />
        <span className="flex min-w-0 flex-col items-center text-center">
          <span className="type-small text-text-secondary tabular-nums">
            {unit} {index + 1} of {total}
          </span>
          {subtitle && (
            <span className="type-caption max-w-full truncate text-text-secondary">{subtitle}</span>
          )}
        </span>
        <div className="-mr-3">
          <Button variant="tertiary" onClick={() => setConfirming(true)}>
            Exit
          </Button>
        </div>
      </div>
      {trailing && <div className="flex justify-end">{trailing}</div>}
      <StepStrip unit={unit} states={states} onSelect={onJump} />
      <ConfirmDialog
        open={confirming}
        emphasis="cancel"
        title={leave.title}
        description={leave.description}
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={onLeave}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
