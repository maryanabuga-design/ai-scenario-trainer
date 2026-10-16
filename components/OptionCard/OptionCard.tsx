import { Check, X } from "lucide-react";
import type { ReactNode } from "react";
import type { OptionState } from "@/lib/option-state";

/** What the person reads on a checked option, next to its icon (meaning is never colour alone). */
export const resultLabels: Partial<Record<OptionState, string>> = {
  correct: "Correct",
  wrong: "Not quite",
  "revealed-correct": "Correct answer",
};

/** The look of each state: always a 2px border, so nothing moves when the state changes. */
export const looks: Record<OptionState, string> = {
  idle: "border-selectable-stroke bg-card",
  selected: "border-primary bg-card",
  correct: "border-correct bg-correct-bg",
  "revealed-correct": "border-correct bg-correct-bg",
  wrong: "border-wrong bg-wrong-bg",
};

/** The control on the left: an empty radio, a filled radio, or a check or cross in a circle. */
export function Indicator({ state }: { state: OptionState }) {
  if (state === "correct" || state === "revealed-correct") {
    return (
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-correct text-primary-text"
      >
        <Check size={16} strokeWidth={3} />
      </span>
    );
  }
  if (state === "wrong") {
    return (
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-wrong text-primary-text"
      >
        <X size={16} strokeWidth={3} />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-primary ${
        state === "selected" ? "bg-primary" : ""
      }`}
    >
      {state === "selected" && <span className="h-2 w-2 rounded-full bg-primary-text" />}
    </span>
  );
}

/**
 * One answer option (DESIGN.md: Option card): a white card with a 2px border, the radio on the
 * left and the text. The whole card is the label of a native radio, so a tap anywhere chooses it
 * and the arrow keys move the choice. After Check the radio is locked and the card shows the
 * result with an icon and a label.
 */
export function OptionCard({
  name,
  value,
  state,
  locked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  state: OptionState;
  /** After Check in a training mode: the answer cannot change any more. */
  locked: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const chosen = state === "selected" || state === "correct" || state === "wrong";
  const label = resultLabels[state];
  const labelTone = state === "wrong" ? "text-wrong-text" : "text-correct-text";
  return (
    <label
      data-state={state}
      className={`flex min-h-11 items-center gap-3 rounded-card border-2 p-[var(--gutter,1rem)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${looks[state]} ${
        locked ? "cursor-default" : "cursor-pointer active:bg-secondary-sand"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={chosen}
        disabled={locked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <Indicator state={state} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span>{children}</span>
        {label && <span className={`type-caption font-semibold ${labelTone}`}>{label}</span>}
      </span>
    </label>
  );
}

/** An option in the Answer review and in Saved: the same look as a checked option, not interactive. */
export function OptionResult({ state, children }: { state: OptionState; children: ReactNode }) {
  const label = resultLabels[state];
  const labelTone = state === "wrong" ? "text-wrong-text" : "text-correct-text";
  return (
    <li
      data-state={state}
      className={`flex min-h-11 items-center gap-3 rounded-card border-2 p-[var(--gutter,1rem)] ${looks[state]}`}
    >
      <Indicator state={state} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span>{children}</span>
        {label && <span className={`type-caption font-semibold ${labelTone}`}>{label}</span>}
      </span>
    </li>
  );
}
