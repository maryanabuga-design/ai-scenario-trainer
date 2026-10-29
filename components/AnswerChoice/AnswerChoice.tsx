"use client";

import { SelectableRow } from "@/components/SelectableRow/SelectableRow";

/**
 * One answer of a question in an edit screen (DESIGN.md: One single-choice pattern): the shared
 * selectable row (the same card as the Guide section list) with the letter as plain text and the
 * answer as a borderless, background-less text field inside the card. Tapping the radio or the card
 * selects the correct answer, tapping the text edits it; the card shows the focus ring.
 */
export function AnswerChoice({
  letter,
  value,
  checked,
  radioName = "correct",
  radioLabel,
  fieldLabel,
  fieldName,
  onValue,
  onChoose,
}: {
  letter: string;
  value: string;
  checked: boolean;
  radioName?: string;
  radioLabel: string;
  fieldLabel: string;
  fieldName: string;
  onValue: (value: string) => void;
  onChoose: () => void;
}) {
  return (
    <SelectableRow
      name={radioName}
      value={letter}
      checked={checked}
      onChange={onChoose}
      compact
      emphasis
      ariaLabel={radioLabel}
      data={{ correct: letter, "answer-card": "" }}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span aria-hidden="true" className="type-body shrink-0 text-text">
          {letter.toUpperCase()}.
        </span>
        <input
          aria-label={fieldLabel}
          name={fieldName}
          value={value}
          onChange={(event) => onValue(event.target.value)}
          className="type-body h-11 min-w-0 flex-1 cursor-text border-0 bg-transparent p-0 text-text outline-none"
        />
      </span>
    </SelectableRow>
  );
}
