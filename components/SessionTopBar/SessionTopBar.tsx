"use client";

import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog/ConfirmDialog";
import { StepStrip } from "@/components/StepStrip/StepStrip";
import type { StripState } from "@/components/StepStrip/StepStrip";

export type Unit = "Step" | "Question" | "Item";

/**
 * The top of a session screen: Exit on the left, "Question 3 of 10" on the right and the step
 * strip under them. Exit asks first; leaving keeps the saved answers.
 */
export function SessionTopBar({
  index,
  total,
  unit = "Step",
  states,
  onJump,
  onLeave,
}: {
  index: number;
  total: number;
  unit?: Unit;
  states: StripState[];
  onJump: (position: number) => void;
  onLeave: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <div className="-ml-3">
          <Button variant="tertiary" onClick={() => setConfirming(true)}>
            Exit
          </Button>
        </div>
        <span className="type-small text-text-secondary tabular-nums">
          {unit} {index + 1} of {total}
        </span>
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
