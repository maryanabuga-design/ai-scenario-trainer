"use client";

/**
 * One answer of a question in an edit screen (DESIGN.md: Instructor content flow polish): a card with
 * the letter, the text field and the radio INSIDE the card, on the right. A tap anywhere on the card
 * except the text field selects it as the correct answer. The selected card has a 1.5px olive border
 * and a filled radio.
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
    <label
      data-correct={letter}
      data-answer-card
      className={`flex min-h-[64px] cursor-pointer items-center gap-3 rounded-card border-[1.5px] bg-card p-3 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${checked ? "border-primary" : "border-selectable-stroke"}`}
    >
      <input
        type="radio"
        name={radioName}
        value={letter}
        checked={checked}
        onChange={onChoose}
        aria-label={radioLabel}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className="type-caption flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
      >
        {letter.toUpperCase()}
      </span>
      <input
        aria-label={fieldLabel}
        name={fieldName}
        value={value}
        onChange={(event) => onValue(event.target.value)}
        className="type-body h-[52px] min-w-0 flex-1 cursor-text rounded-[14px] border border-selectable-stroke bg-card px-3 text-text focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-primary"
      />
      <span
        aria-hidden="true"
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-primary"
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
      </span>
    </label>
  );
}
