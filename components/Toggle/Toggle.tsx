"use client";

import { useId } from "react";

/**
 * A switch: a label on the left, a 52 by 32px track on the right. On is the primary colour, off is
 * sand; disabled is faded and shows the hint under the label.
 */
export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** A line under the label, for example why the switch is disabled. */
  hint?: string;
}) {
  const hintId = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <span className="flex min-w-0 flex-col">
        <span className={`type-body ${disabled ? "text-text-secondary" : ""}`}>{label}</span>
        {hint && (
          <span id={hintId} className="type-small text-text-secondary">
            {hint}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={hint ? hintId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-[52px] shrink-0 rounded-full border disabled:cursor-not-allowed ${
          checked ? "border-primary bg-primary" : "border-border-strong bg-secondary-sand-pressed"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface shadow-(--card-shadow) ${
            checked ? "left-[calc(100%-1.75rem)]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}
