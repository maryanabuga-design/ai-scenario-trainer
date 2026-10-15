"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";

/**
 * The bottom of a session screen: only the primary, full-width Next (Finish on the last question).
 * An optional hint sits above it. There is no Back button here; Back is in the top row.
 */
export function SessionBar({
  last,
  disabled,
  hint,
  onNext,
}: {
  last: boolean;
  disabled: boolean;
  hint?: string | null;
  onNext: () => void;
}) {
  return (
    <ActionBar>
      {hint && <p className="type-small text-center text-text-secondary">{hint}</p>}
      <Button disabled={disabled} onClick={onNext}>
        {last ? "Finish" : "Next"}
      </Button>
    </ActionBar>
  );
}
