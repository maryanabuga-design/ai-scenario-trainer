import { Check } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** A radio for a single choice, a check box for several. */
  type?: "radio" | "checkbox";
  /** Exactly 72px high, for the cards with an icon tile (Create account: the role cards). */
  tall?: boolean;
  /** A letter badge before the content (A, B, C), for answer options. */
  letter?: string;
  children: ReactNode;
};

/**
 * The one selectable row (DESIGN.md: SelectableRow). Selecting changes only the indicator: the
 * selected and the unselected row have the same fill, border and text, so the classes below do not
 * depend on `checked`. The padding is the page gutter on all four sides, and the whole row is the
 * label of the native input, so a tap anywhere toggles it.
 */
export function SelectableRow({
  name,
  value,
  checked,
  onChange,
  disabled = false,
  type = "radio",
  tall = false,
  letter,
  children,
}: Props) {
  const state = disabled
    ? "cursor-not-allowed border border-secondary-sand-pressed bg-secondary-sand text-text-secondary"
    : "cursor-pointer border border-selectable-stroke bg-card active:bg-secondary-sand";
  return (
    <label
      className={`flex ${tall ? "h-[72px] px-[var(--gutter,1rem)]" : "min-h-11 p-[var(--gutter,1rem)]"} items-center gap-3 rounded-card has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${state}`}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      {letter && (
        <span
          aria-hidden="true"
          className="type-caption flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-olive-tint text-text"
        >
          {letter}
        </span>
      )}
      <span className="flex min-w-0 flex-1 items-center gap-3">{children}</span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
          type === "checkbox" ? "rounded-[4px]" : "rounded-full"
        } ${disabled ? "border-dashed border-text-secondary" : "border-primary"} ${
          checked && type === "checkbox" ? "bg-primary" : ""
        }`}
      >
        {checked &&
          (type === "checkbox" ? (
            <Check size={14} strokeWidth={2.5} className="text-primary-text" />
          ) : (
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          ))}
      </span>
    </label>
  );
}
