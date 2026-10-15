import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { SelectedProvider } from "@/components/SelectableCard/SelectedContext";

type Props = {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** A radio for a single choice, a check box for several. */
  type?: "radio" | "checkbox";
  /** "card" for a title and a description, "row" for compact lists (sections), "compactRow" for the Weak topics rows. */
  size?: "card" | "row" | "compactRow";
  /** A letter badge before the content (A, B, C), for answer options. */
  letter?: string;
  children: ReactNode;
};

const sizes = {
  card: "min-h-14 gap-3 rounded-card p-4",
  row: "min-h-12 gap-2.5 rounded-[20px] px-4 py-2",
  compactRow: "min-h-12 gap-2.5 rounded-[20px] px-4 py-1",
} as const;

/**
 * The one selectable card (DESIGN.md: SelectableCard): unselected card, selected sage tint with a
 * darker stroke, pressed stronger tint, and the radio or check box on the right.
 */
export function SelectableCard({
  name,
  value,
  checked,
  onChange,
  disabled = false,
  type = "radio",
  size = "card",
  letter,
  children,
}: Props) {
  const state = disabled
    ? "cursor-not-allowed border border-secondary-sand-pressed bg-secondary-sand text-text-secondary"
    : checked
      ? "cursor-pointer border-[1.5px] border-selected-stroke bg-selected-tint active:bg-selected-pressed"
      : "cursor-pointer border border-selectable-stroke bg-card active:bg-selected-pressed";
  return (
    <label
      className={`flex items-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${sizes[size]} ${state}`}
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
      <SelectedProvider value={checked && !disabled}>
        <span className="flex min-w-0 flex-1 items-center gap-3">{children}</span>
      </SelectedProvider>
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
