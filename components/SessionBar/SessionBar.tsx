"use client";

import { Lightbulb } from "lucide-react";
import { ActionBar } from "@/components/ActionBar/ActionBar";
import { Button, SquareButton } from "@/components/Button/Button";

/**
 * The bottom of a session screen: the primary Next (Finish on the last), filling the row, with the
 * square hint button on its left when the question has a hint. A note sits above them. There is no
 * Back button here; Back is in the top row.
 */
export function SessionBar({
  last,
  disabled,
  note,
  hint,
  onNext,
}: {
  last: boolean;
  disabled: boolean;
  /** A line above the buttons, for example which question still needs an answer. */
  note?: string | null;
  /** The hint button: absent when the question has no hint. */
  hint?: { open: boolean; onToggle: () => void };
  onNext: () => void;
}) {
  return (
    <ActionBar>
      {note && <p className="type-small text-center text-text-secondary">{note}</p>}
      <div className="flex items-center gap-3">
        {hint && (
          <SquareButton
            icon={Lightbulb}
            label="Hint"
            expanded={hint.open}
            onClick={hint.onToggle}
          />
        )}
        <div className="min-w-0 flex-1">
          <Button disabled={disabled} onClick={onNext}>
            {last ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </ActionBar>
  );
}
