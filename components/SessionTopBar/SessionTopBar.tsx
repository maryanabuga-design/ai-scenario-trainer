"use client";

import { useState } from "react";
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
  onJump,
  onBack,
  onLeave,
}: {
  index: number;
  total: number;
  unit?: Unit;
  states: StripState[];
  onJump: (position: number) => void;
  onBack: () => void;
  onLeave: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[40px_1fr_auto] items-center gap-2">
        <CircleBackButton
          size="small"
          label={index > 0 ? `Previous ${unit.toLowerCase()}` : "Leave this session"}
          onClick={index > 0 ? onBack : () => setConfirming(true)}
        />
        <span className="type-small text-center text-text-secondary tabular-nums">
          {unit} {index + 1} of {total}
        </span>
        <div className="-mr-3">
          <Button variant="tertiary" onClick={() => setConfirming(true)}>
            Exit
          </Button>
        </div>
      </div>
      <StepStrip unit={unit} states={states} onSelect={onJump} />
      <ConfirmDialog
        open={confirming}
        emphasis="cancel"
        title="Leave this session?"
        description="Your answers are saved. You can continue from Home."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={onLeave}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
