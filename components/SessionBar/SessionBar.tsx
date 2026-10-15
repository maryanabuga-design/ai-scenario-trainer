"use client";

import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button } from "@/components/Button/Button";
import { CircleBackButton } from "@/components/CircleBackButton/CircleBackButton";

/**
 * The bottom bar of a session screen: the white circular Back button on the left (hidden on the
 * first item) and the primary Next or Finish filling the rest. An optional hint sits above them.
 */
export function SessionBar({
  backLabel,
  onBack,
  last,
  disabled,
  hint,
  onNext,
}: {
  /** Null on the first item: there is nothing to go back to. */
  backLabel: string | null;
  onBack: () => void;
  last: boolean;
  disabled: boolean;
  hint?: string | null;
  onNext: () => void;
}) {
  return (
    <ActionBar>
      {hint && <p className="type-small text-center text-text-secondary">{hint}</p>}
      <div className="flex items-center gap-3">
        {backLabel && <CircleBackButton large label={backLabel} onClick={onBack} />}
        <Button disabled={disabled} onClick={onNext}>
          {last ? "Finish" : "Next"}
        </Button>
      </div>
    </ActionBar>
  );
}
